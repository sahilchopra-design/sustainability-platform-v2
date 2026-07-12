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
