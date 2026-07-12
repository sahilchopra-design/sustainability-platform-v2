## 9 · Future Evolution

### 9.1 Evolution A — Consume the engine's real IEA data; build the demand projection (analytics ladder: rung 1 → 2)

**What.** §7 describes a self-inflicted wiring failure: the backend
`critical_minerals_engine` holds authentic IEA CRM 2024 reference tables (real HHI,
top-3 country shares, recycling rates), real EU CRMA Annex I/II flags, IRMA chapter
weights matching v1.0, and OECD 5-step composites — but the page fires one
fire-and-forget `POST /assess`, discards the response, and renders `seed()`-generated
scores instead; even the IEA card's displayed 30/30/25/15 weights aren't applied
(the composite is a flat 4-way average). And nowhere does the guide's flagship
`Demand(t) = Σ_tech Deployment × Intensity × (1 − Recycling)` time series exist.
Evolution A wires the real data, then builds the projection.

**How.** (1) Wiring: the criticality tab consumes `POST /assess` and
`GET /ref/mineral-profile/{name}` — fixing that profile route first (harness status
`failed`) — so displayed HHI and shares are the engine's authentic values; apply the
stated 30/30/25/15 weights or correct the card. (2) Demand projection: implement the
formula in the engine using IEA deployment pathways × material-intensity coefficients
(the guide quotes NMC811 kg/kWh figures — that granularity exists publicly), with the
recycling-rate trajectories already in the engine's tables; supply gap = demand −
committed supply. (3) The engine's `_seed_float` hash fallback for absent entity
fields gets an explicit `provenance: fallback` marker in responses so downstream
consumers can distinguish. (4) Shared-engine caution: `critical_minerals_engine`
serves 2 modules — coordinate with `critical-minerals-climate`.

**Prerequisites (hard).** Frontend `seed()` purge; the mineral-profile route fix;
deployment/intensity table curation. **Acceptance:** page HHI matches
`ref/country-concentration` exactly; lithium 2035 demand reproduces from the
deployment×intensity decomposition; the CRMA 65% single-country breach test fires on
real shares.

### 9.2 Evolution B — Multi-standard sourcing-assessment analyst (LLM tier 2)

**What.** The engine already composes four real frameworks (IEA criticality, EU CRMA
compliance with the Art. 5 benchmarks, IRMA chapter scoring, OECD 5-step) — a
multi-standard assessment an analyst currently reads as separate numbers. Evolution B
is a tool-calling analyst that runs `POST /assess` for a described sourcing
portfolio and narrates the composite: which framework drives the risk score (the
engine's own 0.40/0.30/0.30 weighting), where the CRMA breach test bites, what the
IRMA gap means operationally — and drills into `GET /ref/irma-criteria` and
`/ref/oecd-5step` to quote requirement text rather than paraphrasing from memory.

**How.** Tool schemas over the 8 mapped operations (6 ref GETs are citable grounding;
`/assess` is the computation; `/supply-chain-map` needs its skipped-fixture added).
The provenance marker from Evolution A matters here: the analyst must disclose when
an entity score came from the engine's hash fallback rather than supplied data —
"assessed from defaults" is a materially different statement than "assessed from
your disclosures". Fabrication validator on all scores and shares.

**Prerequisites.** Evolution A's wiring and provenance marker; supply-chain-map
fixture. **Acceptance:** every framework score in a narrative matches the assess
payload; requirement quotes match the ref endpoints verbatim; fallback-scored fields
are disclosed as such in the prose.
