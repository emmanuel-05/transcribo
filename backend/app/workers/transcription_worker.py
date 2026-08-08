# app/workers/transcription_worker.py
import uuid
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.infrastructure.db.models.audio_file import AudioFile, AudioStatus
from app.infrastructure.ai_services.deepgram_service import transcribe_audio


async def process_audio(audio_id: uuid.UUID) -> None:
    """
    Traite un fichier audio avec Deepgram Nova-3.
    Plus besoin de conversion : Deepgram accepte tous les formats natifs.
    """
    async with AsyncSessionLocal() as db:
        # Récupère le fichier
        result = await db.execute(select(AudioFile).where(AudioFile.id == audio_id))
        audio = result.scalar_one_or_none()
        if not audio:
            return

        try:
            # Transcription directe (pas de conversion)
            audio.status = AudioStatus.TRANSCRIBING
            await db.commit()

            # Deepgram accepte tous les formats directement
            result = await transcribe_audio(audio.storage_path_raw)

            # Crée la transcription en base
            from app.infrastructure.db.models.transcript import Transcript
            transcript = Transcript(
                audio_file_id=audio.id,
                raw_text=result["text"],
                raw_json={
                    "segments": result["segments"],
                    "language": result["language"],
                },
                status="raw",
            )
            db.add(transcript)
            
            audio.status = AudioStatus.TRANSCRIBED
            await db.commit()

        except Exception as e:
            audio.status = AudioStatus.ERROR
            await db.commit()
            raise e