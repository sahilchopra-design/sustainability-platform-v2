# CEDA Emission Factors Database
**Module ID:** `ceda-emission-factors` · **Route:** `/ceda-emission-factors` · **Tier:** B (frontend-computed) · **EP code:** EP-DATA1 · **Sprint:** Platform

## 1 · Overview
Comprehensive Environmentally-Extended Input-Output (EEIO) emission factors database covering 400 sectors across 149 countries, providing supply-chain emission intensity values (kgCO2e/USD) for scope 3 category mapping and enabling comparison between EEIO and process-based LCA approaches. Integrates Exiobase, WIOD, and CEDA 2025 v1.

> **Business value:** Used by corporate GHG inventory teams, scope 3 data providers, and consultants to generate spend-based scope 3 estimates where primary supplier data is unavailable, and to validate process-based LCA results.

**How an analyst works this module:**
- Select industry sector and country for emission factor lookup
- Map purchase categories to ISIC codes for spend-based scope 3 calculation
- Compare EEIO vs process LCA estimates for key spend categories
- Export emission factor dataset for GHG inventory tool integration

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Kpi`, `PALETTE`, `SearchInput`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v => v === null \|\| v === undefined ? '--' : typeof v === 'number' ? v.toFixed(4) : v;` |
| `allCountryEFs` | `useMemo(() => { return ceda.countries.map(c => { const ef = ceda.getEmissionFactor(c.code, selSector);` |
| `maxBucket` | `15; // kgCO2e/USD` |
| `idx` | `Math.min(19, Math.floor(ef / maxBucket * 20));` |
| `histData` | `buckets.map((count, i) => ({` |
| `countryAvgs` | `ceda.countries.map(c => {` |
| `avg` | `efs.length > 0 ? efs.reduce((a, b) => a + b, 0) / efs.length : 0;` |
| `highest` | `[...countryAvgs].sort((a, b) => b.avg - a.avg)[0] \|\| { name: '--', avg: 0 };` |
| `lowest` | `[...countryAvgs].filter(c => c.avg > 0).sort((a, b) => a.avg - b.avg)[0] \|\| { name: '--', avg: 0 };` |
| `mostIntensive` | `topSectors[0] \|\| { name: '--', ef: 0 };` |
| `leastIntensive` | `allEFs.length > 0 ? [...allEFs].sort((a, b) => a.ef - b.ef)[0] : { name: '--', ef: 0 };` |
| `region` | `ceda.getCountryRegion(selCountry) \|\| '--';` |
| `chartData` | `topSectors.map(s => ({` |
| `sectorInfo` | `ceda.sectorMap[selSector] \|\| { code: selSector, name: '--', desc: '' };` |
| `globalAvg` | `allEFs.length > 0 ? allEFs.reduce((s, c) => s + c.ef, 0) / allEFs.length : 0;` |
| `maxB` | `Math.max(...allEFs.map(c => c.ef), 1);` |
| `regData` | `ceda.regions.map(r => {` |
| `barData` | `topSectorCodes.map(s => {` |
| `row` | `{ name: s.name.length > 20 ? s.name.slice(0, 17) + '...' : s.name };` |
| `radarData` | `groupKeys.map(gk => {` |
| `summaryRows` | `compCountries.map(cc => {` |
| `allAvgs` | `ceda.countries.map(c => {` |
| `lbl` | `s ? (s.name.length > 15 ? s.name.slice(0, 12) + '...' : s.name) : sc;` |
| `sectorLabels` | `compSectors.map(sc => {` |
| `ratioRows` | `compSectors.map(sc => {` |
| `efs` | `ceda.countries.map(c => ceda.getEmissionFactor(c.code, sc)).filter(v => v !== null);` |
| `max` | `efs.length > 0 ? Math.max(...efs) : 0;` |
| `min` | `efs.length > 0 ? Math.min(...efs) : 0;` |
| `heatRows` | `groupKeys.map(gk => {` |
| `ratio` | `maxVal > 0 ? Math.min(1, v / maxVal) : 0;` |
| `groupBar` | `groupKeys.map(gk => {` |
| `drillData` | `drillSectors.map(s => {` |
| `regBar` | `ceda.regions.map(r => {` |
| `radarRegions` | `ceda.regions.slice(0, 8).map(r => r.length > 15 ? r.slice(0, 12) + '...' : r);` |
| `compData` | `memberCountries.slice(0, 15).map(c => {` |
| `cAvg` | `cEFs.length > 0 ? cEFs.reduce((a, b) => a + b, 0) / cEFs.length : 0;` |
| `rAvg` | `rEFs.length > 0 ? rEFs.reduce((a, b) => a + b, 0) / rEFs.length : 0;` |
| `totalKg` | `calcLines.reduce((s, l) => s + l.kgCO2e, 0);` |
| `totalT` | `calcLines.reduce((s, l) => s + l.tCO2e, 0);` |
| `fxEntries` | `ceda.countries.map(c => {` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PALETTE`, `TABS`
**Shared context buses:** `CedaContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Emission Intensity (kgCO2e/USD) | `f_i × (I-A)^(-1)_ij` | Exiobase 3.8.2 + WIOD 2016 | Higher intensities in coal (8-10 kgCO2e/$), steel (2-4), cement (1.5-3); used for spend-based scope 3 category 1 estimates. |
| Scope 3 Category Coverage | `GHG Protocol scope 3 categories coverable by EEIO` | ISO 14069 + GHG Protocol Scope 3 Standard | EEIO covers categories 1, 2, 4, 5, 6, 7, 8, 11, 12 reasonably well; categories 10/13/14/15 require process LCA data. |
| EEIO vs Process LCA Divergence (%) | `abs(EEIO_estimate − process_LCA_estimate) / process_LCA_estimate × 100` | Harmonisation studies | Average divergence ~40-60%; EEIO systematically higher for manufacturing (upstream capture) vs process LCA which may truncate system boundary. |
- **Exiobase + WIOD tables + national emission inventories → EEIO model** → Leontief inverse computation → emission intensity per sector/country → **kgCO2e/USD emission factor database for scope 3 spend-based estimation**

## 5 · Intermediate Transformation Logic
**Methodology:** EEIO Supply-Chain Emission Intensity
**Headline formula:** `scope3_emissions = Σ(spend_category_i × EF_i_kgCO2e_USD)`

EEIO emission factors are derived by solving the Leontief input-output model with environmental extensions: EF = f × (I - A)^(-1), where f is the direct emissions coefficient vector and (I-A)^(-1) is the Leontief inverse. Country-sector pairs are matched to ISIC Rev.4 codes. Emission factors are given in kgCO2e per USD of purchases, deflated to a common base year using PPP-adjusted industry deflators.

**Standards:** ['CEDA 2025 v1 (Carnegie Mellon EIO-LCA)', 'Exiobase 3.8.2', 'ISO 14069 Scope 3 GHG Accounting']
**Reference documents:** CEDA 2025 v1 – Carnegie Mellon EIO-LCA Database; Exiobase 3.8.2 Documentation; Wiedmann & Minx (2008) Definition of Carbon Footprint – Ecological Economics; GHG Protocol Corporate Value Chain (Scope 3) Standard

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The MODULE_GUIDES entry is faithful. This module is a genuine **EEIO emission-factor explorer** over a
real dataset: `data/ceda-2025.json` holds **149 countries × 400 sectors** of supply-chain emission
intensities (kgCO₂e/USD), served via `CedaContext` with O(1) lookup maps, currency conversion, and a
spend-based Scope-3 calculator. The page header explicitly states "No non-deterministic PRNG" — and
indeed the calculation path is deterministic; the only `sr()` in the file is unused decoration. This
is one of the platform's genuinely data-backed modules.

### 7.1 What the module computes

**Emission-factor lookup** (`getEmissionFactor`): direct O(1) map read of country-sector EF
(kgCO₂e/USD), with regional-average fallback when the country-sector pair is missing.

**Spend-based Scope-3** (`calculateSpendEmissions`):
```
if country EF exists:  kgCO2e = EF_country_sector · spendUSD;  tCO2e = kgCO2e/1000
else fall back to regional EF for the sector
total tCO2e = Σ_lines EF_line · spend_line / 1000
```
This is the GHG Protocol Scope-3 spend-based method: `Σ (spend_category · EF_category)`.

**Currency conversion** (`convertCurrency`): `amountUSD · fx_rate(country, year)` from the 148-country
exchange-rate table (year-indexed), so spend can be entered in local currency.

**Explorer aggregates:** country/sector averages, top emitters, histogram buckets (max 15
kgCO₂e/USD, 20 bins), regional radar, industry-group heatmap ratios.

### 7.2 Parameterisation / data rubric

| Element | Value | Provenance |
|---|---|---|
| Emission factors | 149 countries × 400 sectors, kgCO₂e/USD | **`ceda-2025.json`** — CEDA 2025 v1 (Carnegie Mellon EIO-LCA), Exiobase 3.8.2, WIOD 2016 |
| Sector codes | BEA/ISIC-style (e.g. `1111A0` Oilseed farming) | CEDA sector taxonomy |
| Regional EFs | 21 regions | CEDA regional aggregation |
| Exchange rates | 148 countries, year-indexed | CEDA FX table |
| Histogram bucket ceiling | 15 kgCO₂e/USD | Display parameter |

No synthetic seeded data drives any output — the `sr()` helper is present but unused in calculations.

### 7.3 Calculation walkthrough

The user selects a country and sector; `getEmissionFactor` returns the EF from the country map, or
the regional average if absent. The spend-based calculator maps purchase categories to sectors and
multiplies each spend line by its EF, converting kg→t. The currency tool converts local-currency spend
to USD first via the year-indexed FX rate. Comparison tabs compute cross-country/cross-sector ratios,
and the data-quality tab reports coverage (which country-sector cells have EFs vs fall back to regional).

### 7.4 Worked example (spend-based Scope-3)

A US company spends $2M with an Indian steel supplier (EEIO EF ≈ 3.0 kgCO₂e/USD for basic iron &
steel) and $500k with a German electronics supplier (EF ≈ 0.4):
- Steel line: `3.0 · 2,000,000 = 6,000,000 kgCO₂e = 6,000 tCO₂e`
- Electronics line: `0.4 · 500,000 = 200,000 kgCO₂e = 200 tCO₂e`
- **Total Scope-3 (spend-based) ≈ 6,200 tCO₂e**

If the electronics purchase were entered in EUR, `convertCurrency` first applies the year's USD/EUR
rate before the EF multiply. Where a country-sector cell is empty, the regional EF substitutes and the
data-quality tab flags the line as regionally-sourced.

### 7.5 Data provenance & limitations
- **Real EEIO reference data** (CEDA 2025, 149×400) — no PRNG in the calculation path.
- Spend-based EEIO is inherently coarse: it estimates category-average intensity, not
  supplier-specific footprints; it cannot distinguish a low-carbon supplier from a sector-average one.
- EF vintage/deflation: intensities are base-year values; the module does not re-deflate spend to the
  EF base year beyond the FX conversion.
- EEIO systematically diverges from process LCA (guide notes ~40–60% average divergence); best for
  Scope-3 categories 1/2/4/5/6/7/8/11/12, weaker for 10/13/14/15.

**Framework alignment:** **GHG Protocol Corporate Value Chain (Scope 3) Standard** — the spend-based
method (`spend · EF`) is implemented directly. **CEDA 2025 v1** (Carnegie Mellon EIO-LCA) is the EF
source, derived by solving the Leontief input-output model with environmental extensions
`EF = f·(I−A)⁻¹` (direct-emission vector × Leontief inverse). **Exiobase 3.8.2** and **WIOD 2016**
underpin the multi-region tables; **ISO 14069** governs the Scope-3 category mapping. This module is a
faithful, data-backed EEIO explorer.

## 9 · Future Evolution

### 9.1 Evolution A — Server-side factor service with vintage and uncertainty (analytics ladder: rung 1 → 3)

**What.** §7 rates this one of the platform's genuinely data-backed modules: a real
149-country × 400-sector EEIO dataset (`data/ceda-2025.json`) with deterministic O(1)
lookups, regional fallback, currency conversion, and a correct GHG Protocol spend-based
Scope-3 calculator via `CedaContext`. Its honest limits: the dataset ships as a static
frontend JSON (every client downloads the full matrix; other backend engines cannot
reach it), factors carry no uncertainty, and the single 2025 vintage will silently
stale. Evolution A promotes it to a platform factor service: the matrix loaded into a
`ref_eeio_factors(country, sector_isic, ef_kgco2e_usd, vintage, source)` table behind
`/api/v1/refdata` endpoints, with per-cell provenance (CEDA vs Exiobase vs WIOD, which
§1 says are all integrated) and published EEIO uncertainty ranges attached
(spend-based factors typically carry ±30–60% — the module should say so numerically).

**How.** (1) One-time ETL of the JSON into Postgres; `CedaContext` refactored to the
platform's `useReferenceData` pattern with the regional-fallback logic preserved and a
`resolution_tier` field reporting when fallback fired. (2) Deflator handling made
explicit: factors re-based per §5's PPP-deflator method with base-year displayed.
(3) The EEIO-vs-process-LCA comparison tab backed by a small curated pairs table
rather than prose.

**Prerequisites.** CEDA licensing check for server-side redistribution; existing
frontend behaviour regression-pinned (same EF for 20 sampled country-sector pairs).
**Acceptance:** any backend engine can resolve a factor via the refdata route; every
lookup response carries vintage, source, and fallback status.

### 9.2 Evolution B — Scope-3 estimation analyst (LLM tier 2)

**What.** A tool-calling assistant for the module's core workflow: "estimate scope 3
for this spend ledger" — the LLM maps free-text purchase categories to ISIC sectors
(the genuinely hard, currently-manual step §1 describes), calls
`calculateSpendEmissions` per line, and returns a categorised estimate with every
kgCO₂e traceable to a factor lookup. Mapping is where an LLM adds real value: "IT
consulting, Bangalore office" → ISIC J62, India factor — with the match confidence
stated and ambiguous lines flagged for human review rather than silently guessed.

**How.** Tool schemas over `getEmissionFactor` and `calculateSpendEmissions` (or the
Evolution A refdata endpoints once server-side); the no-fabrication validator requires
each line's EF to match a lookup response; the answer table shows category → ISIC →
country → EF → tCO₂e so the mapping is auditable line by line.

**Prerequisites.** Evolution A's uncertainty ranges, so estimates carry honest error
bars; a golden mapping set (~50 purchase descriptions → ISIC) to bench the LLM's
categorisation per the bench_llm pattern. **Acceptance:** mapping accuracy ≥90% on the
golden set; every emission figure in output equals EF × spend for a logged lookup.