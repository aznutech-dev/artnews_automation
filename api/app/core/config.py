from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")

    APP_NAME: str = "USA Update News API"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False

    DATABASE_URL: str

    JWT_SECRET: str
    JWT_ISSUER: str = "usaupdatenews-api"
    JWT_AUDIENCE: str = "usaupdatenews-admin"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_MINUTES: int = 15
    JWT_REFRESH_DAYS: int = 7

    CORS_ORIGINS: str = ""
    PUBLIC_WEB_URL: str = "http://localhost:3000"
    ADMIN_URL: str = "http://localhost:3001"

    AGENT_RATE_LIMIT: str = "60/minute"
    LOGIN_RATE_LIMIT: str = "5/minute"
    PUBLIC_RATE_LIMIT: str = "120/minute"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
