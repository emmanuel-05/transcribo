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


async def correct_transcript(text: str, glossary_terms: list[str] | None = None) -> str:
    """Corrige une transcription avec Groq (LLaMA 3 70B) en appliquant strictement les règles et le glossaire métier."""
    system_prompt = SYSTEM_PROMPT
    if glossary_terms and len(glossary_terms) > 0:
        cleaned_terms = [t.strip() for t in glossary_terms if t and t.strip()]
        if cleaned_terms:
            formatted_terms = ", ".join(f'"{t}"' for t in cleaned_terms)
            system_prompt += (
                f"\n\nGLOSSAIRE MÉTIER À RESPECTER STRICTEMENT (ORTHOGRAPHE ET CASSE EXACTE) :\n"
                f"{formatted_terms}\n"
                f"Consigne glossaire : Tout terme phonétiquement proche, mal retranscrit ou mal orthographié "
                f"qui correspond à l'un de ces termes de glossaire DOIT être remplacé par sa graphie exacte du glossaire."
            )

    response = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Texte à corriger :\n\n{text}"},
        ],
        temperature=0.1,
        max_tokens=4096,
    )
    return response.choices[0].message.content.strip()