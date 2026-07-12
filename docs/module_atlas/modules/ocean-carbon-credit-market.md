# Ocean Carbon Credit Market Analytics
**Module ID:** `ocean-carbon-credit-market` · **Route:** `/ocean-carbon-credit-market` · **Tier:** B (frontend-computed) · **EP code:** EP-DZ1 · **Sprint:** DZ

## 1 · Overview
Ocean-based carbon credit market analytics covering kelp/macroalgae, ocean alkalinity enhancement, seagrass, and shellfish aquaculture credits. Compares MRV methodologies, permanence challenges, and emerging price benchmarks.

> **Business value:** Provides market intelligence on the nascent ocean CDR credit market, integrating MRV maturity scoring, permanence risk assessment, and price benchmarking to guide procurement decisions.

**How an analyst works this module:**
- Map ocean CDR pathway portfolio across biological (kelp, seagrass, shellfish) and chemical (OAE) categories
- Score MRV maturity for each pathway: methodology approval status, monitoring approach, verification body availability
- Assess permanence risk and assign permanence tier (geological, century-scale, decadal)
- Benchmark prices against advance purchase data and model portfolio risk-return under different pathway mixes

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BUYERS`, `CREDIT_TYPES`, `FORWARD_CURVE`, `Kpi`, `PRICE_HISTORY`, `QUALITY_METRICS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CREDIT_TYPES` | 7 | `name`, `registry`, `methodology`, `price2025`, `priceRange`, `volume2025Mt`, `qualityScore`, `permanence`, `additionalityScore`, `cobenefits`, `vintage`, `buyers` |
| `PRICE_HISTORY` | 8 | `mangrove`, `seagrass`, `saltmarsh`, `oae` |
| `BUYERS` | 7 | `sector`, `commitment`, `annualBudgetM`, `prefEco`, `avgPriceUsd` |
| `FORWARD_CURVE` | 7 | `spot`, `fwd1yr`, `fwd3yr`, `fwd5yr` |
| `QUALITY_METRICS` | 7 | `weight`, `description` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `avgPrice` | `CREDIT_TYPES.length > 0 ? CREDIT_TYPES.reduce((s, c) => s + c.price2025, 0) / CREDIT_TYPES.length : 0;` |
| `totalBuyerBudget` | `BUYERS.reduce((s, b) => s + b.annualBudgetM, 0);` |
| `portfolioTotal` | `portfolio.length > 0 ? portfolio.reduce((s, p) => s + p.credits, 0) : 0;` |
| `portfolioAvgPrice` | `portfolio.length > 0 ? portfolio.reduce((s, p) => s + p.price * p.credits, 0) / portfolioTotal : 0;` |
| `affordableCredits` | `Math.floor(budget * 1e6 / 6 / c.price2025);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BUYERS`, `CREDIT_TYPES`, `FORWARD_CURVE`, `PRICE_HISTORY`, `QUALITY_METRICS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Ocean CDR Price Range | `Market price range across ocean CDR methods by permanence and MRV maturity` | CDR.fyi and Frontier ocean procurement data | OAE/geological storage at high end ($100-180); macroalgae at low end ($20-50) due to permanence uncertainty |
| MRV Maturity Score | `Average MRV maturity across ocean CDR pathways (methodology approval, monitoring, verification)` | Verra/ISO methodology pipeline | Most ocean CDR pathways at pilot stage; geological marine CCS highest maturity; macroalgae/OAE pre-commercial |
| Ocean CDR Market Volume | `Total forward commitments and spot purchases of ocean-based CDR credits (2023)` | CDR.fyi ocean segment data | Nascent but rapidly growing; Stripe/Shopify advance purchases driving methodology development |
- **CDR.fyi ocean segment transaction database** → Forward commitment prices, volumes, MRV approach → market price benchmarking → **Ocean CDR price discovery**
- **Verra/Gold Standard methodology pipeline** → Methodology development status for ocean pathways → MRV maturity scoring → **Methodology risk assessment**
- **NOAA ocean monitoring data** → pCO2, alkalinity, dissolved inorganic carbon → physical baseline for MRV → **Ocean carbon flux quantification**

## 5 · Intermediate Transformation Logic
**Methodology:** Ocean CDR Credit Pricing & MRV Maturity
**Headline formula:** `Ocean CDR Price = f(Permanence Tier, MRV Maturity, Co-benefit Score); Permanence-Adjusted Value = Spot Price × Permanence Factor × (1 - Reversal Risk)`

Market analytics integrating MRV maturity scoring, permanence risk assessment, and emerging price benchmarks across ocean CDR pathways

**Standards:** ['High Level Panel for a Sustainable Ocean Economy — Ocean Carbon Guide', 'NOAA Ocean Carbon Research Programme', 'Verra VCS emerging ocean methodology pipeline']
**Reference documents:** High Level Panel for a Sustainable Ocean Economy (2023) Ocean Carbon Guide; NOAA (2023) Ocean Acidification and Carbon Cycle Research — CDR Implications; Carbon180 (2023) Ocean CDR State of the Field; Frontier Climate (2023) Ocean CDR Procurement and MRV Standards

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide states a formula
> `Ocean CDR Price = f(Permanence Tier, MRV Maturity, Co-benefit Score)`. **No such function exists
> in code.** Every price in `CREDIT_TYPES`, `PRICE_HISTORY`, and `FORWARD_CURVE` is a **hand-entered
> static number** — there is no computation deriving price from permanence, MRV maturity, or
> co-benefit inputs anywhere in the file. What the module actually provides is a well-curated,
> deterministic (no `sr()` PRNG at all) static market-intelligence reference, plus one simple
> portfolio-affordability arithmetic tool.

### 7.1 What the module computes

- **`CREDIT_TYPES`** (6 rows) — Mangrove Restoration (Verra VM0033, $32/t), Seagrass Restoration
  (Verra VM0024, $24/t), Salt Marsh Conservation (Gold Standard, $28/t), Open-Ocean Kelp Farming
  (emerging/CAR, $14/t), MPA Debt-for-Nature (sovereign bespoke, $38/t), Ocean Alkalinity
  Enhancement (Frontier/CAR OAE Protocol, $280/t) — each with `qualityScore`, `permanence` tier,
  `additionalityScore`, `cobenefits`, and real named buyer lists (Microsoft, Shell, Delta, Apple,
  Stripe, Frontier).
- **`PRICE_HISTORY`** (2019–2025, 4 series) — mangrove $8→$32, OAE $80→$280 — a monotonic price-
  discovery narrative consistent with the real voluntary-carbon-market blue-carbon price
  appreciation story (2019–2022 VCM boom, subsequent quality-driven premium for high-permanence
  categories).
- **`FORWARD_CURVE`** (2025–2030 vintage, 4 tenor points: spot/1yr/3yr/5yr forward) — a static
  contango curve (5yr forward roughly 1.4–1.7× spot across vintages) reflecting the real dynamic of
  advance-purchase agreements pricing in expected future scarcity/quality premiums.
- **`QUALITY_METRICS`** (6 dimensions, weights summing to 100%: Additionality 25%, Permanence 25%,
  MRV Rigour 20%, Co-Benefits 15%, Registry Oversight 10%, Buyer Transparency 5%) — a real-looking
  weighting scheme, but **not applied anywhere**: no code multiplies a project's scores by these
  weights to produce a composite quality index; `qualityScore` on each `CREDIT_TYPES` row is a
  single pre-set number, not a weighted sum of sub-scores.

### 7.2 Parameterisation — the one live formula (Portfolio Builder)

```js
avgPrice           = Σ price2025 / 6                              // simple unweighted mean across credit types
totalBuyerBudget    = Σ BUYERS.annualBudgetM                        // $M
affordableCredits(c) = floor(budget×1e6 / 6 / c.price2025)          // budget split evenly across all 6 types
portfolioAvgPrice   = Σ(price×credits) / Σcredits                    // volume-weighted average, once holdings added
```

The `/6` in `affordableCredits` implicitly assumes an **equal-weight allocation** across all six
credit types (i.e. "if I split my budget evenly six ways, how many of *this* type could I afford")
— it is not a portfolio optimiser; each "+ Add" button adds that type's implied equal-share
quantity, and a user could click all six to build an equal-notional (not equal-quality-adjusted)
portfolio.

### 7.3 Calculation walkthrough

1. **Overview** — `totalVolume = Σ volume2025Mt` (6.62 Mt across all types); `avgPrice` (simple
   mean, $69.3/t — dominated by OAE's $280 outlier since it's an unweighted average of just 6 rows,
   not volume-weighted, so the "AVG SPOT PRICE" KPI is materially higher than the volume-weighted
   blue-carbon average would be).
2. **Price History / Forward Curve** — static line charts, no extrapolation formula.
3. **Buyer Landscape** — lists 6 real corporate/offtake buyers with stated commitments, annual
   budgets, and preferred ecosystem types — informational, not scored.
4. **Quality Framework** — displays the 6-dimension weighting scheme as a reference rubric (bar
   chart of weights) without applying it to any project.
5. **Portfolio Builder** — user sets a budget slider ($1–50M), clicks "+ Add" per credit type to
   build a holdings list; `portfolioAvgPrice` then correctly volume-weights the *added* holdings'
   prices.

### 7.4 Worked example

`avgPrice = (32+24+28+14+38+280)/6 = 416/6 = $69.33/t` — note this single number is presented as
"AVG SPOT PRICE ... Excl. OAE premium" even though OAE's $280 *is* included in the sum, making the
label misleading (a true "excl. OAE" average of the other 5 types would be `(32+24+28+14+38)/5 =
$27.20/t`, a very different and more representative blue-carbon benchmark).

Portfolio Builder at `budget=$5M`: `affordableCredits(mangrove) = floor(5,000,000/6/32) =
floor(26,041.67) = 26,041 tCO₂`; `affordableCredits(OAE) = floor(5,000,000/6/280) =
floor(2,976.19) = 2,976 tCO₂`. Clicking "+ Add" on both would yield a 2-holding portfolio with
`portfolioTotal = 26,041+2,976 = 29,017` credits and
`portfolioAvgPrice = (32×26,041 + 280×2,976)/29,017 = (833,312+833,280)/29,017 ≈ $57.35/t` —
correctly volume-weighted once holdings exist, even though the underlying "how much can I afford"
step used the flat equal-split assumption.

### 7.5 Data provenance & limitations

- No `sr()` PRNG anywhere in this file — all figures are fixed, reproducible reference values, a
  genuinely more auditable pattern than the platform's PRNG-heavy peer modules.
- Prices, methodologies (VM0033/VM0024), registries, and named buyers are **plausible and
  consistent with real 2024–2025 blue-carbon market reporting** (Verra's VM0033/VM0024 are real
  methodology codes; Stripe/Frontier's advance-purchase role in OAE is a real, widely reported
  market dynamic) — but none of it is sourced to a specific dataset citation in-code (unlike, e.g.,
  `BIODIVERSITY_COUNTRY_DATA`'s explicit IUCN/WDPA/BII source comments elsewhere on the platform).
- The "AVG SPOT PRICE ... Excl. OAE premium" KPI label is inaccurate — OAE is included in the
  unweighted mean, materially inflating the headline number relative to what a genuinely
  OAE-excluded or volume-weighted average would show.
- `QUALITY_METRICS` weights are displayed but never applied — a real quality-adjusted price index
  (price per unit of `Σ weight×dimension_score`) is described by the rubric but not implemented.

**Framework alignment:** Verra VCS VM0033 (Tidal Wetland and Seagrass Restoration) / VM0024
(Coastal Wetland Creation) — correctly cited real methodology codes for mangrove/seagrass credits ·
Frontier / Stripe Climate advance market commitment — correctly represents the real-world role these
platforms play in funding pre-commercial CDR pathways (OAE, DAC) · ICVCM Core Carbon Principles —
named implicitly via the `QUALITY_METRICS` rubric's additionality/permanence/MRV/co-benefit
structure, which mirrors ICVCM's actual assessment dimensions, though not wired into any score.

## 9 · Future Evolution

### 9.1 Evolution A — Apply the quality-weighting scheme and derive prices (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag: the guide states `Ocean CDR Price = f(Permanence Tier, MRV Maturity, Co-benefit Score)`, but every price in `CREDIT_TYPES`/`PRICE_HISTORY`/`FORWARD_CURVE` is hand-entered — no function derives price from those inputs. Notably, the `QUALITY_METRICS` table (Additionality 25%, Permanence 25%, MRV Rigour 20%, Co-Benefits 15%, Registry 10%, Buyer Transparency 5%, summing to 100%) is a real weighting scheme that is *never applied* — `qualityScore` per credit type is a preset number, not a weighted composite. The good news: this module is fully deterministic (no `sr()`), and the data is well-curated. Evolution A wires the scheme it already contains.

**How.** (1) Compute `qualityScore` as the actual weighted sum of per-dimension sub-scores using the `QUALITY_METRICS` weights, so a credit type's quality is auditable and responds to its additionality/permanence/MRV inputs. (2) Implement the guide's permanence-adjusted value (`Spot × PermanenceFactor × (1 − ReversalRisk)`) as a real derivation, connecting to the sibling `offset-permanence-risk` module's reversal-probability logic rather than a static number. (3) Anchor `PRICE_HISTORY`/`FORWARD_CURVE` to real advance-purchase data where public (Frontier/Stripe disclose settlement prices; named in §5) with a dated reference table, keeping the curve shape but grounding the anchors.

**Prerequisites.** Per-dimension sub-scores must be added to each `CREDIT_TYPES` row (currently only the composite exists); Frontier/CDR.fyi price data has partial public coverage — honest-null where unavailable. **Acceptance:** `qualityScore` reproduces from the weighted sub-scores; changing a credit's permanence tier moves its permanence-adjusted value; prices carry source/vintage.

### 9.2 Evolution B — Ocean-CDR procurement copilot (LLM tier 1 → 2)

**What.** A copilot for the buyer/procurement users §1 targets: "which ocean CDR pathways offer geological-scale permanence?", "how does OAE at $280/t compare on quality-adjusted value to mangrove at $32/t?", "what's the forward curve for kelp credits?" — grounded in the six real credit types (with named buyers Microsoft/Stripe/Frontier), the quality-metric scheme, and the HLP Ocean Carbon / Frontier references named in §5.

**How.** Tier 1 works on the curated deterministic data: system prompt from this Atlas page's §7.1 tables; the copilot compares pathways citing real permanence tiers, MRV status, and buyer lists. Tier 2, post-Evolution-A: tool calls to the quality-composite and permanence-adjusted-value functions for computed comparisons, with the fabrication validator matching quoted prices and scores to outputs. The copilot must flag that ocean CDR is nascent (methodologies emerging, prices thin) and refuse to present the forward curve as a market quote rather than an illustrative advance-purchase projection.

**Prerequisites.** Tier 1 on current data with as-of disclosure; quality/value computation needs Evolution A. **Acceptance:** pathway comparisons cite real credit-type attributes; quality-adjusted values (post-Evolution-A) trace to the weighted-sum function; forward-curve answers carry the illustrative-projection caveat.