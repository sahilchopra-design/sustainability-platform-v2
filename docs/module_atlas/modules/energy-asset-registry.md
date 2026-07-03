# Energy Asset Registry
**Module ID:** `energy-asset-registry` · **Route:** `/energy-asset-registry` · **Tier:** B (frontend-computed) · **EP code:** EP-CU1 · **Sprint:** CU

## 1 · Overview
30 assets with carbon intensity, capacity mix, age/retirement, and WRI GPPD cross-reference.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSETS`, `FUEL_COLORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Asset Map','Carbon Intensity by Asset','Capacity Mix','Age & Retirement','WRI GPPD Cross-Reference','Asset Watchlist'];` |
| `sectorAvgCI` | `Math.round(ASSETS.reduce((s,a) => s + a.carbon_intensity, 0) / ASSETS.length);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSETS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Assets | — | Portfolio | Power plants, refineries, LNG terminals |
| WRI GPPD Cross-Ref | — | WRI | Global power plant database |

## 5 · Intermediate Transformation Logic
**Methodology:** Facility-level carbon intensity
**Headline formula:** `CI = AnnualEmissions / AnnualOutput (tCO₂/GWh)`
**Standards:** ['WRI GPPD', 'EPA GHGRP', 'EU ETS EUTL']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).