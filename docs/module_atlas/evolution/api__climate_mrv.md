## 9 · Future Evolution

### 9.1 Evolution A — Plume-model satellite detection and persisted assessments (analytics ladder: rung 1 → 3)

**What.** A clean tier-A MRV engine (E73): five deterministic assessments (MRV system grading,
satellite coverage, PCAF data-quality, digital-MRV maturity, compliance report) — a model of the
honest-null pattern (unmeasured accuracy/completeness/timeliness return `None` with an explanatory
note, never a fabricated figure). §7.5 names the deepening targets: the satellite detection-
probability formula (`rate/threshold × 60`, capped 5–98) is a **heuristic, not a plume model** — no
wind, albedo, cloud-cover, or observation-count statistics — and facility emission rates are
order-of-magnitude class defaults; the ISO 14064-3 "levels" are an engine construct; and the
default data-source list is a demo fallback. Evolution A upgrades satellite scoring to a real
plume-detection model and persists assessments to the `mrv_assessments`/`mrv_data_streams` tables.

**How.** `score_satellite_coverage` incorporates wind speed, cloud-cover climatology and
observation-count statistics per sensor (the platform has NASA-POWER/Open-Meteo weather feeds) so
detection probability reflects real observability; assessments persist to the existing MRV tables so
maturity and data-quality trend over time (roadmap D1 write-side activation). Rung 3: calibrate the
PCAF-DQS-to-confidence weights and IPCC tier uncertainty against the published PCAF/IPCC ranges
(already cited) and validate detection probabilities against known super-emitter events.

**Prerequisites.** The engine is harness-passing; the main work is fidelity and persistence, not
endpoint repair. Preserve the honest-null discipline — new plume inputs default to null, not
fabricated weather. **Acceptance:** the §7.4 satellite worked example (75.0 coverage score at 65°N)
reproduces under the class-default rate, but adding real cloud-cover changes detection probability;
an MRV assessment persists and is retrievable; the data-quality dimensions match `/calculate-data-
quality` output.

### 9.2 Evolution B — MRV-readiness copilot with tool-called assessment (LLM tier 2)

**What.** A tool-calling analyst for sustainability/verification teams: "assess our MRV system's
verification readiness" (`/assess-mrv-system` → ISO 14064-3 level, DQS, CDP band), "what satellites
can detect our cement plant?" (`/score-satellite-coverage`), "what's our PCAF data-quality score?"
(`/calculate-data-quality`), "what's our digital-MRV maturity and upgrade roadmap?" (`/assess-
digital-maturity`), and "generate the compliance report" (`/generate-report` → ISO/EMAS/SECR/EU-ETS
blocks) — narrating the engine's real outputs and its honest nulls (an unmeasured data-quality
dimension is reported as not-measured, not zero).

**How.** Tool schemas from the 5 POST + 6 GET operations (all passing the harness); the reference
endpoints (satellite systems, ISO 14064-3 checklist, MRV system types, maturity levels, PCAF DQS,
sector emission factors) are ideal RAG grounding for "what does ISO 14064-3 §7.2 materiality
require?" questions — a tier-1 explainer over a tier-2 operator. The no-fabrication validator checks
every score, probability and cost band against tool output; the copilot presents upgrade costs as
the engine's indicative planning bands, not vendor quotes.

**Prerequisites.** Atlas + reference corpus embedded (roadmap D3); the copilot's grounding carries
the honest-null discipline so it never presents an unmeasured dimension as a computed value.
**Acceptance:** every figure cited traces to an engine tool call; the maturity level and gap analysis
match `/assess-digital-maturity`; an MRV-system query with no measured dimensions returns the
engine's honest-null with the copilot requesting the measurements, not inventing a DQS.
