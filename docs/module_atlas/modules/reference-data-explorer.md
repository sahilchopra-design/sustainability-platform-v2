# ESG Reference Data Explorer
**Module ID:** `reference-data-explorer` · **Route:** `/reference-data-explorer` · **Tier:** A (backend vertical) · **EP code:** EP-MISC · **Sprint:** Platform

## 1 · Overview
Explorer for ESG reference data including legal entity identifiers (LEI, ISIN, CUSIP, SEDOL), GICS sector taxonomy, country/region classification, currency conversion, index constituent history, and corporate action impact on ESG time series. Sources include GLEIF Global LEI Index and ESMA FIRDS security database.

> **Business value:** Used by ESG data teams, portfolio operations, and regulatory reporting functions to maintain a clean, consistent entity reference backbone that ensures ESG data can be matched, aggregated, and reported accurately.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Card`, `CbamTab`, `CedaTab`, `CountryIntelligenceTab`, `CrossSourceTab`, `DashboardTab`, `FoodCarbonTab`, `Kpi`, `OwidCo2Tab`, `OwidEnergyTab`, `PALETTE`, `SbtiTab`, `SectionTitle`, `SourceDocTab`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `n => n == null ? 'N/A' : typeof n === 'number' ? (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : n % 1 === 0 ? n.toLo` |
| `pct` | `(n) => n == null ? 'N/A' : n.toFixed(1) + '%';` |
| `safe` | `(num, den, fallback = 0) => den > 0 ? num / den : fallback;` |
| `matrix` | `sources.map(src => {` |
| `perCapScatter` | `useMemo(() => owidCo2.latestByCountry.filter(c => c.co2_per_capita && c.gdp && c.gdp > 0).map(c => ({` |
| `globalSharePie` | `useMemo(() => top20.slice(0, 8).map(c => ({ name: c.country, value: c.share_global_co2 \|\| 0 })), [top20]);` |
| `restShare` | `100 - globalSharePie.reduce((s, c) => s + c.value, 0);` |
| `pieData` | `[...globalSharePie, { name: 'Rest of World', value: Math.max(0, restShare) }];` |
| `cumulBar` | `useMemo(() => [...owidCo2.latestByCountry].filter(c => c.cumulative_co2 > 0).sort((a, b) => b.cumulative_co2 - a.cumulative_co2).slice(0, 15).map(c =>` |
| `methaneComp` | `useMemo(() => owidCo2.latestByCountry.filter(c => c.methane > 0).sort((a, b) => b.methane - a.methane).slice(0, 10).map(c => ({ country: c.country, me` |
| `sorted` | `useMemo(() => [...owidCo2.latestByCountry].sort((a, b) => sortDir === 'desc' ? (b[sortCol] \|\| 0) - (a[sortCol] \|\| 0) : (a[sortCol] \|\| 0) - (b[sortCol]` |
| `renewBar` | `useMemo(() => [...countries].filter(c => c.renewables_share_pct != null && c.renewables_share_pct > 0).sort((a, b) => b.renewables_share_pct - a.renew` |
| `carbonIntBar` | `useMemo(() => [...countries].filter(c => c.carbon_intensity_kwh > 0).sort((a, b) => b.carbon_intensity_kwh - a.carbon_intensity_kwh).slice(0, 20).map(` |
| `solarWindScatter` | `useMemo(() => countries.filter(c => c.solar_capacity_gw > 0 && c.wind_capacity_gw > 0).map(c => ({ name: c.country, x: c.solar_capacity_gw, y: c.wind_` |
| `wb2` | `companies.filter(c => c.c === 'Well-below 2\u00b0C').length;` |
| `vals` | `ceda.countries.map(c => c.efs ? (c.efs[s.code] \|\| 0) : 0);` |
| `avg` | `vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;` |
| `top20Vuln` | `useMemo(() => [...countries].sort((a, b) => b.vulnerabilityIndex - a.vulnerabilityIndex).slice(0, 20).map(c => ({ country: c.name, vi: c.vulnerability` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/reference-data/irena-lcoe` | `search_irena_lcoe` | api/v1/routes/reference_data.py |
| GET | `/api/v1/reference-data/irena-lcoe/technologies` | `irena_technologies` | api/v1/routes/reference_data.py |
| GET | `/api/v1/reference-data/irena-lcoe/trend/{technology}` | `irena_lcoe_trend` | api/v1/routes/reference_data.py |
| GET | `/api/v1/reference-data/crrem` | `search_crrem` | api/v1/routes/reference_data.py |
| GET | `/api/v1/reference-data/crrem/property-types` | `crrem_property_types` | api/v1/routes/reference_data.py |
| GET | `/api/v1/reference-data/crrem/pathway` | `crrem_pathway` | api/v1/routes/reference_data.py |
| GET | `/api/v1/reference-data/grid-ef` | `search_grid_ef` | api/v1/routes/reference_data.py |
| GET | `/api/v1/reference-data/grid-ef/countries` | `grid_ef_countries` | api/v1/routes/reference_data.py |
| GET | `/api/v1/reference-data/grid-ef/{iso3}` | `grid_ef_country` | api/v1/routes/reference_data.py |
| GET | `/api/v1/reference-data/stats` | `reference_data_stats` | api/v1/routes/reference_data.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `db-empty`, `frontend-seed`, `real-db`

**Database tables:** `__future__` *(shared)*, `api` *(shared)*, `db` *(shared)*, `dh_crrem_pathways`, `dh_grid_emission_factors`, `dh_irena_lcoe` *(shared)*, `fastapi` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `PALETTE`, `TABS`
**Shared context buses:** `ReferenceDataContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Entity Match Rate | `entities_with_LEI / total_entities × 100` | GLEIF Global LEI Index | Target >90% for institutional portfolios; unmatched entities require manual review and cannot be included in r |
| GICS Classification Coverage | `entities_with_GICS / total_entities × 100` | MSCI GICS database | GICS is required for sector-normalised ESG benchmarking; incomplete classification degrades sector peer analys |
| Corporate Action Impact Events | `COUNT(mergers + spin-offs + reclassifications) in period` | GLEIF + ESMA FIRDS event log | High event counts require ESG time series splicing decisions; key operational risk in ESG data management. |
- **GLEIF LEI database + ESMA FIRDS + MSCI GICS → entity reference layer** → Identifier cascade matching → corporate action graph → ESG series linking → **Unified entity reference data for ESG portfolio construction and regulatory reporting**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/reference-data/crrem** — status `passed`, provenance ['real-db'], source tables: `dh_crrem_pathways`
Output: `{'type': 'object', 'keys': ['records', 'total'], 'n_keys': 2}`

**GET /api/v1/reference-data/crrem/pathway** — status `failed`, provenance ['db-empty'], source tables: `dh_crrem_pathways`
Output: `None`

**GET /api/v1/reference-data/crrem/property-types** — status `passed`, provenance ['real-db'], source tables: `dh_crrem_pathways`
Output: `{'type': 'object', 'keys': ['property_types'], 'n_keys': 1}`

**GET /api/v1/reference-data/grid-ef** — status `passed`, provenance ['real-db'], source tables: `dh_grid_emission_factors`
Output: `{'type': 'object', 'keys': ['records', 'total'], 'n_keys': 2}`

**GET /api/v1/reference-data/grid-ef/countries** — status `passed`, provenance ['real-db'], source tables: `dh_grid_emission_factors`
Output: `{'type': 'object', 'keys': ['countries'], 'n_keys': 1}`

## 5 · Intermediate Transformation Logic
**Methodology:** Entity Reference Data Integration
**Headline formula:** `entity_match_score = Σ(identifier_match_i × weight_i) / total_weight`
**Standards:** ['GLEIF LEI Data Standard (ISO 17442)', 'ESMA Financial Instruments Reference Data System (FIRDS)', 'MSCI GICS Classification System 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **54** other module(s).

| Connected module | Shared via |
|---|---|
| `real-estate-carbon-analytics` | table:api, table:db, table:sqlalchemy |
| `benchmark-analytics` | table:api, table:db, table:sqlalchemy |
| `geothermal-power-markets` | table:db, table:dh_irena_lcoe, table:sqlalchemy |
| `geothermal-direct-use` | table:db, table:dh_irena_lcoe, table:sqlalchemy |
| `geothermal-market-intelligence` | table:db, table:dh_irena_lcoe, table:sqlalchemy |
| `geothermal-lcoe-economics` | table:db, table:dh_irena_lcoe, table:sqlalchemy |
| `geothermal-project-finance` | table:db, table:dh_irena_lcoe, table:sqlalchemy |
| `portfolio-transition-alignment` | table:api, table:db |
| `portfolio-optimizer` | table:api, table:db |
| `portfolio-temperature-score` | table:api, table:db |