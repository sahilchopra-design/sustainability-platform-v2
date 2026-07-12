## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry states the calculation engine is a
> **"Climate Adjusted Value"** model: `V_climate = V_base × (1 – δ_physical) × (1 – δ_transition)`,
> citing TCFD Infrastructure guidance and CRREM Global Pathways v2, with headline data points
> "Physical Risk Haircut 6.2%" / "Transition Risk Haircut 11.4%" / "At-Risk AUM 34%". **None of
> this exists in the code.** `RealAssetsClimatePage.jsx` draws `valuationM`, `physicalRisk` and
> `transitionRisk` as three **independent** seeded-random numbers per asset — `valuationM` is never
> multiplied by any haircut derived from the risk scores, so there is no `δ_physical`/`δ_transition`
> anywhere in the file. A genuine cap-rate-based climate valuation haircut *is* implemented
> elsewhere on the platform (`real-estate-valuation` module, §7 of its own deep dive) but this
> module does not call it or replicate its logic. The sections below describe what this module's
> code actually computes: a 40-asset physical/transition risk screen with CRREM pathway and
> stranding-year analytics, all independently randomised.

### 7.1 What the module computes

40 named trophy real-estate/infrastructure assets (One World Trade Center, The Shard, Marina Bay
Sands, Hudson Yards, Amazon HQ2, six data centres, five logistics parks, etc. — real building
names used only as labels) are each assigned, purely from a seeded PRNG, 16 independent
attributes:

```js
physicalRisk   = round(5   + sr(i*7)  * 85)   // 5–90
transitionRisk = round(10  + sr(i*11) * 80)   // 10–90
crremScore     = round(10  + sr(i*13) * 85)   // 10–95
strandingYear  = 2025 + floor(sr(i*17) * 20)  // 2025–2044
epcRating      = A..F  from sr(i*19)
carbonIntensity= round(20  + sr(i*23) * 180)  // kgCO2/sqm
retrofitCostM  = round(1   + sr(i*37) * 49)   // $M
valuationM     = round(50  + sr(i*41) * 2950) // $M
floodRisk/heatStress/windExposure/seaLevelRisk = round(sr(i*k) * ~50–80)
greenCert, netZeroReady, adaptationPlan        = threshold flags on further sr() draws
```

No attribute is derived from another — `valuationM` (the "Portfolio Value" KPI) has **zero
mathematical relationship** to `physicalRisk`/`transitionRisk`/`carbonIntensity` for the same
asset, even though the dashboard visually juxtaposes them as if the valuation reflects the risk.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Risk score ranges | Physical 5–90, Transition 10–90, CRREM 10–95 | Synthetic demo ranges, no external calibration |
| Stranding-year window | 2025–2044 (uniform) | Synthetic — no CRREM-derived breach-year calculation |
| `badge()` colour thresholds | 25/50/75 (on `100 − risk`) | UI heuristic, not a regulatory scale |
| CRREM pathway seeds (`office`,`retail`,`logistics`) | `80/90/70 − i·(6/5/4) + noise`, target `75 − i·7` | Synthetic decay curve loosely shaped like CRREM's declining intensity budget, not sourced from actual CRREM sector pathway files |

### 7.3 Calculation walkthrough

1. **Asset screen** (`filtered`): text/type/region filters plus a client-side sort over the 16
   attributes; no aggregation logic beyond filtering.
2. **KPIs** (`kpis`): straight `reduce`/`length` averages of `physicalRisk`, `transitionRisk`,
   `crremScore` across the fixed 40-asset array (not the filtered set), `totalVal = Σ valuationM`,
   `strandedSoon = count(strandingYear ≤ 2030)`.
3. **Type-level risk** (`typeRisk`): per-`type` mean of `physicalRisk`/`transitionRisk` — a
   groupby-average, not a value-weighted portfolio metric.
4. **Radar** (`radarData`): mean of 6 dimensions (`physicalRisk`, `transitionRisk`, `crremScore`,
   `carbonIntensity`, `floodRisk`, `heatStress`), each capped at 100 — note `carbonIntensity`
   (20–200 raw kgCO₂/sqm) is plotted on the same 0–100 axis as the 0–100 risk scores without
   rescaling, so it is visually understated relative to its true range.
5. **CRREM pathway tab**: a separate, portfolio-independent synthetic time series (`CRREM`
   array, 10 points from 2025 to 2052) — not derived from any of the 40 assets' own
   `crremScore`/`carbonIntensity`.
6. **Stranding tab**: buckets the 40 assets by `strandingYear` into `By 2030` / `2031–2035` /
   `2036–2040` / `After 2040`, and cross-plots `carbonIntensity` vs `retrofitCostM` for the 15
   earliest-stranding assets — purely descriptive, no NPV/valuation impact computed.

### 7.4 Worked example

Asset index `i=0` ("One World Trade Center", Office, North America):

| Field | Formula | Result |
|---|---|---|
| `physicalRisk` | `round(5 + sr(7)·85)` | `sr(7)=frac(sin(8)×10⁴)=0.9894` → `5+84.1=89` |
| `transitionRisk` | `round(10 + sr(11)·80)` | `sr(11)=frac(sin(12)×10⁴)=0.6603` → `10+52.8=63` |
| `crremScore` | `round(10 + sr(13)·85)` | `sr(13)=frac(sin(14)×10⁴)=0.9906` → `10+84.2=94` |
| `strandingYear` | `2025+floor(sr(17)·20)` | `sr(17)≈0.9358` → `2025+18=2043` |
| `valuationM` | `round(50+sr(41)·2950)` | independent draw, e.g. ≈`$1,800M` |

Despite `physicalRisk=89` (top-quintile physical exposure) and `crremScore=94` (near-worst CRREM
alignment), `valuationM` is whatever its own independent seed produces — a bank model-validation
reviewer would flag this immediately: **the headline "Portfolio Value" KPI carries no climate risk
signal at all**, contradicting the dashboard's implied narrative that value and risk are linked.

### 7.5 Stranding-year rubric (as coded)

| Bucket | Colour | Meaning in UI |
|---|---|---|
| ≤ 2030 | Red | "stranded soon" — counted in KPI `strandedSoon` |
| 2031–2035 | Amber | near-term watch |
| 2036–2040 / >2040 | Green/neutral | longer runway |

No formal stranding definition (e.g. CRREM budget breach year) drives this bucket — it is read
directly off the random `strandingYear` field.

### 7.6 Data provenance & limitations

- **100% synthetic.** All 16 numeric/categorical fields per asset use the platform's seeded PRNG
  `sr(seed)=frac(sin(seed+1)×10⁴)`, deterministic across renders but not sourced from any real
  hazard model, CRREM pathway file, or valuation feed. Asset *names* are real buildings; every
  other field is fabricated.
- No cross-field correlation: physical risk, transition risk, CRREM score, carbon intensity and
  valuation are drawn from independent seeds, so no scenario, sector, or geography coherence
  exists (e.g. a Middle East asset need not have elevated heat stress).
- CRREM pathway tab is disconnected from the per-asset `crremScore` — two unrelated
  representations of "CRREM" appear on the same page.
- No discounting, no NPV impact of retrofit capex, no link between `retrofitCostM` and the
  stranding year it is nominally meant to avert.

### 7.7 Framework alignment

- **CRREM** (Carbon Risk Real Estate Monitor): the module borrows CRREM terminology (pathway
  chart, "1.5°C Target" line, stranding year) but does not compute an actual property/sector
  carbon-budget breach year — CRREM proper derives stranding year as the year a property's
  operational carbon intensity first exceeds the science-based sector decarbonisation budget;
  here it is a uniform random draw.
- **TCFD**: the module reports physical and transition risk scores per asset, aligned in spirit
  with TCFD's physical/transition risk categorisation, but the scores are not built from TCFD's
  recommended hazard/scenario methodology.
- **NGFS/IPCC scenario framework**: absent — no SSP/RCP or NGFS scenario selector conditions any
  number on this page (contrast with `real-estate-climate-risk`, which does implement an
  NGFS/SSP-conditioned VaR).

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Support a real-assets portfolio manager's decision to hold, retrofit, or divest a real estate /
infrastructure asset by producing a defensible **climate-adjusted valuation** and a genuine
CRREM-based stranding year, replacing the current uncorrelated random fields. Scope: office,
retail, logistics, hotel, data-centre, healthcare, and mixed-use assets globally.

### 8.2 Conceptual approach
Adopt a **multiplicative valuation-haircut model** consistent with the guide's original intent —
`V_climate = V_base × (1 − δ_physical) × (1 − δ_transition)` — mirroring **MSCI Real Estate
Climate Value-at-Risk** (which applies separate physical-damage and transition-cost haircuts to
appraised value) and **CRREM's own CapEx/valuation bridge tool** (which converts pathway breach
year into a stranding discount). This is preferable to a full climate-adjusted DCF (as used in
`real-estate-valuation`) here because the module's asset set spans non-real-estate infrastructure
where a full NOI/cap-rate build-up is not always available; a haircut-on-appraised-value approach
generalises better across asset classes.

### 8.3 Mathematical specification

```
δ_physical_i   = Σ_h  P(hazard_h) × Damage_h(asset_i) × ExposureWeight_h        (h ∈ {flood,heat,wind,SLR,wildfire})
δ_transition_i = min(1, CarbonPriceExposure_i / AssetEBITDA_i)                   [capped at 60%]
CarbonPriceExposure_i = CarbonIntensity_i × GIA_i × CarbonPrice_scenario × YearsToBudgetBreach_i⁻¹
StrandYear_i   = 2025 + (CRREM_budget_2025,sector − CarbonIntensity_i) / SectorAnnualDecayRate_sector
                  [floored at 2025 if already breached; capped at 2050]
V_climate_i    = V_base_i × (1 − δ_physical_i) × (1 − δ_transition_i)
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| `P(hazard_h)` | Annual exceedance probability by hazard/location | JRC (EU), FEMA/NOAA (US), or Aqueduct/ND-GAIN (global) — already in `reference_data` for flood/heat |
| `Damage_h()` | Vulnerability (damage-ratio) function | JRC flood depth-damage curves, ISO 7933 heat-productivity curves |
| `CRREM_budget_2025,sector` | Sector 1.5°C carbon intensity budget | CRREM Global Pathways v2 (public, per-country/sector CSV) |
| `SectorAnnualDecayRate` | Required annual kgCO₂/sqm reduction | CRREM pathway slope |
| `CarbonPrice_scenario` | $/tCO₂ under NGFS scenario | NGFS Phase IV price paths |

### 8.4 Data requirements
- Per-asset: GIA, location (lat/long or ISO3), sector, EPC/energy intensity, appraised value,
  EBITDA/NOI where available — currently only `real-estate-valuation`'s engine holds analogous
  fields (`backend/services/real_estate_valuation_engine.py`).
- Hazard layers: flood/heat/wind/SLR exceedance probabilities — platform already ingests World
  Bank/Aqueduct-style reference data (`reference_data_layer`); needs an asset-geocoding join.
- CRREM sector pathway table: not yet in `reference_data`; would need a one-time CSV import from
  CRREM's public pathway files (free, licensed for non-commercial analytics use).

### 8.5 Validation & benchmarking plan
- **Backtest**: compare modelled `StrandYear_i` against realised EPC-rating downgrades / actual
  capex events where available.
- **Sensitivity**: vary `CarbonPrice_scenario` across NGFS Orderly/Disorderly/Hot-house paths and
  confirm `δ_transition` ordering matches scenario severity (Hot-house should not always dominate
  near-term, since transition cost is orderly-scenario-driven — physical damage dominates in
  Hot-house at longer horizons).
- **Reconciliation target**: MSCI Real Estate Climate VaR outputs and CRREM's own CapEx tool
  stranding-year estimates for a shared sample of assets.

### 8.6 Limitations & model risk
- Damage functions are location/hazard-specific and highly uncertain at asset (vs regional)
  resolution; treat `δ_physical` as a range, not a point estimate.
- `δ_transition` via EBITDA ratio requires reliable NOI data, often unavailable for
  non-real-estate infrastructure — conservative fallback: cap `δ_transition` at the sector median
  from `real-estate-carbon-analytics`' `costAt100` sensitivity when asset-level EBITDA is missing.
- Model does not yet address correlated tail risk (e.g. simultaneous flood + wildfire under one
  physical scenario) — production version should use a joint hazard copula, not independent
  per-hazard summation.
