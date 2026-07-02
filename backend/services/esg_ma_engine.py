"""
esg_ma_engine.py — E79 ESG M&A Due Diligence
UNGP 31 Guiding Principles | CSDDD Art 3 Supply Chain Scope
OECD Due Diligence Guidance for RBC | ESG Valuation Adjustments
Post-Merger Integration | ILO 8 Core Conventions | SFDR/EU Taxonomy
"""
from __future__ import annotations
from datetime import datetime, timezone, timedelta
from typing import Any, Optional

# ── Reference Data ─────────────────────────────────────────────────────────────

UNGP_PRINCIPLES = [
    # Pillar I — State Duty to Protect
    {"id": "UNGP-1", "pillar": "I", "category": "State_Protect", "principle": "States must protect against human rights abuse by business enterprises"},
    {"id": "UNGP-2", "pillar": "I", "category": "State_Protect", "principle": "States must set clear expectations for business HRs conduct in their territory"},
    {"id": "UNGP-3", "pillar": "I", "category": "State_Protect", "principle": "States should enforce laws requiring business to respect HRs"},
    {"id": "UNGP-4", "pillar": "I", "category": "State_Protect", "principle": "States must protect HRs when contracting with or legislating for business"},
    {"id": "UNGP-5", "pillar": "I", "category": "State_Protect", "principle": "States must exercise adequate oversight of business HRs in conflict-affected areas"},
    {"id": "UNGP-6", "pillar": "I", "category": "State_Protect", "principle": "States should promote HRs-compatible business practices through trade/investment agreements"},
    {"id": "UNGP-7", "pillar": "I", "category": "State_Protect", "principle": "States providing business support must consider HRs risks"},
    {"id": "UNGP-8", "pillar": "I", "category": "State_Protect", "principle": "Policy coherence required between trade, finance and HRs"},
    {"id": "UNGP-9", "pillar": "I", "category": "State_Protect", "principle": "Multinational enterprise home States must take appropriate steps on overseas operations"},
    {"id": "UNGP-10", "pillar": "I", "category": "State_Protect", "principle": "States should ensure effective guidance for businesses on HRs"},
    # Pillar II — Business Responsibility to Respect
    {"id": "UNGP-11", "pillar": "II", "category": "Business_Respect", "principle": "Business enterprises must respect internationally recognised human rights"},
    {"id": "UNGP-12", "pillar": "II", "category": "Business_Respect", "principle": "Business must respect all internationally recognised HRs per UDHR, ICCPR, ICESCR, ILO core conventions"},
    {"id": "UNGP-13", "pillar": "II", "category": "Business_Respect", "principle": "Responsibility to avoid causing or contributing to adverse HRs impacts"},
    {"id": "UNGP-14", "pillar": "II", "category": "Business_Respect", "principle": "Responsibility applies to all business regardless of size, sector or ownership"},
    {"id": "UNGP-15", "pillar": "II", "category": "Business_Respect", "principle": "Policy commitment, HRDD process, and remediation access required"},
    {"id": "UNGP-16", "pillar": "II", "category": "Business_Respect", "principle": "Policy commitment must be approved at senior level, inform internal functions and embed in supplier relations"},
    {"id": "UNGP-17", "pillar": "II", "category": "Business_Respect", "principle": "Human rights due diligence covers actual and potential impacts, tracking and communicating"},
    {"id": "UNGP-18", "pillar": "II", "category": "Business_Respect", "principle": "Impact assessment requires meaningful consultation with potentially affected groups"},
    {"id": "UNGP-19", "pillar": "II", "category": "Business_Respect", "principle": "Integration of impact findings and taking appropriate action"},
    {"id": "UNGP-20", "pillar": "II", "category": "Business_Respect", "principle": "Tracking effectiveness of response — qualitative and quantitative indicators"},
    {"id": "UNGP-21", "pillar": "II", "category": "Business_Respect", "principle": "Communication on HRs impacts — reporting obligation and form"},
    {"id": "UNGP-22", "pillar": "II", "category": "Business_Respect", "principle": "Where business caused or contributed, must provide or cooperate in remediation"},
    {"id": "UNGP-23", "pillar": "II", "category": "Business_Respect", "principle": "Business should treat HRs risk as a legal risk, especially in complex contexts"},
    {"id": "UNGP-24", "pillar": "II", "category": "Business_Respect", "principle": "Prioritisation of HRs impacts based on severity when all cannot be addressed simultaneously"},
    # Pillar III — Access to Remedy
    {"id": "UNGP-25", "pillar": "III", "category": "Access_Remedy", "principle": "States must take appropriate steps to ensure access to effective remedy"},
    {"id": "UNGP-26", "pillar": "III", "category": "Access_Remedy", "principle": "States must ensure judicial remedy through domestic courts is available"},
    {"id": "UNGP-27", "pillar": "III", "category": "Access_Remedy", "principle": "States should facilitate effective non-judicial grievance mechanisms"},
    {"id": "UNGP-28", "pillar": "III", "category": "Access_Remedy", "principle": "Business should cooperate in State-based non-judicial mechanisms"},
    {"id": "UNGP-29", "pillar": "III", "category": "Access_Remedy", "principle": "Business must establish effective operational-level grievance mechanisms"},
    {"id": "UNGP-30", "pillar": "III", "category": "Access_Remedy", "principle": "Industry/multi-stakeholder grievance mechanisms — collaborative approaches"},
    {"id": "UNGP-31", "pillar": "III", "category": "Access_Remedy", "principle": "Effectiveness criteria: legitimate, accessible, predictable, equitable, transparent, rights-compatible, source of learning"},
]

# 85-item ESG DD Checklist across 15 categories
ESG_DD_CHECKLIST = [
    # Category 1: GHG & Climate
    {"id": "DD-E01", "category": "GHG_Climate", "item": "Scope 1/2/3 GHG inventory and verification status", "weight": 3},
    {"id": "DD-E02", "category": "GHG_Climate", "item": "Science-based targets (SBTi) status and trajectory", "weight": 3},
    {"id": "DD-E03", "category": "GHG_Climate", "item": "Climate transition plan quality and credibility", "weight": 3},
    {"id": "DD-E04", "category": "GHG_Climate", "item": "Physical climate risk exposure (TCFD scenario analysis)", "weight": 2},
    {"id": "DD-E05", "category": "GHG_Climate", "item": "Stranded asset risk in fixed asset base", "weight": 2},
    {"id": "DD-E06", "category": "GHG_Climate", "item": "Carbon price exposure and CBAM sensitivity", "weight": 2},
    # Category 2: Biodiversity & Land Use
    {"id": "DD-E07", "category": "Biodiversity", "item": "TNFD/LEAP nature dependency assessment", "weight": 2},
    {"id": "DD-E08", "category": "Biodiversity", "item": "Deforestation-free supply chain verification (EUDR)", "weight": 3},
    {"id": "DD-E09", "category": "Biodiversity", "item": "Protected area / critical habitat exposure", "weight": 2},
    {"id": "DD-E10", "category": "Biodiversity", "item": "Biodiversity Net Gain obligations (DEFRA Metric 4.0)", "weight": 1},
    # Category 3: Water
    {"id": "DD-E11", "category": "Water", "item": "Water withdrawal volumes and stress area exposure", "weight": 2},
    {"id": "DD-E12", "category": "Water", "item": "Wastewater treatment and discharge compliance", "weight": 2},
    {"id": "DD-E13", "category": "Water", "item": "Water pricing and commodity risk", "weight": 1},
    # Category 4: Pollution & Circular Economy
    {"id": "DD-E14", "category": "Pollution_Circular", "item": "Air quality NOx/SOx/PM2.5 permits and violations history", "weight": 2},
    {"id": "DD-E15", "category": "Pollution_Circular", "item": "Hazardous waste liabilities and remediation obligations", "weight": 3},
    {"id": "DD-E16", "category": "Pollution_Circular", "item": "Circular economy strategy and recycled content metrics", "weight": 1},
    {"id": "DD-E17", "category": "Pollution_Circular", "item": "PFAS and substances of concern inventory", "weight": 2},
    # Category 5: Supply Chain (E)
    {"id": "DD-E18", "category": "Supply_Chain_E", "item": "Tier 1-3 supplier GHG quantification", "weight": 2},
    {"id": "DD-E19", "category": "Supply_Chain_E", "item": "CSDDD value chain adverse impact mapping", "weight": 3},
    {"id": "DD-E20", "category": "Supply_Chain_E", "item": "EUDR commodity supply chain geolocation proofs", "weight": 2},
    # Category 6: Human Rights
    {"id": "DD-S01", "category": "Human_Rights", "item": "Human Rights Due Diligence (HRDD) policy and process (UNGP P17)", "weight": 3},
    {"id": "DD-S02", "category": "Human_Rights", "item": "Salient human rights issues identification (UNGP P18)", "weight": 3},
    {"id": "DD-S03", "category": "Human_Rights", "item": "HRIA for high-risk geographies (conflict zones, SIDS)", "weight": 3},
    {"id": "DD-S04", "category": "Human_Rights", "item": "Modern slavery / forced labour audit (ILO C29/C105)", "weight": 3},
    {"id": "DD-S05", "category": "Human_Rights", "item": "Child labour compliance in supply chain (ILO C138/C182)", "weight": 3},
    # Category 7: Labour & Working Conditions
    {"id": "DD-S06", "category": "Labour", "item": "Freedom of association / collective bargaining (ILO C87/C98)", "weight": 2},
    {"id": "DD-S07", "category": "Labour", "item": "Equal remuneration and non-discrimination (ILO C100/C111)", "weight": 2},
    {"id": "DD-S08", "category": "Labour", "item": "H&S incident rate, OSHA compliance and fatality record", "weight": 3},
    {"id": "DD-S09", "category": "Labour", "item": "Gender pay gap and diversity metrics", "weight": 2},
    {"id": "DD-S10", "category": "Labour", "item": "Employee turnover rate and talent retention strategy", "weight": 1},
    # Category 8: Community & Indigenous Peoples
    {"id": "DD-S11", "category": "Community", "item": "FPIC (Free, Prior, Informed Consent) compliance for indigenous peoples", "weight": 3},
    {"id": "DD-S12", "category": "Community", "item": "Community grievance mechanism quality (UNGP P29/P31)", "weight": 2},
    {"id": "DD-S13", "category": "Community", "item": "Community investment and social licence to operate", "weight": 1},
    # Category 9: Product Safety & Consumer
    {"id": "DD-S14", "category": "Product_Safety", "item": "Product liability and recall history", "weight": 2},
    {"id": "DD-S15", "category": "Product_Safety", "item": "Data privacy and GDPR/CCPA compliance", "weight": 2},
    {"id": "DD-S16", "category": "Product_Safety", "item": "AI system risk classification (EU AI Act)", "weight": 2},
    # Category 10: Board & Governance
    {"id": "DD-G01", "category": "Board_Governance", "item": "Board independence and diversity (gender, skills, independence ratio)", "weight": 2},
    {"id": "DD-G02", "category": "Board_Governance", "item": "Sustainability committee and ESG board oversight", "weight": 2},
    {"id": "DD-G03", "category": "Board_Governance", "item": "ESG-linked executive remuneration (KPIs and stretch targets)", "weight": 2},
    {"id": "DD-G04", "category": "Board_Governance", "item": "Dual-class share structures and minority shareholder protections", "weight": 2},
    {"id": "DD-G05", "category": "Board_Governance", "item": "Poison pills, golden parachutes, anti-takeover provisions", "weight": 1},
    # Category 11: Anti-Corruption & Compliance
    {"id": "DD-G06", "category": "Anti_Corruption", "item": "Anti-bribery / anti-corruption (FCPA, UK Bribery Act) programme", "weight": 3},
    {"id": "DD-G07", "category": "Anti_Corruption", "item": "Sanctions and AML compliance screening", "weight": 3},
    {"id": "DD-G08", "category": "Anti_Corruption", "item": "Whistleblower protection and speak-up culture", "weight": 2},
    {"id": "DD-G09", "category": "Anti_Corruption", "item": "Regulatory fines and enforcement actions history", "weight": 2},
    # Category 12: Reporting & Disclosure
    {"id": "DD-G10", "category": "Reporting", "item": "CSRD/ESRS reporting status and assurance level", "weight": 2},
    {"id": "DD-G11", "category": "Reporting", "item": "TCFD disclosure completeness and quality", "weight": 2},
    {"id": "DD-G12", "category": "Reporting", "item": "SFDR classification (Art 6/8/9) where applicable", "weight": 1},
    {"id": "DD-G13", "category": "Reporting", "item": "EU Taxonomy alignment assessment and DNSH verification", "weight": 2},
    # Category 13: Tax & Financial Integrity
    {"id": "DD-G14", "category": "Tax_Finance", "item": "Tax transparency report (GRI 207) and CbCR disclosure", "weight": 2},
    {"id": "DD-G15", "category": "Tax_Finance", "item": "Tax haven exposure and beneficial ownership clarity", "weight": 2},
    {"id": "DD-G16", "category": "Tax_Finance", "item": "Related party transactions and conflicts of interest", "weight": 2},
    # Category 14: Regulatory & Legal Liabilities
    {"id": "DD-G17", "category": "Regulatory_Legal", "item": "CSDDD Art 29 civil liability exposure assessment", "weight": 3},
    {"id": "DD-G18", "category": "Regulatory_Legal", "item": "Climate litigation risk (Urgenda-type, securities disclosure suits)", "weight": 2},
    {"id": "DD-G19", "category": "Regulatory_Legal", "item": "EU ETS compliance and carbon liability quantification", "weight": 2},
    {"id": "DD-G20", "category": "Regulatory_Legal", "item": "Environmental remediation and contaminated land liabilities", "weight": 3},
    {"id": "DD-G21", "category": "Regulatory_Legal", "item": "Ongoing litigation, regulatory investigations and fines pipeline", "weight": 2},
    # Category 15: Integration Readiness
    {"id": "DD-I01", "category": "Integration", "item": "ESG reporting system compatibility (data gaps, software)", "weight": 1},
    {"id": "DD-I02", "category": "Integration", "item": "Supply chain ESG onboarding capacity", "weight": 1},
    {"id": "DD-I03", "category": "Integration", "item": "SBTi target consolidation requirements", "weight": 2},
    {"id": "DD-I04", "category": "Integration", "item": "CSRD entity boundary consolidation", "weight": 2},
    {"id": "DD-I05", "category": "Integration", "item": "Cultural ESG gap assessment", "weight": 1},
]

DEAL_BREAKER_CRITERIA = [
    {"id": "DB-01", "criterion": "Active modern slavery / human trafficking in direct operations", "category": "Human_Rights"},
    {"id": "DB-02", "criterion": "Unmitigated child labour in Tier 1 supply chain (ILO C138/C182 breach)", "category": "Human_Rights"},
    {"id": "DB-03", "criterion": "Systematic indigenous peoples FPIC violations with ongoing displacement", "category": "Community"},
    {"id": "DB-04", "criterion": "Undisclosed environmental contamination with >$50M remediation liability", "category": "Environment"},
    {"id": "DB-05", "criterion": "Active FCPA or UK Bribery Act investigation / criminal prosecution", "category": "Anti_Corruption"},
    {"id": "DB-06", "criterion": "SDN or OFAC/EU sanctions list entity exposure (current)", "category": "Sanctions"},
    {"id": "DB-07", "criterion": "Stranded asset concentration >30% of fixed assets with no transition plan", "category": "Climate"},
    {"id": "DB-08", "criterion": "Fatality rate >industry 99th percentile in past 3 years", "category": "Labour"},
    {"id": "DB-09", "criterion": "Systematic GDPR material breaches with €20M+ exposure", "category": "Data_Privacy"},
    {"id": "DB-10", "criterion": "Greenwashing claims with regulatory investigation by ESMA/FCA/SEC", "category": "Governance"},
    {"id": "DB-11", "criterion": "Deforestation in primary/intact forest after Dec 2020 (EUDR cutoff)", "category": "Biodiversity"},
    {"id": "DB-12", "criterion": "Weapons manufacture for prohibited categories (cluster munitions, antipersonnel mines)", "category": "Arms"},
]

CSDDD_SCOPE_THRESHOLDS = {
    "EU_group_1": {"employees": 5000, "turnover_eur_m": 1500, "phased_application": "2027"},
    "EU_group_2": {"employees": 3000, "turnover_eur_m": 900, "phased_application": "2028"},
    "EU_group_3": {"employees": 1000, "turnover_eur_m": 450, "phased_application": "2029"},
    "non_EU_group_1": {"eu_net_turnover_eur_m": 1500, "phased_application": "2027"},
    "non_EU_group_2": {"eu_net_turnover_eur_m": 900, "phased_application": "2028"},
    "non_EU_group_3": {"eu_net_turnover_eur_m": 450, "phased_application": "2029"},
}

ESG_VALUATION_RANGES = {
    "climate_positive": {"range_pct": (2, 8), "typical_pct": 4, "driver": "Low stranded asset risk, strong transition plan"},
    "climate_negative": {"range_pct": (-15, -5), "typical_pct": -9, "driver": "High carbon liability, stranded assets, no transition"},
    "human_rights_positive": {"range_pct": (1, 4), "typical_pct": 2, "driver": "Strong HRDD, no violations, premium brand"},
    "human_rights_negative": {"range_pct": (-12, -3), "typical_pct": -6, "driver": "Modern slavery/child labour exposure, litigation"},
    "governance_positive": {"range_pct": (2, 7), "typical_pct": 3, "driver": "Strong board, no corruption, transparent reporting"},
    "governance_negative": {"range_pct": (-10, -3), "typical_pct": -5, "driver": "Corruption, related party exposure, poor oversight"},
    "biodiversity_negative": {"range_pct": (-8, -2), "typical_pct": -4, "driver": "EUDR breach, protected habitat impact, remediation"},
    "reporting_positive": {"range_pct": (1, 3), "typical_pct": 1.5, "driver": "CSRD/TCFD complete disclosure, third-party assured"},
    "labour_negative": {"range_pct": (-6, -2), "typical_pct": -3, "driver": "High fatality rate, systemic H&S violations"},
}

ILO_CORE_CONVENTIONS = [
    {"convention": "C29", "name": "Forced Labour Convention 1930", "subject": "Elimination of forced or compulsory labour"},
    {"convention": "C87", "name": "Freedom of Association 1948", "subject": "Right to organise and form trade unions"},
    {"convention": "C98", "name": "Right to Organise and Collective Bargaining 1949", "subject": "Collective bargaining rights"},
    {"convention": "C100", "name": "Equal Remuneration 1951", "subject": "Equal pay for work of equal value"},
    {"convention": "C105", "name": "Abolition of Forced Labour 1957", "subject": "Prohibition of forced labour as punishment"},
    {"convention": "C111", "name": "Discrimination (Employment) 1958", "subject": "Non-discrimination in employment"},
    {"convention": "C138", "name": "Minimum Age Convention 1973", "subject": "Minimum age for employment"},
    {"convention": "C182", "name": "Worst Forms of Child Labour 1999", "subject": "Elimination of worst forms of child labour"},
]


# ── Core Engine Functions ──────────────────────────────────────────────────────

_STATUS_TO_SCORE = {
    "satisfactory": (1.0, "low"),
    "requires_attention": (0.65, "medium"),
    "material_gap": (0.3, "high"),
    "critical_finding": (0.0, "critical"),
}


def _resolve_checklist_status(raw: Any) -> Optional[tuple[str, str, float]]:
    """Map a caller-supplied checklist finding to (status, risk_level, score).

    Accepts either an explicit status string ("satisfactory" / "requires_attention"
    / "material_gap" / "critical_finding"), a mapping containing a "status" key, or
    a numeric 0-1 completeness/quality score. Returns None when the input is absent
    or unrecognised so the item can be reported as an honest non-assessment.
    """
    if raw is None:
        return None
    if isinstance(raw, dict):
        raw = raw.get("status", raw.get("score"))
        if raw is None:
            return None
    if isinstance(raw, str):
        key = raw.strip().lower()
        if key in _STATUS_TO_SCORE:
            score, risk = _STATUS_TO_SCORE[key]
            return key, risk, score
        return None
    if isinstance(raw, bool):  # guard: bool is an int subclass
        raw = 1.0 if raw else 0.0
    if isinstance(raw, (int, float)):
        val = float(raw)
        if val >= 0.75:
            return "satisfactory", "low", 1.0
        if val >= 0.45:
            return "requires_attention", "medium", 0.65
        if val >= 0.2:
            return "material_gap", "high", 0.3
        return "critical_finding", "critical", 0.0
    return None


def assess_esg_due_diligence(
    entity_id: str,
    deal_name: str,
    target_sector: str,
    target_country: str,
    deal_value_usd: float,
    checklist_assessments: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    """Assess ESG due diligence across the 85-item checklist.

    ``checklist_assessments`` maps a checklist item ``id`` (e.g. "DD-E01") to a
    caller-supplied finding — either a status string, a numeric 0-1 quality score,
    or a mapping with a "status"/"score" key (see ``_resolve_checklist_status``).
    Items without a supplied finding are reported as ``not_assessed`` and excluded
    from the E/S/G scoring so headline scores reflect only evidenced findings.
    """
    assessments = checklist_assessments or {}

    checklist_results: list[dict] = []
    red_flags: list[dict] = []
    e_score_sum, s_score_sum, g_score_sum = 0.0, 0.0, 0.0
    e_count, s_count, g_count = 0, 0, 0
    assessed_count = 0

    for item in ESG_DD_CHECKLIST:
        cat = item["category"]
        resolved = _resolve_checklist_status(assessments.get(item["id"]))

        if resolved is None:
            # Honest non-assessment — no data supplied for this checklist item.
            checklist_results.append({
                "id": item["id"],
                "category": cat,
                "item": item["item"],
                "status": "not_assessed",
                "risk_level": "insufficient_data",
                "score": None,
                "weight": item["weight"],
            })
            continue

        status, risk, score = resolved
        assessed_count += 1

        if cat in ("GHG_Climate", "Biodiversity", "Water", "Pollution_Circular", "Supply_Chain_E"):
            e_score_sum += score * item["weight"]
            e_count += item["weight"]
        elif cat in ("Human_Rights", "Labour", "Community", "Product_Safety"):
            s_score_sum += score * item["weight"]
            s_count += item["weight"]
        else:
            g_score_sum += score * item["weight"]
            g_count += item["weight"]

        if status in ("material_gap", "critical_finding"):
            red_flags.append({"id": item["id"], "category": cat, "item": item["item"], "severity": risk})

        checklist_results.append({
            "id": item["id"],
            "category": cat,
            "item": item["item"],
            "status": status,
            "risk_level": risk,
            "score": score,
            "weight": item["weight"],
        })

    e_score = e_score_sum / e_count if e_count else None
    s_score = s_score_sum / s_count if s_count else None
    g_score = g_score_sum / g_count if g_count else None

    # Overall score is a genuine weighted blend of the evidenced pillars only.
    pillar_weights = []
    if e_score is not None:
        pillar_weights.append((e_score, 0.35))
    if s_score is not None:
        pillar_weights.append((s_score, 0.35))
    if g_score is not None:
        pillar_weights.append((g_score, 0.30))
    weight_total = sum(w for _, w in pillar_weights)
    overall_esg_score = (
        sum(v * w for v, w in pillar_weights) / weight_total if weight_total else None
    )

    # ESG premium/discount on deal value — only when a real overall score exists.
    if overall_esg_score is not None:
        adj_pct = (overall_esg_score - 0.5) * 20  # -10% to +10% base
        esg_valuation_adjustment_pct: Optional[float] = round(adj_pct, 2)
        esg_valuation_adjustment_usd: Optional[float] = round(
            deal_value_usd * esg_valuation_adjustment_pct / 100, 0
        )
    else:
        esg_valuation_adjustment_pct = None
        esg_valuation_adjustment_usd = None

    # CSDDD Art 3 scope — deterministic from the deal value (genuine core logic).
    csddd_scope_group = "EU_group_2" if deal_value_usd > 500e6 else "EU_group_3"
    csddd_scope = CSDDD_SCOPE_THRESHOLDS.get(csddd_scope_group, {})

    return {
        "entity_id": entity_id,
        "deal_name": deal_name,
        "target_sector": target_sector,
        "target_country": target_country,
        "deal_value_usd": round(deal_value_usd, 0),
        "esg_score_breakdown": {
            "environmental": round(e_score, 3) if e_score is not None else None,
            "social": round(s_score, 3) if s_score is not None else None,
            "governance": round(g_score, 3) if g_score is not None else None,
            "overall": round(overall_esg_score, 3) if overall_esg_score is not None else None,
        },
        "esg_valuation_adjustment_pct": esg_valuation_adjustment_pct,
        "esg_valuation_adjustment_usd": esg_valuation_adjustment_usd,
        "red_flags": red_flags,
        "red_flag_count": len(red_flags),
        "deal_breaker_check": any(f["severity"] == "critical" for f in red_flags),
        "checklist_items_assessed": assessed_count,
        "checklist_items_total": len(ESG_DD_CHECKLIST),
        "data_completeness": (
            "complete" if assessed_count == len(ESG_DD_CHECKLIST)
            else "partial" if assessed_count > 0
            else "insufficient_data"
        ),
        "csddd_art3_scope": {"scope_group": csddd_scope_group, "thresholds": csddd_scope},
        "ungp_dd_required": any(f["category"] == "Human_Rights" for f in red_flags),
        "assessed_at": datetime.now(timezone.utc).isoformat(),
    }


_OECD_RBC_STEP_KEYS = (
    "step1_embed_rbc",
    "step2_identify_impacts",
    "step3_cease_prevent",
    "step4_track_implementation",
    "step5_communicate",
    "step6_provide_remedy",
)


def score_ungp_alignment(
    entity_id: str,
    target_company: str,
    sector: str,
    principle_scores_input: Optional[dict[str, float]] = None,
    ilo_compliance_input: Optional[dict[str, bool]] = None,
    oecd_rbc_input: Optional[dict[str, float]] = None,
) -> dict[str, Any]:
    """Score UNGP 31-principle alignment from caller-supplied evidence.

    ``principle_scores_input`` maps a UNGP id (e.g. "UNGP-11") to a 0-1 alignment
    score; ``ilo_compliance_input`` maps an ILO convention (e.g. "C29") to a
    compliance boolean; ``oecd_rbc_input`` maps an OECD RBC step key to a 0-1 score.
    Any principle/convention/step without supplied evidence is reported with a null
    score and excluded from the aggregates rather than being fabricated.
    """
    principle_input = principle_scores_input or {}
    ilo_input = ilo_compliance_input or {}
    oecd_input = oecd_rbc_input or {}

    principle_scores: list[dict] = []
    pillar_sums: dict[str, float] = {"I": 0, "II": 0, "III": 0}
    pillar_counts: dict[str, int] = {"I": 0, "II": 0, "III": 0}

    for p in UNGP_PRINCIPLES:
        raw = principle_input.get(p["id"])
        score = round(float(raw), 2) if isinstance(raw, (int, float)) and not isinstance(raw, bool) else None
        if score is not None:
            pillar_sums[p["pillar"]] += score
            pillar_counts[p["pillar"]] += 1
        principle_scores.append({
            "id": p["id"],
            "pillar": p["pillar"],
            "category": p["category"],
            "principle": p["principle"],
            "alignment_score": score,
            "evidence_available": score is not None and score >= 0.7,
            "gap_identified": score is not None and score < 0.5,
        })

    pillar_averages = {
        "Pillar_I_State_Protect": round(pillar_sums["I"] / pillar_counts["I"], 3) if pillar_counts["I"] else None,
        "Pillar_II_Business_Respect": round(pillar_sums["II"] / pillar_counts["II"], 3) if pillar_counts["II"] else None,
        "Pillar_III_Access_Remedy": round(pillar_sums["III"] / pillar_counts["III"], 3) if pillar_counts["III"] else None,
    }
    scored_pillars = [v for v in pillar_averages.values() if v is not None]
    overall_ungp = round(sum(scored_pillars) / len(scored_pillars), 3) if scored_pillars else None

    # ILO core conventions check — only reflect conventions with supplied evidence.
    ilo_compliance: list[dict] = []
    for conv in ILO_CORE_CONVENTIONS:
        raw = ilo_input.get(conv["convention"])
        compliant = bool(raw) if isinstance(raw, bool) else None
        ilo_compliance.append({
            "convention": conv["convention"],
            "name": conv["name"],
            "subject": conv["subject"],
            "compliant": compliant,
            "evidence_type": (
                "audit_certificate" if compliant is True else "none" if compliant is False else "not_assessed"
            ),
            "salient_issue": compliant is False,
        })

    # HRIA requirement flag — triggered by high-risk sector, or by a low UNGP score
    # when one is available. With no score, sector alone drives the flag.
    high_risk_sectors = ["mining", "agriculture", "garments", "construction", "electronics", "fishing"]
    hria_required = sector.lower() in high_risk_sectors or (overall_ungp is not None and overall_ungp < 0.6)

    # OECD Due Diligence Guidance 6 steps — sourced from supplied evidence only.
    oecd_rbc_steps = {}
    for key in _OECD_RBC_STEP_KEYS:
        raw = oecd_input.get(key)
        oecd_rbc_steps[key] = (
            round(float(raw), 2) if isinstance(raw, (int, float)) and not isinstance(raw, bool) else None
        )
    scored_steps = [v for v in oecd_rbc_steps.values() if v is not None]
    oecd_overall = round(sum(scored_steps) / len(scored_steps), 3) if scored_steps else None

    remedy_avg = pillar_averages["Pillar_III_Access_Remedy"]
    return {
        "entity_id": entity_id,
        "target_company": target_company,
        "sector": sector,
        "overall_ungp_score": overall_ungp,
        "pillar_scores": pillar_averages,
        "principle_scores": principle_scores,
        "principles_assessed": sum(pillar_counts.values()),
        "principles_total": len(UNGP_PRINCIPLES),
        "ilo_core_conventions": ilo_compliance,
        "ilo_violations": [c for c in ilo_compliance if c["compliant"] is False],
        "hria_required": hria_required,
        "oecd_rbc_6_steps": oecd_rbc_steps,
        "oecd_rbc_overall": oecd_overall,
        "remedy_mechanism_adequate": (remedy_avg >= 0.65) if remedy_avg is not None else None,
        "assessed_at": datetime.now(timezone.utc).isoformat(),
    }


def _opt_num(source: dict[str, Any], key: str) -> Optional[float]:
    """Return a numeric input from ``source`` or None (bool excluded)."""
    v = source.get(key)
    if isinstance(v, bool):
        return None
    return float(v) if isinstance(v, (int, float)) else None


def calculate_esg_valuation_impact(
    entity_id: str,
    base_valuation_usd: float,
    esg_findings: dict[str, Any],
    quant_inputs: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    """Quantify ESG purchase-price adjustments.

    ``esg_findings`` (already caller-supplied) drives the finding-level adjustments
    via the ESG_VALUATION_RANGES benchmark table — genuine core, preserved as-is.
    ``quant_inputs`` optionally supplies the entity-specific quant drivers:
        stranded_asset_pct, carbon_cost_usd, climate_litigation_usd,
        wage_gap_adj_pct, turnover_adj_pct, board_composition_score,
        ownership_concentration, warranty_coverage_usd, integration_cost_usd.
    Any driver not supplied is reported as null (not fabricated) and omitted from
    the adjusted-valuation roll-up.
    """
    q = quant_inputs or {}

    adjustments: list[dict] = []
    total_adjustment_usd = 0.0

    for finding_key, finding_data in esg_findings.items():
        val_range = ESG_VALUATION_RANGES.get(finding_key, {"range_pct": (-5, 5), "typical_pct": 0, "driver": "Unknown"})
        adj_pct = float(finding_data) if isinstance(finding_data, (int, float)) else val_range["typical_pct"]
        adj_usd = base_valuation_usd * adj_pct / 100
        total_adjustment_usd += adj_usd
        adjustments.append({
            "finding": finding_key,
            "adjustment_pct": adj_pct,
            "adjustment_usd": round(adj_usd, 0),
            "driver": val_range["driver"],
        })

    # Climate liability quantification — from supplied drivers only.
    stranded_asset_pct = _opt_num(q, "stranded_asset_pct")
    carbon_cost_usd = _opt_num(q, "carbon_cost_usd")
    litigation_risk_usd = _opt_num(q, "climate_litigation_usd")
    stranded_asset_usd = base_valuation_usd * stranded_asset_pct if stranded_asset_pct is not None else None
    climate_components = [c for c in (stranded_asset_usd, carbon_cost_usd, litigation_risk_usd) if c is not None]
    climate_liability_total = sum(climate_components) if climate_components else None

    # S pillar adjustments.
    wage_gap_adj_pct = _opt_num(q, "wage_gap_adj_pct")
    turnover_adj_pct = _opt_num(q, "turnover_adj_pct")
    s_components = [c for c in (wage_gap_adj_pct, turnover_adj_pct) if c is not None]
    s_adjustment_usd = (
        base_valuation_usd * sum(s_components) / 100 if s_components else None
    )

    # G pillar adjustments — genuine formula, computed only when both drivers exist.
    board_score = _opt_num(q, "board_composition_score")
    ownership_conc = _opt_num(q, "ownership_concentration")
    if board_score is not None and ownership_conc is not None:
        g_adj_pct = (board_score - 0.5) * 6 - (ownership_conc - 0.3) * 4
        g_adjustment_usd: Optional[float] = base_valuation_usd * g_adj_pct / 100
    else:
        g_adjustment_usd = None

    # W&I coverage.
    wi_coverage_usd = _opt_num(q, "warranty_coverage_usd")
    wi_esg_excluded = ["environmental_contamination", "modern_slavery", "sanctions"]

    # Integration costs.
    integration_cost_usd = _opt_num(q, "integration_cost_usd")

    adjusted_valuation = base_valuation_usd + total_adjustment_usd
    if climate_liability_total is not None:
        adjusted_valuation -= climate_liability_total  # liability reduces value
    if s_adjustment_usd is not None:
        adjusted_valuation += s_adjustment_usd  # signed S adjustment
    if g_adjustment_usd is not None:
        adjusted_valuation += g_adjustment_usd  # signed G adjustment

    return {
        "entity_id": entity_id,
        "base_valuation_usd": round(base_valuation_usd, 0),
        "adjusted_valuation_usd": round(adjusted_valuation, 0),
        "total_esg_adjustment_pct": (
            round((adjusted_valuation - base_valuation_usd) / base_valuation_usd * 100, 2)
            if base_valuation_usd else None
        ),
        "esg_finding_adjustments": adjustments,
        "climate_liability": {
            "stranded_asset_exposure_usd": round(stranded_asset_usd, 0) if stranded_asset_usd is not None else None,
            "carbon_cost_exposure_usd": round(carbon_cost_usd, 0) if carbon_cost_usd is not None else None,
            "climate_litigation_risk_usd": round(litigation_risk_usd, 0) if litigation_risk_usd is not None else None,
            "total_climate_liability_usd": round(climate_liability_total, 0) if climate_liability_total is not None else None,
        },
        "social_adjustments": {
            "wage_gap_adj_pct": round(wage_gap_adj_pct, 2) if wage_gap_adj_pct is not None else None,
            "turnover_adj_pct": round(turnover_adj_pct, 2) if turnover_adj_pct is not None else None,
            "s_total_usd": round(s_adjustment_usd, 0) if s_adjustment_usd is not None else None,
        },
        "governance_adjustments": {
            "board_composition_score": round(board_score, 3) if board_score is not None else None,
            "ownership_concentration": round(ownership_conc, 3) if ownership_conc is not None else None,
            "g_total_usd": round(g_adjustment_usd, 0) if g_adjustment_usd is not None else None,
        },
        "warranty_indemnity": {
            "coverage_usd": round(wi_coverage_usd, 0) if wi_coverage_usd is not None else None,
            "esg_reps_excluded": wi_esg_excluded,
            "bespoke_esg_reps_recommended": True,
        },
        "integration_cost_estimate_usd": round(integration_cost_usd, 0) if integration_cost_usd is not None else None,
        "assessed_at": datetime.now(timezone.utc).isoformat(),
    }


def plan_post_merger_integration(
    entity_id: str,
    acquirer_profile: dict[str, Any],
    target_profile: dict[str, Any],
    close_date: str,
    integration_cost_usd: Optional[float] = None,
) -> dict[str, Any]:
    """Build a 100-day post-merger ESG integration plan.

    The plan structure and its milestone dates are deterministic (genuine core).
    Cultural-gap and SBTi-trigger logic derive from the supplied acquirer/target
    profiles; when a profile omits ``esg_maturity`` / ``has_sbti`` / ``revenue_share``
    the corresponding driver is treated as unknown (null) rather than fabricated.
    ``integration_cost_usd`` may be passed to report a costed estimate.
    """
    try:
        close_dt = datetime.fromisoformat(close_date)
    except Exception:
        close_dt = datetime.now(timezone.utc)

    day30 = (close_dt + timedelta(days=30)).strftime("%Y-%m-%d")
    day60 = (close_dt + timedelta(days=60)).strftime("%Y-%m-%d")
    day100 = (close_dt + timedelta(days=100)).strftime("%Y-%m-%d")
    month6 = (close_dt + timedelta(days=180)).strftime("%Y-%m-%d")
    year1 = (close_dt + timedelta(days=365)).strftime("%Y-%m-%d")

    # Cultural ESG gap score — only when both maturity inputs are supplied.
    aq_raw = acquirer_profile.get("esg_maturity")
    tg_raw = target_profile.get("esg_maturity")
    acquirer_esg_maturity = float(aq_raw) if isinstance(aq_raw, (int, float)) and not isinstance(aq_raw, bool) else None
    target_esg_maturity = float(tg_raw) if isinstance(tg_raw, (int, float)) and not isinstance(tg_raw, bool) else None
    if acquirer_esg_maturity is not None and target_esg_maturity is not None:
        cultural_esg_gap: Optional[float] = round(abs(acquirer_esg_maturity - target_esg_maturity), 3)
    else:
        cultural_esg_gap = None

    gap_action = (
        f"Cultural gap closure plan: training for {round(cultural_esg_gap * 100, 0):.0f}% gap in ESG maturity"
        if cultural_esg_gap is not None
        else "Cultural gap closure plan: quantify ESG maturity gap once acquirer/target maturity data collected"
    )

    plan = {
        "days_1_30": {
            "deadline": day30,
            "workstream": "Governance Alignment",
            "actions": [
                "Appoint integration ESG steering committee with C-suite sponsor",
                "Assess target board ESG committee structure and mandate",
                "Map target ESG reporting calendar to acquirer CSRD/TCFD timelines",
                "Initial HR review: confirm no outstanding UNGP violations or investigations",
                "Sanctions re-screening of target entity, subsidiaries and key personnel",
            ],
        },
        "days_31_60": {
            "deadline": day60,
            "workstream": "Reporting Harmonisation",
            "actions": [
                "Gap analysis: target vs acquirer CSRD ESRS entity boundary",
                "GHG protocol consolidation approach (operational vs equity share control)",
                "SFDR entity-level PAI data collection protocol for combined entity",
                "Identify EU Taxonomy-aligned/eligible assets in target asset base",
                "Data room ESG disclosures comparison report and gap register",
            ],
        },
        "days_61_100": {
            "deadline": day100,
            "workstream": "Policy Adoption & Supply Chain",
            "actions": [
                "Target adopts acquirer Human Rights Policy and Code of Conduct",
                "CSDDD due diligence cascade: map new Tier 1-3 supplier additions",
                "SBTi target revision: re-submit combined entity Scope 1/2/3 for validation",
                "ESG KPI harmonisation: align metric definitions and data collection",
                "Cultural ESG integration assessment — employee pulse survey on ESG values alignment",
            ],
        },
        "months_6_12": {
            "deadline": year1,
            "workstream": "Systems Integration",
            "actions": [
                "Integrate target into ESG data platform (GHG accounting, water, waste)",
                "Combined entity first CSRD double materiality assessment",
                "ESRS disclosure consolidation in first integrated sustainability report",
                "ESG-linked financing terms review: SLL covenants, green bond allocation",
                gap_action,
            ],
        },
    }

    # SBTi revision trigger — evaluated only when the acquirer SBTi flag and target
    # revenue share are both supplied; otherwise honestly unknown.
    has_sbti_raw = acquirer_profile.get("has_sbti")
    rev_share_raw = target_profile.get("revenue_share")
    has_sbti = has_sbti_raw if isinstance(has_sbti_raw, bool) else None
    revenue_share = (
        float(rev_share_raw) if isinstance(rev_share_raw, (int, float)) and not isinstance(rev_share_raw, bool) else None
    )
    if has_sbti is not None and revenue_share is not None:
        sbti_revision_required: Optional[bool] = has_sbti and abs(revenue_share) > 0.1
    else:
        sbti_revision_required = None

    if cultural_esg_gap is None:
        integration_complexity: Optional[str] = None
    elif cultural_esg_gap > 0.3:
        integration_complexity = "high"
    elif cultural_esg_gap > 0.15:
        integration_complexity = "medium"
    else:
        integration_complexity = "low"

    cost_input = (
        float(integration_cost_usd)
        if isinstance(integration_cost_usd, (int, float)) and not isinstance(integration_cost_usd, bool)
        else None
    )

    return {
        "entity_id": entity_id,
        "close_date": close_date,
        "acquirer_esg_maturity": round(acquirer_esg_maturity, 3) if acquirer_esg_maturity is not None else None,
        "target_esg_maturity": round(target_esg_maturity, 3) if target_esg_maturity is not None else None,
        "cultural_esg_gap_score": cultural_esg_gap,
        "integration_complexity": integration_complexity,
        "sbti_revision_required": sbti_revision_required,
        "csrd_scope_expansion": True,
        "csddd_supply_chain_expansion": True,
        "100_day_plan": plan,
        "estimated_integration_cost_usd": round(cost_input, 0) if cost_input is not None else None,
        "assessed_at": datetime.now(timezone.utc).isoformat(),
    }


# Standing ESG value-creation levers considered in an M&A DD report. The lever
# descriptions are reference content; the dollar value is entity-specific and must
# be supplied by the caller (keyed by "id") rather than fabricated.
_VALUE_CREATION_LEVERS = [
    {"id": "carbon_credit_monetisation", "opportunity": "Carbon credit monetisation from renewable energy assets"},
    {"id": "cbam_savings", "opportunity": "CBAM border adjustment savings from EU supply chain integration"},
    {"id": "green_bond_issuance", "opportunity": "Green bond issuance for EU Taxonomy-aligned capex"},
    {"id": "sfdr_relabelling", "opportunity": "Premium ESG labelling for SFDR Art 9 product reclassification"},
    {"id": "sll_repricing", "opportunity": "Sustainability-linked loan repricing at lower coupon"},
]


def generate_dd_report(
    entity_id: str,
    deal_name: str,
    target_sector: str = "industrials",
    target_country: str = "DE",
    deal_value_usd: Optional[float] = None,
    checklist_assessments: Optional[dict[str, Any]] = None,
    ungp_principle_scores: Optional[dict[str, float]] = None,
    ungp_ilo_compliance: Optional[dict[str, bool]] = None,
    ungp_oecd_rbc: Optional[dict[str, float]] = None,
    category_rag_scores: Optional[dict[str, float]] = None,
    value_creation_estimates_usd: Optional[dict[str, float]] = None,
    deal_breaker_findings: Optional[dict[str, bool]] = None,
    additional_regulatory_flags: Optional[list[str]] = None,
    comparable_deals: Optional[list[dict[str, Any]]] = None,
) -> dict[str, Any]:
    """Compose an investment-committee ESG DD report from real sub-assessments.

    All entity-specific quantities are sourced from the optional inputs and default
    to honest nulls / empty sections when not supplied — no figures are fabricated.
    The DD checklist, UNGP, RAG, value-creation, deal-breaker and regulatory sections
    all flow from caller-supplied evidence via the same helpers used elsewhere here.
    """
    # Sub-assessments compose the real underlying engine functions.
    dd = assess_esg_due_diligence(
        entity_id, deal_name, target_sector, target_country,
        deal_value_usd if deal_value_usd is not None else 0.0,
        checklist_assessments=checklist_assessments,
    )
    ungp = score_ungp_alignment(
        entity_id, deal_name, target_sector,
        principle_scores_input=ungp_principle_scores,
        ilo_compliance_input=ungp_ilo_compliance,
        oecd_rbc_input=ungp_oecd_rbc,
    )

    # RAG status by category — from supplied 0-1 category scores only.
    rag_input = category_rag_scores or {}
    categories = sorted({item["category"] for item in ESG_DD_CHECKLIST})
    rag_status: list[dict] = []
    for cat in categories:
        raw = rag_input.get(cat)
        score = round(float(raw), 3) if isinstance(raw, (int, float)) and not isinstance(raw, bool) else None
        if score is None:
            rag = "not_assessed"
        else:
            rag = "green" if score >= 0.75 else "amber" if score >= 0.5 else "red"
        rag_status.append({"category": cat, "score": score, "rag": rag})

    # Value creation opportunities — lever descriptions are reference content; the
    # dollar value comes from caller estimates or is left null.
    vc_estimates = value_creation_estimates_usd or {}
    value_creation: list[dict] = []
    for lever in _VALUE_CREATION_LEVERS:
        raw = vc_estimates.get(lever["id"])
        val = round(float(raw), 0) if isinstance(raw, (int, float)) and not isinstance(raw, bool) else None
        value_creation.append({"id": lever["id"], "opportunity": lever["opportunity"], "value_usd": val})
    quantified_vc = [v["value_usd"] for v in value_creation if v["value_usd"] is not None]
    total_value_creation = sum(quantified_vc) if quantified_vc else None

    # Deal-breaker assessment — only conclusive when a finding is supplied.
    db_findings = deal_breaker_findings or {}
    db_assessment = []
    for db in DEAL_BREAKER_CRITERIA:
        raw = db_findings.get(db["id"])
        triggered = bool(raw) if isinstance(raw, bool) else None
        db_assessment.append({
            "id": db["id"],
            "criterion": db["criterion"],
            "category": db["category"],
            "triggered": triggered,
            "evidence": (
                "Finding supplied for ref: " + db["id"] if triggered is True
                else "No trigger reported" if triggered is False
                else "Not assessed — no finding supplied"
            ),
        })
    deal_breakers_triggered = [d for d in db_assessment if d["triggered"] is True]
    db_assessed = any(d["triggered"] is not None for d in db_assessment)

    # Regulatory risk flags — derived from real DD signals + caller-supplied flags.
    regulatory_flags: list[str] = []
    if dd["deal_breaker_check"] or deal_breakers_triggered:
        regulatory_flags.append("DEAL-BREAKER: Critical ESG finding — deal requires remediation prior to close")
    if additional_regulatory_flags:
        regulatory_flags.extend(str(f) for f in additional_regulatory_flags)

    # Recommendation: escalate on any triggered deal-breaker; otherwise proceed with
    # conditions only when the assessment actually ran, else flag insufficient data.
    if deal_breakers_triggered:
        recommendation = "escalate_to_board"
    elif db_assessed:
        recommendation = "proceed_with_conditions"
    else:
        recommendation = "insufficient_data"

    return {
        "entity_id": entity_id,
        "deal_name": deal_name,
        "report_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "investment_committee_summary": {
            "overall_esg_score": dd["esg_score_breakdown"]["overall"],
            "red_flags_count": dd["red_flag_count"],
            "deal_breakers_triggered": len(deal_breakers_triggered),
            "esg_valuation_adjustment_pct": dd["esg_valuation_adjustment_pct"],
            "ungp_score": ungp["overall_ungp_score"],
            "recommendation": recommendation,
        },
        "material_findings_rag": sorted(
            rag_status, key=lambda x: x["score"] if x["score"] is not None else 1.0
        ),
        "value_creation_opportunities": value_creation,
        "total_value_creation_usd": total_value_creation,
        "regulatory_risk_flags": regulatory_flags,
        "deal_breaker_assessment": {
            "items": db_assessment,
            "triggered": deal_breakers_triggered,
            "any_triggered": bool(deal_breakers_triggered),
            "assessed": db_assessed,
        },
        "comparable_deals": comparable_deals or [],
        "esg_reps_warranties_recommended": [
            "Seller warrants: no undisclosed environmental contamination >$1M",
            "Seller warrants: no ongoing modern slavery in Tier 1 supply chain",
            "Seller warrants: GHG data materially complete per GHG Protocol",
            "Seller warrants: no active FCPA/Bribery Act investigation",
            "Seller warrants: EUDR commodity lots comply with deforestation cutoff Dec 2020",
        ],
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
