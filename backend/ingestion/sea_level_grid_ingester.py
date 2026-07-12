"""
Sea-Level Rise Zone Ingester -- IPCC AR6-consistent global-mean SLR figures
applied to named, real, well-documented low-lying coastal locations.
============================================================================

Populates ref_sea_level_zones for the first time (table existed with 0 rows
prior to this ingester; schema and unique constraint on zone_id unchanged).

METHODOLOGY (documented honestly -- see also the ingestion report):
  A full-resolution global coastal-elevation DEM (e.g. Copernicus GLO-30,
  NASA SRTM) is not something this ingester can cheaply/quickly turn into a
  "low-lying coastal cell" mask in this environment -- that requires either
  a paid/registered bulk DEM download (Copernicus GLO-30 requires a free
  CDSE account + multi-GB per-tile downloads; SRTM void-filled tiles are
  similarly heavy) or a licensed elevation API. Rather than claim
  full-fidelity global coastal-elevation coverage this ingester cannot
  actually source freely and quickly, it follows the fallback the task
  explicitly sanctions: apply REAL, published, IPCC AR6-consistent global
  mean sea-level-rise-by-scenario figures UNIFORMLY to a documented set of
  38 REAL, named, well-documented low-lying coastal locations (major
  deltas, small island states, and historically flood-exposed coastal
  cities) rather than to a synthetic global grid.

  Sea-level-rise figures: IPCC AR6 WG1 (2021), Chapter 9 (Fox-Kemper et al.),
  Table 9.9 -- global mean sea level rise, median of the *likely* (17-83rd
  percentile) range, relative to a 1995-2014 baseline:
      SSP1-2.6 ("low"):  2050 = +0.18 m   2100 = +0.44 m
      SSP5-8.5 ("high"): 2050 = +0.23 m   2100 = +0.77 m
  These are the same figures reproduced by NOAA's 2022 Sea Level Rise
  Technical Report and NASA's Sea Level Projection Tool
  (https://sealevel.nasa.gov/ipcc-ar6-sea-level-projection-tool/), which
  cross-walk to this platform's NGFS scenario spectrum as: SSP1-2.6 ~=
  NGFS "Orderly" (Net Zero 2050 / Below 2C), SSP5-8.5 ~= NGFS "Hot house
  world" (Current Policies) -- see backend/data/ngfs_phase5_extract.json.

  zone_boundary: a small (~0.1 deg, ~11 km) real bounding box centered on
  each location's documented city-center / coastal-point coordinates -- NOT
  a coastal-elevation-derived polygon. This is a coarse proxy zone for
  point-in-polygon hazard screening (see api/v1/routes/spatial.py
  /point/hazards), not a production-grade inundation footprint.

  Coverage is intentionally a curated 38-location set, not a full global
  grid -- see module docstring in flood_grid_ingester.py for the same
  honesty framing applied to flood zones.
"""
from __future__ import annotations

from typing import Any, Dict, List

from sqlalchemy import text
from sqlalchemy.orm import Session

from ingestion.base_ingester import BaseIngester

SLR_SOURCE_ID = "ipcc-ar6-sea-level-rise"

DATA_SOURCE_CITATION = (
    "IPCC AR6 WG1 (2021) Ch.9 Table 9.9 global-mean SLR (median of likely "
    "range, vs 1995-2014 baseline); NASA Sea Level Projection Tool "
    "(sealevel.nasa.gov/ipcc-ar6-sea-level-projection-tool); applied uniformly "
    "to a named real low-lying coastal location -- NOT location-specific "
    "elevation modeling. See sea_level_grid_ingester.py docstring."
)

# Real IPCC AR6-consistent global mean SLR by scenario/horizon (meters, vs 1995-2014).
SLR_SCENARIOS: Dict[str, Dict[int, float]] = {
    "SSP1-2.6": {2050: 0.18, 2100: 0.44},   # NGFS-equivalent: Orderly / low
    "SSP5-8.5": {2050: 0.23, 2100: 0.77},   # NGFS-equivalent: Hot house world / high
}

# 38 real, named, well-documented low-lying coastal locations.
# (code, name, country_iso3, lat, lon)
SLR_LOCATIONS: List[tuple] = [
    ("MIA", "Miami, FL, USA", "USA", 25.7617, -80.1918),
    ("NOL", "New Orleans, LA, USA", "USA", 29.9511, -90.0715),
    ("NOR", "Norfolk, VA, USA", "USA", 36.8508, -76.2859),
    ("CHS", "Charleston, SC, USA", "USA", 32.7765, -79.9311),
    ("NYC", "New York City, NY, USA", "USA", 40.7128, -74.0060),
    ("BOS", "Boston, MA, USA", "USA", 42.3601, -71.0589),
    ("RTM", "Rotterdam, Netherlands", "NLD", 51.9244, 4.4777),
    ("AMS", "Amsterdam, Netherlands", "NLD", 52.3676, 4.9041),
    ("VCE", "Venice, Italy", "ITA", 45.4408, 12.3155),
    ("JKT", "Jakarta, Indonesia", "IDN", -6.2088, 106.8456),
    ("BKK", "Bangkok, Thailand", "THA", 13.7563, 100.5018),
    ("SGN", "Ho Chi Minh City, Vietnam", "VNM", 10.7769, 106.7009),
    ("MNL", "Manila, Philippines", "PHL", 14.5995, 120.9842),
    ("DHA", "Dhaka, Bangladesh", "BGD", 23.8103, 90.4125),
    ("CGP", "Chittagong, Bangladesh", "BGD", 22.3569, 91.7832),
    ("KHL", "Khulna, Bangladesh", "BGD", 22.8456, 89.5403),
    ("CCU", "Kolkata, India", "IND", 22.5726, 88.3639),
    ("BOM", "Mumbai, India", "IND", 19.0760, 72.8777),
    ("LOS", "Lagos, Nigeria", "NGA", 6.5244, 3.3792),
    ("ALX", "Alexandria, Egypt", "EGY", 31.2001, 29.9187),
    ("PSD", "Port Said, Egypt (Nile Delta)", "EGY", 31.2653, 32.3019),
    ("MLE", "Male, Maldives", "MDV", 4.1755, 73.5093),
    ("FUN", "Funafuti, Tuvalu", "TUV", -8.5211, 179.1983),
    ("MAJ", "Majuro, Marshall Islands", "MHL", 7.1164, 171.1858),
    ("TRW", "Tarawa, Kiribati", "KIR", 1.3291, 172.9790),
    ("SUV", "Suva, Fiji", "FJI", -18.1248, 178.4501),
    ("SHA", "Shanghai, China", "CHN", 31.2304, 121.4737),
    ("GZH", "Guangzhou, China (Pearl River Delta)", "CHN", 23.1291, 113.2644),
    ("TSN", "Tianjin, China", "CHN", 39.3434, 117.3616),
    ("OSA", "Osaka, Japan", "JPN", 34.6937, 135.5023),
    ("CPH", "Copenhagen, Denmark", "DNK", 55.6761, 12.5683),
    ("HAM", "Hamburg, Germany", "DEU", 53.5511, 9.9937),
    ("LON", "London, UK (Thames Estuary)", "GBR", 51.5074, -0.1278),
    ("BSR", "Basra, Iraq (Shatt al-Arab delta)", "IRQ", 30.5085, 47.7835),
    ("GEO", "Georgetown, Guyana", "GUY", 6.8013, -58.1551),
    ("ABJ", "Abidjan, Ivory Coast", "CIV", 5.3600, -4.0083),
    ("MPM", "Maputo, Mozambique", "MOZ", -25.9692, 32.5732),
    ("BEW", "Beira, Mozambique", "MOZ", -19.8317, 34.8389),
]

HALF_WIDTH_DEG = 0.05  # ~5.5 km at the equator -- coarse proxy zone, not a modeled footprint


def _bbox_wkt(lat: float, lon: float, half_width: float = HALF_WIDTH_DEG) -> str:
    """Small real bounding-box polygon (WKT) centered on (lat, lon)."""
    lo_lon, hi_lon = lon - half_width, lon + half_width
    lo_lat, hi_lat = lat - half_width, lat + half_width
    return (
        f"POLYGON(({lo_lon} {lo_lat}, {hi_lon} {lo_lat}, {hi_lon} {hi_lat}, "
        f"{lo_lon} {hi_lat}, {lo_lon} {lo_lat}))"
    )


UPSERT_SQL = text("""
    INSERT INTO ref_sea_level_zones (
        zone_id, slr_scenario, horizon_year, country_iso3,
        zone_boundary, slr_m, data_source, created_at
    ) VALUES (
        :zone_id, :slr_scenario, :horizon_year, :country_iso3,
        ST_Multi(ST_GeomFromText(:wkt, 4326)), :slr_m, :data_source, NOW()
    )
    ON CONFLICT (zone_id) DO UPDATE SET
        slr_scenario = EXCLUDED.slr_scenario,
        horizon_year = EXCLUDED.horizon_year,
        country_iso3 = EXCLUDED.country_iso3,
        zone_boundary = EXCLUDED.zone_boundary,
        slr_m = EXCLUDED.slr_m,
        data_source = EXCLUDED.data_source
""")


class SeaLevelGridIngester(BaseIngester):
    """
    Populates ref_sea_level_zones: 38 real named low-lying coastal locations
    x 2 IPCC AR6 scenarios (SSP1-2.6 low / SSP5-8.5 high) x 2 horizons
    (2050 / 2100) = 152 rows.
    """

    source_id = SLR_SOURCE_ID
    display_name = "IPCC AR6 Sea-Level Rise (named coastal locations)"
    default_schedule = ""  # static/reference data -- manual re-run only, no live upstream

    def pre_run(self, db: Session):
        # Idempotent registration in dh_data_sources so DhSyncJob's FK resolves
        # (mirrors the convention used by wdpa_gfw_ingester / gleif_ingester).
        db.execute(text("""
            INSERT INTO dh_data_sources (
                id, name, category, sub_category, rationale, access_type,
                base_url, cost, rate_limit, data_format, update_freq,
                geographic, quality_rating, status, priority, utility,
                created_at, updated_at
            ) VALUES (
                :id, :name, 'Physical Climate Risk', 'Sea Level Rise',
                'Real IPCC AR6-consistent global mean SLR-by-scenario figures applied to named low-lying coastal locations for physical-risk hazard screening',
                'Static reference dataset', 'https://sealevel.nasa.gov/ipcc-ar6-sea-level-projection-tool/',
                'Free', 'N/A (static)', 'GeoJSON/polygon', 'Static (IPCC AR6, 2021)',
                'Global (38 named locations)', 'A', 'active', 'P1', 'physical_risk_screening',
                NOW(), NOW()
            )
            ON CONFLICT (id) DO NOTHING
        """), {"id": SLR_SOURCE_ID, "name": "IPCC AR6 Sea-Level Rise (named coastal locations)"})
        db.commit()

    def fetch(self, db: Session) -> Any:
        """No live upstream call -- returns the embedded, cited reference
        dataset (real IPCC AR6 figures + real named locations)."""
        self.log(f"Using embedded reference dataset: {len(SLR_LOCATIONS)} locations x "
                 f"{len(SLR_SCENARIOS)} scenarios x 2 horizons")
        return {"locations": SLR_LOCATIONS, "scenarios": SLR_SCENARIOS}

    def validate(self, raw_data: Any) -> Any:
        locations = raw_data["locations"]
        assert all(len(loc) == 5 for loc in locations), "malformed location tuple"
        return raw_data

    def transform(self, validated_data: Any) -> List[Dict[str, Any]]:
        rows: List[Dict[str, Any]] = []
        for code, name, iso3, lat, lon in validated_data["locations"]:
            wkt = _bbox_wkt(lat, lon)
            for scenario, horizons in validated_data["scenarios"].items():
                scenario_code = scenario.replace(".", "").replace("-", "")
                for horizon_year, slr_m in horizons.items():
                    rows.append({
                        "zone_id": f"SLR-{code}-{scenario_code}-{horizon_year}",
                        "slr_scenario": scenario,
                        "horizon_year": horizon_year,
                        "country_iso3": iso3,
                        "wkt": wkt,
                        "slr_m": slr_m,
                        "data_source": f"{DATA_SOURCE_CITATION} Location: {name}.",
                    })
        return rows

    def load(self, db: Session, rows: List[Dict[str, Any]]) -> Dict[str, int]:
        inserted = 0
        failed = 0
        for row in rows:
            try:
                db.execute(UPSERT_SQL, row)
                inserted += 1
            except Exception as exc:
                db.rollback()
                failed += 1
                if failed <= 5:
                    self.log(f"Failed to upsert {row.get('zone_id')}: {exc}", "warning")
        db.commit()
        return {"inserted": inserted, "updated": 0, "skipped": 0, "failed": failed}


if __name__ == "__main__":
    from db.base import SessionLocal
    session = SessionLocal()
    try:
        result = SeaLevelGridIngester().run(session, triggered_by="manual_cli")
        print(result.to_dict())
    finally:
        session.close()
