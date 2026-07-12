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
