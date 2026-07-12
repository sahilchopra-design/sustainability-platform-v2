# Board Composition Analytics
**Module ID:** `board-composition` · **Route:** `/board-composition` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Board skills matrix, tenure analysis, independence assessment, and ISS/Glass Lewis proxy advisory criteria scoring for portfolio company boards. Covers lead independent director requirements, committee independence, overboarding screening, and say-on-climate readiness. Benchmarks board composition against ISS QuickScore and MSCI IVA governance ratings.

> **Business value:** Board composition quality is a leading indicator of governance failures that destroy shareholder value: independence deficits correlate with weak oversight of management, and skills gaps in climate and risk increase ESG exposure. Proactive monitoring of ISS/Glass Lewis criteria enables investors to engage before adverse AGM outcomes materialise.

**How an analyst works this module:**
- Board Composition tab shows director-level independence, tenure, and skills tagging
- ISS QuickScore tab replicates QS 1–10 governance risk scoring
- Committee Independence tab checks audit, remuneration, and nominations committee
- Overboarding Screener flags directors with excessive public company commitments
- Say-on-Climate Readiness assesses TCFD alignment of climate disclosure for AGM
- Peer Benchmark compares board metrics against sector governance standards

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `COLORS`, `COS`, `SECTORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `boardSize` | `Math.round(8+sr(i*7)*7);const femPct=Math.round(15+sr(i*11)*35);const indPct=Math.round(50+sr(i*13)*45);const avgAge=Math.round(52+sr(i*17)*16);const avgTenure=+(sr(i*19)*12+2).toFixed(1);` |
| `skillMatrix` | `skills.map(s=>({skill:s,count:Math.round(sr(i*23+skills.indexOf(s)*7)*boardSize*0.8+1)}));` |
| `ethnicDiv` | `Math.round(sr(i*29)*40+10);const intlPct=Math.round(sr(i*31)*50+10);const ceoChairSep=sr(i*37)>0.4?'Yes':'No';const leadIndDir=sr(i*41)>0.3?'Yes':'No';` |
| `overboarding` | `Math.round(sr(i*43)*3);const refreshRate=+(sr(i*47)*20+5).toFixed(1);const esqExpertise=Math.round(sr(i*49)*boardSize*0.6);` |
| `yearly` | `Array.from({length:5},(_,y)=>({year:2020+y,femPct:Math.round(femPct-5+y*2+sr(i*100+y)*3),indPct:Math.round(indPct-3+y*1.5+sr(i*100+y*3)*2),avgAge:Math.round(avgAge-y*0.5+sr(i*100+y*7)*2),boardSize:boardSize+Math.round(sr` |
| `filtered` | `useMemo(()=>{let d=[...COS];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));if(sectorF!=='All')d=d.filter(r=>r.sector===sectorF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,sectorF,sortCol,sortDir]); const paged=useMemo(()=>filtered.slice((page-1)` |
| `stats` | `useMemo(()=>({count:filtered.length,avgFem:(filtered.reduce((s,r)=>s+r.femalePct,0)/filtered.length\|\|0).toFixed(0),avgInd:(filtered.reduce((s,r)=>s+r.independentPct,0)/filtered.length\|\|0).toFixed(0),avgAge:(filtered.redu` |
| `sectorDiv` | `useMemo(()=>{const m={};COS.forEach(r=>{if(!m[r.sector])m[r.sector]={s:r.sector,fem:0,ind:0,eth:0,n:0};m[r.sector].fem+=r.femalePct;m[r.sector].ind+=r.independentPct;m[r.sector].eth+=r.ethnicDiversity;m[r.sector].n++;});` |
| `femDist` | `useMemo(()=>{const b=[{r:'<20%',c:0},{r:'20-30%',c:0},{r:'30-40%',c:0},{r:'40-50%',c:0},{r:'>50%',c:0}];filtered.forEach(r=>{if(r.femalePct<20)b[0].c++;else if(r.femalePct<30)b[1].c++;else if(r.femalePct<40)b[2].c++;else if(r.femalePct<50)b[3].c++;else b[4].c++;});return b;},[filtered]);` |
| `aggSkills` | `['Finance','Technology','Industry','Legal','ESG','International','Marketing','Operations','Risk','HR'].map(s=>{const total=COS.reduce((sum,c)=>{const sk=c.skillMatrix.find(x=>x.skill===s);return sum+(sk?sk.count:0);},0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Board Independence | `Ind_directors / Total × 100` | ISS QS | Percentage of directors meeting ISS independence criteria; <50% triggers ISS concern |
| Avg Board Tenure | `Mean director years on board` | Company proxy | Average tenure; >9 years raises ISS independence questions for non-executive directors |
| Skills Matrix Coverage | — | Board skills disclosure | Number of 12 key competencies covered by at least one board member |
- **Company proxy statements and annual reports** → Extract director profiles; classify by ISS independence criteria; tag skills matrix → **Per-director independence, tenure, and skills metadata**
- **ISS QuickScore API / governance databases** → Compute composite governance score; benchmark against sector and index peers → **QS scores, overboarding flags, and committee independence assessments**

## 5 · Intermediate Transformation Logic
**Methodology:** ISS QualityScore composite governance model
**Headline formula:** `Board_score = 0.30×Independence + 0.25×Skills + 0.25×Diversity + 0.20×Tenure; Independence = Ind_directors / Total_directors × 100`

Independence metric counts directors meeting ISS independence criteria (no employment, material relationship, or family links in last 5 years). Skills matrix scores coverage of 12 competencies (climate, digital, finance, risk, sustainability, operations, legal, international, sector, HR, M&A, stakeholder). Overboarding flags directors with >5 public company seats.

**Standards:** ['ISS QuickScore Governance', 'Glass Lewis Policy Guidelines', 'UK Corporate Governance Code 2024']
**Reference documents:** ISS QuickScore Governance Methodology 2024; Glass Lewis Policy Guidelines 2024; UK Corporate Governance Code 2024; ICGN Global Governance Principles

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry claims an "ISS QualityScore composite
> governance model" (`Board_score = 0.30×Independence + 0.25×Skills + 0.25×Diversity + 0.20×Tenure`),
> ISS independence-criteria classification, a 12-competency skills matrix, committee-independence
> checks, an overboarding screener (>5 seats), and Say-on-Climate readiness. **The code implements a
> different composite with different weights** (`diversityScore = 0.3×female% + 0.3×ethnic% +
> 0.2×intl% + 0.2×independent%` — no skills, no tenure), the skills matrix has 10 competencies (not
> 12), the `governanceRating` (A+…C+) is **drawn at random**, and there is no ISS QS tab, committee
> check, overboarding screener (the field exists, capped at 3, and is never screened), or
> Say-on-Climate logic. The sections below document the code as it behaves.

### 7.1 What the module computes

For 80 hard-coded real company names (Apple … CrowdStrike) with hard-coded sector labels, the page
generates synthetic board attributes and derives one composite (`BoardCompositionPage.jsx:21`):

```js
diversityScore = round(femalePct×0.3 + ethnicDiversity×0.3 + intlPct×0.2 + independentPct×0.2)  // 0–100
governanceRating = ['A+','A','A-','B+','B','B-','C+'][floor(sr(i*59)×7)]                        // random
```

Everything else on the page is filtering, sorting, and aggregation of the seeded attributes across
4 tabs (Board Overview / Diversity Analytics / Skills Matrix / Independence).

### 7.2 Parameterisation — synthetic attribute generators

| Attribute | Generator | Range | Provenance |
|---|---|---|---|
| `boardSize` | `round(8 + sr(i*7)×7)` | 8–15 | Synthetic; plausible vs Spencer Stuart mean ~10.8 |
| `femalePct` | `round(15 + sr(i*11)×35)` | 15–50% | Synthetic demo value |
| `independentPct` | `round(50 + sr(i*13)×45)` | 50–95% | Synthetic demo value |
| `avgAge` / `avgTenure` | `52 + sr×16` / `sr×12 + 2` | 52–68 yr / 2–14 yr | Synthetic demo value |
| `ethnicDiversity` / `intlPct` | `sr×40+10` / `sr×50+10` | 10–50% / 10–60% | Synthetic demo value |
| `ceoChairSep` / `leadIndDir` | `sr(i*37)>0.4` / `sr(i*41)>0.3` | ~60% / ~70% Yes | Synthetic demo value |
| `overboarding` | `round(sr(i*43)×3)` | 0–3 directors | Synthetic; never thresholded |
| `skillMatrix[10]` | per skill: `round(sr(i*23+idx*7)×boardSize×0.8 + 1)` | 1–~13 directors | Synthetic demo value |
| `yearly[5]` | trend drift, e.g. `femPct−5+y×2+sr×3` | 2020–2024 | Synthetic upward drift |
| `esgExpertise` | `round(sr(i*49)×boardSize×0.6)` | 0–9 | Synthetic demo value |

The composite's weights (0.3/0.3/0.2/0.2) are authorial choices with no cited standard; note that
`independentPct` — an *independence* metric — contributes 20% of what is labelled a *diversity*
score, and the guide's claimed skills/tenure terms are absent.

### 7.3 Calculation walkthrough

1. **Generation** — the `COS` array builds all 80 records at module load; all values are stable
   across renders (seeded PRNG).
2. **Filter/sort** — search + sector filter, then sort on any column via a copied array
   (`[...COS].sort`); pagination at 12 rows.
3. **Headline stats** — means of female %, independence %, age, diversityScore, board size and the
   CEO/Chair-separated count over the filtered set (`stats`, guarded by `||0`).
4. **Tab aggregates** — `sectorDiv` (per-sector means of female/independent/ethnic %), `femDist`
   (5-bucket histogram <20…>50%), `ageDist` (4 buckets), `aggSkills` (portfolio-wide totals and
   means of the 10-skill matrix), ESG-experts-by-sector bar, tenure-vs-independence scatter, and a
   CEO/Chair-separation pie.
5. **Detail panel** — clicking a row opens a per-company panel with a 10-axis skills radar and the
   5-year `yearly` diversity trend.

### 7.4 Worked example

Company with `femalePct = 32`, `ethnicDiversity = 24`, `intlPct = 40`, `independentPct = 78`:

| Step | Computation | Result |
|---|---|---|
| Gender term | 32 × 0.3 | 9.6 |
| Ethnicity term | 24 × 0.3 | 7.2 |
| International term | 40 × 0.2 | 8.0 |
| Independence term | 78 × 0.2 | 15.6 |
| **diversityScore** | round(9.6+7.2+8.0+15.6) | **40 / 100** |
| Rating draw | `sr(i*59)=0.31` → floor(0.31×7)=2 | **'A-'** (unrelated to the 40) |

The table colour-codes female % at ≥30 green / ≥20 amber / <20 red — consistent with the 30% Club
threshold — but the rating column beside it is pure chance.

### 7.5 Data provenance & limitations

- **All board attributes are synthetic**, from `sr(seed) = frac(sin(seed+1)×10⁴)`. Company names
  and sectors are real (hard-coded), which creates a **misattribution risk**: the page displays
  fabricated diversity/governance numbers against real issuers (e.g. a random 'C+' next to
  "Microsoft"). No proxy data, ISS feed, or governance database is queried.
- `governanceRating` has zero informational content; `diversityScore` mixes independence into a
  diversity label; tenure/skills are displayed but never scored.
- Skill counts are independent draws — they can exceed plausible joint coverage (10 skills each at
  up to 80% of board seats).
- The 5-year trend hard-codes improvement (+2pp female/yr), so trend charts always look favourable.

### 7.6 Framework alignment

- **ISS Governance QualityScore** — real ISS QS ranks companies into deciles per region from ~230
  weighted factors across 4 pillars (board, compensation, shareholder rights, audit); scores derive
  from disclosed data with published factor logic, never randomness. This module approximates only
  a handful of board-pillar raw factors.
- **Glass Lewis guidelines** — codify vote triggers (e.g. <30% gender-diverse boards at Russell
  3000). The module's female-% colour bands echo the 30%/20% thresholds.
- **UK Corporate Governance Code 2024** — comply-or-explain provisions on chair independence and
  tenure (chair >9 years impairs independence); tenure is generated here but never tested against 9y.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Produce a defensible board-quality composite and proxy-voting screen for listed portfolio
companies, replacing the random rating. Decisions supported: engagement targeting, ISS/GL vote
anticipation, and governance factor input to ESG ratings.

### 8.2 Conceptual approach
Two-layer factor scorecard mirroring (1) **ISS Governance QualityScore** (raw factors → pillar
scores → regional decile rank) and (2) **MSCI IVA Corporate Governance key issue** (0–10 management
score from board structure indicators), with vote-trigger flags per **Glass Lewis 2024 policy**.
Layer 1 scores raw factors from proxy data; Layer 2 aggregates with fixed public weights and ranks
into deciles within region.

### 8.3 Mathematical specification

```
Pillar_Board = Σ_k w_k·s_k (Σw_k=1); Composite = 100×Pillar_Board; Decile = rank within region
```

| Factor s_k | Scoring rule | w_k | Calibration source |
|---|---|---|---|
| Independence | `ind%`: 1 at ≥75%, linear to 0 at ≤50% (majority-independent norm) | 0.25 | NYSE 303A; UK Code B.1 |
| Gender diversity | 1 at ≥40%, 0.6 at ≥33%, 0.3 at ≥20%, else 0 | 0.15 | EU Directive 2022/2381 (40% NED target); FTSE Women Leaders 33% |
| Ethnic diversity | 1 if ≥1 director from minority background (Parker Review), scaled by disclosure | 0.10 | Parker Review 2020/2023 targets |
| Tenure balance | 1 − max(0, (avgTenure − 9)/6); flag any NED >12y | 0.10 | UK Code 2024 ¶10 (9-year chair test); ISS tenure concern |
| Skills coverage | covered competencies ÷ 12 (climate, digital, finance, risk, sector, legal, intl, HR, M&A, ops, sustainability, stakeholder) | 0.15 | ISS QS skills factor; guide's 12-competency list |
| Overboarding | 1 − (# directors >4 public boards ÷ board size); CEO-directors limit = 2 | 0.10 | ISS 2024 US policy (5 boards; 3 for CEOs); GL uses 5/2 |
| Leadership structure | 1 if separate chair or strong lead independent director, else 0.4 | 0.10 | GL 2024 policy; UK Code A.2/A.3 |
| Refreshment | 1 if ≥1 new independent director in 3y AND avg age σ ≥ 5y, else linear | 0.05 | Spencer Stuart Board Index norms |

Letter grade mapped from decile (D1–2 = A range … D9–10 = C range) — deterministic, never random.
Vote-flag layer (binary, reported alongside): independence <50%, gender <1 female (GL against),
overboarded chair, combined CEO/chair without LID.

### 8.4 Data requirements
Per-director records: name, independence classification, tenure, age, gender, ethnicity
(self-disclosed), committee seats, other public boards, skills tags. Sources: proxy statements
(EDGAR, free), BoardEx / ISS Data Desk (vendor), FTSE Women Leaders & Parker Review datasets
(free). Platform: reuse the document-extraction pipeline; persist to a `board_directors` table
(new migration) keyed to the existing company entities.

### 8.5 Validation & benchmarking plan
Reconcile decile vs ISS QS board pillar (ρ ≥ 0.65 target) and MSCI IVA governance score on a ≥200
company overlap; backtest vote-flags against realised ISS/GL "against" recommendations (precision ≥
70%); annual stability check (score churn attributable to roster changes only); weight sensitivity
±5pp reported per factor.

### 8.6 Limitations & model risk
Ethnicity disclosure is voluntary and regionally inconsistent (treat missing as "not scored", not
zero); skills matrices are self-reported and inflate coverage; independence classifications differ
across ISS/GL/local codes — the model must document which definition it applies per market.
Fallback: where per-director data is unavailable, report only disclosure-derived factors and label
the composite "partial coverage".

## 9 · Future Evolution

### 9.1 Evolution A — Real ISS-QuickScore-style scoring on sourced director data (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag: the guide claims an ISS QualityScore composite (`0.30×Independence + 0.25×Skills + 0.25×Diversity + 0.20×Tenure`) with independence classification, a 12-competency matrix, committee-independence checks, an overboarding screener (>5 seats), and Say-on-Climate readiness — but the code computes a *different* composite (a diversity blend with no skills or tenure terms), the matrix has 10 competencies, the `governanceRating` (A+…C+) is **drawn at random**, and there is no ISS QS tab, committee check, overboarding screen (the field exists, capped at 3, never thresholded), or Say-on-Climate logic. 80 companies are real names with fully synthetic board attributes. Evolution A builds the model the guide describes.

**How.** (1) Delete the random `governanceRating` immediately — assigning governance grades by PRNG is the platform's exact anti-pattern (P1). (2) Source board attributes from proxy statements/annual reports (independence, tenure, committee membership, director seat counts) — all publicly disclosed — replacing the seeded generators, with per-company source/vintage. (3) Implement the documented ISS-style composite from those real inputs (independence/skills/diversity/tenure weights) and the overboarding screener as an actual >5-seats threshold, not a display field. (4) Rung 3: benchmark against ISS QuickScore / MSCI IVA governance ratings for overlapping issuers (the module cites them) and report agreement. As a backend vertical, `POST /api/v1/board-composition/score`. Specialise vs the board-diversity/oversight siblings.

**Prerequisites.** A sourced director-level dataset (the hardest input — board bios and independence classification require parsing proxies); coordination across the board cluster to avoid four overlapping composites. **Acceptance:** no random rating (guardrail passes); the composite derives from cited inputs per documented weights; overboarding flags directors above the 5-seat threshold; benchmark agreement with ISS QS is published.

### 9.2 Evolution B — Proxy-season board-quality copilot (LLM tier 2)

**What.** Investors engage boards ahead of AGMs, so the copilot answers "which portfolio boards fail ISS independence criteria this proxy season?", "flag directors who are overboarded", "is this board Say-on-Climate ready?" — running the Evolution-A scoring and screening tools and narrating findings against ISS/Glass Lewis criteria, every score and flag from tool output.

**How.** Tool schemas over the Evolution-A scoring/overboarding/committee routes; grounding corpus is this Atlas record plus the ISS QuickScore / Glass Lewis / UK Governance Code references in §5. The refusal path is critical pre-Evolution-A: the current `governanceRating` is random, so a copilot must not present it as an assessment — tier 2 is gated on the random-rating removal. Once real, the copilot produces engagement-priority lists and drafts AGM voting rationale citing the specific criterion each concern triggers, composing into the report layer.

**Prerequisites (hard).** Evolution A, especially the random-rating purge — a board-quality copilot quoting PRNG grades would be indefensible for stewardship. **Acceptance:** every score, independence classification, and overboarding flag traces to a tool response; no random component underlies any grade; engagement lists cite the failing criterion per company.