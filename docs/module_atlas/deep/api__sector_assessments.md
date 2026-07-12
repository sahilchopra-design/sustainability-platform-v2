## 7 · Methodology Deep Dive

### 7.1 What the domain computes

`/api/v1/sector/*` bundles **three sector-specific ESG calculators computed inline in the route
file** (`sector_assessments.py` — no separate engine) with Postgres persistence:

1. **Data centre efficiency** (`POST /sector/technology/data-center`) — carbon intensity, annual
   CO₂e, PUE/WUE/renewables benchmarking, improvement targets.
2. **Insurance CAT risk** (`POST /sector/insurance/cat-risk`) — annual average loss (AAL),
   climate-adjusted AAL, PML curve by return period, insurability score.
3. **Power-plant decarbonisation** (`POST /sector/energy/plant-decarbonisation`) — gap to the IEA
   Net-Zero-Emissions pathway, stranding year, 5-yearly roadmap with capex.

Core formulas, quoted from code:

```
DC:    carbon_intensity = grid_ef × PUE × fossil_share          fossil_share = 1 − renewable%/100
       annual_co2e_t    = energy_MWh × grid_ef/1000 × fossil_share
CAT:   AAL = value × base_rate(peril) × construction_mult × age_mult
       effective_uplift = 1 + (scenario_uplift − 1) × (horizon_year − 2025)/75
       PML(rp) = value × ln(rp/10 + 1) × 0.15 × construction_mult
Plant: projected(yr) = intensity + degradation × (yr − 2025);   stranded when > NZE(yr) × 1.5
```

### 7.2 Parameterisation

**Grid emission factors** (`_GRID_EMISSION_FACTORS`, kgCO₂/MWh, unattributed but consistent with
public grid-intensity statistics; fallback 350): UK 207, EU_DE 385, EU_FR 56, EU_NL 340,
US_ERCOT 410, US_PJM 380, US_CAISO 220, US_MISO 450, SG 408, AU_NEM 680, IN 720, JP 470.
Benchmarks: PUE industry avg 1.58 / best 1.10 (matches Uptime Institute global-survey averages);
WUE avg 1.8 / best 0.2 L/kWh; renewables avg 40 % / best 100 %.

**CAT risk constants** (all synthetic demo calibrations):

| Table | Values |
|---|---|
| `_BASE_AAL_RATES` (% of value) | flood 0.35 %, windstorm 0.25 %, earthquake 0.20 %, wildfire 0.15 %, hail 0.10 %, subsidence 0.08 %; unknown peril 0.20 % |
| `_CLIMATE_SCENARIO_UPLIFT` (2100 ceiling) | RCP2.6: flood 1.15 / wildfire 1.20; RCP4.5: flood 1.30 / wildfire 1.45; RCP8.5: flood 1.60 / wildfire 1.90; earthquake always 1.00 (correctly climate-invariant) |
| `_CONSTRUCTION_VULNERABILITY` | reinforced_concrete 0.7, steel_frame 0.8, masonry 1.0 (default), modular 1.1, timber 1.3 |
| Age multiplier | >50 yr ×1.15; >30 yr ×1.05 (base year hard-coded 2025) |
| Insurability bands (on climate AAL/value) | <0.1 % → 95 "Fully Insurable"; <0.5 % → 80 "Standard"; <1 % → 60 "Elevated"; <3 % → 35 "Specialist Market"; else 15 "Difficult to Insure" |

**Plant constants:** `_IEA_NZE_PATHWAY` global power-sector intensity {2020: 460, 2025: 340,
2030: 138, 2035: 60, 2040: 25, 2045: 10, 2050: 0} gCO₂/kWh — the 2030 value 138 matches the IEA NZE
electricity-sector milestone; linear interpolation between nodes. Typical intensities: coal 900,
gas_ccgt 360, gas_peaker 500, oil 650, biomass 50, nuclear 12. Annual degradation
(gCO₂/kWh/yr): coal 2.0, peaker/oil 1.5, CCGT 1.0, biomass 0.5, nuclear 0.2. `_DECARB_ACTIONS`
gives per-type action ladders with capex (e.g. coal: CEMS £2M 2026 → 20 % biomass co-firing £15M
2028 → biomass/CCS £150M 2030 → phase-out £200M 2035); each applied action multiplies projected
intensity by 0.6 ("assume each action achieves ~40 % reduction").

Validation: `data_quality_score = max(0, 1 − 0.05·warnings − 0.10·missing_fields)`.

### 7.3 Calculation walkthrough

- **DC score** = simple mean of 2–3 benchmark scores; PUE score is linear between industry average
  (0) and best-in-class (100): `((1.58 − PUE)/(1.58 − 1.10)) × 100`, clamped 0–100. Improvement
  targets trigger on rules (PUE > 1.3, renewables < 80 %, air cooling & >5 MW, no PPA) with
  formula-based costs (e.g. containment cost = IT MW × £50k, payback 2.5 yr). Persisted rating:
  A+ ≥90, A ≥80, B ≥65, C ≥50, D ≥35, else E.
- **CAT** AAL uplift is horizon-scaled: the scenario table is treated as the 2100 uplift and
  prorated linearly from 2025. PML is a log curve of the return period — **not** derived from the
  AAL or an event-loss table. Both are persisted (`cat_risk_assessments` +
  `cat_risk_climate_scenarios`, PML column = the max PML across return periods).
- **Plant**: CCS reduces effective intensity by the capture rate; `paris_aligned` if intensity ≤
  NZE(2025) × 1.1; stranding scan runs 2025–2050 in 1-yr steps for `projected > NZE × 1.5`;
  roadmap runs 2025–2050 in 5-yr steps applying at most one action per step. If
  `remaining_asset_life_years` retires the plant before stranding, stranding is cleared with a
  warning. All persistence is "non-blocking" — insert failure logs a warning and returns
  `assessment_id = null`.

### 7.4 Worked example — flood CAT risk, RCP8.5, 2050

£10M timber property built 1970, peril flood, RCP8.5, horizon 2050:

| Step | Computation | Result |
|---|---|---|
| Base AAL | 10,000,000 × 0.0035 × 1.3 (timber) × 1.15 (age 55) | **£52,325** |
| Horizon scale | (2050 − 2025)/75 | 0.3333 |
| Effective uplift | 1 + (1.60 − 1) × 0.3333 | 1.20 |
| Climate AAL | 52,325 × 1.20 | **£62,790** (uplift +20 %) |
| PML 1-in-100 | 10M × ln(100/10 + 1) × 0.15 × 1.3 | 10M × 2.3979 × 0.195 ≈ **£4.676M** (46.8 % of value) |
| Insurability | 62,790/10M = 0.63 % → band <1 % | **60 — "Elevated Risk"** |

Drivers emitted: timber vulnerability, building age, and (uplift ≤ 20 % so no climate driver line,
but) the RCP8.5-flood amplification note fires because peril∈{flood, wildfire} and scenario RCP8.5.

### 7.5 Data provenance & limitations

- **No `sr()` PRNG anywhere** — outputs are deterministic functions of inputs, but nearly all
  coefficients (AAL rates, uplifts, vulnerability multipliers, degradation rates, action capex,
  40 %-per-action reduction) are **synthetic demo calibrations** without cited sources. The IEA NZE
  pathway nodes and PUE benchmarks are the main externally recognisable anchors.
- CAT model is a rate-based scaler, not a stochastic catastrophe model: no hazard maps
  (lat/long are accepted but never used in the loss maths), no event sets, no vulnerability
  curves, no deductibles/limits; PML is independent of AAL.
- Plant "degradation" makes intensity worsen linearly over time — a stylised stand-in for
  efficiency decay; real CCGT/coal intensity is roughly flat absent derating.
- Hard-coded evaluation year 2025 in age and stranding logic will drift stale.
- DC water benchmark only scores when WUE supplied; grid factor fallback 350 silently applies to
  unknown regions.

### 7.6 Framework alignment

- **IEA Net Zero Emissions by 2050** — the plant module benchmarks against the NZE global power
  generation intensity trajectory (~138 gCO₂/kWh by 2030, net-zero power by ~2040 in advanced
  economies / 2050 globally); alignment = within 10 % of the interpolated path.
- **Paris Agreement** — "paris_aligned" is operationalised purely via the IEA NZE proxy.
- **The Green Grid PUE/WUE** — PUE (total facility power ÷ IT power) and WUE (litres ÷ IT kWh) are
  Green Grid metrics; benchmarks echo Uptime Institute survey averages.
- **Catastrophe-modelling practice (Solvency II / rating-agency PML)** — AAL and 1-in-N PML are
  standard insurance measures; here they are approximated with fixed rates and a log curve rather
  than simulated event losses. RCP2.6/4.5/8.5 are IPCC AR5 concentration pathways used as uplift
  scenarios.
- **TCFD physical-risk disclosure** — climate-adjusted AAL by scenario × horizon is the disclosure
  quantity the CAT endpoint produces.
