# Social Taxonomy
**Module ID:** `social-taxonomy` · **Route:** `/social-taxonomy` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
EU social taxonomy alignment analytics mapping company activities to adequate wages, access to essential services, inclusive employment and fair working conditions criteria.

> **Business value:** Assesses portfolio company alignment with the EU social taxonomy framework across adequate wages, inclusion and access criteria.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACTIVITIES`, `BONDS`, `KpiCard`, `PROGRESS`, `REGIONS`, `SOCIAL_OBJECTIVES`, `TABS`, `YEARS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['EU','UK','US','Asia-Pacific','Emerging Markets','Nordic','Switzerland'];` |
| `PROGRESS` | `YEARS => YEARS.map((yr, i) => ({` |
| `objBarData` | `useMemo(() => SOCIAL_OBJECTIVES.map(o => ({` |
| `bondData` | `useMemo(() => BONDS.slice(0, 10).map(b => ({` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/social-taxonomy/assess` | `assess` | api/v1/routes/social_taxonomy.py |
| POST | `/api/v1/social-taxonomy/hrdd` | `hrdd` | api/v1/routes/social_taxonomy.py |
| POST | `/api/v1/social-taxonomy/supply-chain-screen` | `supply_chain_screen` | api/v1/routes/social_taxonomy.py |
| GET | `/api/v1/social-taxonomy/ref/eu-social-taxonomy` | `ref_eu_social_taxonomy` | api/v1/routes/social_taxonomy.py |
| GET | `/api/v1/social-taxonomy/ref/ilo-conventions` | `ref_ilo_conventions` | api/v1/routes/social_taxonomy.py |
| GET | `/api/v1/social-taxonomy/ref/decent-work` | `ref_decent_work` | api/v1/routes/social_taxonomy.py |
| GET | `/api/v1/social-taxonomy/ref/country-labour-risk` | `ref_country_labour_risk` | api/v1/routes/social_taxonomy.py |

### 2.3 Engine `social_taxonomy_engine` (services/social_taxonomy_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_score_ilo_compliance` | supplier_countries | Compute ILO compliance score for a set of supplier countries. |
| `_score_ungp_hrdd` | policy_commitment, value_chain_mapping, corrective_actions, grievance_mechanism, annual_reporting, board_oversight | Score UNGP HRDD across 6 steps. |
| `_score_social_taxonomy_objectives` | obj1_inputs, obj2_inputs, obj3_inputs | Score EU Social Taxonomy 3 objectives + DNSH checks. |
| `assess_social_taxonomy` | entity_name, nace_code, sector, country_of_operations, living_wage_compliance_pct, h_and_s_score | Full EU Social Taxonomy assessment for an entity. |
| `conduct_hrdd` | company_name, supplier_countries, supply_chain_tiers, sector, policy_commitment, salient_issues_mapped | Human Rights Due Diligence assessment per UNGP / CSDDD / OECD DDG. |
| `get_social_taxonomy_criteria` |  | Return all reference data for the EU Social Taxonomy and related frameworks. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `REGIONS`, `SOCIAL_OBJECTIVES`, `TABS`, `YEARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Activities Assessed | — | EU Social Taxonomy | Number of economic activities assessed against EU social taxonomy criteria across portfolio. |
| Avg Alignment Rate | — | Calculated | Mean social taxonomy alignment across assessed portfolio companies weighted by revenue. |
| Living Wage Coverage | — | WageIndicator | Share of employees in assessed companies earning at or above national living wage benchmarks. |
- **Company revenue data, EU social taxonomy activity list, wage data** → Activity mapping, TSC assessment, alignment calculation → **Social taxonomy alignment reports, living wage gap analysis**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/social-taxonomy/ref/country-labour-risk** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['countries_covered', 'risk_tier_definitions', 'tier_summary', 'profiles', 'cahra_countries_note'], 'n_keys': 5}`

**GET /api/v1/social-taxonomy/ref/decent-work** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'sdg_target', 'related_ilo_documents', 'indicators', 'composite_note'], 'n_keys': 5}`

**GET /api/v1/social-taxonomy/ref/eu-social-taxonomy** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'body', 'report_date', 'supplementary_report_date', 'status', 'objectives', 'dnsh_rule', 'minimum_safeguards', 'taxonomy_alignment_tiers'], 'n_keys': 9}`

**GET /api/v1/social-taxonomy/ref/ilo-conventions** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'adopted', 'body', 'core_conventions_count', 'four_categories', 'conventions', 'compliance_scoring_note'], 'n_keys': 7}`

**POST /api/v1/social-taxonomy/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Social Taxonomy Alignment
**Headline formula:** `Revenue from Socially Aligned Activities ÷ Total Revenue × 100`
**Standards:** ['EU Platform on Sustainable Finance Social Taxonomy', 'ILO Living Wage']

**Engine `social_taxonomy_engine` — extracted transformation lines:**
```python
base = ratified / 8
base = min(1.0, base + 0.10)
score = max(0.0, base - tier_penalty)
ilo_composite = weighted_sum / total_weight if total_weight > 0 else 0
composite = (s1 * 0.40) + (s2 * 0.35) + (s3 * 0.25)
risk_score = round(min(1.0, base_likelihood) * severity, 4)
oecd_score = sum(1 for v in oecd_steps.values() if v) / len(oecd_steps)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).