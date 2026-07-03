# Catastrophe Modelling
**Module ID:** `catastrophe-modelling` · **Route:** `/catastrophe-modelling` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Probabilistic natural catastrophe loss modelling for insurance portfolios. Covers hazard, exposure, vulnerability, and financial modules with exceedance probability curves and ILW pricing.

> **Business value:** Catastrophe models are the foundation of non-life insurance pricing, capital allocation (Solvency II SCR), and reinsurance purchasing. Climate change is modifying hazard intensity and frequency, making cat model recalibration critical for adequate pricing and solvency capital.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `CLIMATE_FACTORS`, `COLORS`, `ConfBadge`, `EP_CURVE_DATA`, `EVENT_NAMES`, `EVENT_SET`, `KPI`, `LOSS_DEVELOPMENT`, `PERILS`, `PORTFOLIOS`, `RDS_SCENARIOS`, `REGIONS`, `TABS`, `TrendArrow`, `WARMING_LEVELS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `pct` | `n => typeof n === 'number' ? n.toFixed(1) + '%' : '--';` |
| `perilIdx` | `Math.floor(s1 * PERILS.length);` |
| `regionIdx` | `Math.floor(s2 * REGIONS.length);` |
| `year` | `1990 + Math.floor(s3 * 35);` |
| `grossLoss_mn` | `Math.round(500 + s4 * 120000);` |
| `insuredRatio` | `0.15 + s5 * 0.65;` |
| `insuredLoss_mn` | `Math.round(grossLoss_mn * insuredRatio);` |
| `fatalities` | `Math.round(s6 * s6 * 15000);` |
| `returnPeriod_est` | `Math.round(10 + s4 * s4 * 500);` |
| `_CAT_MAP` | `Object.fromEntries(MAJOR_CAT_EVENTS.map(e => [e.event_name, e]));` |
| `avgInsured` | `countryEvents.reduce((s, e) => s + (e.insured_losses_usd_bn \|\| 0), 0) / countryEvents.length;` |
| `avgTotal` | `countryEvents.reduce((s, e) => s + (e.total_losses_usd_bn \|\| 0), 0) / countryEvents.length;` |
| `avgFatal` | `countryEvents.reduce((s, e) => s + (e.fatalities \|\| 0), 0) / countryEvents.length;` |
| `EP_CURVE_DATA` | `PORTFOLIOS.map((port, pi) => {` |
| `base` | `port.totalExposure_bn * 1000;` |
| `oepLoss` | `base * (0.001 + Math.pow(1 - ep, 2.5) * (0.15 + sr(pi * 100 + j) * 0.08));` |
| `aepLoss` | `oepLoss * (0.7 + sr(pi * 100 + j + 50) * 0.2);` |
| `climateAdj15` | `oepLoss * (1.08 + sr(pi * 100 + j + 200) * 0.04);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `EVENT_NAMES`, `PERILS`, `PORTFOLIOS`, `RDS_SCENARIOS`, `REGIONS`, `TABS`, `WARMING_LEVELS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Return Periods | — | Exceedance curves | Standard reporting metrics |
| Model Uncertainty | — | Industry norm | Epistemic uncertainty in cat model outputs |
| ILW Pricing | — | Industry practice | Industry Loss Warranty pricing basis |
- **Exposure database** → Spatial hazard overlay → **Site-level loss estimates**
- **Stochastic event set** → Damage function application → **Loss distribution**
- **Loss distribution** → Exceedance probability → **OEP/AEP curves**

## 5 · Intermediate Transformation Logic
**Methodology:** Probabilistic cat model (H-E-V-F)
**Headline formula:** `Loss = Σ(exposure_i × damage_fn(intensity_i)) across stochastic event set`
**Standards:** ['AIR Worldwide', 'RMS', 'ISO 19905', 'Swiss Re CResta']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).