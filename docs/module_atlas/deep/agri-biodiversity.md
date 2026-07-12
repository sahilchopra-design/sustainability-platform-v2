## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide headlines a **Biodiversity Intactness Index (BII)**
> `= (Σ Species_observed_i/Species_expected_i)/n_sites` and a **monetised pollinator value**
> `= Crop_yield × Pollination_dependency × Price_per_tonne`. **Neither is implemented.** The code
> uses **MSA (Mean Species Abundance)** as the headline biodiversity metric (a *different*
> Netherlands-PBL index, drawn as a random 0.2–0.9 value, not computed from observed/expected
> richness), and pollinator "value" is never monetised — `pollinatorDependency` is a synthetic
> 10–90 score and `neonicExposure` a 0–8 index. Sections below document the actual code.

### 7.1 What the module computes

Four tabs over 60 synthetic agricultural operations (`genOps(60)`), each carrying biodiversity,
pollinator and soil attributes plus optional biodiversity-credit participation. All operation
fields are random draws from the platform PRNG `sr(s)=frac(sin(s+1)×10⁴)`:

| Field | Formula | Range |
|---|---|---|
| `msaScore` | `0.2 + sr·0.7` | 0.20–0.90 |
| `speciesRichness` | `15 + sr·185` | 15–200 |
| `habitatQuality` | `20 + sr·75` | 20–95 |
| `pollinatorDependency` | `10 + sr·80` | 10–90 % |
| `neonicExposure` | `sr·8` | 0–8 |
| `microbialDiversity` | `2 + sr·6` | 2–8 |
| `earthwormDensity` | `20 + sr·280` | 20–300 |
| `soilOrgMatter` | `1.5 + sr·5.5` | 1.5–7 % |

Derived ratings: `biodivRating` = High if MSA ≥ 0.70, Moderate ≥ 0.45, else Low;
`pollinatorRisk` = High if neonic > 5, Medium > 2.5, else Low;
`practiceScore = round(practicesAdopted.length / 12 × 100)`.

### 7.2 Parameterisation / scoring rubric

Reference lists are hand-authored: 20 countries, 15 crop types, 12 regenerative practices
(No-Till, Cover Cropping, Hedgerow, Wildflower Strips, IPM, Agroforestry, …), 15 pollinator-
dependent crops, 6 neonicotinoids (Imidacloprid, Clothianidin, Thiamethoxam, …), 8 soil
indicators, 8 biodiversity-credit pilots (ValueNature, TNFD Aligned, Biodiversity Net Gain,
Wallacea Trust, Plan Vivo Biodiv, …). Practice adoption per op: each of the 12 practices is
included when `sr(i·37+pi·7) > 0.5` (~50% incidence, independent of MSA).

**Biodiversity credits:** an op participates when `sr(i·71+31) > 0.55`; if so,
`creditPrice = 5 + sr·25` ($5–30/credit) and

```
annualCreditPotential = floor(hectares × msaScore × 0.5)      // credits/yr
```

so credit generation scales with farm size × biodiversity quality — the one economically
meaningful formula in the module. Pilot-level `avgPrice = 8 + index×2 + sr·5` (a deterministic
per-pilot price ladder).

### 7.3 Calculation walkthrough

1. Filters (crop/country/rating/search) → `filtered` set; portfolio KPIs are simple means:
   `avgMSA`, `avgSpecies`, `avgHabitat`, `highPct` (% MSA ≥ 0.70), `avgNeonic`, `totalCredits`
   (Σ annualCreditPotential), `pilotPct`.
2. **Trends** use pre-seeded per-op time series: `yearlyMSA[yi] = msaScore − 0.05 + sr·0.03·yi`
   and `yearlySpecies[yi] = speciesRichness − 5 + sr·3·yi` over 2019–2026 — a widening random
   drift, not a modelled recovery. `msaTrend` averages these across the filtered set.
3. **Pollinator tab** shows a hard-coded corridor before/after table (Pollinator Visits
   100→165, Colony Survival 60→82, Yield Impact 0→15) and a seeded `pollinatorTrend`.
4. **Credit market tab** aggregates by pilot (`ops`, `credits`, `avgPrice`).

### 7.4 Worked example — credit potential

Op with `hectares = 1,200`, `msaScore = 0.68`, participating in a credit pilot at
`creditPrice = $18/credit`:

| Step | Computation | Result |
|---|---|---|
| Biodiv rating | 0.68 < 0.70 | **Moderate** |
| Annual credit potential | floor(1200 × 0.68 × 0.5) | **408 credits/yr** |
| Notional annual value | 408 × $18 | **$7,344/yr** |

(The dollar product is illustrative — the page reports credit *counts* and prices separately,
not their product.)

### 7.5 Data provenance & limitations

- **Entirely synthetic:** all 60 operations and every metric are seeded PRNG draws; no real
  farm, MSA, species-survey or neonic-residue data is ingested.
- **Metric substitution:** MSA (PBL/GLOBIO framework) replaces the guide's BII (NHM/PREDICTS
  framework) — related but distinct intactness indices; neither is *computed* from underlying
  species data here (MSA is a random scalar).
- No pollinator-value monetisation, no crop-yield or price data, no dependency-weighted yield-
  loss estimate — the guide's `Crop_yield × dependency × price` formula is absent.
- Practice adoption and biodiversity scores are independent draws, so a high-practice farm need
  not show high MSA (a real regenerative-agriculture dataset would correlate them).
- Time trends are random walks; the corridor before/after figures are editorial constants.

### 7.6 Framework alignment

- **MSA / GLOBIO (PBL Netherlands)** — Mean Species Abundance expresses local biodiversity
  intactness on 0–1 (1 = undisturbed); the module uses it as the headline rating basis. Real
  MSA is derived from land-use/pressure response functions, not a single random draw.
- **TNFD LEAP** — the operation registry (Locate assets, Evaluate dependencies via practices,
  Assess pollinator/soil risk) loosely mirrors the LEAP workflow, though no formal LEAP scoring
  is produced.
- **IPBES 2019 Global Assessment** — cited for ecosystem-service valuation and the pollinator-
  decline narrative; here it motivates the pollinator tab qualitatively.
- **USDA NRCS Soil Health Framework** — the 8 soil indicators (microbial biomass, fungal:
  bacterial ratio, earthworm density, mycorrhizal colonisation, enzyme activity, respiration…)
  track NRCS's soil-health dimensions; scores are synthetic 20–95 indices.
- **Biodiversity credit standards (Wallacea Trust, Plan Vivo Biodiv, UK BNG)** — the 8 credit
  pilots reference emerging biodiversity-credit methodologies; `annualCreditPotential` is a
  size×quality proxy, not any single standard's crediting calculation.
