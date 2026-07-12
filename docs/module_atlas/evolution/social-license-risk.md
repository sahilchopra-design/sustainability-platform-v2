## 9 · Future Evolution

### 9.1 Evolution A — Implement the weighted risk formula and add news-driven signal (analytics ladder: rung 1 → 2)

**What.** The module is a hand-authored case-study library — 15 real named extractive/energy projects (Adani Carmichael, Trans Mountain, Oyu Tolgoi, Simandou) with manually entered `slScore`, FPIC status, protests, litigations, and community-benefit delivery. There is no `sr()` anywhere, which is honest, but §7 flags that the guide's headline `SocialRisk = 0.30×FPIC + 0.25×CommunityGap + 0.25×ProtestRisk + 0.20×LitigationRisk` is **not implemented** — `slScore` is a hand-typed constant that cannot be recomputed or audited from the other fields on its own row. Evolution A makes the score a real function of its inputs and adds a live signal so the snapshot isn't frozen.

**How.** (1) Implement the weighted formula in a small backend endpoint: normalise FPIC status to a 0–100 sub-score, compute community-gap from promised-vs-delivered, and scale protest/litigation counts — so `slScore` is derived and auditable, with the hand-set values retained only as a validation reference. (2) Add a live controversy signal: query GDELT (free, keyless, already used elsewhere on the platform) for protest/litigation news per project, giving `protests`/`litigations` a refreshable basis and enabling a trend rather than the current single snapshot. (3) Project-specific stakeholder maps replacing the one generic `STAKEHOLDERS` archetype set applied uniformly to a Guinea mine and a UK offshore wind farm.

**Prerequisites.** FPIC-to-score and protest-count normalisation need defensible bands (IFC PS7 informs FPIC weighting); GDELT entity matching to project names. **Acceptance:** `slScore` recomputes from the four named inputs and matches the formula; changing protest count moves the score; each project shows a distinct stakeholder map.

### 9.2 Evolution B — Social-license monitoring copilot (LLM tier 2)

**What.** A copilot for the ESG/project-finance analyst: "what's driving Adani Carmichael's low social-license score?", "which projects have contested FPIC and rising protest activity?", "summarise this quarter's community-benefit delivery gaps". It reads the derived sub-scores and, post-Evolution-A, the live GDELT feed — narrating why a score is what it is from its components and surfacing emerging opposition news with dated citations.

**How.** Tier-2 pattern once the live feed exists: the GDELT query is a tool call; the LLM reads returned articles, classifies them as protest/litigation/community-relations signal per project, and updates the risk narrative. Score explanations decompose the weighted formula (FPIC/gap/protest/litigation contributions). Every controversy claim cites a retrievable article; the fabrication validator checks score figures against the endpoint. IFC PS7 / UNDRIP framework grounding for the FPIC interpretation.

**Prerequisites (hard).** Evolution A — with `slScore` hand-typed and unauditable, the copilot could only restate a number it cannot explain, and there is no live feed to monitor. **Acceptance:** every score explanation ties to the formula's components; each emerging-risk claim links to a GDELT article; a project with no recent news yields "no new signal," not an invented protest.
