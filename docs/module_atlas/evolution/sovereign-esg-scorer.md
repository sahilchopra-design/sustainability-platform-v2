## 9 · Future Evolution

### 9.1 Evolution A — Build the indicator-weighted pillar model the guide describes (analytics ladder: rung 1 → 3)

**What.** The §7 flag is blunt: the guide promises an indicator-level pillar model (E:12, S:10, G:8 indicators; `Σ(Indicator×Weight)/ΣWeight` from WDI/HDI/CPI/ND-GAIN), but the code builds each country's E/S/G score as a **noisy function of its hand-assigned credit-rating ordinal** (`E = 90 − ratingIdx×12 + sr()×15 − 7`). Real public data (World Bank macro, ND-GAIN, IRENA, EM-DAT) is wired into display-only fields and never touches the score. It is, in effect, a rating-tier proxy dressed as an indicator model — the platform's least-grounded sovereign-ESG module, and the page even carries a §8 spec for the real thing. Evolution A builds the promised model.

**How.** (1) Ingest the named indicators for all 80 sovereigns: World Bank WDI (macro, emissions, renewables), UNDP HDI, Transparency International CPI, ND-GAIN vulnerability/readiness, IRENA, EM-DAT — all free public sources. (2) Normalise each to 0–100 via documented percentile-rank or min-max scaling (the guide names normalisation; none exists today). (3) Compute pillar scores as the real indicator-weighted means with the E:12/S:10/G:8 structure and documented category weights, and the composite from those. (4) Delete the `ratingIdx`-conditioned synthetic formula and the hand-tuned `−7/−6/−7` offsets. (5) Add the data-refresh-cycle and material-change flagging the workflow describes.

**Prerequisites.** Multi-source indicator ingestion and a normalisation reference (percentile baselines per indicator); this is a substantial build — the module currently has essentially no real scoring. **Acceptance:** an E/S/G score recomputes when any constituent indicator changes; the rating ordinal no longer appears in the scoring path; scores are reproducible from documented indicator weights.

### 9.2 Evolution B — Indicator-transparency copilot (LLM tier 1)

**What.** The module's stated value is *transparent* sovereign ESG — "transparency into data sources," "indicator-level pillar scores." Evolution B delivers that conversationally: "which indicators drive this country's governance score?", "how would reweighting toward environmental change the ranking?", "what's the data vintage behind this HDI value?" — answered from the real indicator set and weights, decomposing each pillar to its constituent indicators.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/sovereign-esg-scorer/ask`, corpus = this Atlas record plus the indicator catalogue and source citations. Score explanations enumerate the weighted indicators and their normalised values; reweighting answers recompute the deterministic composite under user weights; source questions cite the WDI/HDI/CPI/ND-GAIN vintage. Refusal for indicators or countries outside coverage.

**Prerequisites (hard).** Evolution A — there are no indicators feeding the score today, so "which indicators drive this score?" has no honest answer; the copilot would have to expose the rating-tier proxy, which contradicts the module's transparency promise. **Acceptance:** every indicator contribution in an explanation matches the computed pillar; a reweight recomputes correctly; asking for an indicator not in the model returns "not tracked," not a fabricated value.
