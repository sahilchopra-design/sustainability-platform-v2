## 9 · Future Evolution

### 9.1 Evolution A — Fix the live defects, then build the promised four-channel decomposition (analytics ladder: rung 1 → 2)

**What.** §7 flags that the guide's
`TransRisk = PolicyRisk + TechRisk + MarketRisk + ReputationRisk` decomposition does
not exist — the page is six loosely-coupled tabs — and §7.6 documents two live defects:
the CBAM tab calls `computeCBAMCost` with arguments in the wrong positions (price lands
in the `sector` slot, so the €45/90/130 selector is inert and steel shows €4,551,000M),
and the SDA tab reads `s.current` where the service exports `currentGlobal`, yielding
`NaN%` gaps and a hard `0/8` on-track count. Evolution A repairs, then unifies: one
sector-level transition score computed from the four channels the guide names.

**How.** (1) Defect fixes first — correct the `computeCBAMCost(euRevenueM, sector,
carbonPricePerTonne)` call signature and the `currentGlobal` field read; both are
one-line frontend fixes with visible-output regression checks. (2) Channel
decomposition: Policy = the existing Tab-2 carbon-cost projection (`rev × CI × price`,
NGFS Phase IV paths — already real) plus repaired CBAM cost; Tech = crossover-year
distance from the SDA pathway gap; Market = demand-shift stranded-revenue estimate
already seeded in `SECTORS_T1`; Reputation stays a curated score, labelled as such.
(3) Replace the hard-coded KPI strings (Transition VaR $12.4bn, CBAM €2.1bn) with sums
of the computed tabs; add the Reg 2023/956 free-allocation phase-in to the CBAM model.
(4) Retire the Tab-6 `sr()` synthetic risk index or mark it demo.

**Prerequisites (hard).** Defects 1 and 2 block everything downstream — no evolution
may build on `NaN` gaps. **Acceptance:** changing the CBAM price selector changes CBAM
cost; SDA shows real gaps with a non-zero on-track count; the headline KPI equals the
sum of its tab components.

### 9.2 Evolution B — Engagement-dialogue copilot from computed channel scores (LLM tier 1)

**What.** The page's final tab flags "companies needing transition plan dialogue" but
offers no substance for that dialogue. Evolution B generates the engagement brief: for
a selected sector/company, a copilot drafts the questions an investor should ask,
grounded in the module's computed evidence — carbon-cost trajectory under NZ2050 vs
Current Policies, SDA pathway gap (post-fix), CBAM exposure, SBTi coverage from
`SECTORS_T1` — each point citing the tab and scenario it came from.

**How.** Tier-1 RAG per the roadmap: corpus is this Atlas record (§5 channel
definitions, §7.2 parameter tables including the NGFS Phase IV price paths and
`CBAM_META` intensities) plus current page state. The system prompt encodes §7.6's
provenance honesty: sector scores and policy probabilities are curated demo values,
and the copilot must present them as illustrative orderings, not company assessments.
No new backend — this module has zero endpoints, so tier 2 is out of scope until a
backend vertical exists.

**Prerequisites.** Evolution A's defect fixes (a brief citing NaN gaps or price-inert
CBAM costs would be worse than no brief); corpus embedding (roadmap D3).
**Acceptance:** every quantitative claim in a generated brief carries a tab/scenario
citation; the copilot refuses company-specific claims for companies not in
`CBAM_COMPANIES`; briefs regenerate consistently when the scenario toggle changes.
