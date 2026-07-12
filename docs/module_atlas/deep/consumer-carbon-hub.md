## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (wrong domain).** The MODULE_GUIDES entry describes a **corporate Scope 3
> Category 11 use-phase engine** — `Cat11_total = Σ_p (Units_sold × UsePhase_EF × Lifetime)`, IEA grid
> emission factors, product LCA, SBTi product targets, GHG-Protocol Cat-11 disclosure. **The code is a
> consumer-facing personal carbon hub** — a landing/hub page with gamified onboarding, a personal
> "carbon wallet", tips, milestones, weekly challenges, and a leaderboard. There are no products, no
> units-sold, no use-phase emission factors, no lifetime terms, no GHG-Protocol Category 11 table. The
> two are unrelated. The sections below document the personal-hub code as it behaves; §8 specifies the
> corporate Cat-11 model the guide advertises (a genuinely useful production model the page should host
> under its stated title, but does not).

### 7.1 What the module computes

The hub reads a personal transaction ledger from `localStorage` (`ra_carbon_wallet_v1`) and derives
personal footprint KPIs:

```js
totalCarbonYTD = Σ txns.carbon_kg
dailyAvg       = totalCarbonYTD / uniqueDaysLogged          (guarded ≥1)
budgetUsedPct  = wallet.budget_kg ? totalCarbonYTD / budget_kg × 100 : 0
carbonPerDollar= totalSpend > 0 ? totalCarbonYTD / totalSpend : 0
treesToOffset  = ceil( totalCarbonYTD / 22 )                (22 kg CO₂/tree/yr)
carbonScore    = clamp( round(100 − budgetUsedPct) , 0 , 100 )
```

`carbonScore` is the headline gamification metric. Its "explainer" tab attributes 40% weight to *Budget
Adherence* (`100 − budgetUsedPct`) plus other factors, but the actual computed score is purely
`100 − budgetUsedPct` clamped to 0–100.

### 7.2 Parameterisation / scoring rubric

| Constant | Value | Provenance |
|---|---|---|
| Tree offset factor | `22` kg CO₂/tree/yr | Standard rule-of-thumb (stated in a tip: "one tree ≈ 22 kg/yr") |
| Default annual budget | `2300` kg (2.3 t) | 1.5 °C personal budget (IPCC-derived, stated in milestone data) |
| Carbon-score bands | ≥70 green · 40–69 amber · <40 red | Hard-coded display bands |
| Milestones | 100/500/1000/2300/5000 kg | Gamification thresholds |
| Tips / facts | 50 tips, 10 facts | Editorial content (per-item CO₂e figures are literature rules-of-thumb) |

No `sr()` PRNG in the analytic path — data is the user's own logged transactions (empty on first run).
The 50 carbon tips embed real per-action estimates (beef→veggie 2.9 kg, tap vs bottled 300×, etc.) as
static copy, not as a calculation engine.

### 7.3 Calculation walkthrough

1. On mount, `readLS` loads `wallet`, `txns`, `config` from `localStorage` (populated by sibling modules
   Carbon Calculator / Wallet / Invoice Parser).
2. `totalCarbonYTD` sums transaction `carbon_kg`; `budgetUsedPct` divides by the wallet budget;
   `carbonScore = 100 − budgetUsedPct` clamped.
3. The monthly chart buckets transactions by `YYYY-MM` and compares to `budget_kg/12`.
4. Milestones unlock when `totalCarbonYTD ≥ threshold`; recommendations sum `save_kg` and divide by 22 to
   show "trees equivalent". Export writes a JSON score card.

### 7.4 Worked example

A user with `txns` summing `carbon_kg = 1,150` and a default budget `2,300` kg:
`budgetUsedPct = 1150/2300×100 = 50%`; `carbonScore = clamp(round(100−50)) = 50` (amber);
`treesToOffset = ceil(1150/22) = 53` trees; if they logged across 90 unique days,
`dailyAvg = 1150/90 = 12.8 kg/day`. The "Budget Master" milestone (2,300 kg) is **not** unlocked
(1,150 < 2,300); "Carbon Aware" (1,000 kg) is. None of this touches product units, EFs, or lifetimes.

### 7.5 Companion analytics on the page

Hub cards linking to 5 sibling modules (Calculator, Wallet, Invoice Parser, Spending Analyzer, Carbon
Economy), an onboarding stepper, a monthly footprint chart, a carbon-score ring + explainer, milestone
badges, weekly challenges, a glossary, impact comparisons, and a community leaderboard (fixed 11-row
`COMMUNITY_LEADERBOARD`). No backend engine or route; all state is client-side `localStorage`.

### 7.6 Data provenance & limitations

- **Personal ledger data**, not synthetic — but empty until the user logs purchases via sibling modules.
  The leaderboard, tips, facts, and challenges are static editorial content.
- The `carbonScore` explainer *claims* a multi-factor weighting (40% budget adherence + others) that the
  code does not compute — the real score is `100 − budgetUsedPct` only. Minor guide↔UI inconsistency.
- No corporate product data, no IEA grid EFs, no Category 11 disclosure — the guide's entire subject is
  absent.

**Framework alignment:** The page's personal framing loosely echoes the **GHG Protocol** Scope 1/2/3
definitions (in the glossary) and a **1.5 °C personal carbon budget** (2.3 t/yr, IPCC-consistent), but it
implements neither corporate accounting nor SBTi targets. The guide's cited standards — *GHG Protocol
Scope 3 Category 11*, *ISO 14044 LCA*, *IEA grid emission factors*, *SBTi product-level criteria* — belong
to the model in §8, none of which is present in code.

---

## 8 · Model Specification — Scope 3 Category 11 Use-Phase Emissions Engine

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Compute a manufacturer/retailer's Scope 3 Category 11 (use of sold products) emissions across a product
portfolio, plus per-product use-phase intensity and decarbonisation-pathway options, to meet GHG-Protocol
Cat-11 reporting and set SBTi product/sectoral targets. Coverage: energy-using and fuel-using products.

### 8.2 Conceptual approach
Apply the **GHG Protocol Corporate Value Chain (Scope 3) Standard, Category 11** direct-use-phase method:
lifetime energy/fuel consumption × the relevant grid or combustion emission factor × units sold. Grid
factors follow **IEA country-specific electricity EFs** (updated annually); the scenario overlay follows
**IEA WEO/NZE** grid-decarbonisation pathways — the same structure S&P Trucost and product-LCA tools use.

### 8.3 Mathematical specification
```
Cat11_p = Units_sold_p × AnnualUse_p × Lifetime_p × EF_market(geo_p, fuel_p)
Cat11_total = Σ_p Cat11_p
Intensity_p = Cat11_p / Units_sold_p              (tCO₂e/unit) or / Revenue_p
Scenario_t  : EF_grid(geo, t) declines along IEA NZE  ⇒  Cat11_future_p(t)
```
| Parameter | Symbol | Calibration source |
|---|---|---|
| Annual energy use | `AnnualUse_p` | Product test data / EU energy label / ENERGY STAR |
| Product lifetime | `Lifetime_p` | Sector convention (appliances 10–15 yr, electronics 5 yr, vehicles 12 yr) — ADEME/IEC |
| Grid EF | `EF_market` | IEA Emission Factors; national grid mixes; market-vs-location per GHGP Scope 2 guidance |
| Combustion EF | fuel | IPCC 2006 GLs / EPA EFs for fuel-using products |
| Grid pathway | `EF_grid(t)` | IEA WEO/NZE, NGFS grid-intensity trajectories |

### 8.4 Data requirements
Product registry: SKU, units sold, sales geography, energy/fuel consumption spec, assumed lifetime. Free
sources: IEA EF database, EU product energy labels, EPA/IPCC combustion EFs. The platform holds no product
registry today; grid EFs could be sourced from the `reference_data` layer (IEA/OWID energy tables already
ingested). Category-11 output would feed the corporate Scope 3 engine and CSRD ESRS E1 disclosure.

### 8.5 Validation & benchmarking plan
Reconcile Cat-11 totals against the company's disclosed Scope 3 Category 11 figure and against product-LCA
studies; check Cat-11 share of total Scope 3 lands in the empirical 20–65% band for use-phase-heavy
sectors. Sensitivity on lifetime and grid-EF assumptions (the two dominant drivers). Benchmark intensity
per unit against S&P Trucost / sector averages.

### 8.6 Limitations & model risk
Use-phase EFs are highly sensitive to consumer behaviour and grid mix — report location- and market-based
variants and a lifetime sensitivity band. Behavioural rebound and product-mix drift are unmodelled;
condition on IEA NZE grid decarbonisation to avoid overstating future emissions. Conservative fallback:
use location-based grid EFs (typically higher) and lower-bound lifetimes so Cat-11 is not understated.
