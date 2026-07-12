# Solar Module Quality & Bankability
**Module ID:** `solar-module-quality-bankability` · **Route:** `/solar-module-quality-bankability` · **Tier:** B (frontend-computed) · **EP code:** EP-ED6 · **Sprint:** ED

## 1 · Overview
Solar module quality assurance and bankability analytics for project finance. Models P90/P50 25-year yield scenarios, quantifies degradation by technology, assesses PVEL/DNV bankability rankings, verifies IEC testing certifications, and provides warranty adequacy analysis for debt sizing.

> **Business value:** Used by project finance lenders, independent engineers, insurance underwriters, and solar asset managers to evaluate module bankability and set P90 yield haircuts for debt sizing.

**How an analyst works this module:**
- Review module landscape for PVEL scoring and IEC certifications
- Use performance modelling for 25-year P90/P50 yield projection
- Examine degradation analysis for technology-specific rates
- Run warranty analysis for manufacturer financial strength adequacy

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `KpiCard`, `MODULES`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `MODULES` | 21 | `manufacturer`, `product`, `powerClass`, `efficiency`, `degradYr1`, `degradSubseq`, `tempCoeff`, `warrantyProduct`, `warrantyPower`, `bankability`, `certs`, `technology` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `p90Degrade` | `p50Degrade * (1 - sr(y * module.id) * 0.02);` |
| `techs` | `useMemo(() => ['All', ...Array.from(new Set(MODULES.map(m => m.technology)))], []);` |
| `degradData` | `useMemo(() => computeP90Yield(selectedModule, 25), [selectedModule]);  const avgBankability = useMemo(() => filtered.length ? (filtered.reduce((a, m) => a + m.bankability, 0) / filtered.length).toFixed(1) : '0.0', [filtered]);` |
| `avgDegradSubseq` | `useMemo(() => filtered.length ? (filtered.reduce((a, m) => a + m.degradSubseq, 0) / filtered.length).toFixed(2) : '0.00', [filtered]);` |
| `p90at25yr` | `useMemo(() => { const endYield = degradData[degradData.length - 1];` |
| `p50at25` | `(1 - m.degradYr1 / 100) * Math.pow(1 - m.degradSubseq / 100, 24) * 100;` |
| `p90at25` | `Math.max(p50at25 * (1 - sr(m.id * 3) * 0.02), p50at25 - 2.5);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `MODULES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| 25-yr P90 Yield Ratio | `P_25yr / P_initial = (1-LID) × (1-ann_deg)^24` | PVEL Module Scoring + IEC 61724 | Lower-ratio modules face lender yield haircuts; bifacial have higher P90/P50 spread due to albedo variability. |
| PVEL Bankability Score | `Outdoor reliability + accelerated tests + power measurement` | PVEL PV Module Scorecard (annual) | Non-Top Performers have 50-150% higher failure rates in accelerated lifetime testing. |
| Annual Degradation Guarantee (%/yr) | `Manufacturer linear warranty rate` | Module warranty documents | Premium manufacturers guarantee 0.4-0.5%/yr; standard 0.55-0.7%/yr. |
- **PVEL scorecard + warranty documents + IEC test certs + DNV bankability list** → P90/P50 yield model + degradation curve + bankability scoring + warranty adequacy → **Module bankability package for project finance lenders and independent engineers**

## 5 · Intermediate Transformation Logic
**Methodology:** P90 Yield Model & Degradation Curve
**Headline formula:** `P90_yield = P_initial × (1-LID) × (1-ann_deg)^24 × P90_factor; P50_yield = P90_yield / 0.96`

P90 yield: energy exceeded with 90% probability over 25 years. P90/P50 ratio 0.95-0.97 for characterized modules. PVEL Top Performers score in top quartile across all test categories.

**Standards:** ['PVEL PV Module Scorecard', 'DNV Solar Module Reliability Study', 'IEC 61215 / 61730 Standards']
**Reference documents:** PVEL PV Module Scorecard (annual); DNV Solar Module Reliability Report; IEC 61215-1 (2021) – Crystalline Silicon PV Modules

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`MODULES` (20 rows) is a **hand-curated, real-product dataset** — named commercial modules from LONGi,
Jinko, JA Solar, Trina, First Solar, REC, Maxeon, Canadian Solar, Hanwha Q CELLS, Meyer Burger, and others,
with plausible efficiency, first-year/subsequent degradation, temperature coefficient, product/power
warranty years, a 1–5 `bankability` score, real IEC certification codes, and technology tag. The module's
core calculation is a genuine **P50/P90 25-year yield degradation model**:

```js
computeP90Yield(module, years=25):
  for y in 0..years:
    p50Degrade = y===0 ? 1
               : y===1 ? (1 − degradYr1/100)
               : (1 − degradYr1/100) × (1 − degradSubseq/100)^(y−1)
    p90Degrade = p50Degrade × (1 − sr(y×module.id) × 0.02)          // 0–2% random P90 haircut per year
    p90[y] = max(p90Degrade×100, p50Degrade×100 − 2.5)              // floor: never more than 2.5pp below P50
```

### 7.2 Parameterisation

| Field | Values | Provenance |
|---|---|---|
| `degradYr1` (LID, light-induced degradation) | 2.0% for most modules, 2.5% for lower-tier products (Seraphim, Vikram, Znshine) | consistent with published mono-Si first-year LID figures |
| `degradSubseq` (annual, years 2+) | 0.40% (best: Jinko Tiger Neo, Maxeon) to 0.65% (Znshine) | consistent with the guide's cited PVEL/DNV 0.4–0.7%/yr range, with premium HJT/IBC/TOPCon products at the low end |
| `bankability` (1–5) | 5 for the largest-scale established manufacturers (LONGi, Jinko, JA Solar, Trina, First Solar, REC, Maxeon), 2–3 for smaller/regional players (Znshine, Vikram, Seraphim) | plausible PVEL/DNV-style tiering by manufacturer scale and track record, not a literal reproduction of any specific PVEL Scorecard edition |
| `warrantyPower` | 25–40 years (Maxeon 40yr — genuinely the longest in the real market) | matches real manufacturer warranty terms |
| P90 random haircut | `sr(y×module.id) × 2%`, applied multiplicatively to the P50 curve | synthetic — a genuine simplification of a real P90/P50 statistical relationship (see limitations) |
| P90 floor | `p50 − 2.5pp` | hand-set guard ensuring the P90 curve never diverges implausibly far below P50 |

### 7.3 Calculation walkthrough

- **Degradation Model tab**: plots `computeP90Yield(selectedModule, 25)` — a genuinely computed power-law
  degradation curve (P50) with a stochastic-but-bounded P90 overlay, correctly distinguishing year-1 LID
  from the subsequent-year compounding degradation rate.
- **Bankability Scorecard**: filters `MODULES` by technology and minimum bankability, computing simple means
  (`avgBankability`, `avgDegradSubseq`) — plain aggregation.
- **Warranty Analysis**: compares `warrantyProduct` (workmanship) vs `warrantyPower` (performance guarantee)
  years per module — direct rendering, no derived calculation.
- **PAN File Simulation / IEC Test Standards / Lender Requirements tabs**: descriptive reference content
  (real IEC 61215/61730/62716 standard names, PVsyst PAN-file parameter concepts) without a live parameter
  extraction engine.

### 7.4 Worked example (Jinko Tiger Neo 580N, year 25)

`degradYr1=2.0%`, `degradSubseq=0.40%`, `module.id=2`:

| Step | Computation | Result |
|---|---|---|
| Year-1 P50 factor | 1 − 0.02 | 0.980 |
| Year-25 P50 factor | 0.980 × (1−0.004)^24 | 0.980 × 0.9075 ≈ **0.8894** (88.94% of nameplate) |
| P90 haircut at y=25 | `sr(25×2)×0.02 = sr(50)×0.02` | 0–2%, illustratively ≈1% |
| P90 factor | 0.8894 × (1−0.01) | ≈0.8805 |
| P90 floor check | max(88.05, 88.94−2.5=86.44) | **88.05%** (floor not binding) |

At 25 years, Jinko's P50 yield of ~88.9% and P90 of ~88.1% both exceed the "endYield.p90" KPI shown for this
module — consistent with Jinko's low subsequent-degradation rate (0.40%/yr, among the best in the dataset)
translating to strong long-term yield retention.

### 7.5 Data provenance & limitations

- **Module technical specs (efficiency, degradation, warranty) are hand-curated, plausible representations**
  of real commercial products as of the platform's last data refresh — not live-pulled from manufacturer
  datasheets, and will drift from actual current-generation product specs over time.
- **The P90 haircut is a synthetic 0–2% random multiplicative factor**, not derived from any actual
  measurement-uncertainty or manufacturing-variance study for the specific module. Real P90/P50 yield ratios
  (per the guide's cited 0.95–0.97 range for characterised modules) arise from statistical spread in *tested*
  power output across a production batch plus field-performance uncertainty — a single random per-module
  per-year draw is a reasonable illustrative stand-in but should not be read as a calibrated P90 estimate for
  lender debt-sizing purposes.
- `bankability` scores are qualitative platform judgments, not a literal PVEL PV Module Scorecard or DNV
  bankability-list lookup (though directionally consistent with how those real lists tend to rank
  manufacturers by scale/track record).

### 7.6 Framework alignment

- **PVEL PV Module Scorecard / DNV Solar Module Reliability Study** — the `bankability` tiering and the
  degradation-rate ranges are directionally consistent with these real industry benchmarks; not a literal
  data feed from either publisher.
- **IEC 61215 / IEC 61730 / IEC 62716** — correctly named and attached as real certification codes per
  module; the module does not simulate or verify actual test-pass status, only displays which standards a
  product is certified against.
- **P90 energy yield concept (lender debt-sizing convention)** — the model correctly implements the
  *structure* of a P50/P90 degradation curve (first-year LID, compounding annual degradation, a P90 haircut
  below P50) used in real project-finance independent-engineer reports, even though the specific P90 haircut
  magnitude is illustrative rather than statistically fit.

## 9 · Future Evolution

### 9.1 Evolution A — Statistically-derived P90 haircut and warranty-adequacy debt sizing (analytics ladder: rung 1 → 3)

**What.** Solid tier-B foundation: `MODULES` (20 real named products) is hand-curated with real degradation rates, IEC certification codes, and PVEL/DNV-style bankability tiers, and `computeP90Yield` is a genuine power-law degradation model. Its documented simplification (§7.2) is that the P90 curve applies a `sr(y×id) × 2%` random haircut with a `p50 − 2.5pp` floor — the *structure* of a P90/P50 relationship is correct, but the haircut magnitude is illustrative, not statistically fit. For a module whose entire purpose is lender debt-sizing, that is the number that matters most. Evolution A makes the P90 haircut a real uncertainty computation and closes the warranty-adequacy loop.

**How.** (1) Derive the P90/P50 ratio from an uncertainty budget (interannual irradiance variability, degradation-rate uncertainty, soiling, availability) via the standard lognormal quantile approach the sibling `solar-resource-performance` already implements correctly (`p90 = p50 × exp(−1.282σ)`) — replacing the random per-year haircut with a defensible σ. (2) Warranty-adequacy engine: compare each module's power-warranty curve against the modelled P90 degradation and the manufacturer's financial strength, flagging where warranty coverage is insufficient for the debt tenor. (3) A debt-sizing output: max sculpted debt at a target DSCR given the P90 yield. (4) Refresh `bankability` tiers against the current PVEL Scorecard edition with a cited vintage.

**Prerequisites.** An uncertainty-budget input set per module/site; PVEL Scorecard edition for the tier refresh. **Acceptance:** the P90/P50 ratio derives from a stated σ and matches the lognormal formula; changing uncertainty inputs moves P90; warranty-adequacy flags trigger on a genuine coverage gap.

### 9.2 Evolution B — Independent-engineer bankability copilot (LLM tier 1)

**What.** A copilot for the lender/IE/underwriter users: "is this module bankable for a 20-year debt tenor?", "what P90 haircut should I apply?", "how does Maxeon's 40-year warranty compare to its degradation curve?" — answered from the real `MODULES` fields, the `computeP90Yield` output, and the IEC/PVEL/DNV framework context, never inventing degradation numbers.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/solar-module-quality-bankability/ask`, corpus = this Atlas record (§7.1 P90 model, the parameter table, framework notes) plus live page state (selected module, computed 25-year curve). Bankability verdicts narrate the deterministic `bankability` tier and its drivers (degradation, warranty, IEC certifications); post-Evolution-A, P90-haircut answers cite the computed uncertainty-derived ratio. The copilot states honestly which IEC standards a product is certified against versus which it merely displays.

**Prerequisites.** Evolution A's fitted P90 lets the copilot answer haircut questions with a defensible number rather than the illustrative random one. **Acceptance:** every degradation/warranty/P90 figure in an answer matches the module data or `computeP90Yield`; a product outside the 20-row set returns a scoped refusal.