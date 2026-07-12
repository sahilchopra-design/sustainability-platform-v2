# Sovereign Analytics Hub
**Module ID:** `sovereign-hub` · **Route:** `/sovereign-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Integrated sovereign risk dashboard aggregating climate, ESG, debt sustainability, physical, social and nature risk analytics for comprehensive country-level sovereign risk management.

> **Business value:** Serves as the master sovereign risk dashboard integrating six risk dimensions for holistic country-level sovereign risk management.

**How an analyst works this module:**
- Aggregate scores from sovereign climate, ESG, debt, physical, social and nature modules.
- Apply portfolio weighting to generate AUM-weighted composite risk exposure.
- Identify top-5 risk drivers per country using pillar attribution.
- Generate sovereign risk radar charts and portfolio concentration alerts.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `COUNTRY_DATA`, `Card`, `DATA_SOURCES`, `ENERGY_TRAJECTORY`, `KpiCard`, `LS_PORTFOLIO`, `MODULES`, `PIE_COLORS`, `POLICY_DIMS`, `REGULATIONS`, `Section`, `SortTh`, `TABS`, `TabBar`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `MODULES` | 6 | `name`, `icon`, `path`, `color`, `status`, `kpi`, `kpiKey` |
| `COUNTRY_DATA` | 41 | `name`, `region`, `esg`, `ndgain`, `carbon_price`, `ets`, `taxonomy`, `cbam`, `coal_phaseout`, `ev_target`, `renewable_pct`, `emissions_capita`, `green_bond_bn`, `jt_score`, `hdi`, `cpi`, `net_zero`, `nz_law`, `paris_aligned`, `portfolio_itr` |
| `POLICY_DIMS` | 7 | `label`, `unit` |
| `REGULATIONS` | 9 | `jurisdiction`, `phase`, `effective`, `impact`, `desc` |
| `DATA_SOURCES` | 7 | `provider`, `coverage`, `updated`, `desc` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `base` | `27 + i * 2;` |
| `regions` | `useMemo(() => ['All', ...new Set(COUNTRY_DATA.map(c => c.region))].sort(), []);` |
| `agg` | `useMemo(() => { const n = Math.max(1, COUNTRY_DATA.length);` |
| `wtdESG` | `countryExposure.reduce((s, c) => s + (c.esg \|\| 50) * (c.weight \|\| 0) / 100, 0) \|\| COUNTRY_DATA.reduce((s, c) => s + c.esg, 0) / n;` |
| `avgNDGain` | `COUNTRY_DATA.reduce((s, c) => s + c.ndgain, 0) / n;` |
| `parisAligned` | `COUNTRY_DATA.filter(c => c.paris_aligned).length / n * 100;` |
| `nzPct` | `COUNTRY_DATA.filter(c => c.net_zero).length / n * 100;` |
| `avgCarbonPrice` | `COUNTRY_DATA.reduce((s, c) => s + c.carbon_price, 0) / n;` |
| `avgRenewable` | `COUNTRY_DATA.reduce((s, c) => s + c.renewable_pct, 0) / n;` |
| `avgEmissionsCapita` | `COUNTRY_DATA.reduce((s, c) => s + c.emissions_capita, 0) / n;` |
| `totalGreenBond` | `COUNTRY_DATA.reduce((s, c) => s + c.green_bond_bn, 0);` |
| `avgJT` | `COUNTRY_DATA.reduce((s, c) => s + c.jt_score, 0) / n;` |
| `avgHDI` | `COUNTRY_DATA.reduce((s, c) => s + c.hdi, 0) / n;` |
| `avgCPI` | `COUNTRY_DATA.reduce((s, c) => s + c.cpi, 0) / n;` |
| `jtScorecard` | `useMemo(() => { return [...COUNTRY_DATA].sort((a, b) => b.jt_score - a.jt_score).slice(0, 15);` |
| `header` | `['Country', 'Region', 'ESG', 'ND-GAIN', 'Carbon Price', 'Renewable %', 'Emissions/Capita', 'JT Score', 'HDI', 'CPI', 'Net Zero', 'Paris Aligned'];` |
| `rows` | `COUNTRY_DATA.map(c => [c.name, c.region, c.esg, c.ndgain, c.carbon_price, c.renewable_pct, c.emissions_capita, c.jt_score, c.hdi, c.cpi, c.net_zero \|\| 'N/A', c.paris_aligned ? 'Yes' : 'No']);` |
| `csv` | `[header, ...rows].map(r => r.join(',')).join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob);` |
| `data` | `{ generated: new Date().toISOString(), aggregates: agg, countries: COUNTRY_DATA, portfolioExposure: countryExposure, modules: MODULES.map(m => ({ name: m.name, status: m.status })) };` |
| `avgCarbon` | `regionCountries.reduce((s, c) => s + c.carbon_price, 0) / rcLen;` |
| `avgRenew` | `regionCountries.reduce((s, c) => s + c.renewable_pct, 0) / rcLen;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRY_DATA`, `DATA_SOURCES`, `MODULES`, `PIE_COLORS`, `POLICY_DIMS`, `REGULATIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Risk Dimensions | — | Hub config | Number of sovereign risk dimensions integrated into the composite sovereign risk index. |
| Countries Monitored | — | Sovereign database | Countries with active monitoring across all six sovereign risk dimensions. |
| Portfolio Avg Risk | — | Weighted avg | AUM-weighted mean composite sovereign risk index across active sovereign bond portfolio. |
- **All sovereign module outputs, portfolio sovereign weights** → Composite aggregation, dimension attribution, portfolio aggregation → **Sovereign risk index, radar charts, risk attribution, portfolio alerts**

## 5 · Intermediate Transformation Logic
**Methodology:** Composite Sovereign Risk Index
**Headline formula:** `Σ (Risk_Dimension_i × w_i)`

Weighted composite of sovereign risk scores across six dimensions: climate, ESG, debt, physical, social and nature risk.

**Standards:** ['IMF', 'World Bank', 'NGFS', 'ND-GAIN']
**Reference documents:** IMF Sovereign Risk Framework; World Bank Sovereign ESG Data Portal; NGFS Climate Scenarios 2023; ND-GAIN Country Index

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch (partial).** The guide describes a live "Composite Sovereign Risk Index"
> aggregating six risk *dimensions* (climate, ESG, debt, physical, social, nature) with weights
> `Σ(Risk_Dimension_i × w_i)`. The code does **not** compute a six-dimension composite anywhere —
> it is a navigation hub with a single hand-curated `esg` field per country (plus separately
> hand-curated `ndgain`, `jt_score`, `portfolio_itr` fields) and a portfolio-**weighted mean of ESG
> only**. The in-page tooltip text (line ~720) claims the ESG field itself is "40% environmental /
> 30% social / 30% governance weighted aggregate… updated annually from ND-GAIN, WDI, TI" — but
> that weighting is not computed in this file; `esg` is a static literal per country, presumably
> pre-computed offline. Sections below describe what the code actually does: aggregate and route
> to five other sovereign/climate-policy modules using a real, hand-typed 41-country reference table.

### 7.1 What the module computes

`COUNTRY_DATA` is a **hand-typed table of 41 sovereigns** (not PRNG-generated) with plausible
real-world-calibrated fields: `esg` (0–100), `ndgain` (ND-GAIN readiness), `carbon_price` ($/tCO₂),
`ets`/`taxonomy`/`cbam` (booleans), `coal_phaseout` (year), `ev_target` (%), `renewable_pct`,
`emissions_capita` (tCO₂e), `green_bond_bn` ($Bn), `jt_score` (Just Transition score), `hdi`, `cpi`,
`net_zero` (target year or null), `nz_law` (boolean), `paris_aligned` (boolean), `portfolio_itr`
(implied temperature rise, °C), `workers_affected`. These look like analyst-curated approximations
of real 2023/24 published figures (e.g. Sweden carbon price $120/t, HDI 0.947 — consistent with
published Swedish carbon tax and UNDP HDI figures) rather than PRNG output.

### 7.2 Aggregation formulas

```js
n = COUNTRY_DATA.length (=41, guide says "40")
wtdESG        = Σ_holdings (esg_c × weight_c/100)  ||  Σ_all(esg)/n      // fallback if weighted sum is 0/falsy
avgNDGain     = Σ ndgain / n
parisAligned% = count(paris_aligned) / n × 100
nzPct%        = count(net_zero truthy) / n × 100
avgCarbonPrice= Σ carbon_price / n
avgRenewable  = Σ renewable_pct / n
avgEmissionsCapita = Σ emissions_capita / n
totalGreenBond= Σ green_bond_bn
avgJT         = Σ jt_score / n
avgHDI        = Σ hdi / n           (3dp)
avgCPI        = Σ cpi / n
coalPhaseout  = count(coal_phaseout ≤ 2035)
```

`wtdESG`'s `||` fallback is a latent edge case: if the portfolio-weighted sum evaluates to exactly
`0` (e.g. a portfolio whose only holding maps to a country absent from `COUNTRY_DATA`, giving
`esg||50` weighted by a real weight that nets to 0 through rounding), the code silently falls back
to the unweighted 41-country mean rather than showing a genuine zero — a minor but real
`0 is falsy` footgun, not a division-by-zero.

### 7.3 Calculation walkthrough

1. **Holdings** — `holdings` loads the user's saved portfolio from localStorage (`LS_PORTFOLIO`)
   and joins each position to `GLOBAL_COMPANY_MASTER` by ISIN/ticker to recover a `country` field;
   falls back to the first 30 rows of `GLOBAL_COMPANY_MASTER` if no portfolio is saved.
2. **Country exposure** — `countryExposure` buckets holdings by `country`, summing weights (or an
   equal `1/N` split if a holding has no weight), then joins each bucket to its `COUNTRY_DATA` row.
   Any holding whose country string doesn't exactly match a `COUNTRY_DATA.name` silently gets
   `undefined` ESG/ND-GAIN/etc. fields (spread of `cd` when `cd` is undefined yields no extra keys,
   so those rows show blank metrics rather than erroring).
3. **KPI strip** — 13 headline KPI cards render the `agg` object fields directly.
4. **Region aggregation / heatmap / rankings** — `regionData`, `filteredCountries` (sortable table),
   and ESG-tier buckets (`Leading ≥65`, `Lagging <35`, etc.) are all derived by filtering/sorting
   the same static 41-row table — no additional modelling.
5. **Module tiles** — `MODULES` (5 entries: Sovereign ESG Ratings, Climate Policy Dashboard, Macro
   Transition Pathways, Just Transition Monitor, Paris Agreement Alignment) are navigation cards
   whose `kpiKey` links back to fields on this same aggregate object — the hub is a launcher, not an
   independent risk engine.
6. **Export** — a JSON snapshot (`generated`, `aggregates`, `countries`, `portfolioExposure`,
   `modules`) downloadable via `URL.createObjectURL`.

### 7.4 Worked example

For the full 41-country table (unweighted, no portfolio loaded so `wtdESG` fallback fires):

`avgHDI = Σ hdi / 41`. Spot-checking three representative rows: Sweden `hdi=0.947`,
India `hdi=0.633`, Nigeria `hdi=0.535` — the true 41-country mean sits in the "Very High" global
HDI band (~0.80s) because the table over-represents high-income OECD sovereigns (24 of 41 rows are
Europe/North America/rich Asia-Pacific) relative to their true share of the 197-country UN
membership — a **sampling bias** any weighted portfolio comparison should account for.

`coalPhaseout = count(coal_phaseout ≤ 2035)`. Scanning the table: Sweden (2020), Norway (2025),
Denmark (2028), Finland (2029), Switzerland (2025), UK (2024), France (2022), Italy (2025),
Austria (2025), Ireland (2025) — **10 countries** commit to phase-out by 2035 among the 41 (24%),
versus the IEA's global assessment that only a minority of coal-dependent economies (China, India,
Indonesia, Vietnam, South Africa) have any phase-out date at all — consistent with the table's
skew toward committed OECD economies.

### 7.5 Companion analytics

- **Policy heatmap** — 6 `POLICY_DIMS` (carbon price, ETS, taxonomy, CBAM, coal phase-out, EV
  target) rendered as a country × policy matrix.
- **Energy transition trajectory** — a 2020–2050 global renewable-share fan (`current_policy`,
  `stated_policy`, `net_zero_2050` series) built from a simple linear formula
  `base + i×slope` (`base=27+i×2`, slopes 1.5/3.2/6.5 pp per 5-year step) — illustrative scenario
  spread, not sourced from IEA WEO scenario data despite being labelled with IEA-style scenario
  names.
- **Regulatory landscape** — 8 hand-typed real regulations (EU CBAM, EU Taxonomy, CSDDD, SEC
  Climate Rules, ISSB S1/S2, Japan GX, India BRSR Core, Singapore Taxonomy) with real effective
  dates — descriptive reference table, not computed.
- **Data Sources tile** — lists 6 real named providers (ND-GAIN, Climate Action Tracker, IEA, UNFCCC
  NDC Registry, World Bank WDI, ILO) as provenance for the (offline-computed) country table.

### 7.6 Data provenance & limitations

- `COUNTRY_DATA` is hand-curated, plausible, and internally consistent with published real-world
  figures for the countries checked, but is a **static, non-refreshing snapshot** with no version
  date recorded in the file and no live pull from the 6 named data sources.
- The in-page claim that `esg` is a live 40/30/30-weighted aggregate is not reproducible from this
  file — the weighting logic lives (if anywhere) upstream of this static array.
- `n = COUNTRY_DATA.length` is used as the averaging denominator throughout — correct as coded, and
  a fix relative to the historical `/60`-hardcoded-denominator bug documented elsewhere in this
  sovereign module family (`sovereign-esg-scorer` REM-38 backlog), but note the table actually has
  **41** rows while several KPI captions say "40 nations tracked" — a one-off narrative/data
  mismatch.
- No confidence intervals, data-vintage tags, or missing-data handling are shown per country.

**Framework alignment:** ND-GAIN (readiness index, real methodology cited but not reproduced here),
World Bank WDI (HDI/CPI source), UNFCCC NDC Registry / IEA World Energy Outlook (context for the
transition-trajectory chart, not literally sourced), ILO Just Transition (context for `jt_score` and
`workers_affected`), IMF/World Bank sovereign risk framing (guide-level, not implemented as a
6-dimension composite in this file).

## 9 · Future Evolution

### 9.1 Evolution A — A real six-dimension composite fed by the sibling sovereign engines (analytics ladder: rung 1 → 3)

**What.** The §7 flag shows the gap between promise and code: the hub advertises a "Composite Sovereign Risk Index" over six dimensions (climate, ESG, debt, physical, social, nature) but computes **only a portfolio-weighted mean of a single hand-typed `esg` field** — no six-dimension composite exists, and the in-page tooltip claiming `esg` is a live 40/30/30 aggregate is not reproducible from this file. The 41-country `COUNTRY_DATA` table is genuinely hand-curated with plausible real figures (Sweden $120/t carbon price, HDI 0.947), and it correctly uses `n = length` as the denominator (fixing the historical `/60` bug in the sibling family). Evolution A makes the hub the real aggregation node it claims to be.

**How.** (1) Wire the hub to the six sibling engines it names — pull the climate score from `sovereign-climate-risk`, ESG from the canonical `sovereign-esg` pipeline, debt from `sovereign-debt-sustainability`, physical from `sovereign-physical-risk`, nature from `sovereign-nature-risk`, social from the social index — and compute the `Σ(dimension × weight)` composite for real. (2) Replace the static `esg` literal and other hand-typed fields with live pulls, adding the data-vintage tags the deep-dive notes are absent. (3) Implement the "top-5 risk drivers per country" pillar attribution the workflow promises. (4) Fix the "40 nations" caption to match the 41 rows (or vice versa).

**Prerequisites.** The six sibling engines must expose consumable per-country scores (several are themselves tier-B; this hub's value depends on their Evolution-A work); the composite weights need documenting. **Acceptance:** the composite is a real weighted sum of six sourced dimensions; each dimension carries a source vintage; the top-5 driver attribution reflects the actual dimension contributions.

### 9.2 Evolution B — Master sovereign-risk desk orchestrator (LLM tier 3)

**What.** The hub is explicitly the "master sovereign risk dashboard" — the natural home for a desk-level orchestrator. Evolution B routes across the six sovereign modules to answer "give me a full risk profile for this sovereign", "which of my holdings face the worst combined climate-plus-debt risk", "build a sovereign-risk memo for the investment committee" — sequencing calls across the composed engines and synthesising a report-studio artifact.

**How.** Tier-3 pattern: the orchestrator uses `module_tags.json` and the sovereign-module interconnection graph to route (assess climate → ESG → debt → physical → nature → social), each call returning real engine output, composed into a memo with per-dimension provenance. Portfolio-level questions apply the AUM weights the hub already holds. Every figure carries its source engine and vintage; the six-dimension composite is asserted only when all dimensions resolve.

**Prerequisites (hard).** Evolution A — an orchestrator narrating a "six-dimension composite" that the hub computes from one ESG field would fabricate five-sixths of its own headline. **Acceptance:** every dimension score in a memo traces to a specific engine call; the composite appears only when all six dimensions are sourced; a sovereign missing a dimension is flagged, not silently averaged.