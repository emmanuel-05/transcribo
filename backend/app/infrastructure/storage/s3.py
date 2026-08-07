# app/infrastructure/storage/s3.py
import boto3
from botocore.config import Config
from app.core.config import get_settings

settings = get_settings()

# Client S3 configuré pour MinIO (ou AWS en production)
s3_client = boto3.client(
    "s3",
    endpoint_url=settings.S3_ENDPOINT,
    aws_access_key_id=settings.S3_ACCESS_KEY,
    aws_secret_access_key=settings.S3_SECRET_KEY,
    config=Config(signature_version="s3v4"),
    region_name="us-east-1",  # MinIO ignore cette valeur
)


async def upload_file_to_s3(
    file_data: bytes,
    bucket: str,
    key: str,
    content_type: str,
) -> str:
    """
    Upload un fichier vers S3/MinIO.
    Retourne le chemin de stockage (la clé S3).
    """
    s3_client.put_object(
        Bucket=bucket,
        Key=key,
        Body=file_data,
        ContentType=content_type,
    )
    return key


def generate_presigned_url(bucket: str, key: str, expires_in: int = 3600) -> str:
    """
    Génère une URL temporaire pour télécharger un fichier.
    Valide 1 heure par défaut.
    """
    return s3_client.generate_presigned_url(
        "get_object",
        Params={"Bucket": bucket, "Key": key},
        ExpiresIn=expires_in,
    )


def delete_file_from_s3(bucket: str, key: str) -> None:
    """Supprime un fichier de S3/MinIO."""
    s3_client.delete_object(Bucket=bucket, Key=key)