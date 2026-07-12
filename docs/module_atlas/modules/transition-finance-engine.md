# Transition Finance Credibility Engine
**Module ID:** `transition-finance-engine` · **Route:** `/transition-finance-engine` · **Tier:** A (backend vertical) · **EP code:** EP-DI2 · **Sprint:** DI

## 1 · Overview
Transition finance credibility engine for high-emitting sectors including steel, cement, shipping, aviation, and oil & gas. Assesses transition taxonomy eligibility, Paris-aligned capex share, and transition assessment readiness score against the ICMA Climate Transition Finance Handbook.

> **Business value:** Provides an objective, ICMA-aligned credibility score for transition finance instruments across hard-to-abate sectors, quantifying CapEx alignment gaps and target robustness.

**How an analyst works this module:**
- Classify sector and identify applicable transition pathway (SBTi, IEA, EU TEG sector)
- Score transition strategy, capex alignment, targets, and governance using ICMA four-pillar framework
- Map Paris-aligned capex share and intensity trajectory against benchmark decarbonisation pathway
- Generate transition finance eligibility determination and issuer TA-Score with peer comparison

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BOND_TYPES`, `CREDIBILITY_CRITERIA`, `KpiCard`, `Slider`, `TABS`, `TAXONOMY_ALIGNMENT`, `TRANSITION_SECTORS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `TRANSITION_SECTORS` | 9 | `emissions`, `pathway`, `timeline`, `capex`, `credibility`, `framework` |
| `TAXONOMY_ALIGNMENT` | 5 | `eligible`, `transitional`, `excluded` |
| `CREDIBILITY_CRITERIA` | 7 | `weight`, `desc`, `assessment` |
| `BOND_TYPES` | 6 | `useOfProceeds`, `taxonomy`, `greenwashRisk`, `mktAcceptance`, `avgSize` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `allIn` | `baseRate / 100 - greeniumBps / 10000;` |
| `annInt` | `principalM * allIn;` |
| `carbonSaving` | `(ghgIntensityNow - ghgIntensityTarget) * revenue * carbonPriceFwd / 1e6;` |
| `pvSaving` | `carbonSaving * (1 - Math.pow(1 + w, -maturityYr)) / w;` |
| `effectiveCost` | `annInt - carbonSaving;` |
| `credScore` | `useMemo(() => { return CREDIBILITY_CRITERIA.reduce((s, c, i) => s + credScores[i] * c.weight / 100, 0);` |
| `pathwayData` | `useMemo(() => Array.from({ length: maturity + 1 }, (_, y) => ({` |
| `portfolioData` | `useMemo(() => Array.from({ length: 8 }, (_, i) => ({ company: `Borrower ${i + 1}`, sector: TRANSITION_SECTORS[i % TRANSITION_SECTORS.length].sector, exposure: +(50 + sr(i * 7) * 200).toFixed(0), credibility: +(40 + sr(i * 13) * 55).toFixed(0), onTrack: sr(i * 3) > 0.35, nextReview: `Q${(i % 4) + 1} 2025`, })), []);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/transition-finance/assess` | `assess_credibility` | api/v1/routes/transition_finance.py |
| POST | `/api/v1/transition-finance/portfolio-temperature` | `portfolio_temperature` | api/v1/routes/transition_finance.py |
| POST | `/api/v1/transition-finance/instrument-screen` | `instrument_screen` | api/v1/routes/transition_finance.py |
| GET | `/api/v1/transition-finance/ref/tpt-elements` | `ref_tpt_elements` | api/v1/routes/transition_finance.py |
| GET | `/api/v1/transition-finance/ref/sbti-criteria` | `ref_sbti_criteria` | api/v1/routes/transition_finance.py |
| GET | `/api/v1/transition-finance/ref/race-to-zero` | `ref_race_to_zero` | api/v1/routes/transition_finance.py |
| GET | `/api/v1/transition-finance/ref/sector-pathways` | `ref_sector_pathways` | api/v1/routes/transition_finance.py |
| GET | `/api/v1/transition-finance/ref/gfanz-expectations` | `ref_gfanz_expectations` | api/v1/routes/transition_finance.py |

### 2.3 Engine `transition_finance_engine` (services/transition_finance_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_score_tpt_element` | element_id, element_inputs | Score a single TPT element 0-1 from user-provided sub-element scores or qualitative tier. element_inputs: dict with optional keys 'score' (float 0-1) or 'sub_scores' (list of floats). |
| `_get_quality_tier` | score |  |
| `_calculate_waci` | holdings | WACI = Σ(weight_i × tCO2e_i / revenue_i_M) holdings: list of {weight: float, tco2e: float, revenue_usd_mn: float} |
| `_implied_temperature` | waci | Estimate implied portfolio temperature from WACI using linear interpolation between benchmark anchors: WACI 100 → 1.5°C WACI 300 → 2.5°C WACI 600 → 3.5°C Simplified proxy; full TCFD/SBTi approach requires sector-specific SDA. |
| `_detect_red_flags` | tpt_score, sbti_score, rtz_score, tpt_inputs, sbti_inputs | Identify greenwash / credibility red flags. |
| `assess_transition_finance_credibility` | entity_name, sector, tpt_inputs, sbti_inputs, rtz_inputs, portfolio_inputs, tnfd_inputs | Full transition finance credibility assessment. Scores: - TPT 6-element composite (weighted) - SBTi validation criteria - Race to Zero 5 Cs - Portfolio temperature alignment (WACI-based) - TNFD LEAP nature integration - Overall credibility composite + red flags |
| `calculate_portfolio_temperature` | holdings, engagement_coverage_pct, paris_aligned_pct | Calculate portfolio temperature alignment using WACI and implied temperature. holdings: list of { name: str, weight: float (sum to 1.0), tco2e: float, revenue_usd_mn: float, has_sbti: bool (optional), sbti_temperature: float (optional) } |
| `screen_transition_instrument` | instrument_type, entity_name, sector, kpis, spts, has_transition_plan, transition_plan_tier, sbti_status | Screen a transition finance instrument against applicable credibility criteria. instrument_type: transition_bond / sustainability_linked_loan / transition_loan_facility / blended_finance_transition |
| `get_transition_benchmarks` |  | Return consolidated benchmark and reference data for transition finance analysis. |

**Engine `transition_finance_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `WACI_UNIT` | `'tCO2e / USD mn revenue'` |
| `IMPLIED_TEMP_BASE_WACI` | `300.0` |
| `IMPLIED_TEMP_15C_WACI` | `100.0` |
| `IMPLIED_TEMP_3C_WACI` | `600.0` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `BOND_TYPES`, `CREDIBILITY_CRITERIA`, `TABS`, `TAXONOMY_ALIGNMENT`, `TRANSITION_SECTORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Transition Assessment Score | `0.3×Strategy + 0.25×CapexAlignment + 0.25×Targets + 0.2×Governance` | ICMA Transition Finance Handbook criteria | Scores above 70 indicate credible transition; 50-70 requires monitoring; below 50 raises greenwashing risk |
| Paris-Aligned CapEx Share | `Climate-directed capex / total capex (3yr avg)` | Company sustainability report | IEA NZE scenario requires >50% green capex share by 2025 for high-emitters; current gap quantified |
| Scope 1+2 Intensity Trajectory | `Current intensity / base year intensity - 1` | GHG inventory (ISO 14064) | Must align with sector decarbonisation pathway; steel SBTi pathway requires -4.2%/yr |
- **Company sustainability reports / CDP disclosures** → CapEx breakdown, Scope 1+2 data, net-zero target details → scoring inputs → **ICMA four-pillar TA-Score**
- **SBTi target validation database** → Approved targets by sector → Paris-alignment benchmark trajectory → **CapEx gap analysis vs pathway**
- **IEA NZE sector roadmaps** → Technology deployment milestones and investment requirements → credibility benchmarks → **Sector-specific eligibility determination**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/transition-finance/ref/gfanz-expectations** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'version', 'expectations', 'transition_instrument_criteria', 'credibility_framework_weights', 'greenwash_red_flags'], 'n_keys': 6}`

**GET /api/v1/transition-finance/ref/race-to-zero** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'overview', 'five_cs', 'membership_categories', 'key_requirements_summary', 'total_members_2023', 'financial_assets_committed_usd_tn'], 'n_keys': 7}`

**GET /api/v1/transition-finance/ref/sbti-criteria** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'standard_version', 'criteria', 'validation_process', 'near_term_requirements', 'long_term_requirements', 'sector_specific_pathways'], 'n_keys': 7}`

**GET /api/v1/transition-finance/ref/sector-pathways** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'note', 'pathways', 'high_climate_impact_sectors', 'sector_count', 'key_milestones'], 'n_keys': 6}`

**GET /api/v1/transition-finance/ref/tpt-elements** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'elements', 'quality_tiers', 'total_weight', 'element_weights_summary', 'composite_scoring'], 'n_keys': 6}`

**POST /api/v1/transition-finance/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/transition-finance/instrument-screen** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/transition-finance/portfolio-temperature** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Transition Readiness Scoring
**Headline formula:** `TA-Score = 0.3×Strategy + 0.25×CapexAlignment + 0.25×Targets + 0.2×Governance; Paris CapEx Share = Climate CapEx / Total CapEx`

Composite scoring of strategic ambition, Paris-aligned capital allocation, science-based target quality, and governance for transition credibility assessment

**Standards:** ['ICMA Climate Transition Finance Handbook 2020', 'EU Platform on Sustainable Finance — Transition Finance Report', 'Science Based Targets initiative Corporate Net-Zero Standard']
**Reference documents:** ICMA (2020) Climate Transition Finance Handbook; IEA (2023) Net Zero by 2050 — Sector Transition Roadmaps; SBTi (2023) Corporate Net-Zero Standard v1.1; EU Platform on Sustainable Finance (2022) Transition Finance Report

**Engine `transition_finance_engine` — extracted transformation lines:**
```python
score = sum(scores) / len(scores) if scores else 0.0
WACI = Σ(weight_i × tCO2e_i / revenue_i_M)
frac = (waci - IMPLIED_TEMP_15C_WACI) / (IMPLIED_TEMP_BASE_WACI - IMPLIED_TEMP_15C_WACI)
frac = (waci - IMPLIED_TEMP_BASE_WACI) / (IMPLIED_TEMP_3C_WACI - IMPLIED_TEMP_BASE_WACI)
score = 1.0  # full marks for N/A criteria (e.g. FLAG for non-land sector)
leap_score = len(leap_stages_completed) / max_leap
sbtn_score = sbtn_steps / 5
tnfd_score = round((leap_score + sbtn_score) / 2.0, 3)
composite = score_sum / n_checks if n_checks > 0 else 0.0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **46** other module(s).
**Shared engines (edits propagate!):** `transition_finance_engine` (used by 3 modules)

| Connected module | Shared via |
|---|---|
| `transition-finance` | engine:transition_finance_engine, table:exc |
| `transition-finance-screener` | engine:transition_finance_engine, table:exc |
| `blended-finance-structuring` | table:exc |
| `supply-chain-esg-hub` | table:exc |
| `carbon-accounting-ai` | table:exc |
| `green-hydrogen-lcoh` | table:exc |
| `just-transition-finance-hub` | table:exc |
| `adaptation-finance` | table:exc |
| `modern-slavery-intel` | table:exc |
| `supply-chain-resilience` | table:exc |

## 7 · Methodology Deep Dive

### 7.1 What the module computes

Unlike most transition-finance pages on this platform, this module's headline "Transition Loan
Pricing" calculator (`calcTransitionLoan()`) is a **genuine deterministic financial formula**, not a
PRNG draw — but it contains what appears to be a real unit/formula defect (see §7.4/§7.6). The rest
of the page (sector pathway table, taxonomy alignment matrix, bond-type navigator, credibility
scoring weights) is static reference content; only the credibility default scores and the 8-row
demo loan portfolio use the seeded PRNG `sr(s)=frac(sin(s+1)×10⁴)`.

```js
allIn        = baseRate/100 + (baseRate/100 − greeniumBps/10000)   // see §7.4 — likely doubles baseRate
annInt       = principalM × allIn
carbonSaving = (ghgIntensityNow − ghgIntensityTarget) × revenue/1000 × carbonPriceFwd
pvSaving     = carbonSaving × (1 − (1+w)^−maturityYr) / w            // standard annuity PV factor
effectiveCost = annInt − carbonSaving
```

### 7.2 Parameterisation

| Input | Default | Role |
|---|---|---|
| `principalM` | $300M | Loan principal |
| `baseRate` | 5.5% | Reference lending rate |
| `greeniumBps` | 15bps | Rate discount for meeting transition KPIs |
| `carbonPriceFwd` | $100/tCO2 | Forward carbon price used to value avoided emissions |
| `ghgIntensityNow` / `ghgIntensityTarget` | 850 / 550 (units unspecified — implied tCO2e per $M revenue) | Emissions-intensity glide path |
| `maturityYr` | 7 years | Loan tenor |
| `wacc` | 6% | Discount rate for the PV of carbon savings |
| `CREDIBILITY_CRITERIA` weights | Paris-Aligned Pathway 25%, CapEx Plan 20%, Carbon Lock-In 20%, Revenue Exposure 15%, Governance 10%, Regulatory Alignment 10% | Platform-defined, sums to 100%; conceptually mirrors GFANZ/ICMA transition-credibility dimensions |
| `credScores` defaults | `round(50 + sr(criterion.weight)×40)` | Seeded per-criterion default (weight value reused as PRNG seed — same 6 defaults for every user/session) |
| `TRANSITION_SECTORS` | 8 hard-to-abate sectors with real emissions intensity figures (Agriculture 5,800, Real Estate 3,900, Steel 2,600...) and named pathways/frameworks | Hand-curated, directionally realistic reference table |
| Paris-aligned decline rate | 7.2%/yr (`Math.pow(1-0.072, y)`) | Closely matches the widely-cited ~7.6%/yr global emissions cut required for 1.5°C (UNEP Emissions Gap Report) — a genuinely well-calibrated constant |

### 7.3 Calculation walkthrough

1. **All-in rate**: intended to be "base rate net of greenium discount"; see §7.4 for the formula
   defect.
2. **Annual interest cost**: `principalM × allIn`, in $M since `principalM` is denominated in $M.
3. **Carbon saving**: `(intensity gap) × revenue/1000 × carbon price` — if intensity is tCO2e/$M
   revenue and `revenue` is in $M, this yields an **absolute dollar figure** (not $M), because
   dividing revenue by 1000 converts $M→$Bn while the intensity gap is per-$M — the two scales are
   not obviously reconciled in the formula as written.
4. **PV of carbon savings**: correctly applies the standard growing/level annuity present-value
   factor `(1−(1+w)^−n)/w` to the (potentially mis-scaled) `carbonSaving` figure.
5. **Effective cost**: `annInt − carbonSaving` nets the $M-scale interest cost against the
   (likely $-scale, ~1000× larger in absolute terms once revenue is large) carbon saving — see the
   worked example, where this produces a nonsensical sign/magnitude.
6. **Sector pathway chart** (`pathwayData`): three curves per year — autonomous 2%/yr intensity
   decline (business-as-usual glide), linear interpolation to the target by maturity, and a 7.2%/yr
   "Paris-aligned" decline — purely descriptive, not fed by `calcTransitionLoan`.
7. **Credibility score**: `Σ credScores[i] × weight[i] / 100` — this piece is a correctly implemented
   weighted average (unlike several sibling modules that only claim to be weighted).

### 7.4 Worked example (default sliders)

| Step | Computation | Result |
|---|---|---|
| All-in rate | `5.5/100 + (5.5/100 − 15/10000)` | **10.85%** — note this is *higher* than the 5.5% base rate despite a positive greenium discount, because the formula adds a second copy of `baseRate/100` instead of subtracting the greenium from a single copy |
| *(intended formula)* | `5.5/100 − 15/10000` | 5.35% — the economically sensible "base rate minus greenium" result |
| Annual interest | `300 × 0.1085` | **$32.55M** |
| Carbon saving | `(850−550) × 2000/1000 × 100` | **60,000** (units ambiguous — reads as $ if intensity is tCO2e/$M and revenue $M) |
| PV of saving (7yr, 6% WACC) | `60,000 × (1−1.06⁻⁷)/0.06` | **334,943** |
| Effective cost | `32.55(−$M) − 60,000` | **−59,967** |

The effective cost calculation mixes an $M-scale quantity (`annInt`) with what reads as an
absolute-dollar-scale quantity (`carbonSaving`), producing a deeply negative "effective cost" whose
magnitude (−$60,000, i.e. a huge implied *profit* from carbon savings) is not economically credible
at these input scales — a genuine unit-consistency defect, not merely synthetic-data noise.

### 7.5 Companion analytics

- **Sector Pathways tab** — the 8-sector reference table with real, directionally-calibrated
  emissions-intensity figures and named decarbonisation pathways/frameworks (Hydrogen DRI/EAF for
  steel, CCS for cement, SAF for aviation).
- **Taxonomy Alignment tab** — 4 real taxonomy frameworks (EU Taxonomy DNSH, ICMA Climate Bonds,
  ASEAN Taxonomy, Singapore-Asia Taxonomy) each with eligible/transitional/excluded activity lists —
  descriptive reference content, not applied to any specific deal.
- **Bond Type Navigator** — 5 instrument types with greenwash-risk and market-acceptance labels.
- **Portfolio Monitoring tab** — 8 synthetic borrower rows (`sr()`-seeded exposure/credibility/
  on-track flag), independent of the pricing calculator.

### 7.6 Data provenance & limitations

- The **loan-pricing calculator's core formula appears to contain a defect**: `allIn` effectively
  doubles the base rate before applying the greenium discount rather than subtracting the greenium
  from a single base rate, and `carbonSaving`/`pvSaving`/`effectiveCost` mix $M-scale and
  absolute-dollar-scale quantities without reconciliation. This is exactly the kind of formula a
  bank model-validation function (SR 11-7 / SS1/23 effective-challenge review) would reject — see
  §8 for a corrected specification.
- Sector emissions-intensity figures and taxonomy eligibility lists are hand-curated and
  directionally reasonable but not cited to a specific data vintage or source document.
- `credScores` defaults reuse each criterion's *weight* value as its own PRNG seed, so the same 6
  starting scores appear for every user on every session — not a meaningful per-deal default.

### 7.7 Framework alignment

- **GFANZ Transition Finance Principles**: the 6 listed principles (1.5°C alignment, whole-economy
  view, no new carbon lock-in, just transition, credible plans, annual disclosure) are accurately
  restated from GFANZ's actual published framework.
- **EU Taxonomy / ICMA Climate Bonds / ASEAN / Singapore-Asia Taxonomy**: eligible/transitional/
  excluded classifications are broadly accurate high-level summaries of each real framework's
  current stance on gas, nuclear, and coal.
- **ICMA SLB Principles / LMA Green & Transition Loan Principles**: correctly cited as the governing
  standards for the 5 bond/loan types in the navigator.

## 8 · Model Specification — Transition Loan Pricing & Carbon-Adjusted Cost of Capital

**Status: specification — not yet implemented in code.** (The current `calcTransitionLoan()`
function is a defective placeholder per §7.4/§7.6; this section specifies the production model that
should replace it.)

### 8.1 Purpose & scope
Prices a bank's transition/sustainability-linked loan by (a) setting the KPI-contingent coupon
discount ("greenium") and (b) quantifying the borrower-level and lender-level value of the
emissions-intensity glide path financed by the loan. Scope: single-name corporate transition loans
in hard-to-abate sectors (steel, cement, chemicals, shipping, aviation, power).

### 8.2 Conceptual approach
Mirrors two industry precedents: (1) **LMA/APLMA Sustainability-Linked Loan Principles** pricing
grids, where the margin adjusts ±X bps based on KPI/SPT performance against a baseline — used here
for the coupon side; (2) **carbon-adjusted DCF / shadow-carbon-pricing** practice (as used in
Moody's transition-risk-adjusted credit metrics and MSCI Climate VaR revenue-at-risk models), used
here to value the avoided-carbon-cost cash flow stream separately from the loan's interest cash
flows, then combine both into a single lender NPV rather than netting mismatched units.

### 8.3 Mathematical specification

```
allIn_rate(t)   = baseRate − greeniumBps(t)/10000                      [dimensionless annual rate]
greeniumBps(t)  = greeniumBps_max × KPI_performance_ratio(t)           [KPI ratchet, capped]
annInt(t)       = principal × allIn_rate(t)                            [$, same currency unit as principal]

carbonSavingAnnual(t) = ΔIntensity(t) × outputVolume(t) × carbonPriceFwd(t)
  where ΔIntensity(t) = intensityNow − intensityPath(t)   [tCO2e per unit output]
        outputVolume(t) in physical/revenue units consistent with ΔIntensity's denominator
        — CRITICAL: outputVolume and ΔIntensity must share the same denominator (e.g. both
          per-$M-revenue, or both per-tonne-output); never divide revenue by an ad hoc scalar.

PV(carbonSaving) = Σ_{t=1}^{n} carbonSavingAnnual(t) / (1+wacc)^t     [level-annuity or path-specific]

LenderNPV = -principal + Σ_t annInt(t)/(1+r_lender)^t + principal/(1+r_lender)^n
BorrowerNetCost = Σ_t [annInt(t) − carbonSavingAnnual(t)] / (1+wacc)^t   [only valid once units reconciled]
```

| Parameter | Calibration source |
|---|---|
| `greeniumBps_max` | LMA SLLP market survey (typical 10–50bps net range) |
| `carbonPriceFwd(t)` | NGFS Phase IV / IEA NZE carbon price trajectories by scenario |
| `intensityPath(t)` | SBTi Sectoral Decarbonization Approach (SDA) pathway for the borrower's sector |
| `wacc`, `r_lender` | Borrower-specific WACC (CAPM) / bank's internal cost of funds |

### 8.4 Data requirements
Borrower emissions intensity time series (Scope 1+2, ideally 3), sector SDA pathway, forward carbon
curve (already available via the platform's `reference_data` carbon-price tables), loan terms
(principal, tenor, base rate, greenium grid), and borrower revenue/output volume in a denominator
consistent with the intensity metric.

### 8.5 Validation & benchmarking plan
Unit-consistency assertion tests (dimensional analysis on every intermediate quantity) as a
pre-commit gate; backtest greenium-adjusted spreads against LMA SLLP market survey medians;
reconcile `PV(carbonSaving)` against the platform's own `carbon-price-ets-engine` forward curve
outputs for the same scenario.

### 8.6 Limitations & model risk
Emissions-intensity glide paths are inherently uncertain (execution risk on capex plans); carbon
price forward curves are scenario-dependent and can diverge materially from realised prices;
greenium ratchets create an incentive-compatibility risk if KPIs are set unambitiously (already
flagged as a real-world SLB market concern in `transition-bond-credibility`).

## 9 · Future Evolution

### 9.1 Evolution A — Fix the loan-pricing formula's rate-doubling and unit defects per §8 (analytics ladder: rung 2 → 3)

**What.** This module's `calcTransitionLoan()` is a genuine deterministic financial calculator — not PRNG (§7.1) — with a correctly-implemented weighted credibility score and a well-calibrated 7.2%/yr Paris decline constant. But §7.4/§7.6 document two real defects a bank model-validation function (SR 11-7 / SS1/23) would reject: (1) `allIn = baseRate/100 + (baseRate/100 − greeniumBps/10000)` **doubles the base rate** — the default sliders yield 10.85% instead of the sensible 5.35% (base minus greenium); (2) `carbonSaving`/`effectiveCost` mix $M-scale interest against absolute-dollar-scale carbon savings, producing a nonsensical −$60,000 "effective cost." The §8 model specification already writes the corrected version.

**How.** (1) Fix `allIn_rate = baseRate − greeniumBps/10000` (§8.3) — a one-line correction with outsized impact. (2) Reconcile units per §8.3's CRITICAL note: `ΔIntensity` and `outputVolume` must share a denominator (both per-$M-revenue or both per-tonne); add dimensional-analysis assertion tests as a pre-commit gate (§8.5). (3) Separate lender NPV from borrower net cost rather than netting mismatched units into one `effectiveCost`. (4) Drive `carbonPriceFwd` and `intensityPath` from real curves — the platform's `reference_data` carbon-price tables and SBTi SDA pathways (§8.4), reconciling PV against the `carbon-price-ets-engine` (§8.5). (5) Replace `credScores` defaults that reuse the weight as PRNG seed (§7.6) with a neutral default or user input.

**Prerequisites.** The §8.5 unit-consistency test harness; carbon-forward and SDA reference data (largely in-platform). Note the shared-engine 46-module blast radius (§6). **Acceptance:** default sliders yield all-in 5.35% not 10.85%; `effectiveCost` is dimensionally sound and sign-sensible; dimensional-analysis tests gate the pricing function; a `bench_quant` pin fixes the corrected worked example.

### 9.2 Evolution B — Transition-loan structuring copilot with tool-called pricing (LLM tier 2)

**What.** A copilot for the loan structuring desk: "price a $300M 7-year steel transition loan at 5.5% base with a 15bps greenium, targeting 550 tCO₂e/$M by maturity", "at what carbon-forward does the borrower's net cost turn positive?" — executing the corrected `calcTransitionLoan` and the credibility scorer as tools, and explaining the ICMA four-pillar TA-Score decomposition.

**How.** Tier 2 over the corrected engine plus the module's genuinely-real reference layer (the 8-sector pathway table with real intensity figures, the four-taxonomy alignment matrix, the ICMA/LMA-cited bond-type navigator — all §7.5 confirms accurate). Tool schemas derive from the mapped routes once Evolution A fixes the three failing POSTs (shared with the sibling `transition-finance` module). Grounding corpus is this Atlas page — §7 and the §8 spec give the copilot exact formula semantics — plus the `ref/*` payloads. The fabrication validator checks every rate, PV, and score against tool output; the copilot must carry §8.6's model-risk caveats (glide-path execution risk, scenario-dependent carbon curves, unambitious-KPI incentive risk).

**Prerequisites (hard).** Evolution A — a copilot narrating today's rate-doubled, unit-broken pricing would confidently produce numbers a validator rejects. **Acceptance:** every priced figure traces to the corrected engine tool; TA-Score weights match `ref/gfanz-expectations`; the copilot surfaces the §8.6 model-risk limitations when asked to price, not just the point number.