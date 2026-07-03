# Physical Risk Early Warning
**Module ID:** `physical-risk-early-warning` · **Route:** `/physical-risk-early-warning` · **Tier:** B (frontend-computed) · **EP code:** EP-CG4 · **Sprint:** CG

## 1 · Overview
Real-time alert system with 12 active alerts, 72-hour forecast, historical event library, and response protocols.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALERTS`, `FORECAST_EVENTS`, `HISTORICAL`, `PROTOCOLS`, `TABS`

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALERTS`, `FORECAST_EVENTS`, `HISTORICAL`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Active Alerts | — | Simulated | Current portfolio exposure alerts |
| Forecast Horizon | — | ECMWF | Short-range weather forecast for asset locations |

## 5 · Intermediate Transformation Logic
**Methodology:** Threshold-based alert generation
**Headline formula:** `Alert = HazardIntensity > Threshold(asset_type, peril)`
**Standards:** ['NOAA', 'ECMWF', 'EM-DAT']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).