# Green Ammonia Production Economics
**Module ID:** `green-ammonia-production-economics` · **Route:** `/green-ammonia-production-economics` · **Tier:** B (frontend-computed) · **EP code:** EP-EE1 · **Sprint:** EE

## 1 · Overview
Green ammonia LCOA analysis. Models electrolyser+Haber-Bosch project economics, decomposes LCOA into capital, operating, and electricity cost components, tracks green premium vs grey ammonia, and projects pathway to cost-competitive $300/t target by 2030.

> **Business value:** Used by green hydrogen/ammonia developers, DFIs, commodity traders, fertilizer companies, and shipping companies evaluating green ammonia investment and pathway to cost parity with grey ammonia.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CRF`, `KpiCard`, `NH3_ELEC_CONSUMPTION`, `PROJECTS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `CRF` | `0.08; // capital recovery factor ~8%` |
| `NH3_ELEC_CONSUMPTION` | `10; // MWh/t NH3` |
| `TABS` | `['LCOA Engine', 'Electrolysis Cost Breakdown', 'Haber-Bosch Economics', 'Sensitivity Analysis', 'Scale Effects', 'Grey vs Green Parity'];` |
| `countries` | `useMemo(() => ['All', ...Array.from(new Set(PROJECTS.map(p => p.country)))], []);` |
| `annualOutput` | `capexOverride * 1000 * 8760 * 0.5 / NH3_ELEC_CONSUMPTION;` |
| `capexAnnual` | `capexOverride * 1000 * CRF;` |
| `opexFixed` | `capexOverride * 0.02 * 1000;` |
| `lcoa` | `annualOutput > 0 ? (capexAnnual + opexFixed + elecCost) / 1 : 0;` |
| `carbonPriceNeeded` | `Math.round(p.premium / 1.8);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PROJECTS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| LCOA ($/tonne NH3) | `LCOA = (CAPEX×CRF + OPEX + E_cost×10) / output_t` | IRENA / BNEF Green Ammonia Tracker 2024 | At $20/MWh RE, electricity = $200/t; at $50/MWh = $500/t; key lever is cheap renewable electricity. |
| Green Premium ($/tonne) | `LCOA_green - LCOA_grey` | CRU Group Ammonia Price Analytics | Grey NH3 FOB $200-300/t; green premium needs to close to <$100/t for commercial viability without subsidies. |
| Electrolyser Capacity Factor (%) | `Operating hours / total hours per year` | IEA Green Hydrogen Cost Analysis | Higher CF reduces CAPEX per tonne; 50% CF (intermittent wind) doubles CAPEX vs 90% CF (24/7 hydro). |
- **RE electricity cost + electrolyser cost + Haber-Bosch CAPEX + O&M benchmarks** → LCOA model (CRF + OPEX + electricity) + green premium calculator + cost trajectory → **Green ammonia project investment: site selection, offtake pricing, subsidy optimization**

## 5 · Intermediate Transformation Logic
**Methodology:** LCOA Decomposition & Electrolyser Cost Model
**Headline formula:** `LCOA = (CAPEX × CRF + OPEX + E_price × 10 MWh/t) / NH3_output_t; CRF = r(1+r)^n/((1+r)^n-1)`
**Standards:** ['IEA Ammonia Technology Roadmap 2021', 'IRENA Green Hydrogen Cost Scaling 2020', 'BNEF Green Ammonia Market Outlook 2024']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).