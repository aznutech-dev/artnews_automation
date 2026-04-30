import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ApiKeyCreate(BaseModel):
    name: str
    scopes: list[str] = ["articles:write"]
    expires_at: datetime | None = None


class ApiKeyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    key_prefix: str
    scopes: list[str]
    last_used_at: datetime | None
    expires_at: datetime | None
    is_active: bool
    created_at: datetime


class ApiKeyCreatedOnce(ApiKeyOut):
    raw_key: str  # only returned once at creation
