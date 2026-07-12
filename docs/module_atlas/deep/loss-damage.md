## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The assignment record lists two real backend engines
> (`backend/services/loss_damage_engine.py`, `loss_damage_finance_engine.py`) and 8 live API routes
> (`/frld-eligibility`, `/ld-gap-analysis`, `/ld-portfolio`, plus `ref/*` endpoints). **The frontend
> page makes no `axios`/`fetch` call anywhere in the file** — every figure the user sees comes from a
> static, `sr()`-seeded 40-country array generated client-side. The real backend engines exist in the
> codebase but are orphaned from this page, exactly as found in the sibling `just-transition` module.

### 7.1 What the module computes

40 named vulnerable countries (Pakistan, Bangladesh, Ethiopia, Nigeria, Mozambique, Philippines,
Fiji, Tuvalu, Maldives, and 31 more) across 8 regions, each with a **chained** set of synthetic
metrics — unlike several sibling modules, several fields here genuinely derive from one another
rather than being independently random:

```js
ndGain         = 25 + sr(i*7)*45                       // 25-70 (ND-GAIN-style readiness score)
climVulnIdx    = 100 - ndGain + sr(i*11)*15             // inversely related to ndGain, plus noise
annualLoss     = 100 + sr(i*13)*4900                    // $100-5000M
needsEstimate  = annualLoss*1.5 + sr(i*37)*2000         // derived from annualLoss
committed      = needsEstimate * sr(i*41) * 0.4         // derived from needsEstimate — 0-40% funded
disbursed      = committed * sr(i*43) * 0.6             // derived from committed — 0-60% disbursed
adaptationGap  = needsEstimate - committed              // exact arithmetic identity
```

### 7.2 Parameterisation

| Field | Provenance |
|---|---|
| 40 country names, 8-region assignment | Real, correctly-classified climate-vulnerable countries |
| `ndGain`, `annualLoss`, `deaths`, `displaced`, `infraDamage`, `agriLoss` base values | Synthetic demo values, `sr()`-seeded per country |
| `needsEstimate`, `committed`, `disbursed`, `adaptationGap` | **Genuinely chained** — each derives from the previous field via a real multiplicative relationship, not an independent draw (a methodological improvement over several sibling L&D-adjacent modules where cost-to-close figures are unrelated random draws) |
| `FUND_COMMITMENTS` (18 donors) | Real donor countries/blocs (Germany, UAE, Japan, France, Italy, UK, EU, USA, Canada, Denmark, Austria, Ireland, Norway, Spain, Netherlands, Belgium, Sweden, Switzerland) with plausible pledge/disbursement figures broadly consistent with the real COP28 L&D Fund's initial ~$700M in pledges (summing the 18 rows gives a total in that order of magnitude) | Static, hand-entered, directionally realistic |
| `lossHistory` (8-year per-country series), `hazardBreakdown` (5-hazard split per country) | Synthetic, `sr()`-seeded around each country's base `annualLoss` |

### 7.3 Calculation walkthrough

- **Fund Tracker tab**: `totalPledged/totalDisbursed = Σ` over `FUND_COMMITMENTS`;
  `disbursementRate = disbursed/pledged×100` per donor — correct, simple arithmetic on the static
  donor table.
- **Climate Loss Quantification tab**: `totalLoss = Σ annualLoss`, `avgGdpImpact = mean(gdpPct)`,
  `totalDeaths/totalDisplaced = Σ`; per-selected-country panel shows `lossHistory` (area chart) and
  `hazardBreakdown` (pie) both re-derived from that country's `annualLoss` base with independent
  per-year/per-hazard noise.
- **Vulnerability Assessment tab** (inferred from `vulnMetric` state and `top20`/`regionVuln`
  computations in the record): ranks countries by `ndGain` or `climVulnIdx` and aggregates by region
  (`avgNdGain`, `avgVuln` per region).
- **Financing Gap Analysis tab**: `investOpp = countries.filter(adaptationGap > investMin).sort(desc)`
  — an investment-screening filter on the (derived) adaptation gap; `regionGap` aggregates
  `needsEstimate`/`committed`/`gap` by region.

### 7.4 Worked example

Pakistan (`i=0`): `ndGain = 25 + sr(0)×45 = 25 + 0.7095×45 ≈ 56.9 → round → 57`.
`climVulnIdx = round(100 − 57 + sr(11)×15)`. `sr(11) = frac(sin(12)×10000)`; `sin(12 rad) ≈ -0.5366`
→ `frac(-5365.7) = 0.266` → `climVulnIdx = round(43 + 0.266×15) = round(46.99) = 47`.
`annualLoss = round(100 + sr(13)×4900)`; `sr(13) = frac(sin(14)×10000)`, `sin(14)≈0.9906` →
`frac(9906.1)=0.113` → `annualLoss ≈ round(100+553.7) = 654` ($M). `needsEstimate = round(654×1.5 +
sr(37)×2000)`; taking `sr(37)≈0.4` (illustrative) → `needsEstimate ≈ round(981+800) = 1781`.
`committed = round(1781 × sr(41) × 0.4)`; at `sr(41)≈0.5` → `committed ≈ round(1781×0.2) = 356`.
`adaptationGap = 1781 − 356 = 1425` ($M) — a real subtraction, not a separately-drawn random value.

### 7.5 Data provenance & limitations

- **No live backend call occurs** — the two listed backend engines
  (`loss_damage_engine.py`/`loss_damage_finance_engine.py`) and their 8 documented API routes are
  real, substantive Python services elsewhere in the codebase, but this page does not invoke them.
  A production wiring should replace the client-side synthetic generator with real calls to
  `/api/v1/loss-damage/ld-gap-analysis` and `/frld-eligibility`.
- Base metrics (`ndGain`, `annualLoss`, `deaths`, etc.) remain synthetic even though several
  downstream metrics are correctly *chained* from them — the chain's starting values are still not
  real ND-GAIN Index scores or EM-DAT loss figures.
- `FUND_COMMITMENTS` totals are static 2023-2025 snapshot figures; a live tracker should refresh
  against actual UNFCCC L&D Fund Board disbursement reports.

**Framework alignment:** UNFCCC L&D Fund (COP27/28), Santiago Network, V20 Vulnerable Group, and
World Weather Attribution are correctly named in the guide as the relevant real institutions; the
donor list and country selection are consistent with real L&D Fund geography. The guide's
"Attribution Science" data point (90%+ event coverage) is not computed anywhere in the frontend —
`climateAttributedLosses`-style attribution fractions do not appear in this module's fields.
