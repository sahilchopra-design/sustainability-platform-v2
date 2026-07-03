# NbS Finance
**Module ID:** `nbs-finance` · **Route:** `/nbs-finance` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Analyses the financing landscape for Nature-based Solutions including blue carbon, green carbon, biodiversity credits, ecosystem service payments, and blended finance structures.

> **Business value:** Enables development finance institutions, conservation funds, and impact investors to evaluate, structure, and monitor NbS investments that deliver combined climate, biodiversity, and social co-benefits.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `BIOME_OPTIONS`, `Badge`, `Btn`, `Inp`, `KpiCard`, `PIE_COLORS`, `PROJECT_OPTIONS`, `Row`, `Section`, `Sel`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `TABS` | `['IUCN NbS Standard', 'Carbon Co-benefits', 'Biodiversity & Water', 'Economics & Finance', 'Blended Finance'];` |
| `composite` | `Math.round(criteria.reduce((s, c) => s + c.score, 0) / criteria.length);` |
| `seqRate` | `Math.round(seed(bi * 37 + pi * 3) * 8 + 2);` |
| `areaHa` | `Math.round(seed(bi * 41 + pi * 7) * 40000 + 5000);` |
| `seqTotal` | `Math.round((seqRate * areaHa) / 1000);` |
| `creditEligible` | `Math.round(seqTotal * (seed(bi * 43) * 0.3 + 0.6));` |
| `priceUsd` | `Math.round(seed(bi * 47 + pi * 11) * 30 + 8);` |
| `species` | `Math.round(seed(bi * 53 + pi * 3) * 200 + 50);` |
| `habitatHa` | `Math.round(seed(bi * 57 + pi * 7) * 15000 + 1000);` |
| `msaUplift` | `parseFloat((seed(bi * 59 + pi * 11) * 25 + 5).toFixed(1));` |
| `watershedM3` | `Math.round(seed(bi * 61 + pi * 13) * 500000 + 50000);` |
| `gbfContribution` | `Math.round(seed(bi * 67 + pi * 17) * 30 + 50);` |
| `totalInv` | `parseFloat((seed(bi * 71 + pi * 3) * 80 + 20).toFixed(1));` |
| `carbonRev` | `parseFloat((seed(bi * 73 + pi * 7) * 15 + 3).toFixed(1));` |
| `ecoSvcRev` | `parseFloat((seed(bi * 79 + pi * 11) * 10 + 2).toFixed(1));` |
| `npv` | `parseFloat(((carbonRev + ecoSvcRev) * 12 - totalInv).toFixed(1));` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/nbs-finance/blended-finance` | `blended_finance` | api/v1/routes/nbs_finance.py |
| GET | `/api/v1/nbs-finance/ref/iucn-criteria` | `ref_iucn_criteria` | api/v1/routes/nbs_finance.py |
| GET | `/api/v1/nbs-finance/ref/nbs-categories` | `ref_nbs_categories` | api/v1/routes/nbs_finance.py |
| GET | `/api/v1/nbs-finance/ref/gbf-target-2` | `ref_gbf_target_2` | api/v1/routes/nbs_finance.py |

### 2.3 Engine `nbs_finance_engine` (services/nbs_finance_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_iucn_composite` | scores | Calculate IUCN composite score and assign NbS tier. |
| `_carbon_cobenefit` | category, area_ha, duration_years, standard_key, seq_rate_override, credit_price_override | Calculate carbon co-benefit metrics. |
| `_biodiversity_cobenefit` | category, area_ha, iucn_tier, species_density_per_100ha, red_list_species, habitat_quality_score | Calculate biodiversity co-benefit metrics. |
| `_water_cobenefit` | category, area_ha, flood_risk_reduction_ha, groundwater_recharge_m3_yr, erosion_reduction_tonnes_yr | Calculate water co-benefit metrics. |
| `_social_cobenefit` | category, area_ha, has_indigenous_lands, fpic_obtained, livelihoods_supported, gender_inclusion_score | Calculate social co-benefit metrics. |
| `_vcmi_assessment` | iucn_composite, has_mrv, ndc_aligned | Derive VCMI integrity score and claim tier. |
| `_economics` | total_investment_m, annual_maintenance_m, carbon_seq_tco2_yr, vcm_price, area_ha, duration_years |  |
| `_irr_estimate` | capex_m, annual_cashflow_m, years | Estimate IRR via bisection method. |
| `_blended_finance_structure` | total_cost_m, public_m, private_m, philanthropic_m, gcf_eligible, category_key |  |
| `_convergence_archetype` | ratio |  |
| `_nbs_quality_score` | iucn_composite, has_mrv, ndc_aligned, fpic_obtained, economics | Overall NbS quality score and bankability tier. |
| `assess_nbs_project` | req | Full IUCN NbS v2.0 assessment with all co-benefits and economics. |
| `_compliance_flags` | req, iucn_tier |  |
| `_generate_recommendations` | iucn_composite, econ, vcmi, req |  |
| `calculate_blended_finance` | req | Blended finance structuring for NbS projects. |
| `get_nbs_benchmarks` |  | Return NbS category benchmarks and reference data. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `IUCN`, `__future__` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `BIOME_OPTIONS`, `PIE_COLORS`, `PROJECT_OPTIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| NbS Investment Gap (2030) | — | UNEP Finance for Nature 2023 | Annual NbS investment shortfall relative to what is required to achieve biodiversity and climate targets by 20 |
| Blue Carbon Credit Value | — | Ecosystem Marketplace 2024 | Market price range for high-quality blue carbon (mangrove, seagrass, salt marsh) credits in voluntary markets. |
- **Project documentation, IPCC land-use emission factors, carbon registry data, biodiversity credit prices** → Sequestration modelling, co-benefit quantification, blended finance structuring → **Project finance models, NbS credit analytics, blended finance structure templates**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/nbs-finance/ref/gbf-target-2** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['gbf_target_2', 'gcf_nbs_support', 'cross_framework_links'], 'n_keys': 3}`

**GET /api/v1/nbs-finance/ref/iucn-criteria** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['standard', 'edition', 'total_criteria', 'scoring_note', 'criteria'], 'n_keys': 5}`

**GET /api/v1/nbs-finance/ref/nbs-categories** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['nbs_categories', 'carbon_credit_standards', 'global_nbs_market'], 'n_keys': 3}`

**GET /api/v1/nbs-finance/ref/vcmi-claims** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'version', 'published', 'purpose', 'integrity_score_range', 'claims'], 'n_keys': 6}`

**POST /api/v1/nbs-finance/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** NbS Return on Conservation
**Headline formula:** `NbS-ROC = (EcosystemServiceValue + CarbonRevenue + BiodiversityCredits) / ConservationCost`
**Standards:** ['IUCN NbS Standard 2020', 'Taskforce on Nature Markets 2023']

**Engine `nbs_finance_engine` — extracted transformation lines:**
```python
composite = sum(raw[k] * weights[k] for k in raw)
annual_seq = seq_rate * area_ha
total_seq = annual_seq * duration_years
creditable_seq = total_seq * (1 - buffer_pct)
base = iucn_composite * 0.7
vcmi_score = min(100, max(0, base + mrv_bonus + ndc_bonus))
carbon_rev_yr = carbon_seq_tco2_yr * vcm_price / 1_000_000  # USD M
annual_income = carbon_rev_yr + ecosystem_rev_yr
irr = _irr_estimate(total_investment_m, annual_income - annual_cost, duration_years)
payback = total_investment_m / max(annual_income - annual_cost, 0.001)
mid = (lo + hi) / 2
committed = public_m + private_m + philanthropic_m
gap_m = max(0.0, total_cost_m - committed)
gcf_grant_m = min(total_cost_m * 0.40, gap_m) if gcf_eligible else 0.0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **39** other module(s).

| Connected module | Shared via |
|---|---|
| `blended-finance` | table:exc |
| `biodiversity-credits` | table:exc |
| `transition-finance` | table:exc |
| `just-transition-finance-hub` | table:exc |
| `just-transition-adaptation` | table:exc |
| `insurance-climate-hub` | table:exc |
| `insurance-transition` | table:exc |
| `supply-chain-map` | table:exc |
| `crrem` | table:exc |
| `green-hydrogen-ammonia-carbon` | table:exc |