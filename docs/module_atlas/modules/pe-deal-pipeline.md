# PE Deal Pipeline
**Module ID:** `pe-deal-pipeline` · **Route:** `/pe-deal-pipeline` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Manages and analyses the private equity deal pipeline with integrated ESG and climate screening, enabling systematic pre-screening of opportunities before full due diligence investment.

> **Business value:** Provides PE investment teams with a disciplined, data-driven pipeline screening framework that integrates ESG and climate risk signals early in the deal cycle to improve capital allocation quality.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CO_INVESTS`, `CoInvestTracker`, `DEALS`, `DealPipeline`, `FUNDS`, `FUND_STRUCTS`, `FundStructure`, `GEOGRAPHIES`, `J_CURVE`, `SECTORS`, `STAGES`, `TABS`, `VintagePerformance`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `pick` | `(arr, s) => arr[Math.floor(sr(s) * arr.length)];` |
| `FUNDS` | `["Flagship Fund IV","Growth Equity II","Buyout Fund III","Secondaries I","Co-Invest SPV"];` |
| `GEOGRAPHIES` | `["North America","Europe","Asia-Pacific","MENA","LatAm"];` |
| `stage` | `pick(STAGES, i * 3);` |
| `equity` | `Math.round(ev * (0.25 + sr(i * 11) * 0.35));` |
| `ebitda` | `Math.round(ev / (6 + sr(i * 13) * 6));` |
| `rev` | `Math.round(ebitda / (0.08 + sr(i * 17) * 0.22));` |
| `irr` | `+(15 + sr(i * 19) * 25).toFixed(1);` |
| `moic` | `+(1.5 + sr(i * 23) * 2.5).toFixed(2);` |
| `FUND_STRUCTS` | `FUNDS.map((f, i) => ({` |
| `base` | `-0.15 * Math.exp(-0.3 * yr) + 0.35 * (1 - Math.exp(-0.25 * yr));` |
| `funnelData` | `STAGES.map(s => ({` |
| `sectorData` | `SECTORS.map(s => ({` |
| `pmeR2k` | `+(f.irr * (0.7 + sr(i * 3) * 0.3)).toFixed(1);` |
| `pmeMsci` | `+(f.irr * (0.65 + sr(i * 7) * 0.3)).toFixed(1);` |
| `alpha` | `+(f.irr - pmeR2k).toFixed(1);` |
| `scatterData` | `DEALS.filter(d => d.stage === "Closed").map(d => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `FUNDS`, `GEOGRAPHIES`, `SECTORS`, `STAGES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ESG Screen Pass Rate | — | Internal Benchmark | Fraction of sourced deals passing initial ESG and climate screen before proceeding to full diligence, consiste |
| Climate Taxonomy Alignment Check | — | EU Taxonomy Regulation 2020 | Minimum taxonomy alignment assessment performed at pipeline stage to assess SFDR product classification implic |
- **Deal sourcing CRM, company financial data, ESG controversy databases, climate hazard maps** → Sector exclusion screening, ESG controversy check, climate pre-score, CADS computation → **Pipeline ESG/climate scorecard, deal triage dashboard, LP reporting inputs**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate-Adjusted Deal Score
**Headline formula:** `CADS = α×FinancialScore + β×ESGScore + γ×ClimateRiskScore`
**Standards:** ['PRI PE ESG Integration 2023', 'ILPA ESG Roadmap 2021']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).