## 9 · Future Evolution

### 9.1 Evolution A — Build the missing ICVCM quality-scoring engine (analytics ladder: rung 1 → 2)

**What.** The §7 mismatch flag is unambiguous: the guide describes a
`QualityScore = f(Additionality, Permanence, MRV_Rigor, CobenefitCount)` engine with a
portfolio-weighted score, an ICVCM CCP ≥60 screen, and a methodology HHI — and **none
of it exists in code**. The page is volume rollups over 40 synthetic projects plus a
crude `area × familyYield × price` quick calculator. Evolution A implements the scoring
model the atlas §8 already specifies: per-methodology scores on the four dimensions
(0–30/0–25/0–25/0–20), volume-weighted portfolio score, CCP pass-rate, and HHI
concentration — computed over the CarbonCreditContext bus so the 21 downstream cc-*
methodology engines feed it real per-engine outputs rather than seeds.

**How.** (1) Score rubric as a data table (21 methodologies × 4 dimensions) with
citations to ICVCM CCP 2023 assessments, not invented weights. (2)
`portfolioScore = Σ w_i × QualityScore_i` and `HHI = Σ share_i²` as pure functions,
unit-tested. (3) Quality Matrix tab switches from decorative to computed; the CCP
screen filters the live project list.

**Prerequisites.** The mismatch flag governs sequencing — the scoring engine must land
before any copilot narrates "quality" on this page; rubric sources documented per §8.
**Acceptance:** removing a methodology from the portfolio moves both the weighted score
and HHI in the arithmetically-correct direction; a methodology scored 58 fails the CCP
screen visibly.

### 9.2 Evolution B — Carbon desk orchestrator entry point (LLM tier 3)

**What.** This hub is the natural desk-orchestration surface for the whole cc-* family:
it already aggregates 21 methodology engines over the CarbonCreditContext bus. Evolution
B makes it the tier-3 router — "screen our book for CCP-failing exposure and propose
replacement supply" decomposes into quality-screen (this module, post-Evolution A) →
per-methodology deep-dives (cc-redd-wetlands-hub, cc-soil-carbon, etc.) → retirement
planning (cc-retirement-workflow), synthesized into one memo.

**How.** Routing knowledge from `module_tags.json` plus the atlas interconnection graph
(§6 lists this hub's blast-radius edges to the cc-* family); each sub-question answered
by that module's own copilot/tools, never by the orchestrator improvising; output
rendered through the report-studio layer per the tier-3 pattern.

**Prerequisites (hard).** Evolution A first — orchestrating over a quality score that
does not exist would be narrating fiction; sibling cc-* modules need at least tier-1
copilots. **Acceptance:** a desk query produces a memo where every quality figure
traces to the scoring engine and every methodology fact to the owning module's corpus;
the orchestrator refuses portfolio-optimization asks until a real optimizer exists.
