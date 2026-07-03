# MDB Climate Finance
**Module ID:** `mdb-climate-finance` · **Route:** `/mdb-climate-finance` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Tracks and analyses climate finance flows from multilateral development banks (World Bank, IFC, ADB, AfDB, EBRD, EIB, IADB) against the $100bn collective goal, Paris alignment targets, and COP28 MDB Joint Climate Finance commitments. Quantifies co-financing leverage ratios, grant element, and private capital mobilisation per institution, region, and sector. Supports OECD DAC Rio marker methodology compliance and MDB Joint Climate Finance Tracking methodology.

> **Business value:** Provides development finance analysts and climate negotiators with a comprehensive view of MDB climate finance flows, leverage effects, and alignment with global climate finance goals, supporting accountability and allocation optimisation.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ANNUAL_CF`, `Badge`, `COUNTRY_ALLOCS`, `CustomTooltip`, `KpiCard`, `MDBS`, `MDB_COLORS`, `MOBILISATION`, `PARIS_SCORES`, `PROJECTS`, `SECTOR_COLORS`, `STAGE_COLORS`, `SectionHeader`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `totalClimateLending` | `MDBS.reduce((s,m) => s+m.climateLendingBnUSD, 0).toFixed(1);` |
| `totalGreenBonds` | `MDBS.reduce((s,m) => s+m.greenBondIssuedBnUSD, 0).toFixed(1);` |
| `avgMobilisation` | `(MDBS.reduce((s,m) => s+m.mobilisationRatio, 0)/MDBS.length).toFixed(1);` |
| `totalGhgAvoided` | `PROJECTS.reduce((s,p) => s+p.co2ImpactMtpa, 0).toFixed(1);` |
| `totalBeneficiaries` | `PROJECTS.reduce((s,p) => s+p.adaptationBeneficiariesM, 0).toFixed(1);` |
| `latestMobilisation` | `MOBILISATION[MOBILISATION.length-1];` |
| `totalMobilised2023` | `Object.keys(MDB_COLORS).reduce((s,k) => s+(latestMobilisation[k]\|\|0), 0).toFixed(0);` |
| `areaData` | `ANNUAL_CF.map(row => ({ ...row, total: Object.keys(MDB_COLORS).reduce((s,k) => s+(row[k]\|\|0), 0) }));` |
| `co2` | `mdbProjs.reduce((s,p)=>s+p.co2ImpactMtpa,0).toFixed(1);` |
| `benef` | `mdbProjs.reduce((s,p)=>s+p.adaptationBeneficiariesM,0).toFixed(1);` |
| `totalSz` | `(mdbProjs.reduce((s,p)=>s+p.sizeMnUSD,0)/1000).toFixed(1);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ANNUAL_CF`, `COUNTRY_ALLOCS`, `MDBS`, `MOBILISATION`, `PARIS_SCORES`, `PROJECTS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| MDB Climate Finance (USD bn) | — | MDB Joint Climate Finance Report 2023 | Total commitments from all seven major MDBs classified as climate finance under joint methodology |
| Private Finance Mobilised (USD bn) | — | OECD DAC private finance mobilisation data | Private capital mobilised by MDB climate operations via guarantees, equity, and other instruments |
| Adaptation Finance Share (%) | — | MDB joint tracking | Proportion of MDB climate finance directed to adaptation and resilience vs. mitigation |
| Grant Element (%) | — | OECD DAC concessionality measure | Degree of concessionality in MDB climate instruments; higher grant element indicates greater subsidy for adapt |
- **MDB annual reports and climate finance disclosures** → Extract project-level climate finance commitments; classify by theme, region, and instrument type → **Structured MDB climate finance database by year, institution, sector, and country**
- **OECD DAC private mobilisation data** → Attribute private capital to triggering MDB instruments; compute leverage ratios → **Private finance mobilisation by instrument type and MDB institution**
- **UNFCCC SCF biennial assessment template** → Aggregate data per SCF taxonomy; compute adaptation/mitigation and public/private splits → **UNFCCC-ready climate finance reporting dataset**

## 5 · Intermediate Transformation Logic
**Methodology:** MDB Climate Finance Leverage Ratio
**Headline formula:** `LR = (Private + Bilateral + Other) / MDB Core Climate Finance`
**Standards:** ['MDB Joint Climate Finance Tracking Methodology 2023', 'OECD DAC Rio Marker Guidance', 'CPI Global Landscape of Climate Finance 2023', 'UNFCCC Standing Committee on Finance Biennial Assessment']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).