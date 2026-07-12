## 9 · Future Evolution

### 9.1 Evolution A — Live CBAM recomputation from Comtrade flows and ICAP prices (analytics ladder: rung 1 → 2)

**What.** EP-DN5 aggregates a curated `CORRIDORS` dataset in which CBAM cost, carbon
content, and leakage risk are *stored* per corridor — §7 notes the page "does not
recompute CBAM per shipment from ETS price minus origin carbon price at runtime", and
the guide's `TradePatternShift = f(CBAMcost, elasticity, alternatives)` is never
solved. Evolution A computes both: corridor CBAM cost from real trade values and a
live price spread, and a first-order elasticity reallocation showing where flows move.

**How.** (1) The platform already has UN Comtrade wired in (data-sources wave 1) — pull
bilateral flows for the 10 CBAM-adjacent `COMMODITIES` into a `trade_corridor_flows`
table, replacing stored `tradValueBn`. (2) Carbon content = flow tonnage × default
embedded intensities from EU Reg 2023/956 Annex values (the sibling
`climate-transition-risk` page already carries a `CBAM_META` intensity map — reuse the
constants, not the page). (3) Origin carbon-price credit from a curated ICAP price
table (small, public, versioned) so `CBAMcost = tCO₂e × (EU_ETS − origin_price)`
computes live; the free-allocation phase-in (2026–34) becomes a scenario slider.
(4) Reallocation: constant-elasticity substitution across alternative origins with
documented Armington elasticities per commodity — a scenario tool, honestly labelled,
not an equilibrium model.

**Prerequisites.** Comtrade rate limits respected via the ingestion framework; ICAP
table needs a refresh owner. **Acceptance:** the §7.4 steel example (2 MtCO₂e ×
€80 spread = €160M) reproduces from ingested inputs; toggling the phase-in year
changes corridor costs; every corridor shows its price-spread provenance.

### 9.2 Evolution B — CBAM exposure copilot for import books (LLM tier 1 → 2)

**What.** A copilot for the module's stated users — CBAM-exposed importers and trade
finance banks — that answers "what does CBAM cost my steel imports from origin X, and
where should I re-source?" grounded in the corridor data and EU Reg 2023/956 mechanics
(scope, phase-in, origin-credit rules) that §5 cites. After Evolution A, "what if the
ETS hits €120?" becomes a parameter change against the live recomputation rather than
a static table lookup.

**How.** Tier 1: RAG over this Atlas record plus the CBAM regulation reference text in
the corpus (the refdata layer already holds regulatory catalogs; add the CBAM Annex I
product scope). The copilot must disclose that leakage-risk scores are curated
assessments. Tier 2 requires Evolution A's endpoints — tool calls for corridor
recompute and elasticity what-ifs, with the fabrication validator checking every €M
figure against tool output. Report generation ("WTO-compatible climate trade risk
report", already promised in the workflow) renders through the report-studio layer.

**Prerequisites.** Evolution A for tier 2; regulation text ingestion for tier 1.
**Acceptance:** copilot correctly states which of a user's named commodities are in
CBAM scope (Annex I) with citation; declines to estimate shipment-level embedded
emissions it has no data for, offering the default-intensity path instead.
