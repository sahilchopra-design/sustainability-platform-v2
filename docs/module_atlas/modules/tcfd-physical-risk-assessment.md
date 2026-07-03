# TCFD Physical Risk Assessment
**Module ID:** `tcfd-physical-risk-assessment` · **Route:** `/tcfd-physical-risk-assessment` · **Tier:** B (frontend-computed) · **EP code:** EP-MISC · **Sprint:** Platform

## 1 · Overview
Comprehensive TCFD physical risk assessment covering both chronic hazards (sea level rise, heat stress, precipitation change, drought) and acute hazards (riverine flood, coastal flood, wildfire, storm surge, cyclone/typhoon). Produces Overall Risk Ratings (ORR), asset-level exposure mapping, and financial materiality quantification per TCFD recommendations.

> **Business value:** Used by real estate investors, infrastructure funds, corporate treasury, and insurance underwriters to systematically quantify and disclose physical climate risk exposure per TCFD recommendations.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `DEFAULTS`, `HORIZONS`, `PRICE_PATHS`, `SECTORS`, `STATES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `elast` | `TRANSITION_ELASTICITY[sector] ?? -0.05;` |
| `rows` | `useMemo(() => s.assets.map(a => {` |
| `rarAfter` | `rar * (1 - s.adaptBenefitPct / 100);` |
| `portRar` | `rows.reduce((x, r) => x + r.rar, 0) / Math.max(1, rows.length);` |
| `portRarAfter` | `rows.reduce((x, r) => x + r.rarAfter, 0) / Math.max(1, rows.length);` |
| `rarDollar` | `s.ebitda * (portRar / 100);` |
| `rarDollarAfter` | `s.ebitda * (portRarAfter / 100);` |
| `transDollar` | `s.ebitda * (transPct / 100); // negative for loss, positive for gain` |
| `totalImpactPct` | `portRar - transPct; // physical RaR% minus transition% (transPct negative = loss, so subtract negative = add positive = larger loss)` |
| `combinedLossPct` | `portRar + Math.max(0, -transPct); // physical + (transition loss if negative elast)` |
| `combinedDollar` | `s.ebitda * (combinedLossPct / 100);` |
| `dscrBase` | `s.debtSvc > 0 ? s.ebitda / s.debtSvc : 0;` |
| `dscrStress` | `s.debtSvc > 0 ? Math.max(0, s.ebitda - combinedDollar) / s.debtSvc : 0;` |
| `dscrAdapt` | `s.debtSvc > 0 ? Math.max(0, s.ebitda - rarDollarAfter - s.adaptOpex + Math.min(0, transDollar) + oppUplift()) / s.debtSvc : 0;` |
| `adoptFrac` | `s.opportunityAdoption / 100;` |
| `avoidedLoss15yr` | `(rarDollar - rarDollarAfter) * 15;` |
| `roi` | `s.adaptCapex > 0 ? (avoidedLoss15yr - s.adaptOpex * 15) / s.adaptCapex : 0;` |
| `rarAvg` | `s.assets.reduce((x, a) => x + rarFor(a, ssp, y), 0) / Math.max(1, s.assets.length);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `HORIZONS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Physical Risk ORR | `max(chronic_ORR, acute_ORR) weighted by exposure` | TCFD Technical Supplement framework | ORR 4-5 (High/Critical) triggers TCFD mandatory disclosure under UK TCFD rules and CSRD ESRS E1-4; requires qu |
| 100-Year Flood Loss (% asset value) | `expected_flood_damage / asset_replacement_value × 100` | JBA/Fathom flood model + AIR damage functions | Loss >5% of asset value at 100-year return period is considered material for property and infrastructure asset |
| Climate Financial Exposure (USD) | `asset_value × hazard_intensity × vulnerability_factor × (1 − insurance_coverage)` | Physical risk × financial model | Uninsured climate financial exposure is the key metric for TCFD Strategy section; aggregated to portfolio leve |
- **Asset geolocation data + JBA/Fathom/RMS hazard databases + IPCC AR6 climate projections** → Hazard overlay → vulnerability assessment → financial exposure modelling → ORR scoring → **TCFD-compliant physical risk assessment with asset-level ORRs and financial materiality quantification**

## 5 · Intermediate Transformation Logic
**Methodology:** Dual-Hazard Physical Risk Assessment
**Headline formula:** `ORR = max(chronic_risk_score, acute_risk_score) × exposure_weight × financial_sensitivity`
**Standards:** ['TCFD Technical Supplement: Physical Risks (2017)', 'IPCC AR6 WGI Physical Climate Basis', 'NGFS Physical Risk Assessment Scenarios']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `AdvisoryReference`, `AdvisoryToolkit`