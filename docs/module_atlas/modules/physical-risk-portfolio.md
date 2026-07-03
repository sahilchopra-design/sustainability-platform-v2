# Physical Risk Portfolio
**Module ID:** `physical-risk-portfolio` · **Route:** `/physical-risk-portfolio` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Asset-level physical climate risk assessment across acute (flood, wildfire, tropical cyclone, storm) and chronic (heat, sea level rise, drought) hazards. Covers 6 SSP scenarios to 2100 with financial loss estimation.

> **Business value:** Quantifies the financial impact of climate-driven natural hazards on the physical asset base. Required for TCFD, ISSB S2, and CSRD physical risk disclosure. Enables risk-informed capital allocation, asset acquisition screening, and insurance adequacy assessment.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSET_CLASSES`, `KpiCard`, `PERILS`, `PORTFOLIO`, `REGIONS`, `REGULATORY_THRESHOLDS`, `SCENARIOS_MAP`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n) => n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${(n / 1e3).toFixed(0)}K`;` |
| `pct` | `(n, d = 1) => `${(n * 100).toFixed(d)}%`;` |
| `REGIONS` | `['North America', 'Europe', 'Asia-Pacific', 'LatAm', 'MENA'];` |
| `value` | `Math.round((sr(i * 17) * 400 + 100) * 1e6);` |
| `perilScores` | `Object.fromEntries(PERILS.map((p, j) => [p, Math.round(sr(i * 9 + j) * 80 + 15)]));` |
| `compositeHazard` | `Math.round(Object.values(perilScores).reduce((a, b) => a + b, 0) / PERILS.length);` |
| `aal` | `Math.round(value * 0.001 * (compositeHazard / 50) * (0.8 + sr(i * 23) * 0.4));` |
| `pml100` | `Math.round(value * 0.08 * (compositeHazard / 50) * (0.9 + sr(i * 31) * 0.2));` |
| `insured` | `sr(i * 7) > 0.35;` |
| `PORTFOLIO` | `isIndiaMode() ? adaptForPhysicalRisk().slice(0, 30).map((c, i) => ({` |
| `scenarioLabels` | `{ current: 'Current', ssp1_26: 'SSP1-2.6 (2050)', ssp2_45: 'SSP2-4.5 (2050)', ssp5_85: 'SSP5-8.5 (2050)', ssp5_2100: 'SSP5-8.5 (2100)' };` |
| `totalExposure` | `filtered.reduce((s, a) => s + a.value, 0);` |
| `totalAAL` | `Math.round(filtered.reduce((s, a) => s + a.aal, 0) * mult);` |
| `totalPML100` | `Math.round(filtered.reduce((s, a) => s + a.pml100, 0) * mult);` |
| `insuredExp` | `filtered.filter(a => a.insured).reduce((s, a) => s + a.value, 0);` |
| `uninsuredAAL` | `Math.round(filtered.filter(a => !a.insured).reduce((s, a) => s + a.aal, 0) * mult);` |
| `highRisk` | `filtered.filter(a => Math.round(a.compositeHazard * mult) > 65);` |
| `byRegion` | `REGIONS.map(r => {` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSET_CLASSES`, `PERILS`, `REGIONS`, `REGULATORY_THRESHOLDS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Flood AAL | `Annual Average Loss` | Industry models | Expected annual flood loss as % of asset value |
| Heat Stress Risk | — | IPCC AR6 | Wet-bulb globe temperature threshold for moderate heat stress |
| SLR Exposure by 2100 | — | SSP5-8.5 | Exposure under high-emissions sea level rise scenario |
| PML | `99.9th percentile loss` | Catastrophe model | Loss in an extreme but plausible catastrophe event |
- **Asset geolocation data** → Hazard map overlay → **Site-level exposure score**
- **IPCC AR6 projections** → Damage function application → **Loss estimate per peril**
- **Financial asset values** → Loss monetisation → **Physical risk VaR**

## 5 · Intermediate Transformation Logic
**Methodology:** IPCC hazard-damage function
**Headline formula:** `PhysicalLoss = AssetValue × HazardIntensity × VulnerabilityFactor × ExposureFraction`
**Standards:** ['IPCC AR6 WGI', 'RMS/AIR industry damage functions', 'TCFD Physical Risk']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).