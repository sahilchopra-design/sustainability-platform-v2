# Nature Scenarios
**Module ID:** `nature-scenarios` · **Route:** `/nature-scenarios` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Scenario analysis platform for assessing portfolio impacts under nature-positive transition pathways drawn from IPBES transformative change scenarios, SBTN nature-positive trajectories, and TNFD illustrative nature scenarios. Models how biodiversity regulation, ecosystem restoration mandates, deforestation bans, and natural capital pricing affect corporate revenues, costs, and asset values across sectors and geographies. Supports TNFD Prepare pillar forward-looking disclosure.

> **Business value:** Enables investors and corporate strategists to quantify the financial implications of nature-positive transition scenarios, identify exposure concentrations, and prepare credible forward-looking TNFD nature scenario disclosures aligned with IPBES and SBTN pathways.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BIOMES`, `GBF_TARGETS`, `KpiCard`, `NATURE_CREDITS`, `PATHWAY_TIME`, `SCENARIOS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `gbfPct` | `(p, tgt) => Math.min(100, (p / tgt) * 100).toFixed(0);` |
| `pct` | `(tgt.progress / tgt.target) * 100;` |
| `supplyGap` | `nc.demand2024 - nc.supply2024;` |
| `physicalRisk` | `Math.min(100, Math.max(0, sc.biodiversityLoss2050 * 1.8 + 15));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BIOMES`, `GBF_TARGETS`, `NATURE_CREDITS`, `SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Nature Scenario Revenue Impact (%) | — | NSIS computation per scenario | Estimated revenue impact range under the nature-positive transition scenario on a 5–10 year horizon |
| Regulatory Cost Uplift (% EBITDA) | — | Policy shock model | Estimated EBITDA impact from nature-related regulatory costs (deforestation bans, ecosystem levies) in the sce |
| Nature Opportunity Score | — | TNFD illustrative scenario positive outcomes | Composite score capturing revenue and competitive advantage opportunities from nature-positive market shifts |
| Scenario Time Horizon | — | IPBES / SBTN target years | Target year for nature policy implementation used in scenario modelling |
- **TNFD illustrative scenario assumptions** → Extract policy shock magnitudes and timelines by sector and geography; calibrate to EC NRL and SBTN targets → **Policy shock parameter matrix by scenario, sector, and year**
- **ENCORE dependency and impact data** → Map sector nature dependencies to policy shock exposure; weight by revenue share → **Sector sensitivity matrix for NSIS computation**
- **Portfolio company financial data** → Apply revenue exposure fractions and policy shock magnitudes; compute net EBITDA and revenue impact range → **Company and portfolio-level nature scenario financial impact output**

## 5 · Intermediate Transformation Logic
**Methodology:** Nature Scenario Impact Score
**Headline formula:** `NSISᵢₛ = Σⱼ (Policy Shockⱼₛ × Sector Sensitivityᵢⱼ × Revenue Exposureᵢⱼ)`
**Standards:** ['TNFD Illustrative Nature Scenarios v1.0 2023', 'IPBES Global Scenarios for Biodiversity 2019', 'SBTN Science-Based Targets for Nature 2023', 'ENCORE Ecosystem Service Dependency Tool', 'EC Biodiversity Strategy 2030 Impact Assessment']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).