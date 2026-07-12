## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry defines a **Biodiversity Footprint
> Score** formula, `BFS = Σᵢ (Impact Driverᵢ × Ecosystem Sensitivityᵢ × Areaᵢ)`, sourced to
> GLOBIO/GBS (CDC Biodiversité) methodology, plus a full TNFD LEAP workflow (Locate/Evaluate/
> Assess/Prepare) fed by ENCORE, IBAT and SBTN data. **None of this is implemented.**
> `NatureHubPage.jsx` (94 lines) is a flat, filterable table of 55 named companies with every
> numeric field an independent `sr()` PRNG draw — there is no impact-driver × sensitivity × area
> product anywhere in the file, no ENCORE dependency matrix, no IBAT spatial overlay, and no LEAP
> step logic beyond four cosmetic tab labels borrowed from the framework's name.

### 7.1 What the module computes

`ITEMS` — 55 rows, each a real-world company name (Cargill, Shell, Nestlé, Marriott, …, names
recycled cyclically via `names[i % names.length]` once past index 54) — cross-joined with a
`sr()`-seeded sector (`F1`, 10 sectors) and biome/region (`F2`, 10 regions). Twelve numeric fields
per row (`biodivScore`, `speciesImpact`, `habitatLoss`, `dependency`, `deforestRisk`, `waterDep`,
`pollinDep`, `soilDep`, `disclosure`, `revAtRisk`) and two booleans (`tnfd`, `sbtn`) are each drawn
from an *independent* `sr(i×k)` call (k ∈ {3,7,11,13,17,19,23,29,31,37,41,43,47,59}) — meaning
**no field is derived from any other**: `biodivScore` has no algebraic relationship to
`habitatLoss`, `dependency`, or `deforestRisk` despite the UI juxtaposing them as if correlated
(e.g. the "Biodiversity vs Revenue at Risk" scatter plot).

### 7.2 Parameterisation

| Field | Formula | Range |
|---|---|---|
| `biodivScore` | `sr(i×11)×60+20` | 20–80 |
| `speciesImpact` | `floor(sr(i×13)×50+5)` | 5–54 |
| `habitatLoss` | `sr(i×17)×40+5` | 5–45% |
| `dependency` | `sr(i×19)×80+10` | 10–90 |
| `deforestRisk` | `sr(i×23)×60+5` | 5–65 |
| `waterDep`/`pollinDep`/`soilDep` | `sr()×{70,50,60}+{15,5,10}` | independent |
| `tnfd` / `sbtn` (boolean) | `sr(i×41)>0.3` / `sr(i×43)>0.35` | ~70%/~65% true |
| `disclosure` | `sr(i×47)×40+40` | 40–80 |

All ranges are round-number synthetic bands with no cited source; the guide's GLOBIO/GBS/ENCORE/
IBAT citations do not attach to any specific constant in this list.

### 7.3 Calculation walkthrough

1. Filter/sort/paginate `ITEMS` by search text, sector (`F1`), region (`F2`).
2. **Dashboard tab** — KPI strip is arithmetic means/counts over the *filtered* set (`avg biodivScore`,
   `TNFD Aligned` count, `avg habitatLoss`, `SBTN Committed` count) — legitimate aggregation, but
   over inputs that are themselves uncorrelated random numbers.
3. **`TS` time series** (12 points, 2014–2025) — three more independent `sr()` series
   (`v1`=Biodiv Index, `v2`=Habitat %, `v3`=Threat Level) with **no connection to `ITEMS`** at all;
   it is a decorative trend chart, not a rollup of the entity data.
4. **Dependency Analysis tab** — per-sector mean of `dependency`; per-service mean of
   `waterDep`/`pollinDep`/`soilDep` across the filtered set — correct aggregation mechanics, random
   underlying data.
5. **Mitigation Tracker tab** — counts/means of `tnfd`, `sbtn`, `disclosure`, and a
   `deforestRisk>30` threshold count; a bar chart of the first 15 filtered rows' `disclosure` vs
   `deforestRisk` (again, two uncorrelated PRNG series plotted together).
6. Row-expand panel renders a 6-axis radar (`Biodiv`, `Habitat=100−habitatLoss`, `Dependency`,
   `Deforest`, `Disclosure`, `Water`) purely for visual effect — no weighting or compositing.

### 7.4 Worked example

Row `i=0` ("Cargill"): `s_sector = sr(0)=0.7096` → `floor(0.7096×10)=7` → `F1[7]="Pharma"`
(Cargill mapped to Pharma sector purely by PRNG collision — illustrates that sector assignment is
decorrelated from the real company). `biodivScore = sr(11)×60+20`: `sin(12)=-0.5366`,
×10000=-5366.3, `frac(-5366.3)` in JS `x-Math.floor(x)` → `Math.floor(-5366.3)=-5367`, so
`frac = -5366.3-(-5367)=0.7`. `biodivScore = 0.7×60+20 = 62.0`. `speciesImpact = floor(sr(13)×50+5)`:
`sin(14)=0.9906`, ×10000=9906.7, frac=0.6733 → `floor(0.6733×50+5)=floor(38.67)=38`. These two
"related" nature metrics for the same company (62.0 biodiversity score, 38 species impacted) have
no algebraic link — they are simply two different PRNG seeds.

### 7.5 Data provenance & limitations

- **100% synthetic.** No `fetch`/API call exists in the file; no ENCORE, IBAT, GBS, or SBTN dataset
  is loaded. All 12 numeric fields per entity are independent `sr(seed)=frac(sin(seed+1)×10⁴)` draws.
- Company names are real (55 recognisable agribusiness/mining/consumer/energy/hospitality/chemicals
  firms) but every metric attached to them is fabricated — this is the platform's highest-risk
  presentation pattern: real entity + fake number, easy to mistake for a real assessment.
- The scatter/bar juxtapositions (biodiversity vs. revenue-at-risk, disclosure vs. deforestation
  risk) visually imply correlation between variables that are mathematically independent draws.

**Framework alignment:** TNFD LEAP — tab names only (Locate/Evaluate/Assess/Prepare is not even
literally used as the tab set; actual tabs are Overview/Species & Habitats/Dependency
Analysis/Mitigation Tracker) · ENCORE, IBAT, GBS, SBTN — named in the guide, absent from code.

## 8 · Model Specification — Biodiversity Footprint Score (BFS)

**Status: specification — not yet implemented in code.** The guide's formula
(`BFS = Σᵢ Impact Driverᵢ × Sensitivityᵢ × Areaᵢ`) is a real, well-established approach (it mirrors
CDC Biodiversité's **Global Biodiversity Score** and the **GLOBIO** MSA-loss model) but has zero
implementation; this spec describes how to build it.

**8.1 Purpose & scope.** Score portfolio-company biodiversity impact per operational site,
aggregating to a company-level footprint comparable across sectors, for SBTN Step 1 scoping and
TNFD Metrics & Targets disclosure.

**8.2 Conceptual approach.** Compute impact in **MSA·km² lost** (Mean Species Abundance, the
GLOBIO/GBS standard unit) by combining a sector/activity-specific impact-driver intensity with a
site-specific ecosystem sensitivity weight and the disturbed area — the same architecture as CDC
Biodiversité's GBS and consistent with the **ENCORE** dependency/impact taxonomy for driver
selection (land-use change, water use, GHG, pollution, disturbance).

**8.3 Mathematical specification.**
```
Driverᵢ,d          = activity intensity of driver d at site i (e.g. ha converted, m³ water withdrawn)
Sensitivityᵢ,d      = MSA-loss coefficient for driver d in site i's biome (GLOBIO regression coefficients)
SiteImpactᵢ         = Σ_d Driverᵢ,d × Sensitivityᵢ,d                    [MSA·km²]
CompanyBFS          = Σᵢ SiteImpactᵢ  (own operations) + Σⱼ SupplyChainWeightⱼ × SiteImpactⱼ (Tier-1 suppliers)
CriticalHabitatFlag = 1{ site i intersects an IUCN KBA / IBAT critical-habitat polygon }
```
| Parameter | Calibration source |
|---|---|
| `Sensitivityᵢ,d` (MSA-loss per driver per biome) | GLOBIO model coefficients (PBL Netherlands, public) |
| `Driverᵢ,d` inputs | Company-reported land-use/water/emissions data, or ENCORE sector-average intensity as fallback |
| `CriticalHabitatFlag` | IBAT spatial query (IUCN/BirdLife/UNEP-WCMC) against site lat/long |
| `SupplyChainWeightⱼ` | Spend-based or physical-flow allocation from supply-chain mapping |

**8.4 Data requirements.** Site-level geocoordinates and land-use/water/emissions activity data
(often absent — realistic fallback is sector-average ENCORE intensity by NAICS/GICS code); GLOBIO
sensitivity layers (public download, PBL Netherlands); IBAT API access (paid, IUCN/BirdLife/
UNEP-WCMC) for critical-habitat overlay — the platform has no current IBAT integration.

**8.5 Validation & benchmarking plan.** Compare company-level BFS against CDC Biodiversité's
published GBS scores for overlapping constituents (large caps with public GBS results); sanity
check sector ranking against known high-impact sectors (mining, agriculture, forestry should rank
above tourism, consumer staples) as a directional test.

**8.6 Limitations & model risk.** GLOBIO sensitivity coefficients are regional averages, not
site-specific field measurements; supply-chain attribution requires spend or physical-flow data
most companies do not disclose, forcing reliance on sector-average proxies that mute company-level
differentiation; without real IBAT access, critical-habitat proximity cannot be verified and should
be flagged as "unknown" rather than defaulted to false.
