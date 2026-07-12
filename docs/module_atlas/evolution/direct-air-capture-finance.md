## 9 · Future Evolution

### 9.1 Evolution A — Backend LCOC engine with a real project pipeline (analytics ladder: rung 2 → 3)

**What.** The page already earns rung 2: its LCOC electricity-price sensitivity (`baseLCOC + (elecPrice−40) × tech.elec × 8`), learning curves, and offtake calculator are genuine deterministic what-ifs over real technology parameters (IEA DAC 2022 / NREL TEA 2023 / Climeworks disclosures). But it is tier-B frontend-only: the formulas live in the page, and the 18-project pipeline is `sr()`-seeded (±14% around tech baselines, invented IRRs and credit prices). Evolution A moves the model server-side and calibrates it against observables.

**How.** (1) New `services/dac_finance_engine.py` + `api/v1/routes/dac_finance.py` porting the §7 formulas verbatim, with the `−200` fixed non-electricity cost proxy decomposed into CAPEX-CRF + heat + O&M terms per technology (the page's own §7.1 documents the proxy). (2) Replace seeded `PROJECTS` with the public IEA CCUS Projects Database DAC subset (real Mammoth/Orca/Stratos capacities and statuses) in a `dac_projects` table. (3) Calibration: pin the worked example (Solid Sorbent at $60/MWh → $888/tCO₂) and Climeworks' disclosed cost trajectory into `bench_quant.py`; learning rates (0.85/0.87/0.88) get cited ranges instead of the current "illustrative but plausible" status.

**Prerequisites.** Alembic migration for `dac_projects`; a decision on §45Q treatment for non-US projects (currently implicit). **Acceptance:** bench pin passes; page LCOC chart is byte-identical to `POST /dac-finance/lcoc-sensitivity` output; no `sr()` in the project pipeline.

### 9.2 Evolution B — CDR procurement copilot for offtake structuring (LLM tier 1 → 2)

**What.** A copilot for the economics tab answering the questions DAC buyers actually ask: "why does Electroswing beat Liquid Solvent at $80/MWh but not $30/MWh?", "at what credit price does a 50 kt plant break even after §45Q?" — grounded in the §5/§7 formula corpus and the page's current slider state. Tier 1 ships explanation-only from already-computed page state (the margin decomposition — credit revenue, electricity cost, $200 fixed proxy — is fully specified in §7.1, so answers are derivable without new backend).

**How.** Corpus = this Atlas record's §5 headline formula + §7 walkthrough and worked example; the copilot receives the live slider values (scale, credit price, electricity price) as structured context and explains the resulting margin arithmetic, citing the formula used. Tier 2 unlocks only after Evolution A ships endpoints: what-if requests ("re-run at $25/MWh Icelandic geothermal") become tool calls against `POST /lcoc-sensitivity` rather than in-context arithmetic, with the no-fabrication validator matching quoted $/tCO₂ figures to tool outputs.

**Prerequisites (hard).** Tier 2 is blocked on Evolution A — today there are zero backend endpoints to call, and the copilot must not present seeded pipeline IRRs as market data. **Acceptance:** every $/tCO₂ figure in an answer traces to either the documented formula applied to disclosed slider state (tier 1) or a tool response (tier 2); questions about actual market credit pricing refuse with a pointer to the offtake table's disclosed sources.
