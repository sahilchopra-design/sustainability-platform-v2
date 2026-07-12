# AI Engagement Analytics
**Module ID:** `ai-engagement` · **Route:** `/ai-engagement` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
AI-powered stakeholder engagement platform that analyses sentiment across investor calls, ESG questionnaire responses, and social media channels using NLP and transformer models. Tracks response rates, sentiment trends, and engagement effectiveness by stakeholder cohort. Provides real-time alerts on emerging ESG controversies and engagement escalation triggers.

> **Business value:** AI-driven engagement analytics shift stakeholder management from reactive to predictive by surfacing sentiment deterioration and controversy signals weeks before they appear in formal complaints or press coverage. Engagement index scores provide auditable evidence for PRI Active Ownership reporting and support escalation decisions in stewardship programs.

**How an analyst works this module:**
- Connect data sources: earnings calls, questionnaire responses, social feeds
- Dashboard shows engagement index by stakeholder cohort
- Sentiment Trend tab plots weekly sentiment scores per company
- Controversy Tracker surfaces alerts with source links and severity
- Response Tracking tab shows outstanding engagements and follow-up deadlines
- Export engagement log for GRI 2-29 disclosure

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `COLORS`, `DEFAULT_RULES`, `KpiCard`, `LS_ENG`, `LS_PORT`, `LS_STEW`, `PRIORITY_COLOR`, `PRIORITY_SCORE`, `Section`, `SortIcon`, `URGENCY_COLOR`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---';` |
| `pct` | `(n) => typeof n === 'number' ? `${n.toFixed(1)}%` : '---';` |
| `sRand` | `(n) => { let x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };` |
| `clamp` | `(v, lo, hi) => Math.max(lo, Math.min(hi, v));` |
| `percentile` | `(arr, p) => { const s = [...arr].sort((a, b) => a - b); return s[Math.floor(s.length * p / 100)] \|\| 0; };` |
| `sectorAvgGHG` | `sectorPeers.length ? Math.round(sectorPeers.reduce((s, p) => s + (p.ghg_intensity_tco2e_per_mn \|\| 0), 0) / sectorPeers.length) : 0;` |
| `rules` | `useMemo(() => { return DEFAULT_RULES.map(r => ({ ...r, enabled: ruleOverrides[r.id]?.enabled !== undefined ? ruleOverrides[r.id].enabled : r.enabled, priority: ruleOverrides[r.id]?.priority \|\| r.priority }));` |
| `holdings` | `useMemo(() => { if (!portfolioRaw.length) return GLOBAL_COMPANY_MASTER.slice(0, 80).map((c, i) => enrichEng(c, i));` |
| `scored` | `useMemo(() => { return holdings.map((h, i) => { const triggered = rules.filter(r => r.enabled && evalCondition(r.condition, h, holdings));` |
| `totalScore` | `triggered.reduce((s, r) => s + (PRIORITY_SCORE[r.priority] \|\| 0), 0);` |
| `topAction` | `triggered.sort((a, b) => (PRIORITY_SCORE[b.priority] \|\| 0) - (PRIORITY_SCORE[a.priority] \|\| 0))[0]?.action \|\| 'No action';` |
| `topCategory` | `triggered[0]?.category \|\| '---';` |
| `avgScore` | `needsEngagement.length ? (needsEngagement.reduce((s, c) => s + c.totalScore, 0) / needsEngagement.length).toFixed(1) : '0';` |
| `topIssue` | `Object.entries(triggerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] \|\| '---';` |
| `rows` | `sortedScored.map(c => `"${c.company_name}","${c.sector}",${c.totalScore},"${c.urgency}",${c.triggered.length},"${c.topAction}","${c.topCategory}"`).join('\n');` |
| `blob` | `new Blob([header + rows], { type: 'text/csv' });` |
| `letters` | `needsEngagement.slice(0, 30).map(c => {` |
| `effectivenessData` | `useMemo(() => { return ['Climate', 'ESG', 'Disclosure', 'Governance', 'Social', 'Nature'].map((cat, i) => ({ category: cat, engaged: Math.round(10 + sRand(i * 7 + 1) * 30), improved: Math.round(3 + sRand(i * 7 + 2) * 15), rate: Math.round(20 + sRand(i * 7 + 3) * 50), }));` |
| `outcome` | `outcomes[Math.floor(sRand(s) * outcomes.length)];` |
| `esgChange` | `Math.round((sRand(s + 1) - 0.3) * 15);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `DEFAULT_RULES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Engagement Response Rate | — | Platform CRM | Percentage of stakeholders who responded to engagement outreach in the period |
| Avg Sentiment Score | `Mean softmax class probability` | NLP model output | Portfolio-level average sentiment across all ingested engagement text |
| Controversy Alerts (30d) | — | News/social NLP | Number of negative ESG controversy signals detected in the last 30 days |
- **Earnings call transcripts / survey responses** → Tokenise and pass through fine-tuned BERT model for sentiment classification → **Sentiment scores per stakeholder interaction with controversy flags**
- **Social media and news feeds** → NER extracts company mentions; classify context sentiment → **Real-time controversy alert feed with severity ratings**

## 5 · Intermediate Transformation Logic
**Methodology:** Transformer-based NLP sentiment scoring
**Headline formula:** `Sentiment_score = softmax(W × h_CLS + b); Engagement_index = Response_rate × avg(Sentiment_score)`

A fine-tuned BERT-family model classifies text into positive/neutral/negative sentiment with confidence scores. Engagement index combines response rate with weighted sentiment to capture quality as well as quantity of engagement. Controversy alerts use named entity recognition to surface company mentions in negative ESG contexts.

**Standards:** ['GRI 2-29 Stakeholder Engagement', 'SASB Engagement Standards', 'ISO 14064-3']
**Reference documents:** GRI 2-29 Stakeholder Engagement Disclosure; SASB Engagement and Communication Standards; PRI Active Ownership 2.0 Framework

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes **transformer-based NLP sentiment
> scoring** (`Sentiment = softmax(W·h_CLS + b)`) over investor calls, ESG questionnaires and
> social media, with a `Engagement_index = Response_rate × avg(Sentiment)`. **None of that
> exists.** The code is a **deterministic rules-based stewardship engine**: 20 engagement rules
> are evaluated against portfolio holdings to trigger prioritised engagements and auto-generate
> letters. No BERT, no softmax, no sentiment, no response-rate tracking. Sections document the
> code as written.

### 7.1 What the module computes

For each of up to 80 portfolio holdings (loaded from `localStorage` portfolio, else the first 80
of `GLOBAL_COMPANY_MASTER`), the engine evaluates 20 engagement rules and scores the company:

```
triggered   = rules.filter(r => r.enabled && evalCondition(r.condition, company, peers))
totalScore  = Σ PRIORITY_SCORE[r.priority]        // Critical 4 · High 3 · Medium 2 · Low 1
urgency     = 'Immediate' if totalScore > 10 · 'Quarter' if > 5 · else 'Annual'
topAction   = action of the highest-priority triggered rule
```

Only companies with ≥1 triggered rule enter the `needsEngagement` register.

### 7.2 Parameterisation — the 20-rule library

`DEFAULT_RULES` spans 6 categories (weights = trigger counts): Climate (4), ESG (3),
Disclosure (3), Governance (3), Social (4), Nature (3). Each rule has a trigger description,
a `condition` key, priority, an escalation ladder (e.g. "Letter > Meeting > Proxy vote"), a
target KPI and a full **letter template** with interpolation placeholders. Examples:

| Rule | Trigger | Priority | Condition logic |
|---|---|---|---|
| R03 | GHG intensity > 500 tCO₂e/$M | Critical | `ghg_intensity > 500` (deterministic) |
| R01 | No SBTi commitment | High | `!sbti_committed && sRand > 0.35` |
| R02 | Net-zero absent or > 2060 | High | `!target_year \|\| target_year > 2060` |
| R05 | ESG score < 40 | Medium | `esg_score < 40` (deterministic) |
| R06 | ESG bottom quartile of sector | Medium | `esg_score < 25th-pctile(sector peers)` |
| R18 | No deforestation policy (high-risk sector) | High | sector ∈ {Materials, Consumer Staples, Energy} && `sRand > 0.5` |

**Provenance of conditions:** some are *data-driven* off enriched company fields
(`ghg_high`, `transition_high`, `esg_low`, `esg_bottom_q`, `scope_missing`, `data_quality_low`,
`netzero`); the rest are **seeded coin-flips** — `evalCondition` calls
`sRand(hash(company_name) + offset) > threshold`, a deterministic-per-company pseudo-random
gate (e.g. `no_tcfd` fires when `sRand(s+203) > 0.55`). So a company's flag set is stable across
renders but partly synthetic.

### 7.3 Calculation walkthrough

1. **Enrichment (`enrichEng`):** any missing company field is filled from the PRNG
   `sRand(s)=frac(sin(s+1)×10⁴)` seeded on the DJB2 hash of the company name — e.g. `esg_score =
   20 + sRand·70`, `ghg_intensity = 5 + sRand·800`, `carbon_neutral_target_year` present with
   p≈0.6.
2. **Scoring:** each enabled rule's condition is tested; priority points summed to `totalScore`;
   urgency bucketed at the 10/5 thresholds.
3. **KPIs:** count needing engagement, count with any Critical/High rule, `avgScore` over the
   register, and `topIssue` = most frequently triggered trigger across the portfolio.
4. **Letter generation (`fillTemplate`):** the selected rule's template is interpolated with the
   company's live fields, including a computed `[SECTOR_AVG]` GHG intensity (mean over sector
   peers) so the letter cites a real peer benchmark.
5. **Persistence:** rule enable/priority overrides and engagement history are saved to
   `localStorage` (`ra_engagement_rules_v1`, `ra_stewardship_v1`).

### 7.4 Worked example — company scoring

A Materials company with `ghg_intensity = 620`, `esg_score = 35`, `transition_risk = 74`,
`scope2_mt = 0`, and (from its seeded gates) no-TCFD and deforestation flags set:

| Triggered rule | Priority | Points |
|---|---|---|
| R03 GHG > 500 | Critical | 4 |
| R04 transition risk > 70 | High | 3 |
| R10 No TCFD | High | 3 |
| R05 ESG < 40 | Medium | 2 |
| R08 Missing Scope 2 | Medium | 2 |
| R18 No deforestation policy | High | 3 |
| **totalScore** | | **17** |

17 > 10 → urgency **Immediate**; `topAction` = R03's "Urgent decarbonization engagement"
(highest priority). The R03 letter interpolates the company's 620 GHG intensity against its
sector-average benchmark.

### 7.5 Data provenance & limitations

- **Rule *logic* is real and professionally drafted** (SBTi, net-zero 2050/interim-42%, TCFD
  four pillars, TNFD, NDPE deforestation, modern slavery) — the letter templates are genuinely
  usable stewardship correspondence.
- **Company data is largely synthetic:** absent fields are PRNG-filled, and ~11 of 20 conditions
  are seeded coin-flips rather than data tests, so trigger sets are plausible-looking but not
  fully evidence-based.
- **No sentiment/NLP anywhere:** the guide's transformer sentiment scoring and engagement index
  are absent; there is no response-rate tracking, no stakeholder-cohort analysis, no social-media
  ingestion.
- Priority weights (4/3/2/1) and urgency thresholds (10/5) are platform choices without external
  citation; the escalation ladders are illustrative, not enforced workflow.

### 7.6 Framework alignment

- **PRI Active Ownership 2.0 / stewardship codes (UK Stewardship Code, ICGN)** — the
  trigger→engage→escalate model (letter → meeting → proxy vote → filing/divestment) mirrors
  standard escalation frameworks for investor stewardship.
- **SBTi** — R01/R02 encode SBTi commitment and the net-zero-by-2050 / interim-2030 (−42%)
  ambition tests directly.
- **TCFD / TNFD** — R10/R20 request four-pillar TCFD and TNFD-aligned nature disclosure.
- **GRI / SASB** — R07 requests GRI/SASB-aligned sustainability reporting; the guide cites
  GRI 2-29 stakeholder engagement, which frames the engagement register even though the
  quantitative engagement index is not computed.
- **CDP** — R08's escalation ends in a "CDP request", reflecting real disclosure-campaign
  practice. The engine's value is the codified rule library, not an AI model.

## 9 · Future Evolution

### 9.1 Evolution A — Evidence-driven rule engine on real holdings (analytics ladder: rung 1 → 2)

**What.** Per the §7 mismatch flag, the guide's transformer sentiment scoring
(`Sentiment = softmax(W·h_CLS + b)`, `Engagement_index = Response_rate × avg(Sentiment)`) does
**not exist** — the module is a deterministic 20-rule stewardship engine, and its real value is
the professionally-drafted rule library and letter templates (SBTi, net-zero/interim-42%, TCFD,
TNFD, NDPE deforestation). Its honest weakness (§7.5): ~11 of 20 rule conditions are seeded
coin-flips (`sRand(hash(name)+offset) > threshold`) and missing company fields are PRNG-filled,
so trigger sets look evidence-based but aren't. Evolution A moves the engine backend, runs rules
against **real holdings data** (the platform has GLEIF entity resolution, PCAF emissions, ESG
scores), and replaces every coin-flip condition with an actual data test — no SBTi commitment
becomes a real registry lookup, not `sRand > 0.35`.

**How.** `POST /api/v1/engagement/score-portfolio` (holdings → per-company triggered rules,
totalScore, urgency, topAction) with the priority scoring (Critical 4/High 3/Medium 2/Low 1)
and urgency thresholds (10/5) preserved; `GET /ref/engagement-rules` serves the 20-rule library.
Rung 2: sensitivity — how the engagement register shifts under different rule enable/priority
overrides and sector-peer benchmark definitions (the `[SECTOR_AVG]` GHG benchmark is already
real). The sentiment layer the guide describes could be added later by consuming the ai-sentiment
module's output rather than re-implementing NLP.

**Prerequisites (hard).** Purge the `sRand()` coin-flip conditions and PRNG field-fill per the
no-fabricated-random guardrail; wire to real emissions/ESG/SBTi data sources. **Acceptance:**
the §7.4 worked example (Materials company, totalScore 17 → Immediate) reproduces from real
inputs; toggling a company's actual SBTi status changes whether R01 fires — impossible with the
current coin-flip.

### 9.2 Evolution B — Stewardship copilot that drafts and prioritises letters (LLM tier 2)

**What.** The module already auto-generates stewardship letters from templates — the LLM
evolution makes them genuinely bespoke: a copilot that answers "which holdings need engagement
this quarter and why?" by tool-calling the score engine, then drafts a tailored letter for a
chosen company that interpolates its real triggered rules, GHG intensity vs `[SECTOR_AVG]`
benchmark, and escalation ladder (Letter → Meeting → Proxy vote → filing). It fits GRI 2-29
stakeholder-engagement disclosure and PRI Active Ownership reporting — the frameworks §7.6 cites.

**How.** Tool schema over Evolution A's `POST /score-portfolio` and the rule reference; the LLM
composes letter prose but every quantitative claim (the company's 620 GHG intensity, the sector
average) is a tool-output value the no-fabrication validator checks. Draft letters land as
suggestions with the triggered-rule evidence attached; a human approves before send. The engine
scores and selects; the LLM only writes.

**Prerequisites.** Evolution A (real triggers, so the copilot narrates real evidence not
coin-flips); Atlas corpus embedded (roadmap D3). **Acceptance:** every figure in a drafted letter
traces to a `/score-portfolio` tool output; a letter for a company with no triggered rules is
refused ("no engagement basis"), and the copilot cites which rules drove any letter it drafts.