# app/infrastructure/db/models/audio_file.py
import uuid
from datetime import datetime
from sqlalchemy import String, Float, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import enum

from app.core.database import Base


class AudioStatus(str, enum.Enum):
    UPLOADED = "uploaded"
    CONVERTING = "converting"
    CONVERTED = "converted"
    TRANSCRIBING = "transcribing"
    TRANSCRIBED = "transcribed"
    ERROR = "error"


class AudioFile(Base):
    __tablename__ = "audio_files"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    original_filename: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )
    format: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
    )  # "wav", "mp3", "dss", "ds2"
    duration_secs: Mapped[float] = mapped_column(
        Float,
        nullable=True,
    )
    storage_path_raw: Mapped[str] = mapped_column(
        String(1000),
        nullable=False,
    )  # Chemin S3 du fichier original
    storage_path_converted: Mapped[str] = mapped_column(
        String(1000),
        nullable=True,
    )  # Chemin S3 du fichier converti (WAV 16kHz)
    status: Mapped[AudioStatus] = mapped_column(
        SAEnum(AudioStatus),
        default=AudioStatus.UPLOADED,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
    )

    # Relations
    project = relationship("Project", back_populates="audio_files")
    transcripts = relationship("Transcript", back_populates="audio_file", cascade="all, delete-orphan")
    