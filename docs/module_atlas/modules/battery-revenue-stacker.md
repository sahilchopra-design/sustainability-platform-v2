# Battery Revenue Stacker
**Module ID:** `battery-revenue-stacker` · **Route:** `/battery-revenue-stacker` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACTION_COLOR`, `Badge`, `FALLBACK_SHAPE`, `Field`, `Kpi`, `PROXY_PRICE_MAX`, `PROXY_PRICE_MIN`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtUsd` | `(v, d = 2) => (v == null \|\| isNaN(v)) ? '—' : `$${(Number(v) / 1e6).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d })}M`;` |
| `fmtNum` | `(v, d = 1) => (v == null \|\| isNaN(v)) ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: d });` |
| `hourly` | `buckets.map((b) => (b.length ? b.reduce((s, x) => s + x, 0) / b.length : null));` |
| `mean` | `known.reduce((s, x) => s + x, 0) / known.length;` |
| `filled` | `hourly.map((x) => (x == null ? mean : x));` |
| `iMin` | `Math.min(...filled); const iMax = Math.max(...filled);` |
| `proxy` | `filled.map((i) => iMax > iMin` |
| `activeShape` | `useMemo(() => { if (shapeMode === 'custom') return customShape.map((s) => parseFloat(s) \|\| 0);` |
| `shapePreview` | `useMemo(() => (activeShape \|\| defaultShape).map((p, h) => ({` |
| `tollRevYr` | `parseFloat(tollFeeUsdKwYr \|\| 0) * parseFloat(inp.power_mw \|\| 0) * 1000; // $/kW-yr × kW` |
| `rows` | `d.per_year.map((y) => {` |
| `tolledNet` | `tollRevYr - y.opex_usd - y.augmentation_cost_usd;` |
| `tolledTotal` | `rows.reduce((s, r) => s + r.tolled_net_usd, 0);` |
| `stackChart` | `useMemo(() => view ? view.rows.map((y) => ({` |
| `degChart` | `useMemo(() => view ? view.rows.map((y) => ({` |
| `durationH` | `(parseFloat(inp.energy_mwh) \|\| 0) / (parseFloat(inp.power_mw) \|\| 1);` |
| `premYr` | `(parseFloat(greenTollPrem) \|\| 0) * parseFloat(inp.power_mw \|\| 0) * 1000; // $/kW-yr × kW` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/bess-stacking/fr-cooptimize` | `fr_cooptimize` | api/v1/routes/bess_stacking.py |
| POST | `/api/v1/bess-stacking/augmentation-optimize` | `augmentation_optimize` | api/v1/routes/bess_stacking.py |
| GET | `/api/v1/grid-carbon/current` | `current_intensity` | api/v1/routes/grid_carbon.py |
| GET | `/api/v1/grid-carbon/forecast` | `forecast` | api/v1/routes/grid_carbon.py |
| GET | `/api/v1/grid-carbon/regional` | `regional` | api/v1/routes/grid_carbon.py |
| GET | `/api/v1/grid-carbon/global/sources` | `global_sources` | api/v1/routes/grid_carbon.py |
| GET | `/api/v1/grid-carbon/global/mix` | `global_mix` | api/v1/routes/grid_carbon.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`

**Database tables:** `SoC`, `__future__` *(shared)*, `api` *(shared)*, `datetime` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `two` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `FALLBACK_SHAPE`

## 4 · End-to-End Data Lineage (source → transformation → UI)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **60** other module(s).

| Connected module | Shared via |
|---|---|
| `grid-carbon-intelligence` | table:api, table:exc, table:two |
| `credit-spread-climate-monitor` | table:api, table:exc |
| `module-navigator` | table:api |
| `portfolio-stress-test-drilldown` | table:api |
| `portfolio-transition-alignment` | table:api |
| `reference-data-explorer` | table:api |
| `portfolio-climate-pulse` | table:api |
| `portfolio-climate-var` | table:api |
| `financial-modeling-studio` | table:api |
| `portfolio-dashboard` | table:api |

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`battery-revenue-stacker` (NX2-07) is a single-asset BESS revenue-stacking engine built on
one deterministic backend route, `backend/api/v1/routes/bess_stacking.py` (1,222 lines, the
module docstring states explicitly "Pure deterministic math from the request inputs; NO PRNG
anywhere"), fronted by a 952-line React page (`BatteryRevenueStackerPage.jsx`). Seven
endpoints:

| Endpoint | What it does |
|---|---|
| `POST /stack` | Per-year revenue stack: arbitrage (greedy **or** DP-optimal dispatch) + frequency response + capacity, calendar+cycle degradation, warranty envelope, augmentation schedule, opex, optional intraday-switching layer and carbon-arbitrage analytics |
| `POST /dispatch-compare` | One-day greedy vs DP-optimal dispatch: margins, uplift %, hourly SoC path |
| `POST /fr-cooptimize` | FR MW-reservation sweep: reserve X MW for FR 24/7, run optimal arbitrage on the rest, report forgone-arbitrage opportunity cost and the profit-maximising split |
| `POST /structures` | Toll vs merchant vs hybrid (floor + upside share) comparison at P50/P90 spreads |
| `POST /augmentation-optimize` | Sweep the augmentation trigger (60–95% + never), minimise $/MWh of lifetime delivered energy |
| `GET /ref/defaults` | Documented default 24h price shape + market parameter defaults, each labeled with a basis |
| `GET /ref/market-menus` | GB/PJM-style capacity-derating-by-duration tables + ancillary product menu ($/MW-yr), labeled |

Every number traces to a user input, a documented closed-form formula, or a labeled
hand-authored convention (default price shape, degradation rates, derating tables) — all
served back with their stated basis so the frontend never hard-codes a number the backend
doesn't expose (`/ref/defaults`, `/ref/market-menus`).

### 7.2 Arbitrage dispatch — two algorithms, formally

**GREEDY (screening, legacy default)** — `_daily_greedy_dispatch`:
1. FR carve-out: `fr_committed_hours_per_day` hours are removed from the arbitrage window,
   chosen as the hours whose price sits closest to the daily mean (`_fr_blocked_hours` sorts
   by `abs(price[h] - mean_price)`) — the convention that FR is scheduled in the
   least-valuable shoulder hours.
2. Sort the remaining window's hours by price ascending (`asc`). Pair cheapest-remaining
   (charge) with dearest-remaining (discharge) using two pointers (`lo`, `hi`).
3. Each pair moves `e_out = min(P·RTE, remaining_budget)` MWh delivered, `e_in = e_out/RTE`
   MWh drawn from the grid (RTE applied once, on delivered energy). `pair_margin = e_out·P_d
   − e_in·P_c`.
4. Dispatch while `pair_margin > 0`; stop at the first non-positive pair (prices are sorted,
   so all later pairs are worse) or when `budget_mwh = cycles_per_day_cap × usable_mwh` is
   exhausted.
5. **Documented limitation** ("Chronological simplification" in the module docstring): hour
   pairing ignores intra-day ordering — "charge hours are assumed schedulable before their
   paired discharge hours." Exact for shapes with an overnight trough before the evening
   peak; on shapes that violate that convention the greedy can report a chronologically
   **infeasible** margin (see §7.3(b)). The greedy also under-uses discharge power — it
   delivers at most `P·RTE` per discharge hour (one hour per pair), never the full `P`.

**DP_OPTIMAL — backward dynamic programme, formally** — `_daily_dp_dispatch`:

*State space:* `(hour h ∈ {0..23}, SoC step s ∈ {0..S}, cumulative-delivered-budget step
u ∈ {0..U})`, on a quantized grid:
```
q       = max(P·RTE/8, usable_mwh/1500, (cycles_per_day_cap·usable_mwh)/2000)   # quantum, MWh
S       = floor(usable_mwh / q)         # max SoC in steps
U       = floor(cycles_per_day_cap·usable_mwh / q)   # daily delivered-energy budget, steps
chg_max = floor(P·RTE / q)               # max charge steps/hour
dis_max = floor(P / q)                   # max discharge steps/hour
```
`DP_C_STEPS = 8` is fixed so that one full-power charge-hour is always exactly 8 grid steps;
the extra `max(...)` floor guards the grid size (≤1500 SoC steps, ≤2000 budget steps) for
extreme power/energy ratios. Capacity and the cycle budget round **down** to the grid
(conservative — at most one quantum lost).

*Actions at hour h* (forced to idle if `h` is FR-blocked):
- **idle** — no state change.
- **charge `a` steps** (`a ∈ {1..chg_max}`, requires `s + a ≤ S`): `s → s + a`; cost
  `(a·q/RTE)·price[h]` (grid draw = `a·q/RTE`, stored increase = `a·q`).
- **discharge `k` steps** (`k ∈ {1..dis_max}`, requires `s ≥ k` and `u + k ≤ U`): `s → s − k`,
  `u → u + k`; revenue `(k·q)·price[h]` (delivered = `k·q`).

*Transition / recursion (backward value iteration, vectorised over the full `(s,u)` grid per
hour):*
```
V[24][s,u] = 0                                    (terminal — leftover SoC has zero value)
V[h][s,u]  = max( V[h+1][s,u],                                          # idle
                  max_a  V[h+1][s+a,u]        - (a·q/RTE)·price[h] ,    # charge a (s+a ≤ S)
                  max_k  V[h+1][s-k,u+k]      + (k·q)·price[h]     )    # discharge k (s≥k, u+k≤U)
```
FR-blocked hours skip the charge/discharge branches (forced idle; `V` unchanged).

*Objective:* maximise `V[0][0,0]` — SoC and cumulative budget both start at 0 at hour 0.
Deterministic vectorised value iteration (numpy, no sampling) — exact on the discretised
grid, i.e. the LP-equivalent optimum subject to the SoC bounds `[0, usable_mwh]` at every
hour, power limits `P` (charge, grid side) / `P` (discharge, delivered side), RTE applied
once on delivered energy, the daily cycle budget, and the shared FR carve-out. The forward
reconstruction walks the argmax actions from `(0,0)` and **asserts** `0 ≤ soc_mwh ≤
usable_mwh` at every hour (`RuntimeError` if violated) — the code enforces the bound it
documents, it does not merely claim it.

Per the docstring, the DP typically **beats** the greedy because it can (a) discharge at
full power `P` (the greedy caps each discharge hour at `P·RTE`) and (b) recycle intra-day,
and it **corrects** the greedy's acausal pairing on shapes that violate the
trough-before-peak convention.

### 7.3 Worked DP examples (hand-traced)

To keep the state space hand-traceable, use a toy battery sized so the quantized grid
collapses to a single quantum: `P = 1 MW`, `RTE = 80%` ⇒ `q = P·RTE/8 = 0.1 MWh`. Choose
`usable_mwh = 0.1` (⇒ `S = floor(0.1/0.1) = 1`) and `cycles_per_day_cap = 1.0` (⇒
`U = floor(1.0×0.1/0.1) = 1`). `chg_max = floor(0.8/0.1) = 8` and `dis_max = floor(1/0.1) =
10`, but with `S = U = 1` only `a = 1` and `k = 1` are ever reachable — i.e. the battery can
do **at most one full charge and one full discharge** across the toy day. A full charge
(`a=1`) draws `e_in = 0.1/0.8 = 0.125` MWh from the grid to store `0.1` MWh; a full discharge
(`k=1`) delivers `e_out = 0.1` MWh. A 4-hour toy day, no FR carve-out.

**(a) Well-behaved shape — DP matches the "obvious" schedule, and matches greedy.**
Prices `[h0..h3] = [$10, $100, $10, $100]` (repeating cheap/expensive). By inspection the
best chronological (charge-before-discharge) pairing is `(h0→h1)` or `(h2→h3)`; both give
margin `= 0.1×100 − 0.125×10 = 10 − 1.25 = 8.75`. Running the **actual code**: `asc` sorted
by price = `[h0, h2, h1, h3]` (ties broken by index); the greedy pairs `lo=0 (h0, $10)` with
`hi=3 (h3, $100)`: `margin = 0.1×100 − 0.125×10 = 8.75`; budget exhausted after one pair
(`budget_mwh = 1.0×0.1 = 0.1 = e_out`), loop stops. **Greedy margin = $8.75**, schedule
charge‑h0/discharge‑h3 — chronologically valid (h0 < h3) and SoC-feasible
(`SoC: 0→0.1 at h0, unchanged h1–h2, →0 at h3`, always inside `[0, 0.1]`). The DP, solved by
the identical backward recursion, finds the same optimum: the two chronologically valid,
budget-feasible pairs are `(0,1)` margin `8.75` and `(2,3)` margin `8.75` (both use the same
$10 charge price and $100 discharge price); DP's `V[0][0,0] = 8.75`, matching greedy exactly
and respecting the SoC bound (`soc_path = [0, 0.1, 0, 0, 0]`, wait — either valid path stays
in `[0, 0.1]`). This confirms DP = greedy's economics on a shape that respects the
trough-before-peak convention.

**(b) Adversarial shape — DP corrects an infeasible greedy margin.** Prices
`[h0..h3] = [$100, $50, $80, $15]` (peak **first**, trough **last** — violates
trough-before-peak). Running the actual greedy code: `asc` sorted ascending = `[h3($15),
h1($50), h2($80), h0($100)]`; pair `lo=0 (h3, $15)` charges, `hi=3 (h0, $100)` discharges:
`margin = 0.1×100 − 0.125×15 = 10 − 1.875 = 8.125 > 0` → dispatched; `plan[3] = charge`,
`plan[0] = discharge`. **The greedy reports an $8.125 margin for a schedule that discharges
at hour 0 using energy charged at hour 3** — acausal, exactly the failure mode the module
docstring warns about ("on price shapes that violate the trough-before-peak convention the
greedy's no-chronology relaxation can overstate revenue").

The DP, which only permits `s+a ≤ S` / `s ≥ k` transitions moving **forward** through `h =
0..23`, cannot select this pairing. Backward induction (terminal `V₄[s,u]=0`, `q=0.1`,
`a=k=1`, `rte=0.8`):
```
h=3 (price 15):  V3[0,0]=0(idle)  V3[0,1]=0(idle)  V3[1,0]=max(idle 0, discharge→V4[0,1]+0.1·15=1.5)=1.5(discharge)  V3[1,1]=0(idle)
h=2 (price 80):  V2[0,0]=max(0, charge→V3[1,0]-0.125·80=1.5-10=-8.5)=0(idle)   V2[1,0]=max(V3[1,0]=1.5, discharge→V3[0,1]+0.1·80=8)=8(discharge)   V2[·,1]=0
h=1 (price 50):  V1[0,0]=max(0, charge→V2[1,0]-0.125·50=8-6.25=1.75)=1.75(CHARGE)   V1[1,0]=max(V2[1,0]=8, discharge→V2[0,1]+0.1·50=5)=8(idle)
h=0 (price 100): V0[0,0]=max(V1[0,0]=1.75, charge→V1[1,0]-0.125·100=8-12.5=-4.5)=1.75(idle)
```
`V0[0,0] = $1.75` — the DP-optimal margin. Forward reconstruction: idle at h0, **charge**
at h1 ($50) → `s: 0→1`, cost `0.125×50 = $6.25`; **discharge** at h2 ($80) → `s: 1→0`,
`u: 0→1`, revenue `0.1×80 = $8.00`; idle at h3. Net margin `= 8.00 − 6.25 = $1.75`,
matching `V0[0,0]`. SoC path `[0, 0, 0.1, 0, 0]` — never leaves `[0, 0.1]`, and charge (h1)
strictly precedes discharge (h2), so the schedule is physically realisable. **DP margin
$1.75 vs greedy's (infeasible) $8.125** — the DP correctly rejects the acausal (h3-charge,
h0-discharge) pairing that the greedy's chronology-blind price sort accepts, landing instead
on the best truly sequential trade.

Both hand traces used the identical recursion the code runs (`_daily_dp_dispatch`'s backward
value iteration, here on a 2-state SoC/budget grid instead of the full ~10–1500-step grid the
engine uses for realistic batteries) — confirming the state space, transition, and objective
stated in §7.2, and the documented greedy/DP divergence mechanism.

### 7.4 Degradation, augmentation, warranty

```
soh -= deg_per_cycle · annual_cycles + calendar_fade_pct_per_year/100     (additive convention)
deg_per_cycle = (degradation_pct_per_1000_cycles/100) / 1000              # SoH loss per equivalent full cycle
usable_mwh(year) = nameplate_mwh × soh_start_of_year
```
Cycle fade uses `degradation_pct_per_1000_cycles` (default 2.5, "cycle-driven capacity fade
convention for LFP ~2-3% per 1000 EFC"); calendar fade defaults to 0 ("preserves legacy
cycle-only behaviour"; typical LFP convention 1.0–1.5%/yr, `recommended` field in
`/ref/defaults`). At the **start** of each year, if `soh < augmentation_trigger_pct` (default
80%), the project augments back to 100%: `cost = (nameplate − usable_mwh)·1000·
augmentation_cost_usd_per_kwh` (default $150/kWh, "BNEF/NREL 2024-25 pack+BOS ranges
$120-180/kWh"), booked that year, and `soh` resets to 1.0. Warranty checks (optional) compare
annual equivalent full cycles vs `warranty_max_cycles_per_year` and max DoD vs
`warranty_max_dod_pct` — DoD uses the **true** max intra-day SoC/usable from the DP path, or
the documented proxy `min(1, cycles_per_day)×100` for the greedy (which has no SoC path).

### 7.5 Intraday switching layer (optional)

```
p_id(h) = mean(DA) + (p_da(h) - mean(DA)) × intraday_spread_multiplier      # derived ID shape (default ×1.15)
charge hours:    gain = e_in  × max(0, p_da[h] - p_id[h]) × intraday_capture_pct/100
discharge hours: gain = e_out × max(0, p_id[h] - p_da[h]) × intraday_capture_pct/100
```
The physical schedule stays fixed by the DA dispatch (greedy or DP); each scheduled hour
additionally settles the delta versus the intraday market in whichever direction is
favourable. `intraday_capture_pct` (default 60%) is a labeled foresight/liquidity haircut on
the theoretical best-switching gain — additive on top of the DA arbitrage margin.

### 7.6 Carbon-arbitrage analytics (optional)

```
net tCO2e/day = [ Σ_discharge e_out(h)·I(h) − Σ_charge e_in(h)·I(h) ] × 365 / 1000
carbon_value_usd_per_tco2e = (arbitrage + intraday margin) / net tCO2e displaced
```
Discharging displaces marginal generation at discharge-hour intensity; charging adds load at
charge-hour intensity, so round-trip losses automatically carry charge-hour emissions
(reported separately as `round_trip_loss_emissions_tco2e`). `carbon_value` is explicitly
labeled a **value metric** (market revenue earned per tonne displaced), **not** an abatement
cost. Intensity shape can be the wired live `/api/v1/grid-carbon` UK NESO forecast or a
user-supplied 24h array — a "marginal-intensity screening convention," stated as such.

### 7.7 Other streams and structures

```
FR revenue        = fr_price_usd_per_mw_yr × power_mw × (fr_committed_hours_per_day/24)   # 24/7 rate, prorated
capacity revenue  = capacity_price_usd_per_mw_yr × power_mw × capacity_derating_factor
opex              = fixed_opex_usd_per_mw_yr × power_mw + variable_opex_usd_per_mwh × annual_delivered_mwh
net margin        = arbitrage (+ intraday) + FR + capacity − opex − augmentation cost
```
`/structures` compares **merchant** (keeps all market streams), **toll** (fixed
`toll_fee_usd_per_kw_yr × kW` replaces all market streams; owner keeps opex/augmentation),
and **hybrid** (`floor_usd_per_kw_yr × kW` + `upside_share_pct` of merchant gross above the
floor) at both P50 (supplied/default shape) and a documented P90 convention `p90(h) = mean +
(p50(h) − mean) × p90_spread_scalar` (a "weak-spread year, same average level"). Recommended
structure = **maximin** (best worst-case across P50/P90) — explicitly labeled "a conservative
screening rule, not investment advice." `/fr-cooptimize` sweeps MW reserved for FR (power
split, not the `/stack` hours-carve-out model) against DP-optimal arbitrage on the residual
MW, reporting `opportunity_cost(X) = arbitrage(0) − arbitrage(X)` and the profit-maximising
split. `/augmentation-optimize` sweeps the trigger 60–95% (2.5pp grid) + "never," reporting
both the net-margin-maximising and the `$/MWh delivered`-minimising trigger (uses greedy
dispatch for sweep speed — rankings preserved since all candidates share the same dispatch
method, documented).

### 7.8 Data provenance & limitations

- **No PRNG anywhere** in `bess_stacking.py` — confirmed by inspection; every figure is a
  user input or a closed-form/DP transform of one.
- **Every default is a labeled hand-authored modeling convention**, not a live market quote:
  the two-peak default price shape (`PRICE_SHAPE_BASIS`, "indicative of 2023-2025
  GB/ERCOT day-ahead averages"), RTE 88% (NREL ATB 2024), cycle fade 2.5%/1000 EFC, calendar
  fade convention, augmentation trigger/cost, FR/capacity rates (GB Dynamic Containment / T-4
  style), fixed/variable opex, intraday spread multiplier/capture — all served with a
  `basis` string via `GET /ref/defaults`.
- **Capacity-derating and ancillary-product tables** (`GET /ref/market-menus`) are explicitly
  "HAND-AUTHORED... approximate, labeled... refresh from the latest auction guidelines for
  production use" — GB T-4-style and PJM ELCC-style duration tables, and a 4-product
  ancillary menu.
- **Carbon-arbitrage `carbon_value`** is a value metric off a *marginal-intensity screening
  convention*, explicitly not an abatement cost; the live UK NESO shape only covers Great
  Britain.
- **Single representative day held flat across the horizon** — no seasonal/annual price-shape
  escalation; only the battery ages (SoH), not the market.
- **`/augmentation-optimize`'s "never augment" case is approximate** — the code comments
  admit it actually re-runs with `trigger=50%` and discards runs that still augmented within
  the horizon, since a literal "never" trigger isn't representable in the same sweep
  structure; candidates that cross even the 50% floor are silently skipped from the sweep
  (documented in-code, not surfaced as a caveat in the API response body itself — a minor
  gap between code comment and response-level documentation, not a numerical error).
- **Frontend never fabricates on engine failure** — `res.status === 'demo'` renders "engine
  unreachable — no figures shown," consistent with the rest of the remediated platform.

## 8 · Model Specification

**Status: implemented.**

**8.1 Purpose & scope.** Full-lifecycle revenue-stacking analysis for a single grid-scale
BESS asset: daily energy-arbitrage dispatch (two interchangeable solvers), frequency-response
and capacity-market income, calendar+cycle degradation with an augmentation schedule and
warranty-envelope checks, an optional intraday-switching overlay, carbon-arbitrage value
accounting, and a toll/merchant/hybrid contract-structure screen at P50/P90 — for asset
originators, revenue-stack structurers and O&M/warranty teams.

**8.2 Conceptual approach.** A single **daily dispatch kernel**, run once per project year on
that year's `usable_mwh` (nameplate × start-of-year SoH), computed by either of two
interchangeable, side-by-side-comparable algorithms: (i) a **greedy screening pairing**
(cheapest-vs-dearest price sort, chronology-blind, industry-standard back-of-envelope
convention) or (ii) an **exact backward dynamic programme** on a quantized `(hour, SoC,
delivered-budget)` grid that is the true daily arbitrage optimum subject to SoC bounds, power
limits, RTE and the cycle budget. The daily margin is annualised (×365), stacked with FR,
capacity, and optional intraday/carbon layers, and run forward year-by-year through a
degradation/augmentation loop that resets `usable_mwh` at augmentation events. Separate
endpoints reuse the same kernel for sensitivity sweeps (FR MW split, augmentation trigger,
contract structure at P50/P90).

**8.3 Mathematical specification.**
```
Daily dispatch (either method), annualised at 365 days/yr:
  greedy:      pair cheapest/dearest window hours; e_out=min(P·RTE,budget); margin=e_out·P_d-(e_out/RTE)·P_c; stop at margin≤0
  dp_optimal:  V[24][s,u]=0;  V[h][s,u]=max( V[h+1][s,u],
                                             max_a V[h+1][s+a,u] - (a·q/RTE)·price[h],
                                             max_k V[h+1][s-k,u+k] + (k·q)·price[h] )
               q = max(P·RTE/8, usable/1500, cycles_cap·usable/2000);  objective = V[0][0,0]

Degradation:  soh_{y+1} = max(0, soh_y - (deg%/1000)/1000·annual_cycles_y - calendar_fade%/yr)
Augmentation: if soh_y < trigger: cost = (1-soh_y)·nameplate_mwh·1000·aug_usd_per_kwh; soh_y → 1.0

Annual stack: net_y = arbitrage_y (+intraday_y) + FR_y + capacity_y - opex_y - augmentation_y
  FR_y  = fr_price_usd_per_mw_yr · P · (fr_hours/24)
  cap_y = capacity_price_usd_per_mw_yr · P · derating_factor
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Round-trip efficiency | RTE | NREL ATB 2024 utility-scale BESS, 85–90% |
| Cycle-life cap | cycles/day | Warranty-style throughput cap, 1–2 cycles/day common |
| Cycle fade | %/1000 EFC | LFP convention ~2–3%/1000 EFC |
| Calendar fade | %SoH/yr | LFP convention 1.0–1.5%/yr (default 0, legacy-compatible) |
| Augmentation trigger/cost | %SoH / $/kWh | Warranty end-of-life convention 80% / BNEF-NREL $120–180/kWh |
| FR rate | $/MW-yr | GB Dynamic Containment-style ≈£5/MW/h annualised |
| Capacity price/derating | $/MW-yr, 0–1 | GB T-4 / PJM ELCC style duration-derating tables |
| DP quantization | `q = P·RTE/8` | Documented grid convention, 8 steps per full charge-hour |
| Intraday spread/capture | ×DA, % | GB/DE ID1-vs-DA 10–25% typical range; capture % labeled haircut |

**8.4 Data requirements.** Nameplate power/energy, RTE, cycle/calendar fade rates,
augmentation economics, a 24-hour price shape (documented default, user array, or the live
UK NESO intensity proxy), FR/capacity rates and derating factor, opex rates, optional
warranty caps, optional intraday spread parameters, optional 24h carbon-intensity shape.

**8.5 Validation & benchmarking.** The module's own `/dispatch-compare` endpoint is itself a
validation tool: it asserts (via `RuntimeError`) that the DP's reconstructed SoC path never
leaves `[0, usable_mwh]`, and reports the DP-vs-greedy uplift so users can sanity-check that
DP margin ≥ greedy margin on well-behaved (trough-before-peak) shapes — confirmed by hand in
§7.3(a). §7.3(b) is a second, adversarial-shape check confirming the DP corrects an acausal
greedy overstatement, per the documented failure mode. External validation would compare
dispatched cycles/margins against a metered BESS asset's historical settlement data and the
degradation curve against manufacturer warranty-envelope test data.

**8.6 Limitations & model risk.** A single representative daily price shape is held flat
across the multi-year horizon (no seasonal or long-term price escalation); the DP is exact
only on its quantized grid (a coarser quantum for very large power/energy ratios trades
fidelity for tractability, capped at ~1500/2000 steps); the intraday-switching gain assumes a
fixed physical DA schedule (no re-optimisation across both markets jointly); carbon-value
accounting is a marginal-intensity screening convention, not a certified abatement
methodology; and every default rate (FR, capacity, opex, degradation) is a hand-authored,
labeled convention that should be replaced with site/contract-specific data before
investment-grade use.

## 9 · Future Evolution

### 9.1 Evolution A — Calibrate the stack against real market price series (analytics ladder: rung 2 → 3)

**What.** This is one of the platform's strongest engines: 1,222 lines of pure deterministic math ("NO PRNG anywhere" per its own docstring), a formally-specified backward-DP dispatch on a quantized (hour, SoC, budget) grid, FR co-optimisation sweeps, toll/merchant/hybrid structures, and augmentation optimisation — with every default served from `/ref/defaults` with a labelled basis. It already does scenario sweeps (rung 2). What it lacks is contact with observed markets: price shapes are user-supplied or the hand-authored `FALLBACK_SHAPE`, and the GB/PJM derating and ancillary menus are labelled conventions, not market data.

**How.** (1) Wire historical day-ahead price series from the platform's ENTSO-E ingestion (and EIA for US ISOs) as selectable price inputs: run `/stack` over a full year of real hourly shapes instead of one representative day × 365, which also retires the documented greedy limitation honestly (the DP is exact per-day; real chronological shapes make greedy-vs-DP uplift measurable on actual data via `/dispatch-compare`). (2) Backtest calibration: compare modelled arbitrage margins against published GB BESS operational benchmarks (e.g. Modo-style indices) and report the tracking error rather than asserting accuracy. (3) Pin the DP in bench_quant: a small worked day where the optimal dispatch is hand-verifiable, guarding the quantization constants (`DP_C_STEPS = 8`, grid caps 1500/2000). (4) Replace the ancillary $/MW-yr menu conventions with dated market-clearing data where public (GB DC/DR/DM auction results).

**Prerequisites.** ENTSO-E/EIA price coverage check for target markets; a decision on how augmentation costs index over multi-year backtests. **Acceptance:** a year-of-real-prices run reproduces within stated tolerance an external benchmark for a reference GB 2h system; the bench day pins DP margin exactly; `/ref/*` responses carry data vintages alongside their basis labels.

### 9.2 Evolution B — BESS deal-desk analyst over the seven endpoints (LLM tier 2)

**What.** The endpoint surface is already a complete deal-analysis toolkit; Evolution B gives it a conversational operator. "Should this 100MW/200MWh project take the toll or stay merchant?" → `/structures` at P50/P90; "how much FR should we reserve?" → `/fr-cooptimize` sweep, narrating the profit-maximising split and its forgone-arbitrage cost; "when should we augment?" → `/augmentation-optimize`, explaining the $/MWh-of-lifetime-energy objective. The copilot narrates real engine output — including the degradation and warranty-envelope mechanics — and never invents a spread or uplift figure.

**How.** Tool schemas auto-generated from the seven OpenAPI operations (all computational POSTs/GETs, no persistence — no confirmation gating). Grounding corpus: this Atlas record, whose §7.1–7.2 formal specification (greedy's documented chronological simplification, the DP state space, RTE application convention) is precisely what the copilot needs to answer "why do greedy and DP disagree?" correctly. The engine's own transparency convention — every default served with a stated basis — extends to the copilot: answers cite whether each parameter came from user input, `/ref/defaults`, or a market menu. Numeric validation against tool outputs per the Tier-2 contract.

**Prerequisites.** None hard — the deterministic, fully-live surface is tool-ready today; Evolution A's real price series upgrade what-if realism but do not block. **Acceptance:** every $/MWh, margin, and uplift in an answer traces to an endpoint response; parameter provenance is stated per figure; asked for a market the menus do not cover, the copilot reports the gap instead of transplanting GB conventions silently.