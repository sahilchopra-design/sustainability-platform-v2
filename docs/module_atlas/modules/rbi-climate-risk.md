# RBI Climate Risk Directions 2025
**Module ID:** `rbi-climate-risk` · **Route:** `/rbi-climate-risk` · **Tier:** B (frontend-computed) · **EP code:** EP-IN1 · **Sprint:** IN

## 1 · Overview
India-specific climate risk compliance module implementing RBI's Climate Risk and Sustainable Finance Directions 2025 for all Scheduled Commercial Banks, Small Finance Banks, AIFIs, and Top/Upper Layer NBFCs. Covers CRAR capital adequacy (9% CET1 vs Basel 8%), D-SIB buffers, NGFS scenario analysis with India-specific GDP/carbon price paths, financed emissions attribution using CEA grid factors, physical risk exposure across 15 Indian states, and BRSR Core alignment with ESRS crosswalk.

> **Business value:** This module is essential for every Indian bank, NBFC, and financial institution navigating RBI's mandatory climate risk integration requirements. It provides: (1) A compliance checklist mapped to RBI's 4-pillar framework with 25 sub-requirements; (2) India-specific capital adequacy modeling using CRAR 9% CET1 with D-SIB surcharges; (3) NGFS scenario analysis calibrated for India's GDP, carbon price, and energy transition trajectory; (4) Lending book emissions attribution using official CEA grid emission factors; (5) Physical risk exposure mapping across Indian states; (6) BRSR Core alignment tracking for the 15 mandatory assurance KPIs.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_REQ_ITEMS`, `BANKS`, `BANK_NAMES`, `BANK_TYPES`, `DISCLOSURE_PHASES`, `LENDING_SECTORS`, `NGFS_SCENARIOS`, `PHYSICAL_STATES`, `RBI_PILLARS`, `SECTOR_EF`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v => typeof v === 'number' ? (v >= 1e9 ? (v/1e9).toFixed(1)+'B' : v >= 1e6 ? (v/1e6).toFixed(1)+'M' : v >= 1e3 ? (v/1e3).toFixed(1)+'K' : v.toFixed(1)` |
| `pct` | `(n, d) => d > 0 ? +((n / d) * 100).toFixed(1) : 0;` |
| `guard` | `(n, d, fb = 0) => d > 0 ? n / d : fb;` |
| `BANKS` | `BANK_NAMES.map((name, i) => {` |
| `totalAssets_cr` | `Math.round(200000 + sr(s) * 4500000);` |
| `cet1` | `+(9.5 + sr(s + 1) * 6).toFixed(2);` |
| `at1` | `+(1.0 + sr(s + 2) * 2).toFixed(2);` |
| `tier2` | `+(1.5 + sr(s + 3) * 3).toFixed(2);` |
| `crar` | `+(cet1 + at1 + tier2).toFixed(2);` |
| `npa_pct` | `+(isPSB ? 2.5 + sr(s + 4) * 6 : 0.8 + sr(s + 4) * 2.5).toFixed(2);` |
| `lendingBook_cr` | `Math.round(totalAssets_cr * (0.55 + sr(s + 5) * 0.15));` |
| `financedEmissions_mtco2` | `+(lendingBook_cr * 0.000012 * (0.6 + sr(s + 6) * 0.8)).toFixed(2);` |
| `climateRiskIntegration` | `Math.round(30 + sr(s + 7) * 60);` |
| `brsrReady` | `Math.round(40 + sr(s + 8) * 55);` |
| `ngfsScenarios` | `Math.floor(2 + sr(s + 9) * 5);` |
| `governanceScore` | `Math.round(35 + sr(s + 10) * 55);` |
| `strategyScore` | `Math.round(30 + sr(s + 10) * 60);` |
| `riskMgmtScore` | `Math.round(25 + sr(s + 11) * 65);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BANK_NAMES`, `BANK_TYPES`, `DISCLOSURE_PHASES`, `LENDING_SECTORS`, `NGFS_SCENARIOS`, `PHYSICAL_STATES`, `RBI_PILLARS`, `SECTOR_EF`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Banks in Scope | — | RBI Directions 2025 | All Scheduled Commercial Banks, Small Finance Banks (separate directions), All India Financial Institutions, T |
| CRAR Minimum | — | RBI Master Circular | India: 9% CET1 vs Basel: 8% — 100bps higher minimum for Indian banks |
| D-SIB Banks | — | RBI D-SIB Framework | SBI: 0.6% surcharge, HDFC Bank: 0.4%, ICICI Bank: 0.4% |
| Compliance Deadline | — | RBI | Climate risk integration into existing risk management frameworks mandatory from FY 2025-26 |
| CEA Grid Factor | — | CEA v19 | 22 state-level grid factors from 0.10 (Sikkim/hydro) to 0.90 (Jharkhand/coal) |
| BRSR Core KPIs | — | SEBI | Assurance required for top 500 companies FY 2025-26; mapped to ESRS E1-E5, S1, G1 |
- **Bank lending book by sector + CEA grid factors** → PCAF financed emissions calculation → **Attributed Scope 1+2 emissions for the lending portfolio**
- **NGFS scenario parameters (India-specific)** → Climate stress test engine → **Portfolio loss, VaR, capital impact under 6 scenarios**
- **State-level physical hazard data** → Physical risk aggregation → **Bank branch and borrower exposure by flood/cyclone/heatwave/drought**
- **BRSR Core 15 KPIs + ESRS crosswalk** → Compliance gap analysis → **Assurance readiness % and disclosure completeness**

## 5 · Intermediate Transformation Logic
**Methodology:** RBI CRAR Capital Framework + NGFS India Scenario Engine
**Headline formula:** `CRAR = (CET1 + AT1 + Tier2) / RWA_climate_adjusted; Climate_Addon = Σ(sector_exposure × climate_multiplier)`
**Standards:** ['RBI Climate Risk Directions 2025', 'RBI Master Circular on Basel III Capital (CRAR)', 'NGFS Phase IV Scenarios', 'CEA CO2 Baseline Database v19', 'SEBI BRSR Core Framework']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).