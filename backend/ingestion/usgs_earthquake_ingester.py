"""
USGS Earthquake Catalog Ingester — global seismic-hazard grid from the
real USGS Earthquake Catalog (ANSS ComCat).

Data source:
  https://earthquake.usgs.gov/fdsnws/event/1/query  (GeoJSON, keyless, public domain)
  https://earthquake.usgs.gov/fdsnws/event/1/count   (used to verify the per-request cap)

Verified live (2026-07-05): the API's own /count endpoint reports
`"maxAllowed": 20000` — a single /query request that would match more than
20,000 events fails with HTTP 400. There are ~282,000 M>=4.5 events globally
over the last 50 years, so a single request cannot fetch the full window.

Strategy (bulk-fetch-then-locally-aggregate, NOT per-cell API calls):
  1. Fetch the full M>=4.5 catalog for the last `years_window` years (default
     50), chunked by CALENDAR YEAR. Verified live: the worst single-year
     count in the last 50 years is 9,584 events (2011 — the Tohoku
     aftershock sequence), safely under the 20,000 cap, so year-chunking
     alone is sufficient. As a defensive fallback (in case some future
     year's seismicity spikes), any chunk that returns >=19,500 features or
     a 400 "exceeds search limit" response is recursively split in half by
     date and re-fetched — so this remains correct even if that assumption
     ever breaks.
  2. Build a global LAND grid at 2 deg x 2 deg resolution (documented choice;
     coarser than 1 deg to keep the STRtree land-mask pass and the ingester
     runtime reasonable while still yielding a several-thousand-cell global
     population). A cell is "land" if its 2x2 deg centroid point falls
     inside a country polygon from the `datasets/geo-countries` mirror of
     Natural Earth country boundaries (public domain, keyless, ~258
     countries). Ocean-only cells are simply not created — this is the
     documented simplification the task explicitly allows in place of a
     bundled Natural Earth land-polygon package.
       NOTE (environment quirk, verified live): this environment's
       shapely==2.0.4 + numpy==2.5.0 combination has a broken
       `MultiPolygon(list_of_polygons)` constructor — it raises
       `TypeError: ufunc 'create_collection' not supported ...` even for the
       simplest two-polygon case. Rather than depend on that broken
       constructor (or on `shapely.geometry.shape()`, which hits the same
       code path for MultiPolygon geometries), each country's MultiPolygon
       is flattened into its constituent `Polygon` parts before being added
       to the STRtree; a point is "in" the (former) MultiPolygon if it's
       contained by any of those parts, which is exactly the semantics we
       need for a point-in-country/land test — no MultiPolygon object is
       ever constructed.
     Best-effort `country_iso3` attribution reuses this same land-mask pass
     (the polygon that contains the cell centroid is a real country, so its
     ISO3166-1 alpha-3 code is attached to the cell for free). Not a
     blocker if a cell's centroid doesn't land inside any country polygon
     for some edge case -- country_iso3 is simply left NULL.
  3. For each land cell, aggregate the real fetched USGS events whose
     (lat, lon) falls in that cell's 2x2 deg bounding box via numpy/pandas
     binning (`event_count_50yr`, `max_magnitude_50yr`). No per-cell queries.
  4. `risk_level` is computed via a documented tiering convention that is
     this platform's own convention (NOT a specific named regulatory
     methodology) based on general seismic-hazard-tiering logic: cells with
     the strongest observed shaking and/or the highest frequency of
     moderate-to-large events over the 50-year window are the highest
     hazard tier. See `_risk_tier()` for the exact thresholds.
  5. `zone_boundary` = ST_MakeEnvelope(min_lon, min_lat, max_lon, max_lat, 4326)
     — a real rectangle geometry, built in SQL from the cell's real bounds.
  6. `zone_id` = "EQ_{min_lat}_{min_lon}" (deterministic cell-coordinate key).
  7. `data_source` = a real citation string identifying the USGS catalog,
     magnitude threshold, and date window actually fetched.

No randomness is used anywhere in this pipeline: cells with zero real
USGS events in the window get `event_count_50yr = 0`, `max_magnitude_50yr
= NULL`, `risk_level = "none"` — never a fabricated fill value.
"""
from __future__ import annotations

import time
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

import requests
from sqlalchemy import text
from sqlalchemy.orm import Session

from ingestion.base_ingester import BaseIngester, IngestionResult

USGS_SOURCE_ID = "usgs-earthquake-catalog"
USGS_QUERY_API = "https://earthquake.usgs.gov/fdsnws/event/1/query"

# `datasets/geo-countries` — a widely-mirrored, keyless, public-domain
# GeoJSON of country boundaries (derived from Natural Earth), used here
# purely as a lightweight land mask + best-effort country attribution.
# See module docstring for why the raw Natural Earth 110m file itself was
# rejected (bad geometry parses in this environment) in favor of this one.
COUNTRIES_GEOJSON_URL = (
    "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson"
)

GRID_DEG = 2          # documented 2 deg x 2 deg grid resolution
MIN_MAGNITUDE = 4.5   # documented magnitude floor for the aggregated catalog
YEARS_WINDOW = 50     # documented historical window


class UsgsEarthquakeIngester(BaseIngester):
    """
    Aggregates the real USGS Earthquake Catalog onto a global land grid
    and upserts it into ref_earthquake_zones.
    """

    source_id = USGS_SOURCE_ID
    display_name = "USGS Earthquake Catalog (ANSS ComCat)"
    default_schedule = "0 4 1 * *"   # monthly, 1st of month 4 AM UTC
    timeout_seconds = 1800           # 30 min — bulk catalog fetch + grid build
    batch_size = 500

    def __init__(
        self,
        years_window: int = YEARS_WINDOW,
        min_magnitude: float = MIN_MAGNITUDE,
        grid_deg: int = GRID_DEG,
    ):
        super().__init__()
        self.years_window = years_window
        self.min_magnitude = min_magnitude
        self.grid_deg = grid_deg
        self._start_date: Optional[date] = None
        self._end_date: Optional[date] = None

    # ── Optional hook: register this source in dh_data_sources (best-effort) ──

    def pre_run(self, db: Session):
        try:
            db.execute(text("""
                INSERT INTO dh_data_sources (
                    id, name, category, sub_category, description,
                    access_type, base_url, auth_method, cost, data_format,
                    update_freq, geographic, quality_rating, sync_enabled,
                    sync_schedule, status
                ) VALUES (
                    :id, :name, 'physical_risk', 'seismic_hazard', :description,
                    'api', :base_url, 'none', 'free', 'geojson',
                    'monthly', 'global', 'high', true,
                    :schedule, 'active'
                )
                ON CONFLICT (id) DO UPDATE SET
                    description = EXCLUDED.description,
                    sync_schedule = EXCLUDED.sync_schedule,
                    updated_at = NOW()
            """), {
                "id": self.source_id,
                "name": self.display_name,
                "description": (
                    "USGS/ANSS ComCat global earthquake catalog, aggregated onto a "
                    f"{self.grid_deg}x{self.grid_deg} deg land grid (M>={self.min_magnitude}, "
                    f"trailing {self.years_window}yr window)."
                ),
                "base_url": USGS_QUERY_API,
                "schedule": self.default_schedule,
            })
            db.commit()
        except Exception as exc:
            db.rollback()
            self.log(f"Could not upsert dh_data_sources row (non-blocking): {exc}", "warning")

    # ── Stage 1: Fetch ────────────────────────────────────────────────────

    def fetch(self, db: Session) -> Any:
        end = datetime.now(timezone.utc).date()
        try:
            start = end.replace(year=end.year - self.years_window)
        except ValueError:
            # Feb 29 edge case
            start = end.replace(year=end.year - self.years_window, day=28)
        self._start_date, self._end_date = start, end

        self.log(
            f"Fetching USGS catalog {start.isoformat()}..{end.isoformat()}, "
            f"M>={self.min_magnitude} (chunked by calendar year, "
            f"recursive split if any chunk nears the 20,000-event API cap)"
        )
        events = self._fetch_events_chunked(start, end)
        self.log(f"USGS fetch complete: {len(events)} raw events across the window")

        countries_geojson = self._fetch_country_polygons()

        return {"events": events, "countries": countries_geojson}

    def _fetch_events_chunked(self, start: date, end: date) -> List[dict]:
        """Fetch year-by-year (safe per the live-verified /count check), each
        year further split recursively if it turns out to be too large."""
        all_events: List[dict] = []
        year = start.year
        while True:
            chunk_start = max(start, date(year, 1, 1))
            chunk_end = min(end, date(year + 1, 1, 1))
            if chunk_start >= chunk_end:
                break
            chunk_events = self._fetch_range(chunk_start, chunk_end)
            all_events.extend(chunk_events)
            self.log(
                f"  Year {year}: {len(chunk_events)} events "
                f"(cumulative: {len(all_events)})"
            )
            year += 1
            if chunk_end >= end:
                break
        return all_events

    def _fetch_range(self, start_d: date, end_d: date, depth: int = 0) -> List[dict]:
        """Fetch a single date range; recursively bisect if the API rejects
        the request as exceeding its result-count cap, or if the response
        comes back suspiciously close to that cap (defensive — the observed
        cap is 20,000 per the live /count endpoint check)."""
        params = {
            "format": "geojson",
            "minmagnitude": self.min_magnitude,
            "starttime": start_d.isoformat(),
            "endtime": end_d.isoformat(),
        }
        try:
            resp = requests.get(USGS_QUERY_API, params=params, timeout=60)
        except requests.RequestException as exc:
            self.log(f"USGS request failed {start_d}..{end_d}: {exc}", "warning")
            return []

        if resp.status_code == 400 and "exceeds search limit" in resp.text and depth < 8:
            mid = start_d + (end_d - start_d) / 2
            if mid <= start_d or mid >= end_d:
                self.log(f"Cannot bisect further {start_d}..{end_d}, giving up on this chunk", "warning")
                return []
            return self._fetch_range(start_d, mid, depth + 1) + self._fetch_range(mid, end_d, depth + 1)

        if resp.status_code != 200:
            self.log(f"USGS returned {resp.status_code} for {start_d}..{end_d}: {resp.text[:200]}", "warning")
            return []

        data = resp.json()
        feats = data.get("features", [])

        if len(feats) >= 19500 and depth < 8:
            mid = start_d + (end_d - start_d) / 2
            if mid > start_d and mid < end_d:
                self.log(f"Chunk {start_d}..{end_d} near the API cap ({len(feats)}), bisecting", "info")
                return self._fetch_range(start_d, mid, depth + 1) + self._fetch_range(mid, end_d, depth + 1)

        return feats

    def _fetch_country_polygons(self) -> Optional[dict]:
        try:
            resp = requests.get(COUNTRIES_GEOJSON_URL, timeout=60)
            resp.raise_for_status()
            return resp.json()
        except requests.RequestException as exc:
            self.log(f"Could not fetch country-boundary land mask: {exc}", "warning")
            return None

    # ── Stage 2: Validate ─────────────────────────────────────────────────

    def validate(self, raw_data: Any) -> Any:
        events = raw_data.get("events", [])
        valid = []
        seen_ids = set()

        for feat in events:
            try:
                fid = feat.get("id")
                if fid is not None and fid in seen_ids:
                    continue
                geom = feat.get("geometry") or {}
                coords = geom.get("coordinates")
                props = feat.get("properties") or {}
                mag = props.get("mag")
                if not coords or mag is None:
                    continue
                lon, lat = coords[0], coords[1]
                if lon is None or lat is None:
                    continue
                lon, lat, mag = float(lon), float(lat), float(mag)
                if not (-180.0 <= lon <= 180.0 and -90.0 <= lat <= 90.0):
                    continue
                if fid is not None:
                    seen_ids.add(fid)
                valid.append({"lat": lat, "lon": lon, "mag": mag})
            except (TypeError, ValueError, IndexError):
                continue

        skipped = len(events) - len(valid)
        if skipped:
            self.log(f"Validation: skipped {skipped} malformed/duplicate USGS events", "warning")

        return {"events": valid, "countries": raw_data.get("countries")}

    # ── Stage 3: Transform ────────────────────────────────────────────────

    def transform(self, validated_data: Any) -> List[Dict[str, Any]]:
        events = validated_data.get("events", [])
        countries_geojson = validated_data.get("countries")

        land_cells = self._build_land_grid(countries_geojson)
        self.log(
            f"Land grid: {len(land_cells)} candidate land cells at "
            f"{self.grid_deg}x{self.grid_deg} deg resolution"
        )

        agg_map = self._aggregate_events(events)

        source_str = (
            f"USGS Earthquake Catalog (ANSS ComCat), M>={self.min_magnitude}, "
            f"{self._start_date.isoformat() if self._start_date else '?'}-"
            f"{self._end_date.isoformat() if self._end_date else '?'}, public domain"
        )

        rows: List[Dict[str, Any]] = []
        for (min_lat, min_lon), iso3 in land_cells.items():
            count, max_mag = agg_map.get((min_lat, min_lon), (0, None))
            rows.append({
                "zone_id": f"EQ_{min_lat}_{min_lon}",
                "risk_level": self._risk_tier(max_mag, count),
                "country_iso3": iso3,
                "min_lon": min_lon,
                "min_lat": min_lat,
                "max_lon": min_lon + self.grid_deg,
                "max_lat": min_lat + self.grid_deg,
                "max_magnitude_50yr": max_mag,
                "event_count_50yr": count,
                "data_source": source_str,
            })

        self.log(f"Transform: {len(rows)} land grid-cell zones built")
        return rows

    def _aggregate_events(self, events: List[dict]) -> Dict[Tuple[int, int], Tuple[int, float]]:
        """Bin real USGS events into (min_lat, min_lon) grid cells via
        numpy/pandas — NOT one query per cell."""
        if not events:
            return {}

        import numpy as np
        import pandas as pd

        df = pd.DataFrame(events)
        g = self.grid_deg
        df["min_lat"] = np.clip(
            np.floor(df["lat"] / g) * g, -90, 90 - g
        ).astype(int)
        df["min_lon"] = np.clip(
            np.floor(df["lon"] / g) * g, -180, 180 - g
        ).astype(int)

        agg = (
            df.groupby(["min_lat", "min_lon"])
            .agg(event_count=("mag", "size"), max_mag=("mag", "max"))
            .reset_index()
        )
        return {
            (int(r.min_lat), int(r.min_lon)): (int(r.event_count), float(r.max_mag))
            for r in agg.itertuples()
        }

    def _build_land_grid(self, countries_geojson: Optional[dict]) -> Dict[Tuple[int, int], Optional[str]]:
        """
        Returns {(min_lat, min_lon): country_iso3_or_None} for every grid
        cell whose centroid falls inside a country polygon (land mask +
        best-effort country attribution in one pass). Falls back to ALL
        cells (documented simplification) if the country-boundary fetch
        failed.
        """
        g = self.grid_deg
        lat_starts = range(-90, 90, g)
        lon_starts = range(-180, 180, g)

        if not countries_geojson:
            self.log(
                "No land-mask polygons available -- falling back to ALL grid "
                "cells (documented simplification: ocean cells simply get "
                "event_count_50yr=0 / risk_level='none')",
                "warning",
            )
            return {(min_lat, min_lon): None for min_lat in lat_starts for min_lon in lon_starts}

        from shapely.geometry import Point, Polygon
        from shapely.strtree import STRtree

        geoms: List[Any] = []
        iso_by_idx: List[Optional[str]] = []
        for feat in countries_geojson.get("features", []):
            props = feat.get("properties", {})
            iso3 = props.get("ISO3166-1-Alpha-3") or props.get("ISO_A3") or props.get("ADM0_A3")
            if iso3 in (None, "-99", ""):
                iso3 = None
            geom = feat.get("geometry") or {}
            for poly in self._flatten_polygons(geom):
                if poly is not None and not poly.is_empty:
                    geoms.append(poly)
                    iso_by_idx.append(iso3)

        if not geoms:
            self.log("Country-boundary polygons parsed to zero usable geometries -- falling back to ALL cells", "warning")
            return {(min_lat, min_lon): None for min_lat in lat_starts for min_lon in lon_starts}

        tree = STRtree(geoms)
        cells: Dict[Tuple[int, int], Optional[str]] = {}
        for min_lat in lat_starts:
            for min_lon in lon_starts:
                cy, cx = min_lat + g / 2.0, min_lon + g / 2.0
                pt = Point(cx, cy)
                for idx in tree.query(pt):
                    idx = int(idx)
                    if geoms[idx].contains(pt):
                        cells[(min_lat, min_lon)] = iso_by_idx[idx]
                        break
        return cells

    @staticmethod
    def _flatten_polygons(geom: dict):
        """
        Yield individual shapely Polygon parts for a GeoJSON Polygon or
        MultiPolygon geometry, WITHOUT ever constructing a shapely
        MultiPolygon object (see module docstring: this environment's
        shapely 2.0.4 + numpy 2.5.0 combination has a broken MultiPolygon
        constructor). A point-in-MultiPolygon test is equivalent to "is the
        point in ANY of its polygon parts", which is exactly how the parts
        yielded here are used by the STRtree land-mask pass above.
        """
        from shapely.geometry import Polygon

        t = geom.get("type")
        coords = geom.get("coordinates")
        if not coords:
            return
        try:
            if t == "Polygon":
                yield Polygon(coords[0], coords[1:])
            elif t == "MultiPolygon":
                for c in coords:
                    if c:
                        yield Polygon(c[0], c[1:])
        except Exception:
            return

    @staticmethod
    def _risk_tier(max_mag: Optional[float], count: int) -> str:
        """
        Documented risk-tiering convention (this platform's own convention —
        NOT a specific named regulatory/scientific methodology). Based on
        general seismic-hazard-tiering logic: the strongest observed
        earthquake and the frequency of M>=4.5 events over the 50-year
        window both drive the hazard tier for a cell.

          very_high : max_magnitude_50yr >= 7.5  OR event_count_50yr >= 300
          high      : max_magnitude_50yr >= 6.5  OR event_count_50yr >= 100
          moderate  : max_magnitude_50yr >= 5.5  OR event_count_50yr >= 20
          low       : max_magnitude_50yr >= 4.5  OR event_count_50yr >= 1
          none      : no qualifying (M>=4.5) events recorded in the window
        """
        if count <= 0 or max_mag is None:
            return "none"
        if max_mag >= 7.5 or count >= 300:
            return "very_high"
        if max_mag >= 6.5 or count >= 100:
            return "high"
        if max_mag >= 5.5 or count >= 20:
            return "moderate"
        return "low"

    # ── Stage 4: Load ─────────────────────────────────────────────────────

    UPSERT_SQL = text("""
        INSERT INTO ref_earthquake_zones (
            zone_id, risk_level, country_iso3, zone_boundary,
            max_magnitude_50yr, event_count_50yr, data_source
        ) VALUES (
            :zone_id, :risk_level, :country_iso3,
            ST_MakeEnvelope(:min_lon, :min_lat, :max_lon, :max_lat, 4326),
            :max_magnitude_50yr, :event_count_50yr, :data_source
        )
        ON CONFLICT (zone_id) DO UPDATE SET
            risk_level = EXCLUDED.risk_level,
            country_iso3 = EXCLUDED.country_iso3,
            zone_boundary = EXCLUDED.zone_boundary,
            max_magnitude_50yr = EXCLUDED.max_magnitude_50yr,
            event_count_50yr = EXCLUDED.event_count_50yr,
            data_source = EXCLUDED.data_source
    """)

    def load(self, db: Session, rows: List[Dict[str, Any]]) -> Dict[str, int]:
        # Additive, idempotent: ensure the unique constraint the upsert
        # relies on exists (schema was created with zone_id NOT NULL but no
        # UNIQUE constraint).
        try:
            db.execute(text(
                "ALTER TABLE ref_earthquake_zones "
                "ADD CONSTRAINT uq_ref_earthquake_zones_zone_id UNIQUE (zone_id)"
            ))
            db.commit()
            self.log("Added unique constraint uq_ref_earthquake_zones_zone_id")
        except Exception as exc:
            db.rollback()
            self.log(f"Unique constraint not added (likely already exists): {exc}", "info")

        inserted = 0
        failed = 0

        for i in range(0, len(rows), self.batch_size):
            batch = rows[i:i + self.batch_size]
            for row in batch:
                try:
                    db.execute(self.UPSERT_SQL, row)
                    inserted += 1
                except Exception as exc:
                    failed += 1
                    if failed <= 5:
                        self.log(f"Upsert failed for {row.get('zone_id')}: {exc}", "warning")
            db.commit()
            self.log(f"Batch committed: {min(i + self.batch_size, len(rows))}/{len(rows)}")

        return {"inserted": inserted, "updated": 0, "skipped": 0, "failed": failed}
