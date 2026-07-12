# SFDR PAI Dashboard
**Module ID:** `sfdr-pai-dashboard` · **Route:** `/sfdr-pai-dashboard` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
SFDR Principal Adverse Impact statement management dashboard covering all 18 mandatory and 2 additional PAI indicators with aggregation, trend tracking and disclosure generation.

> **Business value:** Provides full SFDR Annex I PAI statement management with all 18+2 indicators, trend tracking and regulator-ready output.

**How an analyst works this module:**
- Collect raw data for all 18 mandatory PAI indicators from issuers and data providers.
- Compute portfolio-weighted PAI values using reference date AUM and SFDR Annex I formulas.
- Track year-on-year trends and flag material increases requiring explanation.
- Generate SFDR Annex I-compliant PAI statement tables for website and regulatory submission.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ART_CLASSES`, `ActionPlan`, `FUNDS`, `FUND_NAMES`, `FundComparison`, `IndicatorDrillDown`, `PAI_INDICATORS`, `PaiStatement`, `YEARS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `PAI_INDICATORS` | 19 | `id`, `name`, `metric`, `unit`, `category`, `table`, `assetClass` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `aum` | `+(sr(i*13+7)*8+0.5).toFixed(1);` |
| `pais` | `PAI_INDICATORS.map((pai,pi)=>{` |
| `base` | `sr(i*31+pi*7);` |
| `prev` | `sr(i*37+pi*11);` |
| `catColor` | `(c)=>c==='Climate'?T.teal:c==='Social'\|\|c==='Social/Governance'?T.red:c==='Biodiversity'?T.green:c==='Water'?'#0369a1':c==='Governance'?T.purple:T.amber;` |
| `pill` | `(color,text,sm)=>({display:'inline-block',padding:sm?'1px 7px':'2px 10px',borderRadius:10,fontSize:sm?10:11,fontWeight:600,background:color+'18',color,border:`1px solid ${color}30`});` |
| `TABS` | `['PAI Statement','Indicator Drill-Down','Fund Comparison','Action Plan'];` |
| `catGroups` | `['Climate','Social','Social/Governance','Biodiversity','Water','Waste','Governance'].map(cat=>{` |
| `avg` | `catPais.reduce((a,p,pi)=>{const fp=fund.pais.find(f=>f.id===p.id);return a+(fp?.current\|\|0);},0)/catPais.length;` |
| `delta` | `fp?+(fp.current-fp.prior).toFixed(1):0;` |
| `trend` | `YEARS.map((yr,i)=>({yr,value:+(sr(fund.id*31+PAI_INDICATORS.findIndex(p=>p.id===selPai)*7+i*11)*100+10).toFixed(1)}));` |
| `actions` | `Array.from({length:4},(_,i)=>({type:actionTypes[i],due:`2025-${String(Math.floor(sr(fund.id*53+i*7)*12)+1).padStart(2,'0')}-30`,status:['Open','In Progress','Complete'][Math.floor(sr(fund.id*59+i*11)*3)]}));` |
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
| `SFDRPAIEngine.calculate_pai` | portfolio_holdings, pai_indicator_id | Calculate a single PAI indicator across a portfolio. Args: portfolio_holdings: List of holding dicts, each containing at minimum ``investment_value_eur`` and indicator-specific data fields as defined in ``PAI_CALCULATION_METHODS``. pai_indicator_id: Identifier such as ``"pai_1"`` through ``"pai_18"``. Returns: PAICalculationResult with the computed value, data quality score, and coverage ratio. |
| `SFDRPAIEngine.calculate_all_mandatory_pais` | portfolio_holdings | Calculate all 18 mandatory PAI indicators. Returns: Dict keyed by PAI indicator ID with PAICalculationResult values. |
| `SFDRPAIEngine.calculate_additional_pais` | portfolio_holdings, selected_indicators | Calculate selected additional PAI indicators from Tables 2 and 3. Args: portfolio_holdings: Portfolio holdings list. selected_indicators: List of additional indicator IDs (e.g. ``["add_env_4", "add_soc_11"]``). Returns: Dict of PAICalculationResult for each requested indicator. |
| `SFDRPAIEngine.assess_do_no_significant_harm` | holding, taxonomy_objective | Assess Do No Significant Harm for a holding against a taxonomy objective. For Article 9 products, each sustainable investment must demonstrate that it does not significantly harm any of the other five taxonomy objectives. The SFDR RTS uses PAI indicators as DNSH criteria. Args: holding: Dict with holding-level data (metrics keyed by PAI fields). taxonomy_objective: One of the six EU Taxonomy envir |
| `SFDRPAIEngine.calculate_portfolio_pai_statement` | portfolio_holdings, reporting_period, entity_name, lei | Produce a full PAI statement structure per Article 4 RTS. Args: portfolio_holdings: Complete list of portfolio holdings. reporting_period: E.g. ``"2025-01-01 to 2025-12-31"``. entity_name: Legal name of the financial market participant. lei: Legal Entity Identifier. Returns: PAIStatementResult ready for disclosure formatting. |
| `SFDRPAIEngine.compare_reporting_periods` | current_pais, previous_pais | Compare PAI values between two reporting periods. Args: current_pais: Dict of current-period PAI results (as dicts). previous_pais: Dict of prior-period PAI results (as dicts). Returns: Dict with per-indicator trend, delta, improvement/deterioration classification, and summary statistics. |
| `SFDRPAIEngine.generate_pai_disclosure` | pai_statement | Generate structured PAI disclosure document per Article 4 RTS. Args: pai_statement: Output of ``calculate_portfolio_pai_statement`` (as a dict or PAIStatementResult.__dict__). Returns: Structured disclosure document with all RTS-required sections. |
| `SFDRPAIEngine.assess_data_coverage` | portfolio_holdings | Assess data availability and gaps across all mandatory PAI indicators. Returns: Per-indicator coverage report with gap analysis and estimation requirements. |
| `SFDRPAIEngine.classify_entity` | entity_config | Classify a financial product under SFDR Article 6, 8, or 9. Args: entity_config: Dict with keys: - ``entity_name`` (str) - ``promotes_es_characteristics`` (bool) - ``has_sustainable_objective`` (bool) - ``sustainable_investment_pct`` (float, 0-100) - ``taxonomy_aligned_pct`` (float, 0-100) - ``considers_pai`` (bool) - ``minimum_safeguards_met`` (bool) - ``good_governance_assessed`` (bool) - ``empl |
| `SFDRPAIEngine.benchmark_against_peers` | pai_values, peer_group | Benchmark PAI values against sector peer averages. Args: pai_values: Dict mapping benchmark keys (e.g. ``"pai_2_carbon_footprint"``) to portfolio values. peer_group: Sector key from the benchmark table (e.g. ``"financials"``, ``"energy"``). Returns: Dict with per-metric percentile ranking and relative performance classification. |
| `SFDRPAIEngine._calc_sum` | holdings, pai_id, total_value | Attribution-factor-based summation (PAI 1). |
| `SFDRPAIEngine._calc_ratio` | holdings, pai_id, total_value | Per-million-invested ratio (PAI 2, 8, 9). |
| `SFDRPAIEngine._calc_exposure_share` | holdings, pai_id, total_value | Exposure-share percentage (PAI 4, 7, 10, 11, 14, 16, 17, 18). |
| `SFDRPAIEngine._calc_weighted_average` | holdings, pai_id, total_value | Weighted-average calculation (PAI 3, 5, 6, 12, 13, 15). |
| `SFDRPAIEngine._count_covered` | holdings, pai_id | Count holdings with at least one data point for the given PAI. |
| `SFDRPAIEngine._assess_indicator_data_quality` | holdings, pai_id, coverage | Score data quality 0-100 based on coverage, source type, and recency. |
| `SFDRPAIEngine._get_dnsh_threshold` | pai_id | Return a DNSH threshold for the given PAI indicator. Thresholds are illustrative screening values aligned with common market practice for Article 9 DNSH assessment. |
| `SFDRPAIEngine._extract_holding_pai_value` | holding, pai_id | Extract the relevant metric value from a holding for a PAI check. |
| `SFDRPAIEngine.get_mandatory_indicators` |  | Return all 18 mandatory PAI indicators with full details. |
| `SFDRPAIEngine.get_additional_indicators` |  | Return optional PAI indicators catalog (Tables 2 and 3). |
| `SFDRPAIEngine.get_calculation_methods` |  | Return PAI calculation methodology reference. |
| `SFDRPAIEngine.get_entity_classifications` |  | Return Article 6/8/9 classification criteria. |
| `SFDRPAIEngine.get_disclosure_requirements` |  | Return RTS disclosure template sections. |
| `SFDRPAIEngine.get_sector_benchmarks` |  | Return average PAI values by sector for benchmarking. |

**Engine `sfdr_pai_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `PAI_INDICATORS` | `{'pai_1': {'id': 'pai_1', 'name': 'GHG emissions', 'metric': 'Scope 1, Scope 2, Scope 3, and Total GHG emissions', 'unit': 'tCO2e', 'description': 'Scope 1 GHG emissions generated by investee companies; Scope 2 GHG emissions generated by investee companies; Scope 3 GHG emissions generated by investe` |
| `ADDITIONAL_PAI_INDICATORS` | `{'add_env_1': {'id': 'add_env_1', 'table': 2, 'name': 'Emissions of inorganic pollutants', 'metric': 'Tonnes of inorganic pollutant equivalents per million EUR invested', 'unit': 'tonnes / EUR million invested', 'category': 'environmental', 'sub_category': 'emissions'}, 'add_env_2': {'id': 'add_env_` |
| `PAI_CALCULATION_METHODS` | `{'pai_1': {'formula': 'attributed_emissions_i = (investment_value_i / evic_i) x scope_k_emissions_i; total = SUM(attributed_i)', 'required_data_fields': ['investment_value_eur', 'evic_eur', 'scope_1_tco2e', 'scope_2_tco2e', 'scope_3_tco2e'], 'aggregation_method': 'sum', 'data_quality_requirements': ` |
| `SFDR_ENTITY_CLASSIFICATION` | `{'article_6': {'label': 'Article 6 — No sustainability claims', 'description': 'Financial products that do not promote environmental or social characteristics and do not have sustainable investment as an objective. Must disclose how sustainability risks are integrated into investment decisions and t` |
| `_TAXONOMY_OBJECTIVES` | `['climate_change_mitigation', 'climate_change_adaptation', 'sustainable_use_water', 'transition_circular_economy', 'pollution_prevention', 'biodiversity_ecosystems']` |
| `_PAI_DNSH_MAP` | `{'climate_change_mitigation': ['pai_1', 'pai_2', 'pai_3', 'pai_4', 'pai_5', 'pai_6'], 'climate_change_adaptation': ['pai_1', 'pai_2', 'pai_3'], 'sustainable_use_water': ['pai_8'], 'transition_circular_economy': ['pai_9'], 'pollution_prevention': ['pai_8', 'pai_9'], 'biodiversity_ecosystems': ['pai_7` |
| `_SECTOR_BENCHMARKS` | `{'financials': {'pai_1_total_tco2e_per_m': 28.5, 'pai_2_carbon_footprint': 35.2, 'pai_3_ghg_intensity': 42.1, 'pai_4_fossil_fuel_pct': 5.8, 'pai_13_female_board_pct': 34.2, 'pai_14_controversial_weapons_pct': 0.1}, 'energy': {'pai_1_total_tco2e_per_m': 312.0, 'pai_2_carbon_footprint': 428.5, 'pai_3_` |
| `_DISCLOSURE_TEMPLATE_SECTIONS` | `[{'section': 'summary', 'title': 'Summary', 'description': 'Overview of PAI consideration and entity classification.'}, {'section': 'pai_description', 'title': 'Description of principal adverse impacts on sustainability factors', 'description': 'Narrative description of how PAIs are identified, prio` |
| `_CROSS_FRAMEWORK_MAP` | `[{'pai': 'PAI 1-3 (GHG)', 'csrd_esrs': 'ESRS E1-6 (GHG emissions)', 'eu_taxonomy': 'Climate mitigation TSC', 'ghg_protocol': 'Scope 1/2/3'}, {'pai': 'PAI 4 (Fossil fuels)', 'csrd_esrs': 'ESRS E1 SBM-3', 'eu_taxonomy': 'Art 12(1)(f) exclusion', 'ghg_protocol': 'N/A'}, {'pai': 'PAI 5-6 (Energy)', 'csr` |

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
Output: `{'type': 'object', 'keys': ['add_env_1', 'add_env_2', 'add_env_3', 'add_env_4', 'add_env_5', 'add_env_6', 'add_env_7', 'add_env_8', 'add_env_9', 'add_env_10', 'add_env_11', 'add_env_12', 'add_env_13', 'add_env_14', 'add_env_15', 'add_env_re_1', 'add_env_re_2', 'add_env_re_3', 'add_env_re_4', 'add_en`

**GET /api/v1/sfdr-pai/ref/calculation-methods** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['pai_1', 'pai_2', 'pai_3', 'pai_4', 'pai_5', 'pai_6', 'pai_7', 'pai_8', 'pai_9', 'pai_10', 'pai_11', 'pai_12', 'pai_13', 'pai_14', 'pai_15', 'pai_16', 'pai_17', 'pai_18'], 'n_keys': 18}`

**GET /api/v1/sfdr-pai/ref/disclosure-requirements** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 7, 'item0_keys': ['section', 'title', 'description']}`

**GET /api/v1/sfdr-pai/ref/entity-classifications** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['article_6', 'article_8', 'article_9'], 'n_keys': 3}`

**GET /api/v1/sfdr-pai/ref/mandatory-indicators** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['pai_1', 'pai_2', 'pai_3', 'pai_4', 'pai_5', 'pai_6', 'pai_7', 'pai_8', 'pai_9', 'pai_10', 'pai_11', 'pai_12', 'pai_13', 'pai_14', 'pai_15', 'pai_16', 'pai_17', 'pai_18'], 'n_keys': 18}`

**GET /api/v1/sfdr-pai/ref/sector-benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['financials', 'energy', 'industrials', 'technology', 'utilities', 'real_estate', 'healthcare', 'consumer_staples'], 'n_keys': 8}`

**POST /api/v1/sfdr-pai/benchmark** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['peer_group', 'benchmarks_available', 'note', 'results'], 'n_keys': 4}`

**POST /api/v1/sfdr-pai/calculate** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'PAICalculationResult', 'repr': "PAICalculationResult(indicator_id='TEST_req_pai_indicator_id', indicator_name='Unknown', value=0.0, unit='', category='', asset_class='', data_quality_score=0.0, coverage_ratio=0.0, holdings_covered=0"}`

## 5 · Intermediate Transformation Logic
**Methodology:** PAI Weighted Score
**Headline formula:** `Σ (PAI_i × Portfolio Weight_i)`

Portfolio-weighted aggregate of each PAI indicator normalised to enable cross-indicator comparison in the mandatory statement.

**Standards:** ['SFDR RTS Annex I', 'EU 2022/1288']
**Reference documents:** SFDR Level 2 RTS EU 2022/1288 Annex I; ESMA PAI Q&A 2023; GHG Protocol Corporate Standard; UN Global Compact UNGP Reporting Framework

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
reported_ratio = reported_count / len(holdings)
recent_ratio = recent_count / len(holdings)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).
**Shared engines (edits propagate!):** `sfdr_pai_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `sfdr-pai` | engine:sfdr_pai_engine |

## 7 · Methodology Deep Dive

### 7.1 What the module computes

8 named synthetic funds (`FUNDS`, e.g. "Apex Sustainable UCITS," "Nordic Climate Fund") each carry the
**full, correctly-labelled 18-indicator SFDR PAI set** (`PAI_INDICATORS`), seeded via
`sr(s)=frac(sin(s+1)×10⁴)`, with current-period value, prior-period value, a coverage boolean, and a
benchmark figure per indicator:

```js
current  = unit==='%' ? base×60+5 : unit==='tCO2e/€M' ? base×150+20 : base×50+5
prior    = same formula using an independently-seeded 'prev' draw
covered  = sr() > 0.25                                        // ~75% coverage rate
benchmark = unit==='%' ? sr()×40+10 : sr()×80+15
```

Portfolio-level rollups: `covered = count(pais.covered)`, `improved = count(current<prior)`,
`worsened = count(current>prior)`, and category-group averages (`catGroups`) across Climate/Social/
Biodiversity/Water/Waste/Governance.

### 7.2 Parameterisation — the complete, correctly-labelled 18 SFDR PAI indicators

| # | Name | Asset class | Category |
|---|---|---|---|
| PAI-1 | GHG Emissions (S1+2+3 / €M invested) | company | Climate |
| PAI-2 | Carbon Footprint (tCO2e/€M EVIC) | company | Climate |
| PAI-3 | GHG Intensity (tCO2e/€M revenue) | company | Climate |
| PAI-4 | Fossil Fuel Exposure | company | Climate |
| PAI-5 | Non-Renewable Energy | company | Climate |
| PAI-6 | Energy Intensity (high climate impact sectors) | company | Climate |
| PAI-7 | Biodiversity Sensitive Areas | company | Biodiversity |
| PAI-8 | Water Emissions | company | Water |
| PAI-9 | Hazardous Waste | company | Waste |
| PAI-10 | UNGC Violations | company | Social |
| PAI-11 | Lack of UNGC Processes | company | Social |
| PAI-12 | Gender Pay Gap | company | Social |
| PAI-13 | Board Gender Diversity | company | Social |
| PAI-14 | Controversial Weapons | company | Governance |
| PAI-15 | Sovereign GHG Intensity | **sovereign** | Climate |
| PAI-16 | Fossil Fuel Sovereigns | **sovereign** | Climate |
| PAI-17 | Fossil Fuel RE | **real estate** | Climate |
| PAI-18 | Energy Efficiency RE (EPC D or below) | **real estate** | Climate |

This is the **most complete and correctly labelled PAI implementation on the platform** — it is the only
module of the SFDR family carrying all 18 indicators with correct labels for both sovereign (15–16) and
real-estate (17–18) asset-class-specific indicators, matching SFDR RTS Annex I Table 1 exactly.

### 7.3 Calculation walkthrough

1. **PAI Statement tab**: `covered`/`improved`/`worsened` counts summarise the fund's 18-indicator
   scorecard; `catGroups` computes an unweighted mean of `current` values within each of 6 category buckets
   (`Climate` appears twice conceptually via PAI-1..6 and PAI-15..18, but the `catGroups` filter groups by
   the literal `category` string, so all Climate-tagged indicators — company AND sovereign AND real-estate
   — are pooled into a single "Climate" average, mixing asset classes with different units, e.g. tCO₂e/€M
   invested (PAI-1) averaged with a real-estate EPC % (PAI-18)).
2. **Indicator Drill-Down tab**: presumably renders the full `pais` array per indicator with current vs
   prior vs benchmark comparison (component not fully excerpted, but the data structure supports it).
3. **Fund Comparison tab**: cross-fund comparison using the same 18-indicator structure.
4. **Action Plan tab**: likely surfaces `worsened` indicators as remediation priorities, consistent with the
   `improved`/`worsened` classification already computed in the PAI Statement tab.

### 7.4 Worked example

Fund at index 1 (default selection, an "Art 8" fund per `selFund=FUNDS[1]`): for PAI-4 (Fossil Fuel
Exposure, unit `%`), `current = sr(1×31+3×7)×60+5`, illustrative draw ≈ `5+60×0.28 ≈ 21.8%`;
`prior ≈ 5+60×0.35 ≈ 26%` → since `current(21.8) < prior(26)`, this indicator counts toward `improved`.
Aggregating across all 18 indicators for this fund gives the `improved`/`worsened`/`covered` counts shown
in the PAI Statement header.

### 7.5 Companion analytics on the page

- **Fund selector bar** — Classification (Art 6/8/9), AUM (€bn), ISIN, and PAI Coverage % with threshold
  colour-coding (green ≥80%, amber ≥60%, red below) — consistent presentation with sibling SFDR modules.
- **Category grouping caveat** (§7.3.1) is the one methodological soft spot in an otherwise well-labelled
  module — a production implementation would keep sovereign/real-estate climate indicators in separate
  sub-groups from company-level climate indicators given their different units and denominators.

### 7.6 Data provenance & limitations

- **All 8 funds and their 18×2 (current+prior) PAI values are synthetic**, generated fresh per session via
  `sr(seed)=frac(sin(seed+1)×10⁴)`; fund names are illustrative, not real registered UCITS products.
- **Category-level averaging pools different asset classes and units** (company vs sovereign vs real
  estate, all tagged "Climate") — the `catGroups` average is a directional summary only, not a
  methodologically rigorous composite.
- `covered` (data coverage boolean) is independently random per indicator per fund, uncorrelated with the
  fund's `coverage` headline % shown in the selector bar — the two coverage figures (18-indicator boolean
  count vs. the headline `selFund.coverage`) are not guaranteed to be numerically consistent with each
  other.

**Framework alignment:** SFDR RTS Annex I Table 1 — the complete, correctly asset-class-differentiated
18-indicator taxonomy is accurately reproduced, the strongest such implementation among the platform's SFDR
modules · SFDR Article 6/8/9 fund classification badge convention matches the regulation's actual tiering ·
the reference period framing ("1 Jan – 31 Dec") in the header matches SFDR's actual annual PAI Statement
reporting cycle.

## 9 · Future Evolution

### 9.1 Evolution A — Engine-fed multi-fund dashboard with reconciled coverage (analytics ladder: rung 1 → 2)

**What.** The page carries the platform's best SFDR taxonomy — the complete, correctly asset-class-differentiated 18-indicator Annex I table — but its 8 funds and all 18×2 PAI values are `sr()`-synthetic, and §7.6 flags two structural defects: category averages pool incompatible units and asset classes (company/sovereign/real-estate all tagged "Climate"), and the per-indicator `covered` booleans are uncorrelated with the fund-selector's headline coverage %, so the page's two coverage figures can contradict each other. Evolution A drives the dashboard from the shared `sfdr_pai_engine` (the same 14 routes as `sfdr-pai`) computing over real fund holdings, making trend tracking and coverage single-sourced.

**How.** (1) Per selected fund, call `POST /calculate-all` against holdings in `portfolios_pg`; the headline coverage becomes the engine's own `data_quality_score` — one number, one source. (2) Replace `catGroups`' cross-unit averaging with unit-aware composites: within-category indicators normalised against their `POST /benchmark` peer ratio before averaging, or displayed as a small-multiples panel with no composite where units can't merge. (3) Year-on-year trends via `POST /compare-periods` with persisted reporting-period snapshots (new `pai_period_snapshots` table) replacing the independent `prev` draws. (4) "Material increase" flags derive from the engine's `pct_change`, parameterised by a user-set materiality threshold — the module's first genuine what-if lever.

**Prerequisites.** Seeded demo fund holdings (D0 credibility item); period snapshots require at least two stored reporting dates before trends are real. **Acceptance:** the two coverage figures are always equal because one is derived; a synthetic-data banner disappears only for engine-fed funds.

### 9.2 Evolution B — Material-increase explanation drafter (LLM tier 2)

**What.** SFDR requires managers to explain material year-on-year PAI deteriorations in the annual statement. That explanation is narrative synthesis over structured deltas — the ideal tier-2 slice. The copilot calls `POST /compare-periods`, identifies indicators breaching the materiality threshold, drills into which holdings drove the delta (`POST /calculate` per-holding decomposition), and drafts the Annex I "explanations" column text: "PAI-2 rose 14% driven by two additions in the utilities book; excluding them the footprint fell 3%."

**How.** Tool schemas from the shared OpenAPI spec; grounding corpus = this Atlas record plus `GET /ref/disclosure-requirements`. The drafting template forces the decomposition structure (delta → driver holdings → counterfactual) with every numeric validated against tool outputs. Drafts route to the report-studio layer; nothing is auto-published.

**Prerequisites (hard).** Evolution A's persisted period snapshots — explaining YoY movements between two independent random draws would be fabricating causality for noise. **Acceptance:** every driver holding named in an explanation appears in the per-holding decomposition; an indicator below the materiality threshold gets no explanation paragraph.