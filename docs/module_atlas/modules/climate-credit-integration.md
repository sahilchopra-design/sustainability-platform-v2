# Climate Credit Integration Engine
**Module ID:** `climate-credit-integration` · **Route:** `/climate-credit-integration` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Integration layer connecting carbon credit positions from the CarbonCreditContext data bus with portfolio-level climate analytics. Maps credit retirements to Scope 1/2/3 offset claims, validates additionality, and adjusts portfolio temperature score and financed emissions.

> **Business value:** Net FE = gross FE minus quality-adjusted credit retirements. VCMI Gold tier requires 100% of residual emissions covered by CCP-eligible credits and near-term SBTi target in place.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `HAZARDS`, `HAZARD_MATRIX`, `LINK_COLOR`, `MODULE_LINKS`, `OBLIGORS_CC`, `SCENARIOS_CC`, `SECTORS_CC`, `SECTOR_TRANSITION`, `STAGE_COLOR`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `SECTORS_CC` | `['Power','Steel','Cement','Oil & Gas','Transport','Buildings','Agri-Food','Financial','Real Estate','Retail'];` |
| `pd_base` | `0.005 + sr(i * 3) * 0.04;` |
| `lgd_base` | `0.25 + sr(i * 3 + 1) * 0.45;` |
| `ead` | `50 + sr(i * 3 + 2) * 950;` |
| `carbonInt` | `80 + sr(i * 5) * 1200;         // tCO₂/$M revenue` |
| `physScore` | `10 + sr(i * 5 + 1) * 80;` |
| `transScore` | `10 + sr(i * 5 + 2) * 80;` |
| `scenarios_adj` | `SCENARIOS_CC.map(sc => {` |
| `carbonFactor` | `1 + (sc.pdMultiplier - 1) * (carbonInt / 800);` |
| `physFactor` | `1 + (sc.pdMultiplier - 1) * (physScore / 80) * 0.3;` |
| `pd_adj` | `Math.min(1, pd_base * carbonFactor * physFactor);` |
| `lgd_adj` | `lgd_base * sc.lgdMultiplier;` |
| `ecl_base` | `pd_base * lgd_base * ead;` |
| `ecl_adj` | `pd_adj  * lgd_adj  * ead;` |
| `uplift_pct` | `((ecl_adj - ecl_base) / ecl_base * 100);` |
| `sicr_z_adj` | `(pd_adj - pd_base) / (pd_base * 0.3 + 0.001);` |
| `HAZARD_MATRIX` | `SECTORS_CC.map((sector, si) => {` |
| `SECTOR_TRANSITION` | `SECTORS_CC.map((s, i) => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `HAZARDS`, `MODULE_LINKS`, `SCENARIOS_CC`, `SECTORS_CC`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Gross Financed Emissions | `PCAF Scope 1+2 attribution` | PCAF Standard v2 | Portfolio emissions before carbon credit offset adjustment |
| Offset Quality Factor | `ICVCM CCP score / 100` | ICVCM assessment | Credit quality discount; 1.0 for CCP-eligible, lower for non-eligible |
| Net Financed Emissions | `GrossFE – Σ(Credits × QF)` | Model output | Portfolio emissions after quality-adjusted credit retirements |
| VCMI Claims Tier | `VCMI assessment` | VCMI Claims Code 2023 | Permissible voluntary claim tier based on credit quality and abatement coverage |
- **CarbonCreditContext bus** → Retired credit registry data → offset pool → **Available offsets by quality tier**
- **PCAF FE model** → Gross FE – QF-weighted retirements → net FE → **Adjusted financed emissions**

## 5 · Intermediate Transformation Logic
**Methodology:** Credit retirement offset adjustment to portfolio emissions
**Headline formula:** `AdjustedFE = GrossFE – Σ(RetiredCredits_i × QualityFactor_i); AdjustedITR = f(AdjustedFE)`
**Standards:** ['GHG Protocol Corporate Standard', 'VCMI Claims Code of Practice 2023', 'SBTi Net-Zero Standard v1.2', 'ISO 14064-3']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).