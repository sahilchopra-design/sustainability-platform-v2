# Water & Wastewater Utility Finance
**Module ID:** `water-wastewater-utility-finance` · **Route:** `/water-wastewater-utility-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-EL2 · **Sprint:** EL

## 1 · Overview
Ofwat PR24/AMP8 framework for 12 global water utilities, totex efficiency benchmarking (allowed vs actual), asset serviceability grades (A–E) across 5 asset classes, Outcome Delivery Incentives (ODIs) performance vs target, RAB evolution by AMP period with WACC trends, 20-year water quality & leakage trend, and RAB-based regulatory valuation with dividend yield analysis.

> **Business value:** Used by water utility equity analysts modelling PR24 allowed returns, infrastructure debt investors assessing covenant headroom, and ESG analysts tracking ODI performance and leakage reduction targets.

**How an analyst works this module:**
- Select a utility to view its RAB, WACC, C-MeX, serviceability grade, and gearing vs peer benchmarks
- Review Totex & Efficiency tab for allowed vs actual totex chart and peer efficiency score ranking
- On Asset Serviceability tab, review Grade A–E distribution across mains, sewers, treatment works, and pumping stations
- Use Leakage Reduction Simulator to model NPV savings from meeting AMP8 leakage targets

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSET_HEALTH`, `GradeBar`, `KpiCard`, `OUTCOMES`, `Pill`, `RAB_TREND`, `TOTEX_TREND`, `UTILITIES`, `WATER_QUALITY_TREND`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `UTILITIES` | 13 | `name`, `country`, `rab`, `customers`, `leakage`, `leakage_target`, `opex`, `capex`, `totex_eff`, `cmex`, `serviceability`, `wacc_real`, `earn_wacc`, `dscr`, `gearing`, `moody`, `dividend`, `ph_compliance`, `pollution_incidents` |
| `OUTCOMES` | 8 | `weight`, `pa_rate`, `incentive_cap`, `performance`, `pct` |
| `ASSET_HEALTH` | 6 | `total_km`, `grade_a`, `grade_b`, `grade_c`, `grade_d`, `grade_e`, `replacement_rate`, `backlog_km` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `countries` | `['All', ...new Set(UTILITIES.map(u => u.country))];` |
| `filteredUtils` | `useMemo(() => filterCountry === 'All' ? UTILITIES : UTILITIES.filter(u => u.country === filterCountry), [filterCountry]);  const totalRAB = useMemo(() => UTILITIES.reduce((s,u) => s+u.rab, 0), []);` |
| `avgDSCR` | `useMemo(() => (UTILITIES.reduce((s,u) => s+u.dscr, 0)/UTILITIES.length).toFixed(2), []);` |
| `avgLeakage` | `useMemo(() => Math.round(UTILITIES.reduce((s,u) => s+u.leakage, 0)/UTILITIES.length), []);` |
| `avgCmex` | `useMemo(() => Math.round(UTILITIES.reduce((s,u) => s+u.cmex, 0)/UTILITIES.length), []);` |
| `adjWACC` | `(util.wacc_real + waccAdj / 100).toFixed(2);` |
| `allowedReturn` | `(util.rab * +adjWACC / 100 / 1000).toFixed(2);` |
| `leakageSaving` | `Math.round(util.leakage * leakageTarget / 100 * 0.42);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSET_HEALTH`, `OUTCOMES`, `UTILITIES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| UK water industry RAB (2024) | `Aggregate RAB across 9 WASCs + 12 WOCs` | Ofwat PR24 Final Determinations 2024 | AMP8 allowed totex £96Bn 2025-30; inflation indexation means RAB grows ~12% in nominal terms per 5yr period on top of net new investment. |
| Average water gearing (UK) | `Aggregate regulated water company gearing` | Ofwat Water Company Performance 2023 | Ofwat considers 55-65% gearing "efficient"; Thames Water at 82% outside comfort zone; CMA precedent: Anglian 2021 appeal set WACC at 2.96% real. |
| Leakage target (UK average) | `AMP8 target per water company average` | Ofwat PR24 draft determinations 2024 | Industry-wide leakage must halve by 2050 (Net Zero Water); PR24 leakage ODIs worth £280M/yr incentive income to outperformers. |
- **Ofwat PR24 + Environment Agency WFD + Water Industry Act + DWI annual report + S&P water utility rating criteria + Bloomberg water utility bond indices** → 12-utility RAB comparison + totex efficiency + serviceability grades + ODI tracker + WACC trend + leakage simulator + valuation model → **Water utility equity analysts, infrastructure debt investors, ESG-focused fixed income teams, and regulatory economists advising on PR29 strategy**

## 5 · Intermediate Transformation Logic
**Methodology:** Water Utility RAB Valuation & WACC
**Headline formula:** `WACC_real = Equity_Ratio × ROE + (1 − Equity_Ratio) × Cost_of_Debt × (1 − Tax); Allowed_Return = RAB × WACC_real; Totex_Efficiency = Actual_Totex / Allowed_Totex; Leakage_Saving_NPV = Reduction_Mld × 365 × £0.42/m³ × PV_Factor; ODI_Incentive = (Performance_Actual − PC_Target) × P_A_Rate`

Thames Water at 82% gearing (vs Ofwat guidance 60-65%) with £17.2Bn RAB — illustrates how financial stress at high leverage can threaten the regulatory compact and trigger special administration.

**Standards:** ['Ofwat PR24 Final Determinations 2024', 'Water Industry Act 1991 (amended 2014)', 'Environment Agency Water Quality Report 2023']
**Reference documents:** Ofwat (2024) – PR24 Final Determinations; Environment Agency (2023) – State of the Water Environment; Water UK (2023) – Water Industry Annual Report

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This is one of the better-grounded modules in this batch: 12 **real, named water utilities** (Thames
Water, Severn Trent, United Utilities, Anglian, Veolia UK/France, Suez, Acciona Agua, FCC Aqualia,
Aguas Andinas, Manila Water) with plausible, internally-consistent regulatory financial metrics (RAB,
WACC, DSCR, gearing, Moody's rating, C-MeX). Two of the guide's three formulas are genuinely
implemented; the third (`ODI_Incentive`) and the `Totex_Efficiency` ratio are static author-assigned
fields rather than computed from the underlying totex trend data also present in the file.

### 7.1 What the module computes

```js
adjWACC       = (util.wacc_real + waccAdj/100).toFixed(2)                    // real WACC + user slider adjustment
allowedReturn = (util.rab × adjWACC/100 / 1000).toFixed(2)                    // £Bn allowed return
leakageSaving = round(util.leakage × leakageTarget/100 × 0.42)                // NPV-style saving, £0.42/m³ shadow price
```

`totex_eff` (0.94–1.07, "efficiency ratio" — values >1.0 mean spending *above* allowance) and
`serviceability` (A/B grade), `dscr`, `gearing`, `moody`, `dividend`, `ph_compliance` (drinking-water
compliance %), `pollution_incidents` are all **static, author-curated per-utility fields**, calibrated
to real published figures for each named company (e.g. Thames Water `gearing:82%` correctly reflects
its well-documented above-guidance leverage; `dscr:1.38` is plausibly the lowest of the 12).

### 7.2 Parameterisation

| Utility | RAB (£M) | WACC real | Gearing | Moody's | Serviceability |
|---|---|---|---|---|---|
| Thames Water | 17,200 | 2.92% | 82% | Baa2 | B |
| Severn Trent | 9,800 | 2.92% | 68% | Baa1 | A |
| Veolia France | 12,400 | 3.50% | 62% | Baa1 | A |
| Aguas Andinas (Chile) | 3,100 | 5.20% | 55% | A3 | A |
| Manila Water | 2,400 | 6.80% | 64% | Baa3 | B |

WACC rises with country risk (UK 2.92% → France 3.50% → Spain 4.10% → Chile 5.20% → Philippines
6.80%), a realistic sovereign-risk-adjusted ordering. `£0.42/m³` (the leakage-saving shadow price) is
cited in-line as a specific per-cubic-metre value, consistent with typical UK water-tariff levels but
not tied to a named Ofwat publication in the code itself.

### 7.3 Calculation walkthrough

1. Selecting a utility recomputes `adjWACC`/`allowedReturn`/`leakageSaving` live as the user moves the
   `waccAdj` and `leakageTarget` sliders — a genuine interactive what-if tool.
2. **Totex & Efficiency tab** — `TOTEX_TREND` (2017–2024) tracks `totex_actual` vs `totex_allowed`
   with independent `sr()` noise; a true `Totex_Efficiency = totex_actual/totex_allowed` ratio *could*
   be derived from this series but the displayed per-utility `totex_eff` field is a separate static
   value, not computed from `TOTEX_TREND`.
3. **Asset Serviceability tab** — `ASSET_HEALTH` (5 asset classes: Water Mains, Sewer Network,
   Treatment Works, Pumping Stations, Service Reservoirs) shows Grade A–E distribution and
   `replacement_rate`/`backlog_km` — all static, portfolio-wide (not per-utility) figures.
4. **ODI tracker (`OUTCOMES`, 7 categories)** — `weight`, `pa_rate` (£/unit incentive rate,
   signed — negative for penalty-only categories like Pollution Incidents), `incentive_cap`,
   `performance` label, `pct` (performance level) are all static; the guide's
   `ODI_Incentive = (Performance_Actual − PC_Target) × P_A_Rate` is never computed — there's no
   `PC_Target` field at all, so the £ incentive value shown (if any) is not derived from `pct`.
5. **RAB Trend (`RAB_TREND`, AMP3–AMP8)** — `allowed_return = round(rab × wacc/100)` **is** correctly
   derived in-line via `.map()`, mirroring the interactive calculator's own formula.

### 7.4 Worked example

Thames Water: `wacc_real = 2.92%`, `rab = £17,200M`. At `waccAdj = 0` (no user adjustment):

```
adjWACC = 2.92 + 0 = 2.92%
allowedReturn = 17,200 × 2.92/100 / 1000 = £0.502Bn
```

Leakage: `leakage = 287 Ml/d`, `leakage_target = 231 Ml/d`. At `leakageTarget` slider = 100% (full
AMP8 target achievement): `leakageSaving = round(287 × 100/100 × 0.42) = round(120.5) = £121M` — using
the *current* leakage figure, not the reduction gap (`287−231=56`); a production version should
almost certainly use `leakage − leakage_target` (the actual volume saved), not raw current leakage, to
avoid overstating savings by treating the entire current leakage volume as recoverable.

### 7.5 Data provenance & limitations

- **The 12 utilities' core financials are genuinely well-curated**, consistent with published Ofwat
  PR24/AMP8 and equivalent international regulatory data for each named company — a real strength of
  this module relative to most others in this batch.
- **`leakageSaving`'s formula uses current leakage rather than the leakage-reduction gap** — a likely
  overstatement bug worth fixing (see §7.4).
- **`ODI_Incentive` is not computed** — the guide's stated formula has no corresponding calculation;
  `OUTCOMES.pct` (performance level) never multiplies through to a £ incentive figure.
- **`totex_eff` is static, not derived from `TOTEX_TREND`** — two data series describing the same
  concept (totex efficiency) that could diverge without warning since they're not linked.

**Framework alignment:** Ofwat PR24 Final Determinations 2024 — the RAB/WACC/allowed-return
methodology is genuinely and correctly implemented per the standard UK regulated-utility framework;
AMP period structure (AMP3–AMP8) correctly modelled in `RAB_TREND`. C-MeX and ODI framework concepts
are named and partially represented (static values) but the ODI £-incentive calculation itself is
not implemented.

## 9 · Future Evolution

### 9.1 Evolution A — Compute ODI incentives and fix the leakage-gap overstatement (analytics ladder: rung 2 → 3)

**What.** The module is genuinely well-curated (12 real utilities with published-
figure-consistent RAB/WACC/gearing — Thames Water's 82% gearing and Baa2 are right),
and the RAB × WACC allowed-return calculator is correctly implemented with live
sliders. §7.4/§7.5 document three specific defects to close: `leakageSaving`
multiplies *current* leakage (287 Ml/d) by the shadow price instead of the reduction
gap (287−231=56 Ml/d), overstating savings ~5×; the guide's
`ODI_Incentive = (Performance_Actual − PC_Target) × P_A_Rate` is never computed —
`OUTCOMES` has no `PC_Target` field at all; and `totex_eff` is a static field that can
silently diverge from the `TOTEX_TREND` series describing the same concept. Evolution
A fixes the leakage formula (× gap, × 365 for annualisation per the §5 formula), adds
`pc_target` to `OUTCOMES` so the ODI £-incentive is computed from `pct` and `pa_rate`
with the signed penalty-only handling preserved, and derives `totex_eff` from the
trend series. Rung-3 step: pin the Thames worked example (allowed return £0.502Bn) in
`bench_quant` and re-source utility figures annually against Ofwat PR24 publications
with `as_of` vintages.

**How.** Frontend formula fixes plus a small `GET /api/v1/water-utility/benchmarks`
route (module is Tier B, EP-EL2) serving the curated utility table with provenance,
so the sibling modules and copilot can share it.

**Prerequisites.** The leakage overstatement acknowledged as a bug; PC targets
sourced from PR24 final determinations. **Acceptance:** Thames leakage saving computes
from the 56 Ml/d gap; each ODI row shows a £ incentive derived from its own fields;
`totex_eff` equals the trend-series ratio for the latest year.

### 9.2 Evolution B — Regulated-utility analyst copilot for PR24/PR29 work (LLM tier 2)

**What.** The stated users — water utility equity analysts and infrastructure debt
investors — ask exactly the questions this module's data answers: "what happens to
Thames's allowed return if the CMA resets WACC to 2.96% like Anglian 2021?", "which
utilities have DSCR headroom below 1.5× at current gearing?", "rank the 12 by ODI
incentive income at PR24 targets". Evolution B is a tool-calling analyst over
Evolution A's `GET /benchmarks` plus a `POST /what-if` endpoint exposing the
adjWACC/allowedReturn/leakageSaving calculators server-side — running counterfactuals
as tool calls and drafting the regulatory-scenario note with each £ figure traced,
including the special-administration framing the §5 guide already carries for
high-gearing cases.

**How.** Tier-2 stack: tool schemas from the new OpenAPI operations; grounding corpus
is this Atlas page (§7.2's utility table plus the Ofwat framework vocabulary — AMP
periods, C-MeX, ODI, totex). The prompt carries the provenance nuance: figures are
curated from published Ofwat/rating data at a stated vintage, not a live feed.

**Prerequisites (hard).** Evolution A — the copilot must not narrate the current
leakage overstatement or assert ODI incomes that were never computed; pgvector corpus.
**Acceptance:** every £ and % in a note traces to a tool call; a WACC counterfactual
cites both the base and adjusted runs; asked for this week's Thames bond spread, the
analyst states the data vintage and refuses to improvise market data.