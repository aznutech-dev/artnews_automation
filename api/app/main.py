from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address
from starlette.responses import JSONResponse

from app.core.config import get_settings
from app.routers import (
    admin_api_keys,
    admin_articles,
    admin_categories,
    articles_agent,
    articles_public,
    auth,
    categories_public,
    health,
    me,
    media,
)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url=None,
)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request, exc):
    return JSONResponse({"detail": "rate limit exceeded"}, status_code=429)


if settings.cors_origins_list:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "DELETE"],
        allow_headers=["Authorization", "Content-Type", "X-API-Key"],
    )

app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(me.router, prefix="/api")
app.include_router(articles_public.router, prefix="/api")
app.include_router(categories_public.router, prefix="/api")
app.include_router(articles_agent.router, prefix="/api")
app.include_router(media.router, prefix="/api")
app.include_router(admin_articles.router, prefix="/api")
app.include_router(admin_categories.router, prefix="/api")
app.include_router(admin_api_keys.router, prefix="/api")
