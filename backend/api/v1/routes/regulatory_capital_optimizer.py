"""
API Routes — Regulatory Capital Optimization Engine (Basel IV / CRR3)
======================================================================
POST /api/v1/regulatory-capital/calculate-rwa       — SA-CR + IRB + output floor
POST /api/v1/regulatory-capital/calculate-frtb      — FRTB SA/IMA comparison
POST /api/v1/regulatory-capital/calculate-sa-ccr    — SA-CCR EAD for derivatives
POST /api/v1/regulatory-capital/calculate-ratios    — CET1/T1/TC/leverage/NSFR/LCR
POST /api/v1/regulatory-capital/optimize            — Capital optimization opportunities
GET  /api/v1/regulatory-capital/ref/sa-cr-risk-weights   — SA-CR exposure class risk weights
GET  /api/v1/regulatory-capital/ref/frtb-parameters      — FRTB SA buckets and risk weights
GET  /api/v1/regulatory-capital/ref/optimization-techniques — Capital optimization techniques
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from services.regulatory_capital_optimizer_engine import (
    RegulatoryCapitalOptimizerEngine,
    SA_CR_RISK_WEIGHTS,
    RESIDENTIAL_RE_LTV_RW,
    COMMERCIAL_RE_LTV_RW,
    FRTB_SA_RISK_WEIGHTS,
    FRTB_EQUITY_BUCKETS,
    FRTB_PLA_THRESHOLDS,
    FRTB_BACKTESTING_ZONES,
    FRTB_IMA_CRITERIA,
    SA_CCR_SUPERVISORY_FACTORS,
    SA_CCR_COLLATERAL_HAIRCUTS,
    IRB_OUTPUT_FLOOR,
    FIRB_LGD,
    NSFR_ASF_FACTORS,
    NSFR_RSF_FACTORS,
    LCR_HQLA,
    LEVERAGE_RATIO_MIN,
    LEVERAGE_RATIO_GSII_ADDON,
    CLIMATE_P2R_PARAMS,
    OPTIMIZATION_TECHNIQUES,
    CVA_SUPERVISORY_PARAMS,
    BIC_MARGINAL_COEFFICIENTS,
)

router = APIRouter(prefix="/api/v1/regulatory-capital", tags=["Regulatory Capital Optimizer"])


# ---------------------------------------------------------------------------
# Pydantic Request / Response Models
# ---------------------------------------------------------------------------

class ExposureItemRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    exposure_id: str = Field(..., description="Unique exposure identifier")
    exposure_class: str = Field(
        ...,
        description="SA-CR exposure class: sovereign, mdb, bank, corporate, retail, "
                    "residential_re, commercial_re, equity, subordinated_debt, project_finance",
    )
    rating_bucket: int = Field(
        0,
        ge=0,
        le=6,
        description="Rating bucket index: 0=AAA/AA, 1=A, 2=BBB, 3=BB, 4=B, 5=CCC+, 6=Unrated",
    )
    ead: float = Field(..., gt=0, description="Exposure at Default (currency units)")
    ltv: Optional[float] = Field(None, ge=0, le=2.0, description="Loan-to-Value ratio for RE exposures")
    pd: Optional[float] = Field(None, ge=0, le=1, description="Probability of Default (IRB only)")
    lgd: Optional[float] = Field(None, ge=0, le=1, description="Loss Given Default (A-IRB only; overridden in F-IRB)")
    maturity: Optional[float] = Field(None, ge=0.5, le=10, description="Effective maturity in years (default 2.5)")


class RWARequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    exposures: list[ExposureItemRequest] = Field(..., min_length=1)
    approach: str = Field(
        "SA-CR",
        description="Capital approach: SA-CR | F-IRB | A-IRB",
    )


class TradePositionRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    desk_id: str = Field("desk_1", description="Trading desk identifier")
    asset_class: str = Field(
        ...,
        description="FRTB asset class key from FRTB_SA_RISK_WEIGHTS",
    )
    sub_class: str = Field(..., description="Sub-class within the asset class (e.g. sovereign_AAA_AA)")
    notional: float = Field(..., gt=0)
    long_short: int = Field(1, description="1 = long, -1 = short")


class FRTBRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    positions: list[TradePositionRequest] = Field(..., min_length=1)
    ima_approved: bool = Field(False, description="IMA regulatory approval status")
    backtesting_exceptions: int = Field(0, ge=0, le=250)
    pla_spearman: float = Field(0.85, ge=0, le=1, description="Spearman correlation from P&L attribution test")


class DerivativeTradeRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    asset_class: str = Field(..., description="SA-CCR asset class: interest_rate, fx, credit_IG, credit_SG, equity, commodity_energy, etc.")
    sub_class: str = Field("default", description="Sub-class for supervisory factor lookup")
    notional: float = Field(..., gt=0)
    maturity_years: float = Field(1.0, gt=0)
    market_value: float = Field(0.0, description="Current mark-to-market value")
    collateral_posted: float = Field(0.0, ge=0)
    collateral_type: str = Field("cash_same_ccy", description="Key from SA_CCR_COLLATERAL_HAIRCUTS")


class NettingSetRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    netting_set_id: str = Field("ns_1")
    trades: list[DerivativeTradeRequest] = Field(..., min_length=1)
    has_netting_agreement: bool = Field(False)
    has_csa: bool = Field(False, description="ISDA CSA / margin agreement in place")


class SACCRRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    netting_sets: list[NettingSetRequest] = Field(..., min_length=1)


class CapitalRatiosRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    credit_rwa: float = Field(..., ge=0)
    market_rwa: float = Field(0.0, ge=0)
    operational_rwa: float = Field(0.0, ge=0)
    cet1_capital: float = Field(..., gt=0)
    at1_capital: float = Field(0.0, ge=0)
    t2_capital: float = Field(0.0, ge=0)
    leverage_exposure: float = Field(..., gt=0, description="Total leverage exposure measure")
    asf: float = Field(..., gt=0, description="Available Stable Funding (NSFR numerator)")
    rsf: float = Field(..., gt=0, description="Required Stable Funding (NSFR denominator)")
    hqla: float = Field(..., gt=0, description="High Quality Liquid Assets (LCR numerator)")
    net_cash_outflows_30d: float = Field(..., gt=0, description="Net cash outflows over 30 days (LCR denominator)")
    is_gsii: bool = Field(False, description="G-SII flag — adds 50bps leverage buffer")


class OptimizationRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    total_rwa: float = Field(..., gt=0)
    cet1_capital: float = Field(..., gt=0)
    exposure_classes: list[str] = Field(
        ...,
        min_length=1,
        description="List of SA-CR exposure class keys present in portfolio",
    )
    has_derivatives: bool = Field(False)
    has_irb_approval: bool = Field(False)
    has_netting_agreements: bool = Field(False)
    has_csa: bool = Field(False)


class ClimateP2RRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    base_cet1_ratio: float = Field(..., gt=0, le=1, description="Base CET1 ratio as decimal (e.g. 0.12)")
    physical_risk_score: float = Field(..., ge=0, le=1)
    transition_risk_score: float = Field(..., ge=0, le=1)
    total_rwa: float = Field(..., gt=0)
    cet1_capital: float = Field(..., gt=0)


class OperationalRiskRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    business_indicator: float = Field(..., gt=0, description="Business Indicator (BI) in thousands EUR")
    loss_component: Optional[float] = Field(
        None,
        ge=0,
        description="Loss Component = 15 × avg annual op losses. If None, ILM defaults to 1.0",
    )


class CVACounterpartyRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    sector: str = Field(..., description="Counterparty sector key from CVA_SUPERVISORY_PARAMS")
    ead: float = Field(..., gt=0)
    maturity_years: float = Field(3.0, gt=0)


class CVARequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    counterparties: list[CVACounterpartyRequest] = Field(..., min_length=1)
    use_ba_cva: bool = Field(True, description="True = BA-CVA (simplified); False = SA-CVA")


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/calculate-rwa")
def calculate_rwa(req: RWARequest):
    """
    Calculate credit risk-weighted assets under SA-CR, F-IRB, or A-IRB.
    Applies Basel IV output floor (72.5% of SA-CR) to IRB approaches.
    """
    engine = RegulatoryCapitalOptimizerEngine()
    exposures = [e.model_dump() for e in req.exposures]
    return engine.calculate_rwa(exposures, req.approach)


@router.post("/calculate-frtb")
def calculate_frtb(req: FRTBRequest):
    """
    FRTB market risk capital — SA and IMA comparison per BCBS 457.
    Returns per-desk breakdown, back-testing zone, and P&L attribution result.
    """
    engine = RegulatoryCapitalOptimizerEngine()
    positions = [p.model_dump() for p in req.positions]
    return engine.calculate_frtb(
        positions=positions,
        ima_approved=req.ima_approved,
        backtesting_exceptions=req.backtesting_exceptions,
        pla_spearman=req.pla_spearman,
    )


@router.post("/calculate-sa-ccr")
def calculate_sa_ccr(req: SACCRRequest):
    """
    SA-CCR EAD calculation per BCBS 279.
    Returns replacement cost, PFE add-ons, EAD, and netting benefit per netting set.
    """
    engine = RegulatoryCapitalOptimizerEngine()
    netting_sets = []
    for ns in req.netting_sets:
        netting_sets.append({
            "netting_set_id": ns.netting_set_id,
            "has_netting_agreement": ns.has_netting_agreement,
            "has_csa": ns.has_csa,
            "trades": [t.model_dump() for t in ns.trades],
        })
    return engine.calculate_sa_ccr(netting_sets)


@router.post("/calculate-ratios")
def calculate_capital_ratios(req: CapitalRatiosRequest):
    """
    Calculate all Basel IV regulatory ratios:
    CET1 / Tier 1 / Total Capital / Leverage / NSFR / LCR.
    """
    engine = RegulatoryCapitalOptimizerEngine()
    return engine.calculate_capital_ratios(
        credit_rwa=req.credit_rwa,
        market_rwa=req.market_rwa,
        operational_rwa=req.operational_rwa,
        cet1_capital=req.cet1_capital,
        at1_capital=req.at1_capital,
        t2_capital=req.t2_capital,
        leverage_exposure=req.leverage_exposure,
        asf=req.asf,
        rsf=req.rsf,
        hqla=req.hqla,
        net_cash_outflows_30d=req.net_cash_outflows_30d,
        is_gsii=req.is_gsii,
    )


@router.post("/optimize")
def optimize_capital(req: OptimizationRequest):
    """
    Identify and rank capital optimization opportunities.
    Returns applicable techniques with RWA reduction estimates and CET1 uplift in bps.
    """
    engine = RegulatoryCapitalOptimizerEngine()
    return engine.identify_optimization_actions(
        total_rwa=req.total_rwa,
        cet1_capital=req.cet1_capital,
        exposure_classes=req.exposure_classes,
        has_derivatives=req.has_derivatives,
        has_irb_approval=req.has_irb_approval,
        has_netting_agreements=req.has_netting_agreements,
        has_csa=req.has_csa,
    )


@router.post("/climate-p2r")
def apply_climate_p2r(req: ClimateP2RRequest):
    """
    Apply ECB Pillar 2 Requirement climate overlay (0-50bps add-on).
    Returns climate-adjusted CET1 ratio.
    """
    engine = RegulatoryCapitalOptimizerEngine()
    return engine.apply_climate_p2r_addon(
        base_cet1_ratio=req.base_cet1_ratio,
        physical_risk_score=req.physical_risk_score,
        transition_risk_score=req.transition_risk_score,
        total_rwa=req.total_rwa,
        cet1_capital=req.cet1_capital,
    )


@router.post("/operational-risk")
def calculate_operational_risk(req: OperationalRiskRequest):
    """
    SA-OPR operational risk capital = BIC × ILM.
    """
    engine = RegulatoryCapitalOptimizerEngine()
    return engine.calculate_operational_risk_rwa(
        business_indicator=req.business_indicator,
        loss_component=req.loss_component,
    )


@router.post("/calculate-cva")
def calculate_cva(req: CVARequest):
    """
    CVA capital charge (BA-CVA or SA-CVA) per BCBS 325.
    """
    engine = RegulatoryCapitalOptimizerEngine()
    counterparties = [c.model_dump() for c in req.counterparties]
    return engine.calculate_cva(counterparties, use_ba_cva=req.use_ba_cva)


# ---------------------------------------------------------------------------
# Reference Data Endpoints
# ---------------------------------------------------------------------------

@router.get("/ref/sa-cr-risk-weights")
def get_sacr_risk_weights():
    """
    SA-CR risk weights by exposure class and rating bucket.
    Buckets: 0=AAA/AA, 1=A, 2=BBB, 3=BB, 4=B, 5=CCC+, 6=Unrated
    """
    return {
        "framework": "CRR3 / Basel IV (effective Jan 2025)",
        "rating_buckets": {
            0: "AAA / AA",
            1: "A",
            2: "BBB",
            3: "BB",
            4: "B",
            5: "CCC+",
            6: "Unrated",
        },
        "risk_weights_pct": {
            cls: rw_list
            for cls, rw_list in SA_CR_RISK_WEIGHTS.items()
        },
        "residential_re_ltv_table": [
            {"ltv_max": ltv if ltv < 9999 else "above_100%", "risk_weight_pct": rw}
            for ltv, rw in RESIDENTIAL_RE_LTV_RW
        ],
        "commercial_re_ltv_table": [
            {"ltv_max": ltv if ltv < 9999 else "above_100%", "risk_weight_pct": rw}
            for ltv, rw in COMMERCIAL_RE_LTV_RW
        ],
        "output_floor": {
            "pct": IRB_OUTPUT_FLOOR * 100,
            "description": "Basel IV output floor: IRB RWA must be ≥ 72.5% of SA-CR RWA",
        },
        "firb_supervisory_lgd": FIRB_LGD,
        "notes": [
            "SA-CR effective under CRR3 (EU) from Jan 2025 / national transpositions",
            "Residential RE uses LTV split approach (CRR3 Art 124)",
            "Commercial RE uses LTV split approach (CRR3 Art 126)",
            "Equity: listed 100%, VC/speculative 400%, PE unlisted 250%",
        ],
    }


@router.get("/ref/frtb-parameters")
def get_frtb_parameters():
    """
    FRTB SA sensitivity-based method (SBM) buckets and risk weights per BCBS 457.
    """
    return {
        "framework": "FRTB — BCBS 457 (Revised Market Risk Framework)",
        "sa_risk_weights": FRTB_SA_RISK_WEIGHTS,
        "equity_buckets": FRTB_EQUITY_BUCKETS,
        "pla_test_thresholds": FRTB_PLA_THRESHOLDS,
        "backtesting_zones": FRTB_BACKTESTING_ZONES,
        "ima_criteria": FRTB_IMA_CRITERIA,
        "notes": [
            "SBM: delta, vega, curvature risk charges aggregated across buckets",
            "IMA approval: requires P&L attribution (green zone Spearman ≥ 0.80) + ≤4 back-testing exceptions",
            "IMA multiplier: 1.5 (green) to 2.0 (red) applied to ES-based capital",
            "Non-modellable risk factors (NMRF) attract stress scenario capital charge",
        ],
    }


@router.get("/ref/sa-ccr-parameters")
def get_sa_ccr_parameters():
    """
    SA-CCR supervisory factors and collateral haircuts per BCBS 279.
    """
    return {
        "framework": "SA-CCR — BCBS 279",
        "alpha_factor": 1.4,
        "supervisory_factors": SA_CCR_SUPERVISORY_FACTORS,
        "collateral_haircuts": SA_CCR_COLLATERAL_HAIRCUTS,
        "notes": [
            "EAD = alpha × (RC + PFE)",
            "Multiplier reduces PFE when VM/IM posted under CSA",
            "Netting reduces RC to net positive MtM across netting set",
        ],
    }


@router.get("/ref/cva-parameters")
def get_cva_parameters():
    """
    CVA supervisory parameters per BCBS 325.
    """
    return {
        "framework": "CVA Capital — BCBS 325",
        "ba_cva_scalar": 0.25,
        "supervisory_counterparty_pairs": CVA_SUPERVISORY_PARAMS,
        "notes": [
            "BA-CVA: reduced formula K = 0.25 × rw × EAD × M",
            "SA-CVA: full sensitivity-based approach (delta/vega CVA risk)",
            "In-scope: all OTC derivatives; excluded: SFTs (unless national opt-in)",
        ],
    }


@router.get("/ref/nsfr-lcr-parameters")
def get_nsfr_lcr_parameters():
    """
    NSFR ASF/RSF factors and LCR HQLA definitions per Basel III.
    """
    return {
        "nsfr": {
            "minimum": 1.00,
            "asf_factors": NSFR_ASF_FACTORS,
            "rsf_factors": NSFR_RSF_FACTORS,
        },
        "lcr": {
            "minimum": 1.00,
            "hqla_categories": LCR_HQLA,
        },
        "leverage_ratio": {
            "minimum_pct": LEVERAGE_RATIO_MIN * 100,
            "gsii_addon_pct": LEVERAGE_RATIO_GSII_ADDON * 100,
        },
    }


@router.get("/ref/optimization-techniques")
def get_optimization_techniques():
    """
    Capital optimization techniques with RWA reduction ranges and regulatory tests.
    """
    return {
        "total_techniques": len(OPTIMIZATION_TECHNIQUES),
        "techniques": OPTIMIZATION_TECHNIQUES,
        "notes": [
            "RWA reduction ranges are indicative; actual benefit depends on portfolio composition",
            "SRT synthetic securitisation subject to CRR3 Art 244-246 significant risk transfer test",
            "IRB model filing lead time ~24 months including regulatory approval",
            "ISDA netting and CSA expansion quickest execution (1-3 months)",
        ],
    }


@router.get("/ref/operational-risk")
def get_operational_risk_parameters():
    """
    SA-OPR operational risk BIC coefficients and ILM formula.
    """
    return {
        "framework": "SA-OPR — Basel IV (replaces BIA/TSA/AMA)",
        "bic_marginal_coefficients": [
            {
                "bi_lower_keur": lower,
                "bi_upper_keur": upper if upper < float("inf") else "unlimited",
                "marginal_coefficient": coeff,
            }
            for lower, upper, coeff in BIC_MARGINAL_COEFFICIENTS
        ],
        "ilm_formula": "ILM = ln(exp(1) - 1 + (LC / BIC)^0.8)",
        "ilm_floor": 0.80,
        "ilm_default_no_internal_data": 1.0,
        "notes": [
            "Loss Component (LC) = 15 × average annual operational losses over 10 years",
            "Banks without qualifying loss data use ILM = 1.0",
            "BIC = f(ILDC, SC, FC) — three BI sub-components",
        ],
    }


@router.get("/ref/climate-p2r")
def get_climate_p2r_parameters():
    """
    ECB Pillar 2R climate overlay parameters (0-50bps range).
    """
    return {
        "source": "ECB Supervisory Review and Evaluation Process (SREP) — Climate & Environmental Risk",
        "max_addon_bps": CLIMATE_P2R_PARAMS["max_addon_bps"],
        "weighting": {
            "physical_risk_weight": CLIMATE_P2R_PARAMS["physical_risk_weight"],
            "transition_risk_weight": CLIMATE_P2R_PARAMS["transition_risk_weight"],
        },
        "tier_thresholds": [
            {"composite_score_lt": t, "addon_bps": b}
            for t, b in CLIMATE_P2R_PARAMS["tier_thresholds"]
        ],
        "notes": [
            "Overlay applied as incremental CET1 requirement above Pillar 1",
            "Physical risk score derived from NGFS physical hazard exposure",
            "Transition risk score derived from carbon pricing gap + policy ambition",
            "ECB guide on climate-related and environmental risks (2020) + 2022 stress test",
        ],
    }
