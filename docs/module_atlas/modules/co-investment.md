# Co-Investment Analytics
**Module ID:** `co-investment` · **Route:** `/co-investment` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Supports direct co-investment decision-making in climate and sustainability projects by providing deal screening, return modelling, ESG scoring, and LP syndication analytics.

> **Business value:** Enables institutional investors to systematically evaluate and compare direct co-investment opportunities in climate and sustainability projects on both financial and impact dimensions.

**How an analyst works this module:**
- Screen deal pipeline against ESG and climate taxonomy alignment criteria
- Build discounted cash flow model with climate scenario sensitivities (NGFS orderly/disorderly)
- Score counterparty ESG quality, governance standards, and climate management maturity
- Synthesise CIRA ranking, syndication fit, and concentration limits for investment committee

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `CO_INVEST_ESG_CRITERIA`, `Card`, `GEOS`, `GP_TRACK_RECORDS`, `Inp`, `KPI`, `LS_KEY`, `RISK_LEVELS`, `SECTORS`, `SEED_DATA`, `STAGES`, `Sel`, `SortHeader`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SEED_DATA` | 11 | `company`, `sector`, `gpLead`, `dealSize_mn`, `coInvest_mn`, `coInvestPct`, `round`, `preMoney_mn`, `geography`, `esg_score`, `impactThesis`, `sdgs`, `stage`, `dd_complete_pct`, `exclusionScreenPass`, `controversyFlags`, `boardSeatOffered`, `governance_score`, `envRisk`, `socialRisk` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `GEOS` | `['US','Europe','Asia-Pacific','Africa/ME','LatAm'];` |
| `fmt` | `(n, d=1) => n == null ? '-' : Number(n).toFixed(d);` |
| `fmtM` | `(n) => n == null ? '-' : `$${Number(n).toFixed(0)}M`;` |
| `pct` | `(n) => n == null ? '-' : `${Number(n).toFixed(1)}%`;` |
| `avg` | `(arr,f)=> arr.reduce((s,x)=>s+x[f],0)/arr.length;` |
| `score` | `checks.reduce((s,c)=> s+(c.pass?c.weight:0), 0);` |
| `rows` | `data.map(d=> hdr.map(h=> Array.isArray(d[h]) ? d[h].join(';') : d[h]));` |
| `csv` | `[hdr.join(','), ...rows.map(r=>r.join(','))].join('\n');` |
| `blob` | `new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob);` |
| `totalCI` | `data.filter(d=>d.sector===sector).reduce((s,d)=>s+d.coInvest_mn,0);` |
| `avgEsg` | `items.length ? items.reduce((s,d)=>s+d.esg_score,0)/items.length : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `GEOS`, `RISK_LEVELS`, `SECTORS`, `SEED_DATA`, `STAGES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Avg Climate Infrastructure IRR | — | GRESB Infrastructure 2023 | Internal rate of return range for core climate infrastructure co-investments (renewables, green transport, water). |
| Co-Investment Share of PE Deals | — | Preqin 2023 | Proportion of private equity deals involving LP co-investment rights across infrastructure and growth equity strategies. |
- **Deal documentation, project financial models, ESG due diligence reports, NGFS scenario paths** → DCF modelling, climate scenario sensitivity, CIRA calculation, ESG scoring → **Deal scorecards, syndication recommendations, portfolio concentration reports**

## 5 · Intermediate Transformation Logic
**Methodology:** Co-Investment Return Adjusted for Climate Risk
**Headline formula:** `CIRA = IRR – λ × ClimateVaR`

Adjusts project IRR for climate-specific downside risk using a risk aversion parameter λ and project-level Climate VaR to enable apples-to-apples comparison across co-investment opportunities.

**Standards:** ['IFC Performance Standards', 'GRESB Infrastructure Assessment']
**Reference documents:** IFC Performance Standards on Environmental and Social Sustainability; GRESB Infrastructure Assessment Framework 2023; Preqin Private Capital H1 2024; PRI Guidance on Private Equity ESG Integration 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's calculation engine is
> `CIRA = IRR − λ × ClimateVaR` (climate-risk-adjusted co-investment return) with DCF modelling
> under NGFS orderly/disorderly sensitivities. **No IRR, no λ, no Climate VaR, and no DCF exists in
> the code.** The page is a CRUD deal-pipeline tracker (localStorage-persisted) with a 7-check
> weighted ESG *decision checklist*, a 4-axis ESG radar, an SDG tally, a static GP track-record
> table, and CSV/JSON/Markdown exports. Sections below document the code as it behaves.

### 7.1 What the module computes

Over a deal list (11 seed records, user-editable, persisted at `localStorage['ra_coinvest_v1']`):

```
Decision score = Σ weight_k · 1{check_k passes}         (7 checks, weights sum to 100)
Signal         = Green (score ≥ 80) | Amber (≥ 50) | Red (< 50)
Radar axes     = [exclusion ? 95 : 20,  esg_score,  min(100, esg_score + 5·|SDGs|),  governance_score]
KPIs           = active count, Σ coInvest_mn, mean(esg), mean(dd%), exclusion pass-rate,
                 mean(governance), distinct SDG count, board-seat count
```

### 7.2 Scoring rubric

**Decision framework (`decisionFor`)** — the module's only real "model":

| # | Criterion | Pass condition | Weight |
|---|---|---|---|
| 1 | Exclusion screen | `exclusionScreenPass === true` | 20 |
| 2 | ESG score | ≥ 70 | 15 |
| 3 | Governance score | ≥ 65 | 15 |
| 4 | DD completion | ≥ 50% | 15 |
| 5 | Controversies | flags = 0 | 15 |
| 6 | SDG alignment | ≥ 2 mapped SDGs | 10 |
| 7 | Board seat offered | boolean | 10 |

**ESG criteria weighting** (`CO_INVEST_ESG_CRITERIA`, used as radar axis labels): Exclusion 20% ·
ESG Integration 30% · Impact Alignment 25% · Governance Rights 25%. Note the radar *labels* carry
these weights but the radar *values* are unweighted raw scores — the 20/30/25/25 split is never
arithmetically applied anywhere.

All thresholds and weights are synthetic demo values (no cited standard); the exclusion list
(Weapons, Tobacco, Thermal Coal, Gambling, Controversial Weapons) mirrors typical
IFC/PRI-style negative screens.

### 7.3 Calculation walkthrough

1. On mount, seed data loads from localStorage (or `SEED_DATA` on first run). All figures —
   deal sizes ($80–600M), co-invest tickets ($10–90M), ESG scores (65–92) — are hand-authored
   fictional deals with real-sounding GP names.
2. Pipeline tab: sortable/filterable table (stage filter, min-ESG slider); sorting is
   non-mutating (`[...data].sort`).
3. Selecting a deal drives the radar (§7.1 axes) and the decision framework card.
4. SDG tab counts SDG occurrences across deals; Risk Matrix maps env/social risk
   {Low:1, Medium:2, High:3} to a scatter with bubble size = co-invest ticket.
5. GP tab renders the static `GP_TRACK_RECORDS` table (avgIRR 8.2–32.1%, TVPI 1.2–3.8,
   PRI-signatory flags) — display-only, feeds no calculation.

### 7.4 Worked example — CI004 "PayBridge Global"

Inputs: exclusion pass, ESG 65, governance 62, DD 35%, controversy flags 1, SDGs {1, 8, 10},
no board seat.

| Check | Pass? | Points |
|---|---|---|
| Exclusion screen | ✔ | 20 |
| ESG ≥ 70 (65) | ✘ | 0 |
| Governance ≥ 65 (62) | ✘ | 0 |
| DD ≥ 50% (35%) | ✘ | 0 |
| No controversies (1) | ✘ | 0 |
| ≥ 2 SDGs (3) | ✔ | 10 |
| Board seat (no) | ✘ | 0 |
| **Score** | | **30 → Red** |

Radar for the same deal: Exclusion 95 · ESG Integration 65 · Impact Alignment
min(100, 65 + 3×5) = 80 · Governance 62.

### 7.5 Companion analytics

- **Compare view**: up to 3 deals side-by-side (raw field comparison, no scoring).
- **Exports**: CSV (arrays joined with `;`), JSON dump, and a Markdown pipeline table.
- Full add/edit/delete deal form — this is one of the few modules with genuine user-authored
  persistent state rather than seeded analytics.

### 7.6 Data provenance & limitations

- Seed deals are **fictional**; GP track-record IRR/TVPI figures attached to real firm names
  (Sequoia, Temasek, KKR, SoftBank Vision…) are **invented illustrative numbers**, not fund data —
  a presentation risk worth flagging if screenshots circulate.
- No return modelling of any kind: no IRR, MOIC, discounting, or climate scenario sensitivity.
- Checklist weights/thresholds are unsourced; the "Impact Alignment" axis double-counts ESG score.
- localStorage persistence is per-browser; no backend, no multi-user state.

**Framework alignment:** IFC Performance Standards — the E&S risk levels (env/social Low–High) and
exclusion screens echo IFC PS1's E&S categorisation, but no PS-by-PS assessment exists · PRI
Private Equity ESG guidance — GP ESG-policy/PRI-signatory fields reflect the PRI LP due-diligence
questionnaire themes · GRESB Infrastructure — named in the guide, absent in code · UN SDGs — deals
carry SDG number tags only (no impact measurement); note SDG target-level mapping (e.g. 7.2) is
the norm in UNDP SDG Impact Standards, which the module does not attempt.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Add the missing quantitative layer: climate-risk-adjusted return ranking (the guide's CIRA) for LP
co-investment decisions across private climate/sustainability deals, feeding IC memos and
concentration checks.

### 8.2 Conceptual approach
Deal-level DCF with NGFS scenario-conditioned cash flows and a downside-risk penalty, mirroring
**GRESB Infrastructure Asset** transition/physical risk scoring and **Aladdin Climate private-asset
repricing**; return distribution via seeded Monte Carlo as in standard PE fund models
(Cambridge Associates / Burgiss benchmarking conventions for validation).

### 8.3 Mathematical specification

```
Cash flows:   CF_t(s) = Rev_t(s) − Opex_t − Capex_t − CarbonCost_t(s)
              Rev_t(s) driven by scenario power/commodity prices (PPA or merchant curves)
IRR(s):       Σ_t CF_t(s)/(1+IRR)^t = −Equity_0
ClimateVaR:   VaR_95 = IRR(base) − Quantile_5[IRR(s, MC paths)]      (MC over price, capex,
              volume, hazard-outage shocks; N = 10⁴ seeded paths)
CIRA:         CIRA = E[IRR] − λ · VaR_95,  λ = 0.5 (risk-aversion, IC-set policy parameter)
Rank & gate:  invest if CIRA ≥ hurdle_sector AND concentration limits hold
```

| Parameter | Calibration source |
|---|---|
| Scenario prices | NGFS Phase IV/V (carbon), IEA WEO (power/fuel) |
| Hazard outage shocks | EM-DAT frequencies × asset geography (platform PostGIS layer) |
| Capex overrun dist. | lognormal, σ from Flyvbjerg megaproject database (public) |
| Sector hurdles | GRESB Infrastructure 2023 IRR ranges (core climate infra 8–12%) |
| λ | policy parameter; sensitivity-reported at {0.25, 0.5, 1.0} |

### 8.4 Data requirements
Deal cash-flow models (user upload — the CRUD form extends naturally), scenario curves (NGFS free
download; platform reference_data), hazard layers (platform migrations 057–067), GP benchmark
quartiles (Preqin/Burgiss vendor; PitchBook free-tier for demo).

### 8.5 Validation & benchmarking plan
Backtest CIRA rankings against realised deal outcomes where available; reconcile E[IRR] to GP
base cases (±200 bps tolerance); MC convergence (half-sample stability); stress λ and scenario
weights; challenger: certainty-equivalent utility ranking (CRRA γ = 2) vs CIRA ordering.

### 8.6 Limitations & model risk
Private-deal cash-flow models are GP-supplied and optimistic — apply a haircut factor calibrated
to Burgiss vintage under-performance vs marketing IRR. Scenario revenue mapping is coarse for
non-energy deals (biotech, edtech in the seed set) — CIRA should apply only to climate-exposed
sectors, with the checklist retained as the gate for others. λ conflates risk aversion and model
error; report unpenalised IRR alongside.

## 9 · Future Evolution

### 9.1 Evolution A — Build the CIRA return model the guide promises (analytics ladder: rung 1 → 2)

**What.** §7's mismatch flag: the guide's engine `CIRA = IRR − λ × ClimateVaR` with
NGFS-sensitized DCF does not exist — the page is a localStorage CRUD pipeline tracker
whose only real model is the 7-check weighted decision score. That checklist is
genuine and worth keeping; what's missing is the financial layer. Evolution A adds it:
per-deal cash-flow entry, IRR/MOIC computation, a project-level Climate VaR from
scenario-stressed cash flows, and the CIRA ranking that makes deals comparable.

**How.** (1) Extend the deal schema with a cash-flow vector and coordinates/sector;
IRR via Newton iteration client-side (deterministic, no backend strictly required),
MOIC as a check ratio. (2) Climate VaR: stress the cash-flow vector under NGFS
orderly/disorderly using the shared carbon-price paths and, for physical exposure, the
digital-twin composite score at the project location; VaR = distribution over the
scenario set, λ user-set with a documented default. (3) CIRA column joins the pipeline
table next to the existing decision signal; the radar's double-counted "Impact
Alignment" axis (§7.6) gets fixed while touching the scoring. (4) Move persistence
from `localStorage['ra_coinvest_v1']` to a backend table so pipelines survive browsers
and support multi-user IC workflows — this module's first vertical.

**Prerequisites (hard).** Replace or clearly fictionalize the GP track-record table —
§7.6 flags invented IRR/TVPI figures attached to real firm names (Sequoia, KKR,
Temasek) as a presentation risk; that must not ship into a returns-focused view.
**Acceptance:** a hand-computed IRR test case matches; CIRA ordering changes when λ or
scenario changes; deals persist across browsers via the new endpoint.

### 9.2 Evolution B — IC-memo drafter from pipeline evidence (LLM tier 1 → 2)

**What.** The workflow ends at "synthesise CIRA ranking, syndication fit, and
concentration limits for investment committee" — synthesis being exactly what the page
leaves manual. Evolution B drafts the IC memo for a selected deal: decision-checklist
outcome with per-criterion evidence (which of the 7 checks passed and why), ESG radar
reading, SDG mapping, and — after Evolution A — the CIRA versus pipeline distribution,
each figure cited to the deal record. The existing Markdown export becomes the render
target, so the memo lands in the format the module already emits.

**How.** Tier 1 needs no backend: the deal list is client state, and the grounding
corpus is this Atlas record (§7.2's decision rubric with its 20/15/15/15/15/10/10
weights) plus the IFC/PRI framework references §5 cites. The prompt encodes two
honesty rules from §7.6: checklist weights are unsourced house conventions, and (until
replaced) GP track-record numbers are fictional and must never appear in a memo.
Tier 2 arrives with Evolution A's backend: "re-rank the pipeline at λ=0.5" becomes a
tool call.

**Prerequisites.** The fictional-GP-data quarantine (hard, same as Evolution A);
corpus embedding for the framework texts. **Acceptance:** memos cite each checklist
criterion with its actual pass/fail state from the deal record; a memo for a deal
missing cash-flow data states that returns analysis is unavailable rather than
inventing an IRR.