"""
API Routes: NASA POWER — real global solar / wind / temperature resource data
================================================================================
Thin proxy over NASA's POWER (Prediction Of Worldwide Energy Resources) API
-- free, keyless, global daily solar irradiance / wind speed / temperature at
any lat/lon (satellite + MERRA-2 reanalysis, no account required).

Upstream (verified live 2026-07-05):
    https://power.larc.nasa.gov/api/temporal/daily/point
      ?parameters=ALLSKY_SFC_SW_DWN,WS10M,WS50M,T2M&community=RE
      &longitude=-0.13&latitude=51.5&start=20240101&end=20240107&format=JSON
    -> 200, real measured/reanalysis values (e.g. ALLSKY_SFC_SW_DWN for
       London Jan 2024 ranged 0.32-0.95 kW-hr/m^2/day -- realistic UK winter
       solar resource).

Parameters exposed (NASA POWER "RE" community, daily point API):
    ALLSKY_SFC_SW_DWN  -- All-sky surface shortwave downward irradiance
                          (GHI), units kW-hr/m^2/day
    WS10M / WS50M      -- Wind speed at 10m / 50m, units m/s
    T2M                -- Temperature at 2m, units C
    (any other NASA POWER daily-point parameter code also passes through)

Fill value: NASA POWER returns -999.0 for missing days; this proxy filters
those out of averages/climatology and reports how many valid days remain.

Endpoints:
  GET /api/v1/nasa-power/resource
      Thin passthrough: raw daily series for arbitrary parameters/date range.
  GET /api/v1/nasa-power/resource-yield-inputs
      Convenience endpoint: averages the last full calendar year into
      {avg_ghi_kwh_m2_day, avg_wind_speed_50m_ms} -- exactly the shape
      renewable_ppa's solar/wind yield calculators need (see
      services/renewable_project_engine.py SOLAR_GHI_DATA / WIND_RESOURCE_REGIONS
      and the optional lat/lon path added to RenewableProjectEngine.solar_yield /
      wind_yield in that module, which calls services/nasa_power_client.py --
      the same fetch/cache core this route uses -- directly in-process).

Caching / error handling follows the convention in
backend/api/v1/routes/grid_carbon.py: in-process TTL cache, serve-stale-on-
error where a prior successful response exists, else a clean 502 (never an
uncaught exception) so the frontend can show its Live/Demo badge correctly.
"""
from __future__ import annotations

import requests
from fastapi import APIRouter, HTTPException, Query

from services.nasa_power_client import (
    PROVENANCE,
    NasaPowerError,
    fetch_resource,
    fetch_yield_inputs as _fetch_yield_inputs,
)

router = APIRouter(prefix="/api/v1/nasa-power", tags=["NASA POWER"])


@router.get(
    "/resource",
    summary="Raw NASA POWER daily point series (solar / wind / temperature, any lat/lon)",
)
def resource(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    parameters: str = Query(
        "ALLSKY_SFC_SW_DWN,WS10M,WS50M,T2M",
        description="Comma-separated NASA POWER daily-point parameter codes",
    ),
    start: str = Query(..., description="YYYYMMDD"),
    end: str = Query(..., description="YYYYMMDD"),
    community: str = Query("RE", description="NASA POWER community (RE=renewable energy, AG, SB)"),
) -> dict:
    try:
        return fetch_resource(lat=lat, lon=lon, parameters=parameters, start=start, end=end, community=community)
    except NasaPowerError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get(
    "/resource-yield-inputs",
    summary="Ready-to-use {avg_ghi_kwh_m2_day, avg_wind_speed_50m_ms} for a lat/lon (last full year)",
    description=(
        "Averages NASA POWER's ALLSKY_SFC_SW_DWN (GHI) and WS50M (wind speed at 50m) "
        "over the last full calendar year at the given lat/lon into a single pair — the "
        "exact input shape renewable_ppa's solar/wind yield calculators need in place of "
        "the hand-authored country/region default tables. Fill-value (-999) days are "
        "excluded from the average and reported in valid_days."
    ),
)
def resource_yield_inputs(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
) -> dict:
    try:
        return _fetch_yield_inputs(lat, lon)
    except NasaPowerError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
