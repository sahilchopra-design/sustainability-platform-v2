## 9 · Future Evolution

### 9.1 Evolution A — Real network in, calibrated cascade out (analytics ladder: rung 2 → 3)

**What.** The backend is genuine and already scenario-capable: `ContagionEngine` computes channel-weighted edge weights (financial 0.45 / supply_chain 0.35 / regulatory 0.20), L1–L3 intensities with cross-pillar amplifiers, stability checks, and cascade simulation across 8 endpoints — `ref/parameters` even exposes an `empirical_targets` key. The gap is upstream and on the page: the frontend's ENTITIES network is `sr()`-seeded (centralities, exposures, stressed PDs, the in-page SIR model with `sr(t*17)` noise), and only `edge-weight` and `ref/parameters` traced `passed`; the five other POSTs were `skipped`, never exercised end-to-end. Evolution A feeds the engine a real network and calibrates it.

**How.** (1) Build the adjacency input from platform data instead of seeds: counterparty edges from the Sprint-DN supply-chain tables and `energy-supplier-network` relationships, entity nodes resolved via `entity_lei` (GLEIF). (2) Page computes centralities from the actual graph (networkx server-side, returned by a new `/network-stats` endpoint) and calls `POST /simulate` for cascades — deleting the client-side SIR and seeded SHOCK_SCENARIOS losses. (3) Calibration: fit `CROSS_SECTOR_DEFAULTS` and channel weights against the 16 curated HIST_EVENTS (recovery times, affected counts) and document fit error against the engine's own `empirical_targets`.

**Prerequisites.** Supply-chain edge coverage audit (the graph is only as real as its edges — sparse coverage must be disclosed, not padded); lineage sweep re-run to exercise the 5 skipped POSTs. **Acceptance:** all 8 endpoints `passed` with real source tables; cascade results change when a real edge is removed; calibration error vs HIST_EVENTS published in the response.

### 9.2 Evolution B — Contagion war-gaming analyst (LLM tier 2)

**What.** A tool-calling analyst for stress questions: "if a major EU utility defaults, which portfolio names are hit within two hops, and does the network stay stable?" The LLM composes the module's real endpoint chain — `edge-weight` → `l1/l2/l3-intensity` → `aggregate` → `stability-check` → `simulate` — and narrates propagation paths, amplifier nodes, and stability verdicts strictly from returned payloads, citing the channel weights and cross-pillar amplifiers from `ref/parameters` when explaining *why* a path dominates.

**How.** Tool schemas from the 8 existing OpenAPI operations (all POST bodies are Pydantic-typed); grounding corpus = this Atlas record's §2.3 constants table and §5 methodology. Scenario framing ("regulatory shock in Materials") maps to the engine's typed event parameters — never to free-form numbers. The no-fabrication validator checks every intensity and loss figure against tool outputs; the "show work" expander lists the exact call sequence, which doubles as a reproducibility artifact for risk-committee review.

**Prerequisites (hard).** Evolution A's real network — war-gaming a seeded graph produces confident nonsense about named institutions (the page seeds G-SIB tiers for real entity names today). **Acceptance:** a golden scenario's narrated cascade matches a scripted replay of the same tool calls; questions about entities absent from the graph get "not in network," not interpolated exposure.
