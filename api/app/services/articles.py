import math
import re

from slugify import slugify
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.article import Article
from app.models.category import Category
from app.models.tag import Tag


def calculate_reading_time(html_or_text: str) -> int:
    text = re.sub(r"<[^>]+>", " ", html_or_text or "")
    words = len(text.split())
    return max(1, math.ceil(words / 220))  # ~220 wpm


async def unique_slug(db: AsyncSession, base: str) -> str:
    slug = slugify(base)[:200] or "article"
    candidate = slug
    n = 1
    while True:
        existing = await db.execute(select(Article.id).where(Article.slug == candidate))
        if existing.scalar_one_or_none() is None:
            return candidate
        n += 1
        candidate = f"{slug}-{n}"


async def get_or_create_tags(db: AsyncSession, names: list[str]) -> list[Tag]:
    if not names:
        return []
    out: list[Tag] = []
    for raw in names:
        clean = raw.strip()
        if not clean:
            continue
        slug = slugify(clean)[:100]
        existing = await db.execute(select(Tag).where(Tag.slug == slug))
        tag = existing.scalar_one_or_none()
        if not tag:
            tag = Tag(name=clean, slug=slug)
            db.add(tag)
            await db.flush()
        out.append(tag)
    return out


async def resolve_category(
    db: AsyncSession, category_id=None, category_slug: str | None = None
) -> Category | None:
    if category_id:
        return await db.get(Category, category_id)
    if category_slug:
        result = await db.execute(select(Category).where(Category.slug == category_slug))
        return result.scalar_one_or_none()
    return None
