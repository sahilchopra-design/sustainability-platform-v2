# Food System Transition Analytics
**Module ID:** `food-system-transition` · **Route:** `/food-system-transition` · **Tier:** A (backend vertical) · **EP code:** EP-DG2 · **Sprint:** DG

## 1 · Overview
Analyses the investment implications of transitioning global food systems to sustainable diets, reduced meat consumption, and regenerative agriculture. Models protein transition market dynamics, food company stranded asset risk, and alternative protein investment economics.

> **Business value:** Directly applicable to food sector equity analysts, ESG-focused active managers with consumer staples exposure, and impact investors in alternative proteins. FAIRR alignment enables engagement with the 60 largest protein producers on transition risk management.

**How an analyst works this module:**
- Model protein transition adoption curves by market
- Calculate GHG reduction potential from diet shifts
- Assess incumbent meat processor stranded asset exposure
- Analyse alternative protein investment economics
- Generate FAIRR-aligned protein transition risk report

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `API`, `COMPANIES`, `FINANCE_INSTRUMENTS`, `FLAG_SECTOR_OPTIONS`, `FOOD_CATEGORIES`, `FOOD_SYSTEM_API`, `KpiCard`, `LAND_USE_OPTIONS`, `LDN_STATUS_OPTIONS`, `SUPPLY_CHAIN_STAGES`, `StatusBadge`, `TABS`, `TRANSITION_SCENARIOS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `FOOD_CATEGORIES` | 13 | `name`, `ghg`, `water`, `land`, `scope3Pct`, `protein`, `price` |
| `SUPPLY_CHAIN_STAGES` | 8 | `share`, `reduction2030`, `reduction2050` |
| `TRANSITION_SCENARIOS` | 5 | `color`, `diet2030`, `diet2050`, `tech2030`, `tech2050`, `waste2030`, `waste2050` |
| `FINANCE_INSTRUMENTS` | 7 | `aum`, `growth`, `dealsYTD`, `avgTenor` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `FOOD_SYSTEM_API` | ``${API}/api/v1/food-system`;` |
| `badge` | `(ok) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,` |
| `ghgData` | `useMemo(() => FOOD_CATEGORIES.map(c => ({ name: c.name.split(' ')[0], ghg: c.ghg })), []);` |
| `stageData` | `useMemo(() => SUPPLY_CHAIN_STAGES.map(s => ({` |
| `scope3Data` | `useMemo(() => COMPANIES.slice(0, 12).map(c => ({ name: c.name.slice(0, 8), scope3: c.scope3, regenAg: c.regenAgPct })), []);` |
| `frac` | `(yr - 2024) / 26;` |
| `financeData` | `useMemo(() => FINANCE_INSTRUMENTS.map(f => ({ name: f.name.split(' ').slice(0, 2).join(' '), aum: f.aum, growth: f.growth })), []);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/food-system/sbti-flag` | `sbti_flag` | api/v1/routes/food_system.py |
| POST | `/api/v1/food-system/fao-crop-yield` | `fao_crop_yield` | api/v1/routes/food_system.py |
| POST | `/api/v1/food-system/tnfd-food-leap` | `tnfd_food_leap` | api/v1/routes/food_system.py |
| POST | `/api/v1/food-system/eudr-food` | `eudr_food` | api/v1/routes/food_system.py |
| POST | `/api/v1/food-system/agricultural-emissions` | `agricultural_emissions` | api/v1/routes/food_system.py |
| POST | `/api/v1/food-system/flag-targets` | `flag_targets` | api/v1/routes/food_system.py |
| POST | `/api/v1/food-system/land-degradation` | `land_degradation` | api/v1/routes/food_system.py |
| GET | `/api/v1/food-system/ref/flag-sectors` | `ref_flag_sectors` | api/v1/routes/food_system.py |
| GET | `/api/v1/food-system/ref/crop-regions` | `ref_crop_regions` | api/v1/routes/food_system.py |
| GET | `/api/v1/food-system/ref/eudr-commodities` | `ref_eudr_commodities` | api/v1/routes/food_system.py |

### 2.3 Engine `food_system_engine` (services/food_system_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `FoodSystemEngine.assess_sbti_flag` | entity_id, sector, base_year, target_year, current_emissions_tco2e, achieved_reduction_pct | SBTi FLAG sector-specific science-based target assessment. Reduction requirements: crops/livestock 30%, forests 72% by 2030 vs 2020. `achieved_reduction_pct` is the entity-reported progress against the base year (%). When absent, progress-dependent fields are returned as None with a note; the required target is always computed deterministically. |
| `FoodSystemEngine.model_fao_crop_yield` | entity_id, crop, region, baseline_yield_t_ha, adaptation_gain_pct | FAO GAEZ-based yield projections under RCP 2.6, 4.5, and 8.5. Adaptation gains from improved varieties and irrigation. RCP impacts are the published FAO GAEZ / IPCC AR6 band midpoints for the crop's climate zone (model parameters, not fabricated entity figures). `adaptation_gain_pct` may be supplied by the caller; otherwise the FAO adaptation-band midpoint is applied as a documented scenario assum |
| `FoodSystemEngine.assess_tnfd_food_leap` | entity_id, entity_name, commodities, leap_scores, nature_scores, relied_nature_services | TNFD LEAP (Locate, Evaluate, Assess, Prepare) for food companies. Identifies nature dependencies and material risks by commodity. Entity-specific maturity/dependency scores are caller-supplied: - `leap_scores` : {"locate", "evaluate", "assess", "prepare"} (0-100) - `nature_scores` : {"nature_dependency", "nature_impact", "water_dependency"} (0-100) - `relied_nature_services` : list of relied-upon  |
| `FoodSystemEngine.assess_eudr_food` | entity_id, commodities, country_codes, cutoff_compliant, geolocation_coverage_pct | EUDR Art 29 compliance screening for food commodities. Checks deforestation-free status, cutoff date, and geolocation coverage. `cutoff_compliant` (post-2020-12-31 deforestation-free attestation) and `geolocation_coverage_pct` (share of plots with verified geolocation) are entity-reported facts supplied by the caller. When absent they are returned as None and excluded from the compliance-gap score |
| `FoodSystemEngine.compute_agricultural_emissions` | entity_id, farm_area_ha, livestock_count, crop_type, pcaf_dqs | Farm-level GHG accounting: Scope 1 (enteric + manure + N2O + residue), Scope 2 (electricity irrigation), Scope 3 Cat 1 (fertilisers). `pcaf_dqs` is the caller-assigned PCAF data-quality score (1=verified, 5=estimated). When not supplied it is returned as None (no fabricated score) — the emissions themselves are always computed from activity data. |
| `FoodSystemEngine.set_flag_targets` | entity_id, assessment_id, sector, base_emissions, target_year, intervention_plan | SBTi FLAG target settings with intervention roadmap. Returns science-based target parameters and abatement levers. `intervention_plan` is a caller-supplied deployment plan: a list of {"action": <FLAG intervention name>, "scale": <hectares or head>}. For each planned action the tonnage and cost are computed deterministically from the reference per-unit factors in FLAG_INTERVENTIONS. When no plan is |
| `FoodSystemEngine.assess_land_degradation` | entity_id, land_area_ha, land_use, country_code, ldn_status, degraded_area_ha, biodiversity_index | LDN (Land Degradation Neutrality) assessment per UN SDG 15.3. Evaluates carbon stock, restoration potential, and biodiversity index. Carbon-stock density uses published IPCC AR6 defaults by land use (model parameters). Entity-observed fields are caller-supplied: - `ldn_status` : "Improving" / "Stable" / "Degrading" - `degraded_area_ha`: observed degraded hectares (restoration potential) - `biodive |

**Engine `food_system_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `FLAG_SECTORS` | `{'cattle': {'scope': True, 'reduction_pct': 30.0, 'removal_pct': 5.0, 'target_year': 2030}, 'poultry_pigs': {'scope': True, 'reduction_pct': 30.0, 'removal_pct': 5.0, 'target_year': 2030}, 'crops': {'scope': True, 'reduction_pct': 30.0, 'removal_pct': 5.0, 'target_year': 2030}, 'forests_trees': {'sc` |
| `CROPS` | `['wheat', 'maize', 'rice', 'soy', 'coffee', 'cocoa', 'sugarcane']` |
| `REGIONS` | `['south_asia', 'sub_saharan_africa', 'latin_america', 'southeast_asia', 'europe']` |
| `TNFD_FOOD_NATURE_SERVICES` | `['Soil formation and composition', 'Pollination', 'Pest and disease regulation', 'Water regulation', 'Genetic diversity maintenance', 'Climate regulation', 'Nutrient cycling']` |
| `LDN_STATUSES` | `['Improving', 'Stable', 'Degrading']` |
| `ENTERIC_FERMENTATION_KG_HEAD` | `{'dairy_cattle': 120.0, 'beef_cattle': 65.0, 'sheep': 8.0, 'pigs': 1.5, 'poultry': 0.02}` |
| `FLAG_INTERVENTIONS` | `[{'action': 'Reduce synthetic fertiliser application', 'tco2e_per_ha': 0.4, 'cost_usd_per_ha': 120.0, 'timeline': '2025-2027'}, {'action': 'Implement feed efficiency improvement', 'tco2e_per_head': 0.8, 'cost_usd_per_head': 80.0, 'timeline': '2025-2028'}, {'action': 'Restore degraded pasture to fore` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `FINANCE_INSTRUMENTS`, `FLAG_SECTOR_OPTIONS`, `FOOD_CATEGORIES`, `LAND_USE_OPTIONS`, `LDN_STATUS_OPTIONS`, `SUPPLY_CHAIN_STAGES`, `TABS`, `TRANSITION_SCENARIOS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Food System GHG Share | — | IPCC AR6 WGIII Chapter 7 | Food systems account for 31% of global GHG emissions including land use change |
| Alt Protein Market 2023 | — | BloombergNEF Alt Protein 2024 | Alternative protein market size — projected to reach $290Bn by 2035 under IPCC 2°C pathway |
| Diet Shift Potential | — | EAT-Lancet Commission 2023 | Shifting to planetary health diets could reduce food system emissions by 8 GtCO2e/yr |
- **FAIRR protein producer database + financial data** → Stranded asset risk modelling → **Earnings sensitivity of meat processors to plant-based substitution**
- **Protein consumption data by country and segment** → Transition adoption curve modelling → **Market share evolution of alt protein by 2030/2040/2050**
- **IPCC livestock emission factors (CH4/N2O)** → GHG reduction calculation → **Scope 3 food system emissions reduction from diet transition**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/food-system/ref/crop-regions** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['crops', 'regions', 'combinations', 'source', 'rcp_scenarios', 'projection_year'], 'n_keys': 6}`

**GET /api/v1/food-system/ref/eudr-commodities** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['eudr_food_commodities', 'commodity_details', 'regulation', 'enforcement_date_large_operators', 'enforcement_date_sme'], 'n_keys': 5}`

**GET /api/v1/food-system/ref/flag-sectors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sectors', 'standard', 'scope', 'sbti_website'], 'n_keys': 4}`

**POST /api/v1/food-system/agricultural-emissions** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/food-system/eudr-food** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/food-system/fao-crop-yield** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/food-system/flag-targets** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/food-system/land-degradation** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Protein Transition Market Model
**Headline formula:** `AltProteinShare_t = AltProteinShare_0 × (1 + AdoptionRate)^t; FoodEmissionsReduction = (ConvMeat_kg - AltProtein_kg) × EmissionFactor × ProductionVolume`

S-curve adoption modelling for alternative proteins; emissions reduction quantified against IPCC livestock emission factors; financial impact on incumbent meat processors modelled via earnings sensitivity

**Standards:** ['EAT-Lancet Planetary Health Diet', 'IPCC AR6 WGIII Chapter 7 — Agriculture', 'BloombergNEF Food and Agriculture Outlook 2024', 'FAIRR Protein Producer Index']
**Reference documents:** EAT-Lancet Commission Report on Food, Planet, Health (2019); IPCC AR6 WGIII Chapter 7 — Agriculture, Forestry and Other Land Uses; BloombergNEF Food and Agriculture Technology Outlook 2024; FAIRR Protein Producer Index 2023

**Engine `food_system_engine` — extracted transformation lines:**
```python
land_mitigation_tco2_pa = round(current_emissions_tco2e * required_reduction_pct / 100.0, 2)
removal_tco2_pa = round(current_emissions_tco2e * removal_pct / 100.0, 2)
achieved_tco2 = round(current_emissions_tco2e * achieved_pct / 100.0, 2)
gap_tco2_pa = round(max(0.0, land_mitigation_tco2_pa - achieved_tco2), 2)
scope1_tco2e = round(livestock_count * 2.5 + farm_area_ha * 0.8, 2)
scope2_tco2e = round(farm_area_ha * 0.12, 2)
scope3_cat1_tco2e = round(farm_area_ha * 1.5, 2)
total_tco2e = round(scope1_tco2e + scope2_tco2e + scope3_cat1_tco2e, 2)
emission_intensity = round(total_tco2e / farm_area_ha, 3) if farm_area_ha > 0 else 0.0
total_required = required_reduction + required_removal
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code note.** The guide's formula is a compound-adoption *Protein Transition Market Model*
> (`AltProteinShare_t = AltProteinShare_0 × (1+AdoptionRate)^t`). The **frontend page does not compute
> this** — its scenario engine linearly interpolates hard-coded 2030/2050 reduction endpoints for diet,
> tech and waste. A genuinely rigorous **backend engine** (`food_system_engine.py`) exists (SBTi FLAG,
> FAO GAEZ yield, TNFD LEAP, EUDR, agricultural emissions, LDN) but is **not wired to this page's
> display** — the page renders its own local constants. Company transition scores are `sr()`-seeded.

### 7.1 What the module computes (frontend)

The page is driven by three data blocks and a scenario interpolator:

```js
ghgData    = FOOD_CATEGORIES.map(c => ({ name, ghg }))            // real LCA intensities
stageData  = SUPPLY_CHAIN_STAGES → emissions share + 2030/2050 reduction %
scope3Data = COMPANIES.slice(0,12) → scope3, regenAgPct           // sr()-seeded companies
pathwayData: for each year, interpolate diet/tech/waste reduction to a Total
  frac = (yr − 2024)/26 ;  t30 = 6/26
  interp(v30,v50) = frac ≤ t30 ? v30·frac/t30 : v30 + (v50−v30)·(frac−t30)/(1−t30)
  Total = diet + tech + waste
```

The scenario pathway is a **piecewise-linear interpolation**: reductions ramp linearly to the 2030
endpoint, then linearly from 2030→2050. This is a reasonable transition trajectory but not the guide's
exponential adoption curve.

### 7.2 Parameterisation / scoring rubric

**Food-category LCA intensities** (`FOOD_CATEGORIES`) are **real Poore & Nemecek (2018) figures**:

| Category | GHG (kgCO₂e/kg) | Water (L/kg) | Land (m²/kg) | Scope-3 % | Protein g |
|---|---|---|---|---|---|
| Beef & Lamb | 60.0 | 15,400 | 164 | 88 | 26 |
| Farmed Fish | 13.6 | 3,700 | 3 | 65 | 20 |
| Pork | 7.6 | 5,990 | 11 | 82 | 25 |
| Poultry | 5.7 | 4,330 | 7 | 79 | 27 |
| Soy | 2.0 | 2,145 | 3.5 | 90 | 36 |
| Fruit & Veg | 0.7 | 322 | 0.8 | 58 | 1 |

These match the canonical Poore & Nemecek dataset (beef ~60, the 60× spread over vegetables). **Supply-
chain stages** (`SUPPLY_CHAIN_STAGES`) put Farm Production at 61% of emissions (correct) with stage-
specific 2030/2050 abatement potential. **Transition scenarios** (`TRANSITION_SCENARIOS`) give
diet/tech/waste reduction endpoints — Net Zero Food reaches −72% diet by 2050. **Companies** are
`sr()`-seeded (scope3 20–100%, regenAgPct 0–40%, transitionScore 20–80).

### 7.3 Backend engine (not wired to this page)

`FoodSystemEngine` implements seven rigorous sub-models with honest-null handling:
- **SBTi FLAG:** `land_mitigation = emissions × reduction_pct/100` with real sector targets (cattle/
  crops 30%, forests 72% by 2030). Progress fields return `None` when not supplied — no fabrication.
- **FAO crop yield:** RCP band-midpoint impacts (rcp26 −0.5%, rcp45 −5%, rcp85 −14%; tropical rcp85
  −18.5%) × baseline yield, with adaptation gain (3–8% midpoint).
- **TNFD LEAP:** composite = mean of locate/evaluate/assess/prepare; biodiversity risk banded.
- **EUDR Art 29:** country-risk tiers, deforestation-free flag, compliance-gap score (35 defor + 25
  cutoff + geolocation-shortfall).
- **Agricultural emissions:** Scope1 = livestock×2.5 + area×0.8; Scope2 = area×0.12; Scope3 = area×1.5.
- **LDN:** carbon stock = IPCC AR6 density × area (forest 275, cropland 40 tCO₂e/ha).

### 7.4 Worked example (scenario pathway, Net Zero Food, 2035)

Net Zero Food: `diet2030 −38, diet2050 −72`. For year 2035: `frac = (2035−2024)/26 = 0.423`,
`t30 = 6/26 = 0.231`. Since `frac > t30`:
```
diet = −38 + (−72 − −38)·(0.423 − 0.231)/(1 − 0.231) = −38 + (−34)·0.192/0.769 = −38 − 8.5 = −46.5%
```
Adding tech (interp of −28/−60 ≈ −36%) and waste (interp of −30/−58 ≈ −37%) gives a `Total` decarbon-
isation of roughly −120% (the components are additive levers, so overlap is not netted — a
simplification). The pathway shape is right; the additivity overstates combined effect.

### 7.5 Data provenance & limitations

- **Food-category and stage data are real** (Poore & Nemecek, food-system LCA) — a genuine strength.
- **Companies are `sr()`-seeded** (scope3, regenAg, transitionScore, exposure).
- The scenario pathway adds diet+tech+waste levers without netting overlap (can exceed 100%).
- The rigorous backend engine is **not connected** to this page; the guide's compound-adoption model is
  implemented by neither.

**Framework alignment:** Poore & Nemecek (2018) food LCA (category intensities) · SBTi FLAG v1.0
(backend: 30%/72% targets — SBTi derives FLAG targets from commodity-specific reduction pathways) ·
FAO GAEZ v4 + IPCC AR6 Ch5 (backend yield bands) · TNFD v1.0 LEAP · EUDR Reg (EU) 2023/1115 · PCAF
Agriculture Standard · UNCCD SDG 15.3 LDN. The frontend is a well-sourced descriptive layer; the
backend is production-grade but unwired here.

## 8 · Model Specification

**Status: specification — not yet implemented in code (as wired to this page).** Company transition
scores are `sr()`-seeded and the guide's protein-transition market model is absent. Below is the
production model for the page's headline outputs.

### 8.1 Purpose & scope
Model the alternative-protein market transition and food-company transition/stranded-asset risk,
producing per-company transition scores and a diet-shift emissions pathway — for food-sector investment.

### 8.2 Conceptual approach
A **Bass/logistic diffusion** model for alt-protein adoption (benchmarked against **BCG/Blue Horizon**
and **Good Food Institute** market projections) coupled with a **company transition scorecard** (à la
**FAIRR** protein-producer index and **TPI** management-quality levels) and a diet-shift emissions
model over the real Poore & Nemecek intensities.

### 8.3 Mathematical specification
```
AltShare_t = L / (1 + e^(−k(t − t₀)))                         logistic adoption (L=ceiling, k=speed)
EmissionsReduction_t = Σ_meat (ConvVol_meat − AltVol_meat,t) · (EF_meat − EF_alt)
TransitionScore_c = Σ_j w_j · x_{j,c}    x_j ∈ {scope3 disclosure, SBTi, defor-free, regenAg%, ...}
StrandedRisk_c = ConvProteinRevenue_c · (1 − AltShare_t) → repriced under diet-shift scenario
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| L, k | adoption ceiling & speed | GFI / BCG alt-protein projections |
| EF_meat, EF_alt | protein LCA factors | Poore & Nemecek 2018 (already on page) |
| w_j | scorecard weights | FAIRR Protein Producer Index methodology |
| ConvVol/AltVol | production volumes | company reports, market data |

### 8.4 Data requirements
Per company: protein revenue split, scope-3 disclosure, SBTi/FLAG status, deforestation-free sourcing,
regen-ag %. Market: alt-protein volume history. Sources: FAIRR (public), GFI (public), company reports,
Poore & Nemecek EF (on platform). The backend engine already computes FLAG/EUDR/emissions.

### 8.5 Validation & benchmarking plan
Reconcile adoption curve against GFI historical alt-protein sales; benchmark transition scores against
FAIRR index ranks; validate diet-shift emissions against EAT-Lancet planetary-diet studies; sensitivity-
test logistic k and ceiling L.

### 8.6 Limitations & model risk
Adoption ceilings are highly uncertain; additive lever double-counting must be netted; company self-
disclosure is incomplete. Conservative fallback: use the lower adoption ceiling and net overlapping
decarbonisation levers before summing.

## 9 · Future Evolution

### 9.1 Evolution A — Wire the rigorous engine to the page and add the S-curve adoption model (analytics ladder: rung 2 → 3)

**What.** §7 documents an unusual split: a production-grade backend engine (`food_system_engine.py`) with deterministic, honest-null SBTi FLAG assessment, FAO GAEZ yield projections, TNFD LEAP, EUDR screening, farm-level GHG accounting, and LDN — but the frontend page renders its own local constants and `sr()`-seeded company scores, never calling it, and the guide's compound-adoption Protein Transition Market Model (`AltProteinShare_t = AltProteinShare_0·(1+r)^t`) is implemented by neither. Evolution A does two things: wire the page's company and FLAG views to the real engine endpoints, and implement the missing S-curve adoption model as an engine method feeding the alt-protein market and stranded-asset analytics.

**How.** (1) Replace the `sr()`-seeded `COMPANIES` scope3/transitionScore with `compute_agricultural_emissions` and `assess_sbti_flag` calls (the engine already computes required FLAG reductions deterministically — 30% crops/livestock, 72% forests). (2) Add a logistic/compound adoption method with documented adoption-rate assumptions, netting the diet+tech+waste levers so the pathway can't exceed 100% (a §7.5-flagged bug). (3) Keep the real Poore & Nemecek category intensities (a genuine strength).

**Prerequisites.** Seeded company panel replaced by engine-computed or user-entered entities; the additive-lever overlap fixed. **Acceptance:** a company's FLAG target and emissions on the page equal the engine's `assess_sbti_flag`/`compute_agricultural_emissions` output for the same inputs; the adoption pathway is bounded and reproduces the compound formula.

### 9.2 Evolution B — Protein-transition and FLAG copilot (LLM tier 2)

**What.** A copilot for food-sector equity and impact analysts: "assess this meat processor's FLAG target gap and stranded-asset exposure under a fast protein-transition scenario" tool-calls the engine's `assess_sbti_flag`, `compute_agricultural_emissions`, `assess_eudr_food`, and the Evolution A adoption model, narrating FAIRR-aligned transition risk with every figure engine-sourced.

**How.** Tier-2 tool-calling over the engine's already-rich endpoint set (the module is tier-A with a real OpenAPI surface); the grounding corpus is §5/§7, which accurately encode SBTi FLAG v1.0, FAO GAEZ, TNFD LEAP, EUDR, and Poore & Nemecek. The engine's honest-null discipline is a copilot asset — unassessed pillars return None, so the copilot naturally reports data gaps rather than inventing scores. Fabrication validator checks every tonnage and target figure.

**Prerequisites.** Evolution A wiring (so the copilot narrates engine output, not the page's local constants); RBAC-scoped entity data. **Acceptance:** every FLAG target, emission, and EUDR-compliance figure traces to an engine tool call; asked for a PCAF data-quality score the caller didn't supply, the copilot reports it as not-assessed per the engine's null contract.