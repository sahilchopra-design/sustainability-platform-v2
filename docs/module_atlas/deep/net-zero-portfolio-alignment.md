## 7 · Methodology Deep Dive

This module's core arithmetic **matches its MODULE_GUIDES entry** — a genuine exposure-weighted
Portfolio Temperature Score (PTS) and Weighted Average Carbon Intensity (WACI) engine — but every
input holding is synthetic. The guide's `PTS = Σ wᵢ × ITRᵢ` formula is implemented essentially
verbatim; the gap is entirely in the data layer, not the aggregation math.

### 7.1 What the module computes

`HOLDINGS` — 120 synthetic positions (`{SEC}-H001`…`H120`, sector-prefixed codes, not real
company names) — each seeded independently across 8 sectors, 12 countries, `scope1/2/3`
emissions, `revenueUSD`, `evic`, `temperature` (ITR, 1.5–4.5°C), `sbtStatus`, `nzamaAligned`,
`capexGreenPct`/`capexFossilPct`, 2030/2050 reduction pledges, `physicalRisk`/`transitionRisk`,
`engagementOutcome`. Weights are normalised so `Σ weight = 1`:

```js
WACI(scope)  = Σ wᵢ × (emissionsᵢ,scope / revenueUSDᵢ)              // tCO2e/$M revenue
PTS (portfolioITR) = Σ (wᵢ / Σw_filtered) × temperatureᵢ            // exposure-weighted ITR
```

### 7.2 Parameterisation

| Field | Formula | Range |
|---|---|---|
| `temperature` (ITR) | `sr(i×31+8)×3+1.5` | 1.5–4.5 °C |
| `scope1` | `sr(i×11+2)×500000+1000` | 1,000–501,000 t |
| `revenueUSD` | `sr(i×23+6)×5000+200` | $200M–$5.2B |
| `evic` | `rev × (sr(i×29+7)×3+0.5)` | 0.5×–3.5× revenue |
| `targetYear2030` | `-(sr(i×71+17)×50+10)` | −10% to −60% by 2030 |
| `targetYear2050` | `-(sr(i×73+18)×80+15)` | −15% to −95% by 2050 |
| `nzamaAligned` | `sr(i×53+13)>0.5` | ~50% true |

`DECARBONIZATION_PATHS` — 26-year (2025–2050) exponential decay curves for 4 reference lines
(`portfolio`, `sbt15`, `gfanz`, `budget15`), each `100×base^(t or t×exponent)` with hand-set decay
bases (0.60 portfolio, 0.50 SBTi-1.5°C, 0.55 GFANZ, 0.45 carbon-budget-1.5°C) — a deterministic
illustrative comparison, not fit to the 120 holdings' actual pledged trajectories.

### 7.3 Calculation walkthrough

1. Filter `HOLDINGS_N` by sector, SBT status, ITR range, minimum weight, engagement outcome.
2. **`portfolioITR`** — re-normalises weights *within the filtered subset* (`tw = Σ filtered
   weight`) before computing the exposure-weighted mean temperature — correct methodology
   (filtering shouldn't silently use stale portfolio-wide weights), matching TCFD Portfolio
   Alignment Technical Supplement's weighted-average approach.
3. **`waci`** — selects scope combination (`1`, `1+2`, or `1+2+3`) and sums
   `weight × emissions/revenue` per holding — the standard TCFD/PCAF WACI definition
   (tCO2e/$M revenue), correctly using the un-renormalised full-portfolio weights (`HOLDINGS_N`
   already has `Σweight=1` globally) inside `computeWACI`.
4. **`engagementITRImpact`** — `max(0, portfolioITR − engagementPct/100 × 0.1)` — a hand-picked
   linear assumption that "0.1°C of temperature improvement per 100% engagement coverage"; not
   derived from any engagement-outcome field on individual holdings (i.e. it ignores the
   `engagementOutcome` categorical data already present per holding).
5. **`sbtBreakdown`** — sums weight×100 by `sbtStatus` (Approved/Committed/None) for the filtered
   set — straightforward weighted composition.
6. **PAII Framework / Decarbonization Pathways tabs** — plot the 120 holdings' ITR distribution
   against the 4 static decay curves and the UN PAII (Paris Aligned Investment Initiative)
   framework's naming conventions (target-setting, engagement, capital allocation) as section
   labels, without a PAII-specific scoring formula.

### 7.4 Worked example

Holding `i=0`: `sec = SECTORS_NZ[floor(sr(1)×8)]`. `sr(1)`: `sin(2)=0.9093`, ×10000=9092.97,
`frac=0.974` (`floor(9092.97)=9092`, remainder 0.97). `floor(0.974×8)=7` → `SECTORS_NZ[7]="Consumer
Disc."`. `temperature = sr(31×0+8)×3+1.5 = sr(8)×3+1.5`. `sin(9)=0.4121`, ×10000=4121.2,
`frac=0.185` → `temperature ≈ 1.5+0.185×3 = 2.055°C`. `revenueUSD = sr(23×0+6)×5000+200 = sr(6)×5000
+200`. `sin(7)=0.6570`, ×10000=6570.2, `frac=0.19` (approx) → `revenue ≈ 200+0.19×5000=1,150`.
`scope1 = sr(2)×500000+1000`: `sin(3)=0.1411`, ×10000=1411.2, `frac=0.2` (approx) →
`scope1 ≈ 1000+0.2×500000=101,000 t`. Holding's WACI contribution (scope 1 only, un-weighted):
`101,000/1,150 = 87.8 tCO2e/$M` — this single holding's carbon intensity then enters the portfolio
WACI multiplied by its normalised weight (`rawW/totalW`, itself a `sr()` draw ~0.001–0.021 before
normalisation).

### 7.5 Data provenance & limitations

- **120 synthetic holdings**, no company names, no real financial data — the platform's other
  portfolio-facing modules (e.g. `paris-alignment`) at least use recognisable tickers; this module
  uses sector-code placeholders (`ENE-H001` etc.).
- The WACI and PTS *aggregation formulas* are methodologically correct and match TCFD/PCAF
  conventions — the deficiency is entirely in the underlying holdings data, not the maths.
- `engagementITRImpact`'s "0.1°C per 100% engagement" is an unsourced modelling simplification
  bolted onto an otherwise legitimate weighted-average engine.
- `DECARBONIZATION_PATHS` reference curves are illustrative exponential decays chosen to visually
  separate 4 lines, not fitted to SBTi/GFANZ/1.5°C-budget published trajectories for any real
  sector or index.

**Framework alignment:** TCFD Portfolio Alignment Measurement: Technical Supplement (2021) —
exposure-weighted ITR aggregation is implemented per the Supplement's Book 2 (implied temperature
rise) methodology · PCAF — WACI formula (tCO2e/$M revenue) matches PCAF's asset-class-agnostic
carbon-intensity metric · UN PAII (Paris Aligned Investment Initiative) — named via tab label and
target-setting/engagement/capital-allocation framing, no PAII-specific maturity scoring
implemented · NZAOA Target Setting Protocol v3 — referenced in the guide for the 1.5°C/2050 target,
not encoded as a specific compliance check in code.
