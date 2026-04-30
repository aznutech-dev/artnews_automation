"""Bootstrap CLI.

Usage:
    python -m app.bootstrap create-admin --email <e> --password <p> --name <n>
    python -m app.bootstrap list-users
"""
import argparse
import asyncio
import sys

from sqlalchemy import select

from app.core.db import SessionLocal
from app.core.security import hash_password
from app.models.user import User, UserRole


async def create_admin(email: str, password: str, name: str) -> int:
    async with SessionLocal() as db:
        existing = await db.execute(select(User).where(User.email == email.lower()))
        if existing.scalar_one_or_none():
            print(f"user already exists: {email}", file=sys.stderr)
            return 1
        user = User(
            email=email.lower(),
            password_hash=hash_password(password),
            full_name=name,
            role=UserRole.admin,
            is_active=True,
        )
        db.add(user)
        await db.commit()
        print(f"created admin: {email} ({user.id})")
        return 0


async def list_users() -> int:
    async with SessionLocal() as db:
        rows = (await db.execute(select(User).order_by(User.created_at))).scalars().all()
        if not rows:
            print("(no users)")
            return 0
        for u in rows:
            print(f"{u.id}  {u.role.value:<8} {u.email}  {u.full_name}  active={u.is_active}")
        return 0


def main() -> None:
    parser = argparse.ArgumentParser(prog="bootstrap")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_create = sub.add_parser("create-admin", help="create the first admin user")
    p_create.add_argument("--email", required=True)
    p_create.add_argument("--password", required=True)
    p_create.add_argument("--name", required=True)

    sub.add_parser("list-users", help="list all users")

    args = parser.parse_args()
    if args.cmd == "create-admin":
        rc = asyncio.run(create_admin(args.email, args.password, args.name))
    elif args.cmd == "list-users":
        rc = asyncio.run(list_users())
    else:
        parser.print_help()
        rc = 1
    sys.exit(rc)


if __name__ == "__main__":
    main()
