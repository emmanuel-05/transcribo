import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool

from app.core.config import get_settings
from app.core.database import Base, engine  # Import de Base et du moteur asynchrone
from app.infrastructure.db.models import *  # Vos modèles pour l'autogenerate

# Objet de configuration Alembic
config = context.config

# Configuration des loggers Python
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Métadonnées des modèles pour la détection automatique des changements
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Exécute les migrations en mode 'offline'."""
    url = config.get_main_option("sqlalchemy.url", get_settings().DATABASE_URL)
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    """Fonction d'aide synchrone exécutée au sein du contexte asynchrone."""
    context.configure(
        connection=connection, 
        target_metadata=target_metadata
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    """Exécute les migrations en mode 'online' de manière asynchrone."""
    # On utilise directement le moteur asynchrone défini dans votre app
    async with engine.connect() as connection:
        # run_sync permet de faire tourner le processus synchrone d'Alembic sur la connexion asynchrone
        await connection.run_sync(do_run_migrations)

    await engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    # Lancement de la fonction asynchrone via la boucle d'événements asyncio
    asyncio.run(run_migrations_online())
