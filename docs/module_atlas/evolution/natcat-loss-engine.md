## 9 · Future Evolution

### 9.1 Evolution A — From EP lookup table to computed exceedance curves (analytics ladder: rung 1 → 3)

**What.** §7 documents the gap plainly: despite the "probabilistic loss engine" framing, the code is a pre-baked lookup — `EP_DATA` is a hand-authored 11-point return-period table with four pre-computed scenario columns, and headline AAL/PML are stored anchors ($1.82Bn/$3.1Bn/$4.6Bn) scaled by fixed `SCENARIO_MULT` constants (1.0/1.24/1.61/2.38). No hazard-vulnerability-exposure convolution runs. Evolution A computes EP curves from the platform's own hazard data over a real exposure set.

**How.** (1) Reuse the Physical Risk Digital Twin: the populated `ref_*_zones` grids (earthquake 4,500 / cyclone 4,470 / wildfire 5,378 rows from USGS/IBTrACS/GWIS) and the `global_physical_risk_engine` scoring path give per-location hazard frequency-intensity; the sibling `physical-risk-pricing` engine already fits return-period loss points — this module becomes its portfolio-level aggregation layer rather than a parallel implementation. (2) Accept the §1-described exposure upload (location, construction, occupancy, TIV), apply peril-specific vulnerability curves (FEMA Hazus damage functions are public), and derive the EP curve empirically from simulated annual maxima; AAL = numerical integral of the curve, PML_T read off it per the §5 formula. (3) Climate uplift moves from one scalar to per-peril AR6 hazard-frequency multipliers, documented per Atlas §8.

**Prerequisites.** Flood grid is thin (48 rows) — flood EP claims must carry a coverage caveat until FEMA NFHL/JRC gridding lands; a fixed-seed simulation reference case pinned in `bench_quant`. **Acceptance:** two portfolios with different geography produce different EP curves (today all inputs yield the same stored curve); AAL equals the integral of the displayed curve within tolerance.

### 9.2 Evolution B — Reinsurance-analyst copilot over computed EP output (LLM tier 2)

**What.** A tool-calling analyst for treaty and capital questions: "what's the 250-year PML for the US-Southeast wind book?", "how much does an RCP8.5-2050 view raise AAL?", "which construction class drives the tail?" — executed against the Evolution-A endpoints and answered strictly from returned EP/AAL/PML decompositions. Solvency II SCR and TCFD framings come from the standards already named in §5 (EIOPA NatCat methodology, IPCC AR6 Ch.11), quoted from corpus.

**How.** Tool schemas over the new `POST /natcat/run` and decomposition endpoints; system prompt from this Atlas page's §5 methodology and §7 limitation notes so the copilot correctly explains what an EP curve is and what the model does not capture (post-event demand surge, secondary uncertainty). Stochastic discipline: quoted PMLs carry simulation seed, year-count, and engine version (roadmap Tier-2 provenance UX); scenario comparisons hold the event set fixed. Fabrication validator matches all currency figures to tool outputs.

**Prerequisites (hard).** Evolution A first — there is nothing legitimate to narrate today; a copilot explaining the current stored-constant losses as "probabilistic modelling output" would misrepresent the module exactly the way its own §7 warns against. **Acceptance:** every loss figure traceable to a run ID; asking for perils/regions outside the exposure set yields a refusal listing what was actually modelled.
