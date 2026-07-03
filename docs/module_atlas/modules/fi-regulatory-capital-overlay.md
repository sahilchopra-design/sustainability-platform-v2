# FI Regulatory Capital Overlay
**Module ID:** `fi-regulatory-capital-overlay` · **Route:** `/fi-regulatory-capital-overlay` · **Tier:** B (frontend-computed) · **EP code:** EP-CT4 · **Sprint:** CT

## 1 · Overview
Basel IV RWA with climate adjustment, Pillar 2 add-on estimation, stress capital buffer, and ECB/BoE alignment.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSET_CLASSES`, `Card`, `NGFS_STRESS`, `TABS`, `TIMELINE`, `TOTAL_ADJ`, `TOTAL_RWA`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Capital Requirements', 'Risk-Weighted Assets', 'Pillar 2 Climate Add-on', 'Stress Capital Buffer', 'ECB/BoE Alignment', 'Timeline'];` |
| `TOTAL_RWA` | `ASSET_CLASSES.reduce((s, a) => s + a.rwa, 0);` |
| `TOTAL_ADJ` | `ASSET_CLASSES.reduce((s, a) => s + a.climateAdj, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSET_CLASSES`, `NGFS_STRESS`, `TABS`, `TIMELINE`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Climate P2R Addon | — | ECB SREP | Pillar 2 climate risk add-on |
| Output Floor Impact | — | Basel IV | Binding for 30% of portfolios |

## 5 · Intermediate Transformation Logic
**Methodology:** Climate-adjusted regulatory capital
**Headline formula:** `RWA_climate = RWA_base + ClimateAddon; CET1_ratio = CET1 / RWA_climate`
**Standards:** ['Basel IV', 'ECB SREP', 'BoE PRA']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).