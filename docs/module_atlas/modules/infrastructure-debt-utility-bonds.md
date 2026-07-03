# Infrastructure Debt & Utility Bond Analytics
**Module ID:** `infrastructure-debt-utility-bonds` · **Route:** `/infrastructure-debt-utility-bonds` · **Tier:** B (frontend-computed) · **EP code:** EP-EL6 · **Sprint:** EL

## 1 · Overview
Utility bond universe of 24 instruments (green bonds, SLBs, transition bonds, first mortgage bonds, securitisations) across T&D/water/gas/electric/renewables sectors, OAS spread credit curve by rating (AA/A/BBB/BB), 16-quarter spread history with greenium tracking, ESG label framework comparison (ICMA GBP/SBP/CBI/Transition), covenant analysis (FFO/Debt, gearing, DSCR thresholds), and duration matching tool for ALM/pension/insurance liability management.

> **Business value:** Used by fixed income credit analysts assessing relative value in utility bonds, pension and insurance ALM teams constructing infrastructure debt allocations, and DCM advisors structuring green bond and SLB programmes for regulated utility issuers.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BONDS`, `COVENANT_DATA`, `CREDIT_CURVE`, `ISSUANCE_TREND`, `KpiCard`, `Pill`, `RADAR_INFRA_DEBT`, `SPREAD_HISTORY`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `bondTypes` | `['All', ...new Set(BONDS.map(b => b.type))];` |
| `sectors` | `['All', ...new Set(BONDS.map(b => b.sector))];` |
| `ratingMatch` | `ratingFilter === 'All' \|\| (ratingFilter === 'AA' ? b.rating.includes('Aa') : ratingFilter === 'A' ? b.rating.startsWith('A3') \|\| b.rating.includes('A-` |
| `totalIssuance` | `useMemo(() => (BONDS.reduce((s,b)=>s+b.size,0)/1000).toFixed(1),[]);` |
| `greenPct` | `useMemo(() => Math.round(BONDS.filter(b=>b.certified!=='None').length/BONDS.length*100),[]);` |
| `avgSpread` | `useMemo(() => Math.round(BONDS.reduce((s,b)=>s+b.spread,0)/BONDS.length),[]);` |
| `avgDuration` | `useMemo(() => (BONDS.reduce((s,b)=>s+b.duration,0)/BONDS.length).toFixed(1),[]);` |
| `tabs` | `['Bond Universe', 'Credit Spread Curve', 'Spread History', 'Green / SLB Analytics', 'Covenant Analysis', 'Duration Matching', 'Infra Debt Radar'];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BONDS`, `COVENANT_DATA`, `CREDIT_CURVE`, `RADAR_INFRA_DEBT`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global green/SLB utility issuance (2023) | `ESG-labelled bonds from utility/infrastructure issuers` | Climate Bonds Initiative H2 2023 Report | Up 28% YoY; green bonds still largest at 68% of total; SLBs growing fastest at +45%; transition bonds nascent  |
| Greenium persistence (utilities) | `Average spread saving vs same-issuer vanilla bonds` | BIS Working Paper on Greenium 2022 | Greenium widened in 2022 risk-off (compressed to ~4bps); rebounded 2023-24 as institutional ESG demand returns |
| Infrastructure debt illiquidity premium | `Over equivalent public IG bonds (Baa1–A3)` | Preqin Infrastructure Debt Report 2023 | Direct infra debt fund average net return 6.8% vs public BBB utility 5.2%; premium compensates for illiquidity |
- **ICMA GBP/SBP/SLBP + CBI sector criteria + BIS greenium research + Moody's utility rating methodology + S&P utility scorecard + Solvency II infra debt capital treatment + ECB green bond purchase programme** → 24-bond universe + credit spread curves + spread history + greenium analytics + covenant analysis + duration matching + infra debt radar → **Fixed income credit analysts covering utility bonds, pension/insurance ALM teams building infrastructure debt allocations, ESG-labelled bond investors, and debt capital markets advisors structuring utility green/SLB issuances**

## 5 · Intermediate Transformation Logic
**Methodology:** Infrastructure Debt Valuation & Covenant Metrics
**Headline formula:** `YTM = Σ(Coupon_t + Face_t) / (1+y)^t; OAS = YTM − Risk_Free_Rate_duration_matched; Modified_Duration = Σ(t × PV_CF_t) / (Bond_Price × (1+y)); FFO_Debt = (CFO + Interest) / Net_Debt; Greenium = Spread_Vanilla − Spread_Green (same issuer, similar tenor); DSCR = EBITDA / (Interest + Scheduled_Principal)`
**Standards:** ['ICMA Green Bond Principles 2021', 'Climate Bonds Initiative Utilities Sector Criteria', "Moody's Regulated Utilities Rating Methodology 2022"]

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).