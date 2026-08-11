# app/workers/transcription_worker.py
import uuid
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.core.config import get_settings
from app.infrastructure.ai_services.deepgram_service import transcribe_audio
from app.infrastructure.audio_converter import convert_to_wav
from app.infrastructure.db.models.audio_file import AudioFile, AudioStatus
from app.infrastructure.db.models.transcript_version import TranscriptVersion
from app.infrastructure.db.models.glossary import Glossary

settings = get_settings()
NEED_CONVERSION = {"dss", "ds2"}


async def process_audio(audio_id: uuid.UUID) -> None:
    print(f"\n🚀 Transcription: {audio_id}")
    
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(AudioFile).where(AudioFile.id == audio_id))
        audio = result.scalar_one_or_none()
        if not audio:
            return

        try:
            audio.status = AudioStatus.TRANSCRIBING
            await db.commit()

            glossary_result = await db.execute(
                select(Glossary).where(Glossary.project_id == audio.project_id)
            )
            glossary = glossary_result.scalar_one_or_none()
            key_terms = glossary.terms if glossary else None
            print(f"🔑 Key Terms: {key_terms}")

            # Rejeter explicitement le DS2
            if audio.format == "ds2":
                raise Exception("Format DS2 non supporté pour le moment. Convertissez en WAV.")

            # Convertir DSS avant Deepgram
            if audio.format in NEED_CONVERSION:
                print(f"🔄 Conversion {audio.format} via Convertio...")
                audio_key = await convert_to_wav(
                    audio.storage_path_raw, audio.format, str(audio.project_id)
                )
                audio.storage_path_converted = audio_key
                # Utiliser le bucket processed-audio pour le fichier converti
                result = await transcribe_audio(
                    audio_key, key_terms=key_terms,
                    bucket=settings.S3_BUCKET_PROCESSED_AUDIO
                )
            else:
                result = await transcribe_audio(audio.storage_path_raw, key_terms=key_terms)

            print(f"📝 OK: {result['text'][:100]}...")

            from app.infrastructure.db.models.transcript import Transcript
            transcript = Transcript(
                audio_file_id=audio.id,
                raw_text=result["text"],
                raw_json={"segments": result["segments"], "language": result["language"]},
                status="raw",
            )
            db.add(transcript)
            await db.flush()

            v1 = TranscriptVersion(
                transcript_id=transcript.id, version_number=1,
                content=result["text"], source="whisper",
            )
            db.add(v1)

            audio.status = AudioStatus.TRANSCRIBED
            await db.commit()
            print("✅ Terminé!")

        except Exception as e:
            print(f"❌ {e}")
            audio.status = AudioStatus.ERROR
            await db.commit()