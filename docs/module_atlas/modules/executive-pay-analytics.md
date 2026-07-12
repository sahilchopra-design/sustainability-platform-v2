# Executive Pay Analytics
**Module ID:** `executive-pay-analytics` · **Route:** `/executive-pay-analytics` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Analyses the alignment between executive and CEO remuneration structures and ESG/climate performance KPIs, assessing the materiality, measurability, and rigour of sustainability metrics embedded in annual and long-term incentive plans. Supports active ownership voting decisions on remuneration resolutions, engagement with remuneration committees, and regulatory disclosure requirements under UK CA 2006, EU CSRD, and ISSB S2.

> **Business value:** Empowers stewardship teams and active ownership programmes to make evidence-based voting decisions on executive remuneration, engage remuneration committees with quantitative rigour, and drive genuine integration of climate and ESG targets into executive incentive design.

**How an analyst works this module:**
- Load remuneration report for target company and auto-extract ESG metric definitions and target structures.
- Score materiality, rigour, and transparency dimensions using the EPAS rubric; benchmark against sector peers.
- Review pay-ESG performance correlation chart to identify historical cases of target manipulation or low ambition.
- Generate voting recommendation for AGM remuneration resolution and export engagement letter template for remuneration committee.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `COLORS`, `COS`, `SECTORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `TABS` | `['Compensation Overview','Pay Ratio Analysis','ESG-Linked Comp','Peer Benchmarking'];` |
| `ceoPay` | `+(sr(i*7)*25+5).toFixed(1);const medianPay=Math.round(sr(i*11)*80+40);const payRatio=Math.round(ceoPay*1000/medianPay);const esgLinkedPct=Math.round(sr(i*13)*40);` |
| `yearly` | `Array.from({length:5},(_,y)=>({year:2020+y,ceoPay:+(ceoPay-2+y*0.8+sr(i*100+y)*2).toFixed(1),ratio:Math.round(payRatio-50+y*15+sr(i*100+y*3)*30),esgPct:Math.round(esgLinkedPct-5+y*3+sr(i*100+y*7)*5)}));` |
| `filtered` | `useMemo(()=>{let d=[...COS];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));if(sectorF!=='All')d=d.filter(r=>r.sector===sectorF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,sectorF,sortCol,sortDir]); const paged=useMemo(()=>filtered.slice((page-1)` |
| `stats` | `useMemo(()=>({count:filtered.length,avgCeo:'$'+(filtered.reduce((s,r)=>s+r.ceoPayM,0)/filtered.length\|\|0).toFixed(1)+'M',avgRatio:Math.round(filtered.reduce((s,r)=>s+r.payRatio,0)/filtered.length\|\|0),avgESG:Math.round(fi` |
| `sectorPay` | `useMemo(()=>{const m={};COS.forEach(c=>{if(!m[c.sector])m[c.sector]={s:c.sector,pay:0,ratio:0,esg:0,n:0};m[c.sector].pay+=c.ceoPayM;m[c.sector].ratio+=c.payRatio;m[c.sector].esg+=c.esgLinkedPct;m[c.sector].n++;});return ` |
| `exportCSV` | `useCallback((data,fn)=>{if(!data.length)return;const keys=Object.keys(data[0]).filter(k=>k!=='yearly');const csv=[keys.join(','),...data.map(r=>keys.map(k=>`"${r[k]}"`).join(','))].join('\n');const b=new Blob([csv],{type` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ESG Incentive Weight (% of variable pay) | — | Remuneration Report | Proportion of annual bonus and LTIP award tied to ESG/sustainability KPIs; below 10% considered low integration by ISS/Glass Lewis. |
| EPAS (0â€“100) | — | Platform Pay Model | Composite ESG pay alignment score; below 50 triggers vote against remuneration report recommendation for ESG-focused mandates. |
| Science-Based Target Linkage (Y/N) | — | SBTi / Remuneration Report | Binary indicator of whether executive decarbonisation KPIs are explicitly tied to SBTi-validated corporate targets. |
| Pay-ESG Performance Correlation (r) | — | Statistical Analysis | Historical correlation between CEO ESG-linked pay outcomes and actual ESG KPI improvements; low correlation signals metric manipulation risk. |
- **Remuneration reports (Annual Report proxy filings)** → NLP extraction of ESG metric names, target definitions, weightings, and actual outcomes; classify by pillar → **Structured ESG pay metric inventory with weight, target, outcome, and verification flag**
- **SBTi target registry and CDP climate data** → Match executive climate KPIs to validated SBTi targets; score alignment gap → **Science-based target linkage status per executive climate metric**
- **Historical CEO pay outcomes vs. ESG KPI actuals** → Compute rolling 5-year pay-ESG performance correlation; detect target ratcheting → **Pay-ESG correlation coefficient and target stretch assessment**

## 5 · Intermediate Transformation Logic
**Methodology:** ESG Pay Alignment Score
**Headline formula:** `EPAS = w_m × Materiality + w_r × Rigour + w_t × Transparency + w_i × Incentive_Weight`

Composite score assessing quality of ESG integration in executive pay. Materiality checks whether ESG metrics are aligned to company TCFD material risks. Rigour evaluates whether targets have independent verification, science-based calibration, and stretch ambition vs. BAU trajectory. Transparency scores disclosure of metric definitions, targets, and outcomes. Incentive weight measures ESG as % of total variable pay.

**Standards:** ['UK Corporate Governance Code 2024', 'EU CSRD Article 29c', 'UNPRI Active Ownership 2.0']
**Reference documents:** UK Corporate Governance Code 2024 â€” Provision 40; EU CSRD Article 29c â€” Sustainability Due Diligence in Remuneration; PRI Active Ownership 2.0 â€” Executive Pay Module 2023; UNPRI CEO Pay and Sustainability Report 2023; ISS Executive Compensation Policy 2024

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes an **ESG Pay Alignment Score**
> `EPAS = w_m·Materiality + w_r·Rigour + w_t·Transparency + w_i·Incentive_Weight`, plus a pay-ESG
> performance correlation and SBTi-linkage flag. **None of these scores exist in the code.** The module
> is a **seeded comparison table** of 80 real company names with entirely synthetic compensation figures
> (CEO pay, pay ratio, ESG-linked %, TSR, clawback flags). The only real computation is the CEO:median
> pay ratio arithmetic on the synthetic inputs. Documented below.

### 7.1 What the module computes

`COS` fabricates 80 issuers; the pay economics are seeded:

```js
ceoPay       = sr(i·7)·25 + 5           // $5–30M
medianPay    = round(sr(i·11)·80 + 40)  // $40–120K
payRatio     = round(ceoPay·1000 / medianPay)   // real arithmetic on synthetic inputs
esgLinkedPct = round(sr(i·13)·40)       // 0–40% of variable pay
sti = ceoPay·0.3 + sr()·3 ;  lti = ceoPay·0.5 + sr()·5 ;  base = ceoPay·0.15
tsr1y = (sr(i·51) − 0.3)·40 ;  tsr3y = (sr(i·53) − 0.25)·60
yearly[y] = { ceoPay − 2 + y·0.8 + jitter, ratio, esgPct }   // 5-year trend, seeded slope
```

Aggregates (`stats`): mean CEO pay, mean pay ratio, mean ESG-linked %, mean say-on-pay, clawback count,
max pay — all over the seeded set. `sectorPay` averages by sector.

### 7.2 Parameterisation & provenance

| Element | Value | Provenance |
|---|---|---|
| Company names | 80 real large-caps (Apple, JPMorgan, Shell, Nestlé, TSMC…) | **Real names** |
| Sector map | per-company GICS-style sector | Real classification |
| `ceoPay`, `medianPay`, `esgLinkedPct`, `tsr`, `sti/lti/base`, `clawback`, `holdingReq`, `severance`, `pension`, `sayOnPay` | seeded | **All synthetic** `sr()` |
| `payRatio` | `ceoPay·1000/medianPay` | Real CEO-pay-ratio formula (Dodd-Frank §953(b) style) on synthetic pay |
| ESG-linked band | 0–40% | Consistent with real market range (guide notes <10% = low integration) |

No real remuneration-report data is ingested; the names are decorative labels on random pay.

### 7.3 Calculation walkthrough

1. `COS` generates 80 issuers with seeded compensation and a 5-year seeded trend.
2. `filtered` applies search + sector filter + sort; `paged` slices 12 per page.
3. `stats` averages the headline metrics; `sectorPay` averages by sector.
4. Detail panel shows pay structure (base/STI/LTI/pension pie) and the 5-year pay-vs-ratio line.
5. `CEO Pay vs TSR` scatter plots the (synthetic) pay-performance relationship.

### 7.4 Worked example (company i = 7 → "JPMorgan")

| Step | Computation | Result |
|---|---|---|
| ceoPay | sr(49)·25 + 5 | ≈ 0.58·25+5 = $19.4M |
| medianPay | round(sr(77)·80 + 40) | ≈ $95K |
| payRatio | round(19.4·1000/95) | **204:1** |
| esgLinkedPct | round(sr(91)·40) | ≈ 22% |

A 204:1 pay ratio with 22% ESG-linked pay — plausible-looking, but the underlying $19.4M and $95K are
random, so the ratio conveys no information about the actual company. The ratio *formula* is correct;
the *inputs* are fabricated.

### 7.5 Data provenance & limitations

- **All compensation data is synthetic** (`sr(s)=frac(sin(s+1)·10⁴)`); only the issuer names are real.
- **No EPAS composite**: materiality, rigour, transparency, and incentive-weight sub-scores from the
  guide have no code. There is no assessment of ESG-metric quality.
- **No pay-ESG correlation or SBTi linkage**: the guide's manipulation-detection analytics are absent.
- The `payRatio` and averaging arithmetic are genuine, but operate on random pay.

**Framework alignment:** The pay-ratio concept follows **Dodd-Frank §953(b)** CEO-pay-ratio disclosure;
ESG-linked-pay framing references the guide's **UK Corporate Governance Code (Provision 40)**, **EU CSRD
Article 29c**, **ISS/Glass Lewis** voting thresholds (<10% ESG weight = low integration), and **PRI
Active Ownership 2.0**. The intended-but-absent artefact is the four-factor EPAS quality score.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The guide's EPAS, pay-ESG correlation, and SBTi
linkage are absent; all pay data is seeded. Below is the production ESG-pay-quality model.

**8.1 Purpose & scope.** Score the *quality* of ESG integration in executive remuneration to drive
say-on-pay voting and remuneration-committee engagement, from real remuneration-report data.

**8.2 Conceptual approach.** A rubric-based quality score mirroring **ISS/Glass Lewis** compensation
analysis and **PRI Active Ownership 2.0** — assessing whether ESG pay metrics are material, rigorously
targeted, transparent, and materially weighted, not merely present.

**8.3 Mathematical specification.**

```
Per company:
  Materiality   = fraction of ESG pay metrics mapped to TCFD/ESRS material topics
  Rigour        = weighted flags {SBTi-linked, independently verified, stretch vs BAU}  (0–1)
  Transparency  = disclosure completeness {metric defined, target disclosed, outcome disclosed}
  IncentiveWt   = ESG % of total variable pay / benchmark (e.g. /20%)
  EPAS = w_m·Materiality + w_r·Rigour + w_t·Transparency + w_i·min(IncentiveWt,1)   ×100
Pay-ESG correlation ρ = corr(ESG-linked payout %, realised ESG KPI improvement) over 5y
Vote flag: EPAS < 50 → against (for ESG-mandated portfolios)
```

| Parameter | Source |
|---|---|
| Material-topic map | TCFD / ESRS materiality per issuer |
| SBTi linkage | SBTi target registry |
| ESG pay weight, targets, outcomes | Remuneration reports (NLP extraction) |
| Weights w | Stewardship policy, documented |

**8.4 Data requirements.** Remuneration reports (metric names, weights, targets, outcomes); SBTi registry;
CDP climate data; historical pay outcomes vs ESG KPI actuals. Platform holds `GLOBAL_COMPANY_MASTER`;
needs a remuneration-report parser.

**8.5 Validation & benchmarking plan.** Reconcile ESG-pay weights against issuers' published proxy
statements; compare EPAS ranking against ISS/Glass Lewis assessments; backtest that low pay-ESG
correlation flags precede target-ratcheting cases.

**8.6 Limitations & model risk.** NLP extraction of pay metrics is error-prone — require human review of
low-confidence extractions. Rigour flags are judgemental. Conservative fallback: unverified ESG targets
score 0 on the Rigour dimension rather than assumed credible.

## 9 · Future Evolution

### 9.1 Evolution A — Build the EPAS rubric on disclosed remuneration data (analytics ladder: rung 1 → 2)

**What.** The §7 flag: the guide's `EPAS = w_m·Materiality + w_r·Rigour + w_t·Transparency + w_i·Incentive_Weight`, the pay-ESG performance correlation, and the SBTi-linkage flag "do not exist in the code" — the page seeds 80 real company names with synthetic CEO pay, pay ratios, ESG-linked percentages, TSR, and clawback flags; the only real computation is ratio arithmetic on fabricated inputs. Attaching invented pay figures to real issuers is this module's specific liability. The good news: the raw material is disclosed — pay figures, CEO pay ratios, and incentive-plan structures are in proxy statements and UK remuneration reports.

**How.** (1) `exec_comp_profiles` table from disclosed data: US proxy figures (CEO pay-ratio disclosure is mandatory), UK single-figure tables, ESG-linked variable-pay percentages from remuneration-policy sections — collection shared with `esg-governance-scorer`'s proxy-data effort (one filings pass, two modules). (2) The EPAS rubric implemented as a structured assessment: incentive weight computed from disclosed plan structure; materiality checked against the company's assessed material topics (dme-entity's topic scores); rigour and transparency as analyst-scored rubric items with evidence links — a scored rubric, honestly labeled part-judgment. (3) SBTi linkage: cross-reference the public SBTi target dashboard against the plan's climate KPI definitions. (4) Rung 2: the pay-ESG correlation over accumulated outcome history (needs ≥3 years of stored outcomes — honest-null until then), and voting-threshold what-ifs ("holdings failing EPAS<50 under our policy").

**Prerequisites.** Filings-collection scope (start with ~100 large caps); rubric documentation before any score attaches to a named issuer; the seeded 80-row table deleted at ship. **Acceptance:** a real issuer's pay ratio matches its proxy disclosure; EPAS decomposes into its four components with evidence links; the correlation tab shows honest-null until history accrues.

### 9.2 Evolution B — Remuneration-resolution voting analyst (LLM tier 2)

**What.** The workflow's endpoint — "generate voting recommendation for the AGM remuneration resolution and export the engagement letter" — is a proxy-season task with a hard evidence bar. A tool-calling analyst that pulls the issuer's EPAS decomposition, quotes the specific plan features driving it ("climate KPI is 5% of STI, unverified, not SBTi-linked — rigour component 20/100"), applies the org's voting policy thresholds transparently, and drafts both the voting rationale and the remuneration-committee engagement letter — every pay figure from disclosed data, every score from the stored rubric.

**How.** Tools: `get_comp_profile(issuer)`, `get_epas(issuer)`, `compare_peers(issuer, sector)`, `get_voting_policy(org)`, plus remuneration-report passage retrieval for quoted plan language (span-fidelity per the platform's extraction pattern). The recommendation is rule-application over the policy plus scored rubric, narrated — where rubric items were analyst-judged, the letter says so. ISS/Glass-Lewis-style benchmarks (the <10% low-integration convention in §4) are cited to their source. The vote itself is the stewardship team's; the analyst drafts.

**Prerequisites (hard).** Evolution A — a voting recommendation citing seeded ESG-linked percentages for real issuers would put fabricated claims into AGM correspondence, this module's worst case. **Acceptance:** a golden issuer's recommendation cites only disclosed figures and stored rubric scores; quoted plan language resolves to report passages; policy-threshold application is reproducible by hand.