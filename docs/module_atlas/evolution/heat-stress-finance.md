## 9 · Future Evolution

### 9.1 Evolution A — Couple WBGT to productivity via the ILO exposure-response function (analytics ladder: rung 1 → 2)

**What.** The §7 deep dive documents the module's core defect precisely: WBGT and productivity loss are **independent PRNG seeds** (`wbgt = 24 + sr(i×7)×17`, `prodLoss = 3 + sr(i×11)×22`), so a 41°C city can show lower productivity loss than a 34°C one — the physical→economic linkage that is the entire point of EP-DP1 does not exist. Evolution A builds the §8 chain as a backend vertical: `WorkHoursLost = ExposedWorkers × hours_lost(WBGT, workload_intensity)` per the ILO ERF, monetised with sectoral wages, plus the VSL health EAL, replacing the decoupled seeds.

**How.** (1) Encode the published ILO workload-specific hours-lost curves (loss rises sharply above WBGT 26–33°C by workload class) as a deterministic lookup engine. (2) Seed city WBGT baselines from NASA-POWER/Open-Meteo (already-wired platform sources) instead of `sr(i×7)`; sectoral employment/wages from ILOSTAT for the existing 8 sectors. (3) The RCP scenario tab replaces its flat 1.0/1.4/1.8 multiplier with ΔWBGT per scenario re-evaluated through the ERF — a nonlinear response, which is the honest behaviour. (4) Reconcile the global aggregate against ILO's $2.4tn/yr-by-2030 figure per §8.5.

**Prerequisites.** Removal of the seven independent `sr()` streams per city (fabrication in the platform-guardrail sense); ILOSTAT sectoral data for the 8 regions. **Acceptance:** productivity loss is monotonic in WBGT within a workload class; the worked-example inconsistency in §7.4 (hot city, low loss) becomes impossible by construction.

### 9.2 Evolution B — Heat-risk analyst for sector screening (LLM tier 2)

**What.** A tool-calling analyst for the module's stated buyers (insurers, agri-banks, CHRO teams): "which MENA cities exceed the WBGT 33°C danger threshold and what does that cost in work hours?", "compare construction vs agriculture exposure in South Asia under RCP 8.5", "estimate the health EAL if this city adds 2°C." Each query executes against the Evolution A endpoints and narrates real ERF output with the ILO/Lancet framing already in this page's §4 corpus.

**How.** Tool schemas from the new module routes via the Atlas endpoint map; system prompt built from this page (§7.2 anchor table and §8.3 formulas). The no-fabrication validator checks each $/deaths/hours figure against tool responses. The copilot must expose parameter provenance — which VSL, which workload class — because §8.6 flags VSL as contested. A tier 1 explanation-only slice (narrating the current filtered KPIs with the synthetic-data caveat from §7.5) can ship immediately without backend work.

**Prerequisites (hard).** Evolution A first — the module currently has no backend endpoints, and narrating decoupled seeded data would launder the exact defect §7 documents. **Acceptance:** every numeric traceable to a tool call; asked about a region or sector outside the seeded taxonomy, the analyst refuses with a scope statement.
