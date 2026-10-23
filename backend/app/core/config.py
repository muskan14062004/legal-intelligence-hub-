import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List

# Base backend directory
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "Legal Intelligence Hub"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    # Security & Auth
    SECRET_KEY: str = os.getenv("SECRET_KEY", "legal-intel-hub-super-secret-key-change-in-prod-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database
    # Default uses SQLite for immediate zero-config operation, or PostgreSQL if configured
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{BACKEND_DIR}/data/legal_hub.db"
    )

    # Storage paths
    UPLOAD_DIR: Path = BACKEND_DIR / "data" / "uploads"
    VECTOR_STORE_DIR: Path = BACKEND_DIR / "data" / "vectors"

    # AI & Embedding configs
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3")
    EMBEDDING_MODEL_NAME: str = os.getenv("EMBEDDING_MODEL_NAME", "all-MiniLM-L6-v2")

    # Upload limits
    MAX_UPLOAD_SIZE_BYTES: int = 50 * 1024 * 1024  # 50MB
    ALLOWED_EXTENSIONS: List[str] = [".pdf"]

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

# Ensure storage directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.VECTOR_STORE_DIR, exist_ok=True)
