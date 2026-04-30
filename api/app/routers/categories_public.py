from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.category import Category
from app.schemas.category import CategoryOut

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryOut])
async def list_categories(db: Annotated[AsyncSession, Depends(get_db)]):
    rows = (await db.execute(select(Category).order_by(Category.sort_order, Category.name))).scalars().all()
    return list(rows)
