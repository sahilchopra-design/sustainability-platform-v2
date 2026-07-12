## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a "Contractor Bankability
> Score (1–5)" combining financial strength + track record + warranty depth, and an "SAT_uplift =
> 4–6% AEP" figure computed from `AEP_SAT / AEP_fixed − 1`. **Neither is computed anywhere in the
> code.** There is no bankability score field on any contractor, and the AEP uplift figures shown
> (`+4–6%` SAT, `+20–25%` DAT) are static labelled info-cards, not derived from any AEP calculation —
> the module has no energy-yield model at all. What the code actually implements is a CAPEX/schedule
> benchmarking tool across 25 synthetic utility-scale solar projects.

### 7.1 What the module computes

25 synthetic projects (`PROJECTS`), each assigned an EPC contractor (round-robin from 10 named firms),
module technology, tracker type, and six CAPEX sub-components in $/Wdc:

```js
totalCapex = epsCapex + bosCapex + gridCapex + moduleCapex + inverterCapex + installCost
totalCapexM = totalCapex × capacityMwdc × 1000 / 1e6        // $M for the project
```

Portfolio KPIs aggregate `filtered` (contractor-filtered) projects: `totalMwdc`, `avgCapex`,
`avgSchedule`, `avgBos`, `totalPortfolioM`. A separate `contractorBenchmark` groups all 25 projects
(unfiltered) by EPC firm to compute `avgCapex`, `avgSchedule`, total MW and project count per firm.

### 7.2 Parameterisation

| Sub-component | Range ($/Wdc) | Provenance |
|---|---|---|
| EPS (tracker/mounting) | 0.08 – 0.18 | Author-calibrated to sit within the guide's $0.55–0.85 total range |
| BOS (wiring/hardware) | 0.10 – 0.22 | ″ |
| Grid connection | 0.03 – 0.10 | ″ |
| Module | 0.22 – 0.32 | ″ |
| Inverter | 0.06 – 0.10 | ″ |
| Installation labour | 0.05 – 0.11 | ″ |
| Schedule | 12 – 30 months | Author-calibrated, plausible utility-scale construction window |
| Module efficiency/cost/degradation (5 techs) | Static `moduleEfficiency` array | Plausible 2023-vintage PV tech figures, not cited to a specific BNEF/NREL table row |

All six CAPEX draws are independent `sr(i·k)` calls per project index `i`, so `totalCapex` is the
**sum of six uniform random variables**, not a market-calibrated CAPEX build-up with correlated
input costs (e.g. steel/module prices don't move together across projects as they would in reality).

### 7.3 Calculation walkthrough

1. **EPC Benchmarks tab** — raw table of all 25 projects' six-component CAPEX breakdown, colour-coded
   by total ($/W `<0.70` green, `<0.78` teal, else amber).
2. **Module & Tracker tab** — `moduleEfficiency` (static 5-row table) bar-charted against a *separate*
   `capexByTracker` aggregation (`Σ totalCapex / count` per tracker type across `filtered` projects) —
   the two charts are visually adjacent but not causally linked (efficiency data does not feed the
   tracker CAPEX average).
3. **BOS Cost Breakdown tab** — `bosCostData` averages each of the six CAPEX sub-components across
   `filtered` projects into a stacked/pie view.
4. **Contractor Comparison tab** — `contractorBenchmark` (all 25 projects, not filtered) by EPC firm.
5. **Schedule Risk tab** — static `SCHEDULE_RISKS` (8 named risks with `probability`/`impact`/
   `category`), unconnected to any project's actual `scheduleMonths`.
6. **Capex Waterfall tab** — visualises the six-component build-up for a selected project.

### 7.4 Worked example

Project `EC4-01` (`i=0`): `capacityMwdc = 50 + round(sr(0)·750)`. With `sr(0)=frac(sin(1)×10⁴)≈0.9147`,
`capacityMwdc ≈ 50 + 686 = 736`. Applying the same pattern to the six CAPEX draws yields, e.g.,
`epsCapex≈0.08+sr(0)·0.10`. Because every project uses the *same* `sr(i·k)` seed pattern with `i=0`
for project 1, its six CAPEX components are correlated through the shared `i` even though each
multiplier `k` differs — an artifact of the seeding scheme, not an intentional market-correlation
model. Portfolio `totalPortfolioM` sums all 25 `totalCapexM` values into the "Portfolio Value" KPI.

### 7.5 Data provenance & limitations

- **All 25 projects, all CAPEX sub-components, and the module-efficiency table are synthetic**, built
  by the seeded PRNG `sr(seed)=frac(sin(seed+1)×10⁴)`. They are calibrated to land within the ranges
  the guide cites from BNEF/NREL/Wood Mackenzie, but no project maps to a real EPC contract.
- **No AEP/energy-yield model exists** — the "SAT AEP Premium +4–6%" card is a hardcoded label with
  no supporting calculation, so changing tracker type on a project never changes any displayed AEP or
  revenue figure.
- **No contractor bankability score** despite the guide naming one — `contractorBenchmark` only
  aggregates CAPEX/schedule, not the financial-strength/warranty-depth criteria the guide describes.
- Schedule risk (`SCHEDULE_RISKS`) is fully decoupled from the actual `scheduleMonths` field on any
  project — a risk with 55% probability and impact 4 never changes a project's modelled schedule.

**Framework alignment:** BNEF/NREL/Wood Mackenzie EPC cost benchmarks (named as data sources; ranges
approximated, not pulled from a live feed) · DNV/Marsh EPC contractor bankability frameworks (named,
unimplemented — see §8).

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
A production EPC Bankability & CAPEX Benchmarking model supports project-finance lenders and
developers deciding which EPC contractor to award a utility-scale solar contract to, and at what
CAPEX/schedule assumption to size debt. Scope: utility-scale (>20MWdc) solar EPC contracts.

### 8.2 Conceptual approach
Combine (1) a **bottom-up CAPEX build-up** with correlated input-cost indices (module polysilicon
price index, steel/racking price index, labour cost index by region) — the approach used by
Wood Mackenzie's PV EPC cost model and BNEF's LCOE tool — with (2) a **contractor bankability
scorecard** modelled on DNV's EPC due-diligence framework and lender covenant practice (net worth
≥ 20% of contract value, parent guarantee, liquidated-damages provisions, warranty depth).

### 8.3 Mathematical specification

```
CAPEX_total = Σ_c CostIndex_c(t) · UnitCost_c,base · (1 ± σ_c)     // c ∈ {module, BOS, tracker, inverter, grid, labour}
AEP_tracker  = AEP_fixed · (1 + Uplift_tracker)                     // Uplift_SAT≈0.05, Uplift_DAT≈0.22 (NREL 2023)
LCOE = (CAPEX_total · CRF + OPEX_annual) / (AEP_tracker · 8760)     // CRF = r(1+r)^n / ((1+r)^n − 1)
Bankability = 0.35·FinStrength + 0.25·TrackRecord + 0.20·WarrantyDepth + 0.20·LDProvision   // 1–5 scale
FinStrength = min(5, 5 · NetWorth_EPC / (0.20 · ContractValue))
```

| Parameter | Calibration source |
|---|---|
| `Uplift_SAT`, `Uplift_DAT` | NREL Tracker Performance Study 2023 (public) |
| `CostIndex_c(t)` | BNEF Solar PV Market Outlook module-price index; AISI/LME steel index for tracker/BOS |
| `FinStrength` net-worth threshold (20%) | Lender project-finance covenant convention (DNV/Marsh EPC assessment) |
| Discount rate for CRF | Project WACC, typically 6–9% for utility-scale solar |

### 8.4 Data requirements
Contractor financial statements (net worth, D&B rating), historical project delivery data (schedule
variance, LD claims history), warranty terms (module/inverter/workmanship years and coverage %), and
live module/steel price indices. The platform's `PROJECTS`/`EPC_CONTRACTORS` structures are reusable
containers; a new `epc_financials` reference table and a BNEF/steel-index feed would be required.

### 8.5 Validation & benchmarking plan
Backtest CAPEX build-up against realised project CAPEX from public project-finance disclosures (rating
agency pre-sale reports); validate AEP uplift assumptions against measured tracker-vs-fixed-tilt
performance data from operating fleets; reconcile bankability scores against actual lender credit
decisions where available (did low-bankability contractors correlate with construction delay/LD claims?).

### 8.6 Limitations & model risk
Contractor financial strength is a point-in-time snapshot; a production model should track quarterly
covenant compliance, not a single score. AEP uplift figures are climate/site-specific (DNI, latitude)
— using a single national average overstates uplift in low-DNI regions; fall back to a site-specific
NREL NSRDB lookup where geocoding is available, else use the conservative low end of the uplift range.
