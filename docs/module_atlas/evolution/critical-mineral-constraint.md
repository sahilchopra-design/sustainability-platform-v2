## 9 · Future Evolution

### 9.1 Evolution A — Pipeline-based supply and deployment-derived demand (analytics ladder: rung 2 → 3)

**What.** EP-CL1 genuinely delivers its guide — a real gap projection over curated
IEA/USGS-consistent data for 8 minerals, with scenario tabs and no PRNG in the core.
§7.6 names the simplifications: supply grows at a flat 4%/yr (and the headline gap
uses a ×1.2-by-2030 factor) even though the module's own `PIPELINE` table lists six
real projects (Thacker Pass, Simandou, Weda Bay…) with capacities that could build a
lumpy, project-based supply curve; demand anchors are stored points rather than the
guide's `Demand = Σ_sector Deployment × Intensity`; and price spikes are curated
end-points. Evolution A replaces the heuristics with the structure the data already
supports.

**How.** (1) Supply: build the supply curve from the pipeline — existing 2025 base
plus project capacities phased by start year with ramp profiles and a probability-
weighted completion factor per project status; the flat 4% becomes the documented
fallback for un-modelled capacity. (2) Demand: decompose the 2030/2040 anchors into
technology deployment × material intensity (EV batteries, wind, grid — IEA publishes
both components), so scenario switches (STEPS/APS/NZE) recompute demand rather than
swapping stored points — the rung-3 benchmark: the module's anchors should reproduce
IEA's published projections within tolerance. (3) Price-spike scenarios keep curated
magnitudes but gain an inventory-coverage rationale (months of demand lost under the
shock slider). (4) Pin lithium's 2030 gap in `bench_quant.py`.

**Prerequisites.** IEA deployment/intensity table curation (published, versioned);
pipeline status refresh ownership. **Acceptance:** removing one pipeline project
visibly dents the supply curve in its start year; NZE vs STEPS demand for lithium
differs per the IEA decomposition; the current interpolation remains as a
cross-check view.

### 9.2 Evolution B — Constraint-briefing copilot for strategy teams (LLM tier 1)

**What.** The module's users ask synthesis questions: "which minerals bottleneck our
2030 battery roadmap, and what are the levers?" Evolution B answers from the module's
own computed projections: the deficit list with gap magnitudes and timing, the
substitution-elasticity context (cobalt 0.60 — substitutable; REE 0.15 — locked in),
recycling-penetration offsets from the S-curves, and the specific pipeline projects
whose slippage matters most — each figure from the projection engine, each lever
mapped to the tab that models it.

**How.** Tier-1 grounding on page state plus this Atlas record (§7.2's curated data
table with its IEA/USGS provenance); the shock slider and scenario states pass as
context so "under a 40% China export shock" reads the actual scenario tab output.
Post-Evolution A, briefs distinguish pipeline-based supply confidence from
fallback-growth assumptions — the copilot's caveats track the model's own structure.
No endpoints exist; a backend port of the projection would enable tier-2 what-ifs
("delay Simandou two years") as tool calls.

**Prerequisites.** Corpus embedding (D3); Evolution A for lever-level precision.
**Acceptance:** every gap figure matches the projection output for the stated year;
substitution and recycling numbers quote the curated tables verbatim; the copilot
refuses minerals outside the 8-mineral universe.
