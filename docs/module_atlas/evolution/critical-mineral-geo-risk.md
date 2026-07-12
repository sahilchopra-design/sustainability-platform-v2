## 9 · Future Evolution

### 9.1 Evolution A — Compute the GeoRisk composite by borrowing the sibling's HHI (analytics ladder: rung 1 → 2)

**What.** EP-CV3's data is real and well-chosen — curated mining shares, China
processing percentages, OECD friendshoring shares, and a price trend that tracks the
actual 2022 lithium spike — but §7's flag holds: the promised
`GeoRisk = SupplyConcentration × ProcessingConcentration × GeopoliticalInstability`
is never formed; the only computed values are `100 − x` complements. §7.5 points at
the fix: the sibling `critical-mineral-geopolitics` module already computes real
mining/processing HHI over the same kind of share data. Evolution A assembles the
composite from parts that mostly exist.

**How.** (1) Extract the HHI computation into a shared frontend engine (or a small
backend service both modules call) rather than duplicating — the platform's
shared-engine convention, applied deliberately this time. (2) Instability term: real
World Bank WGI political-stability percentiles per producing country (public,
curated refdata table), production-share-weighted per mineral — replacing the
missing third factor with a cited source rather than a seed. (3) Compose GeoRisk as
the documented product, normalized 0–100, with the three factors inspectable in a
drill-down; classify against stated thresholds. (4) Scenario cards stay editorial
but gain a computed hook: an export-control scenario recomputes the processing-
concentration factor with the restricted share removed, showing the GeoRisk delta.

**Prerequisites.** Coordination with `critical-mineral-geopolitics` (shared engine,
shared curated shares — one source of truth); WGI table curation. **Acceptance:**
rare earths (China 90% processing, low-WGI adjacency) scores above PGMs (18% China,
diversified) via the computed product; the drill-down shows all three factors and
their sources; a scenario toggle changes GeoRisk through the concentration factor
arithmetic.

### 9.2 Evolution B — Export-control scenario narrator (LLM tier 1)

**What.** The module's five curated export-control scenarios (probability bands,
price-spike ranges) are its most decision-relevant content but sit as static cards.
Evolution B turns a selected scenario into an impact narrative for the user's
context: which minerals' (post-Evolution A) GeoRisk moves and why, which
`PORTFOLIO_IMPACT` companies carry the exposure with their stored mitigation
strategies, what the friendshoring math says about substitution headroom
(`reshoreGapPct`, cost premium) — all quoted from the curated and computed fields,
with the scenario's probability band presented as the editorial estimate it is.

**How.** Tier-1 RAG over this Atlas record and the curated datasets; selected
scenario and mineral state pass as context. Honesty rules from §7.6: scenarios are
"static editorial cards, not probabilistic model outputs" — the copilot must
attribute probability bands to editorial judgment and never sharpen them into model
outputs; portfolio impact rows are editorial assessments of real companies and get
the same labelling. Tier 2 waits for a backend (the module has no endpoints).

**Prerequisites.** Evolution A (narrating a composite that doesn't exist yet is the
current trap); corpus embedding (D3). **Acceptance:** narratives cite scenario
cards, curated shares, and computed GeoRisk deltas distinctly; asked "what's the
probability really?", the copilot states the band's editorial provenance; companies
outside `PORTFOLIO_IMPACT` get no invented exposure assessment.
