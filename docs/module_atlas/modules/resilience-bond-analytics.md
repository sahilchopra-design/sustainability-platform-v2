# Resilience Bond Analytics
**Module ID:** `resilience-bond-analytics` · **Route:** `/resilience-bond-analytics` · **Tier:** B (frontend-computed) · **EP code:** EP-EK4 · **Sprint:** EK

## 1 · Overview
CAT bond and climate adaptation bond analytics: 24-bond universe with peril/trigger/rating/coupon, parametric vs indemnity trigger comparison radar, ILS market issuance trend, KPI-linked coupon analytics, investor base ($Bn by type), and structuring guide.

> **Business value:** Used by ILS fund managers screening cat bond opportunities, sovereign debt officers structuring parametric bonds, MDB treasury teams issuing resilience bonds, and institutional investors allocating to adaptation ILS.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BONDS`, `COUPON_ANALYTICS`, `INVESTOR_TYPES`, `ISSUANCE_TREND`, `KpiCard`, `Pill`, `TABS`, `TRIGGER_COMPARISON`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sortedBonds` | `useMemo(() => [...filteredBonds].sort((a, b) => b[sortField] - a[sortField]), [filteredBonds, sortField]);` |
| `totalIssuance` | `BONDS.reduce((a, b) => a + b.size, 0);` |
| `avgCoupon` | `BONDS.reduce((a, b) => a + b.coupon, 0) / BONDS.length;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `INVESTOR_TYPES`, `ISSUANCE_TREND`, `TABS`, `TRIGGER_COMPARISON`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Cat bond market size 2024 | `Outstanding ILS including cat bonds` | Artemis Q1 2024 ILS Market Report | Record issuance driven by re/insurance capacity tightening post-hurricane losses; spread widening attracting n |
| Parametric payout speed | `After trigger breach vs 6–18 months for indemnity` | CCRIF 2024 Report | CCRIF paid $135M to Caribbean governments within weeks of 2024 hurricane season; indemnity claims still settli |
| Climate adaptation bond CAGR | `2022–2024 issuance growth` | CBI Climate Bonds Initiative 2024 | Driven by World Bank/IBRD issuances, sovereign climate bonds, and SLBs with climate resilience KPIs. |
- **ICMA GBP + CBI Adaptation Criteria + Artemis ILS + World Bank Resilience Bond Framework + IBRD + CCRIF + Swiss Re** → 24-bond universe + trigger comparison + issuance trend + coupon analytics + investor base + structuring guide → **ILS fund managers, sovereign debt officers, MDB treasury teams, and cat bond structuring advisors**

## 5 · Intermediate Transformation Logic
**Methodology:** Cat Bond Pricing
**Headline formula:** `Spread = EL × LGD × (1 + RiskPremium); EL = AttachmentProbability × ExpectedLoss_given_attachment; KPI_adjusted_spread = BaseSpread ± ΔStep_up_down; Parametric_payout = Intensity × CoverageAmount × I(Trigger_breached)`
**Standards:** ['ICMA Climate Bonds Initiative Adaptation Criteria', 'Swiss Re ILS Market Update 2024', 'World Bank Resilience Bonds Framework 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).