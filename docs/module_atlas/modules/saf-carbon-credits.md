# SAF Carbon Credits & CORSIA Intelligence
**Module ID:** `saf-carbon-credits` · **Route:** `/saf-carbon-credits` · **Tier:** B (frontend-computed) · **EP code:** EP-EH6 · **Sprint:** EF

## 1 · Overview
SAF carbon credit intelligence covering CORSIA CEF, ISCC+, RSB, Verra VCU, Gold Standard, and EU ETS integration. LCA waterfall by pathway, revenue stacking model ($SAF + IRA §40B + ISCC+ + CORSIA + EU ETS), registry landscape, and credit market volume forecast.

> **Business value:** Used by SAF producers stacking revenue across credit markets, airlines verifying SAF sustainability claims, and carbon market participants valuing SAF-related credit instruments.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CREDIT_TYPES`, `KpiCard`, `PROJECTS`, `Pill`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Credit Markets', 'CORSIA Credits', 'Book-and-Claim Certs', 'Lifecycle Analysis', 'Revenue Stacking', 'Registry Intelligence'];` |
| `volume` | `parseFloat((1000 + sr(i * 11 + 2) * 99000).toFixed(0));` |
| `price` | `parseFloat((ct.price * (0.85 + sr(i * 13 + 3) * 0.35)).toFixed(1));` |
| `country` | `['USA', 'EU', 'UK', 'Australia', 'Norway', 'Japan', 'UAE'][Math.floor(sr(i * 19 + 5) * 7)];` |
| `pathway` | `['HEFA', 'AtJ', 'FT-MSW', 'PtL'][Math.floor(sr(i * 23 + 6) * 4)];` |
| `vintage` | ``202${3 + Math.floor(sr(i * 29 + 7) * 2)}`;` |
| `avgPrice` | `useMemo(() => filtered.length ? (filtered.reduce((s, p) => s + p.price, 0) / filtered.length).toFixed(1) : '—', [filtered]);` |
| `totalVol` | `useMemo(() => filtered.reduce((s, p) => s + p.volume, 0), [filtered]);` |
| `ciByPathway` | `{ HEFA: 28, AtJ: 12, 'FT-MSW': 5, PtL: -70 };` |
| `ciReduction` | `baselineCI - (ciByPathway[pathway] \|\| 28);` |
| `totalGallons` | `annualProd * 1e6 * gallonsPerMt;` |
| `corsiaCredit` | `totalGallons * (ciReduction / baselineCI) * 0.0025;` |
| `isccRevenue` | `annualProd * 1e6 * 45 / 1e6;` |
| `lcaData` | `['HEFA-UCO', 'HEFA-Tallow', 'AtJ-Cellulosic', 'FT-MSW', 'PtL-Wind'].map(pw => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CREDIT_TYPES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| CORSIA CEF credit value ($/gal SAF) | `CO2_offset_per_gal × CORSIA_credit_price` | ICAO + Carbon pricing benchmarks | CI reduction × CORSIA credit price (Est. $5–25/tCO2 in Phase II); LCA from ICAO default values. |
| ISCC+ premium ($/gal) | `Certification_cost_amortised + market_premium` | EU RED market premiums observed | EU airlines pay slight premium for ISCC+ certified SAF; required for EU biofuel mandate compliance. |
| EU ETS offset value (per ton CO2) | `EU ETS spot price × CO2 displaced per gal` | EU ETS Bloomberg/ICE data | SAF displacing conventional jet in EU ETS scope reduces allowance surrender; valued at EU ETS spot. |
- **CORSIA CEF + ISCC+ + RSB + EU ETS + Verra VM0047 + revenue stacking** → LCA waterfall + 6 credit type intelligence + revenue stacker + market forecast → **SAF producers maximising revenue, airlines managing compliance, carbon traders valuing SAF credits**

## 5 · Intermediate Transformation Logic
**Methodology:** SAF Revenue Stacking Model
**Headline formula:** `Total_Revenue = SAF_price + IRA_§40B + CORSIA_CEF + ISCC+_premium + EU_ETS_offset`
**Standards:** ['ICAO CORSIA Eligible Fuels List', 'EU ETS Aviation Directive 2003/87/EC', 'Verra VCS Methodology VM0047']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).