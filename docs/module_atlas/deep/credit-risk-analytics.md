## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes a **climate-adjusted** credit engine — PD/LGD/EAD
> conditioned on *NGFS transition and physical risk scenarios*, feeding Basel III capital. **The code
> implements a standard, non-climate IFRS 9 / Basel credit model.** There is no NGFS scenario, no PD
> conditioning on carbon intensity or physical risk: `carbonInt` and `esgScore` are stored on each obligor
> but **never used to adjust PD, LGD, or ECL**. The climate-conditioning the guide promises actually lives
> in the sibling module `climate-credit-integration` (this atlas's exemplar). What this page *does*
> implement is a genuinely correct, well-calibrated conventional credit-risk toolkit: rating-based PD,
> ECL = PD×LGD×EAD, IFRS 9 staging, a real S&P-style migration matrix, PD term structures, and Basel
> capital ratios — on synthetic obligors. §8 specifies the climate overlay the guide advertises.

### 7.1 What the module computes

Standard one-year IFRS 9 expected credit loss with Basel capital, per obligor:

```js
pd  = RATING_PD[rating] × (0.85 + sr·0.3) / 100        // rating map + ±15% jitter
lgd = 0.25 + sr·0.50                                    // 25–75%
ead = 10 + sr·990                                       // $M
ecl = pd × lgd × ead                                    // IFRS 9 §5.5.17
rwaDensity = 0.15 + sr·0.85 ;  rwa = ead × rwaDensity
stage = pd > 0.03 ? 3 : pd > 0.01 ? 2 : 1               // IFRS 9 staging
```
Portfolio Basel capital by sector:
```js
cet1 = totalRwa × 0.045 ; t1 = totalRwa × 0.060 ; total = totalRwa × 0.080 ; combined = totalRwa × 0.105
```

### 7.2 Parameterisation / scoring rubric

| Constant | Value | Provenance |
|---|---|---|
| `RATING_PD` | AAA 0.01% … CCC 8.5% … D 100% | S&P/Moody's-style through-the-cycle default rates (real structure) |
| `MIGRATION_MATRIX` (8×8) | AAA→AAA 90.81%, BBB→BBB 86.93%… | S&P 1-year transition matrix (real, standard values) |
| `PD_TERM` | cumulative 1–10yr per grade | Real term-structure shape (BBB 0.24%→3.18%) |
| Basel ratios | CET1 4.5% · T1 6% · Total 8% · +CCB 10.5% | Basel III minimum capital requirements |
| `pd` jitter, `lgd`, `ead`, `rwaDensity` | `sr()`-scaled | Synthetic seeded PRNG (obligor-level) |
| `carbonInt`, `esgScore` | `sr()`-scaled | Synthetic — **stored, unused in PD** |

The rating→PD map, migration matrix, and term structures are **real credit-risk constants**; only the
45 obligors' assignments are seeded.

### 7.3 Calculation walkthrough

1. Each obligor is assigned a seeded rating; PD looks up `RATING_PD[rating]` with a ±15% jitter.
2. `ecl = pd·lgd·ead`; `stage` from PD thresholds (Stage 1 <1%, Stage 2 1–3%, Stage 3 >3%).
3. `rwa = ead × rwaDensity`; sector Basel capital = `Σrwa × {4.5,6,8,10.5}%`.
4. Migration matrix and PD term structure are fixed reference tables rendered as heatmap/curves. Carbon
   intensity and ESG score are displayed but do not enter any calculation.

### 7.4 Worked example

Obligor with `rating = BBB` (`RATING_PD.BBB = 0.24`), jitter `sr = 0.5` → `pd = 0.24 × (0.85+0.15)/100 =
0.24 × 1.0 / 100 = 0.0024` (0.24%). With `lgd = 0.40`, `ead = $500M`:
`ecl = 0.0024 × 0.40 × 500 = $0.48M`. `stage = 1` (0.24% < 1%). `rwaDensity = 0.6` → `rwa = $300M`;
sector CET1 contribution = `300 × 0.045 = $13.5M`. Its `carbonInt = 620 tCO₂e/$M` and `esgScore = 55` are
shown in the table but **do not change `pd` or `ecl`** — a BBB obligor with carbon intensity 620 gets the
same PD as a BBB obligor at 50, contrary to the guide's climate-adjustment premise.

### 7.5 Companion analytics on the page

Obligor table (PD/LGD/EAD/ECL/RWA/stage/carbon/ESG), portfolio ECL and RWA roll-ups, IFRS 9 stage
distribution, the 8×8 credit-migration heatmap, PD term-structure curves by grade, Basel capital by
sector, and PD-vs-ESG or ECL scatter. No backend engine or route — client-side. The carbon/ESG columns are
the only nod to climate and are purely descriptive.

### 7.6 Data provenance & limitations

- **Obligor data is synthetic** (`sr(seed)=frac(sin(seed+1)×10⁴)`), but the **credit-risk constants are
  real** — the rating-PD map, S&P-style migration matrix, PD term structures, and Basel ratios are correct
  and standard.
- **No climate conditioning** — `carbonInt`/`esgScore` are stored and displayed but never adjust PD/LGD/ECL,
  so the module does not deliver the guide's NGFS-scenario climate-adjusted parameters.
- Single-period (1-year) ECL; no lifetime ECL term structure applied to Stage-2 assets despite the term
  tables being present; no discounting.

**Framework alignment:** *IFRS 9 §5.5* — ECL = PD×LGD×EAD and the 3-stage model are correctly implemented.
*Basel III/IV* — the CET1 4.5% / T1 6% / Total 8% / +2.5% conservation-buffer ladder is standard;
RWA density is the IRB-style risk weight. *S&P/Moody's* — the migration matrix and rating-PD map follow
published transition/default statistics. The guide's *NGFS* scenario overlay (transition + physical PD
conditioning) is the missing piece specified below.

---

## 8 · Model Specification — Climate-Adjusted Credit Parameters (NGFS)

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Condition PD/LGD/EAD on NGFS transition and physical scenarios and flow the result into IFRS 9 ECL and
Basel RWA, so credit portfolios can be stress-tested for climate. Coverage: corporate/sovereign obligors
with a carbon-intensity and physical-risk score (both already stored here).

### 8.2 Conceptual approach
Apply a **scenario-and-obligor-specific multiplier to PD** (transition channel scaled by carbon intensity,
physical channel by hazard score), per **NGFS bank stress-test guidance** and **Moody's/Aladdin climate-
adjusted EDF** practice. This is exactly the mechanic implemented in the sibling `climate-credit-integration`
module — reuse it here so the two stay consistent.

### 8.3 Mathematical specification
```
carbonFactor = 1 + (pdMult_s − 1) × (carbonInt / 800)              // transition channel (÷ coal-intensity ceiling)
physFactor   = 1 + (pdMult_s − 1) × (physScore / 80) × 0.3         // physical channel (down-weighted)
PD_adj_s     = min(1, PD_base × carbonFactor × physFactor)
LGD_adj_s    = LGD_base × lgdMult_s
ECL_adj_s    = PD_adj_s × LGD_adj_s × EAD ;  Uplift% = (ECL_adj − ECL_base)/ECL_base
```
| Parameter | Symbol | Calibration source |
|---|---|---|
| PD multiplier ceiling | `pdMult_s` | NGFS: NZ 1.08 … Current Policies 1.58 (per `climate-credit-integration`) |
| LGD multiplier | `lgdMult_s` | NGFS: 1.05–1.28 |
| Carbon normaliser | 800 tCO₂e/GWh | IEA supercritical-coal intensity ceiling |
| Physical down-weight | 0.3 | 1-yr horizon: transition dominates physical |

### 8.4 Data requirements
Per obligor: `pd_base`, `lgd_base`, `ead` (present), `carbonInt` (present), and a physical-risk score (add;
sibling physical-risk modules can supply). NGFS scenario multipliers already exist in the platform's
`climate_scenarios` tables (migration 088) and the `climate-credit-integration` module.

### 8.5 Validation & benchmarking plan
Reconcile ECL uplift and stage migrations against the `climate-credit-integration` outputs for identical
inputs (they should match); benchmark scenario ordering (Current Policies worst) against NGFS bank
stress-test results and Moody's climate-adjusted EDF. Sensitivity on the 800 normaliser and 0.3 down-weight.

### 8.6 Limitations & model risk
Single-period conditioning ignores the PD term structure — a production version would shift the full PD
curve per NGFS macro path. Physical channel is a scalar, not hazard-specific damage functions. Carbon
intensity is a coarse transition proxy. Conservative fallback: report both unconditioned and conditioned
ECL so the climate uplift is transparent and auditable.
