## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a four-channel decomposition
> (`TransRisk = PolicyRisk + TechRisk + MarketRisk + ReputationRisk`). **No such decomposition exists
> in code.** The page ships six loosely-coupled tabs: a static 12-sector risk-score table with a
> single scenario multiplier, a carbon-cost projection (`rev × CI × price`), a CBAM cost table,
> a static PCAF data-quality panel, an SDA pathway-gap view, and a policy/litigation tracker.
> Two of these tabs contain live defects documented in §7.6. The sections below document the code
> as it actually behaves.

### 7.1 What the module computes

Six independent calculations, all client-side (`ClimateTransitionRiskPage.jsx`), drawing NGFS
Phase IV scenario constants from the shared `climateRiskDataService.js`:

```
Tab 1  score_s = SECTORS_T1[s].score × mult          mult = 0.90 (NZ2050) | 1.15 (CP) | 1.0 (else)
Tab 2  carbonCost_s,yr ($M) = rev_s ($bn) × CI_s (tCO2/$M) × price_yr ($/t) / 1000
Tab 3  cbamCost_c (€M) = computeCBAMCost(embCO2_c, price, tonnage_c)      [buggy — see §7.6]
Tab 4  avgDQS = Σ PCAF_CATS.score / 8                (static PCAF panel)
Tab 5  gap_s % = (current/target2030 − 1) × 100      [reads non-existent field — see §7.6]
Tab 6  index_m = 45 + sr(m×7) × 30                   (synthetic 24-month risk index)
```

### 7.2 Parameterisation

**Sector risk table `SECTORS_T1`** (12 sectors, hand-authored constants, no cited source —
synthetic demo values calibrated to plausible orderings):

| Sector | Score (0–10) | CI (tCO₂/$M) | CBAM | SBTi % | Stranded $bn | Readiness |
|---|---|---|---|---|---|---|
| Coal Mining | 9.2 | 820 | ✔ | 4 | 42 | 12 |
| Oil & Gas | 8.5 | 540 | ✘ | 11 | 38 | 18 |
| Steel | 7.8 | 460 | ✔ | 18 | 28 | 32 |
| … | | | | | | |
| Technology | 2.3 | 45 | ✘ | 62 | 1 | 82 |
| Renewables | 1.1 | 18 | ✘ | 71 | 0 | 95 |

**NGFS Phase IV carbon-price paths** (`CARBON_PRICE_PATHS`, $/tCO₂ — consistent in shape with the
NGFS Nov-2023 Phase IV release, e.g. NZ2050 $190 in 2030 / $700 in 2050; Current Policies $10/$25):

| Year | NZ2050 | Below 2°C | Divergent NZ | Delayed Transition | NDC | Current Policies |
|---|---|---|---|---|---|---|
| 2025 | 55 | 35 | 65 | 12 | 12 | 8 |
| 2030 | 190 | 95 | 230 | 30 | 20 | 10 |
| 2050 | 700 | 310 | 800 | 750 | 60 | 25 |

**CBAM embedded-intensity map `CBAM_META`** (tCO₂e/t product): Steel 1.85, Cement 0.82,
Aluminium 8.50, Fertilisers 2.20, Electricity 0.45, Hydrogen 9.80 — the six CBAM Annex I product
groups of EU Reg 2023/956; magnitudes match typical default values (e.g. ~1.8–2.1 t/t for BOF steel).

**PCAF panel `PCAF_CATS`**: 8 asset classes with hard-coded data-quality scores (2–4), financed
emissions (2.4–18.2 MtCO₂e) and data-availability %. The 1–5 quality legend matches the PCAF
Global Standard scale (1 = verified primary data … 5 = estimated).

**Tab-1 scenario multiplier** `mult = {nz2050: 0.90, cp: 1.15, else 1.0}` is a synthetic demo
heuristic. Note it *contradicts* the service's own NGFS data (`transitionRiskScore`: NZ2050 = 8.5,
CP = 1.5): for transition risk, ambitious policy should *raise* the score and Current Policies
should *lower* it, not the reverse.

### 7.3 Calculation walkthrough

1. **Tab 1** maps the scenario picker index into `NGFS_PHASE4`, applies the flat `mult` to every
   sector score, and colour-codes >7 red / >4 amber.
2. **Tab 2** looks up the selected scenario's carbon price for each of 6 milestone years and
   computes `rev × ci × price / 1000` per sector — i.e. it treats the *entire* revenue base as
   carbon-cost-bearing at the sector's average intensity with zero pass-through, zero abatement.
   Headline `pctInc = (total2050/total2025 − 1) × 100` (guarded for zero).
3. **Tab 3** iterates 8 importer entities through `computeCBAMCost` at the selected €45/90/130
   price (see bug below).
4. **Tab 5** plots each SDA sector's 2020→2050 intensity pathway and a 2030 overshoot bar.
5. **Tab 6** renders static policy-driver probabilities/impacts and six real named litigation
   cases (Milieudefensie v Shell, Held v Montana, etc. — real cases, hand-summarised).

### 7.4 Worked example — Tab 2 carbon cost (Oil & Gas, Net Zero 2050)

`rev = $45.8bn`, `CI = 540 tCO₂/$M`, NZ2050 price 2030 = $190/t, 2050 = $700/t:

| Step | Computation | Result |
|---|---|---|
| Cost 2030 | 45.8 × 540 × 190 / 1000 | **$4,699M** |
| Cost 2050 | 45.8 × 540 × 700 / 1000 | **$17,312M** |
| Portfolio 2025 total | Σ rev×ci×55/1000 over 6 sectors (Σ rev×ci = 60,884) | **$3,349M** |
| Portfolio 2050 total | Σ rev×ci×700/1000 | **$42,619M** |
| `pctInc` | (42,619/3,349 − 1) × 100 | **≈ +1,173%** |

(The unit reading is: $bn revenue × tCO₂/$M revenue = ktCO₂; ×$/t /1000 → $M. Arithmetically the
formula is `rev_$bn × CI × price` interpreted as $M of annual carbon cost.)

### 7.5 Companion analytics

- **SDA pathways** (`SDA_PATHWAYS`, shared service): 8 sectors with NZE-style intensity milestones
  (Steel 1.85 → 0.10 tCO₂/t; Power 450 → 5 gCO₂/kWh), consistent in shape with IEA NZE / SBTi SDA
  convergence pathways.
- **Policy drivers**: 6 drivers with materialisation probability (45–82%) and impact ranges
  ($3–60bn) — synthetic demo values.
- Cross-links to `/ngfs-scenarios` and `/stress-test-orchestrator`.

### 7.6 Data provenance & limitations (including live defects)

- **Defect 1 — CBAM price selector is inert.** The page calls
  `computeCBAMCost(CBAM_META[product], price, tonnage)` but the service signature is
  `computeCBAMCost(euRevenueM, sector, carbonPricePerTonne)`. The price lands in the `sector`
  argument, the intensity lookup fails, and the fallback intensity 0.3 is used; tonnage lands in
  the price slot. Effective formula: `cost = embCO2 × 0.3 × tonnage × 1000` — **independent of the
  selected €45/90/130 price** and mis-scaled (e.g. "EU Domestic" steel shows €4,551,000M).
- **Defect 2 — SDA gap reads a non-existent field.** Tab 5 uses `s.current`, but the service
  exports `currentGlobal`. Every `gap`, `avgOver` and the on-track count evaluate on `undefined`,
  producing `NaN%` gaps and `0/8` on track regardless of data.
- All sector scores, PCAF figures, policy probabilities, and the Tab-6 index are **synthetic demo
  data**; the index uses the platform PRNG `sr(seed) = frac(sin(seed+1)×10⁴)`.
- The KPI cards (Transition VaR $12.4bn, CBAM €2.1bn, 84 MtCO₂ financed) are hard-coded strings
  not derived from any calculation.
- No pass-through, abatement, demand elasticity, or free-allocation phase-out in the carbon-cost
  model; CBAM ignores the 2026–2034 free-allowance phase-in of Reg 2023/956.

**Framework alignment:** NGFS Phase IV (Nov 2023) — scenario names, carbon prices, and category
labels (Orderly/Disorderly/Hot House) follow the real release · EU CBAM Reg 2023/956 — correct six
product groups, but no phase-in factor · PCAF Global Standard — the 1–5 data-quality scale is the
genuine PCAF scoring ladder (option-based per asset class) · SBTi SDA — sectoral intensity
convergence concept (asset intensity converging to a sector NZE budget) is correctly represented
in the pathway table · TCFD/ECB CST are named in the guide but have no code counterpart.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Replace the static sector-score table and inert CBAM calculator with an issuer-level transition
cost-and-repricing model supporting (i) portfolio transition-risk ranking, (ii) CBAM liability
forecasting, (iii) scenario earnings-at-risk. Coverage: listed corporates and loan books mapped to
NACE sectors.

### 8.2 Conceptual approach
Bottom-up cash-flow channel model in the style of **MSCI Climate VaR (policy-risk module)** and
**BlackRock Aladdin Climate transition repricing**, with sector pathways per **NGFS Phase IV/V**
and abatement-cost logic per IEA WEO marginal abatement curves. Earnings shock → equity/credit
repricing via a Gordon-growth or duration approximation, mirroring the ECB economy-wide climate
stress-test design.

### 8.3 Mathematical specification
For issuer *i*, scenario *s*, year *t*:

```
CarbonCost_i,t = (E1_i,t + λ·E2_i,t) × P_s,t × (1 − FA_i,t)           direct cost
E_i,t          = E_i,0 × (1 − a_i)^t,  a_i = min(a_max, MAC⁻¹(P_s,t)) abatement response
PassThrough_i  = ρ_sector ∈ [0,1]                                     price pass-through
ΔEBITDA_i,t    = −CarbonCost_i,t × (1 − ρ) + ΔRevenue_i,t(demand elasticity ε_s)
CBAM_i,t       = Σ_p Vol_i,p,t × (EF_p − bench_p) × (P_EU,t − P_origin,t) × φ_t
ΔV_i           = Σ_t ΔFCF_i,t / (1+WACC_i)^t ;  TransitionScore_i = rank(ΔV_i / EV_i)
```

| Parameter | Value / source |
|---|---|
| `P_s,t` carbon price | NGFS Phase IV/V scenario database (REMIND-MAgPIE marker) |
| `EF_p` CBAM product EFs | EU Commission CBAM default values (Reg 2023/956 Annex IV) |
| `φ_t` CBAM phase-in | 2.5% (2026) → 100% (2034), CBAM Implementing Reg |
| `ρ_sector` pass-through | 0.3–0.9 by sector, ECB CST 2022 occasional paper calibration |
| `ε_s` demand elasticity | IPCC AR6 WGIII Ch.6 (oil −0.05 to −0.15 per $/t) |
| `MAC` curves | IEA WEO 2024 / McKinsey MACC public versions |
| `a_max` | 7%/yr cap, SBTi 1.5°C linear-annual-reduction benchmark (4.2%) + headroom |

### 8.4 Data requirements
Scope 1/2 emissions and revenue (already in platform: `reference_data` OWID CO₂ + SBTi tables;
`COMPANY_MASTER` context), EU import volumes by CN code (Eurostat Comext, free), EPC of free
allocation (EU Transaction Log, free), carbon prices (ICE EUA; platform's EEX/ICE seed from
sprint EA-hybrid-v3), WACC (climate-wacc-engine module).

### 8.5 Validation & benchmarking plan
Backtest ΔEBITDA against realised EU ETS Phase 3→4 cost incidence for power utilities; reconcile
issuer rankings against MSCI Low Carbon Transition scores and TPI Management Quality (rank
correlation ≥ 0.6 target); sensitivity: ±50% pass-through, ±1 elasticity class; stability: year-on-
year score migration matrix.

### 8.6 Limitations & model risk
Pass-through and elasticity are the dominant uncertainties (conservative fallback: ρ = 0, full
cost absorption). MACC-implied abatement assumes rational response — disable (`a_i = 0`) for
stress floors. CBAM origin-price credit assumes verifiable foreign carbon pricing; default to
zero credit where unverified.
