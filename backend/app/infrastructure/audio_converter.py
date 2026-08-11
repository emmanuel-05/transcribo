import asyncio
import tempfile
from pathlib import Path
from app.infrastructure.storage.s3 import s3_client, upload_file_to_s3
from app.infrastructure.convertio_service import convert_dss_to_wav
from app.core.config import get_settings

settings = get_settings()


async def _run(cmd: list[str]) -> None:
    proc = await asyncio.create_subprocess_exec(*cmd,
        stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
    _, stderr = await proc.communicate()
    if proc.returncode != 0:
        raise Exception(f"Erreur {cmd[0]}: {stderr.decode(errors='ignore')}")


async def convert_to_wav(audio_key: str, original_format: str, project_id: str) -> str:
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        output_path = tmp_path / "output.wav"

        if original_format in ("dss", "ds2"):
            print("🔄 Convertio...")
            wav_bytes = await convert_dss_to_wav(audio_key)
            output_path.write_bytes(wav_bytes)
        else:
            file_obj = s3_client.get_object(Bucket=settings.S3_BUCKET_RAW_AUDIO, Key=audio_key)
            input_path = tmp_path / f"input.{original_format}"
            input_path.write_bytes(file_obj["Body"].read())
            await _run(["ffmpeg", "-y", "-i", str(input_path), "-ac", "1", "-ar", "16000",
                        "-sample_fmt", "s16", str(output_path)])

        converted_key = audio_key.replace(f".{original_format}", "_converted.wav")
        await upload_file_to_s3(file_data=output_path.read_bytes(),
                                bucket=settings.S3_BUCKET_PROCESSED_AUDIO,
                                key=converted_key, content_type="audio/wav")
        print(f"✅ WAV: {converted_key}")
        return converted_key