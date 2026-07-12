## 9 · Future Evolution

### 9.1 Evolution A — Build the probability-weighted cascade simulation the guide names (analytics ladder: rung 1 → 3)

**What.** The §7 flag identifies the core gap: the guide's `Impact = Σ(P(disruption_tier_n) × Revenue_impact × Duration)` **does not exist** — each `CHOKEPOINTS` entry carries a `prob` field, but it is only rendered as a percentage, never multiplied by revenue-impact or duration to produce an expected loss, and `CASCADE_STEPS` has fixed `lossM` values, not probability-weighted outputs. The module's genuine strengths are real: 5 accurately-researched global chokepoints (Suez, Malacca, Panama, Taiwan Strait, Rhine) with verifiable 2022–2023 events (Panama drought transit cuts, Rhine low-water, TSMC concentration), and a well-structured DAG framing. But it's a static reference + scripted narrative, not a computed risk model. Blast radius is 81. Evolution A builds the simulation.

**How.** (1) Implement the expected-loss calculation: for each chokepoint/tier, `P(disruption) × revenue-impact × duration`, aggregated to portfolio contagion risk — the guide's formula. (2) Make the cascade a real simulation: parameterise disruption origin, severity, and speed so a user can run a different scenario (Thailand flood vs Taiwan Strait closure) and see a different cascade path, rather than the single fixed 8-step narrative. (3) Model upstream attenuation per tier (the DAG propagation the guide describes) as an actual factor. (4) Replace fictional `COMPANIES` with real portfolio holdings joined via the shared supply-chain backend, and ground chokepoint probabilities in INFORM Risk Index / EM-DAT (named but not ingested).

**Prerequisites.** A cascade-propagation engine (the DAG structure is defined); INFORM/EM-DAT ingestion for probabilities; real holdings join. **Acceptance:** expected loss = P × impact × duration computes per chokepoint; changing the disruption origin produces a different cascade path; chokepoint probabilities cite INFORM/EM-DAT.

### 9.2 Evolution B — Supply-chain disruption war-gaming copilot (LLM tier 2)

**What.** A copilot for the resilience analyst: "simulate a Taiwan Strait closure and show the cascade through my portfolio", "which of my holdings are most exposed to the Panama chokepoint?", "what mitigation reduces contagion risk most?" — driving the (Evolution-A) cascade simulation and narrating the propagation, expected losses, and mitigation options (dual-sourcing, buffer stock, nearshoring, parametric insurance — the real taxonomy the module carries).

**How.** Tier-2 pattern once the simulation exists: the cascade-run becomes a tool taking origin/severity/speed; the copilot narrates the propagation path, per-company revenue impact, and recovery timeline, citing the real chokepoint geography and events. Mitigation answers evaluate the `MITIGATIONS` options against the simulated cascade. The no-fabrication validator checks every loss figure against the simulation output.

**Prerequisites (hard).** Evolution A — with no expected-loss calc and only a single scripted cascade, the copilot could only re-narrate fixed demo losses; war-gaming requires the parameterised simulation. **Acceptance:** every loss/impact figure traces to a simulation run with stated parameters; a different disruption origin yields a different narrated cascade; chokepoint facts match the researched real events.
