# Land Use Change Finance
**Module ID:** `land-use-change-finance` · **Route:** `/land-use-change-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DG3 · **Sprint:** DG

## 1 · Overview
Quantifies financial exposure to land use change risks including deforestation-linked commodity supply chains, carbon sink degradation, and biodiversity loss. Integrates TNFD LEAP approach, Forest 500 corporate assessments, and jurisdictional deforestation-free sourcing frameworks.

> **Business value:** Critical for consumer goods companies with forest-risk commodity supply chains (EUDR compliance), banks financing agribusiness (TNFD disclosure), and forest carbon investors. Provides quantitative EUDR compliance gap analysis and TNFD LEAP-aligned nature disclosure.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `COUNTRIES`, `EUDR_COMMODITIES`, `KpiCard`, `REDD_PROJECTS`, `TABS`, `YEARS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Overview', 'Deforestation Risk', 'EUDR Compliance', 'REDD+ Finance', 'Carbon Markets', 'Portfolio Exposure', 'Mitigation'];` |
| `regions` | `['All', ...new Set(COUNTRIES.map(c => c.region))];` |
| `eudrData` | `useMemo(() => EUDR_COMMODITIES.map(c => ({ name: c.name.split(' ')[0], risk: c.riskPct, trace: c.traceability })), []);` |
| `carbonTrend` | `useMemo(() => YEARS.map((yr, i) => ({` |
| `sortedRedd` | `useMemo(() => [...REDD_PROJECTS].sort((a, b) => b[reddSort] - a[reddSort]), [reddSort]);` |
| `totalExposure` | `filteredCountries.reduce((a, c) => a + +c.exposureMn, 0);` |
| `highRiskExposure` | `filteredCountries.filter(c => ['High', 'Critical'].includes(c.eudrRisk)).reduce((a, c) => a + +c.exposureMn, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `EUDR_COMMODITIES`, `TABS`, `YEARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Annual Deforestation Rate | — | FAO Global Forest Resources Assessment 2022 | Global net forest loss 4.7 million hectares per year — agriculture drives 73% of tropical deforestation |
| EUDR Revenue at Risk | — | European Commission EUDR Impact Assessment | EU Deforestation Regulation covers €150Bn of commodity imports; non-compliant supply chains banned from 2025 |
| Tropical Forest Carbon Stock | — | IPCC AR6 WGII Chapter 2 | Tropical forests store 250 GtC — equivalent to 25 years of global CO2 emissions |
- **Supplier GPS coordinates + commodity sourcing data** → Deforestation risk overlay → **Supplier-level deforestation risk score by commodity**
- **GFW tree cover loss by jurisdiction** → EUDR compliance mapping → **Revenue at risk from non-compliant supply chain origins**
- **Forest carbon density maps + carbon price curves** → Carbon sink valuation → **Financial value of intact forest by geography**

## 5 · Intermediate Transformation Logic
**Methodology:** Deforestation Financial Exposure
**Headline formula:** `DeforestExposure = Σ [Revenue_commodity × DeforestationRate_country × CarbonLiability + RegulatoryRisk × RevenueAtRisk]; CarbonSinkValue = AreaForest × CarbonDensity × CarbonPrice`
**Standards:** ['TNFD Recommendations v1.0 2023', 'Global Forest Watch Deforestation Data', 'EU Deforestation Regulation (EUDR) 2023', 'Forest 500 Corporate Assessment']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).