## 1. Documentation du projet

Créez les deux fichiers :

### Fichier 1 : `README.md` (présentation complète du projet)

```bash
# À la racine du projet
cat > README.md << 'ENDOFFILE'
# 🎙️ Transcribo

**Plateforme SaaS de transcription automatique et génération documentaire**

Transcribo transforme vos enregistrements audio (dictaphones, réunions, interviews) en documents professionnels prêts à être envoyés, grâce à l'intelligence artificielle.

---

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Architecture](#-architecture)
- [Stack technique](#-stack-technique)
- [Installation](#-installation)
- [Utilisation](#-utilisation)
- [Roadmap](#-roadmap)
- [Licence](#-licence)

---

## 🚀 Fonctionnalités

### ✅ Déjà implémentées

| Fonctionnalité        | Description                                                               |
|-----------------------|---------------------------------------------------------------------------|
| 🔐 Authentification   | Inscription/connexion email + mot de passe, JWT                           |
| 📁 Gestion de projets | CRUD complet (créer, lister, modifier, supprimer)                         |
| 📤 Upload audio       | Drag & drop ou sélection, formats WAV, MP3, DSS, DS2, FLAC, OGG, M4A, AAC |
| ☁️ Stockage S3        | Fichiers stockés sur MinIO (compatible AWS S3)                            |

### 🚧 En cours

| Fonctionnalité | Description |
|---------------------------|-------------|
| 🧠 Transcription IA | Whisper Large v3 avec diarisation |
| ✍️ Correction automatique | Post-traitement par LLM des transcriptions |
| 📄 Génération documentaire | Templates DOCX avec variables, export PDF |

### 📋 Planifiées

| Fonctionnalité | Description |
|---------------|-------------|
| 🔄 Amélioration continue | Fine-tuning LoRA sur les corrections utilisateur |
| 👥 Multi-utilisateurs | Partage de projets, rôles personnalisés |
| 📱 Applications mobiles | Android & iOS via React Native |
| 🖥️ Desktop | Windows & macOS via Electron |
| 🔌 API publique | Intégrations tierces |

---

## 🏗️ Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │───▶│   Backend   │────▶│  PostgreSQL │
│   Next.js   │     │   FastAPI   │     │             │
│   :3000     │     │   :8000     │     │  :5433      │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │             │
              ┌─────┴─────┐ ┌────┴─────┐
              │   MinIO   │ │  Redis   │
              │   (S3)    │ │  :6379   │
              │  :9000    │ └──────────┘
              └───────────┘
```

---

## 🛠️ Stack technique

| Couche | Technologie | Justification |
|--------|------------|---------------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, Zustand | Réactivité, typage, design rapide |
| **Backend** | Python 3.12, FastAPI, SQLAlchemy 2.0 | Performance async, écosystème IA |
| **Base de données** | PostgreSQL 16 | Fiable, full-text search, JSONB |
| **Cache/Queue** | Redis | Cache session, files d'attente |
| **Stockage** | MinIO (S3-compatible) | Scalable, compatible AWS |
| **IA / STT** | Whisper Large v3 (Faster-Whisper) | Open-source, précis, offline |
| **LLM Correction** | Mistral 7B / Phi-3 (LoRA) | Correction contextuelle |
| **Diarization** | PyAnnote Audio | Séparation des locuteurs |
| **Infrastructure** | Docker, Kubernetes (EKS), Terraform | Reproductible, scalable |

---

## 📦 Installation

### Prérequis

- Docker Desktop
- Node.js 20+
- Python 3.12
- Git

### Démarrage rapide

```bash
# 1. Cloner le projet
git clone https://github.com/votre-username/transcribo.git
cd transcribo

# 2. Lancer les services (PostgreSQL, Redis, MinIO)
docker compose up -d

# 3. Créer les buckets MinIO
mc alias set local http://localhost:9000 minioadmin minioadmin
mc mb local/raw-audio local/processed-audio local/documents

# 4. Backend
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# 5. Frontend
cd frontend
npm install
npm run dev
```

- 🌐 Frontend : http://localhost:3000
- 📚 API Swagger : http://localhost:8000/docs
- 🪣 MinIO Console : http://localhost:9001

---

## 📖 Utilisation

1. **Créez un compte** sur la page de connexion
2. **Créez un projet** depuis le dashboard
3. **Uploadez un fichier audio** (WAV, MP3, DSS...)
4. **Lancez la transcription** (bientôt disponible)
5. **Corrigez la transcription** dans l'éditeur
6. **Générez un document** DOCX/PDF

---

## 🗺️ Roadmap

| Phase          | Contenu                                    | Statut      |
|----------------|--------------------------------------------|-------------|
| **MVP**        | Auth, projets, upload audio                | ✅ Terminé  |
| **V1**         | Transcription, correction, éditeur         | 🚧 En cours |
| **V2**         | Fine-tuning, multi-utilisateurs, templates | 📋 Planifié |
| **Enterprise** | On-premise, SSO, marketplace               | 📋 Planifié |

---

## 📁 Structure du projet

```
transcribo/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/   # Routes API (auth, projects, audios)
│   │   ├── core/               # Configuration, sécurité, base de données
│   │   ├── domain/             # Entités métier (DDD)
│   │   ├── infrastructure/     # S3, DB models, repositories
│   │   └── workers/            # Tâches asynchrones
│   └── tests/
├── frontend/
│   └── src/
│       ├── app/                # Pages Next.js (App Router)
│       ├── components/         # Composants React
│       ├── services/           # Client API
│       └── store/              # State management (Zustand)
├── docker-compose.yml
└── README.md
```
