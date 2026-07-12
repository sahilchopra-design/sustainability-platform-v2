## 9 · Future Evolution

### 9.1 Evolution A — Parameterised LCA engine with EU Taxonomy screening (analytics ladder: rung 1 → 2)

**What.** This is one of the batch's better tier-B modules: `LCA_PRODUCTS` (12 rows) is hand-curated real-technology data with a methodologically sound comparative design (§7.2 holds manufacturing energy constant and varies only the grid EF, correctly isolating the grid effect — HJT drops from 52 to 8.5 gCO₂e/Wp purely from site decarbonisation), and `STAGE_BREAKDOWN` reconciles internally (Σ = 40.7 vs the 42.0 China-grid Mono-Si total). Its limit is that it is a static lookup: the CI and EPBT formulas are stated in §5 but the page renders pre-computed constants rather than computing from user inputs. Evolution A turns the reference tables into a live LCA calculator and adds the EU Taxonomy screen the overview promises.

**How.** (1) Implement `CI = mfg_emissions / (AEP × lifetime)` and `EPBT = E_mfg / P_annual` as functions taking manufacturing-grid EF, process energy (kWh/Wp), install-location AEP, and lifetime — so a user can compute a specific product/site combination, not just read the 12 preset rows. (2) An EU Taxonomy substantial-contribution screen for PV manufacturing (the overview's stated purpose) with the DNSH check against the actual technical screening criteria. (3) Extend `PAYBACK_SCENARIOS` beyond the three fixed displaced-grid cases to any user grid intensity. (4) Attach IEA-PVPS Task 12 / IEC 63274 vintage citations per coefficient.

**Prerequisites.** EU Taxonomy PV-manufacturing TSC encoding; process-energy defaults per technology (already in the table). **Acceptance:** changing manufacturing-grid EF recomputes CI via the formula (matching the China-vs-EU comparative the table shows); the Taxonomy screen returns aligned/not-aligned with the driving criterion; carbon payback computes for an arbitrary displaced grid.

### 9.2 Evolution B — LCA-and-EPD copilot for procurement and disclosure (LLM tier 1)

**What.** A copilot for the manufacturer/developer/ESG-investor users: "what's the cradle-to-gate carbon intensity of TOPCon made in China vs the EU?", "where are the LCA hotspots?", "does this module meet EU Taxonomy for our procurement spec?" — answered from the `LCA_PRODUCTS` and `STAGE_BREAKDOWN` data and the ISO 14040/44 and IEC 63274 framework structure the module follows.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/solar-manufacturing-carbon-lca/ask`, corpus = this Atlas record (the comparative design, stage breakdown, and framework alignment) plus live page state. Hotspot answers cite the `STAGE_BREAKDOWN` shares (polysilicon 35.6%); grid-effect answers narrate the same-technology-different-grid comparison the data already isolates. Post-Evolution-A, computation questions re-run the LCA calculator. The end-of-life recycling credit (the −0.8 gCO₂e/Wp system-expansion convention) is explained honestly as an LCA credit, not a physical removal.

**Prerequisites.** None hard — the data is real, cited, and internally consistent; Evolution A lets the copilot answer arbitrary product/site queries with computed CI. **Acceptance:** every gCO₂e/Wp figure matches `LCA_PRODUCTS` or a computed run; hotspot shares match `STAGE_BREAKDOWN`; a technology or grid outside the dataset returns a scoped estimate labelled as such.
