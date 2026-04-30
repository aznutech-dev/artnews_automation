import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.deps import require_admin
from app.core.security import generate_api_key
from app.models.api_key import ApiKey
from app.models.user import User
from app.schemas.api_key import ApiKeyCreate, ApiKeyCreatedOnce, ApiKeyOut

router = APIRouter(prefix="/admin/api-keys", tags=["admin-api-keys"])


@router.get("", response_model=list[ApiKeyOut])
async def list_keys(
    user: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    rows = (await db.execute(select(ApiKey).order_by(ApiKey.created_at.desc()))).scalars().all()
    return list(rows)


@router.post("", response_model=ApiKeyCreatedOnce, status_code=status.HTTP_201_CREATED)
async def create_key(
    payload: ApiKeyCreate,
    user: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    raw, digest, prefix = generate_api_key()
    key = ApiKey(
        key_hash=digest,
        key_prefix=prefix,
        name=payload.name,
        scopes=payload.scopes,
        created_by=user.id,
        expires_at=payload.expires_at,
        is_active=True,
    )
    db.add(key)
    await db.commit()
    await db.refresh(key)
    out = ApiKeyCreatedOnce.model_validate(key, from_attributes=True)
    out.raw_key = raw
    return out


@router.post("/{key_id}/revoke", response_model=ApiKeyOut)
async def revoke_key(
    key_id: uuid.UUID,
    user: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    key = await db.get(ApiKey, key_id)
    if not key:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "api key not found")
    key.is_active = False
    await db.commit()
    await db.refresh(key)
    return key


@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_key(
    key_id: uuid.UUID,
    user: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    key = await db.get(ApiKey, key_id)
    if not key:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "api key not found")
    await db.delete(key)
    await db.commit()
