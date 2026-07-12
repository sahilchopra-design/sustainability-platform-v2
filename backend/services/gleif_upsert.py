"""
GLEIF just-in-time (JIT) fetch + upsert helpers.
=================================================

Shared by:
  - api/v1/routes/gleif_graph.py    (resolve-by-isin / resolve-by-bic endpoints)
  - services/entity_resolution_service.py  (live-GLEIF self-healing fallback)

The whole point of this module is to make a *single real GLEIF lookup*
immediately feed the local `entity_lei` golden-record cache table, instead
of the platform only ever seeing whatever the capped weekly blind-crawl
ingester (ingestion/gleif_ingester.py) happened to pull in.

Upsert SQL is NOT re-derived here -- it imports `ENTITY_LEI_UPSERT_SQL` and
reuses `GleifIngester.transform()`'s exact field-mapping from
ingestion/gleif_ingester.py, so the weekly bulk ingester and these JIT
single-record upserts can never drift apart on column list or
conflict-resolution semantics (see that module's docstring for the same
note from the other side).

The DB write functions accept either a SQLAlchemy `Session` or a raw
`Connection` -- both expose `.execute(stmt, params)` and `.commit()` under
SQLAlchemy 2.0 (this platform's pinned version), so callers in the FastAPI
route layer (which inject a `Session` via `Depends(get_db)`) and callers in
`entity_resolution_service.py` (which holds an `Engine` and opens plain
`Connection`s) can both use the same helper without an adapter.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Optional

import requests

from ingestion.gleif_ingester import ENTITY_LEI_UPSERT_SQL, GLEIF_API_BASE, GleifIngester

logger = logging.getLogger(__name__)

_HEADERS = {"Accept": "application/vnd.api+json"}
_TIMEOUT = 25


class GleifLiveFetchError(Exception):
    """Raised on upstream GLEIF failure during a JIT live fetch (not a 404/no-match)."""

    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(detail)


# ── Live fetch (uncached -- this path exists specifically to recover from a
#    cache miss, so it should always hit GLEIF live, not a stale TTL cache) ──

def fetch_lei_record_by_isin(isin: str) -> Optional[dict]:
    """Return the single raw lei-records resource matching filter[isin], or None."""
    try:
        resp = requests.get(
            f"{GLEIF_API_BASE}/lei-records",
            params={"filter[isin]": isin, "page[size]": 1},
            headers=_HEADERS,
            timeout=_TIMEOUT,
        )
        resp.raise_for_status()
    except requests.RequestException as exc:
        raise GleifLiveFetchError(f"GLEIF ISIN lookup failed: {exc}") from exc
    data = resp.json().get("data", []) or []
    return data[0] if data else None


def fetch_lei_record_by_bic(bic: str) -> Optional[dict]:
    """Return the single raw lei-records resource matching filter[bic], or None.

    NOTE (verified live 2026-07-05): GLEIF's bic filter requires the FULL BIC
    including branch/XXX suffix (e.g. "DEUTDEFFXXX", not "DEUTDEFF") -- an
    8-char bank-only BIC returns zero results even though it's a real BIC.
    """
    try:
        resp = requests.get(
            f"{GLEIF_API_BASE}/lei-records",
            params={"filter[bic]": bic, "page[size]": 1},
            headers=_HEADERS,
            timeout=_TIMEOUT,
        )
        resp.raise_for_status()
    except requests.RequestException as exc:
        raise GleifLiveFetchError(f"GLEIF BIC lookup failed: {exc}") from exc
    data = resp.json().get("data", []) or []
    return data[0] if data else None


def fetch_lei_record_by_lei(lei: str) -> Optional[dict]:
    """Return the single raw lei-records resource for an exact LEI, or None."""
    try:
        resp = requests.get(
            f"{GLEIF_API_BASE}/lei-records/{lei}",
            headers=_HEADERS,
            timeout=_TIMEOUT,
        )
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
    except requests.RequestException as exc:
        raise GleifLiveFetchError(f"GLEIF LEI lookup failed: {exc}") from exc
    return resp.json().get("data")


def fetch_fuzzy_completions(name: str, limit: int = 5) -> List[dict]:
    """
    Ranked name completions via GLEIF /fuzzycompletions?field=entity.legalName.
    Returns [{"value": str, "lei": str|None}, ...]. Chosen over /autocompletions
    for this fallback because fuzzycompletions consistently links every
    completion to an lei-records id (autocompletions sometimes returns bare
    free-text completions with no LEI relationship at all -- confirmed live
    2026-07-05, see gleif_graph.py's /typeahead docstring for the full A/B).
    """
    try:
        resp = requests.get(
            f"{GLEIF_API_BASE}/fuzzycompletions",
            params={"field": "entity.legalName", "q": name, "page[size]": limit},
            headers=_HEADERS,
            timeout=_TIMEOUT,
        )
        resp.raise_for_status()
    except requests.RequestException as exc:
        raise GleifLiveFetchError(f"GLEIF fuzzycompletions lookup failed: {exc}") from exc
    out = []
    for item in resp.json().get("data", []) or []:
        rel = (item.get("relationships") or {}).get("lei-records") or {}
        lei = (rel.get("data") or {}).get("id")
        out.append({"value": (item.get("attributes") or {}).get("value"), "lei": lei})
    return out


# ── Transform + upsert (the shared, drift-proof write path) ──────────────

def transform_gleif_record(raw_record: dict) -> Optional[Dict[str, Any]]:
    """
    Transform ONE raw GLEIF lei-records JSON:API resource into an entity_lei
    row dict, by delegating to GleifIngester.transform() so the JIT upsert
    path can never drift from the weekly bulk ingester's field mapping.
    Returns None if the record has no LEI or legal name (mirrors
    GleifIngester.validate()'s skip condition).
    """
    if not raw_record:
        return None
    rows = GleifIngester().transform([raw_record])
    return rows[0] if rows else None


def upsert_lei_record(conn_or_session: Any, raw_record: dict) -> Optional[Dict[str, Any]]:
    """
    Transform + upsert a single raw GLEIF lei-records resource into
    entity_lei using the exact same ON CONFLICT SQL as the bulk ingester
    (ENTITY_LEI_UPSERT_SQL, imported from ingestion/gleif_ingester.py).

    `conn_or_session` may be a SQLAlchemy Session (route layer, via
    Depends(get_db)) or a raw Connection (service layer, via Engine.connect())
    -- both support .execute(stmt, params) + .commit() under SQLAlchemy 2.0.

    Returns the row dict that was written, or None if the record couldn't be
    transformed (missing LEI/legal name).
    """
    row = transform_gleif_record(raw_record)
    if not row or not row.get("lei") or not row.get("legal_name"):
        return None

    params = dict(row)
    for jsonb_col in ("other_names", "registered_address", "headquarters_address"):
        if params.get(jsonb_col) is not None:
            params[jsonb_col] = json.dumps(params[jsonb_col])

    conn_or_session.execute(ENTITY_LEI_UPSERT_SQL, params)
    conn_or_session.commit()
    return row


# ── Convenience combos (fetch + upsert in one call) ───────────────────────

def resolve_and_upsert_by_isin(conn_or_session: Any, isin: str) -> Optional[Dict[str, Any]]:
    """Live GLEIF ISIN lookup + immediate upsert into entity_lei. None if no match."""
    raw = fetch_lei_record_by_isin(isin)
    if not raw:
        return None
    return upsert_lei_record(conn_or_session, raw)


def resolve_and_upsert_by_bic(conn_or_session: Any, bic: str) -> Optional[Dict[str, Any]]:
    """Live GLEIF BIC lookup + immediate upsert into entity_lei. None if no match."""
    raw = fetch_lei_record_by_bic(bic)
    if not raw:
        return None
    return upsert_lei_record(conn_or_session, raw)


def resolve_and_upsert_by_name(conn_or_session: Any, name: str) -> Optional[Dict[str, Any]]:
    """
    Live GLEIF name resolution: fuzzycompletions -> top-ranked LEI ->
    full lei-records fetch -> upsert into entity_lei. None if no completion
    carries an LEI link.
    """
    completions = fetch_fuzzy_completions(name, limit=5)
    top_lei = next((c["lei"] for c in completions if c.get("lei")), None)
    if not top_lei:
        return None
    raw = fetch_lei_record_by_lei(top_lei)
    if not raw:
        return None
    return upsert_lei_record(conn_or_session, raw)
