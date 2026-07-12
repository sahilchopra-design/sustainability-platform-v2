# Api::Energy_Emissions
**Module ID:** `api::energy_emissions` · **Route:** `/api/v1/energy-emissions` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/energy-emissions/scope3-cat11` | `scope3_cat11` | api/v1/routes/energy_emissions.py |
| POST | `/api/v1/energy-emissions/csrd-auto-populate` | `csrd_auto_populate` | api/v1/routes/energy_emissions.py |
| GET | `/api/v1/energy-emissions/ref/methane-source-categories` | `ref_methane_categories` | api/v1/routes/energy_emissions.py |
| GET | `/api/v1/energy-emissions/ref/ogmp-levels` | `ref_ogmp_levels` | api/v1/routes/energy_emissions.py |
| GET | `/api/v1/energy-emissions/ref/abatement-measures` | `ref_abatement_measures` | api/v1/routes/energy_emissions.py |
| GET | `/api/v1/energy-emissions/ref/fuel-combustion-efs` | `ref_fuel_efs` | api/v1/routes/energy_emissions.py |
| GET | `/api/v1/energy-emissions/ref/product-use-profiles` | `ref_product_profiles` | api/v1/routes/energy_emissions.py |
| GET | `/api/v1/energy-emissions/ref/esrs-mappings` | `ref_esrs_mappings` | api/v1/routes/energy_emissions.py |
| GET | `/api/v1/energy-emissions/ref/esrs-minimums` | `ref_esrs_minimums` | api/v1/routes/energy_emissions.py |

### 2.3 Engine `csrd_auto_populate` (services/csrd_auto_populate.py)
| Function | Args | Purpose |
|---|---|---|
| `CSRDAutoPopulateEngine.populate` | entity_name, module_outputs, reporting_year | Map module outputs to ESRS data points. |
| `CSRDAutoPopulateEngine.get_mappings` |  |  |
| `CSRDAutoPopulateEngine.get_esrs_minimums` |  |  |

### 2.3 Engine `methane_ogmp` (services/methane_ogmp.py)
| Function | Args | Purpose |
|---|---|---|
| `MethaneOGMPEngine.assess_facility` | facility_name, sources, production_bcm_yr | Assess methane emissions for a facility. |
| `MethaneOGMPEngine._build_pathway` | results | Build prioritised reduction pathway (cheapest abatement first). |
| `MethaneOGMPEngine.get_source_categories` |  |  |
| `MethaneOGMPEngine.get_ogmp_levels` |  |  |
| `MethaneOGMPEngine.get_abatement_measures` |  |  |

### 2.3 Engine `scope3_cat11` (services/scope3_cat11.py)
| Function | Args | Purpose |
|---|---|---|
| `Scope3Cat11Engine.assess` | fuels, products, reporting_year, revenue_m_eur | Calculate Category 11 emissions. |
| `Scope3Cat11Engine.get_fuel_efs` |  |  |
| `Scope3Cat11Engine.get_product_profiles` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `module` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/energy-emissions/ref/abatement-measures** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['ldar', 'vapour_recovery', 'instrument_air', 'dry_seal', 'enclosed_flare', 'continuous_monitoring'], 'n_keys': 6}`

**GET /api/v1/energy-emissions/ref/esrs-mappings** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['E1-6_GHG_scope1', 'E1-6_GHG_scope2_lb', 'E1-6_GHG_scope2_mb', 'E1-6_GHG_scope3_total', 'E1-6_GHG_intensity_revenue', 'E1-9_carbon_price_internal', 'E1-9_transition_risk_eur', 'E1-9_physical_risk_eur', 'E2-4_pollutant_air', 'E3-4_water_consumption', 'E4-5_land_use_change'`

**GET /api/v1/energy-emissions/ref/esrs-minimums** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['E1', 'E2', 'E3', 'E4', 'E5', 'S1', 'S2', 'S3', 'S4', 'G1'], 'n_keys': 10}`

**GET /api/v1/energy-emissions/ref/fuel-combustion-efs** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['crude_oil_bbl', 'natural_gas_mcf', 'lng_tonne', 'thermal_coal_tonne', 'coking_coal_tonne', 'diesel_litre', 'gasoline_litre', 'jet_fuel_litre', 'lpg_tonne', 'naphtha_tonne'], 'n_keys': 10}`

**GET /api/v1/energy-emissions/ref/methane-source-categories** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['venting', 'flaring', 'fugitive_wellhead', 'fugitive_processing', 'fugitive_transmission', 'fugitive_distribution', 'pneumatic_devices', 'compressor_seals', 'tanks_loading', 'other'], 'n_keys': 10}`

**GET /api/v1/energy-emissions/ref/ogmp-levels** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': [1, 2, 3, 4, 5], 'n_keys': 5}`

**GET /api/v1/energy-emissions/ref/product-use-profiles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['passenger_car_ice', 'passenger_car_ev', 'commercial_vehicle', 'residential_boiler_gas', 'heat_pump', 'industrial_motor', 'data_server', 'household_appliance'], 'n_keys': 8}`

**POST /api/v1/energy-emissions/csrd-auto-populate** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `csrd_auto_populate` — extracted transformation lines:**
```python
rate = (pop_count / total * 100) if total > 0 else 0
```

**Engine `methane_ogmp` — extracted transformation lines:**
```python
tch4 = src.activity_bcm_yr * src.custom_ef_tch4_bcm
co2e_100 = tch4 * GWP_100
co2e_20 = tch4 * GWP_20
intensity = total_tch4 / activity_total if activity_total > 0 else 0
abatement_pct = (total_abatement / total_tch4 * 100) if total_tch4 > 0 else 0
weighted_level = sum(r.ogmp_level * r.emissions_tch4 for r in results) / total_tch4
weighted_level = sum(s.ogmp_level for s in sources) / len(sources) if sources else 0
```

**Engine `scope3_cat11` — extracted transformation lines:**
```python
elec_tco2 = annual_elec * p.grid_ef_tco2_mwh / 1000
annual_per_unit = elec_tco2 + fuel_tco2
lifetime_per_unit = annual_per_unit * lifetime
total_lifetime = lifetime_per_unit * p.units_sold
total_cat11 = total_fuel + total_product
top_pct = (top[1] / total_cat11 * 100) if total_cat11 > 0 else 0
intensity = total_cat11 / revenue_m_eur if revenue_m_eur > 0 else 0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`/api/v1/energy-emissions` bundles **three sibling engines** behind one route file
(`backend/api/v1/routes/energy_emissions.py`):

1. **Scope 3 Category 11 — Use of Sold Products** (`scope3_cat11.py`): downstream emissions from
   sold fuels and energy-using products, per the GHG Protocol Scope 3 Standard.
2. **Methane Monitoring / OGMP 2.0** (`methane_ogmp.py`): oil & gas methane inventory with OGMP
   level classification, GWP conversion, and a marginal-abatement reduction pathway.
3. **CSRD Auto-Populate** (`csrd_auto_populate.py`): maps platform module outputs into ~35 ESRS
   E1–E5 / S2–S4 data-point slots and scores disclosure readiness (`POST /csrd-auto-populate`).

Core formulas, quoted from code:

```
Cat-11 fuels:     tCO₂ = volume_sold × EF(fuel)                          (10-fuel EF table)
Cat-11 products:  annual = kWh × grid_EF/1000 + fuel_litres × EF + gas_mcf × EF
                  lifetime_total = annual × lifetime_years × units_sold
Methane:          tCH₄ = measured (L4/5) | activity_bcm × custom_EF | activity_bcm × default_EF
                  tCO₂e = tCH₄ × 28 (GWP-100) and × 82.5 (GWP-20)
                  intensity = Σ tCH₄ / activity_bcm
CSRD:             population_rate = populated_DPs / 35 mappable × 100
```

### 7.2 Parameterisation

**Fuel combustion EFs** (`FUEL_COMBUSTION_EF`, tCO₂/unit — magnitudes consistent with EPA/IPCC
default combustion factors, no explicit per-value citation): crude oil 0.43/bbl, natural gas
0.053/MCF, LNG 2.75/t, thermal coal 2.42/t, coking coal 3.10/t, diesel 0.00267/L, gasoline
0.00231/L, jet fuel 0.00254/L, LPG 2.98/t, naphtha 3.14/t. Exposed at
`GET /ref/fuel-combustion-efs`.

**Product use profiles** (`PRODUCT_USE_PROFILES`, `GET /ref/product-use-profiles`) — synthetic
typical-use assumptions: ICE car 1,200 L petrol/yr × 12 yr; BEV 3,500 kWh/yr; commercial vehicle
8,000 L diesel/yr × 10 yr; gas boiler 15,000 kWh + 500 MCF gas/yr × 15 yr; heat pump 4,000 kWh ×
18 yr; industrial motor 50,000 kWh × 20 yr; data server 8,760 kWh (= 1 kW continuous) × 5 yr;
appliance 400 kWh × 10 yr. Default grid EF 0.40 tCO₂/MWh (caller-overridable).

**Methane constants**: GWP-100 = 28 (in-code comment: IPCC AR5), GWP-20 = 82.5 (comment: AR6).
OGMP 2.0 levels 1–5 (`GET /ref/ogmp-levels`): generic EFs → country EFs → facility engineering
estimates → site measurement → source-level measurement. Ten source categories
(`GET /ref/methane-source-categories`) with default EFs (tCH₄ per bcm throughput; e.g. venting
0.40, fugitive wellhead 0.15, pneumatics 0.06) and abatement potentials (50–95%). Six abatement
measures (`GET /ref/abatement-measures`) with €/tCH₄ costs and reduction %: e.g. LDAR €2,500 @60%,
vapour recovery €4,000 @90%, instrument-air conversion €3,000 @95%, enclosed combustion €1,500 @98%.
All these numeric calibrations are **synthetic demo values** shaped by, not copied from, OGMP/IEA
marginal-abatement literature.

**CSRD**: 35 data-point mappings (13 environmental incl. PCAF financed emissions + WACI; 12 S2,
8 S3, 7 S4 — added per the in-code "Sprint 2 — P1-4" note), each carrying ESRS standard, DR,
paragraph, unit and `source_module.source_field` provenance. `ESRS_MINIMUMS` phase-in minimum DP
counts per standard (`GET /ref/esrs-minimums`): E1 15, S2 12, S3 8… Readiness: ≥70% high,
≥40% medium, else low.

### 7.3 Calculation walkthrough

- **Cat 11**: unknown fuel/product keys are silently skipped; fuel totals + product lifetime
  totals sum to `total_cat11_tco2`; top contributor and share reported; intensity per €M revenue
  if provided. Note products count *full lifetime* emissions of the reporting year's sales — the
  GHG Protocol's required treatment (all expected use-phase emissions booked in year of sale).
- **Methane** (`assess_facility`): per-source method waterfall (measured → custom EF → default EF
  → zero/"No data"); facility intensity divides by summed activity (falling back to
  `production_bcm_yr`); emissions-weighted OGMP level; EU Methane Regulation flag = **all**
  sources at Level ≥ 3 (code comment: "Level 3+ required by 2027"); reduction pathway lists each
  applicable measure per source with `cost_eur = reduction × cost_per_tCH₄`, sorted ascending by
  €/tCO₂e — a marginal abatement cost curve.
- **CSRD populate**: exact `(module, field)` key match → populated DP (confidence "high"); misses
  become gap records with reasons; per-ESRS coverage percentages; readiness rating.

### 7.4 Worked example (Cat 11, one fuel + one product)

Refiner sells 1,000,000 bbl crude and 10,000 ICE cars (grid EF irrelevant, petrol path):

| Step | Computation | Result |
|---|---|---|
| Crude | 1,000,000 × 0.43 | 430,000 tCO₂ |
| Car annual/unit | 1,200 L × 0.00231 | 2.772 tCO₂ |
| Car lifetime/unit | 2.772 × 12 | 33.26 tCO₂ |
| Cars total | 33.26 × 10,000 | 332,640 tCO₂ |
| **Cat 11 total** | 430,000 + 332,640 | **762,640 tCO₂** |
| Top contributor | Crude Oil | 56.4% |

Methane cross-check: a wellhead source with 2 bcm/yr at Level 2 → 2 × 0.15 = 0.30 tCH₄ (the EF
table is denominated in tCH₄ per bcm) → 8.4 tCO₂e (GWP-100) / 24.75 tCO₂e (GWP-20); LDAR pathway entry:
reduction 0.18 tCH₄, cost €450, €/tCO₂e = 450/(0.18×28) = **€89.3**.

### 7.5 Data provenance & limitations

- **No PRNG/seeded data in any of the three engines** — pure calculators over caller inputs; the
  numeric tables above are hardcoded reference constants. Fuel EFs are realistic public-domain
  magnitudes; product-use profiles and methane cost/abatement tables are synthetic calibrations.
- **GWP labelling nuance**: 28 is AR5 GWP-100 (AR6 fossil CH₄ is 29.8); 82.5 matches AR6 GWP-20 —
  the engine intentionally mixes vintages, as documented in its header.
- Cat 11 covers only *direct* use-phase emissions (GHG Protocol also defines an indirect tier);
  no product-mix degradation, regional grid decarbonisation trajectories, or fuel-in-use vs
  feedstock split for naphtha.
- The EU Methane Regulation compliance flag is a single boolean on OGMP level; the actual
  Regulation (EU) 2024/1787 imposes MRV timelines, LDAR frequencies and venting/flaring bans not
  modelled here.
- CSRD population is presence-based key matching; it validates neither values nor units, and its
  35 mappable DPs are a small subset of the >1,100 ESRS data points in EFRAG's IG3 list —
  `ESRS_MINIMUMS` gestures at phase-in minimums but is not enforced in scoring.

### 7.6 Framework alignment

- **GHG Protocol Scope 3 Standard, Category 11:** requires lifetime use-phase emissions of
  products sold in the reporting year — implemented for both fuels-sold (combustion EF × volume)
  and energy-using products (annual energy × lifetime), the Standard's two prescribed approaches.
- **OGMP 2.0 (UNEP/CCAC):** the 5-level reporting ladder is implemented faithfully; OGMP's "Gold
  Standard" pathway expects Level 4/5 site+source reconciliation, approximated here by the
  measured-data branch and the emissions-weighted level metric.
- **EU Methane Regulation 2024/1787:** MRV escalation deadlines motivate the Level-3+ compliance
  flag.
- **IPCC AR5/AR6 GWPs:** CH₄→CO₂e conversion at both 100-yr and 20-yr horizons, surfacing the
  short-term-potency framing used in methane finance.
- **CSRD / ESRS (EFRAG Set 1 2023, IG3):** data points are addressed by standard/DR/paragraph
  (e.g. E1-6 §44(a) gross Scope 1); the auto-populate pattern mirrors ESAP-ready digital tagging
  workflows. PCAF financed emissions and WACI are mapped into E1 as financial-sector metrics.
- **SBTi adjacency:** Cat 11 output is the dominant scope-3 category for fossil producers, the
  input to SBTi's well-below-2°C scope-3 coverage tests.

## 9 · Future Evolution

### 9.1 Evolution A — Grid-decarbonisation trajectories, real methane MRV, and full ESRS mapping (analytics ladder: rung 1 → 3)

**What.** Three sibling engines behind one route: Scope 3 Category 11 (use of sold products), Methane
OGMP 2.0 (inventory + marginal-abatement pathway), and CSRD auto-populate (35 ESRS datapoint mappings)
— pure calculators, no PRNG, with realistic public-magnitude fuel EFs. §7.5 names the deepening
targets: Cat 11 uses **static product-use profiles** with no grid-decarbonisation trajectory (a BEV's
lifetime emissions assume today's grid EF for all 12 years); the EU Methane Regulation compliance flag
is a **single boolean on OGMP level** (the real Reg. 2024/1787 imposes MRV timelines, LDAR frequencies
and venting/flaring bans); the methane cost/abatement tables are synthetic calibrations; and CSRD
auto-populate is **presence-based key matching** over just 35 of the >1,100 ESRS datapoints. Evolution
A adds grid-decarbonisation trajectories to Cat 11, real methane MRV compliance logic, and expanded
ESRS coverage.

**How.** `Scope3Cat11Engine.assess` applies a per-year grid-EF decline path (from the platform's
NGFS/IEA scenario data) so BEV lifetime emissions fall as the grid decarbonises; the methane engine
implements the Reg. 2024/1787 MRV/LDAR/venting requirements beyond the OGMP-level flag; the CSRD
mapping expands toward EFRAG's full IG3 datapoint set with unit validation. Rung 3: calibrate the
methane abatement-cost curve against IEA/OGMP marginal-abatement literature and validate fuel EFs
against IPCC/EPA vintages (resolving the documented AR5/AR6 GWP-vintage mix, 28 vs 29.8).

**Prerequisites.** Fix the harness — §4.2 shows `POST /csrd-auto-populate` **skipped** (and
`/scope3-cat11` untraced); preserve the honest GWP-vintage documentation. **Acceptance:** the §7.4
Cat 11 worked example (762,640 tCO₂ total, crude 56.4%) reproduces at static grid EF, then BEV
lifetime emissions decline under a decarbonising-grid path; the methane compliance flag reflects real
Reg. 2024/1787 requirements; CSRD coverage exceeds 35 datapoints with unit checks.

### 9.2 Energy-emissions analyst with tool-called Cat 11 and methane (LLM tier 2)

**What.** A tool-calling analyst for energy-sector reporting teams: "compute our Scope 3 Category 11
from these fuels and products" (`/scope3-cat11` → lifetime use-phase emissions, top contributor,
intensity), "assess our facility methane and build the abatement pathway" (the OGMP engine → OGMP
level, GWP-100/20 CO₂e, cheapest-first MACC), and "auto-populate our ESRS E1 datapoints" (`/csrd-auto-
populate` → coverage %, gaps, readiness) — narrating the engines' real deterministic outputs.

**How.** Tool schemas over the 2 POST + 8 GET operations; the reference endpoints (methane source
categories, OGMP levels, abatement measures, fuel EFs, product-use profiles, ESRS mappings/minimums)
are exceptional RAG grounding for "what's the OGMP Level 4 requirement?" or "what EF for LNG?"
questions. The no-fabrication validator checks every tCO₂e, tCH₄ and €/tCO₂e against tool output; the
methane MACC (cost-sorted abatement measures) directly answers "what's the cheapest way to cut our
methane?" Composable with `eu_ets` and `facilitated_emissions` in an energy-desk orchestrator.

**Prerequisites.** Evolution A's grid-trajectory and MRV improvements (so narrated Cat 11 and methane
compliance are current); Atlas + reference corpus embedded (roadmap D3). **Acceptance:** every figure
cited traces to an engine tool call; the Cat 11 total and top contributor match `/scope3-cat11`; the
methane MACC ordering matches the engine's cheapest-first pathway; the copilot flags the GWP vintage
(AR5 vs AR6) it used.