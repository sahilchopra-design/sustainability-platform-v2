"""
Real Estate CLVaR and CRREM Stranding Routes
Endpoints for property-level climate value-at-risk and carbon pathway assessment.

These routes are thin adapters over the real quant engines:
  - services.re_clvar_engine.calculate_clvar_for_asset  (RICS VPS4 / IVS CLVaR)
  - services.crrem_stranding_engine.assess_asset_stranding / CRREMStrandingEngine

The request schemas collect the RAW inputs those engines require (flood depth, MEES
EPC thresholds, market value, energy/carbon intensity). Where an input is genuinely
absent, a conservative default is applied AND the field is flagged in
validation_summary.missing_fields — no value is fabricated to look real. Monetary
(GBP) outputs are returned only when a market value is supplied; otherwise they are
null and flagged.
"""
import logging
from decimal import Decimal
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["Real Estate CLVaR and CRREM"])


# ── Request models (aligned to the engine dataclass inputs) ──────────────────

class PhysicalInputs(BaseModel):
    """Physical hazard exposure — RAW metrics the CLVaR engine consumes."""
    flood_zone: Optional[str] = Field(None, description='Flood zone: "A" high, "B" medium, "C" low, "X" minimal')
    flood_depth_100yr_m: Optional[float] = Field(None, ge=0, description="1-in-100yr flood depth (m)")
    heat_days_above_35c: Optional[int] = Field(None, ge=0, description="Annual days above 35C")
    wildfire_proximity_km: Optional[float] = Field(None, ge=0, description="Distance to wildfire-prone area (km)")
    coastal_proximity_km: Optional[float] = Field(None, ge=0, description="Distance to coastline (km)")
    subsidence_risk: Optional[str] = Field(None, description='"very_high","high","medium","low","negligible"')
    water_stress_score: Optional[float] = Field(None, ge=0, le=5, description="WRI Aqueduct score 0.0-5.0")


class TransitionInputs(BaseModel):
    """Regulatory / market transition inputs — MEES EPC thresholds, retrofit feasibility."""
    epc_rating: Optional[str] = Field(None, description="Current EPC label A-G")
    energy_intensity_kwh_m2: Optional[float] = Field(None, ge=0)
    carbon_intensity_kgco2_m2: Optional[float] = Field(None, ge=0)
    minimum_epc_required_2030: Optional[str] = Field(None, description="MEES 2030 minimum EPC rating")
    minimum_epc_required_2033: Optional[str] = Field(None, description="MEES 2033 minimum EPC rating")
    retrofit_feasibility: Optional[str] = Field(None, description='"high","medium","low","not_feasible"')
    green_certification: Optional[str] = Field(None, description="BREEAM / LEED / other green certification")


class PropertyInfo(BaseModel):
    property_id: str
    address: Optional[str] = None
    property_type: str = Field(..., description="office, retail, industrial, multifamily, hotel, logistics, mixed_use")
    country_iso: str = Field(..., description="ISO 3166-1 alpha-2 country code")
    region: Optional[str] = Field(None, description="NUTS2 region or US state")
    gross_internal_area_m2: float = Field(..., gt=0)
    year_built: Optional[int] = None
    last_refurbishment_year: Optional[int] = None
    current_valuation_gbp: Optional[float] = Field(
        None, gt=0, description="Current market value — REQUIRED for monetary CLVaR (GBP figures null if absent)")
    loan_to_value: Optional[float] = Field(None, ge=0, le=1)


class PropertyCLVaRRequest(BaseModel):
    property_info: PropertyInfo
    physical_inputs: PhysicalInputs
    transition_inputs: TransitionInputs
    scenario: str = Field("1.5C", description="Climate scenario: 1.5C | 2C | 2.5C | 3C")
    horizon_years: int = Field(10, ge=1, le=30)


class ValidationSummary(BaseModel):
    is_valid: bool
    warnings: List[str] = []
    missing_fields: List[str] = []
    data_quality_score: float = Field(..., ge=0, le=1)


class CLVaRResponse(BaseModel):
    property_id: str
    scenario: str
    horizon_years: int
    physical_clvar_pct: float
    transition_clvar_pct: float
    total_clvar_pct: float
    physical_clvar_gbp: Optional[float] = None
    transition_clvar_gbp: Optional[float] = None
    total_clvar_gbp: Optional[float] = None
    var_95_pct: Optional[float] = None
    var_99_pct: Optional[float] = None
    stranding_risk_year: Optional[int] = None
    risk_rating: str
    top_risk_drivers: List[Dict[str, Any]] = []
    validation_summary: ValidationSummary


class CRREMRequest(BaseModel):
    property_info: PropertyInfo
    transition_inputs: TransitionInputs
    scenario: str = Field("1.5C", description="CRREM scenario: 1.5C | 2C")


class CRREMStrandingResponse(BaseModel):
    property_id: str
    property_type: str
    country_iso: str
    scenario: str
    stranding_year: Optional[int] = None
    is_stranded_today: bool
    # CRREM pathways are ENERGY intensity (kWh/m2/yr); carbon intensity reported as context.
    current_energy_intensity_kwh_m2: float
    current_carbon_intensity_kgco2_m2: float
    pathway_intensity_2030_kwh_m2: float
    pathway_intensity_2050_kwh_m2: float
    gap_to_pathway_today_pct: float
    annual_reduction_required_pct: float
    retrofit_urgency: str
    estimated_retrofit_cost_gbp: Optional[float] = None
    validation_summary: ValidationSummary


class RoadmapYear(BaseModel):
    year: int
    target_energy_kwh_m2: float
    current_asset_kwh_m2: float
    gap_kwh_m2: float
    cumulative_reduction_pct: float
    is_compliant: bool
    recommended_intervention: str
    estimated_cost_gbp: Optional[float] = None


class CRREMRoadmapResponse(BaseModel):
    property_id: str
    scenario: str
    roadmap: List[RoadmapYear]
    total_estimated_cost_gbp: Optional[float] = None
    validation_summary: ValidationSummary


class PortfolioPropertyResult(BaseModel):
    property_id: str
    total_clvar_pct: float
    total_clvar_gbp: Optional[float] = None
    risk_rating: str
    stranding_year: Optional[int] = None


class PortfolioCLVaRRequest(BaseModel):
    properties: List[PropertyCLVaRRequest]
    scenario: str = "1.5C"
    horizon_years: int = 10


class PortfolioCLVaRResponse(BaseModel):
    scenario: str
    horizon_years: int
    total_properties: int
    per_property: List[PortfolioPropertyResult]
    portfolio_weighted_clvar_pct: float
    total_portfolio_clvar_gbp: Optional[float] = None
    risk_distribution: Dict[str, int]
    validation_summary: ValidationSummary


class CRREMPathwayYear(BaseModel):
    year: int
    intensity_15c_kwh_m2: float
    intensity_2c_kwh_m2: float


class CRREMPathwayResponse(BaseModel):
    property_type: str
    country_iso: str
    pathway: List[CRREMPathwayYear]
    source: str
    validation_summary: ValidationSummary


# ── Mapping helpers ──────────────────────────────────────────────────────────

# Route scenario labels -> engine scenario identifiers.
_CLVAR_SCENARIO = {"1.5C": "NZE_1.5C", "2C": "BELOW_2C", "2.5C": "NDC_2.5C", "3C": "CURRENT_POLICIES_3C"}
_CRREM_SCENARIO = {"1.5C": "1.5C", "2C": "2C", "2.5C": "2C", "3C": "2C"}

# Conservative "no known hazard" / policy defaults applied ONLY when an input is absent;
# each application is flagged in missing_fields so it is never mistaken for measured data.
_PHYS_DEFAULTS = {
    "flood_zone": "X", "flood_depth_100yr_m": 0.0, "heat_days_above_35c": 0,
    "wildfire_proximity_km": 100.0, "coastal_proximity_km": 100.0,
    "subsidence_risk": "negligible", "water_stress_score": 0.0,
}
# UK MEES trajectory defaults (commercial): EPC C by 2030, B by 2033.
_TRANS_DEFAULTS = {
    "epc_rating": "D", "energy_intensity_kwh_m2": 200.0, "carbon_intensity_kgco2_m2": 50.0,
    "minimum_epc_required_2030": "C", "minimum_epc_required_2033": "B", "retrofit_feasibility": "medium",
}


def _build_validation_summary(warnings: List[str], missing: List[str]) -> ValidationSummary:
    score = max(0.0, 1.0 - len(warnings) * 0.05 - len(missing) * 0.1)
    return ValidationSummary(
        is_valid=not missing, warnings=warnings,
        missing_fields=missing, data_quality_score=round(score, 3),
    )


def _clvar_rating(total_pct: float) -> str:
    """Risk band from combined CLVaR (fractional value impact, e.g. -0.15 = -15%)."""
    a = abs(total_pct)
    if a >= 0.30:
        return "Very High"
    if a >= 0.15:
        return "High"
    if a >= 0.05:
        return "Medium"
    return "Low"


def _resolve(model_dump: dict, defaults: dict, missing: List[str]) -> dict:
    """Fill absent fields from defaults, recording each substitution in `missing`."""
    out = {}
    for key, default in defaults.items():
        val = model_dump.get(key)
        if val is None:
            out[key] = default
            missing.append(key)
        else:
            out[key] = val
    return out


def _run_clvar(prop: PropertyInfo, phys: PhysicalInputs, trans: TransitionInputs,
               scenario: str, horizon_years: int):
    """Map request models to primitives and call the real CLVaR engine wrapper.

    Returns (result: CLVaRResult, missing_fields, market_value_or_None)."""
    from services.re_clvar_engine import calculate_clvar_for_asset  # type: ignore

    missing: List[str] = []
    p = _resolve(phys.model_dump(), _PHYS_DEFAULTS, missing)
    t = _resolve(trans.model_dump(), _TRANS_DEFAULTS, missing)

    market_value = prop.current_valuation_gbp
    if market_value is None:
        missing.append("current_valuation_gbp")
    if prop.year_built is None:
        missing.append("year_built")

    result = calculate_clvar_for_asset(
        flood_zone=p["flood_zone"],
        flood_depth_100yr_m=float(p["flood_depth_100yr_m"]),
        heat_days_above_35c=int(p["heat_days_above_35c"]),
        wildfire_proximity_km=float(p["wildfire_proximity_km"]),
        coastal_proximity_km=float(p["coastal_proximity_km"]),
        subsidence_risk=p["subsidence_risk"],
        water_stress_score=float(p["water_stress_score"]),
        current_epc_rating=t["epc_rating"],
        energy_intensity_kwh_m2=float(t["energy_intensity_kwh_m2"]),
        carbon_intensity_kgco2_m2=float(t["carbon_intensity_kgco2_m2"]),
        minimum_epc_required_2030=t["minimum_epc_required_2030"],
        minimum_epc_required_2033=t["minimum_epc_required_2033"],
        retrofit_feasibility=t["retrofit_feasibility"],
        property_type=prop.property_type,
        country_iso=prop.country_iso,
        region=prop.region or prop.country_iso,
        floor_area_m2=float(prop.gross_internal_area_m2),
        # Value-independent % outputs need a positive base; when the real market value is
        # absent we run with a nominal base purely to obtain the %s and null all GBP outputs.
        current_market_value=float(market_value if market_value is not None else 1_000_000.0),
        year_built=int(prop.year_built or 1990),
        scenario=_CLVAR_SCENARIO.get(scenario, "NZE_1.5C"),
        time_horizon=horizon_years,
        last_refurbishment_year=prop.last_refurbishment_year,
        green_certification=trans.green_certification,
        run_mc=True,
    )
    return result, missing, market_value


def _clvar_response(prop: PropertyInfo, result, missing: List[str],
                    market_value: Optional[float], scenario: str, horizon_years: int) -> CLVaRResponse:
    phys_pct = float(result.physical_var_pct)
    trans_pct = float(result.transition_var_pct)
    total_pct = float(result.combined_clvar_pct)

    if market_value is not None:
        phys_gbp = round(phys_pct * market_value, 2)
        trans_gbp = round(trans_pct * market_value, 2)
        total_gbp = float(result.combined_clvar_gbp)
    else:
        phys_gbp = trans_gbp = total_gbp = None

    drivers = sorted(
        ({"hazard": k, "value_impact_pct": round(float(v), 4)} for k, v in result.hazard_contributions.items()),
        key=lambda d: abs(d["value_impact_pct"]), reverse=True,
    )[:3]

    return CLVaRResponse(
        property_id=prop.property_id, scenario=scenario, horizon_years=horizon_years,
        physical_clvar_pct=round(phys_pct, 4),
        transition_clvar_pct=round(trans_pct, 4),
        total_clvar_pct=round(total_pct, 4),
        physical_clvar_gbp=phys_gbp, transition_clvar_gbp=trans_gbp, total_clvar_gbp=total_gbp,
        var_95_pct=round(float(result.var_95), 4), var_99_pct=round(float(result.var_99), 4),
        stranding_risk_year=result.stranding_risk_year,
        risk_rating=_clvar_rating(total_pct), top_risk_drivers=drivers,
        validation_summary=_build_validation_summary(
            ["market value not provided — monetary CLVaR omitted"] if market_value is None else [],
            missing),
    )


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/re/clvar/calculate", response_model=CLVaRResponse)
async def calculate_re_clvar(request: PropertyCLVaRRequest):
    """Run CLVaR for a single property across physical and transition risk dimensions."""
    logger.info("CLVaR: property=%s scenario=%s horizon=%d yr",
                request.property_info.property_id, request.scenario, request.horizon_years)
    try:
        result, missing, mv = _run_clvar(
            request.property_info, request.physical_inputs, request.transition_inputs,
            request.scenario, request.horizon_years)
        return _clvar_response(request.property_info, result, missing, mv,
                               request.scenario, request.horizon_years)
    except Exception as exc:
        logger.exception("CLVaR engine error: property=%s", request.property_info.property_id)
        raise HTTPException(status_code=500, detail=f"CLVaR engine error: {exc}") from exc


@router.post("/re/crrem/stranding", response_model=CRREMStrandingResponse)
async def assess_crrem_stranding(request: CRREMRequest):
    """Assess CRREM stranding risk for a property against the decarbonisation pathway."""
    logger.info("CRREM stranding: property=%s scenario=%s",
                request.property_info.property_id, request.scenario)
    try:
        from services.crrem_stranding_engine import assess_asset_stranding, CRREMStrandingEngine  # type: ignore
        pi, tr = request.property_info, request.transition_inputs
        crrem_scenario = _CRREM_SCENARIO.get(request.scenario, "1.5C")

        missing: List[str] = []
        energy = tr.energy_intensity_kwh_m2
        carbon = tr.carbon_intensity_kgco2_m2
        if energy is None:
            missing.append("energy_intensity_kwh_m2"); energy = _TRANS_DEFAULTS["energy_intensity_kwh_m2"]
        if carbon is None:
            missing.append("carbon_intensity_kgco2_m2"); carbon = _TRANS_DEFAULTS["carbon_intensity_kgco2_m2"]
        if pi.year_built is None:
            missing.append("year_built")

        result = assess_asset_stranding(
            property_type=pi.property_type, country_iso=pi.country_iso,
            floor_area_m2=float(pi.gross_internal_area_m2),
            current_energy_kwh_m2=float(energy), current_carbon_kgco2_m2=float(carbon),
            year_built=int(pi.year_built or 1990),
            last_major_refurb=pi.last_refurbishment_year,
            renovation_potential=tr.retrofit_feasibility or "medium",
            scenario=crrem_scenario,
        )
        eng = CRREMStrandingEngine()
        pw_2030 = float(eng.get_pathway_intensity(pi.property_type, pi.country_iso, crrem_scenario, 2030))
        pw_2050 = float(eng.get_pathway_intensity(pi.property_type, pi.country_iso, crrem_scenario, 2050))
        stranding_year = result.stranding_year_2c if crrem_scenario == "2C" else result.stranding_year_1_5c

        return CRREMStrandingResponse(
            property_id=pi.property_id, property_type=pi.property_type, country_iso=pi.country_iso,
            scenario=request.scenario, stranding_year=stranding_year,
            is_stranded_today=result.is_already_stranded,
            current_energy_intensity_kwh_m2=float(energy),
            current_carbon_intensity_kgco2_m2=float(carbon),
            pathway_intensity_2030_kwh_m2=round(pw_2030, 2),
            pathway_intensity_2050_kwh_m2=round(pw_2050, 2),
            gap_to_pathway_today_pct=round(float(result.gap_pct), 2),
            annual_reduction_required_pct=round(float(result.annual_reduction_required_pct), 2),
            retrofit_urgency=result.retrofit_urgency,
            estimated_retrofit_cost_gbp=round(float(result.total_retrofit_cost), 2),
            validation_summary=_build_validation_summary([], missing),
        )
    except Exception as exc:
        logger.exception("CRREM stranding error: property=%s", request.property_info.property_id)
        raise HTTPException(status_code=500, detail=f"CRREM stranding engine error: {exc}") from exc


@router.post("/re/crrem/roadmap", response_model=CRREMRoadmapResponse)
async def generate_crrem_roadmap(request: CRREMRequest):
    """Generate a year-by-year decarbonisation roadmap to 2050 for a property."""
    logger.info("CRREM roadmap: property=%s scenario=%s",
                request.property_info.property_id, request.scenario)
    try:
        from services.crrem_stranding_engine import CRREMStrandingEngine, AssetEnergyProfile  # type: ignore
        pi, tr = request.property_info, request.transition_inputs
        crrem_scenario = _CRREM_SCENARIO.get(request.scenario, "1.5C")

        missing: List[str] = []
        energy = tr.energy_intensity_kwh_m2
        carbon = tr.carbon_intensity_kgco2_m2
        if energy is None:
            missing.append("energy_intensity_kwh_m2"); energy = _TRANS_DEFAULTS["energy_intensity_kwh_m2"]
        if carbon is None:
            missing.append("carbon_intensity_kgco2_m2"); carbon = _TRANS_DEFAULTS["carbon_intensity_kgco2_m2"]

        profile = AssetEnergyProfile(
            property_type=pi.property_type, country_iso=pi.country_iso,
            floor_area_m2=Decimal(str(pi.gross_internal_area_m2)),
            current_energy_kwh_m2=Decimal(str(energy)), current_carbon_kgco2_m2=Decimal(str(carbon)),
            year_built=int(pi.year_built or 1990), last_major_refurb=pi.last_refurbishment_year,
            planned_refurb_year=None, renovation_potential=tr.retrofit_feasibility or "medium",
        )
        raw = CRREMStrandingEngine().generate_decarbonisation_roadmap(profile, crrem_scenario)
        roadmap = [
            RoadmapYear(
                year=d["year"], target_energy_kwh_m2=d["target_energy_kwh_m2"],
                current_asset_kwh_m2=d["current_asset_kwh_m2"], gap_kwh_m2=d["gap_kwh_m2"],
                cumulative_reduction_pct=d["cumulative_reduction_pct"], is_compliant=d["is_compliant"],
                recommended_intervention=d["recommended_intervention"],
                estimated_cost_gbp=d["estimated_total_cost"],
            ) for d in raw
        ]
        # Total planned spend = sum of the distinct major-intervention-year retrofit costs.
        total_cost = round(sum(
            d["estimated_total_cost"] for d in raw
            if d.get("is_major_intervention_year") and not d.get("is_compliant")), 2)
        return CRREMRoadmapResponse(
            property_id=pi.property_id, scenario=request.scenario, roadmap=roadmap,
            total_estimated_cost_gbp=total_cost or None,
            validation_summary=_build_validation_summary([], missing),
        )
    except Exception as exc:
        logger.exception("CRREM roadmap error: property=%s", request.property_info.property_id)
        raise HTTPException(status_code=500, detail=f"CRREM roadmap engine error: {exc}") from exc


@router.post("/re/clvar/portfolio", response_model=PortfolioCLVaRResponse)
async def calculate_portfolio_clvar(request: PortfolioCLVaRRequest):
    """Run CLVaR for a portfolio of properties and return per-property and aggregate results."""
    logger.info("Portfolio CLVaR: %d properties scenario=%s", len(request.properties), request.scenario)
    if not request.properties:
        raise HTTPException(status_code=400, detail="Portfolio must contain at least one property.")
    try:
        per_property: List[PortfolioPropertyResult] = []
        all_warnings: List[str] = []
        all_missing: List[str] = []
        total_wclvar = 0.0
        total_gbp_sum: Optional[float] = 0.0
        risk_dist: Dict[str, int] = {"Low": 0, "Medium": 0, "High": 0, "Very High": 0}
        for prop_req in request.properties:
            result, missing, mv = _run_clvar(
                prop_req.property_info, prop_req.physical_inputs, prop_req.transition_inputs,
                request.scenario, request.horizon_years)
            total_pct = float(result.combined_clvar_pct)
            gbp = float(result.combined_clvar_gbp) if mv is not None else None
            if gbp is None:
                total_gbp_sum = None
            elif total_gbp_sum is not None:
                total_gbp_sum += gbp
            rating = _clvar_rating(total_pct)
            per_property.append(PortfolioPropertyResult(
                property_id=prop_req.property_info.property_id,
                total_clvar_pct=round(total_pct, 4), total_clvar_gbp=gbp,
                risk_rating=rating, stranding_year=result.stranding_risk_year,
            ))
            total_wclvar += total_pct
            all_missing.extend(missing)
            if mv is None:
                all_warnings.append("market value not provided for one or more properties")
            risk_dist[rating] = risk_dist.get(rating, 0) + 1
        val = _build_validation_summary(sorted(set(all_warnings)), sorted(set(all_missing)))
        return PortfolioCLVaRResponse(
            scenario=request.scenario, horizon_years=request.horizon_years,
            total_properties=len(request.properties), per_property=per_property,
            portfolio_weighted_clvar_pct=round(total_wclvar / len(request.properties), 4),
            total_portfolio_clvar_gbp=(round(total_gbp_sum, 2) if total_gbp_sum is not None else None),
            risk_distribution=risk_dist, validation_summary=val,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Portfolio CLVaR engine error")
        raise HTTPException(status_code=500, detail=f"Portfolio CLVaR engine error: {exc}") from exc


@router.get("/re/crrem/pathways/{property_type}/{country_iso}", response_model=CRREMPathwayResponse)
async def get_crrem_pathways(property_type: str, country_iso: str):
    """Retrieve CRREM pathway data (year-by-year 1.5C and 2C energy-intensity targets)."""
    logger.info("CRREM pathway lookup: type=%s country=%s", property_type, country_iso)
    try:
        from services.crrem_stranding_engine import CRREMStrandingEngine  # type: ignore
        eng = CRREMStrandingEngine()
        traj_15 = eng.calculate_pathway_trajectory(property_type, country_iso, "1.5C", 2024, 2050)
        traj_2c = eng.calculate_pathway_trajectory(property_type, country_iso, "2C", 2024, 2050)
        pathway = [
            CRREMPathwayYear(year=a["year"], intensity_15c_kwh_m2=a["pathway_kwh_m2"],
                             intensity_2c_kwh_m2=b["pathway_kwh_m2"])
            for a, b in zip(traj_15, traj_2c)
        ]
        return CRREMPathwayResponse(
            property_type=property_type, country_iso=country_iso.upper(), pathway=pathway,
            source="CRREM v2.0 (energy intensity, kWh/m2/yr)",
            validation_summary=_build_validation_summary([], []),
        )
    except Exception as exc:
        logger.exception("CRREM pathway error: type=%s country=%s", property_type, country_iso)
        raise HTTPException(status_code=500, detail=f"CRREM pathway engine error: {exc}") from exc
