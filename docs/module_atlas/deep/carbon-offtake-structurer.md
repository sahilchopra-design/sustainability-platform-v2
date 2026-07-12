## 7 · Methodology Deep Dive

### 7.1 What the module computes

`frontend/src/features/carbon-offtake-structurer/pages/CarbonOfftakeStructurerPage.jsx` (1,529
lines) is an ERPA (Emission Reduction Purchase Agreement) structuring desk. A user describes a
carbon-credit project (methodology, stage, country, annual volume, vintages) and a contract
structure (spot-indexed forward / fixed-price forward / prepay / streaming, tenor, indexation
weight, floor/ceiling collar, discount rate), and the page computes the deal period-by-period:

```
haircut_t          = delivery-risk haircut, ramped from a stage default toward the issuing-stage floor
expectedDelivered_t = contracted_t × (1 − haircut_t / 100)                      [fixed-schedule contracts]
                    = issuance_t × (1 − haircut_t / 100) × streamingPct         [streaming contracts]
qBench_t           = benchmark_t × qualityFactor                               (benchmark_t = benchPrice·(1+drift)^t)
rawPrice_t         = qBench_t                                                  [spot_forward — 100% indexed]
                   = (1 − w)·fixed + w·qBench_t                                [fixed_forward / prepay / streaming, w = indexation %]
effPrice_t         = min(max(rawPrice_t, floor), ceiling)                      (collar)
cash_t             = expectedDelivered_t × effPrice_t
pv_t               = cash_t / (1 + discountRate)^t
```

Two live engine calls feed the deal: `POST /api/v1/carbon-credit-quality/score-project`
(ICVCM CCP quality score, standard/methodology/type/vintage/volume → 0–100 score, grade, CORSIA
flag, permanence risk, price range) and `GET /api/v1/carbon-credit-quality/ref/price-benchmarks`
(category median $/t used as the benchmark price, editable). Everything downstream — haircuts,
buffer-pool/reversal EL, delivery-optionality bands, ratchet/CPI/FX indexation, the ERPA portfolio
book, the CORSIA/Article-6 overlay, and the net-zero retirement planner — is computed locally in
the page from user terms plus the two live responses. Backing engine:
`backend/services/carbon_credit_quality_engine.py`, routed by
`backend/api/v1/routes/carbon_credit_quality.py`.

### 7.2 Quality-score engine (traced from `carbon_credit_quality_engine.py`)

`score_project()` is a deterministic additive rubric, not a market-observed score:

```python
base_score = 70.0
if std_info["ccp_label_eligible"]: base_score += 10
if ccp_result["ccp_eligible"]:     base_score += 10
if vintage_year >= 2020:           base_score += 5
elif vintage_year < 2015:          base_score -= 15
if perm["risk_score"] > 0.6:       base_score -= 10
if standard == "cdm" and vintage_year < 2015: base_score -= 10
quality_score = clip(base_score, 0, 100)
```
Grade bands: A ≥ 85, B ≥ 70, C ≥ 55, else D. `ccp_eligible` requires ≥ 8 of 10 ICVCM CCP criteria
to pass (`check_ccp_eligibility`) **and** `standard` in {vcs, gold_standard, american_carbon_registry,
climate_action_reserve, art6_itmo} — CDM and Plan Vivo can never reach CCP eligibility in this
rubric. Price range = category benchmark (`nature_based_removal` for AFOLU/blue-carbon,
`tech_removal` for DAC, `avoidance` for RE/cookstoves/methane/industrial) × 1.20 if CCP-eligible
(the engine's hard-coded 20% CCP label premium), else ×1.0. CORSIA eligibility is looked up
directly from `STANDARDS[standard].corsia_eligible` (vcs/gold_standard/ACR/CAR/art6_itmo = True;
cdm/plan_vivo = False) — independent of the quality score.

### 7.3 Worked example — default deal (Rio Verde REDD+ Cluster)

Page defaults: methodology `VM0015` (standard `vcs`, type `redd_plus`), stage `registered`,
annual volume 250,000 t, vintage start 2026; contract `fixed_forward`, tenor 7y, fixed price
$24/t, indexation 30%, benchmark drift 4%/yr, floor $15, ceiling $45, discount rate 10%, ramp 5y;
quality-map slope 30 / pivot 50.

**Quality score** (`score_project`, standard=vcs, type=redd_plus, vintage=2026):
`base=70 +10 (vcs ccp_label_eligible) +10 (ccp_eligible=True, 10/10 criteria pass since
perm.risk_score=0.6 is not >0.7) +5 (vintage≥2020) = 95.0` → **grade A**. Price range:
nature_based_removal (15–60) × 1.20 (CCP premium) = **$18.0–$72.0/t**.

**Quality → price factor**: `1 + 30%·(95−50)/50 = 1 + 30%·0.9 = ×1.270`.

**Period 1 economics** (t=1, year 2026): stage haircut 15% (registered), ramp t=1 → 0% progressed
→ haircut stays 15%. `expectedDelivered = 250,000 × 0.85 = 212,500 t`. Live benchmark median for
`nature_based_removal` = $28/t (from `PRICE_BENCHMARKS`) → `benchT = 28 × 1.04¹ = $29.12/t` →
`qBenchT = 29.12 × 1.270 = $36.98/t`. Blended contract price (fixed_forward, w=30%):
`rawPrice = 0.70×24 + 0.30×36.98 = 16.80 + 11.09 = $27.89/t`. Collar (floor 15 / ceiling 45):
27.89 is inside the band → `effPrice = $27.89/t` unchanged, both payoffs zero.
`cash₁ = 212,500 × 27.89 ≈ $5,927,628`; discounted at 10%: `pv₁ = 5,927,628 / 1.10 ≈ $5,388,753`.

**Haircut maturation ramp** (5y to the issuing-stage floor 5%): haircut(t) =
`max(5, 15 − 10·min((t−1)/5, 1))` → 15, 13, 11, 9, 7, 5, 5% for t = 1…7 — confirms the linear
ramp collapses exactly to the 5% floor at t=6 and holds flat thereafter.

### 7.4 Buffer pool & reversal-risk EL (AFOLU non-permanence)

`meth.type = redd_plus` is in `AFOLU_TYPES`, so the buffer model applies. Documented recursion
(one period, using period-1 numbers above; registry `vcs` → buffer default 20%, user reversal
probability 1.0%/yr, insurance 2.0%/yr):

```
bufferContrib₁ = expectedDelivered₁ × b = 212,500 × 0.20 = 42,500 t
netToBuyer₁    = 212,500 × 0.80        = 170,000 t
cumBuffer₁ = 42,500 t;  cumNet₁ = 170,000 t
grossEL₁   = p × cumNet₁ = 0.01 × 170,000 = 1,700 t/yr        (expected annual reversal)
covered₁   = min(1,700, 42,500) = 1,700                       (buffer absorbs it entirely)
netEL₁     = 1,700 − 1,700 = 0 t
grossEL₁$  = 1,700 × 27.89 ≈ $47,421
insPrem₁$  = 0.02 × 170,000 × 27.89 ≈ $94,842
```
Because the 20%-of-issuance buffer contribution vastly exceeds a 1%/yr reversal probability
applied to a single year's stock, `netEL` stays at zero in year 1 — it only turns positive once
cumulative stock grows large enough that `p × cumNet > cumBuffer`, i.e. once
`cumNet > cumBuffer / p = cumBuffer × 100` (at p = 1%). With b=20% contributed each period,
`cumBuffer/cumNet` stays a constant 20/80 = 0.25 (both grow at the same rate under a flat delivery
schedule), so `netEL` is structurally zero at p = 1% here — a useful check on the model's
internal consistency, and a reason the desk should test higher reversal-probability scenarios
(e.g. p = 30%/yr) to see the buffer actually bind.

### 7.5 Delivery optionality (deterministic ±σ bands)

`priceBand(P0, σ, z, τ=1) = P0 · e^{z·σ·√τ}` — a driftless lognormal percentile ladder, not a
Monte Carlo simulation. With period-1 reference `P0 = qBenchT₁ = $36.98`, `K = effPrice₁ = $27.89`,
default σ = 40%, flex band ±15% of the 250,000 t/yr contracted volume (`flexVol = 37,500 t`):
`P(+1σ) = 36.98·e^{0.40} = 36.98 × 1.4918 = $55.17`; buyer call value at +1σ =
`37,500 × max(55.17−27.89, 0) = 37,500 × 27.28 ≈ $1,023,000`. `P(−1σ) = 36.98·e^{−0.40} =
36.98 × 0.6703 = $24.79`; seller put value at −1σ = `37,500 × max(27.89−24.79,0) = 37,500 × 3.10
≈ $116,250`. The put/call asymmetry (seller's downside put is worth far less than the buyer's
upside call at ±1σ) is a direct consequence of the strike (K=$27.89) sitting well below the
reference forward (P0=$36.98) — the position is already deep "in the money" for the buyer's call
side before any vol is applied.

### 7.6 Mark-to-benchmark P&L & portfolio aggregation

`bookAgg` (§9 ERPA portfolio book) marks each stored contract to the live category benchmark:
`mtb = (benchNow − avgPrice) × totalVol`. E.g. the illustrative "Sumatra Mangrove Restoration"
seed (`blue_carbon`, contract price $21.5/t, benchmark category `nature_based_removal` median
$28/t, 300,000 t aggregate delivered over 8 periods per the illustrative delivery schedule) marks
at `(28 − 21.5) × 300,000 = +$1,950,000` — a positive mark because the fixed contract was struck
below today's category median. This is explicitly labeled an indicative screen (category median as
observable proxy), not a fair-value mark of the bespoke collar/prepay terms. Concentration is
measured by Herfindahl-Hirschman index on volume shares (`hhi = Σ(share×100)²`), with the UI's own
DoJ/FTC-style bands (>2,500 concentrated, 1,500–2,500 moderate, <1,500 diversified).

### 7.7 Data provenance & limitations

- **Live, computed from real code**: quality score/grade/CCP/CORSIA flag/price range
  (`carbon_credit_quality_engine.score_project`), category price benchmarks
  (`ref_price_benchmarks`), CORSIA 2024–26 eligible-programme list and vintage rule
  (`ref_corsia_eligibility`).
- **Labeled modeling defaults (editable)**: delivery-risk haircuts by stage (concept 50%,
  validated 30%, registered 15%, issuing 5%) are hand-authored market-convention ranges, not
  observed transaction data; registry buffer-pool defaults (VCS 20%, Gold Standard 20%, CAR 18%,
  ACR 16%, ART TREES 5%, CDM 0%) are stated as indicative of each registry's published regime, not
  a live pull of the registry's risk-tool output; the quality→price linear mapping
  (`benchmark × (1 + slope·(score−pivot)/50)`, default slope 30%/pivot 50) is a documented,
  user-editable convention, not a fitted market relationship.
- **User assumptions**: benchmark drift, discount rate, volatility for the delivery-optionality
  bands, CA-risk discount / compliance premium, CPI and FX drift, reversal probability, insurance
  premium, net-zero trajectory shape (linear decline to a residual % at the NZ year).
- The reversal-EL model is single-factor linear in the user's reversal probability by
  construction (`grossEL = p × cumNet`) — no hazard-specific (fire/political/tenure) decomposition,
  no time-varying p, no correlation between projects in the buffer/portfolio view.
- The mark-to-benchmark P&L is a category-median proxy, not a discounted re-price of the specific
  collar/prepay/streaming structure — bespoke terms are not revalued.
- SDG co-benefit tags are methodology-family indicative mappings (mirroring the platform's own DCM
  reference catalogue), explicitly superseded by project-specific certification (e.g. GS4GG).

**Framework alignment:** ICVCM Core Carbon Principles Assessment Framework v2.0 (2023) · ICAO
CORSIA Eligible Emissions Unit Criteria (Doc 9501, 2024–2026 cycle) · Paris Agreement Article 6 §§
6.2/6.4 (corresponding adjustments) · Verra VCS AFOLU non-permanence risk tool / Gold Standard A/R
buffer / CAR / ACR risk-based buffer conventions (labeled, not live registry pulls).

## 8 · Model Specification

**Status: implemented.** Every formula below is live code in
`CarbonOfftakeStructurerPage.jsx` (local computation) wired to the two engine endpoints named in
§7.1; nothing in this section is aspirational.

**8.1 Purpose & scope.** Structure and analyze a forward carbon-credit purchase agreement (ERPA)
across four contract archetypes (spot-indexed forward, fixed-price forward, prepay, streaming),
quantify delivery risk, AFOLU non-permanence exposure, price/volume optionality, compliance
eligibility (CORSIA/Article 6), and portfolio-level aggregation — for offtake-desk structuring and
buy-side ERPA negotiation.

**8.2 Conceptual approach.** A period-by-period deterministic cash-flow engine: (i) a live quality
score adjusts a live category-price benchmark via a documented linear map; (ii) a stage-conditioned
haircut (with an optional linear maturation ramp to the issuing-stage floor) derates contracted
volume to expected delivered volume; (iii) the contract price is a fixed/benchmark blend inside an
optional floor/ceiling collar; (iv) AFOLU buffer-pool set-asides and a linear reversal-probability
expected-loss walk run alongside; (v) a driftless lognormal percentile ladder (no simulation) prices
delivery-volume optionality; (vi) a multi-contract book aggregates mark-to-benchmark P&L, quality,
concentration (HHI) and vintage-ladder analytics.

**8.3 Mathematical specification.**
```
qf                = 1 + slope · (score − pivot) / 50 / 100
haircut(t)        = max(issuingHaircut, baseHaircut − (baseHaircut − issuingHaircut) · min((t−1)/ramp, 1))
delivered(t)       = contracted(t) · (1 − haircut(t))                         [scheduled contracts]
                   = issuance(t) · (1 − haircut(t)) · streamPct               [streaming]
price(t)          = (1 − w)·fixed + w · benchmark(t) · qf,  clipped to [floor, ceiling]
cash(t), pv(t)     = delivered(t)·price(t),  cash(t)/(1+r)^t
bufferContrib(t)   = delivered(t) · b;  cumNet(t) = Σ delivered(1−b)
grossEL(t)         = p · cumNet(t);  netEL(t) = max(0, grossEL(t) − cumBuffer(t))
P(z)               = P0 · exp(z·σ·√τ),  z ∈ {−2,−1,0,1,2}
mtb                = (benchmarkNow − contractPrice) · totalVolume
```

**8.4 Data requirements.** Live: ICVCM CCP quality score + CORSIA eligibility + category price
benchmark (both served by the platform's own `carbon_credit_quality_engine`). User: contract terms,
project attributes, haircut/buffer overrides, volatility, discount/CPI/FX assumptions, corporate
net-zero trajectory. None of these require external data feeds beyond what the platform already
serves.

**8.5 Validation & benchmarking.** Internal consistency checks already present in-code: collar
payoff identity `effective = min(max(raw, floor), ceiling)` with floor/ceiling payoffs summing to
the price gap; put-call-style monotonicity of the optionality bands in the vol input; HHI computed
on the standard `Σ(share×100)²` scale reproduced against DoJ/FTC bands. Recommended external
benchmark: reconcile category benchmarks and CCP premium against ICVCM's published assessed-programme
list and observed OTC broker prices; reconcile buffer defaults against each registry's current
risk-tool output for a live deal (labeled as a to-do in-UI).

**8.6 Limitations & model risk.** Haircuts, buffer defaults, and CA-risk/compliance-premium inputs
are desk conventions, not fitted to transaction data — treat as a starting negotiating position, not
a market clearing price. The reversal-EL model is linear in a single user-supplied probability with
no hazard decomposition or time-varying risk. The delivery-optionality ladder is a percentile
scenario table, not a priced American/Asian option — no early-exercise or path-dependency is
modeled. Mark-to-benchmark P&L uses a category median as an observable proxy and does not revalue
collar/prepay-specific optionality already embedded in a stored contract.
