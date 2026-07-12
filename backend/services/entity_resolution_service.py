"""
Cross-module entity resolution service.

Resolves entities across siloed database tables using:
  1. LEI exact match (primary — canonical GLEIF 20-char identifier)
  2. ISIN exact match (secondary — for listed securities)
  3. Fuzzy name match (fallback — normalized string similarity)

Provides:
  - resolve_entity(lei, name, isin) → EntityMatch with all linked records
  - link_to_company_profile(entity_lei) → creates/returns company_profiles record
  - bulk_resolve(records) → batch resolution
  - build_entity_graph(lei) → full cross-module data for entity360
  - auto_link_unlinked() → background job to link all unlinked records
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field
from difflib import SequenceMatcher
from typing import Optional

from sqlalchemy import text
from sqlalchemy.engine import Engine

from db.base import engine as db_engine  # noqa: F401 — re-exported for callers

logger = logging.getLogger(__name__)

# Minimum similarity for fuzzy name matching (0.0 to 1.0)
_FUZZY_THRESHOLD = 0.85

# Below this confidence, resolve_entity() attempts a LIVE GLEIF fallback
# (see EntityResolutionService._live_gleif_fallback) instead of returning the
# low-confidence local match as-is.
_LIVE_FALLBACK_THRESHOLD = 0.5

# ── Normalisation helpers ──────────────────────────────────────────────────

_LEGAL_SUFFIXES = re.compile(
    r"\b(ltd|limited|plc|inc|corp|corporation|ag|sa|nv|bv|gmbh|se|asa|oyj|ab|"
    r"group|holdings|holding|& co|co|the)\b",
    re.IGNORECASE,
)


def normalise_name(name: str) -> str:
    """Lowercase, strip legal suffixes, collapse whitespace."""
    if not name:
        return ""
    n = name.lower().strip()
    n = _LEGAL_SUFFIXES.sub("", n)
    n = re.sub(r"[^\w\s]", "", n)
    n = re.sub(r"\s+", " ", n).strip()
    return n


def fuzzy_score(a: str, b: str) -> float:
    """SequenceMatcher ratio on normalised names."""
    na, nb = normalise_name(a), normalise_name(b)
    if not na or not nb:
        return 0.0
    return SequenceMatcher(None, na, nb).ratio()


# ── Data classes ──────────────────────────────────────────────────────────

@dataclass
class LinkedRecord:
    table: str
    id: str
    lei: Optional[str] = None
    name: Optional[str] = None
    isin: Optional[str] = None


@dataclass
class EntityMatch:
    """Result of cross-module entity resolution."""
    company_profile_id: Optional[str] = None
    lei: Optional[str] = None
    canonical_name: Optional[str] = None
    match_method: str = "none"  # "lei" | "isin" | "fuzzy_name" | "live_gleif" | "none"
    confidence: float = 0.0
    linked_records: list[LinkedRecord] = field(default_factory=list)
    # "local_cache" (found in entity_lei-linked tables at/above confidence
    # threshold) | "live_gleif_fallback" (local lookup missed or was
    # low-confidence, so a live GLEIF call + upsert + local re-match was
    # performed) | "no_match" (neither found anything). See resolve_entity().
    resolution_tier: str = "no_match"


@dataclass
class Entity360Data:
    """Aggregated cross-module data for a single entity."""
    company_profile: Optional[dict] = None
    fi_entity: Optional[dict] = None
    energy_entity: Optional[dict] = None
    sc_entity: Optional[dict] = None
    regulatory_entity: Optional[dict] = None
    csrd_entity: Optional[dict] = None
    portfolio_assets: list[dict] = field(default_factory=list)
    pcaf_investees: list[dict] = field(default_factory=list)
    ecl_assessments: list[dict] = field(default_factory=list)
    module_count: int = 0


# ── Source table definitions ───────────────────────────────────────────────

_ENTITY_SOURCES = [
    {
        "table": "company_profiles",
        "id_col": "id",
        "lei_col": "entity_lei",
        "name_col": "legal_name",
        "isin_col": "isin_primary",
    },
    {
        "table": "fi_entities",
        "id_col": "id",
        "lei_col": "lei",
        "name_col": "legal_name",
        "isin_col": "isin",
    },
    {
        "table": "energy_entities",
        "id_col": "id",
        "lei_col": "lei",
        "name_col": "legal_name",
        "isin_col": "isin",
    },
    {
        "table": "sc_entities",
        "id_col": "id",
        "lei_col": "lei",
        "name_col": "legal_name",
        "isin_col": None,
    },
    {
        "table": "regulatory_entities",
        "id_col": "id",
        "lei_col": "lei",
        "name_col": "legal_name",
        "isin_col": None,
    },
    {
        "table": "csrd_entity_registry",
        "id_col": "id",
        "lei_col": "lei",
        "name_col": "legal_name",
        "isin_col": "isin",
    },
]

_ASSET_SOURCES = [
    {
        "table": "assets_pg",
        "id_col": "id",
        "lei_col": "entity_lei",
        "name_col": None,
    },
    {
        "table": "pcaf_investees",
        "id_col": "id",
        "lei_col": "lei",
        "name_col": "investee_name",
    },
    {
        "table": "ecl_assessments",
        "id_col": "id",
        "lei_col": "legal_entity_identifier",
        "name_col": "borrower_name",
    },
]


# ── Engine ────────────────────────────────────────────────────────────────

class EntityResolutionService:
    """Cross-module entity resolver using LEI, ISIN, and fuzzy name."""

    def __init__(self, engine: Engine):
        self._engine = engine

    # ── Public API ────────────────────────────────────────────────────────

    def resolve_entity(
        self,
        lei: Optional[str] = None,
        name: Optional[str] = None,
        isin: Optional[str] = None,
    ) -> EntityMatch:
        """
        Find all records across modules that match the given identifiers.
        Priority: LEI > ISIN > fuzzy name.

        Self-healing live fallback: entity_lei (the "golden record" cache
        this resolver ultimately depends on for LEI/ISIN linkage) is only
        ever populated by the weekly bulk ingester (ingestion/gleif_ingester.py),
        which is capped at 10,000 records/run and does a blind, untargeted,
        country-filtered crawl -- it has no reason to have pulled in any
        specific entity this platform's portfolios happen to reference. So if
        the LOCAL lookup finds nothing, or only a low-confidence match
        (confidence < _LIVE_FALLBACK_THRESHOLD), this method makes a LIVE call
        to the real GLEIF API (services/gleif_upsert.py: by ISIN, by LEI, or
        by fuzzy name completion), upserts whatever it finds into entity_lei,
        and re-runs the local match against the now freshly-populated cache.
        A local cache miss therefore doesn't just report "no match" -- it
        fixes the gap for every subsequent lookup of the same entity.

        See EntityMatch.resolution_tier for which path produced the result:
        "local_cache" | "live_gleif_fallback" | "no_match".
        """
        match = self._resolve_local(lei=lei, name=name, isin=isin)
        if match.match_method != "none" and match.confidence >= _LIVE_FALLBACK_THRESHOLD:
            match.resolution_tier = "local_cache"
            return match

        fallback_match = self._live_gleif_fallback(lei=lei, name=name, isin=isin)
        if fallback_match is not None:
            fallback_match.resolution_tier = "live_gleif_fallback"
            return fallback_match

        match.resolution_tier = "no_match"
        return match

    def _resolve_local(
        self,
        lei: Optional[str] = None,
        name: Optional[str] = None,
        isin: Optional[str] = None,
    ) -> EntityMatch:
        """
        Original resolve_entity() body: search ONLY the local entity_lei-linked
        tables (company_profiles, fi_entities, energy_entities, sc_entities,
        regulatory_entities, csrd_entity_registry, plus asset tables for LEI
        lookup). No live GLEIF call is made here -- that's resolve_entity()'s job.
        """
        match = EntityMatch()

        # 1. LEI exact match
        if lei and len(lei) == 20:
            records = self._find_by_lei(lei)
            if records:
                match.lei = lei
                match.linked_records = records
                match.match_method = "lei"
                match.confidence = 1.0
                match.canonical_name = records[0].name
                match.company_profile_id = next(
                    (r.id for r in records if r.table == "company_profiles"), None
                )
                return match

        # 2. ISIN exact match
        if isin and len(isin) == 12:
            records = self._find_by_isin(isin)
            if records:
                match.linked_records = records
                match.match_method = "isin"
                match.confidence = 0.95
                match.lei = next((r.lei for r in records if r.lei), None)
                match.canonical_name = records[0].name
                match.company_profile_id = next(
                    (r.id for r in records if r.table == "company_profiles"), None
                )
                return match

        # 3. Fuzzy name match
        if name:
            records = self._find_by_fuzzy_name(name)
            if records:
                best_score = max(fuzzy_score(name, r.name or "") for r in records)
                match.linked_records = records
                match.match_method = "fuzzy_name"
                match.confidence = round(best_score, 3)
                match.canonical_name = records[0].name
                match.lei = next((r.lei for r in records if r.lei), None)
                match.company_profile_id = next(
                    (r.id for r in records if r.table == "company_profiles"), None
                )
                return match

        return match

    def _live_gleif_fallback(
        self,
        lei: Optional[str] = None,
        name: Optional[str] = None,
        isin: Optional[str] = None,
    ) -> Optional[EntityMatch]:
        """
        Live GLEIF lookup (by LEI, then ISIN, then fuzzy name completion) +
        immediate upsert into entity_lei + re-run of the local match. Reuses
        services/gleif_upsert.py's fetch+upsert helpers (the same ones behind
        gleif_graph.py's resolve-by-isin/resolve-by-bic endpoints) so this
        write path can never drift from the bulk ingester's schema mapping.

        Returns None if GLEIF has no match for any given identifier, or if
        the live call itself fails (network/upstream error -- logged, not
        raised, so a GLEIF outage degrades to "no_match" rather than a 500).
        """
        from services.gleif_upsert import (
            GleifLiveFetchError,
            fetch_lei_record_by_lei,
            resolve_and_upsert_by_isin,
            resolve_and_upsert_by_name,
            upsert_lei_record,
        )

        upserted: Optional[dict] = None
        try:
            with self._engine.connect() as conn:
                if lei and len(lei) == 20:
                    raw = fetch_lei_record_by_lei(lei)
                    if raw:
                        upserted = upsert_lei_record(conn, raw)
                if not upserted and isin and len(isin) == 12:
                    upserted = resolve_and_upsert_by_isin(conn, isin)
                if not upserted and name:
                    upserted = resolve_and_upsert_by_name(conn, name)
        except GleifLiveFetchError as exc:
            logger.warning("Live GLEIF fallback lookup failed: %s", exc)
            return None
        except Exception as exc:
            logger.warning("Live GLEIF fallback DB write failed: %s", exc)
            return None

        if not upserted:
            return None

        resolved_lei = upserted.get("lei")
        rematch = self._resolve_local(lei=resolved_lei, name=name, isin=isin)
        if rematch.match_method == "none":
            # entity_lei now has a fresh row, but no cross-module table has
            # linked to this LEI yet -- still a real, useful result: surface
            # the just-fetched GLEIF identity directly rather than reporting
            # "no match" after a successful live lookup.
            rematch.lei = resolved_lei
            rematch.canonical_name = upserted.get("legal_name")
            rematch.match_method = "live_gleif"
            rematch.confidence = 0.9
        return rematch

    def build_entity_graph(self, lei: str) -> Entity360Data:
        """
        Gather all cross-module data for an entity identified by LEI.
        Returns structured data ready for entity360_engine aggregation.
        """
        result = Entity360Data()

        with self._engine.connect() as conn:
            # Company profile
            row = conn.execute(
                text("SELECT * FROM company_profiles WHERE entity_lei = :lei LIMIT 1"),
                {"lei": lei},
            ).mappings().first()
            if row:
                result.company_profile = dict(row)

            # FI entity
            row = conn.execute(
                text("SELECT * FROM fi_entities WHERE lei = :lei LIMIT 1"),
                {"lei": lei},
            ).mappings().first()
            if row:
                result.fi_entity = dict(row)
                result.module_count += 1

            # Energy entity
            row = conn.execute(
                text("SELECT * FROM energy_entities WHERE lei = :lei LIMIT 1"),
                {"lei": lei},
            ).mappings().first()
            if row:
                result.energy_entity = dict(row)
                result.module_count += 1

            # Supply chain entity
            row = conn.execute(
                text("SELECT * FROM sc_entities WHERE lei = :lei LIMIT 1"),
                {"lei": lei},
            ).mappings().first()
            if row:
                result.sc_entity = dict(row)
                result.module_count += 1

            # Regulatory entity
            row = conn.execute(
                text("SELECT * FROM regulatory_entities WHERE lei = :lei LIMIT 1"),
                {"lei": lei},
            ).mappings().first()
            if row:
                result.regulatory_entity = dict(row)
                result.module_count += 1

            # CSRD entity
            row = conn.execute(
                text("SELECT * FROM csrd_entity_registry WHERE lei = :lei LIMIT 1"),
                {"lei": lei},
            ).mappings().first()
            if row:
                result.csrd_entity = dict(row)
                result.module_count += 1

            # Portfolio assets
            rows = conn.execute(
                text(
                    "SELECT id, name, asset_class, current_value, entity_lei "
                    "FROM assets_pg WHERE entity_lei = :lei"
                ),
                {"lei": lei},
            ).mappings().all()
            result.portfolio_assets = [dict(r) for r in rows]

            # PCAF investees
            rows = conn.execute(
                text(
                    "SELECT id, investee_name, lei, isin, asset_class, outstanding_amount "
                    "FROM pcaf_investees WHERE lei = :lei"
                ),
                {"lei": lei},
            ).mappings().all()
            result.pcaf_investees = [dict(r) for r in rows]

            # ECL assessments
            rows = conn.execute(
                text(
                    "SELECT id, borrower_name, assessment_date, total_ecl "
                    "FROM ecl_assessments WHERE legal_entity_identifier = :lei"
                ),
                {"lei": lei},
            ).mappings().all()
            result.ecl_assessments = [dict(r) for r in rows]

        return result

    def link_to_company_profile(self, lei: str, name: str = "") -> Optional[str]:
        """
        Find or create a company_profiles record for the given LEI.
        Returns the company_profile UUID.
        """
        with self._engine.connect() as conn:
            row = conn.execute(
                text(
                    "SELECT id FROM company_profiles WHERE entity_lei = :lei LIMIT 1"
                ),
                {"lei": lei},
            ).first()
            if row:
                return str(row[0])

            # Create minimal profile
            result = conn.execute(
                text("""
                    INSERT INTO company_profiles (legal_name, entity_lei, data_source)
                    VALUES (:name, :lei, 'auto_resolution')
                    RETURNING id
                """),
                {"name": name or f"Entity {lei}", "lei": lei},
            )
            conn.commit()
            row = result.first()
            return str(row[0]) if row else None

    def auto_link_unlinked(self) -> dict:
        """
        Background job: scan all sector entity tables for records with LEI
        that don't yet have a company_profile_id, and link them.
        Returns counts of linked records per table.

        Requires migration 042 to have added company_profile_id columns to the
        sector entity tables listed below.
        """
        stats: dict[str, dict] = {}

        # Tables that have company_profile_id column (added by migration 042)
        linkable = [
            ("fi_entities",          "lei", "legal_name"),
            ("energy_entities",      "lei", "legal_name"),
            ("sc_entities",          "lei", "legal_name"),
            ("regulatory_entities",  "lei", "legal_name"),
            ("csrd_entity_registry", "lei", "legal_name"),
        ]

        with self._engine.connect() as conn:
            for table, lei_col, name_col in linkable:
                # Check if company_profile_id column exists
                col_check = conn.execute(
                    text("""
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = :tbl AND column_name = 'company_profile_id'
                    """),
                    {"tbl": table},
                ).first()
                if not col_check:
                    stats[table] = {"skipped": "no company_profile_id column"}
                    continue

                # Find unlinked records with a populated LEI
                rows = conn.execute(
                    text(f"""
                        SELECT id, {lei_col} AS lei, {name_col} AS name
                        FROM {table}
                        WHERE {lei_col} IS NOT NULL
                          AND company_profile_id IS NULL
                    """)
                ).mappings().all()

                linked = 0
                for row in rows:
                    cp_id = self.link_to_company_profile(
                        row["lei"], row["name"] or ""
                    )
                    if cp_id:
                        conn.execute(
                            text(f"""
                                UPDATE {table}
                                SET company_profile_id = :cpid
                                WHERE id = :eid
                            """),
                            {"cpid": cp_id, "eid": str(row["id"])},
                        )
                        linked += 1

                conn.commit()
                stats[table] = {"total_unlinked": len(rows), "linked": linked}

        return stats

    def bulk_resolve(self, records: list[dict]) -> list[EntityMatch]:
        """
        Resolve a batch of records. Each dict may contain optional keys:
        ``lei``, ``name``, ``isin``.
        """
        return [
            self.resolve_entity(
                lei=r.get("lei"),
                name=r.get("name"),
                isin=r.get("isin"),
            )
            for r in records
        ]

    # ── Private helpers ───────────────────────────────────────────────────

    def _find_by_lei(self, lei: str) -> list[LinkedRecord]:
        records: list[LinkedRecord] = []
        with self._engine.connect() as conn:
            # entity_lei is the GLEIF golden-record cache table itself -- it
            # was not previously part of the local search surface (only
            # cross-module tables that reference an LEI were). Checking it
            # directly here is what closes the self-healing loop: once
            # resolve_entity()'s live-GLEIF fallback upserts a row into
            # entity_lei, the VERY NEXT identical lookup finds it here
            # (resolution_tier="local_cache") instead of calling GLEIF again.
            try:
                row = conn.execute(
                    text("SELECT lei, legal_name FROM entity_lei WHERE lei = :lei"),
                    {"lei": lei},
                ).mappings().first()
                if row:
                    records.append(
                        LinkedRecord(table="entity_lei", id=row["lei"], lei=row["lei"], name=row["legal_name"])
                    )
            except Exception as exc:
                logger.debug("LEI lookup in entity_lei failed: %s", exc)

            for src in _ENTITY_SOURCES + _ASSET_SOURCES:
                if not src.get("lei_col"):
                    continue
                name_expr = (
                    src["name_col"] + " AS name"
                    if src.get("name_col")
                    else "NULL AS name"
                )
                isin_expr = (
                    src["isin_col"] + " AS isin"
                    if src.get("isin_col")
                    else "NULL AS isin"
                )
                try:
                    rows = conn.execute(
                        text(
                            f"SELECT {src['id_col']}::text AS id, "
                            f"{src['lei_col']} AS lei, "
                            f"{name_expr}, "
                            f"{isin_expr} "
                            f"FROM {src['table']} "
                            f"WHERE {src['lei_col']} = :lei"
                        ),
                        {"lei": lei},
                    ).mappings().all()
                    for r in rows:
                        records.append(
                            LinkedRecord(
                                table=src["table"],
                                id=r["id"],
                                lei=r.get("lei"),
                                name=r.get("name"),
                                isin=r.get("isin"),
                            )
                        )
                except Exception as exc:
                    logger.debug(
                        "LEI lookup in %s failed: %s", src["table"], exc
                    )
        return records

    def _find_by_isin(self, isin: str) -> list[LinkedRecord]:
        records: list[LinkedRecord] = []
        with self._engine.connect() as conn:
            for src in _ENTITY_SOURCES:
                if not src.get("isin_col"):
                    continue
                lei_expr = src.get("lei_col") or "NULL"
                try:
                    rows = conn.execute(
                        text(
                            f"SELECT {src['id_col']}::text AS id, "
                            f"{lei_expr} AS lei, "
                            f"{src['name_col']} AS name, "
                            f"{src['isin_col']} AS isin "
                            f"FROM {src['table']} "
                            f"WHERE {src['isin_col']} = :isin"
                        ),
                        {"isin": isin},
                    ).mappings().all()
                    for r in rows:
                        records.append(
                            LinkedRecord(
                                table=src["table"],
                                id=r["id"],
                                lei=r.get("lei"),
                                name=r.get("name"),
                                isin=r.get("isin"),
                            )
                        )
                except Exception as exc:
                    logger.debug(
                        "ISIN lookup in %s failed: %s", src["table"], exc
                    )
        return records

    def _find_by_fuzzy_name(self, name: str) -> list[LinkedRecord]:
        """
        Scan entity master tables for names that fuzzy-match above threshold.
        Asset/investee tables are excluded to keep scan scope bounded.
        """
        records: list[LinkedRecord] = []
        norm_input = normalise_name(name)
        if not norm_input:
            return records

        with self._engine.connect() as conn:
            # entity_lei itself (the GLEIF golden-record cache), same
            # self-healing reasoning as _find_by_lei above: a name resolved
            # via the live-GLEIF fallback needs to be findable here by name
            # on the next lookup too, not just by LEI.
            try:
                rows = conn.execute(
                    text("SELECT lei, legal_name AS name FROM entity_lei WHERE legal_name IS NOT NULL")
                ).mappings().all()
                for r in rows:
                    if fuzzy_score(name, r["name"]) >= _FUZZY_THRESHOLD:
                        records.append(
                            LinkedRecord(table="entity_lei", id=r["lei"], lei=r["lei"], name=r["name"])
                        )
            except Exception as exc:
                logger.debug("Fuzzy name scan in entity_lei failed: %s", exc)

            for src in _ENTITY_SOURCES:
                if not src.get("name_col"):
                    continue
                lei_expr = src.get("lei_col") or "NULL"
                try:
                    rows = conn.execute(
                        text(
                            f"SELECT {src['id_col']}::text AS id, "
                            f"{lei_expr} AS lei, "
                            f"{src['name_col']} AS name "
                            f"FROM {src['table']} "
                            f"WHERE {src['name_col']} IS NOT NULL"
                        )
                    ).mappings().all()
                    for r in rows:
                        score = fuzzy_score(name, r["name"])
                        if score >= _FUZZY_THRESHOLD:
                            records.append(
                                LinkedRecord(
                                    table=src["table"],
                                    id=r["id"],
                                    lei=r.get("lei"),
                                    name=r.get("name"),
                                )
                            )
                except Exception as exc:
                    logger.debug(
                        "Fuzzy name scan in %s failed: %s", src["table"], exc
                    )

        return records
