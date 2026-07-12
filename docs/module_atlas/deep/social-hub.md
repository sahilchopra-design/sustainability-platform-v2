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
