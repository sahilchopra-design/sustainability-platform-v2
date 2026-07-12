## 9 · Future Evolution

### 9.1 Evolution A — Real project scoring from registry data instead of PRNG ranges (analytics ladder: rung 1 → 3)

**What.** §7 is precise about what is real and what is not: the requirement checklists carry accurate standard references (CDM EB TOOL01 v8, VCS v4 §3.7 AFOLU buffer, GS4GG P&R §5.1), but every score for the 50 synthetic projects is drawn from `sr()` in fixed ranges (`cdm = 40 + sr()·55` etc.), and the CCP label, CORSIA flag, and price `premiumFactor` all derive from those fabricated scores. Evolution A replaces the PRNG layer with criterion-level assessment of real registry projects.

**How.** (1) Build a first backend vertical `api/v1/routes/multi_standard.py` with `POST /assess` scoring a project against the already-encoded requirement rows (13 CDM, 8 GS4GG, etc.) as explicit criterion pass/fail/partial inputs — analyst-entered or pre-filled from the platform's Verra registry seed (migration 102 seeded real Verra projects; use them as the assessment universe). (2) `StandardScore = Σ w_criterion × CriterionScore / n` per §5, computed from those inputs, never sampled. (3) Replace the invented CCP heuristic (`gs≥72 && vcs≥75 && cdm≥70`) with the ICVCM's actual assessment status where published — ICVCM CCP-approval decisions are public and enumerable in a `ref_icvcm_decisions` table.

**Prerequisites.** Verra seed data coverage check (methodology + status fields needed per criterion); the price-premium factors (0.25 SDG / 0.08 CORSIA / 0.20 CCP) must either cite a market study or be labelled illustrative. **Acceptance:** a seeded Verra project's scorecard shows per-criterion evidence, not range-bounded randoms; no `sr()` call remains in any score path.

### 9.2 Evolution B — Carbon-credit due-diligence copilot citing standard texts (LLM tier 1 → 2)

**What.** A copilot for credit buyers: "does this project meet CORSIA eligibility?", "which VCS v4 clauses does an AFOLU project have to satisfy?", "explain why its CCP label is N." Grounded in this module's genuinely accurate asset — the requirement checklists with their real clause references — plus the ICVCM/VCS/GS4GG/CORSIA reference documents named in §5, so answers quote the applicable clause rather than paraphrasing carbon-market lore.

**How.** Tier 1: embed the requirement rows and the named standard documents as the module corpus (roadmap `llm_corpus_chunks` pattern); the copilot answers standard-interpretation questions with clause citations and explains scorecards by walking the criterion table. Tier 2, after Evolution A: tool calls to `POST /assess` for what-ifs ("if the buffer contribution rises to 25%, does VCS alignment change?"), with the fabrication validator matching quoted scores to tool outputs. Refusal path for legal advice ("will this survive an ICVCM appeal?") and for the 50 legacy synthetic projects until they are replaced.

**Prerequisites.** Evolution A for any score-explaining behaviour — today's scores are PRNG output and must not be narrated as assessments; standard-text ingestion rights check (ICMA/ICVCM PDFs are public, Verra terms permit reference use). **Acceptance:** every clause citation resolves to a real section of the named standard; score explanations only occur for assessed (non-synthetic) projects.
