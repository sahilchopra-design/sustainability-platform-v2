# Pf Credit Rating Engine
**Module ID:** `pf-credit-rating-engine` · **Route:** `/pf-credit-rating-engine` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `DEFAULTS`, `FACTOR_LABELS`, `Field`, `Kpi`, `RATING_COLOR`, `RatingCard`, `ScoreBar`, `TREE_DEF`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `TREE_DEF` | 16 | `label`, `weight`, `children`, `key` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `parseArray` | `(text) => text.split(/[\s,;]+/).map((s) => parseFloat(s)).filter((x) => !isNaN(x));` |
| `lgd` | `(num(lgdPct) ?? 35) / 100;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/pf-rating/rate` | `rate_project` | api/v1/routes/pf_rating.py |
| GET | `/api/v1/pf-rating/ref/scorecard` | `scorecard_reference` | api/v1/routes/pf_rating.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`

**Database tables:** `Moody`, `__future__` *(shared)*, `fastapi` *(shared)*, `mean`, `published` *(shared)*, `pydantic` *(shared)*, `statistics` *(shared)*, `studies`, `typing` *(shared)*
**Frontend seed datasets:** `TREE_DEF`

## 4 · End-to-End Data Lineage (source → transformation → UI)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **3** other module(s).

| Connected module | Shared via |
|---|---|
| `ppa-xva-engine` | table:published |
| `slb-structurer` | table:published |
| `climate-underwriting-workbench` | table:statistics |

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`pf-credit-rating-engine` (`backend/api/v1/routes/pf_rating.py`, 816 lines; frontend
`PfCreditRatingEnginePage.jsx`, 965 lines, 6 panels) is an agency-methodology-*style*
scorecard for project-finance transactions. A single endpoint, `POST /rate`, runs a
transaction through **two parallel scorecards plus three chained overlays**:

1. **Legacy flat scorecard** (6 factors, kept bit-identical for old payloads) → a
   weighted 0–100 score → an indicative rating band.
2. **v2 three-level factor tree** (mirrors the *shape* of published agency PF
   methodologies — explicitly labeled hand-authored interpretation, not the agencies'
   actual tables) → `tree_rating`.
3. **Notching chain** applied to the tree rating: construction-phase, structural
   subordination, external support (guarantee), capped/floored at ±3/+2 notches →
   `notched_rating`.
4. **ESG/transition overlay**, monotone in a carbon-intensity percentile with SBTi/
   taxonomy mitigants → `final_rating` (with vs without both returned).
5. **1–10y PD term structure** by log-survival interpolation of hand-authored 1/5/10y
   PD anchors, and an **expected-loss profile** (`PD × LGD × EAD`).

`GET /ref/scorecard` discloses every weight, knot table, categorical lookup, notching
rule and PD anchor; `GET /ref/peers` discloses 12 hand-authored peer credit profiles for
the frontend's benchmark scatter (Panel 5). The module docstring states "No PRNG, no
fabricated randomness — every number is a documented mapping of the inputs."

### 7.2 Parameterisation

**Legacy weights** (`WEIGHTS`, sum to 1.0): phase 0.10, resource risk 0.15, revenue
contract 0.25, structure 0.30, counterparty 0.10, country 0.10. `NEUTRAL_SCORE = 60`
(the BBB- driver-decomposition anchor), `POINTS_PER_NOTCH = 6.0`.

**Continuous-factor knot tables** (piecewise-linear, clamped at the ends via `_interp`):

| Table | Knots (x → score) |
|---|---|
| `KNOTS_P90_P50` | 0.60→20, 0.70→35, 0.80→55, 0.85→70, 0.90→85, 0.95→95 |
| `KNOTS_MIN_DSCR` | 1.00→10, 1.05→30, 1.15→45, 1.30→60, 1.50→75, 1.80→88, 2.00→95 |
| `KNOTS_GEARING` | 50→95, 60→90, 70→75, 75→65, 80→50, 90→30, 95→20 |
| `KNOTS_DSRA` (months) | 0→30, 3→55, 6→75, 12→90 |
| `KNOTS_SWEEP` (%) | 0→50, 25→70, 50→85, 100→92 |
| `KNOTS_CONTRACTED` (%) | 0→30, 25→45, 50→62, 75→78, 90→88, 100→95 |
| `KNOTS_REFI_SHARE` (%) | 0→90, 20→75, 40→60, 60→45, 80→32, 100→22 |
| `KNOTS_DSCR_COV` (%) | 0→95, 5→82, 10→68, 15→55, 20→45, 30→32, 40→22 |

**Categorical lookups:** `PHASE_SCORES` (operation 85 / construction 50);
`OFFTAKER_SCORES` (AAA 95 … B 30, NR 40); `CONTRACTOR_SCORES` (tier1 fixed-price wrap 88
→ unproven 28); `COUNTRY_SCORES` (aaa_aa 90 → b_or_below 25); `TECHNOLOGY_SCORES`
(proven_conventional 88 → first_of_a_kind 28); `OPEX_RISK_SCORES` (fixed-price O&M 85 →
variable exposed 40); `LEGAL_FRAMEWORK_SCORES` (mature 85 → untested 30).

**Rating band map** (`RATING_BANDS`, score-floor → rating): 90→A, 84→A-, 78→BBB+,
72→BBB, 66→BBB-, 60→BB+, 54→BB, 48→BB-, 42→B+, 36→B, else B-. The code comments that the
BBB- floor sits at 66 (not the 60 anchor) *deliberately*, so the NEUTRAL_SCORE=60 anchor
maps to BB+ — matching the PF market convention that the median rated deal is
crossover BBB-/BB+.

**PD table** (`PD_TABLE`, hand-authored, cumulative %, 1y/5y/10y) ranges from A
(0.05/0.55/1.40) to B- (4.50/20.00/28.00), e.g. BBB (0.17/1.50/3.00), BB+ (0.55/4.20/7.50).
Basis: "Indicative, derived from Moody's/S&P project-finance default study aggregates
(Moody's 'Default and Recovery Rates for Project Finance Bank Loans', S&P annual PF
default studies) — approximate, refresh from the studies for production." Moody's PF
studies are also cited for the ~80% average ultimate recovery that motivates the default
LGD of 35% (senior-secured LGD typically 20–35%).

**Factor tree** (`FACTOR_TREE_DEF`, level-1 weights → level-2 children, all editable via
dotted-path `weight_overrides`, sibling groups renormalized to 1):

| Level 1 (weight) | Level 2 children (weight) |
|---|---|
| Operations & asset risk (0.40) | resource_risk 0.25 · technology 0.20 · opex_risk 0.15 · counterparty_om 0.20 · contract_mix 0.20 |
| Financial risk (0.40) | dscr_level 0.35 · dscr_volatility 0.15 · leverage 0.20 · refi_risk 0.10 · structure_protections 0.20 |
| Country & system risk (0.20) | sovereign_tier 0.70 · legal_framework 0.30 |

Level-3 blends: `contract_mix` = 60% contracted-share knot + 40% offtaker-quality
lookup; `structure_protections` = 60% DSRA knot + 40% sweep knot. Basis note: "mirroring
the SHAPE of the published agency PF methodologies (Moody's 'Generic Project Finance',
S&P 'Project Finance Framework') — hand-authored INTERPRETATION... NOT the agencies'
actual tables."

**Notching rules:** phase −1 (tier-1 fixed-price wrap) / −2 (weaker EPC) if under
construction; structural subordination −1 (mezz, <60% senior ahead) / −2 (≥60%, deep
subordination); external support 0/+1(partial)/+2(full wrap), capped at the guarantor's
own rating; net notching clamped to [−3, +2].

**ESG overlay rule:** carbon-intensity percentile → penalty in half-notches (p<50: 0;
<70: 0.5; <85: 1.0; <95: 1.5; ≥95: 2.0); mitigants (SBTi-aligned −0.5; taxonomy revenue
≥66% −0.5 or ≥33% −0.25, larger one applies); `overlay = −round(max(0, penalty −
mitigants))`, floored at −2, never positive.

### 7.3 Full worked example — factor tree → rating (the module's own defaults)

Using `RateRequest`'s **default field values** (a fully self-consistent, verifiable
example — every leaf below is either an exact knot hit or a clean interpolation):
`p90_p50_ratio=0.85, contracted_revenue_pct=80, offtaker_rating=BBB, min_dscr=1.30,
gearing_pct=75, dsra_months=6, cash_sweep_pct=0, contractor_quality=tier1_unwrapped,
country_tier=aaa_aa, technology=proven_conventional, opex_risk=budgeted_with_reserves,
legal_framework=mature, refi_share_pct=0`, no DSCR path/CoV override, no notching or ESG
inputs (senior, no guarantee, operating phase).

**Leaf scores:**

| Leaf | Input | Computation | Score |
|---|---|---|---|
| resource_risk | P90/P50 = 0.85 | exact knot (0.85→70) | **70.00** |
| technology | proven_conventional | lookup | **88.00** |
| opex_risk | budgeted_with_reserves | lookup | **65.00** |
| counterparty_om | tier1_unwrapped | lookup | **72.00** |
| contract_mix | 80% contracted, offtaker BBB | contracted: interp(75→78, 90→88, x=80) = 78+(88−78)×(80−75)/(90−75) = 78+10×⅓ = 81.33; offtaker: 65.00; blend 0.60×81.33+0.40×65.00 | **74.80** |
| dscr_level | min DSCR 1.30x | exact knot (1.30→60) | **60.00** |
| dscr_volatility | no CoV/path given → proxy | cov = (1−0.85)/1.2816 = 0.11704 → 11.704%; interp(10→68,15→55, x=11.704) = 68+(55−68)×(11.704−10)/5 = 68−13×0.3408 = 63.57 | **63.57** |
| leverage | gearing 75% | exact knot (75→65) | **65.00** |
| refi_risk | balloon share 0% | boundary knot (0→90) | **90.00** |
| structure_protections | DSRA 6m, sweep 0% | DSRA: exact knot (6→75); sweep: boundary knot (0→50); blend 0.60×75+0.40×50 | **65.00** |
| sovereign_tier | aaa_aa | lookup | **90.00** |
| legal_framework | mature | lookup | **85.00** |

**Group roll-ups:**
```
Operations   = 0.25×70 + 0.20×88 + 0.15×65 + 0.20×72 + 0.20×74.80
             = 17.50 + 17.60 + 9.75 + 14.40 + 14.96 = 74.21

Financial    = 0.35×60 + 0.15×63.57 + 0.20×65 + 0.10×90 + 0.20×65
             = 21.00 + 9.5355 + 13.00 + 9.00 + 13.00 = 65.5355

Country      = 0.70×90 + 0.30×85 = 63.00 + 25.50 = 88.50

tree_score   = 0.40×74.21 + 0.40×65.5355 + 0.20×88.50
             = 29.684 + 26.2142 + 17.70 = 73.5982  →  round → 73.60
```

**tree_rating:** score 73.60 falls in the band `72 ≤ score < 78` → **BBB**.

**Notching:** operating phase (0), senior (0), no guarantee (0) → net 0 notches →
`notched_rating = BBB` (unchanged).

**ESG overlay (separate illustration, since `esg` is optional and omitted by default):**
take `carbon_intensity_percentile = 90`, no mitigants. Penalty band for `85 ≤ p < 95` is
1.5 half-notches; mitigants = 0; `net_half = 1.5`; `overlay = −min(2, int(1.5+0.5)) =
−min(2, 2) = −2`. Applying `_apply_notches("BBB", −2)`: `RATING_SCALE` index of BBB is 3
(`["A","A-","BBB+","BBB","BBB-",...]`); `new_index = idx − notches = 3 − (−2) = 5` →
`RATING_SCALE[5] = "BB+"`. **A 90th-percentile-carbon-intensity deal with no SBTi target
and no taxonomy-aligned revenue drops two full notches, from BBB to BB+.** If the same
deal instead had `sbti_aligned=True` and `taxonomy_revenue_pct=40%` (≥33%, <66%),
mitigants = 0.5+0.25 = 0.75, `net_half = max(0, 1.5−0.75) = 0.75`, `overlay = −min(2,
int(0.75+0.5)) = −min(2, 1) = −1` — the same deal only drops one notch (to BBB-) once
partially mitigated.

**PD term structure (log-survival interpolation, BBB anchors 0.17%/1.50%/3.00% at
1y/5y/10y):** hazard anchors `h1 = −ln(1−0.0017) ≈ 0.0017014`, `h5 = −ln(1−0.0150) ≈
0.015113`, `h10 = −ln(1−0.0300) ≈ 0.030459`. Between years 1 and 5, hazard is linearly
interpolated: at `t=3`, `h = h1 + (h5−h1)×(3−1)/4 ≈ 0.0017014 + 0.0134116×0.5 ≈
0.0084072`, giving `cum_PD_3 = (1−e^(−0.0084072))×100 ≈ 0.837%` — sitting between the
0.17% (t=1) and 1.50% (t=5) anchors as the constant-hazard assumption implies, not a
straight-line average of the two.

### 7.4 Edge-case rubrics

- **DSCR volatility fallback chain** (`_dscr_volatility`): direct `dscr_cov_pct` input
  wins if given; else a P50 DSCR time-series CoV (`stdev/mean`) is computed, and if a P90
  path is also supplied, `implied_sigma = mean((P50−P90)/P50) / 1.2816` (P90 treated as the
  1.2816σ one-sided lower tail under a normal approximation) is taken as `max(CoV_ts,
  implied)` — conservative; else the module falls back to the same 1.2816σ proxy applied
  directly to the scalar `p90_p50_ratio`.
- **Guarantor cap:** an uplift from `guarantee=partial/full` is capped so the notched
  rating never exceeds the stated `guarantor_rating`, even if the raw notch arithmetic
  would push it higher.
- **Clamp/floor discipline:** notching net is clamped to `[-3, +2]` before being applied;
  the ESG overlay is separately floored at `-2` and can never be positive (worsening
  carbon intensity can only hurt, never help, the rating).
- **Weight overrides** are dotted-path (`"financial"`, `"financial.dscr_level"`) and
  *sibling groups are renormalized to sum to 1* after any override — a user can zero out
  one child and the rest absorb the freed weight proportionally.
- **"With ESG overlay" PD/EL profile is only returned when it differs** from the
  no-overlay profile (`pd_term_structure.with_esg_overlay` is `None` when the overlay is 0
  notches), so the response doesn't duplicate an identical curve.

### 7.5 Companion analytics

- **Driver decomposition** (legacy scorecard): `contribution_i = weight_i × (factor_score_i
  − 60)`, `notches_i = contribution_i / 6` — ranks which factor gained/cost notches versus
  the BBB- anchor; `key_strengths`/`key_weaknesses` surface the top-3 by
  `|notches_vs_anchor| > 0.15`.
- **Peer benchmark scatter** (`GET /ref/peers`, Panel 5): 12 hand-authored,
  "anonymised-but-realistic" PF credit profiles (sector, contracted %, min DSCR, gearing,
  rating) spanning solar/wind/CCGT/BESS/PPP/LNG/hydro — explicitly labeled "ILLUSTRATIVE —
  not real transactions, not agency data," used only for a min-DSCR × gearing scatter
  colored by rating.
- **Expected loss panel:** `EL = PD(horizon) × LGD × EAD`, both the legacy 1/5/10y panel
  and the v2 full 1–10y PD-term-structure EL profile (`cum_el_pct = cum_pd_pct × lgd`).

### 7.6 Data provenance & limitations

- **No PRNG anywhere** — every score is a documented knot interpolation, categorical
  lookup, or weighted roll-up of a user input.
- **PD table is hand-authored and explicitly indicative** — "approximate, refresh from
  the studies for production" — not a live agency feed and not guaranteed to match any
  specific Moody's/S&P published table exactly.
- **Factor-tree weights and knot tables are a labeled INTERPRETATION** of the *shape* of
  published agency PF methodologies, not the agencies' actual criteria — the docstring is
  explicit that this is hand-authored, not licensed agency IP.
- **ESG overlay is a labeled interpretation** of the agencies' published ESG credit-factor
  *approach* (Moody's ESG Issuer Profile Scores, S&P ESG credit factors framing), not their
  actual scoring methodology.
- **Peer profiles are illustrative**, not real transaction data — useful for benchmarking
  shape (DSCR × gearing × rating clustering by sector) but not for citing specific deals.
- **Guide/atlas note:** the auto-generated `docs/module_atlas/modules/pf-credit-rating-engine.md`
  function-map lists `Moody`, `mean`, `published`, `statistics`, `studies` as "shared
  database tables" — an artifact of the atlas generator parsing prose/import tokens (e.g.
  `from statistics import mean, pstdev`, and the word "published" inside the PD-basis
  citation string), not real data-lineage; no narrative guide/code mismatch was found for
  the rating methodology itself.

## 8 · Model Specification

**Status: implemented.**

**8.1 Purpose & scope.** Produce an indicative, fully transparent project-finance credit
rating from transaction-level inputs — for lenders sizing risk-weighted capital, sponsors
benchmarking a term sheet against peer transactions, and advisors preparing a rating-agency
presentation — without requiring a live agency engagement. Outputs a rating notch, a 1–10y
PD/EL profile, and full driver/factor transparency.

**8.2 Conceptual approach.** A three-level weighted factor tree (mirroring the published
agencies' PF methodology *shape*) rolls transaction inputs up to a 0–100 score, mapped to
a rating band via a fixed, documented score-to-notch map. A deterministic notching chain
then adjusts for structural features (construction phase, subordination, external
guarantees) that a flat scorecard cannot capture, followed by an ESG/transition overlay
framed on the agencies' published ESG credit-factor approach. The final rating indexes into
a hand-authored PD anchor table, interpolated across the full 1–10y horizon by a
constant-hazard (log-survival) assumption between anchors — avoiding the need to hand-author
ten separate PD points per rating.

**8.3 Mathematical specification.**
```
Leaf score_i = f_i(input_i)                    (knot interpolation or categorical lookup)
Group score_g = Σ_i w_i,normalized · score_i    (level-2 roll-up, sibling-renormalized)
Tree score    = Σ_g w_g,normalized · score_g     (level-1 roll-up)
Tree rating   = band_map(Tree score)             (descending score-floor table)

Notched rating = apply_notches(Tree rating, clamp(-3,+2, n_phase + n_sub + n_support))
Final rating   = apply_notches(Notched rating, -round(max(0, penalty - mitigants)))

PD interpolation (log-survival, constant hazard between anchors):
  h(t) = -ln(1 - PD_anchor(t))
  h(t) linear-interpolated in t between (1,h1), (5,h5), (10,h10)
  cum_PD(t) = 1 - exp(-h(t))
  marginal_PD(t) = cum_PD(t) - cum_PD(t-1)
  EL(t) = cum_PD(t) x LGD x EAD
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Factor weights (L1/L2/L3) | `w_*` | Hand-authored, shaped on Moody's/S&P PF methodology structure (labeled interpretation) |
| Knot tables (DSCR, gearing, DSRA, sweep, contracted %, refi share, DSCR CoV, P90/P50) | `KNOTS_*` | Hand-authored, documented at `/ref/scorecard` |
| Categorical scores (offtaker, contractor, country, technology, opex, legal) | lookup tables | Hand-authored, documented at `/ref/scorecard` |
| PD anchors (1y/5y/10y by rating) | `PD_TABLE` | Indicative, derived from Moody's/S&P PF default study aggregates |
| LGD default | 35% | Moody's PF ultimate recovery ~80% ⇒ senior-secured LGD 20–35% |
| ESG penalty/mitigant schedule | half-notch table | Labeled interpretation of Moody's ESG Issuer Profile Scores / S&P ESG credit factors |
| Rating band map | score → notch | Hand-authored, anchored so BBB- floor = 66 (crossover-market convention) |

**8.4 Data requirements.** P90/P50 resource ratio (or a DSCR path for the volatility
sub-factor), contracted revenue share and offtaker rating, min DSCR, gearing, DSRA months,
cash sweep %, contractor/O&M tier, country tier, technology track record, opex-risk
category, legal-framework maturity, refinancing (balloon) share. Optional: seniority/
subordination depth and guarantee terms for notching; carbon-intensity percentile, SBTi
status and taxonomy-aligned revenue % for the ESG overlay; LGD and exposure for the EL
panel.

**8.5 Validation & benchmarking.** `GET /ref/peers` supplies 12 hand-authored peer
profiles for a DSCR×gearing×rating scatter — a shape check, not a statistical validation.
Production validation would compare tree-rating outputs against actual agency ratings for
transactions with comparable DSCR/gearing/contract profiles, and recalibrate the PD anchor
table directly from the cited Moody's/S&P PF default studies rather than the current
hand-authored approximation.

**8.6 Limitations & model risk.** This is explicitly an *indicative* scorecard, not an
agency rating — the module states this in the response payload itself
(`rating_scale_note`). The factor-tree weights, knot tables, notching rules and ESG overlay
are all hand-authored interpretations of the agencies' published methodology *shapes*, not
licensed replicas of their actual criteria, and will diverge from a real agency outcome for
any specific transaction. The PD table is an approximate aggregate, not a live default-study
feed, and should be refreshed periodically against updated Moody's/S&P PF studies. The
log-survival PD interpolation between the 1/5/10y anchors assumes constant hazard within
each interval, which will understate/overstate marginal PD near inflection points (e.g., a
transaction transitioning from construction to operation partway through the 1–5y window).

## 9 · Future Evolution

### 9.1 Evolution A — Calibrate the scorecard against real PF default data (analytics ladder: rung 2 → 4)

**What.** §7 shows a genuinely rigorous tier-A engine: `POST /rate` runs a transaction through two parallel scorecards (legacy 6-factor + v2 three-level factor tree), a notching chain (construction/subordination/guarantee, ±3/+2 caps), an ESG/transition overlay monotone in carbon-intensity percentile, and a 1–10y PD term structure by log-survival interpolation of hand-authored PD anchors, plus an EL profile (`PD×LGD×EAD`). The docstring is honest: "No PRNG — every number is a documented mapping," and `GET /ref/scorecard` discloses every weight/knot/notching rule. The one soft spot: the PD anchors and factor weights are hand-authored agency-*style*, not calibrated to observed PF defaults. Evolution A closes that.

**How.** (1) Calibrate the 1/5/10y PD anchors against real project-finance default data — Moody's PF default studies (referenced in the `Moody`/`studies` tables) and the GEMs consortium PF default database publish PF-specific PD/LGD curves by sector and phase; fit the anchors to those rather than hand-setting. (2) Back-test the scorecard's rating output against the 12 hand-authored peer profiles (`GET /ref/peers`) and, better, against real rated PF transactions — the rung-3 benchmarking step, feeding the roadmap's "every tier-A flagship pinned" target with a `bench_quant` case per rating band. (3) Rung-4: layer a PD forecast conditioned on macro/scenario inputs (the platform's NGFS data) so ratings are scenario-responsive.

**Prerequisites.** PF default data (Moody's studies are partially public; GEMs publishes aggregate curves); the engine already exposes every parameter via `/ref/scorecard`, so calibration is a data-fitting exercise, not a rebuild. Blast radius is 3 modules — pin before recalibrating. **Acceptance:** PD anchors reproduce published PF default curves within tolerance; rating output back-tests against real transactions; scenario inputs shift PDs.

### 9.2 Evolution B — Credit-analyst copilot with tool-called rating (LLM tier 2)

**What.** A copilot for PF credit analysts: "rate this 500MW solar project with a 15-year PPA and construction risk", "why did the ESG overlay notch it down?", "what's the 5-year PD and expected loss?", "how does it compare to the peer set?" — executed against `POST /rate` and the `/ref/scorecard` and `/ref/peers` endpoints, decomposing the rating into its factor-tree, notching, and overlay contributions.

**How.** Tool schemas from the module's OpenAPI operations (all Pydantic-typed, no PRNG — ideal grounding); system prompt from this Atlas page's §7 methodology and the `/ref/scorecard` disclosure (every weight and rule) as the grounding corpus. The rating explanation decomposes the score exactly as the engine returns it — legacy score, tree rating, each notch applied, the ESG overlay with-vs-without — with the fabrication validator matching every score/notch/PD to the tool response. The peer-benchmark scatter (Panel 5) grounds "how does it compare" answers. This engine's full parameter disclosure makes it the batch's strongest tier-2 candidate.

**Prerequisites.** None hard — `/rate` and both `/ref` endpoints exist and the engine is PRNG-free; version-stamp the responses for provenance per the roadmap. **Acceptance:** every rating/notch/PD figure traces to a `/rate` response; the notching explanation matches the applied chain; the copilot refuses to rate inputs outside the scorecard's defined ranges (honest-null per the engine's own convention).