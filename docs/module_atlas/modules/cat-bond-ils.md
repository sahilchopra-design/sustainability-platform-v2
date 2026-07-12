# CAT Bond & ILS Analytics
**Module ID:** `cat-bond-ils` · **Route:** `/cat-bond-ils` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Catastrophe bond pricing, ILS (Insurance-Linked Securities) portfolio analytics, and parametric trigger design covering hurricane, earthquake, flood, and wildfire perils. Models expected loss, attachment/exhaustion probabilities, and spread-to-risk ratios. Integrates RMS/AIR loss exceedance probability curves and tracks secondary market price movements.

> **Business value:** CAT bonds and ILS provide institutional investors with non-correlated yield in low-rate environments while transferring catastrophic weather risk from insurers to capital markets. Climate change is increasing hurricane intensification and wildfire frequency, requiring investors to apply climate-adjusted loss distributions rather than historical average to correctly price expected loss and attachment probability.

**How an analyst works this module:**
- Market Overview shows live CAT bond issuance pipeline with peril and spread
- Pricing Analytics tab models attachment/exhaustion probabilities from LEP curve
- Portfolio Aggregation tracks ILS holdings with expected loss and duration
- Parametric Triggers tab designs index-based or modelled loss triggers
- Climate Stress tab applies IPCC SSP3-7.0 frequency uplift to loss distributions
- Secondary Market tab tracks price history and bid-ask spreads per bond

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CAT_BONDS`, `Kpi`, `LOSS_EVENTS`, `MARKET_SIZE`, `PERILS`, `PERIL_PIE`, `PIE_COLORS`, `RATINGS`, `RATING_COLORS`, `RatingBadge`, `SPREAD_CURVE`, `Section`, `StatusBadge`, `TRIGGER_TYPES`, `TabBar`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `LOSS_EVENTS` | 9 | `event`, `insuredLoss`, `ilsLoss`, `trigger`, `peril` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n, d = 1) => n >= 1e9 ? `$${(n / 1e9).toFixed(d)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(d)}M` : `$${n.toFixed(d)}`;` |
| `pct` | `(n) => `${(n * 100).toFixed(2)}%`;` |
| `PERILS` | `['Multi-Peril', 'US Wind', 'EU Windstorm', 'Japan EQ', 'US EQ', 'Flood', 'Wildfire'];` |
| `RATINGS` | `['BB+', 'BB', 'BB-', 'B+', 'B', 'B-', 'NR'];` |
| `RATING_COLORS` | `{ 'BB+': '#059669', 'BB': '#0f766e', 'BB-': '#0369a1', 'B+': '#b45309', 'B': T.orange, 'B-': T.red, 'NR': T.gray };` |
| `issueYear` | `2021 + Math.floor(sr(i * 3) * 4);` |
| `tenor` | `3 + Math.floor(sr(i * 7) * 2);` |
| `attachment` | `0.02 + sr(i * 11) * 0.06;` |
| `exhaustion` | `attachment + 0.03 + sr(i * 13) * 0.05;` |
| `eloss` | `(exhaustion - attachment) * (0.15 + sr(i * 17) * 0.35); // EL as fraction of layer thickness, not attachment trigger (actuarially correct)` |
| `spread` | `eloss * (2.5 + sr(i * 19) * 2.0);` |
| `SPREAD_CURVE` | `[1, 2, 3, 4, 5].map((tenor, i) => ({` |
| `PERIL_PIE` | `PERILS.map((p, i) => ({` |
| `totalOutstanding` | `Math.round(62.4 * 1e9);` |
| `totalIssuance2024` | `Math.round(17.8 * 1e9);` |
| `avgSpread` | `activeBonds.length ? activeBonds.reduce((a, b) => a + parseFloat(b.spread), 0) / activeBonds.length : 0;` |
| `avgMultiple` | `activeBonds.length ? activeBonds.reduce((a, b) => a + parseFloat(b.multipleOfEL), 0) / activeBonds.length : 0;` |
| `pricedSpread` | `useMemo(() => { const el = elossInput / 100;` |
| `attach` | `attachInput / 100;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `LOSS_EVENTS`, `PERILS`, `PIE_COLORS`, `RATINGS`, `SPREAD_CURVE`, `TABS`, `TRIGGER_TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Expected Loss (EL) | `Σ P(Loss_i) × Loss_i` | RMS/AIR cat model | Probability-weighted average annual loss as percentage of notional; drives CAT bond pricing |
| Attachment Probability | `P(loss > attachment point)` | Catastrophe model | Probability that losses breach the lower trigger threshold, activating partial payout |
| Spread Multiple (multiple-of-EL) | `Spread / EL` | Artemis ILS market | Market-implied risk premium above expected loss; reflects investor risk appetite and supply/demand |
- **RMS/AIR catastrophe model outputs (LEP curves)** → Compute EL from LEP; calibrate attachment/exhaustion probabilities; price risk spread → **Expected loss, spread, and probability metrics per CAT bond tranche**
- **Artemis ILS market data (secondary prices, new issuance)** → Track spread multiple vs EL; monitor secondary price movements → **ILS portfolio mark-to-market and spread-to-risk ratio analytics**

## 5 · Intermediate Transformation Logic
**Methodology:** Loss exceedance probability pricing model
**Headline formula:** `Expected_loss = Σ_i P(Loss_i) × Loss_i; Spread = Risk_spread + Margin; Risk_spread ≈ EL × (1+loading_factor)`

CAT bond pricing is driven by the expected loss (EL) derived from loss exceedance probability (LEP) curves output by catastrophe models (RMS, AIR). Attachment probability = P(loss > attachment); exhaustion probability = P(loss > exhaustion). Spread = risk spread (proportional to EL) + credit spread + market premium.

**Standards:** ['RMS/AIR CAT model outputs', 'Artemis ILS Market Data', 'IAIS Insurance Capital Standard']
**Reference documents:** RMS/AIR Catastrophe Model Loss Exceedance Probability Documentation; Artemis ILS Market Data and Benchmarks; IAIS Insurance Capital Standard (ICS); IOSCO ILS Regulatory Framework Report 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — LEP-curve-driven pricing on real cat-model output (analytics ladder: rung 2 → 4)

**What.** §7 confirms this module is methodologically sound: it prices cat bonds with the correct actuarial structure — expected loss as a fraction of layer thickness (not attachment trigger — the code comment explicitly notes the actuarially-correct choice), spread as a multiple of EL, and the spread-multiple = spread/EL relationship — and uses real historical loss events (`LOSS_EVENTS`). The one gap is upstream: the 24 bonds' attachment/exhaustion/EL are `sr()`-seeded rather than derived from a real loss-exceedance-probability (LEP) curve. Evolution A drives the sound pricing engine from real hazard data, connecting to the platform's own physical-risk digital twin.

**How.** (1) Derive EL and attachment/exhaustion probabilities from real LEP curves rather than seeds — the platform's `catastrophe-modelling` module and the physical-risk digital twin (populated earthquake/cyclone/wildfire/flood/sea-level grids) can produce peril-region loss distributions, so a bond's EL becomes `∫ P(loss) over the layer` from an actual curve. (2) Real bond attributes from ILS-market data (Artemis publishes issuance, spreads, multiples) with vintages, replacing seeded issuance. (3) The climate-stress tab's SSP3-7.0 frequency uplift applied to the LEP curve as a real distribution shift, not a scalar (the module's genuine value — climate-adjusting the loss distribution, which the overview correctly identifies as the key pricing question). (4) Rung 4: calibrate the loss distributions against observed catastrophe losses and make the climate-uplift predictive. Extract the pricing engine to a backend route and pin it in bench_quant.

**Prerequisites.** LEP curves from the cat-modelling module / digital twin; Artemis-style ILS market data; the SSP frequency-uplift factors per peril. **Acceptance:** bond EL derives from a real LEP curve, not a seed; attachment/exhaustion probabilities read off the curve; the climate-stress tab shifts the distribution (not a scalar); pricing math is bench-pinned.

### 9.2 Evolution B — ILS pricing and portfolio copilot (LLM tier 2)

**What.** ILS investors and reinsurers ask "price a US-wind bond attaching at 4% with a 7% exhaustion", "what's the climate-adjusted EL under SSP3-7.0?", "what spread multiple is the market paying for Japan EQ?", "aggregate my ILS portfolio's expected loss and duration" — the copilot runs the Evolution-A LEP-pricing and portfolio tools, reporting EL, attachment probability, spread, and spread-multiple, every figure tool-traced.

**How.** Tool schemas over the Evolution-A pricing/portfolio/climate-stress routes; grounding corpus is this Atlas record — the actuarially-correct pricing structure in §7 is the copilot's explanation source (why EL is a fraction of layer thickness, why spread is a multiple of EL). The honesty duty: cat-bond pricing depends on the model vintage and climate assumption, so the copilot states which LEP curve and warming level a price uses, and presents climate-adjusted EL alongside base EL — the module's whole thesis is that historical-average loss under-prices climate-intensifying perils. Portfolio marks compose into the report layer.

**Prerequisites (hard).** Evolution A's real LEP curves — a copilot pricing bonds off seeded EL would misprice risk transfer. **Acceptance:** every EL, probability, and spread traces to a tool response; each price states its LEP-curve vintage and warming level; climate-adjusted EL is reported alongside base EL.