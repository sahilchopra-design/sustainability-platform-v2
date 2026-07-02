"""ESG Data Quality & Coverage Engine (E34)
Implements: PCAF DQS-style scoring, BCBS 239 data governance,
provider divergence analysis (Bloomberg/MSCI/Sustainalytics),
ESG indicator coverage and quality scoring
"""

import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, date
import uuid

logger = logging.getLogger(__name__)

# ── Constants ─────────────────────────────────────────────────────────────────

ESG_PILLARS: Dict[str, List[Dict]] = {
    "E": [
        {"id": "E01", "name": "GHG Scope 1",               "unit": "tCO2e",       "material_sectors": ["energy", "manufacturing", "transport"]},
        {"id": "E02", "name": "GHG Scope 2 (location)",    "unit": "tCO2e",       "material_sectors": ["all"]},
        {"id": "E03", "name": "GHG Scope 2 (market)",      "unit": "tCO2e",       "material_sectors": ["all"]},
        {"id": "E04", "name": "GHG Scope 3 total",         "unit": "tCO2e",       "material_sectors": ["all"]},
        {"id": "E05", "name": "GHG Scope 3 Cat 1 (purchased goods)", "unit": "tCO2e", "material_sectors": ["retail", "manufacturing"]},
        {"id": "E06", "name": "GHG Scope 3 Cat 11 (use of sold products)", "unit": "tCO2e", "material_sectors": ["automotive", "technology"]},
        {"id": "E07", "name": "Energy consumption total",  "unit": "MWh",         "material_sectors": ["all"]},
        {"id": "E08", "name": "Renewable energy share",    "unit": "%",           "material_sectors": ["all"]},
        {"id": "E09", "name": "Energy intensity",          "unit": "MWh/revenue", "material_sectors": ["energy", "manufacturing"]},
        {"id": "E10", "name": "Water withdrawal total",    "unit": "m³",          "material_sectors": ["agriculture", "manufacturing", "energy"]},
        {"id": "E11", "name": "Water recycled",            "unit": "m³",          "material_sectors": ["agriculture", "manufacturing"]},
        {"id": "E12", "name": "Water intensity",           "unit": "m³/revenue",  "material_sectors": ["agriculture", "manufacturing"]},
        {"id": "E13", "name": "Waste generated",           "unit": "tonnes",      "material_sectors": ["manufacturing", "retail"]},
        {"id": "E14", "name": "Waste to landfill",         "unit": "tonnes",      "material_sectors": ["manufacturing"]},
        {"id": "E15", "name": "Hazardous waste",           "unit": "tonnes",      "material_sectors": ["chemicals", "manufacturing"]},
        {"id": "E16", "name": "Biodiversity — sites in/near protected areas", "unit": "sites", "material_sectors": ["mining", "agriculture"]},
        {"id": "E17", "name": "Land use change",           "unit": "ha",          "material_sectors": ["agriculture", "real_estate"]},
        {"id": "E18", "name": "NOx emissions",             "unit": "tonnes",      "material_sectors": ["energy", "transport"]},
        {"id": "E19", "name": "SOx emissions",             "unit": "tonnes",      "material_sectors": ["energy", "manufacturing"]},
        {"id": "E20", "name": "Particulate matter",        "unit": "tonnes",      "material_sectors": ["energy", "mining"]},
        {"id": "E21", "name": "VOC emissions",             "unit": "tonnes",      "material_sectors": ["chemicals", "manufacturing"]},
        {"id": "E22", "name": "Carbon price (internal)",   "unit": "USD/tCO2e",  "material_sectors": ["all"]},
        {"id": "E23", "name": "CAPEX — green/sustainable", "unit": "USD",         "material_sectors": ["all"]},
        {"id": "E24", "name": "EU Taxonomy aligned revenue %", "unit": "%",       "material_sectors": ["all"]},
        {"id": "E25", "name": "Physical risk — acute exposure", "unit": "score",  "material_sectors": ["real_estate", "agriculture"]},
        {"id": "E26", "name": "Physical risk — chronic exposure", "unit": "score","material_sectors": ["all"]},
        {"id": "E27", "name": "Transition risk — stranded asset value", "unit": "USD", "material_sectors": ["energy", "automotive"]},
        {"id": "E28", "name": "Carbon credits purchased",  "unit": "tCO2e",       "material_sectors": ["all"]},
        {"id": "E29", "name": "Plastic waste (primary)",   "unit": "tonnes",      "material_sectors": ["retail", "manufacturing"]},
        {"id": "E30", "name": "Refrigerant leakage (HFCs)","unit": "tCO2e",       "material_sectors": ["retail", "manufacturing"]},
    ],
    "S": [
        {"id": "S01", "name": "Total headcount",           "unit": "FTE",         "material_sectors": ["all"]},
        {"id": "S02", "name": "Gender ratio — women",      "unit": "%",           "material_sectors": ["all"]},
        {"id": "S03", "name": "Women in senior management","unit": "%",           "material_sectors": ["all"]},
        {"id": "S04", "name": "LTIFR (lost time injury)",  "unit": "per M hours", "material_sectors": ["manufacturing", "mining", "construction"]},
        {"id": "S05", "name": "Fatalities",                "unit": "count",       "material_sectors": ["manufacturing", "mining"]},
        {"id": "S06", "name": "Training hours per employee","unit": "hours/FTE",  "material_sectors": ["all"]},
        {"id": "S07", "name": "Employee turnover",         "unit": "%",           "material_sectors": ["all"]},
        {"id": "S08", "name": "Pay gap — gender",          "unit": "%",           "material_sectors": ["all"]},
        {"id": "S09", "name": "Pay gap — ethnicity",       "unit": "%",           "material_sectors": ["all"]},
        {"id": "S10", "name": "CEO pay ratio",             "unit": "x",           "material_sectors": ["all"]},
        {"id": "S11", "name": "Unionisation rate",         "unit": "%",           "material_sectors": ["manufacturing", "transport"]},
        {"id": "S12", "name": "Collective bargaining coverage","unit": "%",       "material_sectors": ["manufacturing"]},
        {"id": "S13", "name": "Human rights incidents",    "unit": "count",       "material_sectors": ["all"]},
        {"id": "S14", "name": "Supply chain audit coverage","unit": "%",          "material_sectors": ["retail", "manufacturing"]},
        {"id": "S15", "name": "Child/forced labour incidents","unit": "count",    "material_sectors": ["retail", "agriculture"]},
        {"id": "S16", "name": "Community investment",      "unit": "USD",         "material_sectors": ["mining", "energy"]},
        {"id": "S17", "name": "Customer data breaches",    "unit": "count",       "material_sectors": ["technology", "financial"]},
        {"id": "S18", "name": "Accessibility complaints",  "unit": "count",       "material_sectors": ["retail", "technology"]},
        {"id": "S19", "name": "Product recall rate",       "unit": "%",           "material_sectors": ["manufacturing", "retail"]},
        {"id": "S20", "name": "Responsible marketing violations","unit": "count", "material_sectors": ["retail", "financial"]},
        {"id": "S21", "name": "Modern slavery disclosures","unit": "binary",      "material_sectors": ["all"]},
        {"id": "S22", "name": "Just transition spend",     "unit": "USD",         "material_sectors": ["energy"]},
        {"id": "S23", "name": "Mental health programmes",  "unit": "binary",      "material_sectors": ["all"]},
        {"id": "S24", "name": "Disability inclusion rate", "unit": "%",           "material_sectors": ["all"]},
        {"id": "S25", "name": "Parental leave take-up",   "unit": "%",           "material_sectors": ["all"]},
    ],
    "G": [
        {"id": "G01", "name": "Board independence",        "unit": "%",           "material_sectors": ["all"]},
        {"id": "G02", "name": "Women on board",            "unit": "%",           "material_sectors": ["all"]},
        {"id": "G03", "name": "Audit committee independence","unit": "%",         "material_sectors": ["all"]},
        {"id": "G04", "name": "Executive pay — total CEO", "unit": "USD",         "material_sectors": ["all"]},
        {"id": "G05", "name": "ESG-linked executive pay",  "unit": "% of total",  "material_sectors": ["all"]},
        {"id": "G06", "name": "Board ESG expertise",       "unit": "members",     "material_sectors": ["all"]},
        {"id": "G07", "name": "Anti-bribery training coverage","unit": "%",       "material_sectors": ["all"]},
        {"id": "G08", "name": "Whistleblower cases",       "unit": "count",       "material_sectors": ["all"]},
        {"id": "G09", "name": "Anti-corruption incidents", "unit": "count",       "material_sectors": ["all"]},
        {"id": "G10", "name": "Tax transparency (CbCR)",   "unit": "binary",      "material_sectors": ["all"]},
        {"id": "G11", "name": "Shareholder engagement sessions","unit": "count",  "material_sectors": ["all"]},
        {"id": "G12", "name": "Board meeting attendance",  "unit": "%",           "material_sectors": ["all"]},
        {"id": "G13", "name": "Ownership concentration (top 3)","unit": "%",     "material_sectors": ["all"]},
        {"id": "G14", "name": "Dual-class share structure", "unit": "binary",     "material_sectors": ["all"]},
        {"id": "G15", "name": "Say-on-pay vote result",    "unit": "%",           "material_sectors": ["all"]},
        {"id": "G16", "name": "Supplier code of conduct",  "unit": "binary",      "material_sectors": ["all"]},
        {"id": "G17", "name": "Data privacy policy",       "unit": "binary",      "material_sectors": ["technology", "financial"]},
        {"id": "G18", "name": "Cybersecurity incidents",   "unit": "count",       "material_sectors": ["technology", "financial"]},
        {"id": "G19", "name": "Sustainability committee",  "unit": "binary",      "material_sectors": ["all"]},
        {"id": "G20", "name": "External assurance (limited)","unit": "binary",    "material_sectors": ["all"]},
    ],
}

DQS_LEVELS: Dict[int, str] = {
    1: "Reported third-party verified",
    2: "Reported unverified",
    3: "Estimated model (company-specific activity data)",
    4: "Proxy industry average",
    5: "Not available",
}

PROVIDER_DIVERGENCE_BENCHMARKS: Dict[str, Dict] = {
    "E": {
        "bloomberg_msci_correlation": 0.72,
        "bloomberg_sustainalytics_correlation": 0.68,
        "msci_sustainalytics_correlation": 0.65,
        "typical_divergence_pct": 25,
        "note": "Environmental data most divergent on Scope 3; best aligned on Scope 1",
    },
    "S": {
        "bloomberg_msci_correlation": 0.55,
        "bloomberg_sustainalytics_correlation": 0.50,
        "msci_sustainalytics_correlation": 0.62,
        "typical_divergence_pct": 40,
        "note": "Social data most divergent; governance-adjacent metrics better than community",
    },
    "G": {
        "bloomberg_msci_correlation": 0.78,
        "bloomberg_sustainalytics_correlation": 0.80,
        "msci_sustainalytics_correlation": 0.75,
        "typical_divergence_pct": 18,
        "note": "Governance best-aligned across providers; board composition most consistent",
    },
}

BCBS239_PRINCIPLES: List[Dict] = [
    {"id": 1,  "name": "Governance",              "weight": 0.12, "category": "Overarching"},
    {"id": 2,  "name": "Data architecture",        "weight": 0.10, "category": "Overarching"},
    {"id": 3,  "name": "Accuracy & integrity",     "weight": 0.10, "category": "Risk data aggregation"},
    {"id": 4,  "name": "Completeness",             "weight": 0.08, "category": "Risk data aggregation"},
    {"id": 5,  "name": "Timeliness",               "weight": 0.08, "category": "Risk data aggregation"},
    {"id": 6,  "name": "Adaptability",             "weight": 0.06, "category": "Risk data aggregation"},
    {"id": 7,  "name": "Accuracy (reporting)",     "weight": 0.08, "category": "Risk reporting"},
    {"id": 8,  "name": "Comprehensiveness",        "weight": 0.08, "category": "Risk reporting"},
    {"id": 9,  "name": "Clarity & usefulness",     "weight": 0.06, "category": "Risk reporting"},
    {"id": 10, "name": "Frequency",                "weight": 0.06, "category": "Risk reporting"},
    {"id": 11, "name": "Distribution",             "weight": 0.04, "category": "Risk reporting"},
    {"id": 12, "name": "Review by supervisors",    "weight": 0.06, "category": "Supervisory"},
    {"id": 13, "name": "Remedial actions",         "weight": 0.04, "category": "Supervisory"},
    {"id": 14, "name": "Home/host cooperation",    "weight": 0.04, "category": "Supervisory"},
]

ESTIMATION_METHODS: List[str] = [
    "direct_measurement",
    "supplier_data",
    "spend_based",
    "industry_average",
    "proxy",
    "modelled",
]

MATERIAL_INDICATOR_SETS: Dict[str, List[str]] = {
    "financial": ["E01", "E02", "E03", "E04", "E24", "S01", "S02", "S17", "G01", "G02", "G10", "G17"],
    "energy":    ["E01", "E02", "E03", "E04", "E07", "E08", "E09", "E18", "E19", "E27", "G05", "G19"],
    "manufacturing": ["E01", "E02", "E07", "E10", "E13", "E15", "E18", "S04", "S05", "S14", "G07", "G16"],
    "retail":    ["E01", "E04", "E05", "E13", "E29", "S14", "S15", "S19", "S20", "G16", "G17"],
    "technology": ["E01", "E02", "E03", "E07", "E08", "S17", "G17", "G18", "G01", "G04", "G05"],
}


# ── Engine ────────────────────────────────────────────────────────────────────

class ESGDataQualityEngine:
    """ESG Data Quality & Coverage Engine.

    Scores E/S/G pillar coverage and DQS quality, analyses provider divergence,
    and assesses BCBS 239 data governance compliance.
    """

    def __init__(self) -> None:
        pass

    def _dqs_weight(self, level: int) -> float:
        weights = {1: 1.0, 2: 0.8, 3: 0.5, 4: 0.3, 5: 0.0}
        return weights.get(level, 0.0)

    @staticmethod
    def _is_material(indicator: Dict, sector: Optional[str]) -> Optional[bool]:
        """Determine indicator materiality from the reference material_sectors map.

        Returns True/False when a sector is supplied (real lookup against
        ESG_PILLARS), or None (honest null) when no sector context is available —
        materiality is entity/sector-specific and cannot be inferred otherwise.
        """
        if not sector:
            return None
        mat = indicator.get("material_sectors", [])
        return ("all" in mat) or (sector in mat)

    # ── score_pillar ──────────────────────────────────────────────────────────

    def score_pillar(
        self,
        entity_id: str,
        pillar: str,
        indicators_data: Optional[Dict] = None,
        sector: Optional[str] = None,
    ) -> Dict:
        """Score a single ESG pillar (E/S/G) for coverage and quality.

        Coverage and quality are computed from ``indicators_data`` — a mapping of
        indicator_id -> {"value", "dqs_level", "method"}. An indicator is treated
        as reported only when a caller-supplied value is present; absent
        indicators are honestly "not reported" (no fabricated presence, DQS, or
        value). ``sector`` (optional) drives real materiality lookup against
        ESG_PILLARS.material_sectors; when omitted, ``material`` is None.
        """
        indicators = ESG_PILLARS.get(pillar, [])

        total = len(indicators)
        per_indicator = []
        reported_count = 0
        dqs_sum = 0.0
        estimated_count = 0
        dqs_level_sum = 0

        for ind in indicators:
            data = (indicators_data or {}).get(ind["id"], {})
            reported_value = data.get("value")
            has_value = reported_value is not None
            # DQS level: use caller-supplied value; else honest null (level 5 =
            # "Not available") only when the indicator is genuinely unreported.
            dqs = data.get("dqs_level")
            if dqs is None:
                dqs = 5 if not has_value else None
            method = data.get("method")  # honest null when not supplied
            value = reported_value if has_value else None

            if has_value:
                reported_count += 1
            if dqs in (3, 4):
                estimated_count += 1

            if has_value and dqs is not None:
                dqs_sum += self._dqs_weight(dqs)
                dqs_level_sum += dqs

            per_indicator.append({
                "indicator_id": ind["id"],
                "indicator_name": ind["name"],
                "unit": ind["unit"],
                "reported": has_value,
                "value": value,
                "dqs_level": dqs,
                "dqs_description": DQS_LEVELS.get(dqs, "Unknown") if dqs is not None else None,
                "estimation_method": method,
                "verified": dqs == 1,
                "material": self._is_material(ind, sector),
            })

        coverage_pct = round(reported_count / total * 100, 1) if total > 0 else 0
        estimated_pct = round(estimated_count / reported_count * 100, 1) if reported_count > 0 else 0
        pillar_score = round(coverage_pct * (dqs_sum / reported_count if reported_count > 0 else 0), 1)

        return {
            "pillar": pillar,
            "pillar_score": pillar_score,
            "coverage_pct": coverage_pct,
            "estimated_pct": estimated_pct,
            "reported_count": reported_count,
            "total_indicators": total,
            "verified_count": sum(1 for i in per_indicator if i["verified"]),
            "average_dqs": round(dqs_level_sum / reported_count, 2) if reported_count > 0 else None,
            "per_indicator": per_indicator,
        }

    # ── analyse_provider_divergence ───────────────────────────────────────────

    def analyse_provider_divergence(
        self,
        entity_id: str,
        bloomberg_data: Optional[Dict] = None,
        msci_data: Optional[Dict] = None,
        sustainalytics_data: Optional[Dict] = None,
    ) -> Dict:
        """Analyse ESG score divergence across data providers.

        Divergence (spread, average, outlier flags) is computed only from the
        provider score dicts actually supplied by the caller. When fewer than two
        providers are available, no divergence can be measured and metrics are
        returned as honest nulls with ``insufficient_data`` status — nothing is
        fabricated to stand in for a missing provider feed.
        """
        provider_inputs = {
            "bloomberg": bloomberg_data,
            "msci": msci_data,
            "sustainalytics": sustainalytics_data,
        }
        available = {name: d for name, d in provider_inputs.items() if d}

        pillar_divergence = {}
        outlier_flags = []
        for pillar in ["E", "S", "G", "overall"]:
            scores = [d.get(pillar) for d in available.values() if d.get(pillar) is not None]
            if len(scores) >= 2:
                spread = max(scores) - min(scores)
                avg = sum(scores) / len(scores)
                spread_r = round(spread, 1)
                avg_r = round(avg, 1)
                high_div = spread > 20
                if spread > 25:
                    outlier_flags.append(
                        f"High {pillar} pillar divergence ({spread:.1f} points) — review underlying data sources"
                    )
            else:
                spread_r = None
                avg_r = None
                high_div = None
            pillar_divergence[pillar] = {
                "bloomberg": (bloomberg_data or {}).get(pillar),
                "msci": (msci_data or {}).get(pillar),
                "sustainalytics": (sustainalytics_data or {}).get(pillar),
                "spread": spread_r,
                "average": avg_r,
                "high_divergence": high_div,
            }

        measured_spreads = [v["spread"] for v in pillar_divergence.values() if v["spread"] is not None]
        if measured_spreads:
            overall_divergence = round(sum(measured_spreads) / len(measured_spreads), 1)
            status = "measured"
        else:
            overall_divergence = None
            status = "insufficient_data"

        # Recommended primary provider: the one whose supplied scores diverge
        # least from the cross-provider average (real computation). None when
        # fewer than two providers are available.
        recommended_primary_provider = None
        if len(available) >= 2:
            pillar_avgs = {p: pillar_divergence[p]["average"] for p in ["E", "S", "G"]}
            best_name, best_dev = None, None
            for name, d in available.items():
                devs = [abs(d.get(p) - pillar_avgs[p])
                        for p in ["E", "S", "G"]
                        if d.get(p) is not None and pillar_avgs[p] is not None]
                if not devs:
                    continue
                mean_dev = sum(devs) / len(devs)
                if best_dev is None or mean_dev < best_dev:
                    best_name, best_dev = name, mean_dev
            recommended_primary_provider = best_name

        return {
            "entity_id": entity_id,
            "pillar_divergence": pillar_divergence,
            "overall_divergence_score": overall_divergence,
            "divergence_status": status,
            "providers_available": sorted(available.keys()),
            "outlier_flags": outlier_flags,
            "recommended_primary_provider": recommended_primary_provider,
            "benchmarks": PROVIDER_DIVERGENCE_BENCHMARKS,
            "assessed_at": datetime.utcnow().isoformat(),
        }

    # ── calculate_dqs_profile ─────────────────────────────────────────────────

    def calculate_dqs_profile(
        self,
        entity_id: str,
        indicators_with_sources: Optional[List[Dict]] = None,
    ) -> Dict:
        """Calculate PCAF-style DQS profile across all pillars.

        The profile is built solely from ``indicators_with_sources`` — a list of
        {"pillar", "dqs_level"} rows. Pillars with no supplied source rows yield
        a null breakdown (``insufficient_data``); no synthetic DQS distribution is
        fabricated. Improvement priorities are derived deterministically from
        which pillars actually score poorly, drawn from a fixed action library.
        """
        pillar_inds = indicators_with_sources or []

        # Recommended remediation actions per pillar (fixed reference library,
        # not entity metrics — selected deterministically by pillar DQS).
        pillar_actions = {
            "E": [
                "Obtain third-party verification for Scope 1 GHG data",
                "Replace industry proxy for Scope 3 Category 1 with supplier data",
                "Upgrade from spend-based to activity-based Scope 3 methodology",
                "Implement direct water metering at all production sites",
            ],
            "S": [
                "Engage top-20 suppliers for LTIFR and human rights data",
                "Extend supply chain audit coverage to tier-2 suppliers",
            ],
            "G": [
                "Commission independent board effectiveness review",
                "Obtain external limited assurance over governance disclosures",
            ],
        }

        dqs_breakdown = {}
        improvement_priorities: List[str] = []
        measured_scores = []
        for pillar in ["E", "S", "G"]:
            pillar_subset = [i for i in pillar_inds if i.get("pillar") == pillar]
            if not pillar_subset:
                # Honest null: no source data supplied for this pillar.
                dqs_breakdown[pillar] = {
                    "level_counts": None,
                    "weighted_dqs_score": None,
                    "status": "insufficient_data",
                }
                continue

            counts = {lvl: 0 for lvl in range(1, 6)}
            for ind in pillar_subset:
                lvl = ind.get("dqs_level")
                if lvl is None:
                    lvl = 5  # unreported source -> "Not available"
                counts[lvl] = counts.get(lvl, 0) + 1

            weighted = sum(self._dqs_weight(lvl) * cnt for lvl, cnt in counts.items())
            total_rep = sum(cnt for lvl, cnt in counts.items() if lvl < 5)
            # Mean quality fraction q in [0,1] (1 = best); map to PCAF 1-5 scale
            # where 1 = best and 5 = worst: dqs = 5 - 4*q.
            q = weighted / max(1, total_rep)
            pillar_score = round(5 - 4 * q, 2)
            measured_scores.append(pillar_score)
            dqs_breakdown[pillar] = {
                "level_counts": {DQS_LEVELS[k]: v for k, v in counts.items()},
                "weighted_dqs_score": pillar_score,
                "status": "measured",
            }
            # Prioritise remediation for pillars scoring worse than "Good".
            if pillar_score > 2.5:
                improvement_priorities.extend(pillar_actions.get(pillar, []))

        if measured_scores:
            overall_dqs = round(sum(measured_scores) / len(measured_scores), 2)
            dqs_tier = (
                "Good" if overall_dqs <= 2.5 else
                ("Acceptable" if overall_dqs <= 3.5 else "Needs improvement")
            )
            pcaf_compliant = overall_dqs <= 3.0
        else:
            # No pillar had source data — the profile is not computable.
            overall_dqs = None
            dqs_tier = "insufficient_data"
            pcaf_compliant = None

        return {
            "entity_id": entity_id,
            "dqs_breakdown": dqs_breakdown,
            "overall_weighted_dqs": overall_dqs,
            "dqs_tier": dqs_tier,
            "improvement_priorities": improvement_priorities,
            "pcaf_compliant": pcaf_compliant,
            "assessed_at": datetime.utcnow().isoformat(),
        }

    # ── assess_bcbs239_compliance ─────────────────────────────────────────────

    def assess_bcbs239_compliance(
        self,
        entity_id: str,
        data_governance_inputs: Optional[Dict] = None,
    ) -> Dict:
        """Assess BCBS 239 data governance compliance across 14 principles.

        Each principle is scored only from a caller-supplied
        ``data_governance_inputs["principle_<id>"]["score"]``. Principles with no
        supplied score are honestly marked ``not_assessed`` (score None) rather
        than assigned a random value. The weighted compliance score is computed
        over the assessed principles and re-normalised by their weight so a
        partial assessment is not silently understated; when nothing is supplied
        the score is a null with ``insufficient_data`` tier.
        """
        principle_scores = []
        total_weighted = 0.0
        assessed_weight = 0.0
        gaps = []

        for p in BCBS239_PRINCIPLES:
            inp = (data_governance_inputs or {}).get(f"principle_{p['id']}", {})
            score = inp.get("score")  # honest null when not supplied
            if score is None:
                status = "not_assessed"
            elif score >= 80:
                status = "compliant"
            elif score >= 50:
                status = "partial"
            else:
                status = "non_compliant"

            if status == "non_compliant":
                gaps.append(f"Principle {p['id']} ({p['name']}): score {score:.0f}% — remediation required")

            principle_scores.append({
                "principle_id": p["id"],
                "principle_name": p["name"],
                "category": p["category"],
                "weight": p["weight"],
                "score": score,
                "status": status,
            })
            if score is not None:
                total_weighted += score * p["weight"]
                assessed_weight += p["weight"]

        if assessed_weight > 0:
            # Re-normalise by assessed weight so an incomplete set of principles
            # is not scored as if the unscored ones were zero.
            bcbs239_score = round(total_weighted / assessed_weight, 1)
            compliance_tier = (
                "Fully compliant" if bcbs239_score >= 80 else
                ("Largely compliant" if bcbs239_score >= 65 else
                 ("Partially compliant" if bcbs239_score >= 50 else "Non-compliant"))
            )
        else:
            bcbs239_score = None
            compliance_tier = "insufficient_data"

        return {
            "entity_id": entity_id,
            "bcbs239_score": bcbs239_score,
            "compliance_tier": compliance_tier,
            "principle_scores": principle_scores,
            "gaps": gaps,
            "num_compliant": sum(1 for p in principle_scores if p["status"] == "compliant"),
            "num_partial": sum(1 for p in principle_scores if p["status"] == "partial"),
            "num_non_compliant": sum(1 for p in principle_scores if p["status"] == "non_compliant"),
            "num_not_assessed": sum(1 for p in principle_scores if p["status"] == "not_assessed"),
            "assessed_at": datetime.utcnow().isoformat(),
        }

    # ── run_full_report ───────────────────────────────────────────────────────

    def run_full_report(
        self,
        entity_id: str,
        entity_name: str,
        reporting_period: str,
        e_data: Optional[Dict] = None,
        s_data: Optional[Dict] = None,
        g_data: Optional[Dict] = None,
        **kwargs,
    ) -> Dict:
        """Run full ESG data quality assessment and return report dict.

        Optional keyword args (all backward-compatible, default absent):
          - ``sector``: drives real indicator materiality lookup.
          - ``data_governance_inputs``: per-principle BCBS 239 scores.
          - ``provider_scores``: mapping of provider name -> {"E","S","G","overall"}
            for real divergence analysis.
        Sections without supplied inputs return honest nulls rather than
        fabricated values.
        """
        report_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        sector = kwargs.get("sector")

        e_result = self.score_pillar(entity_id, "E", e_data, sector=sector)
        s_result = self.score_pillar(entity_id, "S", s_data, sector=sector)
        g_result = self.score_pillar(entity_id, "G", g_data, sector=sector)

        # Build DQS source rows from the reported indicators just scored, so the
        # DQS profile reflects real supplied data (not a fabricated distribution).
        dqs_sources = [
            {"pillar": p, "dqs_level": ind["dqs_level"]}
            for p, res in (("E", e_result), ("S", s_result), ("G", g_result))
            for ind in res["per_indicator"]
            if ind["reported"]
        ]
        dqs_profile = self.calculate_dqs_profile(entity_id, dqs_sources or None)
        bcbs = self.assess_bcbs239_compliance(entity_id, kwargs.get("data_governance_inputs"))
        provider_scores = kwargs.get("provider_scores") or {}
        divergence = self.analyse_provider_divergence(
            entity_id,
            bloomberg_data=provider_scores.get("bloomberg"),
            msci_data=provider_scores.get("msci"),
            sustainalytics_data=provider_scores.get("sustainalytics"),
        )

        total_indicators = (
            e_result["total_indicators"] +
            s_result["total_indicators"] +
            g_result["total_indicators"]
        )
        reported_total = (
            e_result["reported_count"] +
            s_result["reported_count"] +
            g_result["reported_count"]
        )
        overall_coverage = round(reported_total / total_indicators * 100, 1) if total_indicators > 0 else 0
        overall_score = round((e_result["pillar_score"] + s_result["pillar_score"] + g_result["pillar_score"]) / 3, 1)

        # Collect all per-indicator rows for DB storage
        all_indicators = (
            [{"pillar": "E", **i} for i in e_result["per_indicator"]] +
            [{"pillar": "S", **i} for i in s_result["per_indicator"]] +
            [{"pillar": "G", **i} for i in g_result["per_indicator"]]
        )

        return {
            "report_id": report_id,
            "entity_id": entity_id,
            "entity_name": entity_name,
            "reporting_period": reporting_period,
            "overall_esg_score": overall_score,
            "overall_coverage_pct": overall_coverage,
            "e_score": e_result["pillar_score"],
            "e_coverage_pct": e_result["coverage_pct"],
            "s_score": s_result["pillar_score"],
            "s_coverage_pct": s_result["coverage_pct"],
            "g_score": g_result["pillar_score"],
            "g_coverage_pct": g_result["coverage_pct"],
            "overall_dqs": dqs_profile["overall_weighted_dqs"],
            "dqs_tier": dqs_profile["dqs_tier"],
            "bcbs239_score": bcbs["bcbs239_score"],
            "bcbs239_tier": bcbs["compliance_tier"],
            "provider_divergence_score": divergence["overall_divergence_score"],
            "total_indicators": total_indicators,
            "reported_indicators": reported_total,
            "verified_indicators": sum(1 for i in all_indicators if i.get("verified")),
            # Detail sections
            "e_detail": e_result,
            "s_detail": s_result,
            "g_detail": g_result,
            "dqs_profile": dqs_profile,
            "bcbs239": bcbs,
            "provider_divergence": divergence,
            "all_indicators": all_indicators,
            "improvement_priorities": dqs_profile["improvement_priorities"],
            "created_at": now,
            "updated_at": now,
        }

    def get_reference_data(self) -> Dict:
        """Return all reference constants."""
        return {
            "pillars": ESG_PILLARS,
            "dqs_levels": DQS_LEVELS,
            "estimation_methods": ESTIMATION_METHODS,
            "bcbs239_principles": BCBS239_PRINCIPLES,
            "material_indicator_sets": MATERIAL_INDICATOR_SETS,
            "provider_divergence_benchmarks": PROVIDER_DIVERGENCE_BENCHMARKS,
        }
