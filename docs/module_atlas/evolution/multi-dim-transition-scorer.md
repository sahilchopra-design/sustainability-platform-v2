## 9 · Future Evolution

### 9.1 Evolution A — Expand the 6-company universe with live-data pillars (analytics ladder: rung 1 → 3)

**What.** This is a thin but honest tier-B module: §7 confirms the 6-pillar weighted composite (`0.22×Carbon + 0.18×Tech + 0.20×Policy + 0.18×Market + 0.12×Capital + 0.10×Social`) is implemented exactly as documented, over just 6 hand-researched companies (Shell, Vestas, BASF, RWE, Lufthansa, BlackRock) — the "Universe Ranking" tab re-ranks the same 6. Evolution A builds its first backend vertical: a scorer endpoint that computes at least the Carbon Exposure pillar from real ingested data rather than hand-typed values, and widens the universe.

**How.** (1) New route `api/v1/routes/transition_scorer.py` with `POST /score` taking a company identifier; resolve via the GLEIF `entity_lei` layer, pull Scope 1/2 intensity from the OWID/CDP-derived refdata already in the platform, and compute the Carbon pillar per the documented components. (2) Keep Proprietary-tier pillars hand-curated but store them in a `transition_pillar_scores` table with `source` and `as_of` columns so the public/proprietary toggle compares data vintages honestly. (3) Preserve the existing 6 companies as pinned regression cases — their hand-researched scores become the calibration anchor for the computed pillar.

**Prerequisites.** Emissions-intensity coverage check for target universe (~50 names); the A–E rating cutoffs (75/60/45/30) must be re-validated once computed scores shift distributions. **Acceptance:** Vestas and RWE Carbon-pillar scores derive from cited emissions rows, and the composite still reproduces the documented weight formula to 2 dp.

### 9.2 Evolution B — Transition-rating copilot with pillar-cited explanations (LLM tier 1)

**What.** A copilot answering "why is RWE rated C on Public data but B on Proprietary?" strictly from the page's own structures: each company's two parallel score vectors, the per-pillar `data_sources` citation lists (§7.1 notes these are hand-researched and genuinely traceable), and the 2–3 `news_signals` headlines per company. The unusually clean provenance of this module — every pillar score carries its own citations — makes it a strong tier-1 pilot despite the small universe.

**How.** System prompt assembled from this Atlas page (§5 weights and rating bands, §7.2 pillar component table) plus the serialized `COMPANIES` array; serve through the roadmap's shared `POST /api/v1/copilot/{module_id}/ask` router with prompt caching (the corpus is static). Every rating explanation must decompose into the six weighted pillar terms and quote the relevant `data_sources` entry; the refusal path covers companies outside the 6-name universe ("this module scores 6 reference companies; use X for broader coverage") and forward-looking questions the scorer does not model.

**Prerequisites.** None hard — this is a pure tier-1 explainer over existing hand-curated data; upgrade to tool-calling only after Evolution A's `/score` endpoint exists. **Acceptance:** for each of the 6 companies, the copilot's rating explanation reproduces the exact weighted sum and cites at least one per-pillar source; queries about a 7th company refuse rather than extrapolate.
