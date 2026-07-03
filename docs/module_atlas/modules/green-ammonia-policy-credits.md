# Green Ammonia Policy & Carbon Credits
**Module ID:** `green-ammonia-policy-credits` · **Route:** `/green-ammonia-policy-credits` · **Tier:** B (frontend-computed) · **EP code:** EP-EE5 · **Sprint:** EE

## 1 · Overview
Green ammonia policy instruments, subsidy programs, and carbon credit stacking. Covers IRA §45V H2 tax credit tiers, EU H2Global differential-cost contracts, EU CBAM fertilizer impact, Japan Green Innovation Fund, and carbon credit monetization strategies.

> **Business value:** Used by green ammonia developers, policy advisors, DFIs, and investors to evaluate and stack IRA, H2Global, CBAM, and national subsidy programs for optimal project economics.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `KpiCard`, `POLICIES`, `TABS`, `TYPE_COLORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `maxValue` | `useMemo(() => filtered.length ? Math.max(...filtered.map(p => p.valueUsdPerT)) : 0, [filtered]);` |
| `avgValue` | `useMemo(() => filtered.length ? filtered.reduce((a, b) => a + b.valueUsdPerT, 0) / filtered.length : 0, [filtered]);` |
| `cbamVal` | `Math.round(etsPriceEur * 1.8 * 0.82);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `POLICIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| IRA §45V Tier 1 Credit ($/kg H2) | `Lifecycle GHG <0.45 kgCO2e/kgH2` | IRS Notice 2023-29 | 3-pillar additionality for grid electrolysers: new renewables, hourly matching, deliverability; direct pay 5 y |
| H2Global Strike Price (€/t H2 equiv) | `DCC auction clearing price` | H2Global GmbH Auction Results 2023-24 | €900M Phase 1; Australia, Chile, Namibia, UAE awarded; 10-year contracts. |
| EU CBAM Fertilizer Impact (€/t NH3) | `Grey NH3 carbon × ETS price` | EU CBAM Regulation (EU) 2023/956 | Grey NH3 ~2.1 tCO2/t; at EU ETS €60/t → CBAM €126/t; green NH3 CBAM = 0; from 2026. |
- **IRS §45V guidance + H2Global auction data + EU CBAM ETS prices + METI GIF data** → IRA credit tier calculator + H2Global DCC model + CBAM impact calculator → **Policy optimization: jurisdiction selection, subsidy stacking, carbon credit monetization**

## 5 · Intermediate Transformation Logic
**Methodology:** IRA §45V Tier Model & H2Global Contract
**Headline formula:** `§45V_credit = f(lifecycle_GHG_tier) in $/kg H2; H2Global_DCC = (LCOA_green - market_price) × volume`
**Standards:** ['IRS §45V Guidance (2023)', 'EU H2Global Fund Mechanism', 'EU CBAM Regulation (2023)']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).