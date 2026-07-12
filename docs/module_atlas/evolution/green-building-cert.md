## 9 · Future Evolution

### 9.1 Evolution A — Implement the Energy Performance Gap score and ground benchmarks in EPC data (analytics ladder: rung 1 → 2)

**What.** §7 flags that the guide's headline Energy Performance Gap score (`EPG = (EUI_actual − EUI_benchmark)/EUI_benchmark × 100`, flagging assets above +20% and awarding top labels below −15%) does not appear in the code; the actual `SCHEME_EVAL` computes a five-metric composite (energy/carbon/water/…) reused across all 15 certification schemes. A genuine strength (§7.5) is that there's no PRNG — the portfolio is user-supplied via localStorage with an honest empty state, and metric defaults fill missing fields. Evolution A implements the missing EPG score alongside the composite, and grounds the EUI benchmarks in real data: the platform's EPC (Energy Performance Certificate) feed wired in wave-1 provides actual building energy-intensity benchmarks by type/region, replacing the `ei||150` default fills with sourced figures.

**How.** (1) Add `EPG = (EUI_actual − EUI_benchmark)/EUI_benchmark × 100` with the +20%/−15% flags per §5, keeping the five-metric composite as the certification-achievability view. (2) Benchmarks from the EPC dataset by building type and climate zone rather than a flat 150 default. (3) SFDR PAI 18 (energy-inefficient real estate) monitoring computed from EPG, and EU Taxonomy real-estate TSC alignment flagged per asset.

**Prerequisites.** EPC benchmark data by building type/region (wave-1 EPC source); user-supplied portfolio (the module already handles this well). **Acceptance:** EPG computes per the §5 formula and drives the +20%/−15% flags; benchmarks come from EPC data not a flat default; PAI 18 assets are identified from computed EPG.

### 9.2 Evolution B — Certification-and-retrofit copilot (LLM tier 1 → 2)

**What.** A copilot for real-estate ESG managers: "which uncertified assets are closest to BREEAM Excellent, and what's the EPG gap I'd need to close?" narrates the certification status and five-metric composite from the atlas corpus, with tier-2 computing EPG and gap-to-certification via the Evolution A engine.

**How.** Tier 1 grounds on §5/§7 (BREEAM/LEED/ENERGY STAR schemes, the composite logic, EU Taxonomy real-estate TSC, SFDR PAI 18). Because the composite engine is real and PRNG-free, an explainer over the user's portfolio ships early. Tier 2 tool-calls the EPG/gap endpoint so "distance to certification" is computed. Every EUI and score figure validated against tool output; the copilot handles the empty-portfolio state gracefully rather than inventing assets.

**Prerequisites.** Evolution A for EPG computation and real benchmarks; corpus embedding. **Acceptance:** every EPG and gap figure traces to a tool call or rendered state; the copilot uses EPC-grounded benchmarks post-Evolution-A; with no portfolio loaded it prompts onboarding rather than fabricating data.
