## 9 · Future Evolution

### 9.1 Evolution A — Real implied-temperature model replacing the WACI step function (analytics ladder: rung 2 → 3)

**What.** §7 credits this module with genuine PCAF arithmetic — WACI, financed emissions, exponential decarbonisation pathways, NZBA sector gaps over hand-set realistic data — and isolates exactly one heuristic: the WACI→portfolio-temperature mapping is a piecewise step function, not an SBTi Temperature Rating or MSCI ITR model (the flagged §8 trigger). Evolution A replaces it with the real method: implied temperature derived from target-ambition-vs-carbon-budget allocation per sector, using the module's own `INTERIM_TARGETS` structure (baseline2019/target2025/target2030 trajectories) as the ambition input and IEA NZE sector budgets as the benchmark.

**How.** (1) Implement the §8 spec server-side: per-sector temperature score = f(committed reduction rate vs required NZE rate), aggregated exposure-weighted — replacing `calcPortfolioTemp`'s band lookup. (2) Benchmark the pathway decay rates (§7 notes Paris/NDC slopes are editorial) against published NGFS/IEA trajectories, citing the vintage. (3) Persist the 9 `PORTFOLIO_SECTORS` in a table so targets are editable per org rather than hard-coded, and connect financed-emissions baselines to the sibling `financed-emissions-attributor`.

**Prerequisites.** IEA NZE sector-trajectory reference data ingested into the refdata layer; the minor `sr()` `waciVal` helper (§7.5) removed. **Acceptance:** a sector whose 2030 target matches its NZE-required reduction scores ≈1.5 °C; the step-function is deleted and the new model documented per §8 with a bench-pinned reference case.

### 9.2 Evolution B — NZBA target-setting copilot (LLM tier 2)

**What.** A copilot that walks a bank through NZBA-compliant target setting: "our power WACI is 320 tCO₂e/GWh — what 2030 target does NZBA guidance imply, and which lever mix gets us there?" It tool-calls the Evolution A endpoints for baseline, gap, and temperature, then reasons over the module's `ENGAGEMENT_STRATEGY` lever taxonomy (divestment/engagement/new green finance with effort/impact/timeline fields) to draft the target memorandum.

**How.** Tool schemas over the pathway/temperature routes; the grounding corpus is unusually strong here — §5/§7 already encode NZBA 2021 guidelines, PCAF DQ 1–5 scoring, and CRREM real-estate pathways, so the per-module system prompt cites real framework text. The copilot's differentiator: it distinguishes portfolio decarbonisation achieved by divestment (paper decarbonisation) from real-economy reduction, a distinction the lever taxonomy already models. Drafted targets render through the report-studio layer per roadmap Tier 3 composability.

**Prerequisites.** Evolution A (the temperature number a copilot narrates must come from a defensible model, not the flagged step heuristic); llm_traces capture for the flywheel. **Acceptance:** every WACI, gap, and temperature figure in a target memo traces to a tool call; asked to promise a 2050 outcome, the copilot qualifies it as scenario-conditional, mirroring §7.5's pathway-assumption caveat.
