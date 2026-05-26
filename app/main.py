import logging
import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.logging import configure_logging
from app.core.rate_limit import InMemoryRateLimitMiddleware
from app.db.session import SessionLocal
from app.models.health_profile import HealthProfile
from app.models.interaction import DrugInteraction
from app.models.medicine import Medicine
from app.models.user import User

logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    configure_logging()
    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        description="Informational medicine safety API. Not a substitute for medical advice.",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(InMemoryRateLimitMiddleware)

    @app.middleware("http")
    async def log_requests(request, call_next):
        start = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            logger.exception("Unhandled exception for %s %s", request.method, request.url.path)
            raise

        elapsed_ms = (time.perf_counter() - start) * 1000
        if request.url.path.startswith("/api/") or request.url.path == "/health":
            logger.info(
                "%s %s -> %s in %.1fms",
                request.method,
                request.url.path,
                response.status_code,
                elapsed_ms,
            )
        return response

    @app.get("/health", tags=["health"])
    def health_check() -> dict[str, str]:
        return {"status": "ok", "environment": settings.environment}

    @app.on_event("startup")
    def startup_db_diagnostics() -> None:
        try:
            with SessionLocal() as db:
                user_total = db.scalar(select(func.count()).select_from(User)) or 0
                profile_total = db.scalar(select(func.count()).select_from(HealthProfile)) or 0
                medicine_total = db.scalar(select(func.count()).select_from(Medicine)) or 0
                interaction_total = db.scalar(select(func.count()).select_from(DrugInteraction)) or 0
                logger.info(
                    "Startup DB diagnostics: users=%s profiles=%s medicines=%s interactions=%s",
                    user_total,
                    profile_total,
                    medicine_total,
                    interaction_total,
                )
                if medicine_total == 0:
                    logger.warning(
                        "Medicine table is empty at startup. Production data import should be verified."
                    )
                if interaction_total == 0:
                    logger.warning(
                        "Drug interaction table is empty at startup. Production data import should be verified."
                    )
        except Exception:
            logger.exception("Startup DB diagnostics failed")

    app.include_router(api_router, prefix="/api/v1")
    return app


app = create_app()
