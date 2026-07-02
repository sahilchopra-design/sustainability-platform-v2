"""
Scope 3 Categories Engine — E21
GHG Protocol Corporate Value Chain (Scope 3) Standard 2011
15 Categories, SBTi FLAG/Non-FLAG, 40% coverage rule, PCAF C15
"""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any, Optional


# ---------------------------------------------------------------------------
# Reference data
# ---------------------------------------------------------------------------

SCOPE3_CATEGORIES = {
    "C1":  {"name": "Purchased goods & services",         "stream": "upstream",   "typical_pct": 0.30},
    "C2":  {"name": "Capital goods",                       "stream": "upstream",   "typical_pct": 0.05},
    "C3":  {"name": "Fuel & energy-related activities",   "stream": "upstream",   "typical_pct": 0.03},
    "C4":  {"name": "Upstream transportation",            "stream": "upstream",   "typical_pct": 0.04},
    "C5":  {"name": "Waste in operations",                "stream": "upstream",   "typical_pct": 0.01},
    "C6":  {"name": "Business travel",                    "stream": "upstream",   "typical_pct": 0.02},
    "C7":  {"name": "Employee commuting",                 "stream": "upstream",   "typical_pct": 0.02},
    "C8":  {"name": "Upstream leased assets",             "stream": "upstream",   "typical_pct": 0.02},
    "C9":  {"name": "Downstream transportation",          "stream": "downstream", "typical_pct": 0.04},
    "C10": {"name": "Processing of sold products",        "stream": "downstream", "typical_pct": 0.06},
    "C11": {"name": "Use of sold products",               "stream": "downstream", "typical_pct": 0.25},
    "C12": {"name": "End-of-life treatment",              "stream": "downstream", "typical_pct": 0.03},
    "C13": {"name": "Downstream leased assets",           "stream": "downstream", "typical_pct": 0.02},
    "C14": {"name": "Franchises",                         "stream": "downstream", "typical_pct": 0.02},
    "C15": {"name": "Investments (PCAF)",                 "stream": "downstream", "typical_pct": 0.09},
}

CALCULATION_METHODS = {
    "spend_based":       {"dqs": 4, "description": "EEIO spend-based using supplier spend"},
    "average_data":      {"dqs": 3, "description": "Industry-average emission factors"},
    "supplier_specific": {"dqs": 1, "description": "Primary supplier-specific data"},
    "hybrid":            {"dqs": 2, "description": "Hybrid approach — mix of primary + secondary"},
    "pcaf_standard":     {"dqs": 2, "description": "PCAF attribution for investments (C15)"},
}

SBTI_SECTORS_FLAG = [
    "agriculture", "forestry", "land_use", "food_beverage",
    "consumer_goods_agri", "paper", "real_estate_agri",
]

COVERAGE_THRESHOLD = 0.40   # SBTi near-term: must cover >=40% of total scope 3


@dataclass
class CategoryResult:
    category_id: str = ""
    category_name: str = ""
    is_material: bool = False
    tco2e: Optional[float] = None          # None when no entity intensity/total supplied
    pct_of_total: float = 0.0              # published typical share (%) — benchmark default
    calculation_method: str = "average_data"
    dqs: int = 3
    data_gaps: list[str] = field(default_factory=list)


@dataclass
class PortfolioScope3:
    """C15 — PCAF attribution for investment portfolios."""
    total_attributed_tco2e: Optional[float] = None
    by_asset_class: dict[str, float] = field(default_factory=dict)
    pcaf_dqs_weighted: Optional[float] = None
    portfolio_temperature_score: Optional[float] = None


@dataclass
class Scope3Assessment:
    assessment_id: str = ""
    entity_id: str = ""
    entity_name: str = ""
    nace_code: str = ""
    revenue_bn: float = 0.0
    headcount: int = 0
    material_categories: list[str] = field(default_factory=list)
    flag_applicable: bool = False
    total_scope3_tco2e: Optional[float] = None   # None when no entity intensity/total supplied
    sbti_coverage_pct: float = 0.0
    meets_40pct_rule: bool = False
    category_results: list[CategoryResult] = field(default_factory=list)
    portfolio_scope3: PortfolioScope3 | None = None
    flag_split: dict[str, float] = field(default_factory=dict)
    weighted_avg_dqs: float = 0.0
    recommendations: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------

class Scope3CategoriesEngine:
    """GHG Protocol Scope 3 Category Engine with SBTi coverage verification."""

    def assess(
        self,
        entity_id: str,
        entity_name: str,
        nace_code: str,
        revenue_bn: float,
        headcount: int,
        sector_type: str = "non_flag",
        portfolio_aum_bn: float | None = None,
        # --- Optional entity data (backward-compatible; all default None) ---
        scope3_intensity_tco2e_per_eur_m: Optional[float] = None,
        total_scope3_tco2e: Optional[float] = None,
        category_shares: Optional[dict[str, float]] = None,
        category_methods: Optional[dict[str, str]] = None,
        flag_share: Optional[float] = None,
        portfolio_intensity_tco2e_per_eur_m: Optional[float] = None,
        portfolio_asset_class_shares: Optional[dict[str, float]] = None,
        portfolio_pcaf_dqs: Optional[float] = None,
        portfolio_temperature_score: Optional[float] = None,
    ) -> Scope3Assessment:
        result = Scope3Assessment(
            assessment_id=f"S3CAT-{entity_id[:8].upper()}-2024",
            entity_id=entity_id,
            entity_name=entity_name,
            nace_code=nace_code,
            revenue_bn=revenue_bn,
            headcount=headcount,
            flag_applicable=sector_type in SBTI_SECTORS_FLAG,
        )

        # Total Scope 3 (tCO2e). Real computation only when the caller supplies
        # a measured/screened total or an intensity; otherwise honest null.
        total: Optional[float] = None
        if total_scope3_tco2e is not None:
            total = float(total_scope3_tco2e)
        elif scope3_intensity_tco2e_per_eur_m is not None:
            # revenue_bn (EUR bn) * 1_000 = EUR M; * intensity (tCO2e/EUR M)
            total = revenue_bn * 1_000 * float(scope3_intensity_tco2e_per_eur_m)
        result.total_scope3_tco2e = round(total, 0) if total is not None else None
        if total is None:
            result.warnings.append(
                "No entity Scope 3 total or intensity supplied — per-category tCO2e "
                "reported as null; percentages reflect GHG Protocol typical shares only"
            )

        # Category results.
        # Share per category defaults to the published GHG Protocol typical share
        # (documented benchmark, NOT a random draw); caller may override per category.
        cat_results: list[CategoryResult] = []
        for cat_id, cat_meta in SCOPE3_CATEGORIES.items():
            fraction = cat_meta["typical_pct"]
            if category_shares is not None and cat_id in category_shares:
                fraction = float(category_shares[cat_id])
            tco2e = round(total * fraction, 0) if total is not None else None
            # Calculation method: documented default is average (industry) data for
            # screening; caller may specify the actual method used per category.
            method = "average_data"
            if category_methods is not None and category_methods.get(cat_id) in CALCULATION_METHODS:
                method = category_methods[cat_id]
            cr = CategoryResult(
                category_id=cat_id,
                category_name=cat_meta["name"],
                is_material=fraction > 0.05,
                tco2e=tco2e,
                pct_of_total=round(fraction * 100, 1),
                calculation_method=method,
                dqs=CALCULATION_METHODS[method]["dqs"],
            )
            if method in ("spend_based", "average_data"):
                cr.data_gaps.append("No primary supplier data — recommend supplier engagement programme")
            cat_results.append(cr)

        result.category_results = cat_results
        result.material_categories = [c.category_id for c in cat_results if c.is_material]

        # SBTi coverage (material cats as pct of total).
        # Use tCO2e when a total is known; otherwise fall back to the published
        # typical shares so the coverage check still reflects the benchmark boundary.
        if total is not None and total > 0:
            material_tco2e = sum(c.tco2e for c in cat_results if c.is_material and c.tco2e is not None)
            result.sbti_coverage_pct = round(material_tco2e / total * 100, 1)
        else:
            material_share = sum(c.pct_of_total for c in cat_results if c.is_material)
            result.sbti_coverage_pct = round(material_share, 1)
        result.meets_40pct_rule = result.sbti_coverage_pct >= (COVERAGE_THRESHOLD * 100)

        # Weighted DQS — weight by tCO2e when known, else by published share (equivalent
        # ranking when shares proxy for mass).
        if total is not None and total > 0:
            weights = [(c.tco2e or 0.0) for c in cat_results]
        else:
            weights = [c.pct_of_total for c in cat_results]
        total_w = sum(weights)
        result.weighted_avg_dqs = round(
            sum(w * c.dqs for w, c in zip(weights, cat_results)) / max(total_w, 1e-9), 2
        )

        # FLAG split (for FLAG-applicable sectors).
        # Real split only when the caller provides both a total and a FLAG share;
        # otherwise leave empty and flag the gap (no fabricated split).
        if result.flag_applicable:
            if total is not None and flag_share is not None:
                flag_pct = float(flag_share)
                result.flag_split = {
                    "flag_tco2e": round(total * flag_pct, 0),
                    "non_flag_tco2e": round(total * (1 - flag_pct), 0),
                    "flag_pct": round(flag_pct * 100, 1),
                }
            else:
                result.warnings.append(
                    "FLAG-applicable sector but no FLAG share / total supplied — "
                    "FLAG vs non-FLAG split not computed (insufficient_data)"
                )

        # C15 portfolio scope 3 (PCAF attribution).
        if portfolio_aum_bn and portfolio_aum_bn > 0:
            ps = PortfolioScope3()
            # Attributed emissions: real only when a portfolio carbon intensity is
            # supplied; otherwise null (no random intensity).
            if portfolio_intensity_tco2e_per_eur_m is not None:
                ps.total_attributed_tco2e = round(
                    portfolio_aum_bn * 1_000 * float(portfolio_intensity_tco2e_per_eur_m), 0
                )
                # Asset-class breakdown only from caller-supplied shares.
                if portfolio_asset_class_shares:
                    ps.by_asset_class = {
                        ac: round(ps.total_attributed_tco2e * float(share), 0)
                        for ac, share in portfolio_asset_class_shares.items()
                    }
            else:
                result.warnings.append(
                    "C15 portfolio present but no portfolio carbon intensity supplied — "
                    "attributed emissions reported as null (insufficient_data)"
                )
            # PCAF DQS and portfolio temperature score are entity metrics: pass through
            # when supplied, else honest null.
            ps.pcaf_dqs_weighted = (
                round(float(portfolio_pcaf_dqs), 2) if portfolio_pcaf_dqs is not None else None
            )
            ps.portfolio_temperature_score = (
                round(float(portfolio_temperature_score), 1)
                if portfolio_temperature_score is not None else None
            )
            result.portfolio_scope3 = ps

        # Recommendations
        if not result.meets_40pct_rule:
            result.warnings.append(
                f"SBTi 40% coverage rule not met: {result.sbti_coverage_pct}% covered"
            )
            result.recommendations.append("Expand boundary to include C1 or C11 to meet SBTi near-term coverage threshold")
        if result.weighted_avg_dqs > 3.5:
            result.recommendations.append("High average DQS — consider supplier-specific data collection to improve accuracy")
        if "C15" in result.material_categories and result.portfolio_scope3 is None:
            result.recommendations.append("C15 (Investments) is material — apply PCAF standard attribution methodology")

        return result

    def screen_materiality(
        self,
        nace_code: str,
        revenue_bn: float,
        sector_shares: Optional[dict[str, float]] = None,
    ) -> dict[str, Any]:
        """Quick materiality screen before full assessment.

        Uses the published GHG Protocol typical category shares (documented
        cross-sector benchmark) — deterministic, not a random draw. A caller may
        pass ``sector_shares`` (cat_id -> fractional share) to screen against
        sector-specific data instead of the generic benchmark.
        """
        material = {}
        for cat_id, cat_meta in SCOPE3_CATEGORIES.items():
            score = cat_meta["typical_pct"]
            if sector_shares is not None and cat_id in sector_shares:
                score = float(sector_shares[cat_id])
            material[cat_id] = {
                "name": cat_meta["name"],
                "likely_material": score > 0.06,
                "relative_significance": "high" if score > 0.15 else "medium" if score > 0.06 else "low",
            }
        return material

    def ref_categories(self) -> dict[str, Any]:
        return SCOPE3_CATEGORIES

    def ref_calculation_methods(self) -> dict[str, Any]:
        return CALCULATION_METHODS

    def ref_sbti_coverage_rule(self) -> dict[str, Any]:
        return {
            "threshold_pct": COVERAGE_THRESHOLD * 100,
            "description": "SBTi near-term Scope 3 target: cover >=40% of total Scope 3 by mass",
            "flag_note": "FLAG sectors must set separate forest, land, agriculture targets",
        }


_engine = Scope3CategoriesEngine()


def get_engine() -> Scope3CategoriesEngine:
    return _engine
