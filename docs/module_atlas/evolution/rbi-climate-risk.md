## 9 · Future Evolution

### 9.1 Evolution A — Disclosed-data bank panel with a modelled capital add-on (analytics ladder: rung 2 → 3)

**What.** The module's regulatory scaffolding is genuinely accurate — RBI 2025 four-pillar framework (31 requirement items), 9% CET1 vs Basel 8%, real D-SIB surcharges (SBI 0.6%, HDFC/ICICI 0.4%), CEA v19 grid factors, NGFS-India scenario parameters, BRSR-ESRS crosswalk — but the 20-bank panel is `sr()`-seeded: CRAR components, financed emissions (`lendingBook × 0.000012 × random`), sector exposures, and the climate add-on (`10 + sr()·80` bps) are heuristics, not models. Evolution A replaces the panel with disclosed data and makes the add-on a real calculation.

**How.** (1) Seed a `ref_indian_bank_financials` table from public Basel Pillar 3 disclosures (CET1/AT1/Tier2, gross NPA, sector exposure from annual reports — all published quarterly by the 20 named banks), refreshed by an ingester with as-of dates. (2) `api/v1/routes/rbi_climate.py`: `POST /climate-addon` implementing the §5 formula honestly — `Σ(sector_exposure × emission_intensity × scenario_multiplier)` using the real `SECTOR_EF` vector and NGFS-India carbon-price paths already on the page, replacing the random bps draw; `POST /financed-emissions` applying CEA state grid factors to the disclosed sector book (PCAF DQ tier reported — currently `pcafDqs` is itself a random number, which inverts the concept). (3) Physical-risk state exposures wired to the digital-twin grids where Indian coverage exists, coarse-flagged where it doesn't.

**Prerequisites.** Pillar-3 ingestion effort (PDF-heavy; scope 20 banks × 4 quarters); the seeded panel demoted to fixtures. **Acceptance:** SBI's CRAR matches its published disclosure for the stated quarter; the climate add-on moves when the carbon-price slider moves via the formula, not a reseed.

### 9.2 Evolution B — RBI-compliance copilot for Indian FIs (LLM tier 1 → 2)

**What.** The 31-item requirement checklist, phased FY 2025-26→2028-29 timeline, and BRSR-ESRS crosswalk are exactly what compliance officers interrogate: "which Pillar 2 items apply to an Upper Layer NBFC this fiscal year?", "map our BRSR Core KPI 7 disclosure to the ESRS datapoint", "draft the board note on scenario-analysis readiness". Evolution B ships this as a tier-1 copilot grounded in the module's regulatory content plus the RBI Directions and SEBI circular texts §5 already cites.

**How.** Copilot router over pgvector chunks of the Atlas record, `RBI_PILLARS` items, `DISCLOSURE_PHASES`, and the source circulars (public documents, chunked with clause anchors). Scope-determination answers cite the applicability clause (SCB vs SFB vs NBFC-UL distinctions the module encodes). Tier-2 upgrade after Evolution A: "stress our CRAR under Disorderly with ₹4,000/t carbon by 2030" becomes a `POST /climate-addon` tool call against the bank's disclosed capital stack. India-specific caveat in the system prompt: RBI guidance is evolving; every answer carries the circular version/date it cites.

**Prerequisites.** Circular texts sourced and versioned; Evolution A for any bank-specific numbers. **Acceptance:** applicability answers cite clause-level anchors; a compliance-gap summary for a bank uses only its stored checklist state and disclosed financials, refusing banks not in the panel.
