# Agricultural Biodiversity
**Module ID:** `agri-biodiversity` · **Route:** `/agri-biodiversity` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Quantifies ecosystem services, pollinator health, and soil biodiversity metrics for agri-sector portfolios using TNFD LEAP methodology, IPBES ecosystem service valuation, and USDA NRCS soil health indicators. Assesses biodiversity intactness across agri-holdings and links species richness decline to financial exposure. Supports TNFD D4 disclosure and EU Biodiversity Strategy 2030 alignment.

> **Business value:** Agricultural biodiversity metrics directly link ecosystem health to financial performance: declining BII and pollinator populations translate to quantifiable yield and revenue risk. Soil biodiversity scores serve as leading indicators of long-term land productivity, enabling portfolio managers to engage with agri-borrowers on regenerative practices before impairment materialises.

**How an analyst works this module:**
- Load agri-portfolio holdings with GPS centroids
- LEAP Locate tab maps biodiversity sensitive areas and protected zones
- Pollinator Health tab shows colony density trend and yield dependency
- Soil Biodiversity tab scores each holding on NRCS composite
- Financial Exposure tab monetises ecosystem service decline
- TNFD D4 tab generates dependency and impact disclosures

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `COLORS`, `COUNTRIES`, `CREDIT_PILOTS`, `CROP_TYPES`, `Card`, `KPI`, `NEONICS`, `OPS`, `POLLINATOR_CROPS`, `PRACTICES`, `Pill`, `SOIL_INDICATORS`, `TABS`, `YEARS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `crop` | `CROP_TYPES[Math.floor(s1*CROP_TYPES.length)];` |
| `country` | `COUNTRIES[Math.floor(s2*COUNTRIES.length)];` |
| `hectares` | `Math.floor(50+s3*4500);` |
| `msaScore` | `+(0.2+s4*0.7).toFixed(2);` |
| `speciesRichness` | `Math.floor(15+s5*185);` |
| `habitatQuality` | `Math.floor(20+s6*75);` |
| `practicesAdopted` | `PRACTICES.filter((_,pi)=>sr(i*37+pi*7)>0.5);` |
| `pollinatorDependency` | `Math.floor(10+sr(i*41+17)*80);` |
| `neonicExposure` | `+(0+sr(i*43+19)*8).toFixed(1);` |
| `wildflowerCoverage` | `Math.floor(sr(i*47+21)*25);` |
| `microbialDiversity` | `+(2+sr(i*53+23)*6).toFixed(1);` |
| `earthwormDensity` | `Math.floor(20+sr(i*59+25)*280);` |
| `soilOrgMatter` | `+(1.5+sr(i*61+27)*5.5).toFixed(1);` |
| `connScore` | `Math.floor(10+sr(i*67+29)*85);` |
| `creditPilot` | `sr(i*71+31)>0.55?CREDIT_PILOTS[Math.floor(sr(i*73+33)*CREDIT_PILOTS.length)]:null;` |
| `creditPrice` | `creditPilot?Math.floor(5+sr(i*79+35)*25):0;` |
| `annualCreditPotential` | `creditPilot?Math.floor(hectares*msaScore*0.5):0;` |
| `yearlyMSA` | `YEARS.map((_,yi)=>+(msaScore-0.05+sr(i*83+yi*11)*0.03*yi).toFixed(2));` |
| `yearlySpecies` | `YEARS.map((_,yi)=>Math.floor(speciesRichness-5+sr(i*89+yi*13)*3*yi));` |
| `soilIndicators` | `SOIL_INDICATORS.map((_,si)=>Math.floor(20+sr(i*97+si*17)*75));` |
| `dir` | `sortDir==='asc'?1:-1;` |
| `stats` | `useMemo(()=>{ const avgMSA=filtered.length?+(filtered.reduce((a,o)=>a+o.msaScore,0)/filtered.length).toFixed(2):0;` |
| `avgSpecies` | `filtered.length?Math.floor(filtered.reduce((a,o)=>a+o.speciesRichness,0)/filtered.length):0;` |
| `avgHabitat` | `filtered.length?Math.floor(filtered.reduce((a,o)=>a+o.habitatQuality,0)/filtered.length):0;` |
| `highPct` | `filtered.length?Math.floor(filtered.filter(o=>o.biodivRating==='High').length/filtered.length*100):0;` |
| `avgNeonic` | `filtered.length?+(filtered.reduce((a,o)=>a+o.neonicExposure,0)/filtered.length).toFixed(1):0;` |
| `totalCredits` | `filtered.reduce((a,o)=>a+o.annualCreditPotential,0);` |
| `avgEarthworm` | `filtered.length?Math.floor(filtered.reduce((a,o)=>a+o.earthwormDensity,0)/filtered.length):0;` |
| `pilotPct` | `filtered.length?Math.floor(filtered.filter(o=>o.creditPilot).length/filtered.length*100):0;` |
| `practiceAdoption` | `useMemo(()=>PRACTICES.map(p=>({name:p.length>18?p.slice(0,18)+'...':p,fullName:p,count:filtered.filter(o=>o.practices.includes(p)).length,pct:filtered.length?Math.floor(filtered.filter(o=>o.practices.includes(p)).length/` |
| `ratingBreakdown` | `useMemo(()=>['Low','Moderate','High'].map(r=>({name:r,value:filtered.filter(o=>o.biodivRating===r).length})),[filtered]);` |
| `msaTrend` | `useMemo(()=>YEARS.map((y,yi)=>({year:y.toString(),avgMSA:filtered.length?+(filtered.reduce((a,o)=>a+o.yearlyMSA[yi],0)/filtered.length).toFixed(2):0,avgSpecies:filtered.length?Math.floor(filtered.reduce((a,o)=>a+o.yearly` |
| `PAGE_SIZE` | `12;const totalPages=Math.ceil(filtered.length/PAGE_SIZE);const paged=filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);` |
| `cropDependency` | `POLLINATOR_CROPS.map((c,ci)=>({name:c,dependency:Math.floor(30+sr(ci*17+1)*65),yieldAtRisk:Math.floor(5+sr(ci*23+3)*45),economicValue:Math.floor(1+sr(ci*29+5)*25)}));` |
| `neonicData` | `NEONICS.map((n,ni)=>({name:n,avgExposure:+(0.5+sr(ni*17+7)*7).toFixed(1),ops:Math.floor(5+sr(ni*23+9)*30),ld50:+(0.5+sr(ni*29+11)*5).toFixed(2)}));` |
| `pollinatorTrend` | `YEARS.map((y,yi)=>({year:y.toString(),avgDependency:Math.floor(45+sr(yi*23)*5),avgExposure:+(4.5-yi*0.2+sr(yi*29)*0.5).toFixed(1),corridorArea:Math.floor(5+yi*3+sr(yi*31)*2)}));` |
| `avgIndicators` | `SOIL_INDICATORS.map((s,si)=>({indicator:s.length>14?s.slice(0,14)+'...':s,fullName:s,value:filtered.length?Math.floor(filtered.reduce((a,o)=>a+o.soilIndicators[si],0)/filtered.length):0}));` |
| `practiceImpact` | `PRACTICES.slice(0,8).map((p,pi)=>({practice:p.length>14?p.slice(0,14)+'...':p,fullName:p,microbial:Math.floor(10+sr(pi*17+1)*40),earthworm:Math.floor(15+sr(pi*23+3)*45),som:Math.floor(5+sr(pi*29+5)*30)}));` |
| `pilotBreakdown` | `CREDIT_PILOTS.map(p=>({name:p.length>18?p.slice(0,18)+'...':p,fullName:p,ops:filtered.filter(o=>o.creditPilot===p).length,credits:filtered.filter(o=>o.creditPilot===p).reduce((a,o)=>a+o.annualCreditPotential,0),avgPrice:` |
| `marketTrend` | `YEARS.map((y,yi)=>({year:y.toString(),pilots:Math.floor(2+yi*1.5+sr(yi*23)*1),volume:Math.floor(50+yi*80+sr(yi*29)*40),avgPrice:Math.floor(5+yi*3+sr(yi*31)*4)}));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `COUNTRIES`, `CREDIT_PILOTS`, `CROP_TYPES`, `NEONICS`, `POLLINATOR_CROPS`, `PRACTICES`, `SOIL_INDICATORS`, `TABS`, `YEARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Biodiversity Intactness Index | `Σ(Observed_sp / Expected_sp) / n` | PREDICTS database | Percentage of natural species richness remaining; <75% is the proposed safe limit |
| Pollinator Value at Risk | `Yield × Dependency × Price` | IPBES 2019 | Economic value of crops at risk if pollinator populations decline further |
| Soil Health Score | `Composite NRCS indicators` | USDA NRCS | Aggregate of microbial biomass, earthworm density and aggregate stability |
- **PREDICTS/GBIF species occurrence data** → Intersect with portfolio site boundaries to compute BII per holding → **Site-level BII scores and aggregate portfolio intactness**
- **IPBES crop pollination data** → Apply pollination dependency coefficients to crop revenue → **Pollinator value at risk in $ per holding**

## 5 · Intermediate Transformation Logic
**Methodology:** IPBES ecosystem service valuation + BII
**Headline formula:** `BII = (Σ Species_observed_i / Species_expected_i) / n_sites; Pollinator_value = Crop_yield × Pollination_dependency × P_per_tonne`

Biodiversity Intactness Index (BII) compares observed to expected species richness at each site. Pollinator service value monetises yield losses attributable to bee colony decline. Soil biodiversity scores aggregate microbial biomass, earthworm density, and aggregate stability into a 0–100 index.

**Standards:** ['TNFD LEAP v2', 'IPBES 2019 Global Assessment', 'USDA NRCS Soil Health Framework']
**Reference documents:** TNFD LEAP Approach v2 (2023); IPBES Global Assessment on Biodiversity 2019; USDA NRCS Soil Health Assessment; EU Biodiversity Strategy 2030

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Real BII/MSA from occurrence data with monetised pollinator value (analytics ladder: rung 1 → 3)

**What.** Today this is tier-B frontend-only: 60 synthetic operations whose every field is a
PRNG draw (`sr()`), with the §7 mismatch flag that the guide's headline metrics are **not
implemented** — MSA is a random 0.2–0.9 scalar (not computed from land-use response
functions), the guide's BII (`Σ observed/expected species / n`) is absent, and pollinator
"value" is never monetised. Evolution A builds the backend vertical the guide promises:
site-level BII computed by intersecting portfolio GPS centroids against GBIF/PREDICTS
occurrence data, MSA derived from GLOBIO land-use pressure functions, and a real pollinator
value-at-risk `= Crop_yield × pollination_dependency × price` using IPBES dependency
coefficients and commodity prices. The one economically meaningful existing formula
(`annualCreditPotential = hectares × msaScore × 0.5`) is preserved but fed a computed MSA.

**How.** `POST /api/v1/agri-biodiv/site-assessment` (centroid + crop + area → BII, MSA,
pollinator VaR, soil composite) and `GET /ref/dependency-coefficients`; a spatial ingester
loads GBIF occurrence counts and PREDICTS reference richness into PostGIS. Rung 3 calibration
comes from anchoring MSA against published GLOBIO regional baselines and validating BII
against the <75% planetary-boundary threshold the guide cites.

**Prerequisites (hard).** Purge the pervasive `sr()` draws per the platform no-fabricated-
random guardrail; correct the metric-substitution documented in §7.5 (state whether the
headline is MSA or BII and compute accordingly); soil-practice/MSA independence resolved so
regenerative practices actually correlate with biodiversity. **Acceptance:** two sites with
different GBIF occurrence density produce different BII; pollinator VaR responds to crop mix
and price; no random draw remains in the metric path.

### 9.2 Evolution B — TNFD LEAP copilot drafting D4 disclosures (LLM tier 1)

**What.** A chat panel that walks an analyst through the LEAP steps the page's tabs already
mirror (Locate assets → Evaluate dependencies via practices → Assess pollinator/soil risk →
Prepare D4 disclosure), answering "which holdings sit in biodiversity-sensitive areas?",
"what drives the pollinator-risk rating here?" (neonic exposure >5 → High), and drafting
narrative TNFD D4 dependency/impact statements from the page's computed site scores. Given
the module currently computes almost nothing real, tier 1 is the honest scope and the
copilot must disclose that MSA/species/pollinator figures are synthetic until Evolution A.

**How.** Tier-1 roadmap pattern: §7.1 field definitions, §7.2 rubric, §7.6 framework
alignment (TNFD LEAP, GLOBIO, IPBES, USDA NRCS) embedded as the module corpus; page state
(filtered operations, ratings) passed as context; served via `POST
/api/v1/copilot/agri-biodiversity/ask` with a refusal path for un-computed asks (e.g. "what
is this farm's real species count?"). After Evolution A, graduates to tier 2 by tool-calling
`POST /site-assessment` for what-if practice-adoption scenarios.

**Prerequisites.** Atlas corpus embedded (roadmap D3); grounding must carry the §7 mismatch
note so the copilot never presents MSA as a computed BII. **Acceptance:** every metric cited
matches page state with its synthetic status stated; a request for a monetised pollinator VaR
before Evolution A returns a refusal naming the missing crop-price/dependency inputs.