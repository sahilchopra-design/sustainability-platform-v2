# Ppa Structuring Desk
**Module ID:** `ppa-structuring-desk` · **Route:** `/ppa-structuring-desk` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `CREDIT_RATINGS`, `Field`, `Kpi`, `LOAD_SHAPES`, `REG_LEVELS`, `RISK_LEVELS_4`, `SEASON_COLORS`, `SOLAR_COUNTRIES`, `STREAM_COLORS`, `STRUCTURES`, `TURBINE_CLASSES`, `WIND_REGIONS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `TURBINE_CLASSES` | 6 | `label` |
| `WIND_REGIONS` | 16 | `label` |
| `STRUCTURES` | 4 | `label` |
| `LOAD_SHAPES` | 4 | `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtNum` | `(v, d = 1) => (v == null \|\| isNaN(v)) ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: d });` |
| `fmtM` | `(v, d = 1) => (v == null \|\| isNaN(v)) ? '—' : `$${fmtNum(v / 1e6, d)}M`;` |
| `ratio` | `data.p50_generation_mwh > 0 ? data.p90_generation_mwh / data.p50_generation_mwh : 1;` |
| `autoSettleVol` | `useMemo(() => { const cv = num(contractedPct, 80) / 100;` |
| `settleChart` | `useMemo(() => settle.data ? settle.data.per_year.map((y) => ({ year: y.year, 'Settlement ($M)': y.settlement_usd / 1e6 })) : [], [settle.data]);` |
| `creditChart` | `useMemo(() => credit.data ? credit.data.exposure_profile.map((y) => ({ year: y.year, 'Potential exposure ($M)': y.potential_exposure_usd / 1e6, 'Collateral call ($M)': y.collateral_call_usd / 1e6, })) : [], [credit.data]);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/ppa-structuring/shape-analysis` | `shape_analysis` | api/v1/routes/ppa_structuring.py |
| POST | `/api/v1/ppa-structuring/settlement` | `cfd_settlement` | api/v1/routes/ppa_structuring.py |
| POST | `/api/v1/ppa-structuring/credit-exposure` | `credit_exposure` | api/v1/routes/ppa_structuring.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `POST` *(shared)*, `__future__` *(shared)*, `below` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `spot` *(shared)*, `typing` *(shared)*, `vre_penetration_pct` *(shared)*
**Frontend seed datasets:** `CREDIT_RATINGS`, `LOAD_SHAPES`, `REG_LEVELS`, `RISK_LEVELS_4`, `SOLAR_COUNTRIES`, `STRUCTURES`, `TURBINE_CLASSES`, `WIND_REGIONS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/ppa-structuring/ref/capture-rates** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['label', 'basis', 'capture_rate_tiers', 'shape_match_factors', 'default_degradation_pct_yr', 'default_firming_premium_usd_mwh', 'firming_formula'], 'n_keys': 7}`

**GET /api/v1/ppa-structuring/ref/rec-forward** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['label', 'formula', 'spot_usd_mwh', 'drift_pct_yr', 'strip'], 'n_keys': 5}`

**GET /api/v1/ppa-structuring/ref/shape-archetypes** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['label', 'season_days', 'solar', 'wind', 'price', 'load_archetypes', 'load_basis', 'lifecycle_g_co2e_kwh', 'eu_taxonomy_threshold_g_kwh', 'csa_downgrade_grid', 'score_weights_default'], 'n_keys': 11}`

**POST /api/v1/ppa-structuring/credit-exposure** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/ppa-structuring/settlement** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/ppa-structuring/shape-analysis** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/ppa-structuring/structure** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/ppa-structuring/term-sheet-score** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).

| Connected module | Shared via |
|---|---|
| `hybrid-project-workbench` | table:POST, table:below, table:spot, table:vre_penetration_pct |

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`ppa-structuring-desk` (NX2-01) is a single-asset PPA term-sheet structuring desk built on
one deterministic backend route, `backend/api/v1/routes/ppa_structuring.py` (1,426 lines,
no PRNG anywhere — the module docstring states this explicitly), fronted by an 8-panel
React page (`PpaStructuringDeskPage.jsx`, 1,299 lines). It is the densest module in this
batch: 7 endpoints across 3 functional layers.

| Layer | Endpoint(s) | Panel(s) | What it does |
|---|---|---|---|
| Generation | `POST /renewable-ppa/{solar,wind}-yield` (external engine) | 1 | Fetches P50/P90 net capacity factors from the platform's Weibull (wind) / GHI (solar) yield engines |
| Term-sheet valuation | `POST /structure`, `GET /ref/capture-rates` | 2–3 | Period-by-period revenue build for P50 and P90 cases: PPA vs merchant vs REC vs ancillary, firming cost, NPV, contract/merchant value split |
| Hourly shape engine | `POST /shape-analysis`, `GET /ref/shape-archetypes`, `GET /ref/rec-forward` | 4 | Builds 24h×4-season (96-point) generation/price/load archetypes; derives the **capture rate as an output**; prices negative-price hours, curtailment, 24/7 CFE matching, avoided-carbon economics, EU Taxonomy screen |
| Settlement & credit | `POST /settlement`, `POST /credit-exposure` | 5–6 | Two-way CfD/vPPA cash settlement over the 96-point shapes; CSA potential-exposure profile and downgrade-trigger grid |
| Scoring | `POST /term-sheet-score` | 7 | Multi-attribute weighted deal score + NPV sensitivity (±10% on 6 drivers, exact `/structure` re-run) |
| Bankability | `POST /renewable-ppa/ppa-risk` (external engine) | 8 | 5-dimension bankability score (owned by `services/ppa_risk_scorer.py`, out of scope for this route) |

Every number in the `ppa_structuring.py` route traces to a user input or a documented
closed-form formula; every hand-authored default (capture-rate tiers, shape-match factors,
shape archetypes, CSA downgrade grid, score weights) is served back with its literature
basis via a `GET /ref/*` endpoint, so the frontend never needs to hard-code a number the
backend doesn't also expose.

### 7.2 Parameterisation

**Capture-rate tiers** (`CAPTURE_RATE_TIERS`, `_resolve_capture_rate`) — keyed by
same-technology penetration of annual demand:

| Technology | Tier | Capture rate | Basis |
|---|---|---|---|
| Solar | <5% | 98% | Near system-average; midday peak still supportive |
| Solar | 5–10% | 90% | Early cannibalization of the midday block |
| Solar | 10–15% | 82% | Duck-curve regime |
| Solar | 15–25% | 72% | Deep midday depression, frequent zero/negative hours |
| Solar | >25% | 60% | Structural saturation absent storage |
| Wind | <10% | 97% | Weak diurnal correlation |
| Wind | 10–20% | 90% | Windy-hour depression emerges |
| Wind | 20–30% | 84% | Correlated fleet output |
| Wind | 30–40% | 78% | High-penetration regime (DK/IE-like) |
| Wind | >40% | 70% | Saturation absent interconnection/storage |

Basis: Hirth (2013) *"The market value of variable renewables"*, Energy Economics 38
(German/European data: solar value factor ~1.0 at <2% share falling to ~0.5–0.8 at 15%;
wind ~1.1 at low share to ~0.5–0.8 at 30%); Millstein, Wiser et al. (2021) *"Solar and wind
grid system value in the United States"*, Joule 5(7)/LBNL (CAISO solar value factor
~1.2→~0.8 as solar share reached ~15%). Labeled a MODELING DEFAULT, not a market quote —
`capture_rate_pct` can be overridden directly.

**Shape-match factors** (`SHAPE_MATCH_FACTORS`) — share of a delivery shape a technology's
unconstrained profile can serve coincidentally: baseload solar 0.30 / wind 0.55; solar-shaped
solar 0.95 / wind 0.35; pay-as-produced 1.0/1.0 (no shaping needed by construction).

**Degradation defaults** (`DEFAULT_DEGRADATION_PCT_YR`): solar 0.4%/yr (NREL/manufacturer
warranty-class), wind 0.0% (assumed net of availability, already embedded in net CF).

**Shape-engine archetypes** (`GET /ref/shape-archetypes`):
- Solar: half-sine bell `amplitude × sin(π(h+0.5−sunrise)/(sunset−sunrise))^1.5` inside the
  seasonal daylight window, else 0 — seasonal sunrise/sunset/amplitude tuned for a
  mid-latitude (~40–50°N) system.
- Wind: night-peaking diurnal cosine, `seasonal × (1 + 0.15·cos(2π(h−3)/24))` — 15% diurnal
  amplitude, 03:00 nocturnal-jet peak archetype, winter-peaking seasonal multiplier
  (winter 1.25 → summer 0.75).
- Price: hand-authored hourly multiplier ladder (`PRICE_HOUR_MULT`, morning ramp → midday
  solar dip → evening peak) × seasonal multiplier, normalized so the time-weighted annual
  mean equals the flat forward exactly (a flat generator's capture rate = 1.0 by
  construction — a useful sanity identity).
- Load archetypes: `flat` (24/7), `daytime_commercial` (07–19 peak), `evening_residential`
  (18–22 peak) — dimensionless, stylized, not metered load.
- Lifecycle carbon intensity: solar 41, wind 12 gCO₂e/kWh — IPCC AR5 Annex III / NREL LCA
  harmonization medians; EU Taxonomy screen threshold 100 gCO₂e/kWh (Climate Delegated Act
  2021/2139).

**CSA downgrade grid** (`CSA_DOWNGRADE_GRID`) — threshold multiplier shrinks and IA
multiplier grows as counterparty rating falls (AAA: ×2.0 threshold / 0 IA → CCC: ×0.0
threshold / ×3.0 IA). Labeled a hand-authored MARKET-CONVENTION archetype — actual CSAs are
negotiated.

**Term-sheet score weights** (`DEFAULT_SCORE_WEIGHTS`, editable/renormalized): price vs
market 0.30, tenor 0.15, credit 0.20, structure flexibility 0.15, sustainability 0.20.

### 7.3 Transmission channels — core formulas by endpoint

**`POST /structure`** (`_build_case`), for each year *t* = 1..(tenor + merchant tail):

```
gen_t         = capacity_mw × 8760 × (CF/100) × (1 − deg)^(t−1)
ppa_price_t   = ppa_price × (1 + escalation)^(t−1)
capture_price = merchant_forward × capture_rate

pay_as_produced:  ppa_mwh_t = gen_t·cv           merchant_mwh_t = gen_t·(1−cv)
baseload:         block_mwh = capacity_mw·8760·(P50_CF/100)·cv   [fixed, sized off yr-1 P50]
                  matched_t = min(gen_t, block_mwh)·match
                  shortfall_t = block_mwh − matched_t         (bought to firm)
                  surplus_t   = gen_t − matched_t             (sold merchant)
                  firming_cost_t = shortfall_t × (forward + firming_premium)
solar_shaped:     ppa_mwh_t = gen_t·cv·match      merchant_mwh_t = gen_t − ppa_mwh_t

rec_revenue_t       = gen_t × (rec_volume_pct/100) × rec_price     (t ≤ rec_tenor)
ancillary_revenue_t = ancillary_usd_mw_yr × capacity_mw
net_t = ppa_rev_t + merchant_rev_t + rec_rev_t + anc_rev_t − firming_cost_t
NPV   = Σ net_t / (1+r)^t
```

Post-tenor (merchant tail years), 100% of generation sells at `capture_price`. Both a P50
and a P90 capacity-factor case are run through the identical function, giving a downside
retention ratio `p90_vs_p50_net_revenue_pct`.

**`POST /shape-analysis`** builds normalized 24h×4-season MW/price/load arrays
(`_normalize_component` scales the unit archetype so annual energy = `MW × 8760 × CF`
exactly) and derives the **capture rate as an output** (`_shape_stats`):

```
capture_price = Σ_s Σ_h (gen_hs × price_hs × days_s) / Σ_s Σ_h (gen_hs × days_s)
avg_price     = Σ_s Σ_h (price_hs × days_s) / 8760
capture_rate  = capture_price / avg_price
```

with a seasonal/diurnal decomposition identity `capture_rate = seasonal_component ×
diurnal_component`, where the seasonal component prices season-average generation at
season-average prices (kills diurnal structure) and the diurnal residual isolates the
within-day cannibalization. Negative-price hours are injected deterministically
(`_apply_negative_hours`: rank the 96 points by price ascending, force the lowest
`share_pct` of annual hours to the floor level) rather than fabricated by a shape model.
Curtailment is `curtailed_hs = max(0, gen_hs − connection_cap)`. 24/7 CFE matching is
`matched_mwh = Σ min(gen_hs, load_hs) × days_s`; avoided emissions = matched MWh × user
grid marginal intensity; the carbon-adjusted effective price is a labeled *comparability
metric*, not a cash price: `headline_ppa − rec_price − (avoided_tCO2 × shadow_price)/matched_MWh`.

**`POST /settlement`** — two-way CfD/vPPA, volume pro-rata to the generation shape:

```
v_hs    = annual_volume × (gen_hs × days_s) / Σ(gen × days)
settle  = Σ_{settling points} (strike_t − clamp(price_hs, floor, cap)) × v_hs
```

with the negative-price clause skipping points where `price_hs < 0`. A QA-asserted identity:
on flat gen/price shapes with no clause/collar, year-1 settlement equals exactly
`(strike − avg_price) × volume`.

**`POST /credit-exposure`** — documented ±2σ diffusion band, no simulation:

```
PE_t = 2 × σ × √t × remaining_volume_t,   remaining_volume_t = annual_volume × (tenor − t + 1)
collateral_call_t = max(0, PE_t − threshold) + IA
```

**`POST /term-sheet-score`** — five weighted attributes (weights renormalized if
overridden), composite = `Σ weight_i × score_i`:

```
price_vs_market        = clamp(50 + (ppa_price/capture_price − 1) × 250, 0, 100)
tenor                   = clamp(tenor_years/20 × 100, 0, 100)
credit                  = CREDIT_SCORE_MAP[rating]                       (AAA=100 … CCC=15)
structure_flexibility   = clamp(base[structure] + 10·has_collar − 10·neg_price_clause, 0, 100)
sustainability          = clamp(0.5·CFE_pct + 25·taxonomy_pass + 25·recs_bundled, 0, 100)
```
plus an NPV sensitivity table: ±10% on 6 drivers (PPA price, merchant forward, capture
rate, P50 CF, discount rate, REC price), each re-running the *exact* `_build_case` P50 math.

### 7.4 Worked examples (hand-traced)

**(a) Capture rate as output — the cannibalization mechanic.** Take a 4-point toy day
(equal weighting) that mimics the shape engine's duck-curve archetype — low overnight
generation, a midday solar peak coinciding with the price trough, an evening peak with no
generation:

| Point | Gen (MWh) | Price ($/MWh) | Gen×Price |
|---|---|---|---|
| Night | 0 | 40 | 0 |
| Morning | 5 | 30 | 150 |
| Midday (solar peak) | 10 | 20 | 200 |
| Evening peak | 5 | 50 | 250 |
| **Σ** | **20** | | **600** |

```
avg_price     = (40+30+20+50)/4 = 35.00 $/MWh
capture_price = Σ(gen·price)/Σgen = 600/20 = 30.00 $/MWh
capture_rate  = capture_price / avg_price = 30.00/35.00 = 0.8571 → 85.7%
```

This is exactly `_shape_stats`'s formula (`stats["capture_rate"] =
stats["capture_price_usd_mwh"] / stats["time_weighted_avg_price_usd_mwh"]`) applied to a
4-point day instead of 96 points: because the plant's largest output (10 MWh) lands in the
cheapest hour (the midday solar dip) while the priciest hour (evening, $50) gets none of
its own generation, capture (85.7%) falls below the flat average (100%) — the value-factor
erosion the capture-rate tiers in §7.2 are calibrated to.

**(b) `/structure` period build — pay-as-produced, 2-year example.** Solar, 100 MW,
P50 CF 25%, PPA price $45/MWh flat (0% escalation), tenor 2 yrs, contracted volume 80%,
merchant forward $40/MWh at an overridden 80% capture rate ($32/MWh), REC $3/MWh at 100%
volume, 0 ancillary, 0 degradation, 10% discount rate:

```
gen_t (both years)  = 100 × 8760 × 0.25 = 219,000 MWh
ppa_mwh   = 219,000 × 0.80 = 175,200        merchant_mwh = 219,000 × 0.20 = 43,800
ppa_rev   = 175,200 × $45     = $7,884,000
merchant_rev = 43,800 × $32   = $1,401,600
rec_rev   = 219,000 × 1.00 × $3 = $657,000
gross = 7,884,000 + 1,401,600 + 657,000 = $9,942,600 = net (no firming, pay-as-produced)
```
Identical in year 2 (no escalation/degradation in this example). NPV @ 10%:
```
NPV = 9,942,600 × (1/1.10 + 1/1.21) = 9,942,600 × (0.909091 + 0.826446)
    = 9,942,600 × 1.735537 ≈ $17,255,752
```
Realized price = total net / total gen = `19,885,200 / 438,000` = **$45.40/MWh** (above the
$45 PPA strike because the merchant leg realizes $32 against only 20% of volume while
RECs add a further $3/MWh-equivalent uplift). Contracted share (nominal) =
`7,884,000/9,942,600` = **79.3%**; merchant 14.1%; REC 6.6%.

**(c) `/credit-exposure` — non-monotone peak exposure.** σ = $8/MWh-yr, annual volume
250,000 MWh, tenor 3 years, threshold $5M, IA $0:

```
t=1: remaining = 250,000×(3−1+1) = 750,000;  PE_1 = 2×8×√1×750,000  = $12,000,000
t=2: remaining = 250,000×(3−2+1) = 500,000;  PE_2 = 2×8×√2×500,000  ≈ $11,313,708
t=3: remaining = 250,000×(3−3+1) = 250,000;  PE_3 = 2×8×√3×250,000  ≈ $6,928,203
```
Peak exposure is in **year 1** ($12.0M), not at maturity — because `remaining_volume`
shrinks faster (linearly) than the `√t` diffusion term grows. Collateral call at peak =
`max(0, 12,000,000 − 5,000,000) + 0 = $7,000,000`.

**(d) `/term-sheet-score` — composite from the (b)/(a) figures.** ratio = ppa_price /
capture_price = 45/32 = 1.40625 → `price_vs_market = 50 + 0.40625×250 = 151.6` clamped to
**100**. Tenor 15y → `15/20×100 = 75`. Credit BBB → **68**. Structure flexibility
(pay-as-produced, no collar, no neg-price clause) → **90**. Sustainability (assume CFE 60%,
taxonomy pass, RECs bundled) → `0.5×60 + 25 + 25 = 80`. With default weights (0.30/0.15/
0.20/0.15/0.20):
```
composite = 0.30×100 + 0.15×75 + 0.20×68 + 0.15×90 + 0.20×80
          = 30 + 11.25 + 13.6 + 13.5 + 16.0 = 84.35  →  band "strong" (≥75)
```

### 7.5 Edge-case rubrics

- **P90 > P50 guard:** `/structure` rejects `p90_capacity_factor_pct > p50_capacity_factor_pct`
  (422) — P90 must be the 1-in-10 downside.
- **Baseload block sizing is frozen at year-1 P50** regardless of which case (`P50`/`P90`)
  is being valued — this is the deliberate mechanism by which baseload shape risk shows up
  as an *asymmetry* between the two cases rather than a flat scalar.
- **Firming cost is baseload-only.** Solar-shaped structures let the unmatched share slip
  to merchant with no explicit firming charge — a documented modeling choice, not an
  oversight (see docstring §"Delivery structures").
- **Collar ordering:** `/settlement` rejects `floor_usd_mwh > cap_usd_mwh` (422).
- **96-point array length:** any custom `price_shape_usd_mwh` / `gen_shape_mw` /
  `load_shape_custom` must have exactly 96 points (422 otherwise) — season-major
  (winter/spring/summer/autumn) × 24 hours.
- **Zero-generation guard:** `/shape-analysis` hybrid mode requires `solar_mw` and/or
  `wind_mw` > 0 (422).
- **Sensitivity re-run correctness:** the ±10% capacity-factor shock in `/term-sheet-score`
  clamps P90 to `min(P90, new P50)` so the P90≤P50 invariant survives the shock.

### 7.6 Companion analytics

- **Generation case (Panel 1)** calls the platform's separate Weibull (wind) / GHI (solar)
  yield engines (`/api/v1/renewable-ppa/{solar,wind}-yield`) — out of scope for this route
  but the source of the P50/P90 CFs that feed everything downstream.
- **Bankability (Panel 8)** calls `POST /api/v1/renewable-ppa/ppa-risk`, a 5-dimension
  scorecard owned by `services/ppa_risk_scorer.py` — also out of scope for this route; the
  desk page assembles its inputs (tenor, price structure, volume hedged %) from the
  term-sheet panel automatically.
- **REC/GoO forward strip** (`GET /ref/rec-forward`): `forward_k = spot × (1+drift)^k` — a
  labeled compounding convention on user spot/drift, not a market quote (GoO/REC markets
  have no deep long-dated curve).

### 7.7 Data provenance & limitations

- **No PRNG anywhere** in `ppa_structuring.py` — every figure is either a user input or a
  closed-form transform of one, a property the module docstring asserts and the code
  confirms (no `random`/`sr(seed)` calls found).
- **Hand-authored, labeled defaults**, not live market data: capture-rate tiers (Hirth 2013,
  Millstein et al. 2021), shape archetypes (mid-latitude parametric, not metered), CSA
  downgrade grid (market-convention archetype), REC forward drift (user assumption).
  Every one is served with its basis text via a `GET /ref/*` endpoint.
- **Merchant forward is a flat nominal curve** across all merchant years — an explicit
  documented convention for long-dated uncontracted energy where no liquid curve exists
  beyond ~5 years, not a term-structure model.
- **Basis risk band is a stated ±2σ convention** on a user-supplied basis vol, not a
  simulated distribution; likewise the CSA potential-exposure profile is a closed-form
  `2σ√t` diffusion approximation, not a Monte Carlo run.
- **Guide/atlas note:** the auto-generated `docs/module_atlas/modules/ppa-structuring-desk.md`
  function-map lists `POST`, `__future__`, `below`, `fastapi`, `pydantic`, `spot`,
  `vre_penetration_pct` as "shared database tables" — this is an artifact of the atlas
  generator parsing Python import/keyword tokens, not a real data-lineage relationship; no
  narrative guide/code mismatch was found for this module.
- **`ppa-risk` bankability and the yield engines are genuinely separate services** (own
  route files, own methodologies) — this deep-dive documents only `ppa_structuring.py`.

## 8 · Model Specification

**Status: implemented.**

**8.1 Purpose & scope.** Structure and value a single-asset renewable PPA term sheet at
annual and hourly granularity for origination/structuring desks and portfolio risk teams:
period-by-period revenue build (P50/P90), capture-rate-driven cannibalization pricing,
CfD/vPPA cash settlement, CSA credit exposure, and a weighted bankability/deal score —
covering pay-as-produced, baseload, and solar-shaped delivery structures for solar, wind,
and solar+wind hybrid assets.

**8.2 Conceptual approach.** Two linked engines. (i) An **annual valuation engine**
(`/structure`) that degrades/escalates generation and PPA price on separate paths, splits
volume into contracted vs merchant per the delivery structure's shape-match factor, discounts
the merchant leg by a literature-calibrated capture rate, and PVs net revenue. (ii) An
**hourly shape engine** (`/shape-analysis`) that reconstructs a 24×4-season generation/price/
load surface from parametric archetypes and derives capture rate, curtailment, 24/7 CFE and
avoided-carbon metrics *from the shape itself* rather than taking capture rate as a given
input — closing the loop back into the valuation engine via the "Apply as override" flow in
Panel 4. Settlement and credit-exposure modules reuse the same 96-point shape as a
volume-weighting kernel.

**8.3 Mathematical specification.**
```
Annual layer:
  gen_t = MW · 8760 · CF · (1-deg)^(t-1)
  ppa_price_t = P0 · (1+esc)^(t-1)
  capture_price = F_merchant · capture_rate(tech, penetration)
  net_t = ppa_rev_t + merchant_rev_t + rec_rev_t + anc_rev_t - firming_cost_t
  NPV = Σ net_t / (1+r)^t

Hourly shape layer (96 points, season-major):
  gen(h,s)   = archetype_tech(h,s), normalized so Σ_s Σ_h gen·days_s = MW·8760·CF
  price(h,s) = archetype_price(h,s), normalized so time-weighted mean = F_merchant
  capture_rate = [Σ gen·price·days] / [Σ gen·days] / [Σ price·days / 8760]

Settlement:
  settle = Σ (strike_t - clamp(price_hs, floor, cap)) · v_hs,   v_hs ∝ gen_hs·days_s

Credit exposure:
  PE_t = 2σ√t · remaining_volume_t
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Capture-rate tiers | `capture_rate(tech, pen%)` | Hirth (2013) Energy Economics 38; Millstein et al. (2021) Joule/LBNL |
| Shape-match factors | `match` | Hand-authored (daylight-hours-vs-block / duration-curve reasoning) |
| Degradation | `deg` | NREL/manufacturer warranty class (solar 0.4%/yr); wind 0% (net of availability) |
| Solar/wind archetypes | bell exponent, diurnal amplitude | Hand-authored parametric fit to typical clear-sky PV / onshore wind climatology |
| Lifecycle carbon intensity | gCO₂e/kWh | IPCC AR5 Annex III / NREL LCA harmonization medians |
| EU Taxonomy threshold | 100 gCO₂e/kWh | EU Taxonomy Climate Delegated Act 2021/2139 |
| CSA downgrade grid | threshold/IA multipliers | Hand-authored market-convention archetype |
| Basis vol band | ±2σ | User input, documented convention (no simulation) |

**8.4 Data requirements.** P50/P90 net capacity factor (from the yield engines or user
input), PPA/merchant/REC price terms, same-technology VRE penetration (for the capture-rate
tier lookup) or a market-quoted capture rate override, counterparty rating, CSA terms
(threshold/IA/MTA), and — for the hourly layer — either the documented archetypes or a
custom 96-point generation/price/load array for transaction-grade work.

**8.5 Validation & benchmarking.** The flat-shape settlement identity
(`settlement_yr1 = (strike − avg_price) × volume`) is asserted in the route docstring as a
QA check; the seasonal/diurnal capture decomposition (`capture_rate = seasonal × diurnal`)
is an internal consistency identity verifiable from the `/shape-analysis` response. External
validation would compare capture-rate tier outputs against a live forward curve /
historical settlement data for the target bidding zone, and the archetype shapes against
metered generation and day-ahead price data for the specific market.

**8.6 Limitations & model risk.** Capture-rate tiers and shape archetypes are literature-
calibrated defaults for a *generic* mid-latitude, mid-solar-penetration system — not
node-specific; a real transaction should override both with live market/metered data before
being used for pricing. The merchant curve is flat nominal (no term structure) beyond the
documented near-term convention. Basis and CSA-exposure bands are closed-form ±2σ/±diffusion
conventions, not simulated distributions, and will understate tail risk in genuinely
non-normal markets (e.g., negative-price clusters, extreme basis blowouts). The
`ppa-risk` bankability score and the yield engines are separate services with their own
assumptions not audited in this deep-dive.

## 9 · Future Evolution

### 9.1 Evolution A — Observed-shape calibration of the 96-point engine (analytics ladder: rung 2 → 3)

**What.** The desk is already a genuine tier-A vertical: `ppa_structuring.py` (1,426 lines, no PRNG) computes capture rate as an output of the 24h×4-season shape engine, and the term-sheet scorer re-runs exact `_build_case` math for ±10% sensitivities — solid rung 2. Its documented modelling defaults, however, are hand-authored archetypes: Hirth/Millstein-derived capture-rate tiers, a mid-latitude half-sine solar shape, a stylized `PRICE_HOUR_MULT` ladder. Evolution A calibrates these against observed hourly data: replace archetype price shapes with realized hourly price profiles per bidding zone (the platform's ENTSO-E and EIA ingesters already exist for wave-1 sources) and benchmark the engine's derived capture rates against published LBNL/market value-factor series.

**How.** (1) New `ref_hourly_price_shapes` table (zone × season × hour, built from ingested day-ahead history) served through the existing `GET /ref/shape-archetypes` pattern with a `basis: observed` flag alongside the archetype fallback. (2) Calibration report endpoint comparing engine capture rate vs realized value factors at matching penetration levels; error published, not hidden. (3) bench_quant pins the §7.4 toy-day identity (capture rate 85.7%) and the flat-shape settlement identity the QA already asserts.

**Prerequisites.** Fix the two lineage-harness failures first (`POST /shape-analysis` and `/term-sheet-score` recorded `failed` in §4.2); ENTSO-E/EIA hourly history retained, not just latest snapshots. **Acceptance:** for a DE solar case, engine capture rate is within a documented tolerance of the observed value factor, and the response names which basis (observed vs archetype) produced it.

### 9.2 Evolution B — Term-sheet negotiation analyst (LLM tier 2)

**What.** This module is one of the best tier-2 candidates on the platform because all seven endpoints are deterministic, Pydantic-typed, and self-documenting (every default is served with its literature basis via `GET /ref/*`). The analyst runs structuring conversations: "compare pay-as-produced vs baseload at 80% contracted for this wind asset, show me the firming-cost difference and how the deal score moves" — executed as paired `POST /structure` calls plus `/term-sheet-score`, narrated with the capture-rate decomposition (seasonal × diurnal) from `/shape-analysis`.

**How.** Tool schemas from the module's OpenAPI operations filtered via the Atlas endpoint map; system prompt grounded in §7.2's parameter tables so the analyst can explain *why* a capture rate fell (penetration tier crossed) with the Hirth/Millstein citation the backend itself carries. Mutating nothing, all endpoints are read-only calculators — no RBAC gating needed beyond session inheritance. Output composes into the Tab-7 score narrative and a drafted term-sheet memo whose every number the no-fabrication validator can trace to a tool call.

**Prerequisites.** The two failed POST endpoints repaired (an analyst that tool-calls a 500 is worse than none); golden Q&A written from the §7.4 hand-traced examples. **Acceptance:** the analyst reproduces the §7.4 capture-rate walkthrough via a live `/shape-analysis` call and refuses to quote market PPA prices, which the desk deliberately does not source.