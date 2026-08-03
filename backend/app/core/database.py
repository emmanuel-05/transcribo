from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import get_settings

settings = get_settings()

# Le moteur asynchrone — le "connecteur" vers PostgreSQL
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,        # Affiche les requêtes SQL dans la console
    pool_size=20,               # Nombre de connexions simultanées
    max_overflow=10,            # Connexions supplémentaires si besoin
)

# La "fabrique" de sessions
# Chaque requête API aura sa propre session
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,     # Garde les objets utilisables après commit
)


# Classe de base pour tous les modèles SQLAlchemy
class Base(DeclarativeBase):
    pass


async def get_db():
    """
    Dépendance FastAPI qui fournit une session de base de données.
    La session est automatiquement fermée après la requête.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
