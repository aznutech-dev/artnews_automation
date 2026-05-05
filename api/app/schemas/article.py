import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from app.models.article import ArticleSource, ArticleStatus
from app.schemas.category import CategoryOut
from app.schemas.tag import TagOut


class ArticleCreate(BaseModel):
    title: str = Field(min_length=3, max_length=500)
    slug: str | None = None
    excerpt: str = Field(default="", max_length=500)
    body: str = Field(default="")
    featured_image_url: str | None = None
    featured_image_alt: str | None = None

    category_id: uuid.UUID | None = None
    category_slug: str | None = None
    category_name: str | None = None  # used to auto-create category if slug doesn't exist (agent imports)
    tags: list[str] = []  # tag slugs or names
    source_url: str | None = None

    is_featured: bool = False
    is_breaking: bool = False

    meta_title: str | None = None
    meta_description: str | None = None
    og_image_url: str | None = None
    canonical_url: str | None = None


class ArticleUpdate(BaseModel):
    title: str | None = None
    slug: str | None = None
    excerpt: str | None = None
    body: str | None = None
    featured_image_url: str | None = None
    featured_image_alt: str | None = None
    category_id: uuid.UUID | None = None
    tags: list[str] | None = None
    status: ArticleStatus | None = None
    is_featured: bool | None = None
    is_breaking: bool | None = None
    meta_title: str | None = None
    meta_description: str | None = None
    og_image_url: str | None = None
    canonical_url: str | None = None
    published_at: datetime | None = None


class ArticleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    slug: str
    title: str
    excerpt: str
    body: str
    featured_image_url: str | None
    featured_image_alt: str | None
    category: CategoryOut | None
    tags: list[TagOut]
    source: ArticleSource
    status: ArticleStatus
    is_featured: bool
    is_breaking: bool
    published_at: datetime | None
    focus_keyword: str | None
    meta_title: str | None
    meta_description: str | None
    og_image_url: str | None
    canonical_url: str | None
    view_count: int
    reading_time_minutes: int
    created_at: datetime
    updated_at: datetime


class ArticleCard(BaseModel):
    """Lightweight version for list/grid views."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    slug: str
    title: str
    excerpt: str
    featured_image_url: str | None
    featured_image_alt: str | None
    category: CategoryOut | None
    status: ArticleStatus
    is_featured: bool
    is_breaking: bool
    published_at: datetime | None
    reading_time_minutes: int
s: int
