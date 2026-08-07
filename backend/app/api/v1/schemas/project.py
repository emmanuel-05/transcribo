# app/api/v1/schemas/project.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import uuid


class ProjectCreate(BaseModel):
    """Données nécessaires pour créer un projet."""
    name: str
    description: Optional[str] = None


class ProjectUpdate(BaseModel):
    """Données modifiables d'un projet."""
    name: Optional[str] = None
    description: Optional[str] = None


class ProjectResponse(BaseModel):
    """Ce qui est renvoyé au frontend."""
    id: uuid.UUID
    name: str
    description: Optional[str]
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # Permet la conversion depuis l'ORM


class ProjectListResponse(BaseModel):
    """Liste de projets avec compteur."""
    projects: list[ProjectResponse]
    total: int