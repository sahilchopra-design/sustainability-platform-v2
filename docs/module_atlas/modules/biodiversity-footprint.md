# Biodiversity Footprint
**Module ID:** `biodiversity-footprint` · **Route:** `/biodiversity-footprint` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Portfolio-level biodiversity footprint using ENCORE, IBAT, and Biodiversity Footprint methodology. Covers MSA (Mean Species Abundance) impact, key biodiversity areas, and TNFD LEAP assessment.

> **Business value:** Biodiversity loss is the second planetary boundary after climate. The Kunming-Montreal 30x30 target and TNFD recommendations are creating investor and regulatory pressure for portfolio biodiversity assessment. This module provides the screening and disclosure tools needed for TNFD-aligned nature reporting.

**How an analyst works this module:**
- ENCORE Analysis shows ecosystem service dependencies by sector
- Biodiversity Map overlays operations on global biodiversity hotspots
- IBAT Screen identifies KBAs, protected areas, and critical habitats
- TNFD LEAP walks through Locate, Evaluate, Assess, Prepare steps
- Target Setter aligns with Kunming-Montreal 30x30 and 2030 goals

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BIODIVERSITY_FACTORS`, `Badge`, `BiodiversityFootprintPage`, `Btn`, `COUNTRY_HOTSPOTS`, `GBF_TARGETS`, `INTEGRITY_TREND`, `KpiCard`, `PIE_COLORS`, `PRESSURE_DRIVERS`, `SECTOR_KEYS`, `SPECIES_THREAT_CATEGORIES`, `Section`, `TRANSITION_PATHWAYS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SPECIES_THREAT_CATEGORIES` | 5 | `abbrev`, `count_affected`, `icon`, `portfolio_sectors`, `description` |
| `INTEGRITY_TREND` | 12 | `portfolio_msa`, `benchmark`, `target` |
| `PRESSURE_DRIVERS` | 7 | `contribution_pct`, `trend`, `sectors`, `color` |
| `TRANSITION_PATHWAYS` | 9 | `action`, `msa_reduction`, `timeline`, `investment`, `feasibility` |
| `GBF_TARGETS` | 8 | `target`, `status`, `current`, `pctDone` |
| `COUNTRY_HOTSPOTS` | 13 | `name`, `bii`, `threatened_species`, `protected_area_pct`, `biome` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `n => n == null ? '-' : typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : n;` |
| `scoredHoldings` | `useMemo(() => { return portfolio.map(c => { const sector = mapSector(c.gics_sector \|\| c.sector \|\| 'Financials');` |
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
| `landUseArea` | `useMemo(() => { const sectors = [...new Set(scoredHoldings.map(h => h.sector))];` |
| `base` | `holdings.reduce((sum, h) => sum + h.land_use, 0);` |
| `landSectors` | `useMemo(() => [...new Set(scoredHoldings.map(h => h.sector))], [scoredHoldings]);` |
| `scenarioData` | `useMemo(() => { return sectorMSA.map(s => ({ sector: s.sector, current: +s.totalMSA.toFixed(3), target: +(s.totalMSA * 0.7).toFixed(3), reduction: +(s.totalMSA * 0.3).toFixed(3), }));` |
| `rows` | `scoredHoldings.map(h => [h.company_name \|\| h.name, h.isin, h.sector, h.msa_loss, h.land_use, h.water_stress, h.deforest, h.pollinator, h.speciesImpact.join('; '), h.natureScore, h.status]);` |
| `csv` | `[headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `biodiversity_footprint_${new Date().toISOString().slice(0, 10)}.csv`; a.click();` |
| `data` | `{ date: new Date().toISOString(), portfolio_metrics: metrics, holdings: scoredHoldings.map(h => ({ name: h.company_name \|\| h.name, isin: h.isin, sector: h.sector, msa_loss: h.msa_loss, land_use: h.land_use, water_stress:` |
| `holdingsPct` | `((s.count / scoredHoldings.length) * 100).toFixed(0);` |
| `impactShare` | `((s.totalMSA / scoredHoldings.reduce((sum, h) => sum + h.msa_loss, 0)) * 100).toFixed(0);` |
| `disproportionate` | `parseFloat(impactShare) > parseFloat(holdingsPct) * 1.5;` |
| `aRisk` | `a.msa_loss * 100 + (a.water_stress / 10) + (a.deforest === 'Very High' ? 20 : a.deforest === 'High' ? 10 : a.deforest === 'Medium' ? 5 : 0);` |
| `bRisk` | `b.msa_loss * 100 + (b.water_stress / 10) + (b.deforest === 'Very High' ? 20 : b.deforest === 'High' ? 10 : b.deforest === 'Medium' ? 5 : 0);` |
| `risk` | `(h.msa_loss * 100 + (h.water_stress / 10) + (h.deforest === 'Very High' ? 20 : h.deforest === 'High' ? 10 : h.deforest === 'Medium' ? 5 : 0)).toFixed(1);` |
| `baseMSA` | `(getSectorFactor(h.sector).msa_loss_per_mn * ((h.revenue \|\| 500) / 1000)).toFixed(4);` |
| `combined` | `(bf.water_stress_score * 0.4 + bf.msa_loss_per_mn * 50).toFixed(1);` |

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

MSA = fraction of species richness relative to pristine habitat. Pressures: land use change (dominant), pollution, invasives, climate. STAR metric: investment in habitat restoration reduces STAR score.

**Standards:** ['ENCORE', 'IBAT', 'TNFD V1.0', 'PBAF']
**Reference documents:** ENCORE Exploring Natural Capital Opportunities; IBAT Integrated Biodiversity Assessment Tool; TNFD V1.0 Recommendations (2023); Kunming-Montreal Global Biodiversity Framework

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

The page scores a real equity portfolio (`GLOBAL_COMPANY_MASTER`) for biodiversity
impact using a **sector-factor MSA model**. For each holding it maps GICS sector →
a `BIODIVERSITY_FACTORS` row, then scales the factor by revenue:

```js
revenue   = revenue_usd_mn || revenue_inr_cr × 0.12 || 500        // $M fallback
sliderAdj = msaSliders[isin]/100 ?? 1                              // user what-if
msa_loss  = bf.msa_loss_per_mn × (revenue/1000) × sliderAdj        // MSA.units
land_use  = bf.land_use_ha_per_mn × (revenue/1000) × sliderAdj     // ha
natureScore = clamp(0,100, 100 − (msa_loss×80
              + (water_stress>60 ? 15 : 5)
              + (deforest==='Very High' ? 20 : deforest==='High' ? 10 : 0)))
```

Portfolio metrics: `totalMSA = Σ msa_loss`, `msaPerMn = totalMSA/(totalRevenue/1000)`,
`totalLand = Σ land_use`, `avgWater = mean(water_stress)`, and a GBF completion
`cbdScore = mean(GBF_TARGETS.pctDone)`.

### 7.2 Parameterisation / scoring rubric

`BIODIVERSITY_FACTORS` — 11 GICS sectors, hand-set from ENCORE-style intensity
judgement (MSA loss per $M revenue, land ha/$M, 0–100 water-stress score):

| Sector | MSA loss /$M | Land ha/$M | Water stress | Deforest risk |
|---|---|---|---|---|
| Materials | 1.20 | 18.0 | 68 | Very High |
| Consumer Staples | 0.95 | 22.0 | 75 | Very High |
| Energy | 0.85 | 12.5 | 72 | Medium |
| Utilities | 0.65 | 8.0 | 82 | Medium |
| Real Estate | 0.55 | 8.5 | 45 | Medium |
| Industrials | 0.45 | 5.5 | 48 | Low |
| Cons. Discretionary | 0.35 | 4.0 | 52 | Medium |
| Health Care | 0.22 | 2.0 | 40 | Low |
| Info Technology | 0.12 | 1.0 | 35 | Low |
| Financials | 0.08 | 0.5 | 15 | Low (indirect: High) |
| Comm. Services | 0.05 | 0.3 | 12 | Low |

`natureScore` weights: MSA loss ×80 (dominant), water-stress step 15/5, deforestation
step 20/10/0. `PRESSURE_DRIVERS` (land-use 30%, overexploitation 23%, climate 14%,
pollution 14%, invasives 11%, other 8%) mirror the IPBES global-assessment ranking.
`SPECIES_THREAT_CATEGORIES` use real IUCN Red List counts (CR 8,971; EN 16,118; VU
17,038; NT 8,459). `INTEGRITY_TREND` and `GBF_TARGETS` are hard-coded illustrative
paths.

### 7.3 Calculation walkthrough

1. `mapSector` normalises each holding's GICS sector to a factor row.
2. `msa_loss`/`land_use`/`natureScore` computed per holding, adjustable by an
   ISIN-level slider (`msaSliders`).
3. Portfolio roll-ups: total MSA, MSA per $M revenue, total land, mean water stress.
4. Sector concentration: `impactShare = s.totalMSA/portfolioMSA`,
   `holdingsPct = s.count/n`; a sector is "disproportionate" if
   `impactShare > holdingsPct × 1.5`.
5. Risk rank: `risk = msa_loss×100 + water_stress/10 + deforest step` orders holdings.
6. Scenario tab applies a flat 30% MSA reduction target per sector.

### 7.4 Worked example

A Consumer Staples holding, revenue $8,000M, water-stress 75, deforest Very High,
slider at default (1.0):

| Step | Computation | Result |
|---|---|---|
| MSA loss | 0.95 × (8000/1000) × 1 | 7.60 MSA-units |
| Land use | 22.0 × 8 | 176 ha |
| natureScore penalty | 7.60×80 + 15 + 20 | 643 |
| natureScore | clamp(0,100, 100 − 643) | **0** |

The ×80 MSA weight saturates `natureScore` to zero for any material-impact holding —
so the score is effectively binary (near-100 for Financials/Tech, ~0 for
Materials/Staples) rather than a graded scale. That saturation is the model's key
weakness (see §8).

### 7.5 Data provenance & limitations

- Company identities & revenue are **real** (`GLOBAL_COMPANY_MASTER`); the sector
  factors, `natureScore` weights and threat/pressure tables are **hand-set heuristics**,
  not derived from ENCORE/GLOBIO output.
- MSA loss is linear in revenue with a single sector coefficient — no geolocation,
  no site-level KBA overlay, no supply-chain (Scope-3 nature) tiering, despite the
  guide's IBAT/KBA language.
- `natureScore`'s ×80 weight makes it saturate; `sr()` PRNG appears only for minor
  chart jitter, not for the factors.

**Framework alignment:** ENCORE (sector dependency/impact taxonomy — approximated by
the fixed factor table) · GLOBIO/MSA (Mean Species Abundance as the impact metric —
here a revenue-scaled scalar, not a pressure×area×MSA-loss integral) · TNFD LEAP
(the tabs mirror Locate/Evaluate/Assess/Prepare) · Kunming-Montreal GBF 30×30 &
Target 15 (`GBF_TARGETS` completion) · IUCN Red List (real threat counts).

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Quantify a portfolio's biodiversity footprint (MSA.ha lost)
and dependency risk with geolocated, supply-chain-aware factors — for TNFD/CSRD ESRS
E4 disclosure and nature-risk-adjusted allocation.

**8.2 Conceptual approach.** Replace the single sector coefficient with the
**GLOBIO 4 pressure→MSA** response functions applied to activity data, plus **ENCORE**
dependency materiality and **IBAT/WDPA** site overlays — the approach used by MSCI
Nature/Iceberg Data Lab and the PBAF standard. Impact = Σ pressures × area × MSA-loss
coefficient, not revenue × scalar.

**8.3 Mathematical specification.**
```
MSA_loss_ha = Σ_p Σ_s  A_{s,p} · (1 − MSA_p(intensity_{s,p}))            (GLOBIO)
  p ∈ {land use, N/P deposition, encroachment, climate, water, fragmentation}
Footprint_company = Σ_s (production_s · EF^MSA_{s,region})               (EEIO-linked)
Dependency_score = Σ_es w_es · materiality_es(ENCORE)
NatureScore = 100 · (1 − MSA_loss / MSA_ref) · dependency_adjust          (graded, non-saturating)
KBA_flag = 1 if any asset within WDPA/KBA polygon (IBAT)
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| MSA response curves | MSA_p(·) | GLOBIO 4 (PBL Netherlands) |
| Sector EEIO impact | EF^MSA | EXIOBASE + GLOBIO (Iceberg/CISL) |
| Dependency weights | w_es | ENCORE materiality ratings |
| Site polygons | — | IBAT / WDPA / KBA |
| Reference MSA | MSA_ref | Pristine-baseline (GLOBIO) |

**8.4 Data requirements.** Company production/activity by sector & region, asset
geolocations, EXIOBASE EEIO links, ENCORE ratings, WDPA/KBA polygons. Platform holds
company master + revenue and IUCN counts; GLOBIO curves, EEIO factors and geodata are new.

**8.5 Validation & benchmarking.** Reconcile company footprints against
MSCI/Iceberg/CDC Biodiversité GBS outputs; test monotonicity and non-saturation of
NatureScore; sensitivity on the dominant land-use pressure; KBA overlay precision vs
IBAT ground truth.

**8.6 Limitations & model risk.** MSA is a coarse integrity proxy; EEIO factors are
sector-average and hide intra-sector variance; geolocation of financed assets is
often unavailable. Conservative fallback: sector-mean factor with an explicit "low
data quality" flag (PBAF DQ score) until asset-level data is sourced.

## 9 · Future Evolution

### 9.1 Evolution A — Site-resolved MSA impact from real spatial layers (analytics ladder: rung 1 → 3)

**What.** The module scores a real portfolio (`GLOBAL_COMPANY_MASTER`) through an honest but coarse sector-factor model: `msa_loss = msa_loss_per_mn × revenue/1000 × sliderAdj`, with the `BIODIVERSITY_FACTORS` intensities hand-set from "ENCORE-style intensity judgement" for 11 GICS sectors, and the hotspot/KBA overlays (`COUNTRY_HOTSPOTS`, IBAT screen) as static seed tables. It is revenue-scaled sector averages, not located impact — every company in a GICS sector gets the same intensity. Evolution A moves from sector proxy to asset-location impact.

**How.** (1) Replace sector-average intensities with asset-location screening: join issuer facility locations (the platform's supply-chain and physical-risk tables carry coordinates) against real biodiversity layers — WDPA protected areas, KBA boundaries, and a BII/MSA surface — so an operation *in* a KBA scores differently from a sector peer that isn't (the IBAT screen becomes computed, not seeded). (2) Ground the sector factors in the actual ENCORE dependency-materiality ratings (ENCORE data is accessible) rather than judgement, published per Atlas §8. (3) Wire to the sibling `biodiversity-credits` engine's TNFD LEAP scoring so the "TNFD LEAP walkthrough" tab produces a real disclosure score, not a static checklist. (4) Rung 3: calibrate MSA-loss-per-revenue against a published biodiversity-footprint dataset (e.g. an MSA·km²/€ benchmark) for the overlapping sectors and report the deviation.

**Prerequisites.** Facility-location coverage for portfolio issuers (partial — companies without located assets must fall back to the sector proxy with the resolution tier reported, GLEIF-style); WDPA/KBA layer ingestion; ENCORE ratings sourcing. **Acceptance:** two same-sector holdings with different asset locations produce different MSA loss and KBA flags; a holding with no location data reports sector-proxy tier explicitly; calibration deviation is published, not hidden.

### 9.2 Evolution B — TNFD nature-disclosure copilot (LLM tier 1 → 2)

**What.** Tier 1: a copilot explaining the portfolio's biodiversity screen — "which sectors drive our MSA loss and why?" (land-use-change dominance from `PRESSURE_DRIVERS`), "what does a nature score of 42 mean?", "how do we stand against the 30x30 GBF targets?" — grounded in this Atlas record with the honest disclosure that impacts are sector-factor estimates, not located measurements (until Evolution A). Tier 2 adds tool-driven what-ifs and, via the `biodiversity-credits` engine, real TNFD LEAP and GBF Target 15 scoring for disclosure drafting.

**How.** Tier-1 corpus from this record (§7.1 scoring formula, §7.2 sector-factor rubric); the refusal path scopes claims to portfolio screening, not asset-level nature risk, while the model is sector-proxy. Tier 2 tool schemas over the shared biodiversity-credits routes (`/tnfd-disclosure`, `/gbf-target15`) plus Evolution A's located-screening endpoint; the copilot drafts the TNFD LEAP narrative (Locate/Evaluate/Assess/Prepare) from real scores and flags disproportionate-impact holdings (the page's `impactShare > holdingsPct × 1.5` screen) with tool-computed figures. Disclosure text composes into the report layer.

**Prerequisites.** Copilot router (tier 1); the biodiversity-credits POST triage and Evolution A's located screen (tier 2). **Acceptance:** tier-1 answers label impacts as sector-factor estimates; tier-2 disclosure drafts trace every MSA figure and LEAP score to tool output; asset-level claims are refused until location data backs them.