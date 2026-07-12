## 9 · Future Evolution

### 9.1 Evolution A — Holdings-derived inputs, fixed PACTA scaler and TPT mislabel (analytics ladder: rung 2 → 3)

**What.** §7 rates this comparatively grounded: it computes the genuine budget-weighted ITR (`Σ wᵢ·ITRᵢ/Σwᵢ`) the guide specifies over curated sector weights/ITRs (Energy 3.8 hottest, Tech 1.8 coolest — realistic), plus a real TPT 3-pillar mean. Three flaws: the ITR/GFANZ/TPT/PACTA inputs are curated point values not derived from holdings; the PACTA alignment chart uses a nonstandard `sin`-based scaler (`factor = 0.8 + 0.2·(sin(si·2.3+n)+1)`) instead of real technology-pathway data; and a code-level factual defect — the GFANZ/TPT tab labels the TPT radar "Taskforce on Nature framework" when TPT is the UK **Transition Plan Taskforce**, unrelated to TNFD. Evolution A grounds the inputs and fixes both defects.

**How.** (1) Derive the sector ITRs and GFANZ/TPT/PACTA inputs from real holdings (`portfolios_pg` via the shared engine) rather than curated point values — the weighted-ITR aggregation is already correct, so this grounds its inputs. (2) Replace the `sin`-based PACTA scaler with real PACTA technology-pathway data: a sector's aligned/misaligned split from actual production-plan-vs-scenario data (the PACTA 2020 methodology named in §5), not a trigonometric proxy. (3) Fix the one-line TPT/TNFD mislabel — TPT is the Transition Plan Taskforce (Ambition/Action/Accountability pillars), not a nature framework. (4) The GFANZ commitment check keys to the real net-zero-alliance rosters (shared with `net-zero-commitment-tracker`).

**Prerequisites.** Real holdings + PACTA technology data (the missing input for the alignment chart); GFANZ roster data (shared); the weighted-ITR math is correct — keep it. Blast radius 48 — pin first. **Acceptance:** ITR/alignment inputs derive from real holdings; the PACTA chart uses real pathway data, not `sin`; the TPT label is corrected to Transition Plan Taskforce.

### 9.2 Evolution B — Transition-alignment & stewardship copilot (LLM tier 2)

**What.** A copilot for the workflow §1 describes: "what's my portfolio ITR and 2030 target gap?", "which holdings are GFANZ-committed?", "show TPT 3-pillar alignment", "which sectors are PACTA-misaligned and need engagement?" — executed against the (Evolution-A) alignment engine, decomposing ITR by sector and surfacing the engagement/escalation register (§1).

**How.** Tool calls to endpoints wrapping the weighted ITR, TPT pillar scores, and PACTA alignment; system prompt from this Atlas page's §5 and the GFANZ/UK TPT/PACTA/Paris references named in §5 — with the TPT framework correctly described (Transition Plan Taskforce, not TNFD). The engagement register drives stewardship recommendations (which misaligned holdings to escalate); the fabrication validator matches every ITR/pillar/alignment figure to a response. Provenance distinguishes real-holding-derived from curated inputs until Evolution A completes.

**Prerequisites.** Compute endpoints; Evolution A for holdings-derived inputs and the corrected PACTA/TPT treatment (the weighted-ITR works today on curated data). The copilot must not repeat the TPT/TNFD mislabel. **Acceptance:** every ITR/alignment figure traces to a tool call; TPT is described correctly; PACTA answers (post-Evolution-A) use real pathway data; engagement recommendations cite the misaligned sectors.
