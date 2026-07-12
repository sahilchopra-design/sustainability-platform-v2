"""
API Routes: Module Nav backend (command palette / sector sidebar / pinned+recent / connections)
=================================================================================================
Backend half of the smarter-nav shell. Two authenticated per-user tables plus two
public, in-process-cached lookups sourced from the Module Atlas (docs/module_atlas/).

GET    /api/v1/module-nav/favorites             — current user's pinned modules (auth required)
POST   /api/v1/module-nav/favorites             — pin a module {module_path}      (idempotent)
DELETE /api/v1/module-nav/favorites/{module_path} — unpin a module                (idempotent)
GET    /api/v1/module-nav/recents?limit=10      — current user's most-recently-visited modules
POST   /api/v1/module-nav/recents               — record a visit {module_path}    (upsert)
GET    /api/v1/module-nav/sectors               — PUBLIC: module_id -> sector map + display order
GET    /api/v1/module-nav/connections/{module_id} — PUBLIC: up to 6 related modules + why
"""
from __future__ import annotations

import json
from collections import Counter
from functools import lru_cache
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from db.base import get_db
from db.models.portfolio_pg import UserPG
from db.models.module_nav import UserModuleFavoritePG, UserModuleRecentPG
from api.dependencies import get_current_user

router = APIRouter(prefix="/api/v1/module-nav", tags=["module-nav"])

# backend/api/v1/routes/module_nav.py -> parents[3] == backend/, parents[4] == repo root.
# IMPORTANT: use .absolute() here, NOT .resolve() -- in this environment `backend/` is
# an NTFS junction, and .resolve()/realpath dereferences it to its physical target,
# which would silently break the ".." walk up to the sibling docs/ folder. .absolute()
# keeps the logical path intact so the relative parents[] math lands in the real repo.
_REPO_ROOT = Path(__file__).absolute().parents[4]
_ATLAS_DIR = _REPO_ROOT / "docs" / "module_atlas"
_MODULE_TAGS_FILE = _ATLAS_DIR / "module_tags.json"
_ATLAS_FILE = _ATLAS_DIR / "atlas.json"

_TOP_SECTOR_COUNT = 15
_MAX_CONNECTIONS = 6

# via-entry noise tokens that are import/ORM-plumbing artifacts, not real table names
_NOISE_TABLE_NAMES = {"db", "exc", "sqlalchemy", "dataclasses", "session", "conn", "cursor", "base", "sa", "engine"}


@lru_cache(maxsize=1)
def _load_module_tags() -> dict:
    """Load and cache docs/module_atlas/module_tags.json (static at runtime)."""
    if not _MODULE_TAGS_FILE.exists():
        raise FileNotFoundError(f"module_tags.json not found: {_MODULE_TAGS_FILE}")
    with open(_MODULE_TAGS_FILE, "r", encoding="utf-8") as fh:
        return json.load(fh)


@lru_cache(maxsize=1)
def _load_atlas() -> dict:
    """Load and cache docs/module_atlas/atlas.json (static at runtime)."""
    if not _ATLAS_FILE.exists():
        raise FileNotFoundError(f"atlas.json not found: {_ATLAS_FILE}")
    with open(_ATLAS_FILE, "r", encoding="utf-8") as fh:
        return json.load(fh)


def _friendly_label(module_id: str, atlas: dict) -> str:
    """Best-effort display name for a module_id: atlas title, else title-cased id."""
    entry = atlas.get(module_id)
    if entry and entry.get("title"):
        return entry["title"]
    return module_id.replace("-", " ").replace("_", " ").title()


def _summarize_via(via: list) -> str:
    """Turn an interconnection's raw `via` list (['engine:x', 'table:y', ...]) into a
    short human string. Engines are the strongest/most specific signal; fall back to
    a named table if one looks meaningful, else a generic 'shared data'."""
    engine_names = [v.split(":", 1)[1] for v in via if isinstance(v, str) and v.startswith("engine:")]
    if engine_names:
        return f"shared engine: {engine_names[0]}"

    table_names = [v.split(":", 1)[1] for v in via if isinstance(v, str) and v.startswith("table:")]
    meaningful = [t for t in table_names if t.lower() not in _NOISE_TABLE_NAMES and "_" in t]
    if meaningful:
        return f"shared data: {meaningful[0]}"
    if table_names:
        return "shared data"
    return "related module"


# ── Favorites (auth required) ────────────────────────────────────────────────

class ModulePathBody(BaseModel):
    module_path: str


def _normalize_module_path(module_path: str) -> str:
    """Ensure a leading slash so POST-stored paths and DELETE path-params (which
    the URL router strips the leading slash from) always compare equal."""
    module_path = module_path.strip()
    return module_path if module_path.startswith("/") else f"/{module_path}"


@router.get("/favorites")
def list_favorites(user: UserPG = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = (
        db.query(UserModuleFavoritePG)
        .filter(UserModuleFavoritePG.user_id == user.user_id)
        .order_by(UserModuleFavoritePG.created_at.desc())
        .all()
    )
    return [r.as_dict() for r in rows]


@router.post("/favorites")
def add_favorite(
    body: ModulePathBody,
    user: UserPG = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    module_path = _normalize_module_path(body.module_path)
    existing = (
        db.query(UserModuleFavoritePG)
        .filter(UserModuleFavoritePG.user_id == user.user_id, UserModuleFavoritePG.module_path == module_path)
        .first()
    )
    if existing:
        return existing.as_dict()  # idempotent — already favorited

    row = UserModuleFavoritePG(user_id=user.user_id, module_path=module_path)
    db.add(row)
    try:
        db.commit()
    except IntegrityError:
        # lost a race with a concurrent identical insert -- fine, idempotent either way
        db.rollback()
        existing = (
            db.query(UserModuleFavoritePG)
            .filter(UserModuleFavoritePG.user_id == user.user_id, UserModuleFavoritePG.module_path == module_path)
            .first()
        )
        return existing.as_dict() if existing else {"module_path": module_path}
    db.refresh(row)
    return row.as_dict()


@router.delete("/favorites/{module_path:path}")
def remove_favorite(
    module_path: str,
    user: UserPG = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    module_path = _normalize_module_path(module_path)
    row = (
        db.query(UserModuleFavoritePG)
        .filter(UserModuleFavoritePG.user_id == user.user_id, UserModuleFavoritePG.module_path == module_path)
        .first()
    )
    if row:
        db.delete(row)
        db.commit()
    return {"module_path": module_path, "deleted": True}


# ── Recents (auth required) ──────────────────────────────────────────────────

@router.get("/recents")
def list_recents(
    limit: int = Query(10, ge=1, le=100),
    user: UserPG = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(UserModuleRecentPG)
        .filter(UserModuleRecentPG.user_id == user.user_id)
        .order_by(UserModuleRecentPG.visited_at.desc())
        .limit(limit)
        .all()
    )
    return [r.as_dict() for r in rows]


@router.post("/recents")
def record_visit(
    body: ModulePathBody,
    user: UserPG = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upsert: same user+path bumps visited_at rather than inserting a duplicate row."""
    module_path = _normalize_module_path(body.module_path)
    stmt = pg_insert(UserModuleRecentPG.__table__).values(
        user_id=user.user_id,
        module_path=module_path,
        visited_at=func.now(),
    )
    stmt = stmt.on_conflict_do_update(
        index_elements=["user_id", "module_path"],
        set_={"visited_at": func.now()},
    )
    db.execute(stmt)
    db.commit()

    row = (
        db.query(UserModuleRecentPG)
        .filter(UserModuleRecentPG.user_id == user.user_id, UserModuleRecentPG.module_path == module_path)
        .first()
    )
    return row.as_dict()


# ── Sectors (public) ─────────────────────────────────────────────────────────

@router.get("/sectors")
def get_sectors():
    """Public: module_id -> sector map, plus the ~15 largest sectors for display order."""
    try:
        tags = _load_module_tags()
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))

    module_sectors = {mid: info.get("sector", "Cross-Cutting / Other") for mid, info in tags.items()}
    counts = Counter(module_sectors.values())
    sector_order = [sector for sector, _ in counts.most_common(_TOP_SECTOR_COUNT)]

    return {"module_sectors": module_sectors, "sector_order": sector_order}


# ── Connections (public) ─────────────────────────────────────────────────────

@router.get("/connections/{module_id}")
def get_connections(module_id: str):
    """Public: up to 6 related modules for `module_id`, with a short 'why' string.
    Gracefully 404s with an empty list for unindexed/new modules rather than erroring."""
    try:
        atlas = _load_atlas()
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))

    entry = atlas.get(module_id)
    if not entry:
        return JSONResponse(
            status_code=404,
            content={"module_id": module_id, "connections": []},
        )

    interconnections = entry.get("interconnections") or []
    connections = []
    for link in interconnections[:_MAX_CONNECTIONS]:
        connected_id = link.get("module")
        if not connected_id:
            continue
        connections.append({
            "module_id": connected_id,
            "label": _friendly_label(connected_id, atlas),
            "via_summary": _summarize_via(link.get("via") or []),
        })

    return {"module_id": module_id, "connections": connections}
