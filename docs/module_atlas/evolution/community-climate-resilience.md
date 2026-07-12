## 9 · Future Evolution

### 9.1 Evolution A — Build the resilience-dividend DCF the guide promises (analytics ladder: rung 1 → 2)

**What.** §7's mismatch flag: EP-DI6 advertises a Social Resilience Dividend engine —
discounted avoided losses + wellbeing gains + economic multipliers net of investment,
with `BCR_social` — but ships a synthetic scorecard: 60 `sr()`-seeded communities with
round-robin region/income assignment (Tuvalu and the Sahel draw from the same uniform
distributions), an unsourced `0.08/°C` multiplier, and no discounting anywhere.
Evolution A implements the §8-specified dividend model and detaches the cosmetic
community names from fabricated primitives.

**How.** (1) Core calc: per-community cash-flow model
`Σ[(AvoidedLoss_t + Wellbeing_t + Multiplier_t)/(1+r)^t] − Investment` with a social
discount rate control; avoided loss from hazard frequency × loss-per-event, both
user-entered or sourced from the digital-twin composite score at real community
coordinates. (2) Wellbeing and multiplier terms parameterized from the UNDRR Economic
Value of DRR evidence base the module already cites (its 4:1–9:1 BCR range becomes the
calibration check, not a decoration). (3) Replace the 60 synthetic communities with a
small set of documented case-study communities (curated, cited) — honest small-N beats
fabricated large-N — and make the temperature slider scale hazard frequency through a
sourced relationship rather than the bare 0.08 slope. (4) Sendai indicator outputs
(Target E-style mortality/affected-population metrics) computed from the case data.

**Prerequisites (hard).** Purge the `sr()` community generator and the round-robin
geography (guardrail conventions); a curated case-study dataset with citations.
**Acceptance:** the computed BCR for a reference case lands inside (or is flagged
against) the UNDRR 4:1–9:1 band; discount-rate changes move the dividend correctly;
zero PRNG calls feed any displayed community metric.

### 9.2 Evolution B — Social-bond framework drafter for community issuers (LLM tier 1)

**What.** The module names ICMA Social Bond Principles alignment and community-bond
feasibility as outputs it never computes. Evolution B supplies the qualitative half
that LLMs genuinely help with: given a (post-Evolution A) resilience-investment case —
intervention type, computed dividend, BCR, Sendai metrics — draft the ICMA SBP-aligned
framework sections: use of proceeds, target population definition, expected social
outcomes with the module's computed indicators as KPIs, and reporting commitments.
CDFIs and municipal issuers, the stated users, rarely have this drafting capacity
in-house.

**How.** Tier-1 RAG: corpus is this Atlas record, the ICMA Social Bond Principles text
(refdata regulatory catalog addition), and the UNDRR/Sendai references §5 cites. The
computed case passes as structured context; the drafter maps each SBP component to
evidence and marks components the case cannot support (e.g. no baseline mortality
data) as gaps — honest-nulls in prose. No endpoints exist today, so there is nothing
to tool-call; tier 2 waits on Evolution A's backend.

**Prerequisites (hard).** Evolution A — a bond framework quoting seeded resilience
scores would be a reputational hazard for exactly the impact-investor audience this
module targets; SBP text ingestion. **Acceptance:** a draft framework where every KPI
is a computed module output with its calculation named; unsupported SBP components
are explicitly listed as gaps; regenerating with a different discount rate updates
the quoted BCR consistently.
