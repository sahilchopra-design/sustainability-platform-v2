# Climate Adaptation Portfolio
**Module ID:** `climate-adaptation-portfolio` · **Route:** `/climate-adaptation-portfolio` · **Tier:** B (frontend-computed) · **EP code:** EP-EK5 · **Sprint:** EK

## 1 · Overview
28-asset multi-hazard adaptation portfolio (coastal/flood/heat/NbS/water/EWS) with BCR, IRR, adaptation score, risk-return scatter, benefit attribution (physical risk reduction/productivity/co-benefits/carbon credits), regional radar (EU/APAC/LATAM/Africa/MENA), and 30-year cash flow.

> **Business value:** Used by adaptation fund managers constructing climate resilience portfolios, DFI project teams screening adaptation investments, and sovereign planners prioritising BCR-optimal climate-proofing expenditure.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALLOCATION_BY_TYPE`, `ATTRIBUTION`, `CASHFLOW`, `KpiCard`, `PORTFOLIO_ASSETS`, `Pill`, `REGION_RADAR`, `RISK_RETURN`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `RISK_RETURN` | `PORTFOLIO_ASSETS.slice(0, 20).map(a => ({` |
| `prev` | `idx > 0 ? acc[idx - 1].cumulative : 0;` |
| `TABS` | `['Portfolio Overview', 'Asset Scorecard', 'Risk-Return Map', 'Benefit Attribution', 'Regional Analysis', 'Cash Flow Model'];` |
| `sorted` | `useMemo(() => [...filtered].sort((a, b) => b[sortField] - a[sortField]), [filtered, sortField]);` |
| `avgBCR` | `filtered.length ? filtered.reduce((a, b) => a + b.bcr, 0) / filtered.length : 0;` |
| `totalCapex` | `filtered.reduce((a, b) => a + b.capexM, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALLOCATION_BY_TYPE`, `ATTRIBUTION`, `REGION_RADAR`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Adaptation portfolio avg BCR | `World Bank 2022 project portfolio` | World Bank Adaptation Finance Review 2022 | Early warning systems BCR 12–32x at $18–180M cost; coastal barriers BCR 6.2x at $850M; NbS BCR 7.6x at $65–280 |
| Adaptation finance gap | `Annual gap by 2030 (UNEP)` | UNEP Adaptation Gap Report 2023 | Developing countries need $215–387Bn/yr; MDB disbursements ~$21Bn/yr; private adaptation finance <$5Bn/yr; 40: |
| End-of-life value leakage | `Adaptation co-benefits under-monetised` | Nature4Climate 2023 | Ecosystem service co-benefits rarely monetised in project finance; if captured, NbS BCR rises from 7.6x to 12– |
- **UNEP AGR 2023 + World Bank GFDRR + GCF Adaptation Results Framework + IPCC AR6 WG2 + TCFD + AIIB CSF** → 28-asset portfolio + BCR screener + risk-return map + attribution + regional radar + 30yr CF model → **Adaptation fund managers, DFI portfolio teams, sovereign planners, and MDB climate finance officers**

## 5 · Intermediate Transformation Logic
**Methodology:** Adaptation Portfolio Construction
**Headline formula:** `PortfolioBCR = Σ(weight_i × BCR_i); Adaptation_Score = 0.4 × PhysicalRisk_reduction + 0.3 × CommunityResilience + 0.3 × Cobenefits; Risk_Adjusted_IRR = IRR / sqrt(ClimateRiskScore); CumulativeNCF grows to positive payback year`
**Standards:** ['UNEP Adaptation Gap Report 2023', 'World Bank GFDRR Portfolio Review 2022', 'GCF Adaptation Results Framework 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).