"""
Food System & Land Use Finance Engine (E54)
===========================================
SBTi FLAG, FAO crop yield modeling, TNFD Food LEAP, EUDR deforestation-free
supply chains, Agricultural financed emissions (PCAF), Land Degradation Neutrality.

Sub-modules:
  1. SBTi FLAG Assessment     — Sector-specific reduction targets (crops/livestock/forests)
  2. FAO Crop Yield Modeling  — RCP impact projections + adaptation gains
  3. TNFD Food LEAP           — 4-stage nature dependency & impact assessment
  4. EUDR Food Screening      — Deforestation-free commodity compliance
  5. Agricultural Emissions   — Scope 1/2/3 farm-level GHG accounting
  6. FLAG Target Setting      — Science-based intervention roadmap
  7. Land Degradation         — LDN status, restoration potential, carbon stocks

References:
  - SBTi FLAG Guidance v1.0 (2022)
  - FAO GAEZ v4 — Global Agro-ecological Zones
  - TNFD v1.0 — LEAP approach for food companies
  - Regulation (EU) 2023/1115 — EUDR
  - PCAF Agriculture Financed Emissions Standard
  - UN SDG 15.3 — Land Degradation Neutrality
  - IPCC AR6 Chapter 5 — Food, fibre and other ecosystem products
"""
from __future__ import annotations

from typing import Optional


# ---------------------------------------------------------------------------
# Reference Data
# ---------------------------------------------------------------------------

FLAG_SECTORS = {
    "cattle":         {"scope": True, "reduction_pct": 30.0, "removal_pct": 5.0, "target_year": 2030},
    "poultry_pigs":   {"scope": True, "reduction_pct": 30.0, "removal_pct": 5.0, "target_year": 2030},
    "crops":          {"scope": True, "reduction_pct": 30.0, "removal_pct": 5.0, "target_year": 2030},
    "forests_trees":  {"scope": True, "reduction_pct": 72.0, "removal_pct": 0.0, "target_year": 2030},
    "other":          {"scope": True, "reduction_pct": 30.0, "removal_pct": 5.0, "target_year": 2030},
    "manufacturing":  {"scope": False, "reduction_pct": 0.0, "removal_pct": 0.0, "target_year": None},
    "energy":         {"scope": False, "reduction_pct": 0.0, "removal_pct": 0.0, "target_year": None},
}

EUDR_FOOD_COMMODITIES = {"cattle", "cocoa", "coffee", "oil_palm", "soy"}

# Country risk tiers (simplified subset from Art 29)
EUDR_COUNTRY_RISK: dict[str, str] = {
    "BR": "high", "ID": "high", "CO": "standard", "MY": "high",
    "PG": "high", "NG": "high", "CI": "high", "GH": "standard",
    "CM": "high", "VN": "standard", "IN": "standard", "PE": "standard",
    "EC": "standard", "MX": "standard", "US": "low", "GB": "low",
    "DE": "low", "FR": "low", "AU": "low", "CN": "standard",
    "ZA": "standard", "TZ": "standard", "ET": "high", "UG": "high",
}

# FAO RCP yield impacts (min, max) by RCP
FAO_RCP_IMPACTS: dict[str, tuple[float, float]] = {
    "rcp26": (-3.0, 2.0),
    "rcp45": (-8.0, -2.0),
    "rcp85": (-20.0, -8.0),
}

# Tropical crops with uniformly negative RCP 8.5 outlook
TROPICAL_CROPS = {"coffee", "cocoa", "oil_palm", "sugarcane", "rice"}

CROPS = ["wheat", "maize", "rice", "soy", "coffee", "cocoa", "sugarcane"]
REGIONS = ["south_asia", "sub_saharan_africa", "latin_america", "southeast_asia", "europe"]

TNFD_FOOD_NATURE_SERVICES = [
    "Soil formation and composition",
    "Pollination",
    "Pest and disease regulation",
    "Water regulation",
    "Genetic diversity maintenance",
    "Climate regulation",
    "Nutrient cycling",
]

HIGH_RISK_FOOD_COMMODITIES = {"cattle", "cocoa", "coffee", "palm_oil", "soy", "rubber", "wood"}

LDN_STATUSES = ["Improving", "Stable", "Degrading"]

# Agricultural emission factors
ENTERIC_FERMENTATION_KG_HEAD = {
    "dairy_cattle": 120.0,   # kg CH4/head/year
    "beef_cattle": 65.0,
    "sheep": 8.0,
    "pigs": 1.5,
    "poultry": 0.02,
}

FLAG_INTERVENTIONS = [
    {"action": "Reduce synthetic fertiliser application", "tco2e_per_ha": 0.4, "cost_usd_per_ha": 120.0, "timeline": "2025-2027"},
    {"action": "Implement feed efficiency improvement", "tco2e_per_head": 0.8, "cost_usd_per_head": 80.0, "timeline": "2025-2028"},
    {"action": "Restore degraded pasture to forest", "tco2e_per_ha_removal": 5.0, "cost_usd_per_ha": 800.0, "timeline": "2026-2030"},
    {"action": "Shift to lower-emission crop varieties", "tco2e_per_ha": 0.3, "cost_usd_per_ha": 200.0, "timeline": "2025-2027"},
    {"action": "Precision agriculture adoption", "tco2e_per_ha": 0.2, "cost_usd_per_ha": 350.0, "timeline": "2025-2030"},
    {"action": "Anaerobic digestion for manure management", "tco2e_per_head": 1.2, "cost_usd_per_head": 150.0, "timeline": "2026-2030"},
    {"action": "Agroforestry integration", "tco2e_per_ha_removal": 2.5, "cost_usd_per_ha": 600.0, "timeline": "2026-2030"},
]


# ---------------------------------------------------------------------------
# Engine Class
# ---------------------------------------------------------------------------

class FoodSystemEngine:
    """Food System & Land Use Finance Engine (E54)."""

    # ------------------------------------------------------------------
    # 1. SBTi FLAG Assessment
    # ------------------------------------------------------------------

    def assess_sbti_flag(
        self,
        entity_id: str,
        sector: str,
        base_year: int,
        target_year: int,
        current_emissions_tco2e: float,
        achieved_reduction_pct: Optional[float] = None,
    ) -> dict:
        """
        SBTi FLAG sector-specific science-based target assessment.
        Reduction requirements: crops/livestock 30%, forests 72% by 2030 vs 2020.

        `achieved_reduction_pct` is the entity-reported progress against the base
        year (%). When absent, progress-dependent fields are returned as None with
        a note; the required target is always computed deterministically.
        """
        sec = sector.lower() if sector.lower() in FLAG_SECTORS else "other"
        params = FLAG_SECTORS[sec]

        flag_scope = params["scope"]
        required_reduction_pct = params["reduction_pct"]
        removal_pct = params["removal_pct"]

        land_mitigation_tco2_pa = round(current_emissions_tco2e * required_reduction_pct / 100.0, 2)
        removal_tco2_pa = round(current_emissions_tco2e * removal_pct / 100.0, 2)

        # Current progress — real computation from caller-supplied reported reduction,
        # else honest null (no fabricated progress).
        if achieved_reduction_pct is not None:
            achieved_pct = round(float(achieved_reduction_pct), 2)
            achieved_tco2 = round(current_emissions_tco2e * achieved_pct / 100.0, 2)
            gap_tco2_pa = round(max(0.0, land_mitigation_tco2_pa - achieved_tco2), 2)
            target_met = gap_tco2_pa == 0.0
            progress_note = None
        else:
            achieved_pct = None
            achieved_tco2 = None
            gap_tco2_pa = None
            target_met = None
            progress_note = "insufficient_data: achieved_reduction_pct not supplied"

        return {
            "entity_id": entity_id,
            "sector": sec,
            "flag_scope": flag_scope,
            "base_year": base_year,
            "target_year": target_year,
            "current_emissions_tco2e": round(current_emissions_tco2e, 2),
            "required_reduction_pct": required_reduction_pct,
            "land_mitigation_tco2_pa": land_mitigation_tco2_pa,
            "removal_tco2_pa": removal_tco2_pa,
            "achieved_reduction_pct": achieved_pct,
            "achieved_tco2": achieved_tco2,
            "gap_tco2_pa": gap_tco2_pa,
            "target_met": target_met,
            "progress_note": progress_note,
            "science_based": flag_scope,
            "sbti_methodology": "SBTi FLAG v1.0 (2022)",
        }

    # ------------------------------------------------------------------
    # 2. FAO Crop Yield Modeling
    # ------------------------------------------------------------------

    # Tropical-crop RCP 8.5 yield-impact band (FAO GAEZ / IPCC AR6 Ch5), % change
    _TROPICAL_RCP85_IMPACT: tuple[float, float] = (-25.0, -12.0)
    # Documented FAO adaptation-gain band (improved varieties + irrigation), % of yield
    _FAO_ADAPTATION_GAIN_BAND: tuple[float, float] = (3.0, 8.0)

    def model_fao_crop_yield(
        self,
        entity_id: str,
        crop: str,
        region: str,
        baseline_yield_t_ha: float,
        adaptation_gain_pct: Optional[float] = None,
    ) -> dict:
        """
        FAO GAEZ-based yield projections under RCP 2.6, 4.5, and 8.5.
        Adaptation gains from improved varieties and irrigation.

        RCP impacts are the published FAO GAEZ / IPCC AR6 band midpoints for the
        crop's climate zone (model parameters, not fabricated entity figures).
        `adaptation_gain_pct` may be supplied by the caller; otherwise the FAO
        adaptation-band midpoint is applied as a documented scenario assumption.
        """
        crop_l = crop.lower() if crop.lower() in CROPS else "wheat"
        region_l = region.lower() if region.lower() in REGIONS else "europe"
        is_tropical = crop_l in TROPICAL_CROPS

        def _band_mid(band: tuple[float, float]) -> float:
            lo, hi = band
            return round((lo + hi) / 2.0, 2)

        def _yield_impact(rcp: str) -> float:
            if is_tropical and rcp == "rcp85":
                return _band_mid(self._TROPICAL_RCP85_IMPACT)
            return _band_mid(FAO_RCP_IMPACTS[rcp])

        rcp26 = _yield_impact("rcp26")
        rcp45 = _yield_impact("rcp45")
        rcp85 = _yield_impact("rcp85")
        if adaptation_gain_pct is not None:
            adaptation_gain_pct = round(float(adaptation_gain_pct), 2)
        else:
            adaptation_gain_pct = _band_mid(self._FAO_ADAPTATION_GAIN_BAND)

        stressed_yield = {
            "rcp26": round(baseline_yield_t_ha * (1 + rcp26 / 100.0), 3),
            "rcp45_no_adapt": round(baseline_yield_t_ha * (1 + rcp45 / 100.0), 3),
            "rcp45_with_adapt": round(baseline_yield_t_ha * (1 + (rcp45 + adaptation_gain_pct) / 100.0), 3),
            "rcp85_no_adapt": round(baseline_yield_t_ha * (1 + rcp85 / 100.0), 3),
            "rcp85_with_adapt": round(baseline_yield_t_ha * (1 + (rcp85 + adaptation_gain_pct) / 100.0), 3),
        }

        return {
            "entity_id": entity_id,
            "crop": crop_l,
            "region": region_l,
            "baseline_yield_t_ha": round(baseline_yield_t_ha, 3),
            "rcp26_impact_pct": rcp26,
            "rcp45_impact_pct": rcp45,
            "rcp85_impact_pct": rcp85,
            "adaptation_gain_pct": adaptation_gain_pct,
            "stressed_yield_t_ha": stressed_yield,
            "tropical_crop": is_tropical,
            "impact_basis": "FAO GAEZ / IPCC AR6 band midpoint",
            "data_source": "FAO GAEZ v4 + IPCC AR6 Ch5",
        }

    # ------------------------------------------------------------------
    # 3. TNFD Food LEAP
    # ------------------------------------------------------------------

    def assess_tnfd_food_leap(
        self,
        entity_id: str,
        entity_name: str,
        commodities: list,
        leap_scores: Optional[dict] = None,
        nature_scores: Optional[dict] = None,
        relied_nature_services: Optional[list] = None,
    ) -> dict:
        """
        TNFD LEAP (Locate, Evaluate, Assess, Prepare) for food companies.
        Identifies nature dependencies and material risks by commodity.

        Entity-specific maturity/dependency scores are caller-supplied:
          - `leap_scores`   : {"locate", "evaluate", "assess", "prepare"} (0-100)
          - `nature_scores` : {"nature_dependency", "nature_impact", "water_dependency"} (0-100)
          - `relied_nature_services` : list of relied-upon nature services
        Absent inputs are returned as None (no fabricated scores). The commodity
        risk filter and — when the LEAP composite is computable — the biodiversity
        risk band are derived deterministically.
        """
        leap_scores = leap_scores or {}
        nature_scores = nature_scores or {}

        def _score(src: dict, key: str) -> Optional[float]:
            v = src.get(key)
            return round(float(v), 1) if v is not None else None

        locate_score = _score(leap_scores, "locate")
        evaluate_score = _score(leap_scores, "evaluate")
        assess_score = _score(leap_scores, "assess")
        prepare_score = _score(leap_scores, "prepare")

        leap_parts = [s for s in (locate_score, evaluate_score, assess_score, prepare_score) if s is not None]
        if len(leap_parts) == 4:
            leap_composite: Optional[float] = round(sum(leap_parts) / 4.0, 2)
        else:
            leap_composite = None

        nature_dependency_score = _score(nature_scores, "nature_dependency")
        nature_impact_score = _score(nature_scores, "nature_impact")
        water_dependency = _score(nature_scores, "water_dependency")

        if leap_composite is None:
            biodiversity_risk = "insufficient_data"
        elif leap_composite >= 70.0:
            biodiversity_risk = "Low"
        elif leap_composite >= 50.0:
            biodiversity_risk = "Medium"
        else:
            biodiversity_risk = "High"

        high_risk = [c for c in commodities if c.lower() in HIGH_RISK_FOOD_COMMODITIES]

        if relied_nature_services is not None:
            relied_services: Optional[list] = [
                s for s in relied_nature_services if s in TNFD_FOOD_NATURE_SERVICES
            ]
        else:
            relied_services = None

        return {
            "entity_id": entity_id,
            "entity_name": entity_name,
            "commodities_assessed": commodities,
            "locate_score": locate_score,
            "evaluate_score": evaluate_score,
            "assess_score": assess_score,
            "prepare_score": prepare_score,
            "leap_composite": leap_composite,
            "nature_dependency_score": nature_dependency_score,
            "nature_impact_score": nature_impact_score,
            "water_dependency": water_dependency,
            "biodiversity_risk": biodiversity_risk,
            "high_risk_commodities": high_risk,
            "relied_nature_services": relied_services,
            "framework": "TNFD v1.0 LEAP approach",
        }

    # ------------------------------------------------------------------
    # 4. EUDR Food Compliance
    # ------------------------------------------------------------------

    def assess_eudr_food(
        self,
        entity_id: str,
        commodities: list,
        country_codes: list,
        cutoff_compliant: Optional[bool] = None,
        geolocation_coverage_pct: Optional[float] = None,
    ) -> dict:
        """
        EUDR Art 29 compliance screening for food commodities.
        Checks deforestation-free status, cutoff date, and geolocation coverage.

        `cutoff_compliant` (post-2020-12-31 deforestation-free attestation) and
        `geolocation_coverage_pct` (share of plots with verified geolocation) are
        entity-reported facts supplied by the caller. When absent they are returned
        as None and excluded from the compliance-gap score, which is flagged partial.
        The country-risk tiers and deforestation-free status are always derived.
        """
        screened = [c for c in commodities if c.lower() in EUDR_FOOD_COMMODITIES]
        other_commodities = [c for c in commodities if c.lower() not in EUDR_FOOD_COMMODITIES]

        country_risk_tiers = {}
        for cc in country_codes:
            country_risk_tiers[cc.upper()] = EUDR_COUNTRY_RISK.get(cc.upper(), "standard")

        high_risk_countries = [cc for cc, tier in country_risk_tiers.items() if tier == "high"]
        deforestation_free = len(high_risk_countries) == 0

        if cutoff_compliant is not None:
            cutoff_compliant = bool(cutoff_compliant)

        if geolocation_coverage_pct is not None:
            geolocation_coverage_pct = round(float(geolocation_coverage_pct), 1)
            geolocation_verified: Optional[bool] = geolocation_coverage_pct >= 95.0
        else:
            geolocation_verified = None

        # Compliance gap — only inputs that are known contribute; if any driver is
        # unknown the gap is marked partial rather than fabricated.
        gap_factors = 0
        gap_complete = True
        if not deforestation_free:
            gap_factors += 35
        if cutoff_compliant is None:
            gap_complete = False
        elif not cutoff_compliant:
            gap_factors += 25
        if geolocation_coverage_pct is None:
            gap_complete = False
        elif not geolocation_verified:
            gap_factors += min(40, int(100 - geolocation_coverage_pct))
        compliance_gap_pct = round(min(100.0, float(gap_factors)), 1)
        dds_required = len(screened) > 0

        return {
            "entity_id": entity_id,
            "commodities_screened": screened,
            "non_eudr_commodities": other_commodities,
            "country_risk_tiers": country_risk_tiers,
            "high_risk_countries": high_risk_countries,
            "deforestation_free": deforestation_free,
            "cutoff_date": "2020-12-31",
            "cutoff_compliant": cutoff_compliant,
            "geolocation_coverage_pct": geolocation_coverage_pct,
            "geolocation_verified": geolocation_verified,
            "compliance_gap_pct": compliance_gap_pct,
            "compliance_gap_complete": gap_complete,
            "dds_required": dds_required,
            "regulation": "Regulation (EU) 2023/1115",
        }

    # ------------------------------------------------------------------
    # 5. Agricultural Emissions
    # ------------------------------------------------------------------

    def compute_agricultural_emissions(
        self,
        entity_id: str,
        farm_area_ha: float,
        livestock_count: int,
        crop_type: str,
        pcaf_dqs: Optional[int] = None,
    ) -> dict:
        """
        Farm-level GHG accounting: Scope 1 (enteric + manure + N2O + residue),
        Scope 2 (electricity irrigation), Scope 3 Cat 1 (fertilisers).

        `pcaf_dqs` is the caller-assigned PCAF data-quality score (1=verified,
        5=estimated). When not supplied it is returned as None (no fabricated
        score) — the emissions themselves are always computed from activity data.
        """
        # Scope 1
        scope1_tco2e = round(livestock_count * 2.5 + farm_area_ha * 0.8, 2)
        # Scope 2
        scope2_tco2e = round(farm_area_ha * 0.12, 2)
        # Scope 3 Cat 1 — purchased inputs (fertiliser)
        scope3_cat1_tco2e = round(farm_area_ha * 1.5, 2)
        total_tco2e = round(scope1_tco2e + scope2_tco2e + scope3_cat1_tco2e, 2)

        emission_intensity = round(total_tco2e / farm_area_ha, 3) if farm_area_ha > 0 else 0.0

        # PCAF DQS (1-5: 1=verified, 5=estimated) — caller-assigned or honest null.
        if pcaf_dqs is not None:
            pcaf_dqs = max(1, min(5, int(pcaf_dqs)))

        reduction_pathway = [
            {"year": 2025, "measure": "Precision fertiliser application", "reduction_tco2e": round(farm_area_ha * 0.15, 1)},
            {"year": 2027, "measure": "Renewable energy for irrigation", "reduction_tco2e": round(scope2_tco2e * 0.7, 1)},
            {"year": 2028, "measure": "Improved feed efficiency", "reduction_tco2e": round(livestock_count * 0.4, 1)},
            {"year": 2030, "measure": "Agroforestry carbon sequestration", "removal_tco2e": round(farm_area_ha * 0.5, 1)},
        ]

        return {
            "entity_id": entity_id,
            "farm_area_ha": round(farm_area_ha, 2),
            "livestock_count": livestock_count,
            "crop_type": crop_type,
            "scope1_tco2e": scope1_tco2e,
            "scope2_tco2e": scope2_tco2e,
            "scope3_cat1_tco2e": scope3_cat1_tco2e,
            "total_tco2e": total_tco2e,
            "emission_intensity_tco2e_ha": emission_intensity,
            "pcaf_dqs": pcaf_dqs,
            "reduction_pathway": reduction_pathway,
            "methodology": "PCAF Agriculture Standard + IPCC Tier 1",
        }

    # ------------------------------------------------------------------
    # 6. FLAG Target Setting
    # ------------------------------------------------------------------

    def set_flag_targets(
        self,
        entity_id: str,
        assessment_id: str,
        sector: str,
        base_emissions: float,
        target_year: int,
        intervention_plan: Optional[list] = None,
    ) -> dict:
        """
        SBTi FLAG target settings with intervention roadmap.
        Returns science-based target parameters and abatement levers.

        `intervention_plan` is a caller-supplied deployment plan: a list of
        {"action": <FLAG intervention name>, "scale": <hectares or head>}.
        For each planned action the tonnage and cost are computed deterministically
        from the reference per-unit factors in FLAG_INTERVENTIONS. When no plan is
        supplied, the full intervention catalogue is returned with its per-unit
        factors but null tonnage/cost (no fabricated deployment scale), and the
        abatement gap / SBTi-approvable flag are returned as None.
        """
        sec = sector.lower() if sector.lower() in FLAG_SECTORS else "other"
        params = FLAG_SECTORS[sec]
        required_reduction = base_emissions * params["reduction_pct"] / 100.0
        required_removal = base_emissions * params["removal_pct"] / 100.0
        total_required = required_reduction + required_removal

        _catalogue = {iv["action"]: iv for iv in FLAG_INTERVENTIONS}

        interventions = []
        if intervention_plan is not None:
            cumulative_reduction = 0.0
            for entry in intervention_plan:
                action = entry.get("action")
                iv = _catalogue.get(action)
                if iv is None:
                    continue
                scale = float(entry.get("scale", 0.0) or 0.0)
                if "tco2e_per_ha" in iv:
                    reduction = round(iv["tco2e_per_ha"] * scale, 1)
                    cost = round(iv["cost_usd_per_ha"] * scale, 0)
                elif "tco2e_per_head" in iv:
                    reduction = round(iv["tco2e_per_head"] * scale, 1)
                    cost = round(iv["cost_usd_per_head"] * scale, 0)
                else:
                    reduction = round(iv.get("tco2e_per_ha_removal", 0.0) * scale, 1)
                    cost = round(iv.get("cost_usd_per_ha", 0.0) * scale, 0)
                cumulative_reduction += reduction
                interventions.append({
                    "action": iv["action"],
                    "scale": round(scale, 1),
                    "tco2e_reduction": reduction,
                    "cost_usd": cost,
                    "timeline": iv["timeline"],
                })
            cumulative_reduction = round(cumulative_reduction, 2)
            interventions_gap: Optional[float] = round(max(0.0, total_required - cumulative_reduction), 2)
            sbti_approvable: Optional[bool] = (
                (interventions_gap / total_required < 0.20) if total_required > 0 else True
            )
            plan_note = None
        else:
            # No deployment plan — expose the catalogue with per-unit factors only.
            for iv in FLAG_INTERVENTIONS:
                interventions.append({
                    "action": iv["action"],
                    "tco2e_per_ha": iv.get("tco2e_per_ha"),
                    "tco2e_per_head": iv.get("tco2e_per_head"),
                    "tco2e_per_ha_removal": iv.get("tco2e_per_ha_removal"),
                    "cost_usd_per_ha": iv.get("cost_usd_per_ha"),
                    "cost_usd_per_head": iv.get("cost_usd_per_head"),
                    "tco2e_reduction": None,
                    "cost_usd": None,
                    "timeline": iv["timeline"],
                })
            cumulative_reduction = None
            interventions_gap = None
            sbti_approvable = None
            plan_note = "insufficient_data: no intervention_plan supplied; catalogue returned without deployment scale"

        target_settings = [
            {"target_type": "Mitigation", "value_tco2e": round(required_reduction, 2), "year": target_year, "metric": "Absolute"},
            {"target_type": "Removal",    "value_tco2e": round(required_removal, 2),   "year": target_year, "metric": "Absolute"},
        ]

        return {
            "entity_id": entity_id,
            "assessment_id": assessment_id,
            "sector": sec,
            "base_emissions_tco2e": round(base_emissions, 2),
            "total_required_reduction_tco2e": round(total_required, 2),
            "target_settings": target_settings,
            "interventions": interventions,
            "cumulative_intervention_reduction": cumulative_reduction,
            "interventions_gap": interventions_gap,
            "sbti_approvable": sbti_approvable,
            "plan_note": plan_note,
            "standard": "SBTi FLAG v1.0",
        }

    # ------------------------------------------------------------------
    # 7. Land Degradation Assessment
    # ------------------------------------------------------------------

    # Reference carbon-stock density by land use (tCO2e/ha), IPCC AR6 Ch5 default
    # midpoints — model parameters, not entity-reported figures.
    _LAND_USE_CARBON_STOCK: dict[str, float] = {
        "forest": 275.0,
        "cropland": 40.0,
        "pasture": 55.0,
        "wetland": 200.0,
        "grassland": 47.5,
        "shrubland": 32.5,
    }
    # Documented carbon-stock trend by LDN status (% p.a.) — band midpoints.
    _LDN_CHANGE_PCT: dict[str, float] = {
        "Improving": 3.0,
        "Stable": 0.0,
        "Degrading": -5.5,
    }
    # UNCCD indicative land-restoration unit cost (USD/ha) — reference constant.
    _RESTORATION_COST_USD_PER_HA: float = 800.0

    def assess_land_degradation(
        self,
        entity_id: str,
        land_area_ha: float,
        land_use: str,
        country_code: str,
        ldn_status: Optional[str] = None,
        degraded_area_ha: Optional[float] = None,
        biodiversity_index: Optional[float] = None,
    ) -> dict:
        """
        LDN (Land Degradation Neutrality) assessment per UN SDG 15.3.
        Evaluates carbon stock, restoration potential, and biodiversity index.

        Carbon-stock density uses published IPCC AR6 defaults by land use (model
        parameters). Entity-observed fields are caller-supplied:
          - `ldn_status`      : "Improving" | "Stable" | "Degrading"
          - `degraded_area_ha`: observed degraded hectares (restoration potential)
          - `biodiversity_index`: 0-1 intactness index
        Absent inputs are returned as None (no fabricated observations). The
        carbon-stock trend is derived from `ldn_status` when supplied.
        """
        # Carbon stock (tCO2e) — reference density × area (deterministic).
        base_carbon = self._LAND_USE_CARBON_STOCK.get(land_use.lower())
        if base_carbon is not None:
            carbon_stock_tco2e: Optional[float] = round(base_carbon * land_area_ha, 1)
            carbon_stock_basis: Optional[str] = "IPCC AR6 Ch5 default density"
        else:
            carbon_stock_tco2e = None
            carbon_stock_basis = "insufficient_data: unknown land_use carbon density"

        # LDN status — caller-observed trend, else honest null.
        if ldn_status is not None and ldn_status in LDN_STATUSES:
            status = ldn_status
        elif ldn_status is not None:
            status = None
        else:
            status = None

        if status is not None:
            carbon_stock_change_pct: Optional[float] = round(self._LDN_CHANGE_PCT[status], 2)
        else:
            carbon_stock_change_pct = None

        # Restoration potential — from observed degraded area, else honest null.
        if degraded_area_ha is not None:
            restoration_potential_ha: Optional[float] = round(
                max(0.0, min(float(degraded_area_ha), land_area_ha)), 1
            )
            restoration_cost_usd: Optional[float] = round(
                restoration_potential_ha * self._RESTORATION_COST_USD_PER_HA, 0
            )
        else:
            restoration_potential_ha = None
            restoration_cost_usd = None

        if biodiversity_index is not None:
            biodiversity_index = round(max(0.0, min(1.0, float(biodiversity_index))), 3)

        return {
            "entity_id": entity_id,
            "land_area_ha": round(land_area_ha, 2),
            "land_use": land_use,
            "country_code": country_code.upper(),
            "ldn_status": status,
            "carbon_stock_tco2e": carbon_stock_tco2e,
            "carbon_stock_basis": carbon_stock_basis,
            "carbon_stock_change_pct": carbon_stock_change_pct,
            "restoration_potential_ha": restoration_potential_ha,
            "biodiversity_index": biodiversity_index,
            "restoration_cost_usd": restoration_cost_usd,
            "sdg_target": "SDG 15.3 — Land Degradation Neutrality",
            "monitoring_framework": "UNCCD 2030 targets",
        }


# ---------------------------------------------------------------------------
# Module-level instance
# ---------------------------------------------------------------------------

_engine = FoodSystemEngine()

assess_sbti_flag = _engine.assess_sbti_flag
model_fao_crop_yield = _engine.model_fao_crop_yield
assess_tnfd_food_leap = _engine.assess_tnfd_food_leap
assess_eudr_food = _engine.assess_eudr_food
compute_agricultural_emissions = _engine.compute_agricultural_emissions
set_flag_targets = _engine.set_flag_targets
assess_land_degradation = _engine.assess_land_degradation
