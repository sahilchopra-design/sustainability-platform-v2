# Maturity Wall Monitor
**Module ID:** `maturity-wall-monitor` · **Route:** `/maturity-wall-monitor` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_SPREAD_IDS`, `BUCKET_COLOR`, `BUCKET_SERIES`, `Badge`, `FALLBACK_SERIES`, `Kpi`, `LABEL_COLOR`, `LABEL_NAME`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `LABEL_NAME` | `{ green: 'Green (UoP)', slb: 'Sustainability-linked', conventional: 'Conventional' };` |
| `fmtM` | `(v, d = 1) => ((v == null \|\| isNaN(v)) ? '—' : `$${Number(v).toLocaleString('en-US', { maximumFractionDigits: d })}M`);` |
| `fmtBps` | `(v, d = 0) => ((v == null \|\| isNaN(v)) ? '—' : `${v >= 0 ? '+' : ''}${Number(v).toFixed(d)} bps`);` |
| `fmtNum` | `(v, d = 1) => ((v == null \|\| isNaN(v)) ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: d }));` |
| `issuers` | `useMemo(() => (ladder.bonds ? ['All issuers', ...Array.from(new Set(ladder.bonds.map((b) => b.issuer))).sort()] : ['All issuers']), [ladder.bonds]);` |
| `minY` | `Math.min(...filtered.map((b) => b.maturity_year));` |
| `maxY` | `Math.max(...filtered.map((b) => b.maturity_year));` |
| `buckets` | `Array.from(new Set(filtered.map((b) => b.rating_bucket)));` |
| `labels` | `Array.from(new Set(filtered.map((b) => b.label)));` |
| `rows` | `years.map((y) => {` |
| `row` | `{ year: y, total: inYear.reduce((s, b) => s + b.size_bn, 0) };` |
| `refiCoupon` | `base + rateStressBp / 100 + mkt.oasPp + spreadStressBp / 100;` |
| `deltaPp` | `refiCoupon - b.coupon_pct;` |
| `deltaBp` | `deltaPp * 100;` |
| `interestDeltaM` | `(deltaPp / 100) * b.size_bn * 1000;` |
| `wallBn` | `maturing.reduce((s, b) => s + b.size_bn, 0);` |
| `pricedBn` | `priced.reduce((s, b) => s + b.size_bn, 0);` |
| `wavgOld` | `pricedBn ? priced.reduce((s, r) => s + r.coupon_pct * r.size_bn, 0) / pricedBn : null;` |
| `wavgNew` | `pricedBn ? priced.reduce((s, r) => s + r.refiCoupon * r.size_bn, 0) / pricedBn : null;` |
| `totalInterestDeltaM` | `priced.reduce((s, r) => s + r.interestDeltaM, 0);` |
| `greenBn` | `maturing.filter((b) => b.label !== 'conventional').reduce((s, b) => s + b.size_bn, 0);` |
| `years` | `Array.from(new Set(priced.map((r) => r.maturity_year))).sort();` |
| `byYear` | `years.map((y) => ({` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/energy-bonds/status` | `status` | api/v1/routes/energy_bond_ladder.py |
| GET | `/api/v1/energy-bonds/issuers` | `issuers` | api/v1/routes/energy_bond_ladder.py |
| GET | `/api/v1/energy-bonds/ladder` | `ladder` | api/v1/routes/energy_bond_ladder.py |
| POST | `/api/v1/energy-bonds/ladder-analytics` | `ladder_analytics` | api/v1/routes/energy_bond_ladder.py |
| POST | `/api/v1/energy-bonds/refi-economics` | `refi_economics` | api/v1/routes/energy_bond_ladder.py |
| POST | `/api/v1/energy-bonds/transition-overlay` | `transition_overlay` | api/v1/routes/energy_bond_ladder.py |
| GET | `/api/v1/fred-spreads/status` | `status` | api/v1/routes/fred_spreads.py |
| GET | `/api/v1/fred-spreads/catalog` | `catalog` | api/v1/routes/fred_spreads.py |
| GET | `/api/v1/fred-spreads/series` | `series` | api/v1/routes/fred_spreads.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-computed`

**Database tables:** `FRED` *(shared)*, `__future__` *(shared)*, `datetime` *(shared)*, `fastapi` *(shared)*, `for`, `issuer` *(shared)*, `maps` *(shared)*, `public` *(shared)*, `pydantic` *(shared)*, `transition`, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **15** other module(s).

| Connected module | Shared via |
|---|---|
| `infra-debt-portfolio-manager` | table:FRED, table:maps |
| `credit-spread-climate-monitor` | table:FRED, table:maps |
| `green-bond-pricing-desk` | table:FRED, table:maps |
| `green-bond-portfolio-optimizer` | table:FRED |
| `green-bond-portfolio-analytics` | table:FRED |
| `sll-slb-v2` | table:issuer |
| `vcm-cross-registry-tracker` | table:public |
| `vcm-registry-analytics` | table:public |
| `just-transition-finance-hub` | table:public |
| `just-transition-adaptation` | table:public |

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`maturity-wall-monitor` (NX2-10) is an issuer-level DCM refinancing-risk desk built on one
deterministic backend route, `backend/api/v1/routes/energy_bond_ladder.py` (699 lines, no
PRNG — every endpoint is closed-form arithmetic over a hand-authored bond extract), fronted
by an 847-line React page (`MaturityWallMonitorPage.jsx`). Six endpoints plus the platform's
live FRED join:

| Endpoint | What it does |
|---|---|
| `GET /status`, `/issuers`, `/ladder` | Hand-authored real-issuer bond extract (28 bonds, 19 issuers) + per-maturity-year aggregation |
| `GET /curves` | Per-issuer OLS spread-vs-tenor curve (own curve if ≥3 bonds, else pooled sector fallback) + rich/cheap residual per bond |
| `POST /ladder-analytics` | Closed-form annual-pay bullet duration/DV01, ±100/±200bp parallel + steepener rate-shock table (full repricing), EBITDA leverage screen |
| `POST /refi-economics` | Greenium-adjusted refi coupon, call/make-whole breakeven, tender + new-issue combo |
| `POST /transition-overlay` | Transition-capex funding-gap vs refi volumes, green-share-of-ladder trend, climate-spread stressed wall cost |

The frontend also joins the live `/api/v1/fred-spreads/series` (real ICE BofA rating-bucket
OAS) onto the extract's `rating_bucket` field for an in-page refi-cost quick view, and
forwards that same OAS map (`bucket_oas_pp`) into every backend analytics call so all
engines price off identical spreads.

### 7.2 The bond extract — real issuers, approximate terms (labeled)

`BONDS` is a 28-row, hand-authored list of real major energy/utility issuers (NextEra, Duke,
Southern, Dominion, Xcel, Exelon, Enel, EDF, TotalEnergies, BP, Shell, Pemex, Engie,
Iberdrola, Ørsted, E.ON, RWE, Vattenfall) with approximate coupon/maturity/size/rating drawn
from each issuer's real benchmark curve. The route's docstring and every response carry the
verbatim label:

> "Illustrative real-issuer extract, approximate terms — coupons, sizes and ratings are
> approximate/composite and hand-authored from public issuance history. Refresh from issuer
> filings / FINRA TRACE / exchange prospectuses for production use."

`rating_bucket` (AAA/AA/A/BBB/BB/B/CCC) matches the ICE BofA OAS buckets served by
`/api/v1/fred-spreads` by construction, so the frontend can join live spreads without a
mapping table. `label` (green / slb / conventional) is a real use-of-proceeds/SLB flag per
bond, not modeled.

### 7.3 Spread proxy and issuer curves

Because the extract carries coupons and maturities but no live prices, every curve/pricing
calculation uses a documented **at-issue** proxy:
```
spread_bp = (coupon_pct - base_rate_pct) × 100
```
labeled explicitly as "an at-issue coupon-over-base screening proxy... not a traded
z-spread." `/curves` fits `_ols_fit`: `spread = a + b·tenor` per issuer with ≥3 extract
bonds (`_ols_fit` is a standard closed-form OLS with R²); issuers with fewer bonds fall back
to the pooled sector OLS, else the global pool. `rich_cheap_bp = actual − fitted`: positive =
trades wide of its own curve (cheap on this screen).

### 7.4 Duration, DV01 and rate shocks — closed form

```
Bond pricing (annual-pay bullet, per 100 face):
  P = Σ_{t=1..n} CF_t / (1+y)^t                    CF_t = coupon + 100·[t=n]
  Macaulay D  = ( Σ_t t·CF_t/(1+y)^t ) / P
  Modified D  = D_mac / (1+y)
  DV01_$      = ModD × MV / 100 × 1bp             (MV = P/100 × size_$ )
ytm = base_rate_pct + bucket_spread_pp    (bucket_spread from the live OAS join, else DEFAULT_BUCKET_SPREAD_PP)
Rate shocks: FULL REPRICING at y ± shock (not the duration approximation);
  steepener: tenor ≤ 5y shocked −50bp, tenor > 5y shocked +50bp (pivot at 5y, labeled convention)
```
`_bond_price_dur` (`backend/api/v1/routes/energy_bond_ladder.py:326`) implements exactly this
closed form; `ladder_analytics` reprices every bond at each of five shocks (`−200/−100/
+100/+200bp parallel`, the tenor-conditional steepener) by calling the **same** pricing
function at the shocked yield — i.e. the rate-shock table is a full reprice, not a
duration-times-shock linear approximation.

### 7.5 Worked example — Duke Energy Corp 5.00% 2033, duration/DV01 hand-traced and cross-checked

Bond: Duke Energy Corp, `coupon_pct = 5.00`, `maturity_year = 2033`, `size_bn = 1.25`,
`rating_bucket = BBB`. As-of year 2026 ⇒ `tenor = 7` years. With `base_rate_pct = 4.25`
(default) and the labeled default bucket spread `DEFAULT_BUCKET_SPREAD_PP["BBB"] = 1.25pp`
(used only absent a live OAS map): `ytm = 4.25 + 1.25 = 5.50%`.

Cash flows: coupon 5.00 in years 1–6, `5.00 + 100 = 105.00` in year 7, discounted at
`y = 0.055`:

| t | CF | Disc. factor (1.055)^t | PV | t·PV |
|---|---|---|---|---|
| 1 | 5.00 | 1.05500 | 4.7393 | 4.7393 |
| 2 | 5.00 | 1.11303 | 4.4923 | 8.9845 |
| 3 | 5.00 | 1.17424 | 4.2581 | 12.7742 |
| 4 | 5.00 | 1.23882 | 4.0361 | 16.1443 |
| 5 | 5.00 | 1.30696 | 3.8257 | 19.1284 |
| 6 | 5.00 | 1.37884 | 3.6262 | 21.7574 |
| 7 | 105.00 | 1.45468 | 72.1809 | 505.2661 |
| **Σ** | | | **97.1585** | **588.7943** |

```
Price P     = 97.1585
Macaulay D  = 588.7943 / 97.1585 = 6.0601 years
Modified D  = 6.0601 / 1.055     = 5.7442
MV ($1.25bn face) = 97.1585/100 × 1.25e9 = $1,214,481,456
DV01_$      = 5.7442 × 1,214,481,456 × 1e-4 = $697,623
```

**Cross-check — full reprice at y+1bp (5.51%)**, the standard DV01 verification: repricing
the identical 7 cash flows at `y = 0.0551` gives `P = 97.1027` (per 100 face), a price
decline of `0.05579` points. In dollar terms on the $1.25bn face: `ΔMV = −0.05579/100 ×
1.25e9 = −$697,372`. This is within **0.04%** of the closed-form `DV01_$ = $697,623` computed
above — the small residual is the bond's (positive) convexity, which always makes the true
repriced decline slightly *smaller* than the linear duration estimate for an upward yield
shock. This is exactly the exemplar's "standard DV01 cross-check" methodology, hand-executed
and confirmed to match. (Arithmetic re-verified numerically: `price=97.15851644`,
`mac=6.06013976`, `mod=5.74420830`, `dv01=$697,623.45`, `reprice@+1bp=97.10272667`,
`Δprice=-0.05578977`, `ΔMV=-$697,372.09`.)

### 7.6 Refinancing economics

```
refi_conventional = base_rate + rate_stress_bp/100 + bucket_spread_pp + spread_stress_bp/100
refi_green        = refi_conventional − greenium_bp/100          (if label ∈ {green, slb})
greenium_saving_musd_yr = (refi_conventional − refi_green)/100 × size_bn × 1000

Call/make-whole breakeven:
  premium_pp        = call_price_pct − 100
  premium_amort_pp  = premium_pp / remaining_tenor            (straight-line pp/yr)
  breakeven_rate r* = refi_green + premium_amort_pp
  verdict = "refi_now" if expected_future_rate > r* else "wait"

Tender + new-issue combo:
  tendered_bn      = size_bn × tender_participation_pct/100
  upfront_musd     = tendered_bn × (tender_price_pct − 100)/100 × 1000
  annual_saving    = (coupon − refi_green)/100 × tendered_bn × 1000
  payback_years    = upfront_musd / annual_saving
```
`greenium_bp` defaults to 5bp, labeled "an emerging-market observation (typical IG greenium
2-8bp)... user-adjustable, not a market quote." The call-breakeven and tender-combo formulas
are simple closed-form identities; no hand-trace beyond the arithmetic above is materially
informative, but they are traced verbatim from `refi_economics()`
(`energy_bond_ladder.py:556`).

### 7.7 EBITDA leverage screen and transition overlay

```
wall_to_ebitda_x = (extract maturities ≤ horizon_year, this issuer) / user-input EBITDA_bn
screen = "elevated" if wall/EBITDA > 1.5x else "manageable"        (rule-of-thumb, labeled)

Funding gap: refi_funded = min(wall_bn, transition_capex_bn); gap_bn = capex_bn − refi_funded
Climate-spread overlay: stressed_spread_pp = risk_score × spread_slope_bp_per_point/100   (default 1.5bp/point, LABELED)
  wall_refi_cost_stressed = Σ_wall (base_rate + bucket_spread + stressed_spread_pp)/100 × size_bn × 1000
```
The funding-gap identity is explicitly labeled "a screening identity — assumes 100% of refi
volume is redirectable, labeled optimistic bound." The leverage screen is explicitly labeled
"a screening ratio, not the issuer's true leverage" because the extract is a partial curve
(benchmarks only, not the issuer's full debt stack).

### 7.8 Data provenance & limitations

- **Real issuers, hand-authored/approximate terms** — every bond references a genuine
  energy/utility borrower's real benchmark curve, but coupons/sizes/ratings are
  approximate composites, not a live feed (verbatim label surfaced on every response).
- **Spread proxy is at-issue coupon-over-base, not a traded z-spread** — the extract has no
  price history, so `/curves` and the duration/DV01 engine both use documented proxies rather
  than market-observed spreads.
- **Live companion feed is genuinely live**: `/api/v1/fred-spreads` serves real ICE BofA
  rating-bucket OAS via FRED; the frontend forwards it as `bucket_oas_pp` so every backend
  analytics call reprices off the same live spreads when available, falling back to labeled
  `DEFAULT_BUCKET_SPREAD_PP` mid-cycle conventions otherwise.
- **USD OAS series applied to EUR bonds as a stated proxy** (frontend note: "no free EUR
  bucket OAS on FRED"); missing single-bucket HY series fall back to the grade aggregate,
  marked "proxy" in the UI.
- **Full-repricing rate shocks, not duration-times-shock** — a real strength (captures
  convexity exactly at the shocked yield), verified in §7.5's cross-check.
- **Atlas function-map artifact**: the auto-generated `docs/module_atlas/modules/
  maturity-wall-monitor.md` lists `FRED`, `maps`, `for`, `transition`, `issuer` as "shared
  database tables" — this is the atlas generator parsing Python import/keyword tokens, the
  same known artifact documented for `ppa-structuring-desk`; no real shared-table lineage nor
  narrative guide/code mismatch was found for this module.

## 8 · Model Specification

**Status: implemented.**

**8.1 Purpose & scope.** Issuer-level refinancing-risk analytics for the energy & utility
bond complex: maturity-wall visualisation, live-OAS-joined refi-cost estimation, per-issuer
credit-curve construction, portfolio duration/DV01 with full-repricing rate shocks, an
EBITDA-based refi-capacity leverage screen, greenium/call/tender refinancing economics, and a
transition-capex funding-gap + climate-spread stress overlay — for DCM origination and
portfolio-risk teams covering energy/utility issuers.

**8.2 Conceptual approach.** A hand-authored real-issuer bond extract anchors every
calculation; a single at-issue coupon-over-base spread proxy feeds both the OLS credit-curve
construction and the closed-form annual-pay-bullet pricing engine, which is reused
identically for base pricing, DV01, and full-repricing rate shocks (no duration-approximation
shortcuts). The live ICE BofA OAS join via FRED is threaded through every downstream
calculation as an optional override on the hand-authored default bucket spreads, so the same
desk can run on either live market levels or documented fallback conventions.

**8.3 Mathematical specification.**
```
Spread proxy   : spread_bp = (coupon - base_rate) × 100
Issuer curve   : spread = a + b·tenor (OLS, own curve if ≥3 bonds else sector/global pool)
Bond pricing   : P = Σ CF_t/(1+y)^t ;  D_mac = Σ t·CF_t/(1+y)^t / P ;  D_mod = D_mac/(1+y)
DV01           : DV01_$ = D_mod × MV/100 × 1bp
Rate shocks    : full reprice at y ± shock;  steepener: ≤5y −50bp / >5y +50bp
Refi coupon    : base_rate + rate_stress + bucket_spread + spread_stress  (− greenium if green/SLB-eligible)
Call breakeven : r* = refi_green + (call_price−100)/remaining_tenor
Tender combo   : upfront = participation×size×(tender_price−100)/100 ; payback = upfront/annual_saving
Funding gap    : gap = max(0, transition_capex − min(wall_to_horizon, transition_capex))
Climate spread : stressed_spread = bucket_spread + risk_score × slope_bp_per_point/100
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Bucket spread (fallback) | `DEFAULT_BUCKET_SPREAD_PP` | Hand-authored mid-cycle conventions (used only absent live OAS) |
| Bucket spread (live) | `bucket_oas_pp` | Real ICE BofA OAS via FRED, forwarded from the frontend join |
| Greenium | `greenium_bp` (default 5) | Labeled emerging-market observation, typical IG 2–8bp |
| Climate-spread slope | `spread_slope_bp_per_point` (default 1.5) | LABELED MODEL ASSUMPTION, user-adjustable |
| Leverage screen threshold | 1.5× wall/EBITDA | Rule-of-thumb single-refi-window capacity, labeled |
| Steepener pivot | 5 years | Labeled convention |

**8.4 Data requirements.** The hand-authored bond extract (issuer, coupon, maturity, size,
rating, currency, label); a user base-rate input; optionally, the live ICE BofA OAS bucket
map (else labeled defaults); per-issuer EBITDA (leverage screen) and transition-capex/risk
score (transition overlay) as user inputs.

**8.5 Validation & benchmarking.** §7.5 hand-traces one bond's duration/DV01 and cross-checks
it against a full numeric reprice at a 1bp-bumped yield — the standard DV01 verification —
confirming agreement to within 0.04% (residual = convexity). External validation would
compare the extract's coupons/sizes against issuer prospectuses/FINRA TRACE, and the OLS
issuer curves against live secondary-market spread quotes for the same names.

**8.6 Limitations & model risk.** The extract is an approximate composite, not a live feed;
the spread proxy is at-issue coupon-over-base, not a traded z-spread, so curve/rich-cheap
outputs are a screening tool rather than tradeable relative value; the EBITDA leverage screen
compares a partial (benchmark-only) debt stack against user-input EBITDA and is explicitly
not the issuer's true leverage; the funding-gap identity assumes 100% of refi proceeds are
redirectable to transition capex (an optimistic bound); and the climate-spread slope is a
labeled, not calibrated, model assumption.

## 9 · Future Evolution

### 9.1 Evolution A — From at-issue proxy spreads to traded pricing, and a refreshable extract (analytics ladder: rung 3 → 4)

**What.** This is one of the platform's cleanest tier-A builds: a PRNG-free 699-line backend (28 real-issuer bonds with the verbatim "approximate terms — refresh from FINRA TRACE for production" label, per-issuer OLS spread curves with pooled fallback, closed-form duration/DV01 with full-repricing rate shocks, greenium-adjusted refi economics, transition-capex overlay) joined to live ICE BofA OAS via `/fred-spreads`, with the same OAS map forwarded to every engine so all analytics price off identical spreads. Its own labels define the next rung: the spread proxy is *at-issue* coupon-over-base, "not a traded z-spread", and the extract is a hand-authored snapshot. Evolution A: (1) execute the docstring's instruction — refresh the extract from public issuance data (FINRA TRACE for USD, exchange prospectuses for EUR names) on a maintained cadence with per-bond as-of dates; (2) where traded prices are obtainable, compute real z-spreads/G-spreads so the rich/cheap residuals screen actual value rather than issuance vintage effects; (3) rung-4 entry: refi-coupon *forecasting* — the FRED OAS history the platform already stores supports fitting spread-path scenarios (mean-reversion bands per rating bucket) so the refi-economics tab quotes a distribution, not just spot+stress.

**How.** (1) An extract-refresh ingester with diff review (bond terms are facts; changes should be auditable). (2) The OLS curve machinery is reusable as-is over traded spreads — the upgrade is input data, not math. (3) Spread-scenario fitting uses the stored FRED series (statsmodels per the platform ladder's rung-4 convention, model-carded per §8 practice). (4) Pin the current worked outputs in bench_quant before the input swap.

**Prerequisites.** TRACE/prospectus data access confirmed (redistribution terms vary); the at-issue proxy retained as labeled fallback for unpriced bonds. **Acceptance:** each bond shows terms-as-of date and spread type (traded vs at-issue proxy); rich/cheap residuals recompute on traded spreads where available; refi scenarios show fitted bands with model documentation.

### 9.2 Evolution B — DCM refinancing-desk analyst (LLM tier 2)

**What.** The route surface is tool-ready today — six deterministic endpoints plus live FRED — and the questions are desk-native: "walk the 2027–2029 wall for Ørsted — sizes, refi coupons at +100bp, interest delta", "which BBB issuers' bonds trade cheap to their own curve, and is it the SLB label or tenor?", "how much of next year's wall is green-labelled and what greenium applies at refi?", "does Pemex's transition capex plan exceed its refi capacity under a climate-spread stress?"

**How.** Tier 2: tool schemas over the six energy-bond routes and FRED series; every analytics call forwards the same `bucket_oas_pp` join the page uses so copilot and page never diverge on spreads. Discipline inherited from the module's own labeling: the at-issue-proxy caveat accompanies every rich/cheap claim; the "approximate terms" label accompanies bond-level facts until Evolution A's refresh lands; rate-shock results state the shock applied and that repricing is full (not duration-approximated) per the engine's convention. Wall narratives decompose into per-bond contributions from the ladder response — the copilot compresses the table, never re-estimates it.

**Prerequisites.** Phase 2 tooling only — no backend work blocks this; Evolution A upgrades answer quality but tier 2 ships on the current honest engine. **Acceptance:** every bps/$M figure matches a logged route response; proxy and approximate-terms caveats present wherever applicable; wall decompositions sum to the ladder totals.