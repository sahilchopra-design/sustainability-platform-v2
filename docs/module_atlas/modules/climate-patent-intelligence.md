# Climate Patent Intelligence
**Module ID:** `climate-patent-intelligence` · **Route:** `/climate-patent-intelligence` · **Tier:** B (frontend-computed) · **EP code:** EP-DF6 · **Sprint:** DF

## 1 · Overview
Analyses climate technology patent portfolios to identify innovation leaders, technology whitespaces, and IP-driven competitive moats. Tracks patent citation networks, technology diffusion rates, and links patent activity to cleantech investment signals and forward earnings potential.

> **Business value:** Valuable for cleantech investors conducting IP due diligence, corporate R&D strategists mapping technology whitespaces, and sovereign wealth funds tracking national innovation competitiveness. Patent intelligence provides 8–15 year forward signal for technology deployment and market leadership.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `Card`, `DOMAIN_GROWTH`, `ENTITIES`, `ENTITY_TYPES`, `GEOS`, `KpiCard`, `TABS`, `TECH_DOMAINS`, `TIME_SERIES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt0` | `v => Number(v).toLocaleString('en-GB', { maximumFractionDigits:0 });` |
| `domain` | `TECH_DOMAINS[Math.floor(sr(i*7)*TECH_DOMAINS.length)];` |
| `type` | `ENTITY_TYPES[Math.floor(sr(i*11)*ENTITY_TYPES.length)];` |
| `geo` | `GEOS[Math.floor(sr(i*13)*GEOS.length)];` |
| `totalPatents` | `Math.round(50 + sr(i*17)*2950);` |
| `grantsPerYr` | `Math.round(totalPatents * (0.08 + sr(i*19)*0.15));` |
| `citationIdx` | `Math.round(50 + sr(i*23)*200);    // relative to sector avg=100` |
| `familySize` | `Math.round(2 + sr(i*29)*18);      // countries per patent family` |
| `fwdCitations` | `Math.round(10 + sr(i*31)*290);    // avg forward citations` |
| `rdSpendPct` | `Math.round(3 + sr(i*37)*25);      // % revenue` |
| `rdSpendAbsMn` | `Math.round(10 + sr(i*41)*990);    // $M` |
| `collabIdx` | `Math.round(20 + sr(i*43)*75);     // collaboration index 0-100` |
| `commercialTrl` | `Math.round(4 + sr(i*47)*5);       // TRL 4-9` |
| `innovScore` | `Math.round((citationIdx/2 + fwdCitations/3 + rdSpendPct*2 + collabIdx*0.3)/4);` |
| `usShare` | `Math.round(20 + sr(i*53)*40);` |
| `cnShare` | `Math.round(15 + sr(i*59)*35);` |
| `epShare` | `Math.round(10 + sr(i*61)*30);` |
| `jpShare` | `Math.round(5  + sr(i*67)*15);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ENTITY_TYPES`, `GEOS`, `TABS`, `TECH_DOMAINS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Clean Energy Patents 2023 | — | WIPO Green Database 2024 | Active clean energy patents globally — solar+wind+storage represent 55% of total |
| Patent-to-Deployment Lag | — | IEA Energy Technology Patents 2023 | Median time from patent filing to commercial deployment in energy technologies |
| China Patent Share | — | WIPO IP Facts & Figures 2023 | China accounts for 44% of clean energy patents globally — up from 8% in 2005 |
- **EPO/USPTO/CNIPA patent grants by IPC/CPC code** → Innovation index calculation → **Company and country patent rankings by technology area**
- **Patent citation network data** → Technology diffusion analysis → **Forward citation rates as deployment leading indicators**
- **Cleantech investment databases (BNEF, Crunchbase)** → Patent-to-investment correlation → **IP strength score correlated with company valuation premium**

## 5 · Intermediate Transformation Logic
**Methodology:** Patent Innovation Index
**Headline formula:** `InnovationIndex = Σ [Citations_i × TRL_weight_i × MarketSize_i]; TechDiffusion = ΔPatentGrantRate / ΔCO2AbatementDeployment`
**Standards:** ['WIPO Green Technology Database', 'EPO Climate Change Mitigation Patents', 'IEA Energy Technology Patents', 'IPCC AR6 WGIII Chapter 16']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `CleanTechAdvancedAnalytics`