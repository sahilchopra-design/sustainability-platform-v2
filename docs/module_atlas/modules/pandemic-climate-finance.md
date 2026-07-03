# Pandemic-Climate Finance Analytics
**Module ID:** `pandemic-climate-finance` · **Route:** `/pandemic-climate-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DP4 · **Sprint:** DP

## 1 · Overview
Analyses the intersection of pandemic risk and climate change — zoonotic spillover risk amplification, pandemic preparedness investment, health system climate resilience, and One Health finance. Models pandemic financial risk exposure and the economic case for pandemic-climate integrated investment.

> **Business value:** Essential for catastrophe re/insurers pricing pandemic risk, sovereign wealth funds stress-testing pandemic GDP scenarios, and development banks programming One Health investments. Links climate finance to pandemic preparedness — recognised in G20 HLIP and UNEP prevention agenda.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `Bar`, `KpiCard`, `PATHOGENS`, `PATHOGEN_DATA`, `SCENARIOS`, `SCENARIO_TYPES`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `PATHOGENS` | `['SARS-CoV-3 variant', 'Nipah virus', 'Rift Valley Fever', 'Hantavirus', 'Marburg virus', 'West Nile virus', 'Dengue (super-strain)', 'Avian H5N1'];` |
| `pathIdx` | `Math.floor(sr(i * 5) * PATHOGENS.length);` |
| `stIdx` | `Math.floor(sr(i * 7) * SCENARIO_TYPES.length);` |
| `climateAmp` | `1 + sr(i * 11) * 4;` |
| `econLoss` | `0.5 + sr(i * 13) * 99.5;` |
| `probNextDecade` | `5 + sr(i * 17) * 45;` |
| `mortalityMn` | `0.1 + sr(i * 19) * 9.9;` |
| `healthSysResilience` | `20 + sr(i * 23) * 70;` |
| `zoonoticRisk` | `10 + sr(i * 29) * 90;` |
| `insuranceGap` | `30 + sr(i * 31) * 60;` |
| `preparednessIdx` | `20 + sr(i * 37) * 70;` |
| `PATHOGEN_DATA` | `PATHOGENS.map((p, i) => ({` |
| `avgClimAmp` | `filtered.length ? (filtered.reduce((a, s) => a + s.climateAmp, 0) / filtered.length).toFixed(2) : '0.00';` |
| `totalEconLoss` | `filtered.reduce((a, s) => a + s.econLoss, 0).toFixed(1);` |
| `avgZoonotic` | `filtered.length ? (filtered.reduce((a, s) => a + s.zoonoticRisk, 0) / filtered.length).toFixed(1) : '0.0';` |
| `avgResilience` | `filtered.length ? (filtered.reduce((a, s) => a + s.healthSysResilience, 0) / filtered.length).toFixed(1) : '0.0';` |
| `avgInsGap` | `filtered.length ? (filtered.reduce((a, s) => a + s.insuranceGap, 0) / filtered.length).toFixed(1) : '0.0';` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PATHOGENS`, `SCENARIO_TYPES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Climate Zoonotic Risk Uplift | — | IPCC AR6/EcoHealth Alliance 2022 | Climate change projected to 3–5× increase zoonotic spillover events by 2070 under moderate warming |
| COVID-19 GDP Loss | — | IMF WEO 2023 | COVID-19 cumulative GDP loss $28Tn globally — exceeds climate change annual damage for 15 years |
| One Health Investment Case | — | World Bank One Health 2022 | Annual One Health investment of $31Bn delivers $37 in avoided pandemic loss — 37:1 BCR |
- **Zoonotic spillover event database + land use change data** → Pandemic risk modelling → **Probability of pandemic by type under climate scenarios**
- **Portfolio sector exposure data** → Financial risk assessment → **Portfolio pandemic GDP shock exposure by sector**
- **Health system capacity + One Health investment data** → Investment case → **One Health NPV and pandemic risk reduction from investment**

## 5 · Intermediate Transformation Logic
**Methodology:** Pandemic Climate Risk
**Headline formula:** `ZoonoticRisk = ForestEncroachment × WildlifeContactRate × PathogenRichness × ClimateAmplification; PandemicFinancialRisk = P(pandemic) × GDPimpact × PortfolioExposure`
**Standards:** ['IPCC AR6 WGII Chapter 7', 'World Bank One Health Investment Case 2022', 'UNEP Preventing the Next Pandemic 2020', 'G20 HLIP Pandemic Prevention and Finance 2022']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).