# Hybrid Project Workbench
**Module ID:** `hybrid-project-workbench` · **Route:** `/hybrid-project-workbench` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BESS_RTE`, `Badge`, `Field`, `Kpi`, `LOAD_SHAPES`, `SEASON_COLORS`, `SEASON_DAYS`, `SOLAR_COUNTRIES`, `Select`, `TURBINE_CLASSES`, `TURBINE_MW`, `WIND_REGIONS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `SEASON_DAYS` | `{ winter: 90, spring: 92, summer: 92, autumn: 91 }; // mirrors shape engine (= 365)` |
| `BESS_RTE` | `0.88; // NX2-07 bess-stacking engine default round-trip efficiency (documented)` |
| `fmtUsd` | `(v, d = 2) => (v == null \|\| isNaN(v)) ? '—' : `$${(Number(v) / 1e6).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d })}M`;` |
| `fmtNum` | `(v, d = 1) => (v == null \|\| isNaN(v)) ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: d });` |
| `fmtGwh` | `(v) => (v == null \|\| isNaN(v)) ? '—' : `${fmtNum(v / 1000, 1)} GWh`;` |
| `windMw` | `(TURBINE_MW[inp.turbine_class] \|\| 0) * (parseInt(inp.num_turbines, 10) \|\| 0);` |
| `combinedMw` | `windMw + solarMw;` |
| `pSolar` | `axios.post('/api/v1/renewable-ppa/solar-yield', {` |
| `pWind` | `axios.post('/api/v1/renewable-ppa/wind-yield', {` |
| `pBess` | `axios.post('/api/v1/bess-stacking/stack', {` |
| `wMw` | `(TURBINE_MW[inp.turbine_class] \|\| 0) * (parseInt(inp.num_turbines, 10) \|\| 0);` |
| `deg` | `(parseFloat(inp.solar_deg_pct_yr) \|\| 0) / 100;` |
| `curt` | `curtailmentPct / 100;` |
| `share` | `Math.min(100, Math.max(0, parseFloat(inp.contracted_share_pct) \|\| 0)) / 100;` |
| `genOpex` | `(parseFloat(inp.solar_opex_usd_kw_yr) \|\| 0) * solarMw * 1000` |
| `solarGen` | `solarY1 * Math.pow(1 - deg, y - 1); // solar degrades; wind held flat (labeled)` |
| `gross` | `solarGen + windYr;` |
| `curtailed` | `gross * curt;` |
| `net` | `gross - curtailed;` |
| `contractedMwh` | `inTenor ? net * share : 0;` |
| `ppaRev` | `contractedMwh * ppaP;` |
| `merchRev` | `merchantMwh * merchP;` |
| `bessNet` | `bessYears ? (bessYears[y - 1]?.net_margin_usd ?? 0) : 0;` |
| `cfads` | `ppaRev + merchRev + bessNet - genOpex;` |
| `chargeable` | `Math.min(s.daily_curtailed_mwh, p * s.curtailed_hours_per_day, e * cyc);` |
| `delivered` | `charged * BESS_RTE;` |
| `costPerMw` | `(parseFloat(inp.conn_capex_usd_kw) \|\| 0) * 1000;` |
| `savedCapex` | `Math.max(0, combinedMw - gridCap) * costPerMw;` |
| `h2MarginMwh` | `eff > 0 ? h2Price / eff * 1000 : 0; // $/MWh-equivalent` |
| `rows` | `tranches.map((t) => {` |
| `totalRev` | `rows.reduce((a, x) => a + x.revenue, 0);` |
| `baseRev` | `model.rows[0].ppaRev + model.rows[0].merchRev;` |
| `h2Kg` | `h2Row && eff > 0 ? h2Row.alloc * 1000 / eff : 0;` |
| `waterM3` | `h2Kg * (parseFloat(inp.water_l_per_kg) \|\| 0) / 1000;` |
| `grossY1` | `y1.solarGen + y1.windGen;` |
| `netShare` | `grossY1 > 0 ? y1.net / grossY1 : 0;` |
| `solarAvoided` | `y1.solarGen * netShare * ef;` |
| `windAvoided` | `y1.windGen * netShare * ef;` |
| `bessAvoided` | `curtRecovery ? curtRecovery.delivered * ef : 0;` |
| `sHa` | `(parseFloat(inp.solar_mw_per_ha) \|\| 0) > 0 ? solarMw / parseFloat(inp.solar_mw_per_ha) : 0;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/ppa-structuring/shape-analysis` | `shape_analysis` | api/v1/routes/ppa_structuring.py |
| POST | `/api/v1/ppa-structuring/settlement` | `cfd_settlement` | api/v1/routes/ppa_structuring.py |
| POST | `/api/v1/ppa-structuring/credit-exposure` | `credit_exposure` | api/v1/routes/ppa_structuring.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`

**Database tables:** `POST` *(shared)*, `__future__` *(shared)*, `below` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `spot` *(shared)*, `typing` *(shared)*, `vre_penetration_pct` *(shared)*
**Frontend seed datasets:** `LOAD_SHAPES`, `SOLAR_COUNTRIES`, `TURBINE_CLASSES`, `WIND_REGIONS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).

| Connected module | Shared via |
|---|---|
| `ppa-structuring-desk` | table:POST, table:below, table:spot, table:vre_penetration_pct |

## 7 · Methodology Deep Dive

### 7.1 What the module computes — a composition module

Hybrid Project Workbench (NX2-08) has **no dedicated backend route of its own**. All 1,089 lines of
implementation live in the frontend page
(`frontend/src/features/hybrid-project-workbench/pages/HybridProjectWorkbenchPage.jsx`), which wires
together four *other* modules' live engines and adds local, closed-form composition logic on top of
their responses:

| Call | Engine | Role in the workbench |
|---|---|---|
| `POST /api/v1/renewable-ppa/solar-yield` | Renewable PPA desk (GHI/PR solar model) | P50/P90 solar generation |
| `POST /api/v1/renewable-ppa/wind-yield` | Renewable PPA desk (Weibull wind model) | P50/P90 wind generation |
| `POST /api/v1/ppa-structuring/shape-analysis` | **PPA Structuring Desk** (NX2-01, 96-point hourly shape engine) | Real hourly curtailment vs the shared connection cap, 24/7 CFE, avoided CO2 |
| `POST /api/v1/bess-stacking/stack` | **Battery Revenue Stacker** (NX2-07) | BESS revenue stack (arbitrage + FR + capacity − opex − augmentation) |
| `POST /api/v1/pf-debt-sizing/size` | **Project-Finance Debt Sizer** (NX2-02) | DSCR-sculpted debt capacity on the combined CFADS |

This deep-dive documents the module's **original composition logic only** — the greedy multi-offtake
allocator and the curtailment-to-BESS charging math, both of which are local, closed-form
derivations that exist nowhere else in the platform. For the underlying yield models, the hourly
shape engine's curtailment/CFE math, and the DSCR-sculpting algorithm, see the
`ppa-structuring-desk` and `project-finance-debt-sizer` deep-dives (`docs/module_atlas/deep/`) —
this page treats those as black boxes and consumes their published response schema.

### 7.2 How the chain fits together

1. Solar and wind yield engines return `capacity_factor_pct`, `p50_generation_mwh`, `p90_generation_mwh`.
2. Those capacity factors feed the **shape-analysis** call (`technology: "hybrid"`, `solar_cf_pct`,
   `wind_cf_pct`, `connection_cap_mw`) which returns hourly generation archetypes per season and,
   from those, `curtailment.curtailment_pct_of_gen`, `curtailment.per_season[].daily_curtailed_mwh`
   and `.curtailed_hours_per_day` — the real, hourly-resolved curtailment (max(0, gen−cap) per
   season-hour), preferred over a simple coincidence-factor screen that is kept only as a labeled
   fallback (`screenCurtailmentPct`, lines 170–174) for when the shape engine is unreachable.
3. The BESS stacking engine is called independently (power/energy/cycle-cap inputs) and its
   `per_year[].net_margin_usd` series is merged into the workbench's own year-by-year revenue model.
4. The workbench's own `model` (lines 255–294) builds the combined generation/revenue/CFADS table by
   applying degradation to solar, holding wind flat, netting out curtailment, splitting net export
   into PPA-contracted vs merchant tranches, and adding the BESS net margin — this table (not
   anything from an external engine) is what feeds the allocator, the sustainability overlay and the
   debt-sizing handoff.
5. `POST /pf-debt-sizing/size` is called with the resulting `cfads_p50` array (optionally the
   carbon-adjusted variant, §7.5) — the debt-sizing math itself belongs to that module, not here.

### 7.3 Curtailment-to-BESS charging math (original logic)

This is one of the two pieces of genuinely original math in the module. Per season, for each
season-day, the recoverable curtailed energy is bound by **three simultaneous constraints** — how
much energy was actually curtailed that day, how much the BESS's power rating can absorb during the
hours curtailment occurs, and how much energy the BESS's daily cycle-cap allows:

```js
chargeable = min(
  daily_curtailed_mwh,                    // curtailment-limited
  bess_power_mw × curtailed_hours_per_day, // power-limited
  bess_energy_mwh × cycles_per_day_cap     // energy/cycle-limited
)
charged   = Σ_season  chargeable × days_in_season
delivered = charged × RTE                 // RTE = 0.88, the NX2-07 engine's own default round-trip efficiency
valueYr   = delivered × merchant_price_usd_mwh
sharePct  = charged / Σ_season(daily_curtailed_mwh × days_in_season) × 100
```
(`curtRecovery`, lines 301–320). The three-way `min()` is the important design choice: it correctly
identifies which constraint binds in each season rather than assuming the BESS can always absorb
100% of curtailment.

**Worked example** (four illustrative seasons, `bess_power_mw=40`, `bess_energy_mwh=160`,
`cycles_per_day_cap=1.5` → energy/cycle limit = `160×1.5=240 MWh/day` in every season):

| Season (days) | daily curtailed (MWh) | curtailed hours/day | power limit (40×h) | energy/cycle limit | chargeable (min) | Binding constraint |
|---|---|---|---|---|---|---|
| Winter (90) | 30 | 2 | 80 | 240 | **30** | curtailment |
| Spring (92) | 180 | 6 | 240 | 240 | **180** | curtailment (ties both limits) |
| Summer (92) | 300 | 10 | 400 | 240 | **240** | energy/cycle cap |
| Autumn (91) | 50 | 1 | 40 | 240 | **40** | BESS power |

`charged = 30×90 + 180×92 + 240×92 + 40×91 = 2,700 + 16,560 + 22,080 + 3,640 = 44,980 MWh/yr`.
`curtTot = 30×90 + 180×92 + 300×92 + 50×91 = 2,700 + 16,560 + 27,600 + 4,550 = 51,410 MWh/yr`.
`delivered = 44,980 × 0.88 = 39,582.4 MWh/yr`. At a $48/MWh merchant price,
`valueYr = 39,582.4 × 48 = $1,899,955.20/yr ≈ $1.90M/yr`. `sharePct = 44,980/51,410 × 100 = 87.49%`
of curtailed energy captured. This table was computed independently in Python against the exact
JS formula in the module and matches to the last cent — the three example seasons deliberately hit
all three binding constraints (curtailment, energy/cycle, power) to exercise every branch of the
`min()`.

This local recovery figure then flows into two further composition calculations that are genuinely
downstream of it, not duplicated math: the **connection-sharing NPV decomposition**
(`connSharing`, lines 328–341: `savedCapex − PV(curtailment loss) + PV(BESS recovery)`, all at a
user discount rate) and the **avoided-emissions sustainability overlay**
(`sustain.bessAvoided = curtRecovery.delivered × grid_ef_tco2_mwh`, lines 391–418).

### 7.4 Multi-offtake greedy allocation (original logic)

The second piece of original math: Year-1 net export is allocated across up to five revenue
tranches — PPA1 (the base contract), PPA2, PPA3, a green-hydrogen electrolyzer offtake, and an
uncapped merchant residual — using a **greedy, descending-margin allocation**:

```js
h2_margin_usd_per_mwh = h2_price_usd_per_kg / electrolyzer_kwh_per_kg × 1000
tranches = [PPA1(margin, cap=netY1×contracted_share), PPA2(margin, cap_gwh×1000),
            PPA3(margin, cap_gwh×1000), GreenH2(h2_margin, cap=ely_mw×8760), Merchant(margin, cap=∞)]
sort tranches descending by margin
remaining = netY1
for each tranche in sorted order:
    alloc = min(remaining, tranche.cap)
    remaining -= alloc
    revenue += alloc × tranche.margin
```
(`allocation`, lines 350–382). The code comment correctly identifies *why* greedy is optimal here,
not just that it is used: each tranche is an **independent volume cap with a constant unit margin**
— the textbook fractional-knapsack setting, where filling the highest-margin bucket first up to its
cap, then the next, etc., provably maximizes total revenue (any other feasible allocation can be
improved by shifting a unit of volume from a lower-margin tranche to a higher-margin one with
remaining capacity). This is a correct and appropriately-scoped algorithmic claim — it would *not*
hold if tranches had take-or-pay penalties, interdependent pricing, or delivery-shape (rather than
pure annual-volume) constraints, none of which this screening-level allocator claims to model (the
page's own caveat: "tranche caps are annual energy caps, not hourly delivery obligations").

**Worked example**: `netY1 = 300,000 MWh`, `contracted_share_pct = 70%`, PPA1 price $55/MWh (cap =
300,000×0.70 = 210,000 MWh); PPA2 price $62/MWh, cap 60 GWh/yr = 60,000 MWh; PPA3 off (cap 0);
electrolyzer 20 MW, specific energy 52 kWh/kg, H2 price $4.50/kg
(`h2_margin = 4.50/52×1000 = $86.538/MWh-equivalent`, cap = `20×8760 = 175,200 MWh`); merchant $48/MWh,
uncapped.

Sorted descending by margin: **Green H2 (86.54) → PPA2 (62.00) → PPA1 (55.00) → Merchant (48.00)**.

| Rank | Tranche | Margin ($/MWh) | Cap (MWh) | Allocated (MWh) | Revenue |
|---|---|---|---|---|---|
| 1 | Green H2 | 86.538 | 175,200 | 175,200 | $15,161,538 |
| 2 | PPA2 | 62.00 | 60,000 | 60,000 | $3,720,000 |
| 3 | PPA1 | 55.00 | 210,000 | 64,800 (residual) | $3,564,000 |
| 4 | Merchant | 48.00 | ∞ | 0 | $0 |

Remaining after Green H2 (175,200) and PPA2 (60,000) is `300,000 − 175,200 − 60,000 = 64,800 MWh`,
fully absorbed by PPA1's 210,000 MWh cap, leaving nothing for merchant. **Total optimized revenue =
$15,161,538 + $3,720,000 + $3,564,000 = $22,445,538.**

Compared to the "base case" (the simple 2-stream PPA1+merchant split the revenue-mix panel above
already computes: contracted 210,000 MWh × $55 = $11,550,000, merchant 90,000 MWh × $48 =
$4,320,000, **base = $15,870,000**), the optimizer's uplift from adding the Green-H2 and PPA2
tranches is **$22,445,538 − $15,870,000 = $6,575,538/yr** — all arithmetic independently reproduced
in Python against the exact JS allocation loop and matching to the cent.

### 7.5 Other local derivations (documented, briefly)

- **Combined generation/CFADS model** (§7.2 step 4): solar degrades at the user rate, wind held flat
  (a stated, labeled convention — real turbine output does degrade slowly, but the module does not
  model it); net export = gross − curtailed; contracted revenue only applies within the PPA tenor,
  with all volume reverting to merchant afterward.
- **Carbon-adjusted CFADS** (`sizeDebt`, lines 420–449): an optional shadow variant,
  `CFADS_t + avoided_tCO2e_t × shadow_carbon_price`, explicitly labeled "an INTERNAL sustainability-
  linked sizing scenario — shadow-carbon value is not lender-grade cash; use the standard CFADS for
  credit committee work" wherever it appears in the UI. This is the only place the workbench mixes a
  non-cash shadow value into a financing input, and it is opt-in and clearly flagged.
- **Land/water intensity**: `area_ha = capacity_mw / mw_per_ha` (user-editable density inputs,
  labeled against NREL land-use benchmarks: solar ≈0.35 MW/ha, wind ≈0.03 MW/ha total project
  boundary); H2 water demand = `kg_H2 × L_per_kg / 1000` (stoichiometric ≈9 L/kg plus purification
  losses, labeled default).

### 7.6 Data provenance & limitations

- **Live, computed data**: solar/wind yields, hourly shape/curtailment/CFE, BESS revenue stack, and
  (when deployed) DSCR-sculpted debt capacity all come from other modules' real engines — this page
  never fabricates those figures, and shows an explicit "engine unreachable" state instead of a
  silent fallback (except for the coincidence-factor curtailment screen, which is a labeled,
  documented fallback formula, not a fabrication).
- **User-editable inputs treated as project assumptions, not measured data**: PPA/merchant prices,
  electrolyzer specs, connection $/kW, discount rate, grid marginal emissions factor, shadow carbon
  price, land/water intensities — all clearly labeled "editable defaults — illustrative Iberian
  hybrid, not a live project" in the page header.
- **Financing handoff is defensive**: the debt-sizing route is explicitly noted as "being built in
  parallel" and probed rather than assumed present; a 404 renders a distinct "route not yet deployed"
  message rather than a fabricated debt figure.
- No guide↔code mismatch found: the module's own inline comments accurately describe every
  composition step, including the two pieces of original math traced above.

## 8 · Model Specification

**Status: implemented** (as a composition layer over four already-implemented engines; see their
own deep-dives for the yield, hourly-shape, storage-stacking and debt-sculpting math this module
consumes rather than reimplements).

**8.1 Purpose & scope.** Give a hybrid (solar+wind+BESS, single shared grid connection) project
developer one workbench that: sizes shared-connection curtailment realistically (hourly, not a rule
of thumb), recovers value from that curtailment via battery storage, allocates net output optimally
across a multi-tranche offtake stack including green hydrogen, scores 24/7 carbon-free-energy and
land/water sustainability metrics, and hands the resulting combined cash flow straight to a
project-finance debt sizer.

**8.2 Conceptual approach.** Rather than re-deriving solar/wind yield physics, hourly dispatch
shapes, storage arbitrage, or DSCR sculpting — each of which is a substantial engine elsewhere in the
platform — this module's design is to **call those engines and compose their outputs**. The two
places genuine new math is required are exactly the two seams between engines that no single
existing module owns: (a) how much of the *shared-connection curtailment* (from the PPA structuring
desk's hourly shape engine) can a *co-located BESS* (whose own engine assumes a stand-alone dispatch
problem) actually absorb, and (b) how does a project with *more than one* offtake structure (which
none of the single-PPA desks model) allocate a single generation stream across all of them. Both are
solved as constrained optimization problems that happen to have simple, provably-correct closed-form
solutions (a three-way `min()` and a greedy/fractional-knapsack sort respectively) — see §7.3–§7.4.

**8.3 Mathematical specification.**
```
Curtailment-to-BESS:
  chargeable_season = min(daily_curtailed_mwh, power_mw × curtailed_hours_per_day, energy_mwh × cycles_cap)
  charged = Σ_season chargeable_season × days_in_season
  delivered = charged × RTE (0.88)
  value = delivered × merchant_price

Greedy multi-offtake allocation (fractional knapsack, tranches = independent volume caps,
constant unit margins ⇒ greedy-by-margin is provably optimal):
  sort tranches by margin descending
  for each tranche: alloc = min(remaining_volume, tranche.cap); remaining -= alloc

Connection-sharing NPV: savedCapex − Σ_t PV(curtailed_t × merchant) + Σ_t PV(BESS_recovery_value_t)
Carbon-adjusted CFADS: CFADS_t + avoided_tCO2e_t × shadow_carbon_price   (internal, non-cash, labeled)
```

**8.4 Data requirements.** Solar (country/capacity/degradation) and wind (turbine class/region/
count/wake-loss/availability) specs → live yield engines; shared connection cap and coincidence
factor (fallback only); BESS power/energy/cycle-cap → live stacking engine; PPA/merchant prices,
tenor and contracted share; up to two additional PPA tranches (price + annual volume cap);
electrolyzer MW, specific energy, H2 price, water intensity; connection $/kW and discount rate;
grid marginal emissions factor and shadow carbon price; land-use density assumptions; and the
capex/DSCR-target/debt-rate/tenor block for the financing handoff. All are request-time inputs on
an illustrative example project, not persisted or measured data.

**8.5 Validation & benchmarking.** §7.3 and §7.4 above are the independent hand-traces performed
for this deep-dive: both the curtailment-to-BESS three-way-`min()` logic and the greedy allocator
were reproduced in Python from the exact JavaScript in `HybridProjectWorkbenchPage.jsx` and matched
to the cent/decimal-MWh. Natural next validation steps: confirm the greedy allocator's optimality
claim continues to hold if/when tranches gain shape (hourly delivery) constraints, since the
fractional-knapsack argument explicitly assumes pure annual-volume caps; and cross-check the BESS
RTE default (0.88, inherited from the NX2-07 stacking engine) stays synchronized if that engine's
own default ever changes (it is hardcoded here as `BESS_RTE`, not fetched live).

**8.6 Limitations & model risk.** The allocator is a **Year-1 screening** exercise — it does not
re-run for later years as degradation shifts the generation/tranche split, and it treats each
tranche's cap as a pure annual energy limit with no shape/firmness requirement (explicitly
noted in the UI: "shape-firmness lives in the PPA desk's `/structure`"). Wind is held flat over the
project life (no degradation modeled) while solar degrades — a stated asymmetric convention, not a
turbine-specific engineering model. The carbon-adjusted CFADS variant mixes a non-cash shadow value
into a debt-sizing input; it is opt-in and labeled everywhere, but a user who enables it and forgets
to disable it before a lender-facing exercise would materially overstate cash available for debt
service. The BESS RTE constant (0.88) is duplicated from the NX2-07 engine's own default rather than
read from its response, creating a (currently accurate, but unverified) synchronization dependency
between two modules.

## 9 · Future Evolution

### 9.1 Evolution A — Multi-year LP allocator with shape constraints (analytics ladder: rung 2 → 5)

**What.** This is a healthy tier-A composition module: it orchestrates five live engines (solar/wind yield, `POST /ppa-structuring/shape-analysis`, `POST /bess-stacking/stack`, `POST /pf-debt-sizing/size`) and its two pieces of original math — the three-way-`min()` curtailment-to-BESS recovery and the greedy fractional-knapsack offtake allocator — are hand-verified to the cent (§7.3–7.4). Its documented limits are the target: the allocator is Year-1 screening only (never re-run as solar degradation shifts the tranche split), tranches carry pure annual-volume caps with no shape/firmness, wind is held flat, and `BESS_RTE = 0.88` is hardcoded rather than read from the NX2-07 engine. Evolution A upgrades the allocator to a multi-year linear program with optional hourly-shape constraints — genuine rung-5 prescriptive optimisation.

**How.** (1) A small backend route (`hybrid-workbench/allocate`) wrapping `scipy.optimize.linprog`: decision variables = tranche allocation per year (and per season-hour block where a tranche declares a shape requirement, reusing the shape engine's 96-point archetypes); greedy remains the fast screening path and the LP must reduce to it when all caps are annual — that equivalence is the regression test. (2) Re-run allocation per year over the existing degradation-adjusted `model` table. (3) Read RTE from the bess-stacking response instead of the duplicated constant, closing the documented synchronisation dependency. (4) Add wind degradation as a labeled input defaulting to 0 for continuity.

**Prerequisites.** None blocking — all upstream engines exist; §8.5 already flags the greedy-optimality boundary this work crosses. **Acceptance:** LP equals greedy on annual-cap-only cases ($22,445,538 in the §7.4 worked example, pinned in bench_quant); a shape-constrained case produces a documented allocation the greedy cannot.

### 9.2 Evolution B — Hybrid-project desk orchestrator (LLM tier 3)

**What.** The workbench already *is* a manual desk orchestration — a user keys inputs and the page fans out to four modules' engines. Evolution B makes that conversational: "screen a 200 MW solar + 120 MW wind Iberian hybrid with a 250 MW connection, 60% contracted at €52 — is a 40 MW BESS worth it, and how much debt does it carry?" The orchestrator sequences the exact live chain the page uses (yield → shape-analysis → bess-stack → workbench composition → pf-debt-sizing) and returns an engine-sourced memo.

**How.** Tier 3 per the roadmap: routing across the five endpoints via the Atlas interconnection map (this page's §6 documents the ppa-structuring-desk coupling); the workbench's composition formulas (§8.3) become a deterministic tool, not LLM arithmetic. Two guardrails inherit directly from the page's own conventions: the carbon-adjusted CFADS variant is surfaced only with its "not lender-grade cash" label, and a 404 from the debt-sizing route produces the same honest "route not yet deployed" statement rather than a synthesized debt figure. Output composes into the report-studio render layer as an IC-ready screening memo.

**Prerequisites.** Tier-2 tool-calling infrastructure on the four upstream modules; the no-fabrication validator over multi-tool conversations. **Acceptance:** a full screening memo's every figure traces to one of the five engine calls; the shadow-carbon caveat appears verbatim whenever that variant is used.