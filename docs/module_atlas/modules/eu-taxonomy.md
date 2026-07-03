# EU Taxonomy Alignment
**Module ID:** `eu-taxonomy` · **Route:** `/eu-taxonomy` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
EU Taxonomy Regulation alignment engine screening investments against 6 environmental objectives. Covers substantial contribution criteria, DNSH assessment, minimum social safeguards, and green asset ratio calculation.

> **Business value:** Enables regulatory disclosure of taxonomy alignment for EU Taxonomy reporting under CSRD and Pillar 3. Identifies which assets qualify as "green" under EU law and quantifies the Green Asset Ratio required for large bank disclosures from 2024.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `ActivityTab`, `Badge`, `Btn`, `Card`, `Chk`, `DEFAULT_PORTFOLIO`, `EntityTab`, `Inp`, `KpiCard`, `NACE_OPTIONS`, `OBJ_COLORS`, `OBJ_KEYS`, `OBJ_LABELS`, `PortfolioTab`, `ReferenceTab`, `Row`, `SECTOR_OPTIONS`, `Section`, `Sel`, `TABS`, `TimelineTab`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8000';` |
| `seededRandom` | `(seed) => { let x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };` |
| `objScores` | `OBJ_KEYS.map((k, i) => ({ key: k, label: OBJ_LABELS[i], score: Math.round(r(i + 1) * 40 + 40) }));` |
| `targetIdx` | `Math.floor(r(7) * 6);` |
| `dnshResults` | `OBJ_KEYS.map((k, i) => ({` |
| `totalRev` | `activities.reduce((s, a) => s + a.revenue, 0) \|\| 1;` |
| `totalCapex` | `activities.reduce((s, a) => s + a.capex, 0) \|\| 1;` |
| `totalOpex` | `activities.reduce((s, a) => s + a.opex, 0) \|\| 1;` |
| `alignedRev` | `activities.filter(a => a.aligned).reduce((s, a) => s + a.revenue, 0);` |
| `eligibleRev` | `activities.filter(a => a.eligible).reduce((s, a) => s + a.revenue, 0);` |
| `alignedCapex` | `activities.filter(a => a.aligned).reduce((s, a) => s + a.capex, 0);` |
| `eligibleCapex` | `activities.filter(a => a.eligible).reduce((s, a) => s + a.capex, 0);` |
| `alignedOpex` | `activities.filter(a => a.aligned).reduce((s, a) => s + a.opex, 0);` |
| `eligibleOpex` | `activities.filter(a => a.eligible).reduce((s, a) => s + a.opex, 0);` |
| `assess` | `() => setResult(genActivityResult(form.name, form.nace, form.sector, form.revenue, form.capex, form.opex, hashStr(form.name + form.nace)));` |
| `updateActivity` | `(idx, k, v) => setActivities(p => p.map((a, i) => i === idx ? { ...a, [k]: v } : a));` |
| `assessed` | `activities.map(a => genActivityResult(a.name, a.nace, a.sector, a.revenue, a.capex, a.opex, hashStr(entityName + a.name + a.nace)));` |
| `updateHolding` | `(idx, k, v) => setHoldings(p => p.map((h, i) => i === idx ? { ...h, [k]: k === 'weight' \|\| k === 'revenue' \|\| k === 'capex' \|\| k === 'opex' ? parseFlo` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/eu-taxonomy/assess-activity` | `assess_activity` | api/v1/routes/eu_taxonomy.py |
| POST | `/api/v1/eu-taxonomy/assess-entity` | `assess_entity` | api/v1/routes/eu_taxonomy.py |
| POST | `/api/v1/eu-taxonomy/assess-portfolio` | `assess_portfolio` | api/v1/routes/eu_taxonomy.py |
| GET | `/api/v1/eu-taxonomy/ref/objectives` | `ref_objectives` | api/v1/routes/eu_taxonomy.py |
| GET | `/api/v1/eu-taxonomy/ref/nace-activities` | `ref_nace_activities` | api/v1/routes/eu_taxonomy.py |
| GET | `/api/v1/eu-taxonomy/ref/dnsh-matrix` | `ref_dnsh_matrix` | api/v1/routes/eu_taxonomy.py |
| GET | `/api/v1/eu-taxonomy/ref/minimum-safeguards` | `ref_minimum_safeguards` | api/v1/routes/eu_taxonomy.py |
| GET | `/api/v1/eu-taxonomy/ref/kpi-definitions` | `ref_kpi_definitions` | api/v1/routes/eu_taxonomy.py |
| GET | `/api/v1/eu-taxonomy/ref/transitional-activities` | `ref_transitional_activities` | api/v1/routes/eu_taxonomy.py |
| GET | `/api/v1/eu-taxonomy/ref/enabling-activities` | `ref_enabling_activities` | api/v1/routes/eu_taxonomy.py |
| GET | `/api/v1/eu-taxonomy/ref/cross-framework` | `ref_cross_framework` | api/v1/routes/eu_taxonomy.py |
| GET | `/api/v1/eu-taxonomy/ref/financial-kpis` | `ref_financial_kpis` | api/v1/routes/eu_taxonomy.py |
| GET | `/api/v1/eu-taxonomy/ref/sector-thresholds` | `ref_sector_thresholds` | api/v1/routes/eu_taxonomy.py |

### 2.3 Engine `eu_taxonomy_engine` (services/eu_taxonomy_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `EUTaxonomyEngine._find_activity` | nace_code | Look up NACE activity by code. |
| `EUTaxonomyEngine.assess_activity` | nace_code, objective, evidence_data | Assess a single NACE activity against one environmental objective. |
| `EUTaxonomyEngine._evaluate_substantial_contribution` | activity, objective, evidence | Evaluate substantial contribution against TSC thresholds. |
| `EUTaxonomyEngine._evaluate_dnsh` | sc_objective, evidence | Evaluate DNSH for all other 5 objectives. |
| `EUTaxonomyEngine._evaluate_minimum_safeguards` | evidence | Evaluate Article 18 minimum safeguards. |
| `EUTaxonomyEngine.assess_entity` | entity_name, reporting_year, activities_data, financials | Full entity-level taxonomy alignment assessment. |
| `EUTaxonomyEngine.assess_portfolio` | portfolio_id, portfolio_name, investees_data | Portfolio-level taxonomy alignment for financial institutions. |
| `EUTaxonomyEngine.get_environmental_objectives` |  | 6 Environmental Objectives per Article 9. |
| `EUTaxonomyEngine.get_nace_activities` |  | All NACE activities across 4 Delegated Acts. |
| `EUTaxonomyEngine.get_tsc_for_activity` | nace_code, objective | Get Technical Screening Criteria for a specific activity/objective pair. |
| `EUTaxonomyEngine.get_dnsh_matrix` |  | 6x6 DNSH cross-check matrix. |
| `EUTaxonomyEngine.get_minimum_safeguards` |  | Article 18 Minimum Safeguards. |
| `EUTaxonomyEngine.get_kpi_definitions` |  | Turnover/CapEx/OpEx KPI definitions per DR 2021/2178. |
| `EUTaxonomyEngine.get_transitional_activities` |  | Transitional activities per Article 10(2). |
| `EUTaxonomyEngine.get_enabling_activities` |  | Enabling activities per Article 10(1). |
| `EUTaxonomyEngine.get_cross_framework_map` |  | Cross-framework mapping: Taxonomy -> CSRD/SFDR/ISSB/GRI/CDP/TCFD. |
| `EUTaxonomyEngine.get_financial_kpi_definitions` |  | GAR, BTAR, insurance and asset manager KPI definitions. |
| `EUTaxonomyEngine.get_sector_thresholds` |  | Key quantitative thresholds by sector from all Delegated Acts. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `Climate` *(shared)*, `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `DEFAULT_PORTFOLIO`, `NACE_OPTIONS`, `OBJ_KEYS`, `OBJ_LABELS`, `SECTOR_OPTIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| 6 Env. Objectives | — | EU Taxonomy | Climate mitigation, adaptation, water, circular economy, pollution, biodiversity |
| Green Asset Ratio | `Aligned / Total covered assets` | ESRS | KPI for banks and large corporates |
| DNSH Score | — | Delegated Act | Do No Significant Harm across all 5 remaining objectives |
- **NACE activity codes** → Eligibility screening → **Taxonomy alignment %**
- **Financial statements** → DNSH criteria check → **Green Asset Ratio**
- **Social safeguards audit** → MSS verification → **Taxonomy-aligned label**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/eu-taxonomy/ref/cross-framework** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['cross_framework_map'], 'n_keys': 1}`

**GET /api/v1/eu-taxonomy/ref/dnsh-matrix** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['dnsh_matrix'], 'n_keys': 1}`

**GET /api/v1/eu-taxonomy/ref/enabling-activities** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['enabling_activities'], 'n_keys': 1}`

**GET /api/v1/eu-taxonomy/ref/financial-kpis** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['financial_kpi_definitions'], 'n_keys': 1}`

**GET /api/v1/eu-taxonomy/ref/kpi-definitions** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['kpi_definitions'], 'n_keys': 1}`

## 5 · Intermediate Transformation Logic
**Methodology:** EU Taxonomy 3-step eligibility
**Headline formula:** `GAR = Taxonomy_aligned_assets / Total_covered_assets; Contribution = SC ∩ DNSH ∩ MSS`
**Standards:** ['EU Taxonomy Regulation (EU) 2020/852', 'Delegated Acts 2021/2139']

**Engine `eu_taxonomy_engine` — extracted transformation lines:**
```python
score = min(100.0, (actual_value / max(threshold, 0.001)) * 100) if threshold > 0 else (100.0 if actual_value > 0 else 0.0)
score = max(0.0, min(100.0, (1.0 - actual_value / threshold) * 100))
score = min(100.0, provided * 25.0)
area_score = (present / max(len(indicators), 1)) * 100
final_score = total_score / max(total_weight, 0.001)
result.turnover_alignment_pct = round((aligned_turnover / total_t) * 100, 2)
result.capex_alignment_pct = round((aligned_capex / total_c) * 100, 2)
result.opex_alignment_pct = round((aligned_opex / total_o) * 100, 2)
result.transitional_share_pct = round((transitional_turnover / max(aligned_turnover, 0.001)) * 100, 2) if aligned_turnover > 0 else 0.0
result.enabling_share_pct = round((enabling_turnover / max(aligned_turnover, 0.001)) * 100, 2) if aligned_turnover > 0 else 0.0
inv_aligned_share = entity_result.turnover_alignment_pct / 100.0
result.green_asset_ratio = round((aligned_exposure / total_exp) * 100, 2)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).
**Shared engines (edits propagate!):** `eu_taxonomy_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `eu-taxonomy-engine` | engine:eu_taxonomy_engine, table:Climate |