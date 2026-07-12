# Community Impact Analytics
**Module ID:** `community-impact` · **Route:** `/community-impact` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Measures social value creation from corporate community investment programmes using the S1000+ framework, Social Return on Investment methodology, and UN SDG contribution mapping. Quantifies community investment ROI in monetary social value terms and benchmarks performance against industry peers.

> **Business value:** Enables ESG and community affairs teams to demonstrate the quantified social value of community programmes, meet growing investor expectations for social impact reporting, and contribute to GRI 413 community engagement disclosures and UN SDG bond frameworks.

**How an analyst works this module:**
- Define programme scope and select S1000+ impact domains from the configuration panel
- Enter investment inputs, beneficiary counts, and outcome indicators on the Input tab
- Review SROI waterfall chart showing gross to net social value adjustments
- SDG Mapping tab links each outcome to contributing Sustainable Development Goals
- Benchmarking tab compares your SROI ratio against sector peers and LBG database
- Export impact report formatted for GRI 201/203/413 and UN SDG Bond disclosure

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `KPI`, `PAGE_SIZE`, `PIECLRS`, `PROJECTS`, `REGIONS`, `STATUSES`, `TABS`, `TREND`, `TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(1):v:v;` |
| `REGIONS` | `['All','Sub-Saharan Africa','Southeast Asia','Latin America','South Asia','Central Asia','Pacific Islands','Middle East','Eastern Europe'];` |
| `regs` | `['Sub-Saharan Africa','Southeast Asia','Latin America','South Asia','Latin America','Pacific Islands','Central Asia','Latin America','Sub-Saharan Africa','Sub-Saharan Africa','Latin America','Latin America','Sub-Saharan ` |
| `TREND` | `Array.from({length:24},(_,i)=>({month:`${2023+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,grievances:Math.round(40+sr(i*7)*60),resolved:Math.round(25+sr(i*11)*50),avgFpic:Math.round(35+i*0.8+sr(i*13)*8),invest` |
| `csvExport` | `(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.crea` |
| `filtered` | `useMemo(()=>{let d=[...PROJECTS];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));if(typeF!=='All')d=d.filter(r=>r.type===typeF);if(regF!=='All')d=d.filter(r=>r.region===regF);if(statF!=='All')d=d.filter(r=>r.status===statF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1)` |
| `kpis` | `useMemo(()=>{const avg=(k)=>Math.round(PROJECTS.reduce((s,c)=>s+c[k],0)/PROJECTS.length);const totalInv=PROJECTS.reduce((s,c)=>s+c.investmentM,0);const totalGriev=PROJECTS.reduce((s,c)=>s+c.grievances,0);return{avgFpic:a` |
| `typeDist` | `useMemo(()=>{const m={};PROJECTS.forEach(c=>{m[c.type]=(m[c.type]\|\|0)+1;});return Object.entries(m).map(([name,value])=>({name,value}));},[]);` |
| `regionChart` | `useMemo(()=>{const m={};PROJECTS.forEach(c=>{if(!m[c.region])m[c.region]={region:c.region,avgFpic:0,avgBen:0,n:0};m[c.region].avgFpic+=c.fpicScore;m[c.region].avgBen+=c.benefitSharing;m[c.region].n++;});return Object.val` |
| `radarData` | `useMemo(()=>{const dims=['fpicScore','benefitSharing','grievanceMech','stakeholderEng','livelihoodRestore','culturalHeritage'];const avg=(k)=>Math.round(PROJECTS.reduce((s,c)=>s+c[k],0)/PROJECTS.length);return dims.map(d` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PIECLRS`, `REGIONS`, `STATUSES`, `TABS`, `TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| SROI Ratio | — | SROI Network | Social value generated per unit of monetary investment; >3× is considered high-performing |
| Total Social Value | — | HACT Social Value Bank | Monetised present value of all community outcomes attributed to the investment programme |
| SDG Coverage | — | UN SDG Impact Standards | Number of Sustainable Development Goals materially contributed to by the programme |
| Community Investment Rate | — | BITC / LBG Model | Community investment as a percentage of pre-tax profit or revenue, per LBG benchmarks |
| Attribution Adjusted Value | — | SROI Methodology | Net social value after deadweight, attribution, displacement, and drop-off adjustments |
- **Programme spend and activity records** → Map to S1000+ input categories, compute per-beneficiary cost → **Investment input by domain**
- **Beneficiary outcome surveys** → Apply HACT financial proxies, compute gross social value → **Gross social value per outcome**
- **Deadweight/attribution benchmarks** → Apply SROI adjustments to gross value → **Net present social value and SROI ratio**

## 5 · Intermediate Transformation Logic
**Methodology:** Social Return on Investment (SROI)
**Headline formula:** `SROI = Total Social Value (£) / Total Investment (£)`

Social value is monetised by mapping outcomes to financial proxies (HACT Social Value Bank, New Economy Manchester). Deadweight (what would have happened anyway), attribution (share of credit), displacement (negative side-effects), and drop-off (outcome decay) adjustments reduce gross social value to net present social value. SROI ratios above 3:1 are considered high-performing for infrastructure programmes.

**Standards:** ['S1000+ Standard', 'SROI Network Guide', 'UN SDG Impact Standards']
**Reference documents:** S1000+ Social Value Standard; A Guide to Social Return on Investment (SROI Network, 2012); UN SDG Impact Standards for Enterprises; LBG Corporate Community Investment Benchmark; HACT Social Value Bank 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a **Social Return on Investment
> (SROI)** engine: monetise community outcomes via HACT financial proxies, apply deadweight /
> attribution / displacement / drop-off adjustments, and report `SROI = Total Social Value (£) / Total
> Investment (£)` with a gross→net waterfall. **None of that monetisation logic exists in the code.**
> The page (titled *Community Impact Assessment* in the UI, not "Analytics") is a **FPIC / grievance /
> benefit-sharing scorecard** over 60 synthetic extractive-sector projects. There is no £ social value,
> no SROI ratio, no deadweight/attribution adjustment, no SDG mapping tab. The sections below document
> the scorecard; §8 specifies the SROI model the guide advertises.

### 7.1 What the module computes

For 60 seeded projects (mostly mining, with energy/infrastructure/water/industrial), each carrying ~20
social indicators scored 0–100, the page produces portfolio averages, per-region/type roll-ups, a
grievance-resolution rate, and a benefit-sharing view. The only derived ratio is grievance resolution:

```js
resolutionRate = grievances > 0 ? round(resolved / grievances × 100) : 0
avgFpic        = round( mean(fpicScore) )         // over all 60 PROJECTS
avgCommunity   = round( mean(communityScore) )
totalInv       = Σ investmentM                     // $M summed
totalGriev     = Σ grievances
```

Everything else is `mean(indicator)` or `Σ(indicator)` bucketed by region / project type.

### 7.2 Parameterisation / scoring rubric

| Indicator | Formula | Range | Provenance |
|---|---|---|---|
| `fpicScore` | `round(10 + sr(i·7)·85)` | 10–95 | Synthetic seeded PRNG |
| `benefitSharing` | `round(5 + sr(i·11)·90)` | 5–95 | Synthetic seeded PRNG |
| `grievanceMech`, `communityScore`, `stakeholderEng`, `livelihoodRestore`, `culturalHeritage`, `waterAccess` | `round(base + sr(i·k)·span)` | ~10–95 | Synthetic seeded PRNG |
| `investmentM` | `round(1 + sr(i·53)·99)` | $1–100M | Synthetic seeded PRNG |
| `grievances` / `resolved` | `round(sr·120)` / `round(sr·100)` | 0–120 / 0–100 | Synthetic seeded PRNG |
| `status` | `sr(i·71)` thresholds 0.35/0.55/0.75/0.9 | Active…Suspended | Synthetic seeded PRNG |

Score badges use fixed thresholds `[25, 50, 70]` (red<25, amber, gold, green≥70). Resolution-rate badge
uses `[25, 50, 75]`. These bands are **hard-coded display conventions**, not calibrated to any standard.

### 7.3 Calculation walkthrough

1. `PROJECTS` is built once from three parallel arrays (names, types, regions) with all metrics seeded.
2. Dashboard KPIs (`kpis`) average or sum across **all 60 projects** (not the filtered set).
3. `regionChart` groups by region and averages FPIC + benefit-sharing; `typeDist` counts by type;
   `radarData` averages six SOC dimensions across all projects.
4. The Project Screening tab filters/sorts/paginates and renders an expandable per-project drill-down;
   the Grievance and Benefit tabs sort the full list and show the top-N by grievances / benefit score.

### 7.4 Worked example

Project `i = 0` (Tarkwa Gold Mine): `sr(0·11)=sr(0)=frac(sin(1)·10⁴)`. `sin(1)=0.8415`, ×10⁴=8414.7,
frac≈0.71 ⇒ `benefitSharing = round(5 + 0.71·90) = round(68.9) = 69` (gold band, since 50≤69<70). If its
seeded `grievances = 84` and `resolved = 61`, the resolution rate is `round(61/84·100) = 73%` (gold band,
since 50≤73<75). No monetary social value is attached — the "$" figures on screen are raw `investmentM`
sums, not SROI outputs.

### 7.5 Companion analytics on the page

Four tabs: **Dashboard** (KPIs, region bars, type pie, grievance/investment trend, impact radar),
**Project Screening** (searchable sortable table + per-project radar/bar drill-down), **Grievance
Tracker** (filed-vs-resolved trend, top-12 bars, resolution table), **Benefit Sharing** (benefit vs
investment bars, FPIC/investment trend). CSV export on each. A 24-month `TREND` series is fully seeded
(`grievances = round(40 + sr·60)` etc.) — it is not derived from the project data. No backend engine or
route exists.

### 7.6 Data provenance & limitations

- **All 60 projects and the 24-month trend are synthetic**, from the PRNG `sr(seed)=frac(sin(seed+1)×10⁴)`.
  Project names are real companies/sites but their scores are seeded, not sourced.
- No monetisation, no financial proxies, no deadweight/attribution/displacement/drop-off adjustment, no
  SDG mapping, no benchmarking database — all four are promised in the guide but absent.
- KPIs aggregate the *whole* universe, ignoring the active filters (a UX inconsistency).

**Framework alignment (as claimed vs delivered):** *SROI Network Guide (2012)* — the core SROI ratio and
its adjustment chain are named but not computed. *HACT Social Value Bank / New Economy Manchester* —
these are the financial-proxy libraries SROI monetisation would draw on; unused here. *S1000+ Standard*
and *UN SDG Impact Standards* — referenced for domains/SDG mapping but no SDG tab exists. *LBG /
BITC community-investment benchmark* — no benchmarking implemented. The module does align *conceptually*
with **FPIC** (IFC Performance Standard 7 / UNDRIP free-prior-informed-consent) and **grievance-mechanism**
expectations (UNGP Principle 31 / IFC PS1) — those are the indicators it actually scores.

---

## 8 · Model Specification — Community-Investment SROI Engine

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Quantify, in monetary terms, the net social value created per unit of community investment, so ESG /
community-affairs teams can prioritise programmes and disclose under GRI 413 and UN SDG bond frameworks.
Coverage: corporate/site-level community investment programmes (health, education, livelihoods, water).

### 8.2 Conceptual approach
Implement the SROI Network's forecast/evaluative SROI methodology, benchmarking against the **HACT UK
Social Value Bank** proxy library and the **LBG/BITC** community-investment measurement framework. SROI
converts beneficiary outcomes to financial proxies, then nets them down for what would have happened
anyway (deadweight), the share attributable to the programme (attribution), negative side-effects
(displacement), and outcome decay (drop-off) — the same logic the UK Treasury Green Book uses for social
CBA.

### 8.3 Mathematical specification
```
GrossValue_o   = Beneficiaries_o × Proxy_o                         (per outcome o)
NetValue_o     = GrossValue_o × (1 − DW_o) × Attr_o × (1 − Disp_o)
PV_o(t)        = Σ_{t=1..T} NetValue_o × (1 − DropOff_o)^{t-1} / (1+r)^t
TotalSocial    = Σ_o Σ_t PV_o(t)
SROI           = TotalSocial / TotalInvestment
```
| Parameter | Symbol | Calibration source |
|---|---|---|
| Outcome financial proxy | `Proxy_o` | HACT Social Value Bank; New Economy Manchester unit-cost database |
| Deadweight | `DW_o` | Comparison-group / benchmark data (0.2–0.5 typical) |
| Attribution | `Attr_o` | Stakeholder survey (0.4–0.75 of gross) |
| Displacement | `Disp_o` | Programme-specific (often ~0) |
| Drop-off | `DropOff_o` | 0.1–0.4/yr per outcome durability |
| Social discount rate | `r` | 3.5% (UK Green Book) |
| Horizon | `T` | Outcome benefit period (1–5 yr) |

### 8.4 Data requirements
Programme spend by domain, beneficiary counts, outcome indicators (survey-based), and comparison-group /
benchmark data for deadweight. Proxies from HACT; SDG mapping from UN SDG Impact Standards indicator set.
The platform already holds the raw indicator fields (`investmentM`, `employment`, `educationSupport`,
`healthImpact`) that would seed activity data; monetisation proxies and adjustment factors are new.

### 8.5 Validation & benchmarking plan
Reconcile computed SROI ratios against published sector ranges (2.5×–5.8×; >3× high-performing);
sensitivity-test on deadweight/attribution (the dominant swing factors); audit proxy selection against
HACT guidance. Benchmark portfolio-level community-investment intensity against LBG database percentiles.

### 8.6 Limitations & model risk
SROI is highly sensitive to proxy choice and subjective adjustment factors — report a proxy/adjustment
audit trail and a low/central/high range, never a single point. Attribution from self-report surveys is
optimism-biased; prefer comparison-group deadweight where available. Conservative fallback: report
attribution-only net value (drop deadweight benefit) as the floor SROI.

## 9 · Future Evolution

### 9.1 Evolution A — Implement SROI monetisation; keep the FPIC scorecard it actually is (analytics ladder: rung 1 → 2)

**What.** §7's mismatch flag: the guide promises an SROI engine (HACT financial
proxies, deadweight/attribution/displacement/drop-off adjustments, gross→net
waterfall), but the page is an FPIC/grievance/benefit-sharing scorecard over 60
`sr()`-seeded extractive projects — real company/site names carrying fabricated
scores, with a fully seeded 24-month trend and KPIs that ignore the active filters
(§7.6). Evolution A does two honest things: build the §8-specified SROI calculator as
a new tab, and de-fabricate the scorecard rather than pretending it's the SROI tool.

**How.** (1) SROI engine: programme-level inputs (investment £, beneficiary counts,
outcome indicators) → outcome monetisation via a curated HACT Social Value Bank proxy
table (public values, versioned in refdata) → the four adjustments as explicit
percentage inputs with SROI-Guide default ranges → net social value discounted at a
social discount rate → `SROI = value/investment` with the gross→net waterfall chart
the guide describes. (2) Scorecard cleanup: replace the 60 seeded projects with
user-entered or case-study data; fix the KPI aggregation to respect filters; derive
the trend series from project records instead of `sr()`. (3) The genuinely-aligned
FPIC/grievance indicators (IFC PS7/PS1, UNGP 31) stay — they're the module's real
identity — now scored from entered evidence.

**Prerequisites (hard).** PRNG purge (60 projects + trend); the real-names/seeded-
scores combination must not survive — either anonymize or source. HACT proxy
licensing check (the free subset is publishable; the full bank isn't).
**Acceptance:** a hand-computed SROI case reproduces through the waterfall
(gross → deadweight → attribution → displacement → drop-off → net); KPIs change when
filters change; zero PRNG calls feed displayed metrics.

### 9.2 Evolution B — Impact-report drafter for GRI 413 disclosures (LLM tier 1)

**What.** The overview promises exports "formatted for GRI 201/203/413 and UN SDG
Bond disclosure" — a structured-drafting task. Evolution B generates the community
impact disclosure from a completed (post-Evolution A) SROI case plus the FPIC/
grievance records: GRI 413-1 (engagement/impact-assessment programmes, with the FPIC
and grievance-mechanism scores as evidence), GRI 203 (indirect economic impacts, with
the monetised outcome values), and an SDG-mapped outcomes table — each figure cited to
the module's computed waterfall or an entered record.

**How.** Tier-1 RAG: corpus is this Atlas record, the GRI 413/203/201 requirement
text (refdata catalog — GRI standards are already in the platform's reference layer),
and the SROI Guide's reporting principles. Structured case data passes as context;
the drafter marks unmet disclosure requirements explicitly rather than padding.
No endpoints exist today; tier 2 tool-calling arrives with Evolution A's backend if
the SROI calc is served rather than computed in-page.

**Prerequisites (hard).** Evolution A — GRI disclosures quoting seeded FPIC scores
attached to real mining companies would be a legal/reputational hazard; GRI text in
the corpus. **Acceptance:** every number in a draft disclosure traces to the SROI
waterfall or an entered record; each GRI disclosure number (413-1, 203-2) maps to a
section; missing evidence produces a stated gap, not filler prose.