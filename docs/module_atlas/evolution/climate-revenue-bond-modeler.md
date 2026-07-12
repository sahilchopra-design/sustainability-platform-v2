## 9 · Future Evolution

### 9.1 Evolution A — Backend revenue-bond vertical with physical-risk revenue attenuation (analytics ladder: rung 2 → 3)

**What.** EP-DY2 is a tier-B frontend-computed module today: the DSCR math and 10-year
`revenueProjection` are genuine in-page calculations, but the "climate risk revenue
discount" is a static `STRESS_SCENARIOS` table and the ESG sub-scores are `sr()`-seeded.
Evolution A implements the §8 specification (explicitly marked "not yet implemented"):
a backend vertical computing `PhysRiskDiscount_t = Σ_peril P(peril)·RevenueSensitivity_peril`
from the platform's own hazard grids instead of hand-written `revenueChg` rows.

**How.** (1) New route pair (`POST /api/v1/revenue-bond/model`, `/stress`) housing the
waterfall: pledged revenue, user `rateIncrease`, 3%-inflating O&M, level debt service —
porting the existing `revenueProjection` expression verbatim so frontend and backend
agree. (2) Service-area geocode → composite peril scores from the digital-twin
`ref_*_zones` grids → per-peril revenue-sensitivity vector by sector (toll vs utility
vs TIF differ materially). (3) Replace the seeded `eScore/sScore/gScore` block with the
greenium-net-of-SPO calc from §8.3 (`NetGreenBenefit = |Greenium|·Duration·Notional −
SPO_cost`), sourcing greenium bounds from the documented BIS/OECD −1 to −5 bp range as
an honest curated table.

**Prerequisites.** Acknowledge and remove the §7.5-documented `sr()` seeding; flood and
sea-level grids still have thin coverage (48/152 rows), so the peril cascade must report
`resolution_tier` and fall back honestly. **Acceptance:** two bonds with identical
financials but different service-area coordinates produce different climate-adjusted
DSCR; year-0 worked example (1.56×) reproduces exactly.

### 9.2 Evolution B — Issuance-structuring copilot over live DSCR runs (LLM tier 1 → 2)

**What.** A copilot on the EP-DY2 page that explains coverage outcomes in
rating-agency language — "why did the −15% stress breach the 1.25× IG threshold?" —
grounded in the page's computed `revenueProjection` and `stressData`, and (tier 2, once
Evolution A lands) executes structuring what-ifs as tool calls: "sculpt debt service so
climate-stressed DSCR holds 1.35×", "size the issue at the covenant floor".

**How.** Tier 1 needs no new backend: the grounding corpus is this Atlas record (§5
headline formula, §7.4 worked example, the 1.25×/1.35×/1.5× threshold conventions) plus
the current page state serialized into the prompt; answers must cite which stress row
or projection year they reference. Tier 2 derives tool schemas from the Evolution A
OpenAPI operations, with the no-fabrication validator checking every DSCR figure in the
answer against tool outputs in-conversation.

**Prerequisites.** Tier 2 is blocked on Evolution A — today there are no module
endpoints to call, and a copilot must not narrate the seeded ESG scores as if they were
computed. **Acceptance:** copilot refuses greenium questions beyond the documented
BIS/OECD range evidence; every numeric traceable to page state or a tool call; the
covenant-breach explanation cites the exact stress scenario row that produced it.
