# Green Chemistry Finance Analytics
**Module ID:** `green-chemistry-finance` · **Route:** `/green-chemistry-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DL6 · **Sprint:** DL

## 1 · Overview
Evaluates investment in green chemistry and bio-based materials — replacing petrochemical feedstocks with renewable inputs. Models bio-based product market size, cost competitiveness curves, REACH chemical regulation compliance costs, and transition economics for chemical industry investors.

> **Business value:** Essential for specialty chemicals investors, bio-economy venture funds, and industrial companies seeking sustainable chemistry R&D direction. PFAS restriction creates near-term commercial urgency — quantifies biobased alternative market opportunity and cost trajectory to parity.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `COMPANIES`, `COUNTRIES`, `GREEN_TIERS`, `KpiCard`, `TABS`, `TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TYPES` | `['Specialty','Commodity','Bio-based','Green Ammonia','Green Methanol','Polymer'];` |
| `type` | `TYPES[Math.floor(sr(i * 7) * TYPES.length)];` |
| `country` | `COUNTRIES[Math.floor(sr(i * 11) * COUNTRIES.length)];` |
| `greenChemistryPct` | `Math.round(5 + sr(i * 5) * 80);` |
| `TABS` | `['Company Overview','Green Chemistry Score','Hazardous Reduction','Bio-based Transition','Renewable Feedstock','Compliance Risk','Transition Capex','I` |
| `avgGreenPct` | `(filtered.reduce((s, c) => s + c.greenChemistryPct, 0) / n).toFixed(1);` |
| `totalTransCapex` | `filtered.reduce((s, c) => s + c.transitionCapex, 0);` |
| `avgSaferScore` | `(filtered.reduce((s, c) => s + c.saferChemicalsScore, 0) / n).toFixed(1);` |
| `pctReach` | `((filtered.filter(c => c.reachCompliance).length / n) * 100).toFixed(0);` |
| `carbonCost` | `((filtered.reduce((s, c) => s + c.scope1, 0) * 1e6 * carbonPrice) / 1e9).toFixed(1);` |
| `bioRevenue` | `((filtered.reduce((s, c) => s + c.greenChemistryRevenue, 0) * (1 + biobasedPremium / 100))).toFixed(0);` |
| `typeGreenData` | `TYPES.map(t => {` |
| `hazardousWorst` | `[...filtered].sort((a, b) => b.hazardousChemicals - a.hazardousChemicals).slice(0, 15);` |
| `countryBioData` | `COUNTRIES.map(cn => {` |
| `scatterData` | `filtered.map(c => ({ x: c.transitionCapex, y: c.greenChemistryPct, name: c.name }));` |
| `innovationLeaders` | `[...filtered].sort((a, b) => b.processInnovationScore - a.processInnovationScore).slice(0, 15);` |
| `pct` | `n > 0 ? (cnt / n) * 100 : 0;` |
| `pct` | `n > 0 ? (cnt / n) * 100 : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `GREEN_TIERS`, `TABS`, `TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global Bio-based Chemicals Market | — | MarketsAndMarkets Bio-based Chemicals 2024 | Bio-based chemicals market $98Bn in 2023 — projected $185Bn by 2030 at 9.5% CAGR |
| PFAS Restriction Impact | — | ECHA PFAS Restriction 2023 | EU ECHA PFAS restriction affects 10,000+ products — creates huge demand for green chemistry alternatives |
| Carbon Intensity Reduction | — | USDA BioPreferred Program LCA 2023 | Bio-based materials typically reduce carbon intensity 40–80% vs petrochemical equivalents using life cycle ass |
- **Chemical product LCA databases (ecoinvent, GaBi)** → Carbon intensity comparison → **Bio-based vs petrochemical GHG intensity per kg product**
- **Biobased feedstock cost curves (sugars, oils, cellulose)** → Cost competitiveness modelling → **Biobased cost parity year by product category**
- **ECHA/EPA restricted substances lists** → Regulatory compliance value → **Revenue opportunity from replacing restricted petrochemicals**

## 5 · Intermediate Transformation Logic
**Methodology:** Green Chemistry Investment Score
**Headline formula:** `GreenChemScore = (BiobContentRatio × 0.3) + (CostParity × 0.3) + (RegCompliance × 0.2) + (MarketGrowth × 0.2); BiobasedCostParity = BiobbasedCost / FossilBasedCost`
**Standards:** ['EU Green Deal Chemicals Strategy for Sustainability 2020', 'US DOE Bioenergy Technologies Office Green Chemistry', 'ICCA Green Chemistry Principles', 'Ellen MacArthur Foundation New Plastics Economy']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).