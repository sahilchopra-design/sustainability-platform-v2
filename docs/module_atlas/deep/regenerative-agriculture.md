## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's calculation engine is **"Soil Carbon Stock
> Change"**: `ΔSOC = (SOC_t1 − SOC_t0) × BD × d × (44/12)` — the IPCC 2006 Guidelines Vol. 4 Tier-1
> method, converting a measured change in soil organic carbon concentration to CO₂e using bulk
> density (`BD`), sampling depth (`d`), and the CO₂:C molecular-weight ratio (44/12 ≈ 3.667). **None
> of this formula exists in the code.** There is no `bulkDensity` or `samplingDepth` field, no
> `SOC_t0`/`SOC_t1` baseline-vs-current comparison, and no `×44/12` conversion anywhere in the
> file — `soilCarbon` and `annualSeq` are independent seeded-random draws per farm, not derived
> from any stock-change calculation. The sections below document what the code actually computes:
> a descriptive practice-adoption tracker with randomly-assigned sequestration, yield, and
> carbon-credit-revenue figures.

### 7.1 What the module computes

80 synthetic farm operations across 10 crops and 20 countries each adopt a random subset of 10
regenerative practices, then carry independently-seeded soil, yield, economic and MRV attributes:

```js
adoptedPractices = PRACTICES.filter(p => sr(seed) > 0.45)                // ~55% adoption chance per practice
soilCarbon  = 1.2 + s4×3.8            // %  (t0 snapshot, not a stock-change delta)
annualSeq   = 0.3 + s5×2.7            // tCO2e/ha/yr — direct random draw
yieldImpact = -5 + s6×25              // % change vs conventional (-5% to +20%)
practiceScore = adoptedPractices.length / 10 × 100
transitionStage = practices≥5 'Advanced' : ≥3 'Intermediate' : else 'Early'
paybackYears = 1 + sr()×8             // years to breakeven on transition capex
```

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Practice adoption threshold | `sr(seed) > 0.45` (~55% chance per practice, independent per practice) | Synthetic — no correlation between practices (e.g. adopting No-Till doesn't raise the odds of adopting Cover Crop, though in reality these are frequently bundled) |
| `soilCarbon` range | 1.2–5.0% | Synthetic — plausible order of magnitude for topsoil SOC%, not tied to any baseline survey |
| `annualSeq` range | 0.3–3.0 tCO2e/ha/yr | Synthetic — the *range* overlaps published regenerative-ag sequestration literature (typically 0.1–3 t/ha/yr depending on practice/soil/climate), but the value here is drawn independently of `soilCarbon`, adopted practices, or crop type |
| `yieldImpact` range | −5% to +20% | Synthetic — directionally consistent with regen-ag literature showing yield can dip short-term then recover/improve, but not derived from `adoptionYear` or transition stage |
| `paybackYears` range | 1–9 years | Synthetic |
| `carbonPrice` range | $15–60/t | Synthetic — broadly in range of voluntary soil-carbon credit prices (Verra/Gold Standard agricultural methodologies typically $10–40+/t) |
| Transition stage thresholds | ≥5 practices Advanced, ≥3 Intermediate, else Early | UI heuristic, not sourced to a named maturity framework |

### 7.3 Calculation walkthrough

1. **Per-farm generation** (80 rows, `genOps(80)`): 8 base seeds (`s1`–`s8`) drive crop, country,
   hectares, practice adoption (10 independent threshold draws), soil carbon %, annual
   sequestration, yield impact, input cost change, certifications (8 independent threshold draws),
   credit revenue, adoption year. A further ~10 seeds set soil organic matter, water retention,
   biodiversity score, MRV method, registry, 8-year `yearlyCarbon`/`yearlyYield` trajectories,
   payback years, carbon price, insetting eligibility, verification status, and lat/long.
2. **`practiceScore`**: simple count-based completeness score (`adoptedPractices.length/10×100`),
   not weighted by which practices are adopted (No-Till and Agroforestry count equally despite very
   different real-world sequestration potential).
3. **`yearlyCarbon`** (8-year trajectory, 2019–2026): `soilCarbon + sr(seed)×0.5×yearIndex` — an
   upward-drifting noise series anchored to the farm's own `soilCarbon` snapshot, not a genuine
   annual re-measurement.
4. **`yearlyYield`**: `base=100+yieldImpact×0.5` then drifts up by `sr()×15×yi/8` — again an
   assumed improving trend, not measured.
5. **Filters & aggregates**: crop/country/practice/MRV-method/payback-max filters subset `OPS`
   before every KPI (`totalHa`, `avgSeq`, `totalSeq = Σ(annualSeq×hectares)`, `avgScore`,
   `advancedPct`, `avgYieldImpact`, `certifiedPct`, `totalCredRev = Σ(creditRevenue×hectares/1000)`).
6. **Practice adoption breakdown**: count and % of filtered farms adopting each of the 10
   practices, sorted descending.
7. **`seqByPractice`** (Economic Analysis tab): an *independently seeded* per-practice avg/max/min
   sequestration table (`0.5+sr(pi×23+7)×2.5` etc.) — disconnected from any individual farm's own
   `annualSeq`, i.e. two separate, non-reconciled sequestration figures exist for the same
   practices (per-farm random draw vs per-practice random draw).

### 7.4 Worked example

Farm `i=0` (`s1=sr(1)`, `s4=sr(7)`, `s5=sr(9)`, `s6=sr(11)`):

| Field | Formula | Illustrative result |
|---|---|---|
| `crop` | `CROP_TYPES[floor(sr(1)×10)]`, `sr(1)=frac(sin(2)×10⁴)≈0.9200` | index 9 → **Barley** |
| `hectares` | `floor(sr(5)×4500+50)` | e.g. **2,100 ha** |
| `soilCarbon` | `1.2+sr(7)×3.8` | `sr(7)≈0.6570` → `1.2+2.50=` **3.70%** |
| `annualSeq` | `0.3+sr(9)×2.7` | `sr(9)≈0.4121` → `0.3+1.11=` **1.41 tCO2e/ha/yr** |
| `yieldImpact` | `-5+sr(11)×25` | `sr(11)≈0.6603` → `-5+16.5=` **+11.5%** |
| `adoptedPractices` | 10 independent `sr(37+pi×7)>0.45` checks | e.g. 6 of 10 adopted |
| `practiceScore` | `6/10×100` | **60** |
| `transitionStage` | `6≥5` | **Advanced** |
| Farm sequestration (portfolio contribution) | `annualSeq × hectares` | `1.41 × 2,100 =` **2,961 tCO2e/yr** |
| Credit revenue | `creditRevenue × hectares / 1000` | e.g. at `creditRevenue=$70/ha`: `70×2,100/1000=` **$147k/yr** |

### 7.5 Certification & MRV rubric (descriptive, not scored)

| Category | Options |
|---|---|
| Certifications (0–8 possible per farm) | Organic USDA, Regenerative Organic Certified, Rainforest Alliance, Fair Trade, Carbon Verified, Soil Health Certified, EU Organic, Demeter Biodynamic |
| MRV method (1 of 6, random) | Remote Sensing+Soil Sampling, Soil Core Lab Analysis, Eddy Covariance Flux Tower, Biogeochemical Modelling (DNDC), Practice-Based Default Factors, Hybrid MRV Stack |
| Carbon registry (1 of 7, random) | Verra VCS, Gold Standard, ACR, CAR, Puro.earth, CarbonCure, Nori |

No MRV-method-specific uncertainty or confidence discount is applied to `annualSeq` despite the
6 listed methods having materially different real-world measurement precision (e.g. eddy
covariance flux towers are far more precise, and expensive, than practice-based default factors).

### 7.6 Companion analytics

Practice Tracker (filterable 80-farm table + practice adoption bar), Soil Carbon Calculator
(8-year trajectory chart, depth-profile illustration, MRV breakdown), Economic Analysis
(per-practice sequestration min/avg/max, payback vs yield-impact vs input-saving scatter, credit
revenue), Certification & Markets (registry/certification distribution).

### 7.7 Data provenance & limitations

- **All 80 farms are synthetic**, generated by `sr(seed)=frac(sin(seed+1)×10⁴)`; farm names are
  templated (`{name} {n}`), not real operations.
- No IPCC Tier-1 SOC stock-change formula (`ΔSOC×BD×d×44/12`) is implemented despite being the
  guide's own named methodology — soil carbon, sequestration rate, and yield impact are each
  independent random draws with no causal link to which practices a farm has actually adopted.
- The 8-year `yearlyCarbon`/`yearlyYield` trajectories assume improvement is guaranteed (drift is
  always upward), which does not reflect real transition risk (yield dips, sequestration
  saturation after ~10-20 years per IPCC guidance, weather variability).
- Per-farm `annualSeq` and the separate per-practice `seqByPractice` table are not reconciled —
  a farm practicing No-Till + Cover Crop does not have its `annualSeq` built from those two
  practices' individual contributions.
- MRV method is cosmetic — no measurement-uncertainty discount is applied despite real MRV methods
  varying enormously in precision and cost.

**Framework alignment:** IPCC 2006 Guidelines Vol. 4 (Agriculture) — the Tier-1 stock-change
formula is named in the guide but not implemented; a real implementation would need baseline
(`SOC_t0`) vs current (`SOC_t1`) paired soil samples, bulk density, and sampling depth, none of
which exist in this schema · Verra VM0042 (Improved Agricultural Land Management) — registry name
appears in the dropdown list, methodology (baseline stratification, dynamic/static baselines,
uncertainty deductions) is not implemented · SBTi FLAG — referenced in the guide as sector
guidance context, not computed against any farm's emissions/land-use pathway in this file.
