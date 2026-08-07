# app/api/v1/endpoints/audios.py
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pathlib import Path

from app.core.database import get_db
from app.core.config import get_settings
from app.infrastructure.db.models.project import Project
from app.infrastructure.db.models.audio_file import AudioFile, AudioStatus
from app.infrastructure.db.models.user import User
from app.infrastructure.storage.s3 import upload_file_to_s3
from app.api.v1.endpoints.auth import get_current_user
from app.api.v1.schemas.audio import AudioFileResponse, AudioListResponse

settings = get_settings()

router = APIRouter(prefix="/projects", tags=["Audios"])

# Formats acceptés
ALLOWED_EXTENSIONS = {"wav", "mp3", "dss", "ds2", "flac", "ogg", "m4a", "aac"}
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500 Mo


@router.get("/{project_id}/audios", response_model=AudioListResponse)
async def list_audio_files(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Liste tous les fichiers audio d'un projet."""
    # Vérifie que le projet appartient à l'utilisateur
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.owner_id == current_user.id,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Projet non trouvé")

    # Compte le total
    count_result = await db.execute(
        select(func.count()).where(AudioFile.project_id == project_id)
    )
    total = count_result.scalar()

    # Récupère les fichiers
    result = await db.execute(
        select(AudioFile)
        .where(AudioFile.project_id == project_id)
        .order_by(AudioFile.created_at.desc())
    )
    files = result.scalars().all()

    return AudioListResponse(files=files, total=total)


@router.post("/{project_id}/audios", response_model=AudioFileResponse, status_code=201)
async def upload_audio(
    project_id: uuid.UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload un fichier audio dans un projet."""
    
    # 1. Vérifie que le projet existe et appartient à l'utilisateur
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.owner_id == current_user.id,
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")

    # 2. Vérifie l'extension
    extension = Path(file.filename).suffix.lower().lstrip(".")
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Format non supporté : .{extension}. Formats acceptés : {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # 3. Lit le contenu du fichier
    file_data = await file.read()

    # 4. Vérifie la taille
    if len(file_data) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"Fichier trop volumineux. Maximum : {MAX_FILE_SIZE // (1024*1024)} Mo",
        )

    # 5. Génère un nom unique pour le stockage
    file_id = uuid.uuid4()
    storage_key = f"projects/{project_id}/audio/{file_id}.{extension}"

    # 6. Upload vers S3/MinIO
    await upload_file_to_s3(
        file_data=file_data,
        bucket=settings.S3_BUCKET_RAW_AUDIO,
        key=storage_key,
        content_type=file.content_type or "audio/wav",
    )

    # 7. Crée l'entrée en base de données
    audio_file = AudioFile(
        id=file_id,
        project_id=project_id,
        original_filename=file.filename,
        format=extension,
        storage_path_raw=storage_key,
        status=AudioStatus.UPLOADED,
    )
    db.add(audio_file)
    await db.flush()
    await db.refresh(audio_file)

    return audio_file