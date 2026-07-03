# Blue Bond Market Analytics
**Module ID:** `blue-bond-analytics` · **Route:** `/blue-bond-analytics` · **Tier:** B (frontend-computed) · **EP code:** EP-DZ2 · **Sprint:** DZ

## 1 · Overview
Blue bond market analytics covering sovereign and corporate issuance, sustainable ocean economy use-of-proceeds (fisheries, maritime transport, coastal resilience), ICMA Blue Bond Principles, and World Bank/ADB blue bond structures.

> **Business value:** Delivers comprehensive blue bond market analytics integrating ICMA alignment scoring, pricing premium analysis, and sustainable ocean economy use-of-proceeds assessment across sovereign and corporate issuers.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `FRAMEWORKS`, `ISSUERS`, `Kpi`, `MARKET_GROWTH`, `OCEAN_RISKS`, `TABS`, `USE_OF_PROCEEDS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `annSaving` | `faceValue * (greeniumBps / 10000);` |
| `totalIssuance` | `ISSUERS.reduce((s, i) => s + i.sizeGbn, 0);` |
| `avgGreenium` | `ISSUERS.length > 0 ? ISSUERS.reduce((s, i) => s + i.greeniumBps, 0) / ISSUERS.length : 0;` |
| `totalCo2Impact` | `USE_OF_PROCEEDS.reduce((s, u) => s + u.co2Mt, 0);` |
| `scatterData` | `ISSUERS.map(i => ({ x: i.sizeGbn, y: i.greeniumBps, name: i.name, rating: i.rating }));` |
| `portfolioTotal` | `portfolio.reduce((s, p) => s + p.amount, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `FRAMEWORKS`, `ISSUERS`, `MARKET_GROWTH`, `OCEAN_RISKS`, `TABS`, `USE_OF_PROCEEDS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global Blue Bond Issuance | `Cumulative blue bond issuance (sovereign + corporate, 2018-2023)` | Climate Bonds Initiative Blue Bond Database | Fastest growing sustainable bond segment; Seychelles (2018) sovereign first; ADB, World Bank leading MDB issue |
| Blue Bond Alignment Score | `Weighted average use-of-proceeds alignment across ICMA Blue Bond Principles categories` | External review / SPO assessment | Scores above 80 qualify for CBI Climate Bonds certification; 70-80 standard green-equivalent; below 70 risks g |
| Blue Greenium vs Vanilla | `Yield differential for blue vs conventional bond by matched issuer/maturity` | Bloomberg BVAL | Emerging premium as investor demand grows; sovereign blue bonds show larger premium than corporate |
- **Climate Bonds Initiative blue bond database** → Issuance terms, use-of-proceeds, impact data → market benchmarking and alignment scoring → **Peer comparison and best practice identification**
- **Bloomberg BVAL and secondary market data** → Real-time pricing for blue and conventional bonds by issuer → greenium calculation → **Pricing premium analysis**
- **FAO fisheries sustainability data** → Stock status, fishing pressure by species → sustainable fisheries eligibility assessment → **Use-of-proceeds alignment scoring**

## 5 · Intermediate Transformation Logic
**Methodology:** Blue Bond Impact & Pricing Analytics
**Headline formula:** `Blue Bond Alignment Score = Σ(Category Weight × Category Compliance); Blue Premium = Yield(conventional) - Yield(blue) in bps`
**Standards:** ['ICMA Blue Bond Principles 2023', 'World Bank Blue Bond Framework', 'Sustainable Ocean Economy Finance Principles (UNEP FI)']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).