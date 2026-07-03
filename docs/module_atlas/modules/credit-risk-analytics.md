# Credit Risk Analytics
**Module ID:** `credit-risk-analytics` · **Route:** `/credit-risk-analytics` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Computes climate-adjusted probability of default (PD), loss given default (LGD), and exposure at default (EAD) for corporate and sovereign credit portfolios under NGFS transition and physical risk scenarios. Integrates climate risk into Basel III-compliant credit risk capital calculations.

> **Business value:** Enables credit risk managers and regulators to quantify climate-driven increases in credit losses and capital requirements, supporting ICAAP climate risk stress testing, Pillar 2 add-on calculations, and TCFD credit risk disclosures.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CAPITAL_DATA`, `MATRIX_GRADES`, `MIGRATION_MATRIX`, `OBLIGORS`, `PD_TERM`, `RATINGS`, `RATING_PD`, `SECTORS`, `STAGE_COLOR`, `TERM_COLORS`, `TERM_DATA`, `TERM_YEARS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `RATINGS` | `['AAA','AA+','AA','AA-','A+','A','A-','BBB+','BBB','BBB-','BB+','BB','BB-','B+','B','B-','CCC','CC','C','D'];` |
| `RATING_PD` | `{ AAA:0.01,  'AA+':0.02, AA:0.03,  'AA-':0.04, 'A+':0.07,  A:0.09, 'A-':0.12,` |
| `ratingIdx` | `Math.floor(sr(i * 3) * RATINGS.length);` |
| `ead` | `10 + sr(i * 3 + 2) * 990;         // $M` |
| `lgd` | `0.25 + sr(i * 3 + 3) * 0.50;` |
| `ecl` | `pd * lgd * ead;` |
| `rwaDensity` | `0.15 + sr(i * 3 + 4) * 0.85;` |
| `esgScore` | `20 + Math.floor(sr(i * 5) * 80);` |
| `carbonInt` | `50 + sr(i * 5 + 1) * 950;` |
| `TERM_DATA` | `TERM_YEARS.map((yr, i) => {` |
| `row` | `{ year: yr + 'Y' };` |
| `CAPITAL_DATA` | `SECTORS.map((s, i) => {` |
| `totalRwa` | `items.reduce((sum, o) => sum + o.rwa, 0);` |
| `cet1` | `totalRwa * 0.045;  // 4.5% CET1` |
| `total` | `totalRwa * 0.080;  // 8% total` |
| `combined` | `totalRwa * 0.105; // 10.5% with capital conservation` |
| `scatterData` | `OBLIGORS.map(o => ({ x: o.esgScore, y: o.pd * 100, z: o.ead, sector: o.sector, name: o.name, rating: o.rating }));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `MATRIX_GRADES`, `MIGRATION_MATRIX`, `RATINGS`, `SECTORS`, `TERM_YEARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Climate PD Uplift (Hot House World) | — | ECB Climate Stress Test 2022 | Basis point increase in probability of default for high-carbon sectors under Hot House World scenario |
| LGD Physical Risk Haircut | — | BIS Working Paper 844 | Reduction in collateral recovery value due to physical climate damage to pledged assets |
| Climate-Adjusted EL | — | Model output | Expected loss multiplier under climate scenarios relative to base case |
| Carbon-Intensive Sector PD (2035) | — | NGFS calibration | Projected PD for high-carbon sectors under current policies scenario by 2035 |
| Climate RWA Add-on | — | Pillar 2 guidance | Additional risk-weighted assets required under Pillar 2 climate add-on approaches |
- **Obligor financial data and credit ratings** → Compute base PD/LGD/EAD using IRB models → **Base credit risk parameters per obligor**
- **NGFS scenario carbon price and GDP shock data** → Apply sector-calibrated β coefficients, compute climate PD uplift → **Climate-adjusted PD per obligor and scenario**
- **Physical risk hazard maps (IPCC/NGFS)** → Compute collateral location-weighted physical damage, apply LGD haircut → **Climate-adjusted LGD and EAD per obligor**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate-Adjusted Credit Risk Parameters
**Headline formula:** `PD_adj = PD_base × exp(β_transition × TransitionShock + β_physical × PhysicalShock)`
**Standards:** ['BCBS Climate Risk Working Group', 'ECB/EBA Climate Stress Test', 'NGFS Phase 5']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).