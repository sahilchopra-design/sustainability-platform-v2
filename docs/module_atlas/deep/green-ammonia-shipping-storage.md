## 7 · Methodology Deep Dive

### 7.1 What the module computes

15 real-named export/import terminals (Port of Dampier, Sines, Jeddah Islamic Port, etc.) are
hand-entered with storage capacity, tank type (refrigerated -33°C vs pressurised 8–18 bar), cracker
capacity, vessel class, and a route-level `freightCost_usd_t` + `totalChainCost_usd_t`. A separate
5-row `TRADE_ROUTES` table gives per-route logistics detail (distance, freight, loading/discharge
cost). One synthetic series — the VLGC/MGC/LGC freight-vs-distance curve — uses the seeded PRNG.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Freight curve intercepts (VLGC/MGC/LGC) | $20/$28/$35 base | Fixed-cost component (port fees, bunker at berth) — undocumented but plausible loading/discharge baseline |
| Freight curve slopes | 0.0055 / 0.0068 / 0.0085 $/t per km | Implies VLGC (largest, most efficient vessel) has the lowest per-km cost — correct directional ordering by vessel scale economies |
| `sr()` jitter | ±5 $/t | Route-specific noise around the linear fit |
| Cracking energy penalty coefficient | `0.15` | Matches guide's "15–20% energy penalty" for NH₃→H₂ reconversion |
| Terminal-level `freightCost_usd_t`/`totalChainCost_usd_t` | Hand-entered, e.g. Dampier→Yokohama 65/145 | Static, real-route-plausible figures |

### 7.3 Calculation walkthrough

1. **Aggregate KPIs**: `avgFreight`, `avgChainCost` (arithmetic means, correctly guarded), and
   `totalStorage = Σ storageCapacity_kt` over the filtered terminal set.
2. **Tank-type breakdown**: counts and sums storage capacity by `tankType` across the *full*
   (unfiltered) 15-terminal set — a fixed reference split, independent of the page's vessel/tank
   filters.
3. **Freight curve** (`freightCurve`, the module's one dynamic/synthetic series):
   ```js
   vlgc = round(20 + dist×0.0055 + sr(i*7)×5)
   mgc  = round(28 + dist×0.0068 + sr(i*11)×5)
   lgc  = round(35 + dist×0.0085 + sr(i*13)×5)
   ```
   evaluated at 8 fixed distances (500–15,000 km). This is a **linear freight-cost model**
   (fixed port/handling cost + distance-proportional bunker/charter cost), a standard shipping-
   economics simplification, with `sr()` adding route-to-route noise rather than representing any
   real market volatility.
4. **Cracking economics** (`crackingData`): sorts the filtered terminals by `crackerCapacity_tpd`
   descending, takes the top 8, and computes
   `energyPenalty = round(capacity_tpd × 0.15 × (300 + sr(capacity_tpd)×20))` — i.e. daily cracker
   throughput × a 15% energy-penalty factor × a "reference energy cost" of $300–320 that is itself
   `sr()`-jittered per terminal (not a real energy-price feed).
5. **Trade route comparison**: `totalLogistics = freightUsdT + loadingCost + dischargeCost` (simple
   addition of the three static per-route fields, e.g. Australia→Japan: `65+12+15=92`, matches the
   table's `totalLogistics: 92`).

### 7.4 Worked example

Freight curve at `dist=7200` (Australia→Japan distance), index `i=3` (position of 3000 in the
distance array — note: 7200 itself is not one of the 8 evaluated points; the closest tabulated
point is 7000, `i=6`):

```
vlgc(7000) = round(20 + 7000×0.0055 + sr(42)×5) = round(20 + 38.5 + sr(42)×5)
```
Illustratively `sr(42)=0.44` → `round(58.5+2.2) = 61` $/t — closely matching the *actual* hand-
entered `TRADE_ROUTES` Australia→Japan `freightUsdT=65`, confirming the synthetic curve's slope was
calibrated to be broadly consistent with the static real-route table, even though the two are
computed independently and can diverge at other distances.

Cracking penalty for "Port of Dampier" (`crackerCapacity_tpd=450`):
`energyPenalty = round(450 × 0.15 × (300 + sr(450)×20))`. Illustratively `sr(450)=0.6` →
`round(450×0.15×312) = round(21,060)` — a large absolute number best read as a relative energy-cost
index across terminals (proportional to cracker throughput) rather than a literal daily dollar cost,
since the chart's units are not labelled beyond "energy penalty."

### 7.5 Companion analytics

- **Safety Standards tab**: static text/table content (IMO/SIGTTO references, LC50 exposure limits)
  — no calculation.

### 7.6 Data provenance & limitations

- Terminal and trade-route tables are static, hand-curated, attributed to SIGTTO/H2Global/Wuppertal
  Institut sources in the guide, but not individually footnoted.
- The freight-vs-distance curve mixes a genuine linear cost model with `sr()`-seeded per-point
  noise — treat the curve as illustrative, not a fitted regression on real charter-rate data
  (Clarkson Research / Baltic Exchange, as named in the guide, is not actually queried).
- Cracking "energy penalty" units are ambiguous in the code (a $-scaled index derived from
  capacity × a jittered reference price) — a production version should express this explicitly as
  either kWh/t or $/t with a clearly sourced energy price.

**Framework alignment:** SIGTTO Ammonia as Marine Fuel Safety Guideline (referenced for the Safety
Standards tab) · H2Global/Wuppertal Institut NH₃ supply chain cost studies (freight/terminal cost
benchmarking, directionally consistent but not literally sourced per data point) · IMO ammonia
marine fuel guidelines (safety framing only, no compliance calculation).
