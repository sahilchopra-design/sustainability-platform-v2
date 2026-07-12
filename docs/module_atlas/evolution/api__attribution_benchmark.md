## 9 · Future Evolution

### 9.1 Evolution A — Covariance-based tracking error and multi-period attribution (analytics ladder: rung 1 → 3)

**What.** A clean tier-A domain: two deterministic engines implementing Brinson-Fachler ESG/carbon
attribution, active share, information ratios, the 18 SFDR Table-1 mandatory PAIs (correctly
enumerated, including the four often-missed PAI-15..18), and EU CTB/PAB compliance checks (30%/50%
WACI reduction + 7%/yr trajectory, verbatim from Delegated Reg. 2020/1818). No PRNG, no DB reads.
Its §7.5 limitations: the tracking-error proxy is `√Σ(sector active weight)² × 0.20` with a **flat
20% vol assumption and no correlations** (the code comment admits this is "a rough heuristic"),
making the information ratios scale-dependent; attribution is on *point-in-time* levels, not period
*change* (no timing/transaction effect, no Cariño/GRAP multi-period linking). Evolution A replaces
the TE proxy with a factor-covariance model and adds multi-period attribution linking.

**How.** `POST /esg-attribution` accepts an optional covariance/factor-model input so TE and the
carbon/ESG information ratios are risk-model-based, not a flat scalar; add a multi-period variant
that links single-period Brinson effects via Cariño smoothing. Rung 3: calibrate against realised
tracking error where return history is supplied. The Brinson-Fachler kernel (which already
reconciles exactly to active metric — §7.4 worked example sums to −125 ✓) is preserved.

**Prerequisites (hard).** Fix the lineage-harness failure — §4.2 shows `POST /benchmark-report`
**failed** and `/esg-attribution` **skipped**; outputs depend entirely on caller holdings, several
of which are synthetic-seeded frontend pages (§7.5) that need real data. **Acceptance:** the §7.4
carbon-attribution decomposition still reconciles to active WACI; information ratios become
scale-invariant under the covariance model; the currently-failing endpoints pass the harness.

### 9.2 Evolution B — Attribution analyst with tool-called decomposition (LLM tier 2)

**What.** A tool-calling analyst answering "decompose my portfolio's carbon gap vs benchmark"
(calls `/esg-attribution` → allocation/selection/interaction per sector), "am I a CTB or PAB?"
(calls `/benchmark-report` → EU climate-benchmark compliance with human-readable failure reasons
like "YoY decarbonisation 4.2% < 7% required"), and "how do I rank on PAIs vs peers?" — narrating
the engine's exact reconciling decomposition. The Fachler convention (overweighting an
above-average sector scores negative for lower-is-better metrics) is subtle and error-prone for
humans to explain; the copilot grounds every attribution claim in the engine output.

**How.** Tool schemas over the 3 endpoints; the `/pai-indicators` reference (18 SFDR PAIs with
correct directions/units — the backend list is authoritative where frontend `sfdr-*` modules
historically mislabelled PAI-4's per-MEUR unit) is ideal RAG grounding. The no-fabrication
validator checks every bps, percentile and reduction figure against tool output; the copilot
explains *why* a CTB/PAB check failed by surfacing the accumulated reason strings. Composable into
a Financial-desk orchestrator alongside the `am` engine.

**Prerequisites.** Evolution A's harness fixes (working endpoints for tool-calling); real caller
holdings; Atlas + PAI corpus embedded (roadmap D3). **Acceptance:** every attribution effect cited
reconciles to the active metric; a PAB-fail answer names the specific threshold breached; the PAI
count of outperforming indicators matches the engine's tally.
