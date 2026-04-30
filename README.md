# usaupdatenews.com

News / magazine site. UI inspired by https://ventmagazines.co.uk/.

## Stack
- **api/**   FastAPI + SQLAlchemy (async) + PostgreSQL (native on host)
- **web/**   Next.js 15 (App Router, standalone) — public site
- **admin/** Next.js 15 (App Router, standalone) — CMS / moderation
- **Reverse proxy**: Traefik v3 (shared, in `/root/shared/`)
- **TLS**: Let's Encrypt via Traefik

Full plans live in [`specs/`](specs/) (gitignored).

## Layout
```
.
├── api/          FastAPI service
├── web/          Next.js public site
├── admin/        Next.js admin
├── docker-compose.yml
├── .env.example  (top-level reference; real env files per service)
└── specs/        (local planning docs, gitignored)
```

## Local dev — without Docker

Run Postgres natively, then:

```bash
# api
cd api && python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # fill in real values
alembic revision --autogenerate -m "initial"
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# web (in another terminal)
cd web && npm install
cp .env.example .env.local
npm run dev   # http://localhost:3000

# admin (in another terminal)
cd admin && npm install
cp .env.example .env.local
npm run dev   # http://localhost:3001
```

## First-run setup (after services are up)

```bash
# Inside the api container (or api venv locally):
alembic upgrade head
python -m app.bootstrap create-admin --email you@example.com --password '...' --name 'You'
```

Then sign in at `https://admin.usaupdatenews.com`, create:
1. A few categories
2. An API key (Settings → API Keys) — copy the raw key, hand to your local agent
3. First article (manually, or post via the agent)

## Deploy
See `specs/06-deployment.md`. TL;DR:
```bash
ssh root@<vps>
cd /root/projects/usaupdatenews
docker compose up -d --build
docker exec -it usaupdatenews_api alembic upgrade head
docker exec -it usaupdatenews_api python -m app.bootstrap create-admin --email ... --password ... --name ...
```
Cloudflare DNS records must be **grey-cloud (DNS only)** for the Traefik TLS-ALPN challenge to succeed.
