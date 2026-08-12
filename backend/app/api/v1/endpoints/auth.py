from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timezone
import uuid

from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.infrastructure.db.models.user import User
from app.core.rate_limit import limiter

router = APIRouter(prefix="/auth", tags=["Authentication"])
settings = get_settings()

# OAuth2 scheme : attend un header "Authorization: Bearer <token>"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


# ─── Schémas de requête/réponse ─────────────────

class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: Optional[str]
    role: str
    is_admin: bool = False

    class Config:
        from_attributes = True  # Permet de convertir depuis l'ORM


class CheckAdminResponse(BaseModel):
    is_admin: bool


# ─── Dépendance : obtenir l'utilisateur courant ──

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Extrait le JWT du header Authorization,
    le décode, et retrouve l'utilisateur en base.
    """
    try:
        payload = decode_token(token)
        user_email = payload.get("sub")
        if user_email is None:
            raise HTTPException(status_code=401, detail="Token invalide")
    except ValueError:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré")
    
    # Cherche l'utilisateur en base
    from sqlalchemy import select
    result = await db.execute(select(User).where(User.email == user_email))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Compte désactivé")
    
    return user


# ─── Endpoints ──────────────────────────────────

@router.post("/register", response_model=TokenResponse, status_code=201)
@limiter.limit("100/minute")
async def register(
    request: Request,
    body: UserRegisterRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Crée un nouveau compte utilisateur. Réservé à l'administrateur.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Réservé à l'administrateur",
        )

    from sqlalchemy import select
    
    # Vérifie si l'email existe déjà
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="Un compte avec cet email existe déjà",
        )
    
    # Crée l'utilisateur
    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        full_name=body.full_name,
    )
    db.add(user)
    await db.flush()  # Pour obtenir l'ID généré
    
    # Génère les tokens
    session_created_at = int(datetime.now(timezone.utc).timestamp())
    access_token = create_access_token({
        "sub": user.email,
        "user_id": str(user.id),
        "session_created_at": session_created_at,
    })
    refresh_token = create_refresh_token({
        "sub": user.email,
        "user_id": str(user.id),
        "session_created_at": session_created_at,
    })
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.get("/check-admin", response_model=CheckAdminResponse)
@limiter.limit("100/minute")
async def check_admin(request: Request, email: str, db: AsyncSession = Depends(get_db)):
    """
    Vérifie si un email correspond à un administrateur.
    """
    from sqlalchemy import select
    if not email:
        return {"is_admin": False}
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    return {"is_admin": bool(user and user.is_admin)}


@router.post("/login", response_model=TokenResponse)
@limiter.limit("100/minute")
async def login(request: Request, body: UserLoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Authentifie un utilisateur et retourne des tokens.
    """
    from sqlalchemy import select
    
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Email ou mot de passe incorrect",
        )
    
    session_created_at = int(datetime.now(timezone.utc).timestamp())
    access_token = create_access_token({
        "sub": user.email,
        "user_id": str(user.id),
        "session_created_at": session_created_at,
    })
    refresh_token = create_refresh_token({
        "sub": user.email,
        "user_id": str(user.id),
        "session_created_at": session_created_at,
    })
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("100/minute")
async def refresh_token(request: Request, body: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    """
    Renouvelle l'Access Token (30 min) à partir du Refresh Token si la session n'a pas dépassé 7 jours.
    """
    try:
        payload = decode_token(body.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Type de jeton invalide")
        
        user_email = payload.get("sub")
        session_created_at = payload.get("session_created_at") or payload.get("iat")
        
        # Vérification de la limite absolue des 7 jours
        if session_created_at:
            max_seconds = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600
            now_sec = int(datetime.now(timezone.utc).timestamp())
            if now_sec - session_created_at > max_seconds:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="SESSION_EXPIRED_ABSOLUTE",
                )
        
        if not user_email:
            raise HTTPException(status_code=401, detail="Jeton invalide")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Jeton de rafraîchissement invalide ou expiré")
    
    from sqlalchemy import select
    result = await db.execute(select(User).where(User.email == user_email))
    user = result.scalar_one_or_none()
    
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="Utilisateur introuvable ou désactivé")
    
    # Renouvellement avec préservation de la session_created_at originale
    access_token = create_access_token({
        "sub": user.email,
        "user_id": str(user.id),
        "session_created_at": session_created_at,
    })
    refresh_token_new = create_refresh_token({
        "sub": user.email,
        "user_id": str(user.id),
        "session_created_at": session_created_at,
    })
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token_new,
    )


@router.get("/ping")
@limiter.limit("300/minute")
async def ping(request: Request, current_user: User = Depends(get_current_user)):
    """
    Endpoint léger pour vérifier la validité de session et maintenir l'activité.
    """
    return {"status": "ok", "user": current_user.email}


@router.get("/me", response_model=UserResponse)
@limiter.limit("300/minute")
async def get_me(request: Request, current_user: User = Depends(get_current_user)):
    """
    Retourne les informations de l'utilisateur connecté.
    """
    return current_user