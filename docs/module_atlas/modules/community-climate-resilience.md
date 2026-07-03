# Community Climate Resilience Finance
**Module ID:** `community-climate-resilience` · **Route:** `/community-climate-resilience` · **Tier:** B (frontend-computed) · **EP code:** EP-DI6 · **Sprint:** DI

## 1 · Overview
Analyses investment in community-level climate resilience across health systems, social infrastructure, local government adaptation, and community-based disaster risk reduction. Models social resilience dividend, community bond structures, and SDG impact returns for resilience investments.

> **Business value:** Applicable to community development finance institutions, municipal bond funds, impact investors in social infrastructure, and development banks programming adaptation finance. Provides Sendai Framework impact metrics and ICMA Social Bond Principles alignment for community resilience bonds.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `BLUE`, `COMMUNITIES`, `COMMUNITY_NAMES`, `INCOME_LEVELS`, `INDIGO`, `PURPLE`, `REGIONS`, `RESILIENCE_COLORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['Sub-Saharan Africa', 'South Asia', 'Southeast Asia', 'Pacific Islands', 'Latin America', 'MENA', 'Caribbean', 'Central Asia'];` |
| `INCOME_LEVELS` | `['Low', 'Lower-Middle', 'Upper-Middle'];` |
| `resilienceScore` | `Math.round(10 + sr(i * 7) * 85);` |
| `tempMult` | `1 + (tempScenario - 1.5) * 0.08;` |
| `avgResilience` | `filtered.length ? filtered.reduce((s, c) => s + c.resilienceScore, 0) / filtered.length : 0;` |
| `totalAdaptFunding` | `filtered.reduce((s, c) => s + c.adaptationFunding * financeMultiplier, 0);` |
| `indigenousPct` | `filtered.length ? (filtered.filter(c => c.indigenousCommunity).length / filtered.length) * 100 : 0;` |
| `avgPhysicalRisk` | `filtered.length ? filtered.reduce((s, c) => s + c.physicalRisk * tempMult, 0) / filtered.length : 0;` |
| `resilienceByRegion` | `REGIONS.map(r => {` |
| `scatterData` | `filtered.map(c => ({` |
| `physRiskByIncome` | `INCOME_LEVELS.map(il => {` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMMUNITY_NAMES`, `INCOME_LEVELS`, `REGIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| DRR Investment BCR | — | UNDRR Economic Value of DRR 2023 | Every $1 invested in disaster risk reduction avoids $4–9 in economic losses from disasters |
| Community Bond Market | — | ICMA Social Bond Database 2024 | Community resilience bonds represent fastest-growing sub-category of social bond market |
| Sendai Target E Progress | — | UNDRR Sendai Monitor 2023 | Progress toward Sendai Target E to reduce disaster mortality — on track in OECD, lagging in LMICs |
- **Community asset register + hazard exposure data** → Avoided loss calculation → **Expected annual avoided losses from resilience investment**
- **Social sector data (health outcomes, school attendance)** → Co-benefit quantification → **Social returns from resilience infrastructure**
- **Local government fiscal capacity + bond market access** → Community bond feasibility → **Bond structure and credit enhancement requirements**

## 5 · Intermediate Transformation Logic
**Methodology:** Social Resilience Dividend
**Headline formula:** `ResilienceDividend = Σ [(AvoidedLoss_t + WellbeingGain_t + EconomicMultiplier_t) / (1+r)^t] - ResilienceInvestment; BCR_social = TotalBenefit / TotalCost`
**Standards:** ['Sendai Framework for DRR 2015–2030', 'UNDRR Economic Value of DRR', 'World Bank Community Resilience Program', 'IPCC AR6 WGII Chapter 8 — Cities and Human Settlements']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).