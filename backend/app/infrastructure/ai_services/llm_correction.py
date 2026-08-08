# app/infrastructure/ai_services/llm_correction.py
from groq import AsyncGroq
from app.core.config import get_settings

settings = get_settings()

client = AsyncGroq(api_key=settings.GROQ_API_KEY)

SYSTEM_PROMPT = """Tu es un correcteur de transcription audio en français.

TA MISSION : Corriger UNIQUEMENT les erreurs de transcription, SANS reformuler.

RÈGLES STRICTES :
- Supprime les mots d'hésitation : "euh", "bah", "hum", "hein"
- Supprime les répétitions involontaires : "je je je pense" → "je pense"
- Supprime les faux départs : "je vou... je voudrais" → "je voudrais"
- Corrige la ponctuation et les majuscules
- Corrige les fautes de grammaire évidentes
- NE CHANGE PAS l'ordre des mots
- NE REMPLACE PAS les mots par des synonymes
- NE RACCOURCIS PAS les phrases
- NE CHANGE PAS le style ou le ton
- GARDE toutes les informations, mêmes celles qui semblent superflues
- CONSERVE les répétitions volontaires (insistance)

RÉPONDS UNIQUEMENT avec le texte corrigé. Pas d'introduction, pas de commentaire."""


async def correct_transcript(raw_text: str) -> str:
    """Corrige une transcription brute avec Groq (LLaMA 3 70B)."""
    response = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Texte à corriger :\n\n{raw_text}"},
        ],
        temperature=0.1,
        max_tokens=4096,
    )
    return response.choices[0].message.content.strip()