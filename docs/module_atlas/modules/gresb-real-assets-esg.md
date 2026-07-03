# GRESB Real Assets ESG
**Module ID:** `gresb-real-assets-esg` · **Route:** `/gresb-real-assets-esg` · **Tier:** B (frontend-computed) · **EP code:** EP-EI5 · **Sprint:** EI

## 1 · Overview
GRESB real assets benchmarking analytics: 20-fund scorecard with Management/Performance scores and star ratings, sort controls, 8-year trend (2017–2024), best practice adoption rates, and 6 institutional investor GRESB requirements (APG/CPPIB/CalPERS/PGGM/USS/Aware Super).

> **Business value:** Used by real estate fund managers optimising GRESB scores for capital access, institutional investors screening fund allocations, and ESG consultants advising on best-practice adoption.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BEST_PRACTICE`, `FUNDS`, `GRESB_COMPONENTS`, `KpiCard`, `Pill`, `TABS`, `TREND_DATA`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sorted` | `useMemo(() => [...FUNDS].sort((a, b) => b[sort] - a[sort]), [sort]);` |
| `vals` | `[...col.data].map(f => f[col.key]);` |
| `min` | `Math.min(...vals), max = Math.max(...vals), avg = Math.round(vals.reduce((a, v) => a + v, 0) / vals.length);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BEST_PRACTICE`, `GRESB_COMPONENTS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| GRESB 5-Star threshold (2024) | `Score out of 100 for top quintile` | GRESB 2024 Benchmark Report | Average diversified fund score ~64; 5-star requires top 20% of peer benchmark; energy intensity and GHG data q |
| APG GRESB minimum | `Minimum GRESB rating for new capital allocation` | APG Responsible Investment Policy 2023 | APG manages €550Bn; requires minimum GRESB 3-star for real assets; 4+ star preferred; exclusion below 2-star. |
| GRESB Green Certification weight | `Of total Performance score` | GRESB Real Estate Scoring Methodology 2024 | Certification evidence (LEED/BREEAM/ENERGY STAR) now worth 15% of score; quality of certification matters (Pla |
- **GRESB 2024 Scoring Methodology + APG/CPPIB/CalPERS/PGGM/USS/Aware Super requirements + CBI CMBS Standard** → Fund benchmark + score breakdown + trend analysis + best practice + investor requirements → **Real estate fund managers, institutional investors, ESG consultants, and sustainability-linked loan structurers**

## 5 · Intermediate Transformation Logic
**Methodology:** GRESB Total Score
**Headline formula:** `GRESB_Total = 0.30 × Management + 0.70 × Performance; Star_Rating = Quintile(Fund_Score, Benchmark_Universe); Quartile_Rank = PercentileRank(Score, peers)`
**Standards:** ['GRESB Real Estate Assessment 2024', 'GRESB Scoring Methodology 2024', 'PRI Real Estate ESG Requirements']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).