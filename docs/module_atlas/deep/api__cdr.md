## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain — it is a backend-only service consumed by
frontend CDR modules. The sections below document the engine as implemented in
`backend/services/cdr_engine.py`, exposed at `/api/v1/cdr` via `backend/api/v1/routes/cdr.py`.)*

### 7.1 What the module computes

`CDREngine` is a pure stateless calculator (no PRNG, no DB) with six assessments over an
8-method IPCC AR6 CDR taxonomy (BECCS, DACCS, enhanced weathering, biochar, ocean alkalinity
enhancement, afforestation, soil carbon, blue carbon):

1. **Quality assessment** (`POST /quality-assessment`) — a BeZero-style 0–100 quality score and
   AAA–CCC letter rating:
   ```
   quality = 0.30·additionality + 0.25·permanence + 0.20·verification
           + 0.15·leakage + 0.10·co_benefits
   ```
2. **LCOR** (`POST /lcor`) — levelised cost of removal via the standard annuity method:
   ```
   annuity = r / (1 − (1+r)^−lifetime)
   LCOR    = (CAPEX·annuity + OPEX_pa) / capacity_tCO2_pa
   ```
   with ±20% CAPEX and ±2pp discount-rate sensitivities; break-even carbon price ≡ LCOR.
   Project IRR (bisection on NPV=0, bracket −0.9999…10) is computed **only** when a carbon
   price is supplied; otherwise it is an honest `null`.
3. **Oxford Principles alignment** (`POST /oxford-principles`) — weighted 4-principle score.
4. **Article 6.4 eligibility** (`POST /article-6-4`) — boolean gate + supervisory approval score.
5. **VCMI claims tier** (engine method `assess_vcmi_claims`; route `POST /vcmi-claims` exists in
   code though it is absent from the trace-label list) — Silver/Gold/Platinum determination.
6. **Portfolio roll-up** (`POST /portfolio`) — durable share, average permanence, mean BeZero
   score over *rated* projects only, Oxford alignment %, method diversity.

### 7.2 Parameterisation / scoring rubrics

**Quality components** (all 0–100):

| Component | Rule | Provenance |
|---|---|---|
| Additionality | caller input, clamped 0–100 | user-supplied assessment |
| Permanence | ≥1000 yr→100 · ≥200→85 · ≥100→70 · ≥50→55 · else 35 | step function, engine-authored |
| Verification | isometric/puro_earth→90 · gold_standard/article_6_4→80 · else 65 | tiering of real standards |
| Leakage | `100 − 1.5·leakage_pct` (clamped) | inverted linear penalty |
| Co-benefits | `min(100, 20·count(co_benefits))` | method taxonomy counts |

**BeZero rating bands:** AAA ≥85, AA ≥75, A ≥65, BBB ≥55, BB ≥45, B ≥35, CCC otherwise —
mirrors BeZero Carbon's published letter scale (band cut-offs are engine-authored).

**Method taxonomy (excerpt):** permanence 30 yr (soil carbon) → 10,000 yr (enhanced weathering,
OAE); cost ranges $5–50/t (afforestation) → $200–600/t (DACCS); TRL 4 (OAE) → 9 (afforestation).
Values are order-of-magnitude consistent with IPCC AR6 WGIII Ch.12 and industry cost surveys,
hard-coded in `CDR_METHODS`.

**Buffer pools by verification standard** (deducted from gross removals): Isometric 3%,
Puro.earth 5%, Article 6.4 5%, Gold Standard 10%, SD VISta 12%, Verra VM0042 15%, Climate Action
Reserve 18% — plus any caller-supplied `additional_buffer_pct`.

**Oxford weights:** P1 cut-emissions-first 0.30, P2 shift-to-durable 0.25, P3 no lock-in 0.25,
P4 support innovation 0.20 (mirrors the 2024 revised Oxford Principles' four elements; weights
are engine-authored). P1 = `100 − 3·max(0, residual% − 5)`; P2 = 100 if method is durable
(≥200 yr) *and* preferred, 70 with a shift plan, else 30; P3 = 90/20 boolean with a hard 5 for
any method containing "oil" (EOR guard); P4 rewards frontier TRL (TRL ≤5→90, ≤7→70, else 50).

**Article 6.4:** eligibility = authorisation ∧ corresponding adjustment ∧ SD safeguards.
Approval score = `0.4·(80|20) + 0.35·(75|10) + 0.25·(70|20)` over the three booleans. Host-country
risk uses two hard-coded ISO-code sets (high: MM, VE, AF, SD, YE, LY, SO → 30; medium: MG, CD, CF,
GN, NE, ML → 60; else 85). ITMO premium is 0 without a CA, caller-supplied or `null` with one —
never fabricated.

**VCMI tiers:** Silver = SBTi S1+2 + S3 disclosure + ≥100% residual coverage + quality ≥60;
Gold raises quality to ≥70; Platinum requires ≥110% coverage and quality ≥80.

### 7.3 Calculation walkthrough

Quality: the caller supplies method, standard, permanence years, additionality score and leakage %.
The engine looks up the method's co-benefit count and the standard's buffer %, computes the five
component scores, blends them with the §7.2 weights, maps to a letter rating, and nets the buffer
pool out of gross removals (`net_credits = removals·(1 − buffer%/100)`). Portfolio: each project's
*caller-supplied* quality score enters the mean (missing scores are counted in
`quality_rated_project_count` but excluded, returning `insufficient_data` when none exist);
durable share is the removal-weighted fraction with permanence ≥200 yr; each project is also run
through a default-parameter Oxford assessment to yield `oxford_alignment_pct` (share scoring ≥60).

### 7.4 Worked example — biochar under Puro.earth (route defaults except method/standard)

Inputs: 10,000 tCO₂/yr, permanence 100 yr, additionality 75, leakage 5%.

| Step | Computation | Result |
|---|---|---|
| Additionality | clamp(75) | 75.0 |
| Permanence | 100 yr → band ≥100 | 70.0 |
| Verification | puro_earth | 90.0 |
| Leakage | 100 − 1.5×5 | 92.5 |
| Co-benefits | biochar has 4 → 4×20 | 80.0 |
| Quality | 0.30·75 + 0.25·70 + 0.20·90 + 0.15·92.5 + 0.10·80 | **79.88** |
| Rating | 79.88 ≥ 75 | **AA** |
| Buffer | 5% × 10,000 | 500 tCO₂ |
| Net credits | 10,000 − 500 | **9,500 tCO₂** |

LCOR with route defaults (DACCS, 50 ktCO₂/yr, CAPEX $200M, OPEX $8M/yr, 20 yr, 8%):
annuity = 0.08/(1−1.08⁻²⁰) = 0.10185; annualised CAPEX = $20.37M; total $28.37M/yr →
**LCOR ≈ $567.41/tCO₂** — inside the engine's own $200–600/t DACCS cost range, and equal by
construction to the break-even carbon price.

### 7.5 Reference endpoints

`GET /ref/cdr-methods`, `/ref/verification-standards`, `/ref/oxford-principles` expose the raw
constant tables (taxonomy + BeZero bands; standards + Article 6.4 criteria; Oxford principles +
VCMI levels) with `source` strings naming the underlying public standards — these power frontend
dropdowns and tooltips in the CDR-family pages.

### 7.6 Data provenance & limitations

- **No synthetic PRNG data**: unlike most frontend modules, this engine contains no
  `sr(seed)`-style generator; every quantitative input is caller-supplied and every constant is a
  hard-coded lookup. Nulls are returned where a real market input is missing (IRR, ITMO premium,
  unrated portfolios).
- Scoring weights, band cut-offs and the 30/60/85 country-risk scores are engine-authored
  calibrations *inspired by* the named standards, not published coefficients — BeZero's actual
  rating is analyst-driven, not a fixed linear blend.
- Permanence is taken per method category, not per project MRV evidence; leakage is a single
  scalar (no activity-shifting vs market leakage split); LCOR ignores tax, degradation, ramp-up
  and financing structure; Article 6.4 "additionality" is hard-assumed `True`.
- Country risk covers only 13 hard-coded ISO codes; all other countries default to low risk.

### 7.7 Framework alignment

- **IPCC AR6 WGIII Ch.12** — the 8-method taxonomy and land/engineered/ocean classification
  follow AR6's CDR categorisation.
- **BeZero Carbon Rating** — BeZero assigns AAA–CCC letter ratings reflecting the likelihood a
  credit achieves 1 tCO₂e; the engine approximates this analyst judgement with a fixed 5-factor
  weighted score over the same risk pillars (additionality, permanence/durability, leakage,
  verification, co-benefits).
- **Oxford Principles (2024 revision)** — cut emissions first, high-integrity offsets, shift to
  durable removals, support the market's transition; implemented as the 4-principle weighted score.
- **VCMI Claims Code of Practice (2023)** — real VCMI requires a published SBTi-validated target,
  full GHG inventory and Carbon Integrity Silver/Gold/Platinum tiers based on the share of
  *remaining* emissions covered by high-quality (CCP-approved) credits; the engine encodes this as
  the boolean-gate + coverage% + quality-threshold cascade.
- **Paris Agreement Article 6.4 / Decision 3/CMA.3** — host-country authorisation, corresponding
  adjustments (preventing double counting toward two NDCs) and SD safeguards as eligibility gates
  for A6.4ERs.
- **Puro.earth CORC, Isometric VVS, Gold Standard GS4GG, Verra VM0042/SD VISta, CAR** — used as
  the verification-tier and buffer-pool lookup; buffer percentages emulate each program's
  non-permanence buffer mechanics.
- **SBTi Net-Zero Standard** — Scope 1+2 alignment prerequisite in the VCMI gate.
