## 7 · Methodology Deep Dive

> ⚠️ **Confirmed defect — tranche loss waterfall is inverted.** Real securitization waterfalls are
> subordinated: the **Equity** tranche absorbs losses first, then Junior, then Mezzanine, and Senior
> only takes losses once everything below it is wiped out. The code's `trancheLoss` calculation
> processes `TRANCHES` **in their declared order — `[AAA Senior, AA Mezzanine, BBB Junior,
> Equity]`** — so `remainingLoss` is applied to **Senior first**. The trailing `.reverse()` only
> flips the *display* order of the resulting array; it does not change which tranche the loss was
> numerically assigned to. The worked example in §7.4 shows this concretely: a modest 3% pool loss
> is entirely attributed to the AAA Senior tranche while Equity shows **zero** loss — the exact
> opposite of how CDO/RMBS subordination actually works.

### 7.1 What the module computes

500 synthetic residential mortgage loans (`LOANS`) across 20 US states, each independently seeded:

```
floodZone     = sr(i×11) > 0.7                                     // ~30% of loans
wildfireZone  = (state ∈ WILDFIRE_STATES) ? sr(i×13)>0.5 : sr(i×13)>0.85   // state-conditioned
coastal       = (state ∈ COASTAL_STATES) ? sr(i×17)>0.4 : sr(i×17)>0.9    // state-conditioned
ltv           = 50 + round(sr(i×23)×45)                              // 50–95%
balance ($k)  = 80 + round(sr(i×29)×720)                             // $80k–800k
floodProb     = floodZone    ? 0.05+sr(i×37)×0.25 : sr(i×37)×0.03
fireProb      = wildfireZone ? 0.03+sr(i×41)×0.15 : sr(i×41)×0.01
heatProb      = (state ∈ HEAT_STATES) ? 0.3+sr(i×43)×0.4 : 0.05+sr(i×43)×0.2
```

**Collateral haircut** (loan-level, per SSP scenario):
```
baseMult = SSP1-2.6→0.6  |  SSP2-4.5→1.0  |  SSP5-8.5→1.5
haircut  = min(50,
             (coastal    ? 5 + floodProb×60 : 0) × baseMult
           + (wildfireZone ? 8 + fireProb×90  : 0) × baseMult
           + (floodZone  ? 3 + floodProb×40  : 0) × baseMult
           )
```

This is a genuine, defensible haircut design — hazard-zone flags gate additive haircut terms, each
scaled by the loan's own hazard probability and the scenario's severity multiplier, capped at 50%.
The state-conditioned hazard-zone probabilities (`WILDFIRE_STATES={CA,OR,WA,CO}`,
`COASTAL_STATES={FL,NJ,NC,SC,LA,TX,NY,MA}`, `HEAT_STATES={TX,AZ,FL,LA,GA}`) are real, sensible
geographic assignments.

### 7.2 Parameterisation

| Parameter | Value | Provenance |
|---|---|---|
| SSP scenario multipliers | 0.6 / 1.0 / 1.5 | Synthetic but directionally correct (SSP5-8.5 is the most severe pathway, correctly given the largest multiplier) |
| Haircut cap | 50% | Reasonable ceiling, avoids >100% nonsensical haircuts |
| `TRANCHES` structure | Senior 70% / Mezz 15% / Junior 10% / Equity 5%, spreads 45/120/280/650bp | Realistic capital-structure proportions and spread ordering (spread widens down the stack, correctly) |
| PCAF Class 5/7/8 attribution formulas | `Attr=(Outstanding/Value)×Emissions`, `(Outstanding/GDP)×CountryEmissions`, `(Outstanding/EVIC)×CompanyEmissions` | **Real, correctly stated PCAF Global GHG Standard formulas** for motor vehicle loans, sovereign debt, and other listed equity/bonds |

### 7.3 Calculation walkthrough

1. **Loan generation** — 500 loans, hazard flags, haircut inputs.
2. **Pool-level dashboard** — `totalBalance`, `avgLTV`, `floodCount`, `fireCount`.
3. **Collateral Haircut Modeler** — `filteredLoans` recomputes `haircut` per loan for the selected
   scenario; `haircutDist` bins loans into 5 haircut ranges.
4. **Tranche Loss Attribution** — `poolLoss = Σ(balance×haircut/100)`, `poolLossPct = poolLoss/
   totalBalance×100`, then the **inverted waterfall** described above.
5. **Stress Test Scenarios tab** — recomputes pool-level loss across all 3 SSP scenarios for
   comparison (`stressScenarios`), correctly showing SSP5-8.5 > SSP2-4.5 > SSP1-2.6 in pool-loss
   terms since the haircut formula itself is correctly scenario-monotonic — only the *tranche*
   attribution downstream of pool loss is broken.
6. **PCAF Class 5/7/8 tab** — descriptive reference table of the real PCAF attribution formulas
   (not applied to the loan pool itself in this file).

### 7.4 Worked example — inverted waterfall

Suppose `poolLossPct = 3.0%` (a modest, realistic pool-wide loss under a moderate scenario):

| Tranche (processing order in code) | `pct` (subordination) | `absorbed` (code) | `lossPct` (code) | **Correct (real waterfall)** |
|---|---|---|---|---|
| AAA Senior | 70% | **3.00** | **4.3%** | 0% (protected until 30% of pool wiped out) |
| AA Mezzanine | 15% | 0 | 0% | 0% |
| BBB Junior | 10% | 0 | 0% | 0% |
| Equity | 5% | 0 | 0% | **60%** (3.0/5.0 — nearly two-thirds wiped out) |

The code shows AAA Senior investors taking a loss while Equity investors show none — a securitization
analyst reading this page would draw the opposite conclusion from reality about which tranche is at
risk from a given pool loss.

### 7.5 Companion analytics

- **PCAF Class 5/7/8 reference table** — the one section of this module with no fabrication concern:
  the attribution formulas and data-quality (DQ) scores (3, 2, 3) are consistent with the real PCAF
  Global GHG Accounting and Reporting Standard Part A.
- **State aggregation** — per-state loan count, balance, flood/fire counts, and average haircut —
  genuinely computed from the loan-level data.

### 7.6 Data provenance & limitations

- **Fix priority:** reorder the waterfall to process `Equity → Junior → Mezzanine → Senior` (or
  equivalently reverse `TRANCHES` *before* the loss-allocation loop, not after) so `absorbed` is
  assigned bottom-up as real subordination requires.
- All 500 loans are synthetic; no FEMA flood maps or CoreLogic wildfire risk scores are actually
  ingested despite being named in the guide as sources.
- Haircut formula coefficients (5/8/3 base points, 60/90/40 probability multipliers) are hand-tuned,
  not calibrated to a named catastrophe model or historical loss-given-hazard study.

**Framework alignment:** PCAF Global GHG Standard Classes 5/7/8 (real formulas, correctly stated) ·
FEMA flood zone / CoreLogic wildfire risk framing (named in guide, not ingested — state-level
proxies used instead) · standard RMBS/CLO subordination structure (correctly modelled in `TRANCHES`'
proportions and spreads, **incorrectly applied** in the loss-allocation order — see the confirmed
defect above).
