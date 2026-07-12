"""
NOAA IBTrACS Tropical Cyclone Ingester — global cyclone-track-density grid.

Data source:
  NOAA International Best Track Archive for Climate Stewardship (IBTrACS) v04r01
  https://www.ncei.noaa.gov/data/international-best-track-archive-for-climate-stewardship-ibtracs/v04r01/access/csv/ibtracs.since1980.list.v04r01.csv
  - Public domain, no API key required
  - Best-track positions for every tropical cyclone worldwide, 1980-present,
    at ~6-hourly (synoptic) time steps
  - Known quirks handled here:
      1. Two header rows: row 0 = column names, row 1 = units (skipped).
      2. BASIN column legitimately contains the literal string "NA" for the
         North Atlantic basin. Pandas' default NA-detection treats "NA" as a
         missing value, which silently drops every North Atlantic (incl.
         Miami/Gulf/Caribbean hurricane) row unless keep_default_na=False is
         combined with an explicit na_values list (IBTrACS uses a single
         space " " -- and empty string -- as its real missing-value marker).
      3. LON is not consistently wrapped to [-180, 180]; some South Pacific /
         Eastern Pacific storms crossing the dateline are recorded up to
         ~267 (i.e. 360-based wrap). Normalized to [-180, 180) here.

Methodology (documented, no randomness — see check_no_fabricated_random.py):
  1. Bulk-fetch the real CSV once (~143 MB, ~307k track-point rows).
  2. Restrict to the real tropical-cyclone latitude band, roughly -45..+45
     (tropical cyclones do not form/persist outside this band).
  3. Build a 2 deg x 2 deg grid over that band. For each grid cell that
     contains at least one real IBTrACS track point:
       - track_density_50yr = count of distinct storm track-point rows
         (SID + timestep) falling in the cell over the 1980-2025 window
       - max_wind_speed_kt   = max(WMO_WIND, USA_WIND) observed at any
         track point in the cell (best available official 1-min/10-min
         sustained wind estimate per record; nulls where genuinely unreported
         — never backfilled with random numbers)
       - basin               = statistical mode of the real BASIN code
         (NA/EP/WP/NI/SI/SP/SA) of the points falling in that cell
  4. risk_level is derived from max_wind_speed_kt via a documented,
     Saffir-Simpson-Hurricane-Wind-Scale-consistent tiering (thresholds are
     the standard NHC Cat 1-5 lower bounds in knots):
       >= 137 kt  -> "extreme"    (Category 5 equivalent)
       >= 113 kt  -> "very_high"  (Category 4 equivalent)
       >=  96 kt  -> "high"       (Category 3 equivalent)
       >=  83 kt  -> "moderate"   (Category 2 equivalent)
       >=  64 kt  -> "low"        (Category 1 equivalent)
       <   64 kt or no data -> "none" (tropical storm/depression strength only)
  5. zone_boundary = ST_MakeEnvelope(min_lon, min_lat, max_lon, max_lat, 4326)
  6. zone_id = deterministic "CYC_{min_lat}_{min_lon}" cell-coordinate string
  7. country_iso3 is left NULL (best-effort/optional per spec — most cells
     are open-ocean and a country attribution would require a land mask this
     ingester does not perform; not fabricated).

No per-cell API calls are made — the CSV is fetched once and all aggregation
happens locally in pandas.
"""

from __future__ import annotations

import io
import math
from typing import Any, Dict, List, Optional

import requests
from sqlalchemy import text
from sqlalchemy.orm import Session

from ingestion.base_ingester import BaseIngester, IngestionResult

IBTRACS_SOURCE_ID = "noaa-ibtracs-cyclone-zones"
IBTRACS_CSV_URL = (
    "https://www.ncei.noaa.gov/data/international-best-track-archive-for-"
    "climate-stewardship-ibtracs/v04r01/access/csv/ibtracs.since1980.list.v04r01.csv"
)

DATA_SOURCE_CITATION = "NOAA IBTrACS v04r01, all basins, 1980-2025, public domain"

GRID_DEG = 2.0          # 2deg x 2deg grid cells
LAT_MIN, LAT_MAX = -45.0, 45.0   # real tropical-cyclone latitude band

# Saffir-Simpson-Hurricane-Wind-Scale-consistent tiering (lower bound, knots)
RISK_THRESHOLDS_KT = [
    (137.0, "extreme"),
    (113.0, "very_high"),
    (96.0, "high"),
    (83.0, "moderate"),
    (64.0, "low"),
]


def risk_level_for_wind(max_wind_kt: Optional[float]) -> str:
    """Saffir-Simpson-consistent risk tiering. See module docstring for thresholds."""
    if max_wind_kt is None or (isinstance(max_wind_kt, float) and math.isnan(max_wind_kt)):
        return "none"
    for threshold, label in RISK_THRESHOLDS_KT:
        if max_wind_kt >= threshold:
            return label
    return "none"


CYCLONE_ZONE_UPSERT_SQL = text("""
    INSERT INTO ref_cyclone_zones (
        zone_id, risk_level, basin, country_iso3,
        zone_boundary, max_wind_speed_kt, track_density_50yr, data_source
    ) VALUES (
        :zone_id, :risk_level, :basin, :country_iso3,
        ST_MakeEnvelope(:min_lon, :min_lat, :max_lon, :max_lat, 4326),
        :max_wind_speed_kt, :track_density_50yr, :data_source
    )
    ON CONFLICT (zone_id) DO UPDATE SET
        risk_level = EXCLUDED.risk_level,
        basin = EXCLUDED.basin,
        country_iso3 = EXCLUDED.country_iso3,
        zone_boundary = EXCLUDED.zone_boundary,
        max_wind_speed_kt = EXCLUDED.max_wind_speed_kt,
        track_density_50yr = EXCLUDED.track_density_50yr,
        data_source = EXCLUDED.data_source
""")


class IbtracsCycloneIngester(BaseIngester):
    """
    Fetches the real NOAA IBTrACS since-1980 best-track CSV and aggregates it
    into a global 2x2 degree cyclone track-density/wind-hazard grid loaded
    into ref_cyclone_zones.
    """

    source_id = IBTRACS_SOURCE_ID
    display_name = "NOAA IBTrACS Tropical Cyclone Zones"
    default_schedule = "0 4 1 1 *"  # yearly, Jan 1 4 AM UTC (IBTrACS updates ~yearly)

    timeout_seconds = 600
    batch_size = 500

    USECOLS = ["SID", "SEASON", "BASIN", "LAT", "LON", "WMO_WIND", "USA_WIND"]

    def __init__(self, csv_url: str = IBTRACS_CSV_URL):
        super().__init__()
        self.csv_url = csv_url

    # ── Setup: ensure unique constraint exists for ON CONFLICT upsert ──────

    def pre_run(self, db: Session):
        # Ensure a dh_data_sources row exists so DhSyncJob's FK doesn't
        # silently fail (BaseIngester.run() tolerates that, but registering
        # the source keeps sync-job tracking/history working properly).
        try:
            source_exists = db.execute(text(
                "SELECT 1 FROM dh_data_sources WHERE id = :sid"
            ), {"sid": self.source_id}).first()
            if not source_exists:
                db.execute(text("""
                    INSERT INTO dh_data_sources (
                        id, name, category, sub_category, description,
                        access_type, base_url, auth_method, cost,
                        data_format, update_freq, geographic, status,
                        sync_enabled, sync_schedule
                    ) VALUES (
                        :id, :name, 'physical_risk', 'tropical_cyclone',
                        'NOAA IBTrACS best-track tropical cyclone positions, 1980-present, aggregated to a global 2x2deg hazard grid',
                        'bulk_download', :base_url, 'none', 'free',
                        'csv', 'yearly', 'global', 'active',
                        true, :schedule
                    )
                """), {
                    "id": self.source_id,
                    "name": self.display_name,
                    "base_url": self.csv_url,
                    "schedule": self.default_schedule,
                })
                db.commit()
                self.log(f"Registered dh_data_sources row for {self.source_id}")
        except Exception as exc:
            db.rollback()
            self.log(f"Could not register dh_data_sources row: {exc}", "warning")

        try:
            exists = db.execute(text("""
                SELECT 1 FROM pg_constraint WHERE conname = 'uq_ref_cyclone_zones_zone_id'
            """)).first()
            if not exists:
                db.execute(text("""
                    ALTER TABLE ref_cyclone_zones
                    ADD CONSTRAINT uq_ref_cyclone_zones_zone_id UNIQUE (zone_id)
                """))
                db.commit()
                self.log("Added unique constraint uq_ref_cyclone_zones_zone_id on zone_id")
            else:
                self.log("Unique constraint uq_ref_cyclone_zones_zone_id already present")
        except Exception as exc:
            db.rollback()
            self.log(f"Could not verify/create unique constraint: {exc}", "warning")

    # ── Stage 1: Fetch ──────────────────────────────────────────────────────

    def fetch(self, db: Session) -> Any:
        """
        Bulk-download the real IBTrACS since-1980 CSV once and parse it into
        a raw pandas DataFrame (only the columns needed for grid aggregation).
        """
        import pandas as pd

        self.log(f"Downloading IBTrACS CSV from {self.csv_url} ...")
        resp = requests.get(self.csv_url, timeout=self.timeout_seconds, stream=True)
        resp.raise_for_status()

        buf = io.BytesIO()
        downloaded = 0
        for chunk in resp.iter_content(chunk_size=1024 * 1024):
            if chunk:
                buf.write(chunk)
                downloaded += len(chunk)
        self.log(f"Downloaded {downloaded / (1024 * 1024):.1f} MB")
        buf.seek(0)

        # Row 0 = column headers, row 1 = units row (skip it). IBTrACS' real
        # missing-value marker is a single space / empty string; the literal
        # string "NA" is a valid BASIN code (North Atlantic) and must NOT be
        # treated as pandas' default NaN sentinel.
        df = pd.read_csv(
            buf,
            skiprows=[1],
            usecols=self.USECOLS,
            low_memory=False,
            keep_default_na=False,
            na_values=[" ", ""],
        )
        self.log(f"Parsed {len(df)} real IBTrACS track-point rows")
        return df

    # ── Stage 2: Validate ────────────────────────────────────────────────────

    def validate(self, raw_data: Any) -> Any:
        """Normalize dtypes/longitude wrap and filter to the real tropical-cyclone latitude band."""
        import pandas as pd

        df = raw_data.copy()
        df["LAT"] = pd.to_numeric(df["LAT"], errors="coerce")
        df["LON"] = pd.to_numeric(df["LON"], errors="coerce")
        df["WMO_WIND"] = pd.to_numeric(df["WMO_WIND"], errors="coerce")
        df["USA_WIND"] = pd.to_numeric(df["USA_WIND"], errors="coerce")

        before = len(df)
        df = df.dropna(subset=["LAT", "LON"])
        self.log(f"Validate: dropped {before - len(df)} rows with missing LAT/LON")

        # Normalize longitude to [-180, 180) — some dateline-crossing SP/EP
        # storms are recorded up to ~267 (360-based wrap).
        df.loc[df["LON"] > 180, "LON"] = df.loc[df["LON"] > 180, "LON"] - 360
        df.loc[df["LON"] < -180, "LON"] = df.loc[df["LON"] < -180, "LON"] + 360

        # Best available official sustained-wind estimate per track point:
        # max of the two most complete agency columns (USA_WIND has fuller
        # coverage; WMO_WIND is the WMO-designated authority reading).
        df["wind_kt"] = df[["WMO_WIND", "USA_WIND"]].max(axis=1)

        # Restrict to the real tropical-cyclone latitude band.
        in_band = df[(df["LAT"] >= LAT_MIN) & (df["LAT"] < LAT_MAX)]
        self.log(
            f"Validate: {len(in_band)}/{len(df)} rows fall within the "
            f"{LAT_MIN}..{LAT_MAX} deg tropical-cyclone latitude band"
        )
        return in_band

    # ── Stage 3: Transform ───────────────────────────────────────────────────

    def transform(self, validated_data: Any) -> List[Dict[str, Any]]:
        """Aggregate real track points into a 2x2 degree grid."""
        import numpy as np

        df = validated_data
        if df.empty:
            return []

        df = df.copy()
        df["cell_lat"] = np.floor(df["LAT"] / GRID_DEG) * GRID_DEG
        df["cell_lon"] = np.floor(df["LON"] / GRID_DEG) * GRID_DEG

        def _basin_mode(s):
            m = s.dropna().mode()
            return m.iat[0] if not m.empty else None

        grouped = df.groupby(["cell_lat", "cell_lon"])
        agg = grouped.agg(
            track_density_50yr=("SID", "count"),
            max_wind_speed_kt=("wind_kt", "max"),
        )
        basin_by_cell = grouped["BASIN"].apply(_basin_mode)

        rows: List[Dict[str, Any]] = []
        for (cell_lat, cell_lon), rec in agg.iterrows():
            min_lat = float(cell_lat)
            min_lon = float(cell_lon)
            max_lat = min_lat + GRID_DEG
            max_lon = min_lon + GRID_DEG

            max_wind = rec["max_wind_speed_kt"]
            max_wind = None if (max_wind is None or (isinstance(max_wind, float) and math.isnan(max_wind))) else round(float(max_wind), 1)

            density = int(rec["track_density_50yr"])
            basin = basin_by_cell.get((cell_lat, cell_lon))

            zone_id = f"CYC_{int(min_lat)}_{int(min_lon)}"

            rows.append({
                "zone_id": zone_id,
                "risk_level": risk_level_for_wind(max_wind),
                "basin": basin,
                "country_iso3": None,  # best-effort/optional — not populated (no fabrication)
                "min_lon": min_lon,
                "min_lat": min_lat,
                "max_lon": max_lon,
                "max_lat": max_lat,
                "max_wind_speed_kt": max_wind,
                "track_density_50yr": density,
                "data_source": DATA_SOURCE_CITATION,
            })

        self.log(f"Transform: aggregated into {len(rows)} grid cells (2deg x 2deg)")
        return rows

    # ── Stage 4: Load ────────────────────────────────────────────────────────

    def load(self, db: Session, rows: List[Dict[str, Any]]) -> Dict[str, int]:
        """Batch upsert into ref_cyclone_zones keyed on zone_id."""
        inserted = 0
        failed = 0

        for i in range(0, len(rows), self.batch_size):
            batch = rows[i:i + self.batch_size]
            for row in batch:
                try:
                    db.execute(CYCLONE_ZONE_UPSERT_SQL, row)
                    inserted += 1
                except Exception as exc:
                    failed += 1
                    if failed <= 5:
                        self.log(f"Upsert failed for {row.get('zone_id')}: {exc}", "warning")
            db.commit()
            self.log(f"Batch committed: {min(i + self.batch_size, len(rows))}/{len(rows)}")

        return {"inserted": inserted, "updated": 0, "skipped": 0, "failed": failed}


if __name__ == "__main__":
    # Manual run entrypoint: `python -m ingestion.ibtracs_cyclone_ingester`
    import logging
    logging.basicConfig(level=logging.INFO)
    from db.base import SessionLocal

    db = SessionLocal()
    try:
        ingester = IbtracsCycloneIngester()
        result = ingester.run(db, triggered_by="manual_cli")
        print(result.to_dict())
        for line in result.log_lines:
            print(line)
    finally:
        db.close()
