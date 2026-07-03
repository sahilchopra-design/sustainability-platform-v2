# Climate Mortality & Longevity Analytics
**Module ID:** `climate-mortality-longevity` · **Route:** `/climate-mortality-longevity` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Models the impact of climate-driven heat stress, air quality deterioration, and extreme weather on mortality rates and longevity assumptions for life insurance and pension liabilities.

> **Business value:** Enables life insurers, reinsurers, and pension funds to incorporate climate-driven mortality shifts into actuarial assumptions, reserve adequacy testing, and product pricing.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AGE_BANDS`, `BASE_MORT_RATES`, `CLIMATE_ZONES`, `COUNTRIES`, `COUNTRY_NAMES`, `HORIZONS`, `KpiCard`, `NGFS_SCENARIOS`, `REGIONS`, `SCENARIO_MULT`, `SCENARIO_WARMING`, `SCEN_COLORS`, `TabBtn`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['Europe', 'Americas', 'Asia-Pacific', 'Africa', 'Middle East'];` |
| `COUNTRIES` | `COUNTRY_NAMES.map((name, i) => ({` |
| `BASE_MORT_RATES` | `AGE_BANDS.map((_, i) => +(0.002 + i * 0.004 + sr(i * 13) * 0.003).toFixed(5));` |
| `top20Heat` | `useMemo(() => [...filtered].sort((a, b) => b.heatExcessMortPct - a.heatExcessMortPct).slice(0, 20), [filtered]);` |
| `avgSMR` | `filtered.reduce((s, c) => s + calcSMR(c, scenIdx), 0) / filtered.length;` |
| `avgLifeExp` | `filtered.reduce((s, c) => s + calcLifeExp(c, scenIdx), 0) / filtered.length;` |
| `totalExcessDeaths` | `filtered.reduce((s, c) => s + c.heatExcessMortPct * c.heatwaveDays2050 * 10, 0);` |
| `avgRA` | `filtered.reduce((s, c) => s + calcReserveAdequacy(c, scenIdx), 0) / filtered.length;` |
| `scen` | `NGFS_SCENARIOS.map((_, si) => {` |
| `multScale` | `1 + (SCENARIO_MULT[si] - 1) * hi / 4;` |
| `warmScale` | `SCENARIO_WARMING[si] * (0.3 + hi * 0.175);` |
| `exportRows` | `useMemo(() => filtered.map(c => ({` |
| `avgSMR` | `filtered.length ? +(filtered.reduce((s, c) => s + calcSMR(c, si), 0) / filtered.length).toFixed(3) : 0;` |
| `avgLE` | `filtered.length ? +(filtered.reduce((s, c) => s + calcLifeExp(c, si), 0) / filtered.length).toFixed(2) : 0;` |
| `avgRA` | `filtered.length ? +(filtered.reduce((s, c) => s + calcReserveAdequacy(c, si), 0) / filtered.length).toFixed(2) : 0;` |
| `totalPVFB` | `filtered.length ? Math.round(filtered.reduce((s, c) => s + +calcPVFB(c, si), 0)) : 0;` |
| `avgBase` | `+(rcs.reduce((s,c) => s + c.baseQ60, 0) / rcs.length).toFixed(5);` |
| `avgClim` | `+(rcs.reduce((s,c) => s + calcClimateMortRate(c, scenIdx), 0) / rcs.length).toFixed(6);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `AGE_BANDS`, `CLIMATE_ZONES`, `COUNTRY_NAMES`, `HORIZONS`, `NGFS_SCENARIOS`, `REGIONS`, `SCENARIO_MULT`, `SCENARIO_WARMING`, `SCEN_COLORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Heat-Attributable Deaths (2023) | — | Lancet Countdown 2023 | Estimated global annual deaths attributable to heat exposure above 1990 baseline temperatures. |
| Longevity Liability Shift (2°C) | — | IFoA Climate Mortality WP 2022 | Reduction in expected lifespan under 2°C scenario relative to no-climate-change baseline, affecting annuity pr |
- **National life tables, climate hazard indices, epidemiological literature** → Hazard factor derivation, mortality table adjustment, liability repricing → **Adjusted mortality curves, reserve sensitivity outputs, longevity risk dashboards**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate-Adjusted Mortality Rate
**Headline formula:** `CAMR = BaselineMR × (1 + Σ HazardImpactᵢ)`
**Standards:** ['Lancet Countdown 2023', 'WHO Heat-Health Evidence Synthesis']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).