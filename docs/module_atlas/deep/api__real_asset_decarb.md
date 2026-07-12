## 7 · Methodology Deep Dive

### 7.1 What the module computes

`backend/services/real_asset_decarb_engine.py` (engine E74) is a five-function real-asset
decarbonisation toolkit exposed via `api/v1/routes/real_asset_decarb.py`:

| Function | Route | Core output |
|---|---|---|
| `assess_lock_in_risk` | (part of roadmap/brown-to-green flows) | lock-in score 0–100, stranding year, stranded cost |
| `plan_capex_transition` | `POST /capex-transition` | greedy abatement-technology capex stack + SBTi trajectory |
| `calculate_retrofit_npv` | (retrofit-measures ref + NPV) | per-measure NPV @5/7/10%, payback, CRREM alignment |
| `model_brown_to_green` | `POST /brown-to-green` | portfolio capex, stranded-risk reduction, green uplift |
| `generate_decarb_roadmap` | `POST /decarb-roadmap` | budget-constrained, cost-effectiveness-ranked action plan |

Key formulas quoted from code:

```
lock_in_score = clamp( (max(gap,0)/base_int)×50 + (remaining_life/typical_life)×30
                       + (years_to_next_capex/capex_cycle)×20 , 0, 100)
stranding year = first y in 2025–2050 with base_int×(1−sbti_rate)^(y−2024) ≤ current_intensity
stranded_cost = asset_value × (remaining_life/typical_life) × max(gap,0)/base_int
cost_effectiveness = tCO2e_reduction / capex × 1,000,000     # tCO2e per $M, greedy-ranked
retrofit NPV = −capex + Σ_life effective_saving/(1+r)^t ,  r ∈ {5%, 7%, 10%}
effective_saving = annual_energy_cost × saving% × (1 − cumulative_saving%/100)
```

### 7.2 Parameterisation

**Asset-type registry** (`ASSET_TYPES`, 8 types) — each carries sector, typical life, capex
cycle, CRREM 2030 intensity target, SBTi sector decarbonisation rate, stranding threshold and a
green-premium range. Extract:

| Type | Life (y) | CRREM 2030 kgCO₂/m² | SBTi rate %/pa | Stranded ≥ kgCO₂/m² | Green premium |
|---|---|---|---|---|---|
| office | 40 | 15 | 7.0 | 70 | 5–15% |
| retail | 35 | 18 | 7.0 | 80 | 3–10% |
| steel_plant | 25 | 800 | 4.2 | 2,200 | 1–5% |
| cement_plant | 30 | 550 | 4.2 | 1,100 | 0.5–3% |
| data_centre | 20 | 100 | 7.0 | 450 | 2–8% |
| logistics | 30 | 30 | 3.8 | 100 | 2–7% |

SBTi rates 7.0 / 4.2 / 3.8 %pa (buildings / industry / transport) are cited to SBTi sector
guidance in the module docstring. **Retrofit measures** (9, from insulation to CCS and
electrification) carry saving-% ranges, capex/m² ranges and lifespans. **Abatement
technologies** (5) carry IPCC-AR6-cited cost ranges ($5–40/t efficiency … $60–200/t CCS) and
max-reduction caps (30–90%). **Carbon-price scenarios**: conservative/baseline/accelerated,
2025→2050 ($30→$130 / $40→$175 / $55→$220). **CRREM pathways** as %-of-2019 milestones
(1.5C: 85/60/40/20/0; 2C: 90/72/52/32/0).

Crucially, the engine's header documents the platform's **random-as-data remediation**: every
returned metric is either a deterministic computation from caller inputs or an *honest null*
(`insufficient_data`); where literature ranges have no entity value, the `_mid()` **midpoint**
is used as a model parameter and flagged via `*_basis` fields
(`ipcc_ar6_range_midpoint`, `jll_cbre_range_midpoint`, `reference_range_midpoint`).

### 7.3 Calculation walkthrough

`plan_capex_transition` walks the five technologies in registry order (a fixed merit order, not
re-sorted by cost), abating `min(remaining × max_red%, remaining)` tCO₂e at the midpoint cost
until budget or emissions are exhausted; each layer reports
`npv_at_carbon_price = reduction × $75(baseline-2030) × 5 − investment`. The trajectory applies
the SBTi rate as a constant geometric decay with straight-line capex. `calculate_retrofit_npv`
stacks measures with a 0.7 interaction factor on cumulative savings (each new measure saves
against the already-reduced baseline) and caps combined savings at 90%; post-retrofit CRREM
alignment tests `current_avg_intensity × (1 − cum_saving%) ≤ crrem_2030`.
`generate_decarb_roadmap` sorts assets by tCO₂e/$M descending, funds greedily within budget,
tags quick wins (capex < $2M and >5 tCO₂e/$M) vs long-horizon (capex > $10M), and emits interim
targets 2025/2030/2035/2040/2050 at 10/42/55/70/100% reduction (42% by 2030 is the SBTi 1.5°C
cross-sector minimum).

### 7.4 Worked example — lock-in risk (office)

Inputs: age 20y, capex cycle 15y, current intensity 60 kgCO₂e/m², value $80M, 12,000 m².

| Step | Computation | Result |
|---|---|---|
| Remaining life | 40 − 20 | 20 y |
| Years to next capex | 15 − (20 mod 15) | 10 y |
| Divergence vs CRREM 2030 | 60 − 15 | +45 kgCO₂e/m² (+300%) |
| Stranding year | 55×0.93^t ≤ 60 already at t=1 | **2025** |
| Lock-in score | (45/55)×50 + (20/40)×30 + (10/15)×20 = 40.9 + 15 + 13.3 | **69.2 → "high"** |
| Stranded cost | 80M × (20/40) × 45/55 | **$32.7M** |
| Emissions at risk | 60 × 12,000 / 1000 | 720 tCO₂e/pa |
| Carbon price risk | 720 × $75 (baseline 2030) | **$54,000/yr** |

Note the stranding-year loop compares the *sector-average* SBTi decay path (starting at
`current_avg_intensity` 55, not the asset's own 60) against the asset's flat intensity — an
asset above the sector average strands immediately (2025), by construction.

### 7.5 Companion reference endpoints

`GET /ref/asset-types`, `/ref/retrofit-measures`, `/ref/abatement-costs`, `/ref/crrem-pathways`,
`/ref/sbti-sectors` serve the registries above verbatim so frontend modules can render the same
constants the calculators use.

### 7.6 Data provenance & limitations

- **No PRNG anywhere** — this engine is a flagship example of the fabrication remediation:
  midpoint model parameters are labelled, absent inputs produce `insufficient_data` statuses
  rather than invented numbers (e.g. empty portfolio/assets lists return null analyses).
- CRREM 2030 intensity targets and stranding thresholds are single global numbers per asset
  type (real CRREM is country × type × year); the %-of-2019 pathway is a 5-node stylisation.
- The capex stack is greedy in **registry order**, not sorted by marginal abatement cost, so it
  is not a true MACC optimisation; `npv_at_carbon_price` assumes a flat 5-year credit at the
  2030 baseline price.
- Retrofit economics use range midpoints; the 0.7 stacking factor is a modelling assumption.
- `generate_decarb_roadmap` falls back to per-asset defaults (1,000 tCO₂e, 30%, $1M) when a
  field is missing — the only place defaults substitute for entity data.

### 7.7 Framework alignment

- **CRREM v2.0 (2022)** — real CRREM defines country/type-specific carbon- and energy-intensity
  pathways to 2050; the module approximates with type-level 2030/2050 anchors and %-of-2019
  milestones, and tests post-retrofit alignment against the 2030 anchor.
- **SBTi sector guidance** — sector decarbonisation rates (buildings 7%/pa per the SBTi
  buildings guidance draft, industry 4.2%, transport 3.8%) drive trajectories; the 42%-by-2030
  interim target matches the SBTi Corporate Net-Zero Standard's 1.5°C near-term ambition
  (≈4.2%/yr linear reduction).
- **IPCC AR6 WGIII** — abatement-cost ranges per technology; midpoints flagged as model params.
- **TCFD / IFRS S2** — the roadmap response carries explicit `framework_alignment` flags; IFRS
  S2 requires disclosure of transition plans and capex alignment, which the funded/unfunded
  action split supports.
- **JLL/CBRE green-premium research** — source of the green-value-uplift ranges.
