# app/api/v1/endpoints/audios.py

# import des modules externes
import uuid
import io
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pathlib import Path

#import des modules internes
from app.core.database import get_db
from app.core.config import get_settings
from app.api.v1.schemas.audio import AudioFileResponse, AudioListResponse
from app.api.v1.endpoints.auth import get_current_user

from pydantic import BaseModel

from app.infrastructure.db.models.project import Project
from app.infrastructure.db.models.audio_file import AudioFile, AudioStatus
from app.infrastructure.db.models.user import User
from app.infrastructure.db.models.transcript import Transcript
from app.infrastructure.storage.s3 import upload_file_to_s3
from app.infrastructure.storage.s3 import generate_presigned_url, s3_client
from app.infrastructure.storage.s3 import delete_file_from_s3
from app.infrastructure.ai_services.llm_correction import correct_transcript
from app.infrastructure.db.models.transcript_version import TranscriptVersion


from app.workers.transcription_worker import process_audio
settings = get_settings()

router = APIRouter(prefix="/projects", tags=["Audios"])

# Formats acceptés
ALLOWED_EXTENSIONS = {"wav", "mp3", "dss", "ds2", "flac", "ogg", "m4a", "aac"}
MAX_FILE_SIZE = 70 * 1024 * 1024  # 70 Mo


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


@router.get("/{project_id}/audios/{audio_id}/download")
async def download_audio(
    project_id: uuid.UUID,
    audio_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Télécharge un fichier audio (streaming)."""
    # Vérifie le projet
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.owner_id == current_user.id,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Projet non trouvé")

    # Récupère le fichier audio
    result = await db.execute(
        select(AudioFile).where(
            AudioFile.id == audio_id,
            AudioFile.project_id == project_id,
        )
    )
    audio = result.scalar_one_or_none()
    if not audio:
        raise HTTPException(status_code=404, detail="Fichier non trouvé")

    # Si DSS/DS2 non encore converti
    if audio.format in {"dss", "ds2"} and not audio.storage_path_converted:
        from app.infrastructure.audio_converter import convert_to_wav
        converted_key = await convert_to_wav(
            audio.storage_path_raw, audio.format, str(audio.project_id)
        )
        audio.storage_path_converted = converted_key
        await db.commit()

    bucket = settings.S3_BUCKET_PROCESSED_AUDIO if audio.storage_path_converted else settings.S3_BUCKET_RAW_AUDIO
    key = audio.storage_path_converted if audio.storage_path_converted else audio.storage_path_raw

    # Récupère depuis S3
    try:
        file_obj = s3_client.get_object(
            Bucket=bucket,
            Key=key,
        )
        file_data = file_obj["Body"].read()
        
        return StreamingResponse(
            io.BytesIO(file_data),
            media_type="audio/wav",
            headers={
                "Content-Disposition": f'inline; filename="{audio.original_filename}"'
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du téléchargement : {str(e)}")


@router.get("/{project_id}/audios/{audio_id}/url")
async def get_audio_url(
    project_id: uuid.UUID,
    audio_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Génère une URL présignée pour écouter le fichier audio."""
    # Vérifie le projet
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.owner_id == current_user.id,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Projet non trouvé")

    # Récupère le fichier
    result = await db.execute(
        select(AudioFile).where(
            AudioFile.id == audio_id,
            AudioFile.project_id == project_id,
        )
    )
    audio = result.scalar_one_or_none()
    if not audio:
        raise HTTPException(status_code=404, detail="Fichier non trouvé")

    # Pour les formats non supportés par les navigateurs (dss, ds2)
    if audio.format in {"dss", "ds2"}:
        if not audio.storage_path_converted:
            # Conversion à la volée si pas encore converti
            from app.infrastructure.audio_converter import convert_to_wav
            converted_key = await convert_to_wav(
                audio.storage_path_raw, audio.format, str(audio.project_id)
            )
            audio.storage_path_converted = converted_key
            await db.commit()

        bucket = settings.S3_BUCKET_PROCESSED_AUDIO
        key = audio.storage_path_converted
    elif audio.storage_path_converted:
        bucket = settings.S3_BUCKET_PROCESSED_AUDIO
        key = audio.storage_path_converted
    else:
        bucket = settings.S3_BUCKET_RAW_AUDIO
        key = audio.storage_path_raw

    # Génère URL présignée (valide 1 heure)
    url = generate_presigned_url(
        bucket=bucket,
        key=key,
        expires_in=3600,
    )
    
    return {"url": url, "filename": audio.original_filename}

@router.delete("/{project_id}/audios/{audio_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_audio(
    project_id: uuid.UUID,
    audio_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Supprime un fichier audio et son stockage S3."""
    # Vérifie le projet
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.owner_id == current_user.id,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Projet non trouvé")

    # Récupère le fichier
    result = await db.execute(
        select(AudioFile).where(
            AudioFile.id == audio_id,
            AudioFile.project_id == project_id,
        )
    )
    audio = result.scalar_one_or_none()
    if not audio:
        raise HTTPException(status_code=404, detail="Fichier non trouvé")

    # Supprime de la base de données (cascade sur les transcriptions)
    await db.delete(audio)
    return None

@router.post("/{project_id}/audios/{audio_id}/transcribe", status_code=202)
async def start_transcription(
    project_id: uuid.UUID,
    audio_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lance la transcription asynchrone d'un fichier audio."""
    # Vérifications...
    result = await db.execute(
        select(AudioFile).where(
            AudioFile.id == audio_id,
            AudioFile.project_id == project_id,
        )
    )
    audio = result.scalar_one_or_none()
    if not audio:
        raise HTTPException(status_code=404, detail="Fichier non trouvé")

    if audio.status == AudioStatus.TRANSCRIBING:
        raise HTTPException(status_code=400, detail="Transcription déjà en cours")

    # Lance la transcription en arrière-plan
    import asyncio as asyncio_module
    from app.workers.transcription_worker import process_audio
    
    asyncio_module.create_task(process_audio(audio.id))

    return {"message": "Transcription lancée", "audio_id": str(audio_id)}

@router.get("/{project_id}/audios/{audio_id}/transcript")
async def get_transcript(
    project_id: uuid.UUID,
    audio_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Récupère la transcription d'un fichier audio."""
    result = await db.execute(
        select(Transcript).where(Transcript.audio_file_id == audio_id)
    )
    transcript = result.scalar_one_or_none()
    
    if not transcript:
        raise HTTPException(status_code=404, detail="Aucune transcription trouvée")
    
    return {
        "id": str(transcript.id),
        "raw_text": transcript.raw_text,
        "corrected_text": transcript.corrected_text,
        "status": transcript.status,
        "segments": transcript.raw_json.get("segments", []) if transcript.raw_json else [],
    }


class SaveRawRequest(BaseModel):
    raw_text: str

class SaveCorrectedRequest(BaseModel):
    corrected_text: str


@router.put("/{project_id}/audios/{audio_id}/transcript/save-raw")
async def save_raw_transcript(
    project_id: uuid.UUID,
    audio_id: uuid.UUID,
    data: SaveRawRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Sauvegarde manuellement la transcription brute."""
    result = await db.execute(
        select(Transcript).where(Transcript.audio_file_id == audio_id)
    )
    transcript = result.scalar_one_or_none()
    if not transcript:
        raise HTTPException(status_code=404, detail="Aucune transcription trouvée")

    transcript.raw_text = data.raw_text
    
    # Versioning
    versions_res = await db.execute(
        select(TranscriptVersion).where(TranscriptVersion.transcript_id == transcript.id)
    )
    existing_versions = versions_res.scalars().all()
    next_ver = max([v.version_number for v in existing_versions], default=0) + 1
    
    new_version = TranscriptVersion(
        transcript_id=transcript.id,
        version_number=next_ver,
        content=data.raw_text,
        source="manual_raw",
    )
    db.add(new_version)
    await db.commit()

    return {
        "message": "Transcription brute sauvegardée avec succès",
        "raw_text": transcript.raw_text,
    }


@router.put("/{project_id}/audios/{audio_id}/transcript/save")
async def save_corrected_transcript(
    project_id: uuid.UUID,
    audio_id: uuid.UUID,
    data: SaveCorrectedRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Sauvegarde manuellement la transcription corrigée."""
    result = await db.execute(
        select(Transcript).where(Transcript.audio_file_id == audio_id)
    )
    transcript = result.scalar_one_or_none()
    if not transcript:
        raise HTTPException(status_code=404, detail="Aucune transcription trouvée")

    transcript.corrected_text = data.corrected_text
    transcript.status = "corrected"

    # Versioning
    versions_res = await db.execute(
        select(TranscriptVersion).where(TranscriptVersion.transcript_id == transcript.id)
    )
    existing_versions = versions_res.scalars().all()
    next_ver = max([v.version_number for v in existing_versions], default=0) + 1

    new_version = TranscriptVersion(
        transcript_id=transcript.id,
        version_number=next_ver,
        content=data.corrected_text,
        source="manual",
    )
    db.add(new_version)
    await db.commit()

    return {
        "message": "Transcription corrigée sauvegardée avec succès",
        "corrected_text": transcript.corrected_text,
    }


@router.post("/{project_id}/audios/{audio_id}/correct")
async def correct_transcription(
    project_id: uuid.UUID,
    audio_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Corrige automatiquement la transcription avec le LLM."""
    result = await db.execute(
        select(Transcript).where(Transcript.audio_file_id == audio_id)
    )
    transcript = result.scalar_one_or_none()
    
    if not transcript:
        raise HTTPException(status_code=404, detail="Aucune transcription trouvée")
    
    if not transcript.raw_text:
        raise HTTPException(status_code=400, detail="Transcription vide")

    # Correction
    transcript.status = "correcting"
    await db.commit()
    
    corrected = await correct_transcript(transcript.raw_text)
    
    transcript.corrected_text = corrected
    transcript.status = "corrected"

    # Création d'une nouvelle version LLM
    versions_res = await db.execute(
        select(TranscriptVersion).where(TranscriptVersion.transcript_id == transcript.id)
    )
    existing_versions = versions_res.scalars().all()
    next_ver = max([v.version_number for v in existing_versions], default=0) + 1

    new_version = TranscriptVersion(
        transcript_id=transcript.id,
        version_number=next_ver,
        content=corrected,
        source="llm",
    )
    db.add(new_version)
    await db.commit()
    
    return {
        "id": str(transcript.id),
        "raw_text": transcript.raw_text,
        "corrected_text": transcript.corrected_text,
        "status": transcript.status,
    }


@router.get("/{project_id}/audios/{audio_id}/transcript/versions")
async def list_transcript_versions(
    project_id: uuid.UUID,
    audio_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Récupère l'historique des versions de la transcription."""
    result = await db.execute(
        select(Transcript).where(Transcript.audio_file_id == audio_id)
    )
    transcript = result.scalar_one_or_none()
    if not transcript:
        raise HTTPException(status_code=404, detail="Aucune transcription trouvée")

    versions_res = await db.execute(
        select(TranscriptVersion)
        .where(TranscriptVersion.transcript_id == transcript.id)
        .order_by(TranscriptVersion.version_number.desc())
    )
    versions = versions_res.scalars().all()

    return [
        {
            "id": str(v.id),
            "version_number": v.version_number,
            "source": v.source,
            "content": v.content,
            "created_at": v.created_at.isoformat() if v.created_at else None,
        }
        for v in versions
    ]


@router.post("/{project_id}/audios/{audio_id}/transcript/restore/{version_id}")
async def restore_transcript_version(
    project_id: uuid.UUID,
    audio_id: uuid.UUID,
    version_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Restaure une version spécifique dans la transcription corrigée."""
    result = await db.execute(
        select(Transcript).where(Transcript.audio_file_id == audio_id)
    )
    transcript = result.scalar_one_or_none()
    if not transcript:
        raise HTTPException(status_code=404, detail="Aucune transcription trouvée")

    ver_res = await db.execute(
        select(TranscriptVersion).where(
            TranscriptVersion.id == version_id,
            TranscriptVersion.transcript_id == transcript.id,
        )
    )
    version = ver_res.scalar_one_or_none()
    if not version:
        raise HTTPException(status_code=404, detail="Version non trouvée")

    # Restaure le contenu
    transcript.corrected_text = version.content
    transcript.status = "corrected"

    # Enregistre comme nouvelle version
    all_vers_res = await db.execute(
        select(TranscriptVersion).where(TranscriptVersion.transcript_id == transcript.id)
    )
    existing_versions = all_vers_res.scalars().all()
    next_ver = max([v.version_number for v in existing_versions], default=0) + 1

    restored_version = TranscriptVersion(
        transcript_id=transcript.id,
        version_number=next_ver,
        content=version.content,
        source=f"restored_v{version.version_number}",
    )
    db.add(restored_version)
    await db.commit()

    return {
        "message": f"Version {version.version_number} restaurée avec succès",
        "corrected_text": transcript.corrected_text,
    }

@router.get("/{project_id}/audios/{audio_id}/stream")
async def stream_audio(
    project_id: uuid.UUID,
    audio_id: uuid.UUID,
    token: str = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Stream audio converti en WAV pour écoute."""
    result = await db.execute(
        select(AudioFile).where(
            AudioFile.id == audio_id,
            AudioFile.project_id == project_id,
        )
    )
    audio = result.scalar_one_or_none()
    if not audio:
        raise HTTPException(status_code=404)

    # Pour DSS/DS2 : utiliser le fichier converti
    if audio.format in ("dss", "ds2") and audio.storage_path_converted:
        bucket = settings.S3_BUCKET_PROCESSED_AUDIO
        key = audio.storage_path_converted
    else:
        bucket = settings.S3_BUCKET_RAW_AUDIO
        key = audio.storage_path_raw

    file_obj = s3_client.get_object(Bucket=bucket, Key=key)
    
    return StreamingResponse(
        io.BytesIO(file_obj["Body"].read()),
        media_type="audio/wav",
        headers={"Content-Disposition": f'inline; filename="{Path(audio.original_filename).stem}.wav"'},
    )