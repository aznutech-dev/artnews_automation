"""Admin-only article management endpoints."""
import uuid
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.db import get_db
from app.core.deps import get_current_user
from app.core.sanitize import sanitize_html
from app.models.article import Article, ArticleSource, ArticleStatus
from app.models.user import User
from app.schemas.article import ArticleCard, ArticleCreate, ArticleOut, ArticleUpdate
from app.services.articles import (
    calculate_reading_time,
    get_or_create_tags,
    resolve_category,
    unique_slug,
)

router = APIRouter(prefix="/admin/articles", tags=["admin-articles"])


@router.get("", response_model=list[ArticleCard])
async def list_articles(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    status_filter: ArticleStatus | None = Query(default=None, alias="status"),
    source: ArticleSource | None = Query(default=None),
    q: str | None = Query(default=None, description="title search"),
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0, ge=0),
):
    stmt = (
        select(Article)
        .options(selectinload(Article.category))
        .order_by(desc(Article.created_at))
        .limit(limit)
        .offset(offset)
    )
    if status_filter:
        stmt = stmt.where(Article.status == status_filter)
    if source:
        stmt = stmt.where(Article.source == source)
    if q:
        stmt = stmt.where(or_(Article.title.ilike(f"%{q}%"), Article.slug.ilike(f"%{q}%")))

    rows = (await db.execute(stmt)).scalars().all()
    return list(rows)


@router.get("/{article_id}", response_model=ArticleOut)
async def get_article(
    article_id: uuid.UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    stmt = (
        select(Article)
        .where(Article.id == article_id)
        .options(selectinload(Article.category), selectinload(Article.tags))
    )
    article = (await db.execute(stmt)).scalar_one_or_none()
    if not article:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "article not found")
    return article


@router.post("", response_model=ArticleOut, status_code=status.HTTP_201_CREATED)
async def create_article(
    payload: ArticleCreate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    slug = await unique_slug(db, payload.slug or payload.title)
    body = sanitize_html(payload.body)
    category = await resolve_category(db, payload.category_id, payload.category_slug)
    tags = await get_or_create_tags(db, payload.tags)

    article = Article(
        slug=slug,
        title=payload.title.strip(),
        excerpt=payload.excerpt.strip(),
        body=body,
        featured_image_url=payload.featured_image_url,
        featured_image_alt=payload.featured_image_alt,
        category_id=category.id if category else None,
        author_id=user.id,
        source=ArticleSource.manual,
        source_url=payload.source_url,
        status=ArticleStatus.draft,
        is_featured=payload.is_featured,
        is_breaking=payload.is_breaking,
        meta_title=payload.meta_title,
        meta_description=payload.meta_description,
        og_image_url=payload.og_image_url,
        canonical_url=payload.canonical_url,
        reading_time_minutes=calculate_reading_time(body),
        tags=tags,
    )
    db.add(article)
    await db.commit()

    return await _reload(db, article.id)


@router.patch("/{article_id}", response_model=ArticleOut)
async def update_article(
    article_id: uuid.UUID,
    payload: ArticleUpdate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    article = await db.get(Article, article_id)
    if not article:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "article not found")

    data = payload.model_dump(exclude_unset=True)

    if "body" in data and data["body"] is not None:
        data["body"] = sanitize_html(data["body"])
        data["reading_time_minutes"] = calculate_reading_time(data["body"])

    if "tags" in data and data["tags"] is not None:
        tags = await get_or_create_tags(db, data.pop("tags"))
        # reload with tags relationship
        stmt = select(Article).where(Article.id == article_id).options(selectinload(Article.tags))
        article = (await db.execute(stmt)).scalar_one()
        article.tags = tags

    if "slug" in data and data["slug"] and data["slug"] != article.slug:
        data["slug"] = await unique_slug(db, data["slug"])

    for k, v in data.items():
        setattr(article, k, v)

    await db.commit()
    return await _reload(db, article_id)


@router.post("/{article_id}/publish", response_model=ArticleOut)
async def publish_article(
    article_id: uuid.UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    article = await db.get(Article, article_id)
    if not article:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "article not found")
    if not article.title.strip() or not article.body.strip():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "title and body required to publish")

    article.status = ArticleStatus.published
    if not article.published_at:
        article.published_at = datetime.now(UTC)
    await db.commit()
    return await _reload(db, article_id)


@router.post("/{article_id}/unpublish", response_model=ArticleOut)
async def unpublish_article(
    article_id: uuid.UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    article = await db.get(Article, article_id)
    if not article:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "article not found")
    article.status = ArticleStatus.draft
    await db.commit()
    return await _reload(db, article_id)


@router.delete("/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_article(
    article_id: uuid.UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    article = await db.get(Article, article_id)
    if not article:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "article not found")
    await db.delete(article)
    await db.commit()


@router.get("/_/stats", response_model=dict)
async def stats(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, int]:
    counts: dict[str, int] = {}
    for s in ArticleStatus:
        n = await db.scalar(
            select(func.count(Article.id)).where(Article.status == s)
        )
        counts[s.value] = int(n or 0)
    return counts


async def _reload(db: AsyncSession, article_id: uuid.UUID) -> Article:
    stmt = (
        select(Article)
        .where(Article.id == article_id)
        .options(selectinload(Article.category), selectinload(Article.tags))
    )
    return (await db.execute(stmt)).scalar_one()
