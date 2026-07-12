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
