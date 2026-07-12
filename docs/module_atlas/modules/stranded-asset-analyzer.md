# Stranded Asset Analyzer
**Module ID:** `stranded-asset-analyzer` · **Route:** `/stranded-asset-analyzer` · **Tier:** B (frontend-computed) · **EP code:** EP-CA2 · **Sprint:** CA

## 1 · Overview
Stranded asset write-down schedule with exponential decay model, residual value curves using half-life decay, 8-sector stranded asset matrix, and remediation pathways for converting stranded assets to productive use.

**How an analyst works this module:**
- Select sector and scenario to view write-down schedule
- Residual Value Curves show half-life decay per sector
- Bubble Map visualizes exposure by sector size and stranded percentage
- Remediation Pathways show conversion options with CapEx and IRR

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `SCENARIOS`, `SCENARIO_COLORS`, `SCENARIO_KEYS`, `SCENARIO_NGFS_KEY`, `SECTORS`, `SECTOR_HAZARD`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SECTORS` | 9 | `aum`, `stranded_pct_cp`, `stranded_pct_dt`, `stranded_pct_b2c`, `stranded_pct_nz`, `write_down_start`, `full_stranded`, `capex_locked`, `color` |
| `SECTOR_HAZARD` | 9 | `cp_threshold`, `alpha` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `strandedPct` | `sector[`stranded_pct_${sk}`] / 100;` |
| `years` | `Array.from({ length: 27 }, (_, i) => 2024 + i);` |
| `progress` | `(yr - start) / Math.max(1, end - start);` |
| `halfLife` | `Math.max(1, (sector.full_stranded - sector.write_down_start) / 2);` |
| `TABS` | `['Sector Overview', 'Write-Down Schedule', 'Residual Value Curves', 'Bubble Map', 'Remediation Pathways', 'Default Risk Model'];` |
| `totalAum` | `SECTORS.reduce((s, x) => s + x.aum, 0);` |
| `totalStranded` | `SECTORS.reduce((s, x) => s + x.aum * x[`stranded_pct_${sk}`] / 100, 0);` |
| `totalCapex` | `SECTORS.reduce((s, x) => s + x.capex_locked, 0);` |
| `avgStranded` | `totalAum > 0 ? (totalStranded / totalAum) * 100 : 0;` |
| `bubbleData` | `SECTORS.map(s => ({` |
| `allScenarioData` | `SCENARIOS.map((sc, i) => ({` |
| `portfolioWriteDown` | `useMemo(() => { const years = Array.from({ length: 27 }, (_, i) => 2024 + i);` |
| `total` | `SECTORS.reduce((acc, s) => {` |
| `strandedVal` | `s.aum * spct / 100;` |
| `pd10` | `(1 - surv10) * 100;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `SCENARIOS`, `SCENARIO_COLORS`, `SECTORS`, `SECTOR_HAZARD`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Stranded % | `Sector × Scenario matrix` | Carbon Tracker | Percentage of sector assets at risk of stranding under given scenario |
| Write-Down Half-Life | `Sector-specific` | Model calibration | Time for residual value to decline by 50% |
| Remediation IRR | `Conversion CapEx model` | Sector studies | Internal rate of return on converting stranded assets to green use |

## 5 · Intermediate Transformation Logic
**Methodology:** Exponential decay write-down model
**Headline formula:** `WriteDown(t) = InitialValue × StrandedPct × (1 - exp(-λ·t))`

Each sector has a stranded percentage per NGFS scenario. The write-down schedule follows exponential decay with sector-specific lambda (λ). Residual value = InitialValue × exp(-ln(2)/HalfLife × t). Remediation pathways estimate conversion CapEx and IRR for repurposing (e.g., coal→battery storage).

**Standards:** ['Carbon Tracker', 'IAS 36', 'NGFS']
**Reference documents:** Carbon Tracker Stranded Assets Report; IAS 36 Impairment of Assets; NGFS Phase 5 Scenarios

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This module is grounded on a **hand-curated, plausible 8-sector dataset** (not `sr()`-fabricated —
AUM, stranded-percentage-by-scenario, write-down start/end years, and locked capex are all fixed,
sector-appropriate constants) and a genuinely shared quant engine
(`frontend/src/engines/climateRisk.js`) for its "Default Risk Model" tab. It matches its own guide
closely — no mismatch flag needed, but the underlying hazard-rate model has a real calibration
weakness documented in §7.4/§7.6.

### 7.1 What the module computes

Eight sectors (`SECTORS`), each with AUM ($2.9–15.4Bn) and a stranded-% for 4 scenarios
(`stranded_pct_cp/dt/b2c/nz` = Current Policies/Delayed Transition/Below-2°C/Net-Zero-2050),
`write_down_start`/`full_stranded` years, and `capex_locked`.

**Write-down schedule** (exponential-approach-to-target):
```
progress = (year − write_down_start) / (full_stranded − write_down_start)
cumPct   = strandedPct × (1 − exp(−3 × progress))          for write_down_start ≤ year ≤ full_stranded
cumulative_write_down = AUM × cumPct
```
The `×(1−exp(−3×progress))` term is a smooth S-curve-like ramp (63% of the way to target stranded%
at 1/3 of the way through the write-down window, since `1−e⁻¹≈0.63`) — not a linear ramp, giving
earlier, front-loaded write-downs.

**Residual value curve** (half-life decay):
```
halfLife = max(1, (full_stranded − write_down_start)/2)
decay    = max(1 − strandedPct, exp(−ln2 × t / halfLife))     t = year − write_down_start
residual_pct = decay × 100
```
This is a genuine exponential half-life decay, floored at `1−strandedPct` (the terminal residual
value implied by the sector's stranded percentage) so the curve doesn't decay below the
scenario-consistent floor.

**Default Risk Model** (Merton-style reduced-form hazard, from the shared `climateRisk.js` engine):
```
h(t) = λ_base × exp(α × CarbonPrice(t) / cp_threshold)         // hazardRatePD()
S(T) = exp(−h × T)                                                // survivalProb()
PD(T) = 1 − S(T)
```
`CarbonPrice(t)` is looked up via `ngfsCarbonPrice(scenario, year)`, which **linearly interpolates**
a real NGFS-consistent carbon-price table (`NZ2050: 2025→$48, 2030→$147, …2050→$860`; similarly for
`BelowAc`, `CurrPol`, `DP`). `λ_base` (0.008–0.060), `cp_threshold` ($80–180/tCO₂e), and `α`
(0.85–1.40) are hand-calibrated per sector (coal has the highest base hazard and lowest threshold;
aviation the lowest base hazard and highest threshold) — labelled in-code as "Merton hazard rate
parameters," though the functional form (`exp(α×price/threshold)`) is a reduced-form/intensity
hazard model, not literally Merton's structural (asset-value-diffusion) framework.

### 7.2 Parameterisation

| Sector | `λ_base` | `cp_threshold` | `α` | Provenance |
|---|---|---|---|---|
| Coal Mining & Power | 0.060 | $80 | 1.40 | Hand-calibrated — highest baseline hazard, most carbon-price-sensitive |
| Oil Sands & High-Cost | 0.035 | $120 | 1.25 | Hand-calibrated |
| Conventional Oil & Gas | 0.018 | $160 | 1.10 | Hand-calibrated |
| Aviation (Long-haul) | 0.008 | $180 | 0.90 | Hand-calibrated — lowest, most resilient to carbon price |
| NGFS carbon price table (5 scenarios × 6 years) | $10–860/tCO₂e | — | — | Real, NGFS-consistent order of magnitude (NZ2050 2050 = $860/t is in the range of published NGFS Net Zero 2050 carbon price projections) |

### 7.3 Calculation walkthrough

1. **Sector/scenario selection** drives all three models (write-down, residual value, default risk)
   off the same 8-sector table.
2. **Bubble Map** — `stranded_pct` vs `capex_locked` vs `aum`, sized/coloured per sector.
3. **All-scenario comparison** — for the selected sector, stranded $ and % across all 4 scenarios
   side by side.
4. **Portfolio write-down** — sums `buildWriteDownSchedule` across all 8 sectors per year, giving a
   2024–2050 aggregate write-down trajectory.
5. **Default Risk Model tab** — for each sector, computes `cp2030 = ngfsCarbonPrice(scenario,2030)`,
   `h2030 = hazardRatePD(...)`, `surv5`/`surv10` = 5/10-year survival, `pd10 = (1−surv10)×100`, and
   buckets `risk` into `CRITICAL(>40%) / HIGH(>20%) / MEDIUM(>8%) / LOW`. A second view produces a
   full survival-probability-by-year table across scenarios via the same hazard formula.

### 7.4 Worked example — Coal Mining & Power, Net Zero 2050, 2030

`λ_base=0.060`, `cp_threshold=$80`, `α=1.40`; `ngfsCarbonPrice('NZ2050',2030)=$147` (exact table
value, no interpolation needed since 2030 is a table year).

```
h(2030) = 0.060 × exp(1.40 × 147/80) = 0.060 × exp(2.5725) ≈ 0.786   (78.6%/yr hazard rate)
S(5)  = exp(−0.786×5)  ≈ 1.97%
S(10) = exp(−0.786×10) ≈ 0.04%
PD(10) = 1 − 0.0004 ≈ 100.0%  →  risk tier = CRITICAL
```

At `cp_threshold=$80` and a Net-Zero carbon price of $147 (1.84× the threshold), the exponential
term `exp(1.40×1.84)=exp(2.57)≈13.1×` amplification drives the hazard rate to a level implying
near-certain 10-year stranding — directionally sensible (coal is the sector expected to strand
first and hardest under Net Zero) but the **~79%/yr instantaneous hazard rate is an extreme value**:
real-world corporate default hazard rates rarely exceed 30–50%/yr even for CCC-rated issuers,
suggesting the model's exponential sensitivity may be too steep once carbon price exceeds ~1.5× the
sector threshold (see §7.6).

### 7.5 Companion analytics

- **Write-Down Schedule / Residual Value Curves tabs** — per-sector time series under the selected
  scenario, both genuinely computed (not fabricated) from the exponential-approach and half-life
  formulas above.
- **Remediation Pathways** — cross-references the sibling module `stranded-recovery-pathways`
  conceptually (10 named repurposing options) though this page does not itself compute IRR.

### 7.6 Data provenance & limitations

- Sector AUM/stranded-%/timing constants are hand-curated, plausible, and internally consistent
  across scenarios (stranding % rises monotonically CP<DT<B2C<NZ for every sector, as expected) —
  but are not cited to a specific Carbon Tracker or IEA dataset vintage.
- The hazard-rate exponential form has no explicit ceiling: once carbon price exceeds
  `~2×cp_threshold`, `h(t)` grows large enough that 10-year PD saturates at ~100% for *any* α≥1
  sector, which may overstate near-term default risk relative to production credit-risk models that
  typically cap annual hazard rates well below 1.0 even in severe stress.
- `hazardRatePD`'s "Merton" label in the code comment is a naming looseness: the function is a
  reduced-form/intensity (Cox-process-style) hazard model conditioned on carbon price, not Merton's
  structural asset-value model (which requires firm asset value, volatility, and a default barrier).

**Framework alignment:** NGFS Phase-consistent carbon price scenarios (real table, linear
interpolation) · Carbon Tracker stranded-asset framework (sector stranding percentages, directionally
consistent with published Carbon Tracker analysis) · IAS 36 asset impairment (write-down schedule
concept) · reduced-form/intensity credit-risk hazard models (the actual mathematical family used,
distinct from the in-code "Merton" label).

## 9 · Future Evolution

### 9.1 Evolution A — Cap the hazard-rate PD and cite the sector stranding data (analytics ladder: rung 2 → 3)

**What.** This is one of the batch's better tier-B modules: an 8-sector hand-curated dataset (AUM, stranded-% by scenario, write-down timing, locked capex — all fixed, sector-appropriate constants, not `sr()`), a genuine exponential-approach write-down S-curve, a real half-life residual-value decay floored at the scenario-consistent terminal value, and a shared quant engine (`frontend/src/engines/climateRisk.js`) for the Default Risk tab. It matches its guide — no mismatch. But §7.6 documents two real weaknesses: the hazard-rate PD has no ceiling (once carbon price exceeds ~2× the threshold, 10-year PD saturates at ~100% for any α≥1 sector, overstating near-term default risk versus production credit models that cap annual hazard rates), and the function is labelled "Merton" in code but is actually a reduced-form/intensity model. Evolution A hardens the credit model and grounds the data.

**How.** (1) Cap the annual hazard rate (production intensity models bound it well below 1.0 even in severe stress) so 10-year PD doesn't spuriously saturate at 100%. (2) Correct the "Merton" naming, or add an actual Merton structural option (asset value, volatility, default barrier) as a complementary model alongside the reduced-form one, letting users compare structural vs intensity PD. (3) Cite the sector AUM and stranding percentages to a specific Carbon Tracker / IEA vintage (currently uncited). (4) Calibrate the write-down S-curve steepness (the fixed `−3` coefficient) per sector rather than one constant. (5) Bench-pin the write-down and PD calculations.

**Prerequisites.** Carbon Tracker / IEA sector-stranding data vintage; a hazard-rate ceiling parameter. **Acceptance:** 10-year PD no longer saturates at 100% under moderate carbon-price stress; the credit function is correctly named (or a real Merton model is added); sector data cites a source vintage.

### 9.2 Evolution B — Stranded-asset impairment copilot (LLM tier 1)

**What.** A copilot for the credit/impairment analyst: "what's the write-down schedule for coal power under Net Zero 2050?", "which sector strands fastest?", "what remediation pathway converts this coal asset and at what IRR?" — answered from the write-down S-curve, residual-value decay, the bubble-map exposure, and the remediation pathways (coal→battery storage etc.) the module already models.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/stranded-asset-analyzer/ask`, corpus = this Atlas record (the write-down and residual formulas, the hazard-rate model, IAS 36 / Carbon Tracker / NGFS framework notes) plus live page state (selected sector, scenario). Write-down and residual answers narrate the computed curves; remediation answers cite the pathway's CapEx and IRR. The copilot honestly labels the credit model as reduced-form (post-Evolution-A) and flags the write-down's front-loaded S-curve shape.

**Prerequisites.** Evolution A's PD cap so the copilot doesn't narrate spuriously-saturated 100% default probabilities. **Acceptance:** every write-down/residual/PD figure traces to the computed curves; remediation IRRs match the pathway data; a sector outside the 8 covered returns a scoped refusal.