# SFDR PAI Dashboard
**Module ID:** `sfdr-pai-dashboard` · **Route:** `/sfdr-pai-dashboard` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
SFDR Principal Adverse Impact statement management dashboard covering all 18 mandatory and 2 additional PAI indicators with aggregation, trend tracking and disclosure generation.

> **Business value:** Provides full SFDR Annex I PAI statement management with all 18+2 indicators, trend tracking and regulator-ready output.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ART_CLASSES`, `ActionPlan`, `FUNDS`, `FUND_NAMES`, `FundComparison`, `IndicatorDrillDown`, `PAI_INDICATORS`, `PaiStatement`, `YEARS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `aum` | `+(sr(i*13+7)*8+0.5).toFixed(1);` |
| `pais` | `PAI_INDICATORS.map((pai,pi)=>{` |
| `base` | `sr(i*31+pi*7);` |
| `prev` | `sr(i*37+pi*11);` |
| `catColor` | `(c)=>c==='Climate'?T.teal:c==='Social'\|\|c==='Social/Governance'?T.red:c==='Biodiversity'?T.green:c==='Water'?'#0369a1':c==='Governance'?T.purple:T.amb` |
| `pill` | `(color,text,sm)=>({display:'inline-block',padding:sm?'1px 7px':'2px 10px',borderRadius:10,fontSize:sm?10:11,fontWeight:600,background:color+'18',color` |
| `TABS` | `['PAI Statement','Indicator Drill-Down','Fund Comparison','Action Plan'];` |
| `catGroups` | `['Climate','Social','Social/Governance','Biodiversity','Water','Waste','Governance'].map(cat=>{` |
| `avg` | `catPais.reduce((a,p,pi)=>{const fp=fund.pais.find(f=>f.id===p.id);return a+(fp?.current\|\|0);},0)/catPais.length;` |
| `delta` | `fp?+(fp.current-fp.prior).toFixed(1):0;` |
| `trend` | `YEARS.map((yr,i)=>({yr,value:+(sr(fund.id*31+PAI_INDICATORS.findIndex(p=>p.id===selPai)*7+i*11)*100+10).toFixed(1)}));` |
| `actions` | `Array.from({length:4},(_,i)=>({type:actionTypes[i],due:`2025-${String(Math.floor(sr(fund.id*53+i*7)*12)+1).padStart(2,'0')}-30`,status:['Open','In Pro` |
| `topPais` | `['PAI-1','PAI-2','PAI-3','PAI-4','PAI-10','PAI-12','PAI-13'];` |
| `compData` | `topPais.map(paiId=>{` |

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
**Frontend seed datasets:** `ART_CLASSES`, `FUND_NAMES`, `PAI_INDICATORS`, `TABS`, `YEARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| PAI Indicators | — | SFDR Annex I | Mandatory (14 climate/environment + 4 social) plus 2 additional voluntary PAI indicators tracked. |
| Coverage Rate | — | Data collection | Share of portfolio AUM with primary data for mandatory PAI indicators. |
| Worst PAI Score | — | SFDR engine | PAI indicator with highest portfolio-weighted adverse impact score in current reporting period. |
- **Issuer ESG data, portfolio weights, SFDR Annex I templates** → PAI calculation per Annex I formulas, trend analysis, data quality scoring → **SFDR PAI statement, indicator dashboards, gap reports**

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
**Methodology:** PAI Weighted Score
**Headline formula:** `Σ (PAI_i × Portfolio Weight_i)`
**Standards:** ['SFDR RTS Annex I', 'EU 2022/1288']

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
| `sfdr-pai` | engine:sfdr_pai_engine |