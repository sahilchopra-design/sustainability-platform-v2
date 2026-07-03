# Policy & Regulatory Impact
**Module ID:** `policy-regulatory-impact` · **Route:** `/policy-regulatory-impact` · **Tier:** B (frontend-computed) · **EP code:** EP-CB3 · **Sprint:** CB

## 1 · Overview
6 policy instrument deep-dives: EU ETS price trajectory, CBAM cumulative liability model, UK MEES/EPC building standards, US IRA green tax credits, EU Taxonomy alignment, and ICAO CORSIA aviation offsetting.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `POLICIES`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Policy Landscape', 'EU ETS Deep-Dive', 'CBAM Impact', 'IRA Green Acceleration', 'Building Standards', 'Portfolio Exposure'];` |
| `totalRevImpact` | `POLICIES.reduce((s, p) => s + p.revenue_impact_bn, 0);` |
| `totalCostImpact` | `POLICIES.reduce((s, p) => s + p.cost_impact_bn, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ETS_PRICE_DATA`, `POLICIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| EU ETS Price (2030) | `Supply-demand model` | EC DG CLIMA | Projected EU ETS allowance price based on Market Stability Reserve |
| CBAM Liability (portfolio) | `Import volume × embedded carbon` | EU CBAM Registry | Annual CBAM cost for portfolio companies importing into EU |
| IRA Solar Credit | `Production Tax Credit` | US IRA 2022 | Per-kWh tax credit for solar electricity generation |
| UK MEES Risk | `Below EPC C threshold` | MHCLG | Properties at risk of non-compliance with minimum energy standards |

## 5 · Intermediate Transformation Logic
**Methodology:** Policy instrument impact modelling
**Headline formula:** `CBAM_liability = Σ(ImportVolume_i × EmbeddedCarbon_i × (EU_ETS_price - Origin_carbon_price_i))`
**Standards:** ['EU ETS Directive', 'CBAM Regulation 2023/956', 'IRA 2022']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).