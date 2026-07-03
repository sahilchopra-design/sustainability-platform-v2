# Macro ESG Intelligence
**Module ID:** `macro-esg-intelligence` · **Route:** `/macro-esg-intelligence` · **Tier:** B (frontend-computed) · **EP code:** EP-MISC · **Sprint:** Platform

## 1 · Overview
Country-level macro ESG intelligence dashboard integrating ND-GAIN climate vulnerability, World Bank WGI governance indicators, UNDP HDI, policy tightening risk indices, NGFS physical risk GDP drag estimates, and BloombergNEF/IRENA green investment flow data. Supports sovereign ESG integration and country-level climate risk overlay for EM portfolios.

> **Business value:** Used by sovereign bond analysts, EM equity managers, and country risk officers to integrate macro ESG and climate risk factors into sovereign credit assessment and country allocation decisions.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `CodeBlock`, `InfoBox`, `KNOWN_LEIS`, `KpiCard`, `LiveBadge`, `MACRO_EVENTS`, `PANEL_COUNTRIES`, `SEED_EUROSTAT`, `SEED_IMF`, `SEED_LEI`, `SectionTitle`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
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
| `sovereignData` | `PANEL_COUNTRIES.map((c,i) => ({` |
| `scatter` | `imfDisplay.map((d,i) => ({` |
| `regimeSummary` | `['Expansion','Moderate','Stagnant','Recession'].map(regime => {` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `KNOWN_LEIS`, `MACRO_EVENTS`, `PANEL_COUNTRIES`, `SEED_EUROSTAT`, `SEED_IMF`, `SEED_LEI`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Composite Country ESG Score | `w_e·env + w_s·social + w_g·gov − climate_discount` | ND-GAIN + WGI + NGFS | Higher scores indicate stronger macro ESG positioning; sovereign bond spreads show -0.3 correlation with count |
| Physical Risk GDP Drag (2030) | `NGFS REMIND model GDP impact at country level` | NGFS Phase IV scenarios | Estimated % GDP loss by 2030 under NGFS Hot House World (3°C+); material for sovereign credit risk analysis. |
| Green Investment Flow (USD bn/yr) | `BloombergNEF + IRENA renewable energy investment` | BloombergNEF Energy Transition Investment | Annual clean energy investment flow; countries with >$50bn indicate strong transition momentum and policy effe |
- **ND-GAIN + WGI + NGFS + BloombergNEF APIs → country-level datasets** → Score normalisation → climate discount calibration → composite score → **Country ESG scorecards with climate risk overlay for sovereign analysis**

## 5 · Intermediate Transformation Logic
**Methodology:** Composite Country ESG Score with Climate Overlay
**Headline formula:** `country_ESG = w_e·env_score + w_s·social_score + w_g·gov_score − climate_risk_discount`
**Standards:** ['ND-GAIN Country Index (Notre Dame)', 'World Bank Worldwide Governance Indicators', 'NGFS Climate Scenarios GDP Impact Models']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).