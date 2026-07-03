# Energy Storage Analytics
**Module ID:** `energy-storage-analytics` · **Route:** `/energy-storage-analytics` · **Tier:** B (frontend-computed) · **EP code:** EP-DF4 · **Sprint:** DF

## 1 · Overview
Models battery energy storage system (BESS) and long-duration storage (LDES) project economics including revenue stacking from frequency response, capacity markets, energy arbitrage, and renewable firming. Calculates levelised cost of storage (LCOS) and storage investment NPV.

> **Business value:** Essential for BESS developers, grid-scale storage investors, utilities, and infrastructure funds. Revenue stacking analysis maximises project IRR, LCOS benchmark positions against competing technologies, and grid stability service modelling supports regulatory approval.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `Card`, `KpiCard`, `PROJECTS`, `REGIONS`, `SERVICES`, `TABS`, `TECH`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt0` | `v => Number(v).toLocaleString('en-GB', { maximumFractionDigits:0 });` |
| `SERVICES` | `['Frequency Regulation','Capacity Market','Energy Arbitrage','Peak Shaving','Ancillary Services','Behind-the-Meter'];` |
| `REGIONS` | `['GB','Germany','France','USA-CAISO','USA-PJM','Australia-NEM','Singapore'];` |
| `tech` | `TECH[Math.floor(sr(i*7)*TECH.length)];` |
| `region` | `REGIONS[Math.floor(sr(i*11)*REGIONS.length)];` |
| `service` | `SERVICES[Math.floor(sr(i*13)*SERVICES.length)];` |
| `powerMw` | `Math.round(5 + sr(i*17)*295);     // MW` |
| `durHrs` | `Math.round(1 + sr(i*19)*11);       // hours` |
| `energyMwh` | `powerMw * durHrs;` |
| `dod` | `0.80 + sr(i*23)*0.15;              // depth of discharge` |
| `capex` | `tech.capexKwh * energyMwh / 1000;  // $M` |
| `opexYr` | `tech.opexKwh  * energyMwh / 1000;  // $M/yr` |
| `totalCycles` | `Math.min(tech.cycles, annCycles * tech.calLife);` |
| `totalMwh` | `totalCycles * dod * energyMwh;` |
| `lcos` | `(capex * 1e6 + opexYr * 1e6 * tech.calLife) / (totalMwh * 1000); // $/MWh` |
| `lcosAdj` | `Math.max(20, Math.round(lcos * 10 + sr(i*31)*20) / 10);` |
| `freqRev` | `service==='Frequency Regulation'  ? powerMw * 18000 / 1e6 : powerMw * sr(i*37)*8000/1e6;` |
| `capacityRev` | `service==='Capacity Market'        ? powerMw * 50000 / 1e6 : powerMw * sr(i*41)*20000/1e6;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `REGIONS`, `SERVICES`, `TABS`, `TECH`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Li-ion BESS CapEx 2023 | — | BloombergNEF BESS Price Survey 2023 | Four-hour Li-ion system all-in installed cost — projected to fall to $100/kWh by 2030 |
| LCOS Li-ion (4hr) | — | Lazard LCOS v8.0 2023 | Levelised cost of storage for 4-hour Li-ion BESS — competitive with peaker plants at grid scale |
| Grid-scale BESS Deployments 2023 | — | BloombergNEF H2 2023 Storage Report | Grid-scale BESS deployments in 2023 — on track for IEA Net Zero 600 GWh/yr by 2030 |
- **Grid frequency and price data (EPEX, AEMO, PJM)** → Revenue optimisation modelling → **Expected annual revenue by market product**
- **Battery chemistry specs (capacity, RTE, cycle life, degradation)** → LCOS calculation → **Levelised cost and NPV over asset life**
- **Renewable generation profiles for co-location analysis** → Firming value calculation → **Capacity factor improvement and curtailment reduction value**

## 5 · Intermediate Transformation Logic
**Methodology:** Levelised Cost of Storage (LCOS)
**Headline formula:** `LCOS = [CapEx + Σ(OpEx_t + EnergyCost_t) / (1+r)^t] / Σ[EnergyDispatched_t / (1+r)^t]; RoundTripEfficiency = EnergyOut / EnergyIn`
**Standards:** ['IEA Energy Storage 2023', 'BloombergNEF BESS Market Outlook 2024', 'IRENA Innovation Outlook — Thermal Energy Storage', 'Lazard LCOS v8.0 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `CleanTechAdvancedAnalytics`