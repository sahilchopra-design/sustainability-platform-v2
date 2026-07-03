# Sovereign Debt Sustainability
**Module ID:** `sovereign-debt-sustainability` · **Route:** `/sovereign-debt-sustainability` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Climate-adjusted debt sustainability analysis incorporating physical damage costs, transition expenditure, and stranded asset losses into IMF DSA framework projections for sovereign issuers.

> **Business value:** Integrates physical and transition climate shocks into sovereign debt sustainability analysis to identify climate-driven fiscal vulnerabilities.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COST_COLORS`, `COST_TYPES`, `COUNTRIES`, `COUNTRIES_RAW`, `CustomTooltip`, `DebtTrajectoryTab`, `FiscalClimateTab`, `InvestmentTab`, `REGIONS`, `SCENARIOS`, `SHORT_YEARS`, `TABS`, `VULN_DIMS`, `VulnerabilityTab`, `YEARS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `base` | `c.debtGdp + t * (4 + s * 3) * (c.debtGdp > 80 ? 1.3 : 1);` |
| `orderly` | `base + t * (1.5 + s * 2);` |
| `disorderly` | `base + t * (4 + s * 5) + (yr > 2035 ? (yr - 2035) * 0.8 : 0);` |
| `hothouse` | `base + t * (6 + s * 8) + (yr > 2030 ? (yr - 2030) * 1.2 : 0);` |
| `debtScore` | `Math.min(100, (c.debtGdp / 2.5) + s * 10);` |
| `climExp` | `isSids ? 85 + s * 15 : isLdc ? 65 + s * 20 : 25 + s * 30;` |
| `fiscalSpace` | `100 - Math.min(100, Math.abs(c.fiscalBal) * 8 + s * 15);` |
| `instCap` | `c.group === 'Advanced' ? 75 + s * 20 : isLdc ? 20 + s * 25 : 40 + s * 25;` |
| `extSupport` | `isSids ? 55 + s * 20 : isLdc ? 45 + s * 20 : c.group === 'Advanced' ? 80 + s * 15 : 35 + s * 25;` |
| `COUNTRIES` | `COUNTRIES_RAW.map((c, i) => ({` |
| `sHeader` | `{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 };` |
| `sTitle` | `{ fontSize:22, fontWeight:700, color:T.navy, letterSpacing:'-0.02em' };` |
| `sCardTitle` | `{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:12, fontFamily:T.mono, letterSpacing:'-0.01em' };` |
| `sChip` | `(color) => ({ display:'inline-block', padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:600, fontFamily:T.mono, background:color+'18', color ` |
| `pct` | `(v) => v == null ? '\u2014' : v.toFixed(1) + '%';` |
| `csv` | `[hdr.join(','), ...rows.map(r => hdr.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type:'text/csv' });` |
| `peak` | `Math.max(...data.map(d => Math.max(d.baseline, d.orderly, d.disorderly, d.hothouse)));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COST_COLORS`, `COST_TYPES`, `COUNTRIES_RAW`, `REGIONS`, `SCENARIOS`, `SHORT_YEARS`, `TABS`, `VULN_DIMS`, `YEARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Countries in DSA | — | IMF/World Bank | Sovereign issuers with active climate-adjusted debt sustainability analysis. |
| Avg Climate Debt Add | — | Climate DSA model | Average addition to debt/GDP ratio from cumulative climate fiscal shocks under RCP 4.5 by 2035. |
| DSA Breach Rate | — | Calculated | Share of sovereign issuers breaching IMF high-risk debt thresholds after applying climate adjustment. |
- **IMF DSA baselines, NGFS GDP shocks, stranded asset revenue estimates** → Climate shock overlays, debt trajectory simulation, threshold breach analysis → **Climate-adjusted debt paths, DSA breach flags, scenario comparison reports**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate-Adjusted Debt/GDP
**Headline formula:** `(Baseline Debt + Climate Shock) ÷ (GDP × (1 – GDP Impact))`
**Standards:** ['IMF DSA Framework', 'NGFS Macro-Financial', 'World Bank CCDR']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).