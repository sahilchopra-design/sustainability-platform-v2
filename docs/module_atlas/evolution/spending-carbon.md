## 9 · Future Evolution

### 9.1 Evolution A — Real DEFRA/EEIO factor table applied to actual transactions (analytics ladder: rung 1 → 2)

**What.** The §7 flag shows the module doesn't do what its guide claims: it cites DEFRA/BEIS 2023 factors and a Carnegie Mellon EEIO model in kgCO₂e/£, but the code uses **5 flat hand-picked USD multipliers** (Food 0.8, Transport 1.2, Home 0.5, Shopping 0.3, Entertainment 0.15) with ±50% noise, and applies them only to synthetic demo transactions — real imported transactions inherit whatever `carbon_kg` the upstream import assigned, so the module's own factor logic never touches real data. The `budget15C` = 2,300 kgCO₂e constant is a defensible 1.5°C per-capita figure but uncited. Evolution A implements the real EEIO footprinting the guide promises.

**How. **(1) Ingest a real EEIO factor table (DEFRA/BEIS conversion factors, ~50+ categories, free and published) keyed by spend category and currency, replacing the 5 flat multipliers and removing the ±50% noise. (2) Apply the factors to real imported transactions via a category mapping, so a user's actual spend produces an auditable spend-based Scope 3 estimate — the module's core promise. (3) Refine the category taxonomy from 5 broad buckets to the GHG Protocol Scope 3 Category 1 structure the guide references. (4) Cite `budget15C` to a specific IPCC/Global Carbon Project source, and fix the peer-benchmark scope mismatch (territorial vs consumption vs spend-based, currently undocumented, so comparisons are apples-to-oranges). (5) Make `TRANSITION_PATHS` savings a function of the user's actual category spend, not a flat constant.

**Prerequisites.** DEFRA/EEIO table ingestion and a category-mapping layer; multi-currency EF handling (module is USD, DEFRA is GBP). **Acceptance:** a real transaction's carbon derives from a sourced EEIO factor; changing spend in a category changes both total and the reduction recommendation; benchmarks are scope-matched to the spend-based user footprint.

### 9.2 Evolution B — Personal/SME carbon-budget copilot (LLM tier 1)

**What.** A copilot for the SME/personal-budget user: "where's most of my footprint coming from?", "how do I get under the 1.5°C per-capita budget?", "what would switching my commute save?" — answered from the real EEIO-computed category footprint and the transition-path savings, grounded in the user's actual transaction history.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/spending-carbon/ask`, corpus = this Atlas record (the EEIO methodology, the carbon-budget basis, GHG Protocol Cat 1 framing) plus the user's computed category footprint. Reduction recommendations are ranked by the user's real highest-impact categories (post-Evolution-A) and cite the sourced saving; budget answers compare the user's total to the cited 1.5°C figure. Privacy note: the copilot operates on the user's own wallet data only.

**Prerequisites.** Evolution A's real factors and per-user savings so recommendations reflect actual spend rather than the current flat "beef → plant-based saves 1,310kg regardless of consumption." **Acceptance:** every emissions figure traces to an EEIO-factored transaction; the top reduction recommendation matches the user's actual highest-impact category; the budget comparison cites the per-capita source.
