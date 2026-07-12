# Proxy Voting Intelligence
**Module ID:** `proxy-voting-intel` · **Route:** `/proxy-voting-intel` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
ESG-aligned proxy voting analytics covering shareholder resolution tracking, voting policy alignment, and engagement outcome monitoring.

> **Business value:** Streamlines ESG proxy voting workflows, ensuring policy alignment, regulatory compliance, and systematic tracking of stewardship outcomes.

**How an analyst works this module:**
- Review upcoming AGM calendar and ESG resolution roster.
- Apply voting policy filters to generate recommended votes.
- Override and document rationale for any policy deviations.
- Track resolution outcomes and engagement effectiveness.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `COS`, `RESTYPES`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(0):v;` |
| `totalRes` | `Math.round(sr(i*7)*15+3);const esgRes=Math.round(totalRes*(sr(i*11)*0.4+0.1));const avgSupport=Math.round(sr(i*13)*40+20);const mgmtOpposed=Math.round(esgRes*(sr(i*17)*0.6+0.2));` |
| `resolutions` | `Array.from({length:Math.min(esgRes,5)},(_,j)=>({type:RESTYPES[Math.floor(sr(i*100+j*7)*RESTYPES.length)],support:Math.round(sr(i*100+j*11)*50+15),year:2023+Math.floor(sr(i*100+j*13)*2),result:sr(i*100+j*17)>0.7?'Passed':` |
| `filtered` | `useMemo(()=>{let d=[...COS];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));if(sectorF!=='All')d=d.filter(r=>r.sector===sectorF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,sectorF,sortCol,sortDir]); const paged=useMemo(()=>filtered.slice((page-1)` |
| `stats` | `useMemo(()=>({count:filtered.length,totalESGRes:filtered.reduce((s,r)=>s+r.esgResolutions,0),avgSupport:Math.round(filtered.reduce((s,r)=>s+r.avgSupportPct,0)/filtered.length\|\|0),totalPassed:filtered.reduce((s,r)=>s+r.pa` |
| `resTypeDist` | `useMemo(()=>{const m={};COS.forEach(c=>c.resolutions.forEach(r=>{m[r.type]=(m[r.type]\|\|0)+1;}));return Object.entries(m).map(([k,v])=>({type:k,count:v})).sort((a,b)=>b.count-a.count);},[]);` |
| `sectorVoting` | `useMemo(()=>{const m={};COS.forEach(c=>{if(!m[c.sector])m[c.sector]={s:c.sector,support:0,sop:0,n:0};m[c.sector].support+=c.avgSupportPct;m[c.sector].sop+=c.sayOnPayPct;m[c.sector].n++;});return Object.values(m).map(s=>(` |
| `exportCSV` | `useCallback((data,fn)=>{if(!data.length)return;const keys=Object.keys(data[0]).filter(k=>k!=='resolutions');const csv=[keys.join(','),...data.map(r=>keys.map(k=>`"${r[k]}"`).join(','))].join('\n');const b=new Blob([csv],` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `RESTYPES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| AGMs Covered (YTD) | — | Proxy Voting Registry | Total shareholder meetings for which voting analysis has been completed year-to-date. |
| ESG Resolution Pass Rate (%) | — | Meeting Outcomes | Proportion of ESG-related shareholder resolutions passing at covered AGMs. |
| Voting Policy Alignment (%) | — | Internal Voting Policy | Share of votes cast consistent with institutional ESG voting policy guidelines. |
- **AGM schedule + resolution text + company ESG data** → Policy alignment mapping; recommendation generation; outcome recording → **Voting recommendations, policy alignment report, and engagement outcomes tracker**

## 5 · Intermediate Transformation Logic
**Methodology:** Voting Alignment Score
**Headline formula:** `VA = (votes_aligned_to_policy / total_votes) × 100`

Percentage of votes cast in alignment with the institutional investor’s stated ESG voting policy.

**Standards:** ['ISS Proxy Voting Guidelines', 'Glass Lewis Benchmark Policy']
**Reference documents:** ISS 2024 Proxy Voting Guidelines; Glass Lewis 2024 Benchmark Policy Guidelines; UN PRI Active Ownership 2.0

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes a **voting-alignment score**
> `VA = (votes_aligned_to_policy / total_votes) × 100`. **No such ratio is computed.** The code's
> `issVote`/`glassLewis` are **seeded binary flags** (`sr(i·41) > 0.4 ? 'Aligned' : 'Divergent'`),
> not a percentage derived from a vote ledger. All 80 companies carry **real names and sectors** but
> **every voting metric is `sr()`-seeded** (resolutions, support %, say-on-pay, director election,
> abstention, engagements). The page is a filter/sort/paginate workbench over this synthetic book,
> with correct aggregate arithmetic on fabricated inputs.

### 7.1 What the module computes

Per company (80, real names Apple…Brookfield with hand-mapped sectors):

```js
totalRes    = round(sr(i·7)·15 + 3)                          // 3–18 total resolutions
esgRes      = round(totalRes × (sr(i·11)·0.4 + 0.1))         // 10–50% of total are ESG
avgSupport  = round(sr(i·13)·40 + 20)                        // 20–60 % support
mgmtOpposed = round(esgRes × (sr(i·17)·0.6 + 0.2))
resolutions = up to 5 items: {type (12-type list), support 15–65%, year 2023–24,
              result sr>0.7?'Passed':'Failed', filer (8 real filers)}
sayOnPayPct = round(sr(i·23)·25 + 70)                        // 70–95 %
directorElectionAvg = round(sr(i·29)·15 + 80)               // 80–95 %
issVote     = sr(i·41) > 0.4 ? 'Aligned' : 'Divergent'      // seeded flag, NOT a ratio
passedESG   = resolutions.filter(result='Passed').length
```

**Portfolio aggregates** (correct arithmetic over the seeded book):

```js
totalESGRes  = Σ esgResolutions
avgSupport   = round( Σ avgSupportPct / n )
totalPassed  = Σ passedESG
issAligned   = #{ issVote='Aligned' }
sectorVoting = per-sector mean of avgSupportPct and sayOnPayPct
resTypeDist  = histogram of resolution types across all companies' resolution lists
```

### 7.2 Parameterisation / provenance

| Field | Formula | Provenance |
|---|---|---|
| Company names / sectors | fixed arrays | **real** (80 large caps, hand-mapped) |
| Resolution filers | 8-name list | **real** (As You Sow, Follow This, ICCR, CalPERS…) |
| Resolution types | 12-type list | **real** ESG proposal taxonomy |
| totalRes / esgRes | `sr()` ranges | synthetic |
| avgSupportPct | `sr(i·13)·40 + 20` | synthetic (20–60%) |
| issVote / glassLewis | `sr() > threshold` flag | **synthetic; not a computed alignment** |
| sayOnPayPct, directorElectionAvg | `sr()` ranges | synthetic |

The **taxonomy is real** (proposal types, filers, proxy advisors) even though the **quantities are
fabricated** — a common pattern in this codebase.

### 7.3 Calculation walkthrough

1. `COS` seeds 80 companies; each gets a nested `resolutions` array (≤5) also seeded.
2. Filter (search/sector) + sort + paginate (12/page).
3. `stats` computes correct means/sums over the filtered set.
4. Charts: resolution-type histogram, sector support bars, ISS-alignment-by-sector
   (`#aligned/#total × 100` — a real ratio, but over the seeded flags), support-vs-abstention scatter.

### 7.4 Worked example (one company, i = 0 "Apple")

`sr(0·7)=sr(0)`, `sr(0·11)=sr(0)`, `sr(0·13)=sr(0)` — note the **seed collision**: for i=0 several
fields share `sr(0)` because `0×k = 0`. Suppose `sr(0) ≈ 0.30`:
`totalRes = round(0.30·15 + 3) = round(7.5) = 8`; `esgRes = round(8 × (0.30·0.4 + 0.1)) = round(8×0.22)
= 2`; `avgSupport = round(0.30·40 + 20) = 32%`; `issVote = sr(0)>0.4 ? … = 0.30>0.4 → 'Divergent'`.
The i=0 collision means Apple's total/ESG/support are all driven by the same draw — an artefact of the
`i·k` seeding when i=0.

### 7.5 Data provenance & limitations

- **Company/filer/type taxonomies are real; all voting numbers are synthetic**, seeded by
  `sr(seed)=frac(sin(seed+1)×10⁴)`.
- **`issVote`/`glassLewis` are seeded flags, not computed alignment** — the guide's `VA` ratio is not
  implemented at the company level (only a sector-level share of the seeded flags is charted).
- **Seed collision at i=0**: several fields reuse `sr(0)` (Apple), correlating metrics that should be
  independent.
- Resolution `support` for a nested resolution is drawn independently of the company `avgSupportPct`,
  so they need not reconcile.

**Framework alignment:** **ISS 2024 Proxy Voting Guidelines** and **Glass Lewis Benchmark Policy** are
the alignment references (the two proxy advisors whose recommendations institutions benchmark against);
**UN PRI Active Ownership 2.0** frames the stewardship metrics. The 12 resolution types and 8 filers
(As You Sow, Follow This, ICCR, ShareAction, Trillium, Mercy Investment, CalPERS, NYSCRF) are
accurate real-world stewardship actors. None of these frameworks' quantitative scoring is implemented;
the page renders a plausible-looking but synthetic voting universe. (A real alignment model mirrors
the spec in `proxy-voting-climate` §8.)

## 9 · Future Evolution

### 9.1 Evolution A — Vote ledger with a computed alignment ratio (analytics ladder: rung 1 → 2)

**What.** The page is a competent filter/sort/paginate workbench doing correct aggregate arithmetic over fabricated inputs: 80 real company names and a real proposal taxonomy (As You Sow, Follow This, ICCR filers; 12 proposal types), but every quantity is `sr()`-seeded, and — the §7 flag's core point — `issVote`/`glassLewis` are seeded binary flags (`sr(i·41) > 0.4 ? 'Aligned' : 'Divergent'`), so the guide's `VA = (votes_aligned_to_policy / total_votes) × 100` is never computed from a vote ledger. Evolution A builds that ledger and derives alignment properly, sharing infrastructure with `proxy-voting-climate` (whose evolution proposes the same `proxy_resolutions`/`proxy_votes` tables) rather than duplicating it — this module takes the workflow role: recommendations, overrides with rationale, outcome tracking.

**How.** (1) Extend the shared register with `proxy_vote_recommendations` (policy-derived recommended vote per resolution) and `proxy_vote_overrides` (analyst rationale, timestamped — the "document rationale for deviations" workflow §1 promises but nothing stores). (2) `GET /alignment` computes VA as cast-vs-policy over ledger rows, per period and per proxy-advisor benchmark; ISS/GL alignment becomes a comparison against ingested advisor recommendations where available, or is dropped — not simulated. (3) SEC N-PX filings as the free real-data seed for cast votes; the seeded book retired to demo fixtures.

**Prerequisites.** Coordination with `proxy-voting-climate`'s Evolution A (one register, two surfaces); policy-rule encoding for recommendation generation. **Acceptance:** VA changes when one override flips a vote; the recommendation for a resolution cites the policy rule that produced it.

### 9.2 Evolution B — AGM-season triage analyst (LLM tier 2)

**What.** The 12-type proposal taxonomy and filer list make this the right surface for a triage analyst: "list next month's AGMs where our policy recommends against management, grouped by proposal type", "which overrides this season lack a documented rationale?", "draft the quarterly stewardship-outcomes summary from the ledger". Each is a tool call over the Evolution-A endpoints, with the summary composed from computed aggregates (pass rates, VA trend, override count) rather than recalled figures.

**How.** Tier-2 tool schemas from the ledger/alignment/recommendation endpoints; resolution-text summarization (the genuinely LLM-shaped task — proposal texts are long and formulaic) grounded in the stored resolution text field with the proposal-type taxonomy as the classification target. Override-quality checks are read-only; the copilot flags missing rationales but cannot write votes or overrides without the confirmation-gated mutation path. System prompt carries the §7 caveat until real data lands: seeded-book numbers must never be cited as stewardship fact.

**Prerequisites (hard).** Evolution A ledger with real or clearly-fixture data; resolution text stored (today only type labels exist). **Acceptance:** the quarterly summary's every statistic matches a ledger aggregate endpoint response, and proposal-type classifications agree with the stored taxonomy on a golden set.