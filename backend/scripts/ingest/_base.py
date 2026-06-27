"""Shared helpers for Tier-1 reference-data ingesters.

Every ingester is idempotent (replace-by-source_key) and stdlib-only (no pandas —
the local numpy/scipy is broken; we use csv/json/urllib). Run one with:
    python backend/scripts/ingest/owid_co2.py
or all of them:
    python backend/scripts/ingest/run_all.py
"""
import os
import sys
from datetime import datetime, timezone

# make `db` importable when run as a script
_BACKEND = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if _BACKEND not in sys.path:
    sys.path.insert(0, _BACKEND)

from db.base import SessionLocal, engine  # noqa: E402
from db.models.reference_data import (  # noqa: E402
    ReferenceDataSource, ReferenceDataPoint, ReferenceDataRecord,
)

def _resolve_data_dir():
    """The backend may run from a mirrored copy (sp-tmp) while the data files live
    in the Documents tree — try known candidates and pick the one that exists."""
    candidates = [
        os.environ.get("REF_DATA_DIR"),
        os.path.join(_BACKEND, "..", "frontend", "src", "data"),
        r"C:\Users\SahilChopra\Documents\Risk Analytics\frontend\src\data",
    ]
    for c in candidates:
        if c and os.path.isdir(c) and os.path.exists(os.path.join(c, "owid-co2-data.csv")):
            return c
    # fall back to the relative guess (will error clearly if files are absent)
    return os.path.join(_BACKEND, "..", "frontend", "src", "data")


DATA_DIR = _resolve_data_dir()  # local authoritative files


def ensure_tables():
    """Create the reference-data tables if migrations haven't been run."""
    for m in (ReferenceDataSource, ReferenceDataPoint, ReferenceDataRecord):
        m.__table__.create(bind=engine, checkfirst=True)


def _register(db, source_key, count, **meta):
    row = db.query(ReferenceDataSource).filter(ReferenceDataSource.source_key == source_key).first()
    fields = dict(
        name=meta.get("name"), provider=meta.get("provider"), license=meta.get("license"),
        url=meta.get("url"), shape=meta.get("shape"), cadence=meta.get("cadence"),
        row_count=count, last_ingested_at=datetime.now(timezone.utc), status="loaded",
        meta=meta.get("meta") or {},
    )
    if row:
        for k, v in fields.items():
            setattr(row, k, v)
    else:
        db.add(ReferenceDataSource(source_key=source_key, **fields))
    db.commit()


def _bulk(db, Model, rows, source_key, batch=2000):
    db.query(Model).filter(Model.source_key == source_key).delete()
    db.commit()
    total = 0
    buf = []
    for r in rows:
        r = dict(r); r["source_key"] = source_key
        buf.append(r)
        if len(buf) >= batch:
            db.bulk_insert_mappings(Model, buf); db.commit()
            total += len(buf); buf = []
    if buf:
        db.bulk_insert_mappings(Model, buf); db.commit(); total += len(buf)
    return total


def _clip(rows, limits):
    """Truncate string fields to their column limits so a long value can't abort the batch."""
    for r in rows:
        r = dict(r)
        for field, n in limits.items():
            v = r.get(field)
            if isinstance(v, str) and len(v) > n:
                r[field] = v[:n]
        yield r


_POINT_LIMITS = {"entity_code": 32, "entity_name": 200, "metric": 80, "unit": 40}
_RECORD_LIMITS = {"ref": 120, "name": 400, "category": 120, "country": 120}


def load_points(source_key, rows, **meta):
    """rows: iterable of dict(entity_code, entity_name, year, metric, value, unit)."""
    ensure_tables()
    db = SessionLocal()
    try:
        n = _bulk(db, ReferenceDataPoint, _clip(rows, _POINT_LIMITS), source_key)
        _register(db, source_key, n, shape="points", **meta)
        print(f"[OK] {source_key}: {n} points")
        return n
    finally:
        db.close()


def load_records(source_key, rows, **meta):
    """rows: iterable of dict(ref, name, category, country, payload)."""
    ensure_tables()
    db = SessionLocal()
    try:
        n = _bulk(db, ReferenceDataRecord, _clip(rows, _RECORD_LIMITS), source_key)
        _register(db, source_key, n, shape="records", **meta)
        print(f"[OK] {source_key}: {n} records")
        return n
    finally:
        db.close()


def to_float(v):
    try:
        if v is None or v == "":
            return None
        return float(v)
    except (TypeError, ValueError):
        return None


# ── DME Supabase (project ynxmxgjdivriakhxxptk) PostgREST access ──────────────
import json as _json          # noqa: E402
import urllib.request as _ur  # noqa: E402
import urllib.parse as _up    # noqa: E402

DME_BASE = os.environ.get("DME_SUPABASE_URL", "https://ynxmxgjdivriakhxxptk.supabase.co") + "/rest/v1"
# Key is read from the environment ONLY — never hardcode a credential here.
# Before running a DME ingester:  export DME_SUPABASE_KEY=<anon-or-service-role key>
DME_KEY = os.environ.get("DME_SUPABASE_KEY", "")


def rest_fetch_all(table, select="*", page=1000):
    """Page through a DME PostgREST table with offset/limit."""
    if not DME_KEY:
        raise RuntimeError("DME_SUPABASE_KEY env var is not set — export it before running DME ingesters.")
    out, offset = [], 0
    while True:
        qs = _up.urlencode({"select": select, "limit": page, "offset": offset})
        req = _ur.Request(f"{DME_BASE}/{table}?{qs}",
                          headers={"apikey": DME_KEY, "Authorization": f"Bearer {DME_KEY}"})
        with _ur.urlopen(req, timeout=60) as resp:
            batch = _json.loads(resp.read().decode())
        out.extend(batch)
        if len(batch) < page:
            break
        offset += page
    return out
