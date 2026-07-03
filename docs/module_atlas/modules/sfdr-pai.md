# Sfdr Pai
**Module ID:** `sfdr-pai` · **Route:** `/sfdr-pai` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_INDICATORS`, `API`, `Alert`, `Badge`, `Btn`, `Card`, `DEFAULT_HOLDINGS`, `DNSH_OBJECTIVES`, `Inp`, `KpiCard`, `OIL_GAS_TICKERS`, `PAI_CATEGORIES`, `SectionHeader`, `Sel`, `TABS`, `TabBar`, `TabCalculator`, `TabComparison`, `TabDnsh`, `TabReference`, `TabStatement`, `Table`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8000';` |
| `ALL_INDICATORS` | `PAI_CATEGORIES.flatMap(c => c.indicators.map(i => ({ ...i, category: c.key, catColor: c.color })));` |
| `_CDP_PAI` | `Object.fromEntries((CDP_COMPANY_EMISSIONS\|\|[]).map(c=>[c.name?.toLowerCase(),c]));` |
| `scope1_2` | `(cdp.scope1_2_total_mtco2e\|\|0)*1e6; // tCO2e` |
| `revenue` | `(cdp.revenue_usd_bn\|\|1)*1e3; // USD Mn` |
| `totalAUM` | `holdings.reduce((s,h) => s + h.marketValue, 0);` |
| `safeTotalAUM` | `totalAUM \|\| 1; // guard: prevents Infinity/NaN when all holdings removed` |
| `wSum` | `(field) => holdings.reduce((s,h) => s + h[field] * (h.marketValue/safeTotalAUM), 0);` |
| `totalGHG` | `holdings.reduce((s,h) => s + h.scope1+h.scope2+h.scope3, 0);` |
| `total` | `arr.reduce((s,h) => s + h.marketValue, 0);` |
| `res` | `await api('/calculate-all', body);` |
| `body` | `{ objectives: checks.map(c => ({ objective_id:c.id, label:c.label, pass:c.pass, evidence:c.evidence })) };` |
| `res` | `await api('/dnsh', body);` |
| `res` | `await api('/pai-statement', body);` |
| `blob` | `new Blob([statement.statement], { type:'text/plain' });` |
| `res` | `await api('/compare-periods', body);` |
| `rows` | `MOCK_P1.map((p1, i) => {` |
| `change` | `p1.value !== 0 ? ((p2.value - p1.value)/p1.value*100) : (p2.value > 0 ? 100 : 0);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/sfdr-pai/calculate` | `calculate_pai` | api/v1/routes/sfdr_pai.py |
| POST | `/api/v1/sfdr-pai/calculate-all` | `calculate_all_mandatory` | api/v1/routes/sfdr_pai.py |
| POST | `/api/v1/sfdr-pai/calculate-additional` | `calculate_additional` | api/v1/routes/sfdr_pai.py |
| POST | `/api/v1/sfdr-pai/dnsh` | `assess_dnsh` | api/v1/routes/sfdr_pai.py |
| POST | `/api/v1/sfdr-pai/pai-statement` | `generate_pai_statement` | api/v1/routes/sfdr_pai.py |
| POST | `/api/v1/sfdr-pai/compare-periods` | `compare_reporting_periods` | api/v1/routes/sfdr_pai.py |
| POST | `/api/v1/sfdr-pai/classify-entity` | `classify_entity` | api/v1/routes/sfdr_pai.py |
| POST | `/api/v1/sfdr-pai/benchmark` | `benchmark_against_peers` | api/v1/routes/sfdr_pai.py |
| POST | `/api/v1/sfdr-pai/data-coverage` | `assess_data_coverage` | api/v1/routes/sfdr_pai.py |
| GET | `/api/v1/sfdr-pai/ref/mandatory-indicators` | `ref_mandatory_indicators` | api/v1/routes/sfdr_pai.py |
| GET | `/api/v1/sfdr-pai/ref/additional-indicators` | `ref_additional_indicators` | api/v1/routes/sfdr_pai.py |
| GET | `/api/v1/sfdr-pai/ref/calculation-methods` | `ref_calculation_methods` | api/v1/routes/sfdr_pai.py |
| GET | `/api/v1/sfdr-pai/ref/entity-classifications` | `ref_entity_classifications` | api/v1/routes/sfdr_pai.py |
| GET | `/api/v1/sfdr-pai/ref/disclosure-requirements` | `ref_disclosure_requirements` | api/v1/routes/sfdr_pai.py |
| GET | `/api/v1/sfdr-pai/ref/sector-benchmarks` | `ref_sector_benchmarks` | api/v1/routes/sfdr_pai.py |

### 2.3 Engine `sfdr_pai_engine` (services/sfdr_pai_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `SFDRPAIEngine.calculate_pai` | portfolio_holdings, pai_indicator_id | Calculate a single PAI indicator across a portfolio. |
| `SFDRPAIEngine.calculate_all_mandatory_pais` | portfolio_holdings | Calculate all 18 mandatory PAI indicators. |
| `SFDRPAIEngine.calculate_additional_pais` | portfolio_holdings, selected_indicators | Calculate selected additional PAI indicators from Tables 2 and 3. |
| `SFDRPAIEngine.assess_do_no_significant_harm` | holding, taxonomy_objective | Assess Do No Significant Harm for a holding against a taxonomy objective. |
| `SFDRPAIEngine.calculate_portfolio_pai_statement` | portfolio_holdings, reporting_period, entity_name, lei | Produce a full PAI statement structure per Article 4 RTS. |
| `SFDRPAIEngine.compare_reporting_periods` | current_pais, previous_pais | Compare PAI values between two reporting periods. |
| `SFDRPAIEngine.generate_pai_disclosure` | pai_statement | Generate structured PAI disclosure document per Article 4 RTS. |
| `SFDRPAIEngine.assess_data_coverage` | portfolio_holdings | Assess data availability and gaps across all mandatory PAI indicators. |
| `SFDRPAIEngine.classify_entity` | entity_config | Classify a financial product under SFDR Article 6, 8, or 9. |
| `SFDRPAIEngine.benchmark_against_peers` | pai_values, peer_group | Benchmark PAI values against sector peer averages. |
| `SFDRPAIEngine._calc_sum` | holdings, pai_id, total_value | Attribution-factor-based summation (PAI 1). |
| `SFDRPAIEngine._calc_ratio` | holdings, pai_id, total_value | Per-million-invested ratio (PAI 2, 8, 9). |
| `SFDRPAIEngine._calc_exposure_share` | holdings, pai_id, total_value | Exposure-share percentage (PAI 4, 7, 10, 11, 14, 16, 17, 18). |
| `SFDRPAIEngine._calc_weighted_average` | holdings, pai_id, total_value | Weighted-average calculation (PAI 3, 5, 6, 12, 13, 15). |
| `SFDRPAIEngine._count_covered` | holdings, pai_id | Count holdings with at least one data point for the given PAI. |
| `SFDRPAIEngine._assess_indicator_data_quality` | holdings, pai_id, coverage | Score data quality 0-100 based on coverage, source type, and recency. |
| `SFDRPAIEngine._get_dnsh_threshold` | pai_id | Return a DNSH threshold for the given PAI indicator. |
| `SFDRPAIEngine._extract_holding_pai_value` | holding, pai_id | Extract the relevant metric value from a holding for a PAI check. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `ADDITIONAL_INDICATORS`, `ART_CLASSIFICATIONS`, `CALC_METHODS`, `DISCLOSURE_SECTIONS`, `DNSH_OBJECTIVES`, `MOCK_P1`, `MOCK_P2`, `PAI_CATEGORIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/sfdr-pai/ref/additional-indicators** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['add_env_1', 'add_env_2', 'add_env_3', 'add_env_4', 'add_env_5', 'add_env_6', 'add_env_7', 'add_env_8', 'add_env_9', 'add_env_10', 'add_env_11', 'add_env_12', 'add_env_13', 'add_env_14', 'add_`

**GET /api/v1/sfdr-pai/ref/calculation-methods** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['pai_1', 'pai_2', 'pai_3', 'pai_4', 'pai_5', 'pai_6', 'pai_7', 'pai_8', 'pai_9', 'pai_10', 'pai_11', 'pai_12', 'pai_13', 'pai_14', 'pai_15', 'pai_16', 'pai_17', 'pai_18'], 'n_keys': 18}`

**GET /api/v1/sfdr-pai/ref/disclosure-requirements** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 7, 'item0_keys': ['section', 'title', 'description']}`

**GET /api/v1/sfdr-pai/ref/entity-classifications** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['article_6', 'article_8', 'article_9'], 'n_keys': 3}`

**GET /api/v1/sfdr-pai/ref/mandatory-indicators** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['pai_1', 'pai_2', 'pai_3', 'pai_4', 'pai_5', 'pai_6', 'pai_7', 'pai_8', 'pai_9', 'pai_10', 'pai_11', 'pai_12', 'pai_13', 'pai_14', 'pai_15', 'pai_16', 'pai_17', 'pai_18'], 'n_keys': 18}`

## 5 · Intermediate Transformation Logic

**Engine `sfdr_pai_engine` — extracted transformation lines:**
```python
coverage = covered / total_h if total_h > 0 else 0.0
coverage = covered / total_h if total_h > 0 else 0.0
data_quality_score=round(min(coverage * 100, 100.0), 2),
score = (passes / total_assessed * 100) if total_assessed > 0 else 0.0
all_ids = set(list(current_pais.keys()) + list(previous_pais.keys()))
delta = curr_val - prev_val
pct_change = (delta / prev_val * 100) if prev_val != 0 else 0.0
ratio = portfolio_val / bench_val
ratio = portfolio_val / bench_val
af = inv_val / evic
af = inv_val / evic
total_m = total_value / 1_000_000.0
intensity = (num / denom) if denom > 0 else 0.0
score = coverage * 60  # 60% weight on coverage
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).
**Shared engines (edits propagate!):** `sfdr_pai_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `sfdr-pai-dashboard` | engine:sfdr_pai_engine |