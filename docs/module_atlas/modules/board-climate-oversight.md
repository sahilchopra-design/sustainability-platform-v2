# Board Climate Oversight Analytics
**Module ID:** `board-climate-oversight` · **Route:** `/board-climate-oversight` · **Tier:** B (frontend-computed) · **EP code:** EP-DK1 · **Sprint:** DK

## 1 · Overview
Evaluates board-level climate governance structures, director expertise, oversight mechanisms, and accountability frameworks. Scores companies against TCFD Governance pillar, SEC Climate Disclosure Rule board requirements, and emerging ISSB S2 governance indicators.

> **Business value:** Essential for active ownership teams conducting climate stewardship, ESG analysts rating governance quality, and companies preparing TCFD/ISSB S2 governance disclosures. Benchmarks against S&P 500/FTSE 100 peers on board climate expertise and executive accountability metrics.

**How an analyst works this module:**
- Input company for board composition analysis
- Score director climate expertise and credentials
- Assess board committee oversight structure
- Evaluate climate KPIs in executive remuneration
- Generate TCFD/ISSB S2 governance disclosure scorecard

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `COMPANIES`, `COUNTRIES`, `KpiCard`, `SECTORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sector` | `SECTORS[Math.floor(sr(i * 7) * SECTORS.length)];` |
| `country` | `COUNTRIES[Math.floor(sr(i * 13) * COUNTRIES.length)];` |
| `boardSize` | `8 + Math.floor(sr(i * 3) * 8);` |
| `climateExpertsOnBoard` | `Math.floor(sr(i * 11) * 4);` |
| `boardClimateCommittee` | `sr(i * 17) > 0.45;` |
| `ceoClimateKpi` | `sr(i * 19) > 0.4;` |
| `climateInExecutiveComp` | `sr(i * 23) > 0.35;` |
| `boardMeetingsOnClimate` | `1 + Math.floor(sr(i * 29) * 6);` |
| `climateExpertisePct` | `parseFloat(((climateExpertsOnBoard / boardSize) * 100).toFixed(1));` |
| `carbonNetworkScore` | `parseFloat((1 + sr(i * 41) * 9).toFixed(1));` |
| `thirdPartyAudit` | `sr(i * 43) > 0.5;` |
| `climateSkillsGap` | `parseFloat((10 - climateExpertisePct * 0.08 - sr(i * 47) * 3).toFixed(1));` |
| `avgGov` | `(filtered.reduce((a, c) => a + c.governanceScore, 0) / n).toFixed(1);` |
| `pctCommittee` | `((filtered.filter(c => c.boardClimateCommittee).length / n) * 100).toFixed(0);` |
| `avgExperts` | `(filtered.reduce((a, c) => a + c.climateExpertsOnBoard, 0) / n).toFixed(1);` |
| `pctCeoKpi` | `((filtered.filter(c => c.ceoClimateKpi).length / n) * 100).toFixed(0);` |
| `bySector` | `SECTORS.map(s => {` |
| `byCountry` | `COUNTRIES.map(cn => {` |
| `scatterData` | `filtered.map(c => ({ x: c.climateExpertsOnBoard, y: c.governanceScore, name: c.name }));` |
| `leaders` | `[...filtered].sort((a, b) => b.governanceScore - a.governanceScore).slice(0, 10);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Boards with Climate Expertise | — | Spencer Stuart Board Index 2023 | Only 43% of S&P 500 boards have at least one director with climate/sustainability expertise |
| Climate in Executive Pay | — | Willis Towers Watson 2023 | Climate/ESG metrics in executive remuneration at 51% of FTSE 100 companies |
| TCFD Governance Adoption | — | TCFD Status Report 2023 | 83% of large-cap companies now report on TCFD Governance pillar — but quality varies widely |
- **Board composition data (director bios, committees)** → Climate expertise scoring → **Director-level climate competency and board coverage**
- **Executive remuneration reports (LTIPs, STIPs)** → Climate pay linkage → **Climate KPI weight in total CEO compensation**
- **TCFD governance section disclosures** → Disclosure quality assessment → **ISSB S2 paragraph-by-paragraph compliance gap**

## 5 · Intermediate Transformation Logic
**Methodology:** Board Climate Governance Score
**Headline formula:** `BoardClimateScore = w_E × ExpertiseScore + w_O × OversightScore + w_A × AccountabilityScore + w_D × DisclosureScore; ExpertiseScore = ClimateDirectors / TotalBoardSeats × CompetencyDepth`

Four-pillar scoring aggregates board composition (climate expertise), oversight mechanisms (board committee), accountability linkage (exec pay), and public disclosure quality

**Standards:** ['TCFD Recommendations — Governance Pillar 2017', 'ISSB IFRS S2 — Governance Disclosure Requirements 2023', 'SEC Climate Disclosure Rule — Board Expertise 2024', 'WEF Board Governance for Climate Resilience 2023']
**Reference documents:** TCFD Final Recommendations — Governance Section (2017); ISSB IFRS S2 Climate-related Disclosures — Governance Paragraphs 6-9 (2023); SEC Climate Disclosure Final Rule — Board Expertise Requirements (2024); WEF White Paper — Board Governance for Climate Resilience 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a four-pillar weighted model
> (`BoardClimateScore = w_E×Expertise + w_O×Oversight + w_A×Accountability + w_D×Disclosure`) with a
> `CompetencyDepth` factor, TCFD/ISSB S2 disclosure-quality scoring, and an "ISSB S2
> paragraph-by-paragraph compliance gap" output. **The code implements none of that.** What actually
> runs is a fixed additive point rubric over five binary/count attributes plus a seeded random noise
> term of up to 15 points. There is no disclosure pillar, no competency depth, no ISSB S2 gap
> analysis, and no per-director data — everything is company-level and synthetic. The sections below
> document the code as it behaves.

### 7.1 What the module computes

For 70 synthetic companies (10 sectors × 10 countries), the page computes a single 0–100
**Board Climate Governance Score** (`BoardClimateOversightPage.jsx:33-40`):

```js
governanceScore = round(
    (boardClimateCommittee ? 20 : 0) +
    (ceoClimateKpi        ? 15 : 0) +
    (climateInExecutiveComp ? 15 : 0) +
    climateExpertisePct * 0.4 +          // expertisePct = experts/boardSize × 100
    boardMeetingsOnClimate * 3 +
    sr(i*37) * 15                        // random noise, 0–15 points
)   // then clamped: min(100, ·)
```

and a categorical maturity level: `≥75 Leader · ≥55 Advanced · ≥35 Developing · <35 Laggard`.
Two companion metrics are generated but do **not** feed the score: `carbonNetworkScore`
(`1 + sr(i*41)×9`, a 1–10 float) and `thirdPartyAudit` (boolean, `sr(i*43) > 0.5`).

### 7.2 Parameterisation / scoring rubric

| Component | Points | Generator (all synthetic) | Provenance |
|---|---|---|---|
| Board climate committee | 20 if present | `sr(i*17) > 0.45` (~55% prevalence) | Weight: authorial choice, no cited standard |
| CEO climate KPI | 15 if present | `sr(i*19) > 0.4` (~60%) | Synthetic demo value |
| Climate in executive comp | 15 if present | `sr(i*23) > 0.35` (~65%) | Synthetic demo value |
| Climate expertise % | 0.4 × pct (max ~20 pts at 50%) | experts = `floor(sr(i*11)×4)` (0–3), boardSize = 8–15 | Synthetic demo value |
| Board climate meetings/yr | 3 × count (3–18 pts) | `1 + floor(sr(i*29)×6)` (1–6) | Synthetic demo value |
| Random noise | 0–15 | `sr(i*37) × 15` | **No basis — pure noise** |

Maximum deterministic score ≈ 20+15+15+(37.5%×0.4≈15)+18 = 83; the noise term is what lifts
companies into "Leader" territory, meaning up to 15% of the headline score is not explained by any
governance attribute. The skills-gap metric is a separate 0–10 index:
`climateSkillsGap = clamp(10 − climateExpertisePct×0.08 − sr(i*47)×3, 0, 10)` — inversely coupled
to expertise, again with a random component.

### 7.3 Calculation walkthrough

1. **Seed generation** — each company `i` draws sector, country, board size (8–15), climate experts
   (0–3), three booleans, and meetings/yr from independent `sr(i×prime)` streams.
2. **Score assembly** — the §7.1 rubric produces `governanceScore`, then `govLevel` from thresholds.
3. **Filtering** — five UI filters (sector, country, level, min score, min expertise) produce
   `filtered`; the divisor is guarded via `n = max(1, filtered.length)`.
4. **Headline KPIs** — `avgGov` (mean score), `pctCommittee`, `avgExperts`, `pctCeoKpi` over the
   filtered set.
5. **Aggregations** — `bySector` computes per-sector means of score, committee %, exec-comp %,
   expertise %, meetings, and skills gap (Tabs 1–6); `byCountry` computes exec-comp % (Tab 3);
   `leaders` is the top-10 by score (Tab 7); a scatter plots experts vs score (Tab 1).

### 7.4 Worked example

Company with `boardClimateCommittee = true`, `ceoClimateKpi = true`, `climateInExecutiveComp =
false`, `boardSize = 10`, `climateExpertsOnBoard = 2`, `boardMeetingsOnClimate = 4`, noise draw
`sr(i*37) = 0.60`:

| Step | Computation | Result |
|---|---|---|
| Expertise % | 2 / 10 × 100 | 20.0% |
| Committee + CEO KPI + Exec comp | 20 + 15 + 0 | 35 |
| Expertise points | 20.0 × 0.4 | 8 |
| Meetings points | 4 × 3 | 12 |
| Noise | 0.60 × 15 | 9 |
| **governanceScore** | round(35 + 8 + 12 + 9) | **64** |
| Level | 55 ≤ 64 < 75 | **Advanced** |
| Skills gap (noise 0.5) | clamp(10 − 20×0.08 − 0.5×3, 0, 10) | **6.9 / 10** |

Note that with noise 0.10 instead of 0.60 the same company scores 57 — still Advanced, but a
company at 68 vs 74 can differ from a peer purely on the random term.

### 7.5 Data provenance & limitations

- **All 70 companies are synthetic**, generated by the platform PRNG `sr(seed) =
  frac(sin(seed+1)×10⁴)`. Names are `Company A…Z, A1…`. No real proxy-statement, committee-charter,
  or remuneration data is ingested; the guide's cited data points (Spencer Stuart 43%, WTW 51%,
  TCFD 83%) appear nowhere in the code.
- The **random noise term** (15% of scale) means the score is not reproducible from disclosed
  attributes — a production scorer must be fully attribute-determined and auditable.
- All attributes are equal-weighted within their point value regardless of sector materiality;
  expertise counts directors without any competency-depth grading (contradicting the guide's
  `CompetencyDepth` factor).
- Attribute prevalences (55% committee, 60% CEO KPI) are chosen for visual balance, not calibrated
  to any survey.

### 7.6 Framework alignment

- **TCFD Governance pillar (2017)** — asks two disclosures: (a) board oversight of climate
  issues, (b) management's role. The module's committee/meetings attributes approximate (a); it has
  no management-role dimension.
- **IFRS S2 ¶6–9 (ISSB, 2023)** — requires disclosure of the body responsible, how competencies
  are determined, frequency of briefings, and integration into remuneration. The expertise, meetings
  and comp attributes loosely map to ¶6(a)(i–v); no compliance-gap output exists despite the guide.
- **SEC Climate Disclosure Rule (2024)** — as adopted, Reg S-K Item 1501 requires board oversight
  description; the proposed director-expertise line-item was dropped in the final rule, so the
  guide's "Board Expertise 2024" citation overstates the requirement.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Support stewardship/engagement prioritisation and governance-quality ratings by scoring board-level
climate governance for listed issuers (coverage: any issuer with a proxy statement / annual report).
Decision supported: engagement targeting, voting policy triggers, and ISSB S2 governance disclosure
gap assessment.

### 8.2 Conceptual approach
Attribute-based additive scorecard with materiality weighting and evidence tiers — mirroring
(1) **ISS Governance QualityScore** (decile rank from weighted factor battery, zero randomness),
(2) **CDP Climate questionnaire C1 Governance module** (points per evidenced mechanism, leadership
bands), and (3) **MSCI ESG Ratings governance key issue** (0–10 management score from structural
indicators). All inputs extracted from public filings (proxy, annual report, remuneration report)
via the platform's document pipeline, each with a provenance link.

### 8.3 Mathematical specification

```
Score = Σ_k w_k · s_k,   s_k ∈ [0,1],   Σ w_k = 1,   scaled ×100
```

| k | Indicator s_k | Scoring | Weight w_k | Calibration source |
|---|---|---|---|---|
| 1 | Board oversight body | 1 full committee · 0.6 designated existing committee · 0.3 full-board only · 0 none | 0.20 | TCFD Gov (a); CDP C1.1a bands |
| 2 | Director climate competency | min(1, weighted experts/board); expert=1.0 (climate credential), 0.5 (adjacent, e.g. energy) | 0.20 | IFRS S2 ¶6(a)(ii); Spencer Stuart Board Index for peer norm |
| 3 | Briefing cadence | min(1, climate agenda items ÷ 4/yr) | 0.10 | CDP C1.1b (quarterly = leadership) |
| 4 | Remuneration linkage | 1 quantitative weighted KPI in STI+LTI · 0.5 qualitative/STI only · 0 none | 0.20 | IFRS S2 ¶6(a)(v); WTW ExecPay ESG survey norms |
| 5 | Transition-plan accountability | 1 board-approved plan w/ milestones · 0.5 plan w/o milestones · 0 | 0.15 | CA100+ NZ Benchmark indicator 8 |
| 6 | Disclosure completeness | fraction of IFRS S2 ¶6 sub-requirements evidenced (0–1) | 0.15 | IFRS S2 ¶6 checklist |

Peer-relative decile: `Decile = rank(Score | GICS sector, region) → 1–10` (ISS QS convention:
1 = lowest risk). Uncertainty: each s_k carries an evidence tier e_k ∈ {disclosed=1, inferred=0.5};
report `Coverage = Σ w_k e_k` alongside the score, and suppress the decile when Coverage < 0.7.

### 8.4 Data requirements
Proxy statements / governance reports (SEC EDGAR, Companies House — free), CDP C1 responses
(licensed), remuneration reports; director bios for competency tagging (BoardEx or manual NLP
extraction via the platform's document-AI engine). Existing platform assets: `reference_data`
tables for SBTi status (target linkage), the ai-compliance document pipeline for clause extraction.

### 8.5 Validation & benchmarking plan
(a) Reconcile decile ranks against ISS QualityScore governance pillar for an overlapping universe
(target rank correlation ρ ≥ 0.6); (b) backtest: scores vs subsequent CDP C-band and CA100+
indicator-8 outcomes; (c) stability: quarter-on-quarter score churn < 10% absent filing changes;
(d) inter-rater reliability ≥ 90% on the competency tagging sample.

### 8.6 Limitations & model risk
Scorecard weights are judgemental (mitigate: sensitivity analysis ±5pp per weight, report range);
disclosure ≠ practice (greenwashing risk — mitigate with outcome cross-checks, e.g. actual emissions
trajectory); competency tagging is subjective at the 0.5 tier; small boards create granularity
effects in s_2. Conservative fallback: when filings are unavailable, publish Coverage only, never an
imputed score.

## 9 · Future Evolution

### 9.1 Evolution A — Purge the noise term and build the four-pillar model on real disclosures (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag: the guide promises a four-pillar weighted `BoardClimateScore` with a `CompetencyDepth` factor and ISSB S2 paragraph-by-paragraph gap analysis, but the code runs a fixed additive rubric over five binary/count attributes **plus a seeded random noise term of up to 15 points** (`sr(i*37)×15`) — meaning a material fraction of every company's governance score is pure fabrication, over 70 fully synthetic companies. Two companion metrics (`carbonNetworkScore`, `thirdPartyAudit`) are also seeded and don't even feed the score. Evolution A removes the fabrication and builds the documented model.

**How.** (1) Delete the `sr(i*37)×15` noise term immediately — it is the platform's exact anti-pattern (random-as-data), inflating scores by up to 15 points with no basis; this is a P1 fix, not a feature. (2) Source the five attributes from real disclosures: board climate committee, CEO climate KPI, climate-in-exec-comp, climate expertise ratio, and board-meeting frequency are all TCFD-Governance-pillar disclosures. (3) Build the promised disclosure pillar and the ISSB S2 governance-paragraph (¶6–9) gap analysis the guide claims — this is the module's differentiator vs `board-climate-competence`, so specialise here. (4) Rung 3: benchmark against the real reference points the module already cites (Spencer Stuart 43% climate-expertise stat, WTW 51% exec-pay stat). As a backend vertical, `POST /api/v1/board-oversight/score`.

**Prerequisites.** A sourced governance dataset (70 companies are synthetic today — replace or clearly badge); coordination with `board-climate-competence` and `board-composition`/`board-diversity` so the board cluster specialises rather than overlapping. **Acceptance:** the score contains no PRNG term (guardrail `check_no_fabricated_random.py` passes); each pillar derives from cited disclosures; the ISSB S2 ¶6–9 gap output exists; benchmark stats reconcile.

### 9.2 Evolution B — TCFD/ISSB S2 governance-disclosure copilot (LLM tier 2)

**What.** The module's stated audience (stewardship teams, companies preparing TCFD/ISSB S2 governance disclosures) needs a copilot that scores a company's board governance and drafts the disclosure scorecard: "assess this board's climate oversight and generate the ISSB S2 governance gap analysis" runs the Evolution-A four-pillar model and the ¶6–9 gap tool, narrating strengths and gaps against each requirement — every score and gap from tool output.

**How.** Tool schemas over the Evolution-A scoring and gap-analysis routes; grounding corpus is this Atlas record plus the TCFD Governance and ISSB S2 references in §5. The refusal path is essential pre-Evolution-A: the current score is 15-points-fabricated, so a copilot must not narrate it as a real assessment — a tier-2 copilot is gated entirely on the noise-term removal. Once real, the copilot drafts governance-disclosure narratives citing the specific ISSB S2 paragraph each finding addresses, composing into the report layer.

**Prerequisites (hard).** Evolution A, especially the noise-term purge — a governance copilot quoting a partly-random score would be indefensible for stewardship or disclosure use. **Acceptance:** every score and gap traces to a tool response; the score has no random component; ISSB S2 gap findings cite the relevant paragraph; the copilot refuses to assess boards absent sourced disclosure inputs.