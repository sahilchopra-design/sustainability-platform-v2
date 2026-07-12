## 9 · Future Evolution

### 9.1 Evolution A — Persist engagements server-side and compute the EER the guide promises (analytics ladder: rung 1 → 3)

**What.** This is the most legitimate of the three stewardship modules: it is a genuine CRUD engagement tracker with 17 hand-authored real-company records (Exxon, Shell, BP, Apple, Rio Tinto), add/edit/delete forms, and localStorage persistence — once a user edits, the data is genuinely theirs. But §7 flags that the guide's headline `EER = Milestones Met / Total Milestones × 100` **is not computed** (no milestone counter exists), `escalationLevel` is set manually per record rather than derived from the backend's `_escalation_signal` (months since contact, engagement type, outcome), and the whole thing lives in localStorage rather than the server, despite a real `stewardship_engine` (shared, blast radius 2) sitting available — with `POST /engagement`, `/escalation`, `/portfolio` all recorded as **failed** in the sweep.

**How.** (1) Triage the three failing POST routes (shared with `stewardship-report-generator` — fix once, both benefit). (2) Move engagement records from localStorage to a server-side `stewardship_engagements` table so they persist across devices and feed the report generator. (3) Add a milestone sub-structure per engagement and compute the EER the guide specifies. (4) Derive `escalationLevel` from the engine's `_escalation_signal` (months-since-contact, type, outcome) so two users don't disagree on the same engagement's level. (5) Feed `POST /portfolio` for the UK Stewardship Code Principle 9 annual-report evidence the workflow targets.

**Prerequisites.** The three route failures are the gate; a persistence-layer migration for engagements. **Acceptance:** EER computes from milestone completion; escalation level derives from the signal function; engagements persist server-side and are consumable by the report generator.

### 9.2 Evolution B — Engagement-logging and escalation copilot (LLM tier 2)

**What.** A copilot that lowers the CRM friction: "log an engagement with Shell on coal phase-out, meeting held, outcome partial", "what escalation level does this warrant?", "which engagements are stalled and need escalation?" — the LLM structures the free-text log into the engagement schema, submits it via `POST /engagement`, and reads the engine's escalation signal to recommend next steps.

**How.** Tier-2 pattern: the engagement/escalation/portfolio endpoints become tools; the LLM converts natural-language notes into structured records (company, topic, type, outcome) the user confirms before submission, and narrates the engine's escalation recommendation — never inventing an EER or escalation level. Stalled-engagement detection reads the portfolio assessment. Every metric cited traces to a tool response.

**Prerequisites (hard).** Evolution A — the endpoints currently fail and escalation is a manual field, so there is no engine signal to narrate. **Acceptance:** every escalation recommendation cites the engine's signal inputs (months-since-contact, outcome); logged engagements round-trip through `POST /engagement`; the EER quoted matches the computed value.
