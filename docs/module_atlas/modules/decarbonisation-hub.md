# Decarbonisation Hub
**Module ID:** `decarbonisation-hub` · **Route:** `/decarbonisation-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Enterprise-wide decarbonisation programme management platform consolidating emission reduction targets, project portfolios, budget allocation, and progress tracking in a single view. Supports Science Based Targets initiative (SBTi) near-term and net-zero target setting. Executive dashboards surface headline progress against committed pathways.

> **Business value:** Provides board and sustainability leadership with a single source of truth on decarbonisation progress, pipeline, and budget. Identifies abatement gaps early so management can commission additional projects before target deadlines are missed.

**How an analyst works this module:**
- Set the baseline year and absolute emission baseline in programme settings
- Register decarbonisation projects with technology type, expected abatement, cost, and timeline
- Monitor actual emission reductions against the SBTi-required linear pathway on the trajectory chart
- Identify off-track business units and allocate additional projects to close the abatement gap

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ABATEMENT`, `COMPANIES`, `PATHWAY`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ABATEMENT` | 10 | `measure`, `cost`, `potential` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `PATHWAY` | `Array.from({length:7},(_,i)=>({year:2025+i*5,currentEmissions:Math.round(100-i*10+sr(i*7)*5),targetEmissions:Math.round(100-i*14),sbtiPath:Math.round(100-i*16),progressPct:Math.round(10+i*12+sr(i*11)*5)}));` |
| `filtered` | `useMemo(()=>{let d=[...COMPANIES];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));if(sectorF!=='All')d=d.filter(r=>r.sector===sectorF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,sectorF,sortCol,sortDir]); const paged=useMemo(()=>filtered.slice((p` |
| `stats` | `useMemo(()=>({count:filtered.length,totalEmissions:filtered.reduce((s,r)=>s+r.totalEmissions,0),avgProgress:(filtered.reduce((s,r)=>s+r.progressPct,0)/filtered.length\|\|0).toFixed(0),sbtiApproved:filtered.filter(r=>r.sbti` |
| `sectorEmissions` | `useMemo(()=>{const m={};COMPANIES.forEach(r=>{if(!m[r.sector])m[r.sector]={s:r.sector,e:0,p:0,n:0};m[r.sector].e+=r.totalEmissions;m[r.sector].p+=r.progressPct;m[r.sector].n++;});return Object.values(m).map(s=>({sector:s` |
| `sbtiDist` | `useMemo(()=>{const m={};COMPANIES.forEach(r=>{m[r.sbtiStatus]=(m[r.sbtiStatus]\|\|0)+1;});return Object.entries(m).map(([k,v])=>({name:k,value:v}));},[]);` |
| `roadmapDist` | `useMemo(()=>{const m={};COMPANIES.forEach(r=>{m[r.roadmapStatus]=(m[r.roadmapStatus]\|\|0)+1;});return Object.entries(m).map(([k,v])=>({name:k,value:v}));},[]);` |
| `exportCSV` | `useCallback((data,fn)=>{if(!data.length)return;const keys=Object.keys(data[0]);const csv=[keys.join(','),...data.map(r=>keys.map(k=>`"${r[k]}"`).join(','))].join('\n');const blob=new Blob([csv],{type:'text/csv'});const u` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ABATEMENT`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio Decarbonisation Rate | — | GHG inventory system | Year-on-year absolute Scope 1+2 emission reduction across all corporate entities |
| SBTi-Aligned Projects | — | Project registry | Count of active decarbonisation projects validated as consistent with SBTi criteria |
| CapEx Committed | — | Finance system | Total capital expenditure committed to decarbonisation projects in current programme |
| Net-Zero Target Year | — | Board commitment register | Committed net-zero year per the corporate climate strategy |
- **GHG inventory system (Scope 1/2/3 actuals)** → Baseline normalisation and year-on-year reduction calculation → **Decarbonisation rate and trajectory vs. SBTi pathway**
- **Project registry (type, cost, abatement estimate)** → Abatement curve construction across all active projects → **Aggregate abatement potential vs. required reduction gap**
- **Finance system (CapEx commitments)** → Budget-to-abatement efficiency ratio calculation → **Cost per tonne CO₂e abated by project and technology type**

## 5 · Intermediate Transformation Logic
**Methodology:** Decarbonisation Rate
**Headline formula:** `DR = (Baseline Emissions − Current Emissions) / Baseline Emissions × 100`

The decarbonisation rate measures absolute Scope 1+2 (and optionally Scope 3) emission reductions against a fixed baseline year. Trajectory modelling compares actual rate against the linear SBTi-required 4.2% per year (1.5°C) or sector-specific pathway to confirm alignment.

**Standards:** ['SBTi Corporate Net-Zero Standard', 'GHG Protocol Corporate Standard', 'TCFD Metrics & Targets']
**Reference documents:** SBTi (2023) Corporate Net-Zero Standard v1.2; GHG Protocol (2015) Corporate Value Chain (Scope 3) Accounting and Reporting Standard; TCFD (2021) Guidance on Metrics, Targets, and Transition Plans; IEA (2023) Net Zero by 2050 Roadmap

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes an enterprise decarbonisation-programme manager
> computing a *Decarbonisation Rate* `DR = (Baseline − Current)/Baseline × 100` from a real GHG
> inventory, with SBTi 4.2%/yr pathway alignment, CapEx-to-abatement tracking, and a marginal-abatement
> curve. **None of these are computed from real data.** The page renders 60 fully **synthetic**
> companies (every metric — emissions, SBTi status, progress %, credibility, abatement cost — is drawn
> from the seeded PRNG `sr()`), a fixed 7-point pathway, and a **static** 10-row abatement cost table.
> There is no DR calculation, no per-company baseline, and no MAC ranking beyond the hard-coded table.
> Sections below document the synthetic dashboard.

### 7.1 What the module computes

```js
COMPANIES = 60 firms; each metric seeded, e.g.:
  totalEmissions = round(5 + sr(i·7)·495)      // 5–500 MtCO₂
  sbtiStatus     = sr(i·29) thresholds → Approved | Committed | Near-term | None
  progressPct    = round(5 + sr(i·37)·60)
  credibilityScore = round(15 + sr(i·71)·80)
  roadmapStatus  = sr(i·73) thresholds → On Track | Behind | At Risk | No Plan
PATHWAY  = 7 points 2025–2055: currentEmissions=100−10i(+noise), targetEmissions=100−14i, sbtiPath=100−16i
ABATEMENT = 10 static levers {measure, cost $/tCO₂, potential %}
```

Aggregates are simple sums/means over the synthetic set: `stats.totalEmissions`, `avgProgress`,
`sbtiApproved` count, `avgCredibility`, `onTrack` count. Charts: SBTi/roadmap pie distributions,
sector-emission bars, the fixed pathway line, credibility-vs-progress scatter, and a cumulative
abatement column on the static levers.

### 7.2 Parameterisation

| Element | Value | Provenance |
|---|---|---|
| Companies | 60 real names, sector-tagged | names real; all metrics synthetic (`sr()`) |
| Pathway | current −10/pt, target −14/pt, SBTi −16/pt | illustrative linear glide (indexed to 100) |
| Abatement levers | Energy Efficiency $15/18%, Renewables $25/22%, Electrification $45/15%, H₂ $80/12%, CCUS $95/10%, Nature $20/8%, Circular $35/7%, Fuel-switch $55/6%, Process $70/5%, Offsets $30/4% | static, plausible MAC values |

The abatement table is the only quasi-real content: cost ($/tCO₂) and potential (%) values are
sensible order-of-magnitude estimates for each lever, and the cumulative-potential column is a real
running sum — but they are portfolio-agnostic constants, not derived from the companies.

### 7.3 Calculation walkthrough

Filter/search/sort over the 60 companies → paginated table + KPIs. The SBTi tracker cross-tabs status
by sector (stacked bars) and target-year distribution (pie). The abatement tab plots the static levers
as a cost/potential bar + scatter and a cumulative table. The roadmap tab shows the fixed pathway and
sector-average progress. The side panel renders a radar of a selected company's synthetic
progress/renewable/efficiency/credibility/CCUS/target axes.

### 7.4 Worked example

Company i=0 (Exxon Mobil, Energy): `totalEmissions = round(5 + sr(0)·495)`. `sr(0) = frac(sin(1)·10⁴)
= frac(8414.7…) = 0.7099` → `round(5 + 0.7099·495) = round(356.4) = 356 MtCO₂`.
`sbtiStatus` from `sr(0) = frac(sin(1)·10⁴)`… (different seed `i·29 = 0` → same `sr(0)=0.7099 > 0.7`)
→ `'None'`. Cumulative abatement after the top-3 levers = `18 + 22 + 15 = 55%`. All figures are stable
across renders (seeded) but bear no relation to Exxon's actual inventory.

### 7.5 Data provenance & limitations

- **Every company-level metric is synthetic**, seeded by `sr(seed) = frac(sin(seed+1)×10⁴)`; only the
  company names/sectors are real. There is no GHG inventory, no baseline, no computed DR.
- The pathway is a fixed linear glide indexed to 100, not fitted to any company or to the SBTi 4.2%/yr
  absolute-contraction rate the guide cites.
- The MAC table is static and portfolio-independent — no per-lever CapEx/OpEx/savings decomposition,
  no ordering by ascending MAC beyond its authored order.

**Framework alignment:** SBTi Corporate Net-Zero Standard — the SBTi status buckets and the 1.5 °C
"4.2 %/yr absolute reduction" reference the real standard (SBTi validates a company's near-term and
net-zero targets against sector/absolute pathways), but this page only *labels* companies, it does not
validate targets. GHG Protocol Scope 1/2/3 framing appears in the schema; TCFD Metrics & Targets
motivate the progress/credibility read-outs. A production hub would ingest audited inventories and
compute DR + SBTi-pathway alignment per company — see the companion `decarbonisation-roadmap` module
for the MAC-curve mechanics.

## 9 · Future Evolution

### 9.1 Evolution A — Compute the DR from real inventories; retire the seeded universe (analytics ladder: rung 1 → 2)

**What.** §7's mismatch flag: every company-level metric across the 60 real-named
firms is `sr()`-seeded — no GHG inventory, no baseline, no computed
`DR = (Baseline − Current)/Baseline`, a pathway that is a fixed linear glide
rather than the SBTi 4.2%/yr absolute-contraction rate the guide cites, and a
static portfolio-agnostic MAC table. The only quasi-real content is the abatement
levers' order-of-magnitude costs. Evolution A gives the hub real programme data
and the promised rate computation.

**How.** (1) Data substrate: for portfolio-company tracking, emissions and SBTi
status from the platform's real sources — the `company-profiles` BRSR dataset
carries reported Scope 1/2/3 and SBTi flags for 80 issuers; for
own-enterprise programme management (the overview's actual pitch), baseline and
project registration persist to a `decarb_programme` vertical. (2) DR computed
per entity from baseline vs latest inventory; pathway alignment against the real
SBTi cross-sector 4.2%/yr line and sector pathways (curated from SBTi's published
tools), replacing the indexed glide. (3) Project registry: registered levers with
expected abatement roll up into the gap-to-target analysis the overview promises
("commission additional projects before deadlines are missed"). (4) MAC detail
defers to the companion `decarbonisation-roadmap` module (§7 itself points
there) — the hub consumes its lever library rather than duplicating a static
table.

**Prerequisites (hard).** Seed purge (real names with fabricated SBTi statuses
are a disclosure risk); the programme-registry schema; SBTi pathway curation.
**Acceptance:** DR for a BRSR company reproduces from its reported figures; the
trajectory chart shows the genuine 4.2%/yr reference; a registered project's
abatement visibly narrows the computed gap.

### 9.2 Evolution B — Board-progress narrator for the decarbonisation programme (LLM tier 1 → 2)

**What.** The hub's audience — "board and sustainability leadership" — reads
narratives, not scatter plots. Evolution B drafts the quarterly programme update
from computed state: DR against the required pathway with the gap quantified,
project-pipeline status (registered abatement vs gap), budget deployment against
abatement delivered, and the off-track business units with their specific
shortfalls — every figure from the (post-Evolution A) programme registry and
inventory data, uncertainty and data-vintage caveats carried from the source
records.

**How.** Tier 1 over programme state plus this Atlas record and the SBTi standard
text; tier 2 when the registry is served, letting "what if we accelerate the
electrification lever by two years?" run as a registry what-if the narrator then
explains. Rendering through the report-studio layer; the fabrication validator on
all MtCO₂e and dollar figures — a board pack is precisely where an invented
number does maximum damage.

**Prerequisites (hard).** Evolution A (narrating seeded progress to a board is
the failure mode this platform's guardrails exist for); registry persistence.
**Acceptance:** every figure in a draft reproduces from registry/inventory
queries; the gap statement matches the computed pathway arithmetic; off-track
claims cite the specific units' data.