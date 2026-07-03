# Corporate Nature Strategy
**Module ID:** `corporate-nature-strategy` · **Route:** `/corporate-nature-strategy` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Assesses corporate nature strategies against TNFD LEAP framework and SBTN corporate targets, mapping business dependencies and impacts on nature across freshwater, terrestrial, marine, and atmospheric systems. Provides gap analysis against nature-positive commitments and biodiversity target pathways.

> **Business value:** Enables sustainability strategy teams to build and disclose credible nature strategies aligned with TNFD disclosure requirements and SBTN corporate targets, responding to growing investor demand for nature-positive commitments.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ITEMS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ITEMS` | `Array.from({length:55},(_,i)=>({id:i+1,name:'Nature Strategy '+(i+1),sector:F1[Math.floor(sr(i*3)*F1.length)],region:F2[Math.floor(sr(i*7)*F2.length)]` |
| `kpis` | `useMemo(()=>{const n=filtered.length\|\|1;return[{l:'Companies',v:filtered.length},{l:'Avg Score',v:(filtered.reduce((s,x)=>s+parseFloat(x.score),0)/n).` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/corporate-nature-strategy/sbtn-steps` | `sbtn_steps` | api/v1/routes/corporate_nature_strategy.py |
| POST | `/api/v1/corporate-nature-strategy/tnfd-disclosure` | `tnfd_disclosure` | api/v1/routes/corporate_nature_strategy.py |
| POST | `/api/v1/corporate-nature-strategy/nrl-exposure` | `nrl_exposure` | api/v1/routes/corporate_nature_strategy.py |
| POST | `/api/v1/corporate-nature-strategy/encore-dependencies` | `encore_dependencies` | api/v1/routes/corporate_nature_strategy.py |
| POST | `/api/v1/corporate-nature-strategy/full-assessment` | `full_assessment` | api/v1/routes/corporate_nature_strategy.py |
| GET | `/api/v1/corporate-nature-strategy/ref/sbtn-sectors` | `ref_sbtn_sectors` | api/v1/routes/corporate_nature_strategy.py |
| GET | `/api/v1/corporate-nature-strategy/ref/tnfd-metrics` | `ref_tnfd_metrics` | api/v1/routes/corporate_nature_strategy.py |
| GET | `/api/v1/corporate-nature-strategy/ref/nrl-habitats` | `ref_nrl_habitats` | api/v1/routes/corporate_nature_strategy.py |
| GET | `/api/v1/corporate-nature-strategy/ref/encore-services` | `ref_encore_services` | api/v1/routes/corporate_nature_strategy.py |
| GET | `/api/v1/corporate-nature-strategy/ref/gbf-countries` | `ref_gbf_countries` | api/v1/routes/corporate_nature_strategy.py |
| GET | `/api/v1/corporate-nature-strategy/ref/maturity-tiers` | `ref_maturity_tiers` | api/v1/routes/corporate_nature_strategy.py |

### 2.3 Engine `corporate_nature_strategy_engine` (services/corporate_nature_strategy_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `CorporateNatureStrategyEngine.assess_sbtn_steps` | entity_id, sectors, locations, current_targets, disclosures | Score SBTN 5-step readiness (Assess/Interpret/Measure/Set/Disclose). |
| `CorporateNatureStrategyEngine.assess_tnfd_disclosure` | entity_id, governance_data, strategy_data, risk_data, metrics_data | Score TNFD v1.0 disclosure across 4 pillars and 14 core metrics. |
| `CorporateNatureStrategyEngine.assess_nrl_exposure` | entity_id, operations, supply_chain_countries | Assess EU Nature Restoration Law 2024/1991 habitat exposure. |
| `CorporateNatureStrategyEngine.assess_gbf_target3` | entity_id, portfolio_locations | Assess portfolio exposure within 30x30 protected areas per GBF Target 3. |
| `CorporateNatureStrategyEngine.assess_encore_dependencies` | entity_id, sector, operations_data | Score 21 ENCORE ecosystem service dependencies and impacts. |
| `CorporateNatureStrategyEngine.run_full_assessment` | entity_id, request_data | Orchestrate all 5 sub-assessments and compute composite nature_strategy_score. |
| `CorporateNatureStrategyEngine.ref_sbtn_sectors` |  |  |
| `CorporateNatureStrategyEngine.ref_tnfd_metrics` |  |  |
| `CorporateNatureStrategyEngine.ref_nrl_habitats` |  |  |
| `CorporateNatureStrategyEngine.ref_encore_services` |  |  |
| `CorporateNatureStrategyEngine.ref_gbf_countries` |  |  |
| `CorporateNatureStrategyEngine.ref_maturity_tiers` |  |  |
| `get_engine` |  | Return a module-level singleton engine. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Nature Dependency Score | — | TNFD LEAP / ENCORE | Composite score of business dependency on ecosystem services across value chain |
| Biodiversity Footprint | — | GLOBIO/IBAT | Mean Species Abundance impact area in km², measuring terrestrial biodiversity footprint |
| High-Value Biodiversity Sites | — | KBA Database / IBAT | Number of Key Biodiversity Areas within 50km of company operational sites |
| SBTN Target Gap | — | SBTN Framework | Gap between current nature impact trajectory and science-based nature target by 2030 |
| Ecosystem Service Dependency | — | ENCORE Tool | Proportion of business revenue dependent on high-to-very-high ecosystem service sensitivity |
- **IBAT / KBA database** → Match operational sites to biodiversity sensitivity and KBA proximity → **Site-level biodiversity exposure scores**
- **ENCORE ecosystem service tool** → Map business activities to ecosystem service dependencies by sector → **Dependency scores per business segment**
- **SBTN target pathways** → Compare impact trajectory to sector-specific targets, compute gap → **SBTN target gap % and nature strategy alignment score**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/corporate-nature-strategy/ref/encore-services** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'encore_services', 'total_services', 'source'], 'n_keys': 4}`

**GET /api/v1/corporate-nature-strategy/ref/gbf-countries** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'gbf_target3_countries', 'total_countries', 'target'], 'n_keys': 4}`

**GET /api/v1/corporate-nature-strategy/ref/maturity-tiers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'maturity_tiers'], 'n_keys': 2}`

**GET /api/v1/corporate-nature-strategy/ref/nrl-habitats** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'nrl_habitats', 'regulation'], 'n_keys': 3}`

**GET /api/v1/corporate-nature-strategy/ref/sbtn-sectors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'sbtn_sector_impact_map'], 'n_keys': 2}`

## 5 · Intermediate Transformation Logic
**Methodology:** TNFD LEAP Nature Risk Assessment
**Headline formula:** `Nature_exposure = Σ_i (Dependency_i × Ecosystem_condition_i × Location_sensitivity_i)`
**Standards:** ['TNFD v1.0 2023', 'SBTN Corporate Targets 2023', 'IPBES Global Assessment']

**Engine `corporate_nature_strategy_engine` — extracted transformation lines:**
```python
area_km2 = area_ha / 100.0
mandatory_score = (mandatory_met / mandatory_total * 80) if mandatory_total > 0 else 0
optional_score = (optional_met / optional_total * 20) if optional_total > 0 else 20
pillar_scores[pillar] = round(mandatory_score + optional_score, 1)
composite_score = round(sum(pillar_scores.values()) / len(pillar_scores), 1)
liability_ha = area_ha * degradation_assumed * restoration_pct_2030
estimated_financial_liability_eur = total_restoration_liability_ha * restoration_cost_per_ha
in_protected = exposure_m * (protected_pct / 100.0)
portfolio_protected_pct = (in_protected_zone_m / total_exposure_m * 100) if total_exposure_m > 0 else 0
gbf_score = round(100 - (risk_countries_count / total_countries * 40), 1) if total_countries > 0 else 100
base_dependency = min(100, base_dependency * 1.8)
impact_score = round(min(100, dependency_score * (1.5 if is_affected else 0.4)), 1)
mid_val_usd_ha_yr = (low_val + high_val) / 2.0
financial_exposure_m = (operational_area_ha * mid_val_usd_ha_yr / 1_000_000.0) * (dependency_score / 100.0)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).