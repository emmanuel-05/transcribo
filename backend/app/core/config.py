# app/core/config.py
from pydantic_settings import BaseSettings
from functools import lru_cache
import os
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    # ─── Application ─────────────────────────
    APP_NAME: str = "Transcribo API"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    
    # ─── Base de données ─────────────────────
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    
    # ─── Redis ───────────────────────────────
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # ─── Sécurité ────────────────────────────
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # ─── Stockage S3 / MinIO ────────────────
    S3_ENDPOINT: str = os.getenv("S3_ENDPOINT", "http://localhost:9000")
    S3_ACCESS_KEY: str = os.getenv("S3_ACCESS_KEY", "minioadmin")
    S3_SECRET_KEY: str = os.getenv("S3_SECRET_KEY", "minioadmin")
    S3_BUCKET_RAW_AUDIO: str = os.getenv("S3_BUCKET_RAW_AUDIO", "raw-audio")
    S3_BUCKET_PROCESSED_AUDIO: str = os.getenv("S3_BUCKET_PROCESSED_AUDIO", "processed-audio")
    S3_BUCKET_DOCUMENTS: str = os.getenv("S3_BUCKET_DOCUMENTS", "documents")
    
    # ─── Service IA ──────────────────────────
    IA_SERVICE_URL: str = os.getenv("IA_SERVICE_URL", "http://localhost:8001")
    DEEPGRAM_API_KEY: str = os.getenv("DEEPGRAM_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    
    # ─── Google OAuth ────────────────────────
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()