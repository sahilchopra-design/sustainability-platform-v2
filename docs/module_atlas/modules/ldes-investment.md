# Long Duration Energy Storage Investment Analytics
**Module ID:** `ldes-investment` · **Route:** `/ldes-investment` · **Tier:** B (frontend-computed) · **EP code:** EP-DT3 · **Sprint:** DT

## 1 · Overview
Investment analytics for long duration energy storage technologies including pumped hydro, CAES, vanadium and iron-air flow batteries, hydrogen storage and gravity systems across 4-100 hour duration.

> **Business value:** Long-duration energy storage is essential for deep decarbonisation with >80% variable renewable penetration; LCOS for 100-hour storage must reach $0.05/kWh/cycle or below for broad economic deployment, a threshold pumped hydro already meets and iron-air targets by 2030.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `KpiCard`, `MARKET_SEGMENTS`, `Slider`, `TABS`, `TECHNOLOGIES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `capexAnn` | `capexPerKwh * w / (1 - Math.pow(1 + w, -lifetime));` |
| `opexAnn` | `capexPerKwh * opexPct / 100;` |
| `throughput` | `cycles * (rte / 100);` |
| `techLcos` | `useMemo(() => TECHNOLOGIES.map(t => ({` |
| `capexTotal` | `capexKwh * 100000;` |
| `annRevenue` | `cyclesYr * (rte / 100) * rePrice * 100000;` |
| `annOpex` | `capexTotal * opexPct / 100;` |
| `net` | `annRevenue - annOpex;` |
| `marketData` | `useMemo(() => MARKET_SEGMENTS.map(s => ({` |
| `annRev` | `cyclesYr * (rte / 100) * price * 100000;` |
| `annOp` | `capexT * (opexPct / 100);` |
| `net` | `annRev - annOp;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `MARKET_SEGMENTS`, `TABS`, `TECHNOLOGIES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Pumped Hydro LCOS | `CAPEX ($800-2000/kWh)×CRF + O&M` | IRENA 2023 | Lowest LCOS for large-scale, long-life (50yr) projects; constrained by geography; 1,600 GW global installed ca |
| Vanadium Flow Battery LCOS | `(CAPEX+stack_replacement)×CRF / cycles` | BNEF 2023 | Electrolyte retains value (resale/reuse); stack replacement at year 10; scalable capacity independent of power |
| Iron-Air Battery LCOS | `Similar to VFB; Fe electrolyte at <$5/kg` | Form Energy / LDES Council 2023 | 100-hour duration with Earth-abundant materials; Form Energy targeting $20/kWh system cost at scale; pilot dep |
- **Technology cost database** → → LCOS model → **CAPEX and OPEX by technology and year**
- **Grid value model** → → investment screen → **$/kW-year value by duration and market**

## 5 · Intermediate Transformation Logic
**Methodology:** Levelised Cost of Storage
**Headline formula:** `LCOS = (CAPEX×CRF + OPEX) / (Annual_cycles × Discharged_energy_per_cycle)`
**Standards:** ['LDES Council Net-Zero Power', 'BNEF Long-Duration Energy Storage Market Outlook', 'NREL Grid-Scale BESS Cost']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `EnergyAdvancedAnalytics`