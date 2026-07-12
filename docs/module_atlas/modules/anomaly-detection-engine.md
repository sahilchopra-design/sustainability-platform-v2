# Anomaly Detection Engine
**Module ID:** `anomaly-detection-engine` · **Route:** `/anomaly-detection-engine` · **Tier:** B (frontend-computed) · **EP code:** EP-CX3 · **Sprint:** CX

## 1 · Overview
Isolation Forest with configurable contamination, flagged entity investigation workflow, and false positive rate tracking.

**How an analyst works this module:**
- Anomaly Scanner runs Isolation Forest on all entities
- Investigation Workflow for each flagged entity
- FPR Tracking monitors confirmed vs false alarm ratio

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALERT_HISTORY`, `Badge`, `Card`, `ENTITIES`, `FPR_DATA`, `KPI`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `FPR_DATA` | `['2025-Q1','2025-Q2','2025-Q3','2025-Q4','2026-Q1'].map((q,i) => ({` |
| `flagged` | `useMemo(() => ENTITIES.filter(e => e.isAnomaly), []); const scatterData = useMemo(() => ENTITIES.map(e => ({ name:e.name, x:e.score, y:e.peerAvg, anomaly:e.isAnomaly?1:0, size:e.isAnomaly?200:80 })), []);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `FPR_DATA`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Contamination | — | Configurable | 5% expected anomaly rate |
| Flagged Entities | — | Detection | Entities with anomalous profiles |

## 5 · Intermediate Transformation Logic
**Methodology:** Isolation Forest anomaly detection
**Headline formula:** `AnomalyScore = avgPathLength(x) / avgPathLength(random); Flag if score > threshold`

Contamination parameter (0.01-0.10) controls false positive rate. Flagged entities show which taxonomy nodes are outliers vs sector peers.

**Standards:** ['Liu et al. (2008)']
**Reference documents:** Liu et al. (2008) Isolation Forest

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry (EP-CX3) claims an *Isolation Forest*
> with `AnomalyScore = avgPathLength(x)/avgPathLength(random)` and a configurable contamination
> parameter that "controls false positive rate". **No Isolation Forest — or any detection
> algorithm — runs in this module.** The anomaly flags are a hardcoded boolean array
> (`isAnomaly: [false,false,false,false,true,...]` — TotalEnergies, BP and Tesla, exactly 3/15 as
> the guide's "Flagged Entities: 3" datapoint says). The contamination and max-features sliders
> update display labels only; the "Re-Run Isolation Forest" button has **no onClick handler**.
> This is a *UI mock of an anomaly-detection workflow*, not an engine. The sections below document
> what actually renders.

### 7.1 What the module computes

Three static datasets, one seeded (`sr(s) = frac(sin(s+1)×10⁴)`):

- **`ENTITIES` (15 rows)** — real company names (JPMorgan → Tesla) with
  `score = round(60 + (sr(i·23)·2−1)·20)` (≈ 40–80), `peerAvg = round(62 + (sr(i·23)·2−1)·12)`
  (same seed → score and peerAvg are perfectly rank-correlated), a cosmetic
  `anomalyScore = max(0, (sr(i·17)·2−1))` and the **hand-set** `isAnomaly` flags with curated
  `outlierTopics` strings (e.g. TotalEnergies: "Climate (−22 vs peer), Biodiversity (−18 vs
  peer)").
- **`ALERT_HISTORY` (12 rows)** — entity/date/type; the first 3 rows are "Confirmed Anomaly", the
  rest "False Positive", with resolutions Under Review / Dismissed / Resolved by index.
- **`FPR_DATA` (5 quarters)** — `confirmed = round(5 + i·0.5)`, `falsePositive = round(3 − i·0.4)`,
  `fpr = round(falsePositive/(8 + i·0.1)·100)` — a deterministic improving trend, not a tally of
  the alert history.

The only live derivations are `flagged = ENTITIES.filter(e => e.isAnomaly)` (always the same 3)
and the scatter mapping `{x: score, y: peerAvg, size: isAnomaly ? 200 : 80}`.

### 7.2 Parameterisation

| Parameter | Value | Effect in code |
|---|---|---|
| Contamination slider | 0.01–0.10, default 0.05 | Interpolated into two text labels; never used in computation |
| Max features slider | 0.3–1.0, default 0.8 | Label only |
| `n_estimators` | "100" | Static display card (sklearn-style hyperparameter names) |
| `max_samples` | "auto" | Static display card |
| Flagged set | indices 4, 10, 14 (TotalEnergies, BP, Tesla) | Hardcoded boolean array |
| Deviation shown | `score − peerAvg` | The one arithmetic operation on the Flagged Entities tab |
| Precision / FPR / YoY cards | 62 % / 38 % / −12pp | Hardcoded literals (not `confirmed/(confirmed+FP)` from the data) |

### 7.3 Calculation walkthrough

1. **Anomaly Scanner** — scatter of entity score vs sector-peer average with a y = x reference
   diagonal (segment (30,30)–(90,90)); points below the line "diverge negatively from peers".
   Anomalous entities render as red diamonds sized 200 vs 80. Because `score` and `peerAvg` share
   the seed `sr(i·23)`, all 15 points hug the diagonal by construction; the *visual* outliers and
   the flagged set coincide only by curation.
2. **Isolation Forest Config** — sliders and four hyperparameter cards; purely presentational.
3. **Flagged Entities** — for each of the 3 anomalies shows score, peer average and
   `deviation = score − peerAvg`, the curated outlier-topic strings, and a client-side "Set
   Alert" toggle (state array `alerts`, not persisted).
4. **Investigation Workflow** — per-anomaly card listing "taxonomy nodes contributing" (the
   outlierTopics) and three action buttons (Confirm / Dismiss as FP / Escalate) — none wired to
   handlers.
5. **Alert History** — static 12-row table.
6. **False Positive Rate** — bar chart of the deterministic `FPR_DATA` plus the three hardcoded
   metric cards.

### 7.4 Worked example (entity i = 4, TotalEnergies)

| Step | Computation | Result |
|---|---|---|
| Seed draw | `sr(4·23) = sr(92) = frac(sin(93)·10⁴)` | 0.9316 |
| score | `round(60 + (0.9316·2 − 1)·20)` = round(60 + 17.26) | **77** |
| peerAvg | `round(62 + (0.9316·2 − 1)·12)` = round(62 + 10.36) | **72** |
| Deviation | 77 − 72 | **+5** |
| isAnomaly | hardcoded index 4 | **true** |

Note the incongruity the arithmetic exposes: TotalEnergies is *flagged* with curated topics
reading "Climate (−22 vs peer)", yet its generated deviation is **positive** (+5) — because flags
and numbers come from unrelated sources. This is the clearest evidence the detection is cosmetic.

### 7.5 Data provenance & limitations

- **Everything is synthetic or hardcoded**: seeded draws for scores, literal booleans for
  anomalies, literal strings for investigation findings, deterministic arithmetic for the FPR
  trend, and literal KPI cards. No data enters from the platform, a backend, or user input.
- The sliders create the appearance of a tunable model; re-running does nothing. A truthful
  implementation would either call a backend Isolation Forest (e.g. scikit-learn
  `IsolationForest(n_estimators=100, contamination=c)`) or at minimum recompute flags from a
  peer-deviation rule so the contamination slider changes the flagged count.
- The sibling route `/anomaly-detection` (AnomalyDetectionPage) *does* implement live z-score/IQR
  detection over the company master — the two modules are easily confused; this one is the mock.
- FPR figures are internally inconsistent with the alert history (3 confirmed / 9 FP ⇒ 75 % FPR,
  not 38 %).

### 7.6 Framework alignment

- **Isolation Forest (Liu, Ting & Zhou, 2008)** — correctly described in the page's own footnote:
  anomalies are isolated in fewer random axis-parallel splits; the score
  `s(x,n) = 2^(−E[h(x)]/c(n))` ∈ [0,1] normalises expected path length `E[h(x)]` by the average
  BST path length `c(n)`; `contamination` sets the score cutoff quantile. The footnote is accurate
  as documentation even though nothing implements it.
- **Human-in-the-loop model governance** — the confirm/dismiss/escalate triage mirrors standard
  ML-alert operations practice (and SR 11-7-style model risk expectations of challenge and
  override), rendered here as static UI.
- **Precision / FPR tracking** — the metrics displayed are the standard confusion-matrix
  quantities (precision = TP/(TP+FP)); values are illustrative literals.

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