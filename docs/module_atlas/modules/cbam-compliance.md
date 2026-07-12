# CBAM Compliance
**Module ID:** `cbam-compliance` · **Route:** `/cbam-compliance` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
EU Carbon Border Adjustment Mechanism compliance analytics covering embedded carbon calculation for 6 regulated sectors (steel, cement, aluminium, fertilizers, hydrogen, electricity), CBAM certificate procurement strategy, and declarant liability modelling. Tracks third-country carbon prices paid for corresponding CBAM deduction and supports transition period (2023–2025) and full CBAM (2026+) reporting.

> **Business value:** CBAM is the first major border carbon adjustment to enter legal force, creating direct financial liability for EU importers of steel, cement, aluminium, fertilizers, hydrogen, and electricity. By 2030, as EU ETS prices are projected to reach €120–180/tCO₂, CBAM liability for high-volume industrial importers could reach nine-figure annual costs, making proactive compliance analytics essential for procurement and treasury functions.

**How an analyst works this module:**
- Importer Portfolio tab lists EU-importing entities with sector and volume data
- Embedded Carbon tab calculates direct and indirect emissions per imported tonne
- Liability Calculator models annual CBAM cost under ETS price scenarios
- Origin Price Deduction tracks third-country carbon prices paid for CBAM offset
- Certificate Procurement Strategy optimises buying schedule and cost hedge
- Regulatory Calendar shows transition period and full CBAM compliance deadlines

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMMODITIES`, `SUB_INDICES`, `SUB_LABELS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v => typeof v === 'number' ? (v >= 1e9 ? (v / 1e9).toFixed(1) + 'B' : v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? (v / 1e3).toFixed(1) + 'K' : v.toFixed(2)) : v;` |
| `fmtPct` | `v => typeof v === 'number' ? (v * 100).toFixed(1) + '%' : v;` |
| `fmtUsd` | `v => typeof v === 'number' ? '$' + fmt(v * 1000) : v; // kusd to usd display` |
| `productGroups` | `[...new Set(defaultValues.map(d => d.productGroup))];` |
| `badgeS` | `(bg, color) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: bg, color });` |
| `csv` | `[h.join(','), ...data.map(r => h.map(k => JSON.stringify(r[k] ?? '')).join(','))].join('\n');` |
| `sortedByVuln` | `useMemo(() => [...countries].sort((a, b) => b.vulnerabilityIndex - a.vulnerabilityIndex), []);` |
| `vulnHistogram` | `useMemo(() => { const bins = [ { label: '0-0.15', min: 0, max: 0.15, count: 0 }, { label: '0.15-0.25', min: 0.15, max: 0.25, count: 0 }, { label: '0.25-0.35', min: 0.25, max: 0.35, count: 0 }, { label: '0.35-0.45', min: 0.35, max: 0.45, count: 0 }, { label: '0.45+', min: 0.45, max: 1, count: 0 } ];` |
| `subIndexRadar` | `useMemo(() => SUB_INDICES.map(k => ({ name: SUB_LABELS[k].replace('Dependence on ', 'Dep. '), value: +(subIndexAvg[k] \|\| 0).toFixed(3) })), []);` |
| `dvPaged` | `filteredDV.slice(dvPage * DV_PAGE, (dvPage + 1) * DV_PAGE);` |
| `dvTotalPages` | `Math.max(1, Math.ceil(filteredDV.length / DV_PAGE));` |
| `phaseInRevenue` | `useMemo(() => { const totalEmissions = tradeFlows.reduce((s, f) => s + (f.totalEmissions_tco2 \|\| 0), 0);` |
| `eiVsGdp` | `useMemo(() => countries.map(c => ({ name: c.name, iso3: c.iso3, gdpPerCapita: c.gdp_kusd > 0 ? +(c.gdp_kusd / (10 + sr(countries.indexOf(c) * 71) * 90)).toFixed(0) : 0, emissionIntensity: +c.emissionsIntensity_kgco2usd.toFixed(4), vi: +c.vulnerabilityIndex.toFixed(3) })), []);` |
| `riskOppData` | `useMemo(() => countries.map(c => ({ name: c.name, iso3: c.iso3, vi: +c.vulnerabilityIndex.toFixed(3), tradeExposure: c.gdp_kusd > 0 ? +((c.cbamExports_kusd / c.gdp_kusd) * 100).toFixed(4) : 0, hasPricing: c.carbonTax > 0 \|\| c.ets > 0 ? 1 : 0, cbamExports: c.cbamExports_kusd })), []);` |
| `radarData` | `SUB_INDICES.map(k => ({` |
| `compBars` | `SUB_INDICES.map(k => ({` |
| `sorted` | `[...countries].sort((a, b) => (b[si] \|\| 0) - (a[si] \|\| 0));` |
| `avg` | `countries.length > 0 ? countries.reduce((s, c) => s + (c[si] \|\| 0), 0) / countries.length : 0;` |
| `min` | `sorted[sorted.length - 1]?.[si] \|\| 0;` |
| `median` | `sorted[Math.floor(sorted.length / 2)]?.[si] \|\| 0;` |
| `step` | `max > 0 ? max / 5 : 0.2;` |
| `scatterData` | `countries.map(c => ({` |
| `costByCommodity` | `COMMODITIES.map(comm => {` |
| `totalEm` | `flows.reduce((s, f) => s + (f.totalEmissions_tco2 \|\| 0), 0);` |
| `grossCost` | `totalEm * carbonPrice;` |
| `netCost` | `grossCost * pf.factor;` |
| `phaseTimeline` | `phaseIn.map(p => {` |
| `totalNet` | `costByCommodity.reduce((s, x) => s + x.netCost, 0) \|\| 1;` |
| `totalGlobalEmissions` | `tradeFlows.reduce((s, f) => s + (f.totalEmissions_tco2 \|\| 0), 0);` |
| `selEmissions` | `selFlows.reduce((s, f) => s + (f.totalEmissions_tco2 \|\| 0), 0);` |
| `globalTimeline` | `phaseIn.map(p => ({` |
| `compCountryData` | `compareCountries.map(iso => countryMap[iso]).filter(Boolean);` |
| `sortedEI` | `[...countries].sort((a, b) => b.emissionsIntensity_kgco2usd - a.emissionsIntensity_kgco2usd);` |
| `commodityEI` | `Object.entries(commodityPrices).map(([name, data]) => ({` |
| `eiCorrelation` | `countries.map(c => ({` |
| `medianVI` | `sortedByVuln[Math.floor(sortedByVuln.length / 2)]?.vulnerabilityIndex \|\| 0.25;` |
| `exposures` | `riskOppData.map(d => d.tradeExposure).filter(v => v > 0);` |
| `medianExposure` | `exposures.length > 0 ? [...exposures].sort((a, b) => a - b)[Math.floor(exposures.length / 2)] : 0.5;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `SUB_INDICES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| CBAM Annual Liability | `Σ(Import_t × Embedded_C × (ETS_price – Origin_price))` | CBAM Declarant | Annual CBAM certificate cost for EU-importing portfolio companies in 6 regulated sectors |
| Embedded Carbon (steel) | — | EU CBAM Delegated Act defaults | Default embedded carbon per tonne of steel imports; actual values from verified operator declaration |
| CBAM Certificate Price | `Weekly EU ETS average` | CBAM Authority | Certificate price set by weekly average EU ETS auction price; matches ETS exposure |
- **EU customs import data (CN codes, volumes, country of origin)** → Map to CBAM sectors; compute embedded carbon using verified or default factors; apply ETS-origin price gap → **Per-importer CBAM liability schedule with sector breakdown and certificate requirement**
- **EU ETS weekly auction price data** → Compute CBAM certificate price; model liability under price scenarios → **CBAM certificate procurement cost and price scenario sensitivity analysis**

## 5 · Intermediate Transformation Logic
**Methodology:** CBAM embedded carbon liability model
**Headline formula:** `CBAM_liability = Σ_i(ImportTonnes_i × EmbeddedCarbon_i × max(0, EU_ETS_price – Origin_price_i)); EmbeddedCarbon = Direct_emissions + Indirect_emissions_per_tonne`

CBAM certificates cover the gap between EU ETS price and carbon price already paid in country of origin. Embedded carbon includes direct process emissions plus indirect (electricity) emissions per tonne of product using EU methodology or default values. Transition period requires quarterly declarant reports; full CBAM requires annual certificate surrender.

**Standards:** ['EU CBAM Regulation 2023/956', 'EU ETS Directive Phase IV', 'CBAM Delegated Acts (2024)']
**Reference documents:** EU CBAM Regulation (EU) 2023/956; CBAM Implementing Regulation (EU) 2023/1773 (transition period); CBAM Delegated Regulations on calculation methods (2024); EU ETS Phase IV Directive 2018/410

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes an *importer-side declarant
> liability model*: per-importer portfolios, embedded-carbon calculation per consignment, and the
> statutory deduction `max(0, EU_ETS_price − Origin_price_i)` for carbon prices already paid in the
> country of origin, plus a certificate-procurement optimiser. **None of that is implemented.** The
> code is an *exporter-country vulnerability atlas*: it loads a pre-computed 105-country CBAM
> Vulnerability Index dataset (`cbam-vulnerability.json`, "CBAM Vulnerability Monitor v1.2") and
> layers a simple cost simulator `cost = Σ emissions × carbonPrice × phaseInFactor` on top — with
> **no origin-price deduction**, even though `carbonTax` and `ets` fields exist per country. The
> sections below document the code as it behaves; §8 specifies the missing declarant-liability model.

### 7.1 What the module computes

The module is read-dominant: almost every number is loaded from `frontend/src/data/cbam-vulnerability.json`
(105 countries, 600 trade-flow rows, 568 EC default values, 9 phase-in years). The only live
computations are aggregations and the carbon-cost simulator:

```js
// Carbon Cost Simulator (Tab 5), per commodity for the selected exporter country
totalEm   = Σ flows.totalEmissions_tco2          // direct + indirect embedded tCO2 in EU-bound trade
grossCost = totalEm × carbonPrice                 // user slider, default $80/tCO2
netCost   = grossCost × pf.factor                 // CBAM phase-in factor for the selected year
```

The vulnerability index itself is **not computed on the page** — it arrives pre-normalised in the
JSON as `vulnerabilityIndex` plus five sub-indices (`depExports`, `depCbamExports`, `depEuMarket`,
`emissionIntensity`, `carbonPriceSignal`, each 0–1 with `preNorm_*` raw counterparts).

### 7.2 Parameterisation

| Parameter | Value | Provenance |
|---|---|---|
| Carbon price slider | default **$80/tCO₂**, user-adjustable | Synthetic default, order-of-magnitude of 2023–24 EU ETS (€65–100) |
| Phase-in factors | 2026: 2.5% · 2027: 5% · 2028: 10% · 2029: 22.5% · 2030: 48.5% · 2031: 61% · 2032: 73.5% · 2033: 86% · 2034: 100% | JSON `phaseIn`; mirrors the CBAM factor = 1 − free-allocation share under Reg. 2023/956 Art. 31 / ETS free-allocation phase-out |
| Vulnerability classification | Low ≤ p25 (~0.21) · Medium ≤ p50 (~0.23) · High ≤ p75 (~0.32) · else Very High | `ranges['Vulnerability Index']` percentiles from the dataset; hard-coded fallbacks 0.21/0.23/0.32 |
| EC default values | 568 CN-code rows, `directDefault` + `indirectDefault` tCO₂e/t product | Labelled as EC CBAM transitional default values (e.g. Cement CN 25070080: 0.23 direct + 0.08 indirect) |
| Commodity embedded intensities | `commodityPrices[k].directEI/indirectEI` (e.g. Iron & Steel 2.02 + 0.71 tCO₂/t) | Dataset-supplied sector averages |
| Sub-index weights | not visible — index arrives pre-computed | Unknowable from code; equal weighting is implied by the radar but not verifiable |

### 7.3 Calculation walkthrough

1. **Vulnerability Dashboard** — KPIs are straight aggregates: `avgVuln = Σ VI / n`,
   `avgEI = Σ emissionsIntensity / n`, count of countries with `carbonTax === 0 && ets === 0`
   ("No Carbon Pricing"), plus a 5-bin histogram of VI and a radar of `subIndexAvg`.
2. **Country Explorer** — one country's five sub-indices vs the global averages; trade-flow table
   filtered to the country's `iso3`.
3. **Trade Flow Analysis** — flows grouped by country (optionally filtered to one commodity),
   summing `exports_kusd`, `exports_kg`, direct/indirect/total tCO₂.
4. **Carbon Cost Simulator** — the §7.1 formula per commodity; a phase-in timeline reprices the
   country's total embedded emissions at every year's factor; the table shows each commodity's
   share of `totalNet` (`‖ 1` guard against zero).
5. **Phase-In Timeline (global)** — same phase-in repricing on `totalGlobalEmissions` (all 600 flows).
6. **Emission Intensity / Risk & Opportunity** — scatter of VI vs `cbamExports_kusd / gdp_kusd × 100`
   (trade exposure, % of GDP) with a carbon-pricing flag; medians split the quadrants.

### 7.4 Worked example — Carbon Cost Simulator

Country with two CBAM flows to the EU: Iron & Steel 120,000 tCO₂ embedded, Cement 30,000 tCO₂;
slider at $80/tCO₂; phase-in year 2030 (factor 0.485):

| Step | Computation | Result |
|---|---|---|
| Steel gross | 120,000 × 80 | $9.60M |
| Steel net | 9.60M × 0.485 | **$4.656M** |
| Cement gross | 30,000 × 80 | $2.40M |
| Cement net | 2.40M × 0.485 | **$1.164M** |
| Total net CBAM cost | 4.656 + 1.164 | **$5.82M** |
| Steel share | 4.656 / 5.82 | **80.0%** |

Note the omissions: no `max(0, ETS − origin price)` deduction, no free-allocation benchmark netting
below the phase-in factor, no certificate price averaging — the simulator prices *all* embedded
emissions at the full slider price times the phase-in factor.

### 7.5 Companion analytics

- **EC Default Values browser** — searchable/sortable/paginated 568-row table (20/page) of CN-code
  default intensities with product-group averages (`dvByGroup`).
- **Sub-Index Deep-Dive** — per-sub-index ranking with average/median/min stats over 105 countries.
- **India mode** — `isIndiaMode()` swaps in `getIndiaCBAM()` as the first country row, replacing the
  dataset's India entry.
- **Exports** — CSV export of any table; `ReportExporter` and `CurrencyToggle` wrap the KPIs.

### 7.6 Data provenance & limitations

- **Primary data is a bundled real-world-styled dataset** ("CBAM Vulnerability Monitor v1.2",
  105 countries with GDP, EU-export and CBAM-export values in k$, embedded-emission trade flows and
  EC default values). It is static — no API, no vintage refresh.
- **One synthetic series:** the Emission-Intensity-vs-GDP scatter fabricates GDP-per-capita via the
  platform PRNG — `gdp_kusd / (10 + sr(i×71)×90)` — i.e. population is a random 10–100M draw
  (`sr(seed)=frac(sin(seed+1)×10⁴)`). That axis is decorative, not data.
- The cost simulator is an *upper-bound screen*: it ignores origin carbon-price deduction (Art. 9),
  free-allocation netting inside the phase-in factor, verified actual vs default emissions choice,
  and importer-level aggregation. Vulnerability index weighting is not reproducible from the page.
- Phase-in factors match the legislated CBAM/free-allocation phase-out trajectory (2026–2034).

**Framework alignment:** EU CBAM Regulation (EU) 2023/956 (scope: iron & steel, cement, aluminium,
fertilisers, hydrogen, electricity; definitive regime from 2026) · CBAM Implementing Regulation
(EU) 2023/1773 (transitional reporting, default values — the module's 568 CN-code defaults mirror
the EC transitional default-value publication) · EU ETS Directive Phase IV (certificate price =
weekly average ETS auction price; approximated here by a single slider) · The module's phase-in
factors implement Art. 31's link to the ETS free-allocation phase-out (CBAM factor 2.5%→100%,
2026–2034).

## 8 · Model Specification — CBAM Declarant Liability & Certificate Procurement Model

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Supports the decision the guide promises: for an EU importer (authorised CBAM declarant) or a bank
financing one, compute the annual CBAM certificate obligation per consignment, its sensitivity to
ETS prices, and an optimal certificate purchase schedule. Coverage: all imports in CBAM Annex I
CN codes across the 6 regulated sectors, 2026–2034 ramp and steady state.

### 8.2 Conceptual approach

A bottom-up regulatory cash-flow model, structured like a compliance-cost engine in S&P Trucost's
carbon-pricing-risk tool and the carbon-cost modules of BlackRock Aladdin Climate (policy-cost
channel): statutory formula first, market model second. Certificate price risk is modelled on the
EU ETS forward curve (ICE EUA futures), consistent with how MSCI Climate Value-at-Risk prices
policy-cost exposure off traded carbon markets.

### 8.3 Mathematical specification

For importer *p*, good *g*, origin country *o*, year *t*:

```
EmbeddedEm(g,o)   = SEE_direct(g,o) + SEE_indirect(g,o)                  [tCO2e/t]
                    (verified operator data; else EC default × markup m_t)
CertObligation    = Σ_g,o  Q(g,o,t) × EmbeddedEm(g,o) × CBAMfactor(t)
                    − FreeAllocAdj(g,t) − OriginDeduction(g,o,t)
OriginDeduction   = Q × EmbeddedEm × CBAMfactor(t) × min(1, P_origin(o,t)/P_CBAM(t))
Liability(t)      = CertObligation(t) × P_CBAM(t)
P_CBAM(t)         = weekly average EU ETS common-auction closing price (Art. 21)
Hedged cost       = Σ_w  buy_w × F_EUA(w) ;  s.t. holdings ≥ 50% of YTD obligation each quarter
                    (Art. 22 quarterly 50% coverage rule), buy_w ≥ 0
```

| Parameter | Calibration source |
|---|---|
| `SEE default` per CN code | EC CBAM transitional default values (already bundled: 568 rows) |
| Default markup `m_t` | Definitive-period delegated acts (proposed mark-ups on defaults when actuals unavailable) |
| `CBAMfactor(t)` 2.5%→100% | Reg. 2023/956 Annex / ETS Directive free-allocation phase-out (already bundled) |
| `P_origin(o,t)` | World Bank Carbon Pricing Dashboard (tax/ETS rates by jurisdiction); dataset's `carbonTax`, `ets` fields as seed |
| EUA price paths | ICE EUA futures curve; scenario overlays from NGFS Phase IV carbon-price trajectories |
| Electricity indirect EF | Origin-country grid EF (IEA; platform `reference_data` OWID energy tables) |

### 8.4 Data requirements

Consignment-level: CN code, mass, origin, installation ID, verified SEE where available (customs /
ERP extract). Market: EUA spot + futures (ICE/EEX; free proxy: EMBER daily EUA). Policy:
origin-country carbon prices (World Bank dashboard, free). Already in platform: EC default values,
phase-in factors, country carbon-pricing flags (`cbam-vulnerability.json`), OWID grid-intensity
tables in `reference_data`.

### 8.5 Validation & benchmarking plan

- Reconcile computed certificate counts against the EU CBAM Transitional Registry quarterly reports
  for a pilot importer (unit test: default-value path reproduces EC worked examples).
- Sensitivity: ±€20/tCO₂ EUA shock, default-vs-verified SEE switch, origin-price toggle; liability
  should be monotone and continuous in each.
- Benchmark hedging output against a plain-vanilla strip hedge (equal quarterly EUA purchases) and
  against Bloomberg/ICE carbon-desk indications.

### 8.6 Limitations & model risk

Verified SEE data availability is the binding constraint — defaults with markup are conservative by
design; the model must flag default-share of liability. Origin-price deduction rules for partial
rebates remain subject to implementing acts (assume full `min(·)` credit, disclose optimism).
EUA-curve scenarios are not forecasts; procurement optimisation should be run against ≥3 NGFS
price paths with the Art. 22 coverage constraint binding in all.

## 9 · Future Evolution

### 9.1 Evolution A — Real importer portfolios and Comtrade-backed trade flows (analytics ladder: rung 2 → 3)

**What.** This is the importer-liability-focused CBAM module (vs the sibling `cbam-analytics-compliance`'s macro/sector view): it has a genuine liability model (`grossCost = Σ emissions × carbonPrice`, origin-price deduction via `pf.factor`, phase-in timeline), a country-vulnerability index with sub-indices (dependence measures, radar/histogram views), and per-commodity cost breakdowns. Its `tradeFlows` and country data drive real aggregations. The gaps: the trade flows and importer portfolios appear seeded (and a `gdpPerCapita` proxy uses `sr()`), and it's a tier-B frontend without a persisted backend. Evolution A grounds the importer liability calculation.

**How.** (1) Importer portfolios from real EU customs / Comtrade import data (CN codes, volumes, origin) — the platform's Comtrade integration provides the trade side; the importer-entity side comes from user portfolios. (2) The origin-price deduction from real third-country carbon prices (World Bank Carbon Pricing Dashboard), making the corresponding-adjustment deduction accurate per country. (3) Embedded carbon per imported tonne from CBAM Delegated Act defaults plus verified-operator-declaration support (direct + indirect emissions, which the module already separates). (4) The country vulnerability index computed from real trade-exposure and emission-intensity data rather than seeded sub-indices; the `gdpPerCapita` proxy replaced with real GDP. (5) Rung 3: benchmark importer liabilities against the phase-in schedule and validate against published CBAM cost estimates. Coordinate with the two sibling CBAM modules — three CBAM modules should specialise (macro / importer-liability / trade-exposure-mapping), not duplicate.

**Prerequisites.** Comtrade coverage; World Bank carbon prices; real GDP data; the Delegated Act default factors; module-boundary coordination across the CBAM trio. **Acceptance:** importer liabilities derive from real trade flows; origin deductions use real carbon prices; the vulnerability index is computed from real trade/emission data; the `gdpPerCapita` proxy is replaced.

### 9.2 Evolution B — CBAM declarant-compliance copilot (LLM tier 2)

**What.** CBAM declarants (importers) and treasury teams ask "what's our quarterly CBAM certificate requirement for these steel imports?", "how much does the origin carbon price we paid reduce our liability?", "what's our procurement schedule and cost hedge?" — the copilot runs the Evolution-A liability and procurement tools, reports the certificate requirement, origin-price deduction, and procurement strategy, every figure tool-traced.

**How.** Tool schemas over the Evolution-A liability/deduction/procurement routes; grounding corpus is this Atlas record plus the CBAM Regulation 2023/956 references. The copilot's honesty duty: CBAM liability depends on whether embedded carbon uses verified declarations or Delegated Act defaults (defaults are penal), so it states which basis each figure uses and flags where verified data would lower liability; the origin-price deduction requires evidence of carbon price actually paid, which the copilot notes must be documented. Procurement-schedule optimisation presents the cost hedge with tool-computed scenarios. Feeds the trade/compliance desk view alongside the sibling CBAM modules.

**Prerequisites (hard).** Evolution A's real trade flows and factors — a copilot quoting declarant liabilities off seeded imports would misstate a legally-binding financial obligation. **Acceptance:** every liability and certificate figure traces to a tool response; each states its embedded-carbon basis (verified vs default); origin deductions note the evidence requirement; procurement schedules cite tool-computed cost scenarios.