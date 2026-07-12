## 9 · Future Evolution

### 9.1 Evolution A — Backend Isolation Forest + STL over stored history (analytics ladder: rung 2 → 4)

**What.** This module already runs genuine statistics live on real inputs — a population z-score
detector and Tukey IQR fences over the user portfolio or `GLOBAL_COMPANY_MASTER` — which puts it
ahead of most tier-B pages. But per the §7 partial-mismatch flag, its "Isolation Score" is not
Isolation Forest (it is a mean absolute sector-peer z-score composite, lacking path-length
normalisation `c(n)` and contamination control), the STL time-series decomposition the guide names
is absent, and the temporal-break check is simulated (`prev = curr × (0.5 + sRand·1.0)`, ±50% of
current) because no historical snapshots are stored. Evolution A moves detection server-side with a
real sklearn `IsolationForest(contamination=c)` ensemble plus STL structural-break detection over
**stored data-version history**, and makes the ensemble vote (both models agree → high priority)
the guide describes real.

**How.** `POST /api/v1/anomaly/scan` (portfolio → anomaly records with true IF score, z, IQR flag,
STL break) and a data-snapshot table so YoY change is measured, not invented; the existing severity
rubrics (>4σ Critical, IQR Medium, IF cutoff by contamination) carry over. Rung 4 (predictive): STL
trend/seasonal decomposition forecasts expected ranges so a value is flagged against its predicted
band, not just a static mean.

**Prerequisites (hard).** Stop `enrichAnomaly` synthetically back-filling every missing metric via
`sRand` (§7.5) — in the no-portfolio state, most "anomalies" are artefacts of uniform random fills;
per the no-fabricated-random guardrail, missing fields must be honest nulls the detector skips.
Store real historical snapshots. **Acceptance:** the §7.4 z/IQR worked example reproduces; the IF
score has path-length normalisation (contamination slider changes the flagged count); a real YoY
break is detected from stored snapshots, not a `prev` invented from `curr`.

### 9.2 Evolution B — Data-quality steward copilot over the anomaly queue (LLM tier 2)

**What.** A copilot for data stewards answering "what are today's critical anomalies and why?",
"is this GHG-intensity outlier a real error or a sector artefact?" (walking the z, IQR and
peer-deviation evidence), and "draft a remediation note for this flagged record" — tool-calling the
scan engine and narrating real detector output. It fits the ISAE 3000 assurance context the guide
cites: an auditable exception report with LLM-drafted, human-approved resolution notes.

**How.** Tool schema over Evolution A's `POST /anomaly/scan` plus a peer-stats lookup; the
no-fabrication validator checks every z-score, mean and threshold against tool output. The copilot
distinguishes the three detectors' signals (3σ misses moderate tails IQR catches; IF fires only on
multi-field outliers — the complementarity §7.4 illustrates) and routes each anomaly to a steward
with a suggested severity and SLA, persisting resolution notes to an audit trail (the guide's
resolution-SLA tracking, currently unimplemented).

**Prerequisites.** Evolution A (real detectors, stored history) so the copilot narrates genuine
signals not random-fill artefacts; Atlas corpus embedded (roadmap D3). **Acceptance:** every
statistic in an answer traces to a scan tool output; an anomaly caused by a null-fill is correctly
identified as a data-completeness gap, not a data-quality event; resolution notes persist to the
audit log with actor and timestamp.
