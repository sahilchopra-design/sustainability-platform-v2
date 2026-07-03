# Climate Blended Finance Analytics
**Module ID:** `climate-blended-finance` · **Route:** `/climate-blended-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DH4 · **Sprint:** DH

## 1 · Overview
Designs and evaluates blended finance structures that combine concessional public capital with private investment to unlock climate finance in emerging markets. Models first-loss tranche sizing, guarantee mechanisms, return enhancement structures, and catalytic capital economics.

> **Business value:** Essential for DFI investment teams structuring climate finance deals, impact investment fund managers designing blended vehicles, and UNFCCC negotiators tracking private climate finance mobilisation. Convergence-aligned analytics enable peer benchmarking of leverage ratios and structure effectiveness.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `COUNTRIES`, `REGIONS`, `SECTORS`, `TABS`, `TRANSACTIONS`, `TYPES`, `TYPE_COLORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TYPES` | `['Guarantee', 'Concessional Loan', 'First-Loss', 'Grant', 'Risk Insurance'];` |
| `REGIONS` | `['Sub-Saharan Africa', 'South Asia', 'East Asia', 'Latin America', 'MENA', 'Eastern Europe'];` |
| `totalSize` | `+(10 + sr(i * 7) * 490).toFixed(1);` |
| `publicShare` | `+(0.2 + sr(i * 11) * 0.6).toFixed(2);` |
| `publicFinance` | `+(totalSize * publicShare).toFixed(1);` |
| `privateFinance` | `+(totalSize * (1 - publicShare)).toFixed(1);` |
| `totalVolume` | `filtered.reduce((a, t) => a + t.totalSize, 0);` |
| `avgLeverage` | `filtered.length ? filtered.reduce((a, t) => a + t.leverageRatio, 0) / filtered.length : 0;` |
| `totalClimateImpact` | `filtered.reduce((a, t) => a + t.climateImpact, 0);` |
| `avgSdg` | `filtered.length ? filtered.reduce((a, t) => a + t.sdgImpact, 0) / filtered.length : 0;` |
| `volumeByType` | `TYPES.map(tp => ({` |
| `scatterLeverage` | `filtered.map(t => ({ x: t.leverageRatio, y: t.climateImpact, name: t.name, type: t.type }));` |
| `volumeBySector` | `SECTORS.map(s => ({` |
| `leverageByRegion` | `REGIONS.map(r => ({` |
| `grantEligible` | `filtered.filter(t => t.publicFinance / Math.max(0.1, t.totalSize) * 100 >= grantElement);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `REGIONS`, `SECTORS`, `TABS`, `TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Climate Blended Finance 2023 | — | Convergence State of Blended Finance 2023 | Annual blended climate finance flows — 75% to energy transition, 25% to adaptation/land use |
| Average Leverage Ratio | — | OECD Blended Finance 2023 | Average private capital mobilised per $1 of public/concessional anchor investment in climate blended finance |
| Climate Finance Gap | — | IPCC AR6 WGIII Chapter 15 | Annual climate investment gap in developing countries — blended finance is primary mechanism to close |
- **Convergence deal database by structure type and sector** → Benchmark leverage analysis → **Average leverage ratios by structure type and geography**
- **DFI concessional capital availability and terms** → Structure optimisation → **Optimal blend ratio for target private IRR and public impact**
- **Climate project financial models by sector** → Blended IRR calculation → **Senior tranche IRR after first-loss protection**

## 5 · Intermediate Transformation Logic
**Methodology:** Blended Finance Leverage Model
**Headline formula:** `CatalyticCapital = TotalDeal - PrivateCapital; LeverageRatio = PrivateCapital / CatalyticCapital; BlendedIRR = Σ [CashFlow_t × PrivateShare / (1+r)^t]`
**Standards:** ['OECD Blended Finance Principles 2019', 'Convergence Blended Finance Database', 'GIIN Blended Finance Principles', 'IFC Blended Finance Framework']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).