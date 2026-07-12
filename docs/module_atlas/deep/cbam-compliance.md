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
