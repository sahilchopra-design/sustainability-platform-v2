# Carbon Credit Methodology Comparison
**Module ID:** `cc-methodology-comparison` · **Route:** `/cc-methodology-comparison` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Side-by-side methodology comparison engine for all 21 carbon credit standard types. Scores each methodology on 8 ICVCM-aligned dimensions and provides filtering, ranking, and cost benchmarking to support project selection and portfolio construction.

> **Business value:** Composite methodology score = weighted sum across 8 ICVCM-aligned dimensions. Top performers: REDD+ (conservation-grade) 78/100; ARR 74/100; DAC 82/100 on permanence but 45/100 on cost.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `Badge`, `CLUSTERS`, `DualInput`, `FAMILIES`, `FAMILY_COLORS`, `KpiCard`, `Row`, `Section`, `Sel`, `TABS`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `TABS` | `['Methodology Matrix', 'Cost Curve Analysis', 'Permanence Comparison', 'Integrity Scoring', 'Co-Benefits Analysis', 'Scenario Builder'];` |
| `FAMILIES` | `['Nature-Based', 'Agriculture & Soil', 'Energy Transition', 'Waste & Circular', 'Industrial Process', 'Carbon Dioxide Removal', 'Community & Cookstove` |
| `FAMILY_COLORS` | `{ 'Nature-Based': '#059669', 'Agriculture & Soil': '#84cc16', 'Energy Transition': '#3b82f6', 'Waste & Circular': '#f59e0b', 'Industrial Process': '#8` |
| `sorted` | `[...eligible].sort((a, b) => a.abatementCost - b.abatementCost);` |
| `maxByConc` | `Math.round(retireTarget * (maxConcentration / 100));` |
| `canAfford` | `Math.floor(remaining / c.avgPrice);` |
| `totalCredits` | `allocs.reduce((s, a) => s + a.credits, 0);` |
| `totalCost` | `allocs.reduce((s, a) => s + a.cost, 0);` |
| `avgPermanence` | `allocs.length ? Math.round(allocs.reduce((s, a) => s + a.permanence * a.credits, 0) / Math.max(totalCredits, 1)) : 0;` |
| `avgCoBenefit` | `allocs.length ? Math.round(allocs.reduce((s, a) => s + a.coBenefit * a.credits, 0) / Math.max(totalCredits, 1)) : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CLUSTERS`, `FAMILIES`, `RADAR_COLORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Additionality Score | `Barrier + investment test rigor` | ICVCM CCP | Strength of methodology additionality demonstration requirements |
| Permanence Score | `Storage horizon + reversal insurance` | ICVCM CCP | Credit quality dimension for long-term storage assurance |
| MRV Rigor Score | `Monitoring frequency and verification` | Methodology standard | Quality of measurement, reporting, and verification requirements |
| Credit Price Range | `Market data by methodology type` | Ecosystem Marketplace | Observed transaction price range in voluntary carbon market |
- **ICVCM assessment database** → CCP scores → dimension ratings → **Methodology quality matrix**
- **Ecosystem Marketplace transaction data** → Price observations → cost benchmarks → **Price range by methodology**

## 5 · Intermediate Transformation Logic
**Methodology:** Multi-criteria methodology scoring matrix
**Headline formula:** `Score_m = Σ(w_d × Rating_md) for d in {Additionality, Permanence, MRV, CobenefitCount, Scalability, Cost, RegAcceptance, CreditIntegrity}`
**Standards:** ['ICVCM Core Carbon Principles 2023', 'Ecosystem Marketplace', 'BeZero Carbon Ratings', 'Sylvera Carbon Ratings']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).