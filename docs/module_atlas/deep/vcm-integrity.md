## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (partial).** A genuine, sophisticated ICVCM/VCMI/Oxford scoring
> engine exists at `backend/services/vcm_integrity_engine.py` (1,431 lines) — but the frontend page
> **does not consume its output**. `runAssess()` fires `POST /api/v1/vcm-integrity/assess` and then
> discards the response entirely (`await axios.post(...)` with no `.then`, and an empty `catch`).
> Every number shown on screen — ICVCM criteria scores, VCMI tier, Oxford Principles, integrity
> flags, market prices — comes from a **separate, simpler, frontend-local `seededRandom()` generator**
> that approximates but does not match the backend's weighted/gated methodology. This deep dive
> documents both: §7.2–7.4 describe the real backend engine (the methodology that *should* drive the
> page); §7.5 documents the frontend's disconnected fallback that *actually* drives it today.

### 7.1 What the backend engine computes (not currently displayed)

`assess_vcm_integrity()` scores a single credit against three frameworks and derives a composite
quality tier:

```
ICVCM: weighted_contribution_c = score_c × weight_c          (10 criteria, weights sum to 1.0)
       ccp_composite = Σ weighted_contribution_c / Σ weight_c
       ccp_eligible  = all 10 criteria meet their threshold AND no blocking failure in {C4,C5,C6,C7}
Oxford: composite = (P1+P2+P3+P4) / 4                          (4 principles, each 0–1 banded score)
VCMI:  tier = platinum if CCP-labelled ∧ SBTi long-term ∧ residual≤10%
             gold if SBTi long-term ∧ residual≤20%
             silver if residual≤40%   else no_claim   (gated on SBTi near-term first)
Quality tier = 0.50·ccp_composite + 0.25·permanence_score + 0.25·additionality_score → A/B/C/D
```

### 7.2 ICVCM criteria scoring — parameterisation (backend)

| Criterion | Pillar | Weight | Threshold | Score driver |
|---|---|---|---|---|
| C1 Governance | Governance | 0.10 | 0.70 | `registry_base − vintage_penalty (− 0.10 if no public docs)` |
| C2 Transparency | Governance | 0.08 | 0.75 | same as C1 |
| C3 Independent V&V | Governance | 0.10 | 0.70 | `registry_base` (− 0.20 if no VVB accreditation) |
| C4 Additionality | Emissions Impact | 0.15 | 0.70 | `ADDITIONALITY_PROFILES[project_type]` (project-type lookup, not registry) |
| C5 Permanence | Emissions Impact | 0.12 | 0.65 | `PERMANENCE_PROFILES[project_type].permanence_score − vintage_penalty` |
| C6 Quantification | Emissions Impact | 0.12 | 0.70 | `registry_base × (1 − (monitoring_freq_yrs−1)×0.04)` |
| C7 No Double Counting | Emissions Impact | 0.10 | 0.80 | `0.90` if Art 6 ITMO else `registry_base − 0.05` |
| C8 Sustainable Development | Sust. Dev. | 0.08 | 0.60 | `registry_base − vintage_penalty` |
| C9 Biodiversity Safeguards | Sust. Dev. | 0.08 | 0.60 | same |
| C10 Human Rights/FPIC | Sust. Dev. | 0.07 | — | `registry_base` (± 0.10–0.20 for FPIC completion) |

`registry_base`: Gold Standard 0.88 > Art6 ITMO 0.85 > Verra VCS 0.82 > ACR 0.80 > CAR 0.78 > other 0.70.
`vintage_penalty = max(0, (2015 − vintage_year) × 0.02)` — pre-2015 vintages are penalised 2 points
per year, reflecting the market's discount on old-vintage credits under evolving methodology
standards. **CCP eligibility requires all 10 criteria pass their threshold AND none of the four
Emissions-Impact criteria (C4–C7) fail** — a hard gate consistent with ICVCM's framing that emissions
integrity is non-negotiable even if governance/SD criteria are marginal.

### 7.3 VCMI claim tiers & Oxford Principles (backend)

VCMI gating is **sequential, not additive**: no claim is possible at all without a validated SBTi
near-term target, regardless of how high other scores are — this mirrors VCMI's actual Claims Code
of Practice structure (foundational criteria must be met before claim-tier criteria apply). Oxford
Principles use banded scoring (`_band()`): e.g. P2 "Shift to long-lived storage" scores 1.0 only if
removals are ≥50% of the offset portfolio, 0.75 at ≥25%, 0.50 at ≥10%, 0.25 at ≥1%, else 0 — a
step-function, not a continuous scale, reflecting the principle's intent to reward step-changes in
portfolio composition rather than marginal moves.

### 7.4 Worked example (backend engine, Verra VCS REDD+ project, vintage 2023)

`registry_base = 0.82`, `vintage_penalty = 0` (2023 > 2015). C4 (Additionality) =
`ADDITIONALITY_PROFILES['redd_plus']` (a project-type lookup, typically ~0.65 for REDD+, reflecting
market skepticism about REDD+ baseline counterfactuals). If C4 = 0.65 < its 0.70 threshold, this is a
**blocking failure** — `ccp_label_eligible = False` regardless of how the other 9 criteria score,
because C4 is in the blocking set `{C4,C5,C6,C7}`. This correctly encodes the real-world debate that
REDD+ credits frequently fail ICVCM CCP labelling on additionality grounds even when governance is
strong (as reflected in ICVCM's actual 2023–24 category assessments, which excluded most legacy REDD+
methodologies pending revision).

### 7.5 What the frontend actually displays (disconnected local generator)

`getICVCMData(projectType, registry, vintage, seed0)` — where `seed0 = hashStr(projectType+registry+
vintage)` — draws **10 unweighted criteria scores** each `Math.round(r(n)·range + floor)` (e.g. C3
Additionality = `r(3)·35+50` → 50–85 range) and takes a simple mean for the composite. Eligibility
uses a different, hand-tuned gate: `composite≥65 AND all criteria≥50 AND C3≥60 AND C4≥55` (note: the
frontend's own C3/C4 are "Additionality"/"Permanence" — a different index mapping than the backend's
C4/C5). VCMI, Oxford, integrity-flag, and market-price data are independently seeded random draws
with no cross-reference to the ICVCM criteria computed on the same tab. Changing the "Registry"
dropdown changes `seed0` and therefore reshuffles every number on the page — including ones (like
Oxford Principles) that shouldn't logically depend on registry choice at all.

### 7.6 Data provenance & limitations

- The **backend engine's constants are grounded**: 10 ICVCM criteria titles/weights/thresholds and
  the assessment-element lists are transcribed from the actual ICVCM CCP Assessment Framework v2.0
  (2023); VCMI tier definitions and SBTi gating reflect the real VCMI Claims Code of Practice v1.1.
  `registry_base` values and `ADDITIONALITY_PROFILES`/`PERMANENCE_PROFILES` by project type are
  plausible expert-calibrated point estimates, not sourced from a specific published dataset.
- The **frontend's numbers are 100% synthetic** (`seededRandom`), calibrated only in the sense that
  score bands were chosen to look plausible; they are not currently reconcilable with the backend's
  weighted methodology, meaning two users assessing the same project via API vs UI would see
  different CCP eligibility outcomes.
- The `runAssess()` button gives a false impression of live computation — it calls the real backend,
  gets a real, more rigorous answer, and then throws it away, always re-rendering the local
  `seededRandom` values regardless of the API result.

**Framework alignment:** ICVCM Core Carbon Principles v2.0 (2023) — correctly weighted/gated in the
**backend only**. VCMI Claims Code of Practice v1.1 (2023) — SBTi-gated tiering correctly implemented
in the **backend only**. Oxford Offsetting Principles (2020, Smith School) — banded 4-principle
scoring in the **backend only**. CORSIA and Paris Agreement Article 6 corresponding-adjustment logic
are backend-only and never surfaced on the "Registry & Market" tab. **Recommended remediation:** wire
`runAssess()`'s response into component state and replace `getICVCMData`/`getVCMIData`/`getOxfordData`/
`getIntegrityData` with the values returned by `/assess` — the hard part (a correct, standards-based
model) is already built.
