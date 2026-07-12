# Floating Solar (FPV) Project Finance
**Module ID:** `floating-solar-finance` · **Route:** `/floating-solar-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-EC2 · **Sprint:** EC

## 1 · Overview
Floating photovoltaic (FPV) project finance analytics. Covers water body suitability, panel cooling benefit quantification, evaporation water savings, structural premium economics, and project finance for reservoir, lake, and irrigation canal installations.

> **Business value:** Used by solar IPPs, infrastructure funds, water utilities, and irrigation authorities evaluating FPV deployment on reservoirs and canals where land is scarce and water conservation is valued.

**How an analyst works this module:**
- Filter by water body type to compare reservoir vs lake economics
- Review cooling benefit analysis for module temperature reduction
- Analyse evaporation savings for water-stressed project regions
- Examine project finance tab for DSCR modelling

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ANCHORING_SYSTEMS`, `COST_COMPONENTS`, `COUNTRIES_FPV`, `COUNTRY_PIPELINE`, `KPI_CARD`, `PROJECTS`, `TABS`, `WATER_BODY_TYPES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `COUNTRY_PIPELINE` | 9 | `installedGw`, `pipelineGw`, `maturity` |
| `COST_COMPONENTS` | 9 | `pctOfTotal`, `groundEquiv`, `fpvCost` |
| `TABS` | 7 | `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `capacityMw` | `1 + Math.round(sr(i * 7) * 199);` |
| `coveragePct` | `5 + sr(i * 11) * 20;` |
| `evaporationSavingML` | `capacityMw * (3 + sr(i * 13) * 7);` |
| `coolingBoostPct` | `2 + sr(i * 17) * 3;` |
| `structuralPremiumPct` | `15 + sr(i * 19) * 10;` |
| `lcoe` | `42 + sr(i * 23) * 28;` |
| `irrPct` | `6.0 + sr(i * 29) * 6.5;` |
| `waterBodyAreaHa` | `capacityMw * (4 + sr(i * 31) * 3) / coveragePct * 100;` |
| `kpis` | `useMemo(() => { const totalMw = filtered.reduce((s, p) => s + p.capacityMw, 0);` |
| `avgLcoe` | `filtered.length ? filtered.reduce((s, p) => s + p.lcoe, 0) / filtered.length : 0;` |
| `avgIrr` | `filtered.length ? filtered.reduce((s, p) => s + p.irrPct, 0) / filtered.length : 0;` |
| `totalEvapSaving` | `filtered.reduce((s, p) => s + p.evaporationSavingML, 0);` |
| `avgCoolingBoost` | `filtered.length ? filtered.reduce((s, p) => s + p.coolingBoostPct, 0) / filtered.length : 0;` |
| `avgStructuralPremium` | `filtered.length ? filtered.reduce((s, p) => s + p.structuralPremiumPct, 0) / filtered.length : 0;` |
| `hydrologyData` | `useMemo(() => filtered.slice(0, 12).map(p => ({ name: p.name.slice(-6), evapSaving: p.evaporationSavingML, coolingBoost: p.coolingBoostPct, coveragePct: p.coveragePct, })), [filtered]);` |
| `revenueWaterfallData` | `useMemo(() => filtered.slice(0, 10).map(p => { const baseRevM = p.capacityMw * 0.15 * 8760 * 55 / 1e6;` |
| `coolingBonusM` | `p.aepBoostGwh * 55 / 1e3;` |
| `waterCreditM` | `p.evaporationSavingML * 0.15 / 1e3;` |
| `structuralCostData` | `COST_COMPONENTS.map(c => ({` |
| `capexBreakdown` | `COST_COMPONENTS.map(c => ({ name: c.component, value: c.pctOfTotal, fill: [T.blue, T.teal, T.green, T.gold, T.indigo, T.amber, T.sage, T.red][COST_COMPONENTS.indexOf(c)] }));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ANCHORING_SYSTEMS`, `COST_COMPONENTS`, `COUNTRIES_FPV`, `COUNTRY_PIPELINE`, `TABS`, `WATER_BODY_TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Cooling AEP Boost (%) | `ΔP = P_STC × γ × (T_land - T_FPV)` | IEA PVPS Task 13 FPV study | Temperature coefficient γ ≈ -0.35%/°C; FPV panels run 5-10°C cooler, yielding 1.7-3.5% output boost. |
| Evaporation Savings (m³/yr/ha) | `A_covered × ET_rate × shade_factor` | FAO Penman-Monteith | In arid regions, evaporation savings valued at $0.5-2/m³, providing significant dual benefit. |
| Structural CAPEX Premium (%) | `(CAPEX_FPV - CAPEX_land) / CAPEX_land` | World Bank ESMAP 2022 | Partly offset by no land lease and reduced O&M (cooler panels, less dust). |
- **Water body GIS + irradiance + evaporation rate + structural costs** → FPV yield model (cooling + evap savings) + project finance DSCR → **FPV project LCOE, IRR, NPV and bankability assessment**

## 5 · Intermediate Transformation Logic
**Methodology:** FPV Cooling Benefit & Evaporation Savings
**Headline formula:** `LCOE_FPV = LCOE_land × (1 + structural_premium) - cooling_benefit; Evap_savings = A_covered × ET_rate × shade_factor`

FPV panels benefit from water surface cooling: module temperature 5-10°C lower boosts output 2-5%. Evaporation savings significant in water-stressed regions: 1 ha reservoir → 5,000-10,000 m³/year. Structural premium 15-25% above land-mounted due to pontoon/mooring.

**Standards:** ['IEA PVPS FPV Roadmap 2022', 'World Bank ESMAP FPV Technical Guidance']
**Reference documents:** IEA PVPS Task 13 (2022) – Floating PV Roadmap; World Bank ESMAP FPV Technical Guidance Note 2022

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide gives two structural formulae —
> `LCOE_FPV = LCOE_land × (1 + structural_premium) − cooling_benefit` and
> `Evap_savings = A_covered × ET_rate × shade_factor`. **Neither is computed.** In the code, `lcoe`,
> `structuralPremiumPct`, `coolingBoostPct` and `evaporationSavingML` are all **independently `sr()`-
> seeded fields**, so the LCOE is *not* built from a land baseline plus premium minus cooling, and evap
> savings is *not* `area × ET × shade`. Only the **revenue waterfall** and **cost-component breakdown**
> use real arithmetic. The sections below document what is computed vs seeded.

### 7.1 What the module computes

For 18 synthetic FPV projects, the page filters by country and aggregates:

```js
totalMw   = Σ capacityMw
avgLcoe   = Σ lcoe / n                      // seeded lcoe, just averaged
avgIrr    = Σ irrPct / n
totalEvapSaving = Σ evaporationSavingML
avgCoolingBoost = Σ coolingBoostPct / n
avgStructuralPremium = Σ structuralPremiumPct / n
```

**Revenue waterfall (real):**
```js
baseRevM      = capacityMw × 0.15 × 8760 × 55 / 1e6      // CF 15%, 8760h, $55/MWh
coolingBonusM = aepBoostGwh × 55 / 1e3                    // extra MWh × price
waterCreditM  = evaporationSavingML × 0.15 / 1e3          // water valued at $0.15/m³ equiv
aepBoostGwh   = capacityMw × coolingBoostPct/100 × 0.15 × 8760 / 1000   // (in the seed)
```
This chain *is* internally consistent: the cooling boost feeds an AEP uplift which feeds a revenue
bonus, and evaporation savings are monetised as a water credit.

### 7.2 Parameterisation / scoring rubric

**Seeded project fields** (`sr()` PRNG):

| Field | Formula | Range | Status |
|---|---|---|---|
| capacityMw | `1 + round(sr(i·7)·199)` | 1–200 MW | synthetic |
| coveragePct | `5 + sr(i·11)·20` | 5–25% | synthetic |
| evaporationSavingML | `capacityMw × (3 + sr(i·13)·7)` | scales with MW | synthetic |
| coolingBoostPct | `2 + sr(i·17)·3` | 2–5% | synthetic (feeds AEP boost) |
| structuralPremiumPct | `15 + sr(i·19)·10` | 15–25% | synthetic |
| lcoe | `42 + sr(i·23)·28` | $42–70/MWh | **synthetic — not derived** |
| irrPct | `6.0 + sr(i·29)·6.5` | 6–12.5% | synthetic |

**Cost components** (`COST_COMPONENTS`, hand-authored) carry the FPV-vs-ground cost delta: FPV adds a
Floating Structure (18%) and Anchoring (8%) line absent on land, while civil works fall (6% vs 12%) —
the real driver of the ~15–25% structural premium. These percentages are realistic FPV BOM shares.

**Country pipeline** (`COUNTRY_PIPELINE`) uses plausible installed/pipeline GW (China 1.8/8.5 GW) and
maturity tiers — curated, not random.

The **cooling boost (2–5%)** and **structural premium (15–25%)** ranges are physically credible: FPV
panels run cooler over water (typically +1–3% yield) and cost 10–25% more than ground-mount — but here
they are drawn randomly rather than modelled from water temperature or BOM.

### 7.3 Calculation walkthrough

1. Generate 18 projects with seeded fields; derive `aepBoostGwh` from `coolingBoostPct`.
2. Filter by country → KPIs (total MW, mean LCOE/IRR, total evap saving, mean cooling/premium).
3. Hydrology tab: evap saving, cooling boost, coverage per project.
4. Revenue waterfall: base + cooling bonus + water credit per project.
5. Structural tab: FPV vs ground cost component comparison.

### 7.4 Worked example (revenue waterfall)

A 100 MW project with `coolingBoostPct = 3.0`, `evaporationSavingML = 500`:
```
aepBoostGwh   = 100 × 3.0/100 × 0.15 × 8760 / 1000 = 100 × 0.03 × 0.15 × 8.76 = 3.94 GWh
baseRevM      = 100 × 0.15 × 8760 × 55 / 1e6 = 7.23 → $7.23M/yr
coolingBonusM = 3.94 × 55 / 1000 = $0.217M/yr        (cooling adds ~3% revenue)
waterCreditM  = 500 × 0.15 / 1000 = $0.075M/yr
```
So the cooling co-benefit (~$0.22M) and water credit (~$0.08M) together add ~4% to base revenue — the
FPV value proposition the module is built to show. Note the underlying LCOE ($42–70) is unrelated to
this cash flow because it is separately seeded.

### 7.5 Data provenance & limitations

- **LCOE, IRR, cooling boost, structural premium, evaporation savings are all `sr()`-seeded** —
  independent random draws, not linked to the guide's structural formulae.
- The revenue waterfall and cost-component breakdown *are* real arithmetic and internally consistent.
- Water credit price ($0.15/m³ equiv) and electricity price ($55/MWh) are hard-coded flat assumptions.
- Country pipeline is curated (realistic), not a live database.

**Framework alignment:** IEA/NREL LCOE framing (though not computed here) · FPV cooling-yield literature
(the 2–5% boost is the empirically observed range) · World Bank/SERIS FPV cost studies (the ~15–25%
structural premium). The guide's evaporation model (`A×ET×shade`) is the standard Penman-Monteith-based
approach, described but not implemented.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** LCOE, cooling boost, structural premium and
evaporation savings are seeded random values. Below is the production FPV techno-economic model that
would derive them.

### 8.1 Purpose & scope
Compute FPV project LCOE, the cooling-driven yield uplift, evaporation water savings, and the structural
cost premium versus an equivalent ground-mount plant — for project-finance and water-energy-nexus
decisions on reservoirs/lakes/irrigation ponds.

### 8.2 Conceptual approach
Three coupled blocks benchmarked against **World Bank/SERIS "Where Sun Meets Water"** FPV cost studies
and **NREL** FPV performance modelling: (i) an LCOE built from a ground-mount baseline plus a BOM-derived
structural premium minus the monetised cooling gain; (ii) a temperature-corrected PV yield model for the
cooling boost; (iii) a Penman–Monteith evaporation model for water savings.

### 8.3 Mathematical specification
```
LCOE_FPV   = LCOE_land · (1 + StructuralPremium) − CoolingBenefit_$/MWh
StructuralPremium = (Σ FPV_BOM − Σ ground_BOM) / Σ ground_BOM     from component stack
CoolingBoost = γ · (T_cell,land − T_cell,water)                    γ = PV temp coefficient ≈ −0.35%/°C
   T_cell,water = T_air + (NOCT−20)/800·G − ΔT_water-cooling
Evap_savings = A_covered · ET₀ · K_shade · (1 − f_wind-return)     ET₀ Penman–Monteith
Revenue    = (AEP_base + AEP_cooling)·price + Evap_savings·waterPrice
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| LCOE_land | ground-mount baseline | NREL ATB / IRENA regional LCOE |
| BOM shares | FPV vs ground components | World Bank/SERIS FPV cost report |
| γ | PV power temperature coefficient | module datasheets (−0.30 to −0.40%/°C) |
| ET₀ | reference evapotranspiration | FAO-56 Penman–Monteith, local met data |
| K_shade | evaporation-suppression factor | FPV field studies (0.7–0.9 for covered area) |
| waterPrice | value of saved water | regional water tariff / shadow price |

### 8.4 Data requirements
Per site: water-body area, coverage %, air/water temperature, solar resource (GHI), local ET₀, ground-
mount LCOE, water tariff. Sources: NREL ATB, IRENA, FAO CLIMWAT (ET₀), local met stations, World
Bank/SERIS BOM. The module already holds capacity, coverage and country.

### 8.5 Validation & benchmarking plan
Reconcile LCOE against World Bank/SERIS FPV case studies (target ±10%); validate cooling boost against
measured FPV-vs-ground yield differentials (1–3%); check evaporation savings against field-measured
suppression rates; sensitivity-test γ and K_shade.

### 8.6 Limitations & model risk
Cooling benefit depends on local water temperature and wind (return of humidity can offset ET
suppression); structural premium varies by anchoring depth. Conservative fallback: use the lower
cooling boost (1%) and higher structural premium for financing, and treat the water credit as optional
upside not core revenue.

## 9 · Future Evolution

### 9.1 Evolution A — Build the structural LCOE and evaporation models the guide names (analytics ladder: rung 1 → 2)

**What.** §7 flags that both headline formulae are unimplemented: `LCOE_FPV = LCOE_land × (1 + structural_premium) − cooling_benefit` and `Evap_savings = A_covered × ET_rate × shade_factor` are described but the code draws `lcoe`, `structuralPremiumPct`, `coolingBoostPct`, and `evaporationSavingML` as independent `sr()`-seeded fields — so LCOE is not derived from a land baseline and evaporation is not `area × ET × shade`. Only the revenue waterfall and cost-component breakdown use real arithmetic. Evolution A builds the two real models: LCOE constructed from a land-mounted baseline plus a structural premium minus a cooling yield benefit, and Penman-Monteith-based evaporation savings from covered area, local ET rate, and shade factor.

**How.** (1) A backend route (or a real `useMemo` chain replacing the seeds) computing `LCOE_FPV` from a land-LCOE input, the water-body-type structural premium, and a cooling boost tied to module-temperature reduction. (2) Evaporation savings from `waterBodyAreaHa × coveragePct`, a regional ET rate (from the platform's NASA-POWER climate data already wired in wave-1 sources), and a shade factor. (3) Keep the working revenue waterfall; replace flat $0.15/m³ and $55/MWh with editable, sourced assumptions.

**Prerequisites.** The 18 seeded projects replaced with parameter-driven inputs (all core metrics are §7-flagged synthetic); regional ET rates from NASA-POWER. **Acceptance:** two projects differing only in coverage/ET produce different evaporation savings reproducing `A×ET×shade`; LCOE responds to the land baseline and premium; no independent `sr()` LCOE field remains.

### 9.2 Evolution B — FPV siting-and-finance copilot (LLM tier 1 → 2)

**What.** A copilot for solar IPPs and water utilities: "for a 50 MW array on a water-stressed reservoir, what's the evaporation-saving value and does the cooling boost offset the structural premium?" Tier-1 narrates the cost-component breakdown and country pipeline plus the FPV cooling/evaporation literature from the atlas corpus; tier-2 runs the Evolution A models as tool calls to answer the trade-off quantitatively.

**How.** Tier 1 grounds on §5/§7 (IEA PVPS FPV roadmap, World Bank ESMAP guidance, the empirical 2–5% cooling boost and 15–25% premium ranges are documented there), and must disclose §7.5's caveat that current LCOE/evap numbers are seeded until Evolution A ships. Tier 2 wraps the LCOE/evaporation endpoints so the premium-vs-cooling trade-off is engine-computed, with the water-credit valuation shown as an explicit, editable assumption.

**Prerequisites.** Evolution A for any quantitative answer; corpus embedding. **Acceptance:** post-Evolution-A, every LCOE and evaporation figure traces to a tool call; pre-Evolution-A the copilot labels those outputs as illustrative and refuses to assert a bankable LCOE.