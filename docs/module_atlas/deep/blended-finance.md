## 7 · Methodology Deep Dive

### 7.1 What the module computes

The page is a deal explorer plus a capital-stack calculator sitting in front of the
real `blended_finance_engine.py` (E72). The **displayed deal economics are client-side
arithmetic**, not engine calls. Two headline computations:

```js
// weighted average cost of the blended stack (per deal)
cost = (concPct×3 + grantPct×0 + commPct×8 + eqPct×16) / 100      // % — fixed tranche rates

// mobilisation multiple from the slider mix
conc = ta + firstLoss + guarantees + concessional
comm = commercial + equity
mobilizationMultiple = comm / conc      (private mobilised per $ concessional)
```

Portfolio roll-ups over `allDeals = SAMPLE_DEALS + customDeals`: total deal value,
total concessional (`Σ size×concPct/100`), total commercial, average leverage.

### 7.2 Parameterisation

The cost model hard-codes indicative tranche rates: **concessional 3%, grant 0%,
commercial 8%, equity 16%**. `costCompare` benchmarks the blended cost against a
pure-commercial 8.0% and pure-concessional 3.0% anchor. `BF_INSTRUMENTS` (7 rows)
and `SAMPLE_DEALS` (16 rows: project, sector, geography, size, conc/comm/grant/eq %,
SDGs, DFI, leverage, year) are hand-built reference data. The `riskWaterfall` orders
tranches TA → First-Loss → Concessional → Mezzanine → Senior by loss-absorption.

The backend engine, by contrast, exposes calibrated reference data:
`CONVERGENCE_BENCHMARKS` (climate mean 4.2×, energy 5.1×, infra 5.5×, with p25/p75
bands), `DFI_PROFILES` (IFC target 5.0×, MIGA 6.0×, EBRD 4.5×, ADB 3.8×, AIIB 4.2×,
AfDB 3.2×) and `INSTRUMENT_CONFIGS` concessional-share/return-enhancement ranges.

### 7.3 Calculation walkthrough

1. Filter deals by sector/status; aggregate value, concessional, commercial, leverage.
2. Capital-stack sliders (concessional, guarantees, first-loss, TA, commercial,
   equity) → mobilisation multiple and blended cost.
3. `costCompare` places the blended cost between the two pure benchmarks.
4. CSV export dumps the deal table. The `/ref/*` API endpoints can pull the engine's
   Convergence and MDB reference data.

### 7.4 Worked example

A deal with `concPct=30, grantPct=10, commPct=50, eqPct=10`:

| Step | Computation | Result |
|---|---|---|
| Concessional cost | 30 × 3 | 90 |
| Grant cost | 10 × 0 | 0 |
| Commercial cost | 50 × 8 | 400 |
| Equity cost | 10 × 16 | 160 |
| Blended cost | (90+0+400+160)/100 | **6.5%** |

Versus 8.0% pure-commercial, the concessional layer buys a 150 bp weighted-cost
reduction. A slider mix of `conc(TA+firstLoss+guar+concessional)=25`,
`comm(commercial+equity)=75` gives a **mobilisation multiple of 3.0×** — inside the
OECD >3× target and the engine's climate benchmark band (2.5–5.8).

### 7.5 Data provenance & limitations

- `SAMPLE_DEALS` are illustrative, not sourced to Convergence transaction records;
  the tranche rates (3/0/8/16) are fixed heuristics, so blended cost is a *weighting
  demonstration*, not a priced structure.
- The page does **not** call the engine's `assess_blended_structure` /
  `model_concessional_layers`, which would return honest nulls where deal parameters
  are unknown and would apply IFC PS compliance and ODA eligibility.
- No first-loss *sizing* to a hurdle rate on this page (that logic is the engine's
  cascade), no waterfall loss simulation — the "IRR Waterfall" is descriptive.

**Framework alignment:** OECD DAC Blended Finance Principles (additionality,
mobilisation, transparency) · Convergence State of Blended Finance leverage
benchmarks (in the engine) · DFI Working Group cascade / MDB Harmonised Framework
for Additionality (engine `calculate_mobilisation_metrics`) · IFC Performance
Standards 1–8 (engine `_score_ifc_ps`, weights PS1 .18 … PS8 .10).

## 8 · Model Specification

**Status: specification — not yet implemented in the page** (the engine already
implements most of it; the gap is wiring + first-loss sizing).

**8.1 Purpose & scope.** Size the concessional/first-loss layer needed to lift a
commercial tranche to its hurdle IRR, and report the resulting mobilisation ratio,
subsidy efficiency and ODA/IFC-PS status — for DFIs and MDBs structuring climate deals.

**8.2 Conceptual approach.** A tranche-waterfall loss-allocation model with
**first-loss sizing to a target senior IRR** (the OECD cascade), benchmarked against
**Convergence 2023** leverage bands and the **MDB Harmonised Framework** additionality
scoring — exactly the design the backend engine follows.

**8.3 Mathematical specification.**
```
Expected_loss = Σ_s PD_s · LGD_s · EAD_s
FirstLoss_req = EAD · (1 − hurdle_IRR / project_IRR)          (OECD sizing)
Senior_IRR    = (FCF − Σ junior coupons) / Senior_capital
Blended_IRR   = Σ_t r_t · size_t / Σ_t size_t   (non-grant)
Leverage      = private_mobilised / concessional_deployed
Mobilisation vs benchmark: compare Leverage to Convergence sector mean/p25/p75
Subsidy_eff   = development_impact / concessional_$
```

| Parameter | Source |
|---|---|
| Sector leverage bands | Convergence 2023 (engine `CONVERGENCE_BENCHMARKS`) |
| Tranche return ranges | Engine `INSTRUMENT_CONFIGS` / `model_concessional_layers` |
| PD/LGD | Deal credit analysis / MDB internal ratings |
| Hurdle IRR | Institutional investor mandate (8–12%) |
| ODA eligibility | WB income group + OECD DAC (engine `COUNTRY_INCOME_GROUPS`) |

**8.4 Data requirements.** Project cash-flow projection, PD/LGD/EAD by tranche,
investor hurdle, DFI partner, country income group, IFC PS assessment scores.
Engine already accepts all of these; the page must POST them rather than seed.

**8.5 Validation & benchmarking.** Reconcile achieved leverage against Convergence
sector medians; back-test first-loss sizing against realised deal loss experience;
verify blended IRR and leverage are internally consistent; sensitivity on hurdle IRR
and expected loss.

**8.6 Limitations & model risk.** Expected loss on frontier-market projects is
data-poor; mobilisation ratios are self-reported; additionality is judgemental.
Conservative fallback (already in engine): return null rather than a config-midpoint
where a deal-specific structuring input is missing.
