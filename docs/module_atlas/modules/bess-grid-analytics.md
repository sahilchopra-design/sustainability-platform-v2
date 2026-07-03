# BESS & Grid Services Analytics
**Module ID:** `bess-grid-analytics` · **Route:** `/bess-grid-analytics` · **Tier:** B (frontend-computed) · **EP code:** RE-BESS1 · **Sprint:** RE

## 1 · Overview
Comprehensive battery energy storage system (BESS) financial and technical analytics. Covers LCOS optimization, revenue stacking (arbitrage/frequency regulation/capacity/demand charge), Arrhenius + cycle degradation modelling, dispatch optimization (greedy price arbitrage), FERC Order 841 compliance, and co-location solar+BESS ITC analysis across 18 analytical tabs.

> **Business value:** Designed for BESS developers, utilities evaluating storage procurement, and infrastructure funds assessing standalone or co-located battery projects. Covers the full analytical stack from Arrhenius degradation modelling to ISO-specific revenue stacking and FERC 841 compliance — replacing the combination of PNNL LCOS spreadsheets, manufacturer degradation tools, and ISO revenue calculators typically used in BESS project evaluation.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CHEMISTRIES`, `HOURS`, `KpiCard`, `MARKETS`, `SHdr`, `Sel`, `Slider`, `TABS`, `Toggle`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `MARKETS` | `['CAISO', 'ERCOT', 'PJM', 'MISO', 'ISO-NE', 'NYISO'];` |
| `kCyc` | `chemistry === 'LFP' ? 1.8e-5 : chemistry === 'NMC' ? 2.5e-5 : 3.0e-5;` |
| `calFade` | `A * Math.exp(-Ea / (R * TK)) * Math.sqrt(yr);` |
| `cycFade` | `efcPerYear * yr * kCyc;` |
| `combined` | `Math.sqrt(calFade * calFade + cycFade * cycFade);` |
| `capex` | `capexPerKWh * 1000 * capMWh;` |
| `deg` | `degradation[y - 1]?.capacity \|\| 1;` |
| `opex` | `capex * opexPct;` |
| `eMWh` | `efcPerYear * capMWh * deg * 365;` |
| `sorted` | `prices.map((p, h) => ({ h, p })).sort((a, b) => a.p - b.p);` |
| `chargeHrs` | `sorted.slice(0, 4).map(x => x.h).sort((a, b) => a - b);` |
| `dischargeHrs` | `sorted.slice(-4).map(x => x.h).sort((a, b) => a - b);` |
| `schedule` | `prices.map((p, h) => ({` |
| `arb` | `dischargeHrs.reduce((s, h) => s + prices[h] * powerMW, 0)` |
| `base` | `{ CAISO: 45, ERCOT: 38, PJM: 42, MISO: 35, 'ISO-NE': 48, NYISO: 55 }[market] \|\| 40;` |
| `efcPerYear` | `useMemo(() => efcTarget * 365, [efcTarget]);` |
| `yearsArr` | `useMemo(() => Array.from({ length: lifeYrs }, (_, i) => i + 1), [lifeYrs]);` |
| `lcos` | `useMemo(() => calcLCOS(capexPerKWh, powerMW, capMWh, opexPct, discountR / 100, lifeYrs, efcPerYear, degradation), [capexPerKWh, powerMW, capMWh, opexP` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CHEMISTRIES`, `MARKETS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| LCOS | `CAPEX + NPV(OPEX) + NPV(Replacement) / NPV(Discharged MWh)` | PNNL LCOS Framework | 4-hour Li-ion: $110–160/MWh (2024); 2-hour: $140–200/MWh; 8-hour: $80–120/MWh; declining at ~15%/yr with LFP c |
| Arbitrage Revenue | `Σ(P_discharge − P_charge) × E_cycled` | CAISO/ERCOT price data | Highly variable by market; ERCOT 2023: $40–90k/MW-yr; CAISO: $20–50k/MW-yr due to solar cannibalization reduci |
| Frequency Regulation Revenue | `Regulation capacity price × MW committed × availability` | FERC Order 755 / CAISO AS | Fast-response BESS earns performance-adjusted regulation revenue; CAISO RegUp/RegDn: $5–25/MW-hr depending on  |
| Capacity Revenue | `Capacity auction clearing price × ICAP MW` | ISO-NE, PJM, NYISO | BESS qualifies as capacity resource under FERC 841; PJM BRA clearing 2023: $34.13/MW-day; ISO-NE FC: $28–55/kW |
| Degradation (10-yr) | `Arrhenius calendar + cycle aging at target EFC/yr` | Manufacturer specs + NREL | LFP chemistry: lower calendar aging than NMC; 1 EFC/day LFP: ~15% at 10 yr; NMC at 1.5 EFC/day: ~25% at 10 yr |
| Round-trip Efficiency | `DC-DC: typically 94–96%; AC-AC: 85–91%` | IEC 62619 / PNNL test data | AC-coupled systems lose efficiency at PCS; DC-coupled co-location avoids PCS losses for solar charging; key LC |
| ITC on BESS (IRA) | `IRA §48E standalone BESS eligible from 2023` | IRS Notice 2023-29 | IRA 2022 key change: standalone BESS now ITC eligible (≥3 hr storage); co-location with solar also eligible; s |
- **BESS technical inputs: capacity, C-rate, chemistry, cycle target, temperature** → Arrhenius calendar + cycle degradation model (year 1–25) → **Annual capacity (MWh effective), EFC remaining, LCOS by year**
- **Market price data (seeded hourly for CAISO/ERCOT/PJM/MISO/ISO-NE)** → Greedy dispatch: sort 24h prices → charge 4 lowest → discharge 4 highest → **Arbitrage revenue, dispatch efficiency, round-trip loss accounting**
- **Revenue stacking: arbitrage + freq reg + capacity + demand charge** → Project IRR / NPV / LCOS calculator → **BESS project economics under combined revenue streams vs LCOS cost**

## 5 · Intermediate Transformation Logic
**Methodology:** LCOS + Arrhenius/Cycle Degradation + Greedy Dispatch Optimization
**Headline formula:** `LCOS = (CAPEX + ΣOPEX_t/(1+r)^t + ΣReplace_t/(1+r)^t) / ΣE_discharge_t/(1+r)^t; Δη(t) = √(Δη_cal² + Δη_cyc²)`
**Standards:** ['FERC Order 841', 'PNNL LCOS Methodology', 'IEC 62619 Safety', 'UL 9540A']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).