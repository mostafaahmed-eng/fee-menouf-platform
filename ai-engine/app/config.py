from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
import os


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = "https://openrouter.ai/api/v1"
    FALLBACK_MODEL: str = "meta-llama/llama-3.2-3b-instruct:free"
    OFFLINE_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    MODEL_NAME: str = "meta-llama/llama-3.2-3b-instruct:free"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    EMBEDDING_DIMENSION: int = 384

    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/fee_ai"
    REDIS_URL: str = "redis://:b90245bb392c162d0b1453c9dbc435c9@redis:6379/0"

    MAX_TOKENS: int = 4096
    TEMPERATURE: float = 0.7

    CHUNK_SIZE: int = 512
    CHUNK_OVERLAP: int = 64

    CHROMA_PERSIST_DIR: str = "data/chromadb"
    VECTOR_COLLECTION_NAME: str = "fee_documents"

    CACHE_TTL: int = 3600
    RATE_LIMIT_PER_USER: int = 30
    RATE_LIMIT_WINDOW: int = 60

    MAX_CONTEXT_LENGTH: int = 8000
    TOP_K_RETRIEVAL: int = 5
    RELEVANCE_SCORE_THRESHOLD: float = 0.65

    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    LOG_LEVEL: str = "INFO"

    PROMETHEUS_PORT: int = 9090

    MODEL_CACHE_DIR: str = "data/models"
    ENABLE_CACHE: bool = True

    FALLBACK_OPENAI: bool = False
    OPENROUTER_FALLBACK_MODELS: list[str] = [
        "meta-llama/llama-3.2-3b-instruct:free",
        "nvidia/nemotron-3-nano-30b-a3b:free",
        "meta-llama/llama-3.3-70b-instruct:free",
        "nvidia/nemotron-nano-9b-v2:free",
    ]

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    @property
    def masked_api_key(self) -> str:
        if not self.OPENAI_API_KEY:
            return "(not set)"
        return self.OPENAI_API_KEY[:8] + "..." + self.OPENAI_API_KEY[-4:]


settings = Settings()

os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
os.makedirs(settings.MODEL_CACHE_DIR, exist_ok=True)
