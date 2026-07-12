# Carbon Credit Registry & Offset Registration Analytics
**Module ID:** `ccts-offset-registration` · **Route:** `/ccts-offset-registration` · **Tier:** B (frontend-computed) · **EP code:** EP-EB2 · **Sprint:** EB

## 1 · Overview
Carbon credit registry and offset registration analytics comparing Verra, Gold Standard, CAR, and ACR registries. Covers serialisation standards, retirement tracking, double-counting prevention, and ICROA Code of Best Practice compliance.

> **Business value:** Delivers comprehensive carbon credit registry integrity analytics, enabling buyers to assess double-counting risk, retirement permanence, and ICROA/ICVCM compliance across major voluntary registries.

**How an analyst works this module:**
- Map credit serialisation structure across Verra, Gold Standard, CAR, ACR, and Climate Action Reserve
- Check cross-registry uniqueness and corresponding adjustment status for host country credits
- Verify retirement records are publicly accessible, irreversible, and vintage-matched to claimed reductions
- Score registry against ICROA Code of Best Practice and ICVCM Core Carbon Principles

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CCC_TIERS`, `DEFAULTS`, `METHODS`, `STATES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `CCC_TIERS` | `{ 'Low (₹500/t)': 500, 'Mid (₹1,200/t)': 1200, 'High (₹2,500/t)': 2500 };` |
| `rows` | `useMemo(() => s.assets.map(a => {` |
| `totalEru` | `rows.reduce((x, r) => x + r.eru, 0);` |
| `totalMw` | `s.assets.reduce((x, a) => x + a.mw, 0);` |
| `revenueYr` | `totalEru * price;` |
| `disc` | `s.discount > 0 ? (1 - Math.pow(1 + s.discount / 100, -s.crediting)) / (s.discount / 100) : s.crediting;` |
| `npv` | `revenueYr * disc;` |
| `bufferEru` | `totalEru * bufferPct;` |
| `netEru` | `totalEru - bufferEru;` |
| `age` | `Math.max(0, cy - r.vintage);` |
| `vintageAdjPrice` | `price * vintageMix;` |
| `priceBand` | `useMemo(() => { const mids = CCC_PRICE_HISTORY.map(p => p.mid);` |
| `lows` | `CCC_PRICE_HISTORY.map(p => p.low);` |
| `highs` | `CCC_PRICE_HISTORY.map(p => p.high);` |
| `avg` | `(arr) => arr.reduce((x, y) => x + y, 0) / arr.length;` |
| `discF` | `dr > 0 ? (1 - Math.pow(1 + dr, -s.crediting)) / dr : s.crediting;` |
| `base` | `{ price, eru: totalEru, buffer: 1 - bufferPct, crediting: s.crediting, discount: s.discount / 100 };` |
| `stackRows` | `useMemo(() => Object.entries(STACKING).map(([k, v]) => {` |
| `uplift` | `active ? v.mid * netEru * v.convertFactor / 1e7 : 0;` |
| `stackTotalCr` | `stackRows.reduce((x, r) => x + r.upliftCr, 0);` |
| `weighted` | `Object.keys(W).reduce((x, k) => x + (s.compliance[k] \|\| 0) * W[k] / 100, 0);` |
| `total` | `Object.values(W).reduce((x, y) => x + y, 0);` |
| `totalMonths` | `REGISTRY_CYCLE.reduce((x, p) => x + p.months, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-computed`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Registry Integrity Score | `0.25×Serialisation + 0.25×Retirement + 0.25×DoubleCount + 0.25×Transparency` | ICROA registry review | Verra and Gold Standard score 80-90; newer registries 60-75; ICVCM CCP label requires >75 |
| Double-Counting Risk Index | `1 - exclusive registry controls score` | ICVCM CCP assessment | Risks arise from corresponding adjustments absence (Article 6.2), bilateral use, and re-issuance across registries |
| Retirement Integrity Rate | `Credits with confirmed irreversible retirement / total retired credits` | Registry serialisation audit | Near 100% required; gaps indicate potential re-use; Verra public retirement database enables verification |
- **Registry serialisation databases (Verra, GSF, CAR, ACR)** → Serial number ranges, project IDs, vintage, retirement records → integrity checks → **Double-counting and retirement integrity scores**
- **UNFCCC Article 6 corresponding adjustment database** → Host country authorisation and adjustment records → sovereign double-counting risk → **Article 6 compliance flag**
- **ICROA/ICVCM assessment reports** → Registry-level quality assessments → benchmark scores for peer comparison → **Registry integrity ranking**

## 5 · Intermediate Transformation Logic
**Methodology:** Registry Integrity Scoring
**Headline formula:** `Registry Score = 0.25×Serialisation + 0.25×Retirement + 0.25×DoubleCount + 0.25×Transparency; Double-Count Risk = 1 - Σ(exclusive_registry_flags)`

Assesses registry-level and transaction-level integrity across serialisation uniqueness, retirement permanence, double-counting controls, and public transparency

**Standards:** ['ICROA Code of Best Practice v2.0', 'VCMI Claims Code of Practice', 'ICVCM Core Carbon Principles 2023']
**Reference documents:** ICROA (2023) Code of Best Practice for Voluntary Carbon Markets v2.0; ICVCM (2023) Core Carbon Principles Assessment Framework; VCMI (2023) Claims Code of Practice; UNFCCC (2022) Article 6 Rulebook — Corresponding Adjustments

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `AdvisoryReference`, `AdvisoryToolkit`

## 7 · Methodology Deep Dive

The MODULE_GUIDES entry (registry integrity scoring across Verra/GS/CAR/ACR + ICROA/ICVCM) partially
overlaps with the code, but the module is actually an **India CCTS offset-registration and valuation
tool**: it computes Carbon Credit Certificate (CCC) emission-reduction units (ERUs) from India's CEA
grid emission factors, applies a buffer pool and vintage-adjusted pricing, runs an additionality
test, an NPV, a Monte Carlo, and an integrity-weighted registration-readiness score. The guide's
`Registry Score = 0.25·Serialisation + …` composite is a different framing; the code's compliance
score is a 7-dimension weighted integrity index. Reference data is **real** (CEA CO2 Baseline
Database v20.0), so this is a genuinely functional module.

### 7.1 What the module computes

**ERU per asset** (combined-margin baseline minus project):
```
eru = max(0, mwh · (baselineEF − projectEF) · conservatism)     // tCO2e
```
`conservatism` is a per-method factor from `BEE_METHODS` (Solar PV 1.00, rooftop 0.95, biomass 0.90…).

**Buffer pool** (method-weighted):
`bufferPct = Σ BUFFER_POOL[method] · (eru_method / totalEru)`; `netEru = totalEru − bufferEru`.

**Valuation:**
```
revenueYr = totalEru · price(tier)          // ₹500 / ₹1,200 / ₹2,500 per tonne
disc      = (1 − (1+r)^(−n)) / r            // annuity factor, r=discount, n=crediting yrs
npv       = revenueYr · disc
vintageAdjPrice = price · Σ VINTAGE_CURVE[age] · (eru/totalEru)
```

**Additionality:** four flags (investment, technology, common-practice, regulatory-barrier);
common-practice auto-derived by comparing state PV penetration to the method's threshold; pass if
≥3 flags true.

**Compliance/integrity score:** weighted sum of 7 dimensions (baselineRule, conservatism, mrvQuality,
additionality, permanence, leakage, stakeholder) via `METHOD_COMPLIANCE_WEIGHTS`.

### 7.2 Parameterisation / scoring rubric

| Element | Value | Provenance |
|---|---|---|
| State grid EFs | RJ 0.78, GJ 0.72, KA 0.61, TN 0.58 … tCO₂/MWh | `CEA_GRID_EF` — **CEA CO₂ Baseline Database v20.0 (FY2023-24)** |
| National EF | 0.716 tCO₂/MWh | CEA v20.0 |
| Method conservatism | Solar PV 1.00, rooftop 0.95, wind 0.98, biomass 0.90 | `BEE_METHODS` — CCTS/BEE catalogue |
| Penetration thresholds | Solar PV 30%, rooftop 15%, wind 35% | `BEE_METHODS` — common-practice test |
| CCC price tiers | ₹500 / ₹1,200 / ₹2,500 per tonne | `CCC_TIERS` — India CCC market bands |
| Buffer pool / vintage curve | per method / by age | `BUFFER_POOL`, `VINTAGE_CURVE` (shared reference) |
| Default assets (RJ/GJ/KA/TN, 50–25 MW) | hard-coded demo portfolio | Illustrative |

### 7.3 Calculation walkthrough

Each asset's ERU = generation × (baseline − project EF) × method conservatism. Baseline EFs default
to the asset's state CEA value; project EF is ~0 for solar. Total ERU feeds a method-weighted buffer
deduction → net ERU. Revenue = net ERU × selected CCC tier; NPV discounts an annuity over the
crediting period. Additionality auto-checks common practice via state PV penetration vs threshold.
Registration is "ready" when ≥3 additionality flags pass, ERU > 0, and a project name is set. A Monte
Carlo (`monteCarlo`, 2,000 runs) and tornado sensitivity stress the valuation.

### 7.4 Worked example (default portfolio)

Asset 1 (Rajasthan PV-1): `mwh=98,500`, baselineEF=0.78, projectEF=0, conservatism (Solar PV)=1.00
→ `eru = 98,500·0.78·1.00 = 76,830 tCO₂e`. Asset 2 (Gujarat): 78,000·0.72 = 56,160. Asset 3 (KA):
69,000·0.61 = 42,090. Asset 4 (TN rooftop): 44,000·0.58·0.95 = 24,244.
`totalEru ≈ 199,324 tCO₂e/yr`. At the Mid tier (₹1,200/t): `revenueYr ≈ ₹239.2M`. With discount 8%,
n=10: annuity factor = (1−1.08⁻¹⁰)/0.08 = 6.710 → `NPV ≈ ₹1,605M (~₹160 crore)`. TN penetration
below rooftop's 15% threshold contributes a common-practice pass.

### 7.5 Data provenance & limitations
- Grid EFs and method catalogue are **real reference data** (CEA v20.0, BEE/CCTS catalogue) — not
  PRNG. The default asset portfolio is illustrative.
- No `sr()` synthetic data in the calculation path; Monte Carlo uses a shared stochastic engine.
- ERU uses a single baseline EF per asset (state combined-margin), not a full TOOL07 OM/BM split;
  grid-loss and curtailment factors noted in `BEE_METHODS.notes` are not all applied in the ERU line.
- CCC price tiers are discrete bands, not a live market curve.

**Framework alignment:** **India CCTS** (Carbon Credit Trading Scheme, BEE/MoP) — the ERU
quantification, conservatism factors and CCC pricing follow the CCTS compliance-market design.
**ICVCM Core Carbon Principles** and **ICROA Code of Best Practice** (guide) inform the integrity
score's additionality/permanence/MRV dimensions. **UNFCCC Article 6.2** corresponding-adjustment
status is offered as a credit-stacking toggle. CEA grid EFs are the authoritative Indian baseline
source; the combined-margin convention mirrors CDM TOOL07.

## 9 · Future Evolution

### 9.1 Evolution A — CEA baseline auto-refresh and CCTS rulebook alignment (analytics ladder: rung 2 → 3)

**What.** §7 establishes this is a genuinely functional India CCTS valuation tool —
real CEA CO₂ Baseline Database v20.0 emission factors, a combined-margin ERU
calculation with per-method conservatism, method-weighted buffer pools, NPV, and a
Monte Carlo — despite the guide describing a different (registry-integrity-scoring)
module. Evolution A hardens it to calibrated status: the CEA factors become a versioned
reference table with vintage tracking (CEA publishes annually; v20.0 will silently
stale), the CCC price tiers (₹500/1,200/2,500) get replaced by an updatable price
reference as ICEX/IEX carbon trading data emerges under the live CCTS compliance
market, and the 7-dimension integrity index's weights get documented against the
actual CCTS (Compliance Mechanism) Rules 2023 obligations.

**How.** (1) `ref_cea_grid_ef(version, region, om, bm, cm)` refdata table + a staleness
banner when the loaded vintage is >18 months old. (2) Monte Carlo output validated:
percentiles pinned in a bench case so the platform's PRNG standardization applies.
(3) Guide rewritten to describe the module that exists — §7's mismatch is framing-level
and must clear.

**Prerequisites.** CEA database redistribution terms checked; guide↔code
reconciliation is part of the deliverable, not optional. **Acceptance:** swapping CEA
v19→v20 factors changes ERUs with both vintages displayed; the bench Monte Carlo
percentile pin passes across runs.

### 9.2 Evolution B — CCTS registration analyst (LLM tier 2)

**What.** A tool-calling assistant for Indian project developers: "value my 40MW solar
asset under the mid CCC tier with 10% discount rate", "which BEE method gives the best
conservatism factor for rooftop?", "what does the additionality test require?" — the
first two executed by re-invoking the page's real ERU/NPV/Monte-Carlo functions
(client-side; the module is frontend-computed with no API routes), the third answered
from the CCTS rulebook citations in the corpus.

**How.** Tool schemas over the valuation functions with typed parameters
(method, mwh, CCC tier, discount); the no-fabrication validator matches every ₹ and
tCO₂e figure to an invocation; registration-readiness questions narrate the
7-dimension integrity index's actual computed sub-scores. The system prompt states
plainly that CCC prices are scenario tiers, not market quotes.

**Prerequisites.** Evolution A's guide fix, so RAG retrieval doesn't serve the wrong
module description (the current guide text would mislead the copilot about what this
page does). **Acceptance:** a valuation answer reproduces the on-page NPV to the rupee
for identical inputs; asked for today's CCC market price, the copilot states tiers are
assumptions.