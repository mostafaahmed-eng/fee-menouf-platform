import time
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.api.router import api_router
from app.utils.logger import setup_logging
from app.rag.rag_engine import rag_engine

logger = logging.getLogger("ai_engine")


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    logger.info("AI Engine starting up...")
    logger.info(f"Primary: {settings.PRIMARY_MODEL}, Fallback: {settings.FALLBACK_MODEL}, Embedding: {settings.EMBEDDING_MODEL}")
    ingest_result = rag_engine.ingest_knowledge_directory("data/knowledge")
    logger.info(f"Knowledge base: {ingest_result['ingested']} files ingested")
    yield
    logger.info("AI Engine shutting down...")


app = FastAPI(
    title="FEE-MENOUF AI Engine",
    description="AI-powered microservice for the Faculty of Electronic Engineering, Menoufia University",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    start_time = time.time()
    body = None
    if request.method in ("POST", "PUT", "PATCH"):
        try:
            body = await request.json()
        except Exception:
            body = None

    response = await call_next(request)

    process_time = (time.time() - start_time) * 1000
    logger.info(
        f"{request.method} {request.url.path} - {response.status_code} - {process_time:.1f}ms"
    )
    response.headers["X-Process-Time-MS"] = f"{process_time:.1f}"
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred", "error": str(exc)},
    )


@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "service": "ai-engine",
        "version": "1.0.0",
        "model": settings.MODEL_NAME,
        "embedding_model": settings.EMBEDDING_MODEL,
    }


app.include_router(api_router, prefix="/api/v1")
