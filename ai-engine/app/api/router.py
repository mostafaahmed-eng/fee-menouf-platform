from fastapi import APIRouter

from app.api.chat import router as chat_router
from app.api.advisor import router as advisor_router
from app.api.scheduler import router as scheduler_router
from app.api.analytics import router as analytics_router
from app.api.documents import router as documents_router

api_router = APIRouter()

api_router.include_router(chat_router)
api_router.include_router(advisor_router)
api_router.include_router(scheduler_router)
api_router.include_router(analytics_router)
api_router.include_router(documents_router)
