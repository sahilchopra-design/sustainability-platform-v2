# Baseline & Additionality Analyzer
**Module ID:** `baseline-additionality-analyzer` · **Route:** `/baseline-additionality-analyzer` · **Tier:** B (frontend-computed) · **EP code:** EP-DQ2 · **Sprint:** DQ

## 1 · Overview
Implements the UNFCCC additionality and baseline methodology suite — TOOL01 (project additionality), TOOL02 (financial analysis), TOOL21 (suppressed demand), and TOOL07 baseline emission factors. Provides barrier analysis, investment analysis (IRR/NPV with bisection), and regulatory surplus demonstration.

> **Business value:** Required for all CDM, GS4GG, VCS, and Article 6.4 project registration. Provides UNFCCC TOOL01/TOOL02-grade additionality analysis with bisection IRR calculation and audit-ready documentation for validation/verification body review.

**How an analyst works this module:**
- Input project financials for TOOL02 investment analysis
- Run IRR/NPV calculation with and without carbon revenue
- Demonstrate regulatory surplus (Step 1)
- Identify barriers using Step 3 qualitative framework
- Generate UNFCCC-format additionality annex for PDD

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `ASSESSORS`, `BARRIERS`, `COUNTRIES`, `KpiCard`, `PENETRATION`, `PROJECTS`, `PROJ_TYPES`, `RegBox`, `ResultBadge`, `SDG_OPTIONS`, `SliderRow`, `TABS`, `TECH_TYPES`, `TOOL07_DATA`, `TOOLS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TOOLS` | `['TOOL01','TOOL02','TOOL07','TOOL21','TOOL01+TOOL02'];` |
| `BARRIERS` | `['Investment','Technological','Prevailing Practice','Institutional/Regulatory'];` |
| `wacc` | `8 + sr(i * 7 + 1) * 7;` |
| `irr` | `4 + sr(i * 11 + 2) * 16;` |
| `capex` | `500000 + sr(i * 13 + 3) * 9500000;` |
| `rev` | `80000 + sr(i * 17 + 4) * 1920000;` |
| `pen` | `sr(i * 19 + 5) * 25;` |
| `PENETRATION` | `COUNTRIES.map((c, ci) => ({` |
| `TOOL07_DATA` | `COUNTRIES.map((c, ci) => ({` |
| `TABS` | `['Assessment Pipeline','TOOL01 Investment Analysis','TOOL02 Common Practice','TOOL07 Grid EF','TOOL21 Small-Scale','Barrier Analysis Matrix','Sensitivity & Scenarios','Validation Evidence Log'];` |
| `fmt` | `(n, d = 0) => n == null ? '—' : Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });` |
| `fmtM` | `n => `$${(n / 1e6).toFixed(2)}M`;` |
| `fmtK` | `n => `$${(n / 1000).toFixed(0)}K`;` |
| `map` | `{ Additional: T.green, 'Non-Additional': T.red, Pending: T.amber };` |
| `noAdd` | `PROJECTS.filter(p => p.additionalityResult === 'Non-Additional').length;` |
| `avgIRR` | `PROJECTS.reduce((s, p) => s + p.irr, 0) / Math.max(1, PROJECTS.length);` |
| `avgWACC` | `PROJECTS.reduce((s, p) => s + p.wacc, 0) / Math.max(1, PROJECTS.length);` |
| `tool01` | `useMemo(() => { const carbonRev = t1Credits * t1Price;` |
| `cfNC` | `t1RevNC - t1Om;` |
| `cfC` | `t1RevNC + carbonRev - t1Om;` |
| `npvNC` | `-t1Capex, npvC = -t1Capex;` |
| `mid` | `(lo + hi) / 2;` |
| `payback` | `cfNC > 0 ? t1Capex / cfNC : Infinity;` |
| `bcRatio` | `cfNC > 0 ? (npvNC + t1Capex) / t1Capex : 0;` |
| `scenarios` | `[5, 10, 15, 20, 25].map(cp => {` |
| `cfS` | `t1RevNC + t1Credits * cp - t1Om;` |
| `t7Total` | `t7GridData.plants.reduce((s, p) => s + p.share, 0);` |
| `t7OM` | `t7GridData.plants.reduce((s, p) => s + (p.share / Math.max(1, t7Total)) * p.ef, 0);` |
| `t7BMTotal` | `t7GridData.recentPlants.reduce((s, p) => s + p.mw, 0);` |
| `t7BM` | `t7GridData.recentPlants.reduce((s, p) => s + (p.mw / Math.max(1, t7BMTotal)) * p.ef, 0);` |
| `t7CM` | `t7WOm * t7OM + (1 - t7WOm) * t7BM;` |
| `t21Result` | `useMemo(() => { if (t21Step1 === true)  return { step: 1, result: 'NON-ADDITIONAL', color: T.red, reason: 'Required by law — cannot be additional per UNFCCC Decision 17/CP.7' };` |
| `waccSens` | `WACC_RANGE.map(w => ({` |
| `priceSens` | `PRICE_RANGE.map(pr => ({` |
| `penSens` | `PEN_RANGE.map(th => ({` |
| `avgBarrier` | `p.barriers.reduce((s, b) => s + b, 0) / 4;` |
| `cnt` | `Math.floor(sr(ci * 91 + 20) * 30);` |
| `avg` | `p.barriers.reduce((s, b) => s + b, 0) / 4;` |
| `vals` | `PROJECTS.map(p => p.barriers[bi]);` |
| `prev` | `i > 0 ? waccSens[i - 1].addl : s.addl;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSESSORS`, `BARRIERS`, `COUNTRIES`, `EVID_ITEMS`, `PEN_RANGE`, `PRICE_RANGE`, `PROJ_TYPES`, `SDG_OPTIONS`, `TABS`, `TECH_TYPES`, `TOOLS`, `WACC_RANGE`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Additionality Rejection Rate | — | UNFCCC CDM Review Statistics 2023 | ~15% of CDM projects rejected at validation for insufficient additionality demonstration |
| Financial Test IRR Threshold | — | TOOL02 v6 Guidance 2012 | Investment barrier established if project IRR without carbon finance < (WACC - 2%); sensitivity tested at ±20% |
| Barrier Test Coverage | — | UNFCCC CDM EB Analysis 2022 | 70%+ of registered CDM projects rely on barrier analysis — most common: first-of-its-kind, technology risk |
- **Project financial model (CapEx, OpEx, revenue)** → TOOL02 investment analysis → **Project IRR/NPV with and without carbon finance**
- **Regulatory compliance records** → Step 1 regulatory surplus → **Evidence project exceeds legal requirements**
- **Technology deployment data in sector/region** → Common practice analysis → **Market penetration rate vs 20% threshold for non-common practice**

## 5 · Intermediate Transformation Logic
**Methodology:** TOOL01 Additionality Assessment
**Headline formula:** `Additionality: Project not viable without CDM/VCM revenue; IRR_withoutCarbon < WACC; NPV_withoutCarbon < 0; BarrierIdentified; NotCommonPractice`

TOOL01 uses 3 steps: Step 1 regulatory surplus, Step 2 investment analysis (IRR/NPV with bisection convergence to 0.01%), Step 3 barrier analysis — any single barrier suffices for additionality

**Standards:** ['TOOL01 v8 — Tool for the Demonstration of Additionality 2012', 'TOOL02 v6 — Tool for the Assessment of the Investment Barrier 2012', 'TOOL21 v1 — Suppressed Demand Baseline 2010', 'UNFCCC Decision 4/CMP.1 — Additionality Guidance']
**Reference documents:** UNFCCC TOOL01 v8 — Tool for the Demonstration and Assessment of Additionality (2012); UNFCCC TOOL02 v6 — Tool for the Assessment of the Investment Barrier (2012); UNFCCC Decision 4/CMP.1 Paragraph 43 — Additionality Definition; ICVCM Core Carbon Principles — Additionality Criterion 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

*(Guide and code reconcile well for this module — the UNFCCC TOOL01/TOOL02/TOOL07/TOOL21 suite,
bisection IRR and barrier analysis described in MODULE_GUIDES are all genuinely implemented. Minor
deviations are noted inline: the guide's "bisection convergence to 0.01%" understates the code's
60-iteration precision, and the classic 20% common-practice threshold is a user slider defaulting
to 10%.)*

### 7.1 What the module computes

EP-DQ2 implements interactive versions of four UNFCCC CDM methodological tools plus a 40-project
synthetic assessment pipeline:

- **TOOL01/TOOL02 investment analysis** — NPV and IRR of a project with and without carbon
  revenue, investment-barrier test `IRR_withoutCarbon < WACC`.
- **TOOL02 common-practice analysis** — technology penetration lookup per country vs a threshold.
- **TOOL07 baseline grid emission factor** — Operating Margin / Build Margin / Combined Margin.
- **TOOL21 small-scale wizard** — 3-step decision tree (regulatory surplus → investment barrier →
  common practice).

Core formulas, quoted from code:

```js
cfNC  = revenue_noCarbon − O&M;   cfC = cfNC + credits × price
NPV   = −capex + Σ_{t=1..life} cf / (1 + WACC/100)^t
IRR   : bisection on r ∈ [−0.5, 5.0], 60 iterations, sign test on NPV(r)
barrier = IRR_NC × 100 < WACC
t7OM  = Σ (share_i / Σshare) × EF_i            // generation-weighted operating margin
t7BM  = Σ (mw_j / Σmw) × EF_j                  // capacity-weighted recent-build margin
t7CM  = w_OM × OM + (1 − w_OM) × BM            // default w_OM = 0.5
```

Bisection halves a 5.5-wide bracket 60 times (final width ≈ 5.5/2⁶⁰ ≈ 5×10⁻¹⁸) — far tighter than
the guide's "0.01%" claim; carbon-price scenarios re-solve IRR at $5/10/15/20/25 per credit.

### 7.2 Parameterisation

| Parameter | Default / range | Provenance |
|---|---|---|
| TOOL01 inputs | capex $2.0M, O&M $120k, revenue $280k, credits 8,000 tCO₂e/yr, price $12, WACC 10%, life 20y | synthetic demo defaults (user-editable) |
| Common-practice threshold | slider, default **10%** (sensitivity grid 5/10/15/20%) | TOOL02-style rubric; classic CDM benchmark is 20% |
| TOOL07 weights | w_OM = 0.5 default | matches CDM TOOL07 default 0.5/0.5 OM/BM weighting for most project types |
| TOOL21 decision tree | Step 1 legally required → non-additional; Step 2 IRR<WACC → additional; Step 3 <5 registered projects → additional; else non-additional | mirrors UNFCCC attachment-A logic; cites Decision 17/CP.7 in the result string |
| Pipeline verdict rule | `irr < wacc → Additional; pen < 10 → Additional; sr>0.7 → Non-Additional; else Pending` | synthetic assignment for the 40 demo projects |
| Barrier scores | 4 barrier types (Investment, Technological, Prevailing Practice, Institutional/Regulatory), 1–5 scale | synthetic seeded values |
| Sensitivity ranges | WACC {6,8,10,12,15}%, price {5,10,15,20}$, penetration {5,10,15,20}% | code constants |

### 7.3 Calculation walkthrough

1. **Assessment Pipeline** — 40 seeded projects (12 types × 20 countries) with IRR 4–20%, WACC
   8–15%, penetration 0–25%; KPIs: counts of Additional/Non-Additional/Pending, additionality
   rate, mean IRR/WACC; filter by verdict/tool, sortable.
2. **TOOL01 tab** — the §7.1 NPV/IRR engine; also payback = capex/cfNC and benefit-cost ratio
   `(NPV_NC + capex)/capex`; barrier verdict badge; carbon-price scenario table showing at which
   price the project stops being "additional" (IRR crosses WACC).
3. **TOOL02 tab** — penetration matrix (20 countries × 6 technologies, seeded 0–25%);
   `additional = penetration < threshold`.
4. **TOOL07 tab** — per-country synthetic plant stacks; OM from generation shares, BM from recent
   plant capacities, CM as the weighted blend with a w_OM slider.
5. **Barrier Matrix / Sensitivity / Evidence Log** — mean barrier score per project (`Σ/4`),
   count-based sensitivity tables over the §7.2 ranges, and an 8-item validation evidence
   checklist per project.

### 7.4 Worked example — TOOL01 defaults

capex $2,000,000; cfNC = 280,000 − 120,000 = $160,000/yr; carbon revenue = 8,000 × $12 = $96,000
→ cfC = $256,000/yr; WACC 10%, 20 years (annuity factor a(10%,20) = 8.5136):

| Quantity | Computation | Result |
|---|---|---|
| NPV without carbon | −2,000,000 + 160,000 × 8.5136 | **−$637,800** |
| NPV with carbon | −2,000,000 + 256,000 × 8.5136 | **+$179,500** |
| IRR without carbon | solve 160,000·a(r,20) = 2,000,000 | **≈ 4.95%** |
| IRR with carbon | solve 256,000·a(r,20) = 2,000,000 | **≈ 11.3%** |
| Investment barrier | 4.95% < 10% WACC | **Confirmed → Additional** |
| Payback | 2,000,000 / 160,000 | 12.5 yr |
| B/C ratio | 1,362,200 / 2,000,000 | 0.68 |

Carbon revenue lifts IRR above the hurdle (11.3% > 10%) — precisely the TOOL01 demonstration that
the project "is not financially viable without CER/VCU revenue but becomes viable with it".

### 7.5 Data provenance & limitations

- **Pipeline projects, penetration matrix and grid plant stacks are synthetic**
  (`sr(seed) = frac(sin(seed+1)×10⁴)`); no UNFCCC registry, IRENA or grid data is loaded. The
  TOOL01/07/21 calculators, however, run on user inputs, so their arithmetic is real.
- TOOL01 uses a flat annuity cash flow (constant revenue/O&M) — real PDDs use year-by-year models
  with degradation, tax and debt schedules; benchmark comparison (TOOL02's "benchmark analysis"
  option using government bond + risk premium) is not offered, only WACC.
- TOOL07 weights are user-set but the plant data behind OM/BM is seeded; real CM requires 3-year
  generation data and the latest-20%-of-builds BM set per TOOL07 v7.
- The pipeline's verdict rule short-circuits (`pen < 10 → Additional` even when IRR ≥ WACC), which
  is a demo simplification — real TOOL01 requires the full step sequence.
- Sensitivity `priceSens` recomputes NPV with an ad-hoc cash flow
  (`revenue + 5000×price − 5%×capex`) inconsistent with each project's stated credits volume.

### 7.6 Framework alignment

- **UNFCCC TOOL01 (Demonstration and Assessment of Additionality)** — the canonical 4-step logic
  (Step 0 prior consideration, Step 1 alternatives/regulatory surplus, Step 2 investment analysis
  OR Step 3 barrier analysis, Step 4 common practice). The module implements Steps 2–4 faithfully
  in calculator form; regulatory surplus appears as TOOL21 Step 1 and a per-project
  `regulatoryStatus` field.
- **UNFCCC TOOL02 (Combined tool)** — investment-comparison / benchmark analysis and common-
  practice penetration testing; the module's `IRR < WACC` benchmark test and penetration threshold
  mirror it (threshold configurable rather than fixed at the traditional 20%).
- **UNFCCC TOOL07 (Emission factor for an electricity system)** — OM (generation-weighted average
  of dispatched plants), BM (capacity-weighted average of most recent builds), CM = weighted
  combination with default 0.5/0.5 for wind/solar's first crediting period — the code's default
  matches.
- **UNFCCC TOOL21 / Decision 17/CP.7** — small-scale simplified additionality; the wizard's
  "required by law → non-additional" and "fewer than N similar registered projects" gates follow
  the small-scale attachment's barrier logic (code uses < 5 projects).
- **ICVCM CCP Additionality criterion** — ICVCM assesses whether a crediting *methodology
  category* ensures activities are beyond legal requirements and financially non-viable without
  credit revenue — exactly the two tests this module makes interactive.

## 9 · Future Evolution

### 9.1 Evolution A — Real grid EFs and penetration data under the genuine TOOL suite (analytics ladder: rung 2 → 3)

**What.** This is one of the platform's honest tier-B modules: the UNFCCC TOOL01/TOOL02/TOOL07/TOOL21 suite is genuinely implemented — bisection IRR over 60 iterations (≈5×10⁻¹⁸ bracket, tighter than the guide's claim), OM/BM/CM grid-factor math, carbon-price scenario re-solving, sensitivity sweeps (already rung 2). What is synthetic is the *data underneath*: the 40-project pipeline, per-country `TOOL07_DATA` plant mixes, and `PENETRATION` rates are all seeded draws. Evolution A keeps the calculators and swaps the data.

**How.** (1) TOOL07 inputs from real sources: country combined-margin EFs are published (UNFCCC standardized baselines; national CM factors from IGES/IFI datasets) and the platform's EIA/ENTSO-E ingested generation data can build OM factors for covered grids — each factor vintage-tagged, with uncovered countries reporting an honest null instead of a seeded plant mix. (2) Common-practice penetration from IRENA capacity statistics per technology/country, replacing `pen = sr(·)×25`. (3) Extract the calculators to a backend route (`POST /api/v1/additionality/tool01`, `/tool07`) — they are pure functions — and pin them in bench_quant: a reference project whose IRR/NPV/CM values are hand-verified against a published PDD's TOOL02 annex (rung 3: benchmarked against real validation cases). (4) Keep the 20%-vs-10% common-practice threshold as an explicit parameter with the TOOL02 default documented (§7 notes the slider defaults to 10%, not the classic 20%).

**Prerequisites.** Source licensing check for grid-EF datasets; the 40-project pipeline either becomes real user projects or stays clearly badged illustrative. **Acceptance:** TOOL07 for a covered country reproduces the published CM factor within rounding; an uncovered country returns null with a source note; the bench PDD case pins bisection IRR to the published value.

### 9.2 Evolution B — PDD additionality-annex drafter (LLM tier 2)

**What.** The module's endgame is a document: the UNFCCC-format additionality demonstration for a PDD, reviewed by a validation body. Evolution B drafts it by tool-calling the Evolution-A routes: run TOOL01 Step 1 (regulatory surplus from user-supplied evidence), Step 2 investment analysis (`IRR_NC < WACC` verdict with the sensitivity table), Step 3 barrier narrative, and the common-practice check — then assemble the annex in TOOL01 v8 structure with every numeric from tool output and every qualitative claim tagged to user-supplied evidence items (the Validation Evidence Log tab is the intake surface).

**How.** Tool schemas over the extracted calculator routes (computational, no gating); grounding corpus is this Atlas record plus the TOOL01/TOOL02 methodology summaries in §5/§7 so the annex cites the correct tool versions and Decision 17/CP.7 grounds for the TOOL21 legal-requirement kill rule. The drafting contract is strict on the qualitative steps: barrier analysis is *evidence-weighed narrative*, so the LLM may organise and phrase the user's evidence but must mark unevidenced barrier claims as unsupported — mirroring the ~15% validation rejection rate the module's own KPI cites as the cost of weak demonstrations.

**Prerequisites (hard).** Evolution A's backend extraction (React-state calculators cannot be tool-called); an evidence-attachment store for the qualitative steps. **Acceptance:** every IRR/NPV/penetration figure in the annex traces to a tool response; the annex's sensitivity section reproduces the ±20% grid the calculator ran; a draft with an unevidenced barrier claim renders it flagged, not asserted.