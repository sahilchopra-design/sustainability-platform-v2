# FI Transition Dashboard
**Module ID:** `fi-transition-dashboard` · **Route:** `/fi-transition-dashboard` · **Tier:** B (frontend-computed) · **EP code:** EP-CT6 · **Sprint:** CT

## 1 · Overview
FI executive dashboard with 6 KPIs, taxonomy drill-down, client risk scatter, regulatory readiness, and board report generator.

**How an analyst works this module:**
- Executive KPIs shows 6 cards with QoQ trends
- Taxonomy Deep Drill navigates L1→L4
- Client Risk Map scatters exposure vs score
- Board Report generates formatted summary

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AVG_SCORE`, `CLIENTS`, `Card`, `RATING_COLORS`, `TABS`, `TOTAL_EXPOSURE`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TOTAL_EXPOSURE` | `CLIENTS.reduce((s, c) => s + c.exposure, 0);` |
| `AVG_SCORE` | `Math.round(CLIENTS.reduce((s, c) => s + c.score, 0) / CLIENTS.length);` |
| `kpis` | `useMemo(() => [ { label: 'Portfolio Transition Score', value: AVG_SCORE, unit: '/100', color: AVG_SCORE >= 60 ? T.green : T.amber, trend: '+3.2 QoQ' }, { label: 'WACI', value: '142', unit: 'tCO2e/$M', color: T.navy, trend: '-8% YoY' }, { label: 'Green Asset Ratio', value: '34.2', unit: '%', color: T.green, trend: '+2.1pp' }, { label: 'Cli` |
| `fiTaxScores` | `useMemo(() => TAXONOMY_TREE.map((l1, i) => ({` |
| `regReadiness` | `useMemo(() => Object.entries(REGULATORY_REQUIREMENTS).map(([geo, req]) => ({` |
| `pipeline` | `useMemo(() => [ { id: 1, action: 'Complete CSRD E1 gap analysis', owner: 'Risk Team', priority: 'HIGH', deadline: '2026-Q2', status: 'IN PROGRESS', completion: 65 }, { id: 2, action: 'Deploy enhanced climate VaR model', owner: 'Quant Team', priority: 'HIGH', deadline: '2026-Q2', status: 'IN PROGRESS', completion: 40 }, { id: 3, action: 'T` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio Score | — | Aggregation | FI-wide transition assessment |
| Green Asset Ratio | — | EU Taxonomy | GAR for regulatory disclosure |
| Engagement Rate | — | Stewardship | Clients actively engaged on transition |

## 5 · Intermediate Transformation Logic
**Methodology:** Multi-module KPI aggregation for FIs
**Headline formula:** `Portfolio_Score = exposure_weighted_avg(client_scores)`

6 KPIs: Portfolio Transition Score, WACI, Green Asset Ratio, Climate VaR, Capital Adequacy, Client Engagement Rate. Taxonomy drill: click L1→L2→L3→L4 for FI-specific scores.

**Standards:** ['TCFD', 'ECB', 'GFANZ']
**Reference documents:** TCFD; ECB SREP; GFANZ

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide states the portfolio score is an *exposure-weighted*
> average (`Portfolio_Score = exposure_weighted_avg(client_scores)`). **The code computes a plain
> unweighted mean** (`AVG_SCORE = Σ score / N`), so a $500M and a $50M client count equally. Also,
> five of the six headline KPIs (WACI 142, GAR 34.2%, Capital Adequacy 14.8%, Engagement 72%, and the
> QoQ/YoY trend arrows) are **hard-coded strings**, not aggregated from the client book; only the
> transition score and the Climate VaR are actually derived from the (synthetic) `CLIENTS` array.

### 7.1 What the module computes

The dashboard is an executive summary over 50 synthetic clients. The only two *computed* headline
numbers are:

```js
AVG_SCORE      = round( Σ CLIENTS[i].score / 50 )                 // "Portfolio Transition Score"
TOTAL_EXPOSURE = Σ CLIENTS[i].exposure                            // $ portfolio size
ClimateVaR95   = round( TOTAL_EXPOSURE × 0.068 )                 // 6.8% flat haircut
```

Everything else on the KPI grid — WACI, Green Asset Ratio, Capital Adequacy, Client Engagement — is a
literal display constant. The **taxonomy drill-down** assigns each node a synthetic FI-alignment score
and colours it by rating band; the **client risk map** scatters exposure vs transition score with a
watchlist reference line at score 40; **regulatory readiness** scores each jurisdiction; and the
**action pipeline** and **board report** are static planning content.

### 7.2 Parameterisation / scoring rubric

| Quantity | Formula / value | Provenance |
|---|---|---|
| Client exposure | `round(50 + sr(i·7)·450)` → $50–500M | Synthetic `sr()` seed |
| Client transition score | `round(20 + sr(i·11)·70)` → 20–90 | Synthetic `sr()` seed |
| Portfolio score | mean of the 50 scores | Computed (unweighted) |
| Climate VaR (95%) | `TOTAL_EXPOSURE × 0.068` | **Hard-coded 6.8% haircut** — no distribution |
| WACI | `142 tCO₂e/$M` | Display constant |
| Green Asset Ratio | `34.2%` | Display constant |
| Capital Adequacy | `14.8%` | Display constant |
| Engagement Rate | `72%` | Display constant |
| L1/L2/L3 taxonomy score | `round(35/30/25 + sr(...)·(50/55/60))` | Synthetic `sr()` seed |
| Jurisdiction readiness | `round(40 + sr(geo.charCodeAt(0))·55)` | Synthetic `sr()` seed |

Rating bands come from the shared `scoreToRating` helper in `data/taxonomyTree`; `RATING_COLORS`
maps A→green through E→red. Taxonomy structure (L1→L4), `HIGH_IMPACT_SECTORS`, `GEOGRAPHIC_REGIONS`
and `REGULATORY_REQUIREMENTS` are imported from that shared data module.

### 7.3 Calculation walkthrough

1. Build 50 clients with seeded exposure + score, tag sector by `HIGH_IMPACT_SECTORS[i%12]`.
2. `TOTAL_EXPOSURE` and `AVG_SCORE` feed the header and KPI grid.
3. Climate VaR = 6.8% × total exposure.
4. Taxonomy tab: seed a `fiScore` on every tree node; `drillData` returns L1 nodes, then children of
   the clicked L1, then children of the clicked L2 — three-level click-through, bars coloured by rating.
5. Regulatory tab: per jurisdiction, seed a readiness score and a gap count from the geography's first
   character code.
6. Pipeline & board report: render static arrays.

### 7.4 Worked example (Climate VaR)

Suppose the 50 seeded exposures sum to `TOTAL_EXPOSURE = $13,200M` (≈$13.2B, the header's `$13.2B`).
Then `ClimateVaR95 = round(13,200 × 0.068) = $898M`. This is **not** a value-at-risk in any statistical
sense — it is a flat 6.8% of notional, independent of client scores, sector mix, or any loss
distribution. A client with a transition score of 20 (high risk) contributes exactly the same 6.8% as
one scoring 90.

### 7.5 Data provenance & limitations

- **All client, taxonomy-node and jurisdiction scores are synthetic**, from `sr(seed)=frac(sin(seed+1)×10⁴)`.
- The five constant KPIs are display placeholders; the QoQ/YoY trend arrows are hard-coded strings.
- The "Climate VaR (95%)" label implies a percentile loss but the code applies a fixed 6.8% scalar.
- Portfolio score ignores exposure weighting despite the guide's formula.

**Framework alignment:** TCFD / ISSB (dashboard framing of governance, strategy, risk, metrics) ·
EU Taxonomy (GAR concept, drill-down structure) · PCAF (WACI framing) · GFANZ (transition-planning
pipeline) · ECB SREP / BoE (regulatory-readiness scorecard). The module *presents* these frameworks
but computes none of their metrics quantitatively.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The dashboard displays a WACI, a Green Asset
Ratio, a Capital Adequacy ratio and a "Climate VaR (95%)" with no model behind any of them (constants
or a flat haircut). Below is the production model that should populate these executive KPIs.

### 8.1 Purpose & scope
A firm-wide climate KPI aggregation layer that rolls up counterparty-level analytics into six board
metrics: portfolio transition score, WACI, GAR, climate VaR, climate-stressed capital adequacy, and
engagement coverage — across the full banking + trading book.

### 8.2 Conceptual approach
An aggregation-and-VaR engine mirroring **MSCI Climate VaR** (discounted policy/physical cost NPV as
% of value) and **BlackRock Aladdin Climate** for the VaR block, and **PCAF** for WACI/financed
emissions. Portfolio score is an exposure-weighted composite (à la a scorecard), WACI is the
PCAF-standard intensity, GAR follows the EBA Pillar 3 ITS, and capital adequacy is the CET1 ratio
under an NGFS-conditioned RWA path (see the IRB engine in `fi-taxonomy-pcaf-bridge`).

### 8.3 Mathematical specification
```
PortfolioScore = Σ_i (EAD_i / Σ EAD) · score_i                          exposure-weighted
WACI           = Σ_i w_i · (Emissions_i / Revenue_i),  w_i = value_i/Σvalue   PCAF
GAR            = Σ TaxonomyAligned_i / Σ EligibleExposure_i
ClimateVaR_95  = Σ_i EAD_i · Σ_s p_s · max(0, LossRate_{i,s})           scenario-weighted 95th pct
               where LossRate_{i,s} = PD_{i,s}·LGD_{i,s} (transition) + PhysDamage_{i,s}
CET1_stressed  = (CET1_0 − ΔEL) / RWA_stressed
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| p_s | scenario probability weights | NGFS Phase IV scenario likelihoods (expert/uniform) |
| PD_{i,s}, LGD_{i,s} | scenario credit params | climate-conditioned IRB (platform engine) |
| PhysDamage_{i,s} | acute/chronic physical loss | NGFS damage functions, EM-DAT, Swiss Re sigma |
| Emissions_i/Revenue_i | carbon intensity | PCAF financed-emissions engine (on platform) |
| TaxonomyAligned_i | aligned exposure | counterparty Taxonomy disclosure, NACE mapping |

### 8.4 Data requirements
Per counterparty: EAD, sector/NACE, revenue, Scope 1–3 emissions, PD/LGD, Taxonomy alignment %,
physical hazard scores, engagement flag. Sources: internal credit store; PCAF engine (present);
physical-risk layer (present); NGFS scenario carbon prices (public). Green Asset Ratio numerator from
Taxonomy disclosures; capital from COREP.

### 8.5 Validation & benchmarking plan
Reconcile WACI against the standalone PCAF module; benchmark Climate VaR against MSCI Climate VaR peer
ranges and the firm's own NGFS stress submission; backtest the transition-score → default relationship;
sensitivity-test scenario weights p_s. Confirm GAR ties to the EBA Pillar 3 template.

### 8.6 Limitations & model risk
Scenario-probability weighting is judgemental; single-period loss rates omit lifetime term structure;
physical damage functions are coarse. Conservative fallback: report Climate VaR as the worst-scenario
loss rather than the probability-weighted mean, and flag any KPI still on a placeholder constant.

## 9 · Future Evolution

### 9.1 Evolution A — Live KPI aggregation from sibling modules replacing hard-coded cards (analytics ladder: rung 1 → 2)

**What.** §7 flags two defects precisely: the "Portfolio Transition Score" is an unweighted mean despite the guide's exposure-weighted formula, and five of six executive KPIs (WACI 142, GAR 34.2%, Capital Adequacy 14.8%, Engagement 72%, all QoQ/YoY trend arrows) are hard-coded display strings; the "Climate VaR (95%)" is a flat 6.8% scalar mislabeled as a percentile. Evolution A makes this dashboard what its §5 methodology claims — a multi-module KPI aggregator: score becomes exposure-weighted, and WACI/GAR/capital KPIs are read from the sibling CT/DW modules' Evolution-A endpoints (`fi-net-zero-pathways` for WACI, `fi-taxonomy-pcaf-bridge` for GAR, `fi-regulatory-capital-overlay` for the capital stack) rather than typed in.

**How.** (1) Fix `AVG_SCORE` to `Σ(score·exposure)/Σexposure`. (2) A thin `/fi-dashboard/kpis` route that fans out to the sibling engines over the shared FI loan tape and returns each KPI with source-module provenance. (3) Trend arrows computed from stored KPI snapshots (a `fi_kpi_history` table written on each refresh) instead of hard-coded strings; the VaR card either gets a real percentile from the instrument-exposure evolution or is relabeled honestly as a stress haircut.

**Prerequisites.** The sibling FI modules' backend verticals (this dashboard is downstream by design); shared demo loan tape (D0). **Acceptance:** every KPI card displays a source-module badge and its value matches that module's API for the same book; no hard-coded KPI constants remain in the page source.

### 9.2 Evolution B — Board-report drafting orchestrator (LLM tier 3)

**What.** The Board Report tab already gestures at the right product: an executive summary across the FI desk. Evolution B makes it the FI desk's tier-3 orchestration surface — "prepare the Q3 board climate report" routes across the sibling modules (portfolio score and watchlist from fi-client-portfolio-analyzer, concentration breaches from fi-concentration-monitor, NZBA gaps from fi-net-zero-pathways, capital headroom from fi-regulatory-capital-overlay) and drafts a board-ready narrative with each figure tool-sourced and cited.

**How.** Routing knowledge comes from the atlas interconnection graph and `module_tags.json` FI grouping per the roadmap Tier-3 pattern; output renders through the report-studio layer. The `pipeline` action tracker (currently hard-coded demo items) becomes real: the orchestrator reads open actions from a persisted table and reports completion. Each report section carries a "show work" expander listing the tool calls behind it.

**Prerequisites.** Evolution A plus at least three sibling Evolution-A verticals live (an orchestrator over hard-coded strings would launder fabrication into board papers); tier-2 copilots proven on the individual modules first. **Acceptance:** a generated board report's every number is traceable to a named sibling-module endpoint call in the trace log, and regenerating after a loan-tape edit changes the affected sections only.