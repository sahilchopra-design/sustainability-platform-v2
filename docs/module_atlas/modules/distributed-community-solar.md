# Distributed & Community Solar Analytics
**Module ID:** `distributed-community-solar` · **Route:** `/distributed-community-solar` · **Tier:** B (frontend-computed) · **EP code:** EP-EC5 · **Sprint:** EC

## 1 · Overview
Distributed generation and community solar program analytics. Covers SREC market pricing, net metering policy economics, community solar subscription models, LMI access requirements, and distributed generation economics across US state programs.

> **Business value:** Used by community solar developers, utilities, regulators, and solar equity advocates to analyze distributed generation economics, SREC markets, and community solar program design.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `KPI_CARD`, `LMI_PROGRAMS`, `NET_METERING_IMPACT`, `NET_METERING_POLICIES`, `PROJECTS`, `PROJECT_TYPES`, `SREC_MARKET_DATA`, `TABS`, `US_STATES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `PROJECT_TYPES` | `['Rooftop Commercial', 'Rooftop Residential', 'Carport', 'Community Solar', 'Ground-Mount C&I'];` |
| `capacitykW` | `10 + Math.round(sr(i * 7) * 4990);` |
| `subscriberCount` | `isCommunitySolar ? 20 + Math.round(sr(i * 11) * 480) : 1;` |
| `avgBillSavingPct` | `15 + sr(i * 13) * 30;` |
| `systemCostPerW` | `2.8 + sr(i * 17) * 1.4;` |
| `annualSavingsPerSubscriber` | `400 + sr(i * 19) * 800;` |
| `itcPct` | `30 + sr(i * 23) * 10;` |
| `srecPrice` | `50 + sr(i * 29) * 200;` |
| `paybackYr` | `5 + sr(i * 31) * 8;` |
| `lcoe` | `55 + sr(i * 37) * 55;` |
| `lmiShare` | `15 + sr(i * 41) * 30;` |
| `localJobs` | `Math.round(capacitykW / 1000 * (2 + sr(i * 43) * 4));` |
| `totalKw` | `filtered.reduce((s, p) => s + p.capacitykW, 0);` |
| `avgBillSaving` | `filtered.length ? filtered.reduce((s, p) => s + p.avgBillSavingPct, 0) / filtered.length : 0;` |
| `avgPayback` | `filtered.length ? filtered.reduce((s, p) => s + p.paybackYr, 0) / filtered.length : 0;` |
| `totalSubscribers` | `filtered.reduce((s, p) => s + p.subscriberCount, 0);` |
| `avgLcoe` | `filtered.length ? filtered.reduce((s, p) => s + p.lcoe, 0) / filtered.length : 0;` |
| `totalJobs` | `filtered.reduce((s, p) => s + p.localJobsCreated, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `LMI_PROGRAMS`, `NET_METERING_IMPACT`, `NET_METERING_POLICIES`, `PROJECT_TYPES`, `SREC_MARKET_DATA`, `TABS`, `US_STATES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| SREC Price ($/MWh) | `Set by RPS compliance demand and SACP` | SREC Trade / SRECTrade.com | DC SRECs highest ($400-500/MWh) due to 100% RPS; lower-demand states $15-50. |
| Community Solar Bill Credit (%) | `Discount = (retail_rate - subscriber_rate) / retail_rate` | NREL Community Solar Tariff Database | Typical 10-15% discount; LMI subscribers 20-30% under state carve-outs. |
| LMI Set-Aside (%) | `LMI_capacity = program_capacity × set_aside_pct` | SEIA State Policy Database | LMI = households <80% area median income. |
- **State SREC market data + net metering tariffs + program capacity data** → SREC revenue model + NEM economics + community solar bill credit calculator → **Distributed generation project economics and LMI solar equity analysis**

## 5 · Intermediate Transformation Logic
**Methodology:** SREC Market & Net Metering Economics
**Headline formula:** `SREC_revenue = AEP_MWh × SREC_price; NEM_savings = exported_kWh × rate (retail NEM1 or avoided_cost NEM3)`
**Standards:** ['SREC Trade Market Data', 'SEIA Net Metering Policy Database', 'DOE Community Solar Analysis']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).