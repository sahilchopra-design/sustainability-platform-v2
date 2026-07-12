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
