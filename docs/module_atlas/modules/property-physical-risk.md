# Property Physical Risk
**Module ID:** `property-physical-risk` · **Route:** `/property-physical-risk` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Assesses climate physical hazard risk for real estate assets, integrating CRREM stranding analysis and multi-peril exposure modelling.

> **Business value:** Equips real estate managers and lenders with CRREM-aligned stranding analysis and multi-peril hazard scores to manage physical climate risk in property portfolios.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ADAPTATION_MEASURES`, `Grid`, `HAZARDS`, `HORIZON_OPTIONS`, `KpiCard`, `SSP_OPTIONS`, `Section`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtUsd` | `(v) => v >= 1e6 ? `$${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `$${(v/1e3).toFixed(0)}K` : `$${v}`;` |
| `clamped` | `Math.min(100, Math.max(0, Number(value) \|\| 0));` |
| `val` | `Math.min(100, raw * sspMult * horizonMult);` |
| `composite` | `HAZARDS.reduce((s, h) => s + (adjusted[h.id] \|\| 0), 0) / HAZARDS.length;` |
| `acuteAvg` | `acuteCount > 0 ? acuteSum / acuteCount : 0;` |
| `chronicAvg` | `chronicCount > 0 ? chronicSum / chronicCount : 0;` |
| `compoundFloodSea` | `Math.min(100, (adjusted.flood \|\| 0) * 0.4 + (adjusted.sealevel \|\| 0) * 0.35 + (adjusted.cyclone \|\| 0) * 0.25);` |
| `insuranceMult` | `1 + composite / 100;` |
| `climateAdjPremium` | `basePremium * insuranceMult;` |
| `resilience` | `p.building_resilience_score \|\| (50 + Math.round((sr(idx) * 2 - 1) * 20));` |
| `composites` | `enriched.map(p => p.composite);` |
| `avgComposite` | `composites.reduce((a, b) => a + b, 0) / composites.length;` |
| `mostExposed` | `enriched.reduce((a, b) => a.composite > b.composite ? a : b);` |
| `avgPremium` | `enriched.reduce((s, p) => s + (p.insurance_premium_usd \|\| 50000), 0) / enriched.length;` |
| `totalVaR` | `enriched.reduce((s, p) => s + (p.composite / 100) * (p.gav_usd \|\| p.value_usd \|\| 50e6) * 0.15, 0);` |
| `highFloodZones` | `(floodZoneCounts['A'] \|\| 0) + (floodZoneCounts['AE'] \|\| 0) + (floodZoneCounts['V'] \|\| 0);` |
| `avgResilience` | `enriched.reduce((s, p) => s + p.resilience, 0) / enriched.length;` |
| `totalAdaptCost` | `enriched.reduce((s, p) => {` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ADAPTATION_MEASURES`, `HAZARDS`, `HORIZON_OPTIONS`, `SSP_OPTIONS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio Avg Stranding Year | — | CRREM Engine | Asset-value-weighted mean stranding year for real estate portfolio under 1.5°C pathway. |
| High Physical Hazard Assets (%) | — | Hazard Mapping | Share of portfolio by value with high or extreme composite physical hazard score. |
| Avg EUI (kWh/m²/yr) | — | Energy Audit Data | Portfolio weighted average energy use intensity from asset energy performance certificates. |
- **Asset register + EPC data + CRREM pathways + hazard rasters** → Stranding year calculation; hazard overlay; capex scenario modelling → **Asset-level stranding risk report and capex prioritisation output**

## 5 · Intermediate Transformation Logic
**Methodology:** Stranding Year
**Headline formula:** `Strand = min{t : EUI(t) > CRREM_pathway(t)}`
**Standards:** ['CRREM Global Pathways v2', 'JLL Physical Risk Framework']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).