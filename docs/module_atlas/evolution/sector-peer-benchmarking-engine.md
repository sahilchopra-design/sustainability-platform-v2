## 9 · Future Evolution

### 9.1 Evolution A — True quartile statistics on real peers (analytics ladder: rung 1 → 3)

**What.** Today this tier-B module fakes its own headline concept: "quartile ranking" is rank-position indexing on a fixed N=8 synthetic peer group (`q1 = peers[1].score`, correct only by coincidence at N=8), `sbtiValidated` is a deterministic `i % 3 === 0` pattern, and the §7.6 note shows the Convergence Trend cannot display divergence because every peer's trend rises by construction. Evolution A replaces the generated "Financials Co 1…8" roster with real fundamentals from `GLOBAL_COMPANY_MASTER` (the same source its sibling `sector-benchmarking` already uses) and implements a general interpolated percentile (`(n−1)×p` index) so quartile cutoffs are actual statistics at any peer-group size.

**How.** (1) Port the peer-group median/mean plumbing from `sector-benchmarking` and add `quantile(arr, p)` with linear interpolation; Q1/median/Q3 become computed values with the group size displayed. (2) Replace the platform-authored base/spread constants (§7.2) with observed per-sector score distributions once a numeric ESG composite exists per company. (3) Convergence analysis becomes honest: compute cross-sectional dispersion (IQR width) per quarter from historical snapshots and report whether it narrows, allowing "no convergence" as an outcome. (4) Link `sbtiValidated` to the SBTi target dashboard export (public CSV) instead of the modulo pattern.

**Prerequisites.** Historical score snapshots must be persisted (new table) before the convergence trend can be real; SBTi CSV refresh job. **Acceptance:** quartile cutoffs match `numpy.percentile` on the same array; a seeded declining peer renders a declining trend.

### 9.2 Evolution B — Best-practice explainer copilot (LLM tier 1)

**What.** The module's "Best Practice" tab claims to identify "what Q1 companies do differently" — a qualitative synthesis task the current code can only fake with static text. Evolution B makes this the copilot's job: given the computed Q1 cohort for a sector, it drafts the leader-characteristics narrative from grounded inputs (the cohort's actual `greenCapex`, SBTi status, lobbying scores from page state) and answers "why is this peer Q4?" by citing the specific metrics that placed it below the 25th percentile.

**How.** Tier-1 pattern: `POST /api/v1/copilot/sector-peer-benchmarking-engine/ask`, grounding corpus = this Atlas record plus live page state (selected sector, computed quartile stats). The narrative template is constrained: every characteristic claimed for the Q1 cohort must reference a field present in the peer data; no external company facts. Refusal path for peers outside the loaded sector.

**Prerequisites.** Evolution A first — narrating the current synthetic roster with its rigged upward trends would put authoritative language on fabricated dynamics; the copilot ships only once peers are real and quartiles computed. **Acceptance:** every metric in a best-practice narrative matches a value visible in the peer table; asking about "Financials Co 3" post-migration returns a refusal (no such entity).
