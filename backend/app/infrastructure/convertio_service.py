import httpx
import asyncio
from app.core.config import get_settings
from app.infrastructure.storage.s3 import s3_client

settings = get_settings()


async def convert_dss_to_wav(audio_key: str) -> bytes:
    file_obj = s3_client.get_object(
        Bucket=settings.S3_BUCKET_RAW_AUDIO, Key=audio_key
    )
    audio_data = file_obj["Body"].read()
    filename = audio_key.split("/")[-1]
    
    async with httpx.AsyncClient(timeout=180) as client:
        # Étape 1 : Créer la conversion avec upload direct
        resp = await client.post(
            "https://api.convertio.co/convert",
            json={
                "apikey": settings.CONVERTIO_API_KEY,
                "input": "upload",
                "filename": filename,
                "outputformat": "wav",
            },
        )
        data = resp.json()
        print(f"📥 Convertio create: {data}")
        
        if data.get("code") != 200:
            raise Exception(f"Convertio error: {data}")
        
        conversion_id = data["data"]["id"]
        
        # Étape 2 : Upload du fichier
        await client.put(
            f"https://api.convertio.co/convert/{conversion_id}/{filename}",
            content=audio_data,
        )
        print(f"📤 Fichier uploadé")
        
        # Étape 3 : Polling
        for _ in range(60):
            await asyncio.sleep(2)
            status_resp = await client.get(
                f"https://api.convertio.co/convert/{conversion_id}/status",
            )
            status_data = status_resp.json()
            step = status_data.get("data", {}).get("step", "")
            print(f"⏳ Step: {step}")
            
            if step == "finish":
                dl_url = status_data["data"]["output"]["url"]
                dl_resp = await client.get(dl_url)
                print(f"✅ Converti: {len(dl_resp.content)} octets")
                return dl_resp.content
            
            if step == "failed":
                raise Exception(f"Convertio failed: {status_data}")
        
        raise Exception("Convertio timeout")