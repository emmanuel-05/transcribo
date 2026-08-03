from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.infrastructure.db.models import *
from app.api.v1.endpoints import auth

app = FastAPI(title="Transcribo API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusion des routeurs
app.include_router(auth.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "Bienvenue sur l'API Transcribo !"}

@app.get("/health")
async def health():
    return {"status": "ok", "service": "transcribo-api"}

@app.get("/api/v1/hello")
async def hello():
    return {"message": "Transcribo backend is running!"}
