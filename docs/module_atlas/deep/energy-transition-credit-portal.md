## 7 · Methodology Deep Dive

### 7.1 What the module computes

`energy-transition-credit-portal` composes **two** distinct backend
surfaces behind one 5-tab frontend (`EnergyTransitionCreditPortalPage.jsx`,
1,817 lines): (1) a **client-side revenue-quality credit scorecard** (Single
Borrower tab) that maps a project's PPA/merchant/carbon revenue mix to an
implied rating and then calls the *live* `basel_capital` IRB/SA engine and
the seeded NGFS scenario extract for capital and stress pricing; and (2) the
**new** `transition_credit_analytics.py` engine (931 lines, `POST
/lifetime-el`, `/climate-matrix`, `/pcaf`, `/pricing`, `/portfolio`) that
powers the Single Borrower lifetime-ECL panel plus the Portfolio, Climate
Matrix, PCAF & Disclosure, and Pricing Lab tabs. The backend docstring states
the design goal directly: "NO PRNG anywhere — every figure is a documented
closed-form mapping of the inputs and the hand-authored reference tables...
all exposed via the `/ref/*` endpoints."

### 7.2 PD term structure & IFRS 9-style lifetime ECL

```python
def cum_pd_curve(rating, years=10):
    # linear interpolation between hand-authored anchors at years 1/3/5/7/10; flat beyond 10
def lifetime_el_rows(marginal_pds, lgd, eads, rate):
    for t, (mpd, e) in enumerate(zip(marginal_pds, eads), start=1):
        df = (1.0 + rate) ** -(t - 0.5)          # mid-year discounting
        el = mpd * lgd * e * df
```
(lines 239–288). `ecl_12m = rows[0]["el"]` (stage-1, year-1 marginal PD only)
vs `ecl_lifetime = sum(r["el"] for r in rows)` (stage-2, full tenor) — the
exact IFRS 9 12-month-vs-lifetime ECL contrast (`/lifetime-el` endpoint,
lines 509–530).

**Worked example (BBB, 5-year tenor, bullet EAD $420M, LGD 45%, discount
6%):** anchors `[0.17, 0.75, 1.44, 2.08, 2.94]%` at years `[1,3,5,7,10]`.
Linear interpolation gives cumulative PD `[0.17%, 0.46%, 0.75%, 1.095%,
1.44%]` for years 1–5 (year 2 interpolates halfway between the year-1 and
year-3 anchors: `0.17 + 0.5×(0.75−0.17) = 0.46`; year 4 halfway between
year-3 and year-5: `0.75 + 0.5×(1.44−0.75) = 1.095`). Marginal PDs:
`[0.17%, 0.29%, 0.29%, 0.345%, 0.345%]`.

| t | marginal PD | DF = 1.06⁻⁽ᵗ⁻⁰·⁵⁾ | EL = mPD×0.45×420×DF ($M) |
|---|---|---|---|
| 1 | 0.170% | 0.97129 | 0.3121 |
| 2 | 0.290% | 0.91631 | 0.5022 |
| 3 | 0.290% | 0.86444 | 0.4739 |
| 4 | 0.345% | 0.81551 | 0.5318 |
| 5 | 0.345% | 0.76935 | 0.5017 |

**ECL₁₂ₘ (stage 1) = $0.3121M**; **ECL_lifetime (stage 2, 5y) =
0.3121+0.5022+0.4739+0.5318+0.5017 = $2.3215M** — a **lifetime-to-12-month
ratio of 7.44x**, i.e. recognizing full lifetime ECL on a Stage-2 asset
raises the loss allowance roughly seven and a half times over the 12-month
Stage-1 figure for this rating/tenor/discount combination, purely from the
term-structure shape (marginal PD roughly doubles by year 5) plus five years
of exposure instead of one.

### 7.3 Climate-adjusted transition matrix — the analytical core

The baseline annual migration matrix (`BASELINE_MATRIX_PCT`, 8×8 including
absorbing `D`) is hand-authored to approximate S&P's 1981-2023 NR-adjusted
global corporate transition study; its default column is asserted to equal
the desk's own 1-yr PD ladder. The climate overlay:

```python
def stress_matrix(multiplier):
    for i, row in ...:
        upgrades = sum(row[j] for j in range(0, i))
        downgrades = [row[j] * multiplier for j in range(i+1, len(RATINGS))]
        available = 1.0 - upgrades
        if sum(downgrades) > available:            # cap: rescale so mass never goes negative
            downgrades = [d * available/sum(downgrades) for d in downgrades]
        new_row = upgrades_unchanged + [available - sum(downgrades)] + downgrades   # diagonal absorbs
```
(lines 185–218) — every downgrade cell (including default) is scaled by a
scenario×sector multiplier; the diagonal absorbs the difference so each row
still sums to exactly 1 (asserted at runtime), with a proportional cap so
extreme multipliers can never push a cell negative. `NGFS scenario ×
climate-exposure-class` multipliers (`CLASS_MULTIPLIERS`) range from 0.85
(green generators, Net Zero 2050 — an orderly-transition tailwind) to 3.60
(fossil_high sectors, Delayed Transition — the disorderly scenario hits
carbon-intensive borrowers hardest).

**Toy 3×3 hand-trace** (a simplified 3-state analog of the real 8-state
engine — states A / BBB / D, since the full matrix is too large to trace by
hand):
```
Baseline M:      A→[0.90, 0.08, 0.02]   BBB→[0.05, 0.85, 0.10]   D→[0, 0, 1]
```
Starting at `A` (`v₀ = [1,0,0]`), evolve `v_t = v_{t-1} @ M`:
```
v1 = [0.90, 0.08, 0.02]
v2[A]   = 0.90×0.90 + 0.08×0.05 + 0.02×0   = 0.8140
v2[BBB] = 0.90×0.08 + 0.08×0.85 + 0.02×0   = 0.1400
v2[D]   = 0.90×0.02 + 0.08×0.10 + 0.02×1   = 0.0460     (sums to 1.000 ✓)
```
**Baseline cumulative PD(2y) = 4.60%.** Now apply a climate multiplier
`m=1.5` to row A (`i=0`, no upgrades since it's the best rating): downgrades
`[0.08×1.5, 0.02×1.5] = [0.12, 0.03]`, total `0.15 ≤ available(1.0)`, no cap
needed; diagonal `= 1−0.15 = 0.85` ⇒ stressed row A `= [0.85, 0.12, 0.03]`.
Row BBB (`i=1`): upgrades `= row[0] = 0.05`; downgrades `=
[0.10×1.5]=[0.15]`, available `= 1−0.05 = 0.95 ≥ 0.15`; diagonal `=
0.95−0.15 = 0.80` ⇒ stressed row BBB `= [0.05, 0.80, 0.15]`. Evolving the
**stressed** matrix from `A`:
```
v1_stress = [0.85, 0.12, 0.03]
v2_stress[A]   = 0.85×0.85 + 0.12×0.05 + 0.03×0 = 0.7285
v2_stress[BBB] = 0.85×0.12 + 0.12×0.80 + 0.03×0 = 0.1980
v2_stress[D]   = 0.85×0.03 + 0.12×0.15 + 0.03×1 = 0.0735  (sums to 1.000 ✓)
```
**Stressed cumulative PD(2y) = 7.35%** vs baseline **4.60%** — a 1.5x
per-cell multiplier compounds to roughly a **1.6x cumulative PD outcome**
over just two years purely through the matrix-power mechanic (each year's
extra downgrade mass is itself exposed to a second year of stressed
downgrade probability). This is exactly the compounding effect the engine's
real 8-state, 10-year evolution captures at full scale.

### 7.4 PCAF financed emissions

```python
af = min(e.outstanding_m / denom, 1.0)             # denom = EVIC (1a) or total equity+debt (1b)
fin12 = af * e.emissions_tco2
```
(lines 605–663) with an automatic basis fallback (uses whichever of EVIC/
total-equity-debt is supplied, warns if it had to substitute), an ITR proxy
that defaults to a hand-authored sector table when the borrower doesn't
supply one, and outstanding-weighted portfolio WACI, data quality and ITR.

### 7.5 Sustainability-adjusted pricing

Climate-adjusted RAROC probability-weights `annualized_el_bps` across all
six NGFS scenarios using the user's own scenario probabilities (must sum to
1, ±0.01, else `422`). The carbon-cost margin-erosion panel reads **live
seeded NGFS Phase 5 carbon prices** (`_ngfs_carbon_prices`, cached from
`backend/data/ngfs_phase5_extract.json`) and links absorbed carbon cost to a
coverage-based notch downgrade: `1 notch down per 20% relative ICR
deterioration, capped at 4` (lines 720–726) — a documented, hand-authored
agency-coverage-band approximation, not a live rating action. The green-
supporting/penalizing risk-weight panel is explicitly framed
"POLICY-DEBATE WHAT-IF, not current law." The SLL margin-ratchet computes an
`expected_adjustment_bps = p_meet×(−step_down) + (1−p_meet)×step_up`,
discounted mid-year at the EIR across the EAD profile.

### 7.6 Portfolio mode + TCFD/ISSB disclosure

Book-level EL/RAROC aggregate per-borrower 1-year EL (`PD_ladder × LGD ×
EAD`) and SA-risk-weight capital; scenario book EL sums each borrower's
lifetime EL under each of the six stressed matrices; an OLS
(`margin_bps ~ financed-emissions intensity`) tests whether the book
actually prices transition risk (positive slope + meaningful R² = pricing
reflects risk; flat/negative = a mispricing candidate — the engine computes
this from first principles, no library, using the standard
`Σ(x−x̄)(y−ȳ)/Σ(x−x̄)²` slope and `R² = (Σxy)²/(Σxx·Σyy)` formulas). HHI
concentration is computed on both sector and rating EAD shares. The TCFD/
ISSB panel's `climate_var_proxy` is explicitly labeled: "Scenario
lifetime-EL range across the six NGFS scenarios (max − min)... not a
distributional VaR."

### 7.7 The frontend's own client-side credit scorecard (Single Borrower tab)

Distinct from the backend engine, the Single Borrower tab runs a **local**
revenue-quality composite:
```js
const sContracted = shContract * 100;
const sMerchant = Math.max(0, 100 - shMerchant*100*(merchantVolPct/35));
const sCarbon = Math.max(0, 100 - shCarbon*100*1.5);
const composite = RQ_WEIGHTS.contracted*sContracted + RQ_WEIGHTS.offtaker*sOfftaker
                + RQ_WEIGHTS.merchant*sMerchant + RQ_WEIGHTS.carbon*sCarbon;
const rating = scoreToRating(composite);   // capped at 'A' — project borrowers rarely rate above A
```
(`revenueQuality`/`scoreToRating`, lines 122–207), weights
`{contracted:0.40, offtaker:0.25, merchant:0.20, carbon:0.15}`. The resulting
rating's PD/CQS (from a client-side `RATING_LADDER` explicitly noted to use
the **same** year-1 PD values as the backend's anchors) then feeds live
calls to `POST /basel-capital/risk-weight-irb` and `/risk-weight-sa` for
capital, and — under an NGFS scenario re-run — the same revenue-quality
function is re-evaluated on scenario-stressed merchant/carbon revenue
(`stressRevenues`, lines 219–227) to produce a scenario-conditional rating
and re-priced Basel risk weight. This is a genuinely separate, documented
scoring layer from the `transition_credit_analytics.py` engine — the two
coexist on the same tab by design (client-side scorecard for a single
illustrative borrower's revenue mix; server-side engine for the PD-term-
structure, climate-matrix, PCAF and portfolio depth).

### 7.8 Data provenance & limitations

- **All PD anchors and the migration matrix are hand-authored approximations**
  of the S&P Global "Default, Transition and Recovery" 1981-2023 study —
  explicitly labeled "APPROXIMATE — refresh from the published study for
  production" on both `/ref/pd-term-structure` and `/ref/transition-matrix`.
- **NGFS scenario×sector multipliers are a hand-authored judgment overlay**
  "in the spirit of NGFS/ECB climate stress-test practice," not a published
  NGFS multiplier table — editable per-request via `multiplier_override`.
- **NGFS carbon prices are a seeded Phase 5 extract** (IIASA Scenario
  Explorer, CC BY 4.0) — a real but static, approximate snapshot, not a live
  feed.
- **ICR-to-notch elasticity (20% relative deterioration per notch, capped at
  4) is a hand-authored approximation** of agency coverage-band medians, not
  a calibrated transition matrix.
- **Green-supporting/penalizing RW panel is explicitly a policy-debate
  sensitivity**, not current Basel law.
- **The Single-Borrower client-side scorecard and the backend engine use
  independent but internally consistent PD ladders** (explicitly cross-
  checked in the frontend header comment) — a reader should not mistake the
  two for the same computation path; the scorecard drives Basel IRB/SA
  pricing on the illustrative borrower, while the backend engine drives the
  portfolio/climate-matrix/PCAF/pricing-lab tabs.
- No guide/code mismatch found: the atlas spec ("Integrated single-borrower
  credit view: PPA-backed project loan + carbon revenue + merchant exposure
  → PD/LGD/EL, Basel RWA + RAROC pricing floor, NGFS scenario deltas")
  matches the Single Borrower tab; the four *additional* tabs (Portfolio,
  Climate Matrix, PCAF & Disclosure, Pricing Lab) built on the new
  `transition_credit_analytics.py` engine go well beyond that original scope.

## 8 · Model Specification

**Status: implemented.**

**8.1 Purpose & scope.** Provide a climate-conditioned IFRS 9 credit-risk
platform for energy-transition lending — single-borrower and book-level
PD/EL, a climate-stressed rating-migration matrix with multi-year
distribution evolution, PCAF-compliant financed-emissions attribution, and
sustainability-adjusted RAROC/pricing — for banks pricing and provisioning
transition-exposed credit books under IFRS 9 and preparing TCFD/ISSB
climate-risk disclosures.

**8.2 Conceptual approach.** A single hand-authored PD term structure and
migration matrix anchor every downstream calculation (lifetime ECL, climate
stress, portfolio EL), so the static (12-month/lifetime) and
climate-conditioned views are always mutually consistent by construction —
the migration matrix's default column is asserted equal to the PD ladder's
year-1 values. Climate risk enters through a single, auditable mechanism (a
downgrade-cell multiplier with diagonal absorption, row-stochasticity
enforced by assertion) rather than a black-box scenario model, so every
NGFS scenario × sector combination reduces to one documented multiplier the
user can override. PCAF attribution and RAROC/pricing reuse the same
lifetime-EL machinery so the portfolio-level and single-borrower views never
diverge in methodology, only in inputs.

**8.3 Mathematical specification.**
```
Cum_PD(rating, t) = linear interp of hand-authored anchors at t∈{1,3,5,7,10}; flat beyond 10
Marginal_PD_t = Cum_PD(t) − Cum_PD(t−1)
EL_t = marginal_PD_t × LGD × EAD_t × (1+rate)^-(t−0.5)                 (mid-year discounting)
ECL_12m = EL_1;  ECL_lifetime = Σ_t EL_t
Stress_matrix(M, mult): for each row i, downgrade cells (j>i) × mult (capped to available mass),
                        diagonal = 1 − upgrades − Σ downgrades           (row-stochastic, asserted)
v_t = v_{t-1} @ M_stressed  (matrix powers on one-hot start vector, each v_t asserted Σ=1)
Marginal default mass_t = v_t[D] − v_{t-1}[D];  scenario lifetime EL = Σ_t (that mass) × LGD × EAD_t × DF_t
PCAF: attribution_factor = min(outstanding/EVIC, 1);  financed_emissions = factor × borrower_emissions
RAROC = (margin_bps − EL_bps − opex_bps)/10^4 × EAD / (RW × EAD × capital_ratio)
Climate RAROC = RAROC using Σ_scenario P(scenario) × EL_bps(scenario)     (probability-weighted)
Carbon margin erosion = emissions × max(P_scenario − P_today, 0) × absorption_share / EAD
OLS: margin_bps ~ β·(financed emissions intensity) + α                    (closed-form least squares)
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Cumulative PD anchors (7 ratings × 5 tenors) | `CUM_PD_ANCHORS_PCT` | Hand-authored approximation, S&P Global 1981-2023 study |
| Baseline migration matrix (8×8) | `BASELINE_MATRIX_PCT` | Hand-authored approximation, S&P 1981-2023 NR-adjusted transition study |
| NGFS scenario × sector-class multipliers | `CLASS_MULTIPLIERS` | Hand-authored judgment overlay, NGFS/ECB stress-test spirit |
| NGFS carbon prices | seeded Phase 5 extract | IIASA Scenario Explorer, CC BY 4.0 (real, static snapshot) |
| ICR-to-notch elasticity | 20%/notch, cap 4 | Hand-authored approximation of agency coverage-band medians |
| SA risk weights by rating | `SA_RW_BY_RATING` | Basel CRE20.16 / CRR Art 122 (real, hand-transcribed) |
| PCAF data-quality ladder | `PCAF_DQ_LADDER` | PCAF Global GHG Standard Part A, Table 5-2 (paraphrased) |
| Sector default ITR proxies | `SECTOR_ITR_DEFAULT` | Hand-authored, labeled proxy (used only if borrower ITR absent) |

**8.4 Data requirements.** Rating, LGD, EAD, tenor and amortization profile
for lifetime ECL; scenario, sector and rating for the climate matrix;
per-exposure outstanding/EVIC-or-total-equity-debt/emissions/data-quality/
ITR for PCAF; margin, opex, capital ratio, hurdle, scenario probabilities,
EBITDA/interest (for the carbon-coverage link), and SLL KPI terms for
pricing; a borrower list (sector/rating/EAD/margin/LGD/tenor/revenue/EVIC/
emissions/data-quality) for portfolio mode.

**8.5 Validation & benchmarking.** `/ref/pd-term-structure`,
`/ref/transition-matrix` and `/ref/climate-multipliers` expose every
hand-authored table for direct comparison against a bank's own agency
subscription or internal transition-risk framework. Runtime assertions
(row-stochasticity of both baseline and stressed matrices, distribution-path
sums to 1 at every evolution year, PCAF attribution consistency) function as
regression guards rather than external validation. Production validation
would compare the climate-stressed transition matrix and NGFS multiplier
table against a live NGFS/ECB climate stress-test parameterization and
refresh the carbon-price extract from a live IIASA feed.

**8.6 Limitations & model risk.** The PD anchors and migration matrix are
hand-authored approximations, not licensed agency data — both are explicitly
labeled for refresh before production use. The climate-stress mechanism
(uniform downgrade-cell multiplier per scenario×sector class) is a
first-order approximation of genuinely idiosyncratic transition risk — real
borrowers within a sector class vary far more than a single multiplier can
capture. The ICR-to-notch coverage elasticity and the green-supporting/
penalizing RW panel are explicitly labeled hand-authored/policy-debate
sensitivities, not calibrated or current-law figures. The client-side Single
Borrower revenue-quality scorecard uses a different code path (frontend JS)
from the server-side engine, sharing only the underlying PD ladder values —
a reader must not conflate the two when tracing a specific number back to
its source. The TCFD "climate-VaR proxy" is a scenario-range heuristic, not
a true probabilistic Value-at-Risk.

**Framework alignment:** IFRS 9 §5.5 (12-month vs lifetime ECL, stage
migration) · S&P Global "Default, Transition and Recovery" long-term
corporate studies (approximated) · NGFS Phase 5 scenario framework (real
carbon-price extract; hand-authored downgrade-multiplier overlay) · PCAF
Global GHG Accounting and Reporting Standard, Part A · Basel CRE20.16/CRR
Art 122 SA risk weights (real) · TCFD Metrics & Targets / ISSB IFRS S2
disclosure structure.
