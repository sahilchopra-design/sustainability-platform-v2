# Social Analytics Hub
**Module ID:** `social-hub` · **Route:** `/social-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Comprehensive social metrics platform integrating workforce analytics (pay equity, diversity, safety) and supply chain social risk (forced labour, living wage, human rights) in a unified dashboard.

> **Business value:** Integrates workforce and supply chain social analytics into a unified scoring framework aligned to ILO and UNGP standards.

**How an analyst works this module:**
- Collect workforce data: headcount, gender pay gap, LTIFR, union coverage, turnover.
- Assess supply chain social risk: forced labour exposure, living wage compliance, grievance mechanisms.
- Score companies on ILO Core Convention alignment and UN Guiding Principles maturity.
- Aggregate to portfolio-level social risk score and flag engagement priorities.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACTIONS`, `Badge`, `Btn`, `COMPOSITE_WEIGHTS`, `COUNTRY_RISK`, `Card`, `ENGAGEMENT_MATRIX`, `KpiCard`, `LS_BOARD`, `LS_HR_DD`, `LS_PORTFOLIO`, `LS_SDG`, `MODULES`, `PIE_COLORS`, `RISK_DIMENSIONS`, `SFDR_PAI_SOCIAL`, `SOCIAL_THRESHOLDS`, `Section`, `SortTh`, `TABS`, `TabBar`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `MODULES` | 6 | `name`, `icon`, `path`, `color`, `kpiLabel`, `kpiKey` |
| `RISK_DIMENSIONS` | 7 | `label`, `weight` |
| `SFDR_PAI_SOCIAL` | 6 | `indicator`, `unit` |
| `ENGAGEMENT_MATRIX` | 6 | `compositeRange`, `approach`, `timeline`, `escalation` |
| `ACTIONS` | 13 | `module`, `action`, `urgency`, `impact`, `category` |
| `COUNTRY_RISK` | 11 | `riskScore`, `labor`, `governance`, `health`, `diversity`, `community`, `privacy` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `TABS` | `['Overview', 'Social Risk', 'Holdings Analysis', 'Regulatory & PAI', 'Actions & Cross-Nav'];` |
| `base` | `seed(idx * 17 + di * 13);` |
| `sectorBonus` | `sector.includes('financ') ? 8 : sector.includes('health') ? 5 : sector.includes('tech') \|\| sector.includes('it') ? -3 : 0;` |
| `boardScore` | `Math.min(100, kpis.femaleBoard * 1.5 + kpis.independentBoard * 0.5);` |
| `livingWageScore` | `Math.max(0, 100 - kpis.livingWageGap * 3);` |
| `hrScore` | `Math.max(0, 100 - kpis.hrRisk);` |
| `enriched` | `useMemo(() => holdings.map((h, i) => {` |
| `avg` | `(arr) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);` |
| `femaleBoard` | `avg(enriched.map(e => e.moduleKPIs.femaleBoard));` |
| `independent` | `avg(enriched.map(e => e.moduleKPIs.independentBoard));` |
| `livingWageGap` | `avg(enriched.map(e => e.moduleKPIs.livingWageGap));` |
| `hrRisk` | `avg(enriched.map(e => e.moduleKPIs.hrRisk));` |
| `ungp` | `avg(enriched.map(e => e.moduleKPIs.ungpCompliance));` |
| `safetyRate` | `(enriched.reduce((s, e) => s + parseFloat(e.moduleKPIs.safetyRate), 0) / enriched.length).toFixed(1);` |
| `engagement` | `avg(enriched.map(e => e.moduleKPIs.engagement));` |
| `turnover` | `avg(enriched.map(e => e.moduleKPIs.turnover));` |
| `trainingHrs` | `avg(enriched.map(e => e.moduleKPIs.trainingHrs));` |
| `sdgAlign` | `avg(enriched.map(e => e.moduleKPIs.sdgAlignment));` |
| `composite` | `avg(enriched.map(e => e.composite));` |
| `ungcCompliance` | `avg(enriched.map(e => e.moduleKPIs.ungcCompliance));` |
| `moduleStatus` | `useMemo(() => { if (!enriched.length) return MODULES.map(m => ({ ...m, value: '-', trend: 'stable' }));` |
| `sectorPerformance` | `useMemo(() => { const sectors = [...new Set(enriched.map(e => e.sector \|\| e.gics_sector \|\| 'Unknown'))];` |
| `rows` | `enriched.map(e => [e.company_name \|\| e.name, e.sector \|\| e.gics_sector, e.country, e.composite, e.moduleKPIs.femaleBoard, e.moduleKPIs.livingWageGap, e.moduleKPIs.hrRisk, e.moduleKPIs.engagement, e.moduleKPIs.sdgAlignmen` |
| `csv` | `[header, ...rows].map(r => r.join(',')).join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob);` |
| `data` | `{ generated: new Date().toISOString(), aggregateKPIs: agg, holdingsCount: enriched.length, holdings: enriched.map(e => ({ name: e.company_name \|\| e.name, composite: e.composite, moduleKPIs: e.moduleKPIs, socialRisk: e.so` |
| `values` | `{ board: agg.femaleBoard, livingWage: Math.max(0, 100 - (agg.livingWageGap \|\| 0) * 3), humanRights: Math.max(0, 100 - (agg.hrRisk \|\| 0)), wellbeing: agg.engagement, sdg: agg.sdgAlign };` |
| `val` | `row.pai === 10 ? Math.round(seed(501) * 3) : row.pai === 11 ? Math.round(seed(503) * 10 + 5) : row.pai === 12 ? (seed(505) * 12 + 4).toFixed(1) : row.pai === 13 ? Math.round(seed(507) * 15 + 25) : Math.round(seed(509) * ` |
| `cov` | `Math.round(seed(idx * 47 + 511) * 18 + 72);` |
| `yoy` | `(seed(idx * 53 + 513) * 6 - 3).toFixed(1);` |
| `score` | `act.urgency * act.impact;` |
| `buckets` | `[{ range: '0-20', count: 0 }, { range: '21-40', count: 0 }, { range: '41-60', count: 0 }, { range: '61-80', count: 0 }, { range: '81-100', count: 0 }];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ACTIONS`, `COUNTRY_RISK`, `ENGAGEMENT_MATRIX`, `MODULES`, `PIE_COLORS`, `RISK_DIMENSIONS`, `SFDR_PAI_SOCIAL`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Companies Assessed | — | Social database | Portfolio companies with active social analytics coverage across workforce and supply chain dimensions. |
| Living Wage Gap | — | WageIndicator | Share of assessed companies with minimum wages below living wage benchmark in primary operating country. |
| LTIFR (portfolio avg) | — | Sustainalytics | Portfolio average Lost Time Injury Frequency Rate per million hours worked. |
- **Workforce disclosures, supply chain audit data, ESG provider social scores** → Pillar scoring, gap analysis, ILO alignment assessment → **Social risk scores, workforce dashboards, supply chain heatmaps**

## 5 · Intermediate Transformation Logic
**Methodology:** Social Risk Score
**Headline formula:** `(Workforce Score × 0.5) + (Supply Chain Score × 0.5)`

Equally-weighted composite of internal workforce social performance and supply chain social risk exposure scores.

**Standards:** ['ILO Core Conventions', 'GRI 400 Series', 'UN Guiding Principles']
**Reference documents:** ILO Declaration on Fundamental Principles and Rights at Work; UN Guiding Principles on Business and Human Rights; GRI 400 Social Standards Series; UNGC Ten Principles on Labour and Human Rights

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (parameterisation).** The guide states the methodology as
> `Social Risk Score = (Workforce Score × 0.5) + (Supply Chain Score × 0.5)`. The code implements a genuine
> weighted composite, but with **5 different dimensions and weights** — `board 0.25 + livingWage 0.20 +
> humanRights 0.20 + wellbeing 0.20 + sdg 0.15` — and **no distinct "supply chain" sub-score** exists
> anywhere in the file (human-rights risk is the closest proxy). The underlying computation is real and
> auditable, just not the formula the guide describes. Documented below as implemented.

### 7.1 What the module computes

Social Hub aggregates 5 companion modules (Board Diversity, Living Wage, Human Rights DD, Employee
Wellbeing, Social Impact/SDG) into a single portfolio-level social composite for a holdings list pulled from
`localStorage` (falls back to the first 30 rows of `GLOBAL_COMPANY_MASTER` if no portfolio is saved). Per
holding, two synthetic-but-structured scoring functions run:

```js
// 6-dimension risk radar (governance/labor/health-safety/diversity/community/data-privacy)
dims[d.key] = clamp(seed(idx*17 + di*13) × 40 + 35 + sectorBonus, 5, 100)
  sectorBonus: financials +8, healthcare +5, tech/IT −3, else 0

// 11 module KPIs (femaleBoard, independentBoard, livingWageGap, hrRisk, ungpCompliance,
// safetyRate, engagement, turnover, trainingHrs, sdgAlignment, ungcCompliance)
moduleKPIs[k] = round(seed(idx×p1 + k_offset) × range + floor)   // per-KPI seed/range/floor triple

// Composite score (5-dimension weighted average)
boardScore       = min(100, femaleBoard×1.5 + independentBoard×0.5)
livingWageScore  = max(0, 100 − livingWageGap×3)
hrScore          = max(0, 100 − hrRisk)
wellbeingScore   = engagement
sdgScore         = sdgAlignment
composite = round(boardScore×0.25 + livingWageScore×0.20 + hrScore×0.20 + wellbeingScore×0.20 + sdgScore×0.15)
```

### 7.2 Parameterisation

| Element | Value | Provenance |
|---|---|---|
| `RISK_DIMENSIONS` weights | governance 0.20, labor 0.20, health&safety 0.15, diversity 0.15, community 0.15, data privacy 0.15 | hand-set; **defined but never actually used** — the radar chart displays `dims` values but the composite score does not consume these weights at all (the composite uses `COMPOSITE_WEIGHTS`, a separate un-related weight set) |
| `COMPOSITE_WEIGHTS` | board 0.25, livingWage 0.20, humanRights 0.20, wellbeing 0.20, sdg 0.15 | hand-set, sums to 1.00; used by the actual `computeComposite` function |
| `SOCIAL_THRESHOLDS` | excellent/good/moderate cut-points per KPI (e.g. femaleBoard: 40/30/20%) | hand-set rubric, plausible against real disclosure norms but not cited to a specific benchmark study |
| `ENGAGEMENT_MATRIX` | 5 tiers mapping composite score range → stewardship action (Critical 0-30 → escalated board-chair engagement + divestment threat; Leader 81-100 → best-practice sharing) | hand-authored, consistent with standard active-ownership/stewardship codes (e.g. ICGN, UK Stewardship Code escalation ladders) |
| `sectorBonus` | financials +8, healthcare +5, tech/IT −3 | hand-set, no cited empirical basis for the specific point adjustments |
| `COUNTRY_RISK` (10 countries) | hand-typed risk sub-scores (US 28, India 52, China 55…) | plausible but not sourced to a named country-risk index in the code |

### 7.3 Calculation walkthrough

- **Overview tab**: `agg` averages each of the 11 KPIs and the `composite` score across all `enriched`
  holdings — plain arithmetic means, correctly implemented with `.length` guards.
- **Social Risk tab**: builds `radarData` from the (unused-in-composite) `RISK_DIMENSIONS` scores, filterable
  by dimension.
- **Holdings Analysis**: sortable table of all `enriched` holdings by any KPI or the composite; renders
  `ENGAGEMENT_MATRIX` tier per holding based on which composite-score bucket it falls into.
- **Regulatory & PAI**: computes 5 SFDR PAI social indicators (10–14: UNGC/OECD violations, gender pay gap,
  board gender diversity, controversial weapons exposure) via **further independent `seed()` draws**
  (`val = row.pai===10 ? round(seed(501)×3) : ...`) — a *third* disconnected scoring layer, not derived from
  the `moduleKPIs`/`socialRisk` already computed for the same holdings.
- **Actions & Cross-Nav**: ranks the 12 hand-authored `ACTIONS` by `urgency × impact` — a simple priority
  score, not tied to which holdings actually breach the thresholds.

### 7.4 Worked example

Holding index `idx=5`, illustrative:

| KPI | Formula | Illustrative value |
|---|---|---|
| `femaleBoard` | `round(seed(5×7+1)×25+15)` | 15–40% |
| `independentBoard` | `round(seed(5×11+2)×30+40)` | 40–70% |
| `livingWageGap` | `round(seed(5×13+3)×20+2)` | 2–22% |
| `hrRisk` | `round(seed(5×17+4)×50+20)` | 20–70 |
| `engagement` | `round(seed(5×29+7)×25+55)` | 55–80 |
| `sdgAlignment` | `round(seed(5×41+10)×35+30)` | 30–65 |

Assume the draws land at `femaleBoard=32`, `independentBoard=58`, `livingWageGap=8`, `hrRisk=35`,
`engagement=68`, `sdgAlignment=48`:

| Step | Computation | Result |
|---|---|---|
| `boardScore` | min(100, 32×1.5 + 58×0.5) | min(100, 77) = **77** |
| `livingWageScore` | max(0, 100 − 8×3) | **76** |
| `hrScore` | max(0, 100 − 35) | **65** |
| `wellbeingScore` | = engagement | **68** |
| `sdgScore` | = sdgAlignment | **48** |
| **Composite** | 77×.25 + 76×.20 + 65×.20 + 68×.20 + 48×.15 | 19.25+15.2+13+13.6+7.2 = **68.25 → 68** |
| Engagement tier | 68 falls in [61,80] | **"On Track" — annual review with sustainability team** |

### 7.5 Engagement priority rubric

| Tier | Composite range | Approach | Escalation |
|---|---|---|---|
| Critical | 0–30 | Escalated engagement, board chair | Divestment if no improvement |
| High Priority | 31–45 | Direct management engagement | Proxy voting against directors |
| Monitor | 46–60 | Collaborative engagement (investor groups) | Bilateral escalation |
| On Track | 61–80 | Annual review with sustainability team | Enhanced monitoring |
| Leader | 81–100 | Best-practice sharing | N/A |

### 7.6 Data provenance & limitations

- **All KPI, risk-dimension, and PAI values are synthetic**, generated by `seed(s)=frac(sin(s+1)×10⁴)`, keyed
  by holding index — real for structure, fabricated for content.
- The 6-dimension `RISK_DIMENSIONS` weight set is **defined but dead** — it never feeds the composite score,
  only a separate radar chart, so a user who reads the weights expecting them to drive the headline
  composite will be misled.
- SFDR PAI 10–14 values are computed from a **third, independent seed layer** disconnected from
  `moduleKPIs` — e.g. PAI 13 (board gender diversity) and `moduleKPIs.femaleBoard` measure the same concept
  but will show different numbers for the same holding.
- Holdings default to a static 30-company slice of `GLOBAL_COMPANY_MASTER` when no portfolio is saved —
  fine for demo, but the "Portfolio ESG Score" framing implies a live portfolio integration that doesn't
  exist without prior localStorage population from other modules.

### 7.7 Framework alignment

- **ILO Core Conventions, GRI 400 series, UN Guiding Principles (UNGP)** — the KPI set (living wage gap, HR
  risk, UNGP compliance, safety rate) is directionally aligned to these frameworks' material topics; no
  clause-by-clause scoring exists.
- **SFDR PAI indicators 10–14** — correctly named and unit-labelled per SFDR Annex I; values are synthetic.
- **Active-ownership stewardship codes** (UK Stewardship Code, ICGN) — the `ENGAGEMENT_MATRIX` escalation
  ladder (engage → escalate → vote against → divest) mirrors standard institutional-investor stewardship
  practice structurally, even though triggered by synthetic scores here.

## 9 · Future Evolution

### 9.1 Evolution A — Real companion-module data with a single consistent scoring layer (analytics ladder: rung 1 → 2)

**What.** Social Hub is a tier-B aggregator: it composites 5 companion social modules (Board Diversity, Living Wage, Human Rights DD, Employee Wellbeing, Social Impact/SDG) into a portfolio-level score, and its weighted-composite math is genuinely auditable — but §7.6 documents three defects. All KPI, risk-dimension, and PAI values are `seed()`-synthetic; the 6-dimension `RISK_DIMENSIONS` weight set is **dead code** feeding only a radar chart, not the composite, so a user reading those weights is misled; and SFDR PAI 10–14 come from a **third independent seed layer** so PAI-13 (board gender diversity) and `moduleKPIs.femaleBoard` disagree for the same holding despite measuring the same thing. Evolution A makes the hub aggregate real companion-module outputs through one scoring layer.

**How.** (1) Pull each holding's social KPIs from the actual companion modules' computed outputs (or a shared `social_kpis` table) rather than re-seeding — the hub becomes a true roll-up. (2) Unify the seed layers: PAI-13 must equal the same underlying board-diversity figure `moduleKPIs.femaleBoard` uses, computed once. (3) Either wire `RISK_DIMENSIONS` into the composite or clearly relabel it as radar-only, resolving the dead-weight misdirection. (4) Replace the guide's stated 50/50 workforce/supply-chain split — which §7 notes doesn't match the real 5-dimension weighting and lacks any distinct supply-chain sub-score — either by building a genuine supply-chain sub-score or correcting the guide to the implemented dimensions.

**Prerequisites.** Companion modules must expose their per-holding scores (a shared table or internal API); `localStorage` portfolio dependence should fall back to `portfolios_pg`. **Acceptance:** PAI-13 and `femaleBoard` show the same number for a holding; the composite responds to real companion-module data; no displayed weight is dead.

### 9.2 Evolution B — Stewardship-prioritisation copilot (LLM tier 1)

**What.** The module already encodes an `ENGAGEMENT_MATRIX` escalation ladder (engage → escalate → vote against → divest) mirroring UK Stewardship Code / ICGN practice. Evolution B is a copilot that turns portfolio social scores into a prioritised engagement plan: "which holdings are the top social-risk engagement priorities and why?", "draft the engagement ask for this holding's living-wage gap" — grounded in the composite decomposition (board/livingWage/hr/wellbeing/sdg sub-scores) and the ILO/UNGP/GRI-400 material topics the KPIs map to.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/social-hub/ask`, corpus = this Atlas record plus the engagement-matrix ladder and framework references. Prioritisation narrates the deterministic composite (each priority cites its driving sub-score); the escalation recommendation reads off the matrix rung for the holding's score band, never invented. Engagement-ask drafts follow claim → sub-score evidence → specific request.

**Prerequisites.** Evolution A's real data — prioritising synthetic scores would produce a plausible but meaningless engagement list. **Acceptance:** every priority ranking cites a computed sub-score; the escalation rung matches the `ENGAGEMENT_MATRIX` for that score; asking to prioritise a holding absent from the portfolio returns a refusal.