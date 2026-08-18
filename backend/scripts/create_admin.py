#!/usr/bin/env python3
"""
Script Python complet pour créer un utilisateur administrateur ou promouvoir
un utilisateur existant dans une application FastAPI avec SQLAlchemy.

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

from app.infrastructure.db.models.user import User, UserRole
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# 2. Utiliser passlib avec bcrypt pour hasher le mot de passe de manière sécurisée
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hache un mot de passe en texte brut avec passlib et bcrypt."""
    return pwd_context.hash(password)


async def create_or_promote_admin(email: str, password: str) -> None:
    """
    1. Se connecte à la base de données via SQLAlchemy (SessionLocal).
    2. Vérifie si l'utilisateur existe déjà :
       - S'il existe, le bascule en admin (is_admin=True) s'il ne l'est pas déjà.
       - Sinon, crée un nouvel utilisateur avec is_admin=True et is_active=True.
    3. Gère proprement les erreurs et ferme la session de base de données.
    """
    hashed_pwd = hash_password(password)

    # 1. Connexion via SessionLocal
    session = SessionLocal()
    is_async = isinstance(session, AsyncSession) or inspect.iscoroutinefunction(getattr(session, "execute", None))

    try:
        stmt = select(User).where(User.email == email)

        if is_async:
            result = await session.execute(stmt)
        else:
            result = session.execute(stmt)

        user = result.scalar_one_or_none()

        # 4. Vérification si l'utilisateur existe déjà
        if user:
            print(f" Utilisateur existant trouvé : '{email}'")
            needs_update = False

            if not getattr(user, "is_admin", False):
                user.is_admin = True
                needs_update = True

            if hasattr(user, "role") and user.role != UserRole.ADMIN:
                user.role = UserRole.ADMIN
                needs_update = True

            if needs_update:
                if is_async:
                    await session.commit()
                else:
                    session.commit()
                print(f"L'utilisateur '{email}' a été mis à jour avec le statut d'administrateur (is_admin=True).")
            else:
                print(f"L'utilisateur '{email}' est déjà administrateur (is_admin=True).")

        else:
            # Créer un nouvel utilisateur avec is_admin=True et is_active=True
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

            print(f" Nouvel administrateur '{email}' créé avec succès (is_admin=True, is_active=True) !")

    except Exception as e:
        # 5. Gérer proprement les erreurs (rollback)
        if is_async:
            await session.rollback()
        else:
            session.rollback()
        print(f" Erreur lors du traitement de l'administrateur : {e}", file=sys.stderr)
        sys.exit(1)

    finally:
        # 5. Fermer la session de base de données
        if is_async:
            await session.close()
        else:
            session.close()


def main() -> None:
    # 3. Utiliser argparse pour accepter deux arguments obligatoires : --email et --password
    parser = argparse.ArgumentParser(
        description="Script Python pour créer un administrateur ou promouvoir un utilisateur existant en admin (FastAPI / SQLAlchemy)."
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
