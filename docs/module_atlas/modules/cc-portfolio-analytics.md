# Carbon Credit Portfolio Analytics
**Module ID:** `cc-portfolio-analytics` · **Route:** `/cc-portfolio-analytics` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Portfolio-level analytics for carbon credit holdings across 21 methodology types. Provides vintage diversification, methodology concentration, credit rating distribution, cost basis analysis, and retirement planning tools integrated with the CarbonCreditContext data bus.

> **Business value:** Portfolio analytics aggregates 21 methodology engines. Weighted quality score and methodology HHI are primary credit risk metrics. Retirement optimiser maximises quality score of retained portfolio.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `Badge`, `FAMILIES`, `KpiCard`, `PIE_COLORS`, `POSITIONS`, `REGIONS`, `Row`, `Section`, `TABS`, `TabBar`, `VINTAGES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `FAMILIES` | `['Nature-Based', 'Agriculture & Soil', 'Energy Transition', 'Waste & Circular', 'Industrial Process', 'Carbon Dioxide Removal', 'Community & Cookstove` |
| `REGIONS` | `['Latin America', 'Sub-Saharan Africa', 'Southeast Asia', 'South Asia', 'North America', 'Europe'];` |
| `names` | `['Madre de Dios REDD+','Kasigau Corridor','Cerrado Reforestation','Mekong Blue Carbon','Gujarat Solar Farm',` |
| `credits` | `Math.round(sr(i * 17) * 180000 + 20000);` |
| `price` | `parseFloat((sr(i * 19) * 40 + 3).toFixed(2));` |
| `retired` | `Math.round(credits * (sr(i * 23) * 0.6 + 0.1));` |
| `totalValue` | `POSITIONS.reduce((s, p) => s + p.value, 0);` |
| `totalCredits` | `POSITIONS.reduce((s, p) => s + p.credits, 0);` |
| `totalRetired` | `POSITIONS.reduce((s, p) => s + p.retired, 0);` |
| `retirementRate` | `((totalRetired / totalCredits) * 100).toFixed(1);` |
| `avgAge` | `(POSITIONS.reduce((s, p) => s + (2026 - p.vintage), 0) / (POSITIONS.length \|\| 1)).toFixed(1);` |
| `familyDonut` | `useMemo(() => FAMILIES.map(f => ({` |
| `vintageBar` | `useMemo(() => VINTAGES.map(v => ({` |
| `avgReversal` | `parseFloat((POSITIONS.reduce((s, p) => s + p.reversalRisk, 0) / (POSITIONS.length \|\| 1) * 100).toFixed(1));` |
| `avgRegulatory` | `parseFloat((POSITIONS.reduce((s, p) => s + p.regulatoryRisk, 0) / (POSITIONS.length \|\| 1) * 100).toFixed(1));` |
| `priceVol` | `parseFloat((POSITIONS.reduce((s, p) => s + Math.abs(p.priceCurrent - p.priceAcquired) / Math.max(p.priceAcquired, 0.01), 0) / (POSITIONS.length \|\| 1) ` |
| `familyShares` | `FAMILIES.map(f => {` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `FAMILIES`, `PIE_COLORS`, `REGIONS`, `TABS`, `VINTAGES`
**Shared context buses:** `CarbonCreditContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio Volume | `Σ all positions` | CarbonCreditContext | Total carbon credit holdings across all methodologies and vintages |
| Weighted Quality Score | `Σ(vol × Q) / Σvol` | Model output | Volume-weighted average ICVCM quality score across portfolio |
| Vintage Entropy | `Shannon entropy of vintage distribution` | Portfolio analytics | Diversification across vintage years; higher = more diversified |
| Methodology HHI | `Σ(share_i²)` | Portfolio analytics | Methodology concentration; below 0.15 = well-diversified |
- **CarbonCreditContext data bus** → All 21 engine positions → portfolio → **Aggregated holdings**
- **Market price feed** → Methodology × vintage price → MtM → **Portfolio market value**

## 5 · Intermediate Transformation Logic
**Methodology:** Portfolio analytics: vintage-weighted quality and cost basis
**Headline formula:** `WtdQuality = Σ(vol_i × Q_i) / Σvol_i; CostBasis = Σ(vol_i × price_i) / Σvol_i`
**Standards:** ['ICVCM CCP', 'Ecosystem Marketplace', 'Portfolio theory (Markowitz)']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).