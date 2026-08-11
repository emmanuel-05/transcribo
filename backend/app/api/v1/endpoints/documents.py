# app/api/v1/endpoints/documents.py
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.core.database import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.infrastructure.db.models.transcript import Transcript
from app.infrastructure.db.models.project import Project
from app.infrastructure.document_generator import generate_docx_from_transcript
from app.core.rate_limit import limiter

router = APIRouter()

class DocumentGenerateRequest(BaseModel):
    transcript_id: str
    destinataire: str
    objet: str
    expediteur: str

class DocumentGenerateResponse(BaseModel):
    url: str

@router.post(
    "/projects/{project_id}/documents/generate",
    response_model=DocumentGenerateResponse,
    summary="Générer un document DOCX",
)
@limiter.limit("300/minute")
async def generate_document(
    request: Request,
    project_id: uuid.UUID,
    body: DocumentGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """
    Génère un document DOCX à partir d'une transcription et d'un template.
    Retourne l'URL présignée pour le téléchargement.
    """
    # 1. Vérifier le projet
    stmt = select(Project).where(
        Project.id == project_id, Project.owner_id == current_user.id
    )
    result = await db.execute(stmt)
    project = result.scalars().first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or access denied"
        )

    # 2. Vérifier la transcription
    stmt_trans = select(Transcript).where(Transcript.id == uuid.UUID(body.transcript_id))
    result_trans = await db.execute(stmt_trans)
    transcript = result_trans.scalars().first()
    if not transcript:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transcript not found"
        )
        
    # Le texte à utiliser : de préférence corrigé, sinon brut
    text_content = transcript.corrected_text or transcript.raw_text
    
    if not text_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transcript content is empty"
        )

    # 3. Générer le document
    try:
        url = await generate_docx_from_transcript(
            project_id=str(project_id),
            transcript_id=body.transcript_id,
            text_content=text_content,
            expediteur=body.expediteur,
            destinataire=body.destinataire,
            objet=body.objet
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate document: {str(e)}"
        )

    return DocumentGenerateResponse(url=url)
