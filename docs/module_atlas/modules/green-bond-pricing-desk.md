# Green Bond Pricing Desk
**Module ID:** `green-bond-pricing-desk` · **Route:** `/green-bond-pricing-desk` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALLOC_CHECKLIST`, `ALL_IDS`, `Badge`, `Card`, `CheckChip`, `CurveEditor`, `GREENIUM_TABLE`, `Kpi`, `Lbl`, `ModelNote`, `RATING_BUCKETS`, `RunBtn`, `SECTORS`, `UOP_CATEGORIES`, `UOP_IMPACT_DEFAULTS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `RATING_BUCKETS` | 8 | `id`, `grade` |
| `SECTORS` | 9 | `label` |
| `GREENIUM_TABLE` | 9 | `IG`, `HY` |
| `UOP_CATEGORIES` | 11 | `label`, `obj` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ALL_IDS` | `RATING_BUCKETS.map((r) => r.id).join(',');` |
| `fmtNum` | `(v, d = 1) => (v == null \|\| isNaN(v)) ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: d });` |
| `upd` | `(id, key, v) => setPts((prev) => prev.map((p) => (p.id === id ? { ...p, [key]: v } : p)));` |
| `add` | `() => setPts((prev) => [...prev, { id: prev.length ? Math.max(...prev.map((p) => p.id)) + 1 : 1, t: 15, r: 3.0 }]);` |
| `byId` | `Object.fromEntries(fred.series.map((s) => [s.id, s]));` |
| `last` | `obs.length ? obs[obs.length - 1] : null;` |
| `fairValueBp` | `compOasBp != null ? compOasBp + greeniumBp : null; // greenium-adjusted secondary fair value` |
| `autoIpt` | `fairValueBp != null ? Math.round(fairValueBp + 15) : null; // convention: IPT ≈ fair value + 15bp starting cushion` |
| `tightening` | `Math.min(tightenCapBp, Math.max(0, (bookMult - 1) * bpPerTurn));` |
| `guidance` | `ipt - tightening / 2;` |
| `nip` | `finalSpread - fairValueBp;` |
| `coupon` | `baseRatePct + finalSpread / 100;` |
| `grid` | `ca.data.curve.zero_grid.map((g) => ({ tenor: g.tenor_y, zero: g.zero_pct }));` |
| `pillars` | `ca.data.curve.zero_pillars.map((p) => ({ tenor: p.tenor_y, par: p.par_rate_pct, zeroPillar: p.zero_pct }));` |
| `updComp` | `(id, key, v) => setComps((prev) => prev.map((c) => (c.id === id ? { ...c, [key]: v } : c)));` |
| `addComp` | `() => setComps((prev) => [...prev, { id: prev.length ? Math.max(...prev.map((c) => c.id)) + 1 : 1, name: 'New comp', tenor: 7, spread: 100, green: false }]);` |
| `tMax` | `Math.max(...ts) * 1.1;` |
| `updBook` | `(id, key, v) => setBookDist((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: v } : r)));` |
| `peakBook` | `bookMult * size;                                   // mn at IPT` |
| `survive` | `(tBp) => Math.max(0, 1 - (drop * tBp) / 100);       // stated linear drop-out` |
| `finalBook` | `peakBook * survive(pricing.tightening);` |
| `cover` | `finalBook / size;` |
| `rows` | `bookDist.map((r) => ({ ...r, pctN: Math.max(num(r.pct), 0), w: Math.max(num(r.tier), 0) }));` |
| `totPct` | `rows.reduce((s, r) => s + r.pctN, 0) \|\| 1;` |
| `demand` | `rows.map((r) => (finalBook * r.pctN) / totPct);` |
| `fillPro` | `finalBook > 0 ? Math.min(1, size / finalBook) : 0;` |
| `proRata` | `demand.map((dm) => dm * fillPro);` |
| `wsum` | `active.reduce((s, i) => s + rows[i].pctN * rows[i].w, 0);` |
| `share` | `(remaining * rows[i].pctN * rows[i].w) / wsum;` |
| `room` | `demand[i] - alloc[i];` |
| `objectives` | `[...new Set(UOP_CATEGORIES.filter((c) => uop[c.key]).map((c) => c.obj))];` |
| `even` | `+(num(sizeMn) / n).toFixed(1);` |
| `updUopRow` | `(key, field, v) => setUopRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: v } : r)));` |
| `impact` | `useMemo(() => { const rows = uopRows.map((r) => { const alloc = num(r.alloc);` |
| `allocTot` | `rows.reduce((s, r) => s + r.allocN, 0);` |
| `co2Tot` | `rows.reduce((s, r) => s + r.co2, 0);` |
| `intensity` | `allocTot > 0 ? co2Tot / allocTot : null;                 // tCO2e / yr / €M` |
| `couponCash` | `couponPctEff != null ? size * 1e6 * (couponPctEff / 100) : null; // annual coupon (currency units)` |
| `perCoupon1k` | `couponCash > 0 ? co2Tot / (couponCash / 1000) : null;  // tCO2e per 1,000 of annual coupon` |
| `taxRollup` | `allocTot > 0 ? rows.reduce((s, r) => s + r.allocN * r.taxN, 0) / allocTot : null;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/fred-spreads/status` | `status` | api/v1/routes/fred_spreads.py |
| GET | `/api/v1/fred-spreads/catalog` | `catalog` | api/v1/routes/fred_spreads.py |
| GET | `/api/v1/fred-spreads/series` | `series` | api/v1/routes/fred_spreads.py |
| POST | `/api/v1/green-bond-analytics/curve-spreads` | `curve_spreads` | api/v1/routes/green_bond_analytics.py |
| POST | `/api/v1/green-bond-analytics/relative-value` | `relative_value` | api/v1/routes/green_bond_analytics.py |
| POST | `/api/v1/green-bond-analytics/dual-tranche` | `dual_tranche` | api/v1/routes/green_bond_analytics.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`

**Database tables:** `FRED` *(shared)*, `__future__` *(shared)*, `datetime` *(shared)*, `fastapi` *(shared)*, `maps` *(shared)*, `pydantic` *(shared)*, `typing` *(shared)*, `zero` *(shared)*
**Frontend seed datasets:** `ALLOC_CHECKLIST`, `GREENIUM_TABLE`, `RATING_BUCKETS`, `SECTORS`, `UOP_CATEGORIES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **5** other module(s).

| Connected module | Shared via |
|---|---|
| `maturity-wall-monitor` | table:FRED, table:maps |
| `infra-debt-portfolio-manager` | table:FRED, table:maps |
| `green-bond-portfolio-optimizer` | table:FRED, table:zero |
| `credit-spread-climate-monitor` | table:FRED, table:maps |
| `green-bond-portfolio-analytics` | table:FRED, table:zero |

## 7 · Methodology Deep Dive

### 7.1 What the module computes

Green Bond Pricing Desk (NX2-04) is a **primary-issuance workbench**. Backend math lives entirely
in `backend/api/v1/routes/green_bond_analytics.py` (473 lines, three POST endpoints); everything
else on the 1,370-line frontend page (`GreenBondPricingDeskPage.jsx`) is either a live call to that
engine (or to `/api/v1/fred-spreads/series` and `/api/v1/eu-gbs/assess-issuance`), or **frontend-only
desk math** that is documented inline and stated as such — an IPT→guidance→launch book simulation,
an order-book allocation optimizer, and use-of-proceeds impact-yield analytics. No PRNG anywhere in
either layer; every fabricated-looking number is either a labeled hand-authored reference table or a
user-editable placeholder input.

Three backend endpoints:

| Endpoint | Purpose |
|---|---|
| `POST /curve-spreads` | Par-curve bootstrap → zero curve; YTM, G-spread, I-spread, Z-spread (bisection with round-trip check), ASW proxy |
| `POST /relative-value` | Comp-set OLS (spread vs tenor), optional green-dummy regression, matched-pair greenium, cheap/dear verdict for the new issue |
| `POST /dual-tranche` | Runs `/curve-spreads` on two legs (EUR, USD) and expresses the USD leg's Z-spread in EUR terms via a user cross-currency basis |

### 7.2 Curve bootstrap & discounting convention

Par points are bootstrapped **sequentially** into zero rates. For pillar *k* with par rate `c_k` and
tenor `T_k`, the code searches for the zero rate `z_k` that reprices the pillar's own par bond
(annual coupons at `T_k, T_k−1, …, first t>0`, final flow +100 redemption) to exactly 100, using the
**already-solved shorter pillars** plus the candidate `(T_k, z_k)` point, with **linear interpolation
on zero rates** between pillars and **flat extrapolation** outside the pillar range:

```python
def price_at(z_candidate):
    trial = solved + [{"tenor_y": T, "zero_pct": z_candidate * 100.0}]
    zf = _zero_fn(trial)                       # linear-on-zero-rates interpolant
    pv = sum(cf * (1.0 + zf(t)) ** (-t) for t in times)
    return pv - 100.0
z_k = _bisect(price_at, -0.05, 1.0)
```
(`green_bond_analytics.py:154–176`). Discounting is annual-compounding: `DF(t) = (1 + z(t))^-t`.
This is a documented simplification — no day-count fractions, no OIS-vs-Treasury distinction — but
it is stated as such in the module docstring and the frontend `ModelNote`.

### 7.3 Spread stack: G / I / Z-spread & ASW proxy

```
YTM        : bisection on flows vs price, no curve needed
G-spread   = YTM − linearly-interpolated benchmark PAR yield at the bond's maturity
I-spread   = YTM − linearly-interpolated swap rate at the bond's maturity
Z-spread s : bisection solving  price = Σ_i CF_i · (1 + z(t_i) + s)^(−t_i)   over [-0.20, +0.50]
ASW proxy  : a = c − s_M + (1 − P/100) / A_sw   (bp),  A_sw = Σ swap-curve DFs at coupon dates
             with swap rates TREATED AS ZERO RATES (stated proxy, not a bootstrapped swap curve)
```
(`_curve_spread_block`, lines 252–318). The Z-spread solver returns a **round-trip check**: it
reprices the bond at the solved spread and reports `abs_error` plus a `passes_pm_0_01` boolean —
this is the same discipline the exemplar climate-credit module uses for its SICR arithmetic, applied
here to a fixed-income solver instead of a credit-risk formula.

**Hand-traced Z-spread bisection.** To verify the solver independently of the codebase, I built a
minimal 2-year bond off a *flat* 3.00% zero curve (so the answer is checkable without a 4-6 point
bootstrap): coupon 5.00%, price 100.50, cashflows `(t=1, CF=5.00)`, `(t=2, CF=105.00)`. Running the
exact `_bisect` algorithm from `green_bond_analytics.py` (tol 1e-10, bracket [-0.20, 0.50]) against
`f(s) = Σ CF_i·(1.03+s)^(−t_i) − 100.50`:

| Quantity | Value |
|---|---|
| Solved Z-spread | 0.017321178 (decimal) = **173.21 bp** |
| Reprice at solved s | 100.499999999988 |
| Target price | 100.50 |
| `abs_error` | 1.2×10⁻¹¹ → `passes_pm_0_01 = True` |

The bond reprices to the target within the solver's own tolerance, confirming the bisection converges
correctly and the round-trip check the API returns is a real verification, not a cosmetic field.

### 7.4 Relative value: comp-set OLS

```
spread_bp = α + β·tenor_y                     (closed-form OLS: β = Sxy/Sxx, α = ȳ − β·x̄)
R² = 1 − SS_res/SS_tot,  residual SE = sqrt(SS_res / max(n−2, 1))
new-issue residual = new_issue_spread − (α + β·new_issue_tenor)
verdict: "cheap" if residual > +1 SE, "dear" if < −1 SE, else "fair"
```
Optional green-dummy regression `spread = a + b·tenor + g·green` solves the 3×3 normal equations
exactly via Cramer's rule (`solve3`, lines 380–391); `g` is the tenor-controlled greenium estimate.
Matched-pair greenium pairs each green comp with the nearest-tenor conventional comp within a
tolerance and averages `spread_green − spread_conventional` — a model-free cross-check on the
regression estimate.

**Hand-traced OLS.** A tiny synthetic comp set, tenor vs spread: `(3, 60)`, `(5, 80)`, `(7, 100)`,
`(9, 125)` (the last point deliberately off the linear trend to force a non-trivial residual):

| Step | Computation | Result |
|---|---|---|
| x̄, ȳ | mean(3,5,7,9)=6.0; mean(60,80,100,125)=91.25 | 6.0, 91.25 |
| Sxx | Σ(x−6)² = 9+1+1+9 | 20.0 |
| Sxy | Σ(x−6)(y−91.25) = 93.75+11.25+8.75+101.25 | 215.0 |
| β | 215.0/20.0 | **10.75 bp/yr** |
| α | 91.25 − 10.75×6.0 | **26.75 bp** |
| fitted | [59.0, 80.5, 102.0, 123.5] | resid [1.0, −0.5, −2.0, 1.5] |
| SS_res / SS_tot | 7.5 / 2318.75 | R² = **0.9968** |
| residual SE | sqrt(7.5/2) | **1.9365 bp** |
| new issue (tenor 6, spread 100) | fitted = 26.75+10.75×6 = 91.25; residual = 100−91.25 = **+8.75 bp** | **8.75 > 1.9365 SE → "cheap"** |

This reproduces the exact arithmetic the endpoint's Python executes (verified against the module's
own closed-form formulas line-by-line, not just against the API response), confirming both the
regression and the cheap/dear verdict rule behave as documented.

### 7.5 Dual-tranche cross-currency comparison

`POST /dual-tranche` runs the full `_curve_spread_block` independently on an EUR leg and a USD leg
(each on its own benchmark + swap curve), then expresses the USD Z-spread in EUR terms:
`eur_equivalent_of_usd_z = z_usd + xccy_basis_bp`, where the basis is a **user-supplied** input
(typically negative for EUR/USD) — the engine never invents a basis. `eur_z − usd_equivalent` gives
the issuer funding verdict (which currency is cheaper after the basis).

### 7.6 Frontend-only analytics (not in the backend engine)

Three pieces of real math live only in `GreenBondPricingDeskPage.jsx`, clearly labeled as
"frontend desk math — stated conventions, all parameters editable":

**Pricing build (IPT → guidance → launch).** `tightening = min(cap, max(0, (bookMult−1)×bpPerTurn))`;
`guidance = IPT − tightening/2`; `finalSpread = IPT − tightening`; `NIP = finalSpread − fairValue`.
Auto-IPT defaults to `fair value + 15bp` cushion (lines 259–276).

**Order-book allocation optimizer** (lines 381–426). Peak book at IPT = `bookMult × dealSize`, split
by an editable investor-type distribution. Price sensitivity uses a **linear drop-out rule**:
`survive(tBp) = max(0, 1 − dropPerBp × tBp / 100)`, so `finalBook = peakBook × survive(tightening)`.
Two allocation methods are computed side by side:
- *Pro-rata*: every account gets the same fill rate `fillPro = min(1, size/finalBook)`.
- *Preferred tiering*: an **iterative waterfall** (≤6 passes) that weights demand by a per-investor
  tier factor, caps each type at its own demand, and redistributes any unplaced amount among accounts
  still below their cap:
  ```js
  for (it = 0; it < 6 && remaining > 1e-9 && active.length; it++) {
    wsum = Σ_active pctN·w
    share_i = remaining × pctN_i × w_i / wsum
    take_i = min(share_i, demand_i − alloc_i)
    alloc_i += take_i; remaining -= take_i
    // accounts that reached demand drop out of `active` for the next pass
  }
  ```
  This is a standard proportional-with-caps waterfall — not a closed-form solution, but it converges
  because each pass either exhausts `remaining` or removes at least one account from `active`.

**Use-of-proceeds impact analytics** (lines 485–508). `co2 = allocation × factor` (tCO2e avoided/yr)
per ICMA/CBI category, where `factor` is a hand-authored default (`UOP_IMPACT_DEFAULTS`, labeled
"indicative, replace with project-level ex-ante estimates"). Two derived metrics: **impact yield**
`= co2Tot / |greeniumBp|` (tCO2e avoided per bp of greenium *given up* by investors — only defined
when greenium < 0), and **taxonomy roll-up** `= Σ(alloc×tax) / Σalloc`, which can be pushed directly
into the EuGB 85/15 panel below it.

### 7.7 Data provenance & limitations

- **Real, live data**: the rating-bucket OAS comp curve (`GET /api/v1/fred-spreads/series`, real ICE
  BofA series via FRED, Live/Demo badge if `FRED_API_KEY` is absent) and the EuGB compliance verdict
  (`POST /api/v1/eu-gbs/assess-issuance`, Regulation 2023/2631 engine).
- **User-supplied inputs, not market data**: all benchmark/swap curve points, bond terms, comp names
  and spreads, the cross-currency basis — the docstring is explicit that "this engine does the
  fixed-income arithmetic" over whatever the desk supplies; it never fabricates a market level.
- **Hand-authored, labeled reference tables**: the greenium range table (`GREENIUM_TABLE`, by
  sector/rating, cited to "published market studies e.g. CBI pricing reports") and the UoP impact
  intensity defaults (`UOP_IMPACT_DEFAULTS`, cited to ICMA Harmonised Framework / CBI / development-
  bank impact reports) — both explicitly marked "approximate, refresh for production."
  ICMA GBP → EU Taxonomy objective-code mapping (`UOP_CATEGORIES`) is a stated convention for
  pre-filling the EuGB payload, editable.
  Book-build tightening, drop-out and tiering conventions are stated desk heuristics, not calibrated
  to any historical order-book dataset.
- **Simplifications carried through the whole spread stack**: annual (not semi-annual) coupon
  convention; "dirty ≈ clean" under the integer-period convention; ASW treats swap rates as zero
  rates rather than bootstrapping a separate swap discount curve (all three stated in the module
  docstring, methodology notes 2 and 5).
- No mismatch found between the guide's description and the code: both frontend comments and backend
  docstring accurately describe the math actually executed.

## 8 · Model Specification

**Status: implemented.** Both the backend engine and the frontend-only desk analytics described
above are live, deterministic code — not a specification for future work.

**8.1 Purpose & scope.** Give a green-bond origination desk one workbench for: (i) curve-relative
pricing of a new issue (G/I/Z/ASW against user curves), (ii) comp-set relative value with a
tenor-controlled greenium estimate, (iii) a book-build simulation from IPT to launch with an
allocation optimizer, (iv) EU Green Bond Standard 85/15 compliance, and (v) use-of-proceeds impact
economics — end to end for a primary EUR/USD green-bond mandate.

**8.2 Conceptual approach.** Standard fixed-income curve-and-spread methodology: sequential
par→zero bootstrap (linear-on-zero-rates interpolation), bisection solvers for YTM and Z-spread
(the same numerical technique used for both — a monotone root-find on a discounted cashflow
function), and closed-form OLS (normal equations, solved exactly for both the 2-parameter and
3-parameter/green-dummy regressions) for relative value. The book-build and impact-yield layers are
deliberately simple linear/ratio conventions rather than a market-microstructure model, chosen so
every input-to-output relationship is auditable by hand (as demonstrated in §7.3–§7.6 above).

**8.3 Mathematical specification.**
```
Bootstrap:      z_k solves  Σ_t CF_t(c_k) · (1+z(t))^-t = 100   (z(t) linear-on-zero, flat extrap)
YTM:            y solves    Σ_t CF_t · (1+y)^-t = price
G-spread:       YTM − par_interp(maturity)          (bp)
I-spread:       YTM − swap_interp(maturity)         (bp)
Z-spread:       s solves    Σ_t CF_t · (1+z(t)+s)^-t = price
ASW proxy:      a = c − s_M + (1 − P/100)/A_sw ,  A_sw = Σ_t (1+swap_interp(t))^-t
OLS:            β = Sxy/Sxx, α = ȳ−βx̄ ;  green-dummy: X'X w = X'y  (3×3 exact solve)
Book tightening: t = min(cap, max(0, (mult−1)·bpPerTurn));  survive(t) = max(0, 1 − drop·t/100)
Impact yield:   co2Tot / |greenium_bp|   (only defined for greenium < 0)
```

**8.4 Data requirements.** Benchmark and swap curve points (4-12 tenor/rate pairs each), bond terms
(coupon, maturity, price), a comp set (name/tenor/spread/green flag, 3-20 rows), the FRED rating-
bucket OAS series for the conventional comp, an EuGB issuance payload (taxonomy %, flexibility
pocket, DNSH/safeguards/reviewer flags), and UoP category allocations with impact-factor inputs.
Everything is either user-supplied at run time or pulled live from FRED / the EuGB engine — there is
no persisted market database behind this module.

**8.5 Validation & benchmarking.** The Z-spread and OLS hand-traces in §7.3/§7.4 above are the
validation performed for this deep-dive (independent re-derivation of the bisection and normal-
equation arithmetic against the exact algorithm in `green_bond_analytics.py`, both reproducing the
API's own math to within floating-point tolerance). For production use, the natural next checks are:
back-test the bootstrap against a vendor zero curve (e.g. Bloomberg PXUS/PXEU) at matching tenors,
and compare the greenium regression coefficient against a larger, live comp universe rather than the
7-row editable placeholder set shipped in the page.

**8.6 Limitations & model risk.** Annual-coupon/integer-period convention understates the precision
of a real settlement-date accrued-interest calculation; the ASW proxy is explicitly a proxy (swap
rates as zero rates, no bootstrapped swap discount curve); book-build tightening and drop-out are
linear desk heuristics with no historical calibration; the OLS relative-value model has no protection
against a thin or non-representative comp set (n≥3 is the only guard) and reports fair/cheap/dear
purely from a ±1-residual-SE band, which is a stated convention, not a statistical confidence test at
a chosen significance level. All of these are labeled in the module docstring and/or the frontend
`ModelNote` components, so a desk user encounters the caveat at the point of use, not buried in
documentation.

## 9 · Future Evolution

### 9.1 Evolution A — Live primary-issuance pricing with calibrated greenium and book-building (analytics ladder: rung 3 → 4)

**What.** §7 rates this a genuine tier-A primary-issuance workbench: backend math in `green_bond_analytics.py` (473 lines, 3 POST endpoints) with no PRNG anywhere, live rating-bucket OAS comps from `GET /api/v1/fred-spreads/series` (real ICE BofA series via FRED, Live/Demo badged on `FRED_API_KEY`), a real EuGB compliance verdict, an order-book allocation optimizer, and use-of-proceeds impact-yield analytics — every fabricated-looking number is either a labeled reference table or a user-editable input. Evolution A deepens it toward predictive pricing: calibrate the greenium adjustment against observed new-issue-concession data (rather than a hand-authored `GREENIUM_TABLE`), and add a forward-pricing layer that projects the likely re-offer spread from the live comp curve plus issuer-specific factors.

**How.** (1) Replace the static `GREENIUM_TABLE` with a greenium estimated from a panel of recent green vs conventional new issues by rating/sector, refreshed from market data. (2) A pricing model that forecasts re-offer spread from the FRED comp curve, tenor, rating, and greenium, with a confidence band. (3) Extend the order-book optimizer with real allocation-preference weighting (green-mandate investors). (4) Keep the honest Live/Demo badging on all live-data paths.

**Prerequisites.** A new-issue-concession dataset for greenium calibration; the FRED key for live comps (already integrated with graceful demo fallback). **Acceptance:** the greenium is calibrated to observed concessions with a documented method (not a hand-authored table); the forward re-offer spread reproduces from the comp curve plus adjustments; live-data badging remains accurate.

### 9.2 Evolution B — Syndicate-desk pricing copilot (LLM tier 2)

**What.** A copilot for DCM/syndicate desks: "price a 7-year A-rated green bond off today's comps, estimate the greenium, and run the order-book allocation at 2× cover" tool-calls the three pricing endpoints and narrates the re-offer spread, EuGB compliance verdict, and allocation, with the live FRED comp curve as the spine.

**How.** Tier-2 tool-calling over the existing 3 POST endpoints (pricing, allocation, impact) — the module is already backend-complete, making it a strong tier-2 candidate now. The grounding corpus is §7, which documents the FRED comp integration, EuGB verdict logic, and allocation optimizer. The copilot must respect the Live/Demo badge — if FRED is unavailable it states comps are demo. Every spread and allocation figure validated against tool output; the fabrication guard checks basis points against the pricing endpoint.

**Prerequisites.** None hard — the backend exists and is PRNG-free; prompt-caching for the module context. Evolution A's calibrated greenium strengthens answers. **Acceptance:** every spread, greenium, and allocation figure traces to a tool call; the copilot surfaces the EuGB compliance verdict verbatim from the endpoint; it flags demo comps when FRED is absent.