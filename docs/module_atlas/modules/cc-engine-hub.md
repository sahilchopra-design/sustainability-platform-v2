# Carbon Credit Engine Hub
**Module ID:** `cc-engine-hub` · **Route:** `/cc-engine-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Central orchestration hub for all 21 carbon credit methodology engines. Provides cross-methodology portfolio analytics, credit quality scoring, methodology comparison, and integration with the CarbonCreditContext data bus for downstream module consumption.

> **Business value:** Portfolio quality score aggregates 21 methodology engines on 4 ICVCM dimensions. ICVCM CCP screen filters credits below 60-point quality threshold.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `Badge`, `DualInput`, `FAMILIES`, `FAMILY_COLORS`, `Inp`, `KpiCard`, `METHODOLOGIES`, `PIE_COLORS`, `PROJECTS`, `REGIONS`, `REGISTRIES`, `Row`, `Section`, `Sel`, `TABS`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `FAMILIES` | `['Nature-Based', 'Agriculture & Soil', 'Energy Transition', 'Waste & Circular', 'Industrial Process', 'Carbon Dioxide Removal', 'Community & Cookstove` |
| `FAMILY_COLORS` | `{ 'Nature-Based': '#059669', 'Agriculture & Soil': '#84cc16', 'Energy Transition': '#3b82f6', 'Waste & Circular': '#f59e0b', 'Industrial Process': '#8` |
| `REGIONS` | `['Latin America', 'Sub-Saharan Africa', 'Southeast Asia', 'South Asia', 'East Asia', 'North America', 'Europe', 'Oceania'];` |
| `meth` | `meths[Math.floor(sr(i * 13) * meths.length)] \|\| METHODOLOGIES[0];` |
| `issued` | `PROJECTS.reduce((s, p) => s + p.creditsIssued, 0);` |
| `retired` | `PROJECTS.reduce((s, p) => s + p.creditsRetired, 0);` |
| `available` | `PROJECTS.reduce((s, p) => s + p.creditsAvailable, 0);` |
| `familyChart` | `useMemo(() => FAMILIES.map(f => {` |
| `geoChart` | `useMemo(() => REGIONS.map((r, i) => ({` |
| `recentActivity` | `useMemo(() => PROJECTS.slice(0, 8).map((p, i) => ({` |
| `familyNav` | `useMemo(() => FAMILIES.map(f => {` |
| `calcClusters` | `useMemo(() => [...new Set(METHODOLOGIES.filter(m => m.family === calcFamily).map(m => m.cluster))], [calcFamily]);` |
| `familyYield` | `{ 'Nature-Based': 8.5, 'Agriculture & Soil': 3.2, 'Energy Transition': 12.1, 'Waste & Circular': 6.8, 'Industrial Process': 15.4, 'Carbon Dioxide Remo` |
| `annualCredits` | `Math.round(area * baseYield * mul);` |
| `totalCredits` | `annualCredits * period;` |
| `avgPrice` | `parseFloat((sr(METHODOLOGIES.indexOf(meth) * 43) * 30 + 5).toFixed(2));` |
| `totalValue` | `Math.round(totalCredits * avgPrice);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `FAMILIES`, `METHODOLOGIES`, `PIE_COLORS`, `REGIONS`, `REGISTRIES`, `TABS`
**Shared context buses:** `CarbonCreditContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio Quality Score | `Weighted avg of methodology scores` | Model output | Overall quality rating of carbon credit portfolio |
| ICVCM CCP Pass Rate | `Credits meeting CCP threshold / total` | ICVCM assessment | Share of portfolio credits passing Core Carbon Principles screen |
| Methodology Diversification | `Σ(share_i²)` | Portfolio analytics | Concentration metric; lower HHI = more diversified methodology mix |
| Credit Volume by Methodology | `Σ issuance per methodology` | Registry data | Breakdown of portfolio by credit type and standard |
- **21 methodology engines** → Credit issuance data → CarbonCreditContext → **Portfolio positions**
- **ICVCM assessment database** → CCP scores → quality filter → **CCP-aligned credit share**

## 5 · Intermediate Transformation Logic
**Methodology:** Portfolio-level credit aggregation and quality scoring
**Headline formula:** `PortfolioScore = Σ(w_i × QualityScore_i); QualityScore = f(Additionality, Permanence, MRV_Rigor, CobenefitCount)`
**Standards:** ['Verra VCS', 'Gold Standard', 'ICVCM Core Carbon Principles', 'BeZero Carbon Ratings']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).