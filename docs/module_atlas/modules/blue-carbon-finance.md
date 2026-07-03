# Blue Carbon Finance
**Module ID:** `blue-carbon-finance` · **Route:** `/blue-carbon-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DJ2 · **Sprint:** DJ

## 1 · Overview
Evaluates blue carbon ecosystem investment — mangroves, seagrasses, tidal marshes — for carbon sequestration, coastal protection co-benefits, and biodiversity credits. Models carbon credit revenue under Verra VM0033, coastal protection value avoided damage, and community benefit sharing.

> **Business value:** Applicable to conservation finance investors, coastal development banks, corporate nature strategy teams (TNFD), and governments with significant mangrove/seagrass assets. Blue carbon provides dual revenue from carbon credits and coastal protection co-benefits, making projects economically compelling.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `COBENEFITS`, `ECO_COLORS`, `ECO_TYPES`, `KpiCard`, `PROJECTS`, `PROJECT_NAMES`, `REGIONS`, `STANDARDS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `standard` | `STANDARDS[Math.floor(sr(i * 7) * 3)];` |
| `cobenefit` | `COBENEFITS[Math.floor(sr(i * 11) * 4)];` |
| `areaHa` | `Math.round(500 + sr(i * 3) * 49500);` |
| `seq` | `+(1 + sr(i * 13) * 9).toFixed(2);` |
| `totalAreaMha` | `(filtered.reduce((a, p) => a + p.areaHa, 0) / 1e6).toFixed(2);` |
| `totalCredits` | `filtered.reduce((a, p) => a + p.creditsIssued, 0).toFixed(1);` |
| `totalProjectValue` | `filtered.reduce((a, p) => a + p.projectValue, 0).toFixed(1);` |
| `seqByType` | `ECO_TYPES.map(t => {` |
| `priceByStandard` | `STANDARDS.map(s => {` |
| `cobenefitData` | `COBENEFITS.map(cb => ({` |
| `scatterData` | `filtered.map(p => ({` |
| `permanenceData` | `filtered.slice(0, 20).map(p => ({` |
| `pipelineData` | `filtered.slice(0, 15).map(p => ({` |
| `area` | `ps.reduce((a, p) => a + p.areaHa, 0);` |
| `avgSeq` | `ps.length ? (ps.reduce((a, p) => a + p.carbonSequestration, 0) / ps.length).toFixed(2) : '0';` |
| `total` | `ps.reduce((a, p) => a + p.creditsIssued, 0).toFixed(1);` |
| `revenue` | `ps.reduce((a, p) => a + p.creditsIssued * p.creditPrice, 0).toFixed(0);` |
| `avgAdd` | `ps.length ? (ps.reduce((a, p) => a + p.additionality, 0) / ps.length).toFixed(1) : '—';` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COBENEFITS`, `ECO_TYPES`, `PROJECT_NAMES`, `REGIONS`, `STANDARDS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Mangrove Sequestration Rate | — | Blue Carbon Initiative 2023 | Mangroves sequester 6–8 tCO2e/ha/yr — 3–5× more per ha than temperate forests |
| Mangrove Loss Rate | — | Global Mangrove Alliance 2023 | Annual mangrove loss rate — primary threat is aquaculture, coastal development, and sea level rise |
| Coastal Protection Co-benefit | — | Nature Conservancy Blue Carbon 2022 | Annual coastal protection value of intact mangroves — often 10× carbon revenue, justifying conservation financ |
- **Mangrove/seagrass extent and condition mapping (NASA/JAXA)** → Carbon stock baseline → **Above/below-ground biomass and soil carbon per ha**
- **Coastal hazard data + asset exposure** → Protection co-benefit valuation → **Annual storm damage avoided by ecosystem hectare**
- **VCM blue carbon credit prices** → Revenue modelling → **Project NPV under various credit price scenarios**

## 5 · Intermediate Transformation Logic
**Methodology:** Blue Carbon Credit Economics
**Headline formula:** `BlueCarbon_credits = (Baseline_seq - Project_seq) / tCO2e_factor × ProjectArea; CoastalProtectionValue = Σ [P(storm) × DamageAvoided × PopProtected] / DiscountRate`
**Standards:** ['Verra VM0033 Methodology for Tidal Wetland and Seagrass Restoration', 'IPCC Wetlands Supplement 2014', 'Blue Carbon Initiative (IUCN/CI/IOC-UNESCO)', 'GS4GG Blue Carbon Protocol']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).