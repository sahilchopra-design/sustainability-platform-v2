# Commodity Derivatives Climate
**Module ID:** `commodity-derivatives-climate` · **Route:** `/commodity-derivatives-climate` · **Tier:** B (frontend-computed) · **EP code:** EP-CI4 · **Sprint:** CI

## 1 · Overview
Oil/gas forward curves under NGFS scenarios, Black-76 options pricing, and cross-commodity climate spread analysis.

**How an analyst works this module:**
- Energy Curve Dashboard shows oil/gas forward curves per scenario
- Cross-Commodity Spreads shows crack/dark/spark under transition
- Hedging Strategy Builder recommends portfolio hedges

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMMODITIES`, `NGFS`, `NGFS_COLORS`, `SPREADS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SPREADS` | 5 | `long`, `short`, `base`, `unit`, `color` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `decayFactor` | `scenario.includes('Net Zero') \|\| scenario.includes('2C') ? Math.max(0.3, 1 - m / (t.peakYear * 12)) : 1 + t.drift * m;` |
| `price` | `basePrice * decayFactor * (1 + (Math.sin(m / 6) * t.vol * 0.5));` |
| `fundamental` | `basePrice * (1 + Math.sin(m / 12) * 0.05);` |
| `premium` | `basePrice * premiumPct[scenario] * (m / months);` |
| `Nd1` | `0.5 * (1 + erf(d1 / Math.sqrt(2)));` |
| `Nd2` | `0.5 * (1 + erf(d2 / Math.sqrt(2)));` |
| `TABS` | `['Energy Curve Dashboard', 'Contango/Backwardation Under Transition', 'Commodity Options Pricing', 'Cross-Commodity Spreads', 'Hedging Strategy Builder', 'Climate Premium Decomposition'];` |
| `row` | `{ month: i + 1 };` |
| `contangoData` | `useMemo(() => { return curveData.map((d, i) => ({ month: d.month, price: d.price, structure: i > 0 ? +(d.price - curveData[i - 1].price).toFixed(2) : 0, }));` |
| `skew` | `Math.abs(k - 1.0) * 0.15;` |
| `termStruc` | `Math.sqrt(exp) * 0.05;` |
| `spreadData` | `useMemo(() => SPREADS.map(sp => ({ ...sp, ...Object.fromEntries(NGFS.map(s => { const factor = s === 'Net Zero 2050' ? -0.6 : s === 'Below 2C' ? -0.3 : s === 'Current Policies' ? 0.1 : 0;` |
| `premiumData` | `useMemo(() => computeClimatePremium(comm.base, scenario, 36), [comm.base, scenario]);  const hedgeStrategies = [ { name: 'Put Spread', desc: 'Buy ATM put, sell OTM put', cost: +(comm.base * 0.04).toFixed(2), protection: '80-100%', maxLoss: 'Premium paid' }, { name: 'Collar', desc: 'Buy put floor, sell call cap', cost: +(comm.base * 0.01).` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `NGFS`, `SPREADS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Brent 2030 (NZ) | `NGFS-adjusted curve` | IEA NZE | Oil price under Net Zero — down from $85 baseline |
| Crack Spread Shift | `Refining margin compression` | Model | Gasoline refining margin declines under EV adoption |

## 5 · Intermediate Transformation Logic
**Methodology:** Black-76 with transition-adjusted volatility
**Headline formula:** `C = exp(-rT)[F·N(d1) - K·N(d2)]; σ_adj = σ_base + Δσ_transition`

Forward curves shift under NGFS: peak oil demand creates contango collapse. Vol surface adjusts for transition uncertainty. Cross-commodity spreads (crack, dark, spark) shift as relative fuel economics change under carbon pricing.

**Standards:** ['ICE', 'CME', 'IEA WEO']
**Reference documents:** ICE Futures; CME Options Data; IEA World Energy Outlook

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This module (EP-CI4) implements a **real Black-76 options pricer** (with an `erf`-based normal CDF) and a
transition-adjusted forward-curve model — the mathematics matches the guide's
`C = exp(−rT)[F·N(d1) − K·N(d2)]`. Forward curves shift under NGFS scenarios via a demand-decay factor. The
base prices, vols and spread reactions are curated/heuristic, not live ICE/CME feeds.

### 7.1 What the module computes

Transition-adjusted forward curve (monthly, `m`):
```js
decayFactor = (scenario includes 'Net Zero'|'2C')
   ? max(0.3, 1 − m/(peakYear·12))       // demand decays post-peak, floored at 0.3
   : 1 + drift·m                          // business-as-usual drift
price       = basePrice · decayFactor · (1 + sin(m/6)·vol·0.5)   // seasonal wobble
```
Black-76 European option (with error-function normal CDF):
```js
Nd1 = 0.5·(1 + erf(d1/√2))     Nd2 = 0.5·(1 + erf(d2/√2))
// standard d1 = [ln(F/K) + σ²T/2]/(σ√T),  d2 = d1 − σ√T
// C = exp(−rT)·[F·Nd1 − K·Nd2]
```
Vol adjustment adds skew and term structure: `skew = |K/F − 1|·0.15`, `termStruc = √exp·0.05`.
Climate premium decomposition: `premium = basePrice·premiumPct[scenario]·(m/months)`.

### 7.2 Parameterisation / scoring rubric

| Quantity | Source | Provenance |
|---|---|---|
| `basePrice`, `vol`, `peakYear`, `drift` per commodity (`t`) | dataset | curated (oil/gas fundamentals) |
| Decay floor | `0.3` (Net-Zero demand floor) | heuristic (peak-demand collapse) |
| Seasonal amplitude | `sin(m/6)·vol·0.5` | heuristic seasonality |
| `premiumPct[scenario]` | per scenario | heuristic transition premium |
| Skew / term-struc coefficients | `0.15`, `0.05` | heuristic vol-surface shape |
| `SPREADS` (5: long, short, base, unit) | seed schema | crack/dark/spark spread definitions |
| Spread scenario factor | NZ −0.6 / Below2C −0.3 / CurrentPol +0.1 | heuristic scenario shift |

### 7.3 Calculation walkthrough

Scenario + commodity selected → `curveData` builds a 36-month forward curve with the decay factor →
`contangoData` differences consecutive months to show contango/backwardation → options tab feeds F, K, σ_adj,
T into Black-76 with the `erf` normal CDF → `spreadData` shifts crack/dark/spark spreads by the scenario
factor → `premiumData` decomposes the climate premium → hedging tab builds put-spread/collar strategies with
costs as fractions of `comm.base`.

### 7.4 Worked example

Black-76 call: F = $80, K = $80 (ATM), σ = 30%, T = 1 yr, r = 5%:
```
d1 = [ln(80/80) + 0.30²·1/2] / (0.30·√1) = (0 + 0.045)/0.30 = 0.15
d2 = 0.15 − 0.30 = −0.15
N(d1) = 0.5·(1+erf(0.15/√2)) ≈ 0.5596 ;  N(d2) ≈ 0.4404
C = e^(−0.05)·[80·0.5596 − 80·0.4404] = 0.9512·[44.77 − 35.23] = 0.9512·9.54 ≈ $9.07
```
Forward-curve decay under Net Zero at month 60 (peakYear = 5): `decayFactor = max(0.3, 1 − 60/60) = 0.3`, so
a $80 base collapses toward $24 by year 5 — the "contango collapse / peak-oil-demand" signal the guide cites
(Brent 2030 NZ ≈ $45).

### 7.5 Data provenance & limitations

- The **option-pricing and curve mathematics are correct and real** (Black-76 with `erf` CDF); this module is
  not `sr()`-driven — it is deterministic given curated inputs.
- Base prices, vols, peak years, premium percentages and spread reactions are **curated/heuristic**, not live
  ICE/CME/IEA feeds; the decay factor is a stylised demand model, not an IEA-WEO demand curve.
- Skew/term-structure vol adjustments are simple fixed-coefficient shapers, not a fitted implied-vol surface.

**Framework alignment:** Black-76 futures-option model (the market standard for commodity options) · ICE/CME
futures & options conventions · IEA World Energy Outlook / NZE (peak-demand and price-path context, e.g.
Brent 2030 NZ ≈ $45). Crack/dark/spark spread definitions follow refining/power-generation market practice.

## 8 · Model Specification

**Status: specification — not yet implemented in code** (pricing engine is real; the *forward-curve and vol
surface* need production calibration).

**8.1 Purpose & scope.** Price commodity options and forward curves under NGFS transition scenarios with a
calibrated demand model and fitted vol surface, for energy-commodity hedging and transition-risk P&L.

**8.2 Conceptual approach.** Retain Black-76 pricing; replace the stylised decay with an **IEA-WEO/NZE demand
path → price** structural link and an implied-vol surface fitted to listed options (SABR), with a transition
vol add-on — mirroring bank commodity desks and IEA scenario-linked curve construction.

**8.3 Mathematical specification.**
```
F(τ, scenario) = SpotAnchor · exp( ∫ (convenienceYield − storage − demandDrift_scenario(τ)) dτ )
   demandDrift from IEA WEO/NZE demand trajectory per commodity
σ_impl(K,τ) = SABR(α,β,ρ,ν; F,K,τ) + Δσ_transition(scenario)
C = e^{−rτ}[F·N(d1) − K·N(d2)]   (Black-76, as coded)
CrackSpread(scenario) = ProductPrice(scenario) − CrudePrice(scenario) − CarbonCost
```

| Parameter | Source |
|---|---|
| Demand drift | IEA WEO / NZE demand by fuel |
| SABR α,β,ρ,ν | calibration to ICE/CME listed option surfaces |
| Δσ_transition | historical vol response to policy events |
| Carbon cost | EU-ETS forward |

**8.4 Data requirements.** Listed futures/options quotes (ICE/CME); IEA demand paths; carbon forwards. Free:
IEA summary tables; vendor: ICE/CME data, IEA WEO full dataset.

**8.5 Validation & benchmarking.** Reprice listed options vs market (calibration error); reconcile scenario
curves vs IEA published (Brent NZ ≈ $45 2030); Greeks stability.

**8.6 Limitations & model risk.** Scenario demand paths uncertain; SABR extrapolation at wings; carbon-cost
pass-through assumptions. Fallback: flat-vol Black-76 with linear decay (current behaviour) when surface
calibration fails.

## 9 · Future Evolution

### 9.1 Evolution A — Live curves and WEO-anchored demand paths under the real pricer (analytics ladder: rung 2 → 3)

**What.** EP-CI4's mathematics is genuinely sound — §7.5 confirms the Black-76 pricer
with `erf`-based normal CDF is "correct and real" and the page is deterministic, not
`sr()`-driven. The gaps are the inputs: base prices/vols are curated constants, the
NGFS demand decay is a stylised `max(0.3, 1 − m/(peakYear·12))` rather than an IEA WEO
demand curve, and the vol surface is two fixed coefficients (skew 0.15, term 0.05).
Evolution A calibrates all three so the correct math prices realistic markets.

**How.** (1) Anchor spot/forward levels to EIA series (already integrated in
data-sources wave 1 — WTI, Henry Hub) refreshed by the ingestion framework, replacing
curated `basePrice`. (2) Replace the linear decay with digitised IEA WEO/NZE demand
trajectories per scenario (small curated table, versioned, cited — e.g. the Brent 2030
NZ ≈ $45 anchor §7.5 already quotes) so contango collapse follows a published pathway.
(3) Fit the vol surface: SVI or simple polynomial fit to a curated implied-vol grid per
commodity, documented per the Atlas §8 model-card convention, replacing the fixed
shapers. (4) Move pricing into a backend engine (`commodity_climate_derivatives`) so
the module gains its first endpoints and the §7.4 ATM worked example gets pinned in
`bench_quant.py`.

**Prerequisites.** EIA ingest coverage for the commodity set; an implied-vol data
source (even a quarterly curated grid beats fixed coefficients — label provenance
honestly). **Acceptance:** the ATM Black-76 example reproduces to 4 decimals through
the backend; scenario curves hit the WEO anchor points; put-call parity holds across
the strike grid in an automated test.

### 9.2 Evolution B — Hedging-desk analyst over the pricing engine (LLM tier 2)

**What.** The Hedging Strategy Builder currently offers template put-spreads/collars
with costs as fractions of `comm.base`. Evolution B turns hedging into a dialogue:
"hedge 100kb/d of refining margin against Delayed Transition through 2027" gets
decomposed by the analyst into crack-spread components (the module's `SPREADS`
definitions), priced leg-by-leg via tool calls to the Evolution A pricing endpoints,
and returned as a costed strategy comparison — premium outlay, breakevens, scenario
P&L across the NGFS set — with every option value computed by Black-76, never by the
model.

**How.** Tool schemas over the new engine's price/curve/spread operations; grounding
corpus is §5 (Black-76 formula, σ_adj convention) and §7.2's parameter provenance so
the analyst discloses which inputs are live EIA data versus curated vol grids. The
no-fabrication validator has sharp teeth here — option premia are exactly the numbers
a plausible-sounding LLM would hallucinate — so every $/bbl figure must match a tool
response. Strategy P&L grids render as the module's existing chart payloads.

**Prerequisites (hard).** Evolution A's backend engine — today there are no endpoints
at all, and a tier-2 analyst without tools would be a fabrication machine.
**Acceptance:** a generated collar recommendation where each leg's premium matches an
individual pricing call; the analyst refuses exotic payoffs (Asians, swaptions) the
engine doesn't price rather than approximating them.