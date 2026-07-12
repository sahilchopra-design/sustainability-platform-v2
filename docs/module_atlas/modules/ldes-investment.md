# Long Duration Energy Storage Investment Analytics
**Module ID:** `ldes-investment` · **Route:** `/ldes-investment` · **Tier:** B (frontend-computed) · **EP code:** EP-DT3 · **Sprint:** DT

## 1 · Overview
Investment analytics for long duration energy storage technologies including pumped hydro, CAES, vanadium and iron-air flow batteries, hydrogen storage and gravity systems across 4-100 hour duration.

> **Business value:** Long-duration energy storage is essential for deep decarbonisation with >80% variable renewable penetration; LCOS for 100-hour storage must reach $0.05/kWh/cycle or below for broad economic deployment, a threshold pumped hydro already meets and iron-air targets by 2030.

**How an analyst works this module:**
- Compare LCOS across technologies at 4hr, 12hr, 24hr, 48hr and 100hr discharge durations
- Apply round-trip efficiency (RTE) penalty to calculate effective delivered energy cost
- Assess market value of long-duration storage: capacity adequacy, seasonal arbitrage, transmission deferral
- Screen investment opportunities by technology readiness level (TRL 6-9) and cost trajectory

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `KpiCard`, `MARKET_SEGMENTS`, `Slider`, `TABS`, `TECHNOLOGIES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `TECHNOLOGIES` | 9 | `cap_kwh`, `capex_kwh`, `opex_pct`, `rte`, `cycles_yr`, `lifetime`, `duration_hr`, `trl`, `mass_prod`, `co2_kg_kwh`, `applications`, `wacc`, `notes` |
| `MARKET_SEGMENTS` | 6 | `gw_2025`, `gw_2030`, `gw_2035`, `price_mwh`, `min_dur_hr` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `capexAnn` | `capexPerKwh * w / (1 - Math.pow(1 + w, -lifetime));` |
| `opexAnn` | `capexPerKwh * opexPct / 100;` |
| `throughput` | `cycles * (rte / 100);` |
| `lcos` | `useMemo(() => calcLcos({ capexPerKwh: capexKwh, opexPct, rte, cycles: cyclesYr, lifetime, wacc }), [capexKwh, opexPct, rte, cyclesYr, lifetime, wacc]);  const techLcos = useMemo(() => TECHNOLOGIES.map(t => ({ name: t.name.split(" ")[0] + " " + (t.name.split(" ")[1] \|\| ""), lcos: calcLcos({ capexPerKwh: t.capex_kwh, opexPct: t.opex_pct, rt` |
| `irrCalc` | `useMemo(() => { // Reference project: 100,000 kWh (=100 MWh) of capacity. // capexKwh is $/kWh, so capexTotal = $/kWh * kWh = $ — correctly scaled. const capexTotal = capexKwh * 100000;` |
| `annRevenue` | `cyclesYr * (rte / 100) * rePrice * (100000 / 1000);` |
| `annOpex` | `capexTotal * opexPct / 100;` |
| `net` | `annRevenue - annOpex;` |
| `marketData` | `useMemo(() => MARKET_SEGMENTS.map(s => ({` |
| `projectData` | `useMemo(() => [ { name: "Carrington LAES (UK)", tech: "Liquid Air", mw: 250, mwh: 2000, capex_m: 280, stage: "Construction", offtake: "Capacity Market + grid services" }, { name: "Rongke Power VRFB (China)", tech: "Vanadium Flow", mw: 200, mwh: 800, capex_m: 260, stage: "Operational", offtake: "Grid utility" }, { name: "Form Energy Pilot ` |
| `annRev` | `cyclesYr * (rte / 100) * price * (100000 / 1000);` |
| `annOp` | `capexT * (opexPct / 100);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `MARKET_SEGMENTS`, `TABS`, `TECHNOLOGIES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Pumped Hydro LCOS | `CAPEX ($800-2000/kWh)×CRF + O&M` | IRENA 2023 | Lowest LCOS for large-scale, long-life (50yr) projects; constrained by geography; 1,600 GW global installed capacity. |
| Vanadium Flow Battery LCOS | `(CAPEX+stack_replacement)×CRF / cycles` | BNEF 2023 | Electrolyte retains value (resale/reuse); stack replacement at year 10; scalable capacity independent of power rating. |
| Iron-Air Battery LCOS | `Similar to VFB; Fe electrolyte at <$5/kg` | Form Energy / LDES Council 2023 | 100-hour duration with Earth-abundant materials; Form Energy targeting $20/kWh system cost at scale; pilot deployments 2024-2025. |
- **Technology cost database** → → LCOS model → **CAPEX and OPEX by technology and year**
- **Grid value model** → → investment screen → **$/kW-year value by duration and market**

## 5 · Intermediate Transformation Logic
**Methodology:** Levelised Cost of Storage
**Headline formula:** `LCOS = (CAPEX×CRF + OPEX) / (Annual_cycles × Discharged_energy_per_cycle)`

LCOS ($/kWh/cycle) enables cross-technology comparison; pumped hydro lowest LCOS for 100hr storage; flow batteries competitive at 8-24hr with declining vanadium electrolyte costs.

**Standards:** ['LDES Council Net-Zero Power', 'BNEF Long-Duration Energy Storage Market Outlook', 'NREL Grid-Scale BESS Cost']
**Reference documents:** LDES Council Net-Zero Power: The Clean Energy System 2021; BNEF Long-Duration Energy Storage Market Outlook 2023; NREL Grid-Scale Battery Storage Cost and Performance 2022

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `EnergyAdvancedAnalytics`

## 7 · Methodology Deep Dive

### 7.1 What the module computes

A 10-tab LDES (long-duration energy storage) investment analytics tool built on two real, correctly
implemented core formulas — **Levelised Cost of Storage (LCOS)** and **project IRR via
Newton-Raphson** — applied across 8 technologies (Iron-Air, Vanadium Flow, Zinc-Bromine Flow,
Zinc-Air, Liquid Air, Pumped Thermal, Green H₂, Gravity/Rail). This matches the guide's stated
formula `LCOS = (CAPEX×CRF + OPEX) / (Annual_cycles × Discharged_energy_per_cycle)` closely — no
guide↔code mismatch on the core LCOS methodology. A genuine **unit-scale bug in the IRR revenue
calculation** (§7.7) does exist and inflates the "Project IRR" KPI by roughly 1000×.

```js
capexAnn  = capexPerKwh × w / (1 − (1+w)^−lifetime)     // capital recovery factor (CRF) annuity
opexAnn   = capexPerKwh × opexPct / 100
throughput = cycles × (rte / 100)                        // annual discharged energy per $/kWh basis
LCOS      = (capexAnn + opexAnn) / throughput             // $/kWh discharged
```

### 7.2 Parameterisation

| Technology | Capex ($/kWh) | RTE | Cycles/yr | Lifetime | Duration | TRL | Provenance |
|---|---|---|---|---|---|---|---|
| Iron-Air (Form Energy) | 20 | 68% | 150 | 20yr | 100h | 7 | Cited to Form Energy public targets ("$20/kWh target") |
| Vanadium Flow (VRFB) | 300 | 78% | 300 | 25yr | 8h | 9 | Commercial-stage figures |
| Zinc-Bromine Flow (Redflow) | 380 | 72% | 250 | 20yr | 10h | 8 | Semi-commercial |
| Zinc-Air (EOS Energy) | 75 | 75% | 200 | 20yr | 4h | 8 | "$75/kWh current" cited inline |
| Liquid Air (Highview) | 180 | 62% | 250 | 25yr | 12h | 8 | "250MW Carrington UK" cited inline |
| Pumped Thermal (Carnot) | 120 | 65% | 200 | 30yr | 12h | 7 | "Malta Antora leading" cited inline |
| Green H₂ (electrolysis+CCGT) | 25 | 35% | 80 | 20yr | 720h | 8 | Multi-week/seasonal use case |
| Gravity/Rail (Energy Vault) | 100 | 82% | 300 | 30yr | 8h | 8 | "Energy Vault, RheEnergise" cited |

All 8 rows are static, hand-entered technology assumptions (not `sr()`-random) — plausible and
broadly consistent with public DOE/NREL/BNEF LDES cost benchmarks, though no per-row citation to a
specific report page is embedded.

### 7.3 Calculation walkthrough

- **LCOS Engine tab**: 6 sliders (capex, opex%, RTE, cycles/yr, lifetime, WACC) feed `calcLcos()`
  live; a sensitivity line chart re-runs the same formula across capex $10–500/kWh at 3 fixed RTE
  levels (60/70/80%), with a "Li-ion parity" reference line at $50/MWh.
- **Investment Returns tab**: same 6 sliders (plus revenue price $/MWh) feed the IRR calculation
  (§7.4) via Newton-Raphson on a `[-capexTotal, net, net, ..., net]` cashflow vector over `lifetime`
  years, solved to `1e-8` tolerance or 200 iterations.
- **Technology Comparison / Radar tabs**: per-technology scorecards plus a 6-axis radar
  (`Cost, RTE, Duration, Lifetime, TRL, Safety`), each axis independently normalised:
  `Cost = min(100, (400/capex_kwh)×80)`, `Duration = min(100, (duration_hr/24)×80+20)`,
  `Lifetime = min(100, (lifetime/30)×100)`, `Safety` is a 3-tier heuristic keyed on CO₂ footprint and
  an "Iron" name-match special case (95 for Iron-Air, 85 if `co2_kg_kwh<30`, else 70).
- **Market Sizing tab**: static `MARKET_SEGMENTS` (5 rows: Utility Grid Firming, Capacity Market,
  Seasonal Balancing, Islands/Off-Grid, Industrial Process Heat) with 2025/2030/2035 GW projections —
  no interpolation or growth-rate model, just 3 fixed snapshot years per segment.
- **Seasonal Storage tab**: a 12-month price-spread area chart using `sr()`-seeded noise layered on a
  hand-coded winter-peak/summer-trough pattern, plus 3 static seasonal-arbitrage economics rows
  (Iron-Air, Green H₂, Liquid Air) with pre-computed buy/sell/RTE-loss/net-margin figures.

### 7.4 Worked example — LCOS at default slider settings

Inputs: `capexKwh=150, opexPct=2.0, rte=70, cyclesYr=200, lifetime=20, wacc=8`.
```
w = 0.08
1.08^20 ≈ 4.6610  →  (1.08)^-20 ≈ 0.2145
capexAnn = 150 × 0.08 / (1 − 0.2145) = 12 / 0.7855 ≈ 15.28
opexAnn  = 150 × 2/100 = 3.00
throughput = 200 × 0.70 = 140
LCOS = (15.28 + 3.00) / 140 = 18.28 / 140 ≈ 0.1306 $/kWh  →  $130.6/MWh
```
This matches the KPI card formula exactly (`lcos × 1000` for the $/MWh display).

### 7.5 Companion analytics

- **Technology Radar (all techs) tab** — two scatter plots (Capex vs RTE trade-off; Duration vs LCOS)
  across all 8 technologies, letting a user visually identify the cost/duration/efficiency frontier.
- **Financing Structures tab** — a static 5-layer capital stack (Senior Debt 55% / Green Bond 15% /
  Mezzanine 10% / Preferred Equity 10% / Common Equity 10%) with indicative rates and tenors, and a
  5-row public-support-mechanism reference table (IRA §48 ITC, DOE LDES loan guarantees, EU
  Innovation Fund, UK CfD, ARENA) — reference data, not computed.
- **India context module** (via shared `EnergyAdvancedAnalytics`) — adds a Monte Carlo LCOS model for
  Iron-Air (`capexKwh∈[20,60], cycles∈[200,400], rte∈[0.48,0.58], lifeYrs∈[18,30]`), a tornado
  sensitivity chart, an NGFS-scenario carbon-price impact function
  (`max(40, 95 − 0.25×max(0, carbonPrice−40))`), and a peer LCOS comparison table plus an
  India-specific pumped-storage/iron-air project pipeline table.

### 7.6 Worked example — MC LCOS model (India context)

At the tornado model's fixed inputs (`capexKwh=35, cycles=300, rte=0.52, lifeYrs=22`), using a
hard-coded 8% discount rate distinct from the main page's WACC slider:
```
capexAnn = 35 × 0.08 / (1 − 1.08^-22) ≈ 35×0.08/0.8261 ≈ 3.390
cost = capexAnn / (cycles × rte) = 3.390 / (300×0.52) = 3.390/156 ≈ 0.02173 $/kWh → $21.7/MWh
```

### 7.7 Data provenance & limitations

- **IRR revenue unit-scale bug (verified in code)**: `capexTotal = capexKwh × 100000` correctly
  treats the analysis as a 100,000 kWh (100 MWh) reference system (`$/kWh × kWh = $`). But
  `annRevenue = cyclesYr × (rte/100) × rePrice × 100000` reuses the same `100000` multiplier even
  though `rePrice` is denominated **$/MWh**, not $/kWh. The correct revenue formula for a 100 MWh
  system is `cyclesYr × RTE × rePrice × 100` (MWh, not kWh) — the code is **1000× too large**. At the
  default sliders (`capexKwh=150, cyclesYr=200, rte=70%, rePrice=$35/MWh`), the buggy formula yields
  `annRevenue ≈ $4.90Bn` against a `capexTotal` of only $15M — a revenue-to-capex ratio of ~326:1 in
  year one alone, which drives the Newton-Raphson solver toward an economically meaningless IRR
  (tens of thousands of percent) rather than the realistic single-digit-to-teens IRR the sensitivity
  chart's legend and the "8% hurdle" reference line imply. This bug affects both the "Project IRR" KPI
  card and the entire "IRR Sensitivity" line chart on the Investment Returns tab.
- The Monte Carlo/tornado models in the India context panel use a separate, correctly-scaled
  `compute()` function (`cost = capexAnn/(cycles×rte)`, no MWh/kWh conversion needed since it outputs
  $/kWh directly) and are **not** affected by the IRR bug.
- Seasonal price-spread chart (tab 7) blends a hand-authored winter/summer pattern with `sr()` noise
  — illustrative, not a real day-ahead/futures price series.
- Technology cost/performance table (§7.2) is static and undated; production use should refresh
  against BNEF/NREL/LDES Council annual cost curves.

**Framework alignment:** LDES Council *Net-Zero Power* and NREL Grid-Scale BESS cost methodology
underpin the LCOS formula design (CRF-based capex annuitisation), which is correctly implemented.
IRA §48C ITC, EU Innovation Fund, UK CfD, and ARENA are correctly named real public-support
mechanisms. The Monte Carlo/tornado/NGFS-scenario overlay follows the platform's shared
`EnergyAdvancedAnalytics` pattern used across other energy modules.

---

## 8 · Model Specification — IRR revenue calculation fix

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Correct the unit-scale defect in `irrCalc` (§7.7) so the "Project IRR" KPI and IRR-sensitivity chart
return economically meaningful values usable for real investment screening.

### 8.2 Conceptual approach
Standard project-finance IRR: build an explicit annual cashflow vector in consistent units (all $ per
project, all energy in MWh) and solve for the discount rate that zeroes NPV — the same
Newton-Raphson solver already implemented can be reused unchanged; only the revenue-line unit
conversion needs correction.

### 8.3 Mathematical specification
```
SystemCapacity_MWh = capexKwh_basis_kWh / 1000            // 100,000 kWh → 100 MWh
CapexTotal_$       = capexKwh × SystemCapacity_kWh          // unchanged, already correct
AnnualDischarge_MWh = cyclesYr × (rte/100) × SystemCapacity_MWh
AnnualRevenue_$     = AnnualDischarge_MWh × rePrice_perMWh   // = cyclesYr × RTE × rePrice × 100 (not ×100000)
AnnualOpex_$        = CapexTotal_$ × (opexPct/100)
NetCF_$             = AnnualRevenue_$ − AnnualOpex_$
IRR = solve( -CapexTotal_$ + Σ_{t=1}^{lifetime} NetCF_$/(1+r)^t = 0 )
```
| Parameter | Calibration source |
|---|---|
| Reference system size (100 MWh) | Author-chosen normalisation constant, should be documented in-code as a named constant rather than a bare literal `100000` |
| Revenue price ($/MWh) | User input / market data (wholesale + capacity + ancillary stacked value) |

### 8.4 Data requirements
No new external data required — this is a pure unit-consistency fix using inputs already collected
by the page's sliders.

### 8.5 Validation & benchmarking plan
- Regression test: at default sliders, corrected IRR should fall in a plausible 5–20% range for a
  merchant LDES project at $35/MWh revenue — flag any output outside a sane band (e.g. IRR>50% or
  IRR<-20%) as a config or model error.
- Cross-check against the India-context MC/tornado LCOS model, which is unaffected and already
  correctly scaled — the two models' implied revenue requirements should be reconcilable.

### 8.6 Limitations & model risk
- IRR remains a simplified constant-net-cashflow annuity model (no revenue escalation, no
  degradation curve, no tax/depreciation shield) — acceptable for screening-level comparison but not
  for financial close.
- The `100000`/`100` scale constant should be replaced with a named, documented variable to prevent
  the class of bug found here recurring when the reference system size changes.

## 9 · Future Evolution

### 9.1 Evolution A — Fix the 1000× IRR bug, then calibrate LCOS against published benchmarks (analytics ladder: rung 2 → 3)

**What.** The core is genuinely sound — a correctly implemented CRF-based LCOS (`(capexAnn + opexAnn)/(cycles × RTE)`) matching the guide's formula, Newton-Raphson IRR to 1e-8 tolerance, and 8 hand-entered technology rows broadly consistent with DOE/NREL/BNEF benchmarks — but §7.1/§7.7 document a genuine unit-scale bug: the IRR revenue term (`annRevenue = cyclesYr × (rte/100) × rePrice × (100000/1000)`) inflates the Project IRR KPI by roughly 1000×. Evolution A: (1) fix the revenue scaling (log it in the calc-defect backlog; the reference project is 100 MWh, so revenue should be `cycles × RTE × price × 100 MWh`); (2) pin corrected LCOS and IRR reference cases in bench_quant; (3) calibrate: each technology's computed LCOS reconciled against the published ranges the §4.1 anchors cite (pumped hydro lowest at 100h, iron-air's $20/kWh Form Energy target), with per-row report-and-page citations replacing the current uncited-but-plausible values; (4) add stack-replacement capex events for flow batteries (the §4.1 VFB anchor names year-10 stack replacement — currently absent from the cash-flow vector).

**How.** (1) The fix is one line plus a regression test; the LCOS engine is untouched. (2) The sensitivity chart's "Li-ion parity" line ($50/MWh) derives from a cited Li-ion LCOS computation rather than a constant. (3) The radar's `Safety` axis heuristic (name-match "Iron" → 95) is replaced by a documented safety-classification rubric or dropped — a name-match special case is not a methodology. (4) Duration-dependent revenue: seasonal-arbitrage value differs from daily cycling, so the `MARKET_SEGMENTS` price × min-duration pairing enters the IRR revenue model.

**Prerequisites.** None blocking — data and formulas exist; this is correction and calibration. **Acceptance:** IRR lands in plausible single/double digits for the reference project; computed LCOS per technology falls within its cited benchmark range or the deviation is documented; flow-battery cash flows show the stack-replacement event.

### 9.2 Evolution B — LDES technology-screening copilot (LLM tier 1 → 2)

**What.** The module answers one investor question in many forms: "which storage technology wins for my duration/market?" Evolution B makes it conversational: "12-hour discharge, 250 cycles/yr, UK capacity market — rank the technologies on LCOS and flag TRL risk", "at what capex does iron-air beat pumped hydro at 100 hours?", "what does the H₂ path's 35% RTE do to its effective delivered cost?" Grounding: the technology table (with Evolution A's citations), the real `projectData` reference projects (Carrington LAES, Rongke VRFB, Form Energy pilots), and the corrected engines.

**How.** Tier 1 first: page state (slider values, computed LCOS) as context, explaining the CRF arithmetic and duration/cycle trade-offs with the §7.2 table cited. Tier 2 requires promoting `calcLcos` and the IRR solver to a backend route (`POST /ldes/screen`) — currently frontend-only — after which crossover questions run as capex bisection tool loops and multi-technology rankings re-execute the engine per row. Discipline: TRL caveats accompany every pre-commercial technology recommendation (iron-air TRL 7 ≠ VRFB TRL 9 — deployment risk is the point, not just LCOS); RTE always quoted alongside cost for low-efficiency paths; the pre-fix IRR is never quoted (tier 2 gates on the Evolution A bug fix).

**Prerequisites.** Evolution A's bug fix (hard gate for any IRR discussion); route extraction for tier 2. **Acceptance:** rankings reproduce from logged engine calls; crossover answers show bisection points; every recommendation carries TRL and RTE context.