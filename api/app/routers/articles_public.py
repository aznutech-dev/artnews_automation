"""Public read-only article endpoints used by the Next.js web app."""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.db import get_db
from app.models.article import Article, ArticleStatus
from app.models.category import Category
from app.schemas.article import ArticleCard, ArticleOut

router = APIRouter(prefix="/articles", tags=["articles-public"])


@router.get("", response_model=list[ArticleCard])
async def list_articles(
    db: Annotated[AsyncSession, Depends(get_db)],
    category_slug: str | None = Query(default=None),
    featured: bool | None = Query(default=None),
    limit: int = Query(default=20, le=100),
    offset: int = Query(default=0, ge=0),
) -> list[Article]:
    stmt = (
        select(Article)
        .where(Article.status == ArticleStatus.published)
        .options(selectinload(Article.category))
        .order_by(desc(Article.published_at))
        .limit(limit)
        .offset(offset)
    )
    if category_slug:
        stmt = stmt.join(Article.category).where(Category.slug == category_slug)
    if featured is not None:
        stmt = stmt.where(Article.is_featured == featured)

    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/{slug}", response_model=ArticleOut)
async def get_article(slug: str, db: Annotated[AsyncSession, Depends(get_db)]) -> Article:
    stmt = (
        select(Article)
        .where(Article.slug == slug, Article.status == ArticleStatus.published)
        .options(selectinload(Article.category), selectinload(Article.tags))
    )
    result = await db.execute(stmt)
    article = result.scalar_one_or_none()
    if not article:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "article not found")

    article.view_count += 1
    await db.commit()
    return article
