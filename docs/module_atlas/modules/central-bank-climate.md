# Central Bank Climate Assessment
**Module ID:** `central-bank-climate` · **Route:** `/central-bank-climate` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Central bank climate risk assessment framework covering NGFS scenario implementation, financial stability analysis, macroprudential response tools, and supervisory disclosure compliance.

> **Business value:** Central banks globally are integrating climate into supervisory frameworks. BCBS 530 principles, ECB climate risk management guide, BoE SS3/19, and NGFS membership create regulatory expectations for banks. This module provides the analytical framework for both regulated institutions and supervisors.

**How an analyst works this module:**
- Financial Stability Dashboard shows aggregate sector vulnerabilities
- Scenario Analysis runs NGFS short-term (2030) and long-term (2050) shocks
- Macroprudential Tools assesses countercyclical buffer and green supporting factor
- Supervisory Disclosure shows NGFS 9-principle alignment
- Cross-Border Spillover maps climate risk transmission across jurisdictions

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `CAPITAL_RW_DATA`, `CARBON_PRICE_SCENARIOS`, `CENTRAL_BANKS`, `COLLATERAL_FRAMEWORKS`, `DetailPanel`, `GREEN_BOND_DEMAND`, `GREEN_PROGRAMS`, `GREEN_QE_TREND`, `KPI`, `MANDATE_FILTER`, `NGFS_FILTER`, `NGFS_GROWTH`, `NGFS_SCENARIOS`, `POLICY_EVOLUTION`, `PORTFOLIO_RECS`, `QUARTERS`, `REGIONAL_SUMMARY`, `REGIONS`, `RESERVE_ESG`, `SECTOR_IMPACT`, `STRESS_FRAMEWORKS`, `TABS`, `Tab1`, `Tab2`, `Tab3`, `Tab4`, `UPCOMING_TESTS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CENTRAL_BANKS` | 41 | `id`, `name`, `code`, `country`, `region`, `ngfs`, `ngfsSince`, `climateMandate`, `stressTestReq`, `stressTestYear`, `greenQE`, `greenQEVolBn`, `disclosureRules`, `prudentialReq`, `capitalBps`, `publications`, `methodology`, `scenarios`, `banksTested`, `coverageTrillions` |
| `STRESS_FRAMEWORKS` | 7 | `id`, `cb`, `name`, `year`, `type`, `banks`, `scenarioAlign`, `horizonYears`, `sectors`, `physicalRisk`, `transitionRisk`, `litigationRisk`, `passThreshold`, `keyFinding`, `nextTest`, `methodology`, `granularity`, `coverageAssets`, `dataGaps`, `lossProjection` |
| `UPCOMING_TESTS` | 9 | `cb`, `date`, `scope`, `focus`, `newFeatures` |
| `GREEN_PROGRAMS` | 8 | `cb`, `program`, `volumeBn`, `startYear`, `mechanism`, `carbonReduction`, `coverage`, `status`, `monthlyPurchaseBn` |
| `RESERVE_ESG` | 9 | `cb`, `esgIntegration`, `carbonFootprintMtCO2`, `greenSharePct`, `exclusions`, `reporting`, `reservesBn` |
| `CARBON_PRICE_SCENARIOS` | 5 | `scenario`, `price2025`, `price2030`, `price2040`, `price2050`, `policyRate`, `inflation`, `gdpImpact` |
| `COLLATERAL_FRAMEWORKS` | 6 | `cb`, `greenHaircut`, `carbonPenalty`, `taxonomyAligned`, `scope`, `implemented` |
| `SECTOR_IMPACT` | 11 | `sector`, `greenTiltImpact`, `spreadChange`, `demandShift`, `capitalImpact`, `lendingChange`, `cbBondBuying` |
| `PORTFOLIO_RECS` | 9 | `action`, `rationale`, `conviction`, `timeframe`, `expectedReturn`, `risk` |
| `CAPITAL_RW_DATA` | 7 | `category`, `currentRW`, `proposedRW`, `change` |
| `NGFS_SCENARIOS` | 7 | `scenario`, `category`, `tempC`, `physRisk`, `transRisk`, `gdp2050`, `fsStability`, `carbonPrice2030` |
| `REGIONAL_SUMMARY` | 5 | `region`, `cbs`, `mandateAvg`, `stressTestPct`, `greenQEPct`, `avgCapital`, `publications` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `n=>n>=1e9?(n/1e9).toFixed(1)+'B':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':String(n);` |
| `REGIONS` | `['All','Europe','Asia-Pacific','Americas','Middle East & Africa'];` |
| `NGFS_FILTER` | `['All','Member','Observer','Non-Member'];` |
| `QUARTERS` | `['Q1-23','Q2-23','Q3-23','Q4-23','Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25','Q3-25','Q4-25'];` |
| `_CBC_MACRO_MAP` | `Object.fromEntries((SOVEREIGN_MACRO_2024\|\|[]).map(c=>[c.country,c]));` |
| `NGFS_GROWTH` | `QUARTERS.map((q,i)=>({` |
| `GREEN_QE_TREND` | `QUARTERS.map((q,i)=>({` |
| `GREEN_BOND_DEMAND` | `QUARTERS.map((q,i)=>({` |
| `POLICY_EVOLUTION` | `QUARTERS.map((q,i)=>({` |
| `ngfsMap` | `{'Member':{bg:'#dcfce7',color:T.green},'Observer':{bg:'#fef9c3',color:T.amber},'Non-Member':{bg:'#fee2e2',color:T.red}};` |
| `doSort` | `col=>{if(sort===col)setSortDir(-sortDir);else{setSort(col);setSortDir(1);}};` |
| `policyScore` | `Math.round(radarSingle.reduce((s,r)=>s+r.val,0)/Math.max(1,radarSingle.length));` |
| `compChart` | `STRESS_FRAMEWORKS.map(f=>({name:f.cb,banks:f.banks,horizon:f.horizonYears,sectors:f.sectors}));` |
| `headers` | `['Central Bank','Country','NGFS','Mandate','Stress Test','Green QE Vol (EUR bn)','Disclosure','Capital Add-on (bps)','Prudential Req','Methodology','Scenarios'];` |
| `rows` | `CENTRAL_BANKS.map(c=>[c.code,c.country,c.ngfs,c.climateMandate,c.stressTestReq?'Yes':'No',c.greenQEVolBn,c.disclosureRules,c.capitalBps,`"${c.prudentialReq}"`,`"${c.methodology}"`,`"${c.scenarios}"`]);` |
| `csv` | `[headers,...rows].map(r=>r.join(',')).join('\n');` |
| `blob` | `new Blob([csv],{type:'text/csv'});` |
| `spreadData` | `SECTOR_IMPACT.map(s=>({name:s.sector,spread:parseInt(s.spreadChange),tilt:parseFloat(s.greenTiltImpact)}));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CAPITAL_RW_DATA`, `CARBON_PRICE_SCENARIOS`, `CENTRAL_BANKS`, `COLLATERAL_FRAMEWORKS`, `GREEN_PROGRAMS`, `MANDATE_FILTER`, `NGFS_FILTER`, `NGFS_SCENARIOS`, `PIE_COLORS`, `PORTFOLIO_RECS`, `QUARTERS`, `RADAR_COLORS`, `REGIONAL_SUMMARY`, `REGIONS`, `RESERVE_ESG`, `SECTOR_IMPACT`, `STRESS_FRAMEWORKS`, `TABS`, `UPCOMING_TESTS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Credit Risk Uplift | — | Scenario analysis | Increase in expected credit losses under disorderly transition |
| Market Risk Repricing | — | Disorderly transition | Mark-to-market loss from abrupt carbon price increase |
| Supervisory Expectations | — | BCBS 530 | Basel expectations for climate risk management |
- **NGFS scenario parameters** → Sector shock transmission → **Bank-level impact estimates**
- **Supervisory data** → Climate risk assessment → **SREP climate score**
- **Financial stability analysis** → Macroprudential recommendation → **Policy response tools**

## 5 · Intermediate Transformation Logic
**Methodology:** Macro-financial climate transmission
**Headline formula:** `FinStability_impact = Σ(Sector_i × Scenario_shock_i × Bank_exposure_i)`

Three transmission channels: (1) Credit risk: climate shocks → borrower default → bank losses, (2) Market risk: repricing of carbon-intensive assets, (3) Operational risk: physical damage to bank infrastructure.

**Standards:** ['NGFS', 'FSB', 'BCBS 530', 'BIS Climate-Related Financial Risks']
**Reference documents:** NGFS Scenarios for Central Banks and Supervisors; BCBS 530 Principles for Climate Risk Management; FSB Climate Roadmap; BIS Annual Economic Report on Climate

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This is a **central-bank climate-supervision reference dashboard**, not a quantitative stress model.
The MODULE_GUIDES entry frames it as a "macro-financial climate transmission" engine
(`FinStability = Σ Sector·Shock·Exposure`) — that transmission sum is **not implemented as a live
computation**; the module instead curates a rich, largely-real dataset of 41 central banks (NGFS
status, stress-test history, prudential frameworks, green-QE volumes) with real macro wiring, and
plots comparisons. The scenario/sector-impact figures are hard-coded expert values, not modelled.

### 7.1 What the module computes

Aggregations and derived views over the reference tables (no per-obligor risk calculation):
- `policyScore` = mean of a per-bank radar's dimension values.
- `compChart` = per-framework banks/horizon/sectors.
- `spreadData` = per-sector spread change and green-tilt impact (from `SECTOR_IMPACT`).
- CSV export of the 41-bank table.
- **Real macro join:** `SOVEREIGN_MACRO_2024` is merged into each bank by country name, attaching
  `gdp`, `inflation`, `debtGdp` (GAP-006 wiring).

### 7.2 Parameterisation / data rubric

| Element | Value | Provenance |
|---|---|---|
| 41 central banks (ECB, BoE, Fed, PBoC, MAS, RBI…) | NGFS status, stress-test year, capital add-on bps, green-QE €bn, coverage $tn | Hard-coded **real supervisory facts** (ECB Member since 2017, Fed "Emerging" mandate, RBI no stress test) |
| Macro (gdp, inflation, debt/GDP) | per country | **`sovereignMacroSeed` (SOVEREIGN_MACRO_2024)** — real macro data |
| Stress frameworks (ECB 2022, BoE CBES 2021, Fed pilot 2023…) | banks tested, horizon, loss projection, key finding | Hard-coded **real stress-test results** |
| NGFS scenarios (7) | temp, phys/trans risk, GDP 2050, carbon price 2030 | Hard-coded NGFS-consistent |
| Carbon-price scenarios, collateral haircuts, sector impact | prices, spreads, tilts | Hard-coded expert values |
| Quarterly trends (NGFS_GROWTH, GREEN_QE_TREND…) | trend + `sr()` noise | **Synthetic** time-series overlays |

### 7.3 Calculation walkthrough

The 41-bank table is filterable by region, NGFS status, and mandate. On load, real 2024 sovereign
macro is joined by country. Comparison charts re-slice the framework and sector-impact tables; a radar
scores a selected bank across policy dimensions and averages them into `policyScore`. The quarterly
NGFS-membership, green-QE and green-bond-demand series are generated as trend-plus-`sr()` overlays for
visual continuity. No NGFS shock is propagated to a modelled bank-loss number — loss projections shown
are the central banks' own published figures, hard-coded per framework.

### 7.4 Worked example (framework comparison)

The ECB 2022 climate stress test row hard-codes: 104 banks, 30-yr horizon, 22 sectors, "+EUR 70bn in
Hot House", €25tn coverage. The BoE CBES 2021 row: 19 banks, "+GBP 45bn worst case". `compChart`
plots these side by side; `policyScore` for the ECB radar averages its dimension scores (e.g. mandate,
stress-test, disclosure, green-QE, prudential) into a single 0–100 index. These are curated facts, not
outputs of a transmission model.

### 7.5 Data provenance & limitations
- The bank roster, stress-framework results, and macro join are **real reference data**; only the
  quarterly trend overlays carry `sr()` synthetic noise.
- The guide's `Σ Sector·Shock·Exposure` transmission and the "10–30% ECL uplift / 5–15% repricing"
  figures are **descriptive**, taken from published scenario analysis, not computed here.
- No bank-level exposure data, so no bottom-up loss modelling; the module is a supervisory landscape
  and disclosure-alignment tool.

**Framework alignment:** **NGFS Scenarios for Central Banks and Supervisors** — the scenario set,
temperatures and carbon-price paths follow NGFS phases. **BCBS 530** (Principles for the effective
management and supervision of climate-related financial risks) — the 9-principle supervisory alignment
view. **FSB Climate Roadmap** and **BIS** frame the cross-jurisdiction comparison. The green-collateral
haircuts and capital add-ons reflect ECB/BoE (SS3/19) practice. The related module
`climate-credit-integration` implements the *actual* NGFS-conditioned PD/LGD/ECL transmission this
dashboard only describes.

## 9 · Future Evolution

### 9.1 Evolution A — Implement the transmission calculation over NGFS scenario data (analytics ladder: rung 1 → 2)

**What.** §7 classifies this as a supervision reference dashboard: the guide's
transmission engine (`FinStability = Σ Sector_i × Shock_i × Exposure_i`) is **not
implemented** — sector-impact figures are hard-coded expert values, and the module's
real strengths are its curated 41-central-bank dataset (NGFS status, stress-test
history, green-QE volumes) and the genuine `SOVEREIGN_MACRO_2024` join. Evolution A
implements the advertised sum as a live computation: sector shocks taken from the
platform's ingested NGFS scenario vintages (carbon price, energy demand, GDP paths
already used by other engines), exposures from a user-supplied or demo bank-sector
exposure matrix, producing a scenario-conditional stability impact instead of static
`SECTOR_IMPACT` numbers.

**How.** (1) `finStabilityImpact(exposures, scenario, horizon)` as a deterministic
function: NGFS shock per sector × exposure weight, aggregated to a system-level index,
with the shock vintage cited. (2) The Scenario Analysis tab's 2030/2050 toggles switch
actual NGFS scenario columns (Net Zero 2050, Delayed Transition, Current Policies)
rather than relabelled constants. (3) The hard-coded `SECTOR_IMPACT` retained but
relabelled "illustrative expert values" wherever the computed path lacks coverage —
honest-nulls convention.

**Prerequisites.** NGFS scenario data access from the frontend or a thin backend
endpoint (module currently has no API surface); exposure matrix schema defined with a
seeded demo bank. **Acceptance:** switching NGFS scenario changes the stability index
with the scenario/vintage displayed; a one-sector fixture reproduces shock × exposure
by hand.

### 9.2 Evolution B — Supervisory-landscape copilot (LLM tier 1)

**What.** A copilot over the module's genuinely valuable asset — the 41-bank
comparative dataset: "which central banks have run bottom-up climate stress tests?",
"compare ECB and BoE collateral-framework treatment of climate risk", "what does BCBS
530 require that our framework table shows Bank X lacking?". These are filter-and-
compare questions over real curated data plus the §5 standards corpus (NGFS, BCBS 530,
FSB) — exactly the tier-1 explainer shape, with no computation to fabricate.

**How.** Atlas record plus the central-bank reference table embedded in
`llm_corpus_chunks`; comparison answers cite table rows and the macro-join fields
(gdp, debtGdp) where relevant; the policyScore radar is explained as a mean of
curated dimension values, not a model output. Refusal path covers per-bank capital
impacts and any forward rate/policy prediction.

**Prerequisites.** Curation vintage stamped on the 41-bank table (supervisory
landscapes move quarterly; the corpus must say "as of" or the copilot will assert
stale facts). **Acceptance:** every claim about a named central bank traces to its
table row; asked to predict the ECB's next stress-test design, the copilot refuses and
cites the latest curated entry instead.