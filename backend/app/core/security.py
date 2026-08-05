from datetime import datetime, timedelta, timezone
from typing import Optional
import bcrypt  # Remplacement de passlib par bcrypt natif
from jose import JWTError, jwt
from app.core.config import get_settings

settings = get_settings()


def hash_password(password: str) -> str:
    """
    Transforme un mot de passe en texte brut en hash bcrypt irréversible.
    """
    # 1. Convertit la chaîne de caractères (str) en octets (bytes)
    pwd_bytes = password.encode('utf-8')
    
    # 2. Génère un sel unique (salt)
    salt = bcrypt.gensalt()
    
    # 3. Calcule le hash et le retransforme en chaîne de caractères (str) pour la base de données
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Vérifie si le mot de passe en clair correspond au hash enregistré.
    """
    try:
        # Conversion des deux chaînes en octets pour la comparaison de sécurité
        pwd_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        
        # bcrypt.checkpw extrait automatiquement le sel du hash pour faire la vérification
        return bcrypt.checkpw(pwd_bytes, hashed_bytes)
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Crée un JWT signé contenant les informations utilisateur.
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
