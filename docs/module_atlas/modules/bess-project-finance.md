# BESS Project Finance
**Module ID:** `bess-project-finance` · **Route:** `/bess-project-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DT1 · **Sprint:** DT

## 1 · Overview
4-hour battery energy storage system project finance covering CAPEX waterfall, multi-stream revenue stacking, degradation modelling to 80% end-of-life and augmentation cost for IRR optimisation.

> **Business value:** BESS project finance is bankable in markets with stacked revenue streams totalling >$120/kW/yr; CAPEX trajectory to <$200/kWh by 2030 combined with rising capacity market prices improves merchant IRR to 10-14% under BNEF base case assumptions.

**How an analyst works this module:**
- Size BESS system (MW/MWh) and calculate CAPEX waterfall: cells, BMS, PCS, EPC, grid connection, owners costs
- Model revenue by stream: capacity market (contracted), FFR/DCR (tendered), energy arbitrage (price spread)
- Apply degradation model to forecast SoH and schedule augmentation at 80% SoH threshold
- Calculate project IRR with and without augmentation cost; test sensitivity to revenue stream pricing

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CHEMISTRIES`, `KpiCard`, `MARKETS`, `Slider`, `TABS`, `YEARS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CHEMISTRIES` | 5 | `label`, `capexKwh`, `opexPct`, `rte`, `cycles`, `calDeg`, `cycDeg`, `tempRange`, `lifetime`, `energy`, `power`, `trl`, `color`, `pros`, `cons` |
| `MARKETS` | 7 | `capMkt`, `fcr`, `afrr`, `arbitrage`, `color` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `capexAnn` | `capexPerKwh * (wacc / 100) / (1 - Math.pow(1 + wacc / 100, -lifetime));` |
| `opexAnn` | `capexPerKwh * opexPct / 100;` |
| `annualThroughput` | `cycles * rte / 100; // kWh out per kWh capacity per yr` |
| `accel` | `Math.exp(Ea / k * (1 / T0 - 1 / T1));` |
| `YEARS` | `Array.from({ length: 16 }, (_, i) => 2025 + i);` |
| `lcos` | `useMemo(() => calcLcos({ capexPerKwh: capexKwh, opexPct, rte, cycles, lifetime, wacc, degradePct }), [capexKwh, opexPct, rte, cycles, lifetime, wacc, degradePct]); const capexTotal = capexKwh * capacityMW * durationH * 1000 / 1e6; // M€  const revStack = useMemo(() => revenueStack({ capacityMW, capMarket: capMkt, fcr: fcrRev, afrr: affrrR` |
| `totalRevenue` | `Object.values(revStack).reduce((a, b) => a + b, 0);` |
| `annualOpex` | `capexTotal * opexPct / 100;` |
| `ebitda` | `totalRevenue - annualOpex;` |
| `degradeFactor` | `Math.max(0.7, 1 - (degradePct / 100) * y);` |
| `projectIrr` | `useMemo(() => { const r = irr(cashflows); return isFinite(r) ? +(r * 100).toFixed(1) : 'N/A'; }, [cashflows]);` |
| `projectNpv` | `useMemo(() => +npv(cashflows, wacc / 100).toFixed(1), [cashflows, wacc]);` |
| `degradData` | `useMemo(() => Array.from({ length: lifetime }, (_, y) => ({ year: `Y${y + 1}`, soh: +(100 - degradePct * y * (1 + cycles / 5000)).toFixed(1), sohArrh: +(arrheniusDegradation(25, degradePct, y) * 100).toFixed(1), sohHot:  +(arrheniusDegradation(35, degradePct, y) * 100).toFixed(1), })), [lifetime, degradePct, cycles]);` |
| `lcosByChemistry` | `CHEMISTRIES.map(c => ({` |
| `capexData` | `YEARS.map((y, i) => ({` |
| `mcData` | `useMemo(() => Array.from({ length: 200 }, (_, i) => { const revShock  = 0.7 + sr(i * 17) * 0.6;` |
| `capShock` | `0.85 + sr(i * 11) * 0.3;` |
| `adjRev` | `totalRevenue * revShock;` |
| `adjCapex` | `capexTotal * capShock;` |
| `panelStyle` | `{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.text };` |
| `gridStyle` | `{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 };` |
| `bins` | `Array.from({ length: 20 }, (_, i) => ({ range: `${(-10 + i * 2).toFixed(0)}–${(-8 + i * 2).toFixed(0)}%`, count: 0, midpoint: -9 + i * 2 }));` |
| `idx` | `Math.min(19, Math.max(0, Math.floor((v + 10) / 2)));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CHEMISTRIES`, `MARKETS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| 4-hr BESS CAPEX | `System_CAPEX = Cells + BMS + PCS + EPC + O&C` | BNEF 2023 | Cell cost (40-50% of system) tracking 15% annual decline; target <$150/kWh system cost by 2030 for merchant viability. |
| Revenue Stack ($/kW/yr) | `R = CM + FFR + Arb; each stream independently modelled` | National Grid/ERCOT 2023 | Capacity market provides base revenue; FFR/DCR premium services add $40-80/kW/yr; arbitrage dependent on price spread volatility. |
| Degradation to 80% SoH | `SoH(t) = 100% - Deg_rate × cycles(t)` | NREL Battery Lifetime Model | Calendar ageing + cycle ageing; LFP degrades 10-15% slower than NMC per equivalent cycle count. |
- **Capacity market auction results** → → revenue model → **£/kW/yr clearing price by delivery year**
- **Battery cell price forecast** → → CAPEX model → **$/kWh by chemistry and year**

## 5 · Intermediate Transformation Logic
**Methodology:** BESS Revenue Stack IRR
**Headline formula:** `Revenue = CM_rev + FFR_rev + Arb_rev; IRR: NPV(Revenue - OPEX - Augment - DebtService) = 0`

Revenue stacking across capacity market, frequency response and energy arbitrage is essential for bankable BESS IRR; degradation to 80% SoH at year 10 triggers augmentation cost.

**Standards:** ['BNEF BESS Market Outlook 2023', 'National Grid ESO Balancing Services', 'FERC Order 841 Storage Participation']
**Reference documents:** BNEF Energy Storage Market Outlook 2023; National Grid ESO Balancing Mechanism Reports; FERC Order 841 Energy Storage Participation in Markets 2018

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `EnergyAdvancedAnalytics`

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (partial).** The MODULE_GUIDES entry (EP-DT1) promises
> "degradation modelling to 80% end-of-life **and augmentation cost** for IRR optimisation" and a
> CAPEX waterfall (cells/BMS/PCS/EPC/grid). The code has **no augmentation cost anywhere** — the
> project cash flows simply floor the degradation factor at 0.7 — and no CAPEX component
> waterfall (capex is one $/kWh slider). The revenue-stack IRR core the guide describes *is*
> implemented, but note two code defects documented in §7.6: the capacity-market revenue line
> carries a stray ×1000 (making it ~1000× the other streams), and `calcLcos` accepts `degradePct`
> but never uses it.

### 7.1 What the module computes

A 10-tab BESS project-finance workbench (LCOS, chemistry comparison, revenue stacking,
degradation, project finance, Monte Carlo, market benchmarks, capex trajectory, investor
returns). Core engines, quoted from code:

```js
// LCOS (€/kWh delivered) — inline comment: "(capex + lifetime opex) / lifetime energy throughput"
capexAnn = capexPerKwh × (w) / (1 − (1+w)^−lifetime)      // CRF annualisation
opexAnn  = capexPerKwh × opexPct/100
LCOS     = (capexAnn + opexAnn) / (cycles × rte/100)      // throughput kWh/kWh-yr

// Arrhenius temperature acceleration (correct Boltzmann form, unlike bess-grid-analytics)
accel = exp( Ea/k × (1/T0 − 1/T1) ),  Ea = 0.6 eV, k = 8.617e-5 eV/K, T0 = 298.15 K
SoH   = 1 − (baseRate/100) × accel × √years

// Revenue stack (M€/yr), per market row
capacityMarket = MW × capMkt × 1000 × cfFcr/100 / 1e6     // ← stray ×1000, see §7.6
fcr            = MW × fcr × cfFcr/100 / 1e6
afrr           = MW × afrr × cfAfrr/100 / 1e6
arbitrage      = MW × arbitrage × cfArb/100 / 1e6

// Project finance
capexTotal = capexKwh × MW × hours × 1000 / 1e6           // M€
ebitda     = Σ revenue − capexTotal × opexPct/100
degradeFactor_y = max(0.7, 1 − (degradePct/100) × y)
IRR = NewtonRaphson(cashflows); NPV = Σ cf_t/(1+wacc)^{t+1}
```

### 7.2 Parameterisation

Chemistry catalogue (curated constants):

| Chemistry | capex $/kWh | opex %/yr | RTE | cycles/yr | cal. deg %/√yr | lifetime | TRL |
|---|---|---|---|---|---|---|---|
| LFP | 185 | 1.5 | 92% | 365 | 2.5 | 15 | 9 |
| NMC | 200 | 2.0 | 93% | 300 | 4.0 | 12 | 9 |
| LNMO | 220 | 2.5 | 91% | 250 | 3.5 | 10 | 7 |
| Na-Ion | 160 | 1.8 | 90% | 280 | 3.0 | 12 | 8 |

Market revenue benchmarks (€/MW/yr, curated): UK capMkt 45,000 / FCR 12,000 / aFRR 8,000 /
arbitrage 15,000; Germany 35k/14k/9k/18k; CAISO 55k/5k/6k/25k; etc. Capture/availability factors
default cfFcr 60%, cfAfrr 40%, cfArb 30%. Project defaults: 100 MW / 2 h / WACC 8% / 15 years /
degrade 2.5%/yr. Monte Carlo: 200 seeded draws, revenue shock U[0.7, 1.3], capex shock
U[0.85, 1.15], histogram over 20 IRR bins from −10% to +30%. All values are plausible-magnitude
demo constants (BNEF/National Grid-style per the guide), uncited in code.

### 7.3 Calculation walkthrough

1. Sliders (auto-populated when a chemistry is picked) → `calcLcos` → headline $/kWh-delivered
   KPI; `lcosByChemistry` re-runs it across the catalogue.
2. Market picker loads the country's four revenue rates → `revenueStack` → EBITDA → 
   `cashflows = [−capex, …(ebitda × degradeFactor_y)…]` → Newton–Raphson IRR (200 iterations,
   1e-8 tolerance, `isFinite` guarded to 'N/A') and NPV at WACC.
3. **Degradation tab** — three SoH curves: linear-with-cycling
   `100 − degradePct×y×(1+cycles/5000)`, Arrhenius at 25 °C, and Arrhenius at 35 °C.
4. **Monte Carlo** — 200 IRR draws under joint revenue/capex shocks; binned distribution.
5. **Capex trajectory** — 2025–2040 declining $/kWh line per `YEARS`.

### 7.4 Worked example — default LFP inputs

LCOS: CRF = 0.08 / (1 − 1.08⁻¹⁵) = 0.08/0.68476 = **0.11683**;
capexAnn = 185 × 0.11683 = $21.61/kWh-yr; opexAnn = 185 × 0.015 = $2.78;
throughput = 365 × 0.92 = 335.8 kWh delivered per kWh-yr →
**LCOS = 24.39 / 335.8 = $0.0726/kWh ≈ $72.6/MWh** — inside the guide's $80–200 band for 2-hour
systems (slightly below, since replacement/augmentation costs are excluded).

Arrhenius acceleration at 35 °C: `Ea/k × (1/298.15 − 1/308.15) = 6,963 × 1.0885e-4 = 0.758` →
accel = e⁰·⁷⁵⁸ = **2.13×**. So at year 9: SoH₂₅°C = 1 − 0.025×3 = 92.5% vs SoH₃₅°C = 1 −
0.025×2.13×3 = 84.0% — the "10 °C hotter ≈ double the aging" rule of thumb, correctly produced by
this module's Boltzmann-constant form (contrast `bess-grid-analytics`, whose calendar term
collapses to zero).

### 7.5 Companion analytics

Chemistry radar/compare (energy/power density, TRL, pros/cons), market benchmark bars across the
6 countries, safety & regulation tab (editorial content), and the shared
`EnergyAdvancedAnalytics` wrapper (EU Taxonomy/SBTi overlay added in the Sprint-Energy-advanced
uplift).

### 7.6 Data provenance & limitations

- Chemistry and market tables are **curated demo constants**; Monte Carlo shocks use the seeded
  PRNG (`sr(seed) = frac(sin(seed+1)×10⁴)`) — deterministic across runs.
- **Capacity-market ×1000 bug**: `capacityMarket = MW × capMkt × 1000 × …` while the other three
  streams omit the ×1000. With defaults this yields €2,700M/yr from the capacity market vs €0.72M
  (FCR) — total revenue and IRR are dominated by a unit error. Either `capMkt` should be €/kW/yr
  without ×1000-to-€/MW conversion elsewhere, or the ×1000 must go.
- `calcLcos` ignores its `degradePct` argument — LCOS assumes undegraded throughput for all 15
  years (understates LCOS a few percent); no replacement or augmentation cost enters LCOS or the
  cash flows (guide's 80%-SoH augmentation trigger unimplemented; the 0.7 floor on
  `degradeFactor` is the only end-of-life concession).
- Revenue streams are flat annual figures (no price escalation, no cannibalisation of arbitrage
  spreads); capture factors are shared across capacity market and FCR (`cfFcr` used for both).
- NPV convention discounts period 0 by (1+r)¹ (`t+1` exponent), i.e. treats capex as end-of-year-1
  — a half-convention difference vs the IRR function, which uses `t`.

### 7.7 Framework alignment

- **Revenue stacking practice (National Grid ESO / FERC 841 markets)** — capacity market
  (contracted £/kW/yr), frequency response (FCR/aFRR tendered €/MW/yr) and wholesale arbitrage
  stacked with availability factors: the module implements the canonical bankability arithmetic
  (modulo the ×1000 bug).
- **LCOS (PNNL/Lazard convention)** — annualised capex + O&M over annual delivered energy; the
  code's CRF-based single-line version is the Lazard-style simplification (no replacement,
  degradation or charging-cost terms; Lazard includes charging cost, which is absent here).
- **Arrhenius aging** — correct exp(Ea/k·(1/T0−1/T1)) acceleration with √t (diffusion-limited)
  time dependence, Ea = 0.6 eV in the LFP literature range.
- **BNEF BESS Market Outlook (guide reference)** — capex levels ($160–220/kWh 2025) and the
  declining trajectory tab match BNEF-style narratives; no citation vintage in code.

## 9 · Future Evolution

### 9.1 Evolution A — Fix the revenue-stack defects and add the missing augmentation model (analytics ladder: rung 2 → 3)

**What.** The workbench implements the guide's revenue-stack IRR core (CRF-annualised LCOS, a correct Boltzmann-form Arrhenius acceleration — better than sibling `bess-grid-analytics` — Newton–Raphson IRR, 200-draw Monte Carlo), but §7 documents three concrete gaps: the capacity-market revenue line carries a **stray ×1000** making it ~1000× the other streams; `calcLcos` accepts `degradePct` but never uses it; and the guide-promised **augmentation cost does not exist** — cash flows just floor degradation at 0.7. Evolution A fixes the defects and completes the model.

**How.** (1) Remove the ×1000 and re-baseline every revenue-stack figure (this bug distorts all IRR/NPV outputs today — treat as P1); thread `degradePct` into the LCOS throughput denominator. (2) Augmentation: when modelled SoH crosses the 80% threshold, inject a capex event sized from the $/kWh trajectory the page already charts, replacing the 0.7 floor — the guide's "IRR with and without augmentation" comparison becomes computable. (3) CAPEX waterfall (cells/BMS/PCS/EPC/grid/owner's costs) replacing the single $/kWh slider, reusing the component-share pattern from `battery-tech-supply-chain`'s cost stack. (4) Rung 3: converge market rates (`MARKETS` seed rows) with dated auction results, and route dispatch-dependent arbitrage through the shared `bess-stacking` backend rather than a flat $/kW-yr assumption; the Monte Carlo's seeded shocks gain user-controlled vol inputs.

**Prerequisites.** Regression snapshot before the ×1000 fix (every downstream figure changes); coordination with `bess-grid-analytics` and `battery-revenue-stacker` so the three BESS modules share one dispatch/degradation source of truth rather than three divergent local models. **Acceptance:** capacity-market revenue is the same order as FCR/aFRR for comparable rates; augmentation timing responds to the degradation sliders; a bench case pins IRR for a reference 100MW/4h project before/after augmentation.

### 9.2 Evolution B — Financing-structure copilot (LLM tier 2)

**What.** This module's audience is the project-finance analyst, so the copilot's job is deal-shaping: "at what capacity-market price does merchant IRR clear 12%?" (inverse what-if via repeated model calls), "how does LFP vs NMC chemistry change LCOS and augmentation timing?" (chemistry-parameterised runs over the `CHEMISTRIES` table), "what does the Monte Carlo P10–P90 IRR range look like with ±20% revenue vol?" — all executed against a backend extraction of the model, never estimated.

**How.** Extract the pure functions (`calcLcos`, revenue stack, degradation, IRR/NPV, MC) to `POST /api/v1/bess-finance/model`; tool schemas from that route. Grounding corpus: this Atlas record — §7.1's quoted formula block is the copilot's explanation source, and the §7 defect history is embedded so pre-fix outputs are never narrated as sound (the copilot refuses revenue-stack comparisons until the ×1000 fix is verified). Sensitivity questions use the model's own sweep capability; the copilot's added value is translating results into financing terms (DSCR headroom, merchant vs contracted mix) with each number tool-traced.

**Prerequisites (hard).** Evolution A's defect fixes and backend extraction — tool-calling a model with a known 1000× error would industrialise the error. **Acceptance:** every IRR/LCOS/DSCR figure traces to a model response; inverse what-ifs state the search grid used; chemistry comparisons quote the seed table's curated values with their provenance label.