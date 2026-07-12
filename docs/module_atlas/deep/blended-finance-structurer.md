## 7 · Methodology Deep Dive

### 7.1 What the module computes

This is the thinnest of the three blended-finance pages: a 6-tab visual structurer
(`Structure Builder`, `Tranche Designer`, `Risk-Return by Layer`, `DFI Catalytic
Ratio`, `Impact-Financial Frontier`, `Deal Pipeline`) over static seed tables. There
is essentially no live calculation in the page's `computed` block beyond the tab
list — the displayed numbers are read directly from the seed arrays.

The one methodological identity the module illustrates is the catalytic ratio:

```
CatalyticRatio = Commercial_mobilised / Concessional_deployed
```

which appears as a pre-tabulated `CATALYTIC_TREND` series and a per-deal `catalytic`
field, not as a formula evaluated on user input.

### 7.2 Parameterisation

| Seed table | Fields | Rows | Role |
|---|---|---|---|
| `DEALS` | type, totalMn, firstLoss, mezzanine, senior, catalytic, irr, impact, stage | 6 | Deal templates (renewable, NbS, adaptation infra, clean transport, energy efficiency) |
| `TRANCHES` | returnPct, riskLevel, protectionPct | 4 | First-loss / mezzanine / senior / TA layer designer |
| `CATALYTIC_TREND` | ratio | 7 | Time series of $1 concessional → $x commercial |
| `FRONTIER_DATA` | financial | 8 | Impact-vs-financial-return scatter points |

Per the guide, the intended catalytic band is **$1 concessional → $3–8 commercial**,
consistent with Convergence and DFI Working Group figures. All values are hand-set
demo data; the module shares the `/api/v1/blended-finance/ref/*` endpoints with its
siblings and could pull the engine's `CONVERGENCE_BENCHMARKS` and `DFI_PROFILES`
(IFC 5.0×, MIGA 6.0×, EBRD 4.5×, ADB 3.8×) for live benchmarking.

### 7.3 Calculation walkthrough

1. Pick a deal template → its tranche split (first-loss / mezzanine / senior) and
   headline catalytic ratio, IRR and impact score are displayed from `DEALS`.
2. Tranche Designer shows the four-layer waterfall with return/protection %.
3. Catalytic Ratio tab plots `CATALYTIC_TREND`; the frontier tab plots impact vs
   `financial` return from `FRONTIER_DATA`.

### 7.4 Worked example

A renewable-energy template with `totalMn = 200`, `firstLoss = 30`, `senior = 150`,
`catalytic = 5.0`: the $30M concessional first-loss is shown as unlocking $150M
senior commercial capital, i.e. a **5.0× catalytic ratio** ($1 → $5) — inside the
$3–8 band. Because the value is stored, changing the first-loss size on this page
does not recompute the ratio (that dynamic sizing lives in the engine's
`assess_blended_structure`).

### 7.5 Data provenance & limitations

- Every displayed number is **static seed data**; the catalytic ratio is presented,
  not derived from a loss-allocation or hurdle-rate calculation.
- No first-loss sizing, no IRR solve, no additionality/ODA logic on the page — all of
  which the backend `blended_finance_engine.py` implements but the page does not call.

**Framework alignment:** Convergence Blended Finance leverage benchmarks · DFI Working
Group on Blended Concessional Finance (cascade / minimum-concessionality) · OECD DAC
Blended Finance Principles. The catalytic ratio is the standard mobilisation metric
(private capital mobilised per unit of concessional capital), here shown rather than computed.

## 8 · Model Specification

**Status: specification — not yet implemented in the page.** The production model is
the shared blended-finance structuring model (see `blended-finance.md` §8 and the
backend `blended_finance_engine.py`): first-loss sizing to a target senior IRR,
tranche-waterfall loss allocation, Convergence-benchmarked leverage, and
MDB-Harmonised-Framework additionality. This page should render that engine's
`model_concessional_layers` and `calculate_mobilisation_metrics` outputs instead of
static `DEALS`/`CATALYTIC_TREND` seeds. Key equations, parameters, data requirements,
validation and limitations are as documented in `blended-finance.md` §8; nothing
additional is required for the structurer view beyond binding its six tabs to the
engine response (tranche sizes → `tranches[]`, catalytic ratio → `leverage_ratio`,
frontier → per-tranche `return_target_pct` vs impact metrics).
