# Living Wage Tracker
**Module ID:** `living-wage-tracker` · **Route:** `/living-wage-tracker` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Global benchmarking platform comparing reported or estimated worker wages to living wage standards from Anker Research Institute, WageIndicator Foundation, and Fair Wage Network across 120+ countries and 400+ regions. Quantifies the living wage gap by sector, country, and occupation group and models the cost impact of wage uplift on issuer financials. Supports CSRD ESRS S1 employee matters disclosure and social bond impact reporting.

> **Business value:** Enables ESG analysts, social bond issuers, and CSRD-reporting companies to quantify, benchmark, and disclose living wage performance, supporting investor engagement on worker welfare and demonstrating supply chain social risk management.

**How an analyst works this module:**
- Search or upload the entity list and map each company to its primary operating geographies and workforce composition
- Select the living wage benchmark source (Anker, WageIndicator, or national statutory minimum as floor)
- Review the living wage gap table by country, occupation group, and worker category
- Model wage uplift scenarios to quantify cost impact on EBITDA margin and assess affordability
- Export CSRD ESRS S1 disclosure data tables covering median wage, pay ratio, and living wage gap metrics

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `COS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `names` | `['Walmart','Amazon','Nike','H&M','Nestle','Unilever','Starbucks','McDonalds','Coca-Cola','PepsiCo','Costco','Target','Adidas','Inditex','LVMH','P&G','J&J','Tyson Foods','JBS','Cargill','Gap Inc','VF Corp','Levi Strauss',` |
| `workforce` | `Math.round(sr(i*7)*500+20);const lwGap=Math.round(sr(i*11)*40);const regions=Math.round(sr(i*13)*30+5);const supplyWorkers=Math.round(sr(i*17)*200+10);` |
| `regBench` | `Array.from({length:6},(_,r)=>{const rn=['South Asia','Southeast Asia','Sub-Saharan Africa','Latin America','Eastern Europe','East Asia'][r];return{region:rn,lwBench:Math.round(sr(i*100+r*7)*400+200),actualPay:Math.round(` |
| `yearly` | `Array.from({length:5},(_,y)=>({year:2020+y,gap:Math.round(lwGap+5-y*2+sr(i*100+y)*4),coverage:Math.round(50+y*5+sr(i*100+y*3)*8),spend:+(sr(i*100+y*7)*2+0.5).toFixed(1)}));` |
| `filtered` | `useMemo(()=>{let d=[...COS];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));if(sectorF!=='All')d=d.filter(r=>r.sector===sectorF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,sectorF,sortCol,sortDir]); const paged=useMemo(()=>filtered.slice((page-1)` |
| `stats` | `useMemo(()=>({count:filtered.length,avgGap:Math.round(filtered.reduce((s,r)=>s+r.livingWageGap,0)/filtered.length\|\|0),avgCoverage:Math.round(filtered.reduce((s,r)=>s+r.lwCoverage,0)/filtered.length\|\|0),totalWorkers:fmt(f` |
| `sectorGap` | `useMemo(()=>{const m={};COS.forEach(c=>{if(!m[c.sector])m[c.sector]={s:c.sector,gap:0,cov:0,n:0};m[c.sector].gap+=c.livingWageGap;m[c.sector].cov+=c.lwCoverage;m[c.sector].n++;});return Object.values(m).map(s=>({sector:s` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Living Wage Gap (%) | — | Anker Research Institute benchmarks | Percentage shortfall of actual wages below living wage reference for the assessed geography and occupation |
| Workers Below Living Wage (%) | — | WageIndicator Foundation / ILO | Share of workforce in the analysis scope earning below the applicable living wage benchmark |
| Wage Uplift Cost (% of revenue) | — | Company financial data + headcount model | Estimated incremental labour cost to close the living wage gap as a proportion of issuer revenue |
| Fair Wage Score | — | Fair Wage Network 12-dimension assessment | Composite score across living wage, pay equity, social dialogue, and wage management dimensions |
- **Company HR and wage data / CDP supply chain survey** → Extract median wage by country and occupation; validate against minimum wage floors → **Actual wage data per geography and occupation group**
- **Anker / WageIndicator living wage benchmarks** → Match to entity operating geography and urban/rural classification; apply year adjustment → **Living wage reference value per country-occupation cell**
- **Headcount by country from company reporting** → Combine with LWG to compute total cost of gap closure; express as % of revenue → **Wage uplift cost model and EBITDA impact estimate**

## 5 · Intermediate Transformation Logic
**Methodology:** Living Wage Gap
**Headline formula:** `LWGᵢ = max(0, LivingWageᵢ − ActualWageᵢ) / LivingWageᵢ`

The Living Wage Gap is computed per country-occupation cell as the shortfall of actual or reported median wage below the reference living wage, normalised to the reference. Cost of closure is estimated as LWG × affected headcount × benchmark wage, expressed as percentage of revenue to assess affordability and flagging risk of wage suppression in supply chains.

**Standards:** ['Anker Research Institute Living Wage Benchmarks 2023', 'WageIndicator Foundation Global Wage Database', 'Fair Wage Network Assessment Framework', 'CSRD ESRS S1 Employee Matters Standard 2023']
**Reference documents:** Anker Research Institute Living Wage Reference Values by Country 2023; WageIndicator Foundation Global Wage Database; Fair Wage Network Assessment Framework and Score Methodology; CSRD ESRS S1 â€” Own Workforce Standard 2023; ILO World Employment and Social Outlook 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's formula `LWGᵢ = max(0, LivingWageᵢ − ActualWageᵢ) /
> LivingWageᵢ` implies the gap is derived from a paired living-wage/actual-wage comparison. **The code
> never computes this ratio.** Every gap figure — the top-level `livingWageGap` per company and the
> per-region `gap` inside `regBench` — is an **independent seeded-random draw**, not a function of the
> `lwBench`/`actualPay` values that sit right next to it in the same data object. Sections below
> document the code as it actually behaves.

### 7.1 What the module computes

50 real, named consumer/apparel/agriculture/hospitality/technology companies (Walmart, Amazon, Nike,
H&M, Nestlé, Unilever, Tyson Foods, Fast Retailing, LVMH, etc.) each receive a fully synthetic wage
profile generated once at module load:

```js
workforceK        = round(sr(i*7)*500+20)              // 20-520K employees
livingWageGap     = round(sr(i*11)*40)                  // 0-40%  ← NOT derived from any wage pair
lwCoverage        = round(100 - livingWageGap)           // definitional complement, only real relation
regionsOp         = round(sr(i*13)*30+5)
supplyWorkersK    = round(sr(i*17)*200+10)
annualWageCostM   = round(sr(i*19)*500+50)
lwIncreaseCostM   = round(sr(i*23)*100+5)                // cost to close the gap — independent draw, not gap × headcount × wage delta
commitYear        = sr(i*29)<0.3 ? 2025 : sr(i*29)<0.6 ? 2027 : 2030
progress          = sr(i*31)<0.3 ? 'On Track' : sr(i*31)<0.6 ? 'Behind' : 'At Risk'
methodology       = ['Anker','WageIndicator','MIT Living Wage','Global Living Wage'][floor(sr(i*37)*4)]
verification      = sr(i*41)>0.4 ? 'Third-party' : 'Self-assessed'
genderPayGap      = round(sr(i*43)*20)
supplyChainAudit  = sr(i*47)>0.3 ? 'Yes' : 'No'
transparencyScore = round(sr(i*49)*40+50)
```
Each company additionally carries a 6-region benchmark array (`regBench`) and a 5-year trend array
(`yearly`), both independently seeded per company/region/year combination.

### 7.2 Parameterisation

| Field | Provenance |
|---|---|
| Company names, sector assignments (50 companies) | Real, correctly-classified major consumer/apparel/food/hospitality companies |
| All 13 quantitative attributes per company | Synthetic demo values, `sr()`-seeded per company index; **no relationship to any real company's actual reported wage data or living-wage assessment** |
| `regBench` (6 regions × 3 fields per company) | `lwBench`, `actualPay`, `gap` are 3 **independently** seeded draws — `gap` is not `(lwBench−actualPay)/lwBench` as the guide's formula and column adjacency would suggest |
| `yearly` (5-year trend per company) | `gap = round(lwGap+5−year_offset×2+noise)` — a mild downward drift plus noise; `coverage` and `spend` are separately seeded, not derived from `gap` |
| `methodology` label (Anker/WageIndicator/MIT/GLWC) | Real named living-wage methodologies, randomly assigned per company — i.e. which real methodology a company is displayed as "using" is arbitrary, not evidenced |

### 7.3 Calculation walkthrough

- **Dashboard KPIs**: `avgGap = mean(livingWageGap)`, `avgCoverage = mean(lwCoverage)`,
  `totalWorkers = Σ workforceK × 1000`, `onTrack = count(progress==='On Track')`,
  `totalCost = Σ lwIncreaseCostM`, `verified = count(verification==='Third-party')` — straightforward
  aggregation over the 50-company synthetic panel, correctly implemented arithmetic on synthetic
  inputs.
- **Sector Gap chart**: `sectorGap = groupBy(sector) → mean(livingWageGap), mean(lwCoverage)` across
  the 6 sector categories.
- **Gap vs Cost to Close scatter**: plots `livingWageGap` (x) against `lwIncreaseCostM` (y) per
  company — since both are independent random draws, any visual correlation the user perceives is
  coincidental, not a modelled relationship (a real "cost to close" figure should scale with
  headcount × wage gap × currency, none of which this scatter's y-axis is derived from).
- **Transparency Score vs Gap scatter**: same structure — `transparencyScore` and `livingWageGap` are
  independently seeded, so no real correlation exists in the underlying data despite the chart
  inviting visual correlation-spotting.
- **Commitment Timeline**: counts companies by `commitYear` bucket (2025/2027/2030) — correct
  aggregation of the synthetic assignment.

### 7.4 Worked example

Nike (`i=2`, sector Apparel): `livingWageGap = round(sr(2×11)×40) = round(sr(22)×40)`.
`sr(22) = frac(sin(23)×10000)`; `sin(23 rad) ≈ -0.8462` → `frac(-8462.4) = 0.5876` (JS's `%`-free
`frac` via `x - Math.floor(x)` correctly handles negative `x`, giving a value in `[0,1)`) →
`livingWageGap = round(0.5876×40) = 24%`. Independently, `lwIncreaseCostM = round(sr(2×23)×100+5) =
round(sr(46)×100+5)`; `sr(46) = frac(sin(47)×10000)`, `sin(47)≈0.1236` → `frac(1236.5)=0.4999` →
`lwIncreaseCostM ≈ round(0.4999×100+5) = 55`. These two figures — "24% gap" and "$55M to close it" —
are displayed side-by-side in the table as though causally linked, but are mathematically
independent draws.

### 7.5 Data provenance & limitations

- **Every quantitative figure for all 50 real companies is fabricated** via the seeded PRNG
  `sr(seed)=frac(sin(seed+1)×10⁴)` — a user could reasonably (but incorrectly) read this page as
  real disclosed wage-gap data for Walmart, Nike, Nestlé, etc.
- The `methodology` field randomly labels each company as using Anker/WageIndicator/MIT/GLWC
  methodology with no evidentiary basis — this could misrepresent which real methodology (if any) a
  given company has actually adopted.
- `lwIncreaseCostM` (cost to close the gap) is not derived from `workforceK × livingWageGap ×
  annualWageCostM` or any comparable formula — it is an unrelated random draw, so it cannot be relied
  upon even directionally.
- Regional benchmark `gap` values are inconsistent with their own `lwBench`/`actualPay` fields in the
  same row (§7.1), a data-integrity issue a careful reviewer would catch by cross-checking the numbers.

**Framework alignment:** Anker Research Institute, WageIndicator Foundation, MIT Living Wage
Calculator, and Global Living Wage Coalition are all real, correctly-named living-wage methodologies
— naming them is accurate, but no company in this dataset is actually assessed under any of them.
CSRD ESRS S1 (own workforce) is referenced in the guide as the disclosure standard this module should
feed, but no ESRS-conformant data model (median wage, pay ratio) is implemented.

## 9 · Future Evolution

### 9.1 Evolution A — Derive the gap from its own adjacent data, then source it (analytics ladder: rung 1 → 2)

**What.** §7 documents an internal-consistency defect sharper than most: each company's `regBench` rows contain `lwBench`, `actualPay` and `gap` side by side, yet all three are **independently seeded draws** — the gap is not `(lwBench − actualPay)/lwBench` even though the guide's formula and the column adjacency say it should be; likewise `lwIncreaseCostM` is a draw, not `gap × headcount × wage delta`. Fifty real companies (Walmart, Nike, Nestlé) carry these fabricated profiles, with real methodology names (Anker, WageIndicator, MIT) randomly assigned as if evidenced. Evolution A in two steps: (1) *make the arithmetic honest* — gap and closure cost derived from the paired fields per the §5 formulas, an internal fix requiring no new data; (2) *make the data real* — benchmark values from the shared living-wage refdata layer (coordinate with the sibling `living-wage` module and the platform's `ref/living-wage-benchmarks` route), actual-pay and commitment data from published sources (companies with public living-wage commitments and accreditations are documented by IDH, the Living Wage Foundation and ShareAction's workforce disclosure initiative), honest nulls elsewhere.

**How.** (1) The derivation fix plus a consistency unit test (gap ≡ f(bench, pay)). (2) A curated commitment register (company × commitment year × methodology × verification status) with citations — the current random `commitYear`/`verification` fields become evidenced facts. (3) The uplift-cost model per §5 (`LWG × headcount × benchmark`) expressed as % of revenue using real financials from the company master. (4) Real-names-with-fabricated-scores purged per platform convention.

**Prerequisites.** The seeded profile generation deleted; commitment-register curation (~50 companies is tractable); shared benchmark layer. **Acceptance:** gap recomputes when bench/pay change; every methodology/verification label carries a citation; companies without wage data show coverage gaps, not draws.

### 9.2 Evolution B — CSRD S1 wage-disclosure copilot (LLM tier 2)

**What.** The module's stated outputs — CSRD ESRS S1 tables (median wage, pay ratio, living-wage gap) and social-bond impact reporting — are disclosure documents over the Evolution A data: "assemble the ESRS S1 adequate-wages data table for this issuer, flagging estimated vs reported values", "model the EBITDA impact of closing the gap for the apparel holdings", "which portfolio companies have third-party-verified living-wage commitments, and which self-assess?" The commitment register makes the verification distinction — the module's most decision-relevant field — answerable with citations.

**How.** Tier 2 over the gap/uplift routes and commitment register; ESRS S1 table generation validates every figure against tool output with estimation status disclosed per datapoint (ESRS explicitly permits estimates if disclosed as such — the copilot enforces the disclosure). Uplift affordability answers show the arithmetic chain (gap × headcount × benchmark ÷ revenue). Sector comparisons cite the computed sector aggregates, not priors; engagement-oriented questions route to the sibling `living-wage` module's stewardship copilot to avoid duplicating that surface — the two modules' division (tracker = benchmarking/disclosure; living-wage = portfolio engagement) is stated.

**Prerequisites (hard).** Evolution A (an S1 disclosure table from independent random draws would be fabricated regulatory data on named issuers); Phase 2 tooling. **Acceptance:** disclosure tables carry per-datapoint estimation flags; every commitment claim cites the register; affordability chains reproduce from logged tool calls.