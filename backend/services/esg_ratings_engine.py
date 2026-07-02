"""
E57: ESG Ratings Reform & Divergence Engine

Standards: EU ESG Ratings Regulation 2024/3005 (ESRA) · IOSCO ESG Ratings Guidance ·
MIT/ECGI divergence research · MIT Florian Berg divergence taxonomy ·
SASB/MSCI methodology transparency
"""

import math
import statistics
from typing import Optional


# ---------------------------------------------------------------------------
# Reference data
# ---------------------------------------------------------------------------

ESRA_REQUIREMENTS = [
    {"id": "R01", "category": "governance", "requirement": "Separation of ancillary services from ratings", "weight": 0.15},
    {"id": "R02", "category": "methodology", "requirement": "Methodology publication and transparency", "weight": 0.15},
    {"id": "R03", "category": "data_sources", "requirement": "Data source disclosure", "weight": 0.10},
    {"id": "R04", "category": "conflict_of_interest", "requirement": "Conflict of interest management policy", "weight": 0.15},
    {"id": "R05", "category": "complaint_handling", "requirement": "Complaint handling procedure", "weight": 0.10},
    {"id": "R06", "category": "transparency", "requirement": "Periodic transparency reporting", "weight": 0.15},
    {"id": "R07", "category": "regulatory", "requirement": "ESMA supervisory registration/authorisation", "weight": 0.15},
    {"id": "R08", "category": "reporting", "requirement": "Annual reporting to ESMA on rated entities", "weight": 0.05},
]

PROVIDER_SCALE_NORMALISATION = {
    "msci": {"min": 0, "max": 100, "direction": "higher_better"},
    "sustainalytics": {"min": 0, "max": 50, "direction": "lower_better"},  # risk score
    "sp": {"min": 0, "max": 100, "direction": "higher_better"},
    "bloomberg": {"min": 0, "max": 100, "direction": "higher_better"},
    "refinitiv": {"min": 0, "max": 100, "direction": "higher_better"},
    "iss": {"min": 1, "max": 10, "direction": "higher_better"},
    "cdp": {"min": 0, "max": 100, "direction": "higher_better"},
}

COMPOSITE_RATING_THRESHOLDS = [
    (85, "AAA"), (75, "AA"), (65, "A"), (55, "BBB"),
    (45, "BB"), (35, "B"), (0, "CCC"),
]

SECTOR_PEER_DISTRIBUTION = {
    "oil_gas": {"mean": 45, "std": 18},
    "utilities": {"mean": 52, "std": 16},
    "mining": {"mean": 42, "std": 20},
    "finance": {"mean": 60, "std": 15},
    "technology": {"mean": 65, "std": 14},
    "healthcare": {"mean": 58, "std": 16},
    "retail": {"mean": 55, "std": 17},
    "manufacturing": {"mean": 48, "std": 18},
    "real_estate": {"mean": 54, "std": 15},
    "agriculture": {"mean": 40, "std": 19},
    "other": {"mean": 52, "std": 17},
}

E_PILLAR_SUBPILLARS = ["carbon_E1", "water_E2", "biodiversity_E3", "waste_E4", "energy_E5"]

SIZE_BIAS_ADJUSTMENTS = {"large": -3.0, "mid": 0.0, "small": +4.0, "micro": +7.0}
REGION_BIAS_ADJUSTMENTS = {"western_europe": -2.0, "north_america": -1.5, "asia_pacific": +2.5, "emerging_markets": +5.0, "other": +3.0}
SECTOR_BIAS_ADJUSTMENTS = {"services": -3.0, "manufacturing": +2.5, "extractives": +4.0, "finance": -1.0, "technology": -2.5, "other": 0.0}


# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------

def _clamp(val: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, val))


def _round(val: float, digits: int = 2) -> float:
    return round(val, digits)


def _normalise_score(provider: str, raw_score: float) -> float:
    """Normalise provider score to 0-100 scale (higher = better)."""
    cfg = PROVIDER_SCALE_NORMALISATION.get(provider, {"min": 0, "max": 100, "direction": "higher_better"})
    lo, hi = cfg["min"], cfg["max"]
    if hi == lo:
        return 50.0
    norm = (raw_score - lo) / (hi - lo) * 100
    if cfg["direction"] == "lower_better":
        norm = 100 - norm
    return _clamp(norm)


def _composite_rating(score: float) -> str:
    for threshold, rating in COMPOSITE_RATING_THRESHOLDS:
        if score >= threshold:
            return rating
    return "CCC"


# ---------------------------------------------------------------------------
# Method 1: ESRA Compliance
# ---------------------------------------------------------------------------

def assess_esra_compliance(
    entity_id: str,
    provider_name: str,
    methodology_published: bool,
    conflict_mgmt: bool,
    regulatory_supervised: bool,
    requirement_status: Optional[dict] = None,
) -> dict:
    # Each of the 8 ESRA requirements is a documented attestation about the
    # rating provider. R02/R04/R07 derive directly from the three headline
    # attestation inputs. R01/R03/R05/R06/R08 are only assessable from explicit
    # evidence supplied by the caller via `requirement_status` (mapping of
    # requirement id -> bool). Absent that evidence a requirement is treated as
    # not-yet-attested (not met) and surfaced in `requirements_unverified` — we
    # never fabricate a compliance attestation.
    supplied = requirement_status or {}

    def _attested(req_id: str, derived: Optional[bool]) -> Optional[bool]:
        # Explicit caller evidence wins; otherwise fall back to the derived
        # value (for gated requirements) or None (genuinely unknown).
        if req_id in supplied:
            return bool(supplied[req_id])
        return derived

    # Derived values: gated requirements can be no better than their gate.
    # A gate that is False makes the sub-requirement False (real logical
    # consequence); a gate that is True leaves it unknown (None) unless the
    # caller attests to it explicitly.
    req_status = {
        "R01": _attested("R01", None),  # ancillary separation — structural, needs evidence
        "R02": methodology_published,
        "R03": _attested("R03", False if not methodology_published else None),
        "R04": conflict_mgmt,
        "R05": _attested("R05", False if not conflict_mgmt else None),
        "R06": _attested("R06", False if not methodology_published else None),
        "R07": regulatory_supervised,
        "R08": _attested("R08", False if not regulatory_supervised else None),
    }

    requirements_met = []
    requirements_failed = []
    requirements_unverified = []
    weighted_score = 0.0
    assessable_weight = 0.0

    for req in ESRA_REQUIREMENTS:
        met = req_status.get(req["id"], None)
        if met is None:
            requirements_unverified.append(f"{req['id']}: {req['requirement']}")
            continue
        assessable_weight += req["weight"]
        if met:
            requirements_met.append(f"{req['id']}: {req['requirement']}")
            weighted_score += req["weight"] * 100
        else:
            requirements_failed.append(f"{req['id']}: {req['requirement']}")

    # Score is expressed over the assessable (evidenced) weight only, so
    # unverified requirements neither inflate nor deflate the result.
    compliance_score = _round(weighted_score / assessable_weight, 1) if assessable_weight > 0 else None

    if compliance_score is None:
        esra_grade = "insufficient_data — no assessable requirements evidenced"
    elif compliance_score >= 85:
        esra_grade = "A — Authorisation eligible"
    elif compliance_score >= 70:
        esra_grade = "B — Remediation required"
    elif compliance_score >= 50:
        esra_grade = "C — Significant gaps"
    else:
        esra_grade = "D — Non-compliant"

    authorisation_eligible = (
        compliance_score is not None and compliance_score >= 80 and regulatory_supervised
    )

    timeline_compliance = {
        "ESRA_entry_into_force": "2024-07-02",
        "authorisation_deadline": "2025-07-02",
        "full_compliance_required": "2026-01-01",
        "current_status": esra_grade,
        "months_to_deadline": (
            max(0, _round((2025 - 2024) * 12 * (1 - compliance_score / 100), 0))
            if compliance_score is not None else None
        ),
    }

    return {
        "provider_name": provider_name,
        "requirements_met": requirements_met,
        "requirements_failed": requirements_failed,
        "requirements_unverified": requirements_unverified,
        "compliance_score": compliance_score,
        "esra_grade": esra_grade,
        "authorisation_eligible": authorisation_eligible,
        "timeline_compliance": timeline_compliance,
        "remediation_priority": requirements_failed[:3],
    }


# ---------------------------------------------------------------------------
# Method 2: Rating Divergence Analysis
# ---------------------------------------------------------------------------

def analyse_rating_divergence(
    entity_id: str,
    ratings: dict,
    provider_correlations: Optional[dict] = None,
) -> dict:
    normalised = {}
    missing_scores = []
    for provider, data in ratings.items():
        raw = data.get("score")
        if raw is None:
            # No fabricated fallback: a provider that supplied no score is
            # excluded from the divergence set and surfaced honestly.
            missing_scores.append(provider)
            continue
        normalised[provider] = _round(_normalise_score(provider, raw), 1)

    scores = list(normalised.values())
    if len(scores) < 2:
        divergence_score = 0.0
    else:
        divergence_score = _round(statistics.stdev(scores), 2)

    # Berg et al. 2022 divergence decomposition
    scope_share = 0.56
    weight_share = 0.23
    measurement_share = 0.21
    divergence_sources = {
        "scope_56pct": _round(divergence_score * scope_share, 2),
        "weight_23pct": _round(divergence_score * weight_share, 2),
        "measurement_21pct": _round(divergence_score * measurement_share, 2),
    }

    # Correlation matrix. A genuine pairwise correlation between two providers
    # requires a cross-sectional panel of ratings across many entities; it
    # cannot be inferred from a single entity's snapshot. If the caller supplies
    # such panel correlations via `provider_correlations` ({p1: {p2: rho}}), we
    # use them; otherwise every off-diagonal cell is an honest None.
    supplied_corr = provider_correlations or {}
    providers = list(normalised.keys())
    correlation_matrix = {}
    correlation_data_available = bool(supplied_corr)
    for i, p1 in enumerate(providers):
        correlation_matrix[p1] = {}
        for j, p2 in enumerate(providers):
            if i == j:
                correlation_matrix[p1][p2] = 1.0
            else:
                rho = supplied_corr.get(p1, {}).get(p2)
                if rho is None:
                    rho = supplied_corr.get(p2, {}).get(p1)
                correlation_matrix[p1][p2] = (
                    _round(_clamp(rho, -1, 1), 3) if rho is not None else None
                )

    avg_score = statistics.mean(scores) if scores else 50.0
    consensus_rating = _composite_rating(avg_score)

    ci_half_width = 1.96 * (divergence_score / math.sqrt(len(scores))) if scores else 10.0
    confidence_interval = {
        "lower": _round(max(0, avg_score - ci_half_width), 1),
        "upper": _round(min(100, avg_score + ci_half_width), 1),
        "confidence_level": "95%",
    }

    return {
        "normalised_scores": normalised,
        "divergence_score": divergence_score,
        "divergence_sources": divergence_sources,
        "correlation_matrix": correlation_matrix,
        "correlation_data_available": correlation_data_available,
        "consensus_rating": consensus_rating,
        "average_normalised_score": _round(avg_score, 1),
        "confidence_interval": confidence_interval,
        "missing_scores": missing_scores,
    }


# ---------------------------------------------------------------------------
# Method 3: Rating Bias Detection
# ---------------------------------------------------------------------------

def detect_rating_bias(
    entity_id: str,
    scores: dict,
    entity_size: str,
    region: str,
    sector: str,
    reporting_bias_adjustment: Optional[float] = None,
    peer_stats: Optional[dict] = None,
) -> dict:
    normalised = {p: _round(_normalise_score(p, v), 1) for p, v in scores.items()}
    raw_composite = _round(statistics.mean(normalised.values()) if normalised else 50.0, 1)

    biases_detected = []
    total_adjustment = 0.0

    # Size bias
    size_adj = SIZE_BIAS_ADJUSTMENTS.get(entity_size.lower(), 0.0)
    if abs(size_adj) > 2:
        biases_detected.append({
            "bias_type": "size_bias",
            "description": f"{'Large' if size_adj < 0 else 'Small'} company reporting quality proxy inflates score",
            "adjustment": _round(size_adj, 1),
            "source": "Berg et al. 2022; ECGI working paper 2023",
        })
        total_adjustment += size_adj

    # Geography bias
    region_adj = REGION_BIAS_ADJUSTMENTS.get(region.lower(), 0.0)
    if abs(region_adj) > 2:
        biases_detected.append({
            "bias_type": "geography_bias",
            "description": f"{'Western' if region_adj < 0 else 'Non-western'} disclosure standards affect score",
            "adjustment": _round(region_adj, 1),
            "source": "IOSCO ESG Ratings Guidance 2021",
        })
        total_adjustment += region_adj

    # Sector bias
    sector_adj = SECTOR_BIAS_ADJUSTMENTS.get(sector.lower(), 0.0)
    if abs(sector_adj) > 1:
        biases_detected.append({
            "bias_type": "sector_bias",
            "description": f"{'Services vs' if sector_adj < 0 else 'Manufacturing/extractives'} sector scoring asymmetry",
            "adjustment": _round(sector_adj, 1),
            "source": "Kotsantonis & Serafeim (2019)",
        })
        total_adjustment += sector_adj

    # Voluntary disclosure inflation. This is a documented MODEL calibration
    # (not an entity measurement): Berg, Kolbel & Rigobon (2022) find voluntary
    # disclosure systematically inflates ESG scores vs independently verified
    # data. We apply the central point estimate of the published -4.0..-1.0
    # range (-2.5) as a fixed calibration constant; callers with an entity-
    # specific verified-vs-disclosed delta may override via
    # `reporting_bias_adjustment`.
    REPORTING_BIAS_MODEL_CONSTANT = -2.5  # midpoint of Berg et al. (2022) -4.0..-1.0 range
    report_adj = (
        float(reporting_bias_adjustment)
        if reporting_bias_adjustment is not None
        else REPORTING_BIAS_MODEL_CONSTANT
    )
    biases_detected.append({
        "bias_type": "reporting_bias",
        "description": "Voluntary disclosure inflates scores vs independently verified data",
        "adjustment": _round(report_adj, 1),
        "adjustment_basis": (
            "entity_supplied" if reporting_bias_adjustment is not None
            else "model_calibration_constant"
        ),
        "source": "Berg, Kolbel & Rigobon (2022), JFE",
    })
    total_adjustment += report_adj

    bias_adjusted_score = _round(_clamp(raw_composite + total_adjustment), 1)
    adjustment_magnitude = _round(abs(total_adjustment), 1)

    # Peer comparison figures (sector averages, entity percentiles) are real
    # measurable quantities that require an actual peer panel. They cannot be
    # inferred from a single entity's scores, so we surface caller-supplied
    # values when present (`peer_stats`) and honest None otherwise.
    ps = peer_stats or {}
    peer_comparison = {
        "sector": sector,
        "sector_avg_raw": (
            _round(float(ps["sector_avg_raw"]), 1) if ps.get("sector_avg_raw") is not None else None
        ),
        "sector_avg_bias_adjusted": (
            _round(float(ps["sector_avg_bias_adjusted"]), 1)
            if ps.get("sector_avg_bias_adjusted") is not None else None
        ),
        "entity_percentile_raw": (
            _round(float(ps["entity_percentile_raw"]), 1)
            if ps.get("entity_percentile_raw") is not None else None
        ),
        "entity_percentile_adjusted": (
            _round(float(ps["entity_percentile_adjusted"]), 1)
            if ps.get("entity_percentile_adjusted") is not None else None
        ),
        "data_available": bool(ps),
    }

    return {
        "raw_composite": raw_composite,
        "biases_detected": biases_detected,
        "bias_adjusted_score": bias_adjusted_score,
        "adjustment_magnitude": adjustment_magnitude,
        "peer_comparison": peer_comparison,
        "normalised_scores": normalised,
    }


# ---------------------------------------------------------------------------
# Method 4: Composite Rating
# ---------------------------------------------------------------------------

def compute_composite_rating(
    entity_id: str,
    provider_scores: dict,
    methodology: str = "equal_weight",
    provider_market_weights: Optional[dict] = None,
) -> dict:
    normalised = {p: _round(_normalise_score(p, v), 1) for p, v in provider_scores.items()}
    providers = list(normalised.keys())
    n = len(providers)
    weighting_note = None

    if methodology == "equal_weight":
        weights = {p: _round(1.0 / n, 4) for p in providers} if n else {}
    elif methodology == "market_cap_weight":
        # Market-cap weights reflect each provider's market share/AUM — an
        # external fact, not something derivable here. Use caller-supplied
        # weights when provided; otherwise fall back to equal weight and say so
        # rather than fabricating a market-share distribution.
        supplied_w = provider_market_weights or {}
        usable = {p: float(supplied_w[p]) for p in providers if supplied_w.get(p) is not None}
        total = sum(usable.values())
        if usable and total > 0 and len(usable) == n:
            weights = {p: _round(usable[p] / total, 4) for p in providers}
        else:
            weights = {p: _round(1.0 / n, 4) for p in providers} if n else {}
            weighting_note = (
                "market_cap_weight requested but no complete provider_market_weights "
                "supplied; defaulted to equal_weight"
            )
    elif methodology == "specialisation_weight":
        # MSCI for governance, Sustainalytics for risk, others equal
        spec = {"msci": 0.30, "sustainalytics": 0.30}
        remaining = 1.0 - sum(spec.get(p, 0) for p in providers if p in spec)
        non_spec = [p for p in providers if p not in spec]
        each = remaining / len(non_spec) if non_spec else 0
        weights = {p: _round(spec.get(p, each), 4) for p in providers}
    else:
        weights = {p: _round(1.0 / n, 4) for p in providers} if n else {}

    composite_score = sum(weights.get(p, 0) * normalised[p] for p in providers)
    composite_score = _round(composite_score, 1)
    rating = _composite_rating(composite_score)

    # Sensitivity: recompute under equal_weight and market_cap to show sensitivity
    eq_score = _round(statistics.mean(normalised.values()) if normalised else 0, 1)
    sensitivity_analysis = {
        "equal_weight": eq_score,
        "equal_weight_rating": _composite_rating(eq_score),
        "selected_methodology": composite_score,
        "selected_rating": rating,
        "score_range": [_round(min(normalised.values()), 1) if normalised else 0,
                        _round(max(normalised.values()), 1) if normalised else 0],
    }

    return {
        "composite_score": composite_score,
        "composite_rating": rating,
        "methodology_used": methodology,
        "provider_weights": weights,
        "normalised_scores": normalised,
        "sensitivity_analysis": sensitivity_analysis,
        "weighting_note": weighting_note,
    }


# ---------------------------------------------------------------------------
# Method 5: E Pillar Divergence
# ---------------------------------------------------------------------------

def assess_e_pillar_divergence(entity_id: str, scores_by_pillar: dict) -> dict:
    pillar_divergence = {}
    data_gaps = []

    for pillar in E_PILLAR_SUBPILLARS:
        if pillar in scores_by_pillar and scores_by_pillar[pillar]:
            sub = scores_by_pillar[pillar]
            normalised_sub = {p: _round(_normalise_score(p, v), 1) for p, v in sub.items()}
            vals = list(normalised_sub.values())
            div = _round(statistics.stdev(vals), 2) if len(vals) >= 2 else 0.0
            pillar_divergence[pillar] = {
                "divergence": div,
                "scores": normalised_sub,
                "avg": _round(statistics.mean(vals), 1) if vals else 0.0,
            }
        else:
            # No provider scores for this sub-pillar: divergence and average are
            # genuinely unknown. Emit honest nulls rather than a fabricated draw.
            pillar_divergence[pillar] = {
                "divergence": None,
                "scores": {},
                "avg": None,
            }
            data_gaps.append(f"{pillar}: no provider scores supplied")

    # Rank only over pillars that actually have a computed divergence; nulls are
    # excluded so comparisons never raise and rankings are not driven by
    # fabricated values.
    ranked = [k for k in pillar_divergence if pillar_divergence[k]["divergence"] is not None]
    if ranked:
        most_divergent = max(ranked, key=lambda k: pillar_divergence[k]["divergence"])
        least_divergent = min(ranked, key=lambda k: pillar_divergence[k]["divergence"])
    else:
        most_divergent = None
        least_divergent = None

    improvement_priorities = sorted(
        ranked,
        key=lambda k: pillar_divergence[k]["divergence"],
        reverse=True,
    )[:3]

    return {
        "pillar_divergence": pillar_divergence,
        "most_divergent": most_divergent,
        "least_divergent": least_divergent,
        "data_gaps": data_gaps,
        "improvement_priorities": improvement_priorities,
    }


# ---------------------------------------------------------------------------
# Method 6: Peer Benchmark
# ---------------------------------------------------------------------------

def benchmark_against_peers(
    entity_id: str,
    sector: str,
    composite_score: float,
    n_peers: int = 20,
    peer_scores: Optional[list] = None,
) -> dict:
    # Percentile rank, sector median/p75/leader and the gaps are all real
    # measurable quantities — but they require an actual panel of peer composite
    # scores. We compute them genuinely from a caller-supplied `peer_scores`
    # list; without it every peer-derived metric is an honest None (no
    # synthetic distribution is fabricated).
    entity_score = _round(_clamp(composite_score), 1)

    clean_peers = None
    if peer_scores:
        clean_peers = sorted(
            _round(_clamp(float(s)), 1) for s in peer_scores if s is not None
        )
        if not clean_peers:
            clean_peers = None

    improvement_roadmap = []

    if clean_peers is None:
        result = {
            "percentile_rank": None,
            "sector": sector,
            "sector_median": None,
            "sector_p75": None,
            "sector_leader": None,
            "entity_score": entity_score,
            "gap_to_median": None,
            "gap_to_leader": None,
            "n_peers": 0,
            "peer_data_available": False,
            "improvement_roadmap": [
                "Supply a peer composite-score panel to enable percentile and gap analysis",
                "Align CSRD ESRS E1-E5 reporting with provider data requirements",
                "Engage Sustainalytics/MSCI for analyst engagement meetings",
            ],
        }
        return result

    actual_n = len(clean_peers)
    rank = sum(1 for s in clean_peers if s < entity_score) + 1
    percentile = _round(rank / (actual_n + 1) * 100, 1)

    sector_median = _round(statistics.median(clean_peers), 1)
    p75_idx = min(actual_n - 1, int(actual_n * 0.75))
    sector_p75 = _round(clean_peers[p75_idx], 1)
    sector_leader = _round(max(clean_peers), 1)

    gap_to_median = _round(sector_median - entity_score, 1)
    gap_to_leader = _round(sector_leader - entity_score, 1)

    if gap_to_median > 5:
        improvement_roadmap.append(f"Close {gap_to_median:.0f}pt gap to sector median via enhanced E-pillar reporting")
    if gap_to_leader > 15:
        improvement_roadmap.append("Implement SBTi-aligned targets to match sector leader disclosure")
    improvement_roadmap.append("Align CSRD ESRS E1-E5 reporting with provider data requirements")
    improvement_roadmap.append("Engage Sustainalytics/MSCI for analyst engagement meetings")

    return {
        "percentile_rank": percentile,
        "sector": sector,
        "sector_median": sector_median,
        "sector_p75": sector_p75,
        "sector_leader": sector_leader,
        "entity_score": entity_score,
        "gap_to_median": gap_to_median,
        "gap_to_leader": gap_to_leader,
        "n_peers": actual_n,
        "peer_data_available": True,
        "improvement_roadmap": improvement_roadmap,
    }


# ---------------------------------------------------------------------------
# Method 7: Divergence Report
# ---------------------------------------------------------------------------

def generate_divergence_report(
    entity_id: str,
    entity_name: str,
    sector: str,
    ratings: dict,
    peer_scores: Optional[list] = None,
) -> dict:
    # Only include providers that actually supplied a score; do not fabricate a
    # placeholder score for missing providers.
    real_scores = {p: d.get("score") for p, d in ratings.items() if d.get("score") is not None}

    # Run sub-analyses
    divergence_result = analyse_rating_divergence(entity_id, ratings)
    composite_result = compute_composite_rating(entity_id, real_scores)

    bias_result = detect_rating_bias(
        entity_id, real_scores,
        entity_size="large",
        region="western_europe",
        sector=sector,
    )

    # Peer benchmark is genuine only when a peer panel is supplied; otherwise it
    # returns honest nulls (see benchmark_against_peers).
    benchmark_result = benchmark_against_peers(
        entity_id, sector, composite_result["composite_score"], peer_scores=peer_scores,
    )

    top_divergence_driver = max(
        divergence_result["divergence_sources"].items(),
        key=lambda x: x[1],
        default=("scope_56pct", 0),
    )[0]

    esra_implications = [
        "ESRA 2024/3005 mandates methodology transparency — expect divergence to narrow 15-25% by 2026",
        "Provider consolidation likely: smaller providers may exit EU market post-authorisation",
        "Standardised data collection forms (Art 23 ESRA) will reduce measurement divergence",
        "Mandatory annual analyst engagement letter required for rated entities",
    ]

    action_items = []
    div_score = divergence_result["divergence_score"]
    if div_score is not None and div_score > 15:
        action_items.append("Engage top-3 divergent providers with unified data submission package")
    adj_mag = bias_result["adjustment_magnitude"]
    if adj_mag is not None and adj_mag > 5:
        action_items.append("Correct for reporting bias by providing third-party verified data")
    gap_median = benchmark_result["gap_to_median"]
    if gap_median is not None and gap_median > 5:
        action_items.append(f"Prioritise {gap_median:.0f}-point improvement vs sector median")
    action_items.append("Subscribe to ESRA-authorised provider update notifications")
    action_items.append("Implement annual provider gap analysis as part of IR calendar")

    return {
        "entity": entity_name,
        "sector": sector,
        "composite_score": composite_result["composite_score"],
        "consensus_rating": composite_result["composite_rating"],
        "divergence_score": divergence_result["divergence_score"],
        "top_divergence_driver": top_divergence_driver,
        "bias_adjusted_score": bias_result["bias_adjusted_score"],
        "peer_percentile": benchmark_result["percentile_rank"],
        "esra_implications": esra_implications,
        "action_items": action_items,
        "normalised_scores": divergence_result["normalised_scores"],
        "provider_count": len(ratings),
    }
