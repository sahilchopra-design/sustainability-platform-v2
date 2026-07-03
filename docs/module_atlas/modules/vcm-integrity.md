# VCM Integrity Analyser
**Module ID:** `vcm-integrity` · **Route:** `/vcm-integrity` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Voluntary Carbon Market integrity assessment tool. Covers additionality, permanence, leakage, and MRV quality for carbon credits. IC-VCM Core Carbon Principles and VCMI Claims Code evaluation.

> **Business value:** Voluntary carbon credit quality varies enormously — high-integrity credits (CCP-eligible) support credible net-zero claims, while low-quality credits enable greenwashing. The IC-VCM and VCMI frameworks are restructuring the market. This module enables due diligence before purchasing and ensures only high-integrity credits support climate claims.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `Badge`, `Btn`, `Inp`, `KpiCard`, `PIE_COLORS`, `PROJECT_TYPES`, `REGISTRIES`, `Row`, `Section`, `Sel`, `TABS`, `TIER_COLORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `seededRandom` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `composite` | `Math.round(criteria.reduce((s, c) => s + c.score, 0) / criteria.length);` |
| `price` | `Math.round((priceBase[projectType] \|\| 10) * (0.8 + r(11) * 0.6));` |
| `currentScore` | `Math.round(r(20) * 40 + 45);` |
| `barData` | `principles.map(p => ({ name: p.dimension.split(':')[0], score: p.score }));` |
| `composite` | `Math.round(principles.reduce((s, p) => s + p.score, 0) / 4);` |
| `totalVolume` | `Math.round(r(75) * 200 + 500);` |
| `seed0` | `hashStr(projectType + registry + vintage);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/vcm-integrity/assess` | `assess_credit` | api/v1/routes/vcm_integrity.py |
| POST | `/api/v1/vcm-integrity/registry-screen` | `registry_screen` | api/v1/routes/vcm_integrity.py |
| POST | `/api/v1/vcm-integrity/batch-assess` | `batch_assess` | api/v1/routes/vcm_integrity.py |
| GET | `/api/v1/vcm-integrity/ref/icvcm-criteria` | `ref_icvcm_criteria` | api/v1/routes/vcm_integrity.py |
| GET | `/api/v1/vcm-integrity/ref/vcmi-claims` | `ref_vcmi_claims` | api/v1/routes/vcm_integrity.py |
| GET | `/api/v1/vcm-integrity/ref/oxford-principles` | `ref_oxford_principles` | api/v1/routes/vcm_integrity.py |
| GET | `/api/v1/vcm-integrity/ref/price-benchmarks` | `ref_price_benchmarks` | api/v1/routes/vcm_integrity.py |
| GET | `/api/v1/vcm-integrity/ref/corsia-programmes` | `ref_corsia_programmes` | api/v1/routes/vcm_integrity.py |

### 2.3 Engine `vcm_integrity_engine` (services/vcm_integrity_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_compute_icvcm_criteria_scores` | registry, methodology, project_type, vintage_year, has_vvb_accreditation, monitoring_frequency_years | Score all 10 ICVCM CCP criteria. |
| `_derive_ccp_composite` | criteria_scores | Aggregate per-criterion results into a CCP composite score and label. |
| `_score_oxford_principles` | reduction_pct_of_portfolio, removal_pct_of_portfolio, geological_removal_pct, price_usd_t, sbti_validated | Score the 4 Oxford Offsetting Principles. |
| `_derive_vcmi_claim` | sbti_near_term, sbti_long_term, residual_emissions_pct, ccp_label_credits, has_assurance | Determine highest achievable VCMI claim tier. |
| `_determine_quality_tier` | ccp_composite, permanence_score, additionality_score | Map scores to A/B/C/D quality tier. |
| `assess_vcm_integrity` | project_id, registry, methodology, project_type, vintage_year, volume_tco2e | Full VCM integrity assessment for a single carbon credit project. |
| `_generate_recommendations` | ccp_result, quality, vcmi, art6_status | Generate actionable recommendations based on assessment results. |
| `screen_registry_entry` | registry_name, serial_number, project_type, vintage_year, volume_tco2e, retirement_status | Screen a registry entry by serial number for basic integrity checks. |
| `get_vcm_benchmarks` |  | Return all VCM price benchmark data organised by storage class. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `CORSIA`, `ICAO`, `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `PIE_COLORS`, `PROJECT_TYPES`, `REGISTRIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| CCP Assessment Areas | — | IC-VCM | Governance, emissions impact, sustainable development |
| Additionality Types | — | Methodology | Regulatory, financial, common practice additionality tests |
| Permanence Buffer | — | VCS/VCS | Buffer pool % withheld against reversal events |
- **Carbon project data** → IC-VCM CCP assessment → **Integrity score per credit**
- **Credit registry data** → Vintage and type filtering → **Eligible credit portfolio**
- **Retired credits** → VCMI claims mapping → **Net-zero claim evidence**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/vcm-integrity/ref/corsia-programmes** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'body', 'current_cycle', 'programmes', 'total_programmes', 'usage_note'], 'n_keys': 6}`

**GET /api/v1/vcm-integrity/ref/icvcm-criteria** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'body', 'total_criteria', 'pillars', 'criteria', 'ccp_label_rule'], 'n_keys': 6}`

**GET /api/v1/vcm-integrity/ref/oxford-principles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'published', 'body', 'publication', 'principles', 'composite_scoring'], 'n_keys': 6}`

**GET /api/v1/vcm-integrity/ref/price-benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['benchmarks_by_project_type', 'benchmarks_by_storage_class', 'ccp_premium_note', 'currency', 'price_basis', 'vintage_note'], 'n_keys': 6}`

**GET /api/v1/vcm-integrity/ref/vcmi-claims** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'body', 'tier_hierarchy', 'claim_tiers', 'general_requirements', 'high_integrity_credit_definition'], 'n_keys': 6}`

## 5 · Intermediate Transformation Logic
**Methodology:** IC-VCM Core Carbon Principles scoring
**Headline formula:** `IntegrityScore = Additionality(25) + Permanence(20) + MRV(20) + Leakage(15) + SDG(10) + Vintage(10)`
**Standards:** ['IC-VCM Core Carbon Principles (2023)', 'VCMI Claims Code (2023)', 'Gold Standard', 'VCS/Verra']

**Engine `vcm_integrity_engine` — extracted transformation lines:**
```python
vintage_penalty = max(0, (2015 - vintage_year) * 0.02) if vintage_year < 2015 else 0
score = base - vintage_penalty
score = base * (1 - (monitoring_frequency_years - 1) * 0.04)
score = base - vintage_penalty
score = min(1.0, score + 0.10)
composite = total_weighted / total_weight if total_weight > 0 else 0
p1 = min(1.0, p1 + 0.15)
p4 = (price_score + (0.20 if sbti_validated else 0)) / 1.0
composite = (p1 + p2 + p3 + p4) / 4
combined = (ccp_composite * 0.50) + (permanence_score * 0.25) + (additionality_score * 0.25)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).