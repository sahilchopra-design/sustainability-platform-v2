# Climate Regulatory & Policy Tracker
**Module ID:** `climate-reg-policy-tracker` · **Route:** `/climate-reg-policy-tracker` · **Tier:** B (frontend-computed) · **EP code:** EP-DK6 · **Sprint:** DK

## 1 · Overview
Tracks global climate policy and regulatory developments — carbon pricing, disclosure mandates, taxonomies, transition plans, and central bank climate requirements. Quantifies regulatory impact on portfolio companies and models compliance cost curves.

> **Business value:** Critical for corporate government affairs, treasury, and CFO functions managing regulatory compliance costs. Enables portfolio managers to model regulatory-driven earnings impact, identify regulatory arbitrage opportunities, and prepare board-level regulatory scenario analysis.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `JURISDICTIONS`, `KpiCard`, `POLICIES`, `POLICY_TYPES`, `REGIONS`, `SECTORS_ALL`, `STATUSES`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `type` | `POLICY_TYPES[Math.floor(sr(i * 7) * POLICY_TYPES.length)];` |
| `region` | `REGIONS[Math.floor(sr(i * 11) * REGIONS.length)];` |
| `jurisdiction` | `JURISDICTIONS[Math.floor(sr(i * 13) * JURISDICTIONS.length)];` |
| `status` | `STATUSES[Math.floor(sr(i * 17) * STATUSES.length)];` |
| `effectiveYear` | `2020 + Math.floor(sr(i * 19) * 8);` |
| `carbonPriceEquivalent` | `type === 'Carbon Tax' \|\| type === 'ETS' ? parseFloat((5 + sr(i * 23) * 195).toFixed(0)) : parseFloat((sr(i * 23) * 50).toFixed(0));` |
| `affectedSectorCount` | `1 + Math.floor(sr(i * 29) * 4);` |
| `complianceCost` | `parseFloat((0.1 + sr(i * 31) * 49.9).toFixed(1));` |
| `policyAmbitiousness` | `parseFloat((2 + sr(i * 37) * 8).toFixed(1));` |
| `alignedWithParis` | `policyAmbitiousness >= 6 ? sr(i * 41) > 0.25 : sr(i * 41) > 0.65;` |
| `enforcementRisk` | `parseFloat((1 + sr(i * 43) * 9).toFixed(1));` |
| `businessImpactScore` | `parseFloat((1 + sr(i * 47) * 9).toFixed(1));` |
| `avgPrice` | `(filtered.reduce((a, p) => a + p.carbonPriceEquivalent, 0) / n).toFixed(0);` |
| `pctParis` | `((filtered.filter(p => p.alignedWithParis).length / n) * 100).toFixed(0);` |
| `totalCost` | `filtered.reduce((a, p) => a + p.complianceCost, 0).toFixed(1);` |
| `byType` | `POLICY_TYPES.map(t => ({` |
| `byJurisdiction` | `JURISDICTIONS.map(j => {` |
| `scatterData` | `filtered.map(p => ({ x: p.policyAmbitiousness, y: p.complianceCost, name: p.name, paris: p.alignedWithParis }));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `JURISDICTIONS`, `POLICY_TYPES`, `REGIONS`, `SECTORS_ALL`, `STATUSES`, `TABS`, `YEARS_RANGE`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global Carbon Pricing Coverage | — | World Bank Carbon Pricing Dashboard 2024 | 73 carbon pricing instruments globally covering 23% of global GHG emissions in 2024 |
| Mandatory Disclosure Jurisdictions | — | KPMG Survey 2022 | 45+ jurisdictions have mandatory corporate climate/sustainability disclosure requirements — growing rapidly |
| CBAM Coverage | — | European Commission CBAM Assessment | EU Carbon Border Adjustment Mechanism covers iron, steel, cement, aluminium, fertiliser, electricity — €35Bn/y |
- **World Bank Carbon Pricing Dashboard data** → Carbon exposure calculation → **Company Scope 1 carbon tax exposure by jurisdiction**
- **ICAP ETS registry data + auction prices** → ETS cost modelling → **ETS compliance cost under various carbon price scenarios**
- **EU Taxonomy alignment data + CapEx plans** → Taxonomy compliance cost → **CapEx required for EU Taxonomy substantial contribution threshold**

## 5 · Intermediate Transformation Logic
**Methodology:** Regulatory Compliance Cost Model
**Headline formula:** `ComplianceCost = Σ [CarbonTaxExposure_i + DisclosureCompliance_i + TaxonomyCapex_i + TransitionPlanCost_i]; CarbonTaxExposure = Scope1_tCO2e × CarbonPrice`
**Standards:** ['IPCC AR6 WGIII Chapter 13 — National and Sub-national Policies', 'World Bank Carbon Pricing Dashboard 2024', 'ICAP Emissions Trading Worldwide 2024', 'KPMG Survey of Sustainability Reporting 2022']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).