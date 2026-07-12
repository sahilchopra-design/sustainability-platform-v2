## 9 · Future Evolution

### 9.1 Evolution A — Historical baselines and a real loss ratio (analytics ladder: rung 2 → 3)

**What.** §7 confirms the projection engine is real — 150 region-peril cells projected
over 7 quinquennial steps under 6 NGFS scenarios with geometric compounding — but the
guide diverges on three counts: baselines are synthetic seeds, not the "20-year Munich
Re history" claimed; PMLs are heuristic scalings, not return-period losses from the
(cosmetic) loss-distribution labels; and there is no premium anywhere, so the promised
loss-ratio dashboard cannot exist. Evolution A grounds the baselines in observable
loss history — EM-DAT (public disaster database) and the OpenFEMA NFIP claims the
platform already ingests give per-region-peril frequency/severity anchors — and adds a
premium input so the combined-ratio view becomes computable rather than impossible.

**How.** (1) `ref_natcat_baselines(region, peril, freq_pa, median_severity, source,
period)` calibrated from EM-DAT/NFIP aggregates; seeded cells retained only where
history is absent, flagged via `resolution_tier`. (2) The loss-distribution labels
made real: fit lognormal/Pareto severity to the claims data where density permits and
compute PML as an actual return-period quantile, per §8 model-card convention.
(3) Premium as a per-line input (rate per exposure unit) so
`lossRatio = E[Loss]/Premium` finally has a denominator; the guide's RCP-vs-NGFS and
linear-vs-geometric wording reconciled to the code's actual (defensible) choices.

**Prerequisites.** EM-DAT licensing (research use); the flagged guide discrepancies
clear in the same change. **Acceptance:** a US-flood cell's baseline traces to NFIP
aggregates; PML at 1-in-100 equals the fitted distribution's 99th percentile; loss
ratio renders only when a premium is supplied (honest-null otherwise).

### 9.2 Evolution B — Actuarial scenario copilot (LLM tier 1 → 2)

**What.** A copilot for pricing and reserving analysts: "why do 2045 wildfire claims
triple under Hot House?" (geometric compounding of the frequency trend — the §7
mechanic), "which region-peril cells deteriorate fastest under Disorderly?", "re-run
North America hurricane with demand surge at 30%" — the last as a client-side tool
call into `calcProjectedClaims` with modified parameters (no backend routes exist).

**How.** Tier 1: atlas §5/§7 as corpus with the multiplier mechanics explained
faithfully (NGFS scenarios, 5-year compounding — not the guide's RCP/linear text until
Evolution A reconciles it); page state (selected line, peril, scenario) injected.
Tier 2: tool schema over the projection function; the validator ties every projected
loss to an invocation. Scenario-definition questions cite the NGFS corpus.

**Prerequisites.** Evolution A's baseline grounding before the copilot presents
absolute dollar losses as meaningful — growth *rates* are defensible today, levels are
not, and the system prompt must make that distinction explicit pre-A. **Acceptance:**
a what-if answer matches the projection function's output; asked for a market-share
adjusted loss forecast, the copilot notes exposure data is not in the module.
