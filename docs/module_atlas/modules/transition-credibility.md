# Transition Credibility
**Module ID:** `transition-credibility` · **Route:** `/transition-credibility` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Corporate climate transition plan credibility assessment platform evaluating plans against GFANZ, IPCC and regulatory criteria for ambition, specificity, governance, financing and accountability.

> **Business value:** A 2023 GFANZ analysis found only 10% of Fortune 500 transition plans meet minimum credibility criteria; most lack interim targets, explicit financing plans or governance accountability mechanisms.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMPANIES`, `COMPANY_NAMES`, `COUNTRIES`, `CapExTab`, `Card`, `KPI_DESCS`, `KPI_KEYS`, `KPI_NAMES`, `LobbyingTab`, `MiniBar`, `Pill`, `PortfolioTab`, `SECTORS`, `ScorecardTab`, `SectionTitle`, `Stat`, `TABS`, `TIERS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `genCompanies` | `()=>COMPANY_NAMES.map((name,i)=>{` |
| `sector` | `SECTORS[Math.floor(sr(i*7)*SECTORS.length)];` |
| `country` | `COUNTRIES[Math.floor(sr(i*11)*COUNTRIES.length)];` |
| `composite` | `Math.round(sum/12);` |
| `greenCapex` | `Math.round(sr(i*19)*40+10);` |
| `transCapex` | `Math.round(sr(i*23)*25+5);` |
| `brownCapex` | `Math.max(0,100-greenCapex-transCapex);` |
| `lobbyScore` | `Math.round(sr(i*31)*80+10);` |
| `commitScore` | `Math.round(sr(i*37)*80+10);` |
| `lobbySpend` | `Math.round(sr(i*41)*18+2)*100;` |
| `greenInvest` | `Math.round(sr(i*43)*400+50);` |
| `weight` | `parseFloat((sr(i*53)*3+0.2).toFixed(2));` |
| `tradeAssocs` | `Math.floor(sr(i*61)*4)+1;` |
| `revenue` | `Math.round(sr(i*67)*45+5)*100;` |
| `employees` | `Math.round(sr(i*71)*95+5)*1000;` |
| `netZeroYear` | `netZeroClaim?2040+Math.floor(sr(i*89)*11):null;` |
| `sbtiStatus` | `['Committed','Target Set','None'][Math.floor(sr(i*91)*3)];` |
| `paged` | `filtered.slice(page*PER,(page+1)*PER);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPANY_NAMES`, `COUNTRIES`, `KPI_DESCS`, `KPI_KEYS`, `KPI_NAMES`, `PIE_COLORS`, `SECTORS`, `TABS`, `TIERS`, `TRADE_ASSOCS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Avg Credibility Score | — | Credibility Engine | Mean transition plan credibility score across assessed companies; 70+ considered credible by GFANZ standards. |
| Net Zero Commitment Rate | — | Corporate Disclosures | Proportion of assessed companies with net zero commitments backed by interim science-based targets. |
| Capital Alignment Rate | — | Credibility Engine | Companies whose stated net zero commitments are reflected in capex and R&D allocation patterns. |
- **Corporate Transition Plans, ESG Disclosures, Capex Data, SBTi Registry** → Credibility scoring engine + capital alignment analysis → **Credibility scorecards, red-flag reports, ISSB S2 transition plan disclosures**

## 5 · Intermediate Transformation Logic
**Methodology:** Transition Credibility Score
**Headline formula:** `TCS = Σ (Criterion Score × Weight) / Σ Weight`
**Standards:** ['GFANZ Transition Finance Frameworks 2023', 'IPCC AR6 Mitigation Pathways']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).