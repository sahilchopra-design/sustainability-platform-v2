## 9 · Future Evolution

### 9.1 Evolution A — A real activity×EF ingestion chain with reconciled anomaly signals (analytics ladder: rung 1 → 2)

**What.** §7.7 shows the "real-time" framing is aspirational: 80 procedurally named facilities, period-indexed synthetic series (no sub-hourly resolution despite the guide's headline), an `emissionFactor` field displayed but never used to derive `scope1Current` (the activity×EF chain is absent), and two coexisting unreconciled anomaly signals (static `anomalyScore` vs live `ewmaHistory`). Evolution A builds the module's first genuine pipeline: metered activity data in, emission factors applied server-side, one anomaly detector.

**How.** (1) A `facility_meter_readings` table plus `POST /api/v1/emissions-monitor/readings` ingest (CSV/API; MQTT can wait — honest batch beats fake streaming), with `emissions = activity × EF` computed per reading using per-source factors from the refdata EF tables, finally implementing the guide's chain. (2) One anomaly method: the EWMA control-band logic the page already computes per selection becomes the stored, alert-generating signal; the static `anomalyScore` draw is deleted. (3) Scope-2 dual reporting derives from metered kWh × location-based grid factor vs contractual instruments — structurally correct in the current UI, now with real operands. (4) Reduction pathways gain sector-specific shapes (the flat linear-to-zero treats steel and power identically, as §7.7 notes) sourced from documented sector trajectories.

**Prerequisites.** At least one real or fixture meter dataset for development (open smart-meter samples suffice); EF table coverage for the six sectors. **Acceptance:** a facility's displayed emissions reproduce as Σ(activity × EF) over its readings; exactly one anomaly signal exists and alerts fire from stored breaches, not seeded scores.

### 9.2 Evolution B — Operations copilot on the alert stream (LLM tier 2)

**What.** Facilities teams live in the alert queue. The copilot triages it: "why did Delta Cement Plant 3 breach its EWMA band on Tuesday?" (decomposed from the readings: which meter, which source category, activity spike vs EF change), "summarize this month's permit-utilization risk for the compliance report", "which sectors are drifting from their reduction pathway?" — every claim from readings, computed bands, and permit rows.

**How.** Tier-2 tool schemas over the Evolution-A endpoints (readings query, anomaly history, permit compliance, pathway status); the copilot's decomposition follows the module's own arithmetic — an emissions delta must be attributed to activity or factor terms that sum to it, enforced by the no-fabrication validator. Permit-compliance narratives quote the stored permit limit and current utilization; the copilot never speculates about regulatory consequences beyond the module's status taxonomy (Compliant/Non-Compliant/Pending/Exempt). Alert-response suggestions are constrained to the source-category vocabulary in the data.

**Prerequisites (hard).** Evolution A — a triage copilot over seeded anomalies would generate confident nonsense about facilities that don't exist; alert persistence. **Acceptance:** a breach explanation's activity/EF decomposition sums to the observed delta; monthly summaries reproduce from stored aggregates; no facility outside the register is ever discussed.
