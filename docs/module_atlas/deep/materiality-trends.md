## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes a **Materiality Trend Index**
> `MTI = (Investor Priority + Regulatory Activity + Litigation Risk) / 3` with 6-month EMA smoothing,
> investor-engagement letter tracking and RepRisk severity signals. **None of those three signal
> streams exist in the code.** What the module actually runs is a *driver-additive forecast*:
> a fixed database of 17 named regulatory/scientific/market drivers, each with a `strength` (1–5) and
> `trend` (increasing/decreasing), is summed against a hand-set base score per ESRS topic to project
> the topic's materiality 10 years forward. There is no investor letter feed, no litigation feed and
> no EMA. Documented below is the driver-forecast model as built.

### 7.1 What the module computes

The core is `forecastMateriality`: each topic's future score is its base score plus a linear,
time-scaled sum of the strengths of every driver that touches it:

```js
adjustment = Σ_drivers[ direction · strength · regMultiplier · (yearsForward / 5) ]
             where direction  = (trend === 'increasing' ? +1 : -1)
                   strength    = STRENGTH_MAP[d.strength]   // very_high:5, high:3, medium:2, low:1
                   regMultiplier applies only to category === 'regulatory'
future_score = clamp(0, 100, currentScore + adjustment)
```

The `yearsForward / 5` factor means each driver delivers one "strength unit" of score movement per
five years — a crude linear ramp. `regMultiplier` (a user slider) lets the analyst stress the
regulatory drivers only.

### 7.2 Parameterisation / scoring rubric

**`ESRS_TOPICS` base scores** — hand-set 0–100 literals reflecting today's consensus materiality
(Climate E1 = 78, Business Conduct G1 = 70, Own Workforce S1 = 65, Circular Economy E5 = 38).
**Editorial demo values**, not derived.

**`TREND_DRIVERS`** — 17 drivers across three categories, each **a real, named external development**
with an assigned strength/trend:

| Category | Example driver | Topics | Strength | Trend |
|---|---|---|---|---|
| regulatory | CSRD/ESRS mandatory reporting (2025-2028) | all 10 | very_high (5) | ↑ |
| regulatory | EU CBAM (2026) | E1 | high (3) | ↑ |
| regulatory | CSDDD supply-chain DD (2027-2029) | S2,S3,G1 | high (3) | ↑ |
| scientific | Planetary boundaries — 6 of 9 exceeded | E3,E4,E2 | very_high (5) | ↑ |
| scientific | Biodiversity tipping points (coral, Amazon) | E4 | very_high (5) | ↑ |
| market | GFANZ net-zero ($150T AUM) | E1 | very_high (5) | ↑ |
| market | Anti-ESG political backlash (US) | E1,S1 | medium (2) | ↓ |

The driver *names, timelines and topic mappings are factually grounded*; the strength ratings are
editorial. `STRENGTH_MAP = {very_high:5, high:3, medium:2, low:1}` is the only conversion table.

**`SECTOR_SENSITIVITY`** — an 8-sector × 10-topic multiplier matrix (Energy E1 = 1.8, Financials
G1 = 1.5, Utilities E3 = 1.5). **Synthetic sector-tilt demo values** used to sector-adjust the
base score before forecasting.

### 7.3 Calculation walkthrough

1. `holdings` maps any saved portfolio to `GLOBAL_COMPANY_MASTER` to derive a sector mix (used for
   sector sensitivity tilt).
2. `topicForecasts` computes `y2025 = baseScore`, then `y2035` via `forecastMateriality(..., 10yrs)`;
   `delta2035 = y2035 − y2025` is the headline trend magnitude.
3. `keyDrivers` per topic = the top-3 drivers touching it, sorted by strength.
4. `heatmapData` builds a driver × topic grid; `historicalComparison` back-casts a 2020 score as
   `max(10, baseScore − 15 − sr()·10)` (a *fabricated* past point) so the UI can show 2020→2025→2035.
5. KPIs: `avgStrength` (mean driver strength), `mostDynamic` (topic with largest \|delta2035\|).

### 7.4 Worked example (E1 Climate Change, 10 years forward, regMultiplier = 1.0)

E1 `baseScore = 78`. Drivers touching E1: REG01 (very_high, ↑, regulatory), REG02 (high, ↑, reg),
REG04 (very_high, ↑, reg), SCI01 (high, ↑), MKT01 (very_high, ↑), MKT02 (medium, ↑), MKT03 (medium,
↓), MKT04 (high, ↑). With `yearsForward/5 = 2` and regMultiplier = 1:

| Driver | strength | dir | contribution (str·2·dir) |
|---|---|---|---|
| REG01 | 5 | +1 | +10 |
| REG02 | 3 | +1 | +6 |
| REG04 | 5 | +1 | +10 |
| SCI01 | 3 | +1 | +6 |
| MKT01 | 5 | +1 | +10 |
| MKT02 | 2 | +1 | +4 |
| MKT03 | 2 | −1 | −4 |
| MKT04 | 3 | +1 | +6 |
| **Σ adjustment** | | | **+48** |

`future = clamp(0,100, 78 + 48) = 100` (ceiling hit). `delta2035 = 100 − 78 = +22`. The clamp
saturates E1 — a limitation of the unbounded additive model on an already-high base score.

### 7.5 Data provenance & limitations

- **Base scores, strengths and sector multipliers are demo values.** Driver *identities* are real
  (CSRD, CBAM, CSDDD, ISSB S2, GFANZ, planetary boundaries) but their quantitative weights are
  hand-assigned, and the 2020 back-cast is seeded via `sr(seed)=frac(sin(seed+1)×10⁴)`.
- **The guide's MTI (investor/regulatory/litigation composite + EMA) is not implemented** — no
  investor-letter feed, no RepRisk severity, no time-series smoothing. The forecast is a static
  linear driver-sum, not a monthly signal index.
- The `yearsForward/5` ramp is linear and un-discounted; drivers with defined end-timelines
  (e.g. anti-ESG backlash 2024-2026) still contribute across the full 10-year horizon. Score clamps
  at 100 suppress differentiation among already-high topics.

**Framework alignment:** SASB / dynamic-materiality — the module operationalises the "dynamic
materiality" thesis (Khan-Serafeim-Yoon; SASB standards evolution) that topic materiality drifts with
regulatory and scientific developments; it approximates this with an expert-weighted driver sum.
CSRD/ESRS, ISSB S2, CSDDD, CBAM, EUDR are correctly named as the regulatory catalysts. TCFD/ISSB
scenario framing is implicit in the market drivers. No standard's *quantitative* index (e.g. RepRisk
Issue Severity, which scores adverse-media incidents 0–100 on reach × novelty × severity) is
reproduced — those names are references, not computations.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
A materiality-trend index that tracks, per ESRS topic and sector, the *pace and direction* of
materiality change from real investor, regulatory and litigation signal streams, and projects
emergence lead-time for currently sub-threshold topics. Scope: 10 ESRS topics × ~11 GICS sectors,
monthly cadence, 10-year forward projection.

### 8.2 Conceptual approach
A composite signal index with exponential smoothing, benchmarked against RepRisk's Issue Severity
methodology (adverse-media incident scoring) and SASB's standards-evolution tracking. Three
independent monthly signals are normalised and blended, then a velocity term drives a bounded
logistic (not linear) forecast so already-high topics saturate gracefully rather than clamping.

### 8.3 Mathematical specification

```
MTI_{t,m} = (Inv_{t,m} + Reg_{t,m} + Lit_{t,m}) / 3                     // 0–100 monthly
MTI_smooth = α·MTI_{t,m} + (1−α)·MTI_smooth,{m−1}                        // α = 2/(6+1) (6-mo EMA)
Velocity_t = MTI_smooth,m − MTI_smooth,{m−12}                            // MTI/yr
Forecast_{t,y} = θ / (1 + e^{ −k(base_t + v_t·y − θ0) })                 // logistic, bounded [0,θ]
LeadTime_t = min{ y : Forecast_{t,y} ≥ material_threshold }
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Investor signal | Inv | Engagement-letter count × requester AUM (13F, GFANZ) |
| Regulatory signal | Reg | New-rule / consultation volume (EUR-Lex, Fed Register) |
| Litigation signal | Lit | ESG case count × damages (Sabin Climate Litigation DB) |
| EMA factor | α | 2/(N+1), N = 6 months |
| Logistic slope/ceiling | k, θ | Fit to historical topic trajectories |

### 8.4 Data requirements
Monthly investor-engagement letters (topic-tagged, with signatory AUM); legislative-pipeline volume
by topic/jurisdiction; ESG litigation tracker (Sabin/Columbia — free). Platform assets:
`GLOBAL_COMPANY_MASTER` for sector mix; the existing `ALL_DRIVERS` database can seed the regulatory
signal; `climate-litigation-*` modules can supply the Lit stream.

### 8.5 Validation & benchmarking plan
Back-test: do topics with high past velocity subsequently appear more often in SASB standard
revisions and CSRD DMAs? Reconcile the litigation signal against the Sabin database counts.
Sensitivity-test α (3/6/12-month) and logistic k for forecast stability.

### 8.6 Limitations & model risk
Signal streams are noisy and lag real materiality; investor-AUM weighting can over-index on a few
mega-asset-managers. The logistic ceiling assumes no structural regime break. Conservative fallback:
report velocity confidence bands and never issue a single-point emergence date without the band.
