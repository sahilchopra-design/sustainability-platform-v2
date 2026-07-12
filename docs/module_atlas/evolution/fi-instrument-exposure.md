## 9 · Future Evolution

### 9.1 Evolution A — Implement the §8 climate-VaR spec: sector × maturity risk factors (analytics ladder: rung 1 → 2)

**What.** §7 flags the honest gap: the guide promises `ClimateVaR = Notional × SectorRisk × Maturity_factor`, but the code applies a seeded 2–14% haircut (`notional·(0.02 + sr()·0.12)`) and green/brown is a coin flip (`sr(i·13) > 0.55`). Evolution A implements the §8 specification that already exists on this page: instrument-level climate VaR driven by a real sector transition-intensity vector and a tenor-sensitivity factor, plus a rules-based (not random) green classification keyed to instrument use-of-proceeds and the platform's EU Taxonomy NACE mapping (the `fi-taxonomy-pcaf-bridge` sibling already carries a 31-entry `NACE_MAP` with TSC/DNSH fields to reuse).

**How.** (1) Small backend route holding the sector-risk table (sourceable from the NGFS scenario PD multipliers already used elsewhere in sprint CT/DW modules) and a maturity factor increasing with tenor beyond 2030. (2) The 200-instrument book becomes a persisted demo table so VaR is reproducible instead of re-seeded per render. (3) Green classification requires an explicit taxonomy-eligibility field per instrument; unknown stays unknown (honest nulls), never coin-flipped.

**Prerequisites.** The documented seeded-random VaR and coin-flip classification must be removed, not overlaid (both are §7-flagged fabrications); sector-risk vector documented per §8 model-card convention. **Acceptance:** two instruments with equal notional but different sector/maturity produce different VaR reproducing the §5 formula; no `sr()` term remains in any risk quantity.

### 9.2 Evolution B — Instrument-desk copilot for exposure triage (LLM tier 1 → 2)

**What.** A copilot on the Instrument Summary tab answering "where is our climate VaR concentrated and which maturities drive it?" — first as a tier-1 explainer over the page's genuine aggregation arithmetic (`totalVaR`, `varByType`, maturity profile), then tier-2 what-ifs against the Evolution A route: "re-price the book if the steel sector risk factor doubles" or "what does VaR look like excluding CDS and guarantees?"

**How.** Tier 1 needs only the atlas corpus embedding plus the rendered aggregates; its system prompt must carry §7's caveat verbatim so the copilot discloses that current numbers are illustrative until Evolution A ships. Tier 2 wraps the new VaR route with override parameters (sector-factor deltas, type filters) so every counterfactual is engine-computed. Green/brown questions route to the taxonomy field, with refusal when eligibility is unassessed.

**Prerequisites.** Evolution A for any quantitative what-if (today there is no backend and the VaR is seeded — narrating it as risk analysis would violate the no-fabrication creed); per-module tool allowlist from the atlas endpoint map. **Acceptance:** every VaR figure in a copilot answer traces to a tool response; pre-Evolution-A the copilot explicitly labels the book as demo data in each quantitative answer.
