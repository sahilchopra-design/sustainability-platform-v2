"""
SFDR Product Periodic Reporting Engine — E22
RTS 2022/1288 Annex III (Art 8) + Annex V (Art 9)
Product-level PAI aggregation, sustainable investment verification,
taxonomy by objective, website disclosure completeness

Data-integrity note (remediation): this engine reports BINDING SFDR periodic
disclosures. Every returned metric is either a REAL computation from
caller-supplied inputs (PAI data from the entity-level PAI engine, taxonomy
alignment from the EU taxonomy engine, verification flags from holdings) or an
HONEST NULL when the required input is absent. No metric is drawn at random.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any, Optional


# ---------------------------------------------------------------------------
# Reference data — RTS mandatory PAI indicators
# ---------------------------------------------------------------------------

PAI_MANDATORY_INDICATORS = {
    "PAI-1":  {"name": "GHG Emissions",                       "unit": "tCO2eq/EUR M invested",  "threshold": None},
    "PAI-2":  {"name": "Carbon Footprint",                    "unit": "tCO2eq/EUR M invested",  "threshold": None},
    "PAI-3":  {"name": "GHG Intensity of Investee Companies", "unit": "tCO2eq/EUR M revenue",   "threshold": None},
    "PAI-4":  {"name": "Fossil Fuel Exposure",                "unit": "%",                      "threshold": 0.0},
    "PAI-5":  {"name": "Non-Renewable Energy Consumption",    "unit": "%",                      "threshold": None},
    "PAI-6":  {"name": "Energy Consumption Intensity",        "unit": "MWh/EUR M revenue",      "threshold": None},
    "PAI-7":  {"name": "Biodiversity Sensitive Areas",        "unit": "yes/no",                 "threshold": None},
    "PAI-8":  {"name": "Emissions to Water",                  "unit": "tonnes/EUR M invested",  "threshold": None},
    "PAI-9":  {"name": "Hazardous Waste Ratio",               "unit": "tonnes/EUR M invested",  "threshold": None},
    "PAI-10": {"name": "Violations of UNGC/OECD Principles",  "unit": "yes/no",                 "threshold": None},
    "PAI-11": {"name": "Lack of Processes for UNGC/OECD",     "unit": "%",                      "threshold": None},
    "PAI-12": {"name": "Unadjusted Gender Pay Gap",           "unit": "%",                      "threshold": None},
    "PAI-13": {"name": "Board Gender Diversity",              "unit": "%",                      "threshold": None},
    "PAI-14": {"name": "Exposure to Controversial Weapons",   "unit": "yes/no",                 "threshold": 0.0},
}

SFDR_ARTICLES = {
    "8": {
        "name": "Article 8 — Environmental/Social Characteristics",
        "mandatory_sections": [
            "summary", "no_significant_harm", "environmental_social_characteristics",
            "investment_strategy", "proportion_investments", "monitoring",
            "due_diligence", "engagement", "designated_index", "website_info",
        ],
        "pai_required": True,
    },
    "9": {
        "name": "Article 9 — Sustainable Investment Objective",
        "mandatory_sections": [
            "summary", "no_significant_harm", "sustainable_investment_objective",
            "investment_strategy", "proportion_investments", "monitoring",
            "due_diligence", "engagement", "attainment_of_objective", "website_info",
        ],
        "pai_required": True,
        "additional": ["benchmark_sustainability", "reference_benchmark"],
    },
}

SUSTAINABLE_INVESTMENT_CRITERIA = [
    "dnsh_verified",            # Do No Significant Harm — all 6 environmental objectives
    "social_good_contribution", # Contributes to social/environmental objective
    "governance_screening",     # Good governance (board diversity, remuneration, tax)
    "additionality",            # Beyond business-as-usual (optional under RTS)
]


@dataclass
class PAIResult:
    indicator_id: str = ""
    indicator_name: str = ""
    value: Optional[float] = None          # None => indicator not reported (insufficient data)
    unit: str = ""
    coverage_pct: Optional[float] = None   # None => no coverage information supplied
    benchmark_value: float | None = None
    vs_benchmark_delta: float | None = None
    data_source: str = "third_party"


@dataclass
class SustainableInvestmentVerification:
    product_id: str = ""
    sustainable_pct: Optional[float] = None
    dnsh_verified_pct: Optional[float] = None
    social_good_pct: Optional[float] = None
    governance_screened_pct: Optional[float] = None
    fails_criteria: list[str] = field(default_factory=list)
    verified_sustainable_pct: Optional[float] = None
    data_status: str = "ok"                 # "ok" | "insufficient_data"


@dataclass
class SFDRProductReport:
    report_id: str = ""
    product_id: str = ""
    product_name: str = ""
    sfdr_article: str = "8"
    reporting_period: str = ""
    sustainable_investment_pct: Optional[float] = None
    taxonomy_aligned_pct: Optional[float] = None
    benchmark_index: str = ""
    report_completeness_pct: Optional[float] = None
    section_gaps: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    pai_results: list[PAIResult] = field(default_factory=list)
    pai_coverage_pct: Optional[float] = None
    verification: SustainableInvestmentVerification = field(default_factory=SustainableInvestmentVerification)
    taxonomy_by_objective: dict[str, float] = field(default_factory=dict)
    website_disclosure_complete: Optional[bool] = None
    recommendations: list[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------

class SFDRProductReportingEngine:
    """SFDR Annex III/V periodic report generator and completeness checker."""

    def generate_report(
        self,
        product_id: str,
        product_name: str,
        sfdr_article: str,
        reporting_period: str,
        sections_completed: list[str] | None = None,
        benchmark_index: str = "",
        aum_mn: float = 100.0,
        # --- Real-data inputs (all optional, default None => honest null). ---
        # Per-indicator PAI measurements from the entity-level PAI engine, keyed
        # by indicator id (e.g. "PAI-1"). Each value may carry any of:
        #   {"value": <float|bool>, "coverage_pct": <float>, "benchmark_value": <float>}
        pai_data: dict[str, dict[str, Any]] | None = None,
        # Product sustainable-investment % (0-100). If omitted it is derived from
        # the verification inputs below where possible, else left null.
        sustainable_investment_pct: float | None = None,
        # Verification sub-metrics (0-100). Supplied by upstream DNSH / good-
        # governance screening; each is reported verbatim, no fabrication.
        dnsh_verified_pct: float | None = None,
        social_good_pct: float | None = None,
        governance_screened_pct: float | None = None,
        # EU-taxonomy alignment (0-100) + optional per-objective breakdown from
        # the taxonomy engine. Kept as-is; not synthesised.
        taxonomy_aligned_pct: float | None = None,
        taxonomy_by_objective: dict[str, float] | None = None,
        # Whether Art 10 website disclosures are complete (tri-state: None=unknown).
        website_disclosure_complete: bool | None = None,
    ) -> SFDRProductReport:
        report = SFDRProductReport(
            report_id=f"SFDR-{sfdr_article}-{product_id[:8].upper()}-{reporting_period}",
            product_id=product_id,
            product_name=product_name,
            sfdr_article=sfdr_article,
            reporting_period=reporting_period,
            benchmark_index=benchmark_index,
        )

        article_cfg = SFDR_ARTICLES.get(sfdr_article, SFDR_ARTICLES["8"])
        mandatory_secs = article_cfg["mandatory_sections"]

        # ---- Report completeness (real when the caller states which sections
        # were completed; if omitted we cannot know — report null, do not guess).
        if sections_completed is not None:
            submitted = sections_completed
            missing_secs = [s for s in mandatory_secs if s not in submitted]
            report.section_gaps = missing_secs
            report.report_completeness_pct = round(
                (len(mandatory_secs) - len(missing_secs)) / len(mandatory_secs) * 100, 1
            ) if mandatory_secs else None
        else:
            missing_secs = []
            report.section_gaps = []
            report.report_completeness_pct = None
            report.warnings.append(
                "Report completeness not assessed: no sections_completed input provided"
            )

        # ---- PAI indicators — real measurements only; absent ones stay null.
        pai_data = pai_data or {}
        pai_results: list[PAIResult] = []
        for ind_id, ind_meta in PAI_MANDATORY_INDICATORS.items():
            entry = pai_data.get(ind_id) or {}
            raw_val = entry.get("value")
            if raw_val is None:
                val: Optional[float] = None
            elif ind_meta["unit"] == "yes/no":
                val = float(bool(raw_val)) if isinstance(raw_val, bool) else round(float(raw_val), 2)
            else:
                val = round(float(raw_val), 2)

            cov = entry.get("coverage_pct")
            cov = round(float(cov), 1) if cov is not None else None

            bench = entry.get("benchmark_value")
            bench = round(float(bench), 2) if (bench is not None and benchmark_index) else None
            delta = round(val - bench, 2) if (val is not None and bench is not None) else None

            pai_results.append(PAIResult(
                indicator_id=ind_id,
                indicator_name=ind_meta["name"],
                value=val,
                unit=ind_meta["unit"],
                coverage_pct=cov,
                benchmark_value=bench,
                vs_benchmark_delta=delta,
            ))
        report.pai_results = pai_results
        covs = [p.coverage_pct for p in pai_results if p.coverage_pct is not None]
        report.pai_coverage_pct = round(sum(covs) / len(covs), 1) if covs else None
        if not covs:
            report.warnings.append("No PAI coverage data supplied — PAI section incomplete")

        # ---- Sustainable investment % (from caller, or leave null).
        si_pct = round(sustainable_investment_pct, 1) if sustainable_investment_pct is not None else None
        report.sustainable_investment_pct = si_pct

        # ---- Verification — echo supplied sub-metrics; verified % = min of the
        # provided components (RTS: an investment must clear DNSH + positive
        # contribution + good governance). No component is invented.
        verif = SustainableInvestmentVerification(product_id=product_id)
        verif.sustainable_pct = si_pct
        verif.dnsh_verified_pct = round(dnsh_verified_pct, 1) if dnsh_verified_pct is not None else None
        verif.social_good_pct = round(social_good_pct, 1) if social_good_pct is not None else None
        verif.governance_screened_pct = round(governance_screened_pct, 1) if governance_screened_pct is not None else None
        components = [
            c for c in (verif.dnsh_verified_pct, verif.social_good_pct, verif.governance_screened_pct)
            if c is not None
        ]
        verif.verified_sustainable_pct = round(min(components), 1) if components else None
        if not components:
            verif.data_status = "insufficient_data"
        if (verif.dnsh_verified_pct is not None and si_pct is not None
                and verif.dnsh_verified_pct < si_pct * 0.80):
            verif.fails_criteria.append("dnsh_gap")
        report.verification = verif

        # ---- Taxonomy alignment (from taxonomy engine; else null).
        report.taxonomy_aligned_pct = round(taxonomy_aligned_pct, 1) if taxonomy_aligned_pct is not None else None
        if taxonomy_by_objective:
            report.taxonomy_by_objective = {
                str(k): round(float(v), 1) for k, v in taxonomy_by_objective.items()
            }
        else:
            report.taxonomy_by_objective = {}

        # ---- Website disclosure completeness (tri-state; unknown stays None).
        report.website_disclosure_complete = website_disclosure_complete

        # ---- Warnings & recommendations (all null-guarded).
        if missing_secs:
            report.warnings.append(f"Missing {len(missing_secs)} mandatory report sections")
        if report.pai_coverage_pct is not None and report.pai_coverage_pct < 75:
            report.warnings.append(f"PAI data coverage {report.pai_coverage_pct}% below recommended 75%")
        if (sfdr_article == "9" and verif.verified_sustainable_pct is not None
                and verif.verified_sustainable_pct < 50):
            report.recommendations.append("Art 9 fund: verified sustainable investment % is low — review DNSH assessment process")
        if report.website_disclosure_complete is False:
            report.recommendations.append("Complete pre-contractual website disclosures per Art 10 RTS requirement")

        return report

    def verify_sustainable_investment(
        self, product_id: str, holdings: list[dict[str, Any]]
    ) -> SustainableInvestmentVerification:
        """Aggregate sustainable-investment qualification from real holdings.

        Each holding may carry:
          weight            weighting for value-weighted aggregation (default 1.0)
          is_sustainable    bool — holding qualifies as a sustainable investment
          dnsh_verified     bool — passes Do-No-Significant-Harm on all 6 objectives
          social_good       bool — makes a positive social/environmental contribution
          governance_screened bool — passes good-governance screening

        Percentages are exposure-weighted shares of the portfolio. If no
        holdings (or none of the flags) are supplied, the corresponding metric
        is returned as an honest null with data_status="insufficient_data".
        """
        verif = SustainableInvestmentVerification(product_id=product_id)
        if not holdings:
            verif.data_status = "insufficient_data"
            return verif

        def _w(h: dict[str, Any]) -> float:
            try:
                w = float(h.get("weight", 1.0))
            except (TypeError, ValueError):
                w = 1.0
            return w if w > 0 else 0.0

        total_w = sum(_w(h) for h in holdings)
        if total_w <= 0:
            verif.data_status = "insufficient_data"
            return verif

        def _weighted_share(flag: str) -> Optional[float]:
            # Only aggregate over holdings that actually report the flag; if none
            # do, the metric is unknown (null) rather than 0.
            present = [h for h in holdings if flag in h]
            if not present:
                return None
            num = sum(_w(h) for h in present if bool(h.get(flag)))
            return round(num / total_w * 100, 1)

        verif.sustainable_pct = _weighted_share("is_sustainable")
        verif.dnsh_verified_pct = _weighted_share("dnsh_verified")
        verif.social_good_pct = _weighted_share("social_good")
        verif.governance_screened_pct = _weighted_share("governance_screened")

        components = [
            c for c in (verif.dnsh_verified_pct, verif.social_good_pct, verif.governance_screened_pct)
            if c is not None
        ]
        verif.verified_sustainable_pct = round(min(components), 1) if components else None
        if (verif.sustainable_pct is None and not components):
            verif.data_status = "insufficient_data"
        return verif

    def ref_pai_indicators(self) -> dict[str, Any]:
        return PAI_MANDATORY_INDICATORS

    def ref_sfdr_articles(self) -> dict[str, Any]:
        return SFDR_ARTICLES

    def ref_sustainable_investment_criteria(self) -> list[str]:
        return SUSTAINABLE_INVESTMENT_CRITERIA


_engine = SFDRProductReportingEngine()


def get_engine() -> SFDRProductReportingEngine:
    return _engine
