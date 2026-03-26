"""
Loss & Damage Finance Engine — E113
====================================
References:
  - UNFCCC Warsaw International Mechanism (WIM) — COP19 Decision 2/CP.19
  - COP28 Loss and Damage Fund — Decision 5/CP.28 (Santiago Network)
  - Paris Agreement Article 8 — Loss and Damage cooperation
  - IPCC AR6 WG2 Chapter 16 — Loss and Damage, limits to adaptation
  - Fraction of Attributable Risk (FAR) — World Weather Attribution (WWA)
  - V20 Vulnerable Twenty Group annual economic loss reporting
  - Parametric insurance — InsuResilience Global Partnership 2023
  - Regional risk pools: CCRIF SPC, Africa Risk Capacity (ARC), PCRAFI

Sub-modules:
  1. Loss & Damage Assessment    — FAR attribution, WIM/COP28 eligibility
  2. Protection Gap Analysis     — insured vs. economic loss gap
  3. Parametric Trigger Design   — trigger type, threshold, basis risk
  4. Regional Mechanism Assessment — eligible pools, premium estimates
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# 1. Vulnerable Country Profiles — 25 V20/SIDS/LDC countries
#    Fields: name, annual_economic_loss_usd_bn, insured_loss_pct,
#            climate_vulnerability_score, primary_peril, V20_member,
#            SIDS_member, LDC_member, protection_gap_pct, region
# ---------------------------------------------------------------------------

VULNERABLE_COUNTRY_PROFILES: Dict[str, Dict[str, Any]] = {
    "BGD": {"name": "Bangladesh",      "annual_economic_loss_usd_bn": 3.72, "insured_loss_pct": 3.0,  "climate_vulnerability_score": 88, "primary_peril": "coastal_flooding",      "V20_member": True,  "SIDS_member": False, "LDC_member": True,  "protection_gap_pct": 97.0, "region": "South Asia"},
    "PHL": {"name": "Philippines",     "annual_economic_loss_usd_bn": 4.10, "insured_loss_pct": 6.5,  "climate_vulnerability_score": 85, "primary_peril": "cyclone_intensification","V20_member": True,  "SIDS_member": False, "LDC_member": False, "protection_gap_pct": 93.5, "region": "Southeast Asia"},
    "VNM": {"name": "Vietnam",         "annual_economic_loss_usd_bn": 3.25, "insured_loss_pct": 5.0,  "climate_vulnerability_score": 80, "primary_peril": "coastal_flooding",      "V20_member": True,  "SIDS_member": False, "LDC_member": False, "protection_gap_pct": 95.0, "region": "Southeast Asia"},
    "IDN": {"name": "Indonesia",       "annual_economic_loss_usd_bn": 2.90, "insured_loss_pct": 7.0,  "climate_vulnerability_score": 77, "primary_peril": "coastal_flooding",      "V20_member": True,  "SIDS_member": False, "LDC_member": False, "protection_gap_pct": 93.0, "region": "Southeast Asia"},
    "MDV": {"name": "Maldives",        "annual_economic_loss_usd_bn": 0.38, "insured_loss_pct": 4.0,  "climate_vulnerability_score": 95, "primary_peril": "coastal_flooding",      "V20_member": True,  "SIDS_member": True,  "LDC_member": False, "protection_gap_pct": 96.0, "region": "South Asia"},
    "FJI": {"name": "Fiji",            "annual_economic_loss_usd_bn": 0.22, "insured_loss_pct": 5.5,  "climate_vulnerability_score": 83, "primary_peril": "cyclone_intensification","V20_member": True,  "SIDS_member": True,  "LDC_member": False, "protection_gap_pct": 94.5, "region": "Pacific"},
    "HTI": {"name": "Haiti",           "annual_economic_loss_usd_bn": 0.85, "insured_loss_pct": 1.5,  "climate_vulnerability_score": 91, "primary_peril": "cyclone_intensification","V20_member": True,  "SIDS_member": False, "LDC_member": True,  "protection_gap_pct": 98.5, "region": "Caribbean"},
    "ETH": {"name": "Ethiopia",        "annual_economic_loss_usd_bn": 1.65, "insured_loss_pct": 1.0,  "climate_vulnerability_score": 84, "primary_peril": "drought",               "V20_member": True,  "SIDS_member": False, "LDC_member": True,  "protection_gap_pct": 99.0, "region": "Sub-Saharan Africa"},
    "KEN": {"name": "Kenya",           "annual_economic_loss_usd_bn": 1.30, "insured_loss_pct": 3.0,  "climate_vulnerability_score": 76, "primary_peril": "drought",               "V20_member": True,  "SIDS_member": False, "LDC_member": False, "protection_gap_pct": 97.0, "region": "Sub-Saharan Africa"},
    "GHA": {"name": "Ghana",           "annual_economic_loss_usd_bn": 0.72, "insured_loss_pct": 2.5,  "climate_vulnerability_score": 70, "primary_peril": "drought",               "V20_member": True,  "SIDS_member": False, "LDC_member": False, "protection_gap_pct": 97.5, "region": "Sub-Saharan Africa"},
    "MOZ": {"name": "Mozambique",      "annual_economic_loss_usd_bn": 0.95, "insured_loss_pct": 1.2,  "climate_vulnerability_score": 87, "primary_peril": "cyclone_intensification","V20_member": True,  "SIDS_member": False, "LDC_member": True,  "protection_gap_pct": 98.8, "region": "Sub-Saharan Africa"},
    "NPL": {"name": "Nepal",           "annual_economic_loss_usd_bn": 0.48, "insured_loss_pct": 2.0,  "climate_vulnerability_score": 79, "primary_peril": "coastal_flooding",      "V20_member": True,  "SIDS_member": False, "LDC_member": True,  "protection_gap_pct": 98.0, "region": "South Asia"},
    "BTN": {"name": "Bhutan",          "annual_economic_loss_usd_bn": 0.12, "insured_loss_pct": 1.5,  "climate_vulnerability_score": 72, "primary_peril": "coastal_flooding",      "V20_member": False, "SIDS_member": False, "LDC_member": True,  "protection_gap_pct": 98.5, "region": "South Asia"},
    "KHM": {"name": "Cambodia",        "annual_economic_loss_usd_bn": 0.55, "insured_loss_pct": 1.8,  "climate_vulnerability_score": 75, "primary_peril": "coastal_flooding",      "V20_member": True,  "SIDS_member": False, "LDC_member": True,  "protection_gap_pct": 98.2, "region": "Southeast Asia"},
    "MMR": {"name": "Myanmar",         "annual_economic_loss_usd_bn": 1.05, "insured_loss_pct": 1.5,  "climate_vulnerability_score": 82, "primary_peril": "cyclone_intensification","V20_member": True,  "SIDS_member": False, "LDC_member": True,  "protection_gap_pct": 98.5, "region": "Southeast Asia"},
    "LAO": {"name": "Laos",            "annual_economic_loss_usd_bn": 0.30, "insured_loss_pct": 1.0,  "climate_vulnerability_score": 71, "primary_peril": "coastal_flooding",      "V20_member": False, "SIDS_member": False, "LDC_member": True,  "protection_gap_pct": 99.0, "region": "Southeast Asia"},
    "HND": {"name": "Honduras",        "annual_economic_loss_usd_bn": 0.62, "insured_loss_pct": 4.0,  "climate_vulnerability_score": 78, "primary_peril": "cyclone_intensification","V20_member": True,  "SIDS_member": False, "LDC_member": False, "protection_gap_pct": 96.0, "region": "Central America"},
    "NIC": {"name": "Nicaragua",       "annual_economic_loss_usd_bn": 0.45, "insured_loss_pct": 3.5,  "climate_vulnerability_score": 76, "primary_peril": "cyclone_intensification","V20_member": True,  "SIDS_member": False, "LDC_member": False, "protection_gap_pct": 96.5, "region": "Central America"},
    "SLV": {"name": "El Salvador",     "annual_economic_loss_usd_bn": 0.38, "insured_loss_pct": 5.0,  "climate_vulnerability_score": 73, "primary_peril": "drought",               "V20_member": True,  "SIDS_member": False, "LDC_member": False, "protection_gap_pct": 95.0, "region": "Central America"},
    "BLZ": {"name": "Belize",          "annual_economic_loss_usd_bn": 0.14, "insured_loss_pct": 6.0,  "climate_vulnerability_score": 74, "primary_peril": "cyclone_intensification","V20_member": False, "SIDS_member": True,  "LDC_member": False, "protection_gap_pct": 94.0, "region": "Caribbean"},
    "JAM": {"name": "Jamaica",         "annual_economic_loss_usd_bn": 0.28, "insured_loss_pct": 7.0,  "climate_vulnerability_score": 72, "primary_peril": "cyclone_intensification","V20_member": True,  "SIDS_member": True,  "LDC_member": False, "protection_gap_pct": 93.0, "region": "Caribbean"},
    "VUT": {"name": "Vanuatu",         "annual_economic_loss_usd_bn": 0.09, "insured_loss_pct": 3.0,  "climate_vulnerability_score": 86, "primary_peril": "cyclone_intensification","V20_member": True,  "SIDS_member": True,  "LDC_member": True,  "protection_gap_pct": 97.0, "region": "Pacific"},
    "SLB": {"name": "Solomon Islands", "annual_economic_loss_usd_bn": 0.07, "insured_loss_pct": 2.0,  "climate_vulnerability_score": 84, "primary_peril": "coastal_flooding",      "V20_member": True,  "SIDS_member": True,  "LDC_member": True,  "protection_gap_pct": 98.0, "region": "Pacific"},
    "KIR": {"name": "Kiribati",        "annual_economic_loss_usd_bn": 0.04, "insured_loss_pct": 1.5,  "climate_vulnerability_score": 97, "primary_peril": "coastal_flooding",      "V20_member": True,  "SIDS_member": True,  "LDC_member": True,  "protection_gap_pct": 98.5, "region": "Pacific"},
    "TUV": {"name": "Tuvalu",          "annual_economic_loss_usd_bn": 0.02, "insured_loss_pct": 1.0,  "climate_vulnerability_score": 99, "primary_peril": "coastal_flooding",      "V20_member": True,  "SIDS_member": True,  "LDC_member": True,  "protection_gap_pct": 99.0, "region": "Pacific"},
}

# ---------------------------------------------------------------------------
# 2. Climate Attribution FAR — World Weather Attribution
# ---------------------------------------------------------------------------

CLIMATE_ATTRIBUTION_FAR: Dict[str, Dict[str, Any]] = {
    "heat_wave":              {"far": 0.90, "confidence_level": "very_high",   "method": "FAR counterfactual modelling",                          "reference": "WWA 2021; IPCC AR6 WG1 Ch11.3",       "notes": "Extreme heat events ≥5× more likely due to human influence."},
    "cyclone_intensification":{"far": 0.72, "confidence_level": "high",        "method": "Rapid intensification probability shift — ensemble",      "reference": "WWA / Kossin et al. 2020; AR6 WG1 Ch11.7","notes": "Climate change increases rapid intensification probability and peak winds."},
    "drought":                {"far": 0.55, "confidence_level": "medium",      "method": "PDSI observational trend attribution",                   "reference": "WWA 2023; IPCC AR6 WG2 Ch16.2",       "notes": "Lower confidence due to ENSO natural variability interactions."},
    "coastal_flooding":       {"far": 0.65, "confidence_level": "high",        "method": "Sea level rise contribution — tide gauge + altimetry",   "reference": "IPCC AR6 WG1 Ch9; SROCC 2019",        "notes": "Climate SLR significantly increases coastal flood probabilities."},
    "wildfire":               {"far": 0.60, "confidence_level": "medium_high", "method": "Fire weather index trend attribution — reanalysis",       "reference": "WWA 2021; Abatzoglou & Williams 2016", "notes": "Regional variation significant; Mediterranean/W. US strongest."},
    "crop_failure":           {"far": 0.50, "confidence_level": "medium",      "method": "Crop yield sensitivity — GAEZ climate scenarios",         "reference": "IPCC AR6 WG2 Ch5; Lobell & Burke 2010","notes": "Confounded by irrigation and non-climate land management drivers."},
}

# ---------------------------------------------------------------------------
# 3. COP28 Loss and Damage Fund (Decision 5/CP.28)
# ---------------------------------------------------------------------------

COP28_LD_FUND: Dict[str, Any] = {
    "formal_name": "Fund for responding to Loss and Damage",
    "established": "COP28, Dubai, December 2023",
    "legal_basis": "Decision 5/CP.28; Paris Agreement Article 8",
    "initial_pledges_usd_bn": 0.792,
    "secretariat": "World Bank (interim host, 4-year review)",
    "eligibility_criteria": [
        "Developing country Party to UNFCCC",
        "Particularly vulnerable to adverse effects of climate change",
        "Experiencing slow-onset and sudden-onset climate events",
        "Demonstrates genuine L&D nexus (not purely adaptation expenditure)",
        "Country-owned request aligned with national development priorities",
        "Demonstrated inability to fully self-finance L&D response",
    ],
    "grant_size_range": {"min_usd_mn": 0.5, "max_usd_mn": 50.0, "typical_usd_mn": 5.0},
    "loan_terms": {
        "concessional_rate_pct": 0.0,
        "grant_element_pct": 35.0,
        "repayment_years": 40,
        "grace_period_years": 10,
        "currency": "USD",
    },
    "access_modalities": ["direct_access", "enhanced_direct_access", "international_access"],
    "priority_areas": [
        "Slow-onset events (sea level rise, desertification, salinisation)",
        "Sudden-onset events (cyclones, floods, droughts)",
        "Non-economic losses (cultural heritage, biodiversity, ecosystem services)",
        "Displacement and migration linked to climate impacts",
    ],
    "santiago_network_link": "Technical assistance and capacity building for fund access",
    "review_timeline": "4-year comprehensive review beginning 2027",
}

# ---------------------------------------------------------------------------
# 4. Warsaw Mechanism — 5 Pillars
# ---------------------------------------------------------------------------

WIM_PILLARS: List[Dict[str, Any]] = [
    {
        "pillar_id": "WIM-1", "name": "Knowledge and Understanding",
        "description": "Enhancing understanding of comprehensive risk management for L&D; climate data, vulnerability assessments, and impact quantification.",
        "eligibility": ["All UNFCCC developing country Parties", "SIDS and LDCs prioritised", "Countries with climate observational data gaps"],
        "key_activities": ["Climate attribution studies", "Non-economic loss frameworks", "Slow-onset event monitoring"],
    },
    {
        "pillar_id": "WIM-2", "name": "Coordination and Coherence",
        "description": "Strengthening dialogue among governments, UN agencies, private sector, and civil society on L&D approaches.",
        "eligibility": ["All Parties and observer organisations", "Regional bodies and intergovernmental organisations"],
        "key_activities": ["Task Force on Displacement (TFD)", "Expert dialogues", "Stakeholder engagement platforms"],
    },
    {
        "pillar_id": "WIM-3", "name": "Finance, Technology and Capacity Building",
        "description": "Facilitating mobilisation of expertise, finance, technology and capacity building. Directly links to COP28 L&D Fund.",
        "eligibility": ["Developing countries with verified L&D finance gaps", "Countries with climate attribution evidence", "Priority: V20, SIDS, LDCs, African Group"],
        "key_activities": ["COP28 L&D Fund facilitation", "Insurance and risk transfer mechanisms", "Innovative finance instruments"],
    },
    {
        "pillar_id": "WIM-4", "name": "Non-Economic Losses",
        "description": "Addressing impacts on human life, cultural heritage, indigenous knowledge, biodiversity, and ecosystem services.",
        "eligibility": ["All developing country Parties", "Indigenous Peoples and local communities", "SIDS facing cultural and territorial loss"],
        "key_activities": ["Non-economic loss valuation frameworks", "Cultural heritage documentation", "Ecosystem service accounting"],
    },
    {
        "pillar_id": "WIM-5", "name": "Slow-Onset Events",
        "description": "Addressing sea level rise, increasing temperatures, ocean acidification, desertification, land degradation, glacial retreat, and salinisation.",
        "eligibility": ["SIDS (sea level rise, ocean acidification)", "Arid/semi-arid developing countries (desertification)", "Mountain nations (glacial retreat)", "LDCs with slow-onset agricultural impacts"],
        "key_activities": ["Sea level rise monitoring and projections", "Managed retreat planning", "Slow-onset finance readiness assessments"],
    },
]

# ---------------------------------------------------------------------------
# 5. Regional Risk Pools
# ---------------------------------------------------------------------------

REGIONAL_RISK_POOLS: Dict[str, Dict[str, Any]] = {
    "CCRIF": {
        "full_name": "Caribbean Catastrophe Risk Insurance Facility SPC",
        "coverage_area": "Caribbean SIDS + Central America",
        "member_countries": ["JAM", "HTI", "BLZ", "HND", "NIC", "SLV", "BRB", "TTO", "GUY", "DOM", "ATG"],
        "perils": ["tropical_cyclone", "earthquake", "excess_rainfall"],
        "premium_as_pct_of_coverage": 1.8,
        "claims_payout_ratio": 0.72,
        "trigger_type": "parametric",
        "payout_speed_days": 14,
        "max_payout_usd_mn": 175.0,
        "establishment": 2007,
        "donor_support": "World Bank, EU, UK, Canada",
    },
    "ARC": {
        "full_name": "African Risk Capacity",
        "coverage_area": "Sub-Saharan Africa",
        "member_countries": ["ETH", "KEN", "GHA", "MOZ", "ZMB", "NER", "SEN", "MLI", "BFA", "TZA", "MWI"],
        "perils": ["drought", "flood", "cyclone"],
        "premium_as_pct_of_coverage": 2.1,
        "claims_payout_ratio": 0.68,
        "trigger_type": "parametric",
        "payout_speed_days": 30,
        "max_payout_usd_mn": 30.0,
        "establishment": 2012,
        "donor_support": "AfDB, World Bank, Germany, UK",
    },
    "PCRAFI": {
        "full_name": "Pacific Catastrophe Risk Assessment and Financing Initiative",
        "coverage_area": "Pacific SIDS",
        "member_countries": ["FJI", "VUT", "SLB", "KIR", "TUV", "WSM", "TON", "FSM", "PLW", "MHL"],
        "perils": ["tropical_cyclone", "earthquake", "tsunami"],
        "premium_as_pct_of_coverage": 2.5,
        "claims_payout_ratio": 0.75,
        "trigger_type": "parametric",
        "payout_speed_days": 10,
        "max_payout_usd_mn": 40.0,
        "establishment": 2013,
        "donor_support": "World Bank, ADB, Japan, Australia",
    },
}

# ---------------------------------------------------------------------------
# 6. Parametric Trigger Types
# ---------------------------------------------------------------------------

PARAMETRIC_TRIGGER_TYPES: Dict[str, Dict[str, Any]] = {
    "weather_station":       {"description": "Ground-based met station readings (rainfall, temperature, wind speed)",          "basis_risk_score": 0.35, "data_availability": "high",      "lead_time_hours": 0,  "best_for_perils": ["drought", "heat_wave", "rainfall_excess"],                     "limitations": "Sparse networks in vulnerable countries; spatial basis risk."},
    "satellite_imagery":     {"description": "Remote-sensing indices (NDVI, soil moisture, SAR flood extent)",                  "basis_risk_score": 0.22, "data_availability": "very_high", "lead_time_hours": 24, "best_for_perils": ["drought", "crop_failure", "coastal_flooding", "wildfire"],     "limitations": "Cloud cover interference; 5-10 day optical lag; calibration required."},
    "sea_surface_temperature":{"description": "SST anomaly as proxy for cyclone intensification and coral bleaching",           "basis_risk_score": 0.28, "data_availability": "very_high", "lead_time_hours": 72, "best_for_perils": ["cyclone_intensification", "coastal_flooding"],                "limitations": "Must combine with wind shear and moisture data for full attribution."},
    "wind_speed":            {"description": "Maximum sustained 1-min wind speed at landfall from best-track data",             "basis_risk_score": 0.18, "data_availability": "high",      "lead_time_hours": 0,  "best_for_perils": ["cyclone_intensification", "wildfire"],                         "limitations": "Tracks poorly once inland; does not capture surge or rainfall component."},
}

# ---------------------------------------------------------------------------
# Rapid response options by eligibility tier
# ---------------------------------------------------------------------------

_RAPID_RESPONSE: Dict[str, List[Dict[str, Any]]] = {
    "tier_1_sids_ldc": [
        {"mechanism": "COP28 L&D Fund — Emergency Grant",                        "typical_size_usd_mn": 5.0,   "disbursement_speed": "6-12 months",       "eligibility_note": "SIDS/LDC with documented L&D event"},
        {"mechanism": "WIM Santiago Network Technical Assistance",               "typical_size_usd_mn": 0.5,   "disbursement_speed": "3-6 months",        "eligibility_note": "All developing countries; prioritises SIDS/LDC"},
        {"mechanism": "Regional Parametric Insurance Pool Payout",               "typical_size_usd_mn": 10.0,  "disbursement_speed": "10-30 days",        "eligibility_note": "Pool membership required; trigger must fire"},
        {"mechanism": "InsuResilience — Vulnerable Populations Grant",           "typical_size_usd_mn": 2.0,   "disbursement_speed": "4-8 months",        "eligibility_note": "Household-level exposure; poverty targeting required"},
    ],
    "tier_2_v20": [
        {"mechanism": "COP28 L&D Fund — Concessional Loan",                      "typical_size_usd_mn": 15.0,  "disbursement_speed": "12-18 months",      "eligibility_note": "V20 members with verified L&D finance gap"},
        {"mechanism": "IMF Resilience and Sustainability Trust (RST)",            "typical_size_usd_mn": 50.0,  "disbursement_speed": "18-24 months",      "eligibility_note": "Macro-critical climate vulnerability; RSF Programme required"},
        {"mechanism": "World Bank CATDDO — Catastrophe Deferred Drawdown",       "typical_size_usd_mn": 100.0, "disbursement_speed": "48 hours (trigger)", "eligibility_note": "Pre-arranged contingent credit; activates on disaster declaration"},
    ],
    "tier_3_other": [
        {"mechanism": "GCF Emergency Response Window",                            "typical_size_usd_mn": 10.0,  "disbursement_speed": "12-24 months",      "eligibility_note": "Developing country Party; NDA endorsement required"},
        {"mechanism": "World Bank DRFI — Disaster Risk Finance",                  "typical_size_usd_mn": 30.0,  "disbursement_speed": "6-12 months",       "eligibility_note": "DRM strategy required"},
    ],
}

# Peril → threshold specification
_PERIL_THRESHOLDS: Dict[str, Dict[str, str]] = {
    "drought":               {"index": "Vegetation Health Index (VHI)", "trigger_level": "VHI < 35 over 3 consecutive dekads", "exit_level": "VHI < 20 (full payout)", "reference_period": "1981–2010 climatological baseline", "unit": "dimensionless 0–100"},
    "crop_failure":          {"index": "NDVI anomaly (% deviation from LRM)", "trigger_level": "-25% anomaly sustained over growing season", "exit_level": "-50% anomaly (full payout)", "reference_period": "15-year rolling agricultural calendar", "unit": "percentage deviation"},
    "cyclone_intensification":{"index": "Maximum sustained 1-min wind at landfall", "trigger_level": "64 kn (Category 1)", "exit_level": "130 kn (Category 4+, full payout)", "reference_period": "IBTrACS 1980–2023", "unit": "knots"},
    "coastal_flooding":      {"index": "Sea surface height anomaly", "trigger_level": "+50 cm storm surge above mean high water", "exit_level": "+150 cm (full payout)", "reference_period": "Satellite altimetry 2000–2023", "unit": "centimetres"},
    "heat_wave":             {"index": "Temperature exceedance above 30-year daily mean", "trigger_level": "+3 °C for 5+ consecutive days", "exit_level": "+6 °C for 10+ consecutive days (full payout)", "reference_period": "ERA5 1991–2020", "unit": "°C anomaly × duration"},
    "wildfire":              {"index": "Burned area (MODIS/VIIRS active fire pixels)", "trigger_level": "500 km² within admin boundary", "exit_level": "2 000 km² (full payout)", "reference_period": "MODIS MCD64 2001–2023", "unit": "km² burned area"},
}

# Peril → best trigger type
_PERIL_TRIGGER_MAP: Dict[str, str] = {
    "drought": "satellite_imagery",
    "crop_failure": "satellite_imagery",
    "cyclone_intensification": "wind_speed",
    "coastal_flooding": "sea_surface_temperature",
    "heat_wave": "weather_station",
    "wildfire": "satellite_imagery",
}

# ---------------------------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------------------------


class LossDamageRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    country_iso: str = Field(..., min_length=2, max_length=3, description="ISO 3166-1 alpha-3 country code")
    event_type: str = Field(..., description="One of: heat_wave, cyclone_intensification, drought, coastal_flooding, wildfire, crop_failure")
    economic_loss_usd: float = Field(..., gt=0.0, description="Total estimated economic loss in USD")
    year: int = Field(default=2024, ge=2000, le=2050)
    include_wim_analysis: bool = True
    include_cop28_analysis: bool = True


class ProtectionGapRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    country_iso: str = Field(..., min_length=2, max_length=3)
    total_loss_usd: float = Field(..., gt=0.0)
    insured_loss_usd: float = Field(..., ge=0.0)
    sector: str = Field(default="economy_wide", description="agriculture | infrastructure | residential | economy_wide")


class ParametricTriggerRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    country_iso: str = Field(..., min_length=2, max_length=3)
    peril: str = Field(..., description="One of: drought, cyclone_intensification, coastal_flooding, heat_wave, wildfire, crop_failure")
    coverage_amount_usd_mn: float = Field(default=10.0, gt=0.0)
    preferred_payout_speed_days: int = Field(default=30, ge=1, le=365)


class RegionalMechanismRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    country_iso: str = Field(..., min_length=2, max_length=3)
    annual_exposure_usd_mn: float = Field(default=50.0, gt=0.0)
    desired_perils: List[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Engine Class
# ---------------------------------------------------------------------------


class LossDamageFinanceEngine:
    """Core engine for Loss and Damage finance assessment (E113)."""

    _SECTOR_FEASIBLE_PCT: Dict[str, float] = {
        "agriculture": 25.0,
        "infrastructure": 40.0,
        "residential": 30.0,
        "economy_wide": 20.0,
    }

    _PREMIUM_RATE: Dict[str, float] = {
        "LDC": 0.010,
        "SIDS": 0.020,
        "V20": 0.015,
        "other": 0.025,
    }

    def _profile(self, country_iso: str) -> Optional[Dict[str, Any]]:
        return VULNERABLE_COUNTRY_PROFILES.get(country_iso.upper())

    def _tier(self, p: Dict[str, Any]) -> str:
        if p.get("SIDS_member") or p.get("LDC_member"):
            return "tier_1_sids_ldc"
        if p.get("V20_member"):
            return "tier_2_v20"
        return "tier_3_other"

    def _premium_cat(self, p: Dict[str, Any]) -> str:
        if p.get("LDC_member"):
            return "LDC"
        if p.get("SIDS_member"):
            return "SIDS"
        if p.get("V20_member"):
            return "V20"
        return "other"

    def _wim_pillars_for_event(self, event_type: str) -> List[str]:
        mp = {
            "heat_wave": ["WIM-1", "WIM-3"],
            "cyclone_intensification": ["WIM-1", "WIM-3", "WIM-4"],
            "drought": ["WIM-1", "WIM-3", "WIM-5"],
            "coastal_flooding": ["WIM-1", "WIM-3", "WIM-4", "WIM-5"],
            "wildfire": ["WIM-1", "WIM-3"],
            "crop_failure": ["WIM-1", "WIM-3", "WIM-5"],
        }
        return mp.get(event_type, ["WIM-1", "WIM-3"])

    # ------------------------------------------------------------------
    # Sub-module 1: Loss & Damage Assessment
    # ------------------------------------------------------------------

    def assess_loss_damage_finance(
        self,
        country_iso: str,
        event_type: str,
        economic_loss_usd: float,
    ) -> Dict[str, Any]:
        iso = country_iso.upper()
        p = self._profile(iso)

        far_data = CLIMATE_ATTRIBUTION_FAR.get(event_type)
        if not far_data:
            raise ValueError(f"Unknown event_type '{event_type}'. Available: {list(CLIMATE_ATTRIBUTION_FAR)}")

        far = far_data["far"]
        attributed_usd = economic_loss_usd * far
        unattributed_usd = economic_loss_usd * (1.0 - far)

        if p:
            insured_pct = p.get("insured_loss_pct", 5.0)
            estimated_insured = economic_loss_usd * insured_pct / 100.0
            gap_usd = economic_loss_usd - estimated_insured
            pg_pct = p.get("protection_gap_pct", 95.0)
            vuln = p.get("climate_vulnerability_score", 50)
            cop28_eligible = True
            cop28_grant = p.get("LDC_member") or p.get("SIDS_member")
            cop28_tier = (
                "priority_access" if vuln >= 85 else
                "standard_access" if vuln >= 70 else
                "general_access"
            )
            est_grant_mn = round(min(attributed_usd / 1_000_000, COP28_LD_FUND["grant_size_range"]["max_usd_mn"]), 2)
            tier = self._tier(p)
            wim_eligible = True
            wim_priority = "high" if (p.get("LDC_member") or p.get("SIDS_member")) else "standard"
        else:
            estimated_insured = economic_loss_usd * 0.05
            gap_usd = economic_loss_usd * 0.95
            pg_pct = 95.0
            cop28_eligible = None
            cop28_grant = None
            cop28_tier = "unknown"
            est_grant_mn = None
            tier = "tier_3_other"
            wim_eligible = None
            wim_priority = "unknown"

        return {
            "assessment_id": str(uuid.uuid4()),
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "country_iso": iso,
            "country_name": p.get("name") if p else iso,
            "event_type": event_type,
            "total_economic_loss_usd": economic_loss_usd,
            "climate_attribution": {
                "fraction_attributable_risk": far,
                "confidence_level": far_data["confidence_level"],
                "attributed_loss_usd": round(attributed_usd, 2),
                "unattributed_loss_usd": round(unattributed_usd, 2),
                "method": far_data["method"],
                "reference": far_data["reference"],
            },
            "protection_gap": {
                "estimated_insured_loss_usd": round(estimated_insured, 2),
                "protection_gap_usd": round(gap_usd, 2),
                "protection_gap_pct": pg_pct,
            },
            "wim_eligibility": {
                "eligible": wim_eligible,
                "priority": wim_priority,
                "basis": (
                    "Developing country eligible under WIM Decision 2/CP.19 and Paris Agreement Art 8."
                    if wim_eligible
                    else "Country not found in vulnerable country registry; manual verification required."
                ),
                "relevant_pillars": self._wim_pillars_for_event(event_type),
            },
            "cop28_fund_eligibility": {
                "eligible": cop28_eligible,
                "grant_eligible": cop28_grant,
                "access_tier": cop28_tier,
                "estimated_grant_usd_mn": est_grant_mn,
                "loan_terms": COP28_LD_FUND["loan_terms"],
            },
            "rapid_response_options": _RAPID_RESPONSE.get(tier, []),
            "country_profile": p,
        }

    # ------------------------------------------------------------------
    # Sub-module 2: Protection Gap Analysis
    # ------------------------------------------------------------------

    def calculate_protection_gap(
        self,
        country_iso: str,
        total_loss_usd: float,
        insured_loss_usd: float,
        sector: str = "economy_wide",
    ) -> Dict[str, Any]:
        iso = country_iso.upper()
        p = self._profile(iso)

        gap_usd = max(total_loss_usd - insured_loss_usd, 0.0)
        gap_pct = (gap_usd / total_loss_usd * 100.0) if total_loss_usd > 0 else 0.0
        actual_pen = (insured_loss_usd / total_loss_usd * 100.0) if total_loss_usd > 0 else 0.0
        feasible_pct = self._SECTOR_FEASIBLE_PCT.get(sector, 20.0)
        feasible_insured = total_loss_usd * feasible_pct / 100.0
        residual_gap = max(total_loss_usd - feasible_insured, 0.0)

        cat = self._premium_cat(p) if p else "other"
        premium_rate = self._PREMIUM_RATE[cat]
        annual_premium = total_loss_usd * premium_rate

        recs: List[str] = []
        if gap_pct > 95:
            recs.append("Establish parametric sovereign risk transfer via regional pool membership.")
            recs.append("Access COP28 L&D Fund for residual uninsurable losses.")
        elif gap_pct > 70:
            recs.append("Develop index-based insurance products for smallholders and households.")
            recs.append("Blend concessional finance with donor grants to reach feasible penetration.")
        else:
            recs.append("Expand domestic insurance market with regulatory incentives.")
            recs.append("Integrate climate risk into prudential framework to mobilise private capital.")
        if p and (p.get("SIDS_member") or p.get("LDC_member")):
            recs.append("Prioritise InsuResilience Global Partnership premium subsidy mechanisms.")

        return {
            "assessment_id": str(uuid.uuid4()),
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "country_iso": iso,
            "country_name": p.get("name") if p else iso,
            "sector": sector,
            "total_loss_usd": total_loss_usd,
            "insured_loss_usd": insured_loss_usd,
            "gap_usd": round(gap_usd, 2),
            "gap_pct": round(gap_pct, 2),
            "actual_penetration_pct": round(actual_pen, 2),
            "feasible_penetration_pct": feasible_pct,
            "feasible_insured_usd": round(feasible_insured, 2),
            "residual_gap_after_feasible_usd": round(residual_gap, 2),
            "annual_premium_estimate_usd": round(annual_premium, 2),
            "premium_rate_applied_pct": round(premium_rate * 100.0, 3),
            "premium_category": cat,
            "policy_recommendations": recs,
            "country_profile": p,
        }

    # ------------------------------------------------------------------
    # Sub-module 3: Parametric Trigger Design
    # ------------------------------------------------------------------

    def design_parametric_trigger(
        self,
        country_iso: str,
        peril: str,
        coverage_amount_usd_mn: float = 10.0,
        preferred_payout_speed_days: int = 30,
    ) -> Dict[str, Any]:
        iso = country_iso.upper()
        p = self._profile(iso)

        if peril not in _PERIL_TRIGGER_MAP:
            raise ValueError(f"Unknown peril '{peril}'. Available: {list(_PERIL_TRIGGER_MAP)}")

        rec_trigger = _PERIL_TRIGGER_MAP[peril]
        t_data = PARAMETRIC_TRIGGER_TYPES[rec_trigger]

        basis = t_data["basis_risk_score"]
        if p and p.get("LDC_member"):
            basis = min(basis + 0.08, 0.60)
        elif p and p.get("SIDS_member"):
            basis = min(basis + 0.05, 0.55)

        mitigants: List[str] = []
        if basis > 0.30:
            mitigants.append("Combine index with household loss verification (hybrid structure).")
            mitigants.append("Deploy additional weather stations or increase satellite coverage.")
        if basis > 0.20:
            mitigants.append("Apply 30% basis risk adjustment buffer in payout calculation.")
            mitigants.append("Annual threshold recalibration against observed losses.")

        alternatives = [k for k, v in PARAMETRIC_TRIGGER_TYPES.items() if k != rec_trigger and peril in v["best_for_perils"]]
        pool_premium_pct = REGIONAL_RISK_POOLS.get("CCRIF", {}).get("premium_as_pct_of_coverage", 2.0)

        return {
            "design_id": str(uuid.uuid4()),
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "country_iso": iso,
            "country_name": p.get("name") if p else iso,
            "peril": peril,
            "coverage_amount_usd_mn": coverage_amount_usd_mn,
            "recommended_trigger_type": rec_trigger,
            "trigger_description": t_data["description"],
            "basis_risk_score": round(basis, 3),
            "basis_risk_rating": "low" if basis < 0.20 else "medium" if basis < 0.35 else "high",
            "threshold": _PERIL_THRESHOLDS.get(peril, {"index": "TBD", "trigger_level": "TBD"}),
            "payout_structure": {
                "structure": "linear_interpolation",
                "minimum_payout_pct": 10.0,
                "maximum_payout_pct": 100.0,
                "maximum_payout_usd_mn": coverage_amount_usd_mn,
                "trigger_to_exit": "Linear from trigger (10%) to exit threshold (100%)",
                "deductible_pct": 0.0,
                "currency": "USD",
                "payment_timing": f"Within {preferred_payout_speed_days} days of trigger confirmation",
                "independent_calculation_agent": "Required (third-party data provider)",
            },
            "data_availability": t_data["data_availability"],
            "lead_time_hours": t_data["lead_time_hours"],
            "limitations": t_data["limitations"],
            "alternative_triggers": alternatives,
            "basis_risk_mitigants": mitigants,
            "estimated_annual_premium_usd_mn": round(coverage_amount_usd_mn * pool_premium_pct / 100.0, 4),
        }

    # ------------------------------------------------------------------
    # Sub-module 4: Regional Mechanism Assessment
    # ------------------------------------------------------------------

    def assess_regional_mechanism(
        self,
        country_iso: str,
        annual_exposure_usd_mn: float = 50.0,
        desired_perils: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        iso = country_iso.upper()
        p = self._profile(iso)
        desired_perils = desired_perils or []

        pools_out: List[Dict[str, Any]] = []
        for pool_name, pool in REGIONAL_RISK_POOLS.items():
            is_member = iso in pool["member_countries"]
            pool_perils = pool["perils"]
            if desired_perils:
                overlap = [x for x in desired_perils if x in pool_perils]
                match_pct = len(overlap) / len(desired_perils) * 100.0
            else:
                overlap = pool_perils
                match_pct = 100.0

            premium_usd = annual_exposure_usd_mn * pool["premium_as_pct_of_coverage"] / 100.0
            coverage_ratio = min(annual_exposure_usd_mn / pool["max_payout_usd_mn"], 1.0) if pool["max_payout_usd_mn"] > 0 else 0.0

            pools_out.append({
                "pool_name": pool_name,
                "full_name": pool["full_name"],
                "coverage_area": pool["coverage_area"],
                "is_current_member": is_member,
                "perils_covered": pool_perils,
                "peril_match": overlap,
                "coverage_match_pct": round(match_pct, 1),
                "premium_as_pct_of_coverage": pool["premium_as_pct_of_coverage"],
                "estimated_annual_premium_usd_mn": round(premium_usd, 4),
                "max_payout_usd_mn": pool["max_payout_usd_mn"],
                "coverage_ratio_vs_exposure": round(coverage_ratio, 3),
                "claims_payout_ratio": pool["claims_payout_ratio"],
                "payout_speed_days": pool["payout_speed_days"],
                "trigger_type": pool["trigger_type"],
                "establishment": pool["establishment"],
                "donor_support": pool["donor_support"],
                "recommendation": (
                    "Active member — review coverage adequacy and premium terms."
                    if is_member
                    else "Eligible for membership — apply through accredited national entity."
                ),
            })

        pools_out.sort(key=lambda x: (not x["is_current_member"], -x["coverage_match_pct"]))

        recs: List[str] = []
        if not any(x["is_current_member"] for x in pools_out):
            recs.append("Country is not a member of any monitored regional risk pool. Prioritise joining the most suitable pool.")
        if p and p.get("LDC_member"):
            recs.append("As an LDC, donor-subsidised premium access may be available through InsuResilience Global Partnership.")
        if p and p.get("SIDS_member"):
            recs.append("As a SIDS, consider PCRAFI (Pacific) or CCRIF (Caribbean) based on geographic region.")

        return {
            "assessment_id": str(uuid.uuid4()),
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "country_iso": iso,
            "country_name": p.get("name") if p else iso,
            "annual_exposure_usd_mn": annual_exposure_usd_mn,
            "desired_perils": desired_perils,
            "eligible_pools": pools_out,
            "overall_recommendations": recs,
            "country_profile": p,
        }
