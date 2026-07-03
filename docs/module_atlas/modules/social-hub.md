# Social Analytics Hub
**Module ID:** `social-hub` · **Route:** `/social-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Comprehensive social metrics platform integrating workforce analytics (pay equity, diversity, safety) and supply chain social risk (forced labour, living wage, human rights) in a unified dashboard.

> **Business value:** Integrates workforce and supply chain social analytics into a unified scoring framework aligned to ILO and UNGP standards.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACTIONS`, `Badge`, `Btn`, `COMPOSITE_WEIGHTS`, `COUNTRY_RISK`, `Card`, `ENGAGEMENT_MATRIX`, `KpiCard`, `LS_BOARD`, `LS_HR_DD`, `LS_PORTFOLIO`, `LS_SDG`, `MODULES`, `PIE_COLORS`, `RISK_DIMENSIONS`, `SFDR_PAI_SOCIAL`, `SOCIAL_THRESHOLDS`, `Section`, `SortTh`, `TABS`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `TABS` | `['Overview', 'Social Risk', 'Holdings Analysis', 'Regulatory & PAI', 'Actions & Cross-Nav'];` |
| `base` | `seed(idx * 17 + di * 13);` |
| `sectorBonus` | `sector.includes('financ') ? 8 : sector.includes('health') ? 5 : sector.includes('tech') \|\| sector.includes('it') ? -3 : 0;` |
| `boardScore` | `Math.min(100, kpis.femaleBoard * 1.5 + kpis.independentBoard * 0.5);` |
| `livingWageScore` | `Math.max(0, 100 - kpis.livingWageGap * 3);` |
| `hrScore` | `Math.max(0, 100 - kpis.hrRisk);` |
| `enriched` | `useMemo(() => holdings.map((h, i) => {` |
| `avg` | `(arr) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);` |
| `femaleBoard` | `avg(enriched.map(e => e.moduleKPIs.femaleBoard));` |
| `independent` | `avg(enriched.map(e => e.moduleKPIs.independentBoard));` |
| `livingWageGap` | `avg(enriched.map(e => e.moduleKPIs.livingWageGap));` |
| `hrRisk` | `avg(enriched.map(e => e.moduleKPIs.hrRisk));` |
| `ungp` | `avg(enriched.map(e => e.moduleKPIs.ungpCompliance));` |
| `safetyRate` | `(enriched.reduce((s, e) => s + parseFloat(e.moduleKPIs.safetyRate), 0) / enriched.length).toFixed(1);` |
| `engagement` | `avg(enriched.map(e => e.moduleKPIs.engagement));` |
| `turnover` | `avg(enriched.map(e => e.moduleKPIs.turnover));` |
| `trainingHrs` | `avg(enriched.map(e => e.moduleKPIs.trainingHrs));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ACTIONS`, `COUNTRY_RISK`, `ENGAGEMENT_MATRIX`, `MODULES`, `PIE_COLORS`, `RISK_DIMENSIONS`, `SFDR_PAI_SOCIAL`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Companies Assessed | — | Social database | Portfolio companies with active social analytics coverage across workforce and supply chain dimensions. |
| Living Wage Gap | — | WageIndicator | Share of assessed companies with minimum wages below living wage benchmark in primary operating country. |
| LTIFR (portfolio avg) | — | Sustainalytics | Portfolio average Lost Time Injury Frequency Rate per million hours worked. |
- **Workforce disclosures, supply chain audit data, ESG provider social scores** → Pillar scoring, gap analysis, ILO alignment assessment → **Social risk scores, workforce dashboards, supply chain heatmaps**

## 5 · Intermediate Transformation Logic
**Methodology:** Social Risk Score
**Headline formula:** `(Workforce Score × 0.5) + (Supply Chain Score × 0.5)`
**Standards:** ['ILO Core Conventions', 'GRI 400 Series', 'UN Guiding Principles']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).