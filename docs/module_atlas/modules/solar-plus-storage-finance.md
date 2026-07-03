# Solar + Storage Co-located Finance
**Module ID:** `solar-plus-storage-finance` · **Route:** `/solar-plus-storage-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-EC3 · **Sprint:** EC

## 1 · Overview
Co-located solar PV and BESS project finance analytics. Covers IRA Investment Tax Credit stacking (base 30% plus domestic content, energy community, and low-income adders), revenue stack modelling across energy/capacity/ancillary markets, and merchant risk quantification.

> **Business value:** Used by solar+storage developers, project finance banks, and tax equity investors to evaluate co-located solar and battery projects benefiting from IRA incentive stacking and multi-market revenue optimization.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COUPLING_TYPES`, `DEGRADATION_CURVE`, `ITC_TIERS`, `KPI_CARD`, `PROJECTS`, `STATES`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `COUPLING_TYPES` | `['AC-Coupled', 'DC-Coupled', 'Hybrid (Both)'];` |
| `capacityMwAc` | `50 + Math.round(sr(i * 7) * 450);` |
| `dcAcRatio` | `1.15 + sr(i * 11) * 0.45;` |
| `storageMwh` | `capacityMwAc * (1.0 + sr(i * 13) * 3.0);` |
| `itcAddedPct` | `6 + sr(i * 17) * 4;` |
| `clippingLossPct` | `2 + sr(i * 19) * 5;` |
| `totalItcPct` | `baseItc + itcAddedPct;` |
| `energyRevM` | `capacityMwAc * 0.22 * 8760 * 48 / 1e6;` |
| `capacityRevM` | `capacityMwAc * 5.5 / 1e3;` |
| `ancillaryRevM` | `storageMwh * 0.8 / 1e3;` |
| `irrBase` | `7.5 + sr(i * 23) * 4.5;` |
| `irrWithStorage` | `irrBase + 1.5 + sr(i * 29) * 2.0;` |
| `augmentationYr` | `8 + Math.round(sr(i * 31) * 5);` |
| `totalMwAc` | `filtered.reduce((s, p) => s + p.capacityMwAc, 0);` |
| `totalMwh` | `filtered.reduce((s, p) => s + p.storageMwh, 0);` |
| `avgDcAc` | `filtered.length ? filtered.reduce((s, p) => s + p.dcAcRatio, 0) / filtered.length : 0;` |
| `avgIrrBase` | `filtered.length ? filtered.reduce((s, p) => s + p.irrBase, 0) / filtered.length : 0;` |
| `avgIrrStorage` | `filtered.length ? filtered.reduce((s, p) => s + p.irrWithStorage, 0) / filtered.length : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUPLING_TYPES`, `ITC_TIERS`, `STATES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| IRA ITC Total (%) | `ITC = 30 + DC(10) + EC(10) + LI(20)` | IRS Notice 2023-29 | Maximum 70% ITC combining all four adders; domestic content requires ≥40% US steel/iron and manufactured produ |
| BESS Duration (hours) | `Rated_capacity_MWh / Rated_power_MW` | NREL Storage Futures Study | 4-hour BESS qualifies for capacity market; 2-hour for energy arbitrage and frequency regulation. |
| Revenue Stack ($/MWh solar) | `Rev = energy + capacity/8760 + AS_revenue` | CAISO/PJM market data | Ancillary services $20-60/MW-hr in CAISO; capacity $50-200/MW-yr in PJM; energy arbitrage $15-50/MWh in ERCOT. |
- **CAISO/PJM market prices + IRA guidance + project cost data** → ITC stack calculation + revenue optimization + DSCR/IRR model → **Solar+storage project finance: ITC benefit, revenue stack, merchant risk, IRR**

## 5 · Intermediate Transformation Logic
**Methodology:** IRA ITC Stack & Revenue Optimization
**Headline formula:** `ITC_total = ITC_base + DC_adder + EC_adder + LI_adder; Revenue = energy_arb + capacity_payment + AS_revenue`
**Standards:** ['IRA §48C/48E Investment Tax Credit Guidance (IRS 2023)', 'FERC Order 841', 'NREL Storage Futures Study']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).