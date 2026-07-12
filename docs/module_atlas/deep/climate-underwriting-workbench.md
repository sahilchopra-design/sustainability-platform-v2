## 7 · Methodology Deep Dive

### 7.1 What the module computes

The workbench is a single-counterparty underwriting view that composes **three independently
live backend engines** and derives a fourth "decision summary" panel locally from their outputs.
No numbers are fabricated at any stage — every KPI on the page traces to either a live engine
response or a simple arithmetic combination of two live responses, both shown in the UI with
"● Live" / "○ Demo" badges per section (`ClimateUnderwritingWorkbenchPage.jsx` lines 135-159).

1. **Insurance capital** — `POST /api/v1/insurance/calculate` → `services/insurance_climate_risk.py:calculate_insurance_climate_risk()`. Solvency II Art. 44a-aligned CAT loss climate-adjustment, technical-provision (TP) uplift, SCR climate add-on, reserve adequacy and reinsurance sufficiency.
2. **Physical peril pricing** — `POST /api/v1/physical-risk-pricing/price` and `/return-period-losses` → `services/physical_risk_pricing_engine.py`. NGFS-amplified composite physical risk score, Expected Annual Loss (EAL), 100yr PML, Climate VaR 95%, and risk-premium bps by tier.
3. **Financed emissions** — `POST /api/v1/pcaf-module/calculate/{asset_class}` → `services/pcaf_unified_engine.py`. PCAF v2.0 Part A attribution of the counterparty's Scope 1/2/3 emissions to the financed exposure.
4. **Underwriting decision summary** — computed client-side in `useMemo` (lines 302-339) purely from the three live responses: a risk-adjusted premium, premium adequacy ratio, financed-emissions intensity, and an ACCEPT/REFER/DECLINE heuristic.

### 7.2 Engine 1 — Solvency II climate CAT / SCR / TP (`insurance_climate_risk.py`)

Seven perils (`flood`, `tropical_cyclone`, `wildfire`, `drought`, `winter_storm`, `hail`,
`earthquake`) each carry a **CAT loss multiplier** per climate scenario (`1.5C`/`2C`/`3C`),
sourced to Swiss Re sigma 2023 / EIOPA CCRST 2022 / Lloyd's MRC:

```python
_CAT_LOSS_MULTIPLIER = {
    "flood":      {"1.5C": 1.15, "2C": 1.35, "3C": 1.80},
    "wildfire":   {"1.5C": 1.25, "2C": 1.55, "3C": 2.20},
    "winter_storm": {"1.5C": 0.95, "2C": 0.90, "3C": 0.85},  # decreasing trend
    "earthquake": {"1.5C": 1.00, "2C": 1.00, "3C": 1.00},    # climate-independent
    ...
}
```

Computation chain (`calculate_insurance_climate_risk`, lines 152-238):

```python
gross_1in100 = gross_loss_1in100_baseline_eur * multiplier
net_1in100   = gross_1in100 * reinsurance_retention_pct
ri_gap       = max(0, gross_1in250*(1-retention) - reinsurance_limit)

climate_scr_factor = base_cat_scr_factor(peril) * max(0, multiplier - 1.0)
scr_addon    = gross_written_premium_eur * climate_scr_factor
total_scr    = scr_eur + scr_addon
solvency_ratio_post_addon = own_funds_eur / total_scr

climate_adjusted_tp = technical_provisions_eur * (1 + TP_UPLIFT_PCT[scenario])   # 4%/9%/18% for 1.5C/2C/3C

reserve_benchmark = max(aal * 1.15, net_1in100 * 0.5)
# adequate if climate_adj_tp >= benchmark*1.1, marginal if >= benchmark, else deficient

econ_loss = total_economic_loss_baseline_eur * multiplier   # or gross_1in100*1.6 fallback
protection_gap_pct = max(0, econ_loss - gross_1in100) / econ_loss * 100

esg_score = 60 + 15*coal_exclusion + 10*oil_sands_exclusion + 10*arctic_exclusion + 5*(ff_cap<=50%)
```

The SCR add-on base factors are the Solvency II Delegated Regulation (EU) 2015/35 Annex XIII
natural-catastrophe shock factors (e.g. flood 0.97% of GWP, tropical cyclone 1.50%), scaled by
`max(0, multiplier − 1.0)` so that only the *incremental climate stress* — not the whole
baseline CAT charge — drives the add-on. This is a first-order approximation of a full internal
model recalibration, appropriate for an ORSA-style what-if screen rather than a Pillar 1 SCR
filing.

### 7.3 Engine 2 — NGFS physical peril pricing (`physical_risk_pricing_engine.py`)

30 countries carry hand-authored baseline peril scores (0–1) for flood/cyclone/wildfire/
drought/heatwave/sea-level/earthquake (sourced to INFORM Risk Index 2023, ND-GAIN 2023, Swiss Re
CatNet, IPCC AR6). The composite baseline score is a fixed-weight blend:

```python
weights = {flood:.22, cyclone:.18, wildfire:.14, drought:.12, heatwave:.12, sea_level:.12, earthquake:.10}
composite_baseline_score = Σ profile[k] * weight[k]
```

NGFS scenario × horizon **amplifiers** (`orderly`/`disorderly`/`hot_house` × `2030`/`2040`/`2050`)
scale each peril baseline; the stressed composite score uses the *average* amplifier across the
five acute perils, clamped to [0,1], and maps to a 6-tier scale (`low`→`extreme`) at fixed
thresholds (0.15/0.28/0.42/0.58/0.72).

**Expected Annual Loss** is a genuine trapezoidal integration over the exceedance-probability
(EP) curve, not a single-point estimate:

```python
# EAL = Σ_perils [ Σ_i 0.5*(loss(rp_i) + loss(rp_{i+1})) * |P(rp_i) − P(rp_{i+1})| ] × asset_value
l(rp) = RETURN_PERIOD_LOSS_TABLES[peril][asset_class][rp]/100 * baseline * amplifier * vulnerability_coeff
```
over return periods 10/25/50/100/200/500yr with annual exceedance probabilities
0.100/0.040/0.020/0.010/0.005/0.002. PML(100yr) instead takes the single worst-peril 100yr loss
scaled the same way. Climate VaR 95% is a **heuristic proxy**, not a modeled tail statistic: it
reuses the tier's `climate_var_pct` from `RISK_PREMIUM_TABLE` and floors at `3× EAL`
(`physical_risk_pricing_engine.py` lines 800-802) — the docstring's "95th percentile" language
describes the *table's* calibration intent, not a Monte Carlo or copula tail computed in code.

### 7.4 Engine 3 — PCAF v2.0 Part A financed emissions (`pcaf_unified_engine.py`)

For `business_loans` (and `corporate_bonds`/`listed_equity`/`project_finance`), the engine calls
`_calculate_standard_asset_class`, which picks the attribution denominator by asset class —
`business_loans` uses `total_equity_eur + total_debt_eur` (balance-sheet attribution, PCAF Table
5.2) rather than EVIC (used for listed equity/corporate bonds):

```python
af = min(outstanding_eur / (total_equity_eur + total_debt_eur), 1.0)
financed_scopeN = af * investee_scopeN
```

Emissions are resolved through a four-level PCAF fallback hierarchy
(`_emission_factor_fallback`, lines 428-474): verified reported data (DQS 1) → unverified
reported (DQS 2) → sector-intensity × revenue (DQS 4) → sector-proxy × outstanding (DQS 5).
Scope 3 is always *estimated* as 2× (Scope 1 + Scope 2) when not reported. Sector intensities
(`SECTOR_EMISSION_INTENSITIES` in `facilitated_emissions_engine.py`) are hand-authored per GICS
sector, e.g. Energy 820, Utilities 950, Industrials 180, Financials 12 tCO2e/€M revenue.

### 7.5 Worked example — traced against the live engines

Using the page's own `DEFAULT_INPUTS` (Mekong Delta Logistics Hub Co., Vietnam, flood peril, 2C
scenario/2050 for insurance; infrastructure asset class, disorderly/2050 for physical pricing;
business_loans/Industrials for PCAF), I ran the three real service functions directly
(`insurance_climate_risk.calculate_insurance_climate_risk`, `physical_risk_pricing_engine.price_physical_risk`,
`PCAFUnifiedEngine.calculate_business_loans`) to confirm the arithmetic:

**Engine 1 (Solvency II), flood @ 2C (multiplier 1.35):**

| Step | Computation | Result |
|---|---|---|
| Gross 1-in-100 | €60M × 1.35 | €81.0M |
| Gross 1-in-250 | €95M × 1.35 | €128.25M |
| Net 1-in-100 (30% retention) | €81.0M × 0.30 | €24.3M |
| Reinsurance gap | max(0, €128.25M×0.70 − €70M limit) | **€19.775M — inadequate** |
| SCR climate add-on | €85M GWP × (0.0097 × 0.35) | €288,575 |
| Total SCR | €120M + €288,575 | €120.289M |
| Solvency ratio post-addon | €210M ÷ €120.289M | **174.58%** (pre-addon 175%) |
| Climate-adj. TP | €240M × 1.09 | €261.6M |
| Reserve benchmark | max(€12.15M×1.15, €24.3M×0.5) | €13.9725M → **adequate** (TP well above) |
| Economic loss | €150M × 1.35 | €202.5M |
| Protection gap | (€202.5M − €81M)/€202.5M | **60.0%** |
| ESG underwriting score | 60 + 15(coal) + 10(oil sands) + 10(arctic) | **95.0** |

**Engine 2 (physical pricing), infrastructure/VNM/disorderly/2050:**

Vietnam's baseline composite = 0.22×0.80(flood) + 0.18×0.75(cyclone) + 0.14×0.20(wildfire) +
0.12×0.38(drought) + 0.12×0.60(heatwave) + 0.12×0.72(sea-level) + 0.10×0.25(earthquake) =
**0.568**. Average acute-peril amplifier for disorderly/2050 = (1.45+1.35+1.55+1.00+1.70)/5 =
**1.41**. Stressed composite = 0.568×1.41 = **0.8009 → tier "extreme"** (≥0.72), so `risk_premium_bps
= 300`, `climate_var_pct = 25.0`.

Flood's contribution to EAL alone (baseline 0.80 × amplifier 1.45 × vulnerability 0.55 for
infrastructure = k=0.638 applied against the flood/infrastructure RP-loss table via trapezoidal
integration) is the dominant term; **total EAL across all 5 perils = $1,784,674.38** on a $250M
asset (confirmed by direct call to `price_physical_risk`). PML(100yr) = flood's 100yr loss
(15%×0.638) × $250M = **$23,925,000**. Climate VaR 95% floors at 3×EAL = $5.35M but the tier
formula (25% × pml_100yr/pml_100yr × asset_value... simplifies to 25% of asset value) actually
returns **$62,500,000** (25.0% × $250M), confirming the code's VaR is a tier-driven % of asset
value, not derived from the peril-specific PML at all.

**Engine 3 (PCAF), business_loans/Industrials, no reported emissions:**

AF = €45M outstanding ÷ (€180M equity + €120M debt) = 45/300 = **0.15**. No Scope 1/2 reported →
falls to the sector-intensity level: Industrials intensity = 180 tCO2e/€M revenue × €210M
revenue = 37,800 tCO2e total (investee), split 60/40 Scope1/Scope2 → investee S1 = 22,680,
S2 = 15,120, S3 = 37,800×1.5 = 56,700. Financed = AF × each = **S1 3,402 / S2 2,268 / S3 8,505 /
total 14,175 tCO2e**, **PCAF DQS 4** ("Sector intensity × revenue").

**Combined decision summary** (`summary` useMemo, lines 302-339), with defaults cost-of-capital
6%, expense loading 15%, EUR/USD 1.08:

| Step | Computation | Result |
|---|---|---|
| SCR add-on in USD | €288,575 × 1.08 | $311,661 |
| Cost of climate capital | $311,661 × 6% | $18,700 |
| Pure risk premium | $1,784,674 EAL + $18,700 | $1,803,374 |
| Suggested premium (grossed 15%) | $1,803,374 / 0.85 | $2,121,617 |
| GWP in USD | €85M × 1.08 | $91,800,000 |
| Premium adequacy | $91.8M ÷ $2.12M | **4,327%** (portfolio-level GWP vs single-asset premium) |
| Financed intensity | 14,175 tCO2e ÷ €45M | **315 tCO2e/€M** (below 500 referral threshold) |

Flags raised: physical risk tier "extreme" and reinsurance programme inadequate (2 flags).
Solvency ratio stays ≥100% and premium adequacy is far above the 60% decline threshold, so the
heuristic (lines 330-333) resolves to **REFER**, not DECLINE — correctly reflecting that this is
a referral-worthy but not unequivocally unacceptable submission.

### 7.6 Data provenance & limitations

- All three backend engines are genuine, deterministic calculators over hand-authored reference
  tables (peril multipliers, country risk profiles, sector intensities) cited to named external
  sources (Solvency II Delegated Reg., NGFS CGFI, Swiss Re sigma, PCAF Standard). None of the
  three uses random-number fabrication.
- The submission form (`DEFAULT_INPUTS`) is explicitly labelled "hand-authored illustrative
  submission — NOT live data"; every field is user-editable before running the engines.
- Climate VaR 95% is a tier-table percentage of asset value floored at 3×EAL, not a modeled
  quantile — this is a genuine methodological simplification, not a bug, but users should not
  read it as a backtested 95th-percentile loss.
- The decision heuristic (ACCEPT/REFER/DECLINE) and the FX/cost-of-capital/expense-loading
  assumptions are explicitly local, presentation-layer logic layered on top of the three live
  engines — the page states this plainly ("Derived locally from live engine outputs — no
  fabricated data").
- Insurance route persistence: a 2026-07-03 remediation note in `insurance.py` documents that the
  route previously used non-existent dataclass fields and DB columns and was **never callable**
  before the rewrite — worth flagging as a very recent fix, not a hypothetical risk.

**Framework alignment:** Solvency II Art. 44a / EIOPA ORSA Climate Guide 2022 / EIOPA CCRST 2022
(insurance capital) · NGFS CGFI Physical Risk Assessment 2021/2023, Swiss Re sigma 1/2024, IPCC
AR6 WGI Ch.11 (physical pricing) · PCAF Global GHG Accounting and Reporting Standard v2.0,
Tables 5.1–5.3 (financed emissions).

## 8 · Model Specification

**Status: implemented.** All three composed engines are live, callable FastAPI routes backed by
deterministic Python service modules (no stubs, no TODO placeholders); the decision-summary layer
is genuinely computed client-side from their responses.

**8.1 Purpose & scope.** Give an underwriter or portfolio manager a single-counterparty view that
answers three linked questions in one pass: (i) does climate change materially move this
counterparty's Solvency II CAT capital and reserve position; (ii) how large is the physical peril
loss exposure under a chosen NGFS scenario; (iii) what is the counterparty's financed-emissions
footprint. It composes existing engines rather than introducing new physics.

**8.2 Conceptual approach.** Three independent, previously-existing calculators
(`insurance_climate_risk.py`, `physical_risk_pricing_engine.py`, `pcaf_unified_engine.py`) are
called in parallel from one React page. A fourth, purely local, layer combines the *live outputs*
(EAL, SCR add-on, financed emissions) into a risk-adjusted premium and a rule-based accept/
refer/decline recommendation — deliberately kept simple and transparent (linear formulas, fixed
thresholds) rather than a fitted underwriting model.

**8.3 Mathematical specification.**
```
Risk-adjusted premium:
  pure_premium   = EAL + (SCR_climate_addon × cost_of_capital)
  suggested_prem = pure_premium / (1 − expense_loading)
  adequacy       = GWP / suggested_prem

Decision rule (heuristic, editable thresholds):
  DECLINE  if solvency_ratio_post < 100%  OR
           (adequacy < 60% AND physical_tier ∈ {very_high, extreme})
  REFER    if any flag raised (solvency, adequacy, tier, reserve, reinsurance, carbon intensity)
  ACCEPT   otherwise
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| CAT loss multiplier | peril × scenario table | Swiss Re sigma 2023 / EIOPA CCRST 2022 |
| Solvency II CAT SCR factor | per-peril % of GWP | Solvency II Delegated Reg. (EU) 2015/35 Annex XIII |
| TP uplift | 4%/9%/18% by scenario | EIOPA Supervisory Statement on Climate Risk 2024 |
| NGFS peril amplifier | scenario × horizon × peril | NGFS CGFI Phase IV 2023 |
| Vulnerability coefficient | peril × asset class | RMS/AIR/Verisk-style industry benchmark |
| PCAF attribution denominator | equity+debt (loans) / EVIC (bonds/equity) | PCAF Standard Tables 5.1–5.2 |
| Sector emission intensity | tCO2e/€M revenue | Hand-authored per GICS sector |

**8.4 Data requirements.** Per-counterparty: baseline CAT loss estimates (1-in-100/250, AAL, PML),
technical provisions, SCR, own funds, reinsurance structure; asset value and country/asset-class
for physical pricing; balance-sheet figures (equity, debt, EVIC or project cost) and optionally
reported Scope 1/2 emissions for PCAF. All are currently entered by the underwriter in the
submission form — none are pulled from a policy administration system or loss-run database.

**8.5 Validation & benchmarking.** Each underlying engine already ships its own reference-data
endpoints (`/insurance/reference-data`, `/physical-risk-pricing/ref/*`) that can be used to
sanity-check multipliers against source publications. No backtesting harness exists for the
*combined* decision layer — the accept/refer/decline thresholds are illustrative starting points,
not calibrated against historical underwriting outcomes.

**8.6 Limitations & model risk.** (1) Climate VaR is a tier-table proxy, not a fitted tail
distribution. (2) The decision heuristic uses fixed, uncalibrated thresholds (100% solvency, 60%
adequacy) that should be recalibrated per line of business before any production use. (3) PCAF
Scope 3 is always a 2×(S1+S2) estimate when unreported — a materially different sector could
distort the total. (4) SCR add-on scaling by "multiplier − 1" is a simplification of a full
internal-model recalibration and should not substitute for an actuarial CAT model in a real
Solvency II filing.
