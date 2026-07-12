## 7 · Methodology Deep Dive

This module (EP-DW1) is **substantially model-backed and matches its guide well**. It computes a genuine
PCAF-style weighted-average carbon intensity (WACI), financed emissions, exponential decarbonisation
pathways, and NZBA sector-alignment gaps over **hand-set, realistic sector data** (not `sr()` seeded).
The one heuristic is the WACI→portfolio-temperature mapping (a piecewise step function, not an SBTi/MSCI
ITR model) — the trigger for a §8 spec.

### 7.1 What the module computes

```js
// PCAF weighted-average carbon intensity
calcWaci(loans) = Σ (waci_s · loanExposure_s) / Σ loanExposure_s

// Total financed emissions (WACI × exposure, /1000 to ktCO₂e)
totalFinancedEmissions = Σ (waci_s · loanExposure_s / 1000)

// WACI → implied temperature (piecewise heuristic)
calcPortfolioTemp(waci):
  waci<80  → 1.5
  waci<150 → 1.7 + (waci−80)/70·0.3
  waci<350 → 2.0 + (waci−150)/200·0.6
  waci<600 → 2.6 + (waci−350)/250·0.5
  else     → 3.1 + (waci−600)/400·0.5

// Pathways (exponential decay, scenario-dependent)
waciByYear:  waci·exp(−decay·(year−2020))     decay = 0.048 engage / 0.036 divest / 0.065 aggressive
pathwayData: portfolio vs Paris (−0.65 slope) vs NDC (−0.45 slope)
```

The WACI and financed-emissions formulas are **exactly PCAF-consistent**. The pathway decays are
scenario-parameterised and monotone.

### 7.2 Parameterisation & provenance

| Element | Provenance |
|---|---|
| `PORTFOLIO_SECTORS` (8) | **Hand-set, realistic WACI** (tCO₂e/$M): Power 485, Oil & Gas 920, Steel 1840, Cement 720, Shipping 890, Aviation 650, Real Estate 42, Automotive 185 — with 2030/2050 targets and pathway gaps. Values are credible sector intensities, not seeded |
| `calcPortfolioTemp` bands | **Heuristic** step function — not SBTi/MSCI ITR methodology |
| Decay rates (0.048/0.036/0.065) | Editorial scenario assumptions (engage/divest/aggressive) |
| Paris slope (−0.65), NDC (−0.45) | Editorial; Paris steeper than NDC (correct direction) |
| `PCAF_SCORES` (7) | **Accurate PCAF methodology**: EVIC attribution `FE = (equity/EVIC)·GHG`; revenue attribution for loans; GDP attribution for sovereigns; EPC-based for mortgages — all real PCAF asset-class methods |
| `NZ_ALLIANCES` (5) | **Real**: NZBA (143 members, $74T), NZAOA, NZAMI, PCAF, GFANZ with correct frameworks |
| `INTERIM_TARGETS` (5) | Real 2019 baselines + 2025/2030 trajectories incl. CRREM 1.5°C for real estate |

### 7.3 Calculation walkthrough

1. `activeSectors` = user-selected sectors; `portfolioWaci = calcWaci(activeSectors)`.
2. `portfolioTemp = calcPortfolioTemp(waci)` maps intensity to an implied °C.
3. `totalFinancedEmissions = Σ waci·exposure/1000`.
4. `pathwayData` projects portfolio vs Paris vs NDC emissions to 2050 under the chosen scenario.
5. `waciByYear` decays WACI exponentially; `tempByYear` re-maps to temperature.
6. `sectorGapData` shows each sector's gap to its 2030 target.

### 7.4 Worked example (full 8-sector portfolio)

WACI numerator `Σ waci·exposure`:

| Sector | waci · exposure |
|---|---|
| Power | 485·18.5 = 8,972 |
| Oil & Gas | 920·12.2 = 11,224 |
| Steel | 1840·8.7 = 16,008 |
| Cement | 720·6.4 = 4,608 |
| Shipping | 890·9.1 = 8,099 |
| Aviation | 650·7.8 = 5,070 |
| Real Estate | 42·22.4 = 941 |
| Automotive | 185·11.3 = 2,091 |
| **Σ** | **57,013** |

Total exposure `Σ = 96.4`; `WACI = 57,013/96.4 = 591 tCO₂e/$M`.
`calcPortfolioTemp(591)`: 350 ≤ 591 < 600 → `2.6 + (591−350)/250·0.5 = 2.6 + 0.48 = 3.08°C`.
`totalFinancedEmissions = 57,013/1000 = 57.0 ktCO₂e`. Under "engage" (decay 0.048), WACI in 2030 =
`591·exp(−0.048·10) = 591·0.619 = 366 tCO₂e/$M`. All genuine arithmetic on realistic inputs.

### 7.5 Data provenance & limitations

- **Sector WACI, financed-emissions, and WACI arithmetic are real and PCAF-consistent** on hand-set
  realistic data — not `sr()` seeded (the PRNG is only used for a minor `waciVal` helper).
- **The WACI→temperature mapping is a heuristic step function** — it is *not* SBTi's Temperature Rating
  or MSCI's ITR methodology, which derive implied temperature from company-level target ambition vs
  carbon-budget allocation, not from a single WACI band.
- Pathway decay rates and Paris/NDC slopes are editorial scenario assumptions.
- Portfolio is 8 aggregate sectors, not a bottom-up loan book.

**Framework alignment:** WACI and financed emissions follow the **PCAF Global GHG Accounting Standard**
(the `PCAF_SCORES` table correctly documents EVIC/revenue/GDP/EPC attribution and DQ1–5 scoring). Sector
pathways and 2030 interim targets reflect the **Net-Zero Banking Alliance (NZBA)** target-setting
guidelines and **IEA NZE** sector trajectories; real estate uses **CRREM 1.5°C**. The implied-temperature
metric is the piece that needs a real model.

## 8 · Model Specification

**Status: specification — not yet implemented (WACI/financed-emissions already real; temperature mapping
is heuristic).** Replace `calcPortfolioTemp`'s step function with a proper Implied Temperature Rise model.

**8.1 Purpose & scope.** Produce a defensible portfolio Implied Temperature Rise (ITR) from company/sector
target ambition against carbon budgets, alongside the existing PCAF WACI and NZBA pathway analytics.

**8.2 Conceptual approach.** A carbon-budget-allocation ITR mirroring **SBTi Temperature Rating** and
**MSCI Implied Temperature Rise**: allocate a global carbon budget to each holding, compare its projected
emissions trajectory (from targets) to its allocated budget, and map the overshoot to a temperature via a
Transient Climate Response to cumulative Emissions (TCRE) relationship.

**8.3 Mathematical specification.**

```
Per holding h:
  AllocatedBudget_h = GlobalBudget · (base_emissions_h / Σ base_emissions)   (or economic-activity share)
  ProjectedCumEm_h  = ∫ trajectory_h(t) dt   from target pathway (or BAU if no target)
  Overshoot_h = ProjectedCumEm_h − AllocatedBudget_h
  ITR_h = 1.5°C + TCRE · Overshoot_h            TCRE ≈ 0.45°C per 1000 GtCO₂
Portfolio ITR = Σ_h weight_h · ITR_h            (exposure- or financed-emission-weighted)
```

| Parameter | Source |
|---|---|
| Global carbon budget | IPCC AR6 remaining budget for 1.5/2°C |
| TCRE | IPCC AR6 (~0.45°C/1000 GtCO₂) |
| Company target trajectories | SBTi registry / disclosed targets |
| Budget allocation basis | SBTi SDA sector convergence or GEVA |
| WACI / financed emissions | PCAF (already computed in module) |

**8.4 Data requirements.** Company-level base emissions, disclosed targets/net-zero years, SBTi status,
sector for SDA allocation. Platform holds sector WACI, a SBTi reference table, and NGFS/IEA scenarios;
needs company-level target data for a bottom-up ITR.

**8.5 Validation & benchmarking plan.** Reconcile portfolio ITR against SBTi Portfolio Coverage / MSCI ITR
for overlapping holdings; check that a portfolio at the piecewise heuristic's 3.08°C reconciles to the
budget-based ITR within tolerance; sensitivity to budget-allocation method.

**8.6 Limitations & model risk.** ITR is highly sensitive to budget-allocation choice (SDA vs GEVA) —
document and disclose. Absent company targets, BAU assumptions dominate; flag coverage %. Conservative
fallback: unaligned/no-target holdings default to a hot-house trajectory (higher ITR), never to 1.5°C.
