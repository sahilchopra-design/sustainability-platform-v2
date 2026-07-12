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
