# Biodiversity Footprint
**Module ID:** `biodiversity-footprint` · **Route:** `/biodiversity-footprint` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Portfolio-level biodiversity footprint using ENCORE, IBAT, and Biodiversity Footprint methodology. Covers MSA (Mean Species Abundance) impact, key biodiversity areas, and TNFD LEAP assessment.

> **Business value:** Biodiversity loss is the second planetary boundary after climate. The Kunming-Montreal 30x30 target and TNFD recommendations are creating investor and regulatory pressure for portfolio biodiversity assessment. This module provides the screening and disclosure tools needed for TNFD-aligned nature reporting.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BIODIVERSITY_FACTORS`, `Badge`, `BiodiversityFootprintPage`, `Btn`, `COUNTRY_HOTSPOTS`, `GBF_TARGETS`, `INTEGRITY_TREND`, `KpiCard`, `PIE_COLORS`, `PRESSURE_DRIVERS`, `SECTOR_KEYS`, `SPECIES_THREAT_CATEGORIES`, `Section`, `TRANSITION_PATHWAYS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `n => n == null ? '-' : typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : n;` |
| `revenue` | `c.revenue_usd_mn \|\| c.revenue_inr_cr * 0.12 \|\| 500;` |
| `sliderAdj` | `msaSliders[c.isin] != null ? msaSliders[c.isin] / 100 : 1;` |
| `msa_loss` | `+(bf.msa_loss_per_mn * (revenue / 1000) * sliderAdj).toFixed(3);` |
| `land_use` | `+(bf.land_use_ha_per_mn * (revenue / 1000) * sliderAdj).toFixed(1);` |
| `natureScore` | `Math.max(0, Math.min(100, 100 - (msa_loss * 80 + (water_stress > 60 ? 15 : 5) + (deforest === 'Very High' ? 20 : deforest === 'High' ? 10 : 0))));` |
| `totalMSA` | `scoredHoldings.reduce((s, h) => s + h.msa_loss, 0);` |
| `totalRevenue` | `scoredHoldings.reduce((s, h) => s + (h.revenue \|\| 0), 0);` |
| `msaPerMn` | `totalRevenue > 0 ? totalMSA / (totalRevenue / 1000) : 0;` |
| `totalLand` | `scoredHoldings.reduce((s, h) => s + h.land_use, 0);` |
| `avgWater` | `scoredHoldings.reduce((s, h) => s + h.water_stress, 0) / scoredHoldings.length;` |
| `cbdScore` | `GBF_TARGETS.reduce((s, t) => s + t.pctDone, 0) / GBF_TARGETS.length;` |
| `sectors` | `[...new Set(scoredHoldings.map(h => h.sector))];` |
| `base` | `holdings.reduce((sum, h) => sum + h.land_use, 0);` |
| `landSectors` | `useMemo(() => [...new Set(scoredHoldings.map(h => h.sector))], [scoredHoldings]);` |
| `rows` | `scoredHoldings.map(h => [h.company_name \|\| h.name, h.isin, h.sector, h.msa_loss, h.land_use, h.water_stress, h.deforest, h.pollinator, h.speciesImpact` |
| `csv` | `[headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `biodiversity_footprint` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRY_HOTSPOTS`, `GBF_TARGETS`, `INTEGRITY_TREND`, `PIE_COLORS`, `PRESSURE_DRIVERS`, `SPECIES_THREAT_CATEGORIES`, `TRANSITION_PATHWAYS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| MSA Loss | — | Model | Mean Species Abundance loss attributable to portfolio |
| Key Biodiversity Areas | — | IBAT | Operations in or near KBAs |
| High Biodiversity Risk Sectors | — | ENCORE | Sectors with highest biodiversity dependencies and impacts |
- **Operational footprints** → ENCORE pressure mapping → **Biodiversity impact scores**
- **Site geolocation** → IBAT KBA overlay → **Sensitive area flagging**
- **Biodiversity footprint** → TNFD LEAP process → **Nature-related disclosure**

## 5 · Intermediate Transformation Logic
**Methodology:** MSA-based biodiversity impact
**Headline formula:** `BioFootprint = Σ(activity_area × pressure_factor × MSA_loss); STAR = Species Threat Abatement & Restoration`
**Standards:** ['ENCORE', 'IBAT', 'TNFD V1.0', 'PBAF']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).