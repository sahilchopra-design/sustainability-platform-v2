## 9 · Future Evolution

### 9.1 Evolution A — Real policy registry and a computable carbon-tax exposure (analytics ladder: rung 1 → 2)

**What.** §7 flags total divergence: the guide's Regulatory Compliance Cost Model
(`ComplianceCost = Σ CarbonTax + Disclosure + TaxonomyCapex + TransitionPlan`, with
`CarbonTaxExposure = Scope1 × CarbonPrice`) has no implementation — the page is a
75-record synthetic registry whose `complianceCost` is a random draw untethered to
any emissions or price. Evolution A rebuilds both halves. Registry: real policy
records from the sources §5 cites — the World Bank Carbon Pricing dashboard and ICAP
ETS map publish jurisdiction/instrument/price/coverage tables annually, and the
platform's regulatory-calendar and climate-policy modules already curate disclosure-
mandate timelines (share, don't duplicate). Cost model: the one honestly computable
term first — `CarbonTaxExposure = Scope1 × jurisdiction price × covered fraction` —
as a calculator taking a company's emissions-by-jurisdiction profile, with
disclosure/taxonomy/transition-plan costs shipped as sourced ranges (survey-based
estimates exist) rather than invented point values.

**How.** (1) `ref_climate_policies(jurisdiction, instrument, status, effective_year,
price, coverage, source, as_of)` from WB/ICAP tables + curated disclosure mandates;
the filter UI transfers unchanged. (2) The exposure calculator as a pure function;
CBAM modelled for the covered sectors using the published transitional-period rules
(the regulation is in §5's references). (3) Cross-module wiring: policy records link
to the `climate-policy` engine's price-gap scoring where jurisdictions overlap.

**Prerequisites (hard).** Synthetic-registry purge; coordination with the two policy
siblings so the platform has one policy data layer. **Acceptance:** every registry
row cites WB/ICAP/regulation sources with as-of dates; a fixture company's carbon-tax
exposure reproduces `Scope1 × price × coverage` by hand; CBAM output matches a
worked example from the regulation's methodology.

### 9.2 Evolution B — Regulatory horizon-scanning copilot (LLM tier 1 → 2)

**What.** A copilot for government-affairs and CFO teams: "what disclosure mandates
hit us in 2027 across our jurisdictions?" (filtered registry narration with
citations), "what's our carbon-tax exposure if the EU price reaches €120?"
(post-Evolution A, a calculator tool call), "how does CBAM affect our steel
imports?" (the covered-sector calculator with the transitional rules cited). Board-
ready scenario summaries assemble from computed exposures plus registry timelines.

**How.** Tier 1: registry aggregates + regulation corpus as grounding, every policy
fact citing its row and as-of date. Tier 2: tool schemas over the exposure and CBAM
calculators; validator on every $ figure; range-based cost terms (disclosure,
taxonomy) presented as ranges with sources — never collapsed to false points.

**Prerequisites (hard).** Evolution A first — a horizon scan over 75 random records
would brief boards on fictitious regulation. **Acceptance:** a jurisdiction-timeline
answer reconciles to registry rows; exposure figures reproduce via the calculator;
asked about a rumoured future policy, the copilot reports only what the registry's
status field supports.
