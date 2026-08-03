# app/infrastructure/db/models/__init__.py
from app.infrastructure.db.models.user import User, UserRole
from app.infrastructure.db.models.project import Project
from app.infrastructure.db.models.audio_file import AudioFile, AudioStatus
from app.infrastructure.db.models.transcript import Transcript

# Ceci permet à Alembic de "voir" tous les modèles
__all__ = ["User", "UserRole", "Project", "AudioFile", "AudioStatus", "Transcript"]