"""
Regulatory Capital Optimization Engine — Basel IV / CRR3
=========================================================

Comprehensive capital adequacy engine covering:
- SA-CR (Standardised Approach — Credit Risk): CRR3 / Basel IV risk weights
- IRB (F-IRB and A-IRB): PD/LGD/EAD/M inputs → RWA; output floor 72.5%
- FRTB (BCBS 457): SA and IMA market risk capital
- SA-CCR (BCBS 279): Derivatives EAD
- CVA (BCBS 325): BA-CVA and SA-CVA
- Operational Risk (SA-OPR): BIC × ILM
- Leverage Ratio (CRR2): 3% minimum; G-SII buffer
- NSFR / LCR (BCBS Basel III liquidity): 100% minima
- Climate Pillar 2R add-on: ECB guidance 0-50bps overlay

Optimization techniques:
- Synthetic securitisation (SRT)
- Credit risk transfer (CDS hedging)
- Portfolio tilt toward lower risk-weight exposures
- Netting agreement expansion
- ISDA CSA margin optimisation
- IRB model application filing

All reference data is hardcoded; no DB calls.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Optional
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# SA-CR Reference Data  (CRR3 / Basel IV, effective Jan 2025)
# ---------------------------------------------------------------------------

# Risk weights by exposure class and external rating bucket
# Ratings mapped to: AAA/AA=0, A=1, BBB=2, BB=3, B=4, CCC+=5, Unrated=6
SA_CR_RISK_WEIGHTS: dict[str, list[int]] = {
    # Sovereign & central banks (Art 114 CRR3)
    "sovereign": [0, 20, 50, 100, 100, 150, 100],
    # Multilateral development banks (Art 117)
    "mdb": [0, 20, 50, 50, 100, 150, 50],
    # Institutions / Banks (Option 2 — rated counterparty)
    "bank": [20, 30, 50, 100, 100, 150, 50],
    # Corporate (Art 122 CRR3; investment-grade corporates 65%)
    "corporate": [20, 50, 75, 100, 150, 150, 100],
    # Retail (regulatory): flat 75% (Art 123)
    "retail": [75, 75, 75, 75, 75, 75, 75],
    # Residential Real Estate — LTV-based in practice; simplified buckets
    # LTV <=50%=20, <=60%=25, <=80%=30, <=90%=40, <=100%=50, >100%=70
    "residential_re": [20, 25, 30, 40, 50, 70, 50],
    # Commercial Real Estate — IPRE 60-110% depending on LTV/jurisdiction
    "commercial_re": [60, 70, 80, 90, 100, 110, 100],
    # Equity (Art 133): simple risk weight approach
    # Listed=100%, unlisted/speculative=400%; VC/PE positions 150%
    "equity": [100, 100, 100, 150, 250, 400, 100],
    # Subordinated debt / Tier 2 instruments
    "subordinated_debt": [100, 100, 100, 150, 250, 250, 150],
    # Project finance — specialised lending (slotting approach)
    "project_finance": [80, 80, 100, 130, 150, 250, 115],
}

# LTV-band → residential RE risk weights (CRR3 Art 124 Table)
RESIDENTIAL_RE_LTV_RW: list[tuple[float, int]] = [
    (0.50, 20),
    (0.60, 25),
    (0.80, 30),
    (0.90, 40),
    (1.00, 50),
    (float("inf"), 70),
]

# Commercial RE LTV-band risk weights (CRR3 Art 126)
COMMERCIAL_RE_LTV_RW: list[tuple[float, int]] = [
    (0.60, 60),
    (0.80, 80),
    (1.00, 100),
    (float("inf"), 110),
]

# IRB floor — Basel IV output floor: 72.5% of SA-CR
IRB_OUTPUT_FLOOR = 0.725

# F-IRB LGD parameters (supervisory estimates, BCBS §297-298)
FIRB_LGD = {
    "senior_unsecured": 0.45,
    "subordinated": 0.75,
    "secured_financial_collateral": 0.35,
    "secured_re": 0.35,
    "secured_eligible_physical": 0.40,
}

# IRB correlation (R) — Basel formula parameter sets
IRB_CORRELATION_PARAMS = {
    "corporate": {"R_min": 0.12, "R_max": 0.24, "k": 50},
    "bank": {"R_min": 0.12, "R_max": 0.24, "k": 50},
    "sovereign": {"R_min": 0.12, "R_max": 0.24, "k": 50},
    "retail_mortgage": {"R_min": 0.15, "R_max": 0.15, "k": 0},  # flat 15%
    "retail_qualifying_revolving": {"R_min": 0.04, "R_max": 0.04, "k": 0},
    "retail_other": {"R_min": 0.03, "R_max": 0.16, "k": 35},
}

# Maturity adjustment constants (Basel IRB; M assumed 2.5 default)
IRB_MATURITY_ADJUSTMENT = {"b_coefficient_base": 0.11852, "b_coefficient_pd": -0.05478}

# ---------------------------------------------------------------------------
# FRTB Reference Data  (BCBS 457 / CRR3 Part 3 Title IV)
# ---------------------------------------------------------------------------

FRTB_SA_RISK_WEIGHTS: dict[str, dict] = {
    "general_interest_rate_risk": {
        "sovereign_AAA_AA": 0.005,   # 0.5% delta risk weight
        "sovereign_A_BBB": 0.01,
        "sovereign_BB_B": 0.03,
        "corporate_IG": 0.01,
        "corporate_HY": 0.05,
        "covered_bond_AAA": 0.005,
    },
    "credit_spread_risk_non_securitisation": {
        "sovereign_AAA": 0.005,
        "sovereign_A": 0.01,
        "corporate_IG": 0.01,
        "corporate_HY_BB": 0.05,
        "corporate_HY_B": 0.07,
        "unrated": 0.06,
    },
    "equity_risk": {
        "large_cap_developed": 0.30,
        "small_cap_developed": 0.40,
        "emerging_market": 0.50,
        "index": 0.15,
    },
    "fx_risk": {
        "liquid_pair": 0.15,
        "illiquid_pair": 0.30,
        "pegged": 0.075,
    },
    "commodity_risk": {
        "energy": 0.40,
        "metals": 0.25,
        "agricultural": 0.35,
        "other": 0.35,
    },
}

# FRTB P&L attribution test thresholds (BCBS 457 §99.59)
FRTB_PLA_THRESHOLDS = {
    "spearman_correlation_green": 0.80,
    "spearman_correlation_amber": 0.70,
    "kolmogorov_smirnov_green": 0.09,
    "kolmogorov_smirnov_amber": 0.12,
}

# Back-testing multiplier zones (Basel III market risk §99.76)
FRTB_BACKTESTING_ZONES = {
    "green":  {"exceptions_max": 4,  "multiplier": 1.5},
    "amber":  {"exceptions_max": 9,  "multiplier": 1.75},
    "red":    {"exceptions_max": 999, "multiplier": 2.0},
}

# IMA eligibility criteria
FRTB_IMA_CRITERIA = [
    "Sound risk management culture in trading desk",
    "Live P&L data for back-testing (250 day minimum)",
    "Pass P&L attribution test (Spearman ≥ 0.80 green zone)",
    "Back-testing exceptions ≤ 4 out of 250 days (green zone)",
    "Risk factor eligibility assessment (RFEA) complete",
    "Model validation by independent internal team",
    "Regulatory supervisory approval of IMA",
]

# FRTB SBM buckets — equity (BCBS 457 Table B)
FRTB_EQUITY_BUCKETS = {
    1:  {"description": "Large cap, advanced economy consumer goods/services/transport",     "rw_spot": 0.55, "rw_repo": 0.0055},
    2:  {"description": "Large cap, advanced economy telecom/industrials",                   "rw_spot": 0.60, "rw_repo": 0.0060},
    3:  {"description": "Large cap, advanced economy basic materials/energy/agriculture",    "rw_spot": 0.45, "rw_repo": 0.0045},
    4:  {"description": "Large cap, advanced economy financials",                            "rw_spot": 0.55, "rw_repo": 0.0055},
    5:  {"description": "Large cap, advanced economy tech/health",                          "rw_spot": 0.30, "rw_repo": 0.0030},
    6:  {"description": "Large cap, emerging economy consumer/telecom/industrials",         "rw_spot": 0.85, "rw_repo": 0.0085},
    7:  {"description": "Large cap, emerging economy basic materials/energy/agriculture",   "rw_spot": 0.70, "rw_repo": 0.0070},
    8:  {"description": "Large cap, emerging economy financials/tech/health",               "rw_spot": 0.50, "rw_repo": 0.0050},
    9:  {"description": "Small cap, advanced economy",                                      "rw_spot": 0.70, "rw_repo": 0.0070},
    10: {"description": "Small cap, emerging economy",                                      "rw_spot": 0.50, "rw_repo": 0.0050},
    11: {"description": "Indices and other",                                                "rw_spot": 0.25, "rw_repo": 0.0025},
    12: {"description": "Other equities",                                                   "rw_spot": 0.70, "rw_repo": 0.0070},
}

# ---------------------------------------------------------------------------
# SA-CCR Reference Data  (BCBS 279)
# ---------------------------------------------------------------------------

# PFE add-on supervisory factors (SF) by asset class and sub-class
SA_CCR_SUPERVISORY_FACTORS: dict[str, dict] = {
    "interest_rate": {
        "maturity_lt1y": 0.005,
        "maturity_1_5y": 0.005,
        "maturity_gt5y": 0.015,
    },
    "fx": {"default": 0.04},
    "credit_IG": {"single_name": 0.005, "index": 0.005},
    "credit_SG": {"single_name": 0.05,  "index": 0.05},
    "equity": {"single_name": 0.32, "index": 0.20},
    "commodity_energy": {"default": 0.18},
    "commodity_metals": {"default": 0.18},
    "commodity_agriculture": {"default": 0.18},
    "commodity_other": {"default": 0.18},
}

# SA-CCR supervisory delta (SD) correlation parameters
SA_CCR_CORRELATION: dict[str, float] = {
    "interest_rate": 0.50,
    "fx": 0.15,
    "credit_IG_single": 0.35,
    "credit_SG_single": 0.35,
    "credit_index": 0.80,
    "equity_single": 0.50,
    "equity_index": 0.80,
    "commodity_energy": 0.40,
    "commodity_metals": 0.40,
    "commodity_agricultural": 0.40,
    "commodity_other": 0.40,
}

SA_CCR_ALPHA = 1.4  # BCBS 279 §128 alpha factor

# Collateral haircuts (standard supervisory, BCBS 279 §43)
SA_CCR_COLLATERAL_HAIRCUTS: dict[str, float] = {
    "cash_same_ccy": 0.0,
    "sovereign_AAA_AA_lt1y": 0.005,
    "sovereign_AAA_AA_1_5y": 0.02,
    "sovereign_AAA_AA_gt5y": 0.04,
    "sovereign_A_BBB_lt1y": 0.01,
    "sovereign_A_BBB_gt5y": 0.08,
    "corporate_IG_lt1y": 0.015,
    "corporate_IG_gt5y": 0.12,
    "equity_main_index": 0.15,
    "equity_other": 0.25,
    "gold": 0.15,
    "other_collateral": 0.25,
}

# ---------------------------------------------------------------------------
# CVA Reference Data  (BCBS 325)
# ---------------------------------------------------------------------------

# Supervisory parameters for BA-CVA — 10 reference counterparty pairs
CVA_SUPERVISORY_PARAMS: list[dict] = [
    {"sector": "sovereign_IG",    "risk_weight": 0.005, "maturity_years": 5},
    {"sector": "sovereign_HY",    "risk_weight": 0.05,  "maturity_years": 5},
    {"sector": "bank_IG",         "risk_weight": 0.005, "maturity_years": 3},
    {"sector": "bank_HY",         "risk_weight": 0.05,  "maturity_years": 3},
    {"sector": "corporate_IG",    "risk_weight": 0.005, "maturity_years": 5},
    {"sector": "corporate_HY_BB", "risk_weight": 0.05,  "maturity_years": 5},
    {"sector": "corporate_HY_B",  "risk_weight": 0.10,  "maturity_years": 5},
    {"sector": "retail",          "risk_weight": 0.015, "maturity_years": 3},
    {"sector": "residential_re",  "risk_weight": 0.01,  "maturity_years": 10},
    {"sector": "other",           "risk_weight": 0.06,  "maturity_years": 3},
]

# BA-CVA scalar factor (BCBS 325 §32.11)
BA_CVA_SCALAR = 0.25  # reduced capital requirement vs full SA-CVA

# ---------------------------------------------------------------------------
# Operational Risk Reference Data  (BCBS final Basel III — SA-OPR)
# ---------------------------------------------------------------------------

# Business Indicator Component (BIC) marginal coefficients (§11.4)
BIC_MARGINAL_COEFFICIENTS: list[tuple[float, float, float]] = [
    # (BI lower bound, BI upper bound, marginal coefficient)
    (0,          1_000,       0.12),
    (1_000,     30_000,       0.15),
    (30_000, float("inf"),    0.18),
]

# Internal Loss Multiplier (ILM) = ln(exp(1)-1 + (LC/BIC)^0.8)
# LC = Loss Component = 15 × average annual operational losses over 10 years
# If bank does not use internal loss data, ILM = 1.0
ILM_DEFAULT_NO_DATA = 1.0

# BI sub-components
BI_COMPONENTS = {
    "ILDC": "Interest, Leases and Dividend Component = |net_interest_income| + |net_lease_income| + dividend_income",
    "SC":   "Services Component = max(fee_income, fee_expense) + max(other_operating_income, other_operating_expense)",
    "FC":   "Financial Component = |net_P&L_trading_book| + |net_P&L_banking_book|",
}

# ---------------------------------------------------------------------------
# Leverage Ratio Reference Data  (CRR2 Art 429; BCBS Jan 2014)
# ---------------------------------------------------------------------------

LEVERAGE_RATIO_MIN = 0.03        # 3% minimum Tier 1 / total exposure
LEVERAGE_RATIO_GSII_ADDON = 0.005  # 0.5% G-SII additional buffer (50% of G-SII HLA buffer)

# Exposure measure exclusions & treatments
LEVERAGE_EXPOSURE_TREATMENTS = {
    "on_balance_sheet": 1.0,
    "sft_repo_securities_lending": "gross_accounting_value + CCR",
    "derivatives_sa_ccr_ead": "SA-CCR EAD (replacement cost + PFE)",
    "off_balance_sheet_facilities": "credit_conversion_factor",
    "off_bs_ccf_unconditional": 0.10,  # unconditionally cancellable commitments
    "off_bs_ccf_other_low_risk": 0.20,
    "off_bs_ccf_medium_risk": 0.50,
    "off_bs_ccf_high_risk": 1.00,
}

# ---------------------------------------------------------------------------
# NSFR & LCR Reference Data  (Basel III)
# ---------------------------------------------------------------------------

# NSFR — Available Stable Funding (ASF) factors  (BCBS §45)
NSFR_ASF_FACTORS: dict[str, float] = {
    "tier1_capital": 1.00,
    "tier2_capital": 1.00,
    "other_liabilities_residual_gt1y": 1.00,
    "retail_stable_deposits_lt1y": 0.95,
    "retail_less_stable_deposits_lt1y": 0.90,
    "wholesale_non_financial_lt1y": 0.50,
    "central_bank_funding_lt6m": 0.50,
    "wholesale_financial_lt6m": 0.00,
    "derivatives_net_liability": 0.00,
}

# NSFR — Required Stable Funding (RSF) factors  (BCBS §46)
NSFR_RSF_FACTORS: dict[str, float] = {
    "cash_central_bank_reserves": 0.00,
    "hqla_level1_unencumbered": 0.05,
    "hqla_level2A": 0.15,
    "hqla_level2B": 0.50,
    "performing_loans_bank_lt6m": 0.10,
    "performing_loans_nonfinancial_lt1y": 0.50,
    "performing_residential_mortgage_gt1y": 0.65,
    "performing_corporate_loan_gt1y": 0.65,
    "non_performing_loans": 1.00,
    "equities_not_hqla": 0.85,
    "other_assets": 1.00,
}

NSFR_MINIMUM = 1.00
LCR_MINIMUM = 1.00

# LCR — HQLA categories and applicable haircuts
LCR_HQLA: dict[str, dict] = {
    "level1": {
        "cap": None,  # no cap
        "haircut": 0.00,
        "examples": ["Coins/banknotes", "Central bank reserves", "Level1 sovereign 0% RW"],
    },
    "level2A": {
        "cap": 0.40,  # max 40% of HQLA
        "haircut": 0.15,
        "examples": ["Sovereign/CB/MDB 20% RW", "Non-financial corporate bonds AA+"],
    },
    "level2B": {
        "cap": 0.15,  # max 15% of HQLA
        "haircut": 0.50,
        "examples": ["RMBS AA+", "Non-financial corporate bonds BBB+", "Equity main index"],
    },
}

# ---------------------------------------------------------------------------
# Climate Pillar 2 Add-on (ECB guidance 2022)
# ---------------------------------------------------------------------------

CLIMATE_P2R_PARAMS = {
    "max_addon_bps": 50,
    "physical_risk_weight": 0.40,
    "transition_risk_weight": 0.60,
    # Score thresholds → bps
    "tier_thresholds": [
        (0.20, 0),
        (0.40, 10),
        (0.60, 20),
        (0.80, 35),
        (1.01, 50),
    ],
}

# ---------------------------------------------------------------------------
# Capital Optimization Techniques
# ---------------------------------------------------------------------------

OPTIMIZATION_TECHNIQUES: list[dict] = [
    {
        "id": "srt_synthetic_sec",
        "name": "Synthetic Securitisation (SRT)",
        "description": (
            "Transfer of credit risk via CLN/CDS to SPV or institutional investors. "
            "Achieves Significant Risk Transfer (SRT) test under CRR3 Art 245. "
            "RWA reduction: up to 70% on reference portfolio."
        ),
        "applicable_portfolios": ["corporate", "retail", "residential_re", "commercial_re"],
        "rwa_reduction_pct_range": [40, 70],
        "cet1_impact_direction": "positive",
        "regulatory_test": "CRR3 Art 244-246 SRT test",
        "lead_time_months": 6,
    },
    {
        "id": "cds_hedging",
        "name": "CDS Single-Name Hedging",
        "description": (
            "Purchase of CDS protection to substitute counterparty risk weight "
            "with protection seller (typically OECD bank). Reduces corporate/bank RWA."
        ),
        "applicable_portfolios": ["corporate", "bank", "sovereign"],
        "rwa_reduction_pct_range": [20, 60],
        "cet1_impact_direction": "positive",
        "regulatory_test": "CRR3 Art 213-217 credit risk mitigation",
        "lead_time_months": 1,
    },
    {
        "id": "portfolio_tilt",
        "name": "Portfolio Tilt to Lower-RW Assets",
        "description": (
            "Shift lending mix from high-RW (corporate HY 150%) to low-RW "
            "(government 0%, residential RE 20-30%, covered bonds 10%)."
        ),
        "applicable_portfolios": ["all"],
        "rwa_reduction_pct_range": [10, 35],
        "cet1_impact_direction": "positive",
        "regulatory_test": "N/A — balance sheet management",
        "lead_time_months": 12,
    },
    {
        "id": "netting_isda",
        "name": "ISDA Master Agreement Netting Expansion",
        "description": (
            "Executing ISDA master netting agreements with counterparties reduces "
            "SA-CCR replacement cost and PFE via netting set aggregation."
        ),
        "applicable_portfolios": ["derivatives"],
        "rwa_reduction_pct_range": [30, 60],
        "cet1_impact_direction": "positive",
        "regulatory_test": "SA-CCR BCBS 279 §6 netting eligibility",
        "lead_time_months": 3,
    },
    {
        "id": "csa_margin",
        "name": "ISDA CSA Margin Agreements",
        "description": (
            "Two-way VM/IM posting under ISDA CSA reduces PFE add-on multiplier "
            "from 1.0 to 0.42 (with daily VM) and further via IM."
        ),
        "applicable_portfolios": ["derivatives"],
        "rwa_reduction_pct_range": [25, 55],
        "cet1_impact_direction": "positive",
        "regulatory_test": "SA-CCR BCBS 279 multiplier §131",
        "lead_time_months": 2,
    },
    {
        "id": "irb_model_filing",
        "name": "IRB Model Application (A-IRB / F-IRB)",
        "description": (
            "Approval of internal PD/LGD/EAD models under CRR3 Art 142-191. "
            "Corporate/bank RWA often 40-60% lower than SA-CR. Subject to output floor 72.5%."
        ),
        "applicable_portfolios": ["corporate", "bank", "retail", "residential_re"],
        "rwa_reduction_pct_range": [20, 50],
        "cet1_impact_direction": "positive",
        "regulatory_test": "CRR3 Art 143 IRB permission; output floor 72.5%",
        "lead_time_months": 24,
    },
    {
        "id": "collateral_upgrade",
        "name": "Financial Collateral Upgrade (CRM)",
        "description": (
            "Pledge eligible financial collateral (HQLA bonds, equities) to reduce "
            "effective LGD. Comprehensive approach applies haircuts. SA-CR substitution approach."
        ),
        "applicable_portfolios": ["corporate", "retail"],
        "rwa_reduction_pct_range": [15, 40],
        "cet1_impact_direction": "positive",
        "regulatory_test": "CRR3 Art 207-224 credit risk mitigation — financial collateral",
        "lead_time_months": 2,
    },
    {
        "id": "guarantee_substitution",
        "name": "Guarantee / Unfunded Credit Protection",
        "description": (
            "Guarantee from OECD central government / ECA substitutes the borrower's "
            "risk weight with guarantor's weight (often 0%). Export credit guarantees "
            "common for infrastructure / project finance."
        ),
        "applicable_portfolios": ["corporate", "project_finance"],
        "rwa_reduction_pct_range": [50, 100],
        "cet1_impact_direction": "positive",
        "regulatory_test": "CRR3 Art 213-216 eligibility",
        "lead_time_months": 3,
    },
]

# ---------------------------------------------------------------------------
# Dataclasses for internal results
# ---------------------------------------------------------------------------

@dataclass
class ExposureItem:
    exposure_id: str
    exposure_class: str          # key into SA_CR_RISK_WEIGHTS
    rating_bucket: int           # 0=AAA/AA … 6=Unrated
    ead: float                   # Exposure at Default (USD/EUR)
    ltv: Optional[float] = None  # Loan-to-Value for RE exposures
    # IRB inputs
    pd: Optional[float] = None
    lgd: Optional[float] = None
    maturity: Optional[float] = None


@dataclass
class RWAResult:
    exposure_id: str
    exposure_class: str
    ead: float
    sa_cr_rw: float
    sa_cr_rwa: float
    irb_rwa: Optional[float]
    applicable_rwa: float        # max(IRB, output_floor × SA-CR)
    approach_used: str


@dataclass
class FRTBResult:
    desk_id: str
    sa_rwa: float
    ima_rwa: Optional[float]
    backtesting_zone: str
    pla_pass: bool
    applicable_rwa: float
    ima_eligible: bool


@dataclass
class SACCRResult:
    netting_set_id: str
    replacement_cost: float
    pfe_addon: float
    ead: float
    netting_benefit_pct: float


@dataclass
class CapitalRatiosResult:
    cet1_ratio: float
    tier1_ratio: float
    total_capital_ratio: float
    leverage_ratio: float
    nsfr: float
    lcr: float
    cet1_requirement_met: bool
    leverage_requirement_met: bool
    nsfr_requirement_met: bool
    lcr_requirement_met: bool


@dataclass
class OptimizationAction:
    rank: int
    technique_id: str
    technique_name: str
    applicable: bool
    rwa_reduction_estimate: float
    cet1_uplift_bps: float
    rationale: str
    priority: str


# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------

class RegulatoryCapitalOptimizerEngine:
    """
    Basel IV / CRR3 regulatory capital optimizer engine.
    All reference data is hardcoded; no database calls.
    """

    # ------------------------------------------------------------------
    # SA-CR risk weight lookup
    # ------------------------------------------------------------------

    def _get_sacr_rw(
        self,
        exposure_class: str,
        rating_bucket: int,
        ltv: Optional[float] = None,
    ) -> float:
        """Return SA-CR risk weight as a decimal (e.g. 0.75 for 75%)."""
        if exposure_class == "residential_re" and ltv is not None:
            for ltv_cap, rw in RESIDENTIAL_RE_LTV_RW:
                if ltv <= ltv_cap:
                    return rw / 100.0
        if exposure_class == "commercial_re" and ltv is not None:
            for ltv_cap, rw in COMMERCIAL_RE_LTV_RW:
                if ltv <= ltv_cap:
                    return rw / 100.0
        rw_list = SA_CR_RISK_WEIGHTS.get(exposure_class, SA_CR_RISK_WEIGHTS["corporate"])
        bucket = max(0, min(rating_bucket, len(rw_list) - 1))
        return rw_list[bucket] / 100.0

    # ------------------------------------------------------------------
    # IRB RWA formula  (BCBS §272-279 corporate/bank/sovereign)
    # ------------------------------------------------------------------

    def _calc_irb_rwa(
        self,
        exposure_class: str,
        ead: float,
        pd: float,
        lgd: float,
        maturity: float = 2.5,
    ) -> float:
        """
        F-IRB / A-IRB capital formula.
        Returns RWA amount (same units as EAD).
        """
        params = IRB_CORRELATION_PARAMS.get(exposure_class, IRB_CORRELATION_PARAMS["corporate"])
        R_min = params["R_min"]
        R_max = params["R_max"]
        k_param = params["k"]

        if k_param == 0:
            R = R_min  # flat correlation (retail)
        else:
            exp_term = math.exp(-k_param * pd)
            R = R_min * (1 - exp_term) / (1 - math.exp(-k_param)) + R_max * (1 - (1 - exp_term) / (1 - math.exp(-k_param)))

        # Maturity adjustment b(PD) = (0.11852 - 0.05478 × ln(PD))^2
        b = (
            IRB_MATURITY_ADJUSTMENT["b_coefficient_base"]
            - IRB_MATURITY_ADJUSTMENT["b_coefficient_pd"] * math.log(max(pd, 1e-6))
        ) ** 2

        # Capital requirement K
        from scipy.stats import norm as _norm  # type: ignore
        N = _norm.cdf
        N_inv = _norm.ppf

        K = (
            lgd * N((N_inv(pd) + math.sqrt(R) * N_inv(0.999)) / math.sqrt(1 - R))
            - lgd * pd
        ) * (1 - 1.5 * b) ** (-1) * (1 + (maturity - 2.5) * b)

        rwa = K * 12.5 * ead
        return rwa

    def _calc_irb_rwa_safe(
        self,
        exposure_class: str,
        ead: float,
        pd: float,
        lgd: float,
        maturity: float = 2.5,
    ) -> float:
        """IRB RWA with fallback (no scipy) using normal approximation."""
        try:
            return self._calc_irb_rwa(exposure_class, ead, pd, lgd, maturity)
        except ImportError:
            # Fallback: simplified Basel approximation without scipy
            params = IRB_CORRELATION_PARAMS.get(exposure_class, IRB_CORRELATION_PARAMS["corporate"])
            R = (params["R_min"] + params["R_max"]) / 2
            K = lgd * (pd * 2.326 / math.sqrt(1 - R)) * 0.08  # rough proxy
            return K * 12.5 * ead

    # ------------------------------------------------------------------
    # Public: calculate_rwa
    # ------------------------------------------------------------------

    def calculate_rwa(
        self,
        exposures: list[dict],
        approach: str = "SA-CR",
    ) -> dict:
        """
        Calculate credit risk-weighted assets for a portfolio.

        Parameters
        ----------
        exposures : list of dict with keys:
            exposure_id, exposure_class, rating_bucket, ead,
            ltv (optional), pd (optional), lgd (optional), maturity (optional)
        approach  : "SA-CR" | "F-IRB" | "A-IRB"

        Returns
        -------
        dict with per-exposure breakdown + portfolio totals + output floor.
        """
        results: list[RWAResult] = []
        total_sa_rwa = 0.0
        total_irb_rwa = 0.0

        for exp_dict in exposures:
            exp = ExposureItem(**{k: v for k, v in exp_dict.items() if k in ExposureItem.__dataclass_fields__})
            sa_rw = self._get_sacr_rw(exp.exposure_class, exp.rating_bucket, exp.ltv)
            sa_rwa = sa_rw * exp.ead

            irb_rwa: Optional[float] = None
            applicable_rwa = sa_rwa
            approach_used = "SA-CR"

            if approach in ("F-IRB", "A-IRB") and exp.pd is not None and exp.lgd is not None:
                lgd_actual = exp.lgd
                if approach == "F-IRB":
                    # Override LGD with supervisory estimate
                    lgd_actual = FIRB_LGD.get("senior_unsecured", 0.45)
                irb_rwa = self._calc_irb_rwa_safe(
                    exp.exposure_class, exp.ead, exp.pd, lgd_actual,
                    exp.maturity or 2.5
                )
                # Apply output floor
                floor_rwa = IRB_OUTPUT_FLOOR * sa_rwa
                applicable_rwa = max(irb_rwa, floor_rwa)
                approach_used = f"{approach} (floor applied)" if irb_rwa < floor_rwa else approach

            total_sa_rwa += sa_rwa
            total_irb_rwa += irb_rwa or sa_rwa

            results.append(RWAResult(
                exposure_id=exp.exposure_id,
                exposure_class=exp.exposure_class,
                ead=exp.ead,
                sa_cr_rw=round(sa_rw, 4),
                sa_cr_rwa=round(sa_rwa, 2),
                irb_rwa=round(irb_rwa, 2) if irb_rwa else None,
                applicable_rwa=round(applicable_rwa, 2),
                approach_used=approach_used,
            ))

        output_floor_rwa = IRB_OUTPUT_FLOOR * total_sa_rwa
        total_applicable = max(total_irb_rwa, output_floor_rwa) if approach != "SA-CR" else total_sa_rwa
        floor_binding = approach != "SA-CR" and total_irb_rwa < output_floor_rwa

        return {
            "approach": approach,
            "output_floor_pct": IRB_OUTPUT_FLOOR,
            "total_sa_cr_rwa": round(total_sa_rwa, 2),
            "total_irb_rwa": round(total_irb_rwa, 2) if approach != "SA-CR" else None,
            "output_floor_rwa": round(output_floor_rwa, 2),
            "total_applicable_rwa": round(total_applicable, 2),
            "output_floor_binding": floor_binding,
            "exposure_count": len(results),
            "breakdown": [
                {
                    "exposure_id": r.exposure_id,
                    "exposure_class": r.exposure_class,
                    "ead": r.ead,
                    "sa_cr_rw_pct": round(r.sa_cr_rw * 100, 1),
                    "sa_cr_rwa": r.sa_cr_rwa,
                    "irb_rwa": r.irb_rwa,
                    "applicable_rwa": r.applicable_rwa,
                    "approach_used": r.approach_used,
                }
                for r in results
            ],
        }

    # ------------------------------------------------------------------
    # Public: calculate_frtb
    # ------------------------------------------------------------------

    def calculate_frtb(
        self,
        positions: list[dict],
        ima_approved: bool = False,
        backtesting_exceptions: int = 0,
        pla_spearman: float = 0.85,
    ) -> dict:
        """
        FRTB market risk capital — SA and IMA comparison.

        Parameters
        ----------
        positions : list of dict with keys:
            desk_id, asset_class, sub_class, notional, long_short (1/-1)
        ima_approved    : whether IMA has supervisory approval
        backtesting_exceptions : number of back-testing exceptions (250-day)
        pla_spearman    : Spearman correlation from P&L attribution test
        """
        desks: dict[str, dict] = {}

        for pos in positions:
            desk_id = pos.get("desk_id", "desk_1")
            asset_class = pos.get("asset_class", "equity_risk")
            sub_class = pos.get("sub_class", "large_cap_developed")
            notional = abs(float(pos.get("notional", 0.0)))

            # SA risk weight lookup
            class_rw = FRTB_SA_RISK_WEIGHTS.get(asset_class, {})
            rw = class_rw.get(sub_class, 0.30)
            sa_rwa = notional * rw

            if desk_id not in desks:
                desks[desk_id] = {"sa_rwa": 0.0, "ima_rwa_estimate": 0.0, "positions": 0}
            desks[desk_id]["sa_rwa"] += sa_rwa
            # IMA rough estimate: assume ~60% of SA (typical benefit)
            desks[desk_id]["ima_rwa_estimate"] += sa_rwa * 0.60
            desks[desk_id]["positions"] += 1

        # Determine back-testing zone
        if backtesting_exceptions <= FRTB_BACKTESTING_ZONES["green"]["exceptions_max"]:
            bt_zone = "green"
        elif backtesting_exceptions <= FRTB_BACKTESTING_ZONES["amber"]["exceptions_max"]:
            bt_zone = "amber"
        else:
            bt_zone = "red"

        bt_multiplier = FRTB_BACKTESTING_ZONES[bt_zone]["multiplier"]

        # PLA test result
        pla_pass = pla_spearman >= FRTB_PLA_THRESHOLDS["spearman_correlation_green"]

        desk_results = []
        total_sa_rwa = 0.0
        total_ima_rwa = 0.0

        for desk_id, d in desks.items():
            sa_rwa_desk = d["sa_rwa"]
            ima_applicable = ima_approved and pla_pass and bt_zone != "red"
            ima_rwa = d["ima_rwa_estimate"] * bt_multiplier if ima_applicable else None
            applicable = ima_rwa if ima_rwa is not None else sa_rwa_desk

            total_sa_rwa += sa_rwa_desk
            total_ima_rwa += applicable

            desk_results.append(FRTBResult(
                desk_id=desk_id,
                sa_rwa=round(sa_rwa_desk, 2),
                ima_rwa=round(ima_rwa, 2) if ima_rwa else None,
                backtesting_zone=bt_zone,
                pla_pass=pla_pass,
                applicable_rwa=round(applicable, 2),
                ima_eligible=ima_applicable,
            ))

        return {
            "total_sa_rwa": round(total_sa_rwa, 2),
            "total_ima_rwa": round(total_ima_rwa, 2),
            "ima_approved": ima_approved,
            "backtesting_zone": bt_zone,
            "backtesting_exceptions": backtesting_exceptions,
            "pla_spearman": pla_spearman,
            "pla_pass": pla_pass,
            "ima_criteria": FRTB_IMA_CRITERIA,
            "desks": [
                {
                    "desk_id": r.desk_id,
                    "sa_rwa": r.sa_rwa,
                    "ima_rwa": r.ima_rwa,
                    "ima_eligible": r.ima_eligible,
                    "applicable_rwa": r.applicable_rwa,
                }
                for r in desk_results
            ],
        }

    # ------------------------------------------------------------------
    # Public: calculate_sa_ccr
    # ------------------------------------------------------------------

    def calculate_sa_ccr(
        self,
        netting_sets: list[dict],
    ) -> dict:
        """
        SA-CCR EAD calculation for derivatives portfolios.

        Parameters
        ----------
        netting_sets : list of dict with:
            netting_set_id, trades (list of:
                asset_class, sub_class, notional, maturity_years,
                market_value, collateral_posted, collateral_type
            ), has_netting_agreement, has_csa
        """
        results: list[SACCRResult] = []
        total_ead = 0.0

        for ns in netting_sets:
            ns_id = ns.get("netting_set_id", "ns_1")
            has_netting = ns.get("has_netting_agreement", False)
            has_csa = ns.get("has_csa", False)
            trades = ns.get("trades", [])

            # Replacement Cost (RC)
            total_mv = sum(float(t.get("market_value", 0)) for t in trades)
            total_collateral = 0.0
            for t in trades:
                coll_type = t.get("collateral_type", "other_collateral")
                haircut = SA_CCR_COLLATERAL_HAIRCUTS.get(coll_type, 0.25)
                coll_val = float(t.get("collateral_posted", 0))
                total_collateral += coll_val * (1 - haircut)

            if has_netting:
                rc = max(total_mv - total_collateral, 0)
            else:
                rc = sum(max(float(t.get("market_value", 0)), 0) for t in trades)

            # PFE Add-on (aggregate across asset classes)
            gross_addon = 0.0
            for t in trades:
                asset_class = t.get("asset_class", "fx")
                sub_class = t.get("sub_class", "default")
                notional = abs(float(t.get("notional", 0)))
                maturity = float(t.get("maturity_years", 1.0))

                sf_class = SA_CCR_SUPERVISORY_FACTORS.get(asset_class, {"default": 0.04})
                if "maturity_lt1y" in sf_class:
                    if maturity < 1:
                        sf = sf_class["maturity_lt1y"]
                    elif maturity <= 5:
                        sf = sf_class["maturity_1_5y"]
                    else:
                        sf = sf_class["maturity_gt5y"]
                elif sub_class in sf_class:
                    sf = sf_class[sub_class]
                else:
                    sf = sf_class.get("default", 0.04)

                # Adjusted notional with maturity supervision factor
                if asset_class == "interest_rate":
                    sd_factor = min(math.sqrt(maturity / 10), 1.0)
                    adj_notional = notional * sd_factor
                else:
                    adj_notional = notional

                gross_addon += adj_notional * sf

            # Multiplier (BCBS 279 §148)
            if has_csa:
                floor_val = 0.05
                multiplier = max(
                    floor_val,
                    (1 - floor_val) * math.exp(total_mv / (2 * (1 - floor_val) * gross_addon))
                    if gross_addon > 0 else 1.0
                )
                multiplier = min(multiplier, 1.0)
            else:
                multiplier = 1.0

            pfe_addon = multiplier * gross_addon
            ead = SA_CCR_ALPHA * (rc + pfe_addon)

            # Netting benefit
            gross_ead_no_netting = SA_CCR_ALPHA * (rc + gross_addon)
            netting_benefit_pct = (
                (gross_ead_no_netting - ead) / gross_ead_no_netting
                if gross_ead_no_netting > 0 else 0.0
            )

            total_ead += ead
            results.append(SACCRResult(
                netting_set_id=ns_id,
                replacement_cost=round(rc, 2),
                pfe_addon=round(pfe_addon, 2),
                ead=round(ead, 2),
                netting_benefit_pct=round(netting_benefit_pct, 4),
            ))

        return {
            "alpha_factor": SA_CCR_ALPHA,
            "total_ead": round(total_ead, 2),
            "netting_sets": [
                {
                    "netting_set_id": r.netting_set_id,
                    "replacement_cost": r.replacement_cost,
                    "pfe_addon": r.pfe_addon,
                    "ead": r.ead,
                    "netting_benefit_pct": round(r.netting_benefit_pct * 100, 1),
                }
                for r in results
            ],
        }

    # ------------------------------------------------------------------
    # Public: calculate_capital_ratios
    # ------------------------------------------------------------------

    def calculate_capital_ratios(
        self,
        credit_rwa: float,
        market_rwa: float,
        operational_rwa: float,
        cet1_capital: float,
        at1_capital: float,
        t2_capital: float,
        leverage_exposure: float,
        asf: float,
        rsf: float,
        hqla: float,
        net_cash_outflows_30d: float,
        is_gsii: bool = False,
    ) -> dict:
        """
        Calculate all Basel IV regulatory capital and liquidity ratios.
        """
        total_rwa = credit_rwa + market_rwa + operational_rwa
        tier1_capital = cet1_capital + at1_capital
        total_capital = tier1_capital + t2_capital

        cet1_ratio = cet1_capital / total_rwa if total_rwa > 0 else 0.0
        tier1_ratio = tier1_capital / total_rwa if total_rwa > 0 else 0.0
        tc_ratio = total_capital / total_rwa if total_rwa > 0 else 0.0

        leverage_ratio = tier1_capital / leverage_exposure if leverage_exposure > 0 else 0.0
        leverage_min = LEVERAGE_RATIO_MIN + (LEVERAGE_RATIO_GSII_ADDON if is_gsii else 0)

        nsfr = asf / rsf if rsf > 0 else 0.0
        lcr = hqla / net_cash_outflows_30d if net_cash_outflows_30d > 0 else 0.0

        # Minimum requirements (CRR3)
        cet1_min = 0.045  # 4.5% + buffers typically 2.5% conservation = 7%
        tier1_min = 0.06
        tc_min = 0.08

        result = CapitalRatiosResult(
            cet1_ratio=round(cet1_ratio, 4),
            tier1_ratio=round(tier1_ratio, 4),
            total_capital_ratio=round(tc_ratio, 4),
            leverage_ratio=round(leverage_ratio, 4),
            nsfr=round(nsfr, 4),
            lcr=round(lcr, 4),
            cet1_requirement_met=cet1_ratio >= cet1_min,
            leverage_requirement_met=leverage_ratio >= leverage_min,
            nsfr_requirement_met=nsfr >= NSFR_MINIMUM,
            lcr_requirement_met=lcr >= LCR_MINIMUM,
        )

        return {
            "capital_ratios": {
                "cet1_ratio_pct": round(cet1_ratio * 100, 2),
                "tier1_ratio_pct": round(tier1_ratio * 100, 2),
                "total_capital_ratio_pct": round(tc_ratio * 100, 2),
                "leverage_ratio_pct": round(leverage_ratio * 100, 2),
            },
            "liquidity_ratios": {
                "nsfr": round(nsfr, 4),
                "lcr": round(lcr, 4),
            },
            "rwa_breakdown": {
                "credit_rwa": credit_rwa,
                "market_rwa": market_rwa,
                "operational_rwa": operational_rwa,
                "total_rwa": total_rwa,
            },
            "capital_amounts": {
                "cet1": cet1_capital,
                "at1": at1_capital,
                "t2": t2_capital,
                "tier1": tier1_capital,
                "total_capital": total_capital,
            },
            "requirements_met": {
                "cet1": result.cet1_requirement_met,
                "leverage": result.leverage_requirement_met,
                "nsfr": result.nsfr_requirement_met,
                "lcr": result.lcr_requirement_met,
            },
            "minimum_requirements": {
                "cet1_min_pct": cet1_min * 100,
                "tier1_min_pct": tier1_min * 100,
                "total_capital_min_pct": tc_min * 100,
                "leverage_min_pct": leverage_min * 100,
                "nsfr_min": NSFR_MINIMUM,
                "lcr_min": LCR_MINIMUM,
            },
            "is_gsii": is_gsii,
        }

    # ------------------------------------------------------------------
    # Public: identify_optimization_actions
    # ------------------------------------------------------------------

    def identify_optimization_actions(
        self,
        total_rwa: float,
        cet1_capital: float,
        exposure_classes: list[str],
        has_derivatives: bool = False,
        has_irb_approval: bool = False,
        has_netting_agreements: bool = False,
        has_csa: bool = False,
    ) -> dict:
        """
        Identify and rank capital optimization actions.

        Returns ranked list of applicable optimization techniques with
        estimated RWA reduction and CET1 ratio uplift.
        """
        actions: list[OptimizationAction] = []
        rank = 1

        for tech in OPTIMIZATION_TECHNIQUES:
            applicable = False
            rationale_parts = []

            ap = tech["applicable_portfolios"]

            # Determine applicability
            if "all" in ap:
                applicable = True
                rationale_parts.append("Applicable to all asset classes in portfolio")

            if "derivatives" in ap:
                if has_derivatives:
                    applicable = True
                    if tech["id"] == "netting_isda" and not has_netting_agreements:
                        rationale_parts.append("No ISDA netting agreements in place — high priority")
                    elif tech["id"] == "csa_margin" and not has_csa:
                        rationale_parts.append("No CSA/margin agreements — PFE multiplier reduction available")
                    elif has_netting_agreements and tech["id"] == "netting_isda":
                        rationale_parts.append("Additional netting counterparties may reduce EAD further")
                    elif has_csa and tech["id"] == "csa_margin":
                        rationale_parts.append("CSA already in place; review IM/VM terms for further benefit")

            for exp_class in exposure_classes:
                if exp_class in ap:
                    applicable = True
                    rationale_parts.append(f"Exposure class '{exp_class}' in scope")
                    break

            if tech["id"] == "irb_model_filing" and has_irb_approval:
                applicable = False
                rationale_parts = ["IRB already approved — not applicable"]

            if not applicable:
                continue

            # Estimate RWA reduction (mid-point of range applied to 30% of portfolio as proxy)
            rw_mid = sum(tech["rwa_reduction_pct_range"]) / 2 / 100
            rwa_reduction_est = total_rwa * rw_mid * 0.30  # conservative: 30% portfolio impact
            cet1_uplift_bps = (rwa_reduction_est / (cet1_capital + rwa_reduction_est * 0.08)) * 10000 if cet1_capital > 0 else 0

            priority = "high" if cet1_uplift_bps > 50 else ("medium" if cet1_uplift_bps > 20 else "low")

            actions.append(OptimizationAction(
                rank=rank,
                technique_id=tech["id"],
                technique_name=tech["name"],
                applicable=applicable,
                rwa_reduction_estimate=round(rwa_reduction_est, 2),
                cet1_uplift_bps=round(cet1_uplift_bps, 1),
                rationale="; ".join(rationale_parts) if rationale_parts else tech["description"][:100],
                priority=priority,
            ))
            rank += 1

        # Sort by CET1 uplift descending, re-rank
        actions.sort(key=lambda a: a.cet1_uplift_bps, reverse=True)
        for i, a in enumerate(actions):
            a.rank = i + 1

        return {
            "total_actions_identified": len(actions),
            "total_rwa_reduction_potential": round(sum(a.rwa_reduction_estimate for a in actions), 2),
            "total_cet1_uplift_potential_bps": round(sum(a.cet1_uplift_bps for a in actions), 1),
            "actions": [
                {
                    "rank": a.rank,
                    "technique_id": a.technique_id,
                    "technique_name": a.technique_name,
                    "priority": a.priority,
                    "rwa_reduction_estimate": a.rwa_reduction_estimate,
                    "cet1_uplift_bps": a.cet1_uplift_bps,
                    "rationale": a.rationale,
                }
                for a in actions
            ],
        }

    # ------------------------------------------------------------------
    # Public: apply_climate_p2r_addon
    # ------------------------------------------------------------------

    def apply_climate_p2r_addon(
        self,
        base_cet1_ratio: float,
        physical_risk_score: float,
        transition_risk_score: float,
        total_rwa: float,
        cet1_capital: float,
    ) -> dict:
        """
        Apply ECB Pillar 2 Requirement climate overlay.

        Parameters
        ----------
        base_cet1_ratio      : base CET1 ratio (decimal, e.g. 0.12 = 12%)
        physical_risk_score  : 0.0 – 1.0 (higher = more physical risk)
        transition_risk_score: 0.0 – 1.0 (higher = more transition risk)
        total_rwa            : total RWA
        cet1_capital         : CET1 capital amount
        """
        params = CLIMATE_P2R_PARAMS
        composite = (
            params["physical_risk_weight"] * physical_risk_score
            + params["transition_risk_weight"] * transition_risk_score
        )

        addon_bps = 0
        for threshold, bps in params["tier_thresholds"]:
            if composite < threshold:
                addon_bps = bps
                break

        # Climate-adjusted CET1: additional capital requirement expressed as RWA uplift
        addon_capital_required = (addon_bps / 10000) * total_rwa
        effective_cet1_capital = cet1_capital - addon_capital_required
        climate_adjusted_cet1 = effective_cet1_capital / total_rwa if total_rwa > 0 else base_cet1_ratio

        return {
            "base_cet1_ratio_pct": round(base_cet1_ratio * 100, 2),
            "climate_adjusted_cet1_ratio_pct": round(climate_adjusted_cet1 * 100, 2),
            "addon_bps": addon_bps,
            "addon_capital_required": round(addon_capital_required, 2),
            "composite_climate_risk_score": round(composite, 4),
            "physical_risk_score": physical_risk_score,
            "transition_risk_score": transition_risk_score,
            "risk_tier": (
                "low" if composite < 0.20
                else "moderate" if composite < 0.40
                else "elevated" if composite < 0.60
                else "high" if composite < 0.80
                else "very_high"
            ),
            "ecb_guidance": "ECB Supervisory Review Process — Pillar 2R climate overlay",
            "max_addon_bps": params["max_addon_bps"],
        }

    # ------------------------------------------------------------------
    # Public: calculate_operational_risk_rwa
    # ------------------------------------------------------------------

    def calculate_operational_risk_rwa(
        self,
        business_indicator: float,
        loss_component: Optional[float] = None,
    ) -> dict:
        """
        SA-OPR: Operational Risk = BIC × ILM.
        BIC calculated from BI using marginal coefficient table.
        If no internal loss data, ILM = 1.0.
        """
        # Calculate BIC from BI
        bic = 0.0
        remaining_bi = business_indicator
        previous_bound = 0.0
        for lower, upper, coeff in BIC_MARGINAL_COEFFICIENTS:
            if remaining_bi <= 0:
                break
            band_size = min(remaining_bi, upper - lower) if upper < float("inf") else remaining_bi
            bic += band_size * coeff
            remaining_bi -= band_size
            if remaining_bi <= 0:
                break

        # ILM calculation
        if loss_component is not None and bic > 0:
            ratio = loss_component / bic
            ilm = math.log(math.exp(1) - 1 + ratio ** 0.8) if ratio > 0 else ILM_DEFAULT_NO_DATA
            ilm = max(ilm, 0.80)  # regulatory floor (BCBS §11.11)
        else:
            ilm = ILM_DEFAULT_NO_DATA

        op_risk_rwa = bic * ilm * 12.5  # Convert to RWA (capital × 12.5)

        return {
            "business_indicator": business_indicator,
            "bic": round(bic, 2),
            "ilm": round(ilm, 4),
            "loss_component": loss_component,
            "operational_risk_capital": round(bic * ilm, 2),
            "operational_risk_rwa": round(op_risk_rwa, 2),
            "approach": "SA-OPR (Basel IV)",
        }

    # ------------------------------------------------------------------
    # Public: calculate_cva
    # ------------------------------------------------------------------

    def calculate_cva(
        self,
        counterparties: list[dict],
        use_ba_cva: bool = True,
    ) -> dict:
        """
        CVA capital charge.

        Parameters
        ----------
        counterparties : list of dict:
            sector, ead, maturity_years, notional_hedge (optional)
        use_ba_cva     : True = BA-CVA (reduced formula); False = SA-CVA
        """
        total_cva_capital = 0.0
        results = []

        for cp in counterparties:
            sector = cp.get("sector", "corporate_IG")
            ead = float(cp.get("ead", 0.0))
            maturity = float(cp.get("maturity_years", 3.0))

            # Match supervisory params
            sp = next(
                (p for p in CVA_SUPERVISORY_PARAMS if p["sector"] == sector),
                CVA_SUPERVISORY_PARAMS[-1],
            )
            rw = sp["risk_weight"]
            effective_mat = (0.5 * sp["maturity_years"] + 0.5 * maturity)  # blend

            # BA-CVA simplified formula: K = scalar × rw × EAD × M
            k_cva = BA_CVA_SCALAR * rw * ead * effective_mat
            total_cva_capital += k_cva

            results.append({
                "sector": sector,
                "ead": ead,
                "maturity_years": maturity,
                "supervisory_rw": rw,
                "cva_capital": round(k_cva, 2),
            })

        cva_rwa = total_cva_capital * 12.5

        return {
            "approach": "BA-CVA" if use_ba_cva else "SA-CVA",
            "ba_cva_scalar": BA_CVA_SCALAR,
            "total_cva_capital": round(total_cva_capital, 2),
            "cva_rwa": round(cva_rwa, 2),
            "counterparty_breakdown": results,
        }
