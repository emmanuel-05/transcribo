# app/core/config.py
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # ─── Application ─────────────────────────
    APP_NAME: str = "Transcribo API"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    
    # ─── Base de données ─────────────────────
    DATABASE_URL: str
    # Exemple : postgresql+asyncpg://transcribo:transcribo123@localhost:5432/transcribo
    
    # ─── Redis ───────────────────────────────
    REDIS_URL: str = "redis://localhost:6379"
    
    # ─── Sécurité ────────────────────────────
    SECRET_KEY: str  # Clé secrète pour signer les JWT
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # ─── Stockage S3 / MinIO ────────────────
    S3_ENDPOINT: str = "http://localhost:9000"
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadmin"
    S3_BUCKET_RAW_AUDIO: str = "raw-audio"
    S3_BUCKET_PROCESSED_AUDIO: str = "processed-audio"
    S3_BUCKET_DOCUMENTS: str = "documents"
    
    # ─── Service IA ──────────────────────────
    IA_SERVICE_URL: str = "http://localhost:8001"
    
    # ─── Google OAuth ────────────────────────
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """
    Retourne une instance unique de Settings.
    Le décorateur @lru_cache garantit que le fichier .env
    n'est lu qu'une seule fois.
    """
    return Settings()