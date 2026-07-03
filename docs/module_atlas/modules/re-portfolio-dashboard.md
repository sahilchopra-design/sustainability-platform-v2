# RE Portfolio Dashboard
**Module ID:** `re-portfolio-dashboard` · **Route:** `/re-portfolio-dashboard` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Real estate portfolio ESG analytics dashboard integrating GRESB scores, energy benchmarking, carbon intensity pathways, and CRREM stranding analysis.

> **Business value:** Provides real estate investment managers with a consolidated GRESB-aligned ESG performance view, peer benchmarking, and CRREM stranding risk integration.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `COUNTRIES_RE`, `CRREM_PATHWAY`, `CURRENCIES`, `Card`, `DEFAULT_RE_PORTFOLIO`, `EPC_RATINGS`, `EQUITY_KEY`, `GRESB_ASPECTS`, `HAZARD_LABELS`, `INFRA_KEY`, `KPI`, `PERIODS`, `PIE_COLORS`, `PROP_TYPES`, `RE_KEY`, `SortIcon`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `PROP_TYPES` | `['Office','Retail','Logistics','Residential','Data Center','Mixed-Use','Life Sciences','Hotel','Healthcare'];` |
| `fmt` | `(v, d = 1) => v != null ? v.toFixed(d) : '-';` |
| `fmtB` | `v => v >= 1000 ? `${(v / 1000).toFixed(1)}B` : `${v.toFixed(0)}M`;` |
| `updated` | `{ ...reData, properties: reData.properties.map(p => p.id === propId ? { ...p, ...changes } : p) };` |
| `nextNum` | `reData.properties.length + 1;` |
| `final` | `{ ...prop, id: `RE-${String(nextNum).padStart(2, '0')}` };` |
| `nextNum` | `reData.properties.length + 1;` |
| `news` | `samples.map(s => { const p = { ...s, id: `RE-${String(nextNum).padStart(2, '0')}` }; nextNum++; return p; });` |
| `types` | `useMemo(() => ['All', ...new Set(props.map(p => p.type))], [props]);` |
| `countries` | `useMemo(() => ['All', ...new Set(props.map(p => p.country))], [props]);` |
| `totalGFA` | `props.reduce((s, p) => s + p.gfa_m2, 0);` |
| `totalGAV` | `props.reduce((s, p) => s + p.gav_usd_mn, 0);` |
| `numCountries` | `new Set(props.map(p => p.country)).size;` |
| `avgEnergy` | `props.length ? props.reduce((s, p) => s + p.energy_intensity_kwh, 0) / props.length : 0;` |
| `avgCarbon` | `props.length ? props.reduce((s, p) => s + p.carbon_intensity_kgco2, 0) / props.length : 0;` |
| `crremPct` | `props.length ? (props.filter(p => p.crrem_aligned).length / props.length * 100) : 0;` |
| `avgGresb` | `props.length ? props.reduce((s, p) => s + p.gresb_score, 0) / props.length : 0;` |
| `certCoverage` | `props.length ? (props.filter(p => p.certification).length / props.length * 100) : 0;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/re-portfolio/nav` | `calculate_portfolio_nav` | api/v1/routes/re_portfolio.py |
| POST | `/api/v1/re-portfolio/crrem` | `crrem_analysis` | api/v1/routes/re_portfolio.py |
| POST | `/api/v1/re-portfolio/epc` | `epc_analysis` | api/v1/routes/re_portfolio.py |
| POST | `/api/v1/re-portfolio/concentration` | `concentration_analysis` | api/v1/routes/re_portfolio.py |
| POST | `/api/v1/re-portfolio/carbon` | `carbon_metrics` | api/v1/routes/re_portfolio.py |
| GET | `/api/v1/re-portfolio/meps-timelines` | `get_meps_timelines` | api/v1/routes/re_portfolio.py |
| GET | `/api/v1/re-portfolio/crrem-pathways` | `get_crrem_pathways` | api/v1/routes/re_portfolio.py |

### 2.3 Engine `re_portfolio_engine` (services/re_portfolio_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `epc_meets_minimum` | rating, minimum | True if rating is at or above the minimum EPC threshold. |
| `REPortfolioEngine.calculate_portfolio_nav` | portfolio, crrem_scenario, carbon_price_eur_per_tco2 | Full portfolio NAV calculation with all sub-analyses. |
| `REPortfolioEngine._calculate_nav_headline` | props |  |
| `REPortfolioEngine._calculate_yield_metrics` | props, gav |  |
| `REPortfolioEngine._calculate_esg_adjusted_nav` | props |  |
| `REPortfolioEngine._calculate_carbon_metrics` | props |  |
| `REPortfolioEngine._calculate_epc_distribution` | props |  |
| `REPortfolioEngine._calculate_green_brown_split` | props |  |
| `REPortfolioEngine._calculate_meps_compliance` | props |  |
| `REPortfolioEngine._get_meps_minimum` | country_iso, target_year | Get the applicable MEPS minimum EPC for a country at a target year. |
| `REPortfolioEngine._calculate_crrem_stranding` | props, scenario, carbon_price |  |
| `REPortfolioEngine._assess_single_property_crrem` | prop, scenario, carbon_price | Run CRREM stranding assessment on a single property. |
| `REPortfolioEngine._get_crrem_pathway` | property_type, country_iso, scenario | Get CRREM pathway for property type + country + scenario. |
| `REPortfolioEngine._interpolate_pathway` | pathway, year | Linear interpolation of CRREM pathway for a given year. |
| `REPortfolioEngine._calculate_sector_concentration` | props, gav |  |
| `REPortfolioEngine._calculate_geographic_concentration` | props, gav |  |
| `REPortfolioEngine._build_validation_summary` | portfolio, crrem_scenario, carbon_price |  |
| `REPortfolioEngine._empty_result` | portfolio |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `datetime` *(shared)*, `decimal` *(shared)*, `enum`, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `COUNTRIES_RE`, `CRREM_PATHWAY`, `CURRENCIES`, `EPC_RATINGS`, `GRESB_ASPECTS`, `HAZARD_LABELS`, `PERIODS`, `PIE_COLORS`, `PROP_TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio GRESB Score | — | GRESB Submission | Current GRESB total score for portfolio entity submission. |
| GRESB Star Rating | — | GRESB Benchmark | Relative performance tier based on score vs global GRESB peer group. |
| Carbon Intensity (kgCO₂e/m²) | — | Energy Data Aggregation | Portfolio weighted average GHG emissions per unit floor area. |
- **GRESB submissions + energy meter data + EPC certificates** → GRESB score computation; CRREM stranding overlay; peer benchmarking → **GRESB-aligned portfolio ESG report and investor disclosure pack**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/re-portfolio/crrem-pathways** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['pathways'], 'n_keys': 1}`

**GET /api/v1/re-portfolio/meps-timelines** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['timelines'], 'n_keys': 1}`

**POST /api/v1/re-portfolio/carbon** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/re-portfolio/concentration** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/re-portfolio/crrem** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** GRESB Total Score
**Headline formula:** `GRESB = 0.3×Management + 0.7×Performance; Performance = 0.5×Energy + 0.3×GHG + 0.2×Water`
**Standards:** ['GRESB Real Estate Assessment Reference Guide (2024)']

**Engine `re_portfolio_engine` — extracted transformation lines:**
```python
nav = gav - total_debt
w = p.market_value / gav
noi_yield = (total_noi / gav * 100).quantize(
esg_impact = ((esg_adj_gav - gav) / gav * 100).quantize(
climate_impact = ((climate_adj_gav - gav) / gav * 100).quantize(
prop_emissions = p.carbon_intensity_kgco2_m2 * p.floor_area_m2
prop_emissions = p.energy_intensity_kwh_m2 * p.floor_area_m2 * grid_ef
total_emissions_t = (total_emissions / 1000).quantize(
intensity = (total_emissions / total_area / 1000).quantize(
avg_years = Decimal(str(sum(years_list) / len(years_list))).quantize(
years_to_stranding = yr - self.current_year
gap = ei - current_threshold
gap_pct = Decimal(str(gap / current_threshold * 100)).quantize(
years_rem = 2050 - self.current_year
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **54** other module(s).

| Connected module | Shared via |
|---|---|
| `stranded-assets` | table:datetime, table:decimal |
| `portfolio-optimizer` | table:datetime, table:decimal |
| `sustainability-report-builder` | table:datetime, table:decimal |
| `sustainability-linked-instruments` | table:datetime, table:decimal |
| `portfolio-stress-test-drilldown` | table:datetime, table:decimal |
| `real-estate-valuation` | table:datetime, table:decimal |
| `portfolio-transition-alignment` | table:datetime, table:decimal |
| `portfolio-dashboard` | table:datetime, table:decimal |
| `portfolio-climate-var` | table:datetime, table:decimal |
| `portfolio-suite` | table:datetime, table:decimal |