# app/infrastructure/ai_services/deepgram_service.py
import httpx
from app.core.config import get_settings
from app.infrastructure.storage.s3 import s3_client

settings = get_settings()


async def transcribe_audio(audio_key: str, key_terms: list = None) -> dict:
    """
    Transcrit un fichier audio avec Deepgram Nova-3.
    Accepte tous les formats (WAV, MP3, DSS, DS2, FLAC, etc.)
    """
    # Récupère le fichier depuis S3
    file_obj = s3_client.get_object(
        Bucket=settings.S3_BUCKET_RAW_AUDIO,
        Key=audio_key,
    )
    audio_data = file_obj["Body"].read()

    # Paramètres optimaux pour dictées professionnelles
    params = {
        "model": "nova-3",
        "language": "fr",
        "smart_format": "true",
        "redact": "true",
        "diarize": "true",
        "punctuate": "true",
        "utterances": "true",
    }

    if key_terms:
        params["keyterm"] = key_terms

    async with httpx.AsyncClient(timeout=300) as client:
        response = await client.post(
            "https://api.deepgram.com/v1/listen",
            headers={
                "Authorization": f"Token {settings.DEEPGRAM_API_KEY}",
                "Content-Type": "application/octet-stream",
            },
            params=params,
            content=audio_data,
        )
        response.raise_for_status()
        data = response.json()

    # Extrait le résultat
    transcript = data["results"]["channels"][0]["alternatives"][0]["transcript"]
    utterances = data["results"].get("utterances", [])

    return {
        "text": transcript,
        "segments": [
            {
                "start": u["start"],
                "end": u["end"],
                "text": u["transcript"],
                "speaker": u.get("speaker", 0),
            }
            for u in utterances
        ],
        "language": "fr",
    }