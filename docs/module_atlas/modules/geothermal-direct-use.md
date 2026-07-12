# Geothermal Direct Heat Analytics
**Module ID:** `geothermal-direct-use` · **Route:** `/geothermal-direct-use` · **Tier:** A (backend vertical) · **EP code:** EP-DV5 · **Sprint:** DV

## 1 · Overview
Analytics for geothermal direct heat applications including district heating, greenhouse agriculture, industrial process heat (40–150°C), balneology and fish farming, with LCOH benchmarking and comparison against heat pumps.

> **Business value:** Geothermal direct heat LCOH of $8–$25/GJ is competitive with gas where carbon prices exceed €30/tCO2; effective COP of 10–30× versus electric heat pumps reflects the elimination of electrical conversion losses in direct-use applications.

**How an analyst works this module:**
- Map resource temperature to application type using Lindal diagram
- Calculate LCOH for candidate applications and compare to incumbent fuel
- Assess EU district heating Directive targets and regulatory support framework
- Model COP advantage versus electric heat pump alternatives at current electricity prices

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `DIRECT_USE_APPS`, `DISTRICT_EXAMPLES`, `KpiCard`, `PROCESS_HEAT_SECTORS`, `Slider`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `DIRECT_USE_APPS` | 9 | `share`, `temp`, `examples`, `marketB` |
| `PROCESS_HEAT_SECTORS` | 8 | `temp`, `demand`, `replaceGas`, `countries` |
| `DISTRICT_EXAMPLES` | 7 | `connections`, `mwth`, `tempSupply`, `fuelSave`, `co2SaveKt` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `annualElec` | `heatingLoad / cop;` |
| `annualElecCost` | `annualElec * electricityPrice;` |
| `gasEquivCost` | `heatingLoad * gasPrice;` |
| `annualSaving` | `gasEquivCost - annualElecCost;` |
| `netInstall` | `installCost * (1 - subsidyPct / 100);` |
| `payback` | `annualSaving > 0 ? netInstall / annualSaving : Infinity;` |
| `npvSavings` | `annualSaving * (1 - Math.pow(1 + w, -lifetime)) / w;` |
| `npv` | `npvSavings - netInstall;` |
| `totalCapex` | `capexWell * wellsMw + capexNetwork * transmissionKm;` |
| `annRevenue` | `numBuildings * avgBuildingKw / 1000 * heatPrice * 8760 * 0.85 / 1e6;` |
| `opexAnn` | `totalCapex * opexPct / 100;` |
| `ebitda` | `annRevenue - opexAnn;` |
| `capexAnn` | `totalCapex * w / (1 - Math.pow(1 + w, -lifetime));` |
| `lcoh` | `ebitda > 0 ? +(capexAnn / (numBuildings * avgBuildingKw / 1000 * 8760 * 0.85)).toFixed(4) : 0;` |
| `ghpCo2Saving` | `useMemo(() => { const gasEmissions = heatingLoad * 0.204;` |
| `elecEmissions` | `heatingLoad / cop * 0.233;` |
| `copCompare` | `useMemo(() => [2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0].map(c => ({` |
| `paybackByCarbonPrice` | `useMemo(() => [0, 25, 50, 75, 100, 150, 200].map(cp => {` |
| `carbonBonus` | `ghpCo2Saving * cp / 1000;` |
| `effectiveSaving` | `ghp.annualSaving + carbonBonus;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/geothermal/assess` | `assess_geothermal` | api/v1/routes/geothermal.py |
| GET | `/api/v1/geothermal/plant-types` | `list_plant_types` | api/v1/routes/geothermal.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`, `real-db`

**Database tables:** `DB` *(shared)*, `db` *(shared)*, `dh_irena_lcoe` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `DIRECT_USE_APPS`, `DISTRICT_EXAMPLES`, `PROCESS_HEAT_SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| District Heating LCOH | `LCOH = Annualised Cost / Annual Heat Delivered` | EGEC Market Report 2022 | Competitive vs gas district heating at carbon prices above €30/tCO2; EU Directive supports expansion. |
| COP vs Electric Heat Pump | `COP = Useful Heat Output / Electrical Input Equivalent` | IEA Geothermal Roadmap | Geothermal direct use avoids electricity conversion losses entirely; no parasitic load beyond pumping. |
| Industrial Process Heat Range | `Temperature = Resource Temperature − Distribution Losses` | IEA Industrial Heat Roadmap | Covers food processing, timber drying, textile, paper and chemical sectors below 150°C. |
- **EGEC market data + EU district heating policy database** → LCOH model → COP comparison → application mapping → **Geothermal direct use analytics dashboard**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/geothermal/plant-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['dry_steam', 'single_flash', 'double_flash', 'binary', 'egs'], 'n_keys': 5}`

**POST /api/v1/geothermal/assess** — status `passed`, provenance ['real-db'], source tables: `dh_irena_lcoe`
Output: `{'type': 'object', 'keys': ['project_name', 'plant_type', 'plant_type_label', 'total_capex_musd', 'lcoe_usd_mwh', 'irena_lcoe_range', 'lcoe_vs_irena', 'annual_generation_gwh', 'capacity_factor_pct', 'lifetime_generation_twh', 'plant_co2_intensity_gco2_kwh', 'annual_emissions_tco2', 'annual_avoided_e`

## 5 · Intermediate Transformation Logic
**Methodology:** Levelised Cost of Heat
**Headline formula:** `LCOH = (Well Cost + Plant + O&M) / (Annual Heat Output GJ)`

Full lifecycle cost per GJ of useful heat delivered to end user.

**Standards:** ['EGEC — European Geothermal Market Report', 'IEA — Geothermal Heat Roadmap']
**Reference documents:** EGEC — European Geothermal Market Report 2022; IEA — Geothermal Heat in Industrial Processes (2022); EU Renewable Energy Directive III — District Heating Provisions

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **52** other module(s).

| Connected module | Shared via |
|---|---|
| `geothermal-lcoe-economics` | table:DB, table:dh_irena_lcoe, table:sqlalchemy |
| `geothermal-market-intelligence` | table:DB, table:dh_irena_lcoe, table:sqlalchemy |
| `geothermal-project-finance` | table:DB, table:dh_irena_lcoe, table:sqlalchemy |
| `geothermal-power-markets` | table:DB, table:dh_irena_lcoe, table:sqlalchemy |
| `reference-data-explorer` | table:dh_irena_lcoe, table:sqlalchemy |
| `carbon-market-intelligence` | table:sqlalchemy |
| `carbon-integrity-mrv-analytics` | table:sqlalchemy |
| `supply-chain-esg-hub` | table:sqlalchemy |
| `carbon-institutions-taxonomy` | table:sqlalchemy |
| `supply-chain-resilience` | table:sqlalchemy |

## 7 · Methodology Deep Dive

Geothermal Direct Heat Analytics (EP-DV5, badged EP-DV4 in the page header) models two heat systems:
a **ground-source heat-pump (GHP) COP economics** engine and a **district-heating LCOH** engine, plus
a Lindal-diagram cascade design and CO₂-savings comparison. The maths is genuine engineering
economics — no guide↔code mismatch, no PRNG in the load-bearing calculations.

### 7.1 What the module computes

**GHP economics** (`calcGhpEconomics`):
```js
annualElec     = heatingLoad / cop;                 // kWh electricity to deliver heat
annualElecCost = annualElec * electricityPrice;
gasEquivCost   = heatingLoad * gasPrice;            // incumbent fossil cost
annualSaving   = gasEquivCost - annualElecCost;
netInstall     = installCost * (1 - subsidyPct/100);
payback        = annualSaving > 0 ? netInstall/annualSaving : Infinity;
npvSavings     = annualSaving * (1 - (1+w)^-lifetime)/w;   // present-value annuity of savings
npv            = npvSavings - netInstall;
```

**District heating** (`calcDistrictHeating`):
```js
totalCapex = capexWell*wellsMw + capexNetwork*transmissionKm;
annRevenue = numBuildings*avgBuildingKw/1000 * heatPrice * 8760 * 0.85 / 1e6;  // 85% load factor
capexAnn   = totalCapex * w/(1 - (1+w)^-lifetime);        // CRF annuity
lcoh       = capexAnn / (numBuildings*avgBuildingKw/1000 * 8760 * 0.85);  // $/unit heat
```

**CO₂ savings**: `gasEmissions = heatingLoad×0.204` (kgCO₂/kWh gas), `elecEmissions =
heatingLoad/cop×0.233` (grid EF); saving = difference.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Gas emission factor | 0.204 kgCO₂/kWh | Natural-gas combustion EF (≈ DEFRA/EPA) |
| Grid emission factor | 0.233 kgCO₂/kWh | Grid electricity EF (UK/EU-typical) |
| DH load factor | 0.85 | 85% capacity utilisation (typical DH) |
| DH capexWell / capexNetwork | $1.2M/MW / $0.8M/km | EGEC market-report benchmarks |
| DH opex / wacc / lifetime | 3% / 7% / 30 yr | Standard DH finance assumptions |
| Default COP | 4.5 | GSHP coefficient of performance |
| Cascade tiers | 200→100→70→40→20 °C | Lindal-diagram temperature cascade |

Default sliders: heatingLoad 20,000 kWh, COP 4.5, gas $0.08/kWh, elec $0.12/kWh, install $18,000,
subsidy 30%, lifetime 25, discount 7%.

### 7.3 Calculation walkthrough

1. GHP sliders → electricity to deliver load (load/COP) → cost vs gas-equivalent → annual saving.
2. Subsidy reduces install cost; payback = net install / saving; NPV via annuity of savings.
3. DH sliders → capex (well + network) → CRF annuity → LCOH per unit heat at 85% load.
4. `paybackByCarbonPrice` adds a carbon bonus (`co2Saving×cp/1000`) to the annual saving and
   recomputes payback across carbon prices $0–200.
5. `copCompare` sweeps COP 2.5–6.0 to show electricity cost and saving sensitivity.

### 7.4 Worked example (default GHP)

heatingLoad 20,000 kWh, COP 4.5, gas $0.08, elec $0.12, install $18,000, subsidy 30%, w=7%, n=25.

| Step | Computation | Result |
|---|---|---|
| Annual electricity | 20,000 / 4.5 | 4,444 kWh |
| Electricity cost | 4,444 × 0.12 | $533 |
| Gas-equivalent cost | 20,000 × 0.08 | $1,600 |
| Annual saving | 1,600 − 533 | **$1,067** |
| Net install | 18,000 × 0.70 | $12,600 |
| Payback | 12,600 / 1,067 | **11.8 yr** |
| CO₂ saving | 20,000×0.204 − (20,000/4.5)×0.233 | 4,080 − 1,036 = **3,044 kg** |

Add a $100/tCO₂ carbon price: bonus = 3,044/1000 × 100 = $304 → effective saving $1,371 → payback
12,600/1,371 = **9.2 yr**. Carbon pricing materially shortens payback, the module's headline insight.

### 7.5 Data provenance & limitations

- **All techno-economic constants are curated benchmarks** (EGEC/IEA), not project-specific.
- The COP is treated as constant (no seasonal/ambient-temperature degradation).
- Grid EF is a single scalar (0.233) — real GHP savings depend on live/marginal grid intensity.
- DH LCOH uses an 85% flat load factor; real DH demand is seasonal.
- No dry-well or drilling-risk contingency in the DH capex (deterministic).

**Framework alignment:** *EGEC European Geothermal Market Report* — DH capex/LCOH benchmarks. *IEA
Geothermal Heat Roadmap* — direct-use COP advantage and industrial-heat temperature ranges. *Lindal
diagram* — the cascade tiers map resource temperature to end-use (power → process heat → greenhouse →
aquaculture). *EU RED III* — district-heating renewable-share context. Emission factors follow
standard DEFRA/EPA combustion and grid EFs.

*(No §8 model specification required — the module runs real GHP and district-heating economics
consistent with EGEC/IEA methodology.)*

## 9 · Future Evolution

### 9.1 Evolution A — Live grid-intensity and seasonal load calibration (analytics ladder: rung 2 → 3)

**What.** §7 rates this a genuine tier-A engineering-economics module (backed by `/api/v1/geothermal/assess` and the `dh_irena_lcoe` table): real GHP COP economics and district-heating LCOH, a Lindal-diagram cascade, and CO₂-savings comparison, with no PRNG in the load-bearing maths. Its flagged simplifications are all calibration opportunities: COP is treated as constant (no seasonal/ambient degradation), grid emissions use a single 0.233 scalar rather than live/marginal intensity, DH LCOH assumes a flat 85% load factor, and there's no dry-well/drilling-risk contingency in the DH capex. Evolution A calibrates against real data: variable COP by ambient temperature, marginal grid emission factors from the platform's grid-carbon data (the sibling `grid-carbon-intelligence` module and ENTSO-E feed wired in wave-1), and a seasonal DH demand profile replacing the flat load factor.

**How.** (1) COP as a function of source/ambient temperature rather than a constant, so payback and CO₂ savings reflect seasonal reality. (2) Swap the 0.233 scalar for a location/time-resolved grid EF from the platform's grid-intensity layer. (3) A seasonal DH load curve (heating-degree-day shaped) replacing the 85% flat factor. (4) Add a drilling-risk contingency to DH capex, cross-referencing the project-finance sibling's dry-well model.

**Prerequisites.** Grid-intensity data keyed by region/hour (available via ENTSO-E/grid-carbon module); HDD reference series. **Acceptance:** GHP CO₂ savings vary with the chosen grid EF and season; DH LCOH responds to a seasonal load profile; the constant-COP and flat-load-factor simplifications are removed or explicitly retained as toggles.

### 9.2 Evolution B — Direct-heat feasibility copilot (LLM tier 2)

**What.** A copilot for district-heating and industrial-heat developers: "at 90°C resource and €40/t carbon, is geothermal direct heat cheaper than gas for a greenhouse cluster, and what's the COP advantage over a heat pump?" tool-calls the GHP/LCOH endpoints and narrates the Lindal cascade match and payback-by-carbon-price sensitivity.

**How.** Tier-2 tool-calling over the geothermal assess endpoints; the grounding corpus is §5/§7 (EGEC market report, IEA geothermal-heat roadmap, Lindal diagram, EU RED III district-heating provisions are cited). Because the economics are already real, a tier-1 explainer over rendered page state ships first; the tier-2 upgrade adds computed carbon-price and COP what-ifs. Every LCOH, payback, and CO₂ figure validated against tool output.

**Prerequisites.** None hard for tier 1; Evolution A's grid/seasonal calibration strengthens tier-2 answers. **Acceptance:** every LCOH and payback figure in a copilot answer traces to a tool call or rendered state; asked for a project-specific dry-well probability (not in this module), it refuses and points to the project-finance sibling.