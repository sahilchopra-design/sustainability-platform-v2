# CDR Portfolio & Net-Zero Integration
**Module ID:** `cdr-portfolio-netzero` · **Route:** `/cdr-portfolio-netzero` · **Tier:** B (frontend-computed) · **EP code:** EP-EH6 · **Sprint:** EH

## 1 · Overview
Strategic CDR portfolio construction and net-zero pathway integration: portfolio allocation builder across 4 CDR types, Oxford Principles transition visualisation, marginal cost curve, frontier buyer alignment, risk/return scatter, and IFRS S2/SBTi/VCMI/ICVCM framework mapping.

> **Business value:** Used by corporate sustainability teams building net-zero strategies, asset managers constructing CDR portfolios, DFIs designing CDR procurement facilities, and CFOs preparing IFRS S2 CDR disclosures.

**How an analyst works this module:**
- Use portfolio builder to allocate across DAC, BECCS, biochar, and EW with IRR/risk/permanent outputs
- Review net-zero trajectory for baseline, avoidance, CDR, and residual emissions 2025–2050
- Examine CDR marginal cost curve for volume vs cost optimisation
- Analyse risk/return scatter and Oxford Principles transition compliance

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CDR_INSTRUMENTS`, `COST_CURVE`, `FRONTIER_BUYERS`, `KpiCard`, `NETZERO_TRAJECTORY`, `PORTFOLIO_TEMPLATES`, `Pill`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CDR_INSTRUMENTS` | 9 | `name`, `lcoc`, `permanenceTier`, `volume`, `irr`, `risk`, `additionality`, `maturity` |
| `PORTFOLIO_TEMPLATES` | 5 | `dac`, `beccs`, `biochar`, `ew`, `description`, `targetIrr` |
| `FRONTIER_BUYERS` | 7 | `allocation`, `focus`, `avgPrice`, `volume2024` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Portfolio Builder', 'Net-Zero Trajectory', 'Cost Curve', 'Buyer Alignment', 'Risk/Return', 'Net-Zero Integration'];` |
| `portfolioStats` | `useMemo(() => { const total = dacPct + beccsPct + biocharPct + ewPct \|\| 1;` |
| `wdac` | `dacPct / total;` |
| `wbeccs` | `beccsPct / total;` |
| `wbiochar` | `biocharPct / total;` |
| `wew` | `ewPct / total;` |
| `dacI` | `CDR_INSTRUMENTS.find(c => c.id === 'DAC-Geo');` |
| `ewI` | `CDR_INSTRUMENTS.find(c => c.id === 'EW-Basalt');` |
| `avgLcoc` | `Math.round(wdac * dacI.lcoc + wbeccs * beccsI.lcoc + wbiochar * biocharI.lcoc + wew * ewI.lcoc);` |
| `avgIrr` | `(wdac * dacI.irr + wbeccs * beccsI.irr + wbiochar * biocharI.irr + wew * ewI.irr).toFixed(1);` |
| `avgRisk` | `Math.round(wdac * dacI.risk + wbeccs * beccsI.risk + wbiochar * biocharI.risk + wew * ewI.risk);` |
| `permanencePct` | `Math.round(wdac * 100 + wbeccs * 100); // tier 1 only` |
| `annualCDR` | `carbonTarget * 1000; // tCO₂` |
| `annualCost` | `(annualCDR * avgLcoc / 1e6).toFixed(1);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CDR_INSTRUMENTS`, `FRONTIER_BUYERS`, `PORTFOLIO_TEMPLATES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| SBTi residual emissions limit (%) | `Of base year Scope 1+2 emissions` | SBTi Corporate Net-Zero Standard v1.1 | Net-zero requires neutralising ≤10% residual with permanent CDR; cannot use avoidance credits for net-zero target. |
| Oxford Principles shift timeline | `Gradual rebalancing from avoidance to CDR over time` | University of Oxford Net Zero research | By 2050: ideally >80% CDR; avoid locking in low-permanence credits with >2050 expiry dates for net-zero claims. |
| IFRS S2 CDR disclosure | `Mandatory for large entities under ISSB adoption` | IFRS S2 Climate-related Disclosures | Must disclose CDR strategy, annual expenditure, volumes, permanence tier mix, and reliance on carbon credits for net-zero claims. |
- **Oxford Principles + SBTi NET-Zero Standard + GFANZ CDR framework + IFRS S2** → Portfolio allocation engine + net-zero trajectory + cost curve + buyer alignment + framework mapper → **Corporate sustainability teams, asset managers, DFIs, and investors building CDR portfolios and net-zero strategies**

## 5 · Intermediate Transformation Logic
**Methodology:** CDR Portfolio Blended LCOC
**Headline formula:** `Portfolio_LCOC = Σ(weight_i × LCOC_i); Blended_IRR = Σ(weight_i × IRR_i); Permanent_pct = Σ(Tier1_weights)`

Optimal portfolio: 25–30% permanent DAC/BECCS (credibility); 30–40% biochar (returns); 25% EW (co-benefits + yield); 10% frontier ocean/algae (R&D call option).

**Standards:** ['Oxford Principles for Net-Zero Aligned Offsetting', 'SBTi Corporate Net-Zero Standard', 'GFANZ CDR Integration Framework 2023']
**Reference documents:** Oxford University (2022) – Oxford Principles for Net-Zero Aligned Carbon Offsetting; SBTi (2021) – Corporate Net-Zero Standard v1.1; GFANZ (2023) – CDR Integration into Financial Institution Net-Zero Strategies

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The MODULE_GUIDES entry is faithful: the code implements a **CDR portfolio blending** calculator
(weight-averaged levelised cost of carbon, IRR, risk, and permanent-% across four CDR types), a
net-zero emissions trajectory, a marginal cost curve, and a frontier-buyer alignment view. The
blending math is genuine; the trajectory and cost curve are deterministic (some `sr()` noise).

### 7.1 What the module computes

**Portfolio blend** (`portfolioStats`) — weights normalise to 1, then attributes are credit-weighted:
```
total = dacPct + beccsPct + biocharPct + ewPct  (or 1)
w_i   = pct_i / total
avgLcoc = Σ w_i · LCOC_i        // blended $/tCO2
avgIrr  = Σ w_i · IRR_i         // blended %
avgRisk = Σ w_i · risk_i        // blended 0–100
permanencePct = w_dac·100 + w_beccs·100     // Tier-1 (permanent) share only
annualCDR  = carbonTarget · 1000            // tCO2
annualCost = annualCDR · avgLcoc / 1e6      // $M
```

### 7.2 Parameterisation / scoring rubric

| Instrument | LCOC $/t | Perm. tier | IRR % | Risk | Additionality | Maturity |
|---|---|---|---|---|---|---|
| DAC-Geological | 600 | 1 | 6 | 25 | 98 | Early Commercial |
| BECCS | 200 | 1 | 9 | 45 | 90 | Commercial |
| Biochar | 130 | 3 | 12 | 35 | 85 | Commercial |
| Enhanced Weathering (Basalt) | 120 | 2 | 11 | 40 | 88 | Pilot |
| OAE | 80 | 1 | 8 | 60 | 80 | R&D |

All `CDR_INSTRUMENTS` values are **hard-coded, realistic** (DAC most expensive/lowest-risk, biochar
highest-IRR). `PORTFOLIO_TEMPLATES` (Conservative/Balanced/High-Yield/Frontier) and `FRONTIER_BUYERS`
(Stripe Frontier, Microsoft, Shopify, Holcim) are hard-coded. Cost-curve has minor `sr()` noise.

### 7.3 Calculation walkthrough

The user allocates percentages across DAC, BECCS, biochar and EW; weights normalise and each
instrument attribute is credit-weighted to a blended LCOC, IRR, risk, and permanent-%. A carbon
target (kt) scales to annual CDR volume and annual cost. The net-zero trajectory decays baseline
emissions at 5%/2.5-yr step, grows avoidance and CDR, and computes residual. The cost curve stacks
volume vs marginal/average cost. Buyer alignment maps the portfolio against Frontier-buyer preferences.

### 7.4 Worked example (Conservative Net-Zero template)

Template: DAC 40%, BECCS 30%, biochar 20%, EW 10% (total 100 → weights 0.4/0.3/0.2/0.1).

| Metric | Computation | Result |
|---|---|---|
| avgLcoc | 0.4·600 + 0.3·200 + 0.2·130 + 0.1·120 | 240 + 60 + 26 + 12 = **$338/t** |
| avgIrr | 0.4·6 + 0.3·9 + 0.2·12 + 0.1·11 | 2.4 + 2.7 + 2.4 + 1.1 = **8.6%** |
| avgRisk | 0.4·25 + 0.3·45 + 0.2·35 + 0.1·40 | 10 + 13.5 + 7 + 4 = **34.5** |
| permanentPct | (0.4 + 0.3)·100 | **70%** |
| annualCost (target 100 kt) | 100,000·338/1e6 | **$33.8M** |

The 8.6% blended IRR closely matches the template's stated `targetIrr` of 8.5% — internally
consistent — and 70% permanent (Tier-1 DAC+BECCS) reflects the "high permanence" positioning.

### 7.5 Data provenance & limitations
- Instrument economics, templates and buyer profiles are **hard-coded, realistic** reference data;
  only the cost curve carries `sr()` noise.
- Blended metrics are simple linear credit-weighted averages — no covariance/diversification benefit
  in the risk blend (portfolio risk = weighted mean risk, ignoring correlation), and no efficient
  frontier optimisation despite a risk/return scatter.
- Permanent-% counts only DAC+BECCS as Tier-1; EW (Tier-2) and OAE (nominally Tier-1) treatment is
  simplified.
- Net-zero trajectory uses fixed decay/growth constants, not a calibrated SBTi pathway.

**Framework alignment:** **SBTi Corporate Net-Zero Standard** (neutralise ≤10% residual with permanent
CDR) drives the permanent-% and residual logic. **Oxford Principles for Net-Zero Aligned Offsetting**
(shift to durable removal over time) frames the trajectory. **GFANZ CDR integration** and **IFRS S2**
disclosure are referenced for the reporting view. **VCMI** claim tiers inform buyer alignment. The
blended LCOC/IRR is a standard portfolio weighted-average, not a mean-variance optimisation.

## 9 · Future Evolution

### 9.1 Evolution A — Constrained CDR allocation optimiser (analytics ladder: rung 1 → 5)

**What.** §7 confirms the blending math is genuine — `portfolioStats` computes
weight-averaged LCOC/IRR/risk and a Tier-1 permanence share over the 4-type allocation
— but it only *evaluates* user-chosen weights; the "optimal portfolio" in §5 (25–30%
DAC/BECCS, 30–40% biochar…) is prose, not solved. Portfolio construction is one of the
roadmap's named rung-5 first movers, and this module is the platform's cleanest case:
minimise blended LCOC (or maximise IRR) subject to permanence-share ≥ X%, risk ≤ Y,
annual-tonnage and per-instrument volume caps from the `CDR_INSTRUMENTS` supply
fields.

**How.** (1) scipy linear/quadratic solve over the 4 weights (the objective and all
constraints are linear in weights, so this is exact, explainable optimisation — no
black box). (2) Efficient-frontier trace (LCOC vs permanence share) rendered alongside
the existing risk/return scatter. (3) Instrument economics calibrated before optimising:
LCOC/IRR seeds cross-checked against disclosed purchase prices (the sibling
`cdr-credit-markets` Evolution A purchase table is the natural source), and the `sr()`
noise §7 notes in the trajectory/cost curve removed per the platform guardrail.

**Prerequisites.** Calibrated inputs first — optimising over hand-typed IRRs produces
confident nonsense; the seeded-noise cleanup is part of this change. **Acceptance:**
the optimiser's solution dominates every `PORTFOLIO_TEMPLATES` preset on the stated
objective; a fixture with a known analytic optimum is recovered exactly.

### 9.2 Evolution B — Net-zero strategy copilot (LLM tier 2)

**What.** An assistant that runs allocation conversations: "give me the cheapest mix
with ≥40% permanent removal under $250/t blended", "how does the Oxford Principles
transition (shrinking avoidance, growing removal share) reshape my 2030 budget?" —
executed as tool calls against `portfolioStats` and, post-Evolution A, the optimiser
(client-side functions; this module has no backend routes), with the trajectory tab's
baseline/avoidance/CDR/residual decomposition narrated from page state.

**How.** Tool schemas over the blend evaluator and optimiser with typed constraint
parameters; per the tier-2 contract every $/t, %, and tonne in an answer must match a
logged tool return; framework questions (IFRS S2 CDR disclosure, SBTi neutralisation
rules) answer from the §5 standards corpus with citations, kept separate from computed
numbers.

**Prerequisites (hard).** Evolution A's optimiser and calibration — recommending
allocations from uncalibrated seed IRRs would be advice-shaped fabrication.
**Acceptance:** a recommended mix is reproducible by re-running the optimiser with the
stated constraints; the copilot declines to forecast 2030 prices beyond the labelled
scenario columns.