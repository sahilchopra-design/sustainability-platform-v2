# Supplier ESG Scorecard
**Module ID:** `supplier-esg-scorecard` · **Route:** `/supplier-esg-scorecard` · **Tier:** B (frontend-computed) · **EP code:** EP-DN3 · **Sprint:** DN

## 1 · Overview
Provides systematic ESG scoring of suppliers across environmental, social, and governance dimensions. Integrates climate emissions, labour standards, anti-corruption, and biodiversity criteria with CDP Supply Chain, EcoVadis, and CS3D due diligence requirements.

> **Business value:** Directly required for CS3D supply chain due diligence, EcoVadis benchmark reporting, and CDP supply chain programme participation. Enables procurement teams to prioritise supplier engagement by ESG risk and spending materiality.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `Bar`, `ENGAGEMENT_STAGES`, `KpiCard`, `RED_FLAGS`, `REGIONS`, `SECTORS`, `SUPPLIERS`, `ScorePill`, `TABS`, `TIERS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `pct` | `(score / max) * 100;` |
| `suppliersWithTotal` | `useMemo(() => SUPPLIERS.map(s => ({` |
| `avgESG` | `useMemo(() => suppliersWithTotal.reduce((a, s) => a + s.esgTotal, 0) / Math.max(1, suppliersWithTotal.length), [suppliersWithTotal]);` |
| `avgE` | `useMemo(() => SUPPLIERS.reduce((a, s) => a + s.eScore, 0) / Math.max(1, SUPPLIERS.length), []);` |
| `avgS` | `useMemo(() => SUPPLIERS.reduce((a, s) => a + s.sScore, 0) / Math.max(1, SUPPLIERS.length), []);` |
| `avgG` | `useMemo(() => SUPPLIERS.reduce((a, s) => a + s.gScore, 0) / Math.max(1, SUPPLIERS.length), []);` |
| `redFlagTotal` | `useMemo(() => suppliersWithTotal.reduce((a, s) => a + s.redFlagCount, 0), [suppliersWithTotal]);` |
| `sectorBenchmarks` | `useMemo(() => SECTORS.map(sec => {` |
| `flagBreakdown` | `useMemo(() => RED_FLAGS.map(flag => {` |
| `spend` | `suppliersWithTotal.filter(s => s.redFlags.includes(flag)).reduce((a, s) => a + s.spendMn, 0);` |
| `engagementSummary` | `useMemo(() => ENGAGEMENT_STAGES.map(stage => {` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ENGAGEMENT_STAGES`, `RED_FLAGS`, `REGIONS`, `SECTORS`, `TABS`, `TIERS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Supplier ESG Assessment Coverage | — | EcoVadis Benchmark 2023 | Only 30% of corporate procurement spend has supplier ESG assessment — CS3D will require 100% |
| CDP Supply Chain Response Rate | — | CDP Supply Chain 2023 | CDP supply chain programme achieves 50% supplier response rate — data gap for non-respondents |
| ESG Risk Premium in Supply | — | McKinsey ESG Procurement 2023 | High ESG suppliers show 12% lower procurement cost volatility from reduced disruption risk |
- **EcoVadis/CDP supplier ratings data** → ESG score baseline → **Supplier scores by ESG dimension and quartile vs peers**
- **Supplier spend data + category mapping** → Risk prioritisation → **Spend-weighted ESG risk by supplier and category**
- **CS3D due diligence requirements** → Compliance mapping → **Required supplier actions and documentation for CS3D**

## 5 · Intermediate Transformation Logic
**Methodology:** Supplier ESG Score
**Headline formula:** `SupplierESG = w_E × EnvironmentalScore + w_S × SocialScore + w_G × GovernanceScore; EnvironmentalScore = ClimateScore × 0.5 + WaterScore × 0.25 + BiodiversityScore × 0.25`
**Standards:** ['EcoVadis Sustainability Rating Methodology', 'CDP Supply Chain Scoring Methodology 2023', 'GRI Standards Supply Chain Reporting', 'CS3D Supplier Due Diligence Requirements']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).