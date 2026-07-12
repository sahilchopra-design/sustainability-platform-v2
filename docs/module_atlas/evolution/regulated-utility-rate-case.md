## 9 · Future Evolution

### 9.1 Evolution A — Account-level rate-base model with filed-data ingestion (analytics ladder: rung 2 → 3)

**What.** This is one of the strongest-grounded B-tier pages: 12 named IOUs with researched rate-case fields, a correct after-tax WACC (21% TCJA rate), and internally consistent waterfalls ("Return on Rate Base ties out to WACC × Rate Base" per §7.6). Its documented gaps: the `lagCost` formula fails to reproduce the guide's own cited $328M PG&E figure — a genuine, unresolved discrepancy — the ROE Trends and Capex Recovery series are the file's only seeded-random elements, and the rate base is a 10-line summary rather than the FERC Uniform System of Accounts detail a filing-grade model needs. Evolution A resolves the discrepancy, kills the seeded series, and deepens toward account granularity.

**How.** (1) First, reconcile lagCost: derive both the code's and the guide's PG&E numbers by hand, document the correct convention (lag applied to the ROE gap vs the full revenue deficiency), and pin it in bench_quant — this is a small task with outsized credibility value. (2) Ingest FERC Form 1 data (public, machine-readable via the FERC XBRL programme) for the 12 utilities: per-account plant balances (101–108), ADIT (281–283), giving the rate-base build real account rows and making the 16-year ROE history actual filed data instead of a seeded trajectory. (3) `POST /api/v1/rate-case/revenue-requirement` computing the waterfall server-side from account inputs, with the WACC sensitivity grid as a documented sweep.

**Prerequisites.** FERC Form 1 ingestion scoped (XBRL since 2021, CSV dumps before); the lagCost convention decision recorded. **Acceptance:** lagCost reproduces a documented reference figure; the PG&E rate-base build sums from ingested account balances; no `sr()` remains in the file.

### 9.2 Evolution B — Testimony-support analyst for cost-of-capital work (LLM tier 2)

**What.** The module's stated users include rate-case expert witnesses. Evolution B supports the testimony workflow: "compare Xcel Colorado's 420-day regulatory lag and allowed-vs-earned gap against the 12-utility panel — is their compact below median?", "draft the WACC sensitivity exhibit narrative at 48–54% equity ratios", "what did this utility's allowed ROE do across its last three cases?" — each grounded in the ingested Form 1 / rate-case data via tool calls.

**How.** Tier-2 tool schemas over the Evolution-A endpoints (revenue requirement, WACC grid, panel comparisons); the system prompt encodes regulatory-testimony discipline — every figure carries its docket/form-year source, comparisons state the panel's composition, and the copilot never opines on what a commission *should* allow (it reports panel statistics and computed sensitivities; advocacy is the witness's job). Exhibit drafts render as tables through report studio with a data-vintage footer. Golden Q&A built from the reconciled PG&E worked example.

**Prerequisites.** Evolution A's data layer (testimony support on unverifiable curated figures would be professionally risky for users); docket metadata per rate-case row. **Acceptance:** every ROE/lag/$M figure in a draft exhibit traces to a tool response with its source year; normative should-allow questions get the documented refusal.
