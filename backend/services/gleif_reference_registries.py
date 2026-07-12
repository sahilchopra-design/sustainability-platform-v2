"""
GLEIF Reference Registries — entity-legal-forms / registration-authorities /
jurisdictions decoder cache.
============================================================================

`entity_lei.legal_form_code` and `entity_lei.registration_authority_id` are
opaque GLEIF codes (e.g. legal_form_code="XTIQ", registration_authority_id=
"RA000598"). `legal_form_name` is only populated by GLEIF itself for
non-standard ("other") legal forms -- for standard forms it's null, because
decoding the code requires a separate lookup against the ELF registry that
the ingester never performed. This module does that decoding.

Caching idiom: mirrors the module-level TTL dict + threading.Lock pattern
already used in this codebase for external-API caching -- see
api/v1/routes/gleif_graph.py (`_cache` / `_cache_lock` / `_CACHE_TTL` /
`_cached_get`) and api/v1/routes/fred_spreads.py (`_cache_get` / `_cache_put`).
Both were read before writing this module; this file follows the same
"module-level dict keyed by cache name, guarded by a Lock, TTL-stamped"
convention rather than introducing a new caching approach.

Design choice -- FULL registry fetch, not a DB-derived subset:
  Verified live 2026-07-05: `SELECT count(*) FROM entity_lei` = 0 in this
  environment's database -- the weekly bulk ingester has never successfully
  populated a row here. A "only decode codes already seen in entity_lei"
  approach would therefore decode nothing at all right now, and would also
  need a DB round-trip on every cache warm. The three registries are small
  and bounded (~3,599 entity-legal-forms / ~1,071 registration-authorities /
  ~5,296 jurisdictions => ~51 total paginated requests at page[size]=200,
  once per 24h TTL window), so fetching all of each in full is both more
  practical and strictly more useful (works for any future code, not just
  ones already cached locally).

Exposes:
  decode_legal_form(code)            -> {code, name, country} | None
  decode_registration_authority(id)  -> {id, name, jurisdiction} | None
  decode_jurisdiction(code)          -> name (str) | None
"""

from __future__ import annotations

import threading
import time
from typing import Any, Dict, List, Optional, Tuple

import requests

GLEIF_BASE = "https://api.gleif.org/api/v1"
_HEADERS = {"Accept": "application/vnd.api+json"}
_TIMEOUT = 30           # seconds per upstream page request
_REGISTRY_TTL = 24 * 3600  # 24h -- ELF/RA/jurisdiction code lists change rarely
_PAGE_SIZE = 200        # GLEIF max page size

# name -> (expires_at, {code_or_id: attributes_dict})
_registry_cache: Dict[str, Tuple[float, Dict[str, dict]]] = {}
_registry_lock = threading.Lock()


def _fetch_all_pages(path: str) -> List[dict]:
    """Paginate through a GLEIF code-list endpoint, collecting every page."""
    items: List[dict] = []
    page = 1
    while True:
        resp = requests.get(
            f"{GLEIF_BASE}{path}",
            params={"page[size]": _PAGE_SIZE, "page[number]": page},
            headers=_HEADERS,
            timeout=_TIMEOUT,
        )
        resp.raise_for_status()
        data = resp.json()
        batch = data.get("data", []) or []
        items.extend(batch)
        links = data.get("links", {}) or {}
        if not links.get("next") or not batch:
            break
        page += 1
    return items


def _load_registry(name: str, path: str) -> Dict[str, dict]:
    """Return the cached {id: attributes} index for a registry, fetching (and
    re-caching for _REGISTRY_TTL) on first use or after expiry."""
    now = time.time()
    with _registry_lock:
        hit = _registry_cache.get(name)
        if hit and hit[0] > now:
            return hit[1]

    raw = _fetch_all_pages(path)
    indexed = {r.get("id"): (r.get("attributes") or {}) for r in raw if r.get("id")}

    with _registry_lock:
        _registry_cache[name] = (now + _REGISTRY_TTL, indexed)
    return indexed


def _legal_forms() -> Dict[str, dict]:
    return _load_registry("entity-legal-forms", "/entity-legal-forms")


def _registration_authorities() -> Dict[str, dict]:
    return _load_registry("registration-authorities", "/registration-authorities")


def _jurisdictions() -> Dict[str, dict]:
    return _load_registry("jurisdictions", "/jurisdictions")


def decode_legal_form(code: Optional[str]) -> Optional[dict]:
    """
    {code, name, country} for a GLEIF Entity Legal Form (ELF) code.
    Returns {code, name: None, country: None} if the code is set but unknown
    to the registry (rather than raising), and None if code is blank.
    """
    if not code:
        return None
    attrs = _legal_forms().get(code)
    if not attrs:
        return {"code": code, "name": None, "country": None}
    names = attrs.get("names") or []
    en = next((n for n in names if (n.get("languageCode") or "").lower() == "en"), None)
    name = (en or names[0]).get("localName") if names else None
    return {"code": code, "name": name, "country": attrs.get("country")}


def decode_registration_authority(ra_id: Optional[str]) -> Optional[dict]:
    """{id, name, jurisdiction} for a GLEIF Registration Authority (RA) code."""
    if not ra_id:
        return None
    attrs = _registration_authorities().get(ra_id)
    if not attrs:
        return {"id": ra_id, "name": None, "jurisdiction": None}
    name = (
        attrs.get("internationalName")
        or attrs.get("localName")
        or attrs.get("internationalOrganizationName")
        or attrs.get("localOrganizationName")
    )
    jurisdictions = attrs.get("jurisdictions") or []
    jurisdiction = jurisdictions[0].get("country") if jurisdictions else None
    return {"id": ra_id, "name": name, "jurisdiction": jurisdiction}


def decode_jurisdiction(code: Optional[str]) -> Optional[str]:
    """Human-readable jurisdiction name for a GLEIF jurisdiction code."""
    if not code:
        return None
    attrs = _jurisdictions().get(code)
    return attrs.get("name") if attrs else None
