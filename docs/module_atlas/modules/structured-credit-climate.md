# Structured Credit Climate
**Module ID:** `structured-credit-climate` · **Route:** `/structured-credit-climate` · **Tier:** B (frontend-computed) · **EP code:** EP-CI3 · **Sprint:** CI

## 1 · Overview
MBS/ABS/CLO climate overlay with 500-loan physical risk analysis, collateral haircut modelling, and tranche loss attribution.

**How an analyst works this module:**
- Pool-Level Dashboard shows aggregate physical risk metrics
- Loan-Level Physical Risk maps each property to hazard zones
- Collateral Haircut Modeler runs SSP scenarios on property values
- Tranche Loss Attribution shows senior/mez/equity loss distribution

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COASTAL_STATES`, `EPC_RATINGS`, `HEAT_STATES`, `LOANS`, `STATES`, `TABS`, `TRANCHES`, `WILDFIRE_STATES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `TRANCHES` | 5 | `pct`, `spread`, `color` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `_sr` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `floodZone` | `_sr(i * 11) > 0.7;` |
| `wildfireZone` | `WILDFIRE_STATES.has(state) ? _sr(i * 13) > 0.5 : _sr(i * 13) > 0.85;` |
| `coastal` | `COASTAL_STATES.has(state) ? _sr(i * 17) > 0.4 : _sr(i * 17) > 0.9;` |
| `epc` | `EPC_RATINGS[Math.floor(_sr(i * 19) * 7)];` |
| `ltv` | `50 + Math.round(_sr(i * 23) * 45);` |
| `balance` | `80 + Math.round(_sr(i * 29) * 720);` |
| `rate` | `3.5 + +(_sr(i * 31) * 4).toFixed(2);` |
| `propValue` | `Math.round(balance / (ltv / 100));` |
| `floodProb` | `floodZone    ? 0.05 + _sr(i * 37) * 0.25 : _sr(i * 37) * 0.03;` |
| `fireProb` | `wildfireZone ? 0.03 + _sr(i * 41) * 0.15 : _sr(i * 41) * 0.01;` |
| `heatProb` | `HEAT_STATES.has(state) ? 0.3 + _sr(i * 43) * 0.4 : 0.05 + _sr(i * 43) * 0.2;` |
| `baseMult` | `scenario === 'SSP1-2.6' ? 0.6 : scenario === 'SSP2-4.5' ? 1.0 : 1.5;` |
| `TABS` | `['Pool-Level Dashboard', 'Loan-Level Physical Risk', 'Collateral Haircut Modeler', 'Tranche Loss Attribution', 'PCAF Class 5/7/8', 'Stress Test Scenarios'];` |
| `totalBalance` | `LOANS.reduce((s, l) => s + l.balance, 0);` |
| `avgLTV` | `Math.round(LOANS.reduce((s, l) => s + l.ltv, 0) / Math.max(1, LOANS.length));` |
| `haircutDist` | `useMemo(() => { const bins = [{ range: '0-5%', count: 0 }, { range: '5-10%', count: 0 }, { range: '10-15%', count: 0 }, { range: '15-25%', count: 0 }, { range: '25-50%', count: 0 }];` |
| `trancheLoss` | `useMemo(() => { const poolLoss = filteredLoans.reduce((s, l) => s + l.balance * l.haircut / 100, 0);` |
| `poolLossPct` | `poolLoss / totalBalance * 100;` |
| `stressScenarios` | `['SSP1-2.6', 'SSP2-4.5', 'SSP5-8.5'].map(s => {` |
| `loans` | `LOANS.map(l => ({ ...l, haircut: computeHaircut(l, s) }));` |
| `poolLoss` | `loans.reduce((sum, l) => sum + l.balance * l.haircut / 100, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `EPC_RATINGS`, `STATES`, `TABS`, `TRANCHES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Loans | — | Simulated | Individual mortgage loans with property location |
| PCAF Classes | — | PCAF Standard | Motor vehicle, sovereign, other |
| Max Tranche Loss (equity) | `SSP5-8.5` | Model | Equity tranche absorbs climate losses first |

## 5 · Intermediate Transformation Logic
**Methodology:** Loan-level physical risk haircut
**Headline formula:** `Haircut = (baseMult × floodRisk + baseMult × fireRisk) × LTV`

Each mortgage mapped to flood zone, wildfire zone, and coastal zone. Haircut by SSP scenario: SSP1-2.6 (0.6x), SSP2-4.5 (1.0x), SSP5-8.5 (1.5x). Tranche loss waterfall: equity absorbs first, mezzanine second, senior last.

**Standards:** ['PCAF Class 5/7/8', 'FEMA', 'CoreLogic']
**Reference documents:** PCAF Global GHG Standard (Classes 5/7/8); FEMA Flood Maps; CoreLogic Wildfire Risk

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Fix the inverted tranche waterfall and ingest real hazard data (analytics ladder: rung 1 → 3)

**What.** The §7 flag records a confirmed, material defect: the tranche loss waterfall is **inverted**. Real securitisation subordination absorbs losses bottom-up (Equity → Junior → Mezzanine → Senior), but the code processes `TRANCHES` in declared order `[AAA Senior, AA Mezz, BBB Junior, Equity]`, applying `remainingLoss` to **Senior first** — the trailing `.reverse()` only flips the display, not the numeric assignment. The §7.4 worked example shows a 3% pool loss attributed entirely to AAA Senior with Equity at zero — the exact opposite of how CDO/RMBS work, which would badly mislead any credit analyst. The 500 loans are `sr()`-synthetic (no FEMA/CoreLogic data ingested despite being named), but the PCAF Class 5/7/8 formulas and the tranche proportions/spreads are correctly modelled. Evolution A fixes the waterfall and grounds the hazard data.

**How.** (1) Reorder the loss-allocation loop to process Equity → Junior → Mezzanine → Senior (reverse `TRANCHES` *before* the loop, not after) so `absorbed` accrues bottom-up as subordination requires — the single highest-priority fix. (2) Ingest real hazard data: FEMA National Flood Hazard Layer and CoreLogic/USFS wildfire scores keyed to loan property coordinates, replacing the state-conditioned `sr()` flood/fire/coastal flags (the platform's physical-risk digital twin already has flood/wildfire PostGIS grids to draw on). (3) Calibrate the haircut coefficients (currently hand-tuned 5/8/3 base points, 60/90/40 multipliers) against a catastrophe model or historical loss-given-hazard study. (4) Bench-pin the tranche waterfall against a worked subordination example.

**Prerequisites.** The waterfall fix is trivial and urgent; hazard ingestion uses the existing digital-twin grids. **Acceptance:** a modest pool loss hits Equity first and Senior last; loan hazard flags derive from FEMA/CoreLogic by coordinate; the bench case reproduces correct subordination.

### 9.2 Evolution B — Structured-credit climate-overlay copilot (LLM tier 1)

**What.** A copilot for the securitisation/credit analyst: "how does this pool's tranche loss distribute under SSP5-8.5?", "which loans drive the collateral haircut?", "what's the senior tranche's loss attachment point given the physical risk?" — answered from the (fixed) tranche waterfall, the loan-level haircuts, and the PCAF financed-emissions overlay.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/structured-credit-climate/ask`, corpus = this Atlas record (the haircut formula, the subordination structure, PCAF Class 5/7/8 / FEMA / CoreLogic framework notes) plus live page state (pool, SSP scenario). Tranche-loss answers narrate the corrected bottom-up waterfall; haircut explanations decompose the flood/fire/coastal contributions per SSP multiplier; the copilot explains subordination correctly (post-Evolution-A).

**Prerequisites (hard).** Evolution A's waterfall fix — a copilot narrating the current inverted waterfall would tell analysts their AAA senior tranche absorbs first losses, a dangerously wrong statement about credit risk. **Acceptance:** every tranche-loss figure reflects correct bottom-up subordination; haircut decompositions match the computed per-hazard contributions; a pool loss scenario shows Equity absorbing before Senior.