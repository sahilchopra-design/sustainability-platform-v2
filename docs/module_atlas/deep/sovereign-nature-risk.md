## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide states `Nature Risk Score = (Biodiversity Loss Rate ×
> 0.35) + (Ecosystem Dependence × 0.35) + (Protection Gap × 0.30)`. **The code does not compute
> `natRisk` from `bii`, `natGdp`, or `protArea` at all** — `natRisk`, `physRisk`, and `transRisk` are
> each an *independent* `sr()` draw with no arithmetic relationship to the biodiversity-intactness,
> GDP-dependence, or protected-area fields displayed elsewhere on the same page. A country can (and,
> per the worked example below, does) show near-maximum biodiversity intactness alongside a
> mid-to-high composite nature-risk score, which the stated formula would make structurally
> impossible. Everything below documents the code as it actually behaves.

### 7.1 What the module computes

For 60 countries (`COUNTRIES_RAW`), seed `s = i×7 + 3`, the generator produces ~25 independently
seeded fields per country, split into four unconnected groups:

```
Ecosystem condition:  bii = 45+sr(s)×50            (Biodiversity Intactness Index, 45–95)
                       natGdp = 3+sr(s+1)×52        (% GDP dependent on nature, 3–55%)
                       protArea = 5+sr(s+2)×35      (% land/sea protected, 5–40%)
                       speciesRich = 800+sr(s+3)×14000
                       deforest = sr(s+4)×4.5        (annual deforestation %)
                       waterStress, soilDeg, marineHealth, pollution — similarly independent draws

Risk scores (INDEPENDENT of the above):
                       natRisk   = round(15+sr(s+9)×70)
                       physRisk  = round(10+sr(s+10)×80)
                       transRisk = round(10+sr(s+11)×70)

Breakdowns: ecoBreak (6 ecosystems), sectorBreak (5 sectors), svcValuation (10 ecosystem
services, $Bn each), gbfProgress (23 GBF targets, % complete each) — all independent sr() draws.
```

### 7.2 Parameterisation

| Field | Range | Provenance |
|---|---|---|
| `bii` (Biodiversity Intactness Index) | 45–95 | Synthetic; real BII methodology (Natural History Museum/PREDICTS) is a modelled ratio of remaining vs. original species abundance, 0–100% |
| `natRisk`/`physRisk`/`transRisk` | 15–85 / 10–90 / 10–80 | Synthetic, independent of `bii`/`natGdp`/`protArea` despite the guide's stated formula |
| `protArea` | 5–40% | Synthetic; compared against the real Kunming-Montreal GBF **Target 3 ("30×30")** threshold in the `thirtyByThirty` field (`protArea≥30 ⇒ 'On Track'`) — this one downstream comparison is genuinely formulaic |
| `gbfProgress` per target | 0–100% × 23 targets | Synthetic; the 23 target *names* are the real Kunming-Montreal GBF targets (Dec 2022) |
| `natureLossGdpImpact` | 0.5–8.5% | Synthetic; loosely evokes the real 2021 Swiss Re Institute estimate that ~$44tn (>50% of global GDP) is moderately/highly nature-dependent, but not calibrated to it |

### 7.3 Calculation walkthrough

1. **Per-country generation** — all fields are produced once in `genCountries()` at module load
   using disjoint seed offsets (`s+0` through `s+125`), so no field is derived from another except
   `thirtyByThirty` (`protArea≥30`) and the annual BII time series (`annualBii`, a small deterministic
   decay off the base `bii` value: `bii − k×0.4 + noise`, `k`=years since 2018).
2. **Aggregation across the 60-country table** — page-level KPIs (`avgBII`, `avgNatGdp`,
   `totalSpecies`, `totalThreatened`, `avgNatRisk`, `avgWater`, `avgPolicy`, `totalInvest`,
   `submittedPct`) are simple means/sums over `COUNTRIES`, most guarded with
   `COUNTRIES.length ? … : 0` or `Math.max(1, COUNTRIES.length)`.
3. **Sector/ecosystem breakdown views** — `radarData` and `sectorData`/`svcData` slice a selected
   country's `ecoBreak`/`sectorBreak`/`svcValuation` objects for radar and bar charts.
4. **Top-risk / heatmap rankings** — `topRisk` and `heatmapCountries` sort by `natRisk` descending
   (top 20/25), independent of every other displayed field per the mismatch above.
5. **GBF dashboard** — `submittedPct` counts countries with `nbsapStatus==='Submitted'` (National
   Biodiversity Strategy and Action Plan status, one of 4 categorical states assigned by `sr()`).

### 7.4 Worked example — Brazil (index 0)

`s = 0×7+3 = 3`.

| Field | Formula | `sr()` value | Result |
|---|---|---|---|
| `bii` | `45+sr(3)×50` | 0.9752 | **93.8** (near-maximum intactness) |
| `natGdp` | `3+sr(4)×52` | 0.7573 | **42.4%** |
| `protArea` | `5+sr(5)×35` | 0.8452 | **34.6%** → `thirtyByThirty = 'On Track'` |
| `natRisk` | `15+sr(12)×70` | 0.6706 | **62** (moderate-high) |
| `physRisk` | `15+sr(13)×80`→`10+sr(13)×80` | 0.0728 | **16** (low) |
| `transRisk` | `10+sr(14)×70` | 0.8654 | **71** (high) |

Brazil scores 93.8/100 on intactness and is already past the 30×30 protection threshold, yet its
composite `natRisk` (62) is materially higher than its `physRisk` (16) — the two are unrelated
draws, so the composite cannot be read as an aggregation of the displayed ecosystem-condition
fields the way the guide's formula implies.

### 7.5 Companion analytics

- **GBF Target tracker** — 23 real Kunming-Montreal targets with a per-country % complete; useful as
  a checklist UI even though the completion percentages are synthetic.
- **TNFD LEAP status** — each country tagged with one of the four real TNFD LEAP phases (Locate,
  Evaluate, Assess, Prepare) — categorical, randomly assigned, descriptive only.
- **Ecosystem service valuation** — 10 real service categories (carbon sequestration, water
  purification, pollination, etc.) each given a synthetic $Bn value; summed to `ecoServiceTotal`,
  loosely evoking (without replicating) TEEB/Costanza-style ecosystem-service valuation studies.
- **Sovereign bond linkage** — `sovSpread` and `bondHolding` attach a synthetic sovereign credit
  spread and portfolio bond exposure per country, letting the page pretend to link nature risk to
  bond pricing, though no actual spread-decomposition model connects the two.

### 7.6 Data provenance & limitations

- **100% synthetic dataset** generated by `sr(seed)=frac(sin(seed+1)×10⁴)`; no IPBES, WWF Living
  Planet, IUCN Red List, or GBF monitoring data is ingested despite being named in the guide.
- The composite risk scores (`natRisk`/`physRisk`/`transRisk`) are decorrelated from the
  ecosystem-condition fields shown alongside them — a reader could reasonably (and incorrectly)
  assume causality between e.g. deforestation rate and nature risk score; none exists in code.
- `creditRating` and `incomeClass` per country are independently randomly assigned and are not
  joined to any real sovereign rating — do not use for cross-referencing against the platform's
  other sovereign modules' rating fields (which use a different, hand-curated `RATING_BASE`).
- Threatened-species counts (`threatSpecies.cr/en/vu/nt`) are independent random draws, not sourced
  from the IUCN Red List despite the guide citing it.

**Framework alignment:** Kunming-Montreal Global Biodiversity Framework (real 23-target list
reproduced verbatim; completion % synthetic) · TNFD LEAP approach (real 4-phase taxonomy, randomly
assigned) · IPBES/WWF Living Planet Index (named in guide as data source, not implemented) — see §8
for the model specification a production nature-risk score would need.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Produce a defensible sovereign nature-risk score usable for sovereign bond ESG integration and
TNFD-aligned country screening, replacing the current decorrelated random `natRisk` field with a
score genuinely built from the ecosystem-condition fields already on the page.

### 8.2 Conceptual approach

Adopt a **dependency-weighted exposure model**, mirroring (1) the **Swiss Re Institute Biodiversity
and Ecosystems Services Index (BES Index)**, which combines land-use intactness with sector
economic dependence to flag "fragile" economies, and (2) **WWF/Global Canopy ENCORE**, which maps
sector-level economic activity to ecosystem-service dependence and rates exposure High/Medium/Low
per dependency. Both are the standard nature-risk-screening approaches used by asset managers today
and require no proprietary calibration — only a documented dependency-weight matrix.

### 8.3 Mathematical specification

```
Biodiversity loss component:
  LossScore_c = 100 − BII_c                                     // higher BII → lower loss score

Ecosystem dependence component:
  DependScore_c = Σ_sector (GDP_share_sector,c × ENCORE_dependence_sector)   // 0–100, sector-weighted

Protection gap component:
  GapScore_c = max(0, 30 − ProtectedArea_c) / 30 × 100           // 0 at 30%+ coverage (GBF Target 3)

Composite:
  NatureRisk_c = 0.35×LossScore_c + 0.35×DependScore_c + 0.30×GapScore_c     // per guide's own weights
```

| Parameter | Calibration source |
|---|---|
| Pillar weights (0.35/0.35/0.30) | As stated in this module's own MODULE_GUIDES entry — currently unimplemented, adopt as-is |
| `ENCORE_dependence_sector` | WWF/Global Canopy ENCORE tool — publishes materiality ratings (Very High…Very Low, mappable to 0–100) per sector × ecosystem service |
| 30% protection threshold | Kunming-Montreal GBF Target 3 ("30×30"), Dec 2022 |
| BII baseline | Natural History Museum / PREDICTS project global BII layers (0–100%, country-aggregated) |

### 8.4 Data requirements

| Field | Source (free/vendor) | Already in platform? |
|---|---|---|
| Country BII | NHM PREDICTS (free, gridded — needs country aggregation) | No |
| Sector GDP dependence | World Bank WDI sector value-added + ENCORE dependency ratings (free) | Partial — sector GDP shares generally available; ENCORE mapping not ingested |
| Protected area % | UNEP-WCMC Protected Planet (free) | No — `protArea` currently synthetic |
| GBF NBSAP submission status | CBD Secretariat NBSAP tracker (free) | No |

### 8.5 Validation & benchmarking plan

- Reconcile country BII against NHM's published national aggregates for the top 20 countries by
  bond issuance; target correlation ≥0.7 given known aggregation-method differences.
- Cross-check `DependScore` ranking against Swiss Re's BES Index country tier list (published for
  ~130 countries) — expect broad agreement on which economies are "fragile."
- Sensitivity test: swap ENCORE materiality mapping granularity (sector-level vs. sub-sector) and
  confirm composite score moves <5 points for diversified economies.

### 8.6 Limitations & model risk

- BII and protected-area data update infrequently (annual at best); the composite should carry a
  data-vintage tag, not be presented as real-time.
- ENCORE dependence ratings are qualitative (Very High…Very Low) — converting to a 0–100 scale
  requires a documented, disclosed mapping to avoid false precision.
- Nature risk is spatially heterogeneous within a country (a single national score masks regional
  hotspots); this specification is necessarily a coarse sovereign-level proxy, appropriate for
  portfolio screening but not asset-level underwriting.
