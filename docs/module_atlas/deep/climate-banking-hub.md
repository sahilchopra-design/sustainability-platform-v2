## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry frames this as an integrated bank
> climate-risk aggregator with the formula `ClimateRisk_bank = CreditRisk + MarketRisk +
> OperationalRisk + ReputationalRisk` and BCBS 530 principle scoring. **That aggregation formula is
> not implemented.** What the page actually is: a **bank climate-reporting hub** organised around EBA
> Pillar 3 ESG ITS disclosure templates, a period-based KPI dashboard, an NGFS stress P&L panel, a
> peer-benchmarking table, an NZBA sector tracker, and a board-report exporter. It computes headroom
> vs risk-appetite limits and a peer rank; the four-way risk sum in the guide does not exist. The
> sections below document the code.

### 7.1 What the module computes

The dashboard is period-driven: `KPI_BY_PERIOD` holds a hard-coded 6-period time series (FY2022 →
Q4 2024) of 15 KPIs. Each KPI card computes a period-over-period delta and a target comparison:

```
value  = KPI_BY_PERIOD[period][kpi.id]
prev   = KPI_BY_PERIOD[nextOlderPeriod][kpi.id]
delta  = value − prev
onTarget: direction=='lower' ? value ≤ target : value ≥ target
```

Risk-appetite headroom (`RISK_APPETITE_METRICS`):
```
headroom = isHigherBetter ? (value − limit) : (limit − value)     // positive = within appetite
```

Template 1 aggregate financed emissions: `totalFE = Σ Template1.total`, and per-sector
`pctOfBook = exposure / Σ exposure × 100`.

### 7.2 Parameterisation / provenance

| Data | Nature | Provenance |
|---|---|---|
| `KPI_BY_PERIOD` (6×15) | hard-coded time series showing steady improvement | Synthetic demo (realistic trend, not live) |
| `KPI_DEFS` targets | e.g. FE≤750, WACI≤150, GAR≥10, Temp≤2.0 | Hard-coded management targets |
| `EBA_TEMPLATES` (10) | template ref, CRR Art. 449a citation, status | Real EBA Pillar 3 ESG ITS structure |
| Template 1/2/3/6 rows | `range()`/`rangeInt()` = `sr()`-seeded | Synthetic (exposure, Scope 1/2/3, DQS, EPC) |
| `PEER_BANKS` (20) | HSBC/Barclays/…/ABN with gar/fe/waci/temp/cet1 | Hard-coded realistic peer figures |
| `NZBA_SECTORS` | sector baseline/target2030/current/progress | Hard-coded |
| `STRESS_PL_IMPACT` | NGFS scenario names + `sr()` P&L components | Scenario labels real (NGFS), P&L values seeded |

`ourBank` is a hard-coded self-profile (`gar 7.8, fe 812, waci 185, tempScore 2.64, cet1Impact −1.92`)
matching the Q4 2024 KPIs.

### 7.3 Calculation walkthrough

1. **Board Dashboard** — selects a period, renders 15 KPI cards with delta arrows and target
   pass/fail; `trendData` reverses `PERIODS` for the time-series chart.
2. **EBA Pillar 3** — 10 template cards with completion status; Templates 1/2/3/6 render `sr()`-
   generated rows (`totalFE`, `pctOfBook`).
3. **Risk Appetite** — 16 metrics vs board limits; `headroom` sign shows within/over appetite.
4. **Peer Benchmarking** — merges `ourBank` into `PEER_BANKS`, sorts by the chosen metric, and finds
   `ourRank = index(Our Bank) + 1`.
5. **NZBA** — sector-by-sector 2030 alignment progress; `avgProgress = Σ progress / N`.
6. **Board Report** — selects sections, sums `pages` for enabled sections, exports.

### 7.4 Worked example — peer rank and headroom

Peer ranking by `waci` (lower is better). `ourBank.waci = 185`. The sort places all 21 banks; with
peers spanning 118 (ABN AMRO) to 245 (Deutsche), Our Bank at 185 lands mid-pack:

| Step | Computation | Result |
|---|---|---|
| Sort direction | WACI not in `['gar','sbtiPct','greenBond','dqs']` → ascending | lower first |
| Position | count(peers with waci < 185) + 1 | ≈ rank 12 of 21 |
| Risk-appetite (WACI limit 200, lower better) | `headroom = 200 − 185` | **+15** within appetite |

### 7.5 NGFS stress P&L — labels real, numbers seeded

`STRESS_PL_IMPACT` iterates the first 4 `NGFS_SCENARIOS` (real scenario names/categories from
`referenceData`) but fills every P&L line — `nii_impact`, `trading_income`, `credit_losses`
(−15 to −120), `roe_impact_pp` — with `range(lo,hi, i·109+k)` = **`sr()`-seeded random**. The only
genuine arithmetic is `total_pl_impact = Σ(components)`. So the stress panel has the correct
*structure* (NGFS scenario × P&L line) but synthetic magnitudes.

### 7.6 Data provenance & limitations

- The **KPI time series and peer bank figures are hard-coded** (plausible but not live); the
  **EBA templates and stress P&L are `sr()`-seeded** via `sr(seed) = frac(sin(seed+1)×10⁴)`.
- No integrated risk aggregation (`Credit+Market+Op+Reputational`) as the guide claims; risk is
  presented per-dimension via KPIs, not summed into a single climate-risk number.
- CET1 climate impact is a stored KPI, not computed from a stress model on this page (it is
  reproduced from the period table).
- Peer rank is real given the hard-coded peer set; it is not sourced from live regulatory filings.

**Framework alignment:** EBA Pillar 3 ESG ITS (the 10 templates map to CRR Art. 449a(1)–(7):
Scope 3 financed emissions, top-20 carbon-intensive exposures, physical risk, GAR, BTAR, real-estate
EPC); PCAF (financed-emissions + DQS 1–5 in Template 1); EU Taxonomy (GAR/BTAR); NZBA (sector
convergence targets); NGFS (stress scenario set); BCBS 530 / ECB Guide / BoE SS3/19 (named in the
regulatory tracker). The hub *reports against* these frameworks; the four-way risk-integration model
is specified in §8.

## 8 · Model Specification — Integrated Bank Climate-Risk Aggregation

**Status: specification — not yet implemented in code.** The guide's `ClimateRisk_bank =
CreditRisk + MarketRisk + OperationalRisk + ReputationalRisk` and BCBS-530 scoring are not in code;
this specifies them.

### 8.1 Purpose & scope
Aggregate climate-driven losses across a bank's credit book, trading book, operations and franchise
into a single capital impact (ΔCET1) under NGFS scenarios, for ICAAP / board risk-appetite use.

### 8.2 Conceptual approach
A **scenario-conditioned economic-capital roll-up** mirroring the ECB 2022 climate stress test and
BoE CBES: credit losses from climate-adjusted PD/LGD, trading losses from factor repricing,
operational losses from physical hazards, and franchise/reputational value at risk, summed to a
capital shortfall. Benchmarks: ECB economy-wide climate stress test methodology and Bank of England
CBES.

### 8.3 Mathematical specification
```
Credit_s      = Σ_c EAD_c · (PD_c·s − PD_c·0) · LGD_c·s              (climate ECL uplift)
Market_s      = Σ_p MtM_p · Δfactor_s(carbon, energy)                (trading repricing)
Operational_s = Σ_h P(hazard_h,s) · OpLoss_h                         (physical op losses)
Reputational_s= FranchiseValue · repShock_s                          (franchise VaR)
ClimateRisk_s = Credit_s + Market_s + Operational_s + Reputational_s
ΔCET1_s (pp)  = − ClimateRisk_s / RWA × 100
```
| Parameter | Source |
|---|---|
| PD/LGD climate uplift | NGFS Phase IV macro paths → PD (IFRS 9) |
| Trading factor shocks | Carbon/energy price sensitivities (NGFS + EEX/ICE) |
| Physical op-loss | EM-DAT / Swiss Re sigma hazard frequency×severity |
| Franchise/rep shock | Scenario-conditioned; expert / event-study |
| RWA | Bank Pillar 3 |

### 8.4 Data requirements
Credit book (EAD, PD, LGD, sector, geography), trading positions with factor exposures, operational
asset locations with hazard exposure, franchise value, RWA. The platform already has NGFS scenarios,
PCAF exposures, and physical-hazard layers to source most inputs.

### 8.5 Validation & benchmarking plan
Reconcile ΔCET1 against the stored `cet1Impact` KPI and against ECB stress-test published bank
ranges; backtest credit component against realised climate-linked losses; sensitivity-test to PD
uplift and factor-shock calibration; verify additivity vs diversification assumptions.

### 8.6 Limitations & model risk
Additive summation ignores cross-risk correlation/diversification; reputational shocks are weakly
identified; single-period horizon understates chronic physical risk. Conservative fallback: report
the worst-scenario ΔCET1 and a component decomposition rather than a single aggregate.
