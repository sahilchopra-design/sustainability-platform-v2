# PE ESG Diligence
**Module ID:** `pe-esg-diligence` · **Route:** `/pe-esg-diligence` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Provides a structured pre-investment ESG due diligence framework for PE transactions, covering environmental, social, and governance risk identification, materiality assessment, and value creation planning.

> **Business value:** Equips PE deal teams with a rigorous, sector-calibrated ESG diligence process that identifies material risks, surfaces value creation opportunities, and supports responsible investment decision-making.

**How an analyst works this module:**
- Identify target sector and map to SASB material ESG topics
- Conduct management interview and document review across environmental, social, and governance dimensions
- Score each material topic on current performance and management quality
- Develop 100-day ESG value creation plan: key initiatives, KPI targets, resource requirements

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CATEGORIES`, `DATA`, `NAMES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `CATEGORIES` | `['Pre-Acquisition','100-Day Plan','Value Creation','Exit Readiness','Portfolio Review','Annual Assessment'];const SECTORS=['Healthcare PE','Tech PE','Industrial PE','Consumer PE','Financial PE','Energy PE','Infra PE','Re` |
| `filtered` | `useMemo(()=>{let d=[...DATA];if(search){const s=search.toLowerCase();d=d.filter(r=>r.name.toLowerCase().includes(s)\|\|r.sector.toLowerCase().includes(s)\|\|r.category.toLowerCase().includes(s)\|\|r.region.toLowerCase().includes(s));}if(fCat!=='All')d=d.filter(r=>r.category===fCat);if(fSector!=='All')d=d.filter(r=>r.sector===fSector);if(fRisk!=` |
| `kpis` | `useMemo(()=>{const d=filtered;if(!d.length)return{count:0,avgScore:0,avgCompl:0,avgConf:0,totalVol:0,highRisk:0};return{count:d.length,avgScore:d.reduce((a,r)=>a+r.score,0)/d.length,avgCompl:d.reduce((a,r)=>a+r.completio` |
| `catDist` | `useMemo(()=>{const m={};filtered.forEach(r=>{m[r.category]=(m[r.category]\|\|0)+1;});return Object.entries(m).map(([name,value])=>({name:name.length>14?name.slice(0,14)+'..':name,value})).sort((a,b)=>b.value-a.value);},[fi` |
| `radarData` | `useMemo(()=>{if(!filtered.length)return[];const avg=k=>filtered.reduce((a,r)=>a+r[k],0)/filtered.length;return[{axis:'Env',value:avg('envScore')},{axis:'Social',value:avg('socScore')},{axis:'Gov',value:avg('govScore')},{` |
| `trendData` | `useMemo(()=>['Q1','Q2','Q3','Q4'].map((q,i)=>({quarter:q,score:filtered.reduce((a,r)=>a+[r.q1,r.q2,r.q3,r.q4][i],0)/(filtered.length\|\|1)})),[filtered]);` |
| `sectorScore` | `useMemo(()=>{const m={};const c={};filtered.forEach(r=>{m[r.sector]=(m[r.sector]\|\|0)+r.score;c[r.sector]=(c[r.sector]\|\|0)+1;});return Object.entries(m).map(([name,sum])=>({name:name.length>12?name.slice(0,12)+'..':name,s` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CATEGORIES`, `NAMES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| PE ESG DD Topics | — | SASB Materiality Map 2023 | Number of material ESG topics assessed in a typical sector-specific PE diligence using SASB standards. |
| ESG Value Creation Upside | — | McKinsey PE ESG 2022 | Documented multiple-on-invested-capital improvement attributable to ESG value creation plans in case studies of PE-backed companies. |
- **Management interviews, company documents, ESG controversy databases, regulatory filings, site assessments** → SASB materiality mapping, topic scoring, severity weighting, EMS computation → **ESG diligence report, value creation plan, investment committee risk and opportunity summary**

## 5 · Intermediate Transformation Logic
**Methodology:** ESG Materiality Score
**Headline formula:** `EMS = Σ wᵢ × TopicScoreᵢ × SeverityMultiplierᵢ`

SASB sector-specific material topics weighted by financial impact potential and scored on management quality; produces a sector-calibrated ESG diligence rating.

**Standards:** ['PRI PE DDQ 2023', 'SASB Materiality Finder']
**Reference documents:** PRI Due Diligence Questionnaire for PE 2023; SASB Standards by Sector 2023; IFC Performance Standards 2012; UN Guiding Principles on Business and Human Rights 2011

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** MODULE_GUIDES describes an **ESG Materiality Score** —
> `EMS = Σ wᵢ × TopicScoreᵢ × SeverityMultiplierᵢ`, using SASB sector-material topic weighting.
> **The code does not compute this.** `score`, `envScore`, `socScore`, and `govScore` are drawn as
> **four statistically independent random values** from the seeded PRNG (`s(31)`, `s(37)`, `s(41)`,
> `s(43)` respectively) — `score` is not a weighted function of the E/S/G sub-scores, and no SASB
> topic list, weight, or severity multiplier appears anywhere in the extracted formulas. Sections
> below document the code as it behaves; §8 specifies the EMS model the guide describes.

### 7.1 What the module computes

```
score      = 20 + s(31)×75      // overall diligence score, independent of E/S/G below
envScore   = 15 + s(37)×80
socScore   = 15 + s(41)×80
govScore   = 20 + s(43)×75
completion = 20 + s(73)×78      // % of diligence checklist complete
compliance = 30 + s(79)×68      // % regulatory compliance
```

50 synthetic diligence records are generated across 6 categories (Pre-Acquisition, 100-Day Plan,
Value Creation, Exit Readiness, Portfolio Review, Annual Assessment) and 8 PE-sector verticals.

### 7.2 Parameterisation

| Field | Range | Provenance |
|---|---|---|
| `score` | 20–95 | Synthetic demo value, **independent of** `envScore`/`socScore`/`govScore` |
| `envScore`/`socScore`/`govScore` | 15–95 / 15–95 / 20–95 | Synthetic demo value, each independently seeded |
| `risk` | Low/Medium/High/Critical, `s(29)`-indexed | Synthetic demo value, uncorrelated with `score` |
| `m1`–`m6` | assorted 0–100/0–50/0–25 ranges | Synthetic demo value, unlabelled generic metric placeholders |
| `q1`–`q4` (quarterly score) | 20–95 each | Synthetic demo value, independent per quarter — no autocorrelation modelling a real company's ESG improvement trajectory would show |

### 7.3 Calculation walkthrough

1. **Record generation** (`genData(50)`): each field uses a distinct multiplier `idx` fed into
   `s(idx) = sr(i*idx+idx)` — this decorrelates every field from every other by construction (E, S,
   G, overall score, completion, compliance are all separately drawn), which is the direct cause of
   the guide-vs-code gap: there is no `score = f(envScore, socScore, govScore)` relationship to
   invert or verify.
2. **Radar chart** (`radarData`): averages `envScore`/`socScore`/`govScore`/`completion`/
   `compliance`/`score` across the filtered set — a legitimate aggregation *mechanic*, just applied
   to uncorrelated underlying data.
3. **Trend** (`trendData`): averages `q1..q4` per quarter across filtered records — again a correct
   aggregation, but the underlying quarterly scores carry no real trajectory signal.
4. **Sector scoring** (`sectorScore`): mean `score` grouped by sector — susceptible to being
   dominated by whichever sector has the most records in a filtered slice, with no materiality
   weighting by sector (SASB's core premise is that *different* topics matter for *different*
   sectors — this module treats all sectors identically).

### 7.4 Worked example

For record `i=12`: `envScore = 15+s(37×13+37)×80`, `socScore = 15+s(41×13+41)×80`,
`govScore = 20+s(43×13+43)×75`, `score = 20+s(31×13+31)×75` — each computed from a distinct seed
offset, so knowing any three of the four values gives no information about the fourth. There is no
worked-example arithmetic path from E/S/G sub-scores to the headline `score` because none exists in
the code.

### 7.5 Data provenance & limitations

- **All 50 diligence records are synthetic demo data**, decorrelated by construction across every
  scored dimension.
- **SASB material-topic mapping is entirely absent** — no per-sector topic list, no topic weight,
  no severity multiplier despite being the guide's headline methodology.
- Value-creation-plan tab (100-day plan, KPI targets) exists per the guide's `userInteraction` list
  but its formulas were not captured in the extracted `computed` set; based on the pattern elsewhere
  in the file it is likely also independently-seeded display data rather than derived from the
  diligence scores.

**Framework alignment:** PRI Due Diligence Questionnaire for PE (2023) and SASB Materiality Map are
cited as the methodology basis but neither the SASB topic taxonomy nor a materiality-weighted
scoring formula is implemented; the module functions as a generic diligence-tracker dashboard rather
than a SASB-calibrated ESG diligence tool.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Score a PE target's ESG performance against sector-specific material topics to (a) surface
diligence red flags pre-close and (b) seed a 100-day value-creation plan — the decision context the
guide's `userInteraction` list describes.

### 8.2 Conceptual approach
**SASB Materiality Map**-driven topic scoring: each GICS/SASB sector has a published list of
financially-material sustainability topics (5–10 typically); score management performance on each,
weight by the topic's financial-impact potential for that sector, and apply a severity multiplier
for topics with an active controversy — this mirrors how **Moody's ESG Solutions** and **ISS ESG**
structure sector-materiality-weighted corporate ratings, and how **PRI's PE DDQ** structures its
sector-tailored due-diligence question sets.

### 8.3 Mathematical specification

```
EMS = Σ_topic w_topic × TopicScore_topic × SeverityMultiplier_topic
w_topic:  from SASB Materiality Map sector matrix, normalised to Σw=1 per sector
TopicScore: 0-100, management-quality rating on each material topic (interview + document review)
SeverityMultiplier: 1.0 baseline; 0.5x if active/unresolved controversy on that topic; 1.0 otherwise
```

| Parameter | Calibration source |
|---|---|
| SASB material topic list + weights | SASB Materiality Map (sector-specific, published, free) |
| Severity multiplier | Internal DD policy calibrated to controversy severity taxonomy (RepRisk severity scale: low/medium/high/severe) |
| Topic scores | Structured interview + document review, scored 0–100 by DD team |

### 8.4 Data requirements
Target sector (GICS→SASB mapping), management interview scorecards per material topic, controversy
screen (RepRisk/Sustainalytics) for severity multiplier inputs. None currently ingested; sector
mapping could reuse the platform's existing GICS taxonomy used elsewhere.

### 8.5 Validation & benchmarking plan
Compare EMS distribution against realised value-creation outcomes (MOIC uplift) for closed deals to
validate the model has predictive signal, per the guide's cited McKinsey PE ESG value-creation
research; sanity-check topic weights against SASB's published financial-materiality rationale.

### 8.6 Limitations & model risk
SASB topic scores from a single DD interview cycle carry rater-subjectivity risk — recommend
multi-rater scoring with documented rationale per topic, and periodic (annual) re-scoring for
portfolio-company monitoring rather than a one-time pre-acquisition snapshot.

## 9 · Future Evolution

### 9.1 Evolution A — Build the SASB-weighted materiality score (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag: the guide describes an ESG Materiality Score (`EMS = Σ wᵢ × TopicScoreᵢ × SeverityMultiplierᵢ`) using SASB sector-material topic weighting, but `score`/`envScore`/`socScore`/`govScore` are four *statistically independent* `sr()` draws — the overall `score` is not a weighted function of the E/S/G sub-scores, and no SASB topic list, weight, or severity multiplier exists anywhere. The generic `m1`–`m6` fields are unlabelled placeholders. Evolution A builds the SASB-materiality engine the module is named for as its first real vertical.

**How.** (1) Encode the SASB Materiality Map (public — the SASB standards by sector named in §5): for a target's sector, the material ESG topics with their financial-impact weights. (2) Implement `EMS = Σ wᵢ × TopicScoreᵢ × SeverityMultiplierᵢ` where topic scores are analyst-entered (from the management-interview/document-review workflow §1 describes) and severity multipliers reflect controversy findings — so the overall score is a genuine weighted composite of E/S/G, not four unrelated randoms. (3) The 100-day value-creation plan (§1) becomes a structured output keyed to the lowest-scoring material topics, replacing the generic placeholders.

**Prerequisites.** SASB Materiality Map ingestion (public); an analyst-entry UI for topic scores (replacing the seeded generation); severity data from controversy screening. Remove `sr()`. **Acceptance:** EMS reproduces from visible SASB-weighted topic scores; changing a material topic's score moves EMS predictably; the value-creation plan targets the actual low-scoring topics.

### 9.2 Evolution B — ESG-diligence copilot for deal teams (LLM tier 1 → 2)

**What.** A copilot for the PE diligence workflow §1 describes: "what are the SASB-material ESG topics for a food-processing target?", "score this target's governance from the diligence notes", "draft a 100-day ESG value-creation plan for the weakest topics" — grounded in the SASB Materiality Map and the PRI PE DDQ / IFC Performance Standards references named in §5.

**How.** Tier 1 works on the SASB reference immediately: the copilot answers materiality-mapping questions (which topics matter for a sector) with citations, using the PRI DDQ structure to guide the diligence process. Tier 2, post-Evolution-A: the copilot scores topics from analyst-provided diligence notes via the EMS engine (tool call), and drafts the 100-day plan keyed to the lowest-scoring material topics, with the fabrication validator matching every score to a tool response. Critically, the copilot must not present ESG scores until Evolution A — narrating the current independent random `envScore`/`socScore`/`govScore` as a diligence assessment would fabricate risk findings for a live deal.

**Prerequisites.** Tier 1 on SASB reference; scoring needs Evolution A's EMS engine and analyst-entered topic data. **Acceptance:** materiality-map answers cite SASB by sector; EMS scores (post-Evolution-A) trace to tool calls over real diligence inputs; the copilot refuses to score targets from the current seeded data.