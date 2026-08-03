# app/core/security.py
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import get_settings

settings = get_settings()

# Contexte de hashage bcrypt
# "deprecated='auto'" signifie que passlib utilisera
# automatiquement un algorithme plus fort quand bcrypt sera obsolète
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Transforme "mon_mdp" en hash irréversible.
    Même nous, on ne peut pas retrouver le mot de passe.
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Vérifie si le mot de passe correspond au hash.
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Crée un JWT signé contenant les informations utilisateur.
    
    Exemple d'appel :
        token = create_access_token({"sub": user.email, "user_id": str(user.id)})
    
    Le token résultant ressemble à :
        eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
        .eyJzdWIiOiJ1c2VyQGV4YW1wbGUuY29tIiwidXNlcl9pZCI6IjEyMyIsImV4cCI6MTcxOTAwMDAwMH0
        .abc123signature
    """
    to_encode = data.copy()
    
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access"})
    
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(data: dict) -> str:
    """Token longue durée pour renouveler l'access token sans relogin."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict:
    """
    Vérifie la signature et l'expiration du JWT.
    Retourne le contenu décodé ou lève une exception.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError as e:
        raise ValueError(f"Token invalide : {e}")