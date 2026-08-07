# app/api/v1/endpoints/projects.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
import uuid

from app.core.database import get_db
from app.infrastructure.db.models.project import Project
from app.infrastructure.db.models.user import User
from app.api.v1.endpoints.auth import get_current_user
from app.api.v1.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectListResponse,
)

router = APIRouter(prefix="/projects", tags=["Projects"])


# ─── LISTER MES PROJETS ────────────────────────

@router.get("/", response_model=ProjectListResponse)
async def list_my_projects(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    #Retourne tous les projets de l'utilisateur connecté.
    
    # Requête : compter le total
    count_result = await db.execute(
        select(func.count()).where(Project.owner_id == current_user.id)
    )
    total = count_result.scalar()

    # Requête : récupérer les projets
    result = await db.execute(
        select(Project)
        .where(Project.owner_id == current_user.id)
        .order_by(Project.updated_at.desc())
    )
    projects = result.scalars().all()

    return ProjectListResponse(projects=projects, total=total)


# ─── DÉTAIL D'UN PROJET ────────────────────────

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retourne les détails d'un projet spécifique.
    """
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.owner_id == current_user.id,
        )
    )
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projet non trouvé",
        )

    return project


# ─── CRÉER UN PROJET ───────────────────────────

@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Crée un nouveau projet pour l'utilisateur connecté.
    """
    project = Project(
        name=project_data.name,
        description=project_data.description,
        owner_id=current_user.id,
    )
    db.add(project)
    await db.flush()       # Exécute l'INSERT pour obtenir l'ID
    await db.refresh(project)  # Recharge avec valeurs par défaut (created_at, etc.)

    return project


# ─── MODIFIER UN PROJET ────────────────────────

@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: uuid.UUID,
    project_data: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Modifie un projet existant (propriétaire uniquement).
    """
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.owner_id == current_user.id,
        )
    )
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")

    # Met à jour seulement les champs fournis
    if project_data.name is not None:
        project.name = project_data.name
    if project_data.description is not None:
        project.description = project_data.description

    await db.flush()
    await db.refresh(project)

    return project


# ─── SUPPRIMER UN PROJET ───────────────────────

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Supprime un projet et tout ce qu'il contient (audio, transcriptions).
    """
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.owner_id == current_user.id,
        )
    )
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")

    await db.delete(project)
    # Pas besoin de flush — get_db() fera le commit
    return None  # 204 No Content