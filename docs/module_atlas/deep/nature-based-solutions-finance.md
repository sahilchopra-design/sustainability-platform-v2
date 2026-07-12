## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry lists `trace_labels` pointing at
> `POST /api/v1/nature-based-solutions/*` endpoints (AFOLU balance, ARR, blue carbon, credit
> quality, IUCN assessment, REDD+) backed by a genuinely rigorous Python engine
> (`backend/services/nature_based_solutions_engine.py`, VCS VM0007/VM0033/VM0024, IUCN GS v2.0,
> IPCC Tier 1–3 soil carbon). **The frontend page never calls that API** — no `fetch`/`axios` call
> exists anywhere in `NatureBasedSolutionsFinancePage.jsx`. All ten tabs run on client-side
> constants and a self-contained JS project-finance engine (`calcNbsFinancing`). The backend
> engine's honest "insufficient_data" null-handling and documented default sourcing therefore never
> reach this UI; the sections below document what the page actually computes and displays.

### 7.1 What the module computes

The **Project Finance Engine** tab (Tab 1) is the only tab with a real numeric model; the other
nine tabs (Overview, VCU Market Intelligence, Co-Benefit Valuation, Article 6.4 Pipeline, FI
Structuring, Risk Framework, Price Sensitivity, Portfolio Construction, Market Outlook) render
static market tables/constants with no computation. The finance engine (`calcNbsFinancing`) runs a
standard project-finance waterfall for one of six NbS archetypes (REDD+, A/R, IFM, Blue Carbon,
Peatland, Grassland):

```
totalDevCost   = projectHa × devCostHa                    (devCostHa = archetype avgCostHa)
annVcus        = projectHa × vcuYield                      (archetype-specific t/ha/yr)
annPermBuffer  = annVcus × permanenceBuffer%
netAnnVcus     = annVcus − annPermBuffer
cobenPrem      = vcuPrice × cobenefitPremPct%
effectivePrice = vcuPrice + cobenPrem
annRevenue     = netAnnVcus × effectivePrice
annOpex        = projectHa × annOpexHa                     (annOpexHa = devCostHa × 0.04)
annEbitda      = annRevenue − annOpex
NPV            = −totalDevCost + Σ_{y=1..life} annEbitda / (1+WACC)^y
IRR            = Newton-Raphson root of Σ CFₜ/(1+r)^t = 0, 200 iterations, seed r₀=12%
LCOC           = (totalDevCost × CRF + annOpex) / max(1, netAnnVcus)
CRF (capital recovery factor) = WACC / (1 − (1+WACC)^−life)
breakEvenPrice = (annOpex + totalDevCost/life) / max(1, netAnnVcus)
```

### 7.2 Parameterisation — archetype constants (`NBS_TYPES`, provenance: page-embedded demo data)

| Archetype | avgCostHa ($) | vcuYield (t/ha/yr) | Price range ($/t) | Permanence risk | Article 6.4 |
|---|---|---|---|---|---|
| REDD+ | 3.2 | 12 | 8–18 | Medium | ✓ |
| Afforestation/Reforestation (A/R) | 1,200 | 8 | 12–28 | Low | ✓ |
| Improved Forest Mgmt (IFM) | 450 | 5 | 10–22 | Low | — |
| Blue Carbon | 2,800 | 15 | 18–45 | Medium | ✓ |
| Peatland Restoration | 1,800 | 18 | 14–32 | Low | ✓ |
| Grassland/Savanna | 180 | 4 | 5–14 | Medium | — |

These per-hectare cost and yield figures are plausible orders-of-magnitude for each project type
(REDD+'s near-zero `avgCostHa` reflects that avoided-deforestation projects mainly pay for
monitoring, not planting) but are **round demo numbers, not sourced from a specific project
database** — no citation is attached in code. `annOpexHa = devCostHa × 4%` is a single hard-coded
opex ratio applied uniformly across all six archetypes regardless of labour intensity.

Co-benefit premium (`COBENEFIT_CATEGORIES`, `calcCobenefitPremium`): a weighted average of five
category premiums (biodiversity 30%/35bps, water 22%/22bps, community 25%/28bps, food 13%/15bps,
climate 10%/12bps) selected via checkbox, `weightedPrem/totalWeight` — this yields the *average*
bps of the checked categories, not a sum, so premium does not simply grow with more boxes checked
if their weights differ.

### 7.3 Calculation walkthrough

1. User selects an NbS archetype (fixes `devCostHa`, `vcuYield`) and six sliders (area, VCU price,
   co-benefit premium %, project life, WACC, permanence buffer %).
2. `calcNbsFinancing` derives net annual VCUs after the permanence-buffer haircut, applies the
   co-benefit price premium to get an effective $/t, and computes revenue, opex, EBITDA.
3. NPV discounts a flat annual EBITDA annuity at WACC over the project life (constant cash flow
   assumption — no ramp-up years, unlike the backend engine's 5/10-year capacity-factor curve).
4. IRR solves the same flat-annuity cash-flow stream by Newton-Raphson.
5. LCOC and break-even price both normalise total cost to net annual VCU volume; comparing them to
   the effective/current price drives the "✓ Attractive / ~ Marginal / ✗ Sub-threshold" verdict in
   the Price Sensitivity table (`irr ≥ wacc+3` / `irr ≥ wacc` / else).
6. The Price Sensitivity tab (Tab 7) re-runs `calcNbsFinancing` at ten fixed VCU price points
   (6,8,10,12,15,18,22,28,35,45) to build the NPV/IRR sensitivity curves.

### 7.4 Worked example — Afforestation & Reforestation (A/R), default sliders

Inputs: `projectHa=50,000`, `vcuPrice=$12`, `cobenPremPct=20%`, `projectLife=30yr`, `WACC=11%`,
`permanenceBuffer=15%`; A/R archetype: `devCostHa=$1,200`, `vcuYield=8 t/ha/yr`,
`annOpexHa = 1,200×0.04 = $48/ha`.

| Step | Computation | Result |
|---|---|---|
| Total dev cost | 50,000 × $1,200 | **$60.0M** |
| Ann. VCUs (gross) | 50,000 × 8 | 400,000 t |
| Permanence buffer | 400,000 × 15% | 60,000 t |
| Net ann. VCUs | 400,000 − 60,000 | **340,000 t** |
| Effective price | $12 + ($12 × 20%) | **$14.40/t** |
| Ann. revenue | 340,000 × $14.40 | **$4.896M** |
| Ann. opex | 50,000 × $48 | $2.40M |
| Ann. EBITDA | $4.896M − $2.40M | **$2.496M** |
| CRF (30yr, 11%) | 0.11 / (1 − 1.11⁻³⁰) | 0.11504 |
| LCOC | ($60M×0.11504 + $2.40M) / 340,000 | **$27.36/t** |
| Break-even price | ($2.40M + $60M/30) / 340,000 | **$12.94/t** |
| NPV | −$60M + $2.496M × annuity-factor(30,11%≈8.694) | **≈ −$38.3M** |
| IRR | root where annuity-factor(30,r)=60M/2.496M≈24.0 | **≈1.5%** |

At these defaults the project is **value-destructive**: LCOC ($27.36/t) exceeds the effective
price ($14.40/t), IRR (≈1.5%) is far below the 11% WACC hurdle, and NPV is deeply negative —
the page would flag this row "✗ Sub-threshold" in the sensitivity table. This is a real artefact of
the engine's formulas, not a display bug: A/R's much higher `devCostHa` ($1,200 vs REDD+'s $3.2)
overwhelms its VCU revenue at the $12 base price, correctly illustrating why REDD+ dominates VCM
volume while A/R only clears the hurdle at materially higher carbon prices (~$25+/t, visible on the
Price Sensitivity curve).

### 7.5 Companion analytics on the page

- **VCU Market Intelligence** — static `VCU_BENCHMARKS` table (8 standard/type combinations,
  avg price $11.2–$38.4, volumes, `qualityScore` 72–97) — demo figures styled after Ecosystem
  Marketplace reporting conventions, not a live feed.
- **Article 6.4 Pipeline** — 6 seeded sovereign ITMO projects (Brazil, Indonesia, Kenya, Vietnam,
  Colombia, Ghana) with static `priceUsd`/`volume`; `art6Data.valueM = volume × priceUsd`.
- **FI Structuring** — 6 static financing-structure templates (green bond, VCF, blended finance,
  nature performance bond, ERPA, NCS-ABS) with illustrative tenor/coupon/liquidity fields.
- **Risk Framework** — qualitative permanence/additionality/MRV risk register, no scoring formula.

### 7.6 Data provenance & limitations

- Every numeric constant in this page — archetype costs/yields, VCU benchmark prices, Article 6.4
  volumes, market-outlook projections — is **hand-entered demo data with no `sr()` PRNG and no API
  call**; nothing here is derived from the reference-data layer or the real backend engine.
- The real methodology (VCS VM0007 leakage/buffer deductions, VM0033/VM0024 blue-carbon rates,
  IUCN GS v2.0 8-criteria scoring, IPCC Tier 1–3 soil carbon, ICVCM CCP-compatible quality/pricing)
  lives entirely in `backend/services/nature_based_solutions_engine.py` and is **not reachable from
  this page** — it appears to serve a different, unlinked route or an API consumer this UI doesn't
  use.
- The finance engine assumes flat, non-ramping annual EBITDA for the full project life — no
  establishment-year yield curve (the backend engine's 60%/85%/100% capacity ramp for years 1–5,
  6–10, 11+ is the more realistic pattern and is absent here).
- IRR uses unbounded Newton-Raphson (200 iterations, no clamp) — can diverge or return
  economically meaningless values for extreme parameter combinations (e.g., very low revenue vs.
  large upfront cost), though no evidence of this was observed in tested ranges.

**Framework alignment:** IUCN Global Standard for NbS v2.0 (referenced by name in the disconnected
backend engine, not implemented here) · Verra VCS methodologies (VM0007 REDD+, VM0033/VM0024 blue
carbon) named throughout the guide/backend but not executed in the UI · Article 6.4 Paris Agreement
mechanism (ITMO, corresponding adjustment, share of proceeds) — descriptive only, no CA
verification logic · CCB Standards / Gold Standard SDG co-benefit certification — named in
static tables, not scored.
