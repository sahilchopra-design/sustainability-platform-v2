## 7 · Methodology Deep Dive

> ℹ️ **Guide↔code note.** The guide (EP-EG6) gives `Transition_investment = CAPEX_premium × capacity ×
> phase-in`. The page does not compute that; instead each of 6 sectors carries hard-coded emissions,
> 2030/2050 abatement %, finance need and readiness, and a 16-deal pipeline is `sr()`-seeded. The live
> quantitative pieces are (a) a linear abatement-timeline interpolator and (b) a carbon-value overlay
> `emissions × abatement × carbonPrice`. Deal economics (IRR, DSCR, CI before/after) are seeded, not
> modelled from cash flows.

### 7.1 What the module computes

**Abatement timeline** (`timelineAbatement`) — piecewise-linear interpolation of each sector's decarb
trajectory:

```js
// pre-2030: ramp from 0 to abatement2030 over 2024→2030
t = abatement2030 × (yr − 2024) / 6
// post-2030: ramp from abatement2030 to abatement2050 over 2030→2050
t = abatement2030 + (abatement2050 − abatement2030) × (yr − 2030) / 20
```

**Carbon value overlay** (Abatement Levers tab):
```js
annualReduction = emissions × abatement2030 / 100        // MtCO₂/yr abated
carbonValue     = round( annualReduction × carbonPrice / 1e3 )   // $bn at slider price
```

**Radar** normalises three axes: `readiness` (0–100), `abatement2030×4`, `finance = min(100, financeNeed/12)`.

### 7.2 Parameterisation — sectors (`SECTORS`, 6 rows)

Provenance: IEA Industrial Decarbonisation Roadmap (per guide); values are illustrative sector economics.

| Sector | Emissions MtCO₂ | Abate 2030 % | Abate 2050 % | Finance need $bn | Readiness |
|---|---|---|---|---|---|
| Steel | 2,800 | 22 | 93 | 1,200 | 68 |
| Cement | 4,200 | 15 | 90 | 800 | 52 |
| Chemicals | 1,800 | 18 | 85 | 950 | 61 |
| Aviation | 1,000 | 8 | 70 | 600 | 45 |
| Shipping | 900 | 12 | 80 | 500 | 42 |
| Aluminium | 1,100 | 25 | 88 | 420 | 72 |

Cement's 4.2 GtCO₂ and lowest 2030 abatement (15%) capture its process-emissions difficulty; aviation/
shipping have the lowest readiness (45/42). Carbon-price slider default $80/t.

### 7.3 Calculation walkthrough

The 16 seeded `DEALS` (`sr()` PRNG) carry sector, country, structure (Green Bond / SLL / Transition Bond
/ Blended / KPI-linked), CAPEX ($100–1,000M), IRR (5–15%), DSCR (1.15–1.85), and CI before/after
(after = before × 0.05–0.30, i.e. 70–95% intensity cut). Filter-by-sector KPIs (`avgIrr`, `totalCapex`)
aggregate the pipeline. The abatement timeline and carbon-value overlay use the deterministic sector
constants.

### 7.4 Worked example (Steel abatement + carbon value at $80/t)

| Step | Computation | Result |
|---|---|---|
| 2028 abatement | 22 × (2028−2024)/6 | 14.7% |
| 2030 abatement | 22 × 6/6 | 22% |
| 2040 abatement | 22 + (93−22)×(2040−2030)/20 | 22 + 35.5 = 57.5% |
| annualReduction | 2,800 × 22/100 | 616 MtCO₂/yr |
| carbonValue | 616 × 80 / 1,000 | **$49.3bn** |

At $80/t carbon, steel's 2030 abatement (616 Mt) is worth ~$49bn/yr in avoided carbon cost — the
economic pull for the ~$1.2tn finance need. Aluminium reaches 25% by 2030 (fastest), aviation only 8%.

### 7.5 Data provenance & limitations

- **Deal pipeline is synthetic** (`sr(seed)=frac(sin(seed+1)×10⁴)`): IRR, DSCR, CAPEX, CI reductions and
  status are seeded, not from real transaction cash flows.
- Sector emissions/abatement/readiness are hard-coded illustrative values aligned to IEA/GFANZ ranges,
  not live.
- The abatement timeline is a **simple linear interpolation** between three anchor points (2024=0,
  2030, 2050) — no technology-diffusion S-curve, no cost-of-abatement ordering (MACC).
- Carbon value = flat `emissions × abatement × price` — no free-allocation, CBAM phase-in, or price path.

### 8 · Model Specification

**Status: specification — not yet implemented in code** (deal economics are seeded; the page has no
cash-flow or MACC-based transition-investment model).

**8.1 Purpose & scope.** Size transition finance need and screen deal economics for 6 hard-to-abate
sectors, ranking abatement levers by cost and mapping the capital stack, for banks structuring
transition instruments.

**8.2 Conceptual approach.** A marginal-abatement-cost-curve (MACC) per sector combined with a
project-finance cash-flow model, mirroring IEA ETP technology cost curves and GFANZ transition-finance
framework; carbon value from a scenario carbon-price path net of free allocation/CBAM.

**8.3 Mathematical specification.**
```
Per lever k: MAC_k = (CAPEX_k·CRF + ΔOPEX_k − carbon_saving_k) / abatement_k   ($/tCO₂)
Deploy levers in ascending MAC until sector abatement target met
Transition_investment = Σ_k CAPEX_k · capacity_deployed_k
Deal: DSCR_t = CFADS_t / DebtService_t ;  IRR from equity cash flows
Carbon value = abatement · (ETS_price_path − free_alloc − CBAM_offset)
Green premium / SLL ratchet applied to debt margin per KPI achievement
```

| Parameter | Source |
|---|---|
| Lever CAPEX/OPEX/abatement | IEA ETP / sector roadmaps |
| Carbon price path | EU ETS forwards + NGFS scenarios |
| CRF (WACC, life) | 7–9%, 20–25 yr |
| SLL ratchet | LMA/APLMA SLL Principles (3–10 bps) |
| Greenium | CBI/BNEF (5–25 bps for verified HtA plans) |

**8.4 Data requirements.** Sector abatement-lever library (cost, potential), project cash-flow inputs,
carbon-price path, deal structure terms. The page holds sector abatement targets and finance need.

**8.5 Validation.** Reconcile transition-investment totals against IEA's $2.4–3.5tn cumulative estimate;
back-test deal IRR/DSCR against real transition deals; check MACC ordering against published sector MACCs.

**8.6 Limitations & model risk.** MACC is static and sector-average; technology cost trajectories are
uncertain; carbon-price and CBAM policy risk dominates. Conservative fallback: report abatement
potential and finance-need ranges rather than point transition-investment figures.

**Framework alignment:** GFANZ Transition Finance Framework — instrument taxonomy (Green/Transition/SLL/
Blended); IEA Industrial Decarbonisation Roadmap — sector abatement pathways; Climate Bonds Initiative
Transition Finance Criteria — credibility screen; LMA/APLMA SLL Principles — margin ratchet; EU
Innovation Fund — the public co-finance layer in the blended stack.
