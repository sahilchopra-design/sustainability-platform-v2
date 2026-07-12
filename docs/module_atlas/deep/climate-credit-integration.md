## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry for this route describes a *carbon-credit
> offset integration* workflow (ICVCM CCP quality screening, VCMI claims tiers, net financed
> emissions). **None of that logic exists in this module's code.** What the page actually implements
> is **climate-conditioned IFRS 9 credit risk**: NGFS-scenario PD/LGD adjustment, ECL uplift, SICR
> staging, a hazard × sector matrix, and sector transition-cost projections. The ICVCM/VCMI
> methodology genuinely lives in the carbon-credit family (`vcm-integrity`, `credit-integrity-dd`,
> `cc-*` modules, `carbon-credit-quality` engine). The guide entry should be rewritten; the sections
> below document the code as it actually behaves.

### 7.1 What the module computes

For 40 synthetic obligors across 10 sectors, the module conditions a standard one-year IFRS 9
expected-credit-loss model on 5 NGFS climate scenarios:

```
ECL = PD × LGD × EAD                       (unconditional, per IFRS 9 §5.5.17)
ECL_climate = PD_adj × LGD_adj × EAD       (scenario-conditioned)
Uplift % = (ECL_climate − ECL_base) / ECL_base × 100
```

Each obligor carries six risk primitives: `pd_base` (0.5%–4.5%), `lgd_base` (25%–70%), `ead`
($50–1,000M), `carbonInt` (80–1,280 tCO₂e/$M revenue), `physScore` and `transScore` (10–90 on the
platform's 0–100 physical/transition risk scales).

### 7.2 Scenario parameterisation (NGFS Phase-consistent multipliers)

| NGFS scenario | Temp pathway | PD multiplier (ceiling) | LGD multiplier | Economic reading |
|---|---|---|---|---|
| Net Zero 2050 | 1.5 °C | 1.08 | 1.05 | Orderly: early carbon price, modest credit stress |
| Below 2 °C | 1.8 °C | 1.12 | 1.07 | Orderly but slower; slightly higher terminal stress |
| Delayed Transition | 1.8 °C | 1.22 | 1.12 | Disorderly: late abrupt policy → sharper repricing |
| NDC Policies | 2.5 °C | 1.35 | 1.18 | Hot-house drift: physical risk starts to dominate |
| Current Policies | 2.7 °C | 1.58 | 1.28 | Worst credit outcome: chronic + acute physical loss |

The multiplier is a **ceiling**, not a flat scalar — it only applies in full to an obligor at the
maximum carbon intensity (see §7.3). Ordering follows the NGFS logic that *disorderly and hot-house
scenarios are worse for credit than orderly ones*, which is why Current Policies (2.7 °C) carries
the largest PD stress (×1.58), not the 1.5 °C scenario.

### 7.3 Transmission channels — how climate risk enters PD

Two channels scale the scenario multiplier to each obligor before it touches PD:

```js
carbonFactor = 1 + (pdMultiplier − 1) × (carbonInt / 800)          // transition channel
physFactor   = 1 + (pdMultiplier − 1) × (physScore / 80) × 0.3     // physical channel
PD_adj       = min(1, PD_base × carbonFactor × physFactor)
LGD_adj      = LGD_base × lgdMultiplier
```

- **Transition normalisation (÷800):** carbon intensity is normalised against 800 tCO₂e/GWh — the
  supercritical-coal carbon-intensity ceiling (IEA *Electricity 2023*, Table 3.1, ≈820 gCO₂/kWh).
  An obligor at coal-plant intensity absorbs the full scenario PD multiplier; an obligor at half
  that intensity absorbs half the excess. This makes the stress *linear in carbon intensity*, the
  same first-order treatment used in NGFS bank stress-test guidance.
- **Physical normalisation (÷80, ×0.3):** the physical score is normalised to the platform's
  maximum observed score (80) and down-weighted to 30% of the transition channel — encoding the
  assumption that, at a 1-year ECL horizon, transition repricing dominates acute physical damage.
- **PD cap:** `min(1, ·)` keeps the adjusted PD a valid probability.
- LGD takes the scenario multiplier directly (collateral haircuts are portfolio-wide, not
  obligor-carbon-specific).

### 7.4 Worked example (Current Policies, one obligor)

Take an obligor with `PD_base = 0.90%`, `LGD_base = 40%`, `EAD = $500M`, `carbonInt = 400`,
`physScore = 40`, under **Current Policies** (PD ×1.58, LGD ×1.28):

| Step | Computation | Result |
|---|---|---|
| Transition factor | 1 + 0.58 × (400/800) | 1.290 |
| Physical factor | 1 + 0.58 × (40/80) × 0.3 | 1.087 |
| PD adjusted | 0.009 × 1.290 × 1.087 | **1.262%** |
| LGD adjusted | 0.40 × 1.28 | **51.2%** |
| ECL base | 0.009 × 0.40 × 500 | **$1.80M** |
| ECL climate | 0.01262 × 0.512 × 500 | **$3.23M** |
| ECL uplift | (3.23 − 1.80) / 1.80 | **+79.5%** |
| SICR z | (0.01262 − 0.009) / (0.009 × 0.3 + 0.001) | **0.98** |
| Stage | PD_adj 1.26% > 1% threshold | **1 → 2 migration** |

The obligor crosses the Stage-2 boundary purely from climate conditioning — exactly the SICR
mechanic (significant increase in credit risk since origination) that IFRS 9 §5.5.9 requires
institutions to evidence.

### 7.5 Staging & SICR rubric

| Rule | Threshold | Basis |
|---|---|---|
| Stage 1 → 2 | adjusted PD > 1% | Simplified low-credit-risk exemption boundary |
| Stage 2 → 3 | adjusted PD > 3% | Proxy for credit-impairment onset |
| SICR z-score | `ΔPD / (0.3 × PD_base + 0.1bp)` | Materiality scaled to 30% relative PD growth; z ≥ 1 ≈ SICR |

The z denominator makes the trigger *relative*: a 40bp PD rise is significant for a 90bp obligor
(z≈1) but immaterial for a 4% obligor (z≈0.03). The +0.1bp floor guards division for near-zero PDs.
Portfolio KPIs aggregate: total ECL base vs adjusted per scenario, uplift %, and the count of
stage migrations (the chart series `portfolioStats`).

### 7.6 Companion analytics on the page

- **Hazard × Sector matrix** — 7 hazards (Flood, Wildfire, Heat Stress, Drought, Carbon Price,
  Policy Shock, Stranded Asset) × 10 sectors, scored 10–95; drives the radar view. Sector filter
  swaps portfolio-mean scores for the selected sector's row.
- **Sector transition risk** — per-sector carbon cost projections for 2030/2050 under Net Zero
  ($50–1,000M by 2030; $200–4,000M by 2050) vs Current Policies (roughly 10× smaller), plus
  stranded-asset percentages (NZ 5–65% vs CP 0.5–8.5%) — the NZ/CP gap *is* the transition-risk
  wedge.
- **Intermodular map** — 12 documented live links: this module feeds `pd_climate_adj`/`lgd_climate_adj`/
  `ecl_uplift_pct` to DME Financial Risk (EP-BE1) and Credit Risk Analytics (EP-BI1), scenario
  parameters to the Stress Tester (EP-G2), and exchanges WACI/EVIC bidirectionally with PCAF
  Financed Emissions (EP-AJ1). Schema anchor: migration 088 (`climate_scenarios`,
  `climate_scenario_variables`, `asset_climate_risk`).

### 7.7 Data provenance & limitations

- **All obligor data is synthetic demo data**, generated by the platform's seeded PRNG
  `sr(seed) = frac(sin(seed+1)×10⁴)` — stable across renders, but not real counterparties.
  Scenario multipliers and the 800 tCO₂e/GWh anchor are the only externally sourced constants.
- Single-period (1-year) ECL only; no lifetime ECL term structure for Stage-2 assets, no
  discounting, no PD term-structure conditioning (a production implementation would condition the
  full PD curve per NGFS macro paths).
- Physical channel is a scalar down-weight (0.3), not hazard-specific damage functions — the
  hazard matrix is descriptive, not yet wired into PD.

**Framework alignment:** IFRS 9 §5.5 (ECL, SICR, staging) · NGFS Phase IV scenario set ·
BCBS *Principles for the effective management and supervision of climate-related financial risks*
(2022) · EBA/ECB climate stress-testing practice for the multiplier-on-PD design.
