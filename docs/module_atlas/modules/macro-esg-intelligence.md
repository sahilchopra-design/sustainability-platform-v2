# Macro ESG Intelligence
**Module ID:** `macro-esg-intelligence` · **Route:** `/macro-esg-intelligence` · **Tier:** B (frontend-computed) · **EP code:** EP-MISC · **Sprint:** Platform

## 1 · Overview
Country-level macro ESG intelligence dashboard integrating ND-GAIN climate vulnerability, World Bank WGI governance indicators, UNDP HDI, policy tightening risk indices, NGFS physical risk GDP drag estimates, and BloombergNEF/IRENA green investment flow data. Supports sovereign ESG integration and country-level climate risk overlay for EM portfolios.

> **Business value:** Used by sovereign bond analysts, EM equity managers, and country risk officers to integrate macro ESG and climate risk factors into sovereign credit assessment and country allocation decisions.

**How an analyst works this module:**
- Select countries or region for macro ESG analysis
- Choose NGFS scenario and time horizon for climate overlay
- Review composite scores, policy risk, and green investment flows
- Export country ESG scorecard for sovereign bond or EM equity analysis

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `CodeBlock`, `InfoBox`, `KNOWN_LEIS`, `KpiCard`, `LiveBadge`, `MACRO_EVENTS`, `PANEL_COUNTRIES`, `SEED_EUROSTAT`, `SEED_IMF`, `SEED_LEI`, `SectionTitle`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SEED_LEI` | 10 | `lei`, `entity`, `legalName`, `name` |
| `KNOWN_LEIS` | 12 | `lei`, `country`, `status` |
| `MACRO_EVENTS` | 13 | `event`, `gdpImpact`, `esgBefore`, `esgAfter`, `sentiment` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `MAXIT` | `200, EPS = 3e-7, FPMIN = 1e-30;` |
| `qab` | `a + b, qap = a + 1, qam = a - 1;` |
| `del` | `d * c; h *= del;` |
| `pivot` | `A[col][col] \|\| 1e-12;` |
| `beta` | `XtXinv.map(row => row.reduce((s, v, idx) => s + v * XtY[idx], 0));` |
| `yHat` | `X.map(row => row.reduce((s, v, idx) => s + v * beta[idx], 0));` |
| `resid` | `y.map((yi, i) => yi - yHat[i]);` |
| `RSS` | `resid.reduce((s, e) => s + e * e, 0);` |
| `yMean` | `y.reduce((s, v) => s + v, 0) / n;` |
| `TSS` | `y.reduce((s, v) => s + (v - yMean) ** 2, 0);` |
| `dfModel` | `k - 1;          // predictors, excludes intercept` |
| `sigma2` | `dfResid > 0 ? RSS / dfResid : 0;` |
| `tStats` | `beta.map((b, i) => (se[i] > 0 ? b / se[i] : 0));` |
| `pValues` | `tStats.map(t => (dfResid > 0 ? tTestPValue(Math.abs(t), dfResid) : 1));` |
| `SEED_IMF` | `['USA','CHN','GBR','DEU','FRA','JPN','CAN','AUS','IND','BRA','ZAF','NGA','MEX','IDN','TUR'].map((country,i) => ({` |
| `PANEL_COUNTRIES` | `['USA','CHN','GBR','DEU','FRA','JPN','CAN','AUS','IND','BRA','ZAF','NGA','MEX','IDN','TUR','KOR','ARG','SAU','NLD','SWE'].map((c,i)=>c);` |
| `result` | `Object.entries(values).slice(0, 60).map(([country, yearData]) => ({` |
| `countries` | `Object.entries(geo).map(([code, name]) => {` |
| `valIdx` | `0 * (gPos * tPos) + geoIdx * tPos + timeIdx;` |
| `topRenewable` | `[...eurostatDisplay].sort((a,b) => b.renewable - a.renewable).slice(0,10);` |
| `imfGdpChart` | `imfDisplay.slice(0,15).map(d => ({` |
| `regimes` | `imfDisplay.map((d,i) => {` |
| `esgScore` | `45 + sr(i*13)*40;` |
| `PPred` | `F * F * P + Q;` |
| `panelData` | `PANEL_COUNTRIES.map((c,i) => {` |
| `gdp` | `-1 + sr(i*7)*6;` |
| `renewable` | `10 + sr(i*11)*70;` |
| `trade` | `20 + sr(i*13)*100;` |
| `esg` | `40 + 0.8*gdp + 0.15*renewable + 0.05*trade + fe + (sr(i*17)-0.5)*5;` |
| `PANEL_REG_VARS` | `['Intercept', 'GDP Growth', 'Renewable %', 'Trade/GDP'];` |
| `sovereignData` | `PANEL_COUNTRIES.map((c,i) => ({` |
| `scatter` | `imfDisplay.map((d,i) => ({` |
| `regimeSummary` | `['Expansion','Moderate','Stagnant','Recession'].map(regime => {` |
| `avgESG` | `group.length ? group.reduce((s,r)=>s+r.esgScore,0)/group.length : 0;` |
| `grangerData` | `PANEL_COUNTRIES.slice(0,10).map((c,i)=>({` |
| `euTaxonomy` | `SEED_EUROSTAT.slice(0,10).map((c,i) => ({` |
| `feCoefs` | `PANEL_REG_VARS.map((v, i) => ({` |
| `fePlot` | `panelData.map(d => ({ country: d.country, FE: d.fe }));` |
| `delta` | `e.esgAfter - e.esgBefore;` |
| `sorted` | `[...sovereignData].sort((a,b) => a.esgScore - b.esgScore);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `KNOWN_LEIS`, `MACRO_EVENTS`, `PANEL_COUNTRIES`, `PANEL_REG_VARS`, `SEED_EUROSTAT`, `SEED_IMF`, `SEED_LEI`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Composite Country ESG Score | `w_e·env + w_s·social + w_g·gov − climate_discount` | ND-GAIN + WGI + NGFS | Higher scores indicate stronger macro ESG positioning; sovereign bond spreads show -0.3 correlation with country ESG scores in EM. |
| Physical Risk GDP Drag (2030) | `NGFS REMIND model GDP impact at country level` | NGFS Phase IV scenarios | Estimated % GDP loss by 2030 under NGFS Hot House World (3°C+); material for sovereign credit risk analysis. |
| Green Investment Flow (USD bn/yr) | `BloombergNEF + IRENA renewable energy investment` | BloombergNEF Energy Transition Investment | Annual clean energy investment flow; countries with >$50bn indicate strong transition momentum and policy effectiveness. |
- **ND-GAIN + WGI + NGFS + BloombergNEF APIs → country-level datasets** → Score normalisation → climate discount calibration → composite score → **Country ESG scorecards with climate risk overlay for sovereign analysis**

## 5 · Intermediate Transformation Logic
**Methodology:** Composite Country ESG Score with Climate Overlay
**Headline formula:** `country_ESG = w_e·env_score + w_s·social_score + w_g·gov_score − climate_risk_discount`

Environmental scores draw on ND-GAIN readiness and vulnerability indices (updated annually). Governance scores use WGI rule of law, control of corruption, and government effectiveness. Climate risk discounts are calibrated from NGFS REMIND/ENGAGE model GDP impact pathways at 1.5°C, 2°C, and 3°C. Policy tightening risk is scored by tracking carbon tax implementation pace vs NDC commitments using UNDP NDC Registry.

**Standards:** ['ND-GAIN Country Index (Notre Dame)', 'World Bank Worldwide Governance Indicators', 'NGFS Climate Scenarios GDP Impact Models']
**Reference documents:** ND-GAIN Country Index Methodology; World Bank WGI 2024; NGFS Phase IV Climate Scenarios GDP Impact Estimates; IRENA World Energy Transitions Outlook 2024

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (partial).** The guide's formula `country_ESG = w_e·env + w_s·social +
> w_g·gov − climate_risk_discount` is not implemented as such — the module instead runs several
> independent statistical demonstrations (Kalman filter, panel regression, Granger causality) whose
> **generative and "estimated" coefficients are circular**: the Panel Data Econometrics tab
> synthesises its `esg` variable directly from the coefficients `0.8/0.15/0.05` and then displays a
> **hard-coded** "F-stat: 24.8 (p<0.001), N=240" text block as though those were independently
> estimated results, when they are simply restating the generative formula. This is flagged below in
> detail. On the positive side, this module is **one of the few in this batch that makes real live
> public-API calls** (GLEIF, IMF, Eurostat, World Bank) with honest "LIVE"/"SEED" badging on failure.

### 7.1 What the module computes

Ten tabs combine (a) genuine live external-API integrations with graceful synthetic fallback, and
(b) several statistical-methodology demonstrations built on synthetic data:

```js
// Live fetch pattern (repeated for GLEIF, IMF, Eurostat, World Bank):
fetch(realApiUrl)
  .then(r => r.json())
  .then(d => { if (parsedResultsExist) { setLiveData(d); setLive(true); } else { setData(SEED_*); } })
  .catch(() => setData(SEED_*));
```
- **GLEIF Entity Resolution**: real call to `api.gleif.org/api/v1/lei-records` — genuinely resolves
  a company name to its real Legal Entity Identifier via the actual GLEIF registry.
- **IMF Macro-ESG**: real call to `imf.org/external/datamapper/api/v1/NGDP_RPCH` (GDP real growth %).
- **Eurostat EU Analytics**: real call to `ec.europa.eu/eurostat/.../sdg_07_40` (renewable energy
  share SDG indicator), with genuine multi-dimensional JSON-stat index parsing (`geoIdx×tPos+timeIdx`).
- **World Bank Trade & ESG**: real call to `api.worldbank.org/v2/country/all/indicator/NE.TRD.GNFS.ZS`
  (trade % of GDP).

### 7.2 Parameterisation

| Construct | Provenance |
|---|---|
| GLEIF/IMF/Eurostat/World Bank endpoints | **Real**, correctly-formed public API URLs; genuinely fetched client-side at runtime |
| `SEED_LEI`, `SEED_IMF`, `SEED_EUROSTAT` | Fallback synthetic/hand-entered data shown only if the live fetch fails or returns empty — labelled honestly via the `LiveBadge` component (`⬤ LIVE` vs `◌ SEED`) |
| `KNOWN_LEIS` (80 entries) | 10 real named companies with correct-format (20-char) LEI codes + 70 synthetic "Global Corp N" filler rows with fabricated `SIM...XX` LEI-format strings |
| `MACRO_EVENTS` (12) | Real historical events (COVID-19, COP26, Russia-Ukraine War, US IRA, ISSB S1/S2 publication, CSRD Phase 1) with plausible, directionally-correct GDP-impact and ESG-sentiment deltas — a reasonable qualitative timeline, though the specific point figures (e.g. "ESG sentiment +6 pts") are not sourced to a named index |
| Kalman filter `Q`/`R` | User-adjustable sliders (process/observation noise variance) | Standard Kalman filter tuning parameters, correctly exposed as free parameters |
| Panel regression coefficients (`0.8`, `0.15`, `0.05`) | Author-chosen, used to **generate** the synthetic dependent variable — see §7.4 for the circularity issue |

### 7.3 Calculation walkthrough — genuine algorithms

- **1-D scalar Kalman filter** (`kalmanData`): a textbook-correct implementation —
  `xPred = F·x`, `PPred = F²P + Q`, `K = PPred·H / (H²·PPred + R)`, `x = xPred + K(z − H·xPred)`,
  `P = (1−KH)·PPred` — applied to a synthetic random-walk "true ESG score" (`trueState += noise`,
  clamped 30-90) observed with noise `z = trueState + noise×√R×8`. This is real, correctly-implemented
  recursive Bayesian filtering; only its **input series** (true state + observation) is synthetic.
- **Growth-regime classification**: `regime = gdp2023>3 ? 'Expansion' : gdp2023>=1 ? 'Moderate' :
  gdp2023>=0 ? 'Stagnant' : 'Recession'` applied to (live-or-seed) IMF GDP growth data — a correct,
  simple threshold classifier on genuinely-sourced-when-available data.
- **Eurostat JSON-stat parsing**: `valIdx = geoIdx×tPos + timeIdx` correctly implements the flat-index
  decoding scheme Eurostat's dissemination API uses for its multi-dimensional `value` object — a
  non-trivial, correctly-executed piece of real API integration code.

### 7.4 Calculation walkthrough — fabricated statistics

- **Panel Data Econometrics tab**: `esg = 40 + 0.8×gdp + 0.15×renewable + 0.05×trade + fe + noise` is
  used to **generate** each country's synthetic ESG score. The tab then renders a **hard-coded text
  block** — `"F-stat: 24.8 (p<0.001), N=40 countries × 6 years = 240 obs"` — presented as the output
  of a fixed-effects panel regression. Because the "observed" data was generated directly from the
  coefficients being "estimated," any regression fit to it would trivially recover something close to
  0.8/0.15/0.05 by construction — but the code does not even run that regression; it displays a
  **static string**. This is a fabricated-statistics presentation, not a computed one.
- **Granger Causality table**: presented per-country with F-stat/p-value/"Granger-causes ESG?" — the
  `grangerData` array (per the assignment record) is generated via the platform's `sr()` PRNG per
  country, not from an actual lagged-regression Granger test on the panel series.
- **Sovereign ESG Credit tab**: `esgScore = 40+sr(i*7)*50`, `cdsSpread = 20+sr(i*11)*300`, `greenium =
  -20+sr(i*13)*10` are independently seeded — any displayed correlation between ESG score and CDS
  spread ("greenium") is coincidental, not modelled, despite the guide's claim of a "-0.3 correlation"
  finding.

### 7.5 Worked example — Kalman filter, month 1

`kalmanQ=0.1, kalmanR=0.5`, `trueStart=60, P=5, F=H=1`. At `t=0`:
```
trueState = 60 + (sr(1)-0.5)*2;  sr(1)=frac(sin(2)*10000)=frac(9092.97)=0.974 → trueState=60+0.948=60.95
z = 60.95 + (sr(3)-0.5)*sqrt(0.5)*8;  sr(3)=frac(sin(4)*10000)=frac(-7568.02)=0.398(approx, sin(4)≈-0.7568)
  → z ≈ 60.95 + (0.398-0.5)*0.707*8 ≈ 60.95 - 0.577 ≈ 60.37
xPred = 1×60 = 60;  PPred = 1×5+0.1 = 5.1
K = 5.1×1/(1×5.1+0.5) = 5.1/5.6 = 0.911
x = 60 + 0.911×(60.37-60) = 60 + 0.337 = 60.34
P = (1-0.911)×5.1 = 0.454
```
Correct Kalman recursion given the (synthetic) observation stream.

### 7.6 Data provenance & limitations

- **Genuine strength**: this module correctly implements live-fetch-with-honest-fallback for 4 real
  public data sources, a pattern worth replicating elsewhere in the platform.
- **Genuine weakness**: the panel-regression and Granger-causality tabs present **fabricated
  statistical output** (a hard-coded F-stat/p-value string, and per-country random F-stats) dressed
  as econometric results — this is a more serious integrity issue than plain synthetic seed data
  because it specifically mimics the *output format of a rigorous statistical test* without running one.
- Sovereign ESG credit relationships (ESG score vs CDS spread vs greenium) are independently random
  and should not be read as evidence of any real sovereign ESG-pricing relationship.
- `MACRO_EVENTS`' qualitative event/impact pairing is the module's most defensible static content
  (real events, plausible direction), but its point-estimate magnitudes are illustrative.

**Framework alignment:** ND-GAIN, WGI, and NGFS climate-scenario GDP-impact models are named in the
guide as the intended scoring inputs but are not implemented; the module instead demonstrates general
macro-statistical techniques (Kalman filtering, panel regression, Granger causality) applied to a mix
of live and synthetic country-level data. GLEIF LEI resolution is a genuine, correctly-implemented
real-world entity-identification integration.

## 9 · Future Evolution

### 9.1 Evolution A — Run the econometrics on real panels; kill the circular F-stat (analytics ladder: rung 2 → 3)

**What.** §7's assessment is two-sided. Genuinely strong: real live public-API calls (GLEIF, IMF, Eurostat, World Bank) with honest LIVE/SEED badging, and correctly-implemented statistical machinery (OLS with proper t-stats/p-values via incomplete-beta, Kalman filter, panel structure). Genuinely defective: the Panel Econometrics tab is **circular** — the `esg` variable is synthesised from coefficients 0.8/0.15/0.05 plus noise, then a hard-coded "F-stat: 24.8 (p<0.001), N=240" is displayed as if independently estimated, restating the generative formula as a finding. And the guide's composite (`country_ESG = w_e·env + w_s·social + w_g·gov − climate_discount`) is not implemented. Evolution A: (1) implement the composite on real inputs — ND-GAIN (public), World Bank WGI (already live-called), NGFS GDP-drag from the platform's Phase 5 extract — with weights and the climate-discount calibration documented; (2) re-point the panel regression at the *real* IMF/Eurostat panel the module already fetches, so the estimated coefficients are discoveries, not echoes, and the F-stat is computed by the existing (correct) OLS code; (3) delete every hard-coded statistic.

**How.** (1) ND-GAIN ingestion joins the existing WGI live path; the composite computed server-side (`GET /macro-esg/country-score`) so sovereign modules can consume it. (2) The regression demo becomes "ESG score vs macro drivers" on the computed composite over the live panel, with the honest caveat that N is small and identification weak — a true statistical statement replacing a fake one. (3) Granger/Kalman demos either run on real series or are labeled methodology demonstrations. (4) Validation per the §4.1 note: the composite's correlation with EM sovereign spreads (~−0.3 cited) becomes a computed check, not a claim.

**Prerequisites.** ND-GAIN ingestion; the circular-estimation defect logged in the calc-bug backlog. **Acceptance:** every displayed statistic is computed by the OLS code from data fetchable at runtime; the composite decomposes into cited index values; the spread-correlation check runs and reports its actual value.

### 9.2 Evolution B — Sovereign ESG analyst over live macro feeds (LLM tier 2)

**What.** A tool-calling analyst for sovereign bond and EM equity users: "build the ESG scorecard for Indonesia — composite, components, climate discount under Hot House", "which panel countries' governance scores deteriorated in the latest WGI vintage?", "what does the NGFS 3°C GDP drag imply for Nigeria's debt sustainability narrative?" The module's live-API foundation makes this unusually current for the platform — answers can cite same-day GLEIF/IMF/Eurostat fetches with the LIVE/SEED badge state passed through.

**How.** Tool schemas over the composite route and the live-fetch wrappers; every figure carries its source, vintage and live/seed status — the module's own badging convention extended into prose. Statistical claims quote computed regression output with sample size and the identification caveat; the copilot never cites the (deleted) canned F-stat era's style of certainty. Scenario overlays name the NGFS phase and anchor year. Country-allocation questions produce factor decompositions, not recommendations; debt-sustainability framing defers to sovereign-risk modules with the boundary stated.

**Prerequisites.** Evolution A's composite and de-circularised statistics (an analyst narrating a fake F-stat would weaponise the defect); Phase 2 tooling. **Acceptance:** every number in an answer carries source+vintage+live/seed status; regression narratives include N and caveats; scorecards reproduce from logged route calls.