# Sovereign ESG Hub
**Module ID:** `sovereign-esg-hub` · **Route:** `/sovereign-esg-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Comprehensive sovereign ESG analytics platform consolidating environmental, social and governance pillar scores, country-level data, and portfolio sovereign ESG exposure in one integrated dashboard.

> **Business value:** Consolidates sovereign ESG intelligence across environmental, social and governance pillars into a unified portfolio-ready scoring platform.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALERTS`, `ALERT_TYPE_COLORS`, `BOARD_RISKS`, `Badge`, `COUNTRIES`, `CustomTooltip`, `KpiCard`, `NDC_COLORS`, `PORTFOLIO`, `REGION_COLORS`, `RESEARCH`, `SEVERITY_COLORS`, `SectionHeader`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGION_COLORS` | `{ Europe:"#3b82f6","Asia-DM":"#10b981","Asia-EM":"#06b6d4","N America":"#8b5cf6",LAC:"#f59e0b",Africa:"#ef4444",MENA:"#ec4899","EMEA-EM":"#f97316",Pac` |
| `NDC_COLORS` | `{ A:T.green,"A-":"#34d399","B+":"#86efac",B:T.amber,"B-":"#fcd34d","C+":"#fb923c",C:"#f97316","C-":"#ef4444",D:T.red };` |
| `dir` | `sortDir === "asc" ? 1 : -1;` |
| `portfolioEsgAvg` | `(PORTFOLIO.reduce((s,p) => s+(p.esgScore*p.weightPct),0)/(PORTFOLIO.reduce((s,p)=>s+p.weightPct,0)\|\|1)).toFixed(1);` |
| `portfolioPhysAvg` | `(PORTFOLIO.reduce((s,p) => s+(p.physicalRisk*p.weightPct),0)/(PORTFOLIO.reduce((s,p)=>s+p.weightPct,0)\|\|1)).toFixed(1);` |
| `totalGreenExposure` | `(PORTFOLIO.reduce((s,p)=>s+p.greenBondExposureMnUSD,0)/1000).toFixed(1);` |
| `comparatorCountries` | `[comparatorA,comparatorB,comparatorC,comparatorD].map(iso2 => COUNTRIES.find(c=>c.iso2===iso2)).filter(Boolean);` |
| `uniqueRegions` | `[...new Set(COUNTRIES.map(c=>c.region))];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALERTS`, `BOARD_RISKS`, `COMP_COLORS`, `COUNTRIES`, `PORTFOLIO`, `RESEARCH`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Countries Covered | — | Sovereign database | Sovereign entities with complete ESG pillar data across E, S and G dimensions. |
| Portfolio ESG Score | — | Weighted avg | AUM-weighted mean sovereign ESG composite score across sovereign bond portfolio. |
| Governance Laggards | — | WB Governance Indicators | Sovereign issuers scoring below 30 on governance pillar based on World Bank indicators. |
- **MSCI/Sustainalytics sovereign data, World Bank WGI, UNDP HDI** → Pillar aggregation, composite weighting, portfolio overlay → **Sovereign ESG scores, pillar breakdowns, portfolio heatmaps**

## 5 · Intermediate Transformation Logic
**Methodology:** Sovereign ESG Composite
**Headline formula:** `(E_score × 0.35) + (S_score × 0.35) + (G_score × 0.30)`
**Standards:** ['MSCI Sovereign ESG', 'Sustainalytics Country Risk', 'World Bank Governance Indicators']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).