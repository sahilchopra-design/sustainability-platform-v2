## 7 · Methodology Deep Dive

### 7.1 What the module computes

The page runs one genuine finance calculation — a 20-year project IRR/NPV via
Newton-Raphson — on top of a synthetic 22-project pipeline and static reference
tables. The interactive finance model:

```js
capex     = 50        // $M (fixed)
annualCDR = 10000     // tCO₂
revenue   = annualCDR × carbonPrice           // slider $/tCO₂
opex      = annualCDR × feedstockCost × 0.5    // slider $/t feedstock
ebitda    = revenue − opex
cfs       = [−capex×1e6, ...20 × ebitda]
irr       = calcIRR(cfs)                        // Newton-Raphson, 100 iters
npv       = Σ cf_t / 1.08^t                     // fixed 8% discount
```

`calcIRR` is a correct Newton solver: it seeds rate 0.1 and iterates
`rate − NPV/NPV'` until |Δ| < 1e-6, with the analytic derivative
`NPV' = −Σ t·cf_t/(1+r)^(t+1)`.

### 7.2 Parameterisation / reference tables

`FEEDSTOCKS` (6 rows) carry real biochar/BECCS techno-economics:

| Feedstock | CDR yield (tCO₂/t) | Cost $/t | Permanence yr | LCOC $/t | Pathway |
|---|---|---|---|---|---|
| Agricultural residues | 0.30 | 25 | 100 | 75 | Biochar |
| Forest residues | 0.33 | 35 | 150 | 90 | Biochar |
| Wood pellets | 0.32 | 90 | 120 | 180 | BECCS |
| Municipal solid waste | 0.18 | 15 | 80 | 65 | Biochar |
| Miscanthus/switchgrass | 0.28 | 55 | 110 | 220 | BECCS |
| Macroalgae/seaweed | 0.15 | 80 | 500 | 350 | Biochar |

`IRA_BREAKDOWN` encodes the real US §45Q/§45Z/§45Y credit rates: BECCS power/
industrial $85/tCO₂, biochar (PyC) $35 under a "§45Q Modified" reading, pyrolysis
RNG $20 (§45Z), biomass power $15 (§45Y); DAC-equivalent $180 flagged *ineligible*
for BECCS. `LCOC_COMPARISON` gives BECCS geological permanence as 10,000 yr.
`MARKET_FORECAST` compounds volume (biochar `2×1.65^i`, BECCS `0.5×1.8^i` Mt) and
decays price (biochar `120×0.93^i`, BECCS `220×0.91^i` $/t) over 2024–2033.

The 22 `PROJECTS` are seeded: `capex = 5+sr()×95` $M, `lcoc = 60+sr()×340`,
`annualCDR = 200+sr()×19800`, `priceUSD = 100+sr()×500`, `irr = 8+sr()×15`%.

### 7.3 Calculation walkthrough

Filter by type (Biochar/BECCS) → portfolio KPIs (mean LCOC, total CDR in ktCO₂,
mean IRR, mean price). The finance tab is independent of the pipeline: two sliders
(carbon price default $120, feedstock cost default $40) drive the fixed-scale
10 ktCO₂/yr, $50M-CAPEX archetype through the IRR/NPV engine.

### 7.4 Worked example

Carbon price $120/t, feedstock cost $40/t:

| Step | Computation | Result |
|---|---|---|
| Revenue | 10,000 × 120 | $1.20M/yr |
| Opex | 10,000 × 40 × 0.5 | $0.20M/yr |
| EBITDA | 1.20 − 0.20 | $1.00M/yr |
| Cash flows | [−$50M, 20×$1.0M] | — |
| NPV @8% | −50M + 1.0M × 9.818 | **−$40.2M** |
| IRR | 20×$1M on $50M | **negative (~−7%)** |

At $120/t the archetype is deeply uneconomic — CAPEX dwarfs the $1M EBITDA. The
model turns positive only when carbon price rises enough that
`10,000×(price − 20) × 9.818 > 50M`, i.e. price ≳ $530/t — illustrating why biochar
CDR needs either far lower CAPEX intensity or premium ($100–500) offtake, both of
which the seeded pipeline assumes.

### 7.5 Data provenance & limitations

- 22 projects are **synthetic** (`sr()` PRNG). The FEEDSTOCKS, IRA and LCOC tables
  are real, well-sourced constants (Puro.earth, EBC, IEA, IRS §45Q).
- The finance model fixes CAPEX at $50M and CDR at 10 ktCO₂ regardless of feedstock
  — it ignores the feedstock CDR yield and permanence entirely, so opex `×0.5` is
  an undocumented heuristic (implicitly, feedstock is half of opex).
- Permanence (H:Corg proxy, buffer pools) is displayed but not risk-adjusted into
  creditable tonnes; no discounting of non-permanent biochar carbon.

**Framework alignment:** Puro.earth Biochar Methodology & EBC (H:Corg <0.7 ⇒ >70%
stable carbon; the permanence-LCOC scatter uses these tiers) · IPCC AR6 WG3 Ch.7
biomass CDR · IRS §45Q Final Regulations (the $85/$35/$180 rates are quoted
faithfully). ICVCM-style durability is represented by the permanence-years field
but not converted to a discounting factor.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Value a biochar or BECCS carbon-removal project on a
*creditable-tonne* basis and produce IRR/NPV under stochastic carbon price and
permanence risk — for CDR developers, advance-purchase buyers (Frontier), and
project-finance lenders.

**8.2 Conceptual approach.** A net-CDR mass-balance (Puro.earth / EBC) feeding a
levered project-finance model with a permanence-discounted credit ledger,
benchmarked against **Puro.earth registered project economics** and **IEA BECCS in
Net Zero** cost curves. Carbon price is a stochastic factor à la a mean-reverting
commodity model (cf. **Trucost/ICE EUA** forward curves).

**8.3 Mathematical specification.**
```
Net_CDR = M_feed · y_C · (1 - f_labile) · f_stable - E_process - E_transport
Creditable_t = Net_CDR · (1 - buffer_pool) · durability_factor(H:Corg)
Revenue_t = Creditable_t · P_carbon,t        P_carbon,t ~ OU process
LCOC = (CAPEX·CRF + OPEX_fixed + M_feed·c_feed) / Net_CDR - subsidy_45Q
NPV = Σ (Revenue_t - OPEX_t - Tax_t)/(1+w)^t - CAPEX
IRR: NPV(r*) = 0
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Carbon yield | y_C | Feedstock elemental analysis; EBC |
| Stable-C fraction | f_stable | H:Corg curve (EBC / Puro.earth) |
| Buffer pool | — | Registry rule (Puro ~ project-risk based) |
| §45Q credit | subsidy | IRS §45Q ($85 geologic / $35 biochar) |
| Carbon price OU | κ,θ,σ | ICE/EEX EUA + VCM CDR forwards |
| WACC | w | Deal capital stack |

**8.4 Data requirements.** Feedstock tonnage & elemental composition, pyrolysis
energy balance, transport distances, registry buffer %, CAPEX/OPEX schedule,
45Q eligibility, carbon-price forward curve. Platform holds the §45Q table and
feedstock techno-economics; the OU price process and per-project mass balance are new.

**8.5 Validation & benchmarking.** Reconcile Net_CDR against Puro.earth issuance
per registered project; LCOC against IEA BECCS ($100–200/t) and biochar
($75–350/t) ranges; Monte-Carlo the OU carbon price to produce an IRR distribution
and P(IRR>hurdle). Backtest durability factor against measured 100-yr decay data.

**8.6 Limitations & model risk.** Permanence physics (H:Corg → centennial decay)
is uncertain; buffer pools are policy not physics; BECCS depends on contested
biomass-sustainability accounting. Conservative fallback: durability_factor floored
by registry minimum, carbon price at the 25th-percentile forward, no terminal value.
