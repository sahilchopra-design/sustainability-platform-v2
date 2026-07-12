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
