"""
UK EPC (Energy Performance Certificate) Register — access-method investigation
================================================================================
Prefix: /api/v1/uk-epc
Tags:   UK EPC Register

ACCESS-METHOD FINDING (investigated live 2026-07-05) — the research doc's
assumption needed correcting:

  The OLD domain epc.opendatacommunities.org 301-redirects to a NEW GOV.UK
  service: get-energy-performance-data.communities.gov.uk. This is NOT
  bulk-download-only — a live, documented REST query API still exists under
  a THIRD domain the web portal points to for API calls:

      https://api.get-energy-performance-data.communities.gov.uk

  Confirmed via the live "API technical documentation" pages under
  get-energy-performance-data.communities.gov.uk/api-technical-documentation/*:
    - GET /api/domestic/search?postcode=...&council[]=...&efficiency_rating[]=...
          &date_start=...&date_end=...&current_page=...&page_size=...
      (also /api/non-domestic/search, /api/display/search)
    - GET /api/certificate?certificate_number=...  (full record for one EPC/DEC)
    - Bulk full-load CSV/JSON downloads and a "search certificates that have
      changed" delta endpoint also exist for genuine bulk use-cases.

  AUTH IS THE PART THAT CHANGED, not the existence of the API: it no longer
  uses the old HTTP Basic (email + API key) scheme. Every request now needs
  a bearer token: "Authorization: Bearer <token>". The token is issued from
  a "my account" page ONLY after signing in via GOV.UK One Login on the web
  portal — there is no self-service email/password signup and no way to
  provision a token headlessly. Verified live (2026-07-05):
    curl .../api/domestic/search?postcode=SW1A+1AA  (no Authorization header)
        -> HTTP 403 "Access denied. Bad authentication header."
    same call with "Authorization: Bearer test123" (garbage token)
        -> HTTP 403 (same message) — confirms tokens are actually checked,
           not merely a presence check.
  Rate limit (documented): 6000 requests / 5 minutes per source IP.

  Because this session has no GOV.UK One Login account to mint a real bearer
  token, the live path below is implemented and wired (env var
  EPC_API_BEARER_TOKEN, following the FRED_API_KEY graceful-fallback pattern
  in backend/api/v1/routes/fred_spreads.py) but is UNTESTED against a real
  token. Field names for the per-certificate detail endpoint are taken from
  the published docs (snake_case, e.g. current_energy_efficiency_band) since
  we could not authenticate to observe a live payload — this is called out
  explicitly rather than presented as verified.

  Without a token, /certificates falls back to a small, clearly labeled
  seeded sample (mode="demo-seed") of 20 REAL England postcodes — these are
  postcodes we independently observed in real, live HM Land Registry Price
  Paid transactions for the Norwich (NR) area (see uk_land_registry.py) so
  the green-premium regression demo has genuine postcode overlap between the
  two sources. The EPC band/score/construction-age values attached to them
  are ILLUSTRATIVE, assigned by us from the property type/street character
  visible in the real transaction record (e.g. new-build-style close/drive
  addresses assigned newer construction bands and better ratings) — they are
  NOT independently verified against the real EPC register and must not be
  read as this platform's claim about those specific properties' actual
  certificates. Set EPC_API_BEARER_TOKEN to get real, verified data.
"""
from __future__ import annotations

import os
import threading
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import requests
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/api/v1/uk-epc", tags=["UK EPC Register"])

EPC_API_BASE = "https://api.get-energy-performance-data.communities.gov.uk"
EPC_BEARER_TOKEN_ENV = "EPC_API_BEARER_TOKEN"
_TIMEOUT = 30
_CACHE_TTL = 6 * 3600
_CACHE_MAX = 256

# EPC score -> band, standard RdSAP thresholds (current_energy_efficiency_score 1-100)
_BAND_THRESHOLDS = [
    (92, "A"), (81, "B"), (69, "C"), (55, "D"), (39, "E"), (21, "F"), (0, "G"),
]


def _score_to_band(score: float) -> str:
    for lo, band in _BAND_THRESHOLDS:
        if score >= lo:
            return band
    return "G"


# ---------------------------------------------------------------------------
# Seeded fallback — 20 REAL England postcodes independently observed in live
# HM Land Registry Price Paid transactions for the Norwich (NR) postcode area
# (fetched 2026-07-05; see uk_land_registry.py /transactions?town=NORWICH).
# EPC fields below are ILLUSTRATIVE placeholders, not verified live lookups —
# see module docstring. compiled/labeled per the vcm_registry.py convention.
# ---------------------------------------------------------------------------
SEED_PROVENANCE = {
    "kind": "illustrative seed (unverified against live EPC register)",
    "compiled": "2026-07-05",
    "postcode_source": (
        "Real postcodes independently observed in live HM Land Registry Price "
        "Paid transactions for Norwich, fetched 2026-07-05 (see /api/v1/uk-land-registry)."
    ),
    "epc_field_source": (
        "NOT sourced from the live EPC register (no GOV.UK One Login bearer token "
        "available in this environment). Band/score/construction-age values are "
        "illustrative placeholders assigned from the property type and street "
        "character in the real transaction record, for demo/wiring purposes only."
    ),
    "caveat": "Set EPC_API_BEARER_TOKEN for real, verified EPC data. Do not treat these as real certificates for the named addresses.",
    "live": False,
}

# (postcode, paon+street, property_type, construction_age_band, score, co2_tonnes_pa)
_SEED_ROWS = [
    ("NR9 4JL",  "29 ADMIRALS WALK",        "Semi-detached", "1996-2002", 74, 2.1),
    ("NR8 6GN",  "25 PEAKWELL CLOSE",       "Detached",      "2007 onwards", 84, 1.6),
    ("NR14 7HD", "6 THE OAKS",              "Semi-detached", "1991-1995", 68, 2.4),
    ("NR9 4RG",  "56 RECTORY GARDENS",      "Flat",          "1996-2002", 79, 1.2),
    ("NR14 8BT", "12 BIRCHFIELD GARDENS",   "Semi-detached", "2003-2007", 77, 2.0),
    ("NR11 6UR", "7 ETHEL TIPPLE DRIVE",    "Detached",      "2007 onwards", 86, 1.8),
    ("NR14 7SF", "28 BLIGH CLOSE",          "Detached",      "1996-2002", 72, 2.6),
    ("NR8 6RP",  "9 BEVERLEY WAY",          "Detached",      "1991-1995", 65, 3.0),
    ("NR13 5BN", "12 HEATHERWOOD CLOSE",    "Detached",      "1983-1990", 60, 3.4),
    ("NR15 2UG", "THE OLD GRANARY, CHURCH ROAD", "Detached", "before 1900", 42, 5.8),
    ("NR14 8TJ", "7 SCHOOL TERRACE",        "Terraced",      "1930-1949", 51, 3.1),
    ("NR8 6LU",  "50 HAVERSCROFT CLOSE",    "Detached",      "2003-2007", 80, 1.9),
    ("NR16 2AJ", "THE OLD SCHOOL, WATTON ROAD", "Detached",  "1900-1929", 44, 5.2),
    ("NR14 7LA", "120 THE STREET",          "Terraced",      "1930-1949", 53, 2.9),
    ("NR16 2QE", "SUNNYVIEW, KENNINGHALL ROAD", "Terraced",  "1950-1966", 58, 2.7),
    ("NR8 6YY",  "44 ARGYLL CRESCENT",      "Detached",      "1967-1975", 55, 3.3),
    ("NR13 3BS", "4 PETER AVENUE",          "Detached",      "1976-1982", 57, 3.2),
    ("NR10 5EN", "MUNECA, CROWN ROAD",      "Detached",      "1930-1949", 47, 4.6),
    ("NR16 1AB", "ELMINGTON, 100 BUNWELL STREET", "Detached","1950-1966", 54, 3.8),
    ("NR9 3JN",  "12 LONGVIEW",             "Detached",      "1991-1995", 66, 2.8),
]


def _seed_certificates(postcode: Optional[str]) -> List[dict]:
    rows = _SEED_ROWS
    if postcode:
        pc_norm = postcode.strip().upper().replace("  ", " ")
        rows = [r for r in rows if r[0] == pc_norm]
    out = []
    for pc, addr, ptype, band_age, score, co2 in rows:
        current_band = _score_to_band(score)
        potential_score = min(100, score + 14)
        out.append({
            "address": addr,
            "postcode": pc,
            "current_energy_rating": current_band,
            "current_energy_efficiency_score": score,
            "potential_energy_rating": _score_to_band(potential_score),
            "potential_energy_efficiency_score": potential_score,
            "co2_emissions_current": co2,
            "property_type": ptype,
            "construction_age_band": band_age,
        })
    return out


_cache: Dict[tuple, tuple] = {}
_cache_lock = threading.Lock()


def _cache_get(key: tuple) -> Optional[Any]:
    now = time.time()
    with _cache_lock:
        hit = _cache.get(key)
        if hit and hit[0] > now:
            return hit[1]
    return None


def _cache_put(key: tuple, value: Any) -> None:
    with _cache_lock:
        if len(_cache) >= _CACHE_MAX:
            _cache.clear()
        _cache[key] = (time.time() + _CACHE_TTL, value)


def _map_certificate_detail(raw: dict) -> dict:
    """Map the live /api/certificate detail payload onto our documented shape.

    Field names are taken from published docs, not observed live (see module
    docstring — no bearer token available to verify). We defensively probe a
    few plausible key-name variants so a real response has a decent chance of
    mapping correctly even if our guess of the exact casing is slightly off.
    """
    def pick(*names, default=None):
        for n in names:
            if n in raw and raw[n] is not None:
                return raw[n]
        return default

    addr_parts = [pick("address_line_1", "addressLine1"), pick("address_line_2", "addressLine2")]
    address = ", ".join(p for p in addr_parts if p) or pick("address")
    return {
        "address": address,
        "postcode": pick("postcode"),
        "current_energy_rating": pick("current_energy_efficiency_band", "currentEnergyEfficiencyBand", "current_energy_rating"),
        "current_energy_efficiency_score": pick("current_energy_efficiency", "current_energy_efficiency_score"),
        "potential_energy_rating": pick("potential_energy_efficiency_band", "potential_energy_rating"),
        "co2_emissions_current": pick("co2_emissions_current", "co2_emiss_current"),
        "property_type": pick("property_type", "propertyType"),
        "construction_age_band": pick("construction_age_band", "constructionAgeBand"),
        "certificate_number": pick("certificate_number", "lmk_key"),
    }


def _fetch_live_certificates(postcode: str, token: str, limit: int) -> List[dict]:
    headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}
    resp = requests.get(
        f"{EPC_API_BASE}/api/domestic/search",
        params={"postcode": postcode, "page_size": min(limit, 100)},
        headers=headers,
        timeout=_TIMEOUT,
    )
    resp.raise_for_status()
    hits = resp.json().get("data", [])[:limit]

    out = []
    for hit in hits:
        cert_no = hit.get("certificateNumber") or hit.get("certificate_number")
        detail_raw = {}
        if cert_no:
            try:
                dresp = requests.get(
                    f"{EPC_API_BASE}/api/certificate",
                    params={"certificate_number": cert_no},
                    headers=headers,
                    timeout=_TIMEOUT,
                )
                dresp.raise_for_status()
                detail_raw = dresp.json().get("data", {})
            except requests.RequestException:
                detail_raw = {}
        mapped = _map_certificate_detail(detail_raw) if detail_raw else {}
        out.append({
            "address": mapped.get("address") or hit.get("addressLine1"),
            "postcode": hit.get("postcode", postcode),
            "current_energy_rating": mapped.get("current_energy_rating") or hit.get("currentEnergyEfficiencyBand"),
            "current_energy_efficiency_score": mapped.get("current_energy_efficiency_score"),
            "potential_energy_rating": mapped.get("potential_energy_rating"),
            "co2_emissions_current": mapped.get("co2_emissions_current"),
            "property_type": mapped.get("property_type"),
            "construction_age_band": mapped.get("construction_age_band"),
            "certificate_number": cert_no,
        })
    return out


@router.get("/status")
def status() -> dict:
    """Report whether an EPC bearer token is configured (drives Live/Demo badge)."""
    has_token = bool(os.environ.get(EPC_BEARER_TOKEN_ENV, "").strip())
    return {
        "source": "GOV.UK Get energy performance of buildings data — api.get-energy-performance-data.communities.gov.uk",
        "mode": "live" if has_token else "demo-seed",
        "token_configured": has_token,
        "token_env": EPC_BEARER_TOKEN_ENV,
        "how_to_get_a_token": (
            "Sign in with GOV.UK One Login at "
            "https://get-energy-performance-data.communities.gov.uk, then find your "
            "bearer token on the 'my account' page. There is no headless/self-service "
            "signup — a real account is required."
        ),
        "note": ("Live EPC API available." if has_token else
                 "No EPC_API_BEARER_TOKEN set — /certificates returns a labeled seeded "
                 "sample (mode=demo-seed)."),
        "seed_provenance": SEED_PROVENANCE,
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get(
    "/certificates",
    summary="EPC certificates for a UK postcode (live if token configured, else labeled seed)",
    description=(
        "Live proxy to GOV.UK's Energy Certificate Data API "
        "(api.get-energy-performance-data.communities.gov.uk/api/domestic/search + "
        "/api/certificate) when EPC_API_BEARER_TOKEN is set. Without a token, returns "
        "a small labeled seeded sample (mode=demo-seed) for postcodes we independently "
        "observed in real Land Registry transactions — see module docstring for the "
        "honest access-method writeup."
    ),
)
def certificates(
    postcode: str = Query(..., description="Full UK postcode, e.g. 'NR9 4JL'"),
    limit: int = Query(20, ge=1, le=100, description="Max certificates to return"),
) -> dict:
    postcode_norm = postcode.strip().upper()
    token = os.environ.get(EPC_BEARER_TOKEN_ENV, "").strip()
    cache_key = ("certs", postcode_norm, limit, bool(token))
    cached = _cache_get(cache_key)
    if cached is not None:
        return {**cached, "cache": "hit"}

    mode = "live"
    upstream_error = None
    if token:
        try:
            certs = _fetch_live_certificates(postcode_norm, token, limit)
        except requests.RequestException as exc:
            mode = "demo-seed"
            upstream_error = str(exc)
            certs = _seed_certificates(postcode_norm)
    else:
        mode = "demo-seed"
        certs = _seed_certificates(postcode_norm)

    result = {
        "postcode": postcode_norm,
        "mode": mode,
        "count": len(certs),
        "certificates": certs,
        "upstream_error": upstream_error,
        "source": (
            "GOV.UK Energy Certificate Data API (live)" if mode == "live" else
            f"Labeled illustrative seed — {SEED_PROVENANCE['caveat']}"
        ),
        "seed_provenance": None if mode == "live" else SEED_PROVENANCE,
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "cache": "miss",
    }
    _cache_put(cache_key, result)
    return result


@router.get("/seed-postcodes")
def seed_postcodes() -> dict:
    """List the postcodes covered by the demo-seed fallback (useful for wiring the UI/demo)."""
    return {"postcodes": [r[0] for r in _SEED_ROWS], "provenance": SEED_PROVENANCE}
