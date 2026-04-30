"""Media upload + serve. Used by both admin (JWT) and agent (X-API-Key)."""
import io
import uuid
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from PIL import Image, ImageOps
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.deps import get_api_key, get_current_user
from app.models.api_key import ApiKey
from app.models.media import Media
from app.models.user import User

router = APIRouter(prefix="/media", tags=["media"])

MEDIA_DIR = Path("/app/media")
MEDIA_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_MIMES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


async def _save_upload(
    file: UploadFile, db: AsyncSession, *, user_id: uuid.UUID | None, api_key_id: uuid.UUID | None
) -> Media:
    if file.content_type not in ALLOWED_MIMES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"unsupported mime: {file.content_type}")

    raw = await file.read()
    if len(raw) > MAX_SIZE_BYTES:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "file too large")

    try:
        img = Image.open(io.BytesIO(raw))
        img.verify()  # validate structure
        img = Image.open(io.BytesIO(raw))  # reopen because verify() exhausts
        img = ImageOps.exif_transpose(img)
    except Exception as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "invalid image") from e

    ext = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif"}[
        file.content_type
    ]
    new_id = uuid.uuid4()
    filename = f"{new_id}.{ext}"
    out_path = MEDIA_DIR / filename

    # Re-encode (strips EXIF / unsafe payload)
    save_format = "JPEG" if ext == "jpg" else ext.upper()
    save_kwargs: dict = {}
    if save_format == "JPEG":
        save_kwargs["quality"] = 85
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
    img.save(out_path, format=save_format, **save_kwargs)

    media = Media(
        id=new_id,
        filename=filename,
        mime_type=file.content_type,
        size_bytes=out_path.stat().st_size,
        url=f"/api/media/{filename}",
        width=img.width,
        height=img.height,
        uploaded_by=user_id,
        uploaded_by_api_key=api_key_id,
    )
    db.add(media)
    await db.commit()
    await db.refresh(media)
    return media


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_admin(
    file: Annotated[UploadFile, File()],
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    media = await _save_upload(file, db, user_id=user.id, api_key_id=None)
    return {"id": str(media.id), "url": media.url, "width": media.width, "height": media.height}


@router.post("/agent-upload", status_code=status.HTTP_201_CREATED)
async def upload_agent(
    file: Annotated[UploadFile, File()],
    api_key: Annotated[ApiKey, Depends(get_api_key)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    media = await _save_upload(file, db, user_id=None, api_key_id=api_key.id)
    return {"id": str(media.id), "url": media.url, "width": media.width, "height": media.height}


@router.get("/{filename}")
async def serve_media(filename: str):
    # only allow simple uuid-like filenames (no path traversal)
    if "/" in filename or "\\" in filename or ".." in filename:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "bad filename")
    path = MEDIA_DIR / filename
    if not path.is_file():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "not found")
    return FileResponse(path)
