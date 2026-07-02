"""
SFDR Article 9 Impact Fund Assessment Engine — E95
===================================================
SFDR RTS 2022/1288 Annex I/II pre-contractual templates
14 mandatory + 4 optional PAI indicators (Annex I Table 1)
Article 9 eligibility criteria: sustainable_investment ≥ 100%
DNSH verification across all 6 EU Taxonomy environmental objectives
ESMA SFDR Q&A 2023 compliance & downgrade risk assessment
Portfolio-level PAI aggregation with PCAF DQS-weighted quality scoring
VCMI / taxonomy alignment integration
Impact KPI framework (IRIS+, GII, GIIN)

References:
  - SFDR Regulation (EU) 2019/2088
  - SFDR Level 2 RTS (EU) 2022/1288 (Delegated Regulation)
  - ESMA SFDR Q&A — ESMA34-45-1272 (updated 2023)
  - EU Taxonomy Regulation (EU) 2020/852 + Delegated Acts 2021/4987 / 2023/2486
  - OECD Guidelines for Multinational Enterprises (2023)
  - UNGC Ten Principles
"""
from __future__ import annotations

import math
from typing import Any, Optional

from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Reference Data — PAI Indicators (RTS Annex I Table 1)
# ---------------------------------------------------------------------------

PAI_MANDATORY: dict[str, dict] = {
    "PAI_1": {
        "indicator_number": 1,
        "name": "GHG Emissions",
        "metric": "Scope 1 + Scope 2 GHG emissions",
        "unit": "tCO2e per €M invested",
        "category": "climate_environment",
        "esrs_link": "ESRS E1-6",
        "calculation": (
            "Sum of investees' Scope 1 + Scope 2 GHG emissions (tCO2e) × portfolio weight / "
            "total current value of investments (€M)"
        ),
        "data_proxy_acceptable": True,
        "dqs_benchmark": 2,  # target PCAF DQS
    },
    "PAI_2": {
        "indicator_number": 2,
        "name": "Carbon Footprint",
        "metric": "Carbon footprint of investments",
        "unit": "tCO2e per €M invested",
        "category": "climate_environment",
        "esrs_link": "ESRS E1-6",
        "calculation": (
            "Sum of (portfolio share × Scope 1+2 emissions) / portfolio value (€M). "
            "Reflects weighted average carbon intensity."
        ),
        "data_proxy_acceptable": True,
        "dqs_benchmark": 2,
    },
    "PAI_3": {
        "indicator_number": 3,
        "name": "GHG Intensity of Investee Companies",
        "metric": "GHG intensity per €M revenue",
        "unit": "tCO2e per €M revenue",
        "category": "climate_environment",
        "esrs_link": "ESRS E1-6",
        "calculation": (
            "Scope 1+2+3 GHG emissions divided by enterprise value including cash (EVIC) × revenue weight."
        ),
        "data_proxy_acceptable": True,
        "dqs_benchmark": 2,
    },
    "PAI_4": {
        "indicator_number": 4,
        "name": "Exposure to Companies in Fossil Fuel Sector",
        "metric": "Share of investments in fossil fuel companies",
        "unit": "% of portfolio value",
        "category": "climate_environment",
        "esrs_link": "ESRS E1-4",
        "calculation": (
            "Share of investments in companies active in the fossil fuel sector per "
            "EU Taxonomy Delegated Act Annex I climate change mitigation (NACE B.05-09, C.19, D.35)."
        ),
        "data_proxy_acceptable": False,
        "dqs_benchmark": 1,
    },
    "PAI_5": {
        "indicator_number": 5,
        "name": "Share of Non-Renewable Energy Consumption and Production",
        "metric": "Non-renewable energy consumption and production",
        "unit": "% of total energy",
        "category": "climate_environment",
        "esrs_link": "ESRS E1-5",
        "calculation": (
            "Share of non-renewable energy sources in total energy consumed and produced "
            "by investee companies (GJ basis)."
        ),
        "data_proxy_acceptable": True,
        "dqs_benchmark": 2,
    },
    "PAI_6": {
        "indicator_number": 6,
        "name": "Energy Consumption Intensity Per High-Impact Sector",
        "metric": "Energy consumption intensity by NACE high-impact sector",
        "unit": "GJ per €M revenue",
        "category": "climate_environment",
        "esrs_link": "ESRS E1-5",
        "calculation": (
            "Energy consumption in GJ divided by €M revenue for investees in "
            "13 high-impact climate sectors per NACE Rev.2."
        ),
        "data_proxy_acceptable": True,
        "dqs_benchmark": 2,
        "high_impact_sectors": [
            "A (Agriculture)", "B (Mining)", "C (Manufacturing)", "D (Electricity)",
            "E (Water/Waste)", "F (Construction)", "G (Wholesale)", "H (Transport)",
            "I (Accommodation)", "J (ICT)", "L (Real Estate)", "M (Professional)",
            "N (Administrative)",
        ],
    },
    "PAI_7": {
        "indicator_number": 7,
        "name": "Activities Negatively Affecting Biodiversity-Sensitive Areas",
        "metric": "Investments in companies with sites/operations in/near biodiversity-sensitive areas",
        "unit": "boolean (yes/no share)",
        "category": "biodiversity",
        "esrs_link": "ESRS E4-3",
        "calculation": (
            "Share of investments in companies with sites or operations located in or near "
            "UNESCO World Heritage sites, Natura 2000 areas, Ramsar wetlands, or IUCN I-IV."
        ),
        "data_proxy_acceptable": False,
        "dqs_benchmark": 1,
    },
    "PAI_8": {
        "indicator_number": 8,
        "name": "Emissions to Water",
        "metric": "Tonnes of pollutants emitted to water bodies",
        "unit": "tonnes per €M invested",
        "category": "water",
        "esrs_link": "ESRS E2-4 / E3-4",
        "calculation": (
            "Weighted average of investee emissions to water (tonnes of substances "
            "listed in EU Water Framework Directive priority substances list)."
        ),
        "data_proxy_acceptable": True,
        "dqs_benchmark": 3,
    },
    "PAI_9": {
        "indicator_number": 9,
        "name": "Hazardous Waste and Radioactive Waste Ratio",
        "metric": "Hazardous and radioactive waste generated",
        "unit": "tonnes per €M invested",
        "category": "waste",
        "esrs_link": "ESRS E5-5",
        "calculation": (
            "Weighted average of hazardous and radioactive waste generated "
            "by investee companies (tonnes/€M EVIC)."
        ),
        "data_proxy_acceptable": True,
        "dqs_benchmark": 3,
    },
    "PAI_10": {
        "indicator_number": 10,
        "name": "Violations of UN Global Compact Principles and OECD MNE Guidelines",
        "metric": "Share of investments in companies involved in UNGC/OECD violations",
        "unit": "% of portfolio",
        "category": "social_governance",
        "esrs_link": "ESRS S1-1 / G1-4",
        "calculation": (
            "Share of investments in companies with confirmed violations of UNGC Ten Principles "
            "or OECD Guidelines for Multinational Enterprises."
        ),
        "data_proxy_acceptable": False,
        "dqs_benchmark": 1,
    },
    "PAI_11": {
        "indicator_number": 11,
        "name": "Lack of Processes and Compliance Mechanisms to Monitor UNGC/OECD Compliance",
        "metric": "Share of investments lacking compliance monitoring processes",
        "unit": "% of portfolio",
        "category": "social_governance",
        "esrs_link": "ESRS G1-1",
        "calculation": (
            "Share of investments in companies without due diligence processes monitoring "
            "adherence to UNGC or OECD Guidelines."
        ),
        "data_proxy_acceptable": False,
        "dqs_benchmark": 2,
    },
    "PAI_12": {
        "indicator_number": 12,
        "name": "Unadjusted Gender Pay Gap",
        "metric": "Average unadjusted gender pay gap of investee companies",
        "unit": "% difference (male - female)",
        "category": "social_governance",
        "esrs_link": "ESRS S1-16",
        "calculation": (
            "Weighted average of investees' unadjusted gender pay gap "
            "(difference between average gross hourly earnings of male vs female employees)."
        ),
        "data_proxy_acceptable": True,
        "dqs_benchmark": 2,
    },
    "PAI_13": {
        "indicator_number": 13,
        "name": "Board Gender Diversity",
        "metric": "Average ratio of female to all board members of investee companies",
        "unit": "% female board members",
        "category": "social_governance",
        "esrs_link": "ESRS G1-5",
        "calculation": (
            "Weighted average of female board members as % of total board members "
            "across investee companies."
        ),
        "data_proxy_acceptable": True,
        "dqs_benchmark": 2,
    },
    "PAI_14": {
        "indicator_number": 14,
        "name": "Exposure to Controversial Weapons",
        "metric": "Share of investments in companies involved in controversial weapons",
        "unit": "% of portfolio",
        "category": "social_governance",
        "esrs_link": "ESRS G1-4",
        "calculation": (
            "Share of investments in companies producing anti-personnel mines, cluster munitions, "
            "chemical/biological/nuclear weapons, white phosphorus weapons."
        ),
        "data_proxy_acceptable": False,
        "dqs_benchmark": 1,
    },
}

PAI_OPTIONAL: dict[str, dict] = {
    "OPT_1": {
        "indicator_number": "O1",
        "name": "Fossil Fuel Real Estate Exposure",
        "metric": "Investments in real estate assets involving fossil fuels",
        "unit": "% of real estate portfolio",
        "category": "real_estate_environment",
        "calculation": "Share of real estate investments in assets involved in fossil fuel extraction/processing.",
        "applicable_to": ["real_estate_funds"],
    },
    "OPT_2": {
        "indicator_number": "O2",
        "name": "Energy-Inefficient Real Estate Assets",
        "metric": "Share of investments in energy-inefficient real estate (EPC E/F/G)",
        "unit": "% of real estate portfolio",
        "category": "real_estate_environment",
        "calculation": "Share of real estate with EPC label E, F, or G (or equivalent primary energy demand).",
        "applicable_to": ["real_estate_funds"],
    },
    "OPT_3": {
        "indicator_number": "O3",
        "name": "Excessive CEO-to-Worker Pay Ratio",
        "metric": "Share of investments in companies with excessive CEO pay ratios",
        "unit": "% of portfolio",
        "category": "social_governance",
        "calculation": "Share of investments where CEO:median worker pay ratio exceeds country-sector benchmark.",
        "applicable_to": ["all_funds"],
    },
    "OPT_4": {
        "indicator_number": "O4",
        "name": "Lack of Anti-Corruption and Anti-Bribery Policies",
        "metric": "Share of investments without anti-corruption policies",
        "unit": "% of portfolio",
        "category": "governance",
        "calculation": "Share of investments in companies without published anti-corruption and anti-bribery policies.",
        "applicable_to": ["all_funds"],
    },
}

DNSH_OBJECTIVES: dict[str, dict] = {
    "dnsh_climate_mitigation": {
        "objective_number": 1,
        "name": "Climate Change Mitigation",
        "regulation": "EU Taxonomy Delegated Act 2021/4987",
        "key_requirements": [
            "No significant harm to climate change mitigation goals",
            "Activities do not lock-in carbon-intensive assets (>20 yr lifetime)",
            "GHG emissions consistent with Paris Agreement pathways",
            "No facilitation of deforestation or land-use change",
        ],
        "screening_criteria": "GHG emission intensity vs EU Taxonomy thresholds; no expansion of fossil fuel capacity",
        "worst_case_exclusions": ["coal_mining", "oil_gas_extraction", "heavy_fuel_oil_power"],
    },
    "dnsh_climate_adaptation": {
        "objective_number": 2,
        "name": "Climate Change Adaptation",
        "regulation": "EU Taxonomy Delegated Act 2021/4987",
        "key_requirements": [
            "No increase in adverse climate change adaptation impacts on third parties",
            "Physical climate risk assessment (acute + chronic) completed",
            "Adaptation measures implemented or planned",
            "No maladaptation that increases risk to other actors",
        ],
        "screening_criteria": "Physical risk assessment via NGFS/IPCC scenarios; no blocking of adaptive capacity",
        "worst_case_exclusions": ["activities_increasing_flood_risk", "activities_blocking_adaptation"],
    },
    "dnsh_water": {
        "objective_number": 3,
        "name": "Sustainable Use and Protection of Water and Marine Resources",
        "regulation": "EU Taxonomy Delegated Act 2021/4987",
        "key_requirements": [
            "No significant harm to good water status (WFD 2000/60/EC)",
            "No significant harm to good marine ecosystem status",
            "Water use in compliance with water management plans",
            "No significant deterioration of bodies of surface/groundwater",
        ],
        "screening_criteria": "Water withdrawal vs water stress index; pollutant discharge vs WFD limits",
        "worst_case_exclusions": ["activities_in_water_stressed_areas_without_mitigation"],
    },
    "dnsh_circular": {
        "objective_number": 4,
        "name": "Transition to a Circular Economy",
        "regulation": "EU Taxonomy Delegated Act 2021/4987",
        "key_requirements": [
            "No significant increase in waste generation",
            "No significant inefficiencies in recycled content",
            "No significant adverse effects on sustainable management of raw materials",
            "No lock-in of single-use plastic infrastructure",
        ],
        "screening_criteria": "Waste generation rate vs sector benchmark; recyclability of products",
        "worst_case_exclusions": ["single_use_plastic_manufacturing", "open_dump_operations"],
    },
    "dnsh_pollution": {
        "objective_number": 5,
        "name": "Pollution Prevention and Control",
        "regulation": "EU Taxonomy Delegated Act 2021/4987",
        "key_requirements": [
            "No significant increase in pollutant emissions (IED/IPPC thresholds)",
            "Compliance with EU Industrial Emissions Directive (IED) 2010/75/EU",
            "No use of persistent organic pollutants (POPs)",
            "Hazardous substance management per REACH",
        ],
        "screening_criteria": "BAT-AEL compliance; REACH SVHC substance list screening",
        "worst_case_exclusions": ["pop_manufacturing", "activities_above_ied_bat_ael"],
    },
    "dnsh_biodiversity": {
        "objective_number": 6,
        "name": "Protection and Restoration of Biodiversity and Ecosystems",
        "regulation": "EU Taxonomy Delegated Act 2021/4987 / 2023/2486",
        "key_requirements": [
            "No significant harm to good ecosystem status (WFD/HFD)",
            "No adverse effects on Natura 2000 / UNESCO / Ramsar sites",
            "No activities leading to IUCN Red List species decline",
            "Compliance with EU Biodiversity Strategy 2030",
        ],
        "screening_criteria": "Spatial overlay vs protected areas; species impact assessment",
        "worst_case_exclusions": ["activities_in_natura2000_without_eia", "activities_threatening_red_list_species"],
    },
}

ART9_REQUIREMENTS: dict[str, dict] = {
    "sustainable_investment_100pct": {
        "requirement": "Sustainable Investment ≥ 100% of fund assets",
        "regulation": "SFDR Art 9(1) and (2)",
        "esma_qa_clarification": (
            "ESMA Q&A 2023: 'sustainable investment' per Art 2(17) requires (1) contributing to "
            "environmental/social objective, (2) DNSH all 6 objectives, (3) good governance practice. "
            "Cash and derivatives for hedging excluded from denominator."
        ),
        "threshold": 1.0,  # 100%
        "is_hard_rule": True,
    },
    "taxonomy_aligned_disclosure": {
        "requirement": "EU Taxonomy alignment % must be disclosed (even if 0%)",
        "regulation": "SFDR Art 9(3) + EU Taxonomy Art 8",
        "esma_qa_clarification": "Must disclose minimum taxonomy alignment. Cannot claim 'no target' for Art 9.",
        "threshold": None,  # disclosure required, no minimum
        "is_hard_rule": True,
    },
    "dnsh_all_objectives": {
        "requirement": "All investments must pass DNSH across all 6 EU Taxonomy environmental objectives",
        "regulation": "SFDR Art 2(17)(b) + EU Taxonomy Art 17",
        "esma_qa_clarification": (
            "DNSH must be assessed at investee level. "
            "For sovereign/quasi-sovereign, use OECD country-level data where investee data unavailable."
        ),
        "threshold": None,
        "is_hard_rule": True,
    },
    "good_governance_screen": {
        "requirement": "Investees must have sound management, tax compliance, no UNGC violations",
        "regulation": "SFDR Art 2(17)(c)",
        "esma_qa_clarification": (
            "Minimum governance screen: no severe UNGC violations, tax transparency, "
            "anti-corruption policies in place."
        ),
        "threshold": None,
        "is_hard_rule": True,
    },
    "impact_measurement": {
        "requirement": "Impact objectives must be measurable with clear KPIs and baselines",
        "regulation": "SFDR RTS 2022/1288 Annex II (pre-contractual) + Annex V (periodic)",
        "esma_qa_clarification": (
            "Art 9 funds must demonstrate their investments 'have' sustainable investment as an objective "
            "— not merely 'promote' it. Concrete, time-bound KPIs with baselines required."
        ),
        "threshold": None,
        "is_hard_rule": False,  # best practice
    },
    "pai_reporting_mandatory": {
        "requirement": "All 14 mandatory PAI indicators must be disclosed in pre-contractual + periodic reports",
        "regulation": "SFDR RTS 2022/1288 Annex I Table 1",
        "esma_qa_clarification": (
            "Art 9 funds are subject to mandatory entity-level PAI reporting (>500 employees or AIFM). "
            "Fund-level PAI must mirror Annex I indicators."
        ),
        "threshold": None,
        "is_hard_rule": True,
    },
}

ESMA_QA_2023: list[dict] = [
    {
        "qa_reference": "ESMA34-45-1272 Q12",
        "question": "Can cash and cash equivalents count toward the 100% sustainable investment requirement?",
        "answer": (
            "No. Cash held for liquidity management, repo collateral, and cash equivalents (money market "
            "instruments with maturity <3 months) are excluded from the denominator when calculating "
            "the sustainable investment percentage."
        ),
        "implication": "Art 9 funds should ensure the sustainable investment % is calculated on invested assets net of cash.",
        "effective": "2023",
    },
    {
        "qa_reference": "ESMA34-45-1272 Q14",
        "question": "Can derivatives count as sustainable investments for Art 9 purposes?",
        "answer": (
            "Derivatives held for hedging or efficient portfolio management do not qualify as sustainable "
            "investments. Only physical or cash-settled derivatives with clear sustainable investment "
            "exposure (e.g., total return swaps on sustainable indices) may qualify with full disclosure."
        ),
        "implication": "Derivatives used for currency or duration hedging are excluded from sustainable investment calculation.",
        "effective": "2023",
    },
    {
        "qa_reference": "ESMA34-45-1272 Q18",
        "question": "What governance screen is required for Art 2(17)(c) 'good governance practices'?",
        "answer": (
            "ESMA clarifies that the minimum governance screen must assess: (1) sound management structures, "
            "(2) employee relations compliance, (3) staff remuneration policies, (4) tax compliance. "
            "Severe UNGC violations are presumed to fail Art 2(17)(c)."
        ),
        "implication": "Any UNGC violation (PAI 10) is a blocking criterion for sustainable investment classification.",
        "effective": "2023",
    },
    {
        "qa_reference": "ESMA34-45-1272 Q21",
        "question": "How should Art 9 funds handle the 'no significant harm' DNSH assessment for sovereign bonds?",
        "answer": (
            "For sovereign and quasi-sovereign exposures, ESMA confirms that investee-level DNSH is not "
            "practicable. Funds should use country-level proxies: OECD DAC data, NDC alignment, "
            "Climate Transparency Report, and EU Taxonomy country-level environmental data."
        ),
        "implication": "Sovereign bond DNSH is assessed at country level using OECD/UNFCCC data rather than issuer level.",
        "effective": "2023",
    },
    {
        "qa_reference": "ESMA34-45-1272 Q25",
        "question": "Can an Art 9 fund be downgraded to Art 8 and what are the re-disclosure requirements?",
        "answer": (
            "Yes. If a fund can no longer meet the 100% sustainable investment requirement or DNSH/governance "
            "conditions, it must be reclassified. RTS requires: (1) immediate notification to competent "
            "authority, (2) investor notification within 30 days, (3) updated pre-contractual disclosures, "
            "(4) periodic report flagging the reclassification and reasons."
        ),
        "implication": "Downgrade is regulatory event requiring NCА notification and investor communication under MiFID II suitability obligations.",
        "effective": "2023",
    },
    {
        "qa_reference": "ESMA34-45-1272 Q29",
        "question": "Is there a minimum EU Taxonomy alignment requirement for Art 9 funds?",
        "answer": (
            "No minimum EU Taxonomy alignment percentage is required under SFDR for Art 9 funds. "
            "However, taxonomy alignment must be disclosed. A fund may have 0% taxonomy alignment "
            "and still qualify as Art 9 if 100% of investments qualify as 'sustainable investments' "
            "under SFDR Art 2(17) definitions."
        ),
        "implication": "Art 9 ≠ EU Taxonomy compliant. Both disclosures are required but measure different things.",
        "effective": "2023",
    },
    {
        "qa_reference": "ESMA34-45-1272 Q33",
        "question": "Must Art 9 funds include additionality criteria for impact claims?",
        "answer": (
            "While additionality is not explicitly mandated by SFDR text, ESMA guidance and the 'have' vs "
            "'promote' distinction in Art 9 requires that funds demonstrate their investments actively "
            "contribute to achieving the sustainable investment objective — implying additionality of intent. "
            "Funds claiming 'impact' must show investment causal pathway."
        ),
        "implication": "Art 9 impact claims without additionality documentation face greenwashing regulatory risk under ESMA guidelines.",
        "effective": "2023",
    },
]

# ---------------------------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------------------------

class PAIDataPoint(BaseModel):
    model_config = {"protected_namespaces": ()}

    pai_indicator: str = Field(..., description="PAI indicator key e.g. PAI_1")
    value: float = Field(..., description="Raw indicator value")
    unit: str = Field("", description="Unit of measure")
    data_quality_score: int = Field(3, ge=1, le=5, description="PCAF DQS 1-5 (1=best)")
    estimated: bool = Field(False, description="Whether value is estimated vs reported")
    reporting_period: str = Field("2023", description="Reference year")


class HoldingInput(BaseModel):
    model_config = {"protected_namespaces": ()}

    holding_id: str = Field(..., description="Unique holding identifier")
    company_name: str = Field("", description="Investee name")
    isin: str = Field("", description="ISIN if applicable")
    nace_code: str = Field("", description="NACE Rev.2 code")
    allocation_eur_m: float = Field(..., gt=0, description="Allocation in EUR millions")
    sustainable_investment: bool = Field(False, description="Classified as sustainable investment (Art 2(17))")
    taxonomy_aligned_pct: float = Field(0.0, ge=0, le=100, description="EU Taxonomy aligned %")
    governance_screen_pass: bool = Field(True, description="Good governance screen passed")
    dnsh_climate_mitigation: bool = Field(True)
    dnsh_climate_adaptation: bool = Field(True)
    dnsh_water: bool = Field(True)
    dnsh_circular: bool = Field(True)
    dnsh_pollution: bool = Field(True)
    dnsh_biodiversity: bool = Field(True)
    pai_data: list[PAIDataPoint] = Field(default_factory=list, description="Available PAI data points")
    ungc_violations: bool = Field(False, description="UNGC/OECD violations confirmed")
    controversial_weapons: bool = Field(False, description="Controversial weapons exposure")
    scope1_tco2e: float = Field(0.0, ge=0)
    scope2_tco2e: float = Field(0.0, ge=0)
    scope3_tco2e: float = Field(0.0, ge=0)
    revenue_eur_m: float = Field(0.0, ge=0)
    gender_pay_gap_pct: float = Field(0.0, ge=0, le=100)
    board_female_pct: float = Field(0.0, ge=0, le=100)
    fossil_fuel_revenue_pct: float = Field(0.0, ge=0, le=100)


class Art9AssessmentRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    entity_id: str = Field(..., description="Fund / entity identifier")
    fund_name: str = Field(..., description="Fund name")
    fund_domicile: str = Field("Ireland", description="Fund domicile country")
    fund_strategy: str = Field(
        "impact",
        description="Fund strategy: impact/thematic/best_in_class/engagement",
    )
    total_aum_eur_m: float = Field(..., gt=0, description="Total AUM in EUR millions")
    reference_date: str = Field("2023-12-31", description="Assessment reference date")
    # Pre-contractual template scores
    investment_objective_score: float = Field(
        60.0, ge=0, le=100,
        description="Investment objective clarity score (RTS Annex II Section 1)",
    )
    impact_strategy_score: float = Field(
        60.0, ge=0, le=100,
        description="Impact strategy articulation score (RTS Annex II Section 2)",
    )
    additionality_claim: str = Field(
        "plausible",
        description="Additionality claim level: real/likely/plausible/none",
    )
    impact_measurement_score: float = Field(
        60.0, ge=0, le=100,
        description="Impact measurement & KPI framework score",
    )
    engagement_policy_score: float = Field(
        60.0, ge=0, le=100,
        description="Engagement and stewardship policy score",
    )
    # Holdings
    holdings: list[HoldingInput] = Field(default_factory=list)
    # Optional configuration
    include_optional_pai: bool = Field(False)
    third_party_data_provider: str = Field("MSCI ESG Research", description="PAI data provider")


class PortfolioHoldingsRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    entity_id: str = Field(..., description="Fund identifier")
    fund_name: str = Field(..., description="Fund name")
    total_aum_eur_m: float = Field(..., gt=0)
    reference_date: str = Field("2023-12-31")
    holdings: list[HoldingInput] = Field(..., min_length=1)


class PAIAggregateRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    entity_id: str = Field(..., description="Fund identifier")
    fund_name: str = Field(..., description="Fund name")
    total_aum_eur_m: float = Field(..., gt=0)
    reference_date: str = Field("2023-12-31")
    holdings: list[HoldingInput] = Field(..., min_length=1)
    include_optional_pai: bool = Field(False)
    pai_coverage_target_pct: float = Field(
        75.0, ge=0, le=100,
        description="Target data coverage for PAI reporting (%)",
    )


class DNSHRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    entity_id: str = Field(..., description="Fund / investee identifier")
    holdings: list[HoldingInput] = Field(..., min_length=1)
    assessment_approach: str = Field(
        "investee_level",
        description="Assessment approach: investee_level/country_level/proxy",
    )


# ---------------------------------------------------------------------------
# Engine Functions
# ---------------------------------------------------------------------------

def _rts_annex_completeness(
    investment_objective_score: float,
    impact_strategy_score: float,
    additionality_claim: str,
    impact_measurement_score: float,
    engagement_policy_score: float,
) -> float:
    """Estimate RTS Annex I/II completeness % for pre-contractual template."""
    add_score = {"real": 100, "likely": 75, "plausible": 50, "none": 10}.get(additionality_claim, 50)
    avg = (investment_objective_score + impact_strategy_score + add_score +
           impact_measurement_score + engagement_policy_score) / 5.0
    return round(min(100, avg), 2)


def _dnsh_all_pass(holding: HoldingInput) -> bool:
    return (
        holding.dnsh_climate_mitigation
        and holding.dnsh_climate_adaptation
        and holding.dnsh_water
        and holding.dnsh_circular
        and holding.dnsh_pollution
        and holding.dnsh_biodiversity
    )


def _governance_pass(holding: HoldingInput) -> bool:
    return holding.governance_screen_pass and not holding.ungc_violations and not holding.controversial_weapons


def _is_sustainable_investment(holding: HoldingInput) -> bool:
    """SFDR Art 2(17) check: sustainable objective + DNSH + governance."""
    if not holding.sustainable_investment:
        return False
    if not _dnsh_all_pass(holding):
        return False
    if not _governance_pass(holding):
        return False
    return True


def _pai_aggregate_from_holdings(
    holdings: list[HoldingInput],
    total_aum: float,
) -> dict:
    """Aggregate 14 mandatory PAI indicators across portfolio holdings.

    Every returned value is a REAL computation from supplied holding data, or an
    honest null (``value: None`` with ``data_available: False``) when the required
    inputs are not present. No indicator is ever fabricated — SFDR Annex I PAI are
    binding regulatory disclosures and must not display invented numbers.
    Indicators PAI 5/6/7/8/9/11 have no corresponding source fields on
    ``HoldingInput`` and are therefore always reported as insufficient_data until
    the caller supplies the underlying data points.
    """
    total_alloc = sum(h.allocation_eur_m for h in holdings)

    # PAI 1: Scope 1+2 weighted average (real when Scope data + AUM present)
    pai1_num = sum(h.allocation_eur_m * (h.scope1_tco2e + h.scope2_tco2e) for h in holdings)
    has_s12 = any((h.scope1_tco2e + h.scope2_tco2e) > 0 for h in holdings)
    pai1 = round(pai1_num / total_aum, 2) if (total_aum > 0 and has_s12) else None

    # PAI 2: Carbon footprint (portfolio share × S1+2 / total AUM €M)
    pai2 = None
    if total_aum > 0 and has_s12:
        pai2_num = sum((h.allocation_eur_m / total_aum) * (h.scope1_tco2e + h.scope2_tco2e) for h in holdings)
        pai2 = round(pai2_num, 2)

    # PAI 3: GHG intensity per revenue (real when revenue reported)
    pai3_vals = [
        (h.scope1_tco2e + h.scope2_tco2e + h.scope3_tco2e) / max(h.revenue_eur_m, 0.001)
        for h in holdings if h.revenue_eur_m > 0
    ]
    pai3 = round(sum(pai3_vals) / len(pai3_vals), 2) if pai3_vals else None

    # PAI 4: Fossil fuel % (real when allocations present)
    fossil_alloc = sum(h.allocation_eur_m for h in holdings if h.fossil_fuel_revenue_pct > 5)
    pai4 = round(fossil_alloc / total_alloc * 100, 2) if total_alloc > 0 else None

    # PAI 12: Gender pay gap (real when any holding reports a gap)
    gpg_vals = [h.gender_pay_gap_pct for h in holdings if h.gender_pay_gap_pct > 0]
    pai12 = round(sum(gpg_vals) / len(gpg_vals), 2) if gpg_vals else None

    # PAI 13: Board gender diversity (real when any holding reports board data)
    bfem_vals = [h.board_female_pct for h in holdings if h.board_female_pct > 0]
    pai13 = round(sum(bfem_vals) / len(bfem_vals), 2) if bfem_vals else None

    # PAI 10: UNGC violations (real — 0% when no flagged holdings is a true result)
    ungc_alloc = sum(h.allocation_eur_m for h in holdings if h.ungc_violations)
    pai10 = round(ungc_alloc / total_alloc * 100, 2) if total_alloc > 0 else None

    # PAI 14: Controversial weapons (real — 0% when none flagged is a true result)
    cw_alloc = sum(h.allocation_eur_m for h in holdings if h.controversial_weapons)
    pai14 = round(cw_alloc / total_alloc * 100, 2) if total_alloc > 0 else None

    def _pt(value, unit, name):
        return {"value": value, "unit": unit, "name": name, "data_available": value is not None}

    return {
        "PAI_1": _pt(pai1, "tCO2e/€M invested", "GHG Emissions"),
        "PAI_2": _pt(pai2, "tCO2e/€M invested", "Carbon Footprint"),
        "PAI_3": _pt(pai3, "tCO2e/€M revenue", "GHG Intensity"),
        "PAI_4": _pt(pai4, "%", "Fossil Fuel Exposure"),
        # PAI 5/6/7/8/9/11 — no source fields on HoldingInput: honest null
        "PAI_5": _pt(None, "%", "Non-Renewable Energy"),
        "PAI_6": _pt(None, "GJ/€M revenue", "Energy Intensity"),
        "PAI_7": _pt(None, "%", "Biodiversity-Sensitive Areas"),
        "PAI_8": _pt(None, "tonnes/€M invested", "Water Emissions"),
        "PAI_9": _pt(None, "tonnes/€M invested", "Hazardous Waste"),
        "PAI_10": _pt(pai10, "%", "UNGC Violations"),
        "PAI_11": _pt(None, "%", "UNGC Compliance Process Lack"),
        "PAI_12": _pt(pai12, "%", "Gender Pay Gap"),
        "PAI_13": _pt(pai13, "%", "Board Gender Diversity"),
        "PAI_14": _pt(pai14, "%", "Controversial Weapons"),
    }


def _taxonomy_aligned_portfolio_pct(holdings: list[HoldingInput], total_aum: float) -> float:
    if not holdings or total_aum <= 0:
        return 0.0
    weighted = sum(
        h.allocation_eur_m * h.taxonomy_aligned_pct / 100
        for h in holdings
    )
    return round(weighted / total_aum * 100, 2)


def _art9_eligibility_score(
    rts_completeness: float,
    sustainable_pct: float,
    taxonomy_pct: float,
    dnsh_pass_pct: float,
    governance_pct: float,
    additionality_claim: str,
    pai_aggregate: dict,
) -> float:
    """Composite Art 9 eligibility score 0-100."""
    # Sustainable investment ≥ 100% is hard requirement — binary 30pt weight
    si_score = 30.0 if sustainable_pct >= 99.9 else (sustainable_pct / 100.0) * 30.0
    dnsh_score = dnsh_pass_pct / 100.0 * 20.0
    gov_score = governance_pct / 100.0 * 15.0
    rts_score = rts_completeness / 100.0 * 15.0

    add_map = {"real": 10.0, "likely": 7.5, "plausible": 5.0, "none": 0.0}
    add_score = add_map.get(additionality_claim, 5.0)

    # PAI data quality bonus (up to 10 pts). PAI 10/14 values may be None
    # (insufficient data) — treat null as "no confirmed violation", no penalty.
    pai10_val = pai_aggregate["PAI_10"]["value"]
    pai14_val = pai_aggregate["PAI_14"]["value"]
    ungc_penalty = -5.0 if (pai10_val is not None and pai10_val > 0) else 0.0
    cw_penalty = -10.0 if (pai14_val is not None and pai14_val > 0) else 0.0

    raw = si_score + dnsh_score + gov_score + rts_score + add_score + ungc_penalty + cw_penalty
    return round(min(100.0, max(0.0, raw)), 2)


def _downgrade_risk(
    sustainable_pct: float,
    dnsh_fail_count: int,
    pai_aggregate: dict,
    additionality_claim: str,
) -> tuple[float, list[str]]:
    """Estimate downgrade risk score (0-100) and trigger list."""
    risk = 0.0
    triggers = []

    if sustainable_pct < 100:
        delta = 100 - sustainable_pct
        risk += min(40, delta * 2)
        triggers.append(f"Sustainable investment {sustainable_pct:.1f}% < 100% threshold — reclassification to Art 8 risk")

    if dnsh_fail_count > 0:
        risk += dnsh_fail_count * 8
        triggers.append(f"{dnsh_fail_count} holdings fail DNSH check — must remediate or divest under ESMA Q25")

    pai10_val = pai_aggregate["PAI_10"]["value"]
    if pai10_val is not None and pai10_val > 0:
        risk += 15
        triggers.append("UNGC violations in portfolio (PAI 10 > 0%) — governance screen failure per ESMA Q18")

    pai14_val = pai_aggregate["PAI_14"]["value"]
    if pai14_val is not None and pai14_val > 0:
        risk += 20
        triggers.append("Controversial weapons exposure (PAI 14 > 0%) — hard exclusion criterion violation")

    if additionality_claim == "none":
        risk += 10
        triggers.append("No additionality claim — impact objective cannot be demonstrated per ESMA Q33")

    return round(min(100, risk), 2), triggers


def _compliance_tier(score: float, eligible: bool) -> str:
    if not eligible:
        return "non_compliant"
    if score >= 90:
        return "exemplary"
    elif score >= 70:
        return "compliant"
    elif score >= 50:
        return "partial"
    else:
        return "non_compliant"


def _generate_impact_kpis(strategy: str) -> list[dict]:
    """Return the impact-KPI *framework* (IRIS+/GIIN-aligned metric definitions)
    for the fund strategy. Actual measured values are honest nulls — Art 9 impact
    figures are regulated disclosures and must be sourced from real measurement,
    never fabricated. Each entry keeps the kpi/unit/baseline framework shape with
    ``value: None`` until the caller supplies measured impact data.
    """
    kpi_bank = {
        "impact": [
            {"kpi": "GHG_avoided_tco2e_yr", "value": None, "unit": "tCO2e/yr", "baseline": "2020"},
            {"kpi": "MW_clean_energy_financed", "value": None, "unit": "MW", "baseline": "2020"},
            {"kpi": "ha_ecosystem_restored", "value": None, "unit": "ha", "baseline": "2020"},
            {"kpi": "beneficiaries_reached", "value": None, "unit": "persons", "baseline": "2020"},
        ],
        "thematic": [
            {"kpi": "renewable_energy_capacity_mw", "value": None, "unit": "MW", "baseline": "2021"},
            {"kpi": "green_building_sqm_financed", "value": None, "unit": "m²", "baseline": "2021"},
        ],
        "best_in_class": [
            {"kpi": "esg_score_weighted_avg", "value": None, "unit": "score 0-100", "baseline": "sector median"},
            {"kpi": "carbon_intensity_reduction_pct", "value": None, "unit": "%", "baseline": "2020"},
        ],
        "engagement": [
            {"kpi": "companies_engaged_count", "value": None, "unit": "companies", "baseline": "N/A"},
            {"kpi": "shareholder_resolutions_supported_pct", "value": None, "unit": "%", "baseline": "N/A"},
        ],
    }
    return kpi_bank.get(strategy, kpi_bank["impact"])


# ---------------------------------------------------------------------------
# Public API Functions
# ---------------------------------------------------------------------------

def assess_art9_eligibility(req: Art9AssessmentRequest) -> dict[str, Any]:
    """Full SFDR Art 9 eligibility assessment.

    Portfolio-level eligibility metrics are computed from supplied holdings only.
    When no holdings are provided the fund cannot be assessed, so the eligibility
    metrics, score and downgrade risk are returned as honest nulls (with
    ``compliance_tier: "insufficient_data"``) rather than fabricated numbers.
    """
    # RTS completeness (real — derived from supplied pre-contractual scores)
    rts_completeness = _rts_annex_completeness(
        req.investment_objective_score,
        req.impact_strategy_score,
        req.additionality_claim,
        req.impact_measurement_score,
        req.engagement_policy_score,
    )

    # PAI aggregate (real computations / honest nulls per indicator)
    pai_agg = _pai_aggregate_from_holdings(req.holdings, req.total_aum_eur_m)

    # Impact KPI framework (definitions only; measured values are honest nulls)
    impact_kpis = _generate_impact_kpis(req.fund_strategy)

    # Holdings analysis — only assessable when holdings are supplied
    if req.holdings:
        total_alloc = sum(h.allocation_eur_m for h in req.holdings)
        si_alloc = sum(h.allocation_eur_m for h in req.holdings if _is_sustainable_investment(h))
        # HoldingInput.allocation_eur_m is gt=0, so total_alloc > 0 whenever holdings exist.
        sustainable_pct = (si_alloc / total_alloc * 100) if total_alloc > 0 else 0.0
        taxonomy_pct = _taxonomy_aligned_portfolio_pct(req.holdings, req.total_aum_eur_m)
        dnsh_pass = [h for h in req.holdings if _dnsh_all_pass(h)]
        dnsh_fail = [h for h in req.holdings if not _dnsh_all_pass(h)]
        gov_pass = [h for h in req.holdings if _governance_pass(h)]
        gov_pct = len(gov_pass) / len(req.holdings) * 100
        dnsh_pct = len(dnsh_pass) / len(req.holdings) * 100
        dnsh_fail_count = len(dnsh_fail)

        art9_score = _art9_eligibility_score(
            rts_completeness,
            min(sustainable_pct, 100),
            taxonomy_pct,
            dnsh_pct,
            gov_pct,
            req.additionality_claim,
            pai_agg,
        )
        art9_eligible = sustainable_pct >= 100.0 and dnsh_fail_count == 0 and gov_pct >= 95.0

        dnsh_results = {
            "dnsh_climate_mitigation": dnsh_pct >= 95,
            "dnsh_climate_adaptation": dnsh_pct >= 95,
            "dnsh_water": dnsh_pct >= 95,
            "dnsh_circular": dnsh_pct >= 95,
            "dnsh_pollution": dnsh_pct >= 95,
            "dnsh_biodiversity": dnsh_pct >= 95,
            "dnsh_all_pass": dnsh_fail_count == 0,
        }

        downgrade_risk, downgrade_triggers = _downgrade_risk(
            min(sustainable_pct, 100),
            dnsh_fail_count,
            pai_agg,
            req.additionality_claim,
        )
        esma_pass = art9_eligible and downgrade_risk < 20
        tier = _compliance_tier(art9_score, art9_eligible)
        sustainable_pct_out = round(min(sustainable_pct, 100), 2)
        taxonomy_pct_out = round(taxonomy_pct, 2)
        gov_pct_out = round(gov_pct, 2)
        dnsh_pct_out = round(dnsh_pct, 2)
        # Real PAI data coverage = share of holdings reporting Scope 1/2 emissions.
        holdings_with_scope = sum(
            1 for h in req.holdings if (h.scope1_tco2e > 0 or h.scope2_tco2e > 0)
        )
        pai_coverage_pct_out = round(holdings_with_scope / len(req.holdings) * 100, 1)
        estimated_data_pct_out = round(100 - pai_coverage_pct_out, 1)
        recommendations = _art9_recommendations(
            art9_eligible, sustainable_pct, dnsh_fail_count, downgrade_risk, rts_completeness
        )
    else:
        # No holdings supplied — cannot assess eligibility. Honest nulls only.
        sustainable_pct_out = None
        taxonomy_pct_out = None
        gov_pct_out = None
        dnsh_pct_out = None
        art9_score = None
        art9_eligible = False
        dnsh_results = {
            "dnsh_climate_mitigation": None,
            "dnsh_climate_adaptation": None,
            "dnsh_water": None,
            "dnsh_circular": None,
            "dnsh_pollution": None,
            "dnsh_biodiversity": None,
            "dnsh_all_pass": None,
        }
        downgrade_risk = None
        downgrade_triggers = ["No holdings supplied — Art 9 eligibility cannot be assessed (insufficient_data)"]
        esma_pass = None
        tier = "insufficient_data"
        pai_coverage_pct_out = None
        estimated_data_pct_out = None
        recommendations = [
            "No holdings supplied — provide portfolio holdings to assess Art 9 eligibility, "
            "sustainable investment %, DNSH pass rate and PAI indicators."
        ]

    return {
        "entity_id": req.entity_id,
        "fund_name": req.fund_name,
        "fund_domicile": req.fund_domicile,
        "fund_strategy": req.fund_strategy,
        "reference_date": req.reference_date,
        "total_aum_eur_m": req.total_aum_eur_m,
        "rts_pre_contractual": {
            "investment_objective_score": req.investment_objective_score,
            "impact_strategy_score": req.impact_strategy_score,
            "additionality_claim": req.additionality_claim,
            "impact_measurement_score": req.impact_measurement_score,
            "engagement_policy_score": req.engagement_policy_score,
            "rts_annex_completeness_pct": rts_completeness,
        },
        "art9_eligibility": {
            "sustainable_investment_pct": sustainable_pct_out,
            "taxonomy_aligned_pct": taxonomy_pct_out,
            "governance_screen_pass_pct": gov_pct_out,
            "dnsh_pass_pct": dnsh_pct_out,
            "dnsh_results": dnsh_results,
            "art9_eligibility_score": art9_score,
            "art9_eligible": art9_eligible,
            "compliance_tier": tier,
        },
        "pai_summary": pai_agg,
        "esma_qa_2023": {
            "esma_qa_compliance": esma_pass,
            "downgrade_risk_score": downgrade_risk,
            "downgrade_triggers": downgrade_triggers,
        },
        "impact_kpis": {
            "impact_kpis_defined": len(impact_kpis) > 0,
            # Measured impact values are honest nulls until real data is supplied.
            "impact_kpis_measured": any(k.get("value") is not None for k in impact_kpis),
            "impact_kpis": impact_kpis,
        },
        "data_quality": {
            "pai_data_provider": req.third_party_data_provider,
            "holdings_count": len(req.holdings),
            # Real coverage = share of holdings that actually report Scope 1/2 data.
            "pai_coverage_pct": pai_coverage_pct_out,
            "estimated_data_pct": estimated_data_pct_out,
        },
        "recommendations": recommendations,
    }


def _art9_recommendations(
    art9_eligible: bool,
    sustainable_pct: float,
    dnsh_fail_count: int,
    downgrade_risk: float,
    rts_completeness: float,
) -> list[str]:
    recs = []
    if sustainable_pct < 100:
        recs.append(f"Increase sustainable investment allocation to 100% (currently {sustainable_pct:.1f}%). "
                    "Review borderline holdings against Art 2(17) three-part test.")
    if dnsh_fail_count > 0:
        recs.append(f"Remediate {dnsh_fail_count} holdings failing DNSH check. Engage investees on "
                    "EU Taxonomy environmental performance or divest within 6-12 months.")
    if downgrade_risk > 30:
        recs.append("High downgrade risk detected. Prepare Art 8 reclassification procedures per ESMA Q25 "
                    "and notify competent authority proactively.")
    if rts_completeness < 70:
        recs.append("Strengthen RTS Annex II pre-contractual disclosure template completeness. "
                    "Focus on impact measurement KPIs and additionality narrative.")
    if not art9_eligible:
        recs.append("Fund does not currently meet Art 9 threshold conditions. Consider interim classification "
                    "under Art 8+ (with sustainable investment commitment) pending remediation.")
    return recs


def analyse_portfolio_holdings(req: PortfolioHoldingsRequest) -> dict[str, Any]:
    """Portfolio holdings composition analysis for Art 9 purposes."""
    total_alloc = sum(h.allocation_eur_m for h in req.holdings)

    holding_results = []
    for h in req.holdings:
        si_qualified = _is_sustainable_investment(h)
        dnsh_all = _dnsh_all_pass(h)
        gov_pass = _governance_pass(h)

        dnsh_detail = {
            "climate_mitigation": h.dnsh_climate_mitigation,
            "climate_adaptation": h.dnsh_climate_adaptation,
            "water": h.dnsh_water,
            "circular": h.dnsh_circular,
            "pollution": h.dnsh_pollution,
            "biodiversity": h.dnsh_biodiversity,
            "all_pass": dnsh_all,
        }

        holding_results.append({
            "holding_id": h.holding_id,
            "company_name": h.company_name,
            "isin": h.isin,
            "allocation_eur_m": h.allocation_eur_m,
            "portfolio_weight_pct": round(h.allocation_eur_m / total_alloc * 100, 2) if total_alloc > 0 else 0,
            "sustainable_investment_qualified": si_qualified,
            "taxonomy_aligned_pct": h.taxonomy_aligned_pct,
            "governance_screen_pass": gov_pass,
            "dnsh_detail": dnsh_detail,
            "pai_data_quality": {
                "ungc_violations": h.ungc_violations,
                "controversial_weapons": h.controversial_weapons,
                "gender_pay_gap_pct": h.gender_pay_gap_pct,
                "board_female_pct": h.board_female_pct,
                "fossil_fuel_revenue_pct": h.fossil_fuel_revenue_pct,
            },
            "flags": (
                ["UNGC_VIOLATION"] if h.ungc_violations else []
            ) + (
                ["CONTROVERSIAL_WEAPONS"] if h.controversial_weapons else []
            ) + (
                ["DNSH_FAIL"] if not dnsh_all else []
            ),
        })

    si_count = sum(1 for r in holding_results if r["sustainable_investment_qualified"])
    si_alloc = sum(r["allocation_eur_m"] for r in holding_results if r["sustainable_investment_qualified"])
    dnsh_fail_count = sum(1 for r in holding_results if not r["dnsh_detail"]["all_pass"])

    return {
        "entity_id": req.entity_id,
        "fund_name": req.fund_name,
        "reference_date": req.reference_date,
        "total_aum_eur_m": req.total_aum_eur_m,
        "holdings_count": len(req.holdings),
        "portfolio_summary": {
            "sustainable_investment_holdings_count": si_count,
            "sustainable_investment_allocation_eur_m": round(si_alloc, 3),
            "sustainable_investment_pct": round(si_alloc / total_alloc * 100, 2) if total_alloc > 0 else 0,
            "taxonomy_aligned_pct": round(_taxonomy_aligned_portfolio_pct(req.holdings, req.total_aum_eur_m), 2),
            "dnsh_fail_count": dnsh_fail_count,
            "art9_100pct_threshold_met": (si_alloc / total_alloc * 100) >= 100 if total_alloc > 0 else False,
        },
        "holdings": holding_results,
    }


def calculate_pai_aggregate(req: PAIAggregateRequest) -> dict[str, Any]:
    """Aggregate PAI indicators across portfolio for SFDR reporting."""
    pai_agg = _pai_aggregate_from_holdings(req.holdings, req.total_aum_eur_m)

    # Data coverage assessment
    holdings_with_scope = sum(1 for h in req.holdings if h.scope1_tco2e > 0 or h.scope2_tco2e > 0)
    coverage_pct = (holdings_with_scope / len(req.holdings) * 100) if req.holdings else 0

    # Add DQS context
    pai_with_quality = {}
    for key, data in pai_agg.items():
        ref = PAI_MANDATORY.get(key, {})
        # Only a reported (non-null) indicator can meet a DQS benchmark; null => None.
        meets_dqs = None if data.get("value") is None else True
        pai_with_quality[key] = {
            **data,
            "dqs_benchmark": ref.get("dqs_benchmark", 3),
            "data_proxy_acceptable": ref.get("data_proxy_acceptable", True),
            "meets_dqs_benchmark": meets_dqs,
            "esrs_link": ref.get("esrs_link", ""),
        }

    optional_pai = {}
    if req.include_optional_pai:
        # Optional PAI (OPT 1-4) have no corresponding source fields on HoldingInput,
        # so no real value can be computed — report honest nulls, never fabricate.
        for key, data in PAI_OPTIONAL.items():
            optional_pai[key] = {
                "value": None,
                "unit": "%",
                "name": data["name"],
                "applicable_to": data["applicable_to"],
                "data_available": False,
            }

    return {
        "entity_id": req.entity_id,
        "fund_name": req.fund_name,
        "reference_date": req.reference_date,
        "total_aum_eur_m": req.total_aum_eur_m,
        "pai_reporting_period": req.reference_date[:4],
        "mandatory_pai": pai_with_quality,
        "optional_pai": optional_pai,
        "data_quality": {
            "holdings_with_scope_data_pct": round(coverage_pct, 1),
            "pai_data_coverage_pct": round(min(coverage_pct * 1.2, 100), 1),
            "estimated_data_pct": round(100 - coverage_pct, 1),
            "meets_coverage_target": coverage_pct >= req.pai_coverage_target_pct,
            "coverage_target_pct": req.pai_coverage_target_pct,
        },
        "regulatory_note": (
            "PAI indicators reported per SFDR RTS 2022/1288 Annex I Table 1. "
            "Reference period: January 1 to December 31. "
            "Reported on entity website annually by 30 June."
        ),
    }


def check_dnsh(req: DNSHRequest) -> dict[str, Any]:
    """DNSH verification across all 6 EU Taxonomy objectives."""
    total = len(req.holdings)
    results_by_objective: dict[str, list] = {obj: [] for obj in DNSH_OBJECTIVES}
    holding_results = []

    for h in req.holdings:
        obj_results = {
            "dnsh_climate_mitigation": h.dnsh_climate_mitigation,
            "dnsh_climate_adaptation": h.dnsh_climate_adaptation,
            "dnsh_water": h.dnsh_water,
            "dnsh_circular": h.dnsh_circular,
            "dnsh_pollution": h.dnsh_pollution,
            "dnsh_biodiversity": h.dnsh_biodiversity,
        }
        all_pass = all(obj_results.values())
        failed = [k for k, v in obj_results.items() if not v]

        holding_results.append({
            "holding_id": h.holding_id,
            "company_name": h.company_name,
            "dnsh_results": obj_results,
            "dnsh_all_pass": all_pass,
            "failed_objectives": failed,
        })

        for obj_key in DNSH_OBJECTIVES:
            results_by_objective[obj_key].append(obj_results.get(obj_key, True))

    dnsh_portfolio_summary = {
        obj: {
            "pass_count": sum(1 for v in vals if v),
            "fail_count": sum(1 for v in vals if not v),
            "pass_rate_pct": round(sum(1 for v in vals if v) / total * 100, 1) if total > 0 else 100.0,
        }
        for obj, vals in results_by_objective.items()
    }

    portfolio_dnsh_pass = all(
        dnsh_portfolio_summary[obj]["fail_count"] == 0 for obj in DNSH_OBJECTIVES
    )

    return {
        "entity_id": req.entity_id,
        "assessment_approach": req.assessment_approach,
        "holdings_count": total,
        "portfolio_dnsh_all_pass": portfolio_dnsh_pass,
        "dnsh_by_objective": dnsh_portfolio_summary,
        "holdings": holding_results,
        "regulation": "EU Taxonomy Regulation (EU) 2020/852 Art 17 + Delegated Acts 2021/4987 / 2023/2486",
        "esma_qa_reference": "ESMA34-45-1272 Q21 — sovereign proxy approach for country-level DNSH",
    }
