# Transition Risk Heatmap
**Module ID:** `transition-risk-heatmap` · **Route:** `/transition-risk-heatmap` · **Tier:** B (frontend-computed) · **EP code:** EP-CD2 · **Sprint:** CD

## 1 · Overview
10 sectors × 5 geographies × 3 NGFS scenarios risk matrix. 50-cell color-coded heatmap with sector and geographic averages, scenario sensitivity analysis.

**How an analyst works this module:**
- Risk Heatmap shows 10×5 color-coded matrix — click any cell for detail
- Sector Analysis shows average risk score per sector across geographies
- Geographic Analysis shows average per geography across sectors
- Scenario Sensitivity toggles multiplier to see risk shift

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `GEOS`, `SCENARIOS`, `SECTORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sectorAvg` | `SECTORS.map(s => ({ name: s, avg: Math.round(matrix[s].reduce((a, b) => a + b, 0) / Math.max(1, GEOS.length)) }));` |
| `geoAvg` | `GEOS.map((g, gi) => ({ name: g, avg: Math.round(SECTORS.reduce((s, sec) => s + matrix[sec][gi], 0) / Math.max(1, SECTORS.length)) }));` |
| `scenarioSensitivity` | `SECTORS.map(s => ({` |
| `avg` | `Math.round(matrix[sector].reduce((a, b) => a + b) / Math.max(1, GEOS.length));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `GEOS`, `SCENARIOS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Sectors | — | GICS | Energy, Materials, Industrials, Utilities, Consumer Disc, Consumer Staples, Healthcare, Technology, Financials, Real Estate |
| Geographies | — | NGFS | North America, Europe, Asia Pacific, Emerging Markets, Middle East |
| Scenario Multiplier (NZ) | — | Model parameter | Base scores scaled by 1.35 under Net Zero 2050 scenario |

## 5 · Intermediate Transformation Logic
**Methodology:** Scenario-adjusted risk matrix
**Headline formula:** `risk(sector, geo, scenario) = baseScore(sector, geo) × scenarioMultiplier`

Base scores for each sector-geography cell calibrated from IPCC AR6 and NGFS data. Scenario multipliers: Current Policies (0.8x), Below 2°C (1.0x), Net Zero 2050 (1.35x). Risk bands: CRITICAL(≥75, red), HIGH(≥55, orange), MEDIUM(≥35, amber), LOW(≥20, green), MINIMAL(<20, teal).

**Standards:** ['NGFS Phase 5', 'IPCC AR6']
**Reference documents:** NGFS Phase 5 Climate Scenarios; IPCC AR6 WGI Regional Projections

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

A 10-sector × 5-geography × 3-scenario transition-risk matrix. Unlike most platform modules, the
50-cell base matrix is **entirely hand-authored** (no PRNG) and the scenario adjustment is a single
clean multiplier — one of the simplest, most transparent calculations reviewed in this batch:

```
risk(sector, geo, scenario) = min(100, round(baseScore(sector, geo) × scenarioMultiplier))
scenarioMultiplier = Current Policies: 0.8× | Below 2°C: 1.0× (reference) | Net Zero 2050: 1.35×
```

### 7.2 Parameterisation

| Element | Values | Provenance |
|---|---|---|
| `base` matrix | 10 sectors × 5 geographies, 0–100 hand-set scores | Directionally realistic: Energy highest (68–92 across geographies, peaking in Middle East at 92), Telecom lowest (8–14); Real Estate anomalously *lower* in Middle East (38) than Europe (62) — plausible given the region's real estate market structure differs from carbon-intensive-sector exposure patterns elsewhere |
| Scenario multipliers | CP 0.8×, B2C 1.0× (reference/unscaled), NZ 1.35× | Below 2°C is the implicit calibration anchor; Net Zero 2050 is treated as *higher* near-term transition risk than a slower Current Policies path — consistent with the real NGFS insight that faster/more ambitious transitions front-load repricing risk |
| Risk bands | CRITICAL ≥75, HIGH ≥55, MEDIUM ≥35, LOW ≥20, MINIMAL <20 | Platform-defined 5-tier scale, colour-coded red→orange→amber→green→teal |

### 7.3 Calculation walkthrough

1. **Cell value**: `min(100, round(base × multiplier))` — the cap at 100 means Current Policies
   (0.8×) never saturates, but Net Zero 2050 (1.35×) frequently does for already-high base scores
   (Energy, Materials) — see the worked example.
2. **Sector average**: mean of a sector's 5 geography cells at the currently selected scenario.
3. **Geographic average**: mean of a geography's 10 sector cells at the currently selected scenario.
4. **Scenario sensitivity**: recomputes each sector's average risk under **all 3 scenarios
   simultaneously** (calling `riskMatrix()` three times), producing a 3-series comparison
   (`cp`/`b2c`/`nz`) per sector independent of the currently selected scenario tab.

### 7.4 Worked example (Energy sector, Net Zero 2050)

| Geography | Base score | × 1.35 | Capped at 100 |
|---|---|---|---|
| North America | 85 | 114.75 | **100** |
| Europe | 72 | 97.2 | **97** |
| Asia Pacific | 68 | 91.8 | **92** |
| Emerging Markets | 78 | 105.3 | **100** |
| Middle East | 92 | 124.2 | **100** |
| **Sector average** | — | — | **(100+97+92+100+100)/5 = 97.8 → 98** |

Under Below 2°C (1.0× multiplier, no change) the same sector's average would be
`(85+72+68+78+92)/5 = 79.0`, and under Current Policies (0.8×) it drops to `≈63.2` — illustrating
how much of the "Net Zero is riskier near-term" signal comes purely from the ceiling-capping effect
once base scores exceed ~74 (at which point 1.35× pushes them to the 100 cap regardless of how much
higher the true uncapped score would be).

### 7.5 Companion analytics

- **Geographic Analysis tab** — same aggregation logic transposed to average by geography across all
  10 sectors.
- **Scenario Sensitivity tab** — the only tab that shows all 3 scenarios' sector averages
  side-by-side without requiring the user to toggle the scenario selector, useful for seeing the
  full CP→B2C→NZ risk range per sector at a glance.

### 7.6 Data provenance & limitations

- **Base risk scores (the 50-cell matrix) are hand-authored, not modelled** — no cited derivation
  from IPCC AR6 regional projections or NGFS Phase 5 data despite the guide's reference to these
  sources; the numbers are directionally sensible expert-judgment estimates.
- **The 100-point cap creates a compression artefact**: several sector-geography combinations
  saturate at the ceiling under Net Zero 2050, which understates the *relative* differentiation
  between, say, a base-85 and a base-92 cell (both become 100) even though their true risk is
  meaningfully different.
- Only 3 scenarios are modelled (vs. the platform's other modules, which often use the full 5-branch
  NGFS Phase IV/5 set) — Delayed Transition and Divergent Net Zero/NDC pathways are absent here.

### 7.7 Framework alignment

- **NGFS scenario framework**: Current Policies / Below 2°C / Net Zero 2050 are real NGFS scenario
  names; the relative multiplier ordering (NZ > B2C > CP) is directionally consistent with the NGFS
  finding that orderly-but-fast transitions produce sharper near-term repricing than continued
  inaction, even though inaction is worse in the long run (a nuance the single-multiplier model
  cannot represent, since it has no time dimension).
- **GICS sector taxonomy**: the 10 sectors match standard GICS sector-level classification.
- **IPCC AR6 WGI regional projections**: cited in the guide as a data source for geography-level
  calibration; not traceable to a specific figure/table in the code.

## 9 · Future Evolution

### 9.1 Evolution A — Calibrate the base matrix to real data and fix the ceiling-compression artefact (analytics ladder: rung 2 → 3)

**What.** This is one of the batch's simplest, most transparent modules (§7.1): a hand-authored 10-sector × 5-geography base matrix scaled by clean scenario multipliers (CP 0.8×, B2C 1.0×, NZ 1.35×), no PRNG, directionally sensible. Two rung-limiting issues per §7.6: (1) the 50-cell base scores are expert-judgment estimates with no cited derivation from the IPCC AR6 / NGFS Phase 5 sources the guide names; (2) the 100-point cap creates a compression artefact — §7.4 shows Energy cells at base 85 and 92 both saturate to 100 under Net Zero 2050, erasing real differentiation, and much of the "Net Zero is riskier near-term" signal is actually just ceiling-clipping. Only 3 of NGFS's 5 scenarios are modelled.

**How.** (1) Derive base scores from real sector-geography transition-risk indicators: NGFS Phase 5 sector damage/repricing factors and IPCC AR6 regional projections, replacing hand-set values with sourced ones (rung 3). (2) Fix the compression: either raise the cap or (better) compute risk on an unbounded scale and only band for display, so base-85 and base-92 stay distinguishable under multipliers. (3) Add the missing NGFS scenarios (Delayed Transition, Divergent NDC) — the §7.7 note that a single time-less multiplier can't represent the disorderly-transition nuance argues for a per-scenario, per-horizon factor rather than one scalar. (4) Bench-pin the §7.4 Energy/NZ worked example.

**Prerequisites.** NGFS Phase 5 sector/regional factor tables (largely public); a decision on the display scale to eliminate compression. **Acceptance:** base cells trace to a cited NGFS/IPCC factor; two distinct base scores never collapse to the same displayed value through capping; all 5 NGFS scenarios available.

### 9.2 Evolution B — Heatmap-narration copilot for portfolio positioning (LLM tier 1)

**What.** A copilot answering "which sector-geography cells are CRITICAL under Net Zero, and why?", "how much of Energy's risk jump is real vs ceiling-capping?", "compare Middle East vs Europe transition risk across sectors" — narrating the matrix, its multipliers, and the scenario-sensitivity comparison.

**How.** Tier 1, grounded in this Atlas record and page state: the calculation is fully transparent (`min(100, base × multiplier)`, §7.1), so the copilot reproduces and explains every cell, the band thresholds, and the scenario ordering (NZ>B2C>CP front-loading, the genuine NGFS insight §7.7 credits). Critically, an honest copilot should surface the compression artefact §7.4 documents — when a user asks why two Energy cells both read 100, it explains the ceiling effect rather than implying they're truly equal-risk. Pre-Evolution-A it discloses base scores are expert judgment, not modelled (§7.6). The module is frontend-only (tier B, EP-CD2) so tool-calling awaits a route port; the matrix is small enough that tier-1 reasoning over page state fully covers the use case.

**Prerequisites.** None for tier 1; Evolution A's calibration makes the copilot's "why" answers cite real factors instead of expert judgment. **Acceptance:** every cell value in an answer reproduces from base × multiplier; the copilot flags ceiling-capped cells rather than overstating their equivalence; base-score provenance is labelled expert-judgment until Evolution A.