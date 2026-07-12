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
