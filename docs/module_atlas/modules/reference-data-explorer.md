# ESG Reference Data Explorer
**Module ID:** `reference-data-explorer` · **Route:** `/reference-data-explorer` · **Tier:** A (backend vertical) · **EP code:** EP-MISC · **Sprint:** Platform

## 1 · Overview
Explorer for ESG reference data including legal entity identifiers (LEI, ISIN, CUSIP, SEDOL), GICS sector taxonomy, country/region classification, currency conversion, index constituent history, and corporate action impact on ESG time series. Sources include GLEIF Global LEI Index and ESMA FIRDS security database.

> **Business value:** Used by ESG data teams, portfolio operations, and regulatory reporting functions to maintain a clean, consistent entity reference backbone that ensures ESG data can be matched, aggregated, and reported accurately.

**How an analyst works this module:**
- Search legal entity by LEI, ISIN, company name, or GICS sector
- Review entity hierarchy and corporate action history
- Map entities to ESG data coverage and time series completeness
- Export entity reference dataset for portfolio analytics integration

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Card`, `CbamTab`, `CedaTab`, `CountryIntelligenceTab`, `CrossSourceTab`, `DashboardTab`, `FoodCarbonTab`, `Kpi`, `OwidCo2Tab`, `OwidEnergyTab`, `PALETTE`, `SbtiTab`, `SectionTitle`, `SourceDocTab`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `n => n == null ? 'N/A' : typeof n === 'number' ? (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : n % 1 === 0 ? n.toLocaleString() : n.toFixed(2)) : String(n);` |
| `pct` | `(n) => n == null ? 'N/A' : n.toFixed(1) + '%';` |
| `safe` | `(num, den, fallback = 0) => den > 0 ? num / den : fallback;` |
| `matrix` | `sources.map(src => {` |
| `tsData` | `useMemo(() => owidCo2.top20TimeSeries[tsSel] \|\| [], [tsSel, owidCo2]);  const perCapScatter = useMemo(() => owidCo2.latestByCountry.filter(c => c.co2_per_capita && c.gdp && c.gdp > 0).map(c => ({ name: c.country, x: c.gdp / (c.population > 0 ? c.population : 1), y: c.co2_per_capita, co2: c.co2_mt, })), [owidCo2]);` |
| `globalSharePie` | `useMemo(() => top20.slice(0, 8).map(c => ({ name: c.country, value: c.share_global_co2 \|\| 0 })), [top20]);` |
| `restShare` | `100 - globalSharePie.reduce((s, c) => s + c.value, 0);` |
| `pieData` | `[...globalSharePie, { name: 'Rest of World', value: Math.max(0, restShare) }];` |
| `cumulBar` | `useMemo(() => [...owidCo2.latestByCountry].filter(c => c.cumulative_co2 > 0).sort((a, b) => b.cumulative_co2 - a.cumulative_co2).slice(0, 15).map(c => ({ country: c.country, cumCo2: c.cumulative_co2 })), [owidCo2]);` |
| `methaneComp` | `useMemo(() => owidCo2.latestByCountry.filter(c => c.methane > 0).sort((a, b) => b.methane - a.methane).slice(0, 10).map(c => ({ country: c.country, methane: c.methane, n2o: c.nitrous_oxide \|\| 0 })), [owidCo2]);` |
| `sorted` | `useMemo(() => [...owidCo2.latestByCountry].sort((a, b) => sortDir === 'desc' ? (b[sortCol] \|\| 0) - (a[sortCol] \|\| 0) : (a[sortCol] \|\| 0) - (b[sortCol] \|\| 0)), [owidCo2, sortCol, sortDir]);` |
| `renewBar` | `useMemo(() => [...countries].filter(c => c.renewables_share_pct != null && c.renewables_share_pct > 0).sort((a, b) => b.renewables_share_pct - a.renewables_share_pct).slice(0, 30).map(c => ({ country: c.country, pct: c.r` |
| `carbonIntBar` | `useMemo(() => [...countries].filter(c => c.carbon_intensity_kwh > 0).sort((a, b) => b.carbon_intensity_kwh - a.carbon_intensity_kwh).slice(0, 20).map(c => ({ country: c.country, ci: c.carbon_intensity_kwh })), [countries` |
| `solarWindScatter` | `useMemo(() => countries.filter(c => c.solar_capacity_gw > 0 && c.wind_capacity_gw > 0).map(c => ({ name: c.country, x: c.solar_capacity_gw, y: c.wind_capacity_gw })), [countries]);` |
| `wb2` | `companies.filter(c => c.c === 'Well-below 2\u00b0C').length;` |
| `top20Global` | `useMemo(() => { return ceda.sectors.map(s => { const vals = ceda.countries.map(c => c.efs ? (c.efs[s.code] \|\| 0) : 0);` |
| `avg` | `vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;` |
| `countryComparison` | `useMemo(() => { return ceda.countries.slice(0, 20).map(c => ({ country: c.name, ef: c.efs ? (c.efs[selSector] \|\| 0) : 0, })).filter(c => c.ef > 0).sort((a, b) => b.ef - a.ef);` |
| `top20Vuln` | `useMemo(() => [...countries].sort((a, b) => b.vulnerabilityIndex - a.vulnerabilityIndex).slice(0, 20).map(c => ({ country: c.name, vi: c.vulnerabilityIndex * 100 })), [countries]);` |
| `tradeFlowTop` | `useMemo(() => [...cbam.tradeFlows].sort((a, b) => (b.exports_kusd \|\| 0) - (a.exports_kusd \|\| 0)).slice(0, 15), [cbam]);` |
| `top20` | `useMemo(() => [...products].sort((a, b) => b.total - a.total).slice(0, 20).map(p => ({ name: p.name.length > 30 ? p.name.slice(0, 28) + '..' : p.name, total: p.total })), [products]);` |
| `countryComp` | `useMemo(() => { return products.filter(p => p.name === selProduct).map(p => ({ country: p.country, total: p.total }));` |
| `row` | `{ category: cat.length > 20 ? cat.slice(0, 18) + '..' : cat };` |
| `proteinItems` | `useMemo(() => products.filter(p => p.category && p.category.toLowerCase().includes('meat')).slice(0, 15).map(p => ({ name: p.name.length > 25 ? p.name.slice(0, 23) + '..' : p.name, total: p.total })).sort((a, b) => b.tot` |
| `co2VsCeda` | `useMemo(() => { return owidCo2.latestByCountry.filter(c => c.co2_per_capita && c.iso).map(c => { const cedaC = ceda.countries.find(cc => cc.code === c.iso);` |
| `avgEf` | `vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;` |
| `renewVsCarbon` | `useMemo(() => { return owidEnergy.latestByCountry.filter(c => c.renewables_share_pct != null && c.carbon_intensity_kwh > 0).map(c => ({ name: c.country, renew: c.renewables_share_pct, ci: c.carbon_intensity_kwh, }));` |

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
| Entity Match Rate | `entities_with_LEI / total_entities × 100` | GLEIF Global LEI Index | Target >90% for institutional portfolios; unmatched entities require manual review and cannot be included in regulatory financed emissions reports. |
| GICS Classification Coverage | `entities_with_GICS / total_entities × 100` | MSCI GICS database | GICS is required for sector-normalised ESG benchmarking; incomplete classification degrades sector peer analysis quality. |
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

**GET /api/v1/reference-data/grid-ef/{iso3}** — status `failed`, provenance ['db-empty'], source tables: `dh_grid_emission_factors`
Output: `None`

**GET /api/v1/reference-data/irena-lcoe** — status `passed`, provenance ['real-db'], source tables: `dh_irena_lcoe`
Output: `{'type': 'object', 'keys': ['records', 'total'], 'n_keys': 2}`

**GET /api/v1/reference-data/irena-lcoe/technologies** — status `passed`, provenance ['real-db'], source tables: `dh_irena_lcoe`
Output: `{'type': 'object', 'keys': ['technologies'], 'n_keys': 1}`

## 5 · Intermediate Transformation Logic
**Methodology:** Entity Reference Data Integration
**Headline formula:** `entity_match_score = Σ(identifier_match_i × weight_i) / total_weight`

Legal entity matching uses a hierarchical identifier cascade: LEI (preferred) → ISIN → CUSIP/SEDOL → name/country fuzzy match. Entity resolution handles corporate actions (mergers, spin-offs, name changes) by maintaining a temporal entity graph with effective dates. ESG time series are linked to the entity graph so corporate action events automatically trigger data lineage review flags.

**Standards:** ['GLEIF LEI Data Standard (ISO 17442)', 'ESMA Financial Instruments Reference Data System (FIRDS)', 'MSCI GICS Classification System 2023']
**Reference documents:** GLEIF LEI Data Standard ISO 17442; ESMA FIRDS Technical Documentation 2024; MSCI GICS Classification System 2023 Update

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **64** other module(s).

| Connected module | Shared via |
|---|---|
| `module-navigator` | table:api, table:sqlalchemy |
| `credit-spread-climate-monitor` | table:api, table:sqlalchemy |
| `benchmark-analytics` | table:api, table:sqlalchemy |
| `real-estate-carbon-analytics` | table:api, table:sqlalchemy |
| `geothermal-lcoe-economics` | table:dh_irena_lcoe, table:sqlalchemy |
| `geothermal-market-intelligence` | table:dh_irena_lcoe, table:sqlalchemy |
| `geothermal-project-finance` | table:dh_irena_lcoe, table:sqlalchemy |
| `geothermal-direct-use` | table:dh_irena_lcoe, table:sqlalchemy |
| `geothermal-power-markets` | table:dh_irena_lcoe, table:sqlalchemy |
| `portfolio-stress-test-drilldown` | table:api |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes an **"Entity Reference Data Integration"**
> engine: a GLEIF LEI → ISIN → CUSIP/SEDOL → fuzzy-name identifier cascade, a temporal entity graph
> handling mergers/spin-offs/name changes, and GICS sector classification — none of which exists in
> the code. There is exactly one `ISIN` field displayed (`c.i`, a raw pass-through from the SBTi
> company list) and **no LEI, CUSIP, SEDOL, GLEIF, FIRDS, or GICS logic anywhere in the file**. What
> the module actually is: a **multi-source public climate/energy/trade/food reference-data
> explorer and cross-source analytics dashboard** over real public datasets (OWID CO2 & Energy,
> CEDA emission factors, CBAM vulnerability, SBTi targets, Big Climate Database food LCA) unified
> through `ReferenceDataContext`. This is one of the platform's most genuinely real-data-grounded
> modules — the sections below document what it actually does, which is materially different from,
> and arguably more valuable than, the guide's entity-matching framing.

### 7.1 What the module computes

`ReferenceDataContext.jsx` loads and unifies ~20 real data sources (public + internal Supabase
tables) into a single `data` object consumed by 10 tabs. Per-source record counts are read
directly off the loaded datasets (not estimated):

```js
totalRecords = Σ sources[*].recordCount        // e.g. NGFS 7,328 · SBTi full DB 14,034 · CRREM 3,906
cedaTop10     = top-10 sectors by emission factor for a selected country, from CEDA spend-based EFs
cbamRadar     = 5-axis radar: Export Dep., CBAM Export Dep., EU Market Dep., Emission Intensity,
                Carbon Price Signal — all read directly from cbam-vulnerability.json per country
energyMix     = OWID Energy country record's {coal,gas,oil,nuclear,solar,wind,hydro}_share_pct
```

No PRNG (`sr()`) appears in the country-intelligence or cross-source-analytics logic reviewed —
the numbers shown are the source datasets' own values, filtered/joined/sorted client-side.

### 7.2 Parameterisation — the source catalogue

| Source | Provider | License | Records | Domain |
|---|---|---|---|---|
| CEDA Emission Factors | CEDA | Commercial | sectors × countries | emissions, industry |
| Big Climate Database | CONCITO | CC-BY 4.0 | product-level | food, emissions, lifecycle |
| CBAM Vulnerability Matrix | A² Intelligence / EU CBAM | Open | per-country | trade, vulnerability |
| OWID CO2 & GHG Emissions | Our World in Data / GCP | CC BY 4.0 | per-country latest | emissions, energy |
| OWID Energy Mix | Our World in Data | CC BY 4.0 | per-country latest | energy, renewables |
| SBTi Companies | SBTi | Open | 14,034 (full DB) | targets, decarbonisation |
| NGFS Scenarios | NGFS/IIASA | Free | 7,328 time-series points | scenarios, stress_test |
| CRREM Pathways | CRREM Initiative | Open | 3,906 (30 countries) | real_estate, pathways |
| Carbon Pricing Reference | World Bank/ICAP | Open | 8 instruments | carbon_pricing |
| CSRD ESRS Catalog | EFRAG/EU | Public | 1,184 disclosure reqs | csrd, regulatory |
| GRI Standards | GRI | Public | 2,230 | gri, reporting |
| India BRSR Companies | NSE/BSE/SEBI | Public | 1,323 | brsr, india |
| Climate Action 100+ | CA100+ | Public | 169 (focus list) | engagement, benchmarks |

Each source is registered once in `ReferenceDataContext.jsx` with its own `recordCount`
(computed live from the loaded array/table length, e.g. `cedaRaw.sectors.length ×
cedaRaw.countries.length`) — these are not hard-coded guesses.

### 7.3 Calculation walkthrough

1. **Dashboard tab**: source cards + a Sources×Domains coverage matrix (`matrix`), a simple
   boolean membership table (`s.domains.includes(d) ? 1 : 0`), and global KPI totals
   (`totalRecords`, `totalSources`, `totalCountries`, `totalFields`) summed across the catalogue.
2. **Country Intelligence tab**: `getCountryProfile(iso)` (defined in the context) joins OWID CO2,
   OWID Energy, CEDA, CBAM and SBTi rows for one ISO code; the page then derives `cedaTop10`
   (top-10 emission-factor sectors for that country), `cbamRadar` (5 CBAM vulnerability axes ×100
   for percentage display), `sbtiInCountry` (substring match of SBTi companies' location field
   against the country name — a simple text filter, not a formal entity-country resolution), and
   `energyMix` (7-source pie from OWID Energy share fields).
3. **OWID CO2/Energy Explorer tabs**: `tsData` (selected country's own time series from
   `owidCo2.top20TimeSeries`), `perCapScatter` (GDP/population vs `co2_per_capita`, filtered to
   rows with both fields present), `globalSharePie` (top-8 by `share_global_co2` + a computed
   "Rest of World" residual `100 − Σtop8`), `cumulBar` (top-15 by `cumulative_co2`), `methaneComp`
   (top-10 methane emitters with N2O co-plotted).
4. **SBTi Targets tab**: counts by target status (e.g. `wb2 = count(companies where c==='Well-below
   2°C')`) — straightforward categorical tallies over the 14K-company table.
5. **CEDA Sector Analysis tab**: `top20Global` — for each CEDA sector, the mean emission factor
   across all countries (`vals.reduce/vals.length`, guarded for empty arrays); `countryComparison`
   — a selected sector's EF across the first 20 countries, sorted descending.
6. **CBAM Vulnerability tab**: `top20Vuln` — countries ranked by `vulnerabilityIndex×100` (the
   index itself is a static field in `cbam-vulnerability.json`, not computed in this file);
   `tradeFlowTop` — top-15 CBAM trade flows by export value.
7. **Food Carbon tab**: top-20 products by total footprint from the Big Climate Database, plus a
   protein/meat-category subset — straight sort/filter/slice over the CONCITO dataset.
8. **Cross-Source Analytics tab**: `co2VsCeda` (per-country CO2-per-capita joined against that
   country's average CEDA emission factor, matched by ISO code) and `renewVsCarbon` (OWID
   renewables share vs grid carbon intensity) — genuine cross-dataset joins on a shared country
   key, the module's most analytically distinctive feature.
9. **Source Documentation tab**: static licensing/provenance text per source.

### 7.4 Worked example

Country Intelligence tab, `sel='USA'`:

| Step | Source | Computation |
|---|---|---|
| `profile.co2` | OWID CO2 latest-by-country row for USA | direct lookup, e.g. `co2_per_capita ≈ 14.9 t` |
| `cedaTop10[0]` | max of `Object.entries(profile.ceda.efs)` by `ef` value | e.g. top sector = Electric Power Generation |
| `cbamRadar[0]` (Export Dep.) | `profile.cbam.depExports × 100` | e.g. `0.11 × 100 = 11.0%` |
| `sbtiInCountry.length` | `sbti.companies.filter(c => c.l.toLowerCase().includes('united states'))` | count of US-headquartered SBTi-validated companies (capped at 20 displayed) |
| `energyMix` | OWID Energy `{coal,gas,...}_share_pct` for USA, non-zero entries only | e.g. Gas ≈ 40%, Coal ≈ 16%, Nuclear ≈ 18%, etc. (illustrative — actual values are the real OWID figures for the selected year) |

### 7.5 Cross-source join key

All cross-dataset joins (`co2VsCeda`, `renewVsCarbon`, `getCountryProfile`) key on **ISO-3
country code** (`c.iso`) or, for CBAM, `c.iso3` — a consistent join key across sources, which is
the module's core technical contribution (reconciling heterogeneous public datasets into one
explorable schema).

### 7.6 Companion analytics

10 tabs total: Dashboard, Country Intelligence, OWID CO2 Explorer, OWID Energy Explorer, SBTi
Targets, CEDA Sector Analysis, CBAM Vulnerability, Food Carbon, Cross-Source Analytics, Source
Documentation. A universal search (`searchAll`) queries across sources (CBAM countries shown in
the snippet at line 188) and returns typed results with a `source` tag.

### 7.7 Data provenance & limitations

- **This module is unusually real-data-grounded** relative to its siblings: OWID CO2/Energy, CEDA,
  CBAM, SBTi, and Big Climate Database are genuine public/licensed datasets loaded via
  `ReferenceDataContext`, not `sr()`-seeded fabrications. Some catalogue entries (`dh_*` /
  Supabase-backed sources) are declared with a `recordCount` but this deep dive did not verify
  those specific tables' contents beyond the context registration code.
- CBAM `vulnerabilityIndex` is a static pre-computed field in `cbam-vulnerability.json`; the
  methodology behind that index (weights across export dependency, EU market dependency, emission
  intensity, carbon price signal) is not derivable from this file — it is authored/maintained
  upstream, likely by "A² Intelligence" per the source card's own provider label.
- `sbtiInCountry` uses a naive substring match on a free-text location field, which will
  under/over-match for multi-country or ambiguous location strings — a real entity-resolution
  layer (as the guide actually describes) would fix this, but does not exist.
- No LEI/ISIN/GICS entity-matching cascade, corporate-action graph, or temporal entity versioning
  exists — any consumer expecting the guide's "Entity Match Rate" or "GICS Classification
  Coverage" KPIs will not find them computed anywhere in this module.

**Framework alignment:** this module's real value is as a **reference-data unification layer**,
not an entity-master-data system. It correctly surfaces license/provenance per source (a genuine
data-governance good practice) and performs real ISO3-keyed joins across OWID/CEDA/CBAM — but does
not implement GLEIF LEI (ISO 17442), ESMA FIRDS, or MSCI GICS as the guide claims. The guide entry
should be rewritten to describe the module as a "Public ESG & Climate Reference Data Explorer,"
and a separate entity-master module (LEI/ISIN resolution) would need to be built from scratch if
that capability is actually required by the platform.

## 9 · Future Evolution

### 9.1 Evolution A — The entity-matching cascade the guide already describes (analytics ladder: rung 1 → 2)

**What.** The module is genuinely real-data-grounded (§7.7): OWID CO₂/energy, CEDA, CBAM, SBTi, Big Climate Database via `ReferenceDataContext`, plus live `reference_data` endpoints (IRENA LCOE, CRREM pathways, grid EFs). Its gap is the guide's own headline: no LEI/ISIN/GICS entity-matching cascade, no corporate-action tracking, no computed Entity Match Rate — and `sbtiInCountry` uses a naive substring match on free-text location that a real entity-resolution layer would fix. With the GLEIF golden-source expansion complete platform-side (the silently-broken bulk ingester found and fixed; `entity_lei` now populated), Evolution A builds the matching layer this explorer promises.

**How.** (1) `POST /api/v1/reference-data/entity-match`: name/ISIN/LEI in → resolution cascade (exact LEI → ISIN via mapping → fuzzy name against `entity_lei` with score) → matched record with `match_tier`, mirroring the platform's existing GLEIF resolution pattern and the `entity_resolution` route's machinery (reuse, don't duplicate — §2.2 shows that route already exists platform-side). (2) Computed KPIs: `entities_with_LEI / total × 100` over any uploaded portfolio, making the guide's Entity Match Rate and GICS coverage real numbers. (3) Fix `sbtiInCountry` by resolving SBTi company names through the cascade to LEI-registered legal addresses. (4) Publish the CBAM `vulnerabilityIndex` methodology (weights are authored upstream and underivable from code, per §7.7) as a source-card annexe.

**Prerequisites.** GLEIF ingest kept fresh (scheduled); ISIN↔LEI mapping source (GLEIF publishes this mapping file freely). **Acceptance:** a 100-name test portfolio yields a match rate that recomputes from stored match tiers; SBTi country counts change measurably vs the substring method, with diffs explainable.

### 9.2 Evolution B — Data-provenance concierge (LLM tier 1 → 2)

**What.** This explorer is where analysts ask "can I trust this number?" — the right copilot is a provenance concierge: "which source should I use for Brazil's grid EF and how fresh is it?", "why do OWID and CEDA disagree on this country's intensity?" (the cross-source tab already juxtaposes them), "what does a CBAM vulnerability of 0.7 mean methodologically?" — grounded in the source catalogue, the per-source cards, and the published methodology annexes.

**How.** Tier 1: RAG over the Atlas record plus source-card metadata (provider, vintage, licence, record counts from `GET /reference-data/stats`); cross-source disagreement answers cite both sources' vintages and scope definitions rather than adjudicating truth. Tier 2: entity questions become `POST /entity-match` tool calls ("resolve these 15 counterparties and tell me which lack LEIs"), and freshness questions read live stats. The concierge is also the natural router for the desk-orchestration tier — other modules' copilots delegate "which reference table backs this?" here via the atlas interconnection graph.

**Prerequisites.** Source cards complete with vintage/licence fields; Evolution A for entity tooling. **Acceptance:** every source recommendation cites vintage and licence from the catalogue; unresolved entities are reported as unmatched with their best fuzzy candidates, never silently auto-matched.