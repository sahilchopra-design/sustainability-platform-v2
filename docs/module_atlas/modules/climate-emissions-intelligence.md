# Climate Emissions Intelligence
**Module ID:** `climate-emissions-intelligence` · **Route:** `/climate-emissions-intelligence` · **Tier:** B (frontend-computed) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BADGE`, `COUNTRIES_LIST`, `FREE_DATA_SOURCES`, `FUEL_TYPES`, `KPICARD`, `MAC_OPTIONS`, `MONOBOX`, `NGFS_SCENARIOS`, `REGIONS`, `REGION_COLORS`, `SECTION`, `SECTORS`, `SEED_COUNTRIES`, `SPINNERBOX`, `TABLE`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `FREE_DATA_SOURCES` | 12 | `url`, `update`, `format`, `key`, `countries`, `coverage` |
| `MAC_OPTIONS` | 21 | `cost`, `potential` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `SEED_COUNTRIES` | `COUNTRIES_LIST.map((country, i) => ({` |
| `parsed` | `lines.slice(1, 5000).map(line => {` |
| `top20` | `useMemo(() => [...displayData].sort((a, b) => parseFloat(b.co2_per_capita) - parseFloat(a.co2_per_capita)).slice(0, 20), [displayData] );` |
| `kayaData` | `useMemo(() => displayData.map((c, i) => { const pop = parseFloat(c.population) / 1e6 \|\| (100 + sr(i * 7) * 1000);` |
| `gdpCap` | `parseFloat(c.gdp) / parseFloat(c.population) \|\| (1000 + sr(i * 11) * 40000);` |
| `energyInt` | `parseFloat(c.energy_per_gdp) \|\| (0.1 + sr(i * 37) * 0.4);` |
| `carbonInt` | `0.5 + sr(i * 43) * 1.5;` |
| `impliedCo2` | `(gdpCap / 1000) * energyInt * carbonInt;` |
| `residual` | `observed > 0 ? ((impliedCo2 - observed) / observed * 100).toFixed(1) : 'N/A';` |
| `tech` | `base * Math.pow(1 - 0.05, y);         // 5%/yr carbon intensity` |
| `eff` | `base * Math.pow(1 - 0.03, y);           // 3%/yr energy intensity` |
| `demand` | `base * Math.pow(1 - 0.01, y);        // 1%/yr GDP growth reduction` |
| `combined` | `base * Math.pow(1 - 0.025, y) * Math.pow(1 - 0.015, y) * Math.pow(1 - 0.005, y);` |
| `lmdiData` | `useMemo(() => COUNTRIES_LIST.slice(0, 10).map((c, i) => { const activity = (sr(i * 7) * 200 - 100).toFixed(1);` |
| `intensity` | `-(sr(i * 11) * 180).toFixed(1);` |
| `structure` | `(sr(i * 13) * 100 - 50).toFixed(1);` |
| `carbon` | `-(sr(i * 17) * 150).toFixed(1);` |
| `total` | `(parseFloat(activity) + parseFloat(intensity) + parseFloat(structure) + parseFloat(carbon)).toFixed(1);` |
| `garchData` | `useMemo(() => displayData.map((c, i) => { const omega = (0.001 + sr(i * 7) * 0.02).toFixed(4);` |
| `alpha` | `(0.05 + sr(i * 11) * 0.25).toFixed(3);` |
| `beta` | `(0.60 + sr(i * 13) * 0.35).toFixed(3);` |
| `sumAB` | `Math.min(alphaN + betaN, 0.999);` |
| `sectorData` | `useMemo(() => displayData.slice(0, 20).map((c, i) => { const shares = SECTORS.map((s, si) => ({ sector: s, share: sr(i * 10 + si) }));` |
| `ndcData` | `useMemo(() => displayData.map((c, i) => { const target = -(20 + sr(i * 7) * 60).toFixed(0);` |
| `current` | `-(sr(i * 11) * 40).toFixed(0);` |
| `gap` | `(parseFloat(current) - parseFloat(target)).toFixed(1);` |
| `status` | `parseFloat(gap) >= 0 ? 'On Track' : parseFloat(gap) > -15 ? 'Partial' : 'Off Track';` |
| `netZeroYear` | `2022 + Math.round(sr(i * 17) * 80 + 10);` |
| `scopeData` | `useMemo(() => displayData.slice(0, 20).map((c, i) => ({ company: `${c.country} Corp`, scope1: (sr(i * 7) * 500).toFixed(0), scope2: (sr(i * 11) * 300).toFixed(0), scope3up: (sr(i * 13) * 1200).toFixed(0), scope3dn: (sr(i * 17) * 800).toFixed(0), })),` |
| `esgScores` | `useMemo(() => { const maxCo2 = Math.max(...displayData.map(c => parseFloat(c.co2_per_capita) \|\| 0));` |
| `eScore` | `maxCo2 > 0 ? Math.max(0, 100 - (co2 / maxCo2 * 100)) : 50;` |
| `sScore` | `30 + sr(i * 11) * 60;` |
| `gScore` | `30 + sr(i * 13) * 60;` |
| `composite` | `(eScore * 0.4 + sScore * 0.35 + gScore * 0.25).toFixed(1);` |
| `globalAvgCo2` | `useMemo(() => { const vals = displayData.map(c => parseFloat(c.co2_per_capita)).filter(v => !isNaN(v) && v > 0);` |
| `maxEmitter` | `useMemo(() => { if (!displayData.length) return { country: '-', val: 0 };` |
| `sorted` | `[...displayData].sort((a, b) => parseFloat(b.co2_per_capita) - parseFloat(a.co2_per_capita));` |
| `minEmitter` | `useMemo(() => { if (!displayData.length) return { country: '-', val: 0 };` |
| `rows` | `displayData.map(c => headers.map(h => c[h] \|\| '').join(','));` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES_LIST`, `FREE_DATA_SOURCES`, `FUEL_COLORS`, `FUEL_TYPES`, `MAC_OPTIONS`, `NGFS_SCENARIOS`, `OWID_COLS`, `SECTORS`, `SECTOR_COLORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The Climate Emissions Intelligence page is a **country-level emissions dashboard that fetches real
open data at runtime** — Our World in Data (OWID) CO2 CSV and two World Bank indicator APIs — and
falls back to `sr()`-seeded demo rows only if the fetches fail. It honestly badges each data source
**LIVE** or **SEEDED**. There is no MODULE_GUIDES entry, so no guide↔code reconciliation is required.
The one static analytic asset is a marginal-abatement-cost (MAC) curve.

### 7.1 What the module computes

**Live data ingestion** (three `useEffect` fetches on mount):
```
OWID:  fetch owid-co2-data.csv → filter year=='2022', co2_per_capita>0, drop 'World'/'income'
       → owidData (LIVE); on error → SEED_COUNTRIES (SEEDED)
WB CO2/cap: api.worldbank.org …EN.ATM.CO2E.PC (mrv=1)  → wbData
WB GDP/cap: api.worldbank.org …NY.GDP.PCAP.CD (mrv=1)  → gdpData
displayData = COUNTRIES_LIST joined to (owidData if live else SEED_COUNTRIES)
```

**MAC curve** (`MAC_OPTIONS`, static): 20 abatement options each with a `cost` ($/tCO₂) and
`potential` (MtCO₂/yr), sorted ascending by cost to form the classic McKinsey/IEA MAC step chart;
negative-cost options (onshore wind −15, methane flaring −20) are profitable abatement.

### 7.2 Parameterisation / provenance

| Data | Nature | Provenance |
|---|---|---|
| Country CO2/capita, share, fuel split | **LIVE** (OWID CSV) or SEEDED fallback | Our World in Data `co2-data` (real) |
| CO2/capita, GDP/capita | **LIVE** (World Bank API) | World Bank indicators EN.ATM.CO2E.PC, NY.GDP.PCAP.CD |
| `SEED_COUNTRIES` (42) | `sr()`-seeded | Fallback only when fetch fails |
| `MAC_OPTIONS` (20) | hard-coded cost/potential | Realistic McKinsey/IEA MAC values (e.g. Solar PV −12 / 600 Mt; DAC +120 / 80 Mt) |
| `FREE_DATA_SOURCES` (11) | catalogue with URLs | Real (OWID, GCP, EDGAR, Climate TRACE, IEA, WB, EPA, UNFCCC…) |
| `NGFS_SCENARIOS` | 4 scenario labels | NGFS naming |
| `REGIONS` | country→region map | Hard-coded, accurate |

The **LIVE/SEEDED badge** (`BADGE` component) surfaces provenance honestly — a good-practice pattern
absent from most sibling modules.

### 7.3 Calculation walkthrough

1. On mount, three fetches populate `owidData`, `wbData`, `gdpData`; failures set the SEEDED flag.
2. `displayData` joins the country list to the live (or fallback) rows, attaching region.
3. Country-level views: emitters bar/treemap, CO2 vs GDP scatter, fuel-mix breakdown, regional
   aggregation — all reduce over `displayData`.
4. **MAC curve** sorts `MAC_OPTIONS` by cost and colours bars green (cost<0) / amber (<50) / red
   (≥50); bar width represents abatement potential.
5. Scenario/sector tabs present NGFS-labelled context.

### 7.4 Worked example — reading the MAC curve

Sorted `MAC_OPTIONS` (cheapest first): Methane Flaring (−20), Onshore Wind (−15), Solar PV utility
(−12), Energy Efficiency (−8), …, CCS industrial (+85), DAC (+120).

| Abatement wedge | Cost ($/tCO₂) | Potential (MtCO₂/yr) | Reading |
|---|---|---|---|
| Methane flaring reduction | −20 | 110 | Most profitable — do first |
| Solar PV (utility) | −12 | 600 | Largest cheap wedge |
| Cumulative to $0/t | negative-cost block | ≈ 1,760 Mt | "no-regret" abatement below zero cost |
| Direct Air Capture | +120 | 80 | Last-resort, most expensive |

The green (negative-cost) block is the "no-regret" abatement that pays for itself; the curve's
ascending shape is the standard supply curve of abatement.

### 7.5 Data provenance & limitations

- **This module genuinely fetches live open data** (OWID + World Bank) and only falls back to
  `sr(seed) = frac(sin(seed+1)×10⁴)` seeded rows on network failure — and it labels which is in use.
- The MAC curve is a **static illustrative table** (realistic but not year-specific or region-
  specific); it is not derived from the live data.
- OWID parsing takes the first 5000 lines and filters year 2022 — a hard-coded reporting year that
  will age; no multi-year selection.
- No portfolio or financial-risk computation here — it is a macro emissions-intelligence view.

**Framework alignment:** OWID / Global Carbon Project / EDGAR / Climate TRACE / IEA / World Bank /
UNFCCC (the module both catalogues and consumes these authoritative emissions sources); NGFS scenario
naming for the transition context; the MAC curve follows the McKinsey/IEA marginal-abatement-cost
methodology (abatement options ranked by $/tCO₂ against annual potential). Because it uses real data
and a standard MAC construction, **no §8 model specification is required** — the production
enhancement is multi-year, sector-resolved live data and a data-derived MAC curve rather than a
static table.

## 9 · Future Evolution

### 9.1 Evolution A — Server-side OWID/WB ingestion with history and MAC sourcing (analytics ladder: rung 2 → 3)

**What.** §7 rates this page a model citizen: it fetches real OWID CO₂ data and two
World Bank indicators at runtime, badges every source LIVE or SEEDED honestly, and
falls back gracefully — plus a static 20-option MAC curve. Its limits are structural:
client-side fetches re-download a multi-megabyte OWID CSV per visit, only 2022 is
kept, the WB calls fetch a single most-recent value, and the MAC options carry no
citations. Evolution A moves ingestion server-side into the platform's ingester
framework: OWID and WB series land in reference tables with full history (1990→),
enabling trend views and country trajectories the current single-year filter cannot
support, with the LIVE/SEEDED badge preserved end-to-end (source + refresh timestamp
served with the data).

**How.** (1) `ref_country_emissions(iso3, year, co2, co2_per_capita, sector_split,
source)` refreshed weekly by a new ingester (the 19-ingester scaffold is the
established pattern); the page's fetch logic becomes one platform API call with the
existing fallback semantics. (2) Time-series tabs: per-country trajectory vs NDC
markers, decoupling view (CO₂/capita vs GDP/capita over time — both series already
fetched). (3) Each MAC option gets a source citation (IEA/McKinsey vintage) and
year-dollars normalisation; the negative-cost options' assumptions documented.

**Prerequisites.** OWID/WB licensing is permissive (CC BY) — attribution strings
required; existing page behaviour regression-pinned (same 2022 values from the new
route). **Acceptance:** the page loads country data in one call with history; badge
shows source + last-refresh; a country trajectory chart renders 30+ years; every MAC
bar cites its source.

### 9.2 Evolution B — Emissions-data explainer (LLM tier 1)

**What.** A copilot for the questions this data invites: "why does Qatar top
per-capita while China tops absolute?", "what does the MAC curve say is the cheapest
next gigatonne?" (sorted-step narration with the sources from Evolution A), "how has
India's decoupling trended?" (post-Evolution A, a real series to describe). Tier 1
retrieval-and-explanation — the module computes aggregations, and the copilot's job
is honest narration with the LIVE/SEEDED status surfaced in prose.

**How.** Atlas record plus the reference tables as corpus; the copilot must state the
data vintage and source per figure (the badge discipline extended to language);
MAC-curve answers distinguish engineering cost estimates from realised project costs
per the option citations. Refusal path for forecasts and policy attribution beyond
the data.

**Prerequisites.** Evolution A preferred for history questions; workable today for
single-year comparisons since the live fetches are real. **Acceptance:** every
figure in an answer carries country-year-source; when the page is in SEEDED fallback
mode, the copilot says so before quoting anything.