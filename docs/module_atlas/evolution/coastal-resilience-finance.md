## 9 · Future Evolution

### 9.1 Evolution A — From flat annuity to SLR-growing AAL and multi-benefit BCR (analytics ladder: rung 1 → 2)

**What.** This Sprint-DY module is more honest than most: the annuity present-value
`pvBenefit = annBenefit·(1−(1+r)^(−n))/r` is a genuine closed-form discounting calc.
But §7.5 lists what's missing against its own guide: benefit is a *flat* annuity with
no AAL growth under rising sea level, there is no return-period loss curve behind
`annBenefit` (it's user-typed), the insurance-premium co-benefit never enters the PV,
and stranding rests on two fixed heuristics (0.95 cap, 0.3 realised-loss factor).
Evolution A upgrades the benefit side to match the FEMA BCA method the module cites.

**How.** (1) Derive `annBenefit` instead of asking for it: without-project AAL from a
return-period damage curve (reusing the depth-damage table the coastal-flood sibling
needs — build once, share), with-project AAL applying each `PROTECTION_MEASURES` row's
attenuation performance (the mangrove −29%/100m IUCN figure is already a guide anchor);
benefit = ΔAAL. (2) Grow AAL along the `SLR_SCENARIOS` RCP paths so the annuity becomes
a growing-benefit PV — the scenario dimension that moves this to rung 2. (3) Add the
guide's other two benefit terms: insurance-premium reduction (parameterized from the
Swiss Re NbS co-benefit ranges, honestly labelled curated) and ecosystem services for
natural-infrastructure measures. (4) Replace the 0.3 stranding factor with a
documented sensitivity range rather than a point heuristic.

**Prerequisites.** The shared depth-damage reference table; no PRNG defect exists here
to purge — this is additive work. **Acceptance:** the §7.4 worked example ($10M, 30yr,
5% → $153.7M) still reproduces as the flat-benefit special case; switching RCP2.6 →
RCP8.5 raises PV benefit monotonically; BCR decomposes into its three benefit terms in
the output.

### 9.2 Evolution B — FEMA BRIC application assistant (LLM tier 1)

**What.** The module already models the finance stack (BRIC grants, cat bonds,
resilience bonds in `FINANCE_INSTRUMENTS`) and the workflow ends at "assess FEMA BRIC
grant eligibility" — a documentation-heavy task. Evolution B drafts the BCA narrative
section of a BRIC application from the module's computed case: project type from
`PROTECTION_MEASURES`, computed BCR versus the FEMA 1.0× threshold, discount-rate and
lifespan assumptions, and the benefit decomposition — each figure cited to the page's
calculation, formatted against the FEMA BCA Reference Guide v6.0 structure the module
already references.

**How.** Tier-1 RAG: corpus is this Atlas record (§5 formula, §7.2 parameter table,
§7.4 worked example) plus the FEMA BCA guide structure; page state (user inputs and
computed PV/BCR) passes into the prompt. No backend exists to tool-call — the module
has zero endpoints — so the assistant is explanation-and-drafting only, and must state
that city-level figures are curated demo data until a real asset baseline is loaded.
Rendering via the existing export path.

**Prerequisites.** Corpus embedding (roadmap D3); Evolution A materially improves
draft quality (derived AAL beats user-typed benefit) but tier 1 can ship before it
with disclosure. **Acceptance:** a generated BCA narrative contains only numbers
present on the page, states the discount rate and lifespan used, and correctly
flags any BCR below 1.0× as failing the FEMA threshold instead of soft-pedalling it.
