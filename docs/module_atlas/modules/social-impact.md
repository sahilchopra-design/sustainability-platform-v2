# Social Impact Analytics
**Module ID:** `social-impact` · **Route:** `/social-impact` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
SDG impact measurement across portfolio companies. Covers IRIS+ metrics, impact-weighted accounts, stakeholder theory analysis, and IMP 5-dimension impact framework.

> **Business value:** Institutional investors are increasingly required to demonstrate positive real-world impact, not just ESG scores. IMP framework and IRIS+ metrics provide the structured approach to measure whether investments generate meaningful improvements in people's lives and the environment.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `Card`, `IMPACT_BENCHMARKS`, `KpiCard`, `LS_KEY`, `LS_SDG_TARGETS`, `PIE_COLORS`, `SDG_FRAMEWORK`, `SDG_SECTOR_WEIGHTS`, `Section`, `SortTh`, `TABS`, `TabBar`, `UNGC_PRINCIPLES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `baseSeed` | `seed(idx * 17 + sdg.id * 7);` |
| `companyAction` | `Math.round(baseSeed * 35);` |
| `revenueAlign` | `Math.round(seed(idx * 13 + sdg.id * 11) * 25);` |
| `diversityBonus` | `sdg.id === 5 && (company.female_board_pct \|\| seed(idx * 31) * 40) > 30 ? 12 : 0;` |
| `raw` | `sectorBonus + companyAction + revenueAlign + sbtiBonus + diversityBonus;` |
| `enriched` | `useMemo(() => holdings.map((h, i) => {` |
| `avgScore` | `Math.round(Object.values(sdgScores).reduce((a, b) => a + b, 0) / 17);` |
| `topSDG` | `Object.entries(sdgScores).sort((a, b) => b[1] - a[1])[0];` |
| `botSDG` | `Object.entries(sdgScores).sort((a, b) => a[1] - b[1])[0];` |
| `avgRevAlign` | `Math.round(Object.values(revAlign).reduce((a, b) => a + b, 0) / 17);` |
| `allScores` | `enriched.map(e => e.avgScore);` |
| `avgAlign` | `Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);` |
| `topSDGId` | `Object.entries(sdgAgg).sort((a, b) => b[1] - a[1])[0];` |
| `botSDGId` | `Object.entries(sdgAgg).sort((a, b) => a[1] - b[1])[0];` |
| `avgRevAlign` | `Math.round(enriched.reduce((s, e) => s + e.avgRevAlign, 0) / enriched.length);` |
| `socialScore` | `Math.round(avgAlign * 0.5 + avgRevAlign * 0.3 + sdgsAbove50 / 17 * 100 * 0.2);` |
| `dataCov` | `Math.round(enriched.filter(e => e.avgScore > 15).length / enriched.length * 100);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PIE_COLORS`, `SDG_FRAMEWORK`, `TABS`, `UNGC_PRINCIPLES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| IRIS+ Metrics | — | GIIN | Standardised impact measurement metrics |
| SDGs Covered | — | UN | All Sustainable Development Goals with linked metrics |
| Social Return on Investment | — | SROI Network | Monetised social value per £1 invested |
- **Company activity data** → IRIS+ metric calculation → **Impact metric values**
- **Shadow prices** → Social value monetisation → **Impact-weighted accounts**
- **Impact scores** → IMP 5-dimension → **Portfolio impact profile**

## 5 · Intermediate Transformation Logic
**Methodology:** IMP 5-dimension impact scoring
**Headline formula:** `Impact = What(25) + Who(20) + How Much(30) + Contribution(15) + Risk(10)`
**Standards:** ['Impact Management Project', 'GIIN IRIS+', 'ILO Social Dialogue']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).