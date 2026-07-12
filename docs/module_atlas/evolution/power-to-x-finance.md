## 9 · Future Evolution

### 9.1 Evolution A — Subsidy-stacking backend with auction-calibrated prices (analytics ladder: rung 2 → 3)

**What.** The page is tier-B frontend-only: the LCOP build-up (`calcLcoP()`, CRF annuity, real Haber-Bosch/Fischer-Tropsch/Sabatier stoichiometry in `PTX_PRODUCTS`) is genuine, but §7.5 documents that "H2Global subsidy modelling" and "carbon credit revenue stacking" exist only as tab labels — no computed subsidy bridge — and market prices/demand growth are illustrative constants. Evolution A builds the module's first backend vertical: a PtX economics engine that adds the missing revenue side (H2Global two-sided auction spread, Innovation Fund €/tCO₂-avoided grant, CBAM savings, VCM credits) and calibrates price anchors to published H2Global auction clearings and EU ETS/CBAM curves.

**How.** (1) New route `api/v1/routes/ptx_finance.py` with `POST /lcop` (porting the 5-term cost build-up so bench_quant can pin the §7.4 worked example, €755/t e-ammonia) and `POST /subsidy-bridge` computing `subsidy = (offtake − import_price) × volume` per the §4.1 formula that today has no implementation. (2) Seed a `ref_ptx_market_anchors` table with dated H2Global auction results and product price benchmarks replacing the in-page `price2025` constants. (3) Frontend keeps sliders; numbers come from the engine with `source` provenance per row.

**Prerequisites.** Anchor dataset curated from public H2Global/Innovation Fund publications; bench_quant reference case added. **Acceptance:** engine LCOP reproduces the §7.4 walkthrough to the cent, and the subsidy bridge returns a non-null bankability gap for e-ammonia that changes when auction clearing price changes.

### 9.2 Evolution B — Bankability copilot over the conversion chain (LLM tier 1 → 2)

**What.** A copilot on the PtX page that explains the cost stack an analyst is looking at — "why is e-SAF 3× jet fuel?" answered from the module's own decomposition (h2Cost/co2CostKg/elecCostKg/capexAnnKg/opexKg shares, FT efficiency 47%, capex €2,400/tpa) — and, once Evolution A ships, runs what-ifs ("LCOH at €2/kg, WACC 6%, DAC CO₂") as tool calls against `POST /lcop` and `/subsidy-bridge` rather than generating numbers.

**How.** Tier 1 first: RAG over this Atlas record (§5 methodology, §7.1–7.4 formulas and worked example are the grounding corpus) via the standard `POST /api/v1/copilot/{module_id}/ask` router with pgvector chunks; the copilot must state plainly that market prices and demand curves are illustrative — the honest-limitations text in §7.5 becomes part of its refusal context. Tier 2 upgrade auto-generates tool schemas from the new engine's OpenAPI operations; the no-fabrication validator checks every numeric against tool outputs.

**Prerequisites.** Tier 2 requires Evolution A's backend (there are no endpoints today to tool-call). **Acceptance:** copilot correctly attributes each €/kg term to its formula and refuses questions the module doesn't compute (e.g. DSCR or debt sizing, explicitly absent per §7.5).
