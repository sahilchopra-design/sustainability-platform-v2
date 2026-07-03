# FI Client Portfolio Analyzer
**Module ID:** `fi-client-portfolio-analyzer` · **Route:** `/fi-client-portfolio-analyzer` · **Tier:** B (frontend-computed) · **EP code:** EP-CT1 · **Sprint:** CT

## 1 · Overview
50 borrowers across 12 NACE high-impact sectors with IFRS 9 staging, transition scores, and watchlist.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BORROWERS`, `Card`, `LOBS`, `RATING_COLORS`, `RatingBadge`, `SECTOR_COLORS`, `TABS`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `score` | `Math.round(20 + sr(i * 7) * 70);` |
| `totalExposure` | `useMemo(() => BORROWERS.reduce((s, b) => s + b.exposure, 0), []);` |
| `avgScore` | `useMemo(() => Math.round(BORROWERS.reduce((s, b) => s + b.score, 0) / BORROWERS.length), []);` |
| `buckets` | `Array.from({ length: 10 }, (_, i) => ({ range: `${i * 10}-${(i + 1) * 10}`, count: 0, exposure: 0 }));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `LOBS`, `SECTOR_COLORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Borrowers | — | Demo | Across 12 NACE sectors |
| Total Exposure | — | Portfolio | Aggregate client exposure |
| Watchlist | — | Score < 40 | High-risk clients requiring engagement |
| Sector HHI | — | Herfindahl-Hirschman | Moderate sector concentration |

## 5 · Intermediate Transformation Logic
**Methodology:** IFRS 9 + climate overlay
**Headline formula:** `ECL = PD × LGD × EAD; PD_climate = PD_base × (1 + γ × Δscore)`
**Standards:** ['IFRS 9', 'Basel IV', 'ECB SREP', 'PCAF']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).