# Hard-to-Abate Sector Transition Finance
**Module ID:** `hard-to-abate-transition` · **Route:** `/hard-to-abate-transition` · **Tier:** B (frontend-computed) · **EP code:** EP-EG6 · **Sprint:** EG

## 1 · Overview
Transition finance intelligence for 6 hard-to-abate sectors: Steel, Cement, Chemicals, Aviation, Shipping, and Aluminium. Maps transition finance instruments (Green Bond, SLL, Transition Bond, Blended Finance, KPI-linked), 16 seeded deals, readiness-abatement radar, and global programmes (EU Innovation Fund, DOE, GFANZ).

> **Business value:** Used by banks structuring transition finance instruments, hard-to-abate companies raising green or sustainability-linked capital, and investors deploying capital into sector decarbonisation with credible transition plans.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `DEALS`, `KpiCard`, `Pill`, `SECTORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sec` | `SECTORS[Math.floor(sr(i * 7 + 1) * SECTORS.length)];` |
| `capex` | `Math.round(100 + sr(i * 11 + 2) * 900);` |
| `country` | `['Germany', 'USA', 'Japan', 'Sweden', 'UK', 'Netherlands', 'Australia', 'India'][Math.floor(sr(i * 13 + 3) * 8)];` |
| `structure` | `['Green Bond', 'SLL', 'Transition Bond', 'Blended Finance', 'KPI-linked'][Math.floor(sr(i * 17 + 4) * 5)];` |
| `irr` | `parseFloat((5 + sr(i * 19 + 5) * 10).toFixed(1));` |
| `dscr` | `parseFloat((1.15 + sr(i * 23 + 6) * 0.70).toFixed(2));` |
| `status` | `['Closed', 'Mandate', 'Diligence', 'Pipeline'][Math.floor(sr(i * 29 + 7) * 4)];` |
| `ci_before` | `parseFloat((0.8 + sr(i * 31 + 8) * 1.2).toFixed(2));` |
| `ci_after` | `parseFloat((ci_before * (0.05 + sr(i * 37 + 9) * 0.25)).toFixed(2));` |
| `avgIrr` | `useMemo(() => filtered.length ? (filtered.reduce((s, d) => s + d.irr, 0) / filtered.length).toFixed(1) : '—', [filtered]);` |
| `totalCapex` | `useMemo(() => filtered.reduce((s, d) => s + d.capex, 0), [filtered]);` |
| `totalEmissions` | `useMemo(() => SECTORS.reduce((s, sec) => s + sec.emissions, 0), []);` |
| `radarData` | `SECTORS.map(s => ({ subject: s.id, readiness: s.readiness, abatement2030: s.abatement2030 * 4, finance: Math.min(100, s.financeNeed / 12) }));` |
| `timelineAbatement` | `[2025, 2028, 2030, 2035, 2040, 2050].map(yr => {` |
| `annualReduction` | `s.emissions * s.abatement2030 / 100;` |
| `carbonValue` | `Math.round(annualReduction * carbonPrice / 1e3);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Hard-to-abate share of industrial CO₂ (%) | `Share of industrial emissions from 6 sectors` | IEA Industrial Decarbonisation Roadmap | These 6 sectors account for ~8 GtCO2/yr; no commercially viable zero-carbon process for all at scale in 2024. |
| Green Bond premium for HtA (bps) | `Greenium vs conventional bond for verified transition plans` | Climate Bonds Initiative + BloombergNEF | Larger greenium where third-party transition plan verification + SBTi alignment; Tata Steel: 8 bps greenium ob |
| Sustainability-Linked Loan margin ratchet (bps) | `Margin step-down if KPI achieved; step-up if missed` | LMA/APLMA SLL Principles 2023 | Common KPIs: tCO2/t production intensity reduction; scope 1+2 absolute target; % renewable energy. |
- **GFANZ framework + IEA industrial data + CBI transition finance criteria** → Sector readiness radar + 16 deals + capital stack + programme intelligence → **Banks structuring transition bonds, industrial companies raising green finance, and investors in hard-to-abate sectors**

## 5 · Intermediate Transformation Logic
**Methodology:** Transition Finance Sizing
**Headline formula:** `Transition_investment = CAPEX_premium_per_sector × Sector_capacity × Phase-in_timeline`
**Standards:** ['GFANZ Transition Finance Framework 2023', 'IEA Clean Energy Investment Tracker', 'Climate Bonds Initiative Transition Finance Criteria']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).