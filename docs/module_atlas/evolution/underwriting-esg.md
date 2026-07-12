## 9 · Future Evolution

### 9.1 Evolution A — Weighted pillar scoring with enforced exclusion logic (analytics ladder: rung 1 → 2)

**What.** Fix the two documented gaps in the scoring chain, then make the reference
tables operative. §7's mismatch flag shows the code averages all 12 criteria (an
effective 33/33/33 pillar weighting) while the guide states `EUS = E×0.4 + S×0.35 +
G×0.25`; and §7.7 notes the 9-row `EXCLUSION_LISTS` (including the >30%-thermal-coal
threshold) is never algorithmically enforced against the 200-policy portfolio, despite
each policy carrying a genuine sector-conditional `fossilFuelExposure` field. Evolution
A implements the 40/35/25 pillar weighting on the already-computed E/S/G scores,
enforces exclusions as hard gates (a Coal Mining policy with fossilFuelExposure >30%
becomes "Decline — Exclusion" regardless of ESG score), and adds a premium-loading
calculator so the lineage table's advertised "ESG Premium Loading (Avg)" metric is
actually computed rather than implied.

**How.** (1) Move scoring into a small backend `underwriting_esg_engine` (module is
Tier B today, no endpoints) with `POST /score` and `GET /exclusions`. (2) Keep the
sector-aware fossil-exposure logic — §7.6 identifies it as the page's one genuinely
calibrated field — as the exclusion input. (3) Update the guide or code so formula and
implementation agree, retiring the §7 mismatch flag.

**Prerequisites.** Decide the canonical weighting (guide's 40/35/25 vs current equal
weight) with a documented rationale. **Acceptance:** the §7.4 worked example (Env 90 /
Soc 30 / Gov 30) scores 57 not 50; every excluded-sector policy above threshold is
declined irrespective of composite score.

### 9.2 Evolution B — Submission-triage copilot for underwriters (LLM tier 2)

**What.** An underwriting assistant that takes a raw submission (insured name, sector,
policy type, limit, narrative description) and triages it: calls Evolution A's
`POST /score` and `GET /exclusions` as tools, then returns the recommendation tier
(Accept / Accept w/ Conditions / Refer / Decline) with the criterion-level drivers,
which of the 9 exclusion categories were checked, and the applicable regime from the
9-row `REGULATIONS` table (UNEP PSI, ClimateWise, Lloyd's ESG requirements). The
LLM's job is extraction and narration — mapping messy submission text to the 12
`ESG_CRITERIA` inputs — never generating scores itself.

**How.** Tier-2 pattern: tool schemas from the new engine's OpenAPI operations;
system prompt grounded in this Atlas page including §7.2's criteria taxonomy (with the
"Climate Strategy classified under Governance" nuance stated explicitly so the copilot
explains it consistently). Extracted criterion inputs are surfaced for underwriter
confirmation before scoring — human-in-the-loop, since a misread submission would
silently skew the score.

**Prerequisites (hard).** Evolution A's backend endpoints (none exist today); the
mismatch between guide weights and code must be resolved first so the copilot narrates
one consistent formula. **Acceptance:** every score in an answer traces to a
`POST /score` response; a coal-sector submission triggers a cited exclusion check;
asked for a real client's actual ESG data, the copilot discloses the portfolio is
synthetic.
