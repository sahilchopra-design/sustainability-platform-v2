# Green Securitisation
**Module ID:** `green-securitisation` · **Route:** `/green-securitisation` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Analyses ESG securitisation structures including green ABS, green RMBS, green CLOs, and sustainability-linked securitisation tranches. Provides use-of-proceeds verification, green tranche isolation analytics, and regulatory alignment with EU Securitisation Regulation and EuGBS applicability to structured products.

> **Business value:** Supports structured credit investors and originators in verifying green tranche use-of-proceeds integrity, quantifying the greenium in ESG securitisation, and meeting EU Securitisation Regulation and ICMA Green Bond Principles disclosure requirements for labelled structured products.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `Badge`, `Btn`, `DEAL_TYPES`, `Inp`, `KpiCard`, `NGFS_SCENARIOS`, `PIE_COLORS_EPC`, `Row`, `Section`, `Sel`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `TABS` | `['Deal Structure', 'EU GBS Compliance', 'Climate Risk Pass-Through', 'RMBS / ABS Analytics', 'Green Securitisation Overview'];` |
| `gbsScore` | `Math.round(gbsRequirements.reduce((s, r) => s + r.score, 0) / gbsRequirements.length);` |
| `dealScore` | `Math.round(seed(91) * 20 + 72);` |
| `greenium` | `Math.round(seed(92) * 10 + 8);` |
| `avgCrremAlignment` | `crremData[crremData.length - 2].alignment;` |
| `avgPhysicalVar` | `(climateRiskData.reduce((s, r) => s + r.physicalVar, 0) / climateRiskData.length).toFixed(1);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/green-securitisation/eu-gbs-compliance` | `eu_gbs_compliance` | api/v1/routes/green_securitisation.py |
| POST | `/api/v1/green-securitisation/rmbs-epc-analysis` | `rmbs_epc_analysis` | api/v1/routes/green_securitisation.py |
| POST | `/api/v1/green-securitisation/covered-bond-esv` | `covered_bond_esv` | api/v1/routes/green_securitisation.py |
| POST | `/api/v1/green-securitisation/green-tranche-design` | `green_tranche_design` | api/v1/routes/green_securitisation.py |
| POST | `/api/v1/green-securitisation/full-assessment` | `full_assessment` | api/v1/routes/green_securitisation.py |
| GET | `/api/v1/green-securitisation/ref/structure-types` | `ref_structure_types` | api/v1/routes/green_securitisation.py |
| GET | `/api/v1/green-securitisation/ref/eu-gbs-requirements` | `ref_eu_gbs_requirements` | api/v1/routes/green_securitisation.py |
| GET | `/api/v1/green-securitisation/ref/greenium-benchmarks` | `ref_greenium_benchmarks` | api/v1/routes/green_securitisation.py |
| GET | `/api/v1/green-securitisation/ref/climate-risk-profiles` | `ref_climate_risk_profiles` | api/v1/routes/green_securitisation.py |
| GET | `/api/v1/green-securitisation/ref/tranche-standards` | `ref_tranche_standards` | api/v1/routes/green_securitisation.py |
| GET | `/api/v1/green-securitisation/ref/ngfs-scenarios` | `ref_ngfs_scenarios` | api/v1/routes/green_securitisation.py |

### 2.3 Engine `green_securitisation_engine` (services/green_securitisation_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `GreenSecuritisationEngine.assess_eu_gbs_compliance` | deal_data | Assess deal compliance with EU Green Bond Standard (EU) 2023/2631 Art 19. |
| `GreenSecuritisationEngine.compute_climate_var_passthrough` | pool_assets, ngfs_scenario, time_horizon_years | Compute climate VaR for a pool of securitised assets under an NGFS scenario. |
| `GreenSecuritisationEngine.assess_rmbs_epc` | mortgage_pool | Assess RMBS pool EPC distribution, CRREM alignment, and energy efficiency metrics. |
| `GreenSecuritisationEngine.assess_covered_bond_esv` | bond_data | Assess ECBC Covered Bond Label eligibility and ESV (Environmental Sustainability Value) score. |
| `GreenSecuritisationEngine.design_green_tranche_structure` | pool_data, target_rating, green_target_pct | Design green tranche structure with subordination levels and greenium estimate. |
| `GreenSecuritisationEngine.run_full_assessment` | entity_id, deal_data | Orchestrate all 5 sub-assessments and compute green_securitisation_score. |
| `GreenSecuritisationEngine.ref_structure_types` |  |  |
| `GreenSecuritisationEngine.ref_eu_gbs_requirements` |  |  |
| `GreenSecuritisationEngine.ref_greenium_benchmarks` |  |  |
| `GreenSecuritisationEngine.ref_climate_risk_profiles` |  |  |
| `GreenSecuritisationEngine.ref_tranche_standards` |  |  |
| `GreenSecuritisationEngine.ref_ngfs_scenarios` |  |  |
| `get_engine` |  | Return a module-level singleton engine. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pool`, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `DEAL_TYPES`, `NGFS_SCENARIOS`, `PIE_COLORS_EPC`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Green Pool Proportion (%) | — | Deal prospectus / SPV report | Share of ABS collateral pool assets meeting green eligibility criteria; must exceed green tranche size to sati |
| Weighted Average Green Score | — | CBI / ICMA criteria | Composite green quality score across pool assets weighted by balance; reflects alignment with taxonomy-based g |
| Green Tranche Greenium (bps) | — | Market pricing data | Yield spread differential between green and conventional tranches of same seniority within the structure; larg |
| EU Taxonomy Alignment (%) | — | EU Taxonomy Delegated Act | Percentage of collateral assets meeting EU Taxonomy technical screening criteria for substantial contribution  |
- **Collateral pool data (loan/asset level)** → Apply green eligibility criteria, compute weighted green scores → **Green pool proportion and asset-level green flags**
- **Deal waterfall and tranche structure** → Allocate green cash flows to green tranche, verify over-collateralisation → **Green tranche isolation analysis**
- **Market pricing for comparable tranches** → Compute Z-spread differential between green and conventional tranches → **Greenium by tranche in basis points**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/green-securitisation/ref/climate-risk-profiles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'climate_risk_profiles'], 'n_keys': 2}`

**GET /api/v1/green-securitisation/ref/eu-gbs-requirements** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'eu_gbs_requirements', 'regulation', 'entry_into_force'], 'n_keys': 4}`

**GET /api/v1/green-securitisation/ref/greenium-benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'greenium_benchmarks', 'unit'], 'n_keys': 3}`

**GET /api/v1/green-securitisation/ref/ngfs-scenarios** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'ngfs_scenarios', 'version'], 'n_keys': 3}`

**GET /api/v1/green-securitisation/ref/structure-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'structure_types'], 'n_keys': 2}`

## 5 · Intermediate Transformation Logic
**Methodology:** Green Tranche Isolation
**Headline formula:** `GreenCF_tranche = Σ_i (w_i × GreenAsset_i × CollateralCF_i) / TranchePrincipal`
**Standards:** ['EU Securitisation Regulation (2019)', 'ICMA Green Bond Principles â€” Securitisation Supplement', 'CBI Securitisation Criteria']

**Engine `green_securitisation_engine` — extracted transformation lines:**
```python
horizon_factor = math.sqrt(time_horizon_years / 10.0)
phys_contribution = balance * phys_sens * phys_mult * horizon_factor * 0.10
trans_contribution = balance * max(0, trans_sens) * trans_mult * horizon_factor * 0.08
pd_uplift = base_pd * (phys_sens * phys_mult * 0.25 + max(0, trans_sens) * trans_mult * 0.30)
lgd_uplift = base_lgd * phys_sens * phys_mult * 0.10
climate_pd = min(1.0, base_pd + pd_uplift * (time_horizon_years / 10.0))
climate_lgd = min(1.0, base_lgd + lgd_uplift * (time_horizon_years / 10.0))
weight = balance / total_exposure
total_climate_var_m = physical_var_m + transition_var_m
var_as_pct_pool = (total_climate_var_m / total_exposure) * 100
ce_uplift_pct = min(5.0, var_as_pct_pool * 0.20)
ce_recommended_pct = round((ce_base * 100) + ce_uplift_pct, 2)
epc_dist = {k: v / total_epc * 100 for k, v in epc_dist.items()}
epc_a_b_pct = epc_a_pct + epc_b_pct
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).