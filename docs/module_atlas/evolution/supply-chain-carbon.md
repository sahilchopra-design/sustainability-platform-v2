## 9 · Future Evolution

### 9.1 Evolution A — Fix the failing calculate routes and reconcile the multiplier vs EEIO methodology (analytics ladder: rung 2 → 3)

**What.** This module runs on real data (no `sr()` — inputs from `GLOBAL_COMPANY_MASTER`) and its backend has genuine assets: the `emission_factor_library`, `scope3_assessments`, and `sbti_targets` GET routes pass against real DB tables. But two problems: the lineage sweep records both compute routes — `POST /scope3/calculate` and `/sbti-target` — as **failed**, and the individual-record GET routes fail with `db-empty`; and §7 flags a methodology mismatch — the guide describes a spend-based EEIO calc (`Σ(spend × EF_sector)`) but the frontend uses a "supply-chain multiplier" approach (`tier1Est = companyTotal × mult.tier1`), estimating upstream tiers as a fixed multiple of the company's own Scope 1+2. The multiplier method is a legitimate real-world simplification, but the confidence/methodology labels claim EEIO, and the multipliers are uncited. Blast radius is 81 — this is foundational supply-chain infrastructure.

**How.** (1) Triage the two failing compute routes and seed the empty `scope3_assessments`/`sbti_targets` tables (the D1 write-side activation item) so the individual-record GETs resolve. (2) Reconcile methodology: either implement the true EEIO `Σ(spend × EF)` using the real `emission_factor_library` (which the GET route confirms is populated) as the primary method, keeping the multiplier as a documented fallback when spend data is unavailable — and fix the confidence labels to describe the method actually used. (3) Cite the sector multipliers to a named source (EXIOBASE sector ratios or a CDP study). (4) Bench-pin the Scope 3 calculation.

**Prerequisites.** The two route failures and empty tables are the gate; EEIO factors are already in the DB; multiplier citation needs a source. **Acceptance:** both compute routes pass; the EEIO method uses the real emission-factor library with spend data; methodology labels match the formula used; multipliers cite a source.

### 9.2 Evolution B — Scope 3 supplier-engagement analyst (LLM tier 2)

**What.** A tool-calling analyst for the workflow the module describes: "calculate our Scope 3 Cat 1 for this spend profile", "which 20% of suppliers drive 80% of emissions?", "set an SBTi-aligned supplier reduction target" — calling `POST /scope3/calculate` and `/scope3/sbti-target`, reading the emission-factor library, and narrating the hotspot analysis and SBTi trajectory, never inventing emissions.

**How.** Tool schemas from the module's OpenAPI operations (2 POST compute + 5 GET including the real-DB emission-factors and assessments); grounding = this Atlas record. Hotspot answers narrate the Pareto analysis over the computed supplier emissions; SBTi answers cite the `calculate_sbti_target` trajectory. The no-fabrication validator checks every tCO₂e against tool output; PCAF data-quality scores are surfaced per the standard.

**Prerequisites (hard).** Evolution A — the compute endpoints fail, so there is nothing to call; and the methodology-label mismatch would mislabel the method in narration. **Acceptance:** every emissions figure traces to a `/scope3/calculate` response; the hotspot Pareto matches the computed supplier data; an SBTi target cites the engine's trajectory, not an estimate.
