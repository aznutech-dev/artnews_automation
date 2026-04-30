"""Endpoints used by the local agent (X-API-Key auth).

Agent-posted articles are forced to status=draft for human review.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select

from app.core.db import get_db
from app.core.deps import get_api_key
from app.core.sanitize import sanitize_html
from app.models.api_key import ApiKey
from app.models.article import Article, ArticleSource, ArticleStatus
from app.schemas.article import ArticleCreate, ArticleOut
from app.services.articles import (
    calculate_reading_time,
    get_or_create_tags,
    resolve_category,
    unique_slug,
)

router = APIRouter(prefix="/agent/articles", tags=["agent"])


@router.post("", response_model=ArticleOut, status_code=status.HTTP_201_CREATED)
async def agent_create_article(
    payload: ArticleCreate,
    api_key: Annotated[ApiKey, Depends(get_api_key)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ArticleOut:
    if not payload.title.strip() or not payload.body.strip():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "title and body are required")

    slug = await unique_slug(db, payload.slug or payload.title)
    clean_body = sanitize_html(payload.body)

    category = await resolve_category(db, payload.category_id, payload.category_slug)
    tags = await get_or_create_tags(db, payload.tags)

    article = Article(
        slug=slug,
        title=payload.title.strip(),
        excerpt=payload.excerpt.strip(),
        body=clean_body,
        featured_image_url=payload.featured_image_url,
        featured_image_alt=payload.featured_image_alt,
        category_id=category.id if category else None,
        source=ArticleSource.agent,
        agent_key_id=api_key.id,
        source_url=payload.source_url,
        status=ArticleStatus.draft,  # forced
        is_featured=payload.is_featured,
        is_breaking=payload.is_breaking,
        meta_title=payload.meta_title,
        meta_description=payload.meta_description,
        og_image_url=payload.og_image_url,
        canonical_url=payload.canonical_url,
        reading_time_minutes=calculate_reading_time(clean_body),
        tags=tags,
    )
    db.add(article)
    await db.commit()

    # reload with eager relationships for response
    result = await db.execute(
        select(Article)
        .where(Article.id == article.id)
        .options(selectinload(Article.category), selectinload(Article.tags))
    )
    return result.scalar_one()
