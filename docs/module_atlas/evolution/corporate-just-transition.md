## 9 · Future Evolution

### 9.1 Evolution A — Build the four-pillar JTFF/ILO scoring engine (analytics ladder: rung 1 → 2)

**What.** §7's mismatch flag: EP-DI3's headline `justTransitionScore` is a single
seeded number (`round(20 + sr(i·11)·75)`) — the guide's four-pillar decomposition
(`JTScore = w_W·Worker + w_C·Community + w_SC·SupplyChain + w_G·Governance`) does not
exist, so the score's weights "cannot be inspected or defended" (§7.6). All 55
corporates carry real names with fabricated metrics; sector/country are round-robin;
the carbon-price and retraining sliders scale outputs with no model rationale.
Evolution A builds the pillar engine: assessable indicators, evidence-based scoring
on the commitment-vs-action spectrum, defensible aggregation.

**How.** (1) Indicator schema per pillar, straight from the guide's own formula:
Worker = mean of reskilling commitment, income protection, pension security,
collective bargaining — each scored 0–4 on a documented disclosure→verified-outcome
ladder (the CA100+ Just Transition indicator provides the public rubric to adapt);
Community, SupplyChain, Governance likewise. (2) Assessment input: manual analyst
scoring first (honest and useful), with disclosure-extraction assistance deferred to
Evolution B; scores persist to a `jt_assessments` table — the module's first
vertical. (3) The composite becomes `Σ w_p × pillar` with published default weights
and a sensitivity toggle. (4) Purge the seeded universe; delete the free-floating
sliders or re-derive them (retraining budget becomes an assessed data point, not a
multiplier).

**Prerequisites (hard).** PRNG purge including the real-name/seeded-score
combination; the scoring rubric itself is expert work — a documented, versioned
rubric must exist before assessments start. **Acceptance:** a scored company's
JTScore decomposes into four inspectable pillars with per-indicator evidence notes;
re-weighting recomputes transparently; zero `sr()` calls feed displayed metrics.

### 9.2 Evolution B — Disclosure-to-rubric assessment assistant (LLM tier 2)

**What.** Pillar scoring is reading work: just-transition evidence lives in annual
reports, climate transition plans, and union agreements. Evolution B accelerates the
Evolution A workflow: upload a company's transition plan and the assistant proposes
per-indicator scores with quoted evidence passages ("reskilling commitment: score 2 —
plan commits €50M but names no beneficiary count or timeline, p.34"), which the
analyst confirms or overrides — human-in-the-loop scoring that builds the assessment
corpus. Portfolio users then get the CA100+-aligned scorecard the overview promises,
grounded in confirmed assessments.

**How.** Tier-2 pattern with a document pipeline: extraction prompts structured per
the Evolution A rubric (one prompt per pillar, outputs constrained to the 0–4 ladder
plus evidence spans); proposals persist as drafts pending confirmation, mirroring the
roadmap's gated-mutation contract. Grounding corpus: the ILO 2015 guidelines, JTFF
principles, and CA100+ indicator definitions (public texts, refdata additions). The
assistant never scores without a quotable passage — no-evidence indicators return
"not disclosed", which is itself the correct commitment-spectrum finding.

**Prerequisites (hard).** Evolution A's rubric and persistence; document upload
path. **Acceptance:** on 3 public transition plans, proposed scores match an expert's
independent scoring within ±1 on ≥80% of indicators; every proposal carries a page-
cited passage; unconfirmed proposals never enter the displayed scorecard.
