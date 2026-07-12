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
