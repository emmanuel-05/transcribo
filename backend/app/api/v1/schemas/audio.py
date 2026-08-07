# app/api/v1/schemas/audio.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import uuid


class AudioFileResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    original_filename: str
    format: str
    duration_secs: Optional[float] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class AudioListResponse(BaseModel):
    files: list[AudioFileResponse]
    total: int