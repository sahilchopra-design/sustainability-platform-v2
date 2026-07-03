# Energy Sector EU Taxonomy Analytics
**Module ID:** `energy-sector-taxonomy` · **Route:** `/energy-sector-taxonomy` · **Tier:** B (frontend-computed) · **EP code:** EP-DW4 · **Sprint:** DW

## 1 · Overview
EU Taxonomy eligibility and alignment analytics for energy sector exposures covering power generation by technology, substantial contribution thresholds, DNSH climate hazard screening, and transitional gas and nuclear classifications.

> **Business value:** Energy sector EU Taxonomy alignment hinges on the <100 gCO2e/kWh lifecycle SC threshold; gas power meets transitional criteria below 270 gCO2e/kWh direct, while nuclear qualifies under the Complementary Delegated Act subject to JRC TSO safety criteria.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AVIATION_SAF`, `CCUS_PROJECTS`, `CEMENT_PLANTS`, `CRF`, `DISPATCH_DEMAND`, `DISPATCH_HOURS`, `DISPATCH_STACK`, `EnergySectorTaxonomyPage`, `GRID_CAPEX`, `GRID_CAPEX_FLAT`, `GRID_REGIONS`, `HYDROGEN_PROJECTS`, `IRENA_REGIONS`, `IRENA_TARGETS`, `LEARNING_RATES`, `MACC_MEASURES`, `NGFS_SCENARIOS`, `NUCLEAR_FLEET`, `NZE_MILESTONES`, `OG_NAMES`, `OG_PRODUCERS`, `POWER_REGIONS`, `POWER_STACK`, `POWER_STACK_BY_REGION`, `POWER_STACK_YEARS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `IRENA_TARGETS` | `IRENA_REGIONS.map((region, i) => ({` |
| `POWER_STACK_YEARS` | `Array.from({ length: 30 }, (_, i) => 2020 + i);` |
| `POWER_STACK` | `POWER_STACK_YEARS.map((year, i) => {` |
| `coal` | `Math.max(0, 36 - progress * 36);` |
| `gas` | `Math.max(0, 23 - progress * 18);` |
| `nuclear` | `10 + progress * 4;` |
| `hydro` | `16 - progress * 2;` |
| `solar` | `3 + progress * 32;` |
| `wind` | `6 + progress * 26;` |
| `bio` | `2 + progress * 5;` |
| `other` | `4 + progress * 5;` |
| `POWER_STACK_BY_REGION` | `POWER_REGIONS.map((region, ri) => ({` |
| `regionFactor` | `0.8 + sr(ri * 7 + 3) * 0.4;` |
| `coal` | `Math.max(0, (36 - progress * 36) * regionFactor);` |
| `gas` | `Math.max(0, (23 - progress * 18) * regionFactor);` |
| `solar` | `(3 + progress * 32) * (0.7 + sr(ri * 11 + 5) * 0.6);` |
| `wind` | `(6 + progress * 26) * (0.7 + sr(ri * 13 + 7) * 0.6);` |
| `nuclear` | `(10 + progress * 4) * (0.5 + sr(ri * 17 + 9) * 1.0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `AVIATION_SAF`, `CCUS_PROJECTS`, `DISPATCH_STACK`, `GRID_REGIONS`, `HYDROGEN_PROJECTS`, `IRENA_REGIONS`, `LEARNING_RATES`, `MACC_MEASURES`, `NGFS_SCENARIOS`, `NZE_MILESTONES`, `OG_NAMES`, `POWER_REGIONS`, `PROJECT_PIPELINE`, `STEEL_TECHS`, `STORAGE_REGIONS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Substantial Contribution Threshold | `SC = Lifecycle GHG Intensity < 100 gCO2/kWh` | Delegated Regulation (EU) 2021/2139 | Power generation SC criterion for climate change mitigation; applies to solar, wind, hydro, nuclear and gas wi |
| Transitional Gas Threshold | `Gas SC = Direct Emissions < 270 gCO2/kWh AND lifecycle < 550 kg/kW` | Delegated Regulation Annex I 4.29 | Time-limited transitional activity for gas power plants meeting strict emissions and fuel-switching criteria. |
| Nuclear Classification | `Nuclear alignment requires compliance with Joint Research Centre TSO technical screening` | Complementary Delegated Act (EU) 2022/1214 | Nuclear classified as transitional under separate Complementary Delegated Act; eligible until 2045 for existin |
- **EU Taxonomy Compass activity database + lifecycle LCA data** → SC threshold screening → DNSH hazard assessment → alignment scoring → **Energy sector taxonomy analytics dashboard**

## 5 · Intermediate Transformation Logic
**Methodology:** Taxonomy Alignment Score
**Headline formula:** `TAS = Σ(Exposure_i × Aligned_i) / Σ(Exposure_i)`
**Standards:** ['EU Taxonomy Regulation (EU) 2020/852', 'TEG — Taxonomy Technical Report June 2019']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).