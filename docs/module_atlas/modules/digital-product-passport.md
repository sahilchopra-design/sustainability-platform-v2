# Digital Product Passport
**Module ID:** `digital-product-passport` · **Route:** `/digital-product-passport` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
EU Digital Product Passport (DPP) compliance module for product lifecycle sustainability data including materials, repairability, carbon footprint, and end-of-life instructions. Generates machine-readable DPP records conforming to the ESPR framework. Supports QR-code linked consumer disclosure and supply chain data collection.

> **Business value:** Enables manufacturers and brand owners to meet EU ESPR Digital Product Passport obligations ahead of phased product category deadlines. Centralised DPP management reduces compliance cost and surfaces sustainability improvement priorities across the product portfolio.

**How an analyst works this module:**
- Upload product bill of materials and lifecycle assessment data for each SKU
- Complete mandatory ESPR data fields: materials, hazardous substances, repairability, carbon footprint
- Generate the DPP record and obtain the unique product identifier (UPI) and QR code
- Publish the DPP to the EU product passport registry and link it to the product packaging

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BATTERY_CHEM`, `Badge`, `COUNTRIES_MFG`, `DPP_FIELDS`, `DPP_STATUSES`, `EPR_COUNTRIES`, `FIELD_GROUPS`, `KpiCard`, `LIFECYCLE_STAGES`, `MANDATE_YEARS`, `PIE_COLORS`, `PRODUCTS`, `PRODUCT_CATEGORIES`, `SC_COMPANIES`, `STATUS_COLOR`, `SUPPLY_CHAIN_NODES`, `SectionTitle`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `DPP_FIELDS` | 36 | `category`, `mandatory`, `format` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `BATTERY_CHEM` | `['Li-ion', 'NiMH', 'Lead-acid', 'Solid-state'];` |
| `cat` | `PRODUCT_CATEGORIES[Math.floor(sr(i * 7) * PRODUCT_CATEGORIES.length)];` |
| `country` | `COUNTRIES_MFG[Math.floor(sr(i * 11) * COUNTRIES_MFG.length)];` |
| `isBattery` | `cat === 'Batteries & Accumulators' \|\| (cat === 'Electronics & ICT' && sr(i * 3) > 0.6);` |
| `brandIdx` | `Math.floor(sr(i * 13) * 20);` |
| `espr` | `Math.round(sr(i * 17) * 55 + 35);` |
| `FIELD_GROUPS` | `['Identity', 'Carbon Footprint', 'Materials', 'Repairability', 'End-of-Life', 'Compliance'];` |
| `avg` | `arr => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;` |
| `fieldFilled` | `useMemo(() => DPP_FIELDS.map((_, i) => sr(i * 157 + 3) > 0.30), []);` |
| `avgEspr` | `fmt1(avg(PRODUCTS.map(p => p.espr_score)));` |
| `avgCarbon` | `Math.round(avg(PRODUCTS.map(p => p.carbonFootprint)));` |
| `esprByCategory` | `useMemo(() => PRODUCT_CATEGORIES.map(cat => {` |
| `mandateCounts` | `useMemo(() => MANDATE_YEARS.map(y => ({` |
| `sortedByEspr` | `useMemo(() => [...PRODUCTS].sort((a, b) => b.espr_score - a.espr_score), []);` |
| `bottom15` | `sortedByEspr.slice(-15);` |
| `fieldGroupStats` | `useMemo(() => FIELD_GROUPS.map(grp => {` |
| `grpIdxs` | `grpFields.map(f => DPP_FIELDS.indexOf(f));` |
| `dppReadiness` | `Math.min(100, Math.round((fieldSlider / 100) * 85 + 15));` |
| `completeness` | `Math.round(filledCount / DPP_FIELDS.length * 100);` |
| `lifecycleData` | `useMemo(() => LIFECYCLE_STAGES.map((stage, i) => ({` |
| `totalCF` | `lifecycleData.reduce((s, r) => s + r.scope1 + r.scope2 + r.scope3, 0);` |
| `top20Carbon` | `useMemo(() => [...PRODUCTS].sort((a, b) => b.carbonFootprint - a.carbonFootprint).slice(0, 20), []);` |
| `catAvgCarbon` | `useMemo(() => PRODUCT_CATEGORIES.map(cat => {` |
| `reducedCarbon` | `Math.round(baseCarbon * (1 - mfgSlider / 100 * 0.55));` |
| `scatterData` | `useMemo(() => PRODUCTS.filter((_, i) => i % 5 === 0).map(p => ({` |
| `repairByCategory` | `useMemo(() => PRODUCT_CATEGORIES.map(cat => {` |
| `eolByCountry` | `useMemo(() => COUNTRIES_MFG.slice(0, 12).map(c => {` |
| `circularSavings` | `Math.round(annualTonnes * recycleSlider / 100 * 0.42);` |
| `batteryProducts` | `useMemo(() => PRODUCTS.filter(p => p.batteryChemistry !== null), []); const chemDist = useMemo(() => BATTERY_CHEM.map(ch => ({ name: ch, value: batteryProducts.filter(p => p.batteryChemistry === ch).length, })), [batteryProducts]);` |
| `brandBatteryReadiness` | `useMemo(() => { const brands = [...new Set(batteryProducts.map(p => p.brand))].slice(0, 10);` |
| `totalEprLiability` | `Math.round(PRODUCTS.length * avg(EPR_COUNTRIES.map(c => c.fee)));` |
| `eprComplBar` | `useMemo(() => [...EPR_COUNTRIES].sort((a, b) => b.compliance - a.compliance), []);` |
| `tierDist` | `useMemo(() => [1, 2, 3].map(t => ({` |
| `highRiskByCat` | `useMemo(() => PRODUCT_CATEGORIES.map(cat => {` |
| `traceRiskReduction` | `Math.round((traceSlider / 100) * 62);` |
| `countryRiskBar` | `useMemo(() => COUNTRIES_MFG.map(c => {` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/digital-product-passport/espr-compliance` | `espr_compliance` | api/v1/routes/digital_product_passport.py |
| POST | `/api/v1/digital-product-passport/dpp-schema` | `dpp_schema` | api/v1/routes/digital_product_passport.py |
| POST | `/api/v1/digital-product-passport/battery-regulation` | `battery_regulation` | api/v1/routes/digital_product_passport.py |
| POST | `/api/v1/digital-product-passport/epr-levy` | `epr_levy` | api/v1/routes/digital_product_passport.py |
| POST | `/api/v1/digital-product-passport/full-assessment` | `full_assessment` | api/v1/routes/digital_product_passport.py |
| GET | `/api/v1/digital-product-passport/ref/product-categories` | `ref_product_categories` | api/v1/routes/digital_product_passport.py |
| GET | `/api/v1/digital-product-passport/ref/epr-rates` | `ref_epr_rates` | api/v1/routes/digital_product_passport.py |
| GET | `/api/v1/digital-product-passport/ref/battery-targets` | `ref_battery_targets` | api/v1/routes/digital_product_passport.py |

### 2.3 Engine `digital_product_passport_engine` (services/digital_product_passport_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `DigitalProductPassportEngine.assess_espr_compliance` | product_data | Assess ESPR (Regulation (EU) 2024/1781) applicability and compliance for a given product. Args: product_data: must include 'product_category', optionally 'gtin_ean', 'market_regions', 'existing_certifications'. Returns: dict with fields: espr_applicable, regulation_ref, applicable_requirements, compliance_score (0-100), compliance_gaps, dpp_mandatory_year, priority_group, current_year_gap_years, a |
| `DigitalProductPassportEngine.build_dpp_schema` | product_data | Evaluate completeness of a product's Digital Product Passport data against the 25 mandatory DPP fields. Args: product_data: dict where keys may include field names from DPP_MANDATORY_FIELDS. May also include 'available_data' (dict field_id → bool). Returns: dict with completeness_pct, mandatory_fields_completed, missing_fields, schema_version, gap_list, dpp_readiness_level. |
| `DigitalProductPassportEngine.calculate_lifecycle_ghg` | product_data, lifecycle_stages | Calculate product carbon footprint per ISO 14067:2018 / PEF methodology. Args: product_data: must include 'product_category', 'annual_units'. Optionally 'product_weight_kg', 'transport_km'. lifecycle_stages: optional override of kg CO2e per unit per stage. Keys: raw_materials, manufacturing, transport, use_phase, end_of_life. Returns: dict with stage breakdown, total_kg_co2e_per_unit, scope classi |
| `DigitalProductPassportEngine.assess_circularity` | product_data | Compute a circularity index (0-100) across 5 weighted dimensions. Args: product_data: must include recycled_content_pct, recyclability_score, durability_years, repairability_score, material_efficiency_pct. Returns: dict with dimension_scores, circularity_index, improvement_potential, improvement_actions. |
| `DigitalProductPassportEngine.assess_battery_regulation` | battery_data | Assess compliance with EU Battery Regulation 2023/1542. Args: battery_data: battery_chemistry, capacity_kwh, carbon_footprint_kg_per_kwh, recycled_li_pct, recycled_co_pct, recycled_ni_pct, recycled_pb_pct, has_supply_chain_dd, has_battery_passport, soh_accessible. Returns: dict with requirement-by-requirement compliance, recycled content gaps, overall_score, compliance_tier. |
| `DigitalProductPassportEngine.calculate_epr_levy` | product_data, countries | Calculate EPR scheme levy exposure across EU Member States. Args: product_data: product_category, annual_volume_tonnes. countries: list of ISO 3166-1 alpha-2 country codes (default: all 20). Returns: dict with per_country_levy_eur, total_eu_exposure_eur, exemption_assessment, highest_levy_country. |
| `DigitalProductPassportEngine.run_full_assessment` | entity_id, product_data | Orchestrate all sub-modules and compute composite dpp_readiness_score. Weighting: ESPR compliance 40% DPP schema 25% LCA / carbon 20% Circularity 15% Returns: full_result dict with all sub-results + composite scores + espr_tier. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `BATTERY_CHEM`, `COUNTRIES_MFG`, `DPP_FIELDS`, `DPP_STATUSES`, `EPR_COUNTRIES`, `FIELD_GROUPS`, `LIFECYCLE_STAGES`, `MANDATE_YEARS`, `PIE_COLORS`, `PRODUCT_CATEGORIES`, `SC_COMPANIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| DPP Records Issued | — | DPP registry | Total Digital Product Passport records generated and registered in the EU DPP system |
| Avg Product Carbon Footprint | — | ISO 14067 PCF calculation | Mean product carbon footprint across all registered SKUs in the current portfolio |
| Repairability Index (Avg) | — | EU Repairability Score methodology | Average repairability score across registered products; EU threshold is ≥6.0 |
| DPP Completeness | — | Mandatory field audit | Share of DPP records with all ESPR-mandatory data fields populated |
- **Bill of materials (material composition per SKU)** → Material sustainability scoring against ESPR restricted substance lists and recyclability databases → **Materials dimension score and chemical safety flag**
- **ISO 14067 PCF study data** → Cradle-to-gate / cradle-to-grave emission factor application → **Product carbon footprint in kgCO₂e per functional unit**
- **EU DPP registry API** → Formatted DPP record upload with UPI assignment → **Registered DPP with QR code and public disclosure URL**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/digital-product-passport/ref/battery-targets** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'source', 'priority_materials', 'targets', 'description', 'all_requirements_overview'], 'n_keys': 6}`

**GET /api/v1/digital-product-passport/ref/dpp-mandatory-fields** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'source', 'total_mandatory_fields', 'fields', 'fields_by_section'], 'n_keys': 5}`

**GET /api/v1/digital-product-passport/ref/epr-rates** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'source', 'total_countries', 'currency', 'unit', 'rates_by_country'], 'n_keys': 6}`

**GET /api/v1/digital-product-passport/ref/product-categories** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'source', 'total_categories', 'categories'], 'n_keys': 4}`

**POST /api/v1/digital-product-passport/battery-regulation** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/digital-product-passport/circularity-assessment** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/digital-product-passport/dpp-schema** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/digital-product-passport/epr-levy** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Product Sustainability Score
**Headline formula:** `PSS = Σ wᵢ × Sᵢ across {Carbon, Materials, Repairability, Recyclability, Chemical Safety}`

Each of five sustainability dimensions is scored 0–100 using lifecycle assessment data and regulatory threshold benchmarks; dimension weights follow ESPR delegated act priorities by product category. The composite score drives the EU energy label class equivalent for digital passports.

**Standards:** ['EU ESPR Regulation 2024/1781', 'ISO 14040/14044 LCA', 'EU Ecodesign Directive']
**Reference documents:** EU Regulation 2024/1781 (ESPR) â€” Ecodesign for Sustainable Products Regulation; ISO 14067:2018 â€” Carbon footprint of products; ISO 14040/14044:2006 â€” Life cycle assessment principles and requirements; European Commission (2023) DPP Technical Architecture Guidelines

**Engine `digital_product_passport_engine` — extracted transformation lines:**
```python
cert_coverage = min(len(existing_certs) * 20, 60)
completeness_pct = round(len(completed) / total * 100, 1)
stage_emissions[stage] = round(base_ef * weight_factor / 1000, 4)  # convert kg→tonne
annual_total_tco2e = round(total_per_unit * annual_units / 1000, 2)
score = max(0.0, min(100.0, (raw_val - low) / (high - low) * 100))
improvement_potential = round(100 - circularity_index, 1)
overall_score = round(checks_passed / 5 * 100)
lca_score = lca_score_raw * 0.20
dpp_readiness_score = round(espr_score + dpp_score + lca_score + circ_score, 1)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **46** other module(s).

| Connected module | Shared via |
|---|---|
| `blended-finance-structuring` | table:exc |
| `supply-chain-esg-hub` | table:exc |
| `carbon-accounting-ai` | table:exc |
| `green-hydrogen-lcoh` | table:exc |
| `just-transition-finance-hub` | table:exc |
| `adaptation-finance` | table:exc |
| `modern-slavery-intel` | table:exc |
| `supply-chain-resilience` | table:exc |
| `crrem` | table:exc |
| `climate-underwriting-workbench` | table:exc |

## 7 · Methodology Deep Dive

This tier-A module has a **genuinely rigorous backend engine** (`digital_product_passport_engine.py`)
implementing the guide's *Product Sustainability Score* concept for real: ESPR compliance scoping,
ISO 14067 lifecycle GHG, a weighted 5-dimension circularity index, EU Battery Regulation assessment,
and a 20-member-state EPR levy calculator — all anchored to real EU regulation articles. The
**frontend page**, by contrast, renders a synthetic product portfolio (`sr()`-seeded ESPR scores,
carbon footprints, field completeness). §7.1–7.3 document the real engine; §7.4 the frontend synthesis.

### 7.1 What the engine computes (backend, real)

```python
# Lifecycle GHG (ISO 14067 / EU PEF, cradle-to-grave):
stage_emissions = LCA_EMISSION_FACTORS[category] (override-able), material cats scaled by weight/1000
total_per_unit  = Σ stage_emissions
scope1 = manufacturing × 0.3
scope2 = manufacturing × 0.7 + use_phase × 0.8
scope3 = raw_materials + transport + use_phase × 0.2 + end_of_life
annual_total_tco2e = total_per_unit × annual_units / 1000

# Circularity index (0–100, 5 weighted dimensions):
score_dim = clamp(0,100, (raw − low)/(high − low) × 100)     # normalise to benchmark band
circularity_index = Σ score_dim × weight_dim
tier: ≥75 Circular Leader · ≥55 Transitioning · ≥35 Linear-with-Pockets · else Linear
```

The GHG scope allocation is a real GHG-Protocol/PEF split (manufacturing → 30% Scope 1 / 70% Scope 2;
upstream + downstream → Scope 3); circularity normalises each input against EU benchmark high/low bands
and weights them, flagging sub-50 dimensions with EU-target-referenced improvement actions.

### 7.2 Parameterisation (backend, real)

| Element | Detail | Provenance |
|---|---|---|
| ESPR categories | 15 (textiles 2026, electronics 2027, batteries 2026, furniture/toys 2028, vehicles, construction, tyres, detergents…) | **real** ESPR Delegated-Act mandate years |
| Regulation refs | EU 2024/1781 (ESPR), 2023/1542 (Battery), EN 15804, PEF CR | **real** article citations |
| LCA emission factors | per-category cradle-to-grave EFs, `_default` fallback | PEF database (industry-average, DQ Tier 2) |
| Circularity dims | recycled content, recyclability, durability, repairability, material efficiency | 5 weighted, EU benchmark bands |
| EPR levies | 20 EU member states | national EPR scheme rates |
| Battery reg | Art 7 (carbon footprint), 8 (recycled content), 52-54 (DD), 38-65 (passport) | EU Battery Reg 2023/1542 |

### 7.3 Calculation walkthrough (backend)

`assess_espr_compliance` scopes a product to its category, lists mandatory requirements, flags gaps.
`calculate_lifecycle_ghg` applies category EFs across five stages (material categories scaled by
weight, kg→tonne), sums to per-unit CF, allocates to Scopes 1/2/3, and scales by annual units.
`assess_circularity` normalises the five inputs to their benchmark bands, weight-sums to a 0–100 index,
assigns a tier, and emits improvement actions. `assess_battery_regulation` checks recycled-content
thresholds (Li/Co/Ni/Pb) and passport/DD flags. `calculate_epr_levy` applies member-state rates. A
full-assessment orchestrator combines these into a `dpp_readiness_score` + `espr_tier`.

### 7.4 Frontend synthesis (what the page shows)

The page generates products with `sr()`-seeded `espr_score = round(sr(i·17)·55 + 35)` (35–90),
`carbonFootprint`, `fieldFilled = sr(i·157+3) > 0.30` (per DPP field), category, and country. KPIs
average these seeded scores; `dppReadiness = min(100, round(fieldSlider/100 × 85 + 15))` is a slider-
driven synthetic readiness. The mandatory-year timeline and 36 DPP fields are real ESPR structure; the
per-product values are synthetic. Reference endpoints (`/ref/battery-targets`, `/ref/dpp-mandatory-
fields`, `/ref/epr-rates`) and POST routes exist to serve the real engine, but the displayed product
portfolio is client-side seeded.

### 7.4 Worked example (engine)

A laptop (electronics), `annual_units = 100,000`, default EFs (say raw 120, mfg 90, transport 8,
use 40, EoL 5 kgCO₂e/unit):
- `total_per_unit = 120 + 90 + 8 + 40 + 5 = 263 kgCO₂e`.
- `scope1 = 90 × 0.3 = 27`; `scope2 = 90 × 0.7 + 40 × 0.8 = 63 + 32 = 95`;
  `scope3 = 120 + 8 + 40 × 0.2 + 5 = 141 kgCO₂e`.
- `annual_total = 263 × 100,000 / 1000 = 26,300 tCO₂e`.
Circularity with recycled 40 (band 0–60), recyclability 70 (0–100), durability 6 (2–10),
repairability 65 (0–100), material-eff 80 (40–100), equal-ish weights: recycled `40/60·100 = 66.7`,
recyclability 70, durability `(6−2)/8·100 = 50`, repairability 65, mat-eff `(80−40)/60·100 = 66.7` →
weighted ≈ 63 → **Transitioning** tier.

### 7.5 Data provenance & limitations

- **Backend engine is real** — ESPR/Battery/EPR regulation references and article citations are
  accurate; LCA/circularity math is deterministic. LCA EFs are PEF industry-average (DQ Tier 2), not
  product-specific.
- **Frontend portfolio is synthetic** (`sr(seed) = frac(sin(seed+1)×10⁴)`): ESPR scores, carbon
  footprints, and field-completeness flags are seeded; only the DPP field schema and mandate calendar
  are real.
- Scope allocation (30/70 mfg split, 0.8/0.2 use-phase split) is a simplifying convention, not a
  measured allocation; biogenic carbon excluded.

**Framework alignment:** EU **ESPR** Regulation 2024/1781 (Art 5/7/8/9 — DPP, ecodesign, carbon
footprint), **EU Battery Regulation** 2023/1542 (Art 7 CF, Art 8 recycled content, Art 38-65 passport),
**ISO 14067:2018 / ISO 14044:2006 / EU PEF** (product carbon footprint, cradle-to-grave), **EN
15804+A2** (construction EPD), and **EPR** under Directive 2008/98/EC — all implemented with correct
article-level references in the engine, making this one of the more standards-faithful modules in the
platform. The synthetic frontend should be wired to the engine's POST endpoints to surface real
computed passports.

## 9 · Future Evolution

### 9.1 Evolution A — Persist real SKUs and wire the page to its own engine (analytics ladder: rung 1 → 2)

**What.** The module is a genuine tier-A vertical — `DigitalProductPassportEngine` computes ESPR applicability, 25-field DPP completeness, ISO 14067 lifecycle GHG, a 5-dimension circularity index, EU Battery Regulation 2023/1542 checks, and per-country EPR levies across 8 endpoints — but the page ignores it: every UI product is an `sr()`-seeded fabrication (`espr = sr(i*17)*55+35`) and the engine has no persistence (source tables: none). Evolution A replaces the seeded `PRODUCTS` array with a real product registry and turns the sliders into engine-backed scenario sweeps.

**How.** (1) New tables `dpp_products` and `dpp_assessments` (Alembic migration) storing BOM/LCA inputs and `run_full_assessment` outputs per SKU. (2) Page loads `GET .../products` and renders engine-computed `dpp_readiness_score`, not `sr()` derivations. (3) Scenario layer: `POST /full-assessment` gains a `scenario` block (electricity-price, recycled-content, mandate-year shifts) so the existing manufacturing/recycling sliders re-run the engine instead of applying in-page multipliers like `baseCarbon × (1 − mfgSlider/100 × 0.55)`. (4) Fix the lineage-traced failure: `POST /circularity-assessment` returned `failed` in the harness sweep — root-cause before anything builds on it.

**Prerequisites.** The failed circularity endpoint fixed; seed 50–100 realistic SKUs (EPD/PEF public datasets) so the registry isn't empty on day one. **Acceptance:** zero `sr()` calls remain in the page's data path; a re-run lineage sweep shows all 5 POST endpoints `passed` with `dpp_products` as a source table.

### 9.2 Evolution B — Compliance analyst that runs the assessment stack per SKU (LLM tier 2)

**What.** A tool-calling analyst on the DPP page that answers "is this power-tool SKU ESPR-mandatory in 2027, what's missing, and what would the EPR levy be if we sell in 20 member states?" by chaining the module's real endpoints — `POST /espr-compliance` → `/dpp-schema` → `/epr-levy` → `/battery-regulation` when chemistry is present — and narrating only the returned payloads (compliance_gaps, missing_fields, per_country_levy_eur).

**How.** Tool schemas generated from the module's 8 OpenAPI operations; the reference GETs (`/ref/product-categories`, `/ref/epr-rates`, `/ref/battery-targets` — all lineage-`passed`) serve as the copilot's grounding vocabulary so it never invents a category or rate. System prompt assembled from this Atlas record (§2.3 engine docstrings are unusually complete and make good tool descriptions). The no-fabrication validator checks every levy figure and mandate year against tool outputs. Mutating persistence calls (Evolution A's product writes) stay behind explicit user confirmation per the tier-2 RBAC convention.

**Prerequisites.** Evolution A's endpoint fix (a copilot cannot chain through a 500); prompt-cache the stable ref-data responses. **Acceptance:** for a golden SKU fixture, the analyst's stated `dpp_mandatory_year` and total levy match a direct `run_full_assessment` call exactly; asking for a metric the engine doesn't compute (e.g. repair-cost forecasting) triggers the refusal path.