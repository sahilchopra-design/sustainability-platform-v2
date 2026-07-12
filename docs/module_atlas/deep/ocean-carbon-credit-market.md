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
