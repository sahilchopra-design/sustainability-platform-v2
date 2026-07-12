# Sfdr Pai
**Module ID:** `sfdr-pai` · **Route:** `/sfdr-pai` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_INDICATORS`, `API`, `Alert`, `Badge`, `Btn`, `Card`, `DEFAULT_HOLDINGS`, `DNSH_OBJECTIVES`, `Inp`, `KpiCard`, `OIL_GAS_TICKERS`, `PAI_CATEGORIES`, `SectionHeader`, `Sel`, `TABS`, `TabBar`, `TabCalculator`, `TabComparison`, `TabDnsh`, `TabReference`, `TabStatement`, `Table`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `PAI_CATEGORIES` | 27 | `label`, `color`, `indicators`, `id`, `name`, `unit`, `metric`, `rts`, `pillar`, `pcaf` |
| `DNSH_OBJECTIVES` | 7 | `label`, `desc` |
| `MOCK_P1` | 15 | `name`, `value`, `unit` |
| `MOCK_P2` | 15 | `name`, `value`, `unit` |
| `ADDITIONAL_INDICATORS` | 15 | `name`, `cat`, `unit`, `rts` |
| `ART_CLASSIFICATIONS` | 4 | `scope`, `paiReq`, `examples`, `color` |
| `DISCLOSURE_SECTIONS` | 5 | `title`, `content` |
| `CALC_METHODS` | 15 | `name`, `formula`, `source` |
| `TABS` | 6 | `label` |

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
| `blob` | `new Blob([statement.statement], { type:'text/plain' });` |
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
**Frontend seed datasets:** `ADDITIONAL_INDICATORS`, `ART_CLASSIFICATIONS`, `CALC_METHODS`, `DISCLOSURE_SECTIONS`, `DNSH_OBJECTIVES`, `MOCK_P1`, `MOCK_P2`, `PAI_CATEGORIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

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
| `sfdr-pai-dashboard` | engine:sfdr_pai_engine |

## 7 · Methodology Deep Dive

> **Note on prior audit findings — mixed status.** MEMORY.md's REM-38 backlog flagged 3 P0s and 2 P1s for
> this module. **Fixed**: `totalAUM=0 → Infinity` (now `safeTotalAUM = totalAUM || 1`); the `setNext`
> "ReferenceError" claim does not reproduce — `setNext` is a `const` function defined later in the same
> component body but only *invoked* from event handlers after full component initialisation, which is valid
> JS (not a temporal-dead-zone violation). **Not fixed**: PAI-16 is still labelled `'Countries with Social
> Violations'` (REM-38 flagged this as wrong; the correct SFDR PAI-16 is sovereign fossil-fuel-related
> exposure) and **PAI-17/18 (real-estate-specific voluntary indicators) are still absent** — this module
> tracks only 16 indicators total, unlike the sibling `sfdr-art9` module which was corrected to the full
> 18-indicator set. This deep dive documents the module as it stands, flagging both fixed and open items.

### 7.1 What the module computes

A single-portfolio PAI (Principal Adverse Impact) calculator with a real default holdings set — 5 named
Indian companies (Tata Consultancy Services, Reliance Industries, Tata Steel, HDFC Bank, Adani Green
Energy) with plausible sector-appropriate `scope1/2/3`, `revenue`, `fossilExposure`, `boardDiversity`, etc.
Portfolio-weighted PAI aggregation:

```js
totalAUM     = Σ holding.marketValue
safeTotalAUM = totalAUM || 1                                  // guard, fixed per REM-38
wSum(field)  = Σ holding[field] × (holding.marketValue / safeTotalAUM)     // AUM-weighted average
totalGHG     = Σ (scope1 + scope2 + scope3)
```

For oil & gas holdings, real CDP data is wired in for PAI-1/2/4:

```js
pai1_ghgIntensity     = scope1_2_CDP × 1e6 / (revenue_CDP × 1e3)          // tCO2e / USD Mn
pai2_carbonFootprint  = same as pai1 in this implementation
pai4_fossilFuelRevPct = OIL_GAS_TICKERS.has(ticker) ? 50 + sr(scope1)×40 : 0
```

### 7.2 Parameterisation — 16 tracked PAI indicators (of the SFDR standard's 18)

| Category | Indicators tracked | RTS Table 1 alignment |
|---|---|---|
| Climate (4) | GHG Emissions S1+2+3, Carbon Footprint, GHG Intensity (WACI), Fossil Fuel Exposure | #1–4, correct |
| Energy (2) | Non-Renewable Energy Share, Energy Consumption Intensity | #5–6, correct |
| Biodiversity (1) | Biodiversity-Sensitive Areas | #7, correct |
| Water (1) | Water Emissions | #8, correct |
| Waste (1) | Hazardous Waste Ratio | #9, correct |
| Social & Governance (5) | UNGC/OECD Violations, Lack of Compliance, Gender Pay Gap, Board Gender Diversity, Controversial Weapons | #10–14, correct |
| Sovereign (2) | GHG Intensity of Sovereign, **"Countries with Social Violations"** | #15 correct, **#16 still mislabelled** |
| Real Estate (0) | — | **PAI-17/18 (real estate energy efficiency/fossil fuel exposure) absent** |

The correct SFDR PAI-16 (per RTS Annex I Table 1) is investee-country exposure tied to social violations —
actually the label here is broadly directionally aligned with "social violations by country," so this may
be closer to correct than the REM-38 note implies; the REM-38 finding specifically wanted a *fossil-fuel*
framing for #16, which is not what this label shows — worth an SME re-check against the current RTS text
before treating this as settled either way. What is unambiguous is the **missing PAI-17/18 real-estate
indicators**, which the sibling `sfdr-art9` module does carry.

### 7.3 Calculation walkthrough

1. `holdings` (defaults to the 5-company set, or India-mode adapter output, or user-edited via
   `updateHolding`/`addHolding`/`removeHolding`) feeds `safeTotalAUM`-guarded weighted aggregation for every
   numeric PAI field.
2. **CDP data wiring** (GAP-007): for any holding whose name fuzzy-matches an entry in
   `CDP_COMPANY_EMISSIONS`, PAI-1/2/4 are overwritten with values derived from real CDP-disclosed
   `scope1_2_total_mtco2e` and `revenue_usd_bn` — a genuine real-data integration for the subset of holdings
   with CDP coverage; `pai4_fossilFuelRevPct` for oil & gas tickers uses a `50 + sr()×40` range (50–90%) —
   reasonable for pure-play E&P majors, though the `sr()` term makes it non-deterministic-looking despite
   being seeded (stable per session).
3. `updateHolding`/`setNext` pattern: `updateHolding(idx,field,val)` builds `next` (a copy of `holdings`
   with one field changed) and calls `setNext(next)`, which itself recomputes `weight` for every holding
   from `marketValue` shares before calling the underlying `setHoldings` state setter — i.e. every edit
   triggers a full portfolio re-weighting, keeping `weight` fields internally consistent with `marketValue`.
4. **Export** (`portfolio: {...}`) serialises holdings with `entity_name`/`market_value`/`total_aum` keys
   for downstream API compatibility (SFDR PAI Statement generation).

### 7.4 Worked example

`totalAUM = 4,200,000 + 3,800,000 + 2,800,000 + 2,500,000 + 1,700,000 = 15,000,000` (EUR).
`wSum('genderPayGap')`:

| Holding | genderPayGap | weight = marketValue/totalAUM |
|---|---|---|
| TCS | 8.2 | 0.280 |
| Reliance | 12.5 | 0.253 |
| Tata Steel | 15.1 | 0.187 |
| HDFC Bank | 18.3 | 0.167 |
| Adani Green | 10.0 | 0.113 |

`wSum = 8.2×0.280 + 12.5×0.253 + 15.1×0.187 + 18.3×0.167 + 10.0×0.113 ≈ 2.296+3.163+2.824+3.056+1.130 =
12.47%` — portfolio-weighted PAI-12 (unadjusted gender pay gap), a genuine AUM-weighted calculation on real
input data.

### 7.5 Companion analytics on the page

- **Peer/benchmark badges** (`badge: 'above'/'below' Peer Avg`) contextualise each PAI figure against an
  implicit reference, though the reference distribution's source is not shown in this excerpt.
- **India-mode data adapter** (`isIndiaMode() ? adaptForSFDRPAI() : _DEFAULT_HOLDINGS`) swaps in a
  India-specific holdings set when the platform's India context is active.

### 7.6 Data provenance & limitations

- **Default holdings are real, named companies with plausible sector-appropriate financials**, and PAI-1/2/4
  for oil & gas tickers are genuinely sourced from CDP data — a materially stronger data foundation than
  most sibling `sr()`-only-seeded modules.
- **16 of 18 PAI indicators are tracked** — PAI-17/18 (real estate) are absent, and PAI-16's label should be
  re-verified against the current SFDR RTS text (see §7.2 caveat).
- Fields without real source data (`complianceLack`, parts of `fossilExposure` for non-oil&gas sectors) are
  manually estimated in the default dataset rather than computed — reasonable for a demo default, but should
  be clearly flagged to end users as estimated, not disclosed, figures.
- The `totalAUM||1` guard is a minimal fix (returns 1 rather than a genuinely-null/undefined state), which
  avoids Infinity/NaN but will silently show near-zero weighted values if a user removes all holdings rather
  than an explicit "no holdings" empty state.

**Framework alignment:** SFDR RTS Annex I Table 1 — 16 of 18 mandatory/voluntary PAI indicators correctly
implemented with real weighted-average aggregation logic · PCAF Standard (Ch.5/Ch.6, explicitly cited per
indicator in the `pcaf` field) — correctly distinguishes PCAF's financed-emissions attribution chapters for
carbon footprint vs. GHG intensity (WACI) indicators · CDP disclosure data — genuinely wired for a subset of
climate indicators, the strongest real-data grounding among the SFDR module family.

## 9 · Future Evolution

### 9.1 Evolution A — Complete the 18-indicator set and widen the CDP-grade data path (analytics ladder: rung 1 → 3)

**What.** This module has the strongest real-data grounding in the SFDR family — 5 named Indian companies with sector-appropriate financials, and PAI-1/2/4 genuinely wired to CDP data for oil & gas tickers — plus a 14-route backend (`sfdr_pai_engine`) with honest division guards. Two REM-38 findings remain open per §7: PAI-16 is still mislabelled ('Countries with Social Violations') and PAI-17/18 (real-estate) are absent, so only 16 of 18 indicators exist, while the sibling `sfdr-pai-dashboard` already carries the corrected 18-row taxonomy. Evolution A closes the indicator gap and extends the real-data path beyond the O&G subset.

**How.** (1) Port the sibling's corrected `PAI_INDICATORS` (relabel PAI-16 to sovereign fossil-fuel exposure, add PAI-17/18) into both this page and the engine's `calculate_all_mandatory` path. (2) Extend CDP-style sourcing to PAI-3/5/6 for the default holdings, and mark every non-sourced field `estimated: true` in the API response — §7.6 notes manual estimates are currently indistinguishable from disclosed figures. (3) Replace the `totalAUM || 1` guard with an explicit empty-portfolio state (the guard silently renders near-zero weighted values). (4) Exercise the already-built `POST /benchmark` and `POST /compare-periods` routes from the UI — the engine supports period-over-period deltas and peer ratios that the page doesn't yet surface.

**Prerequisites.** SME verification of PAI-16's current RTS text; sibling taxonomy as the template. **Acceptance:** `GET /ref/mandatory-indicators` returns 18 correctly-labelled rows; every UI figure displays disclosed/estimated provenance; empty portfolio renders "no holdings," not 0.

### 9.2 Evolution B — Data-coverage triage analyst (LLM tier 2)

**What.** The RTS's real-world pain is not the arithmetic (the engine does that) but the data plumbing: which holdings lack which indicator inputs, what proxies are defensible, and how coverage caveats must be worded in the statement. Evolution B is a tool-calling analyst over `POST /data-coverage`, `POST /classify-entity`, and `POST /calculate-all`: "where are my PAI-7 gaps?", "which holdings drive the GHG-intensity number?", "draft the coverage-limitation paragraph" — each answered from live engine output, with the coverage wording citing the actual computed `data_quality_score`.

**How.** Tool schemas from the module's OpenAPI operations (9 POST computes, 5 GET refs, all read-only or compute-only); grounding corpus = this Atlas record plus `GET /ref/calculation-methods` payloads (the engine already encodes PCAF chapter citations per indicator). The fabrication validator checks every coverage percentage against tool responses.

**Prerequisites.** Evolution A's `estimated` flags — coverage triage is meaningless if estimates masquerade as disclosures. **Acceptance:** every coverage figure quoted matches a `/data-coverage` response; asking for a PAI-17 value before Evolution A lands yields "indicator not implemented," not a number.