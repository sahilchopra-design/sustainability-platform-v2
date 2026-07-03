# MDB Climate Finance Analytics
**Module ID:** `mdb-climate-finance-dh` · **Route:** `/mdb-climate-finance-dh` · **Tier:** B (frontend-computed) · **EP code:** EP-DH2 · **Sprint:** DH

## 1 · Overview
Tracks and analyses multilateral development bank climate finance commitments, additionality, blended finance leverage ratios, and Paris alignment. Integrates MDB Joint Climate Finance Tracking methodology and evaluates programming effectiveness by sector and region.

> **Business value:** Essential for climate finance researchers, DFI investment committees, sovereign clients of MDBs, and UNFCCC negotiators tracking developed country $100Bn commitment. Provides joint MDB tracking methodology-aligned analysis of climate finance additionality and private mobilisation effectiveness.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `BORROWER_NAMES`, `ENTITIES`, `MDB_NAMES`, `REGIONS`, `SECTORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['Sub-Saharan Africa', 'South Asia', 'East Asia', 'Latin America', 'MENA', 'Eastern Europe'];` |
| `totalClimateFinance` | `mdbs.reduce((a, e) => a + e.climateFinanceCommitted, 0);` |
| `avgPrivateMobilised` | `mdbs.length ? mdbs.reduce((a, e) => a + e.privateCapitalMobilized, 0) / mdbs.length : 0;` |
| `totalProjects` | `borrowers.reduce((a, e) => a + e.projectCount, 0);` |
| `avgAdaptShare` | `mdbs.length ? mdbs.reduce((a, e) => a + e.adaptationShare, 0) / mdbs.length : 0;` |
| `top15Borrowers` | `[...borrowers].sort((a, b) => b.mdbLending - a.mdbLending).slice(0, 15).map(e => ({ name: e.name.slice(0, 10), lending: e.mdbLending }));` |
| `total` | `secEntities.reduce((a, e) => a + (e.type === 'MDB' ? e.climateFinanceCommitted : e.mdbLending), 0);` |
| `additionality` | `Math.min(100, m.privateCapitalMobilized / Math.max(0.1, m.climateFinanceCommitted) * 100 / leverageTarget * 100);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BORROWER_NAMES`, `ENTITIES`, `MDB_NAMES`, `REGIONS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| MDB Climate Finance 2022 | — | MDB Joint Report on Climate Finance 2023 | Total MDB climate finance 2022 — $29Bn mitigation + $44Bn adaptation; below $100Bn Cop26 goal |
| Private Finance Leverage | — | MDB Joint Report 2023 | MDBs mobilise $2.70 private climate finance per $1 of their own investment — target is 1:5 |
| Adaptation Finance Gap | — | UNEP Adaptation Gap Report 2023 | Global adaptation finance flows represent ~10% of what is needed — MDBs provide 87% of public adaptation finan |
- **MDB project databases (World Bank, ADB, EBRD)** → Climate finance tracking → **Institution/sector/region climate finance totals and trends**
- **Rio marker data + climate co-benefit % assessments** → Paris alignment scoring → **Alignment score by MDB and project type vs Common Approach**
- **Private co-investment data** → Leverage ratio calculation → **Private capital mobilised per $1 MDB concessional input**

## 5 · Intermediate Transformation Logic
**Methodology:** MDB Climate Finance Additionality
**Headline formula:** `Additionality = ClimateFinance_MDB / (ClimateFinance_Private - ClimateFinance_CounterfactualBase); LeverageRatio = TotalPrivateMobilised / MDBConcessionalInput`
**Standards:** ['MDB Joint Climate Finance Tracking Methodology 2023', 'OECD DAC Blended Finance Principles 2017', 'GCF Investment Framework', 'MDB Paris Alignment Common Approach 2021']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).