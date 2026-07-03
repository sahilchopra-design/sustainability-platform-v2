# BESS Project Finance
**Module ID:** `bess-project-finance` · **Route:** `/bess-project-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DT1 · **Sprint:** DT

## 1 · Overview
4-hour battery energy storage system project finance covering CAPEX waterfall, multi-stream revenue stacking, degradation modelling to 80% end-of-life and augmentation cost for IRR optimisation.

> **Business value:** BESS project finance is bankable in markets with stacked revenue streams totalling >$120/kW/yr; CAPEX trajectory to <$200/kWh by 2030 combined with rising capacity market prices improves merchant IRR to 10-14% under BNEF base case assumptions.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CHEMISTRIES`, `KpiCard`, `MARKETS`, `Slider`, `TABS`, `YEARS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `capexAnn` | `capexPerKwh * (wacc / 100) / (1 - Math.pow(1 + wacc / 100, -lifetime));` |
| `opexAnn` | `capexPerKwh * opexPct / 100;` |
| `annualThroughput` | `cycles * rte / 100; // kWh out per kWh capacity per yr` |
| `accel` | `Math.exp(Ea / k * (1 / T0 - 1 / T1));` |
| `YEARS` | `Array.from({ length: 16 }, (_, i) => 2025 + i);` |
| `capexTotal` | `capexKwh * capacityMW * durationH * 1000 / 1e6; // M€` |
| `totalRevenue` | `Object.values(revStack).reduce((a, b) => a + b, 0);` |
| `annualOpex` | `capexTotal * opexPct / 100;` |
| `ebitda` | `totalRevenue - annualOpex;` |
| `degradeFactor` | `Math.max(0.7, 1 - (degradePct / 100) * y);` |
| `projectIrr` | `useMemo(() => { const r = irr(cashflows); return isFinite(r) ? +(r * 100).toFixed(1) : 'N/A'; }, [cashflows]);` |
| `projectNpv` | `useMemo(() => +npv(cashflows, wacc / 100).toFixed(1), [cashflows, wacc]);` |
| `lcosByChemistry` | `CHEMISTRIES.map(c => ({` |
| `capexData` | `YEARS.map((y, i) => ({` |
| `revShock` | `0.7 + sr(i * 17) * 0.6;` |
| `capShock` | `0.85 + sr(i * 11) * 0.3;` |
| `adjRev` | `totalRevenue * revShock;` |
| `adjCapex` | `capexTotal * capShock;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CHEMISTRIES`, `MARKETS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| 4-hr BESS CAPEX | `System_CAPEX = Cells + BMS + PCS + EPC + O&C` | BNEF 2023 | Cell cost (40-50% of system) tracking 15% annual decline; target <$150/kWh system cost by 2030 for merchant vi |
| Revenue Stack ($/kW/yr) | `R = CM + FFR + Arb; each stream independently modelled` | National Grid/ERCOT 2023 | Capacity market provides base revenue; FFR/DCR premium services add $40-80/kW/yr; arbitrage dependent on price |
| Degradation to 80% SoH | `SoH(t) = 100% - Deg_rate × cycles(t)` | NREL Battery Lifetime Model | Calendar ageing + cycle ageing; LFP degrades 10-15% slower than NMC per equivalent cycle count. |
- **Capacity market auction results** → → revenue model → **£/kW/yr clearing price by delivery year**
- **Battery cell price forecast** → → CAPEX model → **$/kWh by chemistry and year**

## 5 · Intermediate Transformation Logic
**Methodology:** BESS Revenue Stack IRR
**Headline formula:** `Revenue = CM_rev + FFR_rev + Arb_rev; IRR: NPV(Revenue - OPEX - Augment - DebtService) = 0`
**Standards:** ['BNEF BESS Market Outlook 2023', 'National Grid ESO Balancing Services', 'FERC Order 841 Storage Participation']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `EnergyAdvancedAnalytics`