# API — usaupdatenews.com

FastAPI service for usaupdatenews.com.

## Local dev (without Docker)
```bash
cd api
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # edit values
alembic revision --autogenerate -m "initial"
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

Visit http://localhost:8000/docs

## First-run

```bash
alembic upgrade head
python -m app.bootstrap create-admin --email you@example.com --password '...' --name 'Your Name'
```

## Endpoints (current)
**Public**
- `GET  /api/health`
- `GET  /api/articles`               — published list (filters: category_slug, featured)
- `GET  /api/articles/{slug}`        — published detail
- `GET  /api/categories`             — list all categories

**Auth (JWT)**
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET  /api/me`

**Admin (JWT)**
- `GET    /api/admin/articles`                  (filters: status, source, q)
- `GET    /api/admin/articles/{id}`
- `POST   /api/admin/articles`
- `PATCH  /api/admin/articles/{id}`
- `POST   /api/admin/articles/{id}/publish`
- `POST   /api/admin/articles/{id}/unpublish`
- `DELETE /api/admin/articles/{id}`
- `GET    /api/admin/articles/_/stats`           — counts by status
- `GET/POST/PATCH/DELETE /api/admin/categories`
- `GET/POST /api/admin/api-keys`                 — admin role required
- `POST /api/admin/api-keys/{id}/revoke`
- `DELETE /api/admin/api-keys/{id}`
- `POST /api/media/upload`                       — multipart, image only

**Agent (X-API-Key)**
- `POST /api/agent/articles`         — forced status=draft, source=agent
- `POST /api/media/agent-upload`     — image upload

## Auth
- **Admin**: `Authorization: Bearer <jwt>` (login → JWT pair)
- **Agent**: `X-API-Key: usnews_...` (created in admin, scope `articles:write`)

## Migrations
- `alembic revision --autogenerate -m "..."` to generate
- `alembic upgrade head` to apply
- Review every generated migration before committing
