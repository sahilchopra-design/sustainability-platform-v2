# Biodiversity & Natural Capital Accounting
**Module ID:** `biodiversity-natural-capital` · **Route:** `/biodiversity-natural-capital` · **Tier:** B (frontend-computed) · **EP code:** EP-MISC · **Sprint:** Platform

## 1 · Overview
Advanced biodiversity and natural capital accounting analytics covering SEEA EA natural capital stock valuation, ecosystem service flow accounting (provisioning, regulating, cultural), TNFD dependency mapping, MSA footprint calculation, and biodiversity net gain (BNG) metric computation including UK 2024 mandatory BNG units.

> **Business value:** Used by property developers, infrastructure companies, corporates, and natural capital investors to quantify biodiversity dependencies and impacts, comply with UK BNG, and report against TNFD and CSRD ESRS E4 nature-related standards.

**How an analyst works this module:**
- Input land use / ecosystem extent and condition data
- Calculate natural capital asset value and ecosystem service flows
- Compute MSA footprint for corporate biodiversity accounting
- Generate BNG calculation for UK development projects and credit purchase plan

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BIO_STANDARDS`, `ES_CATEGORIES`, `FI_BIO_PRODUCTS`, `GBF_TARGETS`, `SECTOR_DEPENDENCIES`, `TNFD_LEAP`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `TNFD_LEAP` | 5 | `desc`, `subSteps` |
| `BIO_STANDARDS` | 8 | `jurisdiction`, `unitType`, `priceRange`, `voluntary`, `regulated`, `methodBasis`, `maturity`, `demandDriver` |
| `ES_CATEGORIES` | 5 | `label`, `icon`, `items`, `valueUsdHaYr`, `portion` |
| `SECTOR_DEPENDENCIES` | 9 | `depsScore`, `impactScore`, `waterDep`, `soilDep`, `pollinatorDep`, `climateRegDep`, `tnfdPriority` |
| `GBF_TARGETS` | 6 | `desc`, `fiImplication`, `urgency`, `deadline` |
| `FI_BIO_PRODUCTS` | 7 | `type`, `rtnTarget`, `minMusd`, `kpiLink`, `premium` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `totalEsHaYr` | `es.reduce((s, c) => s + c.valueUsdHaYr, 0);` |
| `adjustedEsHaYr` | `totalEsHaYr * mult * (biodiversityIndex / 100) * (waterQuality / 100);` |
| `annValue` | `landHa * adjustedEsHaYr;` |
| `disc` | `discountRate / 100;` |
| `annCarbonValue` | `landHa * carbonSeq * 30; // $30/t default` |
| `bioRichness` | `Math.round(biodiversityIndex * 0.85 + sr(landHa % 100) * 15);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BIO_STANDARDS`, `ES_CATEGORIES`, `FI_BIO_PRODUCTS`, `GBF_TARGETS`, `SECTOR_DEPENDENCIES`, `TNFD_LEAP`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Natural Capital Asset Value (USD/ha) | `Σ(service_flow_i × unit_value_i) / asset_area` | TEEB / SEEA EA benefit transfer studies | Global average natural capital value ~$1,000-5,000/ha; tropical forests ~$20,000-100,000/ha when carbon, water, and biodiversity services are included. |
| MSA Footprint (MSA.ha) | `Σ(pressure_type_i × area_i × MSA_loss_factor_i)` | GLOBIO 4.0 model + land use data | MSA.ha measures biodiversity footprint in terms of habitat area equivalents at pristine condition; lower is better; used for corporate biodiversity target setting. |
| BNG Units (UK Statutory Metric) | `post_development_units − pre_development_units` | Natural England Statutory Biodiversity Metric 4.0 (2024) | Mandatory ≥10% net gain required for UK developments under Environment Act 2021 from January 2024; BNG credits can be purchased if on-site gain is insufficient. |
- **Land use mapping + GLOBIO pressure data + SEEA EA extent/condition accounts** → Natural capital stock valuation → ecosystem service flow → MSA footprint → BNG metric → **Corporate biodiversity accounting metrics for TNFD reporting, UK BNG compliance, and natural capital investment decisions**

## 5 · Intermediate Transformation Logic
**Methodology:** Natural Capital Stock & Ecosystem Service Flow Accounting
**Headline formula:** `NCA_value = Σ(ecosystem_service_flow_i × unit_value_i × asset_condition_discount)`

Natural capital stock is valued using SEEA EA extent and condition accounts: extent (ha of each ecosystem type) × condition score × unit economic value from benefit transfer studies. Ecosystem service flows are annual benefits derived from the stock (e.g., carbon sequestration, water purification, pollination services). MSA (Mean Species Abundance) footprint is calculated per GLOBIO model: MSA_loss = Σ(pressure_type_i × area_i × MSA_loss_factor_i). UK BNG units = post-development biodiversity units − pre-development biodiversity units, using the Natural England statutory metric.

**Standards:** ['UN SEEA Ecosystem Accounting (SEEA EA) 2021', 'TEEB (The Economics of Ecosystems and Biodiversity)', 'UK BNG Statutory Metric (Natural England 2024)']
**Reference documents:** UN SEEA Ecosystem Accounting Technical Recommendations (2021); GLOBIO 4.0 Model Documentation (PBL Netherlands); Natural England Statutory Biodiversity Metric 4.0 (2024); TEEB Foundation 2012 – Ecosystem Service Valuation

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

The core is a natural-capital-accounting (NCA) valuation engine, `calcNcaValue`,
that turns land area and ecosystem condition into an annual ecosystem-service value
and its NPV:

```js
totalEsHaYr    = Σ ES_CATEGORIES.valueUsdHaYr             // 950+2100+380+520 = 3950 $/ha/yr
adjustedEsHaYr = totalEsHaYr × ecoMult × (bioIdx/100) × (waterQuality/100)
annValue       = landHa × adjustedEsHaYr
npv            = Σ_{y=1..H} annValue / (1+disc)^y          // ecosystem-service NPV
annCarbonValue = landHa × carbonSeq × 30                   // $30/tCO₂ flat
carbonNpv      = Σ_{y=1..H} annCarbonValue / (1+disc)^y
bioRichness    = round(bioIdx×0.85 + sr(landHa%100)×15)
```

`ecoMult` (forest 1.4, wetland 2.1, grassland 0.7, marine 1.6, agricultural 0.5,
urban 0.4) scales the base per-ha value by ecosystem type.

### 7.2 Parameterisation

`ES_CATEGORIES` — SEEA-EA service groups with benefit-transfer $/ha/yr:

| Category | $/ha/yr | Portion | Provenance |
|---|---|---|---|
| Regulating (carbon, water, flood, pollination) | 2,100 | 0.53 | TEEB-style benefit transfer |
| Provisioning (food, water, timber) | 950 | 0.24 | TEEB |
| Supporting (soil, nutrient, habitat) | 520 | 0.13 | TEEB |
| Cultural (recreation, spiritual) | 380 | 0.10 | TEEB |

Other reference tables are real and descriptive: `BIO_STANDARDS` (8 rows — UK BNG
£15k–60k/unit, Australia BioCredit, EU Nature Restoration, Verra CCB/VM0048,
Terrasos, IBAT/ENCORE, NCSA), `SECTOR_DEPENDENCIES` (ENCORE-style deps/impact scores),
`GBF_TARGETS` (Kunming-Montreal), `FI_BIO_PRODUCTS` (BLL, nature performance bonds,
BNG forwards). The `$30/t` carbon price and the `ecoMult` scalars are undocumented
model constants.

### 7.3 Calculation walkthrough

1. User sets land ha (default 10,000), ecosystem type (forest), water quality (75),
   carbon sequestration (3.2 tCO₂/ha/yr), biodiversity index (72), discount (5%),
   horizon.
2. `adjustedEsHaYr` down-weights the $3,950/ha base by ecosystem multiplier and by
   the biodiversity-index and water-quality fractions (both 0–1).
3. Annual ES value = area × adjusted per-ha; carbon add-on = area × seq × $30.
4. Both streams discounted to NPV over the horizon; totals reported in $M.

### 7.4 Worked example

10,000 ha forest, bioIdx 72, waterQuality 75, carbonSeq 3.2, disc 5%, horizon 30 yr:

| Step | Computation | Result |
|---|---|---|
| Base ES/ha | 950+2100+380+520 | $3,950/ha/yr |
| eco × bio × water | 1.4 × 0.72 × 0.75 | 0.756 |
| Adjusted ES/ha | 3,950 × 0.756 | $2,986/ha/yr |
| Annual ES value | 10,000 × 2,986 | $29.86M/yr |
| ES NPV (annuity 15.372) | 29.86M × 15.372 | ~$459M |
| Annual carbon | 10,000 × 3.2 × 30 | $0.96M/yr |
| Carbon NPV | 0.96M × 15.372 | ~$14.8M |
| Total NPV | 459 + 14.8 | **≈$474M** |

(30-yr @5% annuity factor `(1−1.05⁻³⁰)/0.05 = 15.372`.) ES flows dwarf carbon here
because the $3,950/ha base is ~40× the $96/ha carbon value.

### 7.5 Data provenance & limitations

- The four `valueUsdHaYr` benefit-transfer figures and the ecosystem multipliers are
  **hard-coded point estimates** — TEEB-flavoured but not sourced to a specific study
  or region, so the absolute NPV is indicative only.
- `bioRichness` mixes the input index with an `sr()` PRNG term — a cosmetic synthetic
  jitter; the valuation itself is deterministic.
- Carbon priced at a flat $30/t (below current EU ETS / social cost of carbon); no
  condition-account depreciation of the stock over the horizon; ES flow held constant
  (no degradation/restoration trajectory).

**Framework alignment:** UN SEEA-EA (extent × condition × unit value — approximated
by land × ecoMult × condition fractions × benefit-transfer $/ha) · TEEB (ecosystem-
service valuation categories) · TNFD LEAP (the `TNFD_LEAP` steps table) · GLOBIO/MSA
(named in guide but the page values services, it does not compute an MSA footprint) ·
UK BNG Metric (referenced in `BIO_STANDARDS`, not computed here).

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Produce a defensible SEEA-EA natural-capital account —
opening stock, ecosystem-service flow, condition-adjusted NPV and depreciation — for
a landholding, supporting corporate NCA disclosure and conservation-finance underwriting.

**8.2 Conceptual approach.** Follow the **UN SEEA-EA** extent/condition/monetary
account structure (the statistical standard) with **TEEB / ONS Natural Capital
Accounts** benefit-transfer valuation and a stock-depreciation term, benchmarked
against **Natural Capital Protocol** and **CDC Biodiversité GBS** practice.

**8.3 Mathematical specification.**
```
Stock_value = Σ_e Extent_e · Condition_e · UnitValue_e
Flow_t      = Σ_s Q_{s,t} · P_{s,t}            (service quantity × price)
Condition_t = Condition_0 · (1 − degrade_rate + restore_rate)^t
NPV = Σ_t Flow_t · Condition_t / (1+r)^t  −  Σ_t Depreciation_t/(1+r)^t
Carbon flow = seq_t · SCC_t                    SCC = social cost of carbon path
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Unit values | UnitValue_e | TEEB / ONS / regional benefit-transfer meta-analyses |
| Service quantities | Q_s | Field survey / InVEST / remote sensing |
| Condition score | Condition | SEEA-EA condition indicators (biophysical) |
| Degrade/restore | rates | Land-management plan + ecological monitoring |
| Discount rate | r | Social discount rate (e.g. HM Treasury Green Book 3.5%) |
| Carbon price | SCC_t | US-IWG SCC / EU ETS forward |

**8.4 Data requirements.** Ecosystem extent (ha by type), condition indicators,
service-flow quantities, region-matched unit values, sequestration rate, SCC path,
discount rate. Platform holds the ES category values and standards table; condition
indicators, InVEST flows and SCC path are new.

**8.5 Validation & benchmarking.** Reconcile against ONS UK Natural Capital Accounts
per-ha values by habitat; sensitivity on discount rate and condition trajectory;
cross-check carbon leg against the platform's carbon-price engines; benefit-transfer
uncertainty bands via Monte Carlo over source studies.

**8.6 Limitations & model risk.** Benefit transfer imports value from non-analogous
sites; double-counting across overlapping services is a known SEEA hazard; condition
dynamics are uncertain. Conservative fallback: lower-bound unit values, exclude
cultural services where willingness-to-pay is unmeasured, and report a value *range*
not a point.

## 9 · Future Evolution

### 9.1 Evolution A — Ground the NCA valuation and BNG metric in real accounts (analytics ladder: rung 1 → 2)

**What.** The `calcNcaValue` engine is a legitimate SEEA-EA-style flow valuation (extent × condition × benefit-transfer unit values, NPV'd), and the reference tables (`BIO_STANDARDS`, `SECTOR_DEPENDENCIES`, `GBF_TARGETS`, `FI_BIO_PRODUCTS`) are real and descriptive. But three things are unsourced model constants: the `ecoMult` ecosystem scalars (forest 1.4, wetland 2.1…), the flat `$30/tCO₂` carbon price, and a stray `bioRichness = bioIdx×0.85 + sr(landHa%100)×15` that injects seeded noise into an otherwise deterministic engine. And the BNG calculation the overview promises is described but the module shares scope with the fuller `biodiversity-credits` engine. Evolution A grounds the constants and routes BNG to the real metric.

**How.** (1) Replace `ecoMult` and the benefit-transfer `valueUsdHaYr` figures with cited SEEA-EA/TEEB values per ecosystem type, vintage-tagged in refdata (the values are order-plausible but currently uncited). (2) Carbon price from the platform's carbon-price reference series (or a user input) instead of the flat $30, and remove the seeded `bioRichness` noise term — a deterministic accounting engine should not have a PRNG in it. (3) Route the BNG tab to `biodiversity-credits`' `/bng-metric` (DEFRA Metric 4.0) rather than reimplementing it, eliminating a second divergent BNG calculation. (4) Rung 2: condition-scenario sweeps — value the same parcel under restoration vs degradation condition trajectories, which the extent×condition structure already supports.

**Prerequisites.** SEEA-EA/TEEB unit-value sourcing per ecosystem type; coordination with `biodiversity-credits` on the shared BNG engine. **Acceptance:** every $/ha/yr and multiplier carries a citation and vintage; the engine contains no PRNG call; the BNG tab matches the shared metric engine's output.

### 9.2 Evolution B — Natural-capital accounting copilot (LLM tier 1 → 2)

**What.** Tier 1: a copilot explaining natural-capital accounting to the property/infrastructure user — "what's my 10,000 ha forest parcel worth in ecosystem-service terms, and how sensitive is that to the discount rate?", "which of these biodiversity credit standards (`BIO_STANDARDS`) fits a UK development?", "what does SEEA-EA extent×condition mean?" — grounded in this Atlas record with the honest caveat that unit values are benefit-transfer estimates, not site measurements. Tier 2 runs the Evolution-A valuation engine and the shared BNG metric as tools.

**How.** Tier-1 corpus from this record (§7.1 valuation formula, §7.2 service-category table, the standards/products reference tables); the refusal path distinguishes accounting estimates from market valuations — a benefit-transfer NCA value is not a transactable price, and the copilot must say so. Tier 2 tool schemas over the NCA valuation route plus `biodiversity-credits`' BNG endpoint; "value this parcel and compute its BNG obligation for a 30% development footprint" chains both, every figure tool-traced. The `FI_BIO_PRODUCTS` table lets the copilot connect valuations to instrument types (biodiversity-linked loans, nature performance bonds) with the products' curated-reference status disclosed.

**Prerequisites.** Copilot router (tier 1); Evolution A's sourced constants and the shared BNG route (tier 2). **Acceptance:** tier-1 answers label NCA values as benefit-transfer estimates, not prices; tier-2 valuations trace every $/ha and BNG unit to a tool response; unsupported ecosystem types report the coverage gap.