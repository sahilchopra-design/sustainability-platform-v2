"""
Sanctions & UFLPA Screening Desk
================================
Prefix: /api/v1/sanctions
Tags:   Sanctions & UFLPA Screening

Data sources (verified 2026-07-04):

1. trade.gov Consolidated Screening List (CSL) — 12 U.S. government screening
   lists (OFAC SDN/SSI/CMIC, BIS Entity List/DPL/UVL/MEU, State ISN/DTC, ...).
   * Search API  https://data.trade.gov/consolidated_screening_list/v1/search
     -> requires a FREE subscription key (returns HTTP 401 "missing subscription
     key" without one). Supported here via env var TRADE_GOV_API_KEY
     (sent as the `subscription-key` header).
   * Bulk download https://data.trade.gov/downloadable_consolidated_screening_list/v1/consolidated.csv
     -> KEYLESS (verified HTTP 200, ~16.5 MB, 25,830 entries). Used as the
     default LIVE path: downloaded on first use, cached on disk + in memory
     with a 24h TTL, and screened locally with the matching logic below.

2. DHS UFLPA Entity List — NOT part of the CSL (verified: zero UFLPA-source
   rows in the bulk file). Published only as a web page / Federal Register
   notices at https://www.dhs.gov/uflpa-entity-list. A hand-authored REAL
   extract of 23 entities is seeded below (UFLPA_ENTITY_LIST_SEED), labeled
   with revision coverage. Refresh from dhs.gov/uflpa-entity-list for
   production use.

Matching logic (documented, deliberately simple + explainable):
  normalize(name): casefold -> strip accents (NFKD) -> "&"->"and" ->
                   non-alphanumeric -> space -> collapse whitespace;
  tokens(name):    normalized words minus generic corporate suffixes
                   (ltd, llc, gmbh, co, corp, inc, ...).
  For each list entry the query is compared against the primary name AND
  every alias/alt name:
    - exact normalized match                      -> confidence 1.00 ("exact")
    - substring containment (either direction,
      shorter side >= 5 chars)                    -> confidence 0.85 ("strong")
    - token-set Jaccard overlap j >= 0.5          -> confidence 0.50 + 0.45*j
                                                     ("possible")
  Best score per entry is kept; results are sorted by confidence, capped.
  This is a SCREENING aid, not a compliance determination.
"""

from __future__ import annotations

import csv
import io
import os
import re
import threading
import time
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/v1/sanctions", tags=["Sanctions & UFLPA Screening"])

# ---------------------------------------------------------------------------
# Constants / configuration
# ---------------------------------------------------------------------------

CSL_SEARCH_URL = "https://data.trade.gov/consolidated_screening_list/v1/search"
CSL_BULK_CSV_URL = "https://data.trade.gov/downloadable_consolidated_screening_list/v1/consolidated.csv"
TRADE_GOV_API_KEY_ENV = "TRADE_GOV_API_KEY"

_SNAPSHOT_TTL = 24 * 3600  # refresh bulk snapshot daily
_SNAPSHOT_PATH = Path(__file__).resolve().parents[3] / "data" / "csl_snapshot.csv"
_MAX_BATCH = 200
_MAX_MATCHES_PER_NAME = 10

MATCHING_LOGIC_DOC = (
    "Normalized-name matching: casefold + accent-strip + punctuation removal; "
    "exact normalized match = 1.00, substring containment (>=5 chars) = 0.85, "
    "token-set Jaccard >= 0.5 = 0.50 + 0.45 x Jaccard. Compared against primary "
    "and alternate names. Screening aid only — not a compliance determination."
)

# ---------------------------------------------------------------------------
# UFLPA Entity List — hand-authored REAL extract (23 of ~144 entities).
# Source of record: DHS UFLPA Entity List (https://www.dhs.gov/uflpa-entity-list),
# maintained by the Forced Labor Enforcement Task Force (FLETF) via Federal
# Register notices. Extract covers the June 2022 inaugural list through the
# June 2024 additions. Listing basis is paraphrased from the FLETF notices
# (UFLPA Section 2(d)(2)(B) criteria). REFRESH FROM dhs.gov/uflpa-entity-list
# FOR PRODUCTION — the list is amended several times a year.
# ---------------------------------------------------------------------------

UFLPA_LIST_META = {
    "list_name": "DHS UFLPA Entity List (seeded real extract)",
    "extract_size": 23,
    "full_list_size_approx": "~144 entities (as of mid-2024 revisions)",
    "revision_coverage": "June 2022 inaugural list through June 2024 additions",
    "source_url": "https://www.dhs.gov/uflpa-entity-list",
    "refresh_note": "Refresh from dhs.gov/uflpa-entity-list (FLETF Federal Register notices) for production.",
}

UFLPA_ENTITY_LIST_SEED: List[Dict[str, Any]] = [
    # --- Inaugural list (June 2022) ---
    {"name": "Xinjiang Production and Construction Corps", "aliases": ["XPCC", "Bingtuan"],
     "sector": "Cotton, agriculture, paramilitary conglomerate", "listed": "2022",
     "listing_basis": "Working with the XUAR government to recruit/transfer forced labor (UFLPA 2(d)(2)(B)(ii))"},
    {"name": "Changji Esquel Textile Co., Ltd.", "aliases": ["Changji Esquel"],
     "sector": "Cotton textiles / apparel", "listed": "2022",
     "listing_basis": "Mining/producing/manufacturing in XUAR wholly or in part with forced labor (2(d)(2)(B)(i))"},
    {"name": "Hetian Haolin Hair Accessories Co., Ltd.", "aliases": ["Hetian Haolin"],
     "sector": "Hair products", "listed": "2022",
     "listing_basis": "Producing in XUAR wholly or in part with forced labor (2(d)(2)(B)(i))"},
    {"name": "Hetian Taida Apparel Co., Ltd.", "aliases": ["Hetian Taida"],
     "sector": "Apparel", "listed": "2022",
     "listing_basis": "Producing in XUAR wholly or in part with forced labor (2(d)(2)(B)(i))"},
    {"name": "Hoshine Silicon Industry Co., Ltd.", "aliases": ["Hoshine", "Hesheng Silicon Industry"],
     "sector": "Metallurgical-grade silicon / polysilicon feedstock", "listed": "2022",
     "listing_basis": "Producing in XUAR wholly or in part with forced labor (2(d)(2)(B)(i))"},
    {"name": "Xinjiang Daqo New Energy Co., Ltd.", "aliases": ["Daqo New Energy Xinjiang"],
     "sector": "Polysilicon (solar supply chain)", "listed": "2022",
     "listing_basis": "Working with the XUAR government on labor transfers (2(d)(2)(B)(ii))"},
    {"name": "Xinjiang East Hope Nonferrous Metals Co., Ltd.", "aliases": ["East Hope Xinjiang"],
     "sector": "Polysilicon / nonferrous metals", "listed": "2022",
     "listing_basis": "Working with the XUAR government on labor transfers (2(d)(2)(B)(ii))"},
    {"name": "Xinjiang GCL New Energy Material Technology Co., Ltd.", "aliases": ["GCL Xinjiang"],
     "sector": "Polysilicon (solar supply chain)", "listed": "2022",
     "listing_basis": "Working with the XUAR government on labor transfers (2(d)(2)(B)(ii))"},
    {"name": "Xinjiang Junggar Cotton and Linen Co., Ltd.", "aliases": ["Junggar Cotton"],
     "sector": "Cotton and linen", "listed": "2022",
     "listing_basis": "Working with the XUAR government on labor transfers (2(d)(2)(B)(ii))"},
    {"name": "Aksu Huafu Textiles Co., Ltd.", "aliases": ["Aksu Huafu", "Huafu Fashion Aksu"],
     "sector": "Cotton yarn", "listed": "2022",
     "listing_basis": "Producing in XUAR wholly or in part with forced labor (2(d)(2)(B)(i))"},
    {"name": "Baoding LYSZD Trade and Business Co., Ltd.", "aliases": ["Baoding LYSZD"],
     "sector": "Apparel trading", "listed": "2022",
     "listing_basis": "Sourcing material from XUAR / from persons in labor-transfer programs (2(d)(2)(B)(iv))"},
    {"name": "Lop County Meixin Hair Products Co., Ltd.", "aliases": ["Lop County Meixin"],
     "sector": "Hair products", "listed": "2022",
     "listing_basis": "Producing in XUAR wholly or in part with forced labor (2(d)(2)(B)(i))"},
    # --- 2023 additions ---
    {"name": "Ninestar Corporation", "aliases": ["Ninestar", "Zhuhai Ninestar"],
     "sector": "Laser printers / toner cartridges (incl. eight Zhuhai subsidiaries)", "listed": "2023",
     "listing_basis": "Working with the XUAR government to recruit/transport/harbor forced labor (2(d)(2)(B)(ii))"},
    {"name": "Xinjiang Zhongtai Chemical Co., Ltd.", "aliases": ["Zhongtai Chemical"],
     "sector": "PVC / caustic soda / chemicals", "listed": "2023",
     "listing_basis": "Working with the XUAR government on labor transfers (2(d)(2)(B)(ii))"},
    {"name": "Xinjiang Tianmian Foundation Textile Co., Ltd.", "aliases": ["Tianmian Textile"],
     "sector": "Cotton yarn / textiles", "listed": "2023",
     "listing_basis": "Producing in XUAR wholly or in part with forced labor (2(d)(2)(B)(i))"},
    {"name": "Xinjiang Tianshan Wool Textile Co., Ltd.", "aliases": ["Tianshan Wool"],
     "sector": "Wool / cashmere textiles", "listed": "2023",
     "listing_basis": "Producing in XUAR wholly or in part with forced labor (2(d)(2)(B)(i))"},
    {"name": "Xinjiang Zhongtai Group Co., Ltd.", "aliases": ["Zhongtai Group"],
     "sector": "Chemicals / textiles conglomerate", "listed": "2023",
     "listing_basis": "Working with the XUAR government on labor transfers (2(d)(2)(B)(ii))"},
    {"name": "Camel Group Co., Ltd.", "aliases": ["Camel Group"],
     "sector": "Lead-acid batteries (automotive)", "listed": "2023",
     "listing_basis": "Working with the XUAR government to recruit/transport forced labor (2(d)(2)(B)(ii))"},
    {"name": "Chenguang Biotech Group Co., Ltd.", "aliases": ["Chenguang Biotech"],
     "sector": "Plant extracts / food additives", "listed": "2023",
     "listing_basis": "Working with the XUAR government on labor transfers (2(d)(2)(B)(ii))"},
    {"name": "COFCO Sugar Holding Co., Ltd.", "aliases": ["COFCO Sugar", "COFCO Tunhe"],
     "sector": "Sugar / tomato products", "listed": "2023",
     "listing_basis": "Working with the XUAR government on labor transfers (2(d)(2)(B)(ii))"},
    # --- 2024 additions ---
    {"name": "Shandong Meijia Group Co., Ltd.", "aliases": ["Meijia Group", "Rizhao Meijia"],
     "sector": "Seafood processing", "listed": "2024",
     "listing_basis": "Working with the XUAR government on labor transfers (2(d)(2)(B)(ii))"},
    {"name": "Dongguan Oasis Shoes Co., Ltd.", "aliases": ["Oasis Shoes"],
     "sector": "Footwear", "listed": "2024",
     "listing_basis": "Working with the XUAR government on labor transfers (2(d)(2)(B)(ii))"},
    {"name": "Xinjiang Shenhuo Coal and Electricity Co., Ltd.", "aliases": ["Shenhuo Coal and Electricity"],
     "sector": "Electrolytic aluminium / coal power", "listed": "2024",
     "listing_basis": "Producing in XUAR wholly or in part with forced labor (2(d)(2)(B)(i))"},
]

# ---------------------------------------------------------------------------
# Small REAL demo extract of the CSL — used ONLY when the keyless bulk download
# AND the keyed search API are both unavailable (offline demo fallback).
# Rows copied verbatim from the trade.gov consolidated.csv on 2026-07-04.
# ---------------------------------------------------------------------------

CSL_DEMO_SEED: List[Dict[str, Any]] = [
    {"source": "Non-SDN Chinese Military-Industrial Complex Companies List (CMIC) - Treasury Department",
     "name": "HUAWEI TECHNOLOGIES CO., LTD.", "alt_names": ["Huawei Investment & Holding Co Ltd"],
     "type": "Entity", "programs": "CMIC-EO13959", "country": "CN", "entity_number": "30947",
     "source_list_url": "https://sanctionslist.ofac.treas.gov/Home/ConsolidatedList"},
    {"source": "Sectoral Sanctions Identifications List (SSI) - Treasury Department",
     "name": "Open Joint-Stock Company Rosneft Oil Company",
     "alt_names": ["OJSC Rosneft Oil Company", "Rosneft Oil Company", "OAO Rosneft Oil Company",
                   "Oil Company Rosneft", "Rosneft"],
     "type": "Entity", "programs": "UKRAINE-EO13662; RUSSIA-EO14024", "country": "RU", "entity_number": "17022",
     "source_list_url": "https://sanctionslist.ofac.treas.gov/Home/ConsolidatedList"},
    {"source": "Sectoral Sanctions Identifications List (SSI) - Treasury Department",
     "name": "PUBLIC JOINT STOCK COMPANY SBERBANK OF RUSSIA",
     "alt_names": ["Sberbank Rossii", "Sberbank of Russia", "PJSC Sberbank"],
     "type": "Entity", "programs": "UKRAINE-EO13662; RUSSIA-EO14024", "country": "RU", "entity_number": "17018",
     "source_list_url": "https://sanctionslist.ofac.treas.gov/Home/ConsolidatedList"},
    {"source": "Specially Designated Nationals (SDN) - Treasury Department",
     "name": "ISLAMIC REVOLUTIONARY GUARD CORPS",
     "alt_names": ["IRGC", "The Iranian Revolutionary Guards", "The Army of the Guardians of the Islamic Revolution"],
     "type": "Entity", "programs": "NPWMD; IRGC; IRAN-HR; SDGT; FTO", "country": "IR", "entity_number": "10391",
     "source_list_url": "https://sanctionslist.ofac.treas.gov/Home/ConsolidatedList"},
    {"source": "Sectoral Sanctions Identifications List (SSI) - Treasury Department",
     "name": "ROSNEFT TRADING S.A.", "alt_names": [],
     "type": "Entity", "programs": "UKRAINE-EO13662; VENEZUELA-EO13850", "country": "CH", "entity_number": "18299",
     "source_list_url": "https://sanctionslist.ofac.treas.gov/Home/ConsolidatedList"},
]

# ---------------------------------------------------------------------------
# Name normalization + fuzzy matching (documented in module docstring)
# ---------------------------------------------------------------------------

_CORP_SUFFIXES = frozenset({
    "ltd", "limited", "llc", "co", "company", "inc", "incorporated", "corp",
    "corporation", "gmbh", "ag", "sa", "srl", "bv", "nv", "plc", "pte", "pvt",
    "kk", "ooo", "oao", "zao", "pjsc", "ojsc", "jsc", "sdn", "bhd", "spa",
    "sas", "kft", "doo", "ab", "oy", "group", "holding", "holdings",
})

_NON_ALNUM = re.compile(r"[^a-z0-9]+")


def _normalize(name: str) -> str:
    s = unicodedata.normalize("NFKD", name or "")
    s = "".join(ch for ch in s if not unicodedata.combining(ch))
    s = s.casefold().replace("&", " and ")
    s = _NON_ALNUM.sub(" ", s)
    return " ".join(s.split())


def _tokens(norm: str) -> frozenset:
    return frozenset(t for t in norm.split() if t not in _CORP_SUFFIXES)


def _score(query_norm: str, query_tokens: frozenset, cand_norm: str, cand_tokens: frozenset):
    """Returns (confidence, match_type) or None."""
    if not query_norm or not cand_norm:
        return None
    if query_norm == cand_norm:
        return 1.0, "exact"
    shorter = min(len(query_norm), len(cand_norm))
    if shorter >= 5 and (query_norm in cand_norm or cand_norm in query_norm):
        return 0.85, "strong (substring)"
    if query_tokens and cand_tokens:
        inter = len(query_tokens & cand_tokens)
        union = len(query_tokens | cand_tokens)
        if union:
            j = inter / union
            if j >= 0.5:
                return round(0.50 + 0.45 * j, 3), "possible (token overlap)"
    return None


def _best_match(query_norm: str, query_tokens: frozenset, entry: dict):
    """Best score of the query vs an entry's primary name + alt names."""
    best = None
    for field, cand in [("name", entry["name"])] + [("alt_name", a) for a in entry.get("alt_names", [])]:
        pre = entry.get("_norm_cache", {}).get(cand)
        if pre:
            cand_norm, cand_tokens = pre
        else:
            cand_norm = _normalize(cand)
            cand_tokens = _tokens(cand_norm)
        hit = _score(query_norm, query_tokens, cand_norm, cand_tokens)
        if hit and (best is None or hit[0] > best[0]):
            best = (hit[0], hit[1], field, cand)
    return best


# ---------------------------------------------------------------------------
# CSL bulk snapshot loader (keyless live path) — disk + memory cache, 24h TTL
# ---------------------------------------------------------------------------

_csl_state: Dict[str, Any] = {"entries": None, "loaded_at": 0.0, "row_count": 0,
                              "sources": {}, "origin": None, "error": None}
_csl_lock = threading.Lock()


def _parse_csl_csv(text: str) -> List[Dict[str, Any]]:
    entries: List[Dict[str, Any]] = []
    reader = csv.DictReader(io.StringIO(text))
    for row in reader:
        name = (row.get("name") or "").strip()
        if not name:
            continue
        alts = [a.strip() for a in (row.get("alt_names") or "").split(";") if a.strip()]
        # crude country extraction: last comma-token of each address segment, if 2 letters
        countries = []
        for seg in (row.get("addresses") or "").split(";"):
            tail = seg.strip().rsplit(",", 1)[-1].strip()
            if len(tail) == 2 and tail.isalpha() and tail.upper() not in countries:
                countries.append(tail.upper())
        entry = {
            "source": row.get("source") or "",
            "name": name,
            "alt_names": alts,
            "type": row.get("type") or "",
            "programs": row.get("programs") or "",
            "country": ", ".join(countries[:3]),
            "entity_number": row.get("entity_number") or "",
            "source_list_url": row.get("source_list_url") or "",
        }
        # Precompute normalized forms once (25k rows x aliases)
        cache = {}
        for cand in [name] + alts:
            n = _normalize(cand)
            cache[cand] = (n, _tokens(n))
        entry["_norm_cache"] = cache
        entries.append(entry)
    return entries


def _load_csl_snapshot(force: bool = False) -> Dict[str, Any]:
    """Ensure the CSL bulk snapshot is loaded (memory <- disk <- keyless download)."""
    now = time.time()
    with _csl_lock:
        if not force and _csl_state["entries"] is not None and now - _csl_state["loaded_at"] < _SNAPSHOT_TTL:
            return _csl_state

        text: Optional[str] = None
        origin = None
        # 1) fresh-enough disk snapshot
        try:
            if not force and _SNAPSHOT_PATH.exists() and now - _SNAPSHOT_PATH.stat().st_mtime < _SNAPSHOT_TTL:
                text = _SNAPSHOT_PATH.read_text(encoding="utf-8", errors="replace")
                origin = f"disk snapshot ({datetime.fromtimestamp(_SNAPSHOT_PATH.stat().st_mtime, timezone.utc):%Y-%m-%d %H:%MZ})"
        except OSError:
            text = None
        # 2) keyless bulk download
        if text is None:
            try:
                resp = requests.get(CSL_BULK_CSV_URL, timeout=120)
                resp.raise_for_status()
                text = resp.content.decode("utf-8", errors="replace")
                origin = f"live keyless bulk download ({datetime.now(timezone.utc):%Y-%m-%d %H:%MZ})"
                try:
                    _SNAPSHOT_PATH.parent.mkdir(parents=True, exist_ok=True)
                    _SNAPSHOT_PATH.write_text(text, encoding="utf-8")
                except OSError:
                    pass  # disk persistence is best-effort
            except requests.RequestException as exc:
                # 3) stale disk snapshot better than nothing
                if _SNAPSHOT_PATH.exists():
                    text = _SNAPSHOT_PATH.read_text(encoding="utf-8", errors="replace")
                    origin = f"STALE disk snapshot ({datetime.fromtimestamp(_SNAPSHOT_PATH.stat().st_mtime, timezone.utc):%Y-%m-%d %H:%MZ}) — refresh failed: {exc}"
                else:
                    _csl_state.update({"error": f"CSL bulk download failed: {exc}"})
                    return _csl_state

        entries = _parse_csl_csv(text)
        sources: Dict[str, int] = {}
        for e in entries:
            sources[e["source"]] = sources.get(e["source"], 0) + 1
        _csl_state.update({
            "entries": entries, "loaded_at": now, "row_count": len(entries),
            "sources": sources, "origin": origin, "error": None,
        })
        return _csl_state


# ---------------------------------------------------------------------------
# Keyed search path (TRADE_GOV_API_KEY)
# ---------------------------------------------------------------------------

def _keyed_search(name: str, api_key: str) -> Optional[List[Dict[str, Any]]]:
    """Search the CSL API with a subscription key. Returns None on failure."""
    try:
        resp = requests.get(
            CSL_SEARCH_URL,
            params={"name": name, "fuzzy_name": "true", "size": _MAX_MATCHES_PER_NAME},
            headers={"subscription-key": api_key},
            timeout=30,
        )
        if not resp.ok:
            return None
        results = resp.json().get("results", []) or []
    except (requests.RequestException, ValueError):
        return None
    out = []
    for r in results[:_MAX_MATCHES_PER_NAME]:
        countries = [a.get("country") for a in (r.get("addresses") or []) if a.get("country")]
        out.append({
            "matched_name": r.get("name"),
            "matched_on": "name",
            "match_type": "api fuzzy search",
            "confidence": round(min(1.0, float(r.get("score", 80)) / 100.0), 3) if r.get("score") is not None else 0.75,
            "source": r.get("source", {}).get("full_name") if isinstance(r.get("source"), dict) else (r.get("source") or ""),
            "programs": "; ".join(r.get("programs") or []) if isinstance(r.get("programs"), list) else (r.get("programs") or ""),
            "type": r.get("type") or "",
            "country": ", ".join(dict.fromkeys(countries))[:40],
            "entity_number": str(r.get("entity_number") or ""),
            "source_list_url": r.get("source_list_url") or "",
        })
    return out


# ---------------------------------------------------------------------------
# Screening core
# ---------------------------------------------------------------------------

def _screen_against_entries(name: str, entries: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    qn = _normalize(name)
    qt = _tokens(qn)
    hits = []
    for entry in entries:
        best = _best_match(qn, qt, entry)
        if best:
            conf, mtype, field, cand = best
            hits.append({
                "matched_name": entry["name"],
                "matched_on": field if field == "name" else f"alt_name: {cand}",
                "match_type": mtype,
                "confidence": conf,
                "source": entry["source"],
                "programs": entry.get("programs", ""),
                "type": entry.get("type", ""),
                "country": entry.get("country", ""),
                "entity_number": entry.get("entity_number", ""),
                "source_list_url": entry.get("source_list_url", ""),
            })
    hits.sort(key=lambda h: -h["confidence"])
    return hits[:_MAX_MATCHES_PER_NAME]


def _screen_uflpa(name: str) -> List[Dict[str, Any]]:
    qn = _normalize(name)
    qt = _tokens(qn)
    hits = []
    for entry in UFLPA_ENTITY_LIST_SEED:
        best = _best_match(qn, qt, {"name": entry["name"], "alt_names": entry.get("aliases", [])})
        if best:
            conf, mtype, field, cand = best
            hits.append({
                "matched_name": entry["name"],
                "matched_on": field if field == "name" else f"alias: {cand}",
                "match_type": mtype,
                "confidence": conf,
                "source": UFLPA_LIST_META["list_name"],
                "sector": entry["sector"],
                "listing_basis": entry["listing_basis"],
                "listed": entry["listed"],
                "source_list_url": UFLPA_LIST_META["source_url"],
            })
    hits.sort(key=lambda h: -h["confidence"])
    return hits[:_MAX_MATCHES_PER_NAME]


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------

class ScreenRequest(BaseModel):
    name: Optional[str] = Field(None, description="Single counterparty/supplier name")
    names: Optional[List[str]] = Field(None, description="Batch of names (max 200)")


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/status")
def status() -> dict:
    """Data-source status for the frontend Live/Demo badge. Does NOT trigger a
    bulk download; reports what is currently loaded/configured."""
    api_key = os.environ.get(TRADE_GOV_API_KEY_ENV, "").strip()
    with _csl_lock:
        loaded = _csl_state["entries"] is not None
        snapshot_disk = _SNAPSHOT_PATH.exists()
        st = {
            "csl_search_api": "keyed (TRADE_GOV_API_KEY set)" if api_key
                              else "requires free subscription key — not set (HTTP 401 without it)",
            "csl_bulk_download": "keyless (verified) — " + CSL_BULK_CSV_URL,
            "csl_snapshot_loaded": loaded,
            "csl_snapshot_rows": _csl_state["row_count"] if loaded else None,
            "csl_snapshot_origin": _csl_state["origin"],
            "csl_snapshot_on_disk": snapshot_disk,
            "csl_last_error": _csl_state["error"],
            "csl_source_lists": _csl_state["sources"] if loaded else None,
            "uflpa": UFLPA_LIST_META,
            "matching_logic": MATCHING_LOGIC_DOC,
            "checked_at": datetime.now(timezone.utc).isoformat(),
        }
    return st


@router.post("/screen")
def screen(req: ScreenRequest) -> dict:
    """Screen one name or a batch against the CSL (keyed search if
    TRADE_GOV_API_KEY set, else keyless bulk snapshot, else seeded demo
    extract) plus the seeded UFLPA Entity List extract."""
    names = [n.strip() for n in (req.names or ([req.name] if req.name else [])) if n and n.strip()]
    if not names:
        raise HTTPException(status_code=422, detail="Provide 'name' or non-empty 'names'.")
    if len(names) > _MAX_BATCH:
        raise HTTPException(status_code=422, detail=f"Batch limited to {_MAX_BATCH} names.")

    api_key = os.environ.get(TRADE_GOV_API_KEY_ENV, "").strip()
    mode: str
    entries: Optional[List[Dict[str, Any]]] = None

    if api_key:
        mode = "live-keyed-search"
    else:
        state = _load_csl_snapshot()
        if state["entries"] is not None:
            entries = state["entries"]
            mode = "live-bulk-snapshot"
        else:
            entries = None
            mode = "demo-seed"

    results = []
    for name in names:
        csl_matches: List[Dict[str, Any]]
        per_name_mode = mode
        if mode == "live-keyed-search":
            keyed = _keyed_search(name, api_key)
            if keyed is None:
                # keyed call failed -> degrade to bulk snapshot for this run
                state = _load_csl_snapshot()
                if state["entries"] is not None:
                    csl_matches = _screen_against_entries(name, state["entries"])
                    per_name_mode = "live-bulk-snapshot (keyed search failed)"
                else:
                    csl_matches = _screen_against_entries(name, _demo_entries())
                    per_name_mode = "demo-seed (keyed search + bulk download failed)"
            else:
                csl_matches = keyed
        elif entries is not None:
            csl_matches = _screen_against_entries(name, entries)
        else:
            csl_matches = _screen_against_entries(name, _demo_entries())

        results.append({
            "query": name,
            "csl_mode": per_name_mode,
            "csl_matches": csl_matches,
            "uflpa_matches": _screen_uflpa(name),
        })

    with _csl_lock:
        origin = _csl_state["origin"]
        rows = _csl_state["row_count"]

    return {
        "mode": mode,
        "csl_snapshot_origin": origin,
        "csl_snapshot_rows": rows or None,
        "uflpa_list": {k: v for k, v in UFLPA_LIST_META.items() if k != "refresh_note"},
        "uflpa_refresh_note": UFLPA_LIST_META["refresh_note"],
        "matching_logic": MATCHING_LOGIC_DOC,
        "disclaimer": "Screening aid only. Positive matches require manual review against the "
                      "authoritative lists (trade.gov CSL / dhs.gov UFLPA Entity List) before any "
                      "compliance action.",
        "screened_at": datetime.now(timezone.utc).isoformat(),
        "results": results,
    }


def _demo_entries() -> List[Dict[str, Any]]:
    """Seeded real CSL extract for offline demo — precompute norm cache lazily."""
    for e in CSL_DEMO_SEED:
        if "_norm_cache" not in e:
            cache = {}
            for cand in [e["name"]] + e.get("alt_names", []):
                n = _normalize(cand)
                cache[cand] = (n, _tokens(n))
            e["_norm_cache"] = cache
    return CSL_DEMO_SEED


@router.get("/uflpa-list")
def uflpa_list() -> dict:
    """The seeded UFLPA Entity List extract (real entities, hand-authored)."""
    return {
        "meta": UFLPA_LIST_META,
        "entities": [{k: v for k, v in e.items() if k != "_norm_cache"} for e in UFLPA_ENTITY_LIST_SEED],
    }
