## 7 · Methodology Deep Dive

### 7.1 What the module computes

20 named real projects (NEOM, Murchison, HyDeal Ambition, etc.) each carry hand-entered technical
and cost parameters. The headline metric is Levelised Cost of Ammonia (LCOA, $/tonne NH₃), computed
per the guide's formula and cross-checked against a **hard-coded `grey_ammonia_cost_usd_t`** field
per project (not derived — entered directly, 245–310 $/t range):

```
LCOA = (CAPEX × CRF + OPEX + E_price × 10 MWh/t) / Annual_NH3_output_t
CRF  = 0.08   (flat 8% capital recovery factor, not amortised via r(1+r)^n/((1+r)^n−1) despite
               the guide's stated formula — the code uses a constant, not the interest/lifetime
               annuity formula)
```

`lcoa_usd_t` itself is a **static input field** per project (400–1,200 range), not computed live —
the "LCOA Engine" tab displays these pre-set values; only the derived breakdown charts (cost
breakdown, sensitivity, scale effects) perform live arithmetic.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| `CRF` | 0.08 | Comment: "capital recovery factor ~8%" — a flat approximation of the annuity factor, not solved from a discount rate/lifetime pair |
| `NH3_ELEC_CONSUMPTION` | 10 MWh/t NH₃ | Matches guide's stated "10 MWh electricity/tonne" benchmark (IEA Ammonia Technology Roadmap) |
| Per-project `electrolyserCapex_usd_kw` | 580–950 $/kW | Named real developers; plausible 2024 PEM/alkaline CAPEX range, not sourced to a specific citation per project |
| Per-project `electricityCost_usd_mwh` | 14 (Somalia) – 42 (Japan, import case) | Reflects known RE-resource quality differentials (MENA/Australia cheap, Japan/Denmark expensive) |
| `grey_ammonia_cost_usd_t` | 245–310 | Matches guide's "$200–350/t grey" range |

### 7.3 Calculation walkthrough

1. **Cost breakdown** (`costBreakdown`, live per-project calc): correctly annualises CAPEX using
   `CRF` against actual annual output —
   `electrolyser_$/t = electrolyserCapex_$/kW × GW × 1000 × CRF / (tpd × 365 × CF%)` — a genuine
   CRF-based unit-cost derivation, applied separately to electrolyser CAPEX, electricity
   (`elecCost_$/MWh × 10`), and combined ASU+HB CAPEX.
2. **Sensitivity Analysis tab** — computes `annualOutput`, `capexAnnual`, `opexFixed`, `elecCost`,
   and even a `lcoa` variable using the CRF formula, **then discards all of it** and returns
   `lcoa: Math.round(400 + e×12 + capexOverride×0.08)` — a simple linear approximation unrelated to
   the computed values in the same block. **This is dead code**: the "sensitivity" chart the user
   sees is not driven by the CRF math directly above it.
3. **Scale Effects tab**: plots `electrolyserGw` vs `lcoa_usd_t` across all 20 projects sorted by
   size — a genuine (if simple) scale-economics scatter using the static `lcoa_usd_t` field, not a
   fitted curve.
4. **Grey vs Green Parity tab**: `premium = lcoa_usd_t − grey_ammonia_cost_usd_t` per project,
   sorted ascending by LCOA — direct subtraction of two static fields.
5. **Carbon price needed to close the gap** (`carbonPriceNeeded`): `premium / 1.8` — dividing the
   green premium by 1.8 tCO₂/t NH₃ (the stoichiometric/typical grey-ammonia carbon intensity),
   i.e. solving `carbonPrice × 1.8 = premium` for the breakeven carbon price.

### 7.4 Worked example

Project "ACME Green Ammonia" (Chile): `electrolyserCapex_usd_kw=720`, `electrolyserGw=1.8`,
`hbCapacity_tpd_nh3=1050`, `capacity_factor_pct=50`, `electricityCost_usd_mwh=20`,
`asuCapex_bn=0.6`, `hbCapex_bn=0.9`, `lcoa_usd_t=530` (static), `grey_ammonia_cost_usd_t=270`.

| Step | Computation | Result |
|---|---|---|
| Annual NH₃ output | `1050 × 365 × 0.50` | 191,625 t/yr |
| Electrolyser $/t | `720 × 1.8 × 1000 × 0.08 / 191,625 × 1000` | ≈ $541/t (matches code's `×1000/(...)×1000` unit juggling) |
| Electricity $/t | `20 × 10` | $200/t |
| ASU+HB $/t | `(0.6+0.9)×1e9×0.08 / 191,625 × 1000` | ≈ $501/t |
| Green premium | `530 − 270` | $260/t |
| Breakeven carbon price | `260 / 1.8` | **$144/tCO₂** |

The electrolyser + ASU/HB unit costs computed here (≈$541+$501=$1,042/t before electricity) exceed
the *static* `lcoa_usd_t=530` field by a wide margin — confirming the cost-breakdown chart and the
headline LCOA figure are **not internally reconciled**; the breakdown is a separate live
calculation layered on top of a hand-entered headline number, not a decomposition of it.

### 7.5 Companion analytics

- **Haber-Bosch Economics tab**: `hbCapex_bn`/`asuCapex_bn` per project scaled ×1000 to $M, plotted
  against `tpdNH3` capacity — a capital-intensity comparison, no further derivation.

### 7.6 Data provenance & limitations

- All 20 projects are **hand-entered static data**, not `sr()`-generated — but cross-field
  consistency is not enforced: the static `lcoa_usd_t` and the live cost-breakdown calculation can
  diverge substantially (see §7.4), and the Sensitivity Analysis tab silently substitutes a
  disconnected linear formula for the CRF-based one computed in the same code block.
- `CRF = 0.08` is a flat constant rather than solved from `(WACC, lifetime)` — despite the guide
  citing the full annuity formula `r(1+r)^n/((1+r)^n−1)`, no discount rate or asset life parameter
  exists in this module (contrast with `green-hydrogen-lcoh`, which does implement the full annuity
  formula).
- Carbon-price breakeven (`premium/1.8`) assumes a fixed 1.8 tCO₂/t grey-ammonia emission factor
  uniformly across all countries/production routes, ignoring regional grid-emission-factor
  variation in grey ammonia production.

**Framework alignment:** IEA Ammonia Technology Roadmap 2021 (10 MWh/t electricity benchmark,
correctly used) · IRENA Green Hydrogen Cost Reduction 2020 (capacity-factor/CAPEX scaling context)
· BNEF Green Ammonia Market Outlook 2024 (cost trajectory framing). The CRF methodology named in
the guide is only partially implemented (flat 8% vs full annuity formula).
