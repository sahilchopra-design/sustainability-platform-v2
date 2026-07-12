## 9 · Future Evolution

### 9.1 Evolution A — Auto-sourced investee data across the disclosure trio (analytics ladder: rung 2 → 3)

**What.** A regulatory disclosure trio implemented inline: PCAF financed emissions
(`POST /pcaf/financed-emissions`), the 14 mandatory SFDR PAI indicators (`POST /sfdr/pai`),
and EU Taxonomy alignment by the six environmental objectives (`POST /eu-taxonomy/alignment`) —
each computed in-route and persisted. It falls back to a static `_SECTOR_EMISSION_INTENSITY`
table (Energy 850, Utilities 620 … Default 150 tCO₂e/€M) when investee emissions are missing.
The EU Taxonomy tables are real-db (17 assessments traced `passed`), but the sector-proxy
estimation is coarse and PAI/PCAF inputs are caller-supplied. Evolution A grounds them.

**How.** (1) Replace the static sector-intensity proxy with EDGAR/market-data-sourced investee
emissions and EVIC (via `financial_data`), reporting a PCAF DQS per estimate so the proxy is a
labelled fallback, not a silent default. (2) Reconcile the three pipelines' shared inputs —
the same investee should feed PCAF, PAI, and Taxonomy consistently, drawing from one
per-investee record (`pcaf_investees`) rather than three separate payloads. (3) Ground the EU
Taxonomy DNSH flags in the `eu_taxonomy_activities` evidence the sibling `gar` module also
uses. (4) Bench-pin financed emissions, all 14 PAIs, and the alignment ratios.

**Prerequisites.** `financial_data` emissions/EVIC linkage; a unified per-investee store.
**Acceptance:** sector-proxy estimation carries a DQS and is used only as labelled fallback; a
single investee produces consistent PCAF/PAI/Taxonomy figures; DNSH flags trace to activity
evidence; bench pins pass for all three pipelines.

### 9.2 Evolution B — Regulatory-disclosure copilot spanning PCAF/SFDR/Taxonomy (LLM tier 2)

**What.** A copilot that runs all three pipelines for a portfolio and drafts the disclosure —
"your financed emissions are X tCO₂e; PAI 4 (carbon footprint) is Y; 32% of turnover is
Taxonomy-aligned with 3 activities failing DNSH on water" — each figure tool-sourced, plus
retrieval of stored assessments via the list/get endpoints.

**How.** Three POST computational endpoints plus read endpoints over the real-db Taxonomy/PAI
tables. The copilot's value is producing the cross-regulation narrative a bank's disclosure
team assembles by hand, always citing which pipeline produced each number. The 14-PAI structure
lets it enumerate exactly which indicator is which. This is a central node for a
financial-institution regulatory desk, cross-linking to `sfdr_annex`, `gar`, and
`pcaf_asset_classes` copilots.

**Prerequisites.** Evolution A for consistency — a copilot narrating PCAF and PAI from
independently-keyed inputs could report contradictory investee emissions. **Acceptance:** every
emissions, PAI, and alignment figure traces to a tool response; the copilot flags when a figure
rests on the sector-proxy fallback rather than reported data; it refuses to assert regulatory
compliance and frames outputs as the computed disclosures.
