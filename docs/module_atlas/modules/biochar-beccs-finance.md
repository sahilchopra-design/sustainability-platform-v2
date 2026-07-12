# Biochar & BECCS Finance Platform
**Module ID:** `biochar-beccs-finance` · **Route:** `/biochar-beccs-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-EH3 · **Sprint:** EH

## 1 · Overview
Biomass carbon removal finance: pyrolysis biochar (100–300 yr permanence) and bioenergy with CCS (geological permanence). 22 seeded projects covering 6 feedstocks, IRA §45Q eligibility matrix, project IRR/NPV engine (Newton-Raphson), permanence-LCOC trade-off, and advance buyer intelligence.

> **Business value:** Used by biochar producers optimising pyrolysis economics, BECCS developers structuring CCS integration, carbon buyers evaluating permanence, and investors analysing biomass CDR project returns.

**How an analyst works this module:**
- Review project overview for 22 biochar and BECCS projects
- Examine feedstock economics for LCOC and permanence by feedstock type
- Use project finance model with carbon price and feedstock cost sliders
- Analyse IRA §45Q eligibility matrix for all biochar and BECCS technology variants

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `FEEDSTOCKS`, `IRA_BREAKDOWN`, `KpiCard`, `LCOC_COMPARISON`, `MARKET_FORECAST`, `PROJECTS`, `Pill`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `FEEDSTOCKS` | 7 | `name`, `yield`, `cost`, `permanence`, `lcoc`, `pathway` |
| `LCOC_COMPARISON` | 7 | `lcoc`, `permanence`, `scalability` |
| `IRA_BREAKDOWN` | 7 | `iraSection`, `ratePerTon`, `eligible` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `npv` | `cashflows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + rate, t), 0);` |
| `dnpv` | `cashflows.reduce((acc, cf, t) => t === 0 ? acc : acc - t * cf / Math.pow(1 + rate, t + 1), 0);` |
| `next` | `rate - npv / dnpv;` |
| `finModel` | `useMemo(() => { const capex = 50; // $M const annualCDR = 10000; // tCO₂ const revenue = annualCDR * carbonPrice;` |
| `opex` | `annualCDR * feedstockCost * 0.5;` |
| `ebitda` | `revenue - opex;` |
| `cfs` | `[-capex * 1e6, ...Array.from({ length: 20 }, () => ebitda)];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `FEEDSTOCKS`, `IRA_BREAKDOWN`, `LCOC_COMPARISON`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Biochar stable carbon fraction | `H:Corg ratio <0.7 → >70% stable; <0.4 → >90% stable` | EBC European Biochar Certificate Standard | H:Corg is key permanence proxy; Puro requires H:Corg <0.7; EBC Premium requires <0.4; measured via elemental analysis. |
| BECCS geological storage cost ($/tCO₂) | `Saline aquifer or depleted reservoir injection cost` | IEA CCS Roadmap + IEAGHG | Transport + injection: $10–25/tCO2; monitoring $3–8/tCO2/yr; reduces net LCOC of BECCS by $15–30/tCO2 vs DAC. |
| IRA §45Q BECCS power ($/tCO₂) | `Bioenergy power plant with CCS geological storage` | IRS §45Q Final Regulations 2024 | Eligible for $85/t if >80% capture efficiency; DAC-equivalent ($180/t) not applicable to BECCS unless integrated with DAC. |
- **Puro.earth + EBC standards + IRA §45Q statute + IEA BECCS data** → IRR/NPV project finance engine + 22 projects + §45Q eligibility + permanence scatter → **Biochar producers, BECCS developers, carbon buyers, and investors evaluating biomass CDR economics**

## 5 · Intermediate Transformation Logic
**Methodology:** Biochar Carbon Removal (tCO₂/t feedstock)
**Headline formula:** `CDR = Feedstock_mass × Carbon_yield × (1 − labile_fraction) × stable_C_fraction`

Agricultural residues: 0.25–0.35 tCO2/t feedstock net CDR; forest residues: 0.30–0.40 tCO2/t; stable C fraction >80% for Puro.earth registration.

**Standards:** ['Puro.earth Biochar Methodology', 'IBI/EBC Biochar Standard', 'IPCC AR6 WG3 Ch.7 Biomass']
**Reference documents:** Puro.earth (2023) – Biochar Carbon Removal Methodology; EBC (2023) – European Biochar Certificate Standard v9.3; IEA (2023) – BECCS in Net Zero Scenarios

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Parameterise the finance model with the feedstock physics it already ships (analytics ladder: rung 1 → 2)

**What.** The page carries genuinely good reference content — a real Newton–Raphson IRR solver, a `FEEDSTOCKS` table with defensible techno-economics (CDR yields 0.15–0.33 tCO₂/t, permanence, LCOC), and an `IRA_BREAKDOWN` correctly encoding §45Q/§45Z/§45Y rates — but the interactive finance model ignores nearly all of it: capex is fixed at $50M, annualCDR at 10,000 t, opex is `feedstockCost × 0.5` regardless of feedstock, and the two sliders (carbon price, feedstock cost) are the only levers. The 22-project pipeline is seeded PRNG. Evolution A connects the model to its own tables.

**How.** (1) The finance model takes feedstock and pathway as inputs: `annualCDR = feedstock_tonnes × CDR_yield` from `FEEDSTOCKS`; capex scales with throughput and pathway (biochar pyrolysis vs BECCS capture+storage — the guide's $10–25/t transport/injection plus $3–8/t/yr monitoring becomes an explicit BECCS opex line); the applicable IRA credit auto-selects from `IRA_BREAKDOWN` (BECCS power $85/t at >80% capture; biochar $35 under the "§45Q Modified" reading, flagged as an interpretive position). (2) The permanence–LCOC trade-off becomes computable: buyers price permanence, so revenue = tonnes × price(permanence tier), replacing the single carbon-price slider. (3) The headline formula (`CDR = mass × C_yield × (1−labile) × stable_C`) gets implemented with H:Corg as the stable-fraction input per EBC/Puro thresholds. (4) The seeded 22 projects become worked examples of the model or are labelled illustrative.

**Prerequisites.** Sourced capex scaling factors per pathway (IEA/IEAGHG figures the §4.1 rows already cite); a documented stance on the §45Q-biochar eligibility question (it is genuinely unsettled — the model must flag it). **Acceptance:** switching feedstock changes CDR, opex, credit rate, and IRR coherently; a BECCS run includes storage and monitoring opex lines; the H:Corg input moves stable carbon fraction across the Puro 0.7 threshold with the registration flag flipping.

### 9.2 Evolution B — CDR offtake-structuring copilot (LLM tier 2)

**What.** The module's buyer-intelligence angle is where an LLM helps most: "structure a 50 kt/yr agricultural-residue biochar offtake — what LCOC, what IRA support, what permanence can we claim, and at what carbon price does the project clear a 12% IRR?" The copilot runs the Evolution-A model as tools (feedstock-parameterised runs, inverse price search), then drafts the offtake term-sheet narrative: permanence tier with its EBC/Puro evidentiary basis (H:Corg thresholds), credit stacking with the §45Q-biochar caveat stated, and delivery-volume sensitivity — every number tool-traced.

**How.** Backend extraction of the model (`POST /api/v1/biochar-beccs/model`; the IRR solver is pure and small) with tool schemas from it; grounding corpus is this Atlas record — §7.2's feedstock table and the IRA rate matrix are the corpus core, and the market-forecast series (compounding volume, decaying price) is disclosed as a curated scenario, not a forecast the copilot may cite as fact. The refusal path covers registry verdicts: the copilot can state Puro's H:Corg requirement but cannot certify a project — certification is the registry's, and the answer must say so.

**Prerequisites (hard).** Evolution A — tool-calling a model whose opex ignores feedstock would produce confidently wrong term sheets. **Acceptance:** every IRR/LCOC/price figure traces to a model response; the §45Q-biochar position is caveated verbatim from the model's documented stance; inverse searches state their grid.