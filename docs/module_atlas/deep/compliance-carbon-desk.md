## 7 · Methodology Deep Dive

### 7.1 What the module computes

This is the platform's national/compliance-carbon flagship: `backend/api/v1/routes/compliance_carbon.py`
(1,005 lines, prefix `/api/v1/compliance-carbon`) plus
`frontend/src/features/compliance-carbon-desk/pages/ComplianceCarbonDeskPage.jsx` (1,033 lines, 5
tabs: Scheme Atlas, Article 6 Desk, Compliance Cost, Cross-Market, Sustainability×Financial). The
route module's own docstring states the data policy explicitly: `/schemes` and `/article6` are
**hand-authored regulatory extracts** ("real mechanism parameters the desk is confident of, with
approximate price levels... anything uncertain is labeled in its own `notes`/`confidence` field,
nothing is fabricated"), while `/itmo-price`, `/compliance-cost` and `/cross-border` are
**deterministic closed-form calculators — no PRNG anywhere**, each returning its own `methodology`
block describing every modeling assumption. The desk explicitly reconciles with (does not
duplicate) the platform's E71 ETS reference layer (`/api/v1/carbon-price-ets/ref/ets-systems`,
6 systems), extending it to 13 mechanisms: EU ETS, UK ETS, California-Quebec (WCI), RGGI, EU ETS2
(2027), China national ETS, Korea K-ETS, India CCTS, Australia Safeguard Mechanism, Japan GX-ETS,
Singapore carbon tax, Mexico ETS pilot, and CORSIA.

### 7.2 Scheme atlas (`GET /schemes`) — 13-mechanism hand-authored extract

Each scheme record carries: `level` (national/subnational/supranational), `type`
(`cap_and_trade` | `intensity_rate_based` | `carbon_tax` | `baseline_and_credit` — the exact
taxonomy the compliance-cost obligation formula switches on, §7.4), `covered_emissions_mt`,
approximate ~2025 `price` (labeled `approx: True` on every block, with an `as_of` range note),
`cap_or_target` trajectory text, and `offset_rules` (`eligible_units`, `limit_pct_of_obligation`,
free-text `notes`). Examples of the labeled real parameters as coded: EU ETS Phase 4 linear
reduction factor "4.3%/yr 2024–2027, 4.4%/yr 2028–2030" with one-off rebasing of −90 Mt (2024) and
−27 Mt (2026); California's auction offset limit "4% of obligation 2021–2025, 6% from 2026 (used
here)"; China ETS intensity benchmark "~0.877 tCO2/MWh coal power"; Australia Safeguard baseline
decline "4.9%/yr to 2030"; CORSIA "Baseline = 85% of 2019 CO2 from 2024." Where a scheme has no
functioning market price yet (EU ETS2 pre-2027, India CCTS pre-2026, Japan GX-ETS voluntary phase,
Mexico pilot), `price.usd_per_t` is explicitly `None` rather than a fabricated placeholder —
`/compliance-cost` then requires the caller to supply `carbon_price_override_usd` for that scheme
or raises HTTP 422.

### 7.3 Article 6 rulebook (`GET /article6`) — real CMA decisions, quoted as coded

The response cites the actual Paris rulebook decisions:
- **Article 6.2** (cooperative approaches / ITMOs): "Decision 2/CMA.3 (Glasgow, 2021); further
  guidance Decision 6/CMA.4; operational details CMA.6 (Baku, 2024)." Corresponding adjustments are
  not mandatory in structure but are described exactly: host applies an addition to its emissions
  balance, acquiring party a subtraction, in the BTR structured summary. Share of Proceeds and OMGE
  are **not mandatory** under 6.2 (only "strongly encouraged").
- **Article 6.4** (Paris Agreement Crediting Mechanism, PACM): "Decision 3/CMA.3 (Glasgow, 2021);
  methodology + removals standards adopted CMA.6 (Baku, 2024)." Levies are **mandatory** and
  quantified: `share_of_proceeds_pct: 5.0` (to the Adaptation Fund) and
  `omge_cancellation_pct: 2.0` — these two numbers are exactly the `s=0.05, o=0.02` used in the
  ITMO pricing waterfall (§7.4). Two unit classes are distinguished: authorized A6.4ERs (CA'd,
  usable toward NDCs/CORSIA) versus "mitigation contribution" units (MCUs, no CA, host-NDC-only).
- Sovereign buyer programs are named with per-row confidence labels, e.g. Switzerland's KliK
  Foundation ("Peru (Oct 2020 — first Art 6.2 implementing agreement worldwide)"), Singapore's
  ICC window (PNG signed Dec 2023, Ghana 2024), Japan's JCM (since 2013, Mongolia first partner).

### 7.4 ITMO/A6.4ER landed-cost waterfall (`POST /itmo-price`) — traced and verified

Documented closed-form model, quoted from the route's own docstring:
```
base                 B = user base credit price
authorization premium P = B × premium_pct                    (authorized units only)
CA-risk discount      D = −(B+P) × (score/100) × max_discount_pct
net unit price        N = B + P + D                           (price per ISSUED unit)
6.4 levies (Decision 3/CMA.3): SoP 5% to Adaptation Fund, OMGE ≥2% cancelled
  sop_cost  = N × s/(1−s−o);  omge_cost = N × o/(1−s−o)
landed = N/(1−s−o) + txn + mrv  ==  B + P + D + sop + omge + txn + mrv   (exact, asserted by the endpoint's own components_sum_check)
```
**Worked example** — the endpoint's own Pydantic defaults, which are also the frontend form's
defaults (`base_credit_price_usd=12, mechanism='6.4_authorized', authorization_premium_pct=30,
ca_risk_score=30, max_ca_discount_pct=40, transaction_cost_usd=1.5, mrv_cost_usd=1.0,
domestic_abatement_cost_usd=60`), computed and numerically verified:

| Step | Computation | Result |
|---|---|---|
| Authorization premium `P` | 12 × 30% | **$3.60/t** |
| CA discount rate | (30/100) × (40/100) | 12.0% |
| CA discount `D` | −(12+3.60) × 0.12 | **−$1.872/t** |
| Net unit price `N` | 12 + 3.60 − 1.872 | **$13.728/t** |
| SoP cost (5%, denom 0.93) | 13.728 × 0.05/0.93 | **$0.7381/t** |
| OMGE cost (2%, denom 0.93) | 13.728 × 0.02/0.93 | **$0.2952/t** |
| Landed cost | 13.728/0.93 + 1.5 + 1.0 | **$17.2613/t** |
| Components-sum check | 12+3.6−1.872+0.7381+0.2952+1.5+1.0 | **$17.2613/t** ✓ (waterfall closes) |
| Issued units per delivered | 1/0.93 | 1.07527 |
| Buy-vs-abate | landed $17.26 < 90% × $60 abatement ($54) | **BUY** (import units), saving **$42.74/t** |

The gross-up `1/(1−s−o)` is the buyer funding enough *issued* A6.4ERs (1.0753 issued per 1
delivered) to net the mandatory 5%+2% levies at issuance — a real accounting mechanic of Decision
3/CMA.3, not a discretionary fee. The CA-risk discount mapping (linear in `ca_risk_score`) and the
authorization premium are explicitly labeled desk assumptions ("modeling assumption, labeled" /
"desk assumptions, not observed market quotes" in the endpoint's own `methodology` block) —
everything else in the waterfall (the levy rates and the gross-up arithmetic) is a real,
non-discretionary feature of the Article 6.4 rulebook.

### 7.5 Compliance-cost optimizer (`POST /compliance-cost`) — obligation + greedy offset clipping, worked

**Obligation by scheme type** (exact code):
```
cap_and_trade        : gross = max(0, covered_emissions − free_allocation)
intensity / baseline  : gross = max(0, covered_emissions − baseline_allowed)
carbon_tax            : gross = covered_emissions                         (free_allocation ignored)
```
**Offset cap** = `limit_pct_of_obligation × gross` (from the atlas's own `offset_rules`).
**Greedy algorithm** (schemes processed in **descending** carbon-price order; within a scheme,
eligible offset lots consumed **cheapest-first**, only while `lot.price < scheme.price`, clipped at
the scheme's own % cap and the remaining lot volume) — documented in the endpoint's own
`methodology.offset_optimization` field as "not a full LP but optimal when eligibility sets rarely
overlap."

**Worked clipping example** — using the frontend's own default illustrative entity
(`DEFAULT_POSITIONS`/`DEFAULT_OFFSETS` in the page, "Global Industrials Group (illustrative)"): the
**California-Quebec (WCI) position** is `covered = 300,000 t`, `free_allocation = 100,000 t` →
`gross = 200,000 t`. The scheme's offset rule caps CCO usage at **6% of obligation**:
`offset_cap = 0.06 × 200,000 = 12,000 t`. The offset portfolio holds **CCO at $15/t, 50,000 t
available** — comfortably cheaper than the scheme's $30/t carbon price, so every tonne of it
*would* be economic to use. But the greedy loop stops the moment `used_t` hits the cap:

| Quantity | Value |
|---|---|
| Gross obligation | 200,000 t |
| Offset cap (6% of gross) | **12,000 t** |
| CCO available (cheap, $15/t < $30/t scheme price) | 50,000 t |
| **CCO actually used (clipped by the cap, not by price or availability)** | **12,000 t** |
| CCO left unused in this scheme | 38,000 t |
| Residual obligation @ $30/t | 188,000 t × $30 = $5,640,000 |
| Offset cost | 12,000 t × $15 = $180,000 |
| Total scheme cost | $5,820,000 |
| Savings vs. no offsets | 12,000 × ($30−$15) = **$180,000** |

The 38,000 t of unused, cheaper-than-compliance CCO is the clip: it is not deployed further within
this request because CCO's `eligible_units` list (mirrored from `/schemes`) restricts it to
`wci_ca_qc` only — the shared inventory model consumes lots across schemes, but only where the
scheme's own `offset_rules.eligible_units` includes that unit type. **A related edge case surfaced
by the same default dataset**: the Australia Safeguard position (`ACCU` eligible, no % cap since
`limit_pct_of_obligation = 100.0`) prices ACCU at exactly $23/t against a scheme price of exactly
$23/t — the code's strict `if lot.price_usd >= price: continue` skip condition means an offset
priced **equal to** the compliance price is never used, even with zero % constraint and ample
volume. This is not a bug (the endpoint documents "only when offset price is below the scheme
carbon price"), but it is a boundary condition worth flagging: real-world desks would want a
tie-break or an epsilon rather than a strict inequality at parity pricing.

**Marginal cost** per scheme = `scheme price`, unless there is remaining offset-cap headroom AND a
cheaper eligible lot remains unconsumed, in which case marginal = that lot's price — i.e. the cost
of *one more* tonne of compliance, not the average cost shown in `total_cost_usd`.

### 7.6 Cross-border spread matrix & arbitrage candidates (`POST /cross-border`)

`scheme_spread_matrix[a][b] = price(a) − price(b)` over every scheme with a live price —
antisymmetric by construction (asserted in the response's own `matrix_property` field). An
**arbitrage candidate** is unit `u`, eligible in scheme `s` (per the hand-maintained
`UNIT_ELIGIBILITY` table mirroring `/schemes` offset rules), where
`net = scheme_price(s) − unit_price(u) − fungibility_haircut(u)` exceeds a user-set minimum
spread; `fungibility_haircut = unit_price × discount_pct` from a hand-authored, reasoned table
(`FUNGIBILITY_DISCOUNTS`) — e.g. EUA 0% (deepest, most liquid), CCER 60% ("no international
recognition; capital controls impede cross-border settlement"), VCM_NATURE 70% ("no compliance
surrender route... integrity re-rating risk"). Units not in the table get a documented 25% default
haircut. The endpoint explicitly caveats that this quantifies "the shadow value of segmentation, not
an executable trade" since compliance allowances are deliberately non-fungible across schemes.

### 7.7 Data provenance & limitations

- **Real, quoted-as-coded regulatory bases**: EU ETS LRF (4.3%/4.4%, Fit-for-55), MSR thresholds in
  the scheme atlas cross-reference the derivatives desk's MSR engine, CMA.3/CMA.4/CMA.6 decisions
  for Article 6.2/6.4, Decision 3/CMA.3's 5% SoP + 2% OMGE levies (used verbatim in the ITMO
  waterfall), CORSIA's 85%-of-2019 baseline and First Phase EEU authorization requirement.
  `EXTRACT_LABEL` ("regulatory extract, approximate parameters as of ~2025 — verify against current
  regulation for production") is attached to every atlas/Article-6 response.
- **Approximate, labeled prices**: every scheme's `price.usd_per_t` carries `approx: True` and an
  `as_of` range note (e.g. "EU ETS ~2025, typical range EUR 60-90"); several schemes (EU ETS2,
  India CCTS, Japan GX-ETS, Mexico pilot) have **no price at all** because none exists yet — the
  endpoint requires an explicit override rather than guessing one.
- **Desk modeling assumptions, clearly separated from the regulatory facts**: the ITMO
  authorization-premium %, CA-risk discount mapping, and the compliance-cost greedy ordering
  (documented as "optimal when eligibility sets rarely overlap," not a guaranteed-optimal LP) are
  all labeled in each endpoint's own `methodology` response block.
- The greedy compliance-cost optimizer can under-deploy cheap-but-capped offsets (§7.5's worked
  clip) and never uses offsets priced at or above the scheme's own carbon price, even at zero
  volume constraint — both are documented, deterministic consequences of the stated algorithm, not
  hidden behavior.
- The frontend's CBAM-interaction note explicitly flags that the compliance-cost optimizer
  "understates the value of domestic pricing for EU exporters" since it does not model CBAM
  deductibility of a paid domestic carbon price — a documented, honest limitation rather than a
  silent gap.

**Framework alignment:** Decision 2/CMA.3, 6/CMA.4, CMA.6 (Article 6.2 ITMOs) · Decision 3/CMA.3,
CMA.6 (Article 6.4 PACM, SoP 5%/OMGE 2%) · ICAO CORSIA Doc 9501 (First Phase 2024–2026) · EU
Directive (Fit-for-55) Phase 4 LRF · World Bank *State and Trends of Carbon Pricing 2024* / ICAP
*Status Report 2024* (global coverage KPIs, labeled approximate).

## 8 · Model Specification

**Status: implemented.** Every calculator (`/itmo-price`, `/compliance-cost`, `/cross-border`) is
live, deterministic Python in `backend/api/v1/routes/compliance_carbon.py`; the reference data
(`/schemes`, `/article6`) is a static, versioned, hand-authored extract served from the same file.

**8.1 Purpose & scope.** Give a multi-jurisdiction entity one desk to browse 13 national/
supranational compliance carbon mechanisms, price a single Article 6 unit landed-cost waterfall,
compute total compliance cost with optimal (greedy) offset deployment across simultaneous scheme
obligations, and screen compliance-vs-voluntary cross-market spreads under an explicit
non-fungibility caveat.

**8.2 Conceptual approach.** Reference data (scheme atlas, Article 6 rulebook) is a curated,
labeled regulatory extract rather than a live feed — appropriate because these parameters change on
a legislative cadence measured in years, not market ticks. The three calculators are closed-form:
a linear landed-cost waterfall with an exact-levy gross-up; a per-scheme obligation formula that
switches on scheme type, coupled to a greedy shared-inventory offset allocator; and an antisymmetric
pairwise price-spread matrix combined with a fungibility-discount-adjusted arbitrage screen.

**8.3 Mathematical specification.**
```
N        = B + B·p_auth + (−(B + B·p_auth)·(risk/100)·(maxDisc/100))
landed   = N/(1 − s − o) + txn + mrv                 s=0.05, o=0.02 for 6.4 units
gross    = max(0, emissions − free_alloc)             [cap-and-trade]
         = max(0, emissions − baseline_allowed)       [intensity / baseline-and-credit]
         = emissions                                  [carbon tax]
cap      = limit_pct × gross
used     = Σ min(lot.remaining, cap − used_so_far) over lots with price < scheme_price, ascending price
marginal = scheme_price, or cheapest remaining eligible lot price if cap headroom > 0 and it undercuts scheme_price
spread(a,b) = price(a) − price(b)
net_spread(u→s) = price(s) − price(u) − price(u)·haircut(u)
```

**8.4 Data requirements.** None beyond what is already embedded: the scheme atlas and Article 6
rulebook are static extracts requiring periodic manual refresh (labeled ~2025); the calculators take
only user-supplied positions, prices and unit portfolios as request bodies — there is no external
data dependency at request time.

**8.5 Validation & benchmarking.** Already implemented: the ITMO endpoint returns its own
`components_sum_check` so callers (and this deep-dive) can verify the waterfall closes exactly; the
cross-border endpoint asserts `matrix_property: antisymmetric` on every response. Recommended
external benchmark: periodically diff the scheme atlas's price/`cap_or_target`/`offset_rules`
fields against ICAP's Emissions Trading Worldwide status reports and each scheme regulator's
official bulletins (World Bank/ICAP are already the cited basis for the aggregate coverage KPIs).

**8.6 Limitations & model risk.** All scheme prices and several trajectory/cap details are
hand-authored ~2025 approximations pending verification, not live market or regulatory feeds — the
route's own docstring and every response payload say so. The greedy offset optimizer is documented
as non-optimal in the (rare) case of overlapping eligibility across schemes, and its strict
`price < scheme_price` condition never deploys an offset priced at parity with (or above) the
compliance instrument, even with unused cap headroom (§7.5). The compliance-cost view does not
model CBAM deductibility of domestic carbon prices for EU-bound exporters (flagged in-UI as a
documented limitation of the optimizer, not a silent gap). Cross-border "arbitrage" figures quantify
a shadow value under a stated fungibility haircut, not an executable trade, since compliance units
are legally non-fungible across schemes.
