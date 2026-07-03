# Renewable Portfolio Intelligence
**Module ID:** `renewable-portfolio-intelligence` · **Route:** `/renewable-portfolio-intelligence` · **Tier:** B (frontend-computed) · **EP code:** RE-PORT1 · **Sprint:** RE

## 1 · Overview
Institutional-grade portfolio analytics for 50-asset renewable energy portfolios spanning Solar PV, Wind Onshore, Wind Offshore, Hydro, and Geothermal. Covers portfolio VaR, efficient frontier, correlation matrix, peer benchmarking, vintage/geography diversification, attribution, and ESG/taxonomy alignment across 18 analytical tabs.

> **Business value:** Designed for RE-focused infrastructure fund managers, institutional LPs conducting portfolio due diligence, and ESG/taxonomy reporting teams. Provides institutional-grade risk analytics (VaR, efficient frontier, correlation) alongside EU Taxonomy, SFDR, and TCFD disclosure outputs for a 50-asset blended renewable portfolio — replicating the analytical depth of institutional portfolio management systems.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BASE_CORR`, `GEOS`, `KpiCard`, `MONTHS`, `SectionHdr`, `Sel`, `Slider`, `TABS`, `TECHS`, `TECH_COLORS`, `VINTAGES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `tech` | `TECHS[Math.floor(sr(i * 7) * TECHS.length)];` |
| `geo` | `GEOS[Math.floor(sr(i * 7 + 1) * GEOS.length)];` |
| `vintage` | `VINTAGES[Math.floor(sr(i * 7 + 2) * VINTAGES.length)];` |
| `capMW` | `Math.round(50 + sr(i * 7 + 4) * 450);` |
| `capexPerW` | `0.65 + sr(i * 7 + 5) * 0.75;` |
| `capex` | `capMW * 1e6 * capexPerW;` |
| `ppaPrice` | `35 + sr(i * 7 + 8) * 40;` |
| `annualRevM` | `capMW * cf * 8760 / 1e6 * ppaPrice;` |
| `debtPct` | `0.55 + sr(i * 7 + 9) * 0.20;` |
| `debtService` | `capex * debtPct * 0.075;` |
| `ebitda` | `annualRevM * 1e6 * 0.75;` |
| `dscr` | `debtService > 0 ? ebitda / debtService : 1.5;` |
| `irr` | `0.08 + sr(i * 7 + 10) * 0.10;` |
| `scope1` | `tech === 'Geothermal' ? 40 + sr(i * 7 + 11) * 30 : sr(i * 7 + 11) * 5;` |
| `techReturns` | `TECHS.map((t, ti) => {` |
| `weights` | `TECHS.map((_, ti) => {` |
| `tilt` | `[-1, -0.5, 1, 0.3, 0.2][ti] * alpha * 0.30;` |
| `wSum` | `weights.reduce((s, w) => s + w, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BASE_CORR`, `GEOS`, `MONTHS`, `TABS`, `TECHS`, `TECH_COLORS`, `VINTAGES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio P50 IRR | `Asset-weighted average of individual project IRRs` | Financial model | Blended equity IRR across portfolio; higher for offshore wind (13–18%) vs utility solar (9–13%) |
| Portfolio VaR (95%) | `σ_port × 1.645 × ΣRevenue` | Variance-covariance model | Annual revenue at risk at 95% confidence — combines resource, price, and operational volatility across portfol |
| WACI (Revenue) | `Σ (revenue_i / total_revenue × scope1_i / enterprise_value_i)` | GHG Protocol / TCFD | Weighted Average Carbon Intensity — SFDR PAI 1 metric; near-zero for operating RE portfolio but relevant for c |
| EU Taxonomy Alignment | `Art.10 criteria + DNSH screen` | EU Taxonomy Regulation 2020/852 | Share of portfolio revenue classified as taxonomy-aligned; renewable generation qualifies under Art.10; requir |
| Sharpe Ratio | `(μ_port − r_f) / σ_port` | Portfolio model | Risk-adjusted return vs risk-free rate; target Sharpe >1.0 for diversified RE portfolio; offshore-heavy portfo |
| Correlation (Solar-Wind) | `Seeded covariance matrix, resource-driven` | NREL Atlas | Low correlation between solar and wind improves diversification; offshore wind-solar correlation even lower (~ |
- **50 seeded RE assets (technology, capacity MW, vintage, geography, DSCR)** → Portfolio aggregation engine → **Blended IRR, VaR, WACI, taxonomy alignment, DSCR distribution**
- **5×5 technology return correlation matrix** → Efficient frontier optimization (parametric sweep) → **Optimal portfolio weights, Sharpe maximization, risk-return frontier**
- **EU Taxonomy technical screening criteria (Art.10) + DNSH thresholds** → Asset-by-asset screening → **Taxonomy-aligned revenue %, DNSH pass/fail by environmental objective**

## 5 · Intermediate Transformation Logic
**Methodology:** Portfolio VaR + Mean-Variance Efficient Frontier
**Headline formula:** `σ_port = √(wᵀΣw); VaR₉₅ = σ_port × 1.645 × TotalRevenue; EF: min wᵀΣw s.t. w·μ = μ_target, Σw = 1`
**Standards:** ['EU Taxonomy Art.10', 'SFDR PAI', 'IFC Performance Standards', 'IRENA Renewable Readiness']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `EnergyAdvancedAnalytics`