# Port Climate Risk Analytics
**Module ID:** `port-climate-risk` · **Route:** `/port-climate-risk` · **Tier:** B (frontend-computed) · **EP code:** EP-DJ5 · **Sprint:** DJ

## 1 · Overview
Quantifies climate physical and transition risks to port infrastructure and trade flows. Models sea level rise impacts on port access, extreme weather operational disruption, shipping decarbonisation effects on port revenue mix, and adaptation investment requirements.

> **Business value:** Applicable to port operators, maritime infrastructure funds, trade finance banks, and sovereign transport ministries. Provides port-level physical risk quantification for asset management decisions, transition risk for port operators diversifying away from fossil fuel throughput, and adaptation investment economics.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `KpiCard`, `PORTS`, `PORT_NAMES`, `REGIONS`, `RISK_COLORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `getAvgRisk` | `p => +((p.floodRisk + p.stormSurgeRisk + p.heatRisk + p.droughtRisk) / 4).toFixed(1);` |
| `floodR` | `+(1 + sr(i * 3) * 9).toFixed(1);` |
| `stormR` | `+(1 + sr(i * 7) * 9).toFixed(1);` |
| `heatR` | `+(1 + sr(i * 11) * 9).toFixed(1);` |
| `droughtR` | `+(1 + sr(i * 13) * 9).toFixed(1);` |
| `greenInfra` | `+(1 + sr(i * 17) * 9).toFixed(1);` |
| `avg` | `(floodR + stormR + heatR + droughtR) / 4;` |
| `totalThroughput` | `filtered.reduce((a, p) => a + p.throughputMt, 0);` |
| `totalAdaptCapex` | `filtered.reduce((a, p) => a + +p.adaptationCapex, 0);` |
| `throughputData` | `[...filtered].sort((a, b) => b.throughputMt - a.throughputMt).slice(0, 15).map(p => ({` |
| `adaptVsRisk` | `filtered.map(p => ({` |
| `greenInfraData` | `REGIONS.map(r => {` |
| `floodStormData` | `[...filtered].sort((a, b) => b.floodRisk + b.stormSurgeRisk - a.floodRisk - a.stormSurgeRisk).slice(0, 15).map(p => ({` |
| `heatDroughtData` | `[...filtered].sort((a, b) => b.heatRisk + b.droughtRisk - a.heatRisk - a.droughtRisk).slice(0, 15).map(p => ({` |
| `disruptionData` | `[...filtered].sort((a, b) => b.operationalDisruptionRisk - a.operationalDisruptionRisk).slice(0, 15).map(p => ({` |
| `adaptData` | `[...filtered].sort((a, b) => b.adaptationCapex - a.adaptationCapex).slice(0, 15).map(p => ({` |
| `decarb` | `[...filtered].sort((a, b) => b.renewableEnergyPct - a.renewableEnergyPct).slice(0, 15).map(p => ({` |
| `value` | `filtered.filter(p => p.riskLevel === rl).reduce((a, p) => a + p.cargoValue, 0).toFixed(0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PORT_NAMES`, `REGIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global Port Throughput Value | — | UNCTAD Review of Maritime Transport 2023 | 80% of global trade volume moves by sea — port disruption has outsized GDP impact |
| Ports at SLR Risk | — | World Bank Port Climate Exposure 2022 | 30 of the top 100 global ports face significant sea level rise exposure by 2050 under RCP8.5 |
| Coal Port Revenue Risk | — | Carbon Tracker Port Exposure 2023 | Coal represents 25% of bulk port revenue globally — at risk from energy transition demand destruction |
- **Port infrastructure data (elevation, footprint, quay length)** → Physical risk assessment → **Port-level SLR inundation probability and infrastructure loss**
- **Historical weather disruption + operational data** → Operational disruption modelling → **Annual port downtime probability and revenue impact**
- **Port commodity throughput by type (coal, LNG, containers)** → Transition risk calculation → **Revenue at risk from fossil fuel demand destruction by scenario**

## 5 · Intermediate Transformation Logic
**Methodology:** Port Climate Risk Score
**Headline formula:** `PortRisk = w_P × PhysicalHazardScore + w_T × TransitionRisk + w_O × OperationalDisruption; PhysicalExposure = SLR_penetration × InfrastructureVulnerability × TradeValue`
**Standards:** ['OECD/ITF Port Outlook 2023', 'PIANC Climate Change Adaptation for Ports 2020', 'IMO 2023 GHG Strategy — Port Impacts', 'World Bank Port Reform Toolkit Climate Module']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).