telligente et génération documentaire.

## Stack

- **Backend** : Python 3.12, FastAPI, SQLAlchemy, PostgreSQL
- **Frontend** : Next.js 14, TypeScript, Tailwind CSS
- **Infrastructure** : Docker Compose, Redis, MinIO (S3)

## Démarrage rapide

```bash
# 1. Lancez les services
docker compose up -d

# 2. Backend
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# 3. Frontend
cd frontend
npm install
npm run dev