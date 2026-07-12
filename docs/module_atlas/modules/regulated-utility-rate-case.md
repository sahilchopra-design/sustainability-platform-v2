# Regulated Utility Rate Case Analytics
**Module ID:** `regulated-utility-rate-case` · **Route:** `/regulated-utility-rate-case` · **Tier:** B (frontend-computed) · **EP code:** EP-EL3 · **Sprint:** EL

## 1 · Overview
Cost-of-service framework for 12 US investor-owned utilities (IOUs) across FERC and state PUC jurisdictions, detailed rate base build-up (original cost, ADIT, CWIP), revenue requirement decomposition, 16-year allowed vs earned ROE history with Fed Funds overlay, case timeline visualisation (41-week standard process), 10-year capex forecast by programme, and WACC calculator with equity ratio sensitivity.

> **Business value:** Used by utility equity analysts modelling allowed return evolution, rate case expert witnesses preparing cost-of-capital testimony, and fixed income investors assessing regulatory compact quality across US state PUC jurisdictions.

**How an analyst works this module:**
- Review 12-utility table for allowed vs earned ROE gap and regulatory lag by jurisdiction to identify best/worst regulatory compacts
- On Rate Base Build-Up tab, review original cost build including ADIT deduction (TCJA §168k) and CWIP addition
- Use Revenue Requirement tab to understand the full cost-of-service waterfall from return on rate base to total revenue requirement
- In WACC Calculator, adjust equity ratio, ROE, and debt cost to compute allowed return and compare to filed revenue requirement

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CAPEX_FORECAST`, `CASE_TIMELINE`, `KpiCard`, `Pill`, `RATE_BASE_COMPONENTS`, `REGULATORY_RADAR`, `REVENUE_REQUIREMENT`, `ROE_HISTORY`, `UTILITIES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `UTILITIES` | 13 | `name`, `jurisdiction`, `type`, `rate_base`, `allowed_roe`, `earned_roe`, `lag_days`, `equity_ratio`, `last_case`, `case_freq`, `capex_5yr`, `settlement`, `pending`, `revenue_req`, `test_year` |
| `RATE_BASE_COMPONENTS` | 11 | `value`, `type` |
| `REVENUE_REQUIREMENT` | 11 | `value`, `basis` |
| `CASE_TIMELINE` | 9 | `start_wk`, `duration_wk`, `milestone` |
| `REGULATORY_RADAR` | 7 | `value` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `displayed` | `useMemo(() => filterPending ? UTILITIES.filter(u => u.pending) : UTILITIES, [filterPending]);  const wacc = (equityRatio/100 * roeAssumption + (1-equityRatio/100) * debtCost * (1-0.21)).toFixed(2);` |
| `allowedReturn` | `(util.rate_base * +wacc / 100 / 1000).toFixed(2);` |
| `lagCost` | `Math.round(util.rate_base * (util.allowed_roe - util.earned_roe) / 100 * util.lag_days / 365);` |
| `avgROE` | `(UTILITIES.reduce((s,u) => s+u.allowed_roe, 0)/UTILITIES.length).toFixed(2);` |
| `avgLag` | `Math.round(UTILITIES.reduce((s,u) => s+u.lag_days, 0)/UTILITIES.length);` |
| `totalRateBase` | `UTILITIES.reduce((s,u) => s+u.rate_base, 0);` |
| `settlementRate` | `Math.round(UTILITIES.filter(u=>u.settlement).length/UTILITIES.length*100);` |
| `tabs` | `['Utility Universe', 'Rate Base Build-Up', 'Revenue Requirement', 'ROE Trends', 'Case Timeline', 'Capex Recovery', 'WACC Calculator'];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CASE_TIMELINE`, `RATE_BASE_COMPONENTS`, `REGULATORY_RADAR`, `REVENUE_REQUIREMENT`, `UTILITIES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Median allowed ROE (US electric) | `2023 NARUC annual survey; 12-month rolling` | NARUC Rate Case Survey Q4 2023 | Range 9.3-10.2% across states; historically 11.5% pre-2012 rate cycle; decline tracking 10yr UST compression + lower market risk premium. |
| Median regulatory lag (US) | `Filing to new rates effective — contested cases` | EEI Rate Case Activity 2023 | Settlement cases average 240 days; litigated full cases 420+ days; FERC formula rates have zero lag — key advantage for large interstate utilities. |
| Capex recovery mechanisms | `Estimated share of spend recovered outside base rates` | Edison Electric Institute 2023 | Reduces effective regulatory lag for capex; FERC formula rates cover all transmission capex; state riders vary by jurisdiction and programme type. |
- **NARUC Rate Case Survey + FERC USoA + EEI Financial Review + SNL Energy Rate Case Database + Moody's utility rating methodology + S&P regulated utility scorecard** → 12-IOU rate case table + rate base build + revenue requirement + ROE history + case timeline + capex forecast + WACC calculator → **Utility equity analysts, rate case expert witnesses, utility bond investors assessing allowed return trajectory, and regulatory economists preparing testimony**

## 5 · Intermediate Transformation Logic
**Methodology:** Rate Case Cost of Service & WACC
**Headline formula:** `Revenue_Req = (Rate_Base × WACC_after_tax) + Depreciation + O&M + Taxes + Revenue_Grossup; WACC_AT = Eq_Ratio × ROE + (1 − Eq_Ratio) × Cost_LTD × (1 − Tax_Rate); Reg_Lag_Cost = Rate_Base × (ROE_allowed − ROE_earned) × Lag_Days/365; AFUDC_Equity = CWIP × Equity_AFUDC_Rate`

Pacific Gas & Electric: $52Bn rate base, 510-day regulatory lag, earned 9.4% vs allowed 10.0% ROE — $328M annual regulatory lag cost; longest lag in peer group reflects CPUC complexity and wildfire liability proceedings.

**Standards:** ['FERC Uniform System of Accounts 18 CFR Part 101', 'Edison Electric Institute Rate Case Summary 2023', 'NARUC Utility Rate Design Manual']
**Reference documents:** NARUC (2023) – Annual Survey of Rate Case Activity; FERC (2023) – Order 1000 and Electric Rate Case Activity; Edison Electric Institute (2023) – Financial Review of the US Electric Power Industry

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

This is one of the platform's most faithfully-grounded modules: 12 **named real US investor-owned
utilities** (Duke Energy Carolinas, PG&E, Dominion VA, Xcel Energy Colorado, etc.) carry curated
rate-case fields (rate base, allowed/earned ROE, regulatory lag days, equity ratio, capex) that
appear to be researched, plausible figures rather than random draws — no `sr()` appears in the
static `UTILITIES` array. The genuine calculation layer sits in the WACC calculator and lag-cost
formula:

```js
WACC_after_tax = equityRatio × ROE + (1 − equityRatio) × debtCost × (1 − 0.21)     // 21% = US federal statutory corp tax rate (TCJA)
allowedReturn  = rateBase × WACC / 100 / 1000                                       // $M → $Bn scaling
lagCost        = round(rateBase × (allowedROE − earnedROE) / 100 / 1000 × lagDays / 365 × 1000)
```

### 7.2 Parameterisation — the 12-utility dataset (spot-checked)

| Utility | Rate base ($M) | Allowed ROE | Earned ROE | Lag (days) | Equity ratio |
|---|---|---|---|---|---|
| Duke Energy Carolinas | 28,400 | 9.9% | 9.7% | 312 | 52% |
| Xcel Energy Colorado | 14,200 | 9.5% | 9.2% | 420 | 49% |
| **Pacific Gas & Electric** | **52,000** | **10.0%** | **9.4%** | **510** | 52% |
| Dominion VA | 31,200 | 9.6% | 9.4% | 278 | 53% |
| Puget Sound Energy | 12,400 | 9.4% | 9.1% | 445 | 51% |

Portfolio average allowed ROE across all 12: **9.69%** (matches the guide's cited "Median allowed
ROE (US electric) 9.6%" closely). Portfolio average lag: **343 days**; true median (sorted 12
values, mean of 6th/7th) = **310 days** — both in the same order of magnitude as the guide's cited
"Median regulatory lag 328 days," though neither the code's mean nor its exact median reproduces
328 precisely; treat the guide figure as an independently-sourced reference statistic (EEI Rate
Case Activity 2023) rather than a value recomputed live from this 12-utility sample.

**Verified defect — PG&E lag-cost figure does not match the guide's own worked example.** The
guide states: *"Pacific Gas & Electric: $52Bn rate base, 510-day regulatory lag, earned 9.4% vs
allowed 10.0% ROE — **$328M annual regulatory lag cost**."* Running the code's own `lagCost`
formula on PG&E's exact row (`rate_base=52000`, `allowed_roe=10.0`, `earned_roe=9.4`,
`lag_days=510`):

```
lagCost = round(52000 × (10.0−9.4) / 100 / 1000 × 510 / 365 × 1000)
        = round(52000 × 0.6 / 100 / 1000 × 510/365 × 1000)
        = round(312 / 1000 × 1.3973 × 1000)
        = round(0.312 × 1.3973 × 1000)
        = round(436.0)
        = 436
```

The code produces **$436M**, not the guide's stated **$328M** — a ~33% overstatement relative to
the guide's own cited figure for the exact same utility, using the exact same input fields quoted
in the guide's `brief` text. Either the guide's $328M was computed with a different (undisclosed)
formula, or the code's formula has since drifted from what originally produced that figure — a
model-validation reviewer would flag this reconciliation gap and require one canonical formula.

### 7.3 Calculation walkthrough

1. **Utility Universe tab**: 12-row table, `filterPending` toggle to show only utilities with
   `pending=true` cases (currently 3 of 12: Xcel Colorado, Evergy Kansas, Puget Sound Energy).
2. **Rate Base Build-Up tab**: `RATE_BASE_COMPONENTS`, a static FERC-USoA-style waterfall (Gross
   Plant → less Accumulated Depreciation → Net Plant + CWIP + Working Capital − Deferred Tax −
   Customer Advances → Total Rate Base $12,765M) — correctly includes the TCJA-driven "Deferred
   Income Tax (Offset)" deduction as a rate-base reducer, matching real ADIT/EDIT ratemaking
   treatment.
3. **Revenue Requirement tab**: `REVENUE_REQUIREMENT`, a static cost-of-service waterfall (Return
   on Rate Base via WACC → + D&A → + O&M → + Taxes → + Revenue Grossup → Total $4,168M) —
   internally consistent: `Return on Rate Base 882 = 6.91% × 12,765` checks out
   (`12,765×0.0691=882.3` ✓).
4. **ROE Trends tab**: `ROE_HISTORY`, a 32-half-year (2000–2015, `2000+floor(i/2)`) synthetic
   series — `median_allowed = 12.5 − i×0.12 + sr(i×7)×0.4`, `median_earned` similarly, `fed_funds`
   a piecewise approximation of the real Fed Funds cycle (high ~2000, cut to near-zero
   post-2008/2020, rising post-2022) — the **only** seeded-random series in the file, used to show
   a declining-ROE-trend-with-noise narrative against a genuinely shaped Fed Funds proxy.
5. **Case Timeline tab**: `CASE_TIMELINE`, 8 phases summing to a **41-week standard process**
   (Pre-Filing 12wk → Filed 1wk → Discovery 8wk → Hearings 4wk → Briefing 6wk → Deliberation 8wk →
   Rate Effective 2wk), matching the guide's own "41-week standard process" description.
6. **Capex Recovery tab**: `CAPEX_FORECAST`, 10-year (2025–2034) `maintenance = 420 + sr(i×7)×80`
   projection — seeded-random noise around a rising base, illustrative rather than utility-specific.
7. **WACC Calculator tab**: interactive — user sets `equityRatio`, `roeAssumption`, `debtCost`;
   live `wacc = equityRatio×ROE + (1−equityRatio)×debtCost×(1−0.21)` and `allowedReturn =
   rateBase×wacc/100/1000` for the utility selected.

### 7.4 Worked example — WACC calculator

`equityRatio=52%`, `roeAssumption=9.9%`, `debtCost=4.8%` (Duke Energy Carolinas' own profile):

| Step | Formula | Result |
|---|---|---|
| Equity component | `0.52 × 9.9` | 5.148 |
| Debt component (after-tax) | `0.48 × 4.8 × (1−0.21)` | `0.48×4.8×0.79=1.820` |
| **WACC (after-tax)** | `5.148+1.820` | **6.97%** |
| Allowed return ($Bn) | `28,400 × 6.97/100/1000` | **$1.98Bn** |

### 7.5 Companion analytics

Utility Universe (12-utility sortable table), Rate Base Build-Up, Revenue Requirement, ROE Trends
(32-period history + Fed Funds overlay), Case Timeline (41-week Gantt), Capex Recovery
(2025–2034 10-year forecast), WACC Calculator (interactive sensitivity tool).

### 7.6 Data provenance & limitations

- **The 12-utility dataset and rate-base/revenue-requirement waterfalls are curated**, not
  `sr()`-seeded, and are internally arithmetic-consistent where checked (`Return on Rate Base`
  line ties out to `WACC × Rate Base`) — one of the stronger data-provenance profiles in this batch.
- **The `lagCost` formula does not reproduce the guide's own cited $328M PG&E figure** (§7.2) —
  this is a genuine, reproducible discrepancy that should be resolved before citing either number
  externally.
- ROE Trends and Capex Recovery are the only seeded-random series; both are illustrative
  trajectories, not utility-specific projections.
- No actual FERC Uniform System of Accounts account-level detail exists beyond the 10-line
  rate-base summary — a production model would need per-account (Account 101–108, 254, 281–283,
  etc.) granularity for regulatory filing use.

**Framework alignment:** FERC Uniform System of Accounts (18 CFR Part 101) — rate-base build-up
structure (gross plant, accumulated depreciation, CWIP, ADIT) is directionally correct · NARUC
Annual Survey of Rate Case Activity — cited for allowed-ROE benchmarking, roughly consistent with
the dataset's own 9.69% average · EEI Rate Case Activity — cited for the 41-week case timeline and
regulatory-lag framing, both structurally represented in the code · AFUDC (Allowance for Funds
Used During Construction) — named in the guide's acronym list (CWIP earning AFUDC) but not
separately computed as a distinct revenue-requirement line item in this module.

## 9 · Future Evolution

### 9.1 Evolution A — Account-level rate-base model with filed-data ingestion (analytics ladder: rung 2 → 3)

**What.** This is one of the strongest-grounded B-tier pages: 12 named IOUs with researched rate-case fields, a correct after-tax WACC (21% TCJA rate), and internally consistent waterfalls ("Return on Rate Base ties out to WACC × Rate Base" per §7.6). Its documented gaps: the `lagCost` formula fails to reproduce the guide's own cited $328M PG&E figure — a genuine, unresolved discrepancy — the ROE Trends and Capex Recovery series are the file's only seeded-random elements, and the rate base is a 10-line summary rather than the FERC Uniform System of Accounts detail a filing-grade model needs. Evolution A resolves the discrepancy, kills the seeded series, and deepens toward account granularity.

**How.** (1) First, reconcile lagCost: derive both the code's and the guide's PG&E numbers by hand, document the correct convention (lag applied to the ROE gap vs the full revenue deficiency), and pin it in bench_quant — this is a small task with outsized credibility value. (2) Ingest FERC Form 1 data (public, machine-readable via the FERC XBRL programme) for the 12 utilities: per-account plant balances (101–108), ADIT (281–283), giving the rate-base build real account rows and making the 16-year ROE history actual filed data instead of a seeded trajectory. (3) `POST /api/v1/rate-case/revenue-requirement` computing the waterfall server-side from account inputs, with the WACC sensitivity grid as a documented sweep.

**Prerequisites.** FERC Form 1 ingestion scoped (XBRL since 2021, CSV dumps before); the lagCost convention decision recorded. **Acceptance:** lagCost reproduces a documented reference figure; the PG&E rate-base build sums from ingested account balances; no `sr()` remains in the file.

### 9.2 Evolution B — Testimony-support analyst for cost-of-capital work (LLM tier 2)

**What.** The module's stated users include rate-case expert witnesses. Evolution B supports the testimony workflow: "compare Xcel Colorado's 420-day regulatory lag and allowed-vs-earned gap against the 12-utility panel — is their compact below median?", "draft the WACC sensitivity exhibit narrative at 48–54% equity ratios", "what did this utility's allowed ROE do across its last three cases?" — each grounded in the ingested Form 1 / rate-case data via tool calls.

**How.** Tier-2 tool schemas over the Evolution-A endpoints (revenue requirement, WACC grid, panel comparisons); the system prompt encodes regulatory-testimony discipline — every figure carries its docket/form-year source, comparisons state the panel's composition, and the copilot never opines on what a commission *should* allow (it reports panel statistics and computed sensitivities; advocacy is the witness's job). Exhibit drafts render as tables through report studio with a data-vintage footer. Golden Q&A built from the reconciled PG&E worked example.

**Prerequisites.** Evolution A's data layer (testimony support on unverifiable curated figures would be professionally risky for users); docket metadata per rate-case row. **Acceptance:** every ROE/lag/$M figure in a draft exhibit traces to a tool response with its source year; normative should-allow questions get the documented refusal.