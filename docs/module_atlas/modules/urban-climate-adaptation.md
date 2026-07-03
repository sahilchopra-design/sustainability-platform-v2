# Urban Climate Adaptation Finance
**Module ID:** `urban-climate-adaptation` · **Route:** `/urban-climate-adaptation` · **Tier:** B (frontend-computed) · **EP code:** EP-DE5 · **Sprint:** DE

## 1 · Overview
Analyses municipal climate adaptation investment needs, financing gaps, and blended finance structures. Models urban heat island, flooding, and drought risks with population exposure and quantifies city-level adaptation finance requirements under IPCC SSP scenarios.

> **Business value:** Directly supports cities and municipal finance officers, urban development banks, and climate bond issuers. Provides the quantitative foundation for C40 climate action plans, EU Mission City applications, and municipal green bond frameworks verified against Climate Bonds Initiative City Climate Framework.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `BOND_TYPES`, `CITIES`, `Card`, `INCOME_GROUPS`, `KpiCard`, `REGIONS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `INCOME_GROUPS` | `['High Income','Upper-Middle','Lower-Middle','Low Income'];` |
| `REGIONS` | `['Europe','North America','Asia-Pacific','South Asia','Africa','Latin America','Middle East'];` |
| `income` | `INCOME_GROUPS[Math.floor(sr(i*7) * INCOME_GROUPS.length)];` |
| `region` | `REGIONS[Math.floor(sr(i*11) * REGIONS.length)];` |
| `pop` | `parseFloat((0.5 + sr(i*3) * 19.5).toFixed(1));    // M people` |
| `gdpPcap` | `Math.round(1000 + sr(i*5) * 79000);               // USD` |
| `heatIsland` | `parseFloat((sr(i*13)*100).toFixed(1));` |
| `floodRisk` | `parseFloat((sr(i*17)*100).toFixed(1));` |
| `waterStress` | `parseFloat((sr(i*19)*100).toFixed(1));` |
| `airQual` | `parseFloat((sr(i*23)*100).toFixed(1));  // higher = worse` |
| `composite` | `parseFloat((heatIsland*0.30+floodRisk*0.30+waterStress*0.25+airQual*0.15).toFixed(1));` |
| `adaptNeedPc` | `parseFloat((50 + composite*2 + sr(i*29)*200).toFixed(0));` |
| `adaptTotal` | `parseFloat((adaptNeedPc * pop * 10).toFixed(0));       // $M total` |
| `bondCap` | `parseFloat((gdpPcap * pop * 0.002 + sr(i*31)*50).toFixed(0));` |
| `bondType` | `BOND_TYPES[Math.floor(sr(i*37) * BOND_TYPES.length)];` |
| `resScore` | `parseFloat((100 - composite + gdpPcap/2000).toFixed(1));` |
| `rating` | `resScore >= 70 ? 'AAA/AA' : resScore >= 50 ? 'A/BBB' : resScore >= 35 ? 'BB/B' : 'CCC/D';` |
| `damageAvoided` | `parseFloat((adaptTotal * (0.3 + sr(i*41)*0.4)).toFixed(0));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BOND_TYPES`, `CITIES`, `INCOME_GROUPS`, `REGIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Urban Adaptation Finance Need | — | IPCC AR6 WGII Chapter 6 | Annual adaptation finance needed for urban areas in developing countries alone to 2030 |
| Urban Heat Island Intensity | — | C40 Cities Climate Risk Assessment | Urban areas are 1.5–4°C warmer than surrounding rural areas — amplifies heat stress mortality |
| Municipal Green Bond Market | — | Climate Bonds Initiative 2024 | Total municipal/city green bonds outstanding globally — growing 22% yr-on-yr |
- **City hazard maps (flood, heat, drought) + population grid** → Urban EAL calculation → **Sector-level expected losses by hazard and scenario**
- **Municipal budget and green bond issuance history** → Finance gap analysis → **Adaptation finance gap by sector and decade**
- **MDB co-financing terms and blended structures** → Finance structure modelling → **Optimal blend of public/private/concessional finance**

## 5 · Intermediate Transformation Logic
**Methodology:** Urban Adaptation Finance Gap
**Headline formula:** `FinanceGap = AdaptationNeed - (PublicBudget + PrivateInvestment + MDBFinance); UrbanEAL = Σ [PopExposed_i × DamagePerCapita_i × P(hazard_i)]`
**Standards:** ['IPCC AR6 WGII Chapter 6 — Cities', 'C40 Cities Finance Facility', 'UNEP Adaptation Finance Gap Report', 'EU Urban Adaptation Mission']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `BuiltEnvironmentAdvancedAnalytics`