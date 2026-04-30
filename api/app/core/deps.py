from datetime import UTC, datetime
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.security import decode_token, hash_api_key
from app.models.api_key import ApiKey
from app.models.user import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


async def get_current_user(
    token: Annotated[str | None, Depends(oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "missing token")
    try:
        payload = decode_token(token)
    except ValueError as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, str(e)) from e

    if payload.get("type") != "access":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "wrong token type")

    user_id = payload.get("sub")
    user = await db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "user not found / inactive")
    return user


async def require_admin(user: Annotated[User, Depends(get_current_user)]) -> User:
    if user.role != UserRole.admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "admin required")
    return user


async def get_api_key(
    x_api_key: Annotated[str | None, Header(alias="X-API-Key")],
    db: Annotated[AsyncSession, Depends(get_db)],
    required_scope: str = "articles:write",
) -> ApiKey:
    if not x_api_key:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "missing X-API-Key")

    digest = hash_api_key(x_api_key)
    result = await db.execute(select(ApiKey).where(ApiKey.key_hash == digest))
    api_key = result.scalar_one_or_none()

    if not api_key or not api_key.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "invalid api key")
    if api_key.expires_at and api_key.expires_at < datetime.now(UTC):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "api key expired")
    if required_scope not in api_key.scopes:
        raise HTTPException(status.HTTP_403_FORBIDDEN, f"missing scope: {required_scope}")

    api_key.last_used_at = datetime.now(UTC)
    await db.commit()
    return api_key
