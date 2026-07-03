# Enhanced Weathering Finance Platform
**Module ID:** `enhanced-weathering-finance` · **Route:** `/enhanced-weathering-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-EH2 · **Sprint:** EH

## 1 · Overview
Rock-to-soil CDR analytics for basalt, olivine, wollastonite, and steel slag deployment. 20 seeded projects across tropical and temperate agricultural regions with MRV partner intelligence, co-benefit quantification (8–15% crop yield uplift), scale economics calculator, and LCOC learning curves.

> **Business value:** Used by enhanced weathering project developers optimising deployment economics, agricultural companies evaluating soil amendment co-benefits, carbon buyers assessing permanence, and investors building CDR portfolios.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CO_BENEFITS`, `KpiCard`, `LCOC_BREAKDOWN`, `LEARNING_CURVE`, `MINERAL_TYPES`, `PROJECTS`, `Pill`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Overview', 'Mineral Analysis', 'Project Economics', 'Learning Curves', 'Co-Benefits', 'Market & MRV'];` |
| `scaleFactor` | `Math.pow(scaleSlider / 1000, -0.15);` |
| `scaledLcoc` | `Math.round(baseLcoc * scaleFactor);` |
| `annualRevenue` | `annualCDR * carbonPrice * 1000;` |
| `annualCost` | `annualCDR * scaledLcoc * 1000;` |
| `last` | `LEARNING_CURVE[LEARNING_CURVE.length - 1][key === 'steelslag' ? 'slag' : key];` |
| `reduction` | `Math.round((1 - last / first) * 100);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CO_BENEFITS`, `LCOC_BREAKDOWN`, `MINERAL_TYPES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Basalt CDR potential (tCO2/t rock) | `Theoretical maximum; actual 0.15–0.25 with MRV` | UNDO Science + Nature 2023 study | Actual CDR credited = theoretical × verification_factor (0.5–0.7 for current MRV methods); permanence 10,000+  |
| LCOC basalt ($/tCO₂) | `Mining + crushing + transport + application + MRV` | UNDO + Stripe Frontier advance purchase data | Transport is 30–40% of cost; optimal for tropical agricultural regions near basalt quarries. Learning curve: - |
| Co-benefit: crop yield uplift (%) | `Tropical soils from silica + Ca + Mg + micro-nutrient release` | Multiple peer-reviewed agronomy studies | Yield uplift reduces fertiliser cost $30–80/ha/yr; co-benefit value can offset 20–40% of EW deployment cost. |
- **UNDO/Eion EW data + Nature study + Stripe Frontier advance purchase terms** → 20-project pipeline + mineral comparison + scale economics + co-benefit radar + MRV intelligence → **EW project developers, agricultural companies, carbon buyers, and investors assessing CDR portfolio**

## 5 · Intermediate Transformation Logic
**Methodology:** Enhanced Weathering CDR (tCO₂/ha)
**Headline formula:** `CDR = Mineral_application_rate × Rock_CDR_potential × Weathering_rate × MRV_verification_factor`
**Standards:** ['UNDO EW Scientific Publications', 'Nature (2023) – Enhanced Weathering Potential', 'Eion Carbon MRV Methodology']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).