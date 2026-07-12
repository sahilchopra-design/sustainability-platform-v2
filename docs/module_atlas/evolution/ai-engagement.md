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
