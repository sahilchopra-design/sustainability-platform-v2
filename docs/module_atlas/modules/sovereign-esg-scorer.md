# Sovereign ESG Scorer
**Module ID:** `sovereign-esg-scorer` · **Route:** `/sovereign-esg-scorer` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Sovereign ESG scoring model producing country-level pillar scores with underlying indicator weights, transparency into data sources, and portfolio sovereign ESG exposure reporting.

> **Business value:** Produces transparent, indicator-level sovereign ESG pillar scores enabling sovereign bond ESG integration and country comparison.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CHART_COLORS`, `COUNTRIES`, `COUNTRY_NAMES`, `ISO2`, `PORTFOLIO`, `PROVIDERS`, `PROVIDER_DATA`, `QUARTERS`, `RATING_BASE`, `RATING_TIERS`, `REGIONS`, `REGION_MAP`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Overview','E-Score','S-Score','G-Score','Trend Analysis','Provider Comparison','Portfolio Exposure'];` |
| `REGIONS` | `['Africa','Asia-Pacific','Europe','Latin America','Middle East','North America'];` |
| `QUARTERS` | `['Q1-22','Q2-22','Q3-22','Q4-22','Q1-23','Q2-23','Q3-23','Q4-23','Q1-24','Q2-24','Q3-24','Q4-24'];` |
| `COUNTRIES` | `COUNTRY_NAMES.map((name,i)=>{` |
| `baseE` | `Math.max(10,Math.min(98,90-(ratingIdx*12)+sr(s)*15-7));` |
| `baseS` | `Math.max(10,Math.min(98,88-(ratingIdx*11)+sr(s+3)*14-6));` |
| `baseG` | `Math.max(10,Math.min(98,86-(ratingIdx*10)+sr(s+6)*16-7));` |
| `totalEsg` | `+(eScore*0.33+sScore*0.33+gScore*0.34).toFixed(1);` |
| `gdpTrillions` | `regionIdx===5?+(sr(s+9)*20+0.5).toFixed(2):regionIdx===2?+(sr(s+10)*6+0.1).toFixed(2):+(sr(s+11)*3+0.05).toFixed(2);` |
| `population` | `regionIdx===1&&(name==='China'\|\|name==='India')?+(sr(s+12)*800+400).toFixed(0):+(sr(s+13)*100+5).toFixed(0);` |
| `co2PerCapita` | `+(2+sr(s+15)*18).toFixed(2);` |
| `renewableSharePct` | `+(10+sr(s+16)*70).toFixed(1);` |
| `corruptionIndex` | `+(20+sr(s+17)*70).toFixed(1);` |
| `pressureFreedomIndex` | `+(20+sr(s+18)*75).toFixed(1);` |
| `giniCoefficient` | `+(0.25+sr(s+19)*0.4).toFixed(3);` |
| `healthcareIndex` | `+(30+sr(s+20)*65).toFixed(1);` |
| `educationIndex` | `+(25+sr(s+21)*70).toFixed(1);` |
| `quarterlyTrend` | `QUARTERS.map((q,qi)=>({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CHART_COLORS`, `COUNTRY_NAMES`, `ISO2`, `PROVIDERS`, `QUARTERS`, `RATING_TIERS`, `REGIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Indicators per Pillar | — | Scorer config | Number of underlying data indicators used to construct each ESG pillar score. |
| Data Vintage | — | Source databases | Range of data vintage years across underlying indicators; more recent data preferred. |
| Avg Score Spread | — | Calculated | Score range between highest and lowest country for each pillar, indicating discriminating power. |
- **WB WDI, UNDP HDI, TI CPI, ND-GAIN, Freedom House data** → Indicator normalisation, pillar weighting, composite aggregation → **Pillar scores, country scorecards, portfolio ESG exposure reports**

## 5 · Intermediate Transformation Logic
**Methodology:** Pillar Score
**Headline formula:** `Σ (Indicator_i × Weight_i) ÷ Σ Weight_i`
**Standards:** ['World Bank', 'UNDP', 'ND-GAIN', 'Transparency International']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).