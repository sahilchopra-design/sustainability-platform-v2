# Net Zero Commitment Tracker
**Module ID:** `net-zero-commitment-tracker` · **Route:** `/net-zero-commitment-tracker` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Evaluates the credibility of corporate and country net-zero pledges by assessing target coverage, interim milestones, Scope 3 inclusion, and independent verification quality.

> **Business value:** Enables investors, rating agencies, and civil society to systematically distinguish genuine net-zero commitments from empty pledges, supporting stewardship, ESG ratings, and portfolio alignment decisions.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALLIANCES`, `ALLIANCE_COLORS`, `ALL_SIGNATORIES`, `AUM_TIERS`, `CustomTooltipStyle`, `FIRM_NAMES_NZAM`, `FIRM_NAMES_NZAOA`, `FIRM_NAMES_NZBA`, `MEMBERSHIP_GROWTH`, `PORTFOLIO_HOLDINGS`, `REGIONAL_BREAKDOWN`, `REGIONS`, `STATUS_OPTIONS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['Europe','North America','Asia-Pacific','UK','Nordics','Other'];` |
| `targetYear` | `isWithdrawn ? null : (2040 + Math.floor(s2 * 4) * 5);` |
| `interimTarget` | `isWithdrawn ? null : Math.round(25 + s3 * 30);` |
| `pctCovered` | `isWithdrawn ? 0 : Math.round(30 + s * 60);` |
| `actualReduction` | `isWithdrawn ? 0 : Math.round(interimTarget * (0.3 + s2 * 0.8));` |
| `regionIdx` | `Math.floor(s4 * REGIONS.length);` |
| `pillBase` | `{ display:'inline-block', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, fontFamily:T.font };` |
| `statusColor` | `(s) => s==='On-Track'?T.green:s==='Behind'?T.amber:s==='Withdrawn'?T.red:T.textMut;` |
| `statusPill` | `(s) => ({ ...pillBase, background:statusColor(s)+'18', color:statusColor(s) });` |
| `fmtB` | `(v) => v >= 1000 ? `$${(v/1000).toFixed(1)}T` : `$${v}B`;` |
| `counts` | `{ 'On-Track':0, 'Behind':0, 'No Target':0, 'Withdrawn':0 };` |
| `avgCommitted` | `sigs.length ? Math.round(sigs.reduce((t, s) => t + s.committed, 0) / sigs.length) : 0;` |
| `avgActual` | `sigs.length ? Math.round(sigs.reduce((t, s) => t + s.actual, 0) / sigs.length) : 0;` |
| `total` | `PORTFOLIO_HOLDINGS.reduce((s, h) => s + h.allocationPct, 0);` |
| `committed` | `PORTFOLIO_HOLDINGS.filter(h => h.isNzCommitted).reduce((s, h) => s + h.allocationPct, 0);` |
| `nzam` | `PORTFOLIO_HOLDINGS.filter(h => h.alliance === 'NZAM').reduce((s, h) => s + h.allocationPct, 0);` |
| `nzaoa` | `PORTFOLIO_HOLDINGS.filter(h => h.alliance === 'NZAOA').reduce((s, h) => s + h.allocationPct, 0);` |
| `nzba` | `PORTFOLIO_HOLDINGS.filter(h => h.alliance === 'NZBA').reduce((s, h) => s + h.allocationPct, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALLIANCES`, `AUM_TIERS`, `FIRM_NAMES_NZAM`, `FIRM_NAMES_NZAOA`, `FIRM_NAMES_NZBA`, `REGIONS`, `STATUS_OPTIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Corporate Net Zero Pledges (Fortune 500) | — | Net Zero Tracker 2024 | Share of Fortune 500 companies with a publicly stated net-zero or carbon neutrality commitment. |
| High-Credibility Pledges | — | NewClimate Institute 2023 | Fraction of corporate net-zero commitments rated as high-integrity by the NewClimate Institute Corporate Clima |
- **SBTi registry, Net Zero Tracker database, company sustainability reports, third-party assurance statements** → Pledge parsing, credibility dimension scoring, greenwashing flag generation → **Entity NZCS scores, peer benchmarking, engagement priority lists for active stewardship**

## 5 · Intermediate Transformation Logic
**Methodology:** Net Zero Credibility Score
**Headline formula:** `NZCS = Σ wᵢ × Dimensionᵢ`
**Standards:** ['Net Zero Tracker 2024', 'NewClimate Institute Corporate Climate Responsibility Monitor']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).