## 9 · Future Evolution

### 9.1 Evolution A — Replace the mock with a real Isolation Forest (analytics ladder: rung 1 → 3)

**What.** Per the §7 mismatch flag (EP-CX3), this is a **UI mock**, not an engine: the anomaly
flags are a hardcoded boolean array (TotalEnergies, BP, Tesla — exactly 3/15), the contamination
and max-features sliders update display labels only, and the "Re-Run Isolation Forest" button has
no onClick handler. The §7.4 worked example exposes the incoherence — TotalEnergies is flagged with
curated topics reading "Climate (−22 vs peer)" yet its generated deviation is *positive* (+5),
because flags and numbers come from unrelated sources. Evolution A replaces the mock with a real
backend Isolation Forest (sklearn `IsolationForest(n_estimators=100, contamination=c)`) over actual
entity features, so the contamination slider genuinely controls the flagged count and the scanner
scatter reflects computed anomaly scores. Notably, the sibling `/anomaly-detection` route already
implements live z-score/IQR detection (§7.5) — Evolution A should consolidate onto that engine
rather than build a second.

**How.** Wire the page to `POST /api/v1/anomaly/scan` (the sibling module's Evolution-A engine),
passing the entity feature matrix; the flagged set, `anomalyScore = 2^(−E[h(x)]/c(n))`, and
per-entity outlier-topic attributions all come from the model. The FPR-tracking tab computes real
precision/FPR from the confirm/dismiss workflow (which must be wired to handlers) instead of the
hardcoded 62%/38% literals that already contradict the alert history (§7.5: 3 confirmed/9 FP = 75%
FPR, not 38%).

**Prerequisites (hard).** Purge the hardcoded `isAnomaly` array and seeded `score`/`peerAvg` draws
per the no-fabricated-random guardrail; wire the confirm/dismiss/escalate buttons; reconcile the
FPR figures with the alert history. **Acceptance:** moving the contamination slider from 0.05 to
0.10 changes the flagged count; a flagged entity's outlier topics are derived from its feature
deviations (positive-deviation entities are not labelled "−22 vs peer"); FPR is computed from the
workflow tally.

### 9.2 Evolution B — Anomaly-triage copilot with human-in-the-loop governance (LLM tier 2)

**What.** A copilot answering "why was this entity flagged?" (narrating the real IF feature
attributions from Evolution A), "should I confirm or dismiss this alert?" (weighing peer-deviation
evidence), and "what's our current false-positive rate this quarter?" — tool-calling the scan and
FPR endpoints. The confirm/dismiss/escalate triage the page mocks becomes a real SR 11-7-style
model-governance workflow with LLM-assisted, human-approved decisions.

**How.** Tool schema over the scan engine and the alert-history/FPR store; the no-fabrication
validator checks every score and rate against tool output. Mutating actions (confirm, dismiss,
escalate) render a confirmation before firing and are audit-logged; the copilot explains the
Isolation Forest mechanism accurately (the page's own footnote — path length isolated in fewer
random splits, `s(x,n) = 2^(−E[h(x)]/c(n))` — is correct documentation and ideal RAG grounding).

**Prerequisites.** Evolution A (a real engine to narrate — today there is nothing to explain);
Atlas corpus embedded (roadmap D3). **Acceptance:** every figure in an answer traces to a scan or
FPR tool output; a dismiss action requires confirmation and updates the FPR tally; asking "why
flagged?" returns feature attributions from the model, not the curated `outlierTopics` strings.
