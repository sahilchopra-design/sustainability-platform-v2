## 9 · Future Evolution

### 9.1 Evolution A — Empirical valuation ranges, CSDDD scope from real data, and double-count guard (analytics ladder: rung 1 → 3)

**What.** The ESG M&A Due Diligence engine (E79) — an 85-item weighted DD checklist, UNGP 31-principle
+ ILO + OECD RBC scoring, ESG valuation impact, a 100-day integration plan, and an IC report — a strong
honest-null design (every entity quantity is caller-supplied or reported null, "no figures are
fabricated"). §7.5 names the deepening targets: the valuation ranges and the ±10% score-to-price
mapping are **synthetic transaction heuristics without a cited empirical study**; the CSDDD scope is a
**rough proxy from deal value** (>$500M → group 2) rather than the directive's employee/turnover test;
there's a **documented double-counting risk** between finding-level adjustments and the S/G/climate
quantitative adjustments (all added to the same valuation, left to the analyst); and unknown finding
keys silently default to (−5,+5). Evolution A calibrates the valuation ranges against real ESG-in-M&A
deal data, scopes CSDDD from actual employee/turnover inputs, and guards the double-count.

**How.** `ESG_VALUATION_RANGES` calibrated against observed ESG deal premiums/discounts; the assessment
collects employee/turnover to classify CSDDD scope properly (not deal-value proxy); the valuation
aggregation reconciles finding-level and quantitative adjustments to prevent double-counting (or
documents the intended layering); unknown finding keys error rather than silently defaulting. Rung 3:
the pillar weights and score-to-price mapping get an empirical basis and sensitivity surfacing.

**Prerequisites (hard).** Fix the harness — §4.2 shows `POST /dd-report`, `/due-diligence`,
`/integration-plan` all **skipped** (need input payloads to trace); preserve the honest-null discipline
and always report `checklist_items_assessed` alongside scores (§7.5 — headline scores can rest on few
items). **Acceptance:** the §7.4 worked example (overall 0.4225, −1.55% valuation adj) reproduces at
legacy ranges; CSDDD scope derives from real employee/turnover; the double-count between adjustment
layers is resolved or explicitly documented; unknown finding keys are handled, not silently defaulted.

### 9.2 Evolution B — ESG deal-diligence copilot with tool-called assessment (LLM tier 2)

**What.** A copilot for deal/IC teams: "assess ESG due diligence for this acquisition" (`/due-diligence`
→ E/S/G scores, red flags, deal-breaker check, CSDDD scope), "score UNGP alignment" (`/ungp-alignment`),
"quantify the ESG valuation impact" (`/valuation-impact`), "build the 100-day integration plan"
(`/integration-plan`), and "compose the IC report" (`/dd-report`) — narrating real outputs and the
honest nulls (unassessed checklist items excluded from scoring, not fabricated). The deal-breaker
criteria (modern slavery, EUDR post-2020 deforestation, active FCPA prosecution) directly answer "is
this a walk-away?"

**How.** Tool schemas over the 4 POST + 5 GET operations; the reference registers (85-item DD
checklist, UNGP principles, ILO conventions, CSDDD thresholds, deal-breaker criteria, valuation ranges)
are exceptional RAG grounding — faithful summaries of the real frameworks. The no-fabrication validator
checks every score, adjustment and threshold against tool output; the copilot always pairs a score with
its assessed-item count (per §7.5) so a thin-evidence score is never presented as complete, and cites
the guideline paragraph for each gap.

**Prerequisites.** Evolution A's harness fixes and double-count resolution (so narrated valuations are
sound); Atlas + reference corpus embedded (roadmap D3). **Acceptance:** every figure cited traces to an
engine tool call; a valuation adjustment matches `/valuation-impact`; every score is reported with its
assessed-item count; a deal-breaker finding escalates to board per the engine's recommendation ladder.
