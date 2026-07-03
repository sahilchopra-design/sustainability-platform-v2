# Resource Efficiency Analytics
**Module ID:** `resource-efficiency-analytics` · **Route:** `/resource-efficiency-analytics` · **Tier:** B (frontend-computed) · **EP code:** EP-DL4 · **Sprint:** DL

## 1 · Overview
Analyses corporate resource efficiency performance across energy, water, materials, and waste. Models resource productivity trends, efficiency investment ROI, and climate-resource nexus risks. Integrates EU Resource Efficiency Scoreboard, WBCSD metrics, and Science Based Targets for Nature.

> **Business value:** Directly applicable to corporate sustainability officers, industrial companies managing resource costs, and ESG analysts assessing operational efficiency. Provides SBTN nature target guidance and EU Resource Efficiency Scoreboard benchmarking for investor engagement and disclosure.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `COMPANIES`, `COUNTRIES`, `EFFICIENCY_TIERS`, `KpiCard`, `SECTORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `EFFICIENCY_TIERS` | `['Laggard','Standard','Efficient','Best-in-Class'];` |
| `sector` | `SECTORS[Math.floor(sr(i * 7) * SECTORS.length)];` |
| `country` | `COUNTRIES[Math.floor(sr(i * 11) * COUNTRIES.length)];` |
| `resourceEfficiencyScore` | `Math.round(20 + sr(i * 5) * 76);` |
| `avgScore` | `(filtered.reduce((s, c) => s + c.resourceEfficiencyScore, 0) / n).toFixed(1);` |
| `totalSavings` | `filtered.reduce((s, c) => s + c.resourceCostSavings, 0);` |
| `avgEnergyProd` | `(filtered.reduce((s, c) => s + c.energyProductivity, 0) / n).toFixed(1);` |
| `pctIso` | `((filtered.filter(c => c.iso50001).length / n) * 100).toFixed(0);` |
| `totalCapex` | `filtered.reduce((s, c) => s + c.efficiencyCapex, 0);` |
| `sectorEffData` | `SECTORS.map(sec => {` |
| `countryEnergyData` | `COUNTRIES.map(cn => {` |
| `sectorWaterData` | `SECTORS.map(sec => {` |
| `scatterData` | `filtered.map(c => ({ x: c.efficiencyCapex, y: c.resourceCostSavings, name: c.name }));` |
| `roiData` | `filtered.map(c => ({` |
| `avgWI` | `cs.length ? (cs.reduce((s, c) => s + c.wasteIntensity, 0) / cs.length).toFixed(1) : '0';` |
| `clr` | `tier === 'Best-in-Class' ? T.green : tier === 'Efficient' ? T.blue : tier === 'Standard' ? T.amber : T.red;` |
| `avgProd` | `cs.length ? (cs.reduce((s, c) => s + c.energyProductivity, 0) / cs.length).toFixed(1) : '0';` |
| `pct` | `n > 0 ? (cnt / n) * 100 : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `EFFICIENCY_TIERS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global Resource Use | — | IRP Global Resources Outlook 2019 | Global material extraction 92 billion tonnes/yr — tripled since 1970, projected to double again by 2060 |
| Resource Productivity | — | EU Resource Efficiency Scoreboard 2023 | EU resource productivity at €2.4 GDP per kg domestic material consumption — improving 30% since 2000 |
| Industrial Symbiosis Savings | — | UNIDO Industrial Symbiosis 2023 | Industrial symbiosis (waste exchange between industries) reduces energy 20–40% and water 30–50% |
- **Energy and utility consumption data by site/process** → Resource intensity calculation → **Resource intensity by product, site, and category vs benchmark**
- **Efficiency project inventory with capex and savings** → ROI portfolio analysis → **Ranked efficiency investments by payback and IRR**
- **Water and material consumption + local stress data** → SBTN nature target assessment → **Resource use vs SBTN-defined local water/land boundaries**

## 5 · Intermediate Transformation Logic
**Methodology:** Resource Efficiency ROI
**Headline formula:** `EfficiencyROI = (ResourceSavings × ResourcePrice + CarbonSavings × CarbonPrice) / EfficiencyInvestment; ResourceIntensity = ResourceConsumption / RevenueOrProduction`
**Standards:** ['EU Resource Efficiency Scoreboard 2023', 'WBCSD Resource Productivity Framework', 'Ellen MacArthur Foundation Material Economics 2018', 'Science Based Targets for Nature (SBTN) 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).