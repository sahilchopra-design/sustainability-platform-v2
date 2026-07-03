# Green Ammonia Country Intelligence
**Module ID:** `green-ammonia-country-intelligence` · **Route:** `/green-ammonia-country-intelligence` · **Tier:** B (frontend-computed) · **EP code:** EP-EE4 · **Sprint:** EE

## 1 · Overview
Green ammonia export country intelligence and pipeline analysis. Ranks 20 nations by project pipeline, RE resource quality, policy support, and infrastructure readiness. Maps bilateral deals and identifies infrastructure gaps.

> **Business value:** Used by green ammonia developers, institutional investors, DFIs, and energy ministries to evaluate country competitiveness, bilateral deals, and infrastructure investment priorities.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COUNTRIES`, `KpiCard`, `REGION_COLORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `regions` | `useMemo(() => ['All', ...Array.from(new Set(COUNTRIES.map(c => c.region)))], []);` |
| `totalPipeline` | `useMemo(() => COUNTRIES.reduce((a, b) => a + b.announcedCapacity_mt_yr, 0), []);` |
| `totalOperational` | `useMemo(() => COUNTRIES.reduce((a, b) => a + b.operationalCapacity_mt_yr, 0), []);` |
| `totalElectrolyser` | `useMemo(() => COUNTRIES.reduce((a, b) => a + b.electrolyser_gw_pipeline, 0), []);` |
| `costA` | `380 + (20 - a.portInfraScore * 2) * 5 + sr(a.country.length * 7) * 80;` |
| `costB` | `380 + (20 - b.portInfraScore * 2) * 5 + sr(b.country.length * 7) * 80;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Country Readiness Score | `Weighted composite: RE + policy + infrastructure + financing` | IEA / IRENA H2 Readiness Assessment | Australia highest: world-class solar/wind, ARENA/CEFC funding, existing LNG export infrastructure. |
| Pipeline 2030 (Mt/yr NH3) | `Announced projects targeting ≤2030 commissioning` | BNEF H2 Pipeline Tracker Q3 2024 | Aggregate 200+ Mt announced; probability-weighted delivery 15-25 Mt/yr; completion probability FID ~70%, pre-F |
| Avg LCOA by Country ($/tonne) | `Country-average from announced projects` | IRENA LCOA Study | Lowest: Oman $400-500/t, Chile Atacama $420-520/t, Morocco $450-550/t. |
- **IEA H2 projects database + IRENA readiness + bilateral MOU tracker + LCOA estimates** → Country readiness scoring + pipeline probability weighting + bilateral deal mapping → **Country risk assessment for green ammonia developers and offtakers**

## 5 · Intermediate Transformation Logic
**Methodology:** Country Readiness Scoring & Pipeline Analysis
**Headline formula:** `Readiness = 0.30×RE_resource + 0.25×policy + 0.25×infrastructure + 0.20×financing`
**Standards:** ['IEA Hydrogen Projects Database', 'BNEF H2 Pipeline Tracker', 'IRENA Green Hydrogen Geopolitics 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).