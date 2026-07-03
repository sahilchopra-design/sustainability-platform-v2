# Green Steel LCOP Engine
**Module ID:** `green-steel-lcop-engine` · **Route:** `/green-steel-lcop-engine` · **Tier:** B (frontend-computed) · **EP code:** EP-EG1 · **Sprint:** EG

## 1 · Overview
Levelised Cost of Production analysis for 6 steel production routes: BF-BOF, DRI-EAF-NG, DRI-EAF-H₂, EAF-Scrap, Molten Oxide Electrolysis, and HIsarna+CCS. Models CBAM certificate exposure, H₂ break-even price calculator, and carbon price sensitivity across 22 projects.

> **Business value:** Used by steel producers evaluating decarbonisation investment cases, buyers assessing green premium affordability, investors analysing CAPEX requirements, and policy teams modelling CBAM impacts.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `KpiCard`, `PROJECTS`, `Pill`, `ROUTES`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['LCOP Overview', 'DRI-EAF vs BF-BOF', 'Capital Model', 'H₂ Steel Economics', 'Carbon Price Impact', 'Project Pipeline'];` |
| `route` | `ROUTES[Math.floor(sr(i * 7 + 1) * ROUTES.length)];` |
| `capMt` | `parseFloat((0.5 + sr(i * 11 + 2) * 4.5).toFixed(1));` |
| `country` | `['Germany', 'Sweden', 'USA', 'Japan', 'South Korea', 'India', 'Brazil', 'Australia'][Math.floor(sr(i * 13 + 3) * 8)];` |
| `status` | `['Operating', 'Construction', 'FID', 'Announced', 'Feasibility'][Math.floor(sr(i * 17 + 4) * 5)];` |
| `lcop` | `parseFloat((route.lcop * (0.88 + sr(i * 19 + 5) * 0.28)).toFixed(0));` |
| `greenPremium` | `route.type === 'Green' \|\| route.type === 'Low-carbon' ? Math.round(50 + sr(i * 23 + 6) * 150) : 0;` |
| `avgLcop` | `useMemo(() => filtered.length ? Math.round(filtered.reduce((s, p) => s + p.lcop, 0) / filtered.length) : 0, [filtered]);` |
| `avgCi` | `useMemo(() => filtered.length ? (filtered.reduce((s, p) => s + p.ci, 0) / filtered.length).toFixed(2) : '—', [filtered]);` |
| `greenCount` | `useMemo(() => PROJECTS.filter(p => p.type === 'Green' \|\| p.type === 'Low-carbon').length, []);` |
| `routeWithCarbon` | `useMemo(() => ROUTES.map(r => ({` |
| `sensitivityH2` | `[1, 2, 3, 4, 5, 6, 7, 8].map(p => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ROUTES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| DRI-EAF H₂ break-even H₂ price ($/kg) | `LCOP_DRI-H2 = LCOP_BF-BOF when H2 < break-even` | IEA Hydrogen for Industry 2023 | At carbon price $100/tCO2: green H2 <$2.0/kg makes DRI-EAF-H2 competitive with BF-BOF. IEA projects $1–2/kg H2 |
| CBAM certificate price (€/tCO₂) | `EU ETS spot price applicable to embedded carbon` | EU ETS current price + CBAM Regulation | CBAM fully phased in 2034; steel at 1.85 tCO2/t BF-BOF faces €92–148/t certificate cost per ton at €50–80 ETS. |
| BF-BOF carbon intensity (tCO₂/t steel) | `World average; varies 1.4–2.5` | worldsteel 2023 CO₂ Data Collection | DRI-EAF-H2 achieves 0.05–0.08 tCO2/t with green H2; EAF-Scrap 0.06–0.3 tCO2/t (grid-dependent). |
- **IEA LCOP benchmarks + CBAM regulation + worldsteel emissions data** → 6-route LCOP model + CBAM calculator + H2 break-even engine + carbon sensitivity → **Steel producers, offtakers, infrastructure investors, and policy teams evaluating decarbonisation pathways**

## 5 · Intermediate Transformation Logic
**Methodology:** Green Steel LCOP ($/t)
**Headline formula:** `LCOP = (CAPEX×CRF + OPEX + Feedstock + Energy) / Annual_Output + CBAM_exposure − Green_premium`
**Standards:** ['IEA Iron and Steel Technology Roadmap 2020', 'BNEF Green Steel Market Outlook 2024', 'worldsteel CO₂ Emission Data']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).