## 9 · Future Evolution

### 9.1 Evolution A — Close the demo-mode gap, then give the regression a time dimension (analytics ladder: rung 2 → 3)

**What.** This tier-A module is built on real data — 9 genuine ICE BofA OAS series
via FRED, with the sector→rating join explicitly documented as "a stated model
assumption, not fabricated data" — but §7 hand-verifies a live functional gap: the
demo-seed fallback covers only 4 of 9 series, so without `FRED_API_KEY` the A and BB
buckets vanish, six sectors collapse onto one identical BBB value, `syy = 0`, and
the OLS returns `null` — the transition–spread R² panel is non-functional in demo
mode. And even keyed, the fit is a 12-point cross-section against one day's curve.
Evolution A fixes the gap and upgrades the estimation.

**How.** (1) Immediate: extend `_SEED_VALUES` to all 9 catalog series (the missing
`BAMLC0A3CA`, `BAMLH0A1HYBB`, plus AAA/AA/B) so demo mode exercises every code path —
the §7.4 hand-traced failure becomes a regression test. (2) Persist history: a
scheduled FRED ingest into a `fred_oas_history` table (free key, generous limits)
instead of per-request proxying, giving the module a real time series and removing
the key-per-deployment fragility. (3) Estimation upgrade: replace the single-day
12-point OLS with a panel — sector transition scores against bucket OAS across
months — reporting R² with honest caveats about the rating-bucket join's coarseness;
spread *changes* around climate-policy event dates as a second, cleaner
identification. (4) The 12-sector `SECTOR_MAP` transition scores get source
documentation (currently stated but uncited).

**Prerequisites.** FRED key provisioning for the ingest (free); with blast radius
100, the fred-spreads route family is shared plumbing — coordinate changes.
**Acceptance:** demo mode renders a non-null R² with all 7 buckets distinct; the
ingest backfills ≥5 years monthly; the panel regression reproduces from stored
history; the §7 failure mode is covered by a test.

### 9.2 Evolution B — Spread-desk copilot over live OAS state (LLM tier 2)

**What.** A tool-calling copilot for credit analysts: "what's the HY-IG risk premium
doing and which transition-exposed sectors look rich?" calls `GET /fred-spreads/series`
for the live curves, reads the sector join, and answers with the actual basis-point
levels and the regression's current fit — clearly separating three provenance layers
the module already distinguishes: real market OAS, the stated sector→bucket mapping
assumption, and the estimated relationship. Issuer-level questions route through the
module's own OpenFIGI endpoints (`POST /openfigi/map`, `/isin-to-issuer/{isin}`) to
resolve a bond to its issuer before answering.

**How.** Tool schemas over the 6 live operations (all read-only — low-risk tier-2
pilot); grounding corpus is §7's methodology documentation, which is unusually
explicit about what is real versus assumed. The copilot must always report the
`mode` field (`live` vs `demo-seed`) from the status endpoints — a demo-mode answer
that doesn't say so would misrepresent seeded approximations as market data. The
fabrication validator covers every spread level and R².

**Prerequisites.** Evolution A's seed fix (in demo mode today the copilot's
regression tool returns null); ingest history for trend questions.
**Acceptance:** every basis-point figure matches a tool response; demo-mode answers
carry the mode disclosure; asked for sector-level OAS (which FRED doesn't publish),
the copilot explains the rating-bucket approximation rather than inventing a
sector series.
