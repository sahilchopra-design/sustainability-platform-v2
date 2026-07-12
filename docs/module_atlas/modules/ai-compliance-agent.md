# AI Compliance Agent
**Module ID:** `ai-compliance-agent` · **Route:** `/ai-compliance-agent` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
AI-powered regulatory compliance monitoring agent. Continuously scans regulatory updates, maps them to platform modules, assesses disclosure gaps, and generates remediation recommendations.

> **Business value:** Regulatory ESG requirements are changing rapidly across 20+ jurisdictions. Manual tracking is error-prone and resource-intensive. The AI Compliance Agent provides always-on regulatory intelligence, ensuring no material requirement is missed and enabling proactive rather than reactive compliance.

**How an analyst works this module:**
- Regulatory Dashboard shows all active frameworks with compliance status
- Change Log shows recent regulatory updates with impact classification
- Gap Analyser identifies specific disclosure gaps per framework
- Remediation Planner generates action plan with deadlines
- AI Query allows natural language questions about regulatory requirements

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AGENT_LOG`, `Badge`, `COMPANIES`, `EFFORT_DAYS`, `EffortBadge`, `FINE_MULTIPLIERS`, `FRAMEWORKS`, `GAP_TEMPLATES`, `Pill`, `StatCard`, `TabAgentConsole`, `TabDeadlineRisk`, `TabEvidenceMapper`, `TabGapAnalysis`, `TabRemediationRoadmap`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `FRAMEWORKS` | 9 | `name`, `deadline`, `deadlineTs`, `articles`, `fineRisk`, `regulator`, `color` |
| `AGENT_LOG` | 21 | `action`, `finding`, `confidence` |
| `TABS` | 6 | `short` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `base` | `companyIdx * 100;` |
| `seed` | `base + fi * 7;` |
| `compPct` | `Math.round(35 + sr(seed) * 60);` |
| `totalGaps` | `FRAMEWORKS.reduce((a, fw) => a + (companyData[fw.id]?.total \|\| 0), 0);` |
| `criticalGaps` | `FRAMEWORKS.reduce((a, fw) => a + (companyData[fw.id]?.critical \|\| 0), 0);` |
| `mediumGaps` | `FRAMEWORKS.reduce((a, fw) => a + (companyData[fw.id]?.medium \|\| 0), 0);` |
| `compositeScore` | `Math.round(FRAMEWORKS.reduce((a, fw) => a + (companyData[fw.id]?.compliancePct \|\| 0), 0) / FRAMEWORKS.length);` |
| `totalDays` | `fwData.gaps.reduce((a, g) => a + EFFORT_DAYS[g.effort], 0);` |
| `TODAY_YR` | `2026 + 3 / 12; // April 2026` |
| `fwRisk` | `FRAMEWORKS.map((fw, i) => {` |
| `daysLeft` | `fw.deadline === 'Voluntary' ? 999 : Math.round((fw.deadlineTs - TODAY_YR) * 365);` |
| `exposure` | `Math.round(fine * (1 - pct / 100));` |
| `priority` | `(exposure * urgencyW) / totalDays;` |
| `timelineData` | `FRAMEWORKS.map(fw => ({` |
| `matrixData` | `fwRisk.map(fw => ({` |
| `exposureData` | `fwRisk.map(fw => ({ name: fw.name, exposure: Math.round(fw.exposure / 1e6 * 10) / 10 }));` |
| `leftPct` | `((fw.deadlineTs - 2023) / (2027 - 2023)) * 100;` |
| `todayPct` | `((TODAY_YR - 2023) / (2027 - 2023)) * 100;` |
| `allGaps` | `useMemo(() => FRAMEWORKS.flatMap(fw => (companyData[fw.id]?.gaps \|\| []).map(g => ({ ...g, fwName: fw.name, fwColor: fw.color, fwId: fw.id })) ), [companyData]);` |
| `evidenceStats` | `FRAMEWORKS.map(fw => {` |
| `qData` | `quarters.map(q => ({` |
| `compositeNow` | `Math.round(FRAMEWORKS.reduce((a, fw) => a + (companyData[fw.id]?.compliancePct \|\| 0), 0) / FRAMEWORKS.length);` |
| `compositeAfterQ1` | `Math.min(compositeNow + 12, 98);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `AGENT_LOG`, `COMPANIES`, `FRAMEWORKS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Frameworks Monitored | — | Platform | All major global ESG disclosure frameworks |
| Update Frequency | — | Automation | Automated regulatory horizon scanning |
| Gap Resolution Rate | — | Platform target | Percentage of identified gaps resolved before deadline |
- **Regulatory feeds** → NLP change detection → **Regulatory update log**
- **Update classification** → Impact assessment → **Affected modules and gaps**
- **Gap analysis** → Remediation recommendations → **Action plan with priorities**

## 5 · Intermediate Transformation Logic
**Methodology:** NLP regulatory change detection
**Headline formula:** `ComplianceGap = Required_disclosures - Completed_disclosures per framework`

Regulatory scanning: RSS feeds from EC, FCA, SEC, MAS, HKEX, APRA. NLP classifies as: new requirement, amendment, clarification, or repeal. Impact assessment: which platform modules and data fields are affected.

**Standards:** ['TCFD', 'ISSB S2', 'CSRD', 'SFDR', 'EU Taxonomy']
**Reference documents:** TCFD Recommendations; ISSB IFRS S1/S2; EFRAG ESRS Set 1; SFDR RTS; EU Taxonomy Delegated Acts

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ℹ️ The guide's headline formula `ComplianceGap = Required_disclosures − Completed_disclosures`
> is implemented in spirit — as a per-framework compliance percentage and gap register — but the
> "NLP regulatory change detection" and "RSS feeds from EC/FCA/SEC/MAS/HKEX/APRA" are **staged, not
> real**: the agent console replays a scripted 20-step log; no live feed or NLP model runs.

### 7.1 What the module computes

An "AI compliance agent" dashboard across 8 disclosure frameworks (CSRD/ESRS, ISSB S1+S2, TCFD,
SFDR, GRI, SEC Climate, TNFD, UK SDR) for 10 synthetic companies. For each company × framework
it produces a compliance %, a gap register, a fine-exposure estimate and a remediation-priority
ranking. Headline roll-up:

```
compositeScore = round( Σ_fw compliancePct_fw / 8 )      // mean compliance across frameworks
totalGaps      = Σ_fw gaps_fw ;  criticalGaps = Σ_fw critical_fw
```

### 7.2 Parameterisation — frameworks, gaps and multipliers

**Frameworks (`FRAMEWORKS`, 8):** each has an article count, deadline (+decimal `deadlineTs`),
`fineRisk` label and regulator, e.g. CSRD (42 articles, "€10M or 2% revenue", EFRAG/EC), SFDR
(18 articles, deadline 2023, ESMA/EBA), SEC Climate (9 articles, 2026, SEC).

**Gap templates (`GAP_TEMPLATES`):** hand-authored, genuinely detailed real-world gaps — 3–5
per framework with actual article references (ESRS E1-6 Scope 3, IFRS S2 para 29 transition
plan, TCFD Gov-a board oversight, SFDR Art. 4 PAI completeness, TNFD Req C/D nature
dependencies), plus severity, boilerplate "evidence" text, a specific recommendation and an
effort rating. These are the module's real content and are professionally accurate.

**Synthetic overlays** (`buildCompanyData`, seeded by `sr(s)=frac(sin(s+1)×10⁴)` on
`companyIdx×100 + fi×7`): `compliancePct = round(35 + sr·60)` (35–95%), and per-gap
`evidenceConfidence = 70 + sr·28`, `daysToDeadline = sr·400 − 50`, random owner function and
status. Severity counts (critical/medium/low) are tallied from the fixed templates.

**Cost/fine constants:**

| Framework | Fine multiplier | | Effort | Days |
|---|---|---|---|---|
| CSRD | €10M | | Low | 5 |
| SEC | €8M | | Medium | 15 |
| ISSB | €5M | | High | 30 |
| SFDR | €3M | | | |
| TCFD/TNFD/UK SDR | €2M/€1M/€2M | | | |
| GRI | €0.5M | | | |

### 7.3 Calculation walkthrough

1. **Agent console:** `startScan` steps through the scripted 20-line `AGENT_LOG` on a timer,
   each carrying a `confidence` — a UI performance of an agent, not a computation.
2. **Fine exposure:** `exposure_fw = fineMultiplier_fw × (1 − compliancePct_fw/100)` — linear
   in the compliance shortfall.
3. **Remediation priority:**
   ```
   urgencyW  = 3 if daysLeft<0 · 2 if <180 · else 1
   totalDays = Σ EFFORT_DAYS[gap.effort]
   priority  = (exposure × urgencyW) / totalDays
   ```
   frameworks sort descending by `priority` (high fine + near/overdue deadline + low remediation
   effort ranks first — the standard risk-adjusted triage heuristic).
4. **Roadmap:** gaps bucketed by quarter, effort-days summed per quarter;
   `compositeAfterQ1 = min(compositeNow + 12, 98)` — a hard-coded +12pt projected uplift.

### 7.4 Worked example — SFDR fine exposure and priority

Suppose a company's SFDR `compliancePct = 45%`, with 3 gaps of effort High/Medium/High and the
SFDR deadline already passed (daysLeft < 0):

| Step | Computation | Result |
|---|---|---|
| Fine exposure | 3,000,000 × (1 − 0.45) | **€1.65M** |
| Effort days | 30 + 15 + 30 | 75 |
| Urgency weight | daysLeft < 0 | 3 |
| Priority score | (1,650,000 × 3) / 75 | **66,000** |

A CSRD gap at 60% compliance, deadline >180 days out, 20 effort-days would score
`(10M×0.4×1)/20 = 200,000` — ranking above SFDR here. The ranking thus balances fine size
against urgency and remediation cost.

### 7.5 Data provenance & limitations

- **Compliance percentages, confidences, owners, statuses and deadlines are synthetic PRNG
  draws.** The gap *content* (article references, recommendations) is hand-authored and
  accurate, but which company has which gap-status is random.
- The agent log is a **scripted animation** — there is no live regulatory ingestion, no RSS
  parsing, no NLP classification of "new requirement / amendment / clarification / repeal" as
  the guide describes. The "confidence" values are decorative.
- Fine multipliers are single point estimates (e.g. CSRD €10M) and ignore the revenue-percentage
  alternative and jurisdictional variation; exposure is a linear haircut, not an expected-loss
  (no probability of enforcement).
- The +12pt Q1 improvement projection is a constant, not modelled from the remediation plan.

### 7.6 Framework alignment

- **CSRD/ESRS** — gap register uses real ESRS datapoint codes (E1-6, E1-9, S1-7, G1-1, E3-1)
  and correct standards (GHGP Corporate Value Chain for Scope 3); the "82 ESRS datapoints /
  12 topical standards" reference matches ESRS Set 1.
- **ISSB IFRS S1/S2** — cites S2 para 29 (transition plan), para 21 (opportunities), para 33
  (GHG metrics) and S1 para 12 (governance) — the actual paragraph numbering.
- **SFDR** — the 18 mandatory PAI indicators and Art. 4/8/9 structure are correctly referenced,
  including the specific missing PAIs (4, 7, 10, 11, 14, 18) and the ESMA RTS Annex I template.
- **TCFD** — the 11 recommended disclosures across four pillars; gaps reference Gov-a, Risk-a,
  Met-b as in the TCFD supplemental guidance.
- **TNFD** — LEAP methodology (Locate, Evaluate, Assess, Prepare) and biodiversity metrics
  (MSA.km², BFFI, ENCORE) are named accurately.
- **SEC Climate Rule / UK SDR** — 10-K Risk Factor quantification, Scope 1+2 assurance, and UK
  SDR's four sustainability labels are referenced correctly. The composite score and priority
  triage are platform heuristics layered on this accurate regulatory scaffolding.

## 9 · Future Evolution

### 9.1 Evolution A — Live regulatory ingestion replacing the scripted agent (analytics ladder: rung 1 → 3)

**What.** The module's real asset is its hand-authored `GAP_TEMPLATES` — professionally
accurate, article-referenced disclosure gaps (ESRS E1-6 Scope 3, IFRS S2 para 29, SFDR Art. 4
PAIs, TNFD Req C/D) across 8 frameworks. But §7.5 documents that the "AI agent" is theatre:
the 20-step `AGENT_LOG` is a scripted animation, there is no RSS ingestion or NLP
classification, and compliance percentages/confidences/owners are PRNG draws. Evolution A
makes the horizon-scanning real: an ingester pulling EFRAG/ESMA/SEC/FCA/EU regulatory feeds
(the platform already integrates Climate Policy Radar and a regulatory-calendar module),
classifying updates as new-requirement/amendment/clarification/repeal, and mapping them to
the affected frameworks and the platform's own module registry.

**How.** A `regulatory_updates` table populated by a feed ingester (following the 19-ingester
scaffold); `GET /api/v1/compliance-agent/updates` and `POST /gap-assessment` where compliance
% is computed from a company's actual disclosure evidence against required datapoints, not
`round(35 + sr·60)`. The existing priority heuristic (`priority = exposure × urgencyW /
totalDays`) and fine-exposure linear haircut are preserved but fed real inputs. Rung 3:
calibrate fine exposure against published enforcement actions rather than single point
multipliers, adding a probability-of-enforcement term.

**Prerequisites (hard).** Purge the `sr()`-driven compliance/confidence/owner draws per the
no-fabricated-random guardrail; wire to the real regulatory-calendar and Climate Policy Radar
sources (memory notes CPR has no live API — use its dataset export). **Acceptance:** the
change log reflects a real ingested regulatory update with a source URL and classification;
compliance % changes when a company's evidence changes; the +12pt Q1 projection is replaced by
a plan-derived estimate.

### 9.2 Evolution B — RAG-grounded regulatory Q&A over the gap corpus (LLM tier 1 → 2)

**What.** The page already advertises an "AI Query" tab for natural-language regulatory
questions — today non-functional. This is the platform's clearest tier-1 fit: a copilot
answering "what does ESRS E1-6 require for Scope 3?", "which of my frameworks have passed
deadlines?", and "what's my highest-priority gap and why?" grounded in the accurate
`GAP_TEMPLATES` corpus and the live compliance/priority state. The article-referenced gap
content is exactly the kind of curated corpus the roadmap's Tier-1 RAG explainer is built for.

**How.** Embed `GAP_TEMPLATES` (article refs, recommendations, effort ratings) plus this Atlas
page into `llm_corpus_chunks`; serve via `POST /api/v1/copilot/ai-compliance-agent/ask` with
mandatory citation of the framework/article and the standard refusal path ("this module does
not track that jurisdiction"). After Evolution A, graduate to tier 2 by tool-calling the
`/updates` and `/gap-assessment` endpoints so the copilot can answer "re-score my CSRD
compliance after uploading this evidence" from real engine output — with the no-fabrication
validator checking every percentage and fine figure against tool results.

**Prerequisites.** Atlas + gap corpus embedded (roadmap D3); the copilot must disclose that
compliance percentages are synthetic until Evolution A wires real evidence. **Acceptance:**
every regulatory citation resolves to a real article reference in the corpus; a fine-exposure
figure in an answer traces to `exposure = fineMultiplier × (1 − compliancePct/100)` with the
inputs shown; out-of-scope jurisdiction questions are refused.