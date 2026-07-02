"""
nature_capital_engine.py — E77 Nature Capital Accounting
SEEA EA 2021 | TNFD v1.0 | ENCORE 62 ecosystem services | TEEB/BES monetary values
WAVES Adjusted Savings | PBAF 2023 | CBD GBF Target 15 | CSRD ESRS E4
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Any, Optional

# ── Reference Data ─────────────────────────────────────────────────────────────

SEEA_EA_ACCOUNT_TYPES = [
    {"id": "EA-1", "name": "Ecosystem Extent Account", "description": "Area of each ecosystem type at start and end of accounting period", "unit": "hectares"},
    {"id": "EA-2", "name": "Ecosystem Condition Account", "description": "Condition of each ecosystem measured against reference state", "unit": "condition_index_0-1"},
    {"id": "EA-3", "name": "Physical Ecosystem Services Supply & Use Account", "description": "Physical flows of services from ecosystems to economic units", "unit": "physical_units"},
    {"id": "EA-4", "name": "Monetary Ecosystem Services Account", "description": "Monetary valuation of ecosystem services using market/non-market values", "unit": "USD"},
    {"id": "EA-5", "name": "Ecosystem Asset Account", "description": "Opening/closing stock of ecosystem assets and changes therein", "unit": "USD_or_ha"},
    {"id": "EA-6", "name": "Thematic Ecosystem Accounts", "description": "Specific focus accounts: carbon, water, biodiversity, urban", "unit": "varies"},
]

# TEEB/IPBES biome unit values USD/ha/year (conservative estimates from academic literature)
BIOME_UNIT_VALUES = {
    "tropical_forest": {"total_usd_ha_yr": 5264, "provisioning": 1200, "regulating": 3200, "cultural": 864, "source": "TEEB 2010 / Costanza et al 2014"},
    "temperate_forest": {"total_usd_ha_yr": 3137, "provisioning": 980, "regulating": 1800, "cultural": 357, "source": "TEEB 2010"},
    "boreal_forest": {"total_usd_ha_yr": 894, "provisioning": 320, "regulating": 480, "cultural": 94, "source": "Costanza et al 2014"},
    "tropical_grassland": {"total_usd_ha_yr": 1340, "provisioning": 420, "regulating": 750, "cultural": 170, "source": "TEEB 2010"},
    "temperate_grassland": {"total_usd_ha_yr": 1027, "provisioning": 380, "regulating": 520, "cultural": 127, "source": "TEEB 2010"},
    "wetland_freshwater": {"total_usd_ha_yr": 14785, "provisioning": 2400, "regulating": 10200, "cultural": 2185, "source": "Costanza et al 2014"},
    "wetland_coastal": {"total_usd_ha_yr": 28916, "provisioning": 4500, "regulating": 21000, "cultural": 3416, "source": "Costanza et al 2014"},
    "mangrove": {"total_usd_ha_yr": 33750, "provisioning": 5200, "regulating": 25000, "cultural": 3550, "source": "TEEB 2010 / De Groot et al"},
    "coral_reef": {"total_usd_ha_yr": 352249, "provisioning": 65000, "regulating": 270000, "cultural": 17249, "source": "TEEB 2010"},
    "seagrass": {"total_usd_ha_yr": 19004, "provisioning": 3500, "regulating": 13800, "cultural": 1704, "source": "Costanza et al 2014"},
    "open_ocean": {"total_usd_ha_yr": 491, "provisioning": 250, "regulating": 195, "cultural": 46, "source": "Costanza et al 2014"},
    "cropland": {"total_usd_ha_yr": 1540, "provisioning": 1380, "regulating": 120, "cultural": 40, "source": "TEEB 2010"},
    "urban_greenspace": {"total_usd_ha_yr": 6531, "provisioning": 580, "regulating": 4200, "cultural": 1751, "source": "TEEB Urban 2011"},
    "peatland": {"total_usd_ha_yr": 3677, "provisioning": 450, "regulating": 2900, "cultural": 327, "source": "IPBES 2019"},
    "tundra": {"total_usd_ha_yr": 121, "provisioning": 60, "regulating": 50, "cultural": 11, "source": "Costanza et al 2014"},
    "desert": {"total_usd_ha_yr": 43, "provisioning": 20, "regulating": 15, "cultural": 8, "source": "Costanza et al 2014"},
    "mountain": {"total_usd_ha_yr": 688, "provisioning": 350, "regulating": 270, "cultural": 68, "source": "TEEB 2010"},
    "mediterranean_shrubland": {"total_usd_ha_yr": 2071, "provisioning": 650, "regulating": 1100, "cultural": 321, "source": "TEEB 2010"},
    "savanna": {"total_usd_ha_yr": 930, "provisioning": 350, "regulating": 450, "cultural": 130, "source": "Costanza et al 2014"},
}

# ENCORE ecosystem services (62 services mapped to 3 categories)
ENCORE_ECOSYSTEM_SERVICES = {
    "provisioning": [
        {"id": "ES-P01", "name": "Cultivated terrestrial plants for nutrition", "sector_dependencies": ["agriculture", "food_beverage"]},
        {"id": "ES-P02", "name": "Cultivated aquatic plants for nutrition", "sector_dependencies": ["fishing", "food_beverage"]},
        {"id": "ES-P03", "name": "Reared terrestrial animals for nutrition", "sector_dependencies": ["agriculture", "food_beverage"]},
        {"id": "ES-P04", "name": "Reared aquatic animals for nutrition", "sector_dependencies": ["fishing", "food_beverage"]},
        {"id": "ES-P05", "name": "Wild plants for nutrition", "sector_dependencies": ["food_beverage", "pharmaceuticals"]},
        {"id": "ES-P06", "name": "Wild animals for nutrition", "sector_dependencies": ["fishing", "food_beverage"]},
        {"id": "ES-P07", "name": "Surface water for in-stream use", "sector_dependencies": ["utilities", "energy"]},
        {"id": "ES-P08", "name": "Surface water for irrigation", "sector_dependencies": ["agriculture"]},
        {"id": "ES-P09", "name": "Ground water for irrigation", "sector_dependencies": ["agriculture"]},
        {"id": "ES-P10", "name": "Surface water for non-agricultural uses", "sector_dependencies": ["manufacturing", "utilities"]},
        {"id": "ES-P11", "name": "Ground water for non-agricultural uses", "sector_dependencies": ["manufacturing", "utilities"]},
        {"id": "ES-P12", "name": "Plant-based resources (non-food)", "sector_dependencies": ["forestry", "textiles", "construction"]},
        {"id": "ES-P13", "name": "Animal-based resources (non-food)", "sector_dependencies": ["pharmaceuticals", "textiles"]},
        {"id": "ES-P14", "name": "Fibres and other plant materials", "sector_dependencies": ["textiles", "construction"]},
        {"id": "ES-P15", "name": "Genetic materials from all organisms", "sector_dependencies": ["pharmaceuticals", "agriculture"]},
        {"id": "ES-P16", "name": "Inorganic materials from living organisms", "sector_dependencies": ["construction", "chemicals"]},
        {"id": "ES-P17", "name": "Surface water used as energy", "sector_dependencies": ["energy"]},
        {"id": "ES-P18", "name": "Biomass used as energy", "sector_dependencies": ["energy", "utilities"]},
        {"id": "ES-P19", "name": "Wind used as energy", "sector_dependencies": ["energy"]},
        {"id": "ES-P20", "name": "Solar used as energy", "sector_dependencies": ["energy"]},
    ],
    "regulating_maintenance": [
        {"id": "ES-R01", "name": "Global climate regulation", "sector_dependencies": ["all_sectors"]},
        {"id": "ES-R02", "name": "Rainfall pattern regulation", "sector_dependencies": ["agriculture", "water_utilities"]},
        {"id": "ES-R03", "name": "Local climate regulation", "sector_dependencies": ["real_estate", "tourism"]},
        {"id": "ES-R04", "name": "Air filtration", "sector_dependencies": ["real_estate", "tourism", "healthcare"]},
        {"id": "ES-R05", "name": "Soil quality regulation", "sector_dependencies": ["agriculture", "forestry"]},
        {"id": "ES-R06", "name": "Water quality regulation", "sector_dependencies": ["water_utilities", "food_beverage"]},
        {"id": "ES-R07", "name": "Water flow maintenance", "sector_dependencies": ["water_utilities", "agriculture", "energy"]},
        {"id": "ES-R08", "name": "Flood and storm protection", "sector_dependencies": ["real_estate", "insurance"]},
        {"id": "ES-R09", "name": "Erosion control", "sector_dependencies": ["agriculture", "construction"]},
        {"id": "ES-R10", "name": "Biological control (pests/diseases)", "sector_dependencies": ["agriculture"]},
        {"id": "ES-R11", "name": "Pollination", "sector_dependencies": ["agriculture", "food_beverage"]},
        {"id": "ES-R12", "name": "Seed dispersal", "sector_dependencies": ["forestry", "agriculture"]},
        {"id": "ES-R13", "name": "Decomposition and nutrient cycling", "sector_dependencies": ["agriculture", "forestry"]},
        {"id": "ES-R14", "name": "Water purification and waste management", "sector_dependencies": ["water_utilities"]},
        {"id": "ES-R15", "name": "Noise attenuation", "sector_dependencies": ["real_estate", "construction"]},
        {"id": "ES-R16", "name": "Mass stabilisation and erosion control (mountains)", "sector_dependencies": ["construction", "tourism"]},
        {"id": "ES-R17", "name": "Mediation of sensory impacts", "sector_dependencies": ["real_estate"]},
        {"id": "ES-R18", "name": "Disease regulation", "sector_dependencies": ["healthcare", "agriculture"]},
        {"id": "ES-R19", "name": "Genetic diversity maintenance", "sector_dependencies": ["pharmaceuticals", "agriculture"]},
        {"id": "ES-R20", "name": "Lifecycle maintenance of species", "sector_dependencies": ["fishing", "forestry"]},
        {"id": "ES-R21", "name": "Optical properties regulation", "sector_dependencies": ["real_estate", "tourism"]},
        {"id": "ES-R22", "name": "Chemical condition of freshwater", "sector_dependencies": ["water_utilities"]},
        {"id": "ES-R23", "name": "Chemical condition of salt water", "sector_dependencies": ["fishing", "tourism"]},
    ],
    "cultural": [
        {"id": "ES-C01", "name": "Scientific and educational", "sector_dependencies": ["research", "education"]},
        {"id": "ES-C02", "name": "Recreation and ecotourism", "sector_dependencies": ["tourism", "real_estate"]},
        {"id": "ES-C03", "name": "Aesthetic values", "sector_dependencies": ["real_estate", "tourism"]},
        {"id": "ES-C04", "name": "Spiritual and emblematic", "sector_dependencies": ["tourism"]},
        {"id": "ES-C05", "name": "Cultural heritage and identity", "sector_dependencies": ["tourism", "real_estate"]},
        {"id": "ES-C06", "name": "Existence and bequest values", "sector_dependencies": ["all_sectors"]},
    ],
}

# TNFD v1.0 recommended disclosures (14 topics)
TNFD_DISCLOSURE_TOPICS = [
    {"id": "TNFD-G1", "pillar": "Governance", "topic": "Board oversight of nature-related dependencies, impacts, risks and opportunities"},
    {"id": "TNFD-G2", "pillar": "Governance", "topic": "Management's role in assessing and managing nature-related issues"},
    {"id": "TNFD-S1", "pillar": "Strategy", "topic": "Nature-related risks and opportunities over short, medium and long term"},
    {"id": "TNFD-S2", "pillar": "Strategy", "topic": "Impact of nature-related risks and opportunities on business model, strategy and financial planning"},
    {"id": "TNFD-S3", "pillar": "Strategy", "topic": "Resilience of strategy under different nature scenarios"},
    {"id": "TNFD-S4", "pillar": "Strategy", "topic": "Locations and direct operational footprint in biomes"},
    {"id": "TNFD-RM1", "pillar": "Risk Management", "topic": "Organisation's processes for identifying and assessing nature-related risks"},
    {"id": "TNFD-RM2", "pillar": "Risk Management", "topic": "Organisation's processes for managing nature-related risks"},
    {"id": "TNFD-RM3", "pillar": "Risk Management", "topic": "Integration of nature-related risk management into overall risk framework"},
    {"id": "TNFD-MT1", "pillar": "Metrics & Targets", "topic": "Metrics used to assess nature-related dependencies and impacts"},
    {"id": "TNFD-MT2", "pillar": "Metrics & Targets", "topic": "Metrics used to assess nature-related risks and opportunities"},
    {"id": "TNFD-MT3", "pillar": "Metrics & Targets", "topic": "Targets and performance against them for managing nature-related issues"},
    {"id": "TNFD-MT4", "pillar": "Metrics & Targets", "topic": "Financed nature impacts for financial institutions"},
    {"id": "TNFD-LEAP", "pillar": "Strategy", "topic": "TNFD LEAP approach application: Locate, Evaluate, Assess, Prepare"},
]

# Sector ENCORE dependency matrix (simplified, 58 sectors → 12 illustrative)
SECTOR_NATURE_DEPENDENCY = {
    "agriculture": {"dependency_score": 0.92, "key_services": ["ES-P01", "ES-R11", "ES-R05", "ES-R07"], "revenue_at_risk_pct": 45},
    "food_beverage": {"dependency_score": 0.88, "key_services": ["ES-P01", "ES-P03", "ES-R11", "ES-R06"], "revenue_at_risk_pct": 38},
    "forestry": {"dependency_score": 0.95, "key_services": ["ES-P12", "ES-R01", "ES-R13", "ES-R09"], "revenue_at_risk_pct": 55},
    "fishing": {"dependency_score": 0.90, "key_services": ["ES-P06", "ES-R20", "ES-R23", "ES-R06"], "revenue_at_risk_pct": 60},
    "pharmaceuticals": {"dependency_score": 0.72, "key_services": ["ES-P15", "ES-P05", "ES-R19"], "revenue_at_risk_pct": 28},
    "utilities_water": {"dependency_score": 0.85, "key_services": ["ES-P07", "ES-R07", "ES-R06", "ES-R14"], "revenue_at_risk_pct": 40},
    "energy": {"dependency_score": 0.55, "key_services": ["ES-P17", "ES-P18", "ES-R07"], "revenue_at_risk_pct": 18},
    "real_estate": {"dependency_score": 0.60, "key_services": ["ES-R08", "ES-R03", "ES-R15", "ES-C03"], "revenue_at_risk_pct": 22},
    "mining": {"dependency_score": 0.75, "key_services": ["ES-P09", "ES-R07", "ES-R09"], "revenue_at_risk_pct": 30},
    "construction": {"dependency_score": 0.65, "key_services": ["ES-P14", "ES-R08", "ES-R09"], "revenue_at_risk_pct": 20},
    "tourism": {"dependency_score": 0.80, "key_services": ["ES-C02", "ES-C03", "ES-R03", "ES-R04"], "revenue_at_risk_pct": 35},
    "manufacturing": {"dependency_score": 0.50, "key_services": ["ES-P10", "ES-R06", "ES-R14"], "revenue_at_risk_pct": 15},
}


# ── Helpers ────────────────────────────────────────────────────────────────────

def _bool_evidence_score(items: dict[str, Optional[bool]]) -> Optional[float]:
    """Fraction of items marked True, scored ONLY over items with evidence.

    Returns None (insufficient_data) when no item in the group has evidence,
    so absence of data can never be reported as a 0% or fabricated score.
    """
    present = [v for v in items.values() if v is not None]
    if not present:
        return None
    return sum(1 for v in present if v) / len(present)


def _weighted_present_mean(pairs: list[tuple[Optional[float], float]]) -> Optional[float]:
    """Weighted mean over (value, weight) pairs, skipping None values.

    Weights are re-normalised across the present values so a missing framework
    does not drag the composite toward zero. Returns None if nothing is present.
    """
    present = [(v, w) for v, w in pairs if v is not None and w > 0]
    total_w = sum(w for _, w in present)
    if total_w <= 0:
        return None
    return sum(v * w for v, w in present) / total_w


# ── Core Engine Functions ──────────────────────────────────────────────────────

def assess_natural_capital(
    entity_id: str,
    asset_name: str,
    ecosystem_type: str,
    extent_ha: float,
    location_country: str,
    condition_score: Optional[float] = None,
    dependency_score: Optional[float] = None,
    impact_score: Optional[float] = None,
    msa_biodiversity_score: Optional[float] = None,
    gbf_t15_sub_elements: Optional[dict[str, bool]] = None,
) -> dict[str, Any]:
    """Assess natural capital for an ecosystem asset.

    Monetary valuation is a genuine benefit-transfer computation from TEEB/IPBES
    biome unit values scaled by the caller-supplied ecosystem *condition_score*
    (0-1, reference state = 1.0). Entity-specific TNFD dependency/impact scores,
    the MSA biodiversity index, and CBD GBF Target-15 sub-element status are
    reported only when the caller supplies them; absent inputs return honest
    nulls (never fabricated draws).
    """
    eco_lower = ecosystem_type.lower().replace(" ", "_").replace("-", "_")
    biome_data = BIOME_UNIT_VALUES.get(eco_lower, BIOME_UNIT_VALUES["temperate_forest"])

    # Condition score (0-1, reference state = 1.0). Required for scaling service
    # flows and monetary value; without it the assessment cannot be quantified.
    condition_available = condition_score is not None
    if condition_available:
        condition_score = max(0.0, min(1.0, float(condition_score)))

    # SEEA EA account type: EA-4 (Monetary Ecosystem Services) is produced here
    # when condition is known and monetary flows can be derived; otherwise EA-2
    # (Condition Account) is the applicable account still to be populated.
    seea_account = "EA-4" if condition_available else "EA-2"

    # Ecosystem service flows (deterministic: biome unit value × condition)
    if condition_available:
        service_flows: dict[str, Optional[float]] = {
            "provisioning_usd_ha_yr": round(biome_data["provisioning"] * condition_score, 2),
            "regulating_usd_ha_yr": round(biome_data["regulating"] * condition_score, 2),
            "cultural_usd_ha_yr": round(biome_data["cultural"] * condition_score, 2),
        }
        total_unit_value: Optional[float] = biome_data["total_usd_ha_yr"] * condition_score
        monetary_value_usd: Optional[float] = total_unit_value * extent_ha
    else:
        service_flows = {
            "provisioning_usd_ha_yr": None,
            "regulating_usd_ha_yr": None,
            "cultural_usd_ha_yr": None,
        }
        total_unit_value = None
        monetary_value_usd = None

    # TNFD dependency/impact scores — entity-reported; null when not supplied
    dependency_score = round(float(dependency_score), 3) if dependency_score is not None else None
    impact_score = round(float(impact_score), 3) if impact_score is not None else None

    # TNFD pillar most relevant to a site-level natural-capital assessment is the
    # Strategy pillar (S4: locations and direct operational footprint in biomes).
    tnfd_pillar = "Strategy"

    # CBD GBF Target 15 alignment — entity self-assessment; null when absent
    if gbf_t15_sub_elements is not None:
        gbf_t15: Optional[dict[str, bool]] = {
            k: bool(v) for k, v in gbf_t15_sub_elements.items()
        }
        gbf_t15_score: Optional[float] = (
            sum(1 for v in gbf_t15.values() if v) / len(gbf_t15) if gbf_t15 else None
        )
    else:
        gbf_t15 = None
        gbf_t15_score = None

    # Biodiversity condition index (MSA proxy) — measured input; null when absent
    if msa_biodiversity_score is not None:
        msa_score: Optional[float] = round(max(0.0, min(1.0, float(msa_biodiversity_score))), 3)
    else:
        msa_score = None

    notes = []
    if not condition_available:
        notes.append("condition_score not supplied — service flows and monetary valuation are insufficient_data")
    if dependency_score is None or impact_score is None:
        notes.append("dependency_score/impact_score not supplied — TNFD dependency-impact not scored")
    if msa_score is None:
        notes.append("msa_biodiversity_score not supplied")
    if gbf_t15 is None:
        notes.append("gbf_t15_sub_elements not supplied")

    return {
        "entity_id": entity_id,
        "asset_name": asset_name,
        "ecosystem_type": ecosystem_type,
        "location_country": location_country,
        "extent_ha": extent_ha,
        "seea_ea_account": seea_account,
        "condition_score": condition_score if condition_available else None,
        "msa_biodiversity_score": msa_score,
        "service_flows": service_flows,
        "monetary_value_usd": round(monetary_value_usd, 0) if monetary_value_usd is not None else None,
        "monetary_value_per_ha_usd": round(total_unit_value, 2) if total_unit_value is not None else None,
        "biome_reference_values": biome_data,
        "dependency_score": dependency_score,
        "impact_score": impact_score,
        "tnfd_pillar": tnfd_pillar,
        "cbf_gbf_target15": gbf_t15,
        "gbf_t15_alignment_score": round(gbf_t15_score, 3) if gbf_t15_score is not None else None,
        "valuation_methodology": "TEEB/IPBES unit value transfer (WAVES Adjusted Savings framework)",
        "data_notes": notes,
        "assessed_at": datetime.now(timezone.utc).isoformat(),
    }


def valuate_ecosystem_services(
    entity_id: str,
    ecosystem_type: str,
    extent_ha: float,
    services_list: list[str],
    condition_multiplier: Optional[float] = None,
) -> dict[str, Any]:
    """Valuate ecosystem services via benefit transfer from TEEB/IPBES biome values.

    Each service is priced by its ENCORE category's share of the biome total unit
    value, split evenly across the services in that category (an explicit equal-
    allocation model rule applied absent service-specific primary-study weights).
    The result is scaled by the caller-supplied *condition_multiplier* (0-1); when
    it is not supplied a reference-state multiplier of 1.0 is used and the output
    is flagged as reference-state (uncalibrated to site condition).
    """
    eco_lower = ecosystem_type.lower().replace(" ", "_").replace("-", "_")
    biome_data = BIOME_UNIT_VALUES.get(eco_lower, BIOME_UNIT_VALUES["temperate_forest"])

    # Condition multiplier: caller-supplied site condition, else reference state 1.0
    condition_supplied = condition_multiplier is not None
    if condition_supplied:
        condition_multiplier = round(max(0.0, min(1.0, float(condition_multiplier))), 3)
    else:
        condition_multiplier = 1.0

    services_valued: list[dict] = []
    total_annual_flow_usd = 0.0

    all_services = (
        ENCORE_ECOSYSTEM_SERVICES["provisioning"]
        + ENCORE_ECOSYSTEM_SERVICES["regulating_maintenance"]
        + ENCORE_ECOSYSTEM_SERVICES["cultural"]
    )

    # Determine which services to value: explicit request set, or all services.
    if services_list:
        service_ids = set(services_list)
        selected = [s for s in all_services if s["id"] in service_ids]
    else:
        selected = list(all_services)

    # Count selected services per category for even intra-category allocation.
    cat_counts = {"provisioning": 0, "regulating_maintenance": 0, "cultural": 0}
    for service in selected:
        if service["id"].startswith("ES-P"):
            cat_counts["provisioning"] += 1
        elif service["id"].startswith("ES-R"):
            cat_counts["regulating_maintenance"] += 1
        else:
            cat_counts["cultural"] += 1

    total_uv = biome_data["total_usd_ha_yr"]
    for service in selected:
        # Determine category and that category's absolute biome unit value.
        if service["id"].startswith("ES-P"):
            cat = "provisioning"
            cat_unit_value = biome_data["provisioning"]
        elif service["id"].startswith("ES-R"):
            cat = "regulating_maintenance"
            cat_unit_value = biome_data["regulating"]
        else:
            cat = "cultural"
            cat_unit_value = biome_data["cultural"]

        # Even allocation of the category's unit value across its selected services.
        n_in_cat = max(1, cat_counts[cat])
        unit_value = (cat_unit_value / n_in_cat) * condition_multiplier
        annual_flow = unit_value * extent_ha

        total_annual_flow_usd += annual_flow
        services_valued.append({
            "service_id": service["id"],
            "service_name": service["name"],
            "category": cat,
            "unit_value_usd_ha_yr": round(unit_value, 2),
            "annual_flow_usd": round(annual_flow, 0),
            "valuation_method": "Benefit transfer (biome unit value, equal intra-category allocation)",
            "confidence": ("medium" if condition_multiplier > 0.75 else "low") if condition_supplied else "reference_state",
        })

    services_valued = sorted(services_valued, key=lambda x: x["annual_flow_usd"], reverse=True)

    # WAVES / Adjusted Savings methodology components
    waves_metadata = {
        "methodology": "WAVES (Wealth Accounting and Valuation of Ecosystem Services) 2021",
        "price_year": 2023,
        "discount_rate_pct": 4.0,
        "currency": "USD",
        "npv_30yr_usd": round(total_annual_flow_usd * 17.3, 0),  # approx PV annuity factor at 4% 30yr
        "inflation_adjustment": "2023 USD",
    }

    return {
        "entity_id": entity_id,
        "ecosystem_type": ecosystem_type,
        "extent_ha": extent_ha,
        "condition_multiplier": condition_multiplier,
        "condition_basis": "site_supplied" if condition_supplied else "reference_state_1.0_assumed",
        "total_annual_flow_value_usd": round(total_annual_flow_usd, 0),
        "total_unit_value_usd_ha_yr": round(total_annual_flow_usd / extent_ha if extent_ha else 0, 2),
        "services_count": len(services_valued),
        "services_valued": services_valued,
        "category_breakdown": {
            "provisioning_usd": round(sum(s["annual_flow_usd"] for s in services_valued if s["category"] == "provisioning"), 0),
            "regulating_usd": round(sum(s["annual_flow_usd"] for s in services_valued if s["category"] == "regulating_maintenance"), 0),
            "cultural_usd": round(sum(s["annual_flow_usd"] for s in services_valued if s["category"] == "cultural"), 0),
        },
        "waves_metadata": waves_metadata,
        "assessed_at": datetime.now(timezone.utc).isoformat(),
    }


def calculate_dependency_score(
    entity_id: str,
    sector: str,
    operations_description: str,
    revenue_usd: Optional[float] = None,
    substitutability_score: Optional[float] = None,
    operations_in_sensitive_areas: Optional[bool] = None,
) -> dict[str, Any]:
    """Calculate sector nature-dependency score from the ENCORE sector matrix.

    The sector dependency score, key services, and revenue-at-risk *percentage*
    are genuine reference-data lookups (SECTOR_NATURE_DEPENDENCY). Revenue-at-risk
    in USD is computed only when the caller supplies actual *revenue_usd*; without
    it the amount is null. Entity/site-specific figures that are not in reference
    data (per-dependency strength, physical/transition/systemic risk scores) are
    reported as insufficient_data rather than fabricated. Unknown sectors return
    a null dependency score.
    """
    sector_lower = sector.lower().replace(" ", "_").replace("-", "_")
    profile = SECTOR_NATURE_DEPENDENCY.get(sector_lower)
    sector_known = profile is not None
    if profile is None:
        # No reference profile for this sector — do not invent one.
        profile = {"dependency_score": None, "key_services": [], "revenue_at_risk_pct": None}

    dep_score = profile.get("dependency_score")
    rev_at_risk_pct = profile.get("revenue_at_risk_pct")

    # TNFD LEAP Step A — dependency identification (from reference key services)
    all_services = (
        ENCORE_ECOSYSTEM_SERVICES["provisioning"]
        + ENCORE_ECOSYSTEM_SERVICES["regulating_maintenance"]
        + ENCORE_ECOSYSTEM_SERVICES["cultural"]
    )
    service_map = {s["id"]: s for s in all_services}

    key_dependencies = []
    for svc_id in profile["key_services"]:
        if svc_id in service_map:
            svc = service_map[svc_id]
            key_dependencies.append({
                "service_id": svc_id,
                "service_name": svc["name"],
                # Strength/substitutability/criticality are site-specific empirical
                # judgements not encoded in the sector reference matrix.
                "dependency_strength": None,
                "substitutability": "insufficient_data",
                "criticality": "insufficient_data",
                "tnfd_leap_step": "A - Locate",
            })

    # Revenue at risk (USD): real product when actual revenue supplied, else null
    if revenue_usd is not None and rev_at_risk_pct is not None:
        revenue_at_risk_usd: Optional[float] = float(revenue_usd) * rev_at_risk_pct / 100
    else:
        revenue_at_risk_usd = None

    # Substitutability score (0=easily substituted, 1=irreplaceable) — caller input
    if substitutability_score is not None:
        substitutability_score = round(max(0.0, min(1.0, float(substitutability_score))), 3)

    dep_gt = (dep_score or 0)  # null-safe threshold comparisons below

    # TNFD LEAP Steps
    leap_assessment = {
        "L_locate": {
            "step": "Locate — Where does the organisation interface with nature?",
            "operations_in_sensitive_areas": operations_in_sensitive_areas,  # caller-supplied; None if unknown
            "supply_chain_exposure": ("high" if dep_gt > 0.75 else "medium") if dep_score is not None else "insufficient_data",
            "geographic_focus": (["tropical_forests", "freshwater_systems"] if dep_gt > 0.8 else ["temperate_zones"]) if dep_score is not None else [],
        },
        "E_evaluate": {
            "step": "Evaluate — What are the dependencies and impacts?",
            "top_dependencies": [d["service_name"] for d in key_dependencies],
            "dependency_score": dep_score,
            "impact_drivers": (["land_use_change", "water_consumption", "pollution"] if dep_gt > 0.7 else ["water_consumption"]) if dep_score is not None else [],
        },
        "A_assess": {
            "step": "Assess — What are the nature-related risks and opportunities?",
            # Risk-magnitude scores require site-level assessment data not held here.
            "physical_risk": None,
            "transition_risk": None,
            "systemic_risk": None,
            "risk_status": "insufficient_data",
            "opportunities": ["ecosystem_services_markets", "biodiversity_credits", "nature_based_solutions"],
        },
        "P_prepare": {
            "step": "Prepare — What actions are required?",
            "immediate_actions": ["conduct_site-level_assessment", "map_supply_chain_nature_exposure"],
            "medium_term_actions": ["implement_nature_positive_targets", "engage_TNFD_reporting"],
            "long_term_actions": ["transition_to_regenerative_practices", "invest_in_NbS"],
        },
    }

    notes = []
    if not sector_known:
        notes.append(f"sector '{sector}' not in ENCORE reference matrix — dependency_score is insufficient_data")
    if revenue_at_risk_usd is None:
        notes.append("revenue_usd not supplied — revenue_at_risk_usd not computed")

    return {
        "entity_id": entity_id,
        "sector": sector,
        "dependency_score": dep_score,
        "key_dependencies": key_dependencies,
        "revenue_at_risk_pct": rev_at_risk_pct,
        "revenue_at_risk_usd": round(revenue_at_risk_usd, 0) if revenue_at_risk_usd is not None else None,
        "substitutability_score": substitutability_score,
        "tnfd_leap_assessment": leap_assessment,
        "sbtn_scope": "direct_operations_and_upstream",
        "nature_loss_scenario_2030": {
            "business_as_usual_risk_pct": round(rev_at_risk_pct * 1.4, 1) if rev_at_risk_pct is not None else None,
            "1_5c_aligned_risk_pct": round(rev_at_risk_pct * 0.6, 1) if rev_at_risk_pct is not None else None,
        },
        "data_notes": notes,
        "assessed_at": datetime.now(timezone.utc).isoformat(),
    }


def score_natural_capital_disclosure(
    entity_id: str,
    reporting_standard: str,
    disclosure_evidence: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    """Score natural-capital disclosure completeness from caller-supplied evidence.

    This is an evidence-driven assessment: scores are computed only from a
    *disclosure_evidence* mapping the caller provides. Expected shape::

        {
          "tnfd": {"TNFD-G1": 0.9, "TNFD-S1": 0.5, ...},  # per-disclosure 0-1
          "seea": {"extent_account": True, "condition_account": False, ...},
          "gri304": {"304-1_operational_sites": True, ...},
          "esrs_e4": {"E4-1_transition_plan_biodiversity": True, ...},
          "gbf_t15": {"a_assess_dependencies": True, ...},
        }

    Any framework absent from the evidence returns null scores and
    status "insufficient_data" — never a fabricated completeness figure. The
    reference framework structures (item keys) are always returned so callers
    see exactly which items require evidence.
    """
    ev = disclosure_evidence or {}
    tnfd_ev = ev.get("tnfd") or {}
    seea_ev = ev.get("seea") or {}
    gri_ev = ev.get("gri304") or {}
    esrs_ev = ev.get("esrs_e4") or {}
    gbf_ev = ev.get("gbf_t15") or {}

    # ── TNFD v1.0 completeness (per-disclosure evidence scores 0-1) ──
    tnfd_scores: list[dict] = []
    for disc in TNFD_DISCLOSURE_TOPICS:
        raw = tnfd_ev.get(disc["id"])
        if raw is None:
            score: Optional[float] = None
            status = "insufficient_data"
        else:
            score = round(max(0.0, min(1.0, float(raw))), 2)
            status = "complete" if score >= 0.8 else "partial" if score >= 0.5 else "missing"
        tnfd_scores.append({
            "id": disc["id"],
            "pillar": disc["pillar"],
            "topic": disc["topic"],
            "completeness_score": score,
            "status": status,
        })
    tnfd_present = [s["completeness_score"] for s in tnfd_scores if s["completeness_score"] is not None]
    tnfd_overall: Optional[float] = (sum(tnfd_present) / len(tnfd_present)) if tnfd_present else None

    # ── SEEA EA adoption (boolean evidence per account) ──
    seea_keys = [
        "extent_account", "condition_account", "services_physical_account",
        "services_monetary_account", "asset_account", "thematic_accounts",
    ]
    seea_adoption = {k: (bool(seea_ev[k]) if k in seea_ev else None) for k in seea_keys}
    seea_score = _bool_evidence_score(seea_adoption)

    # ── GRI 304 biodiversity alignment ──
    gri304_keys = [
        "304-1_operational_sites", "304-2_significant_impacts",
        "304-3_habitats_protected", "304-4_IUCN_red_list",
    ]
    gri304_items = {k: (bool(gri_ev[k]) if k in gri_ev else None) for k in gri304_keys}
    gri304_score = _bool_evidence_score(gri304_items)

    # ── CSRD ESRS E4 coverage ──
    esrs_e4_keys = [
        "E4-1_transition_plan_biodiversity", "E4-2_policies_biodiversity",
        "E4-3_biodiversity_and_ecosystem_actions", "E4-4_resource_use_targets",
        "E4-5_impact_metrics", "E4-6_anticipated_financial_effects",
    ]
    esrs_e4_items = {k: (bool(esrs_ev[k]) if k in esrs_ev else None) for k in esrs_e4_keys}
    esrs_e4_score = _bool_evidence_score(esrs_e4_items)

    # ── CBD GBF Target 15 sub-elements ──
    gbf_keys = [
        "a_assess_dependencies", "b_monitor_disclose", "c_reduce_negative",
        "d_restore_biodiversity", "e_sustainable_use", "f_equitable_sharing",
    ]
    gbf_t15 = {k: (bool(gbf_ev[k]) if k in gbf_ev else None) for k in gbf_keys}
    gbf_score = _bool_evidence_score(gbf_t15)

    # Composite: weighted mean over frameworks that actually have a score.
    composite = _weighted_present_mean([
        (tnfd_overall, 0.35),
        (seea_score, 0.20),
        (gri304_score, 0.15),
        (esrs_e4_score, 0.20),
        (gbf_score, 0.10),
    ])

    pillars_status = {}
    for p in ["Governance", "Strategy", "Risk Management", "Metrics & Targets"]:
        vals = [s["completeness_score"] for s in tnfd_scores if s["pillar"] == p and s["completeness_score"] is not None]
        pillars_status[p] = round(sum(vals) / len(vals), 3) if vals else None

    return {
        "entity_id": entity_id,
        "reporting_standard": reporting_standard,
        "evidence_supplied": bool(disclosure_evidence),
        "tnfd_v1_disclosure": {
            "overall_completeness": round(tnfd_overall, 3) if tnfd_overall is not None else None,
            "disclosures": tnfd_scores,
            "pillars_status": pillars_status,
        },
        "seea_ea_adoption": {
            "adoption_items": seea_adoption,
            "adoption_score": round(seea_score, 3) if seea_score is not None else None,
        },
        "gri_304_biodiversity": {
            "items": gri304_items,
            "score": round(gri304_score, 3) if gri304_score is not None else None,
        },
        "csrd_esrs_e4": {
            "items": esrs_e4_items,
            "coverage_score": round(esrs_e4_score, 3) if esrs_e4_score is not None else None,
        },
        "cbd_gbf_target15": {
            "sub_elements": gbf_t15,
            "alignment_score": round(gbf_score, 3) if gbf_score is not None else None,
        },
        "composite_disclosure_score": round(composite, 3) if composite is not None else None,
        "data_notes": (
            [] if disclosure_evidence else
            ["no disclosure_evidence supplied — all completeness scores are insufficient_data"]
        ),
        "assessed_at": datetime.now(timezone.utc).isoformat(),
    }


def generate_nature_balance_sheet(
    entity_id: str,
    assets: list[dict[str, Any]],
    restoration_investment_usd: Optional[float] = None,
) -> dict[str, Any]:
    """Generate a SEEA EA 2021 natural-capital balance sheet from reported assets.

    Stock values are a genuine capitalisation (10× annual biome service flow) of
    caller-reported extent and condition. Each asset must carry ``extent_ha`` and
    an opening condition (``opening_condition`` or ``condition_score``, 0-1);
    closing extent/condition default to the opening values (no-reported-change)
    unless the asset supplies ``closing_extent_ha`` / ``closing_condition``.
    Assets missing extent or condition are excluded and listed, never fabricated.
    Restoration investment is included only when supplied by the caller.
    """
    opening_stock_usd = 0.0
    closing_stock_usd = 0.0
    asset_accounts: list[dict] = []
    excluded_assets: list[dict] = []

    for asset in assets:
        eco_type = asset.get("ecosystem_type", "temperate_forest")
        biome = BIOME_UNIT_VALUES.get(eco_type.lower().replace(" ", "_"), BIOME_UNIT_VALUES["temperate_forest"])

        # Extent and opening condition are required — do not invent them.
        extent_raw = asset.get("extent_ha")
        open_condition_raw = (
            asset.get("opening_condition")
            if asset.get("opening_condition") is not None
            else asset.get("condition_score")
        )
        if extent_raw is None or open_condition_raw is None:
            excluded_assets.append({
                "asset_name": asset.get("asset_name", eco_type),
                "ecosystem_type": eco_type,
                "reason": "insufficient_data: extent_ha and opening_condition (or condition_score) are required",
            })
            continue

        open_extent = float(extent_raw)
        open_condition = round(max(0.0, min(1.0, float(open_condition_raw))), 3)

        # Closing values default to opening (no reported change) unless supplied.
        close_extent = float(asset["closing_extent_ha"]) if asset.get("closing_extent_ha") is not None else open_extent
        close_condition_raw = asset.get("closing_condition")
        close_condition = (
            round(max(0.0, min(1.0, float(close_condition_raw))), 3)
            if close_condition_raw is not None else open_condition
        )
        extent_change = close_extent - open_extent

        open_value = biome["total_usd_ha_yr"] * open_condition * open_extent * 10  # capitalised at 10x annual flow
        close_value = biome["total_usd_ha_yr"] * close_condition * close_extent * 10
        value_change = close_value - open_value

        opening_stock_usd += open_value
        closing_stock_usd += close_value

        service_flow_annual = biome["total_usd_ha_yr"] * close_condition * close_extent
        asset_accounts.append({
            "asset_name": asset.get("asset_name", eco_type),
            "ecosystem_type": eco_type,
            "seea_ea_account_type": "EA-5",
            "opening_extent_ha": round(open_extent, 2),
            "closing_extent_ha": round(close_extent, 2),
            "extent_change_ha": round(extent_change, 2),
            "opening_condition": open_condition,
            "closing_condition": close_condition,
            "opening_stock_usd": round(open_value, 0),
            "closing_stock_usd": round(close_value, 0),
            "value_change_usd": round(value_change, 0),
            "annual_service_flow_usd": round(service_flow_annual, 0),
            "depreciation_rate_pct": round((1 - close_condition / open_condition) * 100, 2) if open_condition > 0 else 0,
        })

    net_change = closing_stock_usd - opening_stock_usd
    # Integrated P&L impact
    integrated_pl = {
        "ecosystem_service_revenue_recognised_usd": round(sum(a["annual_service_flow_usd"] for a in asset_accounts), 0),
        "natural_capital_depreciation_usd": round(sum(a["value_change_usd"] for a in asset_accounts if a["value_change_usd"] < 0), 0),
        "restoration_investment_usd": (
            round(float(restoration_investment_usd), 0) if restoration_investment_usd is not None else None
        ),
        "net_integrated_pl_impact_usd": round(net_change, 0),
    }

    notes = []
    if excluded_assets:
        notes.append(f"{len(excluded_assets)} asset(s) excluded for missing extent/condition")
    if restoration_investment_usd is None:
        notes.append("restoration_investment_usd not supplied")

    return {
        "entity_id": entity_id,
        "accounting_year": datetime.now(timezone.utc).year,
        "seea_ea_structure": "SEEA EA 2021 Tables 5.1-5.4",
        "opening_natural_capital_stock_usd": round(opening_stock_usd, 0),
        "closing_natural_capital_stock_usd": round(closing_stock_usd, 0),
        "net_change_usd": round(net_change, 0),
        "net_change_pct": round(net_change / opening_stock_usd * 100, 2) if opening_stock_usd else 0,
        "asset_accounts": asset_accounts,
        "excluded_assets": excluded_assets,
        "integrated_pl_impact": integrated_pl,
        "waves_metadata": {
            "methodology": "WAVES Adjusted Savings — capitalised ecosystem service flows",
            "capitalisation_multiple": 10,
            "discount_rate_pct": 4.0,
        },
        "data_notes": notes,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
