## 9 · Future Evolution

### 9.1 Evolution A — Build the β-coefficient yield model the guide promises (analytics ladder: rung 1 → 2)

**What.** §7 flags a total guide↔code gap: the promised Fisheries Climate Yield Model (`YieldChange = BaseYield × (1 + β_T·ΔTemp + β_pH·ΔpH + β_O2·ΔO2)`) with revenue-at-risk (`ΔYield × CatchPrice × FleetDependency`) does not exist. What runs is a descriptive dashboard over 60 `sr()`-seeded fisheries where `climateProjectedCatchChange` is a single seeded number and the only climate response is a uniform `×(1 + (tempScenario−1.5)×0.15)` rescale. Evolution A builds the module's first analytical vertical: a real multi-stressor yield model with species/region-specific β coefficients drawn from the SROCC and FishMIP literature the module already cites, taking ΔTemp/ΔpH/ΔO2 as scenario inputs and producing revenue-at-risk from catch price and fleet dependency.

**How.** (1) A backend route holding a β table keyed by species thermal guild and region (curated from published FishMIP/SROCC elasticities, documented per §8 model-card convention with honest uncertainty). (2) Real fishery attributes seeded from FAO SOFIA stock-status data rather than PRNG. (3) Revenue-at-risk chains ΔYield to catch price and the small-scale-fisher dependency field the page already carries, giving the sovereign food-security linkage §7.5 says is absent.

**Prerequisites.** The 60 seeded fisheries must be replaced with sourced stock data (all attributes are §7-flagged synthetic); β coefficients labeled as literature-derived ranges, not point truths. **Acceptance:** two species with different thermal tolerance under the same ΔTemp produce different yield changes; revenue-at-risk reproduces the §5 formula; no `sr()` in any headline metric.

### 9.2 Evolution B — Blue-economy risk copilot (LLM tier 1 → 2)

**What.** A copilot for fisheries-finance and sovereign-fund users: "how exposed is Pacific SIDS tuna revenue to a 2°C ocean, and which stressor dominates?" Tier-1 slice narrates the module's rankings and framework context (SROCC Ch.5 warming/acidification/hypoxia mechanisms) from the atlas corpus; tier-2 slice runs the Evolution A yield model as tool calls, decomposing the projected change into temperature/pH/oxygen contributions.

**How.** Tier 1 grounds on this atlas record; because §7 documents the current numbers as PRNG-derived, the pre-Evolution-A copilot must explicitly frame outputs as illustrative and refuse quantitative revenue-at-risk questions. Tier 2 wraps the yield endpoint with per-stressor decomposition so the "which stressor dominates" answer is engine-computed. Cross-links to sovereign and food-security modules come from the atlas interconnection graph.

**Prerequisites.** Evolution A for any quantitative answer (the module computes no yield model today); corpus embedding. **Acceptance:** post-Evolution-A, every yield/revenue figure traces to a tool call and the stressor decomposition sums to the total; pre-Evolution-A, quantitative probes return a documented refusal rather than seeded numbers.
