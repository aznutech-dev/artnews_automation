import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Table,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPK


class ArticleStatus(str, enum.Enum):
    draft = "draft"
    published = "published"
    archived = "archived"


class ArticleSource(str, enum.Enum):
    manual = "manual"
    agent = "agent"


article_tags = Table(
    "article_tags",
    Base.metadata,
    Column(
        "article_id",
        PG_UUID(as_uuid=True),
        ForeignKey("articles.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "tag_id",
        PG_UUID(as_uuid=True),
        ForeignKey("tags.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class Article(Base, UUIDPK, TimestampMixin):
    __tablename__ = "articles"

    # Core content
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    excerpt: Mapped[str] = mapped_column(String(500), default="", nullable=False)
    body: Mapped[str] = mapped_column(Text, default="", nullable=False)
    featured_image_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    featured_image_alt: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Taxonomy
    category_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Authorship
    author_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    source: Mapped[ArticleSource] = mapped_column(
        Enum(ArticleSource, name="article_source"),
        default=ArticleSource.manual,
        nullable=False,
    )
    agent_key_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("api_keys.id", ondelete="SET NULL"),
        nullable=True,
    )
    source_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    # Publishing
    status: Mapped[ArticleStatus] = mapped_column(
        Enum(ArticleStatus, name="article_status"),
        default=ArticleStatus.draft,
        nullable=False,
        index=True,
    )
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_breaking: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # SEO
    meta_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    meta_description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    og_image_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    canonical_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    # Stats
    view_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    reading_time_minutes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    author = relationship("User", back_populates="articles", foreign_keys=[author_id])
    category = relationship("Category", back_populates="articles")
    tags = relationship("Tag", secondary=article_tags, back_populates="articles")

    __table_args__ = (
        Index("ix_articles_status_published_at", "status", "published_at"),
        Index("ix_articles_category_status_published", "category_id", "status", "published_at"),
        Index("ix_articles_source_created", "source", "created_at"),
    )
