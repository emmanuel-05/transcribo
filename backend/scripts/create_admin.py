#!/usr/bin/env python3
"""
Script Python complet pour créer un utilisateur administrateur ou mettre à jour
le mot de passe et statut d'un utilisateur existant dans FastAPI avec SQLAlchemy.

Usage:
    python scripts/create_admin.py --email admin@example.com --password mon_mot_de_passe_securise
"""

import argparse
import asyncio
import inspect
import sys
from pathlib import Path

# Configurer sys.path pour ajouter le dossier backend et la racine du projet
SCRIPT_DIR = Path(__file__).resolve().parent
WORKSPACE_ROOT = SCRIPT_DIR.parent
BACKEND_DIR = WORKSPACE_ROOT / "backend"

if BACKEND_DIR.exists() and str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
if str(WORKSPACE_ROOT) not in sys.path:
    sys.path.insert(0, str(WORKSPACE_ROOT))

# 1. Charger l'environnement
from dotenv import load_dotenv

env_file = BACKEND_DIR / ".env"
if env_file.exists():
    load_dotenv(env_file)
else:
    load_dotenv()

# Connexion à la base de données via SQLAlchemy (SessionLocal)
try:
    from app.core.database import SessionLocal
except ImportError:
    from app.core.database import AsyncSessionLocal as SessionLocal

from app.core.security import hash_password
from app.infrastructure.db.models.user import User, UserRole
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


async def create_or_promote_admin(email: str, password: str) -> None:
    """
    1. Se connecte à la base de données via SQLAlchemy (SessionLocal).
    2. Vérifie si l'utilisateur existe déjà :
       - S'il existe, met à jour son mot de passe et active is_admin=True et is_active=True.
       - Sinon, crée un nouvel utilisateur avec is_admin=True et is_active=True.
    3. Gère proprement les erreurs et ferme la session de base de données.
    """
    hashed_pwd = hash_password(password)

    session = SessionLocal()
    is_async = isinstance(session, AsyncSession) or inspect.iscoroutinefunction(getattr(session, "execute", None))

    try:
        stmt = select(User).where(User.email == email)

        if is_async:
            result = await session.execute(stmt)
        else:
            result = session.execute(stmt)

        user = result.scalar_one_or_none()

        if user:
            print(f"ℹ️ Utilisateur existant trouvé : '{email}'")
            user.hashed_password = hashed_pwd
            user.is_admin = True
            user.is_active = True
            if hasattr(user, "role"):
                user.role = UserRole.ADMIN if hasattr(UserRole, "ADMIN") else "admin"

            if is_async:
                await session.commit()
            else:
                session.commit()
            print(f"✅ L'administrateur '{email}' a été mis à jour avec le nouveau mot de passe (is_admin=True, is_active=True) !")
        else:
            print(f"Création d'un nouvel utilisateur administrateur pour '{email}'...")
            new_user = User(
                email=email,
                hashed_password=hashed_pwd,
                is_admin=True,
                is_active=True,
                role=UserRole.ADMIN if hasattr(UserRole, "ADMIN") else "admin",
            )
            session.add(new_user)

            if is_async:
                await session.commit()
            else:
                session.commit()

            print(f"🎉 Nouvel administrateur '{email}' créé avec succès (is_admin=True, is_active=True) !")

    except Exception as e:
        if is_async:
            await session.rollback()
        else:
            session.rollback()
        print(f"❌ Erreur lors du traitement de l'administrateur : {e}", file=sys.stderr)
        sys.exit(1)

    finally:
        if is_async:
            await session.close()
        else:
            session.close()


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Script Python pour créer ou mettre à jour un administrateur."
    )
    parser.add_argument(
        "--email",
        type=str,
        required=True,
        help="Adresse email de l'administrateur (argument obligatoire)",
    )
    parser.add_argument(
        "--password",
        type=str,
        required=True,
        help="Mot de passe de l'administrateur (argument obligatoire)",
    )

    args = parser.parse_args()
    asyncio.run(create_or_promote_admin(email=args.email, password=args.password))


if __name__ == "__main__":
    main()
