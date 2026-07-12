## 9 · Future Evolution

### 9.1 Evolution A — Sourced scorecard for the real provider directory (analytics ladder: rung 1 → 2)

**What.** §7's diagnosis: the 59 provider names and descriptions are real (Planet
Labs, MSCI ESG, Climate TRACE, Jupiter, Xpansiv…) but every numeric — quality
dimensions, coverage, pricing, SLA — is fabricated (`55 + sr(i·8+d)·40`), and the
guide's weighted composite (0.30 coverage + 0.25 accuracy + …) with CDP back-testing
is an unweighted mean of those seeds. Real names with invented scores is the
provenance pattern the platform treats as a defect. Evolution A rebuilds the scorecard
on assessable facts: documented coverage claims from provider methodology documents
(universe counts, geography, update frequency are published), integration facts the
platform itself can attest (the ~19 sources already ingested have known lag,
format, and auth characteristics), and a clearly-scoped "assessed vs vendor-claimed"
distinction per cell.

**How.** (1) `ref_data_providers(provider, dimension, value, basis, source_url,
as_of)` where `basis ∈ {platform-assessed, vendor-claimed, third-party}` — the
platform-assessed rows seeded from the data-sources wave's real findings (e.g. the
documented UCDP access change, Open-Meteo tier limits). (2) The guide's weighted
composite implemented over sourced dimensions only, with unsourced dimensions shown
as gaps that lower a completeness indicator rather than being invented. (3) Pricing
shown as published list bands or "on request" — never synthesized.

**Prerequisites (hard).** PRNG purge across all 472 dimension cells; provider facts
carry as-of dates (vendor capabilities change fast). **Acceptance:** every rendered
score cell shows its basis on hover; the composite recomputes when a sourced
dimension updates; zero `sr()` numerics remain.

### 9.2 Evolution B — Data-procurement advisor (LLM tier 1)

**What.** A copilot for build-vs-buy questions: "we need asset-level flood risk for
EU real estate — which catalogued providers cover it and what does the platform
already have?" — the second half answered from the platform's own source inventory
(the genuinely differentiating knowledge here: NASA POWER, Open-Meteo, OpenFEMA and
the twin's grids are already in-house), "compare the two ESG-disclosure providers on
assessed dimensions", "what did the coverage-gap analyzer find for our use case?".
Tier 1: directory reasoning and gap narration, no computation to fabricate.

**How.** Atlas record + the sourced provider table + the platform's ingested-source
inventory as corpus; recommendations must distinguish "platform already ingests this"
from "requires procurement" — a distinction with budget consequences; every provider
claim cites its basis field per Evolution A.

**Prerequisites (hard).** Evolution A first — advising procurement from fabricated
quality scores could steer real spending decisions on noise. **Acceptance:** a
recommendation lists provider facts with basis labels; asked "which provider is most
accurate?", the copilot reports only assessed/third-party evidence and says where
none exists.
