## 7 · Methodology Deep Dive

The CAT Bond & ILS Analytics module is methodologically sound: it prices catastrophe bonds with the correct
actuarial structure (expected loss as a fraction of layer thickness, spread as a multiple of EL, spread-
multiple = spread/EL) and uses real historical loss events. The bond attributes are `sr()`-seeded rather
than drawn from a real loss-exceedance-probability curve, so §8 specifies the LEP-based pricing engine.

### 7.1 What the module computes

For 24 cat bonds, an internally-consistent pricing chain:

```js
attachment = 0.02 + sr·0.06                              // 2–8% attachment point (fraction of layer)
exhaustion = attachment + 0.03 + sr·0.05                 // exhaustion above attachment
eloss      = (exhaustion − attachment) × (0.15 + sr·0.35)// EL = layer thickness × occupancy fraction
spread     = eloss × (2.5 + sr·2.0)                      // spread = EL × market multiple (2.5–4.5×)
multipleOfEL = spread / eloss                            // spread-to-risk ratio
```

The inline comment confirms the actuarial correctness: *"EL as fraction of layer thickness, not attachment
trigger"*. `pricedSpread` re-runs this from user-entered EL and attachment inputs. A live pricing calculator,
market-size time series, spread term structure by trigger type, and a peril pie complete the analytics.

### 7.2 Parameterisation

**Bond universe** (`CAT_BONDS`, 24 rows, `sr()`-seeded — realistic ranges):

| Field | Generator | Basis |
|---|---|---|
| attachment | 2–8% | typical mezzanine cat-bond attachment |
| exhaustion | attach + 3–8% | layer width |
| eloss | thickness × (15–50%) | expected loss within the layer |
| spread | EL × (2.5–4.5) | market risk-load multiple |
| rating | BB+ … NR | cat bonds are sub-investment-grade |
| trigger | Indemnity / Industry Index / Parametric / Modeled Loss | the four real trigger types |

**Historical loss events** (`LOSS_EVENTS` — provenance: **real** insured-loss figures): Harvey/Irma/Maria
2017 ($92bn insured, $14.2bn ILS loss), Ian+Nicole 2022 ($110bn), Helene+Milton 2024 ($78bn), European
Floods 2021 ($40bn). Market aggregates (`totalOutstanding = $62.4bn`, `totalIssuance2024 = $17.8bn`) match
the real Artemis/Swiss Re ILS market size.

**Spread term structure** (`SPREAD_CURVE`): rising with tenor and ordered Indemnity > Modeled > Industry Idx
> Parametric — the correct basis-risk ordering (indemnity carries most basis risk premium for the sponsor,
parametric least).

### 7.3 Calculation walkthrough

Each bond draws an attachment/exhaustion layer → EL as a fraction of the layer thickness → spread as an
EL multiple → spread-multiple reported. Portfolio KPIs average spread and multiple across active bonds. The
live calculator lets a user input EL and attachment to price a hypothetical tranche. The climate-stress tab
(per the guide) would uplift the loss distribution for SSP warming — the frequency-uplift lever.

### 7.4 Worked example (one bond)

`attachment = 4%`, `exhaustion = 4% + 5% = 9%` → layer thickness = 5%. `eloss = 5% × 0.30 = 1.5%`.
`spread = 1.5% × 3.0 = 4.5%`. `multipleOfEL = 4.5/1.5 = 3.0×`.

Interpretation: the bond's expected annual loss is 1.5% of notional; investors demand a 4.5% spread — a 3×
multiple over expected loss, squarely in the historical cat-bond range (2–5×). A BB-rated multi-peril bond
at this multiple is a plausible market quote.

### 7.5 Data provenance & limitations

- **Historical loss events and market-size aggregates are real**; bond attributes are **synthetic**
  (`sr(seed)=frac(sin(seed+1)×10⁴)`) but respect correct actuarial relationships.
- **EL is drawn as a random fraction of layer thickness, not derived from a loss-exceedance-probability
  curve** — the guide's RMS/AIR LEP integration is not implemented (§8). Attachment/exhaustion *probabilities*
  (P(loss > trigger)) are not computed from a distribution.
- Climate uplift is described but the loss distribution is static; no SSP frequency-scaling is applied to EL.

**Framework alignment:** RMS/AIR catastrophe models — the LEP-curve → EL pipeline the module *approximates*
(EL as probability-weighted average annual loss) · Artemis ILS market data — spread-multiple benchmarks and
market-size figures · IAIS ICS / Solvency II — the capital context for ceding insurers; cat bonds transfer
tail risk to capital markets. See §8 for the LEP-based pricing engine.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** EL is randomly seeded; this specifies deriving it
from a real loss-exceedance-probability curve.

### 8.1 Purpose & scope
Price a cat-bond tranche and its attachment/exhaustion probabilities from a modelled per-peril loss-
exceedance-probability curve, with a climate-conditioned frequency/severity uplift, for ILS investors and
sponsors.

### 8.2 Conceptual approach
Integrate the layer payout against the annual loss distribution from a catastrophe model (RMS/AIR event
set), benchmarked against Lane Financial / Artemis pricing and standard reinsurance layer pricing. Spread =
EL × market multiple + expense load, with the multiple calibrated to observed primary-market issuance.

### 8.3 Mathematical specification

```
LEP(x)  = P(annual loss > x)                         from stochastic event set (50k–100k years)
P_att   = LEP(attachment × notional)                 attachment probability
P_exh   = LEP(exhaustion × notional)                 exhaustion probability
EL      = ∫_{att}^{exh} LEP(x) dx / (exh − att)      expected loss in the layer (fraction)
Spread  = EL × m + load                              m = market multiple (peril/tenor dependent)
Price   = notional × (1 − PV(coupon − expected loss))
Climate: LEP_c(x) = LEP(x / (1+κ_sev)) × (1 + κ_freq)   κ from SSP warming (per peril)
```

| Parameter | Symbol | Source |
|---|---|---|
| LEP curve | LEP | RMS/AIR event set per peril/region |
| Market multiple | m | Artemis primary-issuance spreads |
| Severity/freq uplift | κ_sev, κ_freq | IPCC SSP + peril attribution (e.g. wind +5–15%) |
| Expense load | load | 1–2% (sponsor + structuring) |

### 8.4 Data requirements
Per bond: peril, region, exposure, attachment/exhaustion, tenor; a licensed catastrophe-model LEP curve;
climate uplift factors by peril. Platform holds the layer structure and real historical events; missing: the
LEP curve feed and calibrated multiples.

### 8.5 Validation & benchmarking plan
Backtest modelled EL against realised cat-bond losses (2017 HIM, 2022 Ian). Reconcile priced spreads against
Artemis primary-market data (multiple within observed band). Sensitivity of EL to the climate κ. Kupiec test
on attachment-probability calibration vs realised triggers.

### 8.6 Limitations & model risk
Cat-model epistemic uncertainty is ±30–50% (per the guide's own datapoint) — present EL ranges, not points.
Climate attribution factors are contested; show base + uplifted EL side by side. Basis risk on parametric/
index triggers must be quantified separately from modelled EL.
