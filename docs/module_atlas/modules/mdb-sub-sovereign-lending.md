# MDB/DFI Sub-Sovereign Climate Lending Analytics
**Module ID:** `mdb-sub-sovereign-lending` · **Route:** `/mdb-sub-sovereign-lending` · **Tier:** B (frontend-computed) · **EP code:** EP-DY3 · **Sprint:** DY

## 1 · Overview
MDB/DFI sub-sovereign climate lending analytics covering sovereign guarantee structures, on-lending terms, fiscal space analysis, and climate co-financing ratios for World Bank, ADB, and AfDB operations.

> **Business value:** Provides analytical framework for MDB sub-sovereign climate lending decisions, integrating fiscal space analysis, co-financing ratio benchmarking, and sovereign guarantee structuring.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COUNTRY_ALLOCATIONS`, `INSTRUMENTS`, `Kpi`, `MDBS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `grantElement` | `((faceValue - pv) / faceValue) * 100;` |
| `annualBenefit` | `faceValue * (commercialRate - mdbRate) / 100;` |
| `pvSaving` | `Array.from({ length: tenor }, (_, t) => annualBenefit / Math.pow(1 + commercialRate / 100, t + 1)).reduce((a, b) => a + b, 0);` |
| `blendedRate` | `((blendRatio / 100) * mdbRate + ((100 - blendRatio) / 100) * commercialRate).toFixed(2);` |
| `totalClimate` | `MDBS.reduce((s, m) => s + m.totalLending * m.climateTarget / 100, 0);` |
| `totalLending` | `MDBS.reduce((s, m) => s + m.totalLending, 0);` |
| `allocationChart` | `COUNTRY_ALLOCATIONS.map(c => ({ country: c.country, amount: c.amount, climate: c.climateShare }));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRY_ALLOCATIONS`, `INSTRUMENTS`, `MDBS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Climate Co-Financing Ratio | `Private and other public climate finance mobilised / MDB committed climate finance` | ADB climate finance tracking | World Bank Group target 3x mobilisation; higher ratios in middle-income countries (infrastructure) vs LDCs (gr |
| Sub-Sovereign Fiscal Space | `Net present value of revenue capacity above existing debt service obligations` | IMF Article IV fiscal analysis | Determines maximum additional borrowing capacity for climate investment without crowding out essential service |
| On-Lending Spread | `Interest rate on-lent to sub-sovereign minus MDB sovereign window funding cost` | World Bank treasury pricing | Covers credit enhancement, administrative cost, and currency risk; concessional windows offer 50-100 bps |
- **IMF World Economic Outlook and Article IV reports** → GDP, revenue, debt stock by country → fiscal space calculation → **Sub-sovereign borrowing capacity**
- **MDB project databases (World Bank ARAP, ADB PPIS)** → Historical on-lending terms, co-financing ratios by sector → benchmark analysis → **Structuring comparables**
- **OECD DAC climate finance statistics** → Bilateral and multilateral climate finance flows by country → co-financing ratio validation → **Climate finance attribution**

## 5 · Intermediate Transformation Logic
**Methodology:** Sub-Sovereign Lending Capacity & Co-Financing Analytics
**Headline formula:** `Fiscal Space = Revenue × Coverage Ratio - Existing Debt Service; Co-Financing Ratio = Private Finance Mobilised / MDB Climate Finance Committed`
**Standards:** ['World Bank Sub-Sovereign Finance Guidelines', 'ADB Climate Finance Tracking Methodology', 'OECD DAC Climate Finance Reporting']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).