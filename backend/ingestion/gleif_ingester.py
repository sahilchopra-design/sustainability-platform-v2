"""
GLEIF LEI Bulk Ingester — fetches Legal Entity Identifiers from the
Global Legal Entity Identifier Foundation API.

GLEIF API v1: https://api.gleif.org/api/v1/lei-records
  - Public, no API key required
  - Rate limit: ~60 req/min (undocumented, be polite)
  - Pagination: page[size] (max 200), page[number]
  - Bulk download: golden-copy ZIP also available

Strategy:
  - Paginate through the API in pages of 200
  - Transform each record into our entity_lei schema
  - Upsert on LEI primary key (ON CONFLICT UPDATE)
  - Default schedule: weekly (Sunday 3 AM UTC)
"""

from __future__ import annotations

import uuid as _uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import requests
from sqlalchemy import text
from sqlalchemy.orm import Session

from ingestion.base_ingester import BaseIngester, IngestionResult

# GLEIF source_id in dh_data_sources
GLEIF_SOURCE_ID = "1a28c01e-c6bc-4d4c-b96a-bb7db4faad8e"
GLEIF_API_BASE = "https://api.gleif.org/api/v1"

# Canonical entity_lei upsert SQL -- single source of truth. Shared with the
# just-in-time single-record upsert path (services/gleif_upsert.py, used by
# api/v1/routes/gleif_graph.py's resolve-by-isin/resolve-by-bic endpoints and
# services/entity_resolution_service.py's live-GLEIF fallback) so the weekly
# bulk ingester and JIT upserts can never drift apart on column list or
# conflict-resolution semantics.
#
# NOTE (fixed 2026-07-05): the three jsonb columns use CAST(:x AS JSONB), NOT
# the ":x::jsonb" shorthand the SQL had previously. Verified live: SQLAlchemy's
# text() bind-parameter parser does not reliably recognize a bind param
# immediately followed by "::" -- it silently drops "other_names",
# "registered_address" and "headquarters_address" from the compiled parameter
# set entirely (they never even reach psycopg2 as %(name)s placeholders), so
# every real insert raised `psycopg2.errors.SyntaxError: syntax error at or
# near ":"` and was swallowed by load()'s per-row try/except. This is the
# root cause of entity_lei having 0 rows in this environment despite the
# weekly ingester having run: every single row failed on this exact
# statement. CAST(...AS JSONB) has no such ambiguity.
ENTITY_LEI_UPSERT_SQL = text("""
    INSERT INTO entity_lei (
        lei, legal_name, legal_name_language, other_names, status,
        entity_category, legal_form_code, legal_form_name, jurisdiction,
        registered_address, headquarters_address,
        registration_authority_id, registration_authority_entity_id,
        entity_creation_date, entity_expiration_date,
        managing_lou, initial_registration_date, last_update_date,
        next_renewal_date, registration_status,
        direct_parent_lei, ultimate_parent_lei,
        direct_parent_relationship, ultimate_parent_relationship,
        source_id, ingested_at, updated_at
    ) VALUES (
        :lei, :legal_name, :legal_name_language, CAST(:other_names AS JSONB), :status,
        :entity_category, :legal_form_code, :legal_form_name, :jurisdiction,
        CAST(:registered_address AS JSONB), CAST(:headquarters_address AS JSONB),
        :registration_authority_id, :registration_authority_entity_id,
        :entity_creation_date, :entity_expiration_date,
        :managing_lou, :initial_registration_date, :last_update_date,
        :next_renewal_date, :registration_status,
        :direct_parent_lei, :ultimate_parent_lei,
        :direct_parent_relationship, :ultimate_parent_relationship,
        :source_id, NOW(), NOW()
    )
    ON CONFLICT (lei) DO UPDATE SET
        legal_name = EXCLUDED.legal_name,
        legal_name_language = EXCLUDED.legal_name_language,
        other_names = EXCLUDED.other_names,
        status = EXCLUDED.status,
        entity_category = EXCLUDED.entity_category,
        legal_form_code = EXCLUDED.legal_form_code,
        legal_form_name = EXCLUDED.legal_form_name,
        jurisdiction = EXCLUDED.jurisdiction,
        registered_address = EXCLUDED.registered_address,
        headquarters_address = EXCLUDED.headquarters_address,
        registration_status = EXCLUDED.registration_status,
        last_update_date = EXCLUDED.last_update_date,
        next_renewal_date = EXCLUDED.next_renewal_date,
        direct_parent_lei = EXCLUDED.direct_parent_lei,
        ultimate_parent_lei = EXCLUDED.ultimate_parent_lei,
        updated_at = NOW()
""")


class GleifIngester(BaseIngester):
    """
    Fetches LEI records from the GLEIF API and loads them into entity_lei.

    Supports:
      - Full bulk load (all LEIs, ~2.4M records — use with care)
      - Incremental update (filter by last update date)
      - Search-based load (filter by country, name, etc.)
    """

    source_id = GLEIF_SOURCE_ID
    display_name = "GLEIF LEI Registry"
    default_schedule = "0 3 * * 0"  # Sunday 3 AM UTC

    # Configuration
    page_size = 200
    max_pages = 50          # Safety cap: 50 pages * 200 = 10,000 records per run
    timeout_seconds = 600   # 10 min for full run
    batch_size = 200

    def __init__(
        self,
        max_pages: int = 50,
        country_filter: Optional[str] = None,
        seed_names: Optional[List[str]] = None,
        seed_isins: Optional[List[str]] = None,
    ):
        super().__init__()
        self.max_pages = max_pages
        self.country_filter = country_filter
        # Targeted pre-population: when either is non-empty, fetch() aims the
        # ingester at these specific entities instead of blind-crawling by
        # country. Intended source: distinct company names / ISINs already
        # referenced by this platform's fi_entities / company_profiles /
        # pcaf_investees tables (see seed_names_from_platform_tables() below),
        # so an admin action or scheduled job can pre-populate entity_lei for
        # entities the platform's own portfolios actually reference, rather
        # than waiting on the capped weekly blind crawl to happen to cover them.
        self.seed_names = list(seed_names) if seed_names else []
        self.seed_isins = list(seed_isins) if seed_isins else []

    # ── Stage 1: Fetch ────────────────────────────────────────────────────

    def fetch(self, db: Session) -> Any:
        """
        Dispatch to a targeted fetch (seed_names/seed_isins given) or the
        default blind paginated country-filtered crawl (backward compatible:
        this is the existing behaviour when no seeds are provided).
        """
        if self.seed_names or self.seed_isins:
            return self._fetch_targeted()
        return self._fetch_blind_crawl()

    def _fetch_targeted(self) -> List[dict]:
        """
        Targeted fetch aimed at specific entities instead of a blind crawl:
          - seed_isins: exact match via GLEIF filter[isin] (security -> issuer LEI)
          - seed_names: GLEIF /fuzzycompletions?field=entity.legalName for the
            name, then the top-ranked completion's LEI is resolved to its full
            lei-records resource via /lei-records/{lei}.
        Results are de-duplicated by LEI. Uses the same polite per-request
        pacing assumption as the blind crawl (~60 req/min, undocumented GLEIF
        limit -- see module docstring); each seed costs 1-2 requests, so this
        stays far cheaper than a full paginated crawl for a handful of names.
        """
        all_records: Dict[str, dict] = {}

        for isin in self.seed_isins:
            self.log(f"Targeted fetch by ISIN: {isin}")
            try:
                resp = requests.get(
                    f"{GLEIF_API_BASE}/lei-records",
                    params={"filter[isin]": isin, "page[size]": 5},
                    timeout=30,
                    headers={"Accept": "application/vnd.api+json"},
                )
                resp.raise_for_status()
                for rec in resp.json().get("data", []):
                    all_records[rec["id"]] = rec
            except requests.RequestException as exc:
                self.log(f"Targeted ISIN fetch failed for {isin}: {exc}", "warning")

        for name in self.seed_names:
            self.log(f"Targeted fetch by name: {name}")
            try:
                resp = requests.get(
                    f"{GLEIF_API_BASE}/fuzzycompletions",
                    params={"field": "entity.legalName", "q": name},
                    timeout=30,
                    headers={"Accept": "application/vnd.api+json"},
                )
                resp.raise_for_status()
                completions = resp.json().get("data", [])
                top = completions[0] if completions else None
                lei = (
                    ((top or {}).get("relationships", {}) or {})
                    .get("lei-records", {})
                    .get("data", {})
                    .get("id")
                )
                if not lei:
                    self.log(f"No LEI completion found for name: {name}", "warning")
                    continue
                rec_resp = requests.get(
                    f"{GLEIF_API_BASE}/lei-records/{lei}",
                    timeout=30,
                    headers={"Accept": "application/vnd.api+json"},
                )
                rec_resp.raise_for_status()
                rec = rec_resp.json().get("data")
                if rec:
                    all_records[rec["id"]] = rec
            except requests.RequestException as exc:
                self.log(f"Targeted name fetch failed for '{name}': {exc}", "warning")

        records = list(all_records.values())
        self.log(
            f"Targeted fetch complete: {len(records)} unique LEI records "
            f"from {len(self.seed_isins)} ISINs + {len(self.seed_names)} names"
        )
        return records

    @staticmethod
    def seed_names_from_platform_tables(db: Session, limit: int = 200) -> List[str]:
        """
        Convenience helper for callers building a targeted GleifIngester run:
        pull distinct entity/counterparty names already referenced by this
        platform's own data (fi_entities, company_profiles, pcaf_investees)
        that don't yet have an LEI on file, so a scheduled job or admin action
        can aim ingestion at entities the platform actually cares about
        instead of the blind country crawl. Not wired to any schedule by
        default -- callers opt in explicitly.
        """
        rows = db.execute(text("""
            SELECT DISTINCT name FROM (
                SELECT legal_name AS name FROM fi_entities WHERE lei IS NULL AND legal_name IS NOT NULL
                UNION
                SELECT legal_name AS name FROM company_profiles WHERE entity_lei IS NULL AND legal_name IS NOT NULL
                UNION
                SELECT investee_name AS name FROM pcaf_investees WHERE lei IS NULL AND investee_name IS NOT NULL
            ) AS candidates
            WHERE name IS NOT NULL AND length(trim(name)) > 1
            LIMIT :limit
        """), {"limit": limit}).fetchall()
        return [r[0] for r in rows if r[0]]

    def _fetch_blind_crawl(self) -> Any:
        """
        Paginate through GLEIF API and collect raw LEI records.
        Returns a list of GLEIF API record objects.

        This is the original fetch() behaviour, preserved verbatim and kept
        as the default when no seed_names/seed_isins are given (backward
        compatible with the weekly scheduled blind crawl).
        """
        all_records = []
        page = 1

        while page <= self.max_pages:
            params = {
                "page[size]": self.page_size,
                "page[number]": page,
            }

            # Optional country filter for targeted ingestion
            if self.country_filter:
                params["filter[entity.legalAddress.country]"] = self.country_filter

            self.log(f"Fetching page {page} (size={self.page_size})...")

            try:
                resp = requests.get(
                    f"{GLEIF_API_BASE}/lei-records",
                    params=params,
                    timeout=30,
                    headers={"Accept": "application/vnd.api+json"},
                )
                resp.raise_for_status()
            except requests.RequestException as exc:
                self.log(f"API request failed on page {page}: {exc}", "error")
                if all_records:
                    self.log(f"Continuing with {len(all_records)} records fetched so far", "warning")
                    break
                raise

            data = resp.json()
            records = data.get("data", [])

            if not records:
                self.log(f"No more records at page {page}, stopping pagination")
                break

            all_records.extend(records)
            self.log(f"Page {page}: {len(records)} records (total so far: {len(all_records)})")

            # Check if there are more pages
            links = data.get("links", {})
            if not links.get("next"):
                break

            page += 1

        self.log(f"Fetch complete: {len(all_records)} LEI records")
        return all_records

    # ── Stage 2: Validate ─────────────────────────────────────────────────

    def validate(self, raw_data: Any) -> Any:
        """Validate raw GLEIF records — filter out records without LEI."""
        valid = []
        for record in raw_data:
            attrs = record.get("attributes", {})
            lei = attrs.get("lei")
            entity = attrs.get("entity", {})
            legal_name = entity.get("legalName", {}).get("name")

            if not lei or not legal_name:
                continue

            valid.append(record)

        skipped = len(raw_data) - len(valid)
        if skipped:
            self.log(f"Validation: skipped {skipped} records missing LEI or legal name", "warning")

        return valid

    # ── Stage 3: Transform ────────────────────────────────────────────────

    def transform(self, validated_data: Any) -> List[Dict[str, Any]]:
        """Transform GLEIF API records into entity_lei rows."""
        rows = []

        for record in validated_data:
            attrs = record.get("attributes", {})
            entity = attrs.get("entity", {})
            registration = attrs.get("registration", {})

            # Parse addresses
            legal_addr = entity.get("legalAddress", {})
            hq_addr = entity.get("headquartersAddress", {})

            # Parse other names
            other_entity_names = entity.get("otherEntityNames", [])
            other_names = [
                {"name": n.get("name"), "type": n.get("type"), "language": n.get("language")}
                for n in other_entity_names
            ] if other_entity_names else None

            # Parse parent relationships
            relationships = record.get("relationships", {})
            direct_parent = relationships.get("direct-parent", {}).get("data")
            ultimate_parent = relationships.get("ultimate-parent", {}).get("data")

            row = {
                "lei": attrs.get("lei"),
                "legal_name": entity.get("legalName", {}).get("name"),
                "legal_name_language": entity.get("legalName", {}).get("language"),
                "other_names": other_names,
                "status": entity.get("status"),
                "entity_category": entity.get("category"),
                "legal_form_code": entity.get("legalForm", {}).get("id") if entity.get("legalForm") else None,
                "legal_form_name": entity.get("legalForm", {}).get("other") if entity.get("legalForm") else None,
                "jurisdiction": entity.get("jurisdiction"),
                "registered_address": self._parse_address(legal_addr) if legal_addr else None,
                "headquarters_address": self._parse_address(hq_addr) if hq_addr else None,
                # NOTE (fixed 2026-07-05, verified live against GLEIF): GLEIF's
                # entity.registeredAt is the {id, other} dict identifying the
                # REGISTRATION AUTHORITY (e.g. {"id": "RA000598", "other": None});
                # entity.registeredAs is a plain STRING -- the entity's own
                # registration/company number at that authority (e.g. "806592").
                # The previous mapping read the RA id off "registeredAs" and
                # called .get() on that string, which raised AttributeError on
                # every real record where registeredAs was populated (silently
                # swallowed by load()'s per-row try/except, so entity_lei rows
                # for such entities were dropped without surfacing an error).
                "registration_authority_id": (entity.get("registeredAt") or {}).get("id") if isinstance(entity.get("registeredAt"), dict) else None,
                "registration_authority_entity_id": entity.get("registeredAs") if isinstance(entity.get("registeredAs"), str) else None,
                "entity_creation_date": entity.get("creationDate"),
                "entity_expiration_date": entity.get("expirationDate"),
                # Registration
                "managing_lou": registration.get("managingLou"),
                "initial_registration_date": registration.get("initialRegistrationDate"),
                "last_update_date": registration.get("lastUpdateDate"),
                "next_renewal_date": registration.get("nextRenewalDate"),
                "registration_status": registration.get("status"),
                # Parents
                "direct_parent_lei": direct_parent.get("id") if isinstance(direct_parent, dict) else None,
                "ultimate_parent_lei": ultimate_parent.get("id") if isinstance(ultimate_parent, dict) else None,
                "direct_parent_relationship": direct_parent.get("type") if isinstance(direct_parent, dict) else None,
                "ultimate_parent_relationship": ultimate_parent.get("type") if isinstance(ultimate_parent, dict) else None,
                # Metadata
                "source_id": GLEIF_SOURCE_ID,
            }
            rows.append(row)

        return rows

    # ── Stage 4: Load ─────────────────────────────────────────────────────

    def load(self, db: Session, rows: List[Dict[str, Any]]) -> Dict[str, int]:
        """Upsert LEI records into entity_lei using ON CONFLICT."""
        inserted = 0
        updated = 0
        failed = 0

        for i in range(0, len(rows), self.batch_size):
            batch = rows[i:i + self.batch_size]

            for row in batch:
                try:
                    # Convert dicts to JSON strings for JSONB casting
                    import json
                    params = dict(row)
                    for jsonb_col in ("other_names", "registered_address", "headquarters_address"):
                        if params[jsonb_col] is not None:
                            params[jsonb_col] = json.dumps(params[jsonb_col])

                    db.execute(ENTITY_LEI_UPSERT_SQL, params)
                    inserted += 1

                except Exception as exc:
                    failed += 1
                    if failed <= 5:
                        self.log(f"Failed to upsert LEI {row.get('lei')}: {exc}", "warning")

            db.commit()
            self.log(f"Batch committed: {min(i + self.batch_size, len(rows))}/{len(rows)}")

        return {"inserted": inserted, "updated": updated, "skipped": 0, "failed": failed}

    # ── Helpers ────────────────────────────────────────────────────────────

    @staticmethod
    def _parse_address(addr: dict) -> Optional[dict]:
        """Normalize GLEIF address format."""
        if not addr:
            return None
        return {
            "line1": addr.get("addressLines", [None])[0] if addr.get("addressLines") else None,
            "line2": addr.get("addressLines", [None, None])[1] if len(addr.get("addressLines", [])) > 1 else None,
            "city": addr.get("city"),
            "region": addr.get("region"),
            "country": addr.get("country"),
            "postal_code": addr.get("postalCode"),
        }
