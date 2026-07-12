"""
Flood Susceptibility Zone Ingester -- populates ref_flood_zones for the
first time, honestly scoped as a documented PROXY, not an authoritative
flood-hazard map (there is no free, full-globe, authoritative flood-zone
polygon dataset -- see methodology notes below and in the ingestion report).
=============================================================================

Two composition strategies, real data both ways:

  US locations (7 flood-claims-heavy states/counties):
    FEMA's National Flood Hazard Layer (NFHL) ArcGIS REST service
    (https://hazards.fema.gov/gis/nfhl/rest/services) was checked live from
    this environment and is NOT cleanly reachable (TLS handshake failure to
    hazards.fema.gov, while www.fema.gov and the OpenFEMA API resolve and
    respond fine -- verified 2026-07-05). Per the task's own honest-fallback
    instruction, this ingester falls back to a documented claims-density
    proxy: it calls the ALREADY-WIRED real OpenFEMA NFIP claims aggregation
    (api/v1/routes/openfema_claims._fetch_claims / _summarize) for each
    sampled state and uses the REAL mean-paid-claim severity (USD per paid
    claim, building+contents+ICC) as a relative severity score, min-max
    normalized across the 7 sampled states, to place each location's
    max_depth_m within a standard FEMA/insurance-industry BFE depth
    convention for the given return period. This is NOT a modeled or
    measured flood depth -- it is a documented, honest proxy. Users needing
    authoritative BFE/SFHA depths must consult FEMA NFHL directly.

  Non-US locations (18 major delta/coastal cities):
    Real historical extreme-precipitation data from the ALREADY-WIRED
    Open-Meteo Historical Weather (Archive) API
    (api/v1/routes/open_meteo.historical_extremes -- called directly, in
    process, for each of 18 named locations over 2005-2024) is used the
    same way: REAL max daily precipitation (mm) per location, min-max
    normalized across the 18 sampled locations, places max_depth_m within
    the same standard depth convention. Global 2-degree-grid coverage was
    explicitly ruled out as infeasible/dishonest to claim (thousands of
    cells x one Open-Meteo call each is not a "meaningful reduced set");
    instead this mirrors the sea-level-rise ingester's approach of a
    curated, real, named-location set (major river-basin deltas + large
    low-lying coastal cities).

  Standard depth convention (documented, not modeled):
      100-year (1% annual chance) event: 0.5 - 1.5 m
      500-year (0.2% annual chance) event: 1.0 - 3.0 m
    depth = low + normalized_severity_score * (high - low)

  scenario field is set to "baseline" throughout (a present-day
  claims/precipitation-derived susceptibility proxy -- NOT a climate
  scenario-conditioned RCP/SSP projection; this ingester does not attempt
  to fabricate scenario-conditioned flood depths it cannot actually source).

HONESTY NOTE: this hazard genuinely does not have a free, authoritative,
full-globe polygon dataset available to this ingester in this environment.
25 named locations (7 US + 18 non-US) is the actual honest scope achieved --
see the ingestion report for exact coverage claims. Refer to FEMA NFHL (US)
or national flood-hazard-mapping agencies (non-US) for production-grade
flood-zone boundaries.
"""
from __future__ import annotations

import time
from typing import Any, Dict, List

from sqlalchemy import text
from sqlalchemy.orm import Session

from ingestion.base_ingester import BaseIngester

FLOOD_SOURCE_ID = "flood-susceptibility-proxy"

# (code, name, state, lat, lon)
US_FLOOD_LOCATIONS: List[tuple] = [
    ("MIA", "Miami-Dade County, FL", "FL", 25.7617, -80.1918),
    ("NOL", "Orleans Parish (New Orleans), LA", "LA", 29.9511, -90.0715),
    ("HOU", "Harris County (Houston), TX", "TX", 29.7604, -95.3698),
    ("ATC", "Atlantic City, NJ", "NJ", 39.3643, -74.4229),
    ("ISP", "Suffolk County (Long Island), NY", "NY", 40.8259, -73.1143),
    ("ILM", "New Hanover County (Wilmington), NC", "NC", 34.2257, -77.9447),
    ("CHS", "Charleston County, SC", "SC", 32.7765, -79.9311),
]

# (code, name, country_iso3, lat, lon)
GLOBAL_FLOOD_LOCATIONS: List[tuple] = [
    ("DHA", "Dhaka, Bangladesh (Ganges-Brahmaputra delta)", "BGD", 23.8103, 90.4125),
    ("RTM", "Rotterdam, Netherlands (Rhine-Meuse delta)", "NLD", 51.9244, 4.4777),
    ("JKT", "Jakarta, Indonesia", "IDN", -6.2088, 106.8456),
    ("BKK", "Bangkok, Thailand (Chao Phraya delta)", "THA", 13.7563, 100.5018),
    ("SGN", "Ho Chi Minh City, Vietnam (Mekong delta)", "VNM", 10.7769, 106.7009),
    ("CTO", "Can Tho, Vietnam (Mekong delta interior)", "VNM", 10.0452, 105.7469),
    ("CCU", "Kolkata, India (Ganges delta)", "IND", 22.5726, 88.3639),
    ("BOM", "Mumbai, India", "IND", 19.0760, 72.8777),
    ("GZH", "Guangzhou, China (Pearl River Delta)", "CHN", 23.1291, 113.2644),
    ("SHA", "Shanghai, China (Yangtze delta)", "CHN", 31.2304, 121.4737),
    ("MNL", "Manila, Philippines", "PHL", 14.5995, 120.9842),
    ("LOS", "Lagos, Nigeria", "NGA", 6.5244, 3.3792),
    ("MPM", "Maputo, Mozambique", "MOZ", -25.9692, 32.5732),
    ("BEW", "Beira, Mozambique (Pungwe delta -- Cyclone Idai 2019)", "MOZ", -19.8317, 34.8389),
    ("ALX", "Alexandria, Egypt (Nile Delta)", "EGY", 31.2001, 29.9187),
    ("HAM", "Hamburg, Germany (Elbe)", "DEU", 53.5511, 9.9937),
    ("LON", "London, UK (Thames Estuary)", "GBR", 51.5074, -0.1278),
    ("BSR", "Basra, Iraq (Tigris-Euphrates delta)", "IRQ", 30.5085, 47.7835),
]

RETURN_PERIODS = [100, 500]
DEPTH_RANGE_M = {100: (0.5, 1.5), 500: (1.0, 3.0)}
HALF_WIDTH_DEG = 0.05

US_CLAIMS_MAX_RECORDS = 3000
US_CLAIMS_START_YEAR = 2010
US_CLAIMS_END_YEAR = 2026
GLOBAL_PRECIP_START_YEAR = 2005
GLOBAL_PRECIP_END_YEAR = 2024


def _bbox_wkt(lat: float, lon: float, half_width: float = HALF_WIDTH_DEG) -> str:
    lo_lon, hi_lon = lon - half_width, lon + half_width
    lo_lat, hi_lat = lat - half_width, lat + half_width
    return (
        f"POLYGON(({lo_lon} {lo_lat}, {hi_lon} {lo_lat}, {hi_lon} {hi_lat}, "
        f"{lo_lon} {hi_lat}, {lo_lon} {lo_lat}))"
    )


def _normalize(values: List[float]) -> List[float]:
    """Min-max normalize to [0, 1]; degenerate (all-equal) input -> all 0.5."""
    lo, hi = min(values), max(values)
    if hi - lo < 1e-9:
        return [0.5 for _ in values]
    return [(v - lo) / (hi - lo) for v in values]


def _depth_for(rp: int, score: float) -> float:
    lo, hi = DEPTH_RANGE_M[rp]
    return round(lo + score * (hi - lo), 2)


UPSERT_SQL = text("""
    INSERT INTO ref_flood_zones (
        zone_id, return_period_y, scenario, country_iso3,
        zone_boundary, max_depth_m, data_source, created_at
    ) VALUES (
        :zone_id, :return_period_y, :scenario, :country_iso3,
        ST_Multi(ST_GeomFromText(:wkt, 4326)), :max_depth_m, :data_source, NOW()
    )
    ON CONFLICT (zone_id) DO UPDATE SET
        return_period_y = EXCLUDED.return_period_y,
        scenario = EXCLUDED.scenario,
        country_iso3 = EXCLUDED.country_iso3,
        zone_boundary = EXCLUDED.zone_boundary,
        max_depth_m = EXCLUDED.max_depth_m,
        data_source = EXCLUDED.data_source
""")


class FloodGridIngester(BaseIngester):
    """
    Populates ref_flood_zones: 7 US flood-claims-heavy counties (NFIP claims
    severity proxy) + 18 global major-delta/coastal cities (Open-Meteo
    extreme-precipitation proxy) x 2 return periods (100y / 500y) = 50 rows.
    """

    source_id = FLOOD_SOURCE_ID
    display_name = "Flood Susceptibility Proxy (NFIP claims + precipitation extremes)"
    default_schedule = ""  # proxy recomputed on demand, not a live daily feed
    timeout_seconds = 600

    def pre_run(self, db: Session):
        db.execute(text("""
            INSERT INTO dh_data_sources (
                id, name, category, sub_category, rationale, access_type,
                base_url, cost, rate_limit, data_format, update_freq,
                geographic, quality_rating, status, priority, utility,
                created_at, updated_at
            ) VALUES (
                :id, :name, 'Physical Climate Risk', 'Flood Hazard',
                'Documented flood-susceptibility PROXY (not authoritative): US = real OpenFEMA NFIP claims severity by state; non-US = real Open-Meteo historical extreme-precipitation by named location. Refer to FEMA NFHL / national flood-hazard agencies for production-grade flood-zone boundaries.',
                'Composite (OpenFEMA + Open-Meteo)', 'https://www.fema.gov/api/open/v2/FimaNfipClaims',
                'Free', 'N/A (derived proxy)', 'GeoJSON/polygon', 'Static snapshot (recomputed on demand)',
                'US (7 counties) + Global (18 named delta/coastal cities)', 'B', 'active', 'P1', 'physical_risk_screening',
                NOW(), NOW()
            )
            ON CONFLICT (id) DO NOTHING
        """), {"id": FLOOD_SOURCE_ID, "name": "Flood Susceptibility Proxy (NFIP claims + precipitation extremes)"})
        db.commit()

    def fetch(self, db: Session) -> Any:
        """Pulls REAL data from the two already-wired sources:
          - OpenFEMA NFIP claims aggregation (per US state)
          - Open-Meteo historical extreme precipitation (per global location)
        """
        from api.v1.routes.openfema_claims import _fetch_claims, _summarize

        us_severity: Dict[str, float] = {}
        for code, name, state, lat, lon in US_FLOOD_LOCATIONS:
            try:
                records, total = _fetch_claims(
                    state, US_CLAIMS_START_YEAR, US_CLAIMS_END_YEAR, US_CLAIMS_MAX_RECORDS
                )
                summary = _summarize(records)
                mean_paid = summary["mean_paid_usd"]
                us_severity[code] = mean_paid
                self.log(
                    f"OpenFEMA {state} ({name}): {summary['paid_claims']} paid claims "
                    f"of {total} matching, mean_paid_usd={mean_paid}"
                )
            except Exception as exc:
                self.log(f"OpenFEMA fetch failed for {state}: {exc} -- skipping this location", "warning")

        from api.v1.routes.open_meteo import historical_extremes

        global_severity: Dict[str, float] = {}
        for code, name, iso3, lat, lon in GLOBAL_FLOOD_LOCATIONS:
            # Open-Meteo's free/keyless archive host rate-limits bursts of
            # back-to-back requests (verified live: 429 after ~6 rapid calls).
            # Poll politely with retry/backoff rather than firing all 18
            # requests back-to-back.
            for attempt in range(4):
                try:
                    result = historical_extremes(
                        lat=lat, lon=lon,
                        start_year=GLOBAL_PRECIP_START_YEAR, end_year=GLOBAL_PRECIP_END_YEAR,
                    )
                    max_precip = result["extremes"]["max_daily_precipitation_mm"] or 0.0
                    global_severity[code] = max_precip
                    self.log(
                        f"Open-Meteo {name}: max_daily_precipitation_mm={max_precip} "
                        f"({result['window']['days_of_data']} days of record, mode={result['mode']})"
                    )
                    break
                except Exception as exc:
                    if "429" in str(exc) and attempt < 3:
                        backoff = 20 * (attempt + 1)
                        self.log(f"Open-Meteo rate-limited for {name}, retrying in {backoff}s "
                                 f"(attempt {attempt + 1}/4)", "warning")
                        time.sleep(backoff)
                        continue
                    self.log(f"Open-Meteo fetch failed for {name}: {exc} -- skipping this location", "warning")
                    break
            time.sleep(8)  # politeness pacing between locations

        return {"us_severity": us_severity, "global_severity": global_severity}

    def validate(self, raw_data: Any) -> Any:
        if not raw_data["us_severity"] and not raw_data["global_severity"]:
            raise RuntimeError("Both upstream sources returned no usable data -- aborting")
        return raw_data

    def transform(self, validated_data: Any) -> List[Dict[str, Any]]:
        rows: List[Dict[str, Any]] = []

        us_severity = validated_data["us_severity"]
        if us_severity:
            codes = list(us_severity.keys())
            scores = dict(zip(codes, _normalize([us_severity[c] for c in codes])))
            loc_by_code = {c: (name, state, lat, lon) for c, name, state, lat, lon in US_FLOOD_LOCATIONS}
            for code, score in scores.items():
                name, state, lat, lon = loc_by_code[code]
                wkt = _bbox_wkt(lat, lon)
                for rp in RETURN_PERIODS:
                    rows.append({
                        "zone_id": f"FLD-US-{code}-{rp}",
                        "return_period_y": rp,
                        "scenario": "baseline",
                        "country_iso3": "USA",
                        "wkt": wkt,
                        "max_depth_m": _depth_for(rp, score),
                        "data_source": (
                            f"US claims-density proxy (FEMA NFHL not reachable from this environment -- "
                            f"verified live 2026-07-05, see module docstring). Real OpenFEMA NFIP mean "
                            f"paid-claim severity for {state} = ${us_severity[code]:,.0f}, normalized "
                            f"severity score={score:.2f} across 7 sampled states, mapped to a standard "
                            f"{rp}-yr BFE depth range. Location: {name}. NOT an authoritative depth -- "
                            f"see FEMA NFHL (hazards.fema.gov/gis/nfhl) for production-grade BFE data."
                        ),
                    })

        global_severity = validated_data["global_severity"]
        if global_severity:
            codes = list(global_severity.keys())
            scores = dict(zip(codes, _normalize([global_severity[c] for c in codes])))
            loc_by_code = {c: (name, iso3, lat, lon) for c, name, iso3, lat, lon in GLOBAL_FLOOD_LOCATIONS}
            for code, score in scores.items():
                name, iso3, lat, lon = loc_by_code[code]
                wkt = _bbox_wkt(lat, lon)
                for rp in RETURN_PERIODS:
                    rows.append({
                        "zone_id": f"FLD-GL-{code}-{rp}",
                        "return_period_y": rp,
                        "scenario": "baseline",
                        "country_iso3": iso3,
                        "wkt": wkt,
                        "max_depth_m": _depth_for(rp, score),
                        "data_source": (
                            f"Documented precipitation-based flood-susceptibility PROXY, NOT an "
                            f"authoritative flood-zone map -- refer to national flood-hazard-mapping "
                            f"agencies (FEMA NFHL for the US, national equivalents elsewhere) for "
                            f"production-grade flood-zone boundaries. Real Open-Meteo Historical Weather "
                            f"(Archive) API max daily precipitation {GLOBAL_PRECIP_START_YEAR}-"
                            f"{GLOBAL_PRECIP_END_YEAR} = {global_severity[code]:.1f} mm, normalized "
                            f"severity score={score:.2f} across 18 sampled locations, mapped to a "
                            f"standard {rp}-yr depth range. Location: {name}."
                        ),
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
        result = FloodGridIngester().run(session, triggered_by="manual_cli")
        print(result.to_dict())
    finally:
        session.close()
