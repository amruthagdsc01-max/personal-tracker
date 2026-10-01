"""ezze API: accounts + per-user progress storage, and serves the built frontend.

Run locally:   uvicorn server.app:app --reload --port 8000
Production:    set SECRET_KEY (and optionally DATABASE_URL for PostgreSQL).
"""
import hashlib
import hmac
import json
import logging
import os
import re
import secrets
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from pathlib import Path

import jwt
from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from sqlalchemy import DateTime, Integer, String, Text, create_engine, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker

log = logging.getLogger("ezze")

# ---------------------------------------------------------------- config
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ezze.db")
if DATABASE_URL.startswith("postgres://"):  # some hosts still hand out the old scheme
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    SECRET_KEY = secrets.token_urlsafe(48)
    log.warning("SECRET_KEY is not set: using a random key. Everyone is logged out on each restart. Set it in production.")
TOKEN_DAYS = int(os.getenv("TOKEN_DAYS", "30"))
MAX_STATE_BYTES = 2 * 1024 * 1024
ALLOW_SIGNUP = os.getenv("ALLOW_SIGNUP", "true").lower() != "false"
DIST = Path(__file__).resolve().parent.parent / "dist"

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(80), default="")
    password_hash: Mapped[str] = mapped_column(String(300))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class Progress(Base):
    __tablename__ = "progress"
    user_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    data: Mapped[str] = mapped_column(Text)
    rev: Mapped[int] = mapped_column(Integer, default=1)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


Base.metadata.create_all(engine)


def get_db():
    with SessionLocal() as db:
        yield db


# ---------------------------------------------------------------- security helpers
def hash_password(pw: str) -> str:
    salt = secrets.token_bytes(16)
    h = hashlib.scrypt(pw.encode(), salt=salt, n=2**14, r=8, p=1, dklen=32)
    return f"scrypt${salt.hex()}${h.hex()}"


def verify_password(pw: str, stored: str) -> bool:
    try:
        _, salt, h = stored.split("$")
        calc = hashlib.scrypt(pw.encode(), salt=bytes.fromhex(salt), n=2**14, r=8, p=1, dklen=32)
        return hmac.compare_digest(calc.hex(), h)
    except Exception:
        return False


def make_token(user_id: int) -> str:
    exp = datetime.now(timezone.utc) + timedelta(days=TOKEN_DAYS)
    return jwt.encode({"sub": str(user_id), "exp": exp}, SECRET_KEY, algorithm="HS256")


def current_user(authorization: str | None = Header(default=None), db: Session = Depends(get_db)) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Not logged in")
    try:
        payload = jwt.decode(authorization[7:], SECRET_KEY, algorithms=["HS256"])
        user = db.get(User, int(payload["sub"]))
    except Exception:
        raise HTTPException(401, "Session expired — please log in again") from None
    if not user:
        raise HTTPException(401, "Account not found")
    return user


# very small in-memory throttle against password guessing (per process)
_attempts: dict[str, deque] = defaultdict(deque)


def throttle(key: str, limit: int = 10, window: int = 900):
    now = time.time()
    q = _attempts[key]
    while q and now - q[0] > window:
        q.popleft()
    if len(q) >= limit:
        raise HTTPException(429, "Too many attempts. Try again in a few minutes.")
    q.append(now)


EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class Credentials(BaseModel):
    email: str = Field(max_length=255)
    password: str = Field(min_length=1, max_length=200)
    name: str = Field(default="", max_length=80)


class StateIn(BaseModel):
    data: dict
    base_rev: int | None = None


# ---------------------------------------------------------------- app
app = FastAPI(title="ezze API", docs_url="/api/docs", openapi_url="/api/openapi.json")


def auth_payload(user: User) -> dict:
    return {"token": make_token(user.id), "user": {"id": user.id, "email": user.email, "name": user.name}}


@app.get("/api/health")
def health():
    return {"ok": True}


@app.post("/api/auth/register", status_code=201)
def register(body: Credentials, request: Request, db: Session = Depends(get_db)):
    if not ALLOW_SIGNUP:
        raise HTTPException(403, "Sign-ups are closed")
    throttle(f"reg:{request.client.host if request.client else '?'}", limit=20)
    email = body.email.strip().lower()
    if not EMAIL_RE.match(email):
        raise HTTPException(422, "Enter a valid email address")
    if len(body.password) < 6:
        raise HTTPException(422, "Password must be at least 6 characters")
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(409, "An account with this email already exists")
    user = User(email=email, name=body.name.strip(), password_hash=hash_password(body.password))
    db.add(user)
    db.commit()
    return auth_payload(user)


@app.post("/api/auth/login")
def login(body: Credentials, request: Request, db: Session = Depends(get_db)):
    email = body.email.strip().lower()
    throttle(f"login:{request.client.host if request.client else '?'}:{email}")
    user = db.scalar(select(User).where(User.email == email))
    # same message for unknown email and wrong password
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "Incorrect email or password")
    return auth_payload(user)


@app.get("/api/me")
def me(user: User = Depends(current_user)):
    return {"id": user.id, "email": user.email, "name": user.name}


@app.get("/api/state")
def get_state(user: User = Depends(current_user), db: Session = Depends(get_db)):
    row = db.get(Progress, user.id)
    if not row:
        return {"data": None, "rev": 0}
    return {"data": json.loads(row.data), "rev": row.rev, "updated_at": row.updated_at.isoformat()}


@app.put("/api/state")
def put_state(body: StateIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    raw = json.dumps(body.data, separators=(",", ":"))
    if len(raw.encode()) > MAX_STATE_BYTES:
        raise HTTPException(413, "Progress data is too large")
    row = db.get(Progress, user.id)
    if row is None:
        row = Progress(user_id=user.id, data=raw, rev=1)
        db.add(row)
    else:
        # optimistic concurrency: refuse to overwrite a newer copy saved from another device
        if body.base_rev is not None and body.base_rev != row.rev:
            raise HTTPException(409, detail={"message": "Newer data exists on the server", "rev": row.rev, "data": json.loads(row.data)})
        row.data = raw
        row.rev += 1
        row.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"rev": row.rev}


@app.delete("/api/account", status_code=204)
def delete_account(user: User = Depends(current_user), db: Session = Depends(get_db)):
    row = db.get(Progress, user.id)
    if row:
        db.delete(row)
    db.delete(user)
    db.commit()


# ---------------------------------------------------------------- frontend (production)
if DIST.exists():
    app.mount("/assets", StaticFiles(directory=DIST / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def spa(path: str):
        if path.startswith("api/"):
            raise HTTPException(404)
        f = (DIST / path).resolve()
        if path and f.is_file() and DIST in f.parents:
            return FileResponse(f)
        return FileResponse(DIST / "index.html")
