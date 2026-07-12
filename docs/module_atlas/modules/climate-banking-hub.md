# Climate Banking Hub
**Module ID:** `climate-banking-hub` · **Route:** `/climate-banking-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Centralised dashboard for banks integrating climate risk across all business lines. Covers credit, market, operational, reputational, and regulatory dimensions of climate risk management.

> **Business value:** Banks are under intense supervisory pressure to manage climate risk across all risk categories. This hub provides the integrated view needed for SREP responses, board climate governance, and TCFD/ISSB disclosure from a financial institution perspective.

**How an analyst works this module:**
- Risk Overview shows climate risk across all business lines
- Regulatory Alignment shows BCBS 530 compliance status
- Governance Dashboard shows board and management climate oversight

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BOARD_KEY_MESSAGES`, `BoardDashboardTab`, `BoardReportExportTab`, `CET1_WATERFALL`, `COMMITTEE_CALENDAR`, `DATA_GOVERNANCE`, `EBA_TEMPLATES`, `EMISSIONS_TRAJECTORY`, `ENGAGEMENT_PIPELINE`, `FE_BY_COUNTRY`, `GREEN_BOND_PORTFOLIO`, `KPI_BY_PERIOD`, `KPI_DEFS`, `KRI_TIMESERIES`, `NZBACommitmentTab`, `NZBA_SECTORS`, `PCAF_BY_ASSET_CLASS`, `PEER_BANKS`, `PERIODS`, `PeerBenchmarkingTab`, `Pillar3Tab`, `REGULATORY_ITEMS`, `RISK_APPETITE_METRICS`, `RegulatoryTrackerTab`, `RiskAppetiteTab`, `SLL_PORTFOLIO`, `STRESS_PL_IMPACT`, `TABS`, `TEMPLATE10_DATA`, `TEMPLATE1_DATA`, `TEMPLATE2_DATA`, `TEMPLATE3_DATA`, `TEMPLATE4_DATA`, `TEMPLATE5_DATA`, `TEMPLATE6_DATA`, `TEMPLATE7_DATA`, `TEMPLATE8_DATA`, `TEMPLATE9_DATA`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `TABS` | 8 | `id`, `label`, `icon` |
| `KPI_DEFS` | 16 | `id`, `label`, `unit`, `target`, `direction`, `format`, `module` |
| `EBA_TEMPLATES` | 11 | `id`, `ref`, `title`, `article`, `description`, `status`, `lastUpdated` |
| `REGULATORY_ITEMS` | 26 | `id`, `regulator`, `ref`, `area`, `requirement`, `deadline`, `status`, `compliance`, `owner`, `priority` |
| `PEER_BANKS` | 21 | `name`, `country`, `gar`, `fe`, `waci`, `tempScore`, `cet1Impact`, `sbtiPct`, `nzba`, `greenBond`, `dqs`, `physRisk` |
| `NZBA_SECTORS` | 11 | `sector`, `unit`, `baseline`, `target2030`, `current`, `progress`, `clients`, `engagements`, `highRisk` |
| `RISK_APPETITE_METRICS` | 16 | `id`, `metric`, `unit`, `value`, `limit`, `warning`, `trend`, `board` |
| `TEMPLATE4_DATA` | 11 | `sector`, `exposure`, `maturity_0_5y`, `maturity_5_10y`, `maturity_10_plus`, `performing`, `non_performing`, `stage2`, `coverage` |
| `TEMPLATE9_DATA` | 11 | `notional`, `carbon_intensity`, `climate_var`, `phys_risk_exp`, `trans_risk_exp`, `sbti_pct` |
| `TEMPLATE10_DATA` | 9 | `revenue_fy23`, `revenue_fy24`, `growth`, `pct_total` |
| `PCAF_BY_ASSET_CLASS` | 7 | `exposure`, `scope1`, `scope2`, `scope3`, `dqs`, `methodology`, `attribution`, `pctPortfolio` |
| `EMISSIONS_TRAJECTORY` | 12 | `abs`, `int`, `target`, `nzePath`, `sbtiPath` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `pick` | `(a,s)=>a[Math.floor(sr(s)*a.length)];` |
| `range` | `(lo,hi,s)=>+(lo+sr(s)*(hi-lo)).toFixed(2);` |
| `rangeInt` | `(lo,hi,s)=>Math.floor(lo+sr(s)*(hi-lo+1));` |
| `fmt` | `(n,d=1)=>n>=1e9?(n/1e9).toFixed(d)+'bn':n>=1e6?(n/1e6).toFixed(d)+'M':n>=1e3?(n/1e3).toFixed(d)+'k':n.toFixed(d);` |
| `fmtPct` | `(n,d=1)=>n.toFixed(d)+'%';` |
| `fmtGBP` | `(n)=>'£'+fmt(n);` |
| `exposure` | `range(200,8000,seed)*1e6;` |
| `scope1` | `range(50,2500,seed+1)*1e3;` |
| `scope2` | `range(10,800,seed+2)*1e3;` |
| `scope3` | `range(100,15000,seed+3)*1e3;` |
| `intensity` | `range(5,800,seed+4);` |
| `dqs` | `rangeInt(1,5,seed+5);` |
| `regions` | `['Western Europe','Southern Europe','North America','Latin America','Sub-Saharan Africa','South Asia','East Asia','Southeast Asia','Middle East','Oceania'];` |
| `avgValue` | `range(2,80,seed+1)*1e6;` |
| `prevData` | `KPI_BY_PERIOD[PERIODS[PERIODS.indexOf(period)+1]]\|\|data;` |
| `trendData` | `useMemo(()=>PERIODS.slice().reverse().map(p=>{` |
| `value` | `data[kpi.id];const prev=prevData[kpi.id];const delta=value-prev;` |
| `totalFE` | `TEMPLATE1_DATA.reduce((s,r)=>s+r.total,0);` |
| `t1WithPct` | `TEMPLATE1_DATA.map(r=>({...r,pctOfBook:r.exposure/(TEMPLATE1_DATA.reduce((s,x)=>s+x.exposure,0))*100}));` |
| `regulators` | `[...new Set(REGULATORY_ITEMS.map(r=>r.regulator))];` |
| `statuses` | `[...new Set(REGULATORY_ITEMS.map(r=>r.status))];` |
| `avgCompliance` | `filtered.length?filtered.reduce((s,r)=>s+r.compliance,0)/filtered.length:0;` |
| `headroom` | `isHigherBetter?m.value-m.limit:m.limit-m.value;` |
| `ourBank` | `{name:'Our Bank',country:'UK',gar:7.8,fe:812,waci:185,tempScore:2.64,cet1Impact:-1.92,sbtiPct:42.5,nzba:true,greenBond:2.85,dqs:3.2,physRisk:18.5};` |
| `allBanks` | `useMemo(()=>[ourBank,...PEER_BANKS].sort((a,b)=>{ if(['gar','sbtiPct','greenBond','dqs'].includes(sortMetric))return b[sortMetric]-a[sortMetric];` |
| `ourRank` | `allBanks.findIndex(b=>b.name==='Our Bank')+1;` |
| `totalClients` | `NZBA_SECTORS.reduce((s,sec)=>s+sec.clients,0);` |
| `totalEngagements` | `NZBA_SECTORS.reduce((s,sec)=>s+sec.engagements,0);` |
| `avgProgress` | `NZBA_SECTORS.reduce((s,sec)=>s+sec.progress,0)/NZBA_SECTORS.length;` |
| `totalPages` | `sectionList.filter(s=>sections[s.id]).reduce((sum,s)=>sum+s.pages,0);` |
| `TEMPLATE5_DATA` | `TEMPLATE4_DATA.map((t, i) => ({` |
| `TEMPLATE8_DATA` | `TEMPLATE4_DATA.map((t, i) => ({` |
| `STRESS_PL_IMPACT` | `NGFS_SCENARIOS.slice(0, 4).map((scen, i) => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BOARD_KEY_MESSAGES`, `CET1_WATERFALL`, `COMMITTEE_CALENDAR`, `DATA_GOVERNANCE`, `EBA_TEMPLATES`, `EMISSIONS_TRAJECTORY`, `ENGAGEMENT_PIPELINE`, `FE_BY_COUNTRY`, `GREEN_BOND_PORTFOLIO`, `KPI_DEFS`, `KRI_TIMESERIES`, `NZBA_SECTORS`, `PCAF_BY_ASSET_CLASS`, `PEER_BANKS`, `PERIODS`, `REGULATORY_ITEMS`, `RISK_APPETITE_METRICS`, `SLL_PORTFOLIO`, `TABS`, `TEMPLATE10_DATA`, `TEMPLATE4_DATA`, `TEMPLATE9_DATA`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| BCBS 530 Principles | — | BCBS | Basel Committee principles for climate risk governance and management |
| Regulatory Regimes | — | Global | ECB, BoE, Fed, APRA, MAS climate expectations |
- **Business line risk data** → Climate risk overlay → **Integrated climate risk view**
- **Regulatory requirements** → Compliance gap analysis → **SREP/ORSA climate score**

## 5 · Intermediate Transformation Logic
**Methodology:** Integrated bank climate risk
**Headline formula:** `ClimateRisk_bank = CreditRisk + MarketRisk + OperationalRisk + ReputationalRisk`

BCBS 530: 18 principles for climate risk management. ECB Guide: supervisory expectations for governance, risk culture, model risk. BoE SS3/19: expectations for PRA-regulated firms on climate financial risk.

**Standards:** ['BCBS 530', 'ECB Guide', 'BoE SS3/19']
**Reference documents:** BCBS 530 Principles for Climate Risk Management; ECB Guide on Climate-Related and Environmental Risks; BoE Supervisory Statement SS3/19

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Live Pillar 3 templates from platform data (analytics ladder: rung 1 → 2)

**What.** §7 reframes this module accurately: not the guide's four-way risk aggregator
(that formula doesn't exist) but a **bank climate-reporting hub** — EBA Pillar 3 ESG
ITS templates, a 6-period × 15-KPI dashboard with genuine delta/target logic,
risk-appetite headroom, NZBA sector tracking, peer benchmarking, and a board-report
exporter — all over hard-coded seed tables. Evolution A converts the strongest asset,
the EBA template structures (`TEMPLATE4_DATA`, `TEMPLATE9_DATA`, `TEMPLATE10_DATA`,
`PCAF_BY_ASSET_CLASS`, `FE_BY_COUNTRY`), from static seeds into views computed from a
loan-book table: financed emissions per PCAF asset class, template rows derived by
aggregation, and the KPI time series appended per period from data rather than typed.

**How.** (1) `bank_loan_book(exposure_id, asset_class, sector_nace, country, ead,
attribution_factor, counterparty_emissions, data_quality_score)` table with a seeded
demo book; template aggregations as SQL views matching the EBA ITS row definitions.
(2) The KPI dashboard's delta/target mechanics remain unchanged but read computed
period values. (3) The guide rewritten to describe the reporting hub (clearing the §7
flag) with the four-way risk sum either implemented as a simple roll-up of the four
risk-line KRIs or deleted from the guide.

**Prerequisites.** PCAF attribution needs counterparty emissions data — data-quality
scores (PCAF 1–5) must be carried and displayed, since demo books will be DQ-4/5;
Alembic slot post head-merge. **Acceptance:** editing a loan-book row moves the
affected template cell and KPI; template totals reconcile to SQL sums; each figure
carries its PCAF data-quality score.

### 9.2 Evolution B — Board-pack co-author (LLM tier 2)

**What.** The module already ships a board-report exporter with hard-coded key
messages (`BOARD_KEY_MESSAGES`). Evolution B replaces canned prose with grounded
generation: "draft the Q4 board climate update" pulls the period's KPI deltas,
risk-appetite headroom, NZBA sector positions vs pathway, and peer rank as tool calls,
then writes the narrative around those numbers — the highest-leverage LLM surface in
a bank workflow, and safe only because every figure is validator-checked against the
tool outputs.

**How.** Tool schemas over the Evolution A views (read-only); a message-architecture
template (what changed, why, headroom, actions) so drafts are structurally consistent
quarter to quarter; supervisory-expectation questions ("what does SS3/19 require
here?") answered from the §5 corpus with citations, clearly separated from the bank's
own numbers.

**Prerequisites (hard).** Evolution A first — generating board narrative over
hard-coded demo KPIs would produce a confident fiction with a bank's name on it.
**Acceptance:** every numeric in a generated board pack matches a view/tool output;
the draft flags KPIs that breached appetite rather than smoothing them; human sign-off
recorded before export.