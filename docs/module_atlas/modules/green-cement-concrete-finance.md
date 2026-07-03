# Green Cement & Concrete Finance
**Module ID:** `green-cement-concrete-finance` · **Route:** `/green-cement-concrete-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-EG4 · **Sprint:** EG

## 1 · Overview
Financial and technology analysis for low-carbon cement and concrete: Conventional Portland, Oxyfuel+CCS, LC³, Post-Combustion CCS, Geopolymer, Electric Kiln, and LEILAC. LCA waterfall separating calcination and thermal CO₂, break-even carbon price, and abatement progress by technology.

> **Business value:** Used by cement producers evaluating decarbonisation investments, concrete buyers specifying environmental requirements, project finance teams structuring green cement deals, and policy teams assessing CBAM implications.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `KpiCard`, `PROJECTS`, `Pill`, `TABS`, `TECHNOLOGIES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `tech` | `TECHNOLOGIES[Math.floor(sr(i * 7 + 1) * TECHNOLOGIES.length)];` |
| `capMt` | `parseFloat((0.5 + sr(i * 11 + 2) * 4.5).toFixed(1));` |
| `country` | `['Germany', 'France', 'USA', 'Japan', 'India', 'China', 'Brazil', 'UK', 'Spain'][Math.floor(sr(i * 13 + 3) * 9)];` |
| `status` | `['Operating', 'Construction', 'FID', 'Engineering', 'Feasibility'][Math.floor(sr(i * 17 + 4) * 5)];` |
| `lcop` | `parseFloat((tech.lcop * (0.9 + sr(i * 19 + 5) * 0.25)).toFixed(0));` |
| `irr` | `parseFloat((5 + sr(i * 23 + 6) * 10).toFixed(1));` |
| `avgLcop` | `useMemo(() => filtered.length ? Math.round(filtered.reduce((s, p) => s + p.lcop, 0) / filtered.length) : 0, [filtered]);` |
| `avgCi` | `useMemo(() => filtered.length ? (filtered.reduce((s, p) => s + p.ci, 0) / filtered.length).toFixed(2) : '—', [filtered]);` |
| `lcaComparison` | `TECHNOLOGIES.map(t => ({` |
| `carbonValueChart` | `TECHNOLOGIES.map(t => ({` |
| `breakeven` | `t.lcop > 85 ? Math.round((t.lcop - 85) / (0.82 - t.ci)) : 0;` |
| `eff` | `base * (1 - (yr - 2025) * 0.008);` |
| `ccs` | `base * (yr >= 2030 ? (yr - 2025) * 0.018 : 0);` |
| `lc3` | `base * (yr >= 2026 ? (yr - 2025) * 0.012 : 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `TABS`, `TECHNOLOGIES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Cement calcination CO₂ (tCO₂/t clinker) | `Chemical decomposition of CaCO3 → CaO + CO2` | IEA/GCCA Cement Roadmap | Irreducible without CCS or supplementary cementitious materials; LEILAC captures this stream directly. |
| LEILAC CAPEX premium (% vs conventional) | `Limestone Calcination Electrification pilot data` | LEILAC-2 Horizon 2020 Project | LEILAC separates process CO2 for low-cost capture; CAPEX 25–40% higher than conventional kiln; demonstrated at |
| LC³ cost saving vs OPC (%) | `Calcined clay + limestone replace 45% clinker` | IIT Delhi LC3 Technology Research | LC³ (Limestone Calcined Clay Cement) reduces clinker factor to 50% vs 95% OPC; cuts CO2 by 40% and cost by 5–1 |
- **IEA cement roadmap + LEILAC pilot data + LC³ research + GCCA roadmap** → LCA waterfall + 7-tech LCOP model + break-even carbon price + 18 projects → **Cement producers evaluating low-carbon investments, investors assessing CAPEX, and buyers specifying green concrete**

## 5 · Intermediate Transformation Logic
**Methodology:** Cement LCOP Model ($/t)
**Headline formula:** `LCOP = Energy_cost + Raw_material + CAPEX_CRF + CO2_cost − Green_premium`
**Standards:** ['IEA Cement Technology Roadmap 2023', 'GCCA Innovation Fund', 'EU ETS embedded carbon data for cement']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).