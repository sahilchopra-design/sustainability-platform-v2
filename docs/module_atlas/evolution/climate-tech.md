## 9 · Future Evolution

### 9.1 Evolution A — Wire the page to its own engine and ingest real patent flow (analytics ladder: rung 1 → 3)

**What.** §7.5 states the on-page company universe is entirely `sr()`-seeded — TRL,
funding, IRR and impact are independent random draws ("a TRL-3 seed can carry a high
IRR") — while a real backend exists and is ignored: `climate_tech_engine` behind 8
routes, whose 4 ref GETs (`/ref/ctvc-taxonomy`, `/ref/iea-deployment`, `/ref/mac-curves`,
`/ref/vc-market-data`) already pass the lineage harness. Evolution A retires the seeded
universe: sector dashboards read the CTVC taxonomy and VC market data from the engine,
the learning-curve endpoint powers cost-decline analytics, and patent activity — the
overview's "leading indicator" — comes from a real EPO OPS ingest (free, keyless tier)
instead of seeded `CPC_CLASSES` counts.

**How.** (1) Fix the four failing POSTs (`/assess-technology`,
`/investment-opportunity`, `/portfolio-analysis`, `/learning-curve`) — harness status
`failed` needs triage before anything narrates them. (2) Frontend swap: `SECTORS`
funding/TAM panels → `/ref/vc-market-data`; TRL distributions → `/ref/iea-deployment`;
CTIGR computed from the ingested series rather than the fixed
`[0.04…0.19]` share vector. (3) New 20th-ingester-pattern job pulling EPO CPC Y02
patent counts by class and year into a `climate_patent_activity` table; benchmark the
computed CAGR against the EPO's published +15% figure. (4) Enforce internal
consistency: TRL bounds stage/IRR priors in `assess-technology`.

**Prerequisites.** POST-endpoint triage; EPO OPS registration (free but throttled —
respect the ingestion framework's rate-limit learnings). **Acceptance:** zero `sr()`
company attributes rendered; patent CAGR by sector reproducible from the ingested
table; CTIGR recomputes when the ingest updates.

### 9.2 Evolution B — Investment-screening analyst over the assessment endpoints (LLM tier 2)

**What.** A tool-calling analyst for climate investors: "assess a Series B green
hydrogen electrolyzer company, 2 MtCO₂e/yr avoided at scale" invokes
`POST /assess-technology` and `/investment-opportunity`, then situates the result
against `/ref/mac-curves` (where does it sit on the abatement cost curve?) and
`/ref/iea-deployment` (is deployment ahead of or behind the NZE trajectory?) — a
synthesis the page's tabs currently leave to the analyst's eye. Portfolio questions
("how concentrated is my TRL risk?") route to `/portfolio-analysis`.

**How.** Tool schemas from the module's 8 OpenAPI operations, ref GETs unrestricted,
assessment POSTs read-only in effect (no persistence). Grounding: §5 (CTIGR
definition), §7's provenance table so the copilot knows which numbers are curated
(BNEF-shaped `yearlyFunding`, `MARKET_TAM`) versus computed. The learning-curve
endpoint gives the copilot a legitimate forward-looking tool — cost projections come
from Wright's-law math in the engine, never from the model's own priors.

**Prerequisites (hard).** All four assessment POSTs passing; Evolution A's de-seeding,
since an analyst summarizing randomly-drawn IRRs would launder fabrication through
fluent prose. **Acceptance:** every numeric in an assessment memo traces to a tool
output; asked about a company not in the data, the copilot runs a fresh assessment or
declines — it never retrieves a synthetic seed row.
