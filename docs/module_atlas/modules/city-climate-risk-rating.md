# City Climate Risk Rating
**Module ID:** `city-climate-risk-rating` · **Route:** `/city-climate-risk-rating` · **Tier:** B (frontend-computed) · **EP code:** EP-DM3 · **Sprint:** DM

## 1 · Overview
Provides comprehensive climate risk ratings for cities combining physical hazard exposure, adaptive capacity, and socioeconomic vulnerability. Models climate-adjusted municipal credit ratings, insurance pricing implications, and city bond spread impacts.

> **Business value:** Essential for municipal bond fund managers incorporating climate risk into city credit analysis, city governments benchmarking climate resilience, and insurers pricing municipal risk. Aligned with Moody's and S&P climate-adjusted municipal rating methodologies.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `CITIES`, `CITY_NAMES`, `KpiCard`, `REGIONS`, `RISK_TIERS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['North America', 'Europe', 'Asia-Pacific', 'Latin America', 'Middle East & Africa'];` |
| `physRisk` | `Math.round(20 + sr(i * 3) * 80);` |
| `floodR` | `+(1 + sr(i * 7) * 9).toFixed(1);` |
| `heatR` | `+(1 + sr(i * 11) * 9).toFixed(1);` |
| `slrR` | `+(1 + sr(i * 13) * 9).toFixed(1);` |
| `droughtR` | `+(1 + sr(i * 17) * 9).toFixed(1);` |
| `airQ` | `+(1 + sr(i * 19) * 9).toFixed(1);` |
| `econRes` | `Math.round(20 + sr(i * 23) * 80);` |
| `infraVuln` | `+(1 + sr(i * 29) * 9).toFixed(1);` |
| `creditImpact` | `+(sr(i * 31) * 4).toFixed(1);` |
| `adaptBudget` | `+(0.1 + sr(i * 37) * 9.9).toFixed(1);` |
| `climDebt` | `+(1 + sr(i * 41) * 9).toFixed(1);` |
| `avgPhysRisk` | `filtered.length ? (filtered.reduce((s, c) => s + c.physicalRiskScore, 0) / filtered.length).toFixed(0) : '0';` |
| `igRiskPct` | `filtered.length ? (filtered.filter(c => c.investmentGradeRisk).length / filtered.length * 100).toFixed(0) : '0';` |
| `totalAdapt` | `filtered.reduce((s, c) => s + c.adaptationBudget, 0).toFixed(1);` |
| `avgCredit` | `filtered.length ? (filtered.reduce((s, c) => s + c.creditRatingImpact, 0) / filtered.length).toFixed(1) : '0';` |
| `regionRisk` | `REGIONS.map(r => {` |
| `top5` | `[...filtered].sort((a, b) => b.physicalRiskScore - a.physicalRiskScore).slice(0, 5);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CITY_NAMES`, `COLORS`, `REGIONS`, `RISK_TIERS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Cities at High Physical Risk | — | C40 Cities Climate Risk 2023 | 800+ cities face significant physical climate risk by 2050 — 1/3 of all major urban centres |
| Climate Credit Impact | — | Moody's Climate Risk Assessment 2022 | Climate risk can cause 1–3 notch credit rating downgrade for exposed coastal/drought-prone cities |
| Municipal Bond Climate Premium | — | S&P Municipal Climate Risk Research 2023 | Climate-exposed municipalities pay 15–40 bps spread premium — growing as investors price risk |
- **Multi-hazard city exposure data (flood, heat, drought)** → Physical risk scoring → **City-level physical risk score by hazard and scenario**
- **City adaptive capacity indicators (income, governance, investment)** → Adaptive capacity calculation → **Net climate risk after adaptive capacity offset**
- **Municipal bond yield data + city financial metrics** → Spread impact modelling → **Climate risk premium in municipal bond pricing**

## 5 · Intermediate Transformation Logic
**Methodology:** City Climate Risk Rating
**Headline formula:** `CityRiskRating = w_P × PhysicalHazard - w_A × AdaptiveCapacity + w_V × Vulnerability; MuniBondSpreadImpact = BaseSpread × (1 + ClimateRiskPremium)`
**Standards:** ["Moody's Cities and Climate Change Risk 2021", 'S&P Global Ratings Climate Risk Assessment Framework', 'C40 City Climate Risk Assessment', 'IPCC AR6 WGII Chapter 8 — Cities']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).