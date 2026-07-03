# Climate Capital Markets Intelligence
**Module ID:** `climate-capital-markets` · **Route:** `/climate-capital-markets` · **Tier:** B (frontend-computed) · **EP code:** EP-DD6 · **Sprint:** DD

## 1 · Overview
Climate capital markets intelligence covering green, sustainability, and SLB issuance volumes by sector and region, investor demand signals, pricing dynamics, regulatory pipeline (EU Green Bond Standard, SEC climate disclosure), and market growth projections.

> **Business value:** Delivers comprehensive climate capital markets intelligence integrating issuance flow analytics, investor demand signals, pricing dynamics, and regulatory pipeline monitoring across GSS+ instrument types.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `ESG_INDICES`, `INSTRUMENTS`, `INVESTORS`, `RATINGS`, `REGIONS`, `SDG_TAGS`, `SECTORS`, `SECTOR_COLORS`, `TABS`, `TYPES`, `TYPE_COLORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `RATINGS` | `['AAA', 'AA+', 'AA', 'A+', 'A', 'BBB+', 'BBB'];` |
| `notional` | `0.1 + sr(i * 7) * 4.9;` |
| `yield_` | `1.5 + sr(i * 11) * 4.5;` |
| `spread` | `20 + sr(i * 13) * 200;` |
| `greenium` | `-(2 + sr(i * 17) * 22);` |
| `volume30d` | `5 + sr(i * 19) * 995;` |
| `bidAskBps` | `1 + sr(i * 23) * 15;` |
| `liquidityScore` | `100 - bidAskBps * 4 - sr(i * 29) * 20;` |
| `impactScore` | `40 + sr(i * 31) * 55;` |
| `sdgCount` | `1 + Math.floor(sr(i * 37) * 4);` |
| `aum` | `5 + sr(i * 7) * 495;` |
| `esgMandate` | `40 + sr(i * 11) * 55;` |
| `greenAlloc` | `esgMandate * (0.1 + sr(i * 13) * 0.4);` |
| `totalIssuance` | `filtered.reduce((s, d) => s + d.notional, 0);` |
| `totalVolume` | `filtered.reduce((s, d) => s + d.volume30d, 0);` |
| `avgGreenium` | `filtered.length ? filtered.reduce((s, d) => s + d.greenium, 0) / filtered.length : 0;` |
| `avgImpact` | `filtered.length ? filtered.reduce((s, d) => s + d.impactScore, 0) / filtered.length : 0;` |
| `avgLiquidity` | `filtered.length ? filtered.reduce((s, d) => s + d.liquidityScore, 0) / filtered.length : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ESG_INDICES`, `RATINGS`, `REGIONS`, `SDG_TAGS`, `SECTORS`, `TABS`, `TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Annual GSS+ Issuance | `Global green, social, sustainability, and sustainability-linked bond issuance (2023)` | Climate Bonds Initiative H2 2023 report | Green bonds largest segment ($580Bn); SLBs growing fastest (+34% YoY); EU leading with 40%+ of global green is |
| Average Order Book Coverage | `Order book size / deal size for green bond new issues` | Bloomberg new issue data 2023 | Higher than vanilla comparables (typically 2.5-3x); signals strong green investor demand; enables pricing at t |
| EU GBS Premium Estimate | `Expected additional greenium for EU Green Bond Standard-labelled bonds vs standard green bonds` | ICMA/CBI regulatory impact analysis | EU GBS entered into force December 2024; first issues expected 2025; strict eligibility likely narrows supply  |
- **Climate Bonds Initiative issuance database** → Deal-level GSS+ issuance data by label, sector, region, issuer → market volume analytics → **Issuance trend and market share**
- **Bloomberg new issue monitor and book-building data** → Order book sizes, pricing versus guidance, investor participation → demand analytics → **Demand pressure index**
- **EU Official Journal / SEC regulatory filings** → Regulatory text, timelines, eligibility criteria → regulatory pipeline and compliance calendar → **Market impact assessment**

## 5 · Intermediate Transformation Logic
**Methodology:** Capital Markets Climate Flow Analytics
**Headline formula:** `Market Penetration = GSS+ Issuance / Total Bond Issuance × 100; Demand Pressure Index = Order Book Coverage Ratio × Green Investor Share × -Greenium`
**Standards:** ['ICMA GSS Bond Market Data 2023', 'Climate Bonds Initiative Market Intelligence Q4 2023', 'EU Green Bond Standard Regulation (EU) 2023/2631']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).