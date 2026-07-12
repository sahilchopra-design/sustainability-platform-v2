## 9 · Future Evolution

### 9.1 Evolution A — Real campaign records from 13D/13G ingestion (analytics ladder: rung 1 → 3)

**What.** The module's 60 campaigns pair real activist names (Elliott, Engine No.1, Follow This) with real targets, but every campaign attribute is `sr()`-fabricated — §7.6 notes Carl Icahn can be randomly assigned a "Climate Action" campaign, and the +3% mean-shifted `stockImpact` is a designed seed characteristic that merely resembles the Brav et al. literature. The workflow the overview promises ("monitor SEC 13D/13G filings") is exactly what's missing. Evolution A builds the first backend vertical: ingest Schedule 13D/13G filings from SEC EDGAR (free, keyless) into an `activist_campaigns` table, so campaign existence, filer, target, stake, and dates become facts.

**How.** (1) An EDGAR ingester on the platform's 19-ingester scaffold filtering form types SC 13D/13D-A/13G, resolving filers against the known activist roster and targets via `entity_lei`. (2) `GET /api/v1/activism/campaigns` serving real records; the §5 Activism Exposure Score (stake × intensity × materiality) finally computes over disclosed stakes instead of draws. (3) Measured `stockImpact`: announcement-window abnormal return from ingested price history where available, reported with the event window stated — and honestly absent otherwise, replacing the rigged positive-mean formula. (4) Campaign status transitions (Active/Settled/Won/Lost) sourced from amendment filings rather than a random pick.

**Prerequisites.** EDGAR rate limits; price-history coverage decides how many campaigns get abnormal-return figures (report coverage, don't backfill). **Acceptance:** every rendered campaign links to an accession number on EDGAR; the average stockImpact is whatever the data says, not +3% by construction.

### 9.2 Evolution B — Filing reader and demand classifier (LLM tier 2)

**What.** 13D Item 4 ("Purpose of Transaction") is free text where activists state their demands — the classification task the module currently fakes with a random `type` field. Evolution B has the LLM read each ingested filing's Item 4 and exhibit letters, classify demands against the module's 8-type taxonomy (Board Seat, Climate Action, Governance Reform, etc.), tag ESG themes, and summarise the demand letter — with the structured verdict written back to `activist_campaigns` for the deterministic exposure score to consume.

**How.** Tier-2 extraction pattern: filing text in, structured JSON out (types, ESG flags, quoted evidence span per classification); low-confidence classifications route to a review queue rather than auto-committing. Each `(filing, classification)` pair logs to `llm_traces` — a labelled corpus for the Tier-4 flywheel. The proxy-voting tab's copilot answers "how did support for climate proposals trend at this target?" strictly from stored vote records once proxy data is added.

**Prerequisites (hard).** Evolution A's ingestion — there is nothing real to classify today; classifying synthetic campaigns would launder fabricated data through an LLM. **Acceptance:** every classification cites a verbatim span from the filing; a filing with no ESG content classifies as financial-only, demonstrating the classifier can say no.
