## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's calculation engine states
> `ΔEBITDA = ΔRevenue(carbon price, demand) + ΔCost(energy, compliance) − ΔCapex(transition)` as
> the module's methodology, and cites specific EBITDA-impact outputs ("−18% Orderly," "−34%
> Disorderly"). **No EBITDA, revenue, cost, or capex calculation exists anywhere in the code.**
> The module instead displays 6 hardcoded NGFS/IEA-style scenario presets and a **sector-impact
> heuristic** that is a scaled random number, not a financial-statement projection. The sections
> below document what the code actually computes.

### 7.1 What the module computes

6 hardcoded scenario presets (name, carbon price, renewables %, temperature outcome, GDP impact,
coal phase-out year, EV share, hydrogen scale, CCUS capacity) plus a per-sector "impact" heuristic
computed once at module load:

```js
sectorImpact(preset, sector_i) = (sr(preset.id×100 + i×7) − 0.5) × |preset.gdp| × 3
customGDPEstimate = −customCarbonPrice × 0.01 − customTemp × 1.5    // linear heuristic, live-recomputed
```

### 7.2 Parameterisation

| Preset | Carbon price | Renewables | Temp | GDP impact | Coal phase-out | EV share |
|---|---|---|---|---|---|---|
| NGFS Net Zero 2050 | $250/t | 90% | 1.5°C | −2% | 2040 | 85% |
| NGFS Delayed | $350/t | 75% | 1.8°C | −4.5% | 2050 | 65% |
| Current Policies | $50/t | 40% | 3.0°C | −8% | 2070 | 30% |
| IEA NZE | $280/t | 88% | 1.4°C | −1.5% | 2035 | 90% |
| Below 2°C | $180/t | 70% | 1.7°C | −3% | 2045 | 55% |
| Divergent NZ | $400/t | 85% | 1.5°C | −5% | 2040 | 80% |

All 6 rows are hand-set constants, directionally consistent with real NGFS/IEA scenario narratives
(Current Policies has the lowest carbon price and highest temperature/GDP-loss outcome; IEA NZE has
the lowest near-term GDP loss and most ambitious 2035 coal phase-out). The **GDP-impact figures are
not computed from the carbon price, coal phase-out, or EV share columns in the same row** — they
are independently hand-set alongside them (e.g. Current Policies has both the lowest carbon price
*and* the largest GDP loss, which is the disorderly-transition narrative, but the −8% figure is
asserted, not derived).

### 7.3 Calculation walkthrough

1. **Scenario Builder tab**: displays the selected preset's 7 KPI cards directly from the constant
   object; a sortable table of all 6 presets; a sector-impact bar chart and a 5-axis radar
   (Renewable %, EV %, CCUS×12, Carbon$/4, GDP-derived index) built from simple linear rescalings of
   the same preset fields (not independent metrics).
2. **Sector impact heuristic**: `(sr(seed) − 0.5) × |gdp| × 3` — centers a random draw around 0,
   scaled by the scenario's overall GDP-impact magnitude. This produces sector values that sum to
   roughly zero (some sectors "gain," some "lose") and scale with how severe the scenario's GDP hit
   is, but the specific sign/magnitude per sector is random, not derived from that sector's actual
   carbon exposure, revenue mix, or cost structure.
3. **Impact Analysis tab**: cross-scenario sector-impact bar chart (first 5 sectors × all 6
   scenarios), a Carbon Price vs GDP scatter (directly plotting the 6 presets' own fields — a
   genuine relationship since both come from the same row, though not derived from one another), and
   a temperature-outcome bar chart.
4. **Pathway Comparison tab**: 3 fixed 7-point timelines (2025–2055, every 5 years) for Net
   Zero/Delayed/Current temperature and carbon-price trajectories — static arrays, not derived from
   the 6 presets or any interpolation function (unlike `transition-risk-dcf`'s genuine NGFS tabular
   lookup).
5. **Custom Scenarios tab**: 3 sliders (carbon price, renewables, target temp) feed a **live linear
   heuristic** `GDP ≈ −0.01×carbonPrice − 1.5×targetTemp` and a sector-impact bar chart using the
   same random-heuristic pattern as the preset sector impact, scaled by `customCarbonPrice × 0.02`.

### 7.4 Worked example

**Preset sector impact** (NGFS Net Zero 2050, `id=1`, `gdp=−2`):

| Sector | `sr(100+i×7)` | Impact = `(sr−0.5)×2×3` |
|---|---|---|
| Energy (i=0) | `sr(100)=0.258` | **−1.5** |
| Utilities (i=1) | `sr(107)=0.183` | **−1.9** |
| Materials (i=2) | `sr(114)` | **−0.9** |

**Custom scenario GDP heuristic** (`customCarbon=$200/t`, `customTemp=2.0°C`):

```
GDP ≈ −200×0.01 − 2.0×1.5 = −2.0 − 3.0 = −5.0%
```

This heuristic implies every $100/t of carbon price costs 1 percentage point of GDP and every
1°C of residual warming costs 1.5 points — a simple, transparent, but empirically unvalidated
linear rule of thumb, not a general-equilibrium or IAM (Integrated Assessment Model) output.

### 7.5 Companion analytics

- **Scenario Radar** — 5-axis normalised view of a single preset's Renewable%, EV%, CCUS
  (×12 scaling to fit a 0–100 axis), Carbon$ (÷4), and a GDP-derived "100+gdp×5" index — a
  visualization convenience, not an independently computed composite score.
- **Custom vs Presets scatter** — plots the user's custom carbon-price/temperature pair alongside
  the 6 presets for visual context.
- **Export** — CSV export of all 6 presets.

### 7.6 Data provenance & limitations

- **No EBITDA/revenue/cost/capex financial model exists**, despite this being the guide's headline
  methodology claim — see the mismatch flag above. The module is a scenario-parameter browser with
  a decorative sector-impact random overlay, not a company-financial-impact modeller.
- The 6 presets' fields (carbon price, GDP impact, temp, etc.) are **internally hand-set together**,
  not derived from each other via any model — a user cannot trust that changing one field (e.g. via
  the custom scenario sliders) would correctly imply the others, because no such linkage is coded
  beyond the simple linear GDP heuristic.
- Sector-level impacts are randomly generated (zero-centered, GDP-magnitude-scaled) and carry no
  sector-specific carbon exposure or transition-cost information, despite sitting in a chart labelled
  "Sector Impact."
- The 3 timeline pathways (temperature and carbon price, 2025–2055) are static arrays disconnected
  from the 6 scenario presets shown elsewhere on the same page — e.g. the "current" pathway's 2050
  carbon price (`20+6×5=50`) matches the Current Policies preset's $50/t by coincidence of shared
  authorship, not by a shared formula.

### 7.7 Framework alignment

- **NGFS Phase IV scenarios** and **IEA World Energy Outlook / NZE**: preset names and rough
  parameter directions (Net Zero 2050 lowest GDP loss among ambitious scenarios, Current Policies
  worst long-run temperature outcome) are consistent with the real narrative structure of these
  scenario families, even though the specific numeric values are illustrative rather than sourced
  from the actual NGFS/IEA published datasets.
- **TCFD Scenario Analysis Guidance (2022)**: the module's basic requirement — presenting at least
  a <2°C scenario alongside a current-policies baseline — is satisfied structurally (6 presets span
  1.4°C to 3.0°C), though the guidance's expectation of quantified financial impact is not met given
  the absence of any EBITDA/cash-flow calculation.
