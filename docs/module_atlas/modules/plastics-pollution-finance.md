# Plastics Pollution Finance Analytics
**Module ID:** `plastics-pollution-finance` · **Route:** `/plastics-pollution-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DL3 · **Sprint:** DL

## 1 · Overview
Analyses the financial risks and opportunities from the global transition away from single-use plastics. Models regulatory exposure from UN Plastics Treaty, petrochemical feedstock demand destruction, recycling infrastructure investment economics, and plastic credit market development.

> **Business value:** Essential for plastics-exposed consumer goods investors, petrochemical equity analysts, and waste management infrastructure funds. Provides UN Plastics Treaty regulatory scenario analysis and plastic credit economics for corporate waste reduction programmes aligned with Verra PWRP.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `COMPANIES`, `COUNTRIES`, `KpiCard`, `REG_RISK_TIERS`, `TABS`, `TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `type` | `TYPES[Math.floor(sr(i * 7) * TYPES.length)];` |
| `country` | `COUNTRIES[Math.floor(sr(i * 11) * COUNTRIES.length)];` |
| `regulatoryRisk` | `Math.round(1 + sr(i * 5) * 9);` |
| `transitionScore` | `Math.round(20 + sr(i * 13) * 75);` |
| `TABS` | `['Company Overview','Production Profile','Recycled Content','Single-Use Risk','EPR Compliance','Ocean Plastic Exposure','Regulatory Risk','Transition ` |
| `totalProduction` | `filtered.reduce((s, c) => s + c.plasticProduction, 0);` |
| `avgRecycled` | `(filtered.reduce((s, c) => s + c.recycledContent, 0) / n).toFixed(1);` |
| `avgRegRisk` | `(filtered.reduce((s, c) => s + c.regulatoryRisk, 0) / n).toFixed(1);` |
| `avgTransition` | `(filtered.reduce((s, c) => s + c.transitionScore, 0) / n).toFixed(1);` |
| `taxExposure` | `((filtered.reduce((s, c) => s + c.plasticTax * c.plasticProduction, 0)) / 1e6).toFixed(0);` |
| `typeBarData` | `TYPES.map(t => {` |
| `countryRiskData` | `COUNTRIES.map(cn => {` |
| `scatterData` | `filtered.map(c => ({ x: c.recycledContent, y: c.transitionScore, name: c.name }));` |
| `typeEPRData` | `TYPES.map(t => {` |
| `pct` | `n > 0 ? (cnt / n) * 100 : 0;` |
| `pct` | `n > 0 ? (cnt / n) * 100 : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `REG_RISK_TIERS`, `TABS`, `TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global Plastic Production | — | OECD Global Plastics Outlook 2022 | Global plastic production 400 Mt/yr — projected to triple by 2060 without policy intervention |
| Plastic Waste Mismanaged | — | OECD 2022 | 37% of plastic waste is mismanaged (littered or inadequately disposed) — primary source of ocean plastic pollu |
| UN Plastics Treaty 2025 | — | UNEP INC Plastics Treaty Process 2024 | 175 countries negotiating binding global plastics treaty by 2025 — potential to ban or cap plastic production |
- **Company plastic use and packaging data** → Regulatory exposure modelling → **Revenue at risk from plastic bans and EPR fees**
- **Plastic credit market prices (Verra PWRP)** → Credit revenue modelling → **Revenue from plastic waste collection programmes**
- **Petrochemical demand scenarios (IEA/OECD)** → Demand destruction analysis → **Petrochemical feedstock demand under plastics treaty scenarios**

## 5 · Intermediate Transformation Logic
**Methodology:** Plastics Transition Financial Risk
**Headline formula:** `PlasticRisk = RegRisk + DemandDestructionRisk + LitigationRisk + ReputationRisk; RecyclingNPV = Σ [(RecyclateRevenue + PlasticCredit - CollectionCost - ProcessingCost) / (1+r)^t]`
**Standards:** ['UN Intergovernmental Negotiating Committee (INC) Plastics Treaty 2025', 'OECD Global Plastics Outlook 2022', 'Verra Plastic Waste Reduction Program (PWRP)', 'WWF Plastic Pollution Business Impact Assessment']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).