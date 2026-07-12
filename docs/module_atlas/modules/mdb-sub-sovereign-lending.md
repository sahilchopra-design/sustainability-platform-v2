# MDB/DFI Sub-Sovereign Climate Lending Analytics
**Module ID:** `mdb-sub-sovereign-lending` · **Route:** `/mdb-sub-sovereign-lending` · **Tier:** B (frontend-computed) · **EP code:** EP-DY3 · **Sprint:** DY

## 1 · Overview
MDB/DFI sub-sovereign climate lending analytics covering sovereign guarantee structures, on-lending terms, fiscal space analysis, and climate co-financing ratios for World Bank, ADB, and AfDB operations.

> **Business value:** Provides analytical framework for MDB sub-sovereign climate lending decisions, integrating fiscal space analysis, co-financing ratio benchmarking, and sovereign guarantee structuring.

**How an analyst works this module:**
- Map sub-sovereign entity (city, state, utility, SOE) against MDB eligibility criteria and sovereign guarantee requirements
- Analyse fiscal space using IMF framework — revenue base, existing debt service, and debt sustainability thresholds
- Model on-lending structure: sovereign window rate, guarantee fee, sub-sovereign on-lending spread
- Calculate climate co-financing ratio and OECD DAC attribution across contributing financiers

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COUNTRY_ALLOCATIONS`, `INSTRUMENTS`, `Kpi`, `MDBS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `MDBS` | 8 | `name`, `type`, `aaa`, `climateTarget`, `totalLending`, `avgRate`, `avgTenor`, `guaranteeCap`, `subSovShare`, `greenShare`, `regions` |
| `INSTRUMENTS` | 7 | `pricing`, `tenor`, `guarantee`, `currency`, `useCase` |
| `COUNTRY_ALLOCATIONS` | 9 | `mdb`, `amount`, `sector`, `climateShare`, `tenor`, `rating` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `grantElement` | `((faceValue - pv) / faceValue) * 100;` |
| `annualBenefit` | `faceValue * (commercialRate - mdbRate) / 100;` |
| `pvSaving` | `Array.from({ length: tenor }, (_, t) => annualBenefit / Math.pow(1 + commercialRate / 100, t + 1)).reduce((a, b) => a + b, 0);` |
| `blendedRate` | `((blendRatio / 100) * mdbRate + ((100 - blendRatio) / 100) * commercialRate).toFixed(2);` |
| `totalClimate` | `MDBS.reduce((s, m) => s + m.totalLending * m.climateTarget / 100, 0);` |
| `totalLending` | `MDBS.reduce((s, m) => s + m.totalLending, 0);` |
| `allocationChart` | `COUNTRY_ALLOCATIONS.map(c => ({ country: c.country, amount: c.amount, climate: c.climateShare }));` |
| `costSavingCurve` | `useMemo(() => Array.from({ length: 10 }, (_, i) => ({ spread: (commercialRate - mdbRate - i * 0.3).toFixed(2), saving: (Number(pvSaving) * (1 - i * 0.08)).toFixed(1), })).filter(d => d.spread > 0), [pvSaving, mdbRate, commercialRate]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRY_ALLOCATIONS`, `INSTRUMENTS`, `MDBS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Climate Co-Financing Ratio | `Private and other public climate finance mobilised / MDB committed climate finance` | ADB climate finance tracking | World Bank Group target 3x mobilisation; higher ratios in middle-income countries (infrastructure) vs LDCs (grants needed) |
| Sub-Sovereign Fiscal Space | `Net present value of revenue capacity above existing debt service obligations` | IMF Article IV fiscal analysis | Determines maximum additional borrowing capacity for climate investment without crowding out essential services |
| On-Lending Spread | `Interest rate on-lent to sub-sovereign minus MDB sovereign window funding cost` | World Bank treasury pricing | Covers credit enhancement, administrative cost, and currency risk; concessional windows offer 50-100 bps |
- **IMF World Economic Outlook and Article IV reports** → GDP, revenue, debt stock by country → fiscal space calculation → **Sub-sovereign borrowing capacity**
- **MDB project databases (World Bank ARAP, ADB PPIS)** → Historical on-lending terms, co-financing ratios by sector → benchmark analysis → **Structuring comparables**
- **OECD DAC climate finance statistics** → Bilateral and multilateral climate finance flows by country → co-financing ratio validation → **Climate finance attribution**

## 5 · Intermediate Transformation Logic
**Methodology:** Sub-Sovereign Lending Capacity & Co-Financing Analytics
**Headline formula:** `Fiscal Space = Revenue × Coverage Ratio - Existing Debt Service; Co-Financing Ratio = Private Finance Mobilised / MDB Climate Finance Committed`

Assesses sub-sovereign borrowing capacity, sovereign guarantee terms, and private capital mobilisation ratio for MDB climate lending programmes

**Standards:** ['World Bank Sub-Sovereign Finance Guidelines', 'ADB Climate Finance Tracking Methodology', 'OECD DAC Climate Finance Reporting']
**Reference documents:** World Bank (2023) Sub-Sovereign and Structured Finance Primer; ADB (2023) Climate Finance Tracking and Reporting Methodology; AfDB (2022) Climate Change Action Plan and Co-Financing Guidelines; OECD DAC (2023) Climate-Related Official Development Finance

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry's headline formulas —
> `Fiscal Space = Revenue × Coverage Ratio − Existing Debt Service` and
> `Co-Financing Ratio = Private Finance Mobilised / MDB Climate Finance Committed` — **are not
> implemented anywhere in the code.** There is no revenue, coverage-ratio, or private-mobilisation
> field in this module at all. What the code *does* implement, correctly, is an **OECD DAC-style
> grant-element and concessionality calculator** plus a blended-rate mixer — a genuinely useful,
> textbook-correct piece of MDB loan-structuring finance that the guide doesn't mention. Sections
> below document the calculator as written; §8 specifies the missing Fiscal Space model.

### 7.1 What the module computes

Three live financial calculators operate on 7 MDBs (World Bank/IBRD, IFC, ADB, AIIB, IADB, AfDB,
EBRD) and a fixed instrument menu:

```js
// Grant element (OECD DAC methodology)
PV = Σ_{t=1}^{n} (FaceValue × Coupon) / (1+dr)^t  +  FaceValue / (1+dr)^n
GrantElement = max(0, (FaceValue − PV) / FaceValue × 100)      // dr = fixed 10% benchmark rate

// Concessionality benefit (PV of interest savings vs commercial rate)
AnnualBenefit = FaceValue × (CommercialRate − MdbRate) / 100
PVSaving = Σ_{t=1}^{n} AnnualBenefit / (1 + CommercialRate/100)^t

// Blended finance rate
BlendedRate = (BlendRatio/100) × MdbRate + (1 − BlendRatio/100) × CommercialRate
```

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Grant-element discount rate | 10% (hard-coded `benchmarkRate: 10`) | Matches the **pre-2018 OECD DAC flat discount rate** used to classify ODA concessionality (post-2018 DAC uses differentiated rates by income group, 1–10%; the code retains the simpler flat-10% convention) |
| `mdbRate` slider default | 4.85% | Roughly matches World Bank IBRD variable-spread lending rate order of magnitude |
| `commercialRate` slider default | 7.5% | Illustrative EM commercial benchmark spread over the MDB rate |
| MDB universe (`MDBS`) | 7 rows: `avgRate` 4.50–5.30%, `avgTenor` 10–25yr, `climateTarget` 35–50%, `guaranteeCap` $2–10Bn | Static, plausible-order-of-magnitude reference table, not sourced from live MDB treasury pricing |
| `COUNTRY_ALLOCATIONS` (8 rows) | amount, sector, climateShare, tenor, rating | Static illustrative allocations (e.g. India $9.8Bn, 62% climate share) |
| `INSTRUMENTS` menu (6 rows) | pricing spread ranges, tenor, guarantee type | Static reference table styled after real MDB instrument categories (sovereign OCR loan, PCG, green bond anchor, blended facility, PBG, local-currency loan) |

### 7.3 Calculation walkthrough

1. **Concessionality Engine tab** — user sets loan amount, MDB rate, commercial rate, tenor via
   sliders; `calcGrantElement` and `calcConcessionality` recompute on every change (`useMemo`-free,
   direct call each render).
2. **Grant element** discounts both the coupon stream and the face-value repayment at the fixed 10%
   benchmark, giving the DAC-standard "how much of this loan is effectively a grant" percentage.
3. **PV interest saving** discounts the *annual rate differential* (not the full debt service) at the
   commercial rate — this isolates the value of concessionality alone, separate from the loan's face
   value.
4. **Cost-saving curve** (`costSavingCurve`) sweeps 10 points of decreasing spread
   (`commercialRate − mdbRate − i×0.3`) against a linearly-decayed saving (`pvSaving × (1 − i×0.08)`)
   — a stylised sensitivity curve, not a re-run of the PV formula at each spread.
5. **Blended Finance tab** — `blendedRate` and the accompanying `LineChart` sweep `blendRatio` from
   0–75% in 5pp steps, re-applying the same linear-mix formula at each point.

### 7.4 Worked example

Defaults: `loanAmount=$100M`, `mdbRate=4.85%`, `commercialRate=7.5%`, `tenor=20yr`, `blendRatio=30%`,
benchmark discount rate `10%`.

**Grant element:**

| Step | Computation | Result |
|---|---|---|
| Annuity factor @10%, 20yr | (1 − 1.10⁻²⁰)/0.10 = (1 − 0.1486)/0.10 | 8.514 |
| PV of coupons | 100 × 0.0485 × 8.514 | $41.29M |
| PV of principal | 100 × 1.10⁻²⁰ = 100 × 0.1486 | $14.86M |
| Total PV | 41.29 + 14.86 | $56.15M |
| **Grant element** | (100 − 56.15)/100 × 100 | **43.9%** |

**PV interest saving:**

| Step | Computation | Result |
|---|---|---|
| Annual benefit | 100 × (7.5 − 4.85)/100 | $2.65M |
| Annuity factor @7.5%, 20yr | (1 − 1.075⁻²⁰)/0.075 ≈ (1 − 0.2354)/0.075 | 10.195 |
| **PV saving** | 2.65 × 10.195 | **$27.0M** |

**Blended rate:** `0.30 × 4.85 + 0.70 × 7.5 = 1.455 + 5.25 = 6.71%` — saves 0.79pp vs full commercial.

### 7.5 Companion analytics

- **MDB Landscape radar** — 5-metric radar (`climateTarget`, `greenShare`, `subSovShare`, tenor/3,
  guaranteeCap×10) is a display normalisation only, not a composite score.
- **Guarantee Instruments tab** — static KPIs (WB PCG utilisation 42%, IFC PRG pipeline $8.4Bn, MIGA
  exposure $25Bn) are hard-coded text, not computed.
- **Currency Risk tab** — entirely narrative reference cards (TCX Fund, IFC local-currency programme);
  no FX-hedging cost model.

### 7.6 Data provenance & limitations

- The grant-element and PV-saving formulas are **genuine, textbook-correct finance** — this is the
  one module in this batch where the calculation engine matches professional MDB loan-structuring
  practice, even though its inputs are illustrative sliders rather than live loan terms.
- The guide's Fiscal Space and Co-Financing Ratio metrics are **entirely absent** — no revenue,
  debt-service, or private-mobilisation field exists in the data model to support them (see §8).
- MDB reference table (`MDBS`) and country allocations are static, illustrative constants, not
  sourced from IMF Article IV, World Bank ARAP, or ADB PPIS as the guide's `dataLineage` claims.

**Framework alignment:** OECD DAC concessionality/grant-element methodology (implemented, flat 10%
discount-rate convention) · World Bank Sub-Sovereign Finance Guidelines and IFC Performance Standards
1–8 (referenced narratively, not computed) · MDB Paris Alignment Common Approach 2021 (named, not
scored).

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Implement the guide's Fiscal Space and Co-Financing Ratio metrics so sub-sovereign lending decisions
(city, utility, SOE borrowers) can be screened for both *borrowing capacity* and *MDB catalytic
effect*, alongside the existing (and correct) grant-element/blended-rate calculator.

### 8.2 Conceptual approach
Fiscal space follows the **IMF Debt Sustainability Analysis (DSA)** framework used in Article IV
consultations — revenue capacity net of existing debt service against a sustainable coverage
threshold — the same approach BlackRock Aladdin's sovereign risk module and Moody's sub-sovereign
methodology use to bound incremental borrowing capacity.

### 8.3 Mathematical specification

```
FiscalSpace = Revenue × CoverageRatio_max − ExistingDebtService
   where CoverageRatio_max is the maximum sustainable debt-service-to-revenue ratio
   for the entity's rating/income class (IMF DSA thresholds, typically 20–35% for sub-sovereigns)

CoFinancingRatio = PrivateFinanceMobilised / MDBClimateFinanceCommitted
   (unbounded ratio; report distribution, not a single point estimate, per §8.6 below)
```

| Parameter | Calibration source |
|---|---|
| `CoverageRatio_max` by rating band | IMF DSA thresholds for market-access vs. PRGT-eligible sub-sovereigns |
| Revenue base | IMF Article IV fiscal tables (own-source revenue + intergovernmental transfers) |
| Private mobilisation attribution | OECD DAC causality-attributed mobilisation (same methodology as §8 of `mdb-climate-finance-dh`) |

### 8.4 Data requirements
Sub-sovereign entity financials (revenue, existing debt stock/service, credit rating) and MDB
project-level co-financing records — the guide's own `dataLineage` already names IMF Article IV and
MDB project databases (World Bank ARAP, ADB PPIS) as sources, but neither is wired into the platform's
`reference_data` layer today.

### 8.5 Validation & benchmarking plan
Cross-check `FiscalSpace` outputs against IMF's own published DSA fiscal-space classifications
(where available) for the same entities; benchmark `CoFinancingRatio` distribution against the World
Bank Group's stated 3× mobilisation target and CPI's system-wide averages.

### 8.6 Limitations & model risk
Sub-sovereign revenue and debt data quality varies enormously by jurisdiction (many EM municipalities
lack audited financials); the model should degrade gracefully to a qualitative fiscal-space tier
(Constrained/Moderate/Ample) when point-estimate inputs are unavailable, rather than presenting a
false-precision dollar figure — consistent with how the existing grant-element calculator already
correctly floors results at zero rather than allowing negative concessionality.

## 9 · Future Evolution

### 9.1 Evolution A — Build the fiscal-space model onto the correct concessionality core (analytics ladder: rung 2 → 3)

**What.** §7's finding is unusually positive with a precise gap: the code implements a *textbook-correct* OECD DAC grant-element calculator (PV at the benchmark rate, `(Face − PV)/Face`), a concessionality-benefit PV, and a blended-rate mixer — genuinely useful loan-structuring math the guide doesn't even mention — while the guide's own headline formulas (`Fiscal Space = Revenue × Coverage − Debt Service`, co-financing ratio) have no implementation, and the grant-element discount rate is the **pre-2018 flat 10%** convention rather than post-2018 DAC's income-group-differentiated rates (1–10%). Evolution A: (1) modernise the DAC convention — differentiated discount rates by borrower income group, with the flat-10% retained as a labeled legacy toggle for historical comparability; (2) implement the fiscal-space model per the §7.6/§8 spec on IMF WEO data (public API: revenue, debt stock, GDP by country) so sub-sovereign borrowing capacity is computed, not asserted; (3) source the `MDBS` reference table's rates/tenors/guarantee caps to published treasury pricing pages with vintage.

**How.** (1) The income-group rate table is a small refdata addition; the calculator's PV machinery is unchanged. (2) `POST /mdb-sub-sovereign/fiscal-space` taking country + sub-sovereign revenue/debt inputs, joining IMF WEO country aggregates for the sovereign envelope, returning capacity with the coverage-ratio assumption disclosed. (3) The co-financing ratio joins the MDB family's shared reconciled data layer for the mobilisation numerator. (4) The on-lending structurer (sovereign window rate + guarantee fee + spread — the §1 workflow's step 3) built as an explicit waterfall over the existing sliders.

**Prerequisites.** IMF WEO ingestion (free API); the DAC-convention change validated against published grant-element examples. **Acceptance:** grant element for a reference loan matches the published DAC calculator under both conventions; fiscal space decomposes into cited IMF aggregates plus disclosed assumptions; MDB table rows carry sources.

### 9.2 Evolution B — Sub-sovereign structuring copilot for MDB desks (LLM tier 2)

**What.** The module's workflow is deal structuring with a teaching burden — sovereign clients ask *why* terms look as they do: "structure a $200M on-lending facility for a Kenyan water utility — window rate, guarantee fee, grant element under current DAC rules", "why does the blend ratio change concessionality classification?", "how much borrowing headroom does this state have before crowding out debt-service coverage?" Each runs the calculators as tool calls with the arithmetic narrated — the grant-element decomposition is exactly the kind of stepwise PV explanation LLMs excel at when the numbers come from a deterministic engine.

**How.** Tier 2: tool schemas over the grant-element/blended-rate/fiscal-space routes; structuring answers show the waterfall (funding cost → guarantee fee → admin → on-lending spread) with each component's source; DAC-classification claims state which convention (flat vs differentiated) was applied and why it matters for the borrower's income group. Fiscal-space answers always carry the coverage-ratio assumption and the IMF vintage — §4.1's point that capacity determines "borrowing without crowding out essential services" makes overconfident point estimates harmful, so ranges with assumptions are the format. Instrument-menu recommendations quote the curated `INSTRUMENTS` rows' use-case fields.

**Prerequisites.** Evolution A's routes (the calculators are frontend-only today); Phase 2 tooling. **Acceptance:** every rate/% figure traces to a tool call; grant-element explanations reproduce the PV steps; fiscal-space answers state assumptions and vintage; DAC convention always identified.