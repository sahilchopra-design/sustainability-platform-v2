# FI Concentration Monitor
**Module ID:** `fi-concentration-monitor` · **Route:** `/fi-concentration-monitor` · **Tier:** B (frontend-computed) · **EP code:** EP-CT5 · **Sprint:** CT

## 1 · Overview
Sector, country, and single-name limits with HHI analysis, traffic light monitoring, and breach history.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BREACH_LOG`, `COUNTRY_LIMITS`, `Card`, `SECTOR_LIMITS`, `SINGLE_NAME`, `TABS`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `SECTOR_LIMITS` | `HIGH_IMPACT_SECTORS.map((s, i) => {` |
| `limit` | `Math.round(2000 + sr(i * 7) * 6000);` |
| `current` | `Math.round(limit * (0.4 + sr(i * 11) * 0.55));` |
| `COUNTRY_LIMITS` | `GEOGRAPHIC_REGIONS.map((r, i) => {` |
| `limit` | `Math.round(3000 + sr(i * 7) * 8000);` |
| `current` | `Math.round(limit * (0.35 + sr(i * 13) * 0.6));` |
| `limit` | `Math.round(200 + sr(i * 7) * 800);` |
| `current` | `Math.round(limit * (0.5 + sr(i * 11) * 0.45));` |
| `total` | `SECTOR_LIMITS.reduce((s, l) => s + l.current, 0);` |
| `total` | `COUNTRY_LIMITS.reduce((s, l) => s + l.current, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Sector Limits | — | Risk framework | One per NACE sector |
| HHI (sector) | — | Calculated | Moderate concentration |

## 5 · Intermediate Transformation Logic
**Methodology:** Concentration limit monitoring
**Headline formula:** `HHI = Σ(share_i²); Utilization = CurrentExposure / Limit`
**Standards:** ['Basel IV Large Exposures', 'Internal risk framework']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).