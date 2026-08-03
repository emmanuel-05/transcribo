from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr
from typing import Optional
import uuid

from app.core.database import get_db
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.infrastructure.db.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

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


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: Optional[str]
    role: str

    class Config:
        from_attributes = True  # Permet de convertir depuis l'ORM


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
async def register(request: UserRegisterRequest, db: AsyncSession = Depends(get_db)):
    """
    Crée un nouveau compte utilisateur.
    """
    from sqlalchemy import select
    
    # Vérifie si l'email existe déjà
    result = await db.execute(select(User).where(User.email == request.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="Un compte avec cet email existe déjà",
        )
    
    # Crée l'utilisateur
    user = User(
        email=request.email,
        hashed_password=hash_password(request.password),
        full_name=request.full_name,
    )
    db.add(user)
    await db.flush()  # Pour obtenir l'ID généré
    
    # Génère les tokens
    access_token = create_access_token({"sub": user.email, "user_id": str(user.id)})
    refresh_token = create_refresh_token({"sub": user.email, "user_id": str(user.id)})
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/login", response_model=TokenResponse)
async def login(request: UserLoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Authentifie un utilisateur et retourne des tokens.
    """
    from sqlalchemy import select
    
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Email ou mot de passe incorrect",
        )
    
    access_token = create_access_token({"sub": user.email, "user_id": str(user.id)})
    refresh_token = create_refresh_token({"sub": user.email, "user_id": str(user.id)})
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """
    Retourne les informations de l'utilisateur connecté.
    """
    return current_user