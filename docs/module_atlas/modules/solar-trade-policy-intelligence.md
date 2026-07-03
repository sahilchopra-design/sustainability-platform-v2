# Solar Trade Policy Intelligence
**Module ID:** `solar-trade-policy-intelligence` · **Route:** `/solar-trade-policy-intelligence` · **Tier:** B (frontend-computed) · **EP code:** EP-ED5 · **Sprint:** ED

## 1 · Overview
Global solar PV trade policy and market access intelligence. Analyses AD/CVD tariff impacts, IRA domestic content incentives (§48C/§48E), EU Net-Zero Industry Act local manufacturing targets, CBAM implications, and UFLPA supply chain compliance affecting import economics.

> **Business value:** Used by solar developers, manufacturers, EPCs, trade policy advisors, and institutional investors to navigate the trade and industrial policy landscape affecting solar supply chain economics in the US and EU.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COLORS`, `COUNTRIES`, `IRA_SCENARIOS`, `KpiCard`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `iraCredit` | `useMemo(() => (iraSizeKw * 0.001 * 1800 * computedITC / 100).toFixed(0), [iraSizeKw, computedITC]);` |
| `avgCbam` | `useMemo(() => COUNTRIES.length ? (COUNTRIES.reduce((a, c) => a + c.cbamRisk, 0) / COUNTRIES.length).toFixed(1) : '0.0', []);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `COUNTRIES`, `IRA_SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| AD/CVD Effective Rate (%) | `Statutory AD + CVD rate per manufacturer` | US CBP ADDCVD Order 7002 | Circumvention orders extended to Cambodia/Vietnam/Malaysia/Thailand (2022). |
| IRA §48E Production Credit ($/W) | `Applies to US-manufactured modules and cells` | IRS Notice 2023-29 | Direct pay available for 5 years for tax-exempt entities; transferability to third parties. |
| EU NZIA Local Content Target (%) | `% of EU demand met by EU-manufactured solar` | EU NZIA Regulation 2024 | Current EU production <5% of demand; requires €20-30B investment. |
- **CBP tariff database + IRS guidance + EU NZIA text + SEIA market data** → Tariff impact + IRA incentive calculator + CBAM cost model → **Trade policy risk for solar procurement, manufacturing investment, and market access**

## 5 · Intermediate Transformation Logic
**Methodology:** Tariff Impact & IRA Incentive Optimization
**Headline formula:** `Effective_cost = module_price × (1 + AD_CVD_rate); IRA_benefit = CAPEX × ITC_rate + output × PTC_rate`
**Standards:** ['IRS IRA §48C/§48E Guidance', 'US CBP AD/CVD Order Database', 'EU NZIA Regulation (2024)']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).