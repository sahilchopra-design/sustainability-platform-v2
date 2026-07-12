# Green Ammonia Shipping & Terminal Infrastructure
**Module ID:** `green-ammonia-shipping-storage` · **Route:** `/green-ammonia-shipping-storage` · **Tier:** B (frontend-computed) · **EP code:** EP-EE2 · **Sprint:** EE

## 1 · Overview
Green ammonia maritime logistics and terminal infrastructure. Covers VLGC freight dynamics, 5 key export-import trade routes, terminal CAPEX benchmarking, NH3 cracking energy penalty for H2 reconversion, and IMO safety framework.

> **Business value:** Used by shipping companies, terminal operators, green ammonia developers, DFIs, and commodity traders to evaluate supply chain infrastructure requirements and economics.

**How an analyst works this module:**
- Review terminal network for major import/export hub locations
- Examine trade routes for VLGC freight by distance
- Analyse VLGC freight market for fleet availability scenarios
- Use cracking infrastructure tab for H2 reconversion cost analysis

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `KpiCard`, `TABS`, `TERMINALS`, `TRADE_ROUTES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `TERMINALS` | 16 | `country`, `storageCapacity_kt`, `tankType`, `crackerCapacity_tpd`, `shippingVesselClass`, `routeOrigin`, `routeDest`, `freightCost_usd_t`, `totalChainCost_usd_t` |
| `TRADE_ROUTES` | 6 | `distance_km`, `freightUsdT`, `loadingCost`, `dischargeCost`, `totalLogistics`, `lcoaAtOrigin` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `avgFreight` | `useMemo(() => filtered.length ? filtered.reduce((a, b) => a + b.freightCost_usd_t, 0) / filtered.length : 0, [filtered]);` |
| `totalStorage` | `useMemo(() => filtered.reduce((a, b) => a + b.storageCapacity_kt, 0), [filtered]);` |
| `avgChainCost` | `useMemo(() => filtered.length ? filtered.reduce((a, b) => a + b.totalChainCost_usd_t, 0) / filtered.length : 0, [filtered]);` |
| `freightCurve` | `useMemo(() => [500, 1000, 2000, 3000, 5000, 7000, 10000, 15000].map((d, i) => ({ dist: d, vlgc: Math.round(20 + d * 0.0055 + sr(i * 7) * 5), mgc: Math.round(28 + d * 0.0068 + sr(i * 11) * 5), lgc: Math.round(35 + d * 0.0085 + sr(i * 13) * 5), })), []);` |
| `crackingData` | `useMemo(() => [...filtered].sort((a, b) => b.crackerCapacity_tpd - a.crackerCapacity_tpd).slice(0, 8).map(t => ({ name: t.terminal.slice(0, 12), capacity: t.crackerCapacity_tpd, energyPenalty: Math.round(t.crackerCapacity_tpd * 0.15 * (300 + sr(t.crackerCapacity_tpd) * 20)), })), [filtered]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `TABS`, `TERMINALS`, `TRADE_ROUTES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| VLGC Freight Rate ($/tonne NH3) | `Spot + time-charter for 90,000 DWT VLGC` | Clarkson Research / Baltic Exchange | Australia→Japan $80-90/t; Chile→Rotterdam $90-110/t; Middle East→Japan $50-70/t; fleet needs to grow 200+ vessels by 2030. |
| NH3 Cracking Energy Penalty (%) | `H2_delivered / H2_input_as_NH3 - 1` | CSIRO Hydrogen Cracking Study 2023 | Requires 0.5-0.7 kWh/Nm³ H2; adds $50-100/t NH3 to delivered H2 cost. |
| Terminal CAPEX ($/t annual capacity) | `CAPEX / annual_throughput` | H2Global / Wuppertal Institut | Greenfield vs brownfield (LPG conversion) 40% CAPEX reduction. |
- **VLGC fleet data + terminal capacity + freight rates + cracking efficiency** → Logistics cost model (freight + terminal + cracking) + trade route optimization → **Green ammonia supply chain cost from production to consumer, informing offtake pricing**

## 5 · Intermediate Transformation Logic
**Methodology:** NH3 Logistics Cost & Cracking Penalty
**Headline formula:** `Total_cost = LCOA + freight + terminal_handling + cracking_penalty`

NH3 shipping in refrigerated liquid form (-33°C) using VLGCs (90,000 DWT). Freight: $50-120/t. NH3 cracking (reconversion to H2): 15-20% energy penalty plus $50-100/t capital cost. Safety: LC50 = 2,000 ppm.

**Standards:** ['IMO Ammonia Marine Fuel Safety Guidelines', 'SIGTTO NH3 Shipping Standards', 'H2Global Shipping Cost Study 2023']
**Reference documents:** SIGTTO (2023) – Ammonia as Marine Fuel Safety Guideline; H2Global / Wuppertal Institut NH3 Supply Chain Study 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Delivered-cost model with live freight and cracking-penalty economics (analytics ladder: rung 1 → 2)

**What.** §7 confirms this is a curated maritime-logistics tool: 15 real-named terminals (Dampier, Sines, Jeddah) with storage capacity, tank type (refrigerated −33°C vs pressurised), and cracker fields, plus 5 trade routes, attributed to SIGTTO/H2Global/Wuppertal sources. The headline `Total_cost = LCOA + freight + terminal_handling + cracking_penalty` is a real cost stack, but freight ($50–120/t) and the cracking penalty (15–20% energy + $50–100/t) are static ranges. Evolution A builds a computed delivered-cost model: freight from VLGC day-rates and route distance, terminal handling from throughput, and the NH₃-cracking penalty from real energy prices — so the delivered cost of green H₂-via-ammonia responds to shipping-market and energy conditions, per route.

**How.** (1) A backend route computing per-route delivered cost: LCOA (from the production-economics sibling) + freight (VLGC rate × voyage days) + handling + cracking penalty (energy penalty × H₂ price + capital). (2) Wire VLGC freight rates and energy prices from market feeds. (3) The cracking-vs-direct-use decision becomes a computed comparison (deliver as NH₃ vs crack to H₂), a key economic question the module currently only describes.

**Prerequisites.** VLGC freight-rate and energy-price feeds; route distances; LCOA input from the production sibling. **Acceptance:** delivered cost per route recomputes from the §5 stack when freight or energy price changes; the crack-vs-deliver comparison is computed; static freight/penalty ranges are replaced by derived figures.

### 9.2 Evolution B — Ammonia logistics copilot (LLM tier 1 → 2)

**What.** A copilot for trade and logistics planners: "what's the delivered cost of green H₂ shipped as ammonia from Dampier to Rotterdam and cracked, versus direct ammonia use?" narrates the terminal infrastructure, trade routes, and cracking-penalty economics from the atlas corpus, with tier-2 computing delivered cost per route via the Evolution A endpoint.

**How.** Tier 1 grounds on §5/§7 (VLGC dynamics, terminal CAPEX benchmarks, cracking energy penalty, IMO safety framework are cited) — the copilot cites real terminals and route structures while flagging cost figures as curated ranges. Tier 2 tool-calls the delivered-cost endpoint so route and crack-vs-deliver what-ifs are computed. Every $/t figure validated against tool output.

**Prerequisites.** Corpus embedding; Evolution A for computed delivered cost. **Acceptance:** every cost figure cited traces to the curated table or the endpoint; post-Evolution-A, route what-ifs return computed delivered costs; the copilot presents the crack-vs-deliver trade-off as a computed comparison, not a narrative.