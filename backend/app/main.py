import time
import logging
from logging.handlers import TimedRotatingFileHandler
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.infrastructure.db.models import *
from app.api.v1.endpoints import auth, projects, audios, documents
from app.core.rate_limit import limiter
import os

app = FastAPI(title="Transcribo API", version="0.1.0")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Setup logging
os.makedirs("logs", exist_ok=True)
logger = logging.getLogger("access_logger")
logger.setLevel(logging.INFO)
handler = TimedRotatingFileHandler("logs/access.log", when="midnight", interval=1)
handler.setFormatter(logging.Formatter("%(asctime)s - %(message)s"))
logger.addHandler(handler)

@app.middleware("http")
async def security_and_logging_middleware(request: Request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    # Security Headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    
    # Logging
    process_time = time.time() - start_time
    client_ip = request.client.host if request.client else "unknown"
    
    log_message = f"{client_ip} - {request.method} {request.url.path} - HTTP {response.status_code} - {process_time:.4f}s"
    if response.status_code >= 400:
        logger.warning(log_message)
    else:
        logger.info(log_message)
        
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusion des routeurs
app.include_router(auth.router, prefix="/api/v1")
app.include_router(projects.router, prefix="/api/v1")
app.include_router(audios.router, prefix="/api/v1")
app.include_router(documents.router, prefix="/api/v1")


@app.get("/")
def read_root():
    return {"message": "Bienvenue sur l'API Transcribo !"}

@app.get("/health")
async def health():
    return {"status": "ok", "service": "transcribo-api"}

@app.get("/api/v1/hello")
async def hello():
    return {"message": "Transcribo backend is running!"}
