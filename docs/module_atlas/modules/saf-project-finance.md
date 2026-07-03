# SAF Project Finance Modeler
**Module ID:** `saf-project-finance` · **Route:** `/saf-project-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-EF2 · **Sprint:** EF

## 1 · Overview
Full project finance model for SAF facilities: DSCR analysis, Newton-Raphson IRR engine, NPV, and blended finance structuring across 20 seeded SAF deals. Interactive sliders for CAPEX, capacity, offtake price, and debt rate. Risk register with probability-impact scatter.

> **Business value:** Used by SAF project developers, infrastructure investors, DFI project officers, and airline finance teams evaluating project economics, debt capacity, and blended finance structuring.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `DEALS`, `KpiCard`, `Pill`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `npv` | `cf.reduce((s, c, t) => s + c / Math.pow(1 + r, t), 0);` |
| `dnpv` | `cf.reduce((s, c, t) => s - t * c / Math.pow(1 + r, t + 1), 0);` |
| `pathway` | `['HEFA', 'AtJ', 'FT-MSW', 'PtL'][Math.floor(sr(i * 7 + 1) * 4)];` |
| `capMt` | `parseFloat((0.1 + sr(i * 11 + 2) * 0.9).toFixed(2));` |
| `capex` | `parseFloat((capMt * (320 + sr(i * 13 + 3) * 400)).toFixed(0));` |
| `debtPct` | `parseFloat((55 + sr(i * 17 + 4) * 20).toFixed(0));` |
| `irr` | `parseFloat((8 + sr(i * 19 + 5) * 12).toFixed(1));` |
| `dscr` | `parseFloat((1.20 + sr(i * 23 + 6) * 0.80).toFixed(2));` |
| `country` | `['USA', 'EU', 'UK', 'Australia', 'Singapore', 'Norway', 'UAE'][Math.floor(sr(i * 29 + 7) * 7)];` |
| `status` | `['Closed', 'Mandate', 'Diligence', 'Pipeline'][Math.floor(sr(i * 31 + 8) * 4)];` |
| `tenor` | `15 + Math.floor(sr(i * 37 + 9) * 10);` |
| `iraCredit` | `country === 'USA' ? parseFloat((capMt * 1.45 * 264).toFixed(0)) : 0;` |
| `avgDscr` | `useMemo(() => filtered.length ? (filtered.reduce((s, d) => s + d.dscr, 0) / filtered.length).toFixed(2) : '—', [filtered]);` |
| `avgIrr` | `useMemo(() => filtered.length ? (filtered.reduce((s, d) => s + d.irr, 0) / filtered.length).toFixed(1) : '—', [filtered]);` |
| `totalCapex` | `useMemo(() => filtered.reduce((s, d) => s + d.capex, 0), [filtered]);` |
| `annualRevenue` | `useMemo(() => capMtInput * 1e6 * lcoValue * 264 / 1e6, [capMtInput, lcoValue]);` |
| `annualOpex` | `useMemo(() => capexInput * 0.035, [capexInput]);` |
| `debt` | `capexInput * 0.65;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| DSCR (min for bankability) | `EBITDA / (Principal + Interest)` | Standard project finance practice | Aviation sector lenders require 1.20–1.25× minimum; DFI blended finance may accept 1.15×. |
| Equity IRR target | `Levered IRR with 60–70% debt` | IFC/BNEF SAF Finance Survey | Higher risk pathways (PtL) require 16–18%; mature HEFA accepts 12–14%. |
| CAPEX range ($/gal/yr) | `Total CAPEX / Nameplate_Capacity_gal_yr` | NREL TEA Benchmarks | HEFA $3–4/gal/yr; FT $5–7/gal/yr; PtL $6–9/gal/yr; learning expected to halve PtL by 2035. |
- **SAF deal database + project finance model + blended finance structures** → IRR/DSCR engine + 20-deal pipeline + risk scatter + blended capital stack → **SAF project developers, infrastructure funds, DFI officers, and airline financiers**

## 5 · Intermediate Transformation Logic
**Methodology:** SAF Project IRR (Newton-Raphson)
**Headline formula:** `IRR: NPV(r) = Σ CF_t/(1+r)^t = 0; DSCR = EBITDA / Debt_Service`
**Standards:** ['NREL SAF Techno-Economic Analysis', 'BNEF SAF Market Outlook 2024', 'IFC Blended Finance Principles']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).