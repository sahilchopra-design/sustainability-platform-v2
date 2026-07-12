"""
API Routes: NGFS Phase 5 Scenario Extract (Supervisory Scenario Runner)
========================================================================
GET /api/v1/ngfs-extract/scenarios   — Full extract (scenarios × regions × variables, 2025-2050)
                                       Optional filters: ?scenario=<id>&region=<id>&variable=<id>
GET /api/v1/ngfs-extract/variables   — Variable definitions (id, name, unit, NGFS variable path, source)

Serves a real seeded extract of NGFS Phase 5 scenario data (Net Zero 2050,
Below 2°C, Delayed Transition, Fragmented World, NDCs, Current Policies) from
backend/data/ngfs_phase5_extract.json. Every number's provenance is labelled in
the JSON itself ("NGFS Phase 5, IIASA Scenario Explorer"); the file header marks
the extract as approximate/illustrative — refresh from data.ene.iiasa.ac.at/ngfs
for production precision.
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/api/v1/ngfs-extract", tags=["NGFS Phase 5 Extract"])

# backend/api/v1/routes/ngfs_scenarios_extract.py -> parents[3] == backend/
_DATA_FILE = Path(__file__).resolve().parents[3] / "data" / "ngfs_phase5_extract.json"


@lru_cache(maxsize=1)
def _load_extract() -> dict:
    """Load and cache the seeded NGFS Phase 5 extract."""
    if not _DATA_FILE.exists():
        raise FileNotFoundError(f"NGFS extract not found: {_DATA_FILE}")
    with open(_DATA_FILE, "r", encoding="utf-8") as fh:
        return json.load(fh)


@router.get("/scenarios", summary="NGFS Phase 5 scenario extract (filterable)")
def get_scenarios(
    scenario: Optional[str] = Query(None, description="Scenario id filter, e.g. 'net_zero_2050'"),
    region: Optional[str] = Query(None, description="Region id filter: World | EU | US | CN"),
    variable: Optional[str] = Query(None, description="Variable id filter, e.g. 'carbon_price'"),
):
    """
    Return the seeded NGFS Phase 5 extract: metadata, years, scenario/region/
    variable definitions and the data cube. Optional query filters narrow the
    returned cube without changing its shape.
    """
    try:
        extract = _load_extract()
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))

    scenario_ids = {s["id"] for s in extract["scenarios"]}
    region_ids = {r["id"] for r in extract["regions"]}
    variable_ids = {v["id"] for v in extract["variables"]}

    if scenario is not None and scenario not in scenario_ids:
        raise HTTPException(status_code=404, detail=f"Unknown scenario '{scenario}'. Valid: {sorted(scenario_ids)}")
    if region is not None and region not in region_ids:
        raise HTTPException(status_code=404, detail=f"Unknown region '{region}'. Valid: {sorted(region_ids)}")
    if variable is not None and variable not in variable_ids:
        raise HTTPException(status_code=404, detail=f"Unknown variable '{variable}'. Valid: {sorted(variable_ids)}")

    data = {}
    for sid, regions in extract["data"].items():
        if scenario is not None and sid != scenario:
            continue
        data[sid] = {}
        for rid, variables in regions.items():
            if region is not None and rid != region:
                continue
            data[sid][rid] = {
                vid: series for vid, series in variables.items()
                if variable is None or vid == variable
            }

    return {
        "meta": extract["_meta"],
        "years": extract["years"],
        "scenarios": [s for s in extract["scenarios"] if scenario is None or s["id"] == scenario],
        "regions": [r for r in extract["regions"] if region is None or r["id"] == region],
        "variables": [v for v in extract["variables"] if variable is None or v["id"] == variable],
        "data": data,
    }


@router.get("/variables", summary="NGFS Phase 5 extract variable definitions")
def get_variables():
    """Return variable definitions (id, name, unit, NGFS variable path, provenance)."""
    try:
        extract = _load_extract()
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    return {
        "meta": extract["_meta"],
        "variables": extract["variables"],
        "years": extract["years"],
        "scenario_ids": [s["id"] for s in extract["scenarios"]],
        "region_ids": [r["id"] for r in extract["regions"]],
    }
