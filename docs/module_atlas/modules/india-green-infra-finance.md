# India Green Infrastructure Finance
**Module ID:** `india-green-infra-finance` · **Route:** `/india-green-infra-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-EA5 · **Sprint:** EA

## 1 · Overview
Analytics for India's green infrastructure finance landscape covering the National Infrastructure Pipeline (NIP) green component, HAM/BOT project finance structures, IIFCL green bonds, India RE100 PPAs, SEBI Green Bond Framework 2023, SECI/NTPC tender pipeline, and VGF (viability gap funding) mechanisms.

> **Business value:** Used by infrastructure PE funds, DFIs (DEG, IFC, ADB), sovereign wealth funds, and India-focused green bond issuers to underwrite, structure, and monitor green infrastructure investments in India.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BLENDED_FINANCE`, `BRSR_METRICS`, `CBAM_EXPOSURE_MAP`, `INFRA_TYPES`, `INVIT_DEALS`, `Kpi`, `NABFID_OVERVIEW`, `REAL_GIF_NON_SOLAR_REC_INR`, `REAL_GIF_PAC_PRICE_INR`, `REAL_GIF_SOLAR_REC_INR`, `SectionTitle`, `Tab`, `YIELD_CURVE`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `_LATEST_GIF_REC` | `INDIA_REC_PRICES.length ? INDIA_REC_PRICES[INDIA_REC_PRICES.length - 1] : null;` |
| `_LATEST_GIF_PAC` | `INDIA_PAC_CYCLE_RESULTS.length ? INDIA_PAC_CYCLE_RESULTS[INDIA_PAC_CYCLE_RESULTS.length - 1] : null;` |
| `CBAM_EXPOSURE_MAP` | `Object.fromEntries((_CCTS_CBAM_EXPOSURE \|\| []).map(c => [c.product, c]));` |
| `calcDscr` | `({ annRevenue, annOpex, annDebtService }) => annDebtService > 0 ? ((annRevenue - annOpex) / annDebtService).toFixed(2) : 'N/A';` |
| `annDebtService` | `(capexBnInr * debtPct/100 * 0.085);` |
| `annCashflow` | `annRevenueBnInr - annOpexBnInr;` |
| `tariffUplift` | `1 + (priceUSDt / 500);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BLENDED_FINANCE`, `BRSR_METRICS`, `INFRA_TYPES`, `INVIT_DEALS`, `YIELD_CURVE`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Project IRR (post-VGF) | `(PPA_revenue + VGF_grant + carbon_revenue - OPEX - DEBT_service) / equity_invested` | Project cash flow model | IRRs >12% are required for private equity participation; VGF is sized to bridge the gap to this threshold. |
| SECI Tender Pipeline (GW) | `Announced + under-construction + commissioned capacity by technology` | SECI tender announcements + MNRE data | Pipeline of 30–50GW annually; important for modelling sovereign green bond issuance size and RE sector credit  |
| Green Bond Yield Spread (bps) | `green_bond_yield − comparable_vanilla_bond_yield` | Bloomberg India bond data | India green bonds typically trade at 10-30bps greenium in international markets; SEBI framework aims to deepen |
- **SECI/NTPC tender data + SEBI green bond registry + MNRE statistics** → Project finance modelling → VGF sizing → IRR calculation → bond structuring → **India green infrastructure investment analytics for DFIs, PE funds, and green bond issuers**

## 5 · Intermediate Transformation Logic
**Methodology:** India Green Infrastructure Project Finance Modelling
**Headline formula:** `project_IRR = (PPA_revenue + VGF_grant + carbon_revenue - OPEX) / EPC_cost`
**Standards:** ['SEBI Green Bond Framework 2023', 'Ministry of Finance VGF Scheme Guidelines', 'IIFCL Green Bond Framework 2022']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `Apr2026CarbonAnalytics`, `IndiaAdvancedAnalytics`, `IndiaGreenHybridFinance`