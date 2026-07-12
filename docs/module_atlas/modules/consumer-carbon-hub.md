# Consumer Carbon Hub
**Module ID:** `consumer-carbon-hub` · **Route:** `/consumer-carbon-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Analyses Scope 3 Category 11 consumer use-phase emissions for product portfolios, computing product lifecycle GHG profiles, use-phase intensity benchmarks, and product-level decarbonisation pathway options. Enables manufacturers and retailers to meet GHG Protocol Category 11 reporting requirements and set science-based product targets.

> **Business value:** Helps manufacturers and retailers quantify and reduce the largest component of many companies’ Scope 3 footprints, supporting SBTi product-level targets, CSRD ESRS E1 disclosure, and product-level climate labelling initiatives.

**How an analyst works this module:**
- Upload product registry with sales volumes, energy consumption, and market geographies
- Use-Phase Profiles tab shows emission intensity per product category with benchmark comparison
- Grid Sensitivity tab models how emission factors change under energy transition scenarios
- Reduction Pathways tab identifies highest-impact product redesign and efficiency options
- Category 11 Report generates GHG Protocol-compliant Scope 3 Category 11 disclosure table
- Set product-level SBTi FLAG or sectoral targets and track progress on Targets tab

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CARBON_FACTS`, `CARBON_GLOSSARY`, `CARBON_MILESTONES`, `CARBON_TIPS`, `COMMUNITY_LEADERBOARD`, `IMPACT_COMPARISONS`, `LS_CART`, `LS_CONFIG`, `LS_RECEIPTS`, `LS_WALLET`, `MODULE_CARDS`, `ONBOARDING_STEPS`, `PIE_COLORS`, `WEEKLY_CHALLENGES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `MODULE_CARDS` | 6 | `title`, `desc`, `path`, `color`, `icon` |
| `ONBOARDING_STEPS` | 5 | `title`, `desc` |
| `CARBON_MILESTONES` | 6 | `title`, `desc` |
| `WEEKLY_CHALLENGES` | 5 | `challenge`, `target_save_kg`, `difficulty` |
| `CARBON_GLOSSARY` | 9 | `definition` |
| `IMPACT_COMPARISONS` | 7 | `equivalent` |
| `COMMUNITY_LEADERBOARD` | 11 | `name`, `score`, `streak` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n, d=1) => n >= 1000 ? (n/1000).toFixed(d)+'k' : Number(n).toFixed(d);` |
| `blob` | `new Blob([hdr+'\n'+body], { type:'text/csv' });` |
| `badge` | `(bg, color) => ({ display:'inline-block', padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:600, background:bg, color });` |
| `totalCarbonYTD` | `useMemo(() => txns.reduce((s, t) => s + (t.carbon_kg \|\| 0), 0), [txns]);` |
| `dailyAvg` | `txns.length > 0 ? (totalCarbonYTD / Math.max(1, new Set(txns.map(t => (t.date \|\| '').slice(0, 10))).size)) : 0;` |
| `budgetUsedPct` | `wallet.budget_kg ? (totalCarbonYTD / wallet.budget_kg * 100) : 0;` |
| `sorted` | `Object.entries(cats).sort((a, b) => b[1] - a[1]);` |
| `carbonPerDollar` | `useMemo(() => { const totalSpend = txns.reduce((s, t) => s + (t.amount \|\| 0), 0);` |
| `carbonSaved` | `useMemo(() => txns.reduce((s, t) => s + (t.saved_kg \|\| 0), 0), [txns]);` |
| `treesToOffset` | `totalCarbonYTD > 0 ? Math.ceil(totalCarbonYTD / 22) : 0;` |
| `carbonScore` | `Math.max(0, Math.min(100, Math.round(100 - budgetUsedPct)));` |
| `dates` | `[...new Set(txns.map(t => (t.date \|\| '').slice(0, 10)))].sort().reverse();` |
| `diff` | `Math.round((today - d) / 86400000);` |
| `pct` | `Math.min(100, (d.value / d.target) * 100);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CARBON_FACTS`, `CARBON_GLOSSARY`, `CARBON_MILESTONES`, `CARBON_TIPS`, `COMMUNITY_LEADERBOARD`, `IMPACT_COMPARISONS`, `MODULE_CARDS`, `ONBOARDING_STEPS`, `PIE_COLORS`, `WEEKLY_CHALLENGES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Category 11 Emissions | — | GHG Protocol | Total use-phase Scope 3 Category 11 emissions across product portfolio |
| Use-Phase Intensity | — | Product LCA | GHG intensity per unit sold during consumer use phase over product lifetime |
| Grid Emission Factor | — | IEA Electricity Information | Country-specific grid emission factor used for electrically powered product use-phase |
| Product Lifetime (avg) | — | Sector conventions / ADEME | Average assumed useful life of products used in Category 11 calculation |
| Category 11 % of Total Scope 3 | — | GHG Protocol | Proportion of total Scope 3 footprint attributable to consumer use phase |
- **Product registry and sales records** → Match to energy consumption specifications per product SKU → **Use-phase activity data by product**
- **IEA grid emission factor database** → Match sales geography to country EF, apply annual updates → **Country-weighted grid EF per product market**
- **GHG Protocol Cat11 model** → Compute units × EF × lifetime, aggregate by category → **Category 11 total and intensity metrics**

## 5 · Intermediate Transformation Logic
**Methodology:** Use-Phase Lifecycle Emission Model
**Headline formula:** `Cat11_total = Σ_p (Units_sold_p × UsePhase_EF_p × Lifetime_p)`

Use-phase emission factor (EF) is derived from product energy consumption during typical use (kWh/year or litres/year) multiplied by the relevant grid or combustion emission factor. For electrical products, grid EF follows IEA country-specific factors updated annually. Product lifetime assumptions follow sector conventions (appliances 10–15yr, vehicles 12yr, electronics 5yr). Intensity benchmark: tCO₂e per unit revenue or per unit sold.

**Standards:** ['GHG Protocol Scope 3 â€” Category 11', 'ISO 14044 LCA', 'IEA Grid Emission Factors']
**Reference documents:** GHG Protocol Corporate Value Chain (Scope 3) Standard â€” Category 11; ISO 14044:2006 Environmental Management â€” Life Cycle Assessment; IEA CO₂ Emissions from Fuel Combustion 2024; SBTi Technical Criteria for Product-Level Targets

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Build the corporate Category 11 engine the guide describes; keep the personal hub honest (analytics ladder: rung 1 → 2)

**What.** §7 flags a wrong-domain mismatch: the guide specifies a corporate Scope 3
Category 11 use-phase engine (`Cat11 = Σ Units_sold × UsePhase_EF × Lifetime`), but
the code is a consumer-facing personal carbon hub — a genuinely functional one, with a
real `localStorage` transaction ledger and no PRNG in the analytic path, but with zero
products, grid EFs, or Cat-11 output. Evolution A resolves the split honestly: build
the §8 corporate model as the module's stated identity, and fix the hub's one
documented inconsistency (the `carbonScore` explainer claims a multi-factor 40%
weighting while the code computes only `100 − budgetUsedPct`).

**How.** (1) Cat-11 engine: product registry (category, units sold, kWh/yr or
litres/yr, lifetime, sales geography) → use-phase EF = energy × grid EF, with grid
factors from a curated IEA country table in refdata and sector-convention lifetimes
(appliances 10–15yr, vehicles 12yr, electronics 5yr) as documented defaults.
(2) Scenario dimension (rung 2): grid-decarbonisation trajectories per NGFS/announced-
pledges pathways change the use-phase EF over the product lifetime — the "Grid
Sensitivity" tab the guide names. (3) Cat-11 disclosure table per GHG Protocol,
exportable toward ESRS E1. (4) Personal hub: either align the explainer text to the
actual score or implement the claimed weighting — one-line honesty fix either way.

**Prerequisites.** IEA grid-EF table curation (published values, versioned); a
products data model (this module's first backend vertical if server-side).
**Acceptance:** a hand-computed product case (e.g. 1M washing machines × 200 kWh/yr ×
12yr × grid EF) reproduces; switching grid scenario changes lifetime emissions
monotonically; the carbonScore explainer matches the computed formula.

### 9.2 Evolution B — Personal footprint coach over the user's own ledger (LLM tier 1)

**What.** The hub's existing assets — a real user transaction ledger, 50 editorial
tips with per-action CO₂e estimates, milestones, challenges — are exactly the corpus
for a personal carbon coach: "why did my score drop this month?" (budget arithmetic
over the user's own `txns`), "what single change helps most?" (rank the tip library
against the user's actual category spend), "am I on the 2.3t budget?" — all grounded
in ledger data and the static tip estimates, never in invented personal figures.

**How.** Tier-1, fully client-context: the ledger and wallet state pass into the
prompt (privacy note: this is the user's own device data — no server persistence
without consent), with the tip library and glossary as the knowledge base. The coach
attributes every kg figure to either a ledger transaction or a named tip's published
estimate, and explains the score as the code computes it (`100 − budgetUsedPct`),
not as the explainer previously claimed. Post-Evolution A, a separate corporate-mode
copilot can ground on the Cat-11 engine — but that is a different user and should be
a different prompt.

**Prerequisites.** The carbonScore explainer fix (the coach must not perpetuate the
40%-weighting fiction); empty-ledger handling (first-run users get onboarding
guidance, not fabricated baselines). **Acceptance:** advice ranks tips by computed
overlap with the user's actual spend categories; every numeric matches ledger sums or
a cited tip constant; with an empty ledger the coach asks for data rather than
estimating a footprint.