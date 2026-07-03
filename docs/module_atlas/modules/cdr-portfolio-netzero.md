# CDR Portfolio & Net-Zero Integration
**Module ID:** `cdr-portfolio-netzero` · **Route:** `/cdr-portfolio-netzero` · **Tier:** B (frontend-computed) · **EP code:** EP-EH6 · **Sprint:** EH

## 1 · Overview
Strategic CDR portfolio construction and net-zero pathway integration: portfolio allocation builder across 4 CDR types, Oxford Principles transition visualisation, marginal cost curve, frontier buyer alignment, risk/return scatter, and IFRS S2/SBTi/VCMI/ICVCM framework mapping.

> **Business value:** Used by corporate sustainability teams building net-zero strategies, asset managers constructing CDR portfolios, DFIs designing CDR procurement facilities, and CFOs preparing IFRS S2 CDR disclosures.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CDR_INSTRUMENTS`, `COST_CURVE`, `FRONTIER_BUYERS`, `KpiCard`, `NETZERO_TRAJECTORY`, `PORTFOLIO_TEMPLATES`, `Pill`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Portfolio Builder', 'Net-Zero Trajectory', 'Cost Curve', 'Buyer Alignment', 'Risk/Return', 'Net-Zero Integration'];` |
| `total` | `dacPct + beccsPct + biocharPct + ewPct \|\| 1;` |
| `wdac` | `dacPct / total;` |
| `wbeccs` | `beccsPct / total;` |
| `wbiochar` | `biocharPct / total;` |
| `wew` | `ewPct / total;` |
| `dacI` | `CDR_INSTRUMENTS.find(c => c.id === 'DAC-Geo');` |
| `ewI` | `CDR_INSTRUMENTS.find(c => c.id === 'EW-Basalt');` |
| `avgLcoc` | `Math.round(wdac * dacI.lcoc + wbeccs * beccsI.lcoc + wbiochar * biocharI.lcoc + wew * ewI.lcoc);` |
| `avgIrr` | `(wdac * dacI.irr + wbeccs * beccsI.irr + wbiochar * biocharI.irr + wew * ewI.irr).toFixed(1);` |
| `avgRisk` | `Math.round(wdac * dacI.risk + wbeccs * beccsI.risk + wbiochar * biocharI.risk + wew * ewI.risk);` |
| `permanencePct` | `Math.round(wdac * 100 + wbeccs * 100); // tier 1 only` |
| `annualCDR` | `carbonTarget * 1000; // tCO₂` |
| `annualCost` | `(annualCDR * avgLcoc / 1e6).toFixed(1);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CDR_INSTRUMENTS`, `FRONTIER_BUYERS`, `PORTFOLIO_TEMPLATES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| SBTi residual emissions limit (%) | `Of base year Scope 1+2 emissions` | SBTi Corporate Net-Zero Standard v1.1 | Net-zero requires neutralising ≤10% residual with permanent CDR; cannot use avoidance credits for net-zero tar |
| Oxford Principles shift timeline | `Gradual rebalancing from avoidance to CDR over time` | University of Oxford Net Zero research | By 2050: ideally >80% CDR; avoid locking in low-permanence credits with >2050 expiry dates for net-zero claims |
| IFRS S2 CDR disclosure | `Mandatory for large entities under ISSB adoption` | IFRS S2 Climate-related Disclosures | Must disclose CDR strategy, annual expenditure, volumes, permanence tier mix, and reliance on carbon credits f |
- **Oxford Principles + SBTi NET-Zero Standard + GFANZ CDR framework + IFRS S2** → Portfolio allocation engine + net-zero trajectory + cost curve + buyer alignment + framework mapper → **Corporate sustainability teams, asset managers, DFIs, and investors building CDR portfolios and net-zero strategies**

## 5 · Intermediate Transformation Logic
**Methodology:** CDR Portfolio Blended LCOC
**Headline formula:** `Portfolio_LCOC = Σ(weight_i × LCOC_i); Blended_IRR = Σ(weight_i × IRR_i); Permanent_pct = Σ(Tier1_weights)`
**Standards:** ['Oxford Principles for Net-Zero Aligned Offsetting', 'SBTi Corporate Net-Zero Standard', 'GFANZ CDR Integration Framework 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).