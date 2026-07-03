# Climate Capital Adequacy
**Module ID:** `climate-capital-adequacy` · **Route:** `/climate-capital-adequacy` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Climate-adjusted capital adequacy engine for banks and insurers. Computes climate-risk-adjusted Risk-Weighted Assets (RWA), supplementary Pillar 2 climate capital buffers, and transition/physical scenario stress overlays per ECB and BCBS climate risk supervisory guidance.

> **Business value:** Climate RWA uplift = standard RWA × (1 + α×physical + β×transition). ECB typically calibrates combined multiplier at 5–25% for carbon-intensive sector exposures under 2°C disorderly transition.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSET_CLASSES_RWA`, `CAPITAL_COMPONENTS`, `CET1_MIN`, `FRAMEWORKS_BY_JURIS`, `INSTITUTIONS`, `INSTITUTION_TYPES`, `INST_NAMES`, `JURISDICTIONS`, `JURIS_RULES`, `KpiCard`, `SCENARIOS`, `SENSITIVITY_DRIVERS`, `STRESS_QUARTERLY`, `SectionHeader`, `SliderRow`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `FRAMEWORKS_BY_JURIS` | `{ EU:'CRR2/Basel IV', UK:'PRA SS3/19', US:'FRB Pilot', Canada:'OSFI B-15', Australia:'APRA CPG 229', Japan:'FSA Climate', Singapore:'MAS Guidelines', ` |
| `_DEFAULT_INSTITUTIONS` | `INST_NAMES.map((name, i) => {` |
| `juris` | `JURISDICTIONS[Math.floor(sr(i * 7) * JURISDICTIONS.length)];` |
| `type` | `INSTITUTION_TYPES[Math.floor(sr(i * 11) * INSTITUTION_TYPES.length)];` |
| `totalRWA` | `50 + sr(i * 13) * 950;` |
| `tier1Capital` | `0.08 + sr(i * 17) * 0.10;` |
| `at1Ratio` | `0.01 + sr(i * 83) * 0.025;` |
| `tier2Ratio` | `0.02 + sr(i * 89) * 0.04;` |
| `cet1Capital` | `tier1Capital - at1Ratio - sr(i * 19) * 0.005;` |
| `cet1Excess` | `Math.max(0, cet1Capital * 100 - rule.minCET1);` |
| `tlacRatio` | `0.18 + sr(i * 97) * 0.08;` |
| `mrelBuffer` | `0.02 + sr(i * 101) * 0.06;` |
| `bailInBuffer` | `tlacRatio - tier1Capital - tier2Ratio;` |
| `climatRWAPct` | `0.05 + sr(i * 23) * 0.30;` |
| `physicalRiskScore` | `10 + sr(i * 29) * 80;` |
| `transitionRiskScore` | `10 + sr(i * 31) * 80;` |
| `greenLoanPct` | `sr(i * 41) * 0.45;` |
| `fossilFuelExposure` | `sr(i * 43) * 0.35;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSET_CLASSES_RWA`, `CAPITAL_COMPONENTS`, `INSTITUTION_TYPES`, `INST_NAMES`, `JURISDICTIONS`, `SCENARIOS`, `SENSITIVITY_DRIVERS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Climate RWA Uplift | `ClimateMultiplier by sector` | ECB supervisory data | Percentage increase in RWA after climate risk adjustment |
| Pillar 2 Climate Buffer | `max(0, ClimateRWA–RWA)/RWA` | ECB guidance | Additional capital requirement for climate risk under Pillar 2 SREP |
| Carbon-Intensive Concentration | `High-CI sector loans / total loans` | ECB threshold | Lending concentration in carbon-intensive sectors triggering supervisory attention |
| Physical Risk Haircut | `ECB scenario-based haircut table` | ECB Climate Stress Test 2023 | Asset value reduction under severe physical scenario applied to RWA |
- **Loan book data** → Sector × geography → RWA breakdown → **Standard RWA by exposure**
- **ECB climate stress test factors** → Haircuts → climate multipliers → **Climate-adjusted RWA and Pillar 2 buffer**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate RWA = standard RWA × (1 + ClimateMultiplier)
**Headline formula:** `ClimateRWA_i = RWA_i × (1 + α×PhysicalRisk_i + β×TransitionRisk_i); CapitalBuffer = max(0, ClimateRWA–RWA)`
**Standards:** ['ECB Climate Risk Supervisory Review 2022', 'BCBS d532 Climate Risk Principles', 'EBA Climate Stress Test 2023', 'Basel III CRR2']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).