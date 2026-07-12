## 9 · Future Evolution

### 9.1 Evolution A — Grid-decarbonisation trajectories, real methane MRV, and full ESRS mapping (analytics ladder: rung 1 → 3)

**What.** Three sibling engines behind one route: Scope 3 Category 11 (use of sold products), Methane
OGMP 2.0 (inventory + marginal-abatement pathway), and CSRD auto-populate (35 ESRS datapoint mappings)
— pure calculators, no PRNG, with realistic public-magnitude fuel EFs. §7.5 names the deepening
targets: Cat 11 uses **static product-use profiles** with no grid-decarbonisation trajectory (a BEV's
lifetime emissions assume today's grid EF for all 12 years); the EU Methane Regulation compliance flag
is a **single boolean on OGMP level** (the real Reg. 2024/1787 imposes MRV timelines, LDAR frequencies
and venting/flaring bans); the methane cost/abatement tables are synthetic calibrations; and CSRD
auto-populate is **presence-based key matching** over just 35 of the >1,100 ESRS datapoints. Evolution
A adds grid-decarbonisation trajectories to Cat 11, real methane MRV compliance logic, and expanded
ESRS coverage.

**How.** `Scope3Cat11Engine.assess` applies a per-year grid-EF decline path (from the platform's
NGFS/IEA scenario data) so BEV lifetime emissions fall as the grid decarbonises; the methane engine
implements the Reg. 2024/1787 MRV/LDAR/venting requirements beyond the OGMP-level flag; the CSRD
mapping expands toward EFRAG's full IG3 datapoint set with unit validation. Rung 3: calibrate the
methane abatement-cost curve against IEA/OGMP marginal-abatement literature and validate fuel EFs
against IPCC/EPA vintages (resolving the documented AR5/AR6 GWP-vintage mix, 28 vs 29.8).

**Prerequisites.** Fix the harness — §4.2 shows `POST /csrd-auto-populate` **skipped** (and
`/scope3-cat11` untraced); preserve the honest GWP-vintage documentation. **Acceptance:** the §7.4
Cat 11 worked example (762,640 tCO₂ total, crude 56.4%) reproduces at static grid EF, then BEV
lifetime emissions decline under a decarbonising-grid path; the methane compliance flag reflects real
Reg. 2024/1787 requirements; CSRD coverage exceeds 35 datapoints with unit checks.

### 9.2 Energy-emissions analyst with tool-called Cat 11 and methane (LLM tier 2)

**What.** A tool-calling analyst for energy-sector reporting teams: "compute our Scope 3 Category 11
from these fuels and products" (`/scope3-cat11` → lifetime use-phase emissions, top contributor,
intensity), "assess our facility methane and build the abatement pathway" (the OGMP engine → OGMP
level, GWP-100/20 CO₂e, cheapest-first MACC), and "auto-populate our ESRS E1 datapoints" (`/csrd-auto-
populate` → coverage %, gaps, readiness) — narrating the engines' real deterministic outputs.

**How.** Tool schemas over the 2 POST + 8 GET operations; the reference endpoints (methane source
categories, OGMP levels, abatement measures, fuel EFs, product-use profiles, ESRS mappings/minimums)
are exceptional RAG grounding for "what's the OGMP Level 4 requirement?" or "what EF for LNG?"
questions. The no-fabrication validator checks every tCO₂e, tCH₄ and €/tCO₂e against tool output; the
methane MACC (cost-sorted abatement measures) directly answers "what's the cheapest way to cut our
methane?" Composable with `eu_ets` and `facilitated_emissions` in an energy-desk orchestrator.

**Prerequisites.** Evolution A's grid-trajectory and MRV improvements (so narrated Cat 11 and methane
compliance are current); Atlas + reference corpus embedded (roadmap D3). **Acceptance:** every figure
cited traces to an engine tool call; the Cat 11 total and top contributor match `/scope3-cat11`; the
methane MACC ordering matches the engine's cheapest-first pathway; the copilot flags the GWP vintage
(AR5 vs AR6) it used.
