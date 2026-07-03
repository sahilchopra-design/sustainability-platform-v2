# EVIC Analytics
**Module ID:** `owid-evic-analytics` · **Route:** `/owid-evic-analytics` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Calculates and analyses Enterprise Value Including Cash for portfolio companies to support PCAF financed emissions attribution, SFDR principal adverse impact metrics, and TCFD carbon intensity reporting.

> **Business value:** Provides a rigorous, PCAF-aligned EVIC computation engine that underpins accurate financed emissions reporting, SFDR PAI metric calculation, and TCFD carbon intensity disclosures across investment portfolios.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CO2_TIMESERIES`, `COUNTRIES`, `DQ_SOURCES`, `EVIC_DATA`, `SECTORS`, `TICKERS`, `TREND_DATA`, `YEARS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `YEARS` | `Array.from({ length: 34 }, (_, i) => 1990 + i);` |
| `CO2_TIMESERIES` | `useMemo ? (() => {})() : null; // computed inline below` |
| `idx` | `year - 1990;` |
| `noise` | `(sr(COUNTRIES.indexOf(country) * 100 + idx) - 0.5) * country.base * 0.04;` |
| `TREND_DATA` | `YEARS.map(yr => {` |
| `EVIC_DATA` | `TICKERS.map((ticker, i) => {` |
| `marketCap` | `80 + sr(i * 3 + 1) * 2400;        // $B` |
| `totalDebt` | `marketCap * (0.1 + sr(i * 3 + 2) * 0.6);` |
| `cash` | `marketCap * (0.05 + sr(i * 3 + 3) * 0.2);` |
| `minorityInt` | `marketCap * sr(i * 3 + 4) * 0.05;` |
| `evic` | `marketCap + totalDebt + minorityInt - cash;` |
| `scope1` | `50 + sr(i * 5 + 1) * 5000;           // ktCO₂e` |
| `scope2` | `20 + sr(i * 5 + 2) * 2000;` |
| `waci` | `(scope1 + scope2) / (evic / 1000) * 100; // tCO₂e / $M EVIC` |
| `finEmissions` | `(scope1 + scope2) / 1000 * (marketCap / evic); // ktCO₂e` |
| `tabs` | `['OWID CO₂ Time-Series', 'EVIC Calculator', 'Data Quality Monitor', 'Methodology'];` |
| `avg` | `items.length ? items.reduce((sum, e) => sum + e.waci, 0) / items.length : 0;` |
| `pct` | `((co2_2023 - co2_1990) / co2_1990 * 100).toFixed(1);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `COUNTRY_COLORS`, `DQ_SOURCES`, `SECTORS`, `TICKERS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| EVIC Components | — | PCAF Standard v2 2022 | Standard EVIC definition: market capitalisation of equity plus book value of total debt plus minority interest |
| Typical Attribution Factor Range | — | Internal Portfolio Benchmark | Range of PCAF attribution factors for a diversified equity portfolio holding individual positions, reflecting  |
- **Bloomberg/Refinitiv financial data, company balance sheets, equity market prices** → EVIC computation, missing data proxy estimation, attribution factor calculation → **EVIC datasets, financed emissions attribution tables, PCAF and SFDR disclosure outputs**

## 5 · Intermediate Transformation Logic
**Methodology:** PCAF Attribution Factor
**Headline formula:** `AFᵢ = Investmentᵢ / EVICᵢ`
**Standards:** ['PCAF Standard v2 2022', 'SFDR Delegated Regulation Annex I']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).