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
