from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class Transcript(Base):
    __tablename__ = "transcripts"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)

    # Correction ici : le type doit correspondre exactement à l'UUID de la table audio_files
    audio_file_id = Column(UUID(as_uuid=True), ForeignKey("audio_files.id"), nullable=False)

    # Relation inverse vers AudioFile
    audio_file = relationship("AudioFile", back_populates="transcript")