## 9 · Future Evolution

### 9.1 Evolution A — Implement the OAE mass-balance model and de-synthesize projects (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag: the guide states an OAE mass-balance (`ΔDIC = (TA_added × Revelle_factor) / seawater_volume; net_CDR = ΔDIC × verification_factor`) that is not implemented — no project computes ΔDIC, no Revelle factor, no seawater volume. The module presents six real ocean-CDR approaches with hand-set reference figures (broadly consistent with literature) plus 18 synthetic projects (real operator names — Running Tide, Ebb Carbon, Planetary, Equatic — but `sr()`-jittered numbers, `lcoc = baseLcoc × (0.8 + sr()×0.4)`). Evolution A builds the OAE removal model and replaces jittered project economics with real disclosed data.

**How.** (1) Implement the OAE net-CDR calculation the guide specifies as `POST /api/v1/ocean-cdr/oae` — ΔDIC from alkalinity addition and the Revelle buffer factor, net CDR after a verification/efficiency discount, grounded in the Nature 2024 OAE verification framework and Ebb Carbon field-trial data named in §5. (2) Replace the 18 `sr()`-jittered projects with a curated real-project table sourced from operator annual reports and CDR.fyi (Running Tide and Ebb Carbon publish CDR figures — named in §5), each with real funding stage and buyer; keep it honest-null where a startup discloses nothing. (3) Anchor `MARKET_SIZING` (currently pure exponential `0.1×2.5^i` with no historical anchor) to actual delivered-tonnes data as it accumulates.

**Prerequisites.** Ocean chemistry parameters (Revelle factor varies by region/temperature — needs a documented source per Atlas §8); operator-disclosure availability is thin for pre-commercial CDR (accept sparse coverage). **Acceptance:** the OAE endpoint computes net CDR from alkalinity and seawater inputs; project economics reflect disclosed figures, not ±20% jitter; no `sr()` in project numbers.

### 9.2 Evolution B — Frontier-CDR diligence copilot (LLM tier 1 → 2)

**What.** A copilot for the developers/buyers/scientists §1 targets: "compare OAE and kelp farming on cost, potential, and permanence", "what MRV challenges does ocean iron fertilisation face?", "estimate net CDR for a 10,000t alkalinity addition" — grounded in the six real approach cards, the MRV-challenge dimensions, and the OAE/NOAA references named in §5.

**How.** Tier 1 answers approach-comparison and MRV questions from the curated `CDR_APPROACHES` and `MRV_CHALLENGES` data (§7.1), correctly conveying that iron fertilisation is "Very High" risk given its real controversial trial history. Tier 2, post-Evolution-A: the net-CDR estimate becomes a tool call to the OAE model, with the fabrication validator matching quoted tonnes/costs to outputs. The copilot must not present the synthetic project pipeline as real deal data until Evolution A, and must convey the deep uncertainty of pre-commercial ocean CDR (permanence claims of 10,000yr are theoretical, MRV is unproven) rather than false precision.

**Prerequisites.** Tier 1 on curated approach data; net-CDR estimation needs Evolution A's OAE model. **Acceptance:** approach comparisons cite real `CDR_APPROACHES` figures; net-CDR estimates trace to the OAE tool; the copilot flags MRV/permanence uncertainty and refuses to treat synthetic projects as real.
