# Credit Risk Analytics
**Module ID:** `credit-risk-analytics` · **Route:** `/credit-risk-analytics` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Computes climate-adjusted probability of default (PD), loss given default (LGD), and exposure at default (EAD) for corporate and sovereign credit portfolios under NGFS transition and physical risk scenarios. Integrates climate risk into Basel III-compliant credit risk capital calculations.

> **Business value:** Enables credit risk managers and regulators to quantify climate-driven increases in credit losses and capital requirements, supporting ICAAP climate risk stress testing, Pillar 2 add-on calculations, and TCFD credit risk disclosures.

**How an analyst works this module:**
- Select portfolio or individual obligor for climate credit risk assessment
- PD Adjustment tab models transition and physical risk contributions to PD uplift by scenario
- LGD Analysis tab applies collateral value haircuts for physical risk exposure
- EAD Stress tab models elevated drawdown probability under climate scenarios
- Portfolio Heatmap shows climate RWA concentration by sector and scenario
- Capital Impact tab computes additional CET1 capital requirement under climate Pillar 2 add-on

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CAPITAL_DATA`, `MATRIX_GRADES`, `MIGRATION_MATRIX`, `OBLIGORS`, `PD_TERM`, `RATINGS`, `RATING_PD`, `SECTORS`, `STAGE_COLOR`, `TERM_COLORS`, `TERM_DATA`, `TERM_YEARS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `RATINGS` | `['AAA','AA+','AA','AA-','A+','A','A-','BBB+','BBB','BBB-','BB+','BB','BB-','B+','B','B-','CCC','CC','C','D'];` |
| `RATING_PD` | `{ AAA:0.01,  'AA+':0.02, AA:0.03,  'AA-':0.04, 'A+':0.07,  A:0.09, 'A-':0.12,` |
| `ratingIdx` | `Math.floor(sr(i * 3) * RATINGS.length);` |
| `ead` | `10 + sr(i * 3 + 2) * 990;         // $M` |
| `lgd` | `0.25 + sr(i * 3 + 3) * 0.50;` |
| `ecl` | `pd * lgd * ead;` |
| `rwaDensity` | `0.15 + sr(i * 3 + 4) * 0.85;` |
| `esgScore` | `20 + Math.floor(sr(i * 5) * 80);` |
| `carbonInt` | `50 + sr(i * 5 + 1) * 950;` |
| `TERM_DATA` | `TERM_YEARS.map((yr, i) => {` |
| `row` | `{ year: yr + 'Y' };` |
| `CAPITAL_DATA` | `SECTORS.map((s, i) => {` |
| `totalRwa` | `items.reduce((sum, o) => sum + o.rwa, 0);` |
| `cet1` | `totalRwa * 0.045;  // 4.5% CET1` |
| `total` | `totalRwa * 0.080;  // 8% total` |
| `combined` | `totalRwa * 0.105; // 10.5% with capital conservation` |
| `totals` | `useMemo(() => ({ ead: OBLIGORS.reduce((s,o)=>s+o.ead,0), ecl: OBLIGORS.reduce((s,o)=>s+o.ecl,0), rwa: OBLIGORS.reduce((s,o)=>s+o.rwa,0), stage2: OBLIGORS.filter(o=>o.stage===2).length, stage3: OBLIGORS.filter(o=>o.stage===3).length, }), []);` |
| `scatterData` | `OBLIGORS.map(o => ({ x: o.esgScore, y: o.pd * 100, z: o.ead, sector: o.sector, name: o.name, rating: o.rating }));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `MATRIX_GRADES`, `MIGRATION_MATRIX`, `RATINGS`, `SECTORS`, `TERM_YEARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Climate PD Uplift (Hot House World) | — | ECB Climate Stress Test 2022 | Basis point increase in probability of default for high-carbon sectors under Hot House World scenario |
| LGD Physical Risk Haircut | — | BIS Working Paper 844 | Reduction in collateral recovery value due to physical climate damage to pledged assets |
| Climate-Adjusted EL | — | Model output | Expected loss multiplier under climate scenarios relative to base case |
| Carbon-Intensive Sector PD (2035) | — | NGFS calibration | Projected PD for high-carbon sectors under current policies scenario by 2035 |
| Climate RWA Add-on | — | Pillar 2 guidance | Additional risk-weighted assets required under Pillar 2 climate add-on approaches |
- **Obligor financial data and credit ratings** → Compute base PD/LGD/EAD using IRB models → **Base credit risk parameters per obligor**
- **NGFS scenario carbon price and GDP shock data** → Apply sector-calibrated β coefficients, compute climate PD uplift → **Climate-adjusted PD per obligor and scenario**
- **Physical risk hazard maps (IPCC/NGFS)** → Compute collateral location-weighted physical damage, apply LGD haircut → **Climate-adjusted LGD and EAD per obligor**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate-Adjusted Credit Risk Parameters
**Headline formula:** `PD_adj = PD_base × exp(β_transition × TransitionShock + β_physical × PhysicalShock)`

Transition shock is measured as carbon cost as a fraction of EBITDA margin, sector-specific. Physical shock quantifies revenue/collateral impairment from climate hazard exposure of business locations. Beta coefficients calibrated from ECB 2022 climate stress test sectoral analysis. LGD adjustment: collateral value haircut applies physical risk discount on real estate and commodity-backed lending. EAD: credit line drawdown probability elevated under climate stress.

**Standards:** ['BCBS Climate Risk Working Group', 'ECB/EBA Climate Stress Test', 'NGFS Phase 5']
**Reference documents:** BCBS Principles for the Effective Management and Supervision of Climate-Related Financial Risks (2022); ECB Economy-Wide Climate Stress Test 2022; EBA Report on Management and Supervision of ESG Risks 2021; NGFS Phase 5 Scenarios â€” Credit Risk Transmission

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Add the climate overlay to a genuinely sound credit core (analytics ladder: rung 1 → 2)

**What.** §7's flag is unusual: the code is a *correct* conventional credit toolkit —
real S&P-style migration matrix, rating-PD map, PD term structures, IFRS 9
ECL = PD×LGD×EAD with staging, Basel capital ladder — but the guide's climate
conditioning is absent: `carbonInt` and `esgScore` are stored on each obligor and
never touch PD, LGD, or ECL. §7.6 adds two conventional gaps: Stage-2 assets get
1-year ECL despite the lifetime term tables being present, and nothing is
discounted. Evolution A adds the promised overlay without rebuilding what works.

**How.** (1) Climate PD conditioning per the guide's own form:
`PD_adj = PD_base × exp(β_t·TransitionShock + β_p·PhysicalShock)`, with the
transition shock = carbon cost / EBITDA computed from the obligor's stored
`carbonInt` via the NGFS price paths in `climate_transition_risk_engine`, and β
anchored to the ECB 2022 sectoral analysis the guide cites — reusing the platform's
existing engines rather than duplicating them (the sibling
`climate-credit-integration` module already models this pattern; share, don't
fork). (2) LGD haircut: collateral physical-risk discount from the digital-twin
composite score where collateral is geolocated. (3) Lifetime ECL: apply the
existing `PD_TERM` cumulative structures to Stage-2 obligors with discounting —
the tables are already on the page, unconnected. (4) Real obligors from
`portfolios_pg` replace the 45 seeded assignments; the real reference constants
stay untouched and get pinned in `bench_quant.py`.

**Prerequisites.** Coordination with `climate-credit-integration` to avoid engine
duplication; obligor emissions/EBITDA data for the transition shock (honest nulls
where missing). **Acceptance:** an obligor's climate-adjusted PD exceeds its base
PD by the exp-factor arithmetic exactly; Stage-2 ECL uses the cumulative term
structure; toggling NGFS scenario changes ECL monotonically for carbon-intensive
sectors.

### 9.2 Evolution B — ICAAP climate-credit narrative assistant (LLM tier 1 → 2)

**What.** The module's stated regulatory uses — ICAAP climate stress testing,
Pillar 2 add-on support, TCFD credit disclosure — all end in written submissions.
Evolution B drafts them from computed state: portfolio ECL under base vs
climate-adjusted parameters, the sector RWA concentration story, stage-migration
under scenario, and the capital implication (the module's own Basel ladder), with
each figure traced to the calculation and each methodological choice (β source,
pass-through assumption) disclosed — the ECB/BCBS references §5 cites structure the
narrative sections.

**How.** Tier 1 grounds on page state plus this Atlas record; tier 2 arrives when
Evolution A lands server-side, making "re-run under Delayed Transition with 50%
pass-through" a tool call whose output feeds the draft directly. The fabrication
validator matters doubly here: capital figures in a regulatory narrative must match
computed values to the basis point, and the assistant must not smooth over the
model's stated limitations (single-period jitter on PD assignment, β vintage).

**Prerequisites (hard).** Evolution A — an ICAAP narrative describing a model with
no climate conditioning as "climate-adjusted" would be a supervisory
misrepresentation; backend endpoints for tier 2. **Acceptance:** every number in a
draft matches computed output; the methodology annex lists the β source and
scenario vintage; obligors lacking emissions data are reported as
unconditioned, not silently base-PD.