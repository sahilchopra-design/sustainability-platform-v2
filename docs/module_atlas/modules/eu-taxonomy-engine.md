# EU Taxonomy Engine
**Module ID:** `eu-taxonomy-engine` · **Route:** `/eu-taxonomy-engine` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Advanced EU Taxonomy calculation engine with sector-specific technical screening criteria, capex/opex/turnover splits, and enabling/transitional activity classification.

> **Business value:** Provides the granular calculation engine underpinning EU Taxonomy KPI reporting. Enables companies to move beyond eligibility to actual alignment by applying technical screening criteria to each economic activity.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `Card`, `Check`, `EU_TAXONOMY`, `EmptyState`, `EuTaxonomyEnginePage`, `KpiCard`, `SECTOR_MAP`, `SortHeader`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `fmt` | `(n, d = 1) => n == null ? '--' : Number(n).toFixed(d);` |
| `fmtPct` | `(n) => n == null ? '--' : Number(n).toFixed(1) + '%';` |
| `fmtMn` | `(n) => n == null ? '--' : '$' + Number(n).toFixed(0) + 'M';` |
| `esgScore` | `company.esg_score != null ? company.esg_score : 30 + s * 50;` |
| `ghgInt` | `company.ghg_intensity_tco2e_per_mn != null ? company.ghg_intensity_tco2e_per_mn : 50 + s * 400;` |
| `assessments` | `eligibleActivities.map((activity, idx) => {` |
| `dnsh_met` | `esgScore > 45 + s2 * 10;` |
| `safeguards_met` | `esgScore > 38 + s2 * 8;` |
| `alignedRevenuePct` | `anyAligned ? Math.min(100, (esgScore / 100) * 75 + (sbti ? 20 : 0) + s * 5) : (s > 0.7 ? s * 12 : 0);` |
| `dnshScore` | `assessments.filter(a => a.dnsh_met).length / Math.max(1, assessments.length) * 100;` |
| `safeguardsScore` | `assessments.filter(a => a.safeguards_met).length / Math.max(1, assessments.length) * 100;` |
| `revenue` | `c.revenue_usd_mn \|\| (c.revenue_inr_cr ? c.revenue_inr_cr * 0.12 : 500);` |
| `weight` | `c.weight \|\| (1 / (portfolio.length \|\| 1)) * 100;` |
| `eligiblePct` | `(eligibleCount / total * 100).toFixed(1);` |
| `weightedAligned` | `assessedHoldings.reduce((s, h) => s + h.alignedRevenuePct * (h.weight / 100), 0);` |
| `alignedRevenueTotal` | `assessedHoldings.reduce((s, h) => s + h.alignedRevenue, 0);` |
| `eligibleActivitiesTotal` | `assessedHoldings.reduce((s, h) => s + h.eligibleActivities, 0);` |

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
**Provenance classes:** `computed`

**Database tables:** `Climate` *(shared)*, `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Turnover KPI | — | Taxonomy report | Revenue from taxonomy-aligned activities |
| CapEx KPI | — | Taxonomy report | Investment in taxonomy-aligned activities |
| OpEx KPI | — | Taxonomy report | O&M expenditure on aligned assets |
- **Activity revenue data** → TSC threshold comparison → **Turnover alignment %**
- **Investment plans** → CapEx taxonomy mapping → **CapEx KPI**
- **O&M budgets** → OpEx eligibility → **OpEx KPI**

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
**Methodology:** Technical Screening Criteria engine
**Headline formula:** `TaxonomyAlignment = Turnover_aligned% / Turnover_eligible%`
**Standards:** ['EU Taxonomy Delegated Acts', 'Platform Verifier TSC']

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
| `eu-taxonomy` | engine:eu_taxonomy_engine, table:Climate |