# Sovereign Analytics Hub
**Module ID:** `sovereign-hub` · **Route:** `/sovereign-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Integrated sovereign risk dashboard aggregating climate, ESG, debt sustainability, physical, social and nature risk analytics for comprehensive country-level sovereign risk management.

> **Business value:** Serves as the master sovereign risk dashboard integrating six risk dimensions for holistic country-level sovereign risk management.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `COUNTRY_DATA`, `Card`, `DATA_SOURCES`, `ENERGY_TRAJECTORY`, `KpiCard`, `LS_PORTFOLIO`, `MODULES`, `PIE_COLORS`, `POLICY_DIMS`, `REGULATIONS`, `Section`, `SortTh`, `TABS`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `base` | `27 + i * 2;` |
| `regions` | `useMemo(() => ['All', ...new Set(COUNTRY_DATA.map(c => c.region))].sort(), []);` |
| `wtdESG` | `countryExposure.reduce((s, c) => s + (c.esg \|\| 50) * (c.weight \|\| 0) / 100, 0) \|\| COUNTRY_DATA.reduce((s, c) => s + c.esg, 0) / n;` |
| `avgNDGain` | `COUNTRY_DATA.reduce((s, c) => s + c.ndgain, 0) / n;` |
| `parisAligned` | `COUNTRY_DATA.filter(c => c.paris_aligned).length / n * 100;` |
| `nzPct` | `COUNTRY_DATA.filter(c => c.net_zero).length / n * 100;` |
| `avgCarbonPrice` | `COUNTRY_DATA.reduce((s, c) => s + c.carbon_price, 0) / n;` |
| `avgRenewable` | `COUNTRY_DATA.reduce((s, c) => s + c.renewable_pct, 0) / n;` |
| `avgEmissionsCapita` | `COUNTRY_DATA.reduce((s, c) => s + c.emissions_capita, 0) / n;` |
| `totalGreenBond` | `COUNTRY_DATA.reduce((s, c) => s + c.green_bond_bn, 0);` |
| `avgJT` | `COUNTRY_DATA.reduce((s, c) => s + c.jt_score, 0) / n;` |
| `avgHDI` | `COUNTRY_DATA.reduce((s, c) => s + c.hdi, 0) / n;` |
| `avgCPI` | `COUNTRY_DATA.reduce((s, c) => s + c.cpi, 0) / n;` |
| `header` | `['Country', 'Region', 'ESG', 'ND-GAIN', 'Carbon Price', 'Renewable %', 'Emissions/Capita', 'JT Score', 'HDI', 'CPI', 'Net Zero', 'Paris Aligned'];` |
| `rows` | `COUNTRY_DATA.map(c => [c.name, c.region, c.esg, c.ndgain, c.carbon_price, c.renewable_pct, c.emissions_capita, c.jt_score, c.hdi, c.cpi, c.net_zero \|\|` |
| `csv` | `[header, ...rows].map(r => r.join(',')).join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRY_DATA`, `DATA_SOURCES`, `MODULES`, `PIE_COLORS`, `POLICY_DIMS`, `REGULATIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Risk Dimensions | — | Hub config | Number of sovereign risk dimensions integrated into the composite sovereign risk index. |
| Countries Monitored | — | Sovereign database | Countries with active monitoring across all six sovereign risk dimensions. |
| Portfolio Avg Risk | — | Weighted avg | AUM-weighted mean composite sovereign risk index across active sovereign bond portfolio. |
- **All sovereign module outputs, portfolio sovereign weights** → Composite aggregation, dimension attribution, portfolio aggregation → **Sovereign risk index, radar charts, risk attribution, portfolio alerts**

## 5 · Intermediate Transformation Logic
**Methodology:** Composite Sovereign Risk Index
**Headline formula:** `Σ (Risk_Dimension_i × w_i)`
**Standards:** ['IMF', 'World Bank', 'NGFS', 'ND-GAIN']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).