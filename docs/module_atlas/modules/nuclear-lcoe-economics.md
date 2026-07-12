# Nuclear LCOE Economics
**Module ID:** `nuclear-lcoe-economics` · **Route:** `/nuclear-lcoe-economics` · **Tier:** B (frontend-computed) · **EP code:** EP-DU1 · **Sprint:** DU

## 1 · Overview
Levelised cost analysis for large nuclear and SMR technologies covering overnight cost trends, historical overruns, capacity factors, decommissioning provisions and fuel cost components.

> **Business value:** Nuclear LCOE ranges from $90–$160/MWh for large LWRs; SMRs target $60–$100/MWh at NOAK scale driven by 10–15% factory-learning rates and 90–95% capacity factors.

**How an analyst works this module:**
- Establish overnight capital cost estimate using Vogtle/Hinkley reference class data
- Apply fixed charge rate to annualise capital cost
- Add O&M, fuel cycle and decommissioning provision components
- Compute LCOE and benchmark against SMR and large-nuclear ranges

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMPARABLES`, `KpiCard`, `REACTOR_TYPES`, `Slider`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `REACTOR_TYPES` | 7 | `capex_kw`, `cf`, `lifetime`, `opexFixed`, `opexVar`, `fuelCost`, `constructYr`, `wacc`, `decommPct`, `country`, `examples` |
| `COMPARABLES` | 9 | `lcoe_lo`, `lcoe_hi`, `cf`, `lifetime`, `co2`, `color` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `capexAnn` | `capexPerKw * w / (1 - Math.pow(1 + w, -lifetime));` |
| `idcFactor` | `Math.pow(1 + w, constructYr / 2);` |
| `capexAdj` | `capexAnn * idcFactor;` |
| `decomm` | `capexPerKw * decommPct / 100 * w / (1 - Math.pow(1 + w, -lifetime));` |
| `annualMwh` | `cf / 100 * 8760;` |
| `lcoe` | `useMemo(() => calcLcoe({ capexPerKw: capex, opexFixed: opexF, opexVar: opexV, fuelCost: fuel, constructYr: constrYr, lifetime, wacc, cf, decommPct: decomm }), [capex, cf, lifetime, opexF, opexV, fuel, constrYr, wacc, decomm]);  const allReactorLcoe = useMemo(() => REACTOR_TYPES.map(r => ({ name: r.name.split(" ")[0] + " " + r.name.split("` |
| `opexTotal` | `r.opexFixed + r.opexVar;` |
| `decommAnn` | `r.capex_kw * r.decommPct / 100 * w / (1 - Math.pow(1 + w, -r.lifetime));` |
| `annMwh` | `r.cf / 100 * 8760;` |
| `carbonAdjLcoe` | `useMemo(() => { const baseLcoe = lcoe * 1000;` |
| `irrCalc` | `useMemo(() => { const capexTotal = capex * 1000000;` |
| `annRev` | `cf / 100 * 8760 * (lcoe * 1000 * 1.15) * 1000;` |
| `annOpex` | `(opexF + opexV + fuel) * cf / 100 * 8760 * 1000;` |
| `net` | `annRev - annOpex;` |
| `annOp` | `(opexF + opexV + fuel) * cf / 100 * 8760 * 1000;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPARABLES`, `REACTOR_TYPES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Large Nuclear LCOE | `(Capital + O&M + Fuel + Decom) / Annual Generation` | IEA 2020 | Benchmark range for new-build large light-water reactors in OECD markets. |
| SMR Projected LCOE | `NOAK factory cost × learning rate / (CF × capacity)` | NEA SMR Report 2021 | Projected NOAK range assuming 10–15% learning rate on factory-fabricated units. |
| Capacity Factor | `Actual Generation / (Installed Capacity × 8760)` | IAEA PRIS 2023 | Nuclear fleet average CF; highest of any generating technology. |
- **Vogtle/Hinkley cost-overrun data** → Overnight cost → FCR → annualised capital → **LCOE $/MWh by technology**

## 5 · Intermediate Transformation Logic
**Methodology:** LCOE Methodology
**Headline formula:** `LCOE = (Overnight Cost × FCR + O&M + Fuel + Decom) / (CF × 8760 × Capacity)`

Full lifecycle cost model normalised to $/MWh of generation.

**Standards:** ['IEA Projected Costs of Generating Electricity 2020', 'WNA Economics of Nuclear Power']
**Reference documents:** IEA Projected Costs of Generating Electricity (2020); World Nuclear Association — Economics of Nuclear Power; NEA — Unlocking Reductions in the Construction Costs of Nuclear

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This module **matches its MODULE_GUIDES entry** and is one of the platform's more carefully built
financial engines: a proper annuitized-capital LCOE model with interest-during-construction (IDC)
compounding, applied to six real reactor archetypes and benchmarked against eight competing
generation technologies with realistic LCOE ranges.

### 7.1 What the module computes

```js
w           = WACC / 100
CRF         = w / (1 − (1+w)^−lifetime)                    // capital recovery factor (annuity)
capexAnn    = capexPerKw × CRF                              // $/kW/yr, annuitized overnight capex
idcFactor   = (1+w)^(constructYr/2)                          // IDC compounding over half the build period
capexAdj    = capexAnn × idcFactor                           // $/kW/yr, financing-cost-adjusted
decomm      = capexPerKw × decommPct/100 × CRF                // $/kW/yr, decommissioning provision annuitized
annualMwh   = CF/100 × 8760                                   // kWh generated per kW of capacity per year
LCOE ($/kWh) = (capexAdj + opexFixed + decomm) / annualMwh + (opexVar + fuelCost) / 1000
```

The function returns **$/kWh**; the UI multiplies by 1000 wherever it displays $/MWh (e.g.
`allReactorLcoe`, `carbonAdjLcoe`). The `/1000` on the `(opexVar+fuelCost)` term is the unit
reconciliation: `opexFixed`/`decomm`/`capexAdj` are $/kW/yr figures divided by kWh/kW/yr (→ $/kWh
directly), while `opexVar`/`fuelCost` are entered directly in $/MWh and must be divided by 1000 to
join the same $/kWh scale before the final ×1000 redisplay. The variable name `annualMwh` is a
slight misnomer (it numerically equals kWh generated by a 1 kW reference unit, not MWh) but the
arithmetic is internally consistent throughout.

### 7.2 Parameterisation

| Reactor | capex ($/kW) | CF% | Life (yr) | OpexFixed | OpexVar | Fuel | Build (yr) | WACC | Decomm% |
|---|---|---|---|---|---|---|---|---|---|
| PWR (AP1000) | 7,500 | 92 | 60 | 18 | 4.2 | 8.5 | 6 | 8% | 15% |
| BWR (ABWR) | 7,200 | 90 | 60 | 20 | 4.8 | 8.5 | 5 | 8% | 15% |
| EPR | 10,500 | 91 | 60 | 16 | 4.0 | 8.0 | 9 | 7% | 14% |
| VVER-1200 | 5,800 | 90 | 60 | 14 | 3.8 | 7.0 | 6 | 6% | 12% |
| CANDU 6/EC6 | 6,800 | 88 | 40 | 22 | 5.0 | 5.5 | 5 | 7.5% | 14% |
| PHWR (IPHWR-700) | 5,500 | 85 | 40 | 20 | 4.6 | 5.0 | 6 | 7% | 13% |

These per-reactor capex figures track well-known real reference-class projects (EPR's $10,500/kW
reflects Hinkley Point C/Flamanville-class overruns; VVER-1200's lower $5,800/kW reflects
Rosatom's cited export pricing) — plausible order-of-magnitude, not audited project accounts.
`COMPARABLES` (8 technologies) gives LCOE ranges for offshore/onshore wind, solar, CCGT, coal, SMR
(2030E), and green hydrogen, each with a `co2` (gCO2/kWh) lifecycle-emissions figure consistent with
IPCC AR5/AR6 WG3 Annex III lifecycle-emissions ranges (nuclear ~12, wind ~11–14, solar PV ~48,
CCGT ~490, coal ~820 gCO2/kWh).

### 7.3 Calculation walkthrough

1. User adjusts capex, CF, lifetime, opex, fuel, build time, WACC, decomm% via sliders (defaults =
   the AP1000 reference case); `calcLcoe` recomputes on every change.
2. `allReactorLcoe` re-runs `calcLcoe` for all 6 static reactor archetypes (ignoring the sliders) to
   populate the cross-technology comparison chart.
3. `costBreakdown` (for the selected static reactor) decomposes the LCOE into capital-annuity, IDC
   financing-cost delta, fixed O&M, variable O&M, fuel, and decommissioning slices — a legitimate
   waterfall of the same formula's terms.
4. `radarData` scores the selected reactor on 6 illustrative axes (Capacity Factor, Lifetime,
   inverse Fuel cost, inverse Capex, a hand-coded "Flexibility" heuristic by design-family name
   match, and a hand-coded "TRL Maturity" heuristic) — the last two are qualitative overlays, not
   derived from the LCOE calculation.
5. `learningCurveData` applies a Wright's-Law-style progress-ratio decay (`b=0.05`) across
   cumulative unit counts (1→500) to project SMR cost decline — see `negative-emissions-tech`'s
   companion DAC learning curve for the same pattern elsewhere on the platform.
6. `irr()` (Newton-Raphson, 200 iterations) is available for the Investor Returns tab to solve
   project-level IRR from a capex/revenue cashflow stream built off the computed LCOE.

### 7.4 Worked example — PWR (AP1000) defaults

`capexPerKw=$7,500`, `CF=92%`, `lifetime=60yr`, `opexFixed=$18/kW/yr`, `opexVar=$4.2/MWh`,
`fuelCost=$8.5/MWh`, `constructYr=6`, `WACC=8%`, `decommPct=15%`:

| Step | Computation | Result |
|---|---|---|
| `w`, `(1.08)^-60` | — | 0.08, 0.009876 |
| `CRF` | `0.08/(1−0.009876)` | 0.080798 |
| `capexAnn` | `7,500 × 0.080798` | **$605.99/kW/yr** |
| `idcFactor` | `1.08^(6/2) = 1.08³` | 1.259712 |
| `capexAdj` | `605.99 × 1.259712` | **$763.31/kW/yr** |
| `decomm` | `7,500 × 0.15 × 0.080798` | **$90.90/kW/yr** |
| `annualMwh` (kWh/kW/yr) | `0.92 × 8,760` | 8,059.2 |
| Capex+Fixed+Decomm term | `(763.31+18+90.90)/8,059.2` | $0.10823/kWh |
| Variable term | `(4.2+8.5)/1,000` | $0.01270/kWh |
| **LCOE** | `0.10823+0.01270` | **$0.12093/kWh → $120.93/MWh** |

$120.93/MWh sits squarely inside the guide's cited $90–160/MWh large-nuclear benchmark range and
close to real Vogtle 3/4-class cost estimates, confirming the formula is both internally consistent
and externally plausible.

### 7.5 Data provenance & limitations

- All six reactor archetypes and the 8-technology comparison set are hand-curated static reference
  data (no `sr()` PRNG in the LCOE calculation itself) — deterministic and reproducible.
- The IDC treatment (`(1+w)^(constructYr/2)`) approximates financing cost as compounding over *half*
  the construction period — a standard simplification (assumes uniform capex draw-down) rather than
  a full construction S-curve cash-flow schedule; production models (e.g. IEA's) often use a
  detailed year-by-year spend profile instead.
- `radarData`'s "Flexibility" and "TRL Maturity" axes are qualitative heuristics keyed on reactor
  name substring matches, not derived from any load-following or licensing-status dataset.
- `learningCurveData`'s SMR cost decline is a generic Wright's Law progress ratio, not calibrated to
  any specific SMR vendor's actual cost-reduction roadmap.

**Framework alignment:** IEA *Projected Costs of Generating Electricity* (2020) — the annuitized
capex + O&M + fuel + decommissioning structure matches IEA's standard LCOE methodology exactly ·
WNA *Economics of Nuclear Power* — reactor archetype parameters are consistent with WNA's typical
cost ranges · IPCC AR5/AR6 WG3 Annex III — lifecycle CO2 intensities in `COMPARABLES` match the
IPCC's published technology ranges.

## 9 · Future Evolution

### 9.1 Evolution A — Reference-class overrun modelling and learning curves (analytics ladder: rung 1 → 4)

**What.** §7 rates this one of the platform's more carefully built engines: a proper annuitized-capital LCOE model with capital-recovery factor, interest-during-construction compounding (`idcFactor = (1+w)^(build/2)`), and annuitized decommissioning, over six real reactor archetypes and benchmarked against eight competing technologies — internally unit-consistent throughout. The limitation is that it is a single deterministic point per reactor off hand-entered capex; the guide itself flags Vogtle/Hinkley overruns and 10–15% SMR factory-learning rates that the engine does not model. Evolution A adds the empirical uncertainty and learning dynamics.

**How.** (1) Reference-class forecasting: fit an overrun distribution from real nuclear construction history (the sibling `nuclear-market-intelligence` module already carries real Hinkley $46bn / Vogtle $35bn project data) and run LCOE as a distribution — P50/P90 LCOE, not one number — the rung-4 predictive step. (2) SMR learning curve: apply Wright's-Law factory learning (10–15% per §1, the same mechanism the `negative-emissions-tech` DAC curve uses) so NOAK LCOE is derived from FOAK cost and cumulative deployment, not hand-entered. (3) Keep the IEA/WNA-benchmarked technology comparison but source the competing-tech LCOE ranges to the IEA Projected Costs 2020 dataset named in §5.

**Prerequisites.** Real construction-cost history for the overrun fit (available from the market-intelligence module and public NEA data); a `bench_quant` pin on the existing deterministic LCOE (guard the good engine before extending it). **Acceptance:** LCOE reports P50/P90 reflecting overrun risk; SMR NOAK cost derives from a learning curve, not a constant; deterministic path reproduces the current pinned value.

### 9.2 Evolution B — LCOE what-if copilot for reactor economics (LLM tier 2)

**What.** A copilot answering "what's the LCOE of an AP1000 at 7% WACC and 90% capacity factor?", "how sensitive is nuclear LCOE to build time?", "at what carbon price does nuclear beat CCGT?" — executed against the LCOE engine, decomposing the result into the capex-annuity, IDC, O&M, fuel, and decommissioning terms the engine already separates.

**How.** Tool calls to a `POST /nuclear-lcoe/compute` endpoint wrapping the existing function; system prompt from this Atlas page's §5/§7.1 including the crucial $/kWh vs $/MWh unit reconciliation (§7.1 documents the `/1000` term and the `annualMwh` misnomer — the copilot must explain units correctly or it will mislead). The carbon-price crossover is a swept comparison against the eight benchmarked technologies. Sensitivity questions (WACC, build time, CF) are recomputations; fabrication validator matches every $/MWh to a tool response. Post-Evolution-A, the copilot can quote P50/P90 ranges and explain overrun risk.

**Prerequisites.** The compute endpoint; unit-handling correctness in the system prompt (the misnomer is a real trap). Ranges/overrun narration needs Evolution A. **Acceptance:** every LCOE figure traces to a tool call and is correctly labelled $/MWh; the carbon-crossover reflects real benchmark data; sensitivity directions are monotonic and correct.