## 9 · Future Evolution

### 9.1 Evolution A — Replace the hardcoded ITR lookup and broaden CSRD-sourced coverage (analytics ladder: rung 2 → 3)

**What.** A regulatory portfolio-reporting API that pulls entity data directly from the CSRD
extraction pipeline (`csrd_kpi_values` + `csrd_entity_registry`) and computes six things without
separate GHG inputs: PCAF financed emissions, SFDR PAI aggregation, NGFS climate-stress VaR
(`Σ holding_value × NGFS_sector_var%`), EU Taxonomy alignment, Paris ITR (`Σ weight·entity_ITR`),
and CSRD double-materiality. The taxonomy and SFDR-RTS endpoints trace **real-db** (good), but
the ITR is a hardcoded `_ITR_LOOKUP` keyed on 8-char entity UUID (BNP 1.9, Ørsted 1.5…) with
sector fallbacks — a small hand-curated table, not a computed temperature. Evolution A grounds
the ITR and broadens coverage.

**How.** (1) Replace `_ITR_LOOKUP` with a computed implied temperature from the entity's actual
targets and pathway (wire to the `net_zero_targets` engine) or from a licensed ITR source,
labelling the provenance — presenting BNP's temperature as 1.9 from a hardcoded dict is the kind
of unanchored figure the platform's fabrication discipline targets. (2) Extend CSRD-sourced
coverage so more holdings resolve via `csrd_kpi_values` rather than falling to sector defaults,
reporting `data_coverage_pct` prominently. (3) Fix the `/ecl/portfolio-stress` (traces failed)
and `/csrd/portfolio-materiality` (skipped) endpoints. (4) Bench-pin the six aggregations.

**Prerequisites.** `net_zero_targets` ITR linkage or a licensed ITR feed; broader CSRD KPI
coverage. **Acceptance:** portfolio ITR derives from computed/sourced temperatures with
provenance, not a hardcoded dict; `data_coverage_pct` reflects real CSRD resolution; the
failed/skipped endpoints return `passed`; bench pins pass.

### 9.2 Evolution B — One-call regulatory portfolio-reporting copilot (LLM tier 2)

**What.** A copilot that produces a fund's regulatory pack conversationally — "give me our SFDR
RTS filing, Taxonomy alignment, and Paris temperature for 2024" — calling the six endpoints and
narrating the CSRD-sourced results, each figure traceable to a holding's KPI row.

**How.** Six endpoints reading the real CSRD tables form the tool set; because entities resolve
by UUID prefix against `csrd_entity_registry`, the copilot can report exactly which holdings
contributed and which fell to defaults. The `/reports/sfdr-rts` endpoint already emits a
filing-ready structure — the copilot's drafting layer renders it. This is a headline node for a
fund-reporting desk, composing into the report-studio artifacts the roadmap describes for tier-3.

**Prerequisites.** Evolution A's ITR fix — a copilot citing portfolio temperature from the
hardcoded lookup would present curated numbers as computed. **Acceptance:** every emissions, PAI,
alignment, and temperature figure traces to a tool response with its holding source; the copilot
reports `data_coverage_pct` and flags default-fallback holdings; it refuses to assert filing
compliance and frames output as the computed regulatory figures.
