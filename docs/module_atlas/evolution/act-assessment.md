## 9 · Future Evolution

### 9.1 Evolution A — Sector-weighted ACT engine with real pathway-gap math (analytics ladder: rung 1 → 2)

**What.** Today the module is tier-B frontend-only: 100 PRNG-generated companies
(`sr(seed)` draws for every dimension score, emission figure and CDP grade), one generic
6-dimension weighting applied to all 15 sectors, and — per the §7 mismatch flag — none of
the pathway-gap logic (`Actual_intensity − Benchmark_intensity(t)`) the guide promises.
Evolution A builds the first backend vertical: an `act_assessments` table holding real
company inputs, **sector-specific indicator sets and weights** as the ACT v3 methodology
actually prescribes (e.g. Electric Utilities weighting sold-product intensity via SDA
alignment), and a genuine pathway-gap computation against stored IEA NZE sector
intensity benchmarks.

**How.** New route pair `POST /api/v1/act/score` and `GET /api/v1/act/benchmarks/{sector}`;
the engine ports the page's `weighted = Σ(dimScore·w)/100` composite and A–E thresholds
(16/12/8/4), then adds per-sector weight tables and a benchmark-intensity interpolation for
the pathway tab. Rung 2 lands via scenario overlays: gap under Current Policies vs NZ2050
trajectories, matching what the guide already describes. Credibility flags become **derived
from** inputs (e.g. "No Internal Carbon Price" only when the field is absent), closing the
documented internal-consistency gap where flags are drawn independently of scores.

**Prerequisites.** IEA/SDA sector benchmark curves seeded into a reference table with
citations; the synthetic 100-company book either replaced by user-entered assessments or
clearly labelled demo fixtures. **Acceptance:** the §7.4 worked example still yields 11.25 →
grade C under generic weights; two sectors with different weight tables produce different
composites from identical dimension scores; a company with intensity below its sector
benchmark shows a negative pathway gap.

### 9.2 Evolution B — Transition-credibility copilot with flag rationale (LLM tier 1)

**What.** A chat panel on the ACT page answering "why is this company grade C?", "which
single dimension improvement moves it to B?", and "what does the Greenwashing Risk flag
mean here?" grounded in the page's computed state — the live `weighted` score, the
improvement-plan `impact = (20 − dimScore) × weight/100` ranking, and the flag rubric with
severities. The copilot must disclose that companies are currently synthetic demo entities
and that grade trends are a seeded random walk, not observed migrations — never presenting
the migration matrix as market history.

**How.** Tier-1 pattern from the roadmap: this Atlas page (§7.1 scoring formula, §7.2 flag
rubric, §7.5 limitations) embedded as the module corpus in `llm_corpus_chunks`; page state
(selected company's dimScores, flags, peer rank) passed as structured context; served via
`POST /api/v1/copilot/act-assessment/ask` with the mandatory refusal path for questions
outside scope (e.g. "what is this company's real CDP score?"). After Evolution A, the same
panel graduates to tier 2 by tool-calling `POST /act/score` for slider what-ifs in natural
language ("set Material Investment to 15 and re-grade").

**Prerequisites.** Atlas corpus embedded (roadmap D3); the guide↔code mismatch note must be
in the grounding corpus so the copilot describes the 0–20/6-dimension implementation, not
the guide's phantom 0–1/10-indicator scheme. **Acceptance:** every numeric cited traces to
page state or an Atlas section; asking for a company's 1.5°C pathway gap before Evolution A
ships produces a refusal stating the module does not compute it.
