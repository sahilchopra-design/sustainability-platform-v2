# Nuclear Fuel Cycle Economics
**Module ID:** `nuclear-fuel-cycle` · **Route:** `/nuclear-fuel-cycle` · **Tier:** B (frontend-computed) · **EP code:** EP-DU5 · **Sprint:** DU

## 1 · Overview
End-to-end nuclear fuel cycle cost analysis from uranium mining through conversion, enrichment, fabrication and used fuel management, including SWU pricing, MOX economics and HALEU supply chain for advanced reactors.

> **Business value:** Nuclear fuel cycle costs of $5–$15/MWh are dominated by enrichment (SWU at $100–$160) and fabrication; HALEU supply constraints impose a 3–5× SWU premium critical to advanced reactor economics.

**How an analyst works this module:**
- Map fuel cycle stages: mining → conversion → enrichment → fabrication → used fuel
- Cost each stage per kgHM and convert to $/MWh at design burnup
- Compare once-through vs MOX closed-cycle economics
- Assess HALEU supply chain bottlenecks and cost premium for Gen IV reactors

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BACKEND_STRATEGIES`, `ENRICHERS`, `FUEL_TYPES`, `HALEU_SOURCES`, `KpiCard`, `MINES`, `Slider`, `TABS`, `WASTE_CLASSES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `MINES` | 9 | `country`, `type`, `u3o8Mlbs`, `grade`, `owner`, `cost` |
| `ENRICHERS` | 7 | `country`, `swuM`, `techology`, `share` |
| `FUEL_TYPES` | 7 | `enrichment`, `weight`, `pelletDiam`, `cost`, `burn` |
| `HALEU_SOURCES` | 6 | `status`, `capacity`, `enrichPct`, `restricted` |
| `BACKEND_STRATEGIES` | 5 | `countries`, `snf`, `cost`, `timeYr`, `wasteVol` |
| `WASTE_CLASSES` | 5 | `source`, `vol`, `activity`, `disposal` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `swuPerKgProduct` | `(v(productAssay / 100) - v(tailsAssay / 100)) - (feedAssay / 100 / (productAssay / 100) * (v(feedAssay / 100) - v(tailsAssay / 100)));` |
| `feedKg` | `kgU * (productAssay / 100 - tailsAssay / 100) / (feedAssay / 100 - tailsAssay / 100);` |
| `swuPerKg` | `(2 * enrichPct / 100 - 1) * Math.log((enrichPct / 100) / (1 - enrichPct / 100))` |
| `u3o8Cost` | `feedKg * u3o8Price / 0.848; // U3O8 → UF6 conversion factor` |
| `convCost` | `feedKg * conversionFee;` |
| `swuCost` | `swuPerKg * kgU * swuPrice;` |
| `u3o8Spot` | `useMemo(() => Array.from({ length: 24 }, (_, i) => ({ mo: `${2023 + Math.floor((i) / 12)}-Q${(i % 4) + 1}`, spot: +(45 + sr(i * 7) * 40 + i * 1.1).toFixed(1), long: +(50 + sr(i * 11) * 30 + i * 0.9).toFixed(1), })), []);` |
| `swuPriceSeries` | `useMemo(() => Array.from({ length: 20 }, (_, i) => ({ year: 2015 + i, swu: +(95 + sr(i * 13) * 60 + (i > 8 ? (i - 8) * 3 : 0)).toFixed(1), })), []);` |
| `mineData` | `MINES.map(m => ({ name: m.name.split(" ")[0], production: m.u3o8Mlbs, cost: m.cost }));` |
| `haleuGapData` | `useMemo(() => Array.from({ length: 10 }, (_, i) => ({ year: 2025 + i, demand: +(haleuDemand * Math.pow(1.18, i)).toFixed(0), supply: +(2 + (i > 2 ? (i - 2) * 4 : 0)).toFixed(0), })), [haleuDemand]);` |
| `enricherPie` | `ENRICHERS.map((e, i) => ({ name: e.name, value: e.share, fill: COLORS[i] }));` |
| `backendCost` | `BACKEND_STRATEGIES.map(s => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BACKEND_STRATEGIES`, `COLORS`, `ENRICHERS`, `FUEL_TYPES`, `HALEU_SOURCES`, `MINES`, `TABS`, `WASTE_CLASSES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Fuel Cycle Cost | `FCC = Σ(Stage Cost) / (BU × MWe)` | WNA 2023 | Total fuel cost per MWh; low vs fossil fuels, insensitive to uranium price swings. |
| SWU Price | `Market SWU = Enrichment Service Contract Price` | Urenco / USEC market data | Separative work unit price tracking enrichment capacity utilisation. |
| HALEU Enrichment Premium | `HALEU SWU Cost = Standard SWU × Premium Factor` | DOE HALEU Availability Program | High-assay low-enriched uranium (5–20% U-235) required for many advanced reactor designs. |
- **UxC uranium price + SWU market data** → Stage cost model → burnup-adjusted $/MWh → **Fuel cycle cost dashboard by reactor type**

## 5 · Intermediate Transformation Logic
**Methodology:** Fuel Cycle Cost per MWh
**Headline formula:** `FCC = (U₃O₈ + Conversion + Enrichment_SWU + Fabrication + Used_Fuel_Mgmt) / (BU × Capacity)`

Sum of front-end and back-end per-MWh costs at given burnup.

**Standards:** ['WNA — The Nuclear Fuel Cycle', 'EIA — Uranium Marketing Annual Report']
**Reference documents:** World Nuclear Association — The Nuclear Fuel Cycle; EIA — Uranium Marketing Annual Report 2023; DOE — HALEU Availability Program Environmental Assessment

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Code-correctness flag (not a guide mismatch).** This module implements the real enrichment
> **value function** `V(x) = (2x−1)·ln(x/(1−x))` (the standard WNA/industry SWU value function) and a
> correct feed/product mass-balance ratio `F/P = (xp−xt)/(xf−xt)` (used for `feedKg`). But the two
> places that combine these into a **separative-work total each use a different, non-standard
> combination** — neither matches the textbook three-term formula
> `SWU/P = V(xp) + (T/P)·V(xt) − (F/P)·V(xf)`. Traced through with the page's own default slider
> values (below), `calcSwu` returns a **negative** SWU/kg and `calcFuelCost`'s inline SWU term
> returns a **large negative** SWU/kg that drives the "Fuel Cost Modelling" tab's total fuel cost
> **negative** — inconsistent with the guide's own cited $5–15/MWh benchmark. This is documented
> precisely below so it can be fixed.

### 7.1 What the module computes

Two independent cost-engine functions, both starting from the same value function:

```js
v(x) = (2x − 1) · ln(x / (1 − x))                          // industry-standard SWU value function

// calcSwu (SWU Economics tab)
swuPerKgProduct = [v(xp) − v(xt)] − (xf / xp) · [v(xf) − v(xt)]     // ← uses xf/xp, NOT F/P
feedKg          = kgU × (xp − xt) / (xf − xt)                       // ← this IS the correct F/P ratio

// calcFuelCost (Fuel Cost Modelling tab; feedAssay/tailsAssay hard-coded to 0.711/0.3, ignoring sliders)
swuPerKg = v(xp) − [(xp − xt)/(xf − xt)] · v(xf)                    // ← omits the +（T/P)·v(xt) term
u3o8Cost = feedKg × u3o8Price / 0.848                                // U3O8→UF6 conversion factor
convCost = feedKg × conversionFee
swuCost  = swuPerKg × kgU × swuPrice
fabCost  = kgU × fabricationFee
total    = u3o8Cost + convCost + swuCost + fabCost
perMwh   = total / (kgU × 45) / 1000
```

The **correct** textbook formula (derivable from `F=P+T` and the U-235 mass balance
`F·xf = P·xp + T·xt`) is `SWU/P = V(xp) + (T/P)·V(xt) − (F/P)·V(xf)`, where `T/P = (xp−xf)/(xf−xt)`
and `F/P = (xp−xt)/(xf−xt)` — i.e. **three** value-function terms combined with the correct mass-
balance ratios. Neither `calcSwu` nor `calcFuelCost` implements this; each drops or substitutes a
term.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| `feedAssay` (natural U) | 0.711% | Real natural-uranium U-235 abundance — correct |
| `tailsAssay` (depleted U) | 0.3% | Realistic operational tails assay (0.2–0.35% typical) |
| U3O8→UF6 conversion factor | 0.848 | Correct standard stoichiometric factor (1 kg U3O8 ≈ 0.848 kg U as UF6 feed) |
| `MINES` (8 sites) | Cigar Lake, McArthur River, Kazatomprom, Husab, Rössing, Olympic Dam, ERA Ranger, Inkai | Real operating uranium mines with plausible production (Mlbs U3O8) and cost figures |
| `ENRICHERS` (6 firms) | Urenco 27%, TENEX/TVEL 40%, Orano 17%, CNNC 14%, USEC/Centrus 1%, GE-Hitachi 1% | Real enrichment-market shares, consistent with post-2022 market structure (Russia's TENEX still dominant share pre-sanctions-adjustment) |
| `HALEU_SOURCES` (5) | TENEX/Rosatom operational (sanctioned), Centrus pilot demo, Urenco/Orano planned 2027/2028 | Matches the real, widely reported HALEU supply-chain bottleneck narrative |

### 7.3 Calculation walkthrough

1. User sets `u3o8Price`, `swuPrice`, `convFee`, `fabFee`, `kgU`, `enrichPct` (Fuel Cost tab) and
   separately `feedAssay`/`tailsAssay`/`productAssay`/`kgU` (SWU Economics tab) — **these are two
   separate state groups**; `calcFuelCost` does not read the SWU tab's `feedAssay`/`tailsAssay`
   sliders at all (it hard-codes 0.711/0.3 internally), so changing those sliders only affects the
   SWU Economics tab's own display, not the Fuel Cost Modelling tab's total.
2. `calcSwu` computes `feedKg` correctly (real F/P mass-balance ratio) but its `swuPerKgProduct`
   uses `xf/xp` as the second-term multiplier instead of `F/P` — a different, much smaller number
   (0.20 vs 7.79 for the defaults below), and entirely omits use of `T/P`.
3. `calcFuelCost` inlines its own SWU formula using the correct `F/P` ratio but only for **one** of
   the two mass-balance terms, entirely omitting the `+(T/P)·V(xt)` tails-credit term that the
   standard formula requires — the tails stream is assumed to carry zero separative-work credit,
   which materially understates true SWU cost.

### 7.4 Worked example — default sliders (`enrichPct=3.5%`, `feedAssay=0.711%`, `tailsAssay=0.3%`,
`kgU=1000`, `u3o8Price=$65`, `swuPrice=$130`, `convFee=$12`, `fabFee=$300`)

| Quantity | Formula | Result |
|---|---|---|
| `v(0.035)` | `(2×0.035−1)·ln(0.035/0.965)` | **3.085** |
| `v(0.003)` | `(2×0.003−1)·ln(0.003/0.997)` | **5.771** |
| `v(0.00711)` | `(2×0.00711−1)·ln(0.00711/0.99289)` | **4.869** |
| `F/P` (correct ratio, used in `feedKg`) | `(0.035−0.003)/(0.00711−0.003)` | **7.786** |
| `feedKg` | `1000 × 7.786` | **7,786 kg** — realistic (~7.8 kg natural U per kg LEU is the standard industry rule of thumb) |
| **`calcSwu` SWU/kg** | `(3.085−5.771) − (0.00711/0.035)×(4.869−5.771)` | **−2.50 SWU/kg** (non-physical: negative) |
| **Correct SWU/kg** (for reference) | `V(xp)+(T/P)V(xt)−(F/P)V(xf)`, `T/P=6.786` | **+4.34 SWU/kg** |
| `u3o8Cost` | `7,786 × $65 / 0.848` | **$596,797** |
| `convCost` | `7,786 × $12` | **$93,431** |
| **`calcFuelCost` SWU/kg** | `3.085 − 7.786×4.869` | **−34.82 SWU/kg** |
| **`swuCost`** | `−34.82 × 1000 × $130` | **−$4,527,068** |
| `fabCost` | `1000 × $300` | **$300,000** |
| **`total`** | `596,797+93,431−4,527,068+300,000` | **−$3,536,840** (negative total fuel cost) |
| **`perMwh`** | `total/(1000×45)/1000` | **≈ −$0.08/MWh** |

At the page's own default settings, the Fuel Cost Modelling tab would display a **negative**
per-MWh fuel cost — the opposite sign from, and orders of magnitude smaller than, the guide's cited
**$5–15/MWh** benchmark. This is a direct, arithmetically traced consequence of the missing
`+(T/P)·V(xt)` term in `calcFuelCost`'s inline SWU formula, not a display/rounding issue.

### 7.5 Data provenance & limitations

- Static reference tables (`MINES`, `ENRICHERS`, `HALEU_SOURCES`, `FUEL_TYPES`) are plausible,
  real-world-consistent figures — the platform's usual pattern of accurate reference data paired
  with a flawed live-calculation engine.
- `u3o8Spot`/`swuPriceSeries` (24-month and 20-year price series) use `sr()` PRNG jitter around a
  hand-set drift — illustrative market history, not sourced to UxC/TradeTech actuals.
- The `calcSwu` vs `calcFuelCost` divergence means a user cross-checking the SWU Economics tab
  against the Fuel Cost Modelling tab for the *same* enrichment parameters will see two different,
  both-incorrect SWU/kg figures.

**Framework alignment:** WNA *The Nuclear Fuel Cycle* — the value-function `v(x)` itself is exactly
right; the mass-balance combination is not · EIA Uranium Marketing Annual Report — cited as price
source for `u3o8Spot`, not actually loaded · DOE HALEU Availability Program — `HALEU_SOURCES`
correctly reflects the real 2024–2028 supply bottleneck narrative (Centrus pilot-scale, Urenco/Orano
targeting 2027–2028, TENEX still dominant but sanctioned).

## 9 · Future Evolution

### 9.1 Evolution A — Fix the SWU formula defect, then calibrate to real market prices (analytics ladder: rung 1 → 3)

**What.** §7 documents a genuine code-correctness bug, not just a data gap: the module correctly implements the industry SWU value function `V(x) = (2x−1)·ln(x/(1−x))` and the feed/product mass balance `F/P = (xp−xt)/(xf−xt)`, but its two separative-work totals each use a *different, non-standard* combination — neither matches the textbook `SWU/P = V(xp) + (T/P)·V(xt) − (F/P)·V(xf)`. `calcSwu` uses `xf/xp` instead of `F/P`; `calcFuelCost` omits the `(T/P)·V(xt)` term. Traced with default sliders, both return negative SWU/kg, driving the Fuel Cost tab's total *negative* — contradicting the module's own cited $5–15/MWh benchmark. Evolution A fixes the formula first, then calibrates.

**How.** (1) Replace both SWU expressions with the correct three-term formula, computing tails-per-product `T/P = (xf−xp)/(xf−xt)` and feed-per-product `F/P` from the same mass balance — verified against a known worked example (e.g. WNA's standard 4.95%/0.711%/0.25% case yields ~7.0 SWU/kg). (2) Stop hard-coding `feedAssay/tailsAssay` to 0.711/0.3 in `calcFuelCost` while the sliders say otherwise (§7.1) — honor the inputs. (3) Calibrate SWU price, U₃O₈ price, and conversion fees to real EIA Uranium Marketing Annual and market SWU quotes (named in §5), stored dated in a reference table. (4) Add the HALEU premium (3–5× SWU per §1) as an explicit multiplier for Gen-IV fuel.

**Prerequisites.** A `bench_quant` pin with a hand-verified SWU case is mandatory — this bug would have been caught by one. EIA data ingestion. **Acceptance:** the standard 4.95% enrichment case returns ~7 SWU/kg positive; total fuel cost lands in $5–15/MWh; sliders actually affect `calcFuelCost`.

### 9.2 Evolution B — Fuel-cycle-economics copilot (LLM tier 2) — gated on the fix

**What.** A copilot answering "what's the $/MWh fuel cost at 5% enrichment and 0.2% tails?", "how much does the HALEU premium add for a Natrium core?", "compare once-through vs MOX at today's SWU price" — executed against the corrected fuel-cycle engine, decomposing cost into the front-end (U₃O₈, conversion, enrichment) and back-end stages per §5.

**How.** Tool calls to a `POST /fuel-cycle/cost` endpoint wrapping the (fixed) `calcSwu`/`calcFuelCost`; system prompt from this Atlas page's §5 formula and the WNA/EIA references named in §5 so enrichment economics are explained correctly. What-ifs (enrichment %, tails assay, SWU price, once-through vs MOX) are recomputations, not estimates; the fabrication validator matches every $/MWh and SWU figure to a tool response. The copilot must surface the tails-assay optimisation trade-off (lower tails = more SWU but less feed) that the corrected formula makes tractable.

**Prerequisites (hard).** Evolution A's formula fix — an LLM narrating the current engine would confidently report *negative* fuel costs, an obvious falsehood that would destroy trust; the copilot must not ship until the SWU math is correct and pinned. **Acceptance:** every quoted fuel cost is positive and traces to a tool call; the enrichment/tails sensitivity behaves monotonically; MOX comparison reflects real back-end cost differences.