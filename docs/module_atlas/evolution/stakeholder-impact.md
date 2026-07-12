## 9 · Future Evolution

### 9.1 Evolution A — Implement the severity×scale×likelihood IMS engine with monetisation (analytics ladder: rung 1 → 2)

**What.** The §7 flag documents that the guide's `IMS = Σ(Severity × Scale × Likelihood) / StakeholderWeight` is not implemented: the code defines 8 ESRS-aligned stakeholder groups (S1 Employees, S2 Supply Chain Workers, S3 Communities, S4 Consumers, plus Investors, Regulators, Environment, Future Generations) with four per-group scores (positive/negative/influence/severity) but **no Scale or Likelihood dimension and no IMS aggregation formula anywhere**. Its genuine strength (§7.1) is that the seeded scores are *editable and persist* to localStorage — a real, if unweighted, scorecard tool. Evolution A builds the actual GRI-3/ESRS double-materiality engine the guide promises.

**How.** (1) Add the missing Scale and Likelihood dimensions (GRI 3 defines severity = scale + scope + irremediability, with likelihood a separate multiplier for potential impacts) and implement the IMS = Σ(severity × scale × likelihood) / stakeholder-weight aggregation. (2) Replace the arbitrary $ monetisation multipliers (0.00008/0.00006 of portfolio value per score point, §7.6 flags as unsourced) with documented category-specific shadow prices (Harvard IWAI employment/GHG/health factors). (3) Add an audit-trail flag distinguishing still-default synthetic scores from user-assessed ones — the deep-dive notes the UI can't currently tell them apart. (4) Map outcomes to ESRS S1–S4 and SDG targets (already structurally present) with the computed IMS driving materiality.

**Prerequisites.** Shadow-price sourcing; the scorecard's edit/persist mechanism is a good foundation to extend. **Acceptance:** the IMS recomputes from severity/scale/likelihood; the $ impact uses cited shadow prices; the UI flags default-vs-assessed scores.

### 9.2 Evolution B — Double-materiality assessment copilot (LLM tier 1)

**What.** ESRS double-materiality assessment is a structured qualitative judgment — the ideal LLM elicitation task. Evolution B walks an analyst through each stakeholder group and material topic: "for supply-chain workers, how severe and how likely is this impact?", proposing severity/scale/likelihood scores with rationale tied to the GRI 3 rubric, assembling the IMS via the Evolution-A engine, and mapping results to ESRS S1–S4.

**How.** Tier-1 structured-elicitation pattern: `POST /api/v1/copilot/stakeholder-impact/ask`, corpus = this Atlas record (the stakeholder groups, ESRS map, GRI 3 severity/likelihood methodology). Each proposed score cites the GRI 3 criterion and requires user-provided evidence; the IMS is computed by the engine, not the LLM. Results feed the ESRS S1–S4 disclosure mapping the page already carries. The copilot never scores without evidence input.

**Prerequisites.** Evolution A's IMS engine so the composite is real; the edit/persist store already supports draft assessments. **Acceptance:** every proposed severity/scale/likelihood cites a GRI 3 criterion and user evidence; empty evidence yields "insufficient input," not a default; the IMS matches the engine's computation.
