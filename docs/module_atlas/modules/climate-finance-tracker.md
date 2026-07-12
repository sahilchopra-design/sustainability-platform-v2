# Climate Finance Tracker
**Module ID:** `climate-finance-tracker` · **Route:** `/climate-finance-tracker` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Real-time tracking of climate finance commitments versus disbursements across public and private sources. Monitors progress toward UNFCCC $100Bn goal, NDC financing gaps, and Article 6.4 credit flow accounting with country-level finance need assessment.

> **Business value:** Global climate finance mobilised reached ~$89Bn/yr in 2021 vs $100Bn commitment. Adaptation finance remains <10% of total. NDC implementation gap estimated at $3–5Tn/yr for developing countries through 2030.

**How an analyst works this module:**
- Select country or region to view finance flow breakdown
- Commitment vs Disbursement tab shows delivery gap
- NDC Finance Need tab shows country-level gap analysis
- Adaptation vs Mitigation tab tracks finance composition
- Art. 6 Flows tab monitors ITMO transfer volumes

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `COLORS`, `DONOR_FLOWS`, `FUNDS`, `PIPELINE`, `Stat`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `FUNDS` | 7 | `name`, `totalPledgedBn`, `disbursedBn`, `approvedProjects`, `countries`, `adaptation`, `mitigation`, `cross`, `replenishment` |
| `DONOR_FLOWS` | 13 | `country`, `publicBn`, `privateBn`, `adaptBn`, `mitigBn`, `totalBn`, `ncqgPledge` |
| `PIPELINE` | 16 | `project`, `country`, `sector`, `valueMn`, `blendedPct`, `returnPct`, `riskRating`, `stage` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Global Climate Finance Dashboard','Fund-Level Analytics','Country-Level Flows','Investment Opportunity Pipeline'];` |
| `flows` | `Array.from({length:50},(_,i)=>{const s=sr(i*7);const s2=sr(i*13);` |
| `types` | `['Bilateral ODA','MDB Concessional','MDB Non-Concessional','Private Mobilised','Blended Finance','Green Bond','Climate Fund Grant','DFI Loan','Export Credit','Domestic Budget'];` |
| `annualTrend` | `Array.from({length:8},(_,i)=>({year:2018+i,public:Math.round(55+sr(i*3)*15+i*5),private:Math.round(30+sr(i*7)*20+i*8),adaptation:Math.round(12+sr(i*11)*5+i*2),total:Math.round(85+sr(i*13)*20+i*13)}));` |
| `exportCSV` | `(rows,name)=>{if(!rows.length)return;const keys=Object.keys(rows[0]);const csv=[keys.join(','),...rows.map(r=>keys.map(k=>`"${r[k]}"`).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createOb` |
| `filteredFlows` | `useMemo(()=>{let d=[...flows];if(flowSearch)d=d.filter(r=>r.donor.toLowerCase().includes(flowSearch.toLowerCase())\|\|r.recipient.toLowerCase().includes(flowSearch.toLowerCase()));if(purposeFilter!=='All')d=d.filter(r=>r.purpose===purposeFilter);if(channelFilter!=='All')d=d.filter(r=>r.channel===channelFilter);d.sort((a,b)=>flowSortDir==='a` |
| `filteredDonors` | `useMemo(()=>{let d=[...DONOR_FLOWS];if(donorSearch)d=d.filter(r=>r.country.toLowerCase().includes(donorSearch.toLowerCase()));d.sort((a,b)=>donorSortDir==='asc'?(a[donorSort]>b[donorSort]?1:-1):(a[donorSort]<b[donorSort]?1:-1));return d;},[donorSearch,donorSort,donorSortDir]); ` |
| `totalFlows` | `flows.reduce((s,f)=>s+f.amountMn,0);` |
| `adaptPct` | `totalFlows?Math.round(flows.filter(f=>f.purpose==='Adaptation').reduce((s,f)=>s+f.amountMn,0)/totalFlows*100):0;` |
| `channels` | `[...new Set(flows.map(f=>f.channel))];` |
| `currentTotal` | `annualTrend[annualTrend.length-1].total;` |
| `targetGap` | `targetSlider-currentTotal;` |
| `purposeAgg` | `useMemo(()=>['Mitigation','Adaptation','Cross-cutting'].map(p=>({purpose:p,total:flows.filter(f=>f.purpose===p).reduce((s,f)=>s+f.amountMn,0)})),[]);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/climate-finance/ref/oecd-markers` | `get_oecd_markers` | api/v1/routes/climate_finance.py |
| GET | `/api/v1/climate-finance/ref/recipient-countries` | `get_recipient_countries` | api/v1/routes/climate_finance.py |
| GET | `/api/v1/climate-finance/ref/cpi-data` | `get_cpi_data` | api/v1/routes/climate_finance.py |
| GET | `/api/v1/climate-finance/ref/mdb-institutions` | `get_mdb_institutions` | api/v1/routes/climate_finance.py |

### 2.3 Engine `climate_finance_engine` (services/climate_finance_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `track_climate_finance` | entity_id, portfolio_name, year, instruments |  |
| `assess_article21c_alignment` | entity_id, portfolio, financial_flows |  |
| `calculate_ncqg_contribution` | entity_id, institution_type, baseline_finance_usd, planned_uplift_pct, mobilisation_multiplier, guarantee_share_of_contribution, equity_share_of_contribution, grant_equivalent_pct | All entity-specific figures (planned uplift over baseline, realised mobilisation multiplier, guarantee/equity split, grant-equivalent share, LDCs/SIDS earmark) must be supplied by the caller. When omitted they are returned as HONEST NULLs — the previous version fabricated them via a hash-seeded RNG. Contributor-tier logic and the $300bn core-goal share are genuine deterministic computations and ar |
| `measure_mobilisation` | entity_id, public_finance_usd, instruments |  |
| `generate_climate_finance_report` | entity_id, year, total_finance_usd, adaptation_finance_usd, private_mobilised_usd, carbon_pricing_coverage_pct, fossil_subsidies_usd_bn, green_budget_tagging_adopted | Builds the UNFCCC Biennial Finance Report structure from CALLER-SUPPLIED reported figures. Every entity-level flow is null unless provided (the previous version fabricated the entire headline and all section figures with a hash-seeded RNG). The reference blocks — $100bn commitment tracking, CPI 2023 gap analysis, and MDB joint tracking — are genuine, data-driven and unchanged. |

**Engine `climate_finance_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `OECD_RIO_MARKERS` | `[{'id': 'RM-01', 'name': 'Climate Change Mitigation', 'code': 'CCM', 'marker_values': [0, 1, 2], 'description': '0=not targeted, 1=significant objective, 2=principal objective'}, {'id': 'RM-02', 'name': 'Climate Change Adaptation', 'code': 'CCA', 'marker_values': [0, 1, 2], 'description': '0=not tar` |
| `CPI_2023_DATA` | `{'total_climate_finance_usd_bn': 1265, 'private_finance_usd_bn': 626, 'public_finance_usd_bn': 639, 'adaptation_usd_bn': 63, 'mitigation_usd_bn': 1202, 'annual_need_2030_usd_bn': 4300, 'annual_gap_usd_bn': 3035, 'by_instrument': {'debt': {'amount_usd_bn': 680, 'share_pct': 53.7}, 'equity': {'amount_` |
| `MDB_INSTITUTIONS` | `[{'name': 'World Bank Group', 'code': 'WBG', 'total_finance_usd_bn': 85, 'climate_share_pct': 35, 'adaptation_target_pct': 50, 'paris_aligned_since': 2023}, {'name': 'Asian Development Bank', 'code': 'ADB', 'total_finance_usd_bn': 22, 'climate_share_pct': 44, 'adaptation_target_pct': 30, 'paris_alig` |
| `RECIPIENT_COUNTRIES` | `[{'iso': 'BD', 'country': 'Bangladesh', 'income_group': 'lower_middle', 'climate_vulnerable': True, 'v20': True}, {'iso': 'ET', 'country': 'Ethiopia', 'income_group': 'low', 'climate_vulnerable': True, 'v20': True}, {'iso': 'KE', 'country': 'Kenya', 'income_group': 'lower_middle', 'climate_vulnerabl` |
| `NCQG_STRUCTURE` | `{'headline_goal_usd_bn_per_year': 300, 'target_year': 2035, 'cop_decision': 'COP29 Baku 2024', 'goal_layers': {'core_goal': {'amount_usd_bn': 300, 'contributors': 'Developed country parties (Annex II)', 'description': 'Public and private finance mobilised by developed countries'}, 'broader_goal': {'` |
| `IPCC_PATHWAYS` | `[{'pathway': '1.5C_no_overshoot', 'description': 'Net zero CO2 by 2050, immediate steep reductions', 'peak_warming_c': 1.5, 'annual_investment_usd_tn': 4.3}, {'pathway': 'well_below_2C', 'description': 'Net zero CO2 by 2070, rapid near-term reductions', 'peak_warming_c': 1.8, 'annual_investment_usd_` |
| `MOBILISATION_MULTIPLIERS` | `{'guarantees': {'min': 3.0, 'max': 8.0, 'typical': 5.0, 'methodology': 'OECD DAC Converged Statistical Reporting Directives'}, 'equity': {'min': 2.0, 'max': 4.0, 'typical': 2.8, 'methodology': 'OECD DCD/DAC(2019)34/FINAL'}, 'concessional_loans': {'min': 1.5, 'max': 3.0, 'typical': 2.0, 'methodology'` |
| `CONVERGENCE_BLENDED_FINANCE_MEDIAN_MULTIPLIER` | `4.0` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `provider` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `COLORS`, `DONOR_FLOWS`, `FUNDS`, `PIPELINE`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global $100Bn Commitment Progress | `OECD monitored climate finance` | OECD Climate Finance Monitoring | Annual climate finance mobilised toward developed-country $100Bn commitment |
| NDC Financing Gap | `NDC need – available finance` | UNFCCC SCF | Aggregate developing country climate financing shortfall |
| Adaptation Finance Share | `Adaptation / total climate finance` | OECD DAC | Share of climate finance allocated to adaptation vs mitigation |
| Article 6.4 Credit Flow | `ITMO transfers via Art. 6.4` | UNFCCC SB | International carbon credit flow under Paris Agreement Article 6.4 mechanism |
- **OECD DAC CRS database** → Rio Marker finance data → committed/disbursed tracking → **Annual climate finance flow**
- **UNFCCC NDC registry** → Implementation cost estimates → financing need → **Country-level NDC finance gap**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/climate-finance/ref/cpi-data** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'data_year', 'key_findings', 'data', 'ipcc_pathways'], 'n_keys': 5}`

**GET /api/v1/climate-finance/ref/mdb-institutions** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'total_mdb_climate_finance_usd_bn', 'institutions_count', 'institutions', 'mobilisation_multipliers'], 'n_keys': 5}`

**GET /api/v1/climate-finance/ref/ncqg-structure** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'cop_decision', 'legal_basis', 'structure', 'predecessor_100bn_tracking'], 'n_keys': 5}`

**GET /api/v1/climate-finance/ref/oecd-markers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'methodology', 'marker_values', 'markers_count', 'markers'], 'n_keys': 5}`

**GET /api/v1/climate-finance/ref/recipient-countries** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['total_countries', 'income_group_breakdown', 'v20_members', 'climate_vulnerable', 'countries'], 'n_keys': 5}`

**POST /api/v1/climate-finance/article21c-alignment** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/climate-finance/mobilisation** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/climate-finance/ncqg-contribution** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Climate finance gap = need minus committed minus disbursed
**Headline formula:** `FinGap(c) = NDCNeed(c) – Committed(c) – Disbursed(c); GlobalGap = Σ_c FinGap(c)`

Country-level NDC financing need estimated from nationally determined contribution implementation costs (UNFCCC SCF compilation). Committed finance from OECD DAC CRS tracked by Rio Marker. Disbursed finance from bilateral and multilateral development bank project data. Article 6.4 credit flows tracked via UNFCCC Supervisory Body. Finance gap = need minus (committed + disbursed).

**Standards:** ['UNFCCC Standing Committee on Finance', 'OECD Climate Finance Monitoring', 'CPI Global Landscape of Climate Finance', 'Paris Agreement Art. 9']
**Reference documents:** UNFCCC Standing Committee on Finance Biennial Assessment; OECD Climate Finance Monitoring Report 2024; CPI Global Landscape of Climate Finance 2023; Paris Agreement Articles 9 and 6

**Engine `climate_finance_engine` — extracted transformation lines:**
```python
fossil_exposure = 0.0            # sum of caller-supplied fossil-fuel amounts
mitigation_counted = amount if ccm_marker == 2 else amount * 0.5 if ccm_marker == 1 else 0
adaptation_counted = amount if cca_marker == 2 else amount * 0.5 if cca_marker == 1 else 0
total_climate_finance = total_mitigation + total_adaptation + total_cross_cutting
contribution_usd = baseline_finance_usd * (1 + effective_uplift_pct / 100)
guarantee_amount = contribution_usd * g_share
equity_amount = contribution_usd * e_share
share_of_core_goal_pct = contribution_usd / core_goal * 100
mobilised = amount * actual_multiplier
weighted_avg_multiplier = total_mobilised / public_finance_usd if public_finance_usd > 0 else 0
additionality_avg = additionality_score / public_finance_usd if public_finance_usd > 0 else 0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).
**Shared engines (edits propagate!):** `climate_finance_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `climate-finance-hub` | engine:climate_finance_engine, table:provider |

## 7 · Methodology Deep Dive

> ⚠️ **Engine↔page divergence.** Like `climate-finance-hub`, this tier-A page is backed by the same
> rigorous OECD-CRS engine (`climate_finance_engine.py`, E78 — Rio-marker counting, DAC mobilisation,
> honest-NULL policy) **but does not call it.** The page is a mostly-static climate-finance-flows
> dashboard: hard-coded (realistic) fund, donor and pipeline tables, plus a 50-row `sr()`-seeded
> transaction ledger and a seeded annual trend. It aggregates and sorts these on-page; it computes no
> Rio-marker attribution. The sections below document the page; §7.6 notes the engine.

### 7.1 What the module computes

The page's live logic is filtering, sorting, and aggregation over four datasets:

```
flows (50, seeded)  → filter by purpose/channel + search → sort → sum amountMn
FUNDS (6, real)     → per-fund pledged/disbursed/adaptation-mitigation split
DONOR_FLOWS (12)    → public/private/adapt/mitig/NCQG pledge per donor
PIPELINE (15)       → blended %, return %, risk, stage per project
annualTrend (8, seeded) → public/private/adaptation/total per year 2018–2025
targetSlider        → scales an NCQG progress view
```

The only arithmetic is sums, sorts, and CSV export — no financial model.

### 7.2 Parameterisation / provenance

| Dataset | Nature | Provenance |
|---|---|---|
| `flows` (50 rows) | type/channel/sector/amount/grantElement/coFinancingRatio | **`sr()`-seeded** (real category names) |
| `FUNDS` (6) | GCF $12.8 Bn pledged / $4.2 Bn disbursed / 228 projects… | **Hard-coded realistic** (GCF, AF, GEF, CIF, LDCF, L&D Fund) |
| `DONOR_FLOWS` (12) | USA $29.6 Bn total, Japan NCQG $20 Bn… | Hard-coded realistic donor figures |
| `PIPELINE` (15) | Sahel Solar $450M, blended 35 %, return 8.2 %… | Hard-coded illustrative deals |
| `annualTrend` | `55 + sr(i·3)×15 + i×5` etc. | **Seeded** with linear growth |
| `grantElement` | `20 + sr(i·47)×70` | Seeded (20–90 %) |
| `coFinancingRatio` | `1 + sr(i·53)×9` | Seeded leverage 1–10× |

### 7.3 Calculation walkthrough

1. **Global Dashboard** — headline stats from `FUNDS`/`DONOR_FLOWS`/`annualTrend`; public vs private
   area chart; the `targetSlider` scales a delivered-vs-target NCQG view.
2. **Fund-Level Analytics** — selects a fund; renders its adaptation/mitigation/cross-cutting split
   and disbursement ratio.
3. **Country-Level Flows** — sortable `DONOR_FLOWS` table; per-donor public/private and NCQG pledge.
4. **Investment Pipeline** — sortable `PIPELINE` filtered by stage; blended-finance % and return.
5. **Flow ledger** — the seeded 50-row transaction table, filter/sort/export.

### 7.4 Worked example — a fund's disbursement ratio

Green Climate Fund (`totalPledgedBn = 12.8`, `disbursedBn = 4.2`, adaptation 42 % / mitigation 38 % /
cross 20 %):

| Metric | Computation | Result |
|---|---|---|
| Disbursement ratio | 4.2 / 12.8 | **32.8 %** |
| Adaptation allocation | 12.8 × 0.42 | $5.38 Bn |
| Mitigation allocation | 12.8 × 0.38 | $4.86 Bn |
| Cross-cutting | 12.8 × 0.20 | $2.56 Bn |

These are read/derived from the hard-coded fund record — realistic but static, not tracked from live
CRS reporting.

### 7.5 Data provenance & limitations

- **Mixed provenance**: fund/donor/pipeline tables are hard-coded realistic figures; the 50-row flow
  ledger, annual trend, grant elements and co-financing ratios are **`sr()`-seeded**
  (`sr(seed) = frac(sin(seed+1)×10⁴)`).
- **The page does not invoke the E78 engine** — no Rio-marker counting, no DAC mobilisation
  multiplier, no honest-NULL. Co-financing "leverage" is a seeded 1–10× scalar.
- Reference figures (GCF pledges, NCQG donor pledges) are point-in-time and will age.

### 7.6 The available (unused) engine

`climate_finance_engine.py` implements CRS Rio-marker attribution (principal 100 % / significant
50 %), cross-cutting netting, OECD DAC mobilisation with observed-multiplier preference, Art. 2.1(c)
alignment, and NCQG contribution accounting — with a strict "real computation or honest NULL, no
RNG" policy. Wiring this page to it (as specified in §8) would replace the seeded ledger with
CRS-counted flows.

**Framework alignment:** OECD CRS Rio Markers, OECD DAC mobilisation, CPI Global Landscape 2023, NCQG
$300 Bn COP29 Baku, GCF/AF/GEF/CIF/LDCF/Loss & Damage fund architecture, UNFCCC Art. 2.1(c). The page
*presents* against these frameworks; the engine *implements* them.

## 8 · Model Specification — CRS-Counted Flow Ledger for the Tracker

**Status: specification — not yet implemented in code.** The page runs on seeded flows; this
specifies replacing them with engine-computed CRS attribution.

### 8.1 Purpose & scope
Replace the 50-row seeded ledger and seeded co-financing ratios with OECD-CRS-counted climate-finance
flows and DAC-mobilisation-based leverage, sourced from the E78 engine.

### 8.2 Conceptual approach
Consume `track_climate_finance` + `measure_mobilisation`, applying honest-NULL where inputs are
missing. Benchmarks: OECD CRS/DAC methodology and CPI Global Landscape accounting.

### 8.3 Mathematical specification
```
ClimateRelevant_flow = amount·(ccm==2?1: ccm==1?0.5:0) + amount·(cca==2?1: cca==1?0.5:0)
                       − min(mit, adapt)                         (cross-cut netting)
Mobilisation_ratio   = private_mobilised / public_committed      (observed preferred, else OECD typical)
NCQG_progress        = Σ delivered / donor NCQG_pledge
GrantEquivalent      = Σ flow · grant_element%
```
| Parameter | Source |
|---|---|
| ccm/cca markers | Reporting-entity CRS coding |
| Mobilisation multiplier | Observed or OECD DAC typical |
| Donor NCQG pledges | COP29 Baku pledges (already hard-coded) |

### 8.4 Data requirements
Instrument-level flows with Rio markers and public/private split fed to the engine; the fund/donor
reference tables already exist. The engine computes everything — the page needs an API call.

### 8.5 Validation & benchmarking plan
Reconcile CRS-counted totals against OECD DAC published climate-finance figures; verify honest-NULL
propagation; cross-check against CPI 2023 sector/geography shares and donor NCQG pledges.

### 8.6 Limitations & model risk
CRS self-reporting over-counts; mobilisation multipliers contested; NCQG pledges are political not
delivered. Conservative fallback: count significant markers at 50 % and show NULL rather than a
seeded co-financing ratio where mobilisation data is absent.

## 9 · Future Evolution

### 9.1 Evolution A — Compute the finance gap from sourced flows (analytics ladder: rung 1 → 2)

**What.** §7 shows the same engine↔page divergence as its sibling hub: the rigorous
OECD-CRS engine (E78) sits uncalled while the page renders hard-coded fund/donor/
pipeline tables (realistic), a 50-row `sr()`-seeded transaction ledger, and a seeded
annual trend — sums and sorts only, no Rio-marker attribution, and the guide's
headline `FinGap(c) = NDCNeed(c) − Committed(c) − Disbursed(c)` never computed.
Evolution A implements the gap formula on sourced terms: OECD DAC climate-finance
totals (published annually) for committed/disbursed, UNFCCC SCF Biennial Assessment
needs compilations for NDC needs, and the engine's Rio-marker logic applied to any
user-entered instruments — with the seeded ledger and trend series deleted.

**How.** (1) `ref_climate_finance_flows(country, year, committed, disbursed, source)`
and `ref_ndc_needs(country, need_low, need_high, source)` reference tables — both
publish as report tables, a bounded curation task; the gap computed per country with
need ranges carried through (needs are ranges, and the gap must be too).
(2) The genuinely useful seed tables (FUNDS, DONOR_FLOWS with NCQG pledges) upgraded
with source/vintage columns. (3) Page wired to the four existing ref GETs
(`cpi-data`, `mdb-institutions`, `ncqg-structure`, `oecd-markers`) so the engine's
real reference payloads replace equivalent hard-coding.

**Prerequisites (hard).** Seeded ledger/trend purge; needs-data honesty — SCF
compilations are incomplete per country, and missing needs must render as gaps in
coverage, not zeros. **Acceptance:** a country's finance gap decomposes into three
sourced terms with vintages; the $100Bn/NCQG progress view reconciles to OECD
published totals; zero `sr()` rows remain.

### 9.2 Evolution B — COP-brief copilot (LLM tier 1)

**What.** A copilot for the questions this tracker exists to answer: "where does the
$100Bn commitment actually stand and on whose accounting?" (OECD vs Oxfam-style
critiques — the copilot cites the accounting basis per §5's SCF/OECD/CPI corpus),
"what share of flows to Africa is adaptation?", "what did donor X pledge under
NCQG?" — retrieval and comparison over the sourced tables with the accounting-method
caveats that make this domain contentious stated explicitly.

**How.** Atlas record, reference tables, and the engine's ref-endpoint payloads as
corpus; every dollar figure cited with source-year-basis (commitment vs disbursement
— the module's own core distinction — must survive into prose); refusal on
forward-pledge speculation.

**Prerequisites (hard).** Evolution A first — the current page's ledger is seeded
and its trend synthetic; narrating them as flow intelligence would mislead.
**Acceptance:** every figure carries source+basis; asked "has the $100Bn been met?",
the answer states the accounting basis and year rather than a bare yes/no.