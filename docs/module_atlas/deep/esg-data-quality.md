## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code (frontend) mismatch.** The guide's headline DQ formula
> `DQ = 0.4·Coverage + 0.3·Timeliness + 0.2·Accuracy + 0.1·Consistency` is **not** what the rendered
> page computes. Every score displayed in the frontend — BCBS 239 dimension/principle scores, provider
> coverage, PCAF DQS bars, weighted DQS, assurance readiness — is fabricated client-side with
> `seededRandom(hashStr(entity+sector+framework)+n)` (`sr(s)=frac(sin(s+1)×10⁴)`). The `axios.post`
> to the assessment API is **fire-and-forget** (result discarded; comment: *"API fallback to seed
> data"*). **However**, the two backend engines it *nominally* targets
> (`esg_data_quality_engine.py`, `esg_data_quality_assurance_engine.py`) are genuinely
> standards-grounded — real PCAF DQS 1–5 weights, real BCBS 239 14-principle weights, and honest
> null-handling ("no fabricated presence"). This module is the classic split: **correct engine,
> disconnected synthetic UI.** §7 documents both layers.

### 7.1 What the module computes

**Frontend (what the user sees — synthetic):**

```js
base = hashStr(entity+sector+framework)          // deterministic per-entity seed
s(n) = seededRandom(base + n)                     // frac(sin(base+n+1)×10⁴)
BCBS category score = round(s(k)×~30 + ~52)       // Governance/Architecture/Accuracy/Reporting
BCBS overall        = mean(4 categories)          // → Platinum≥80/Gold≥65/Silver≥50/Bronze
DQS scope scores    = sc1,sc2,sc3 = s(1..3)×1.5+1.5  (∈1.5–3.5, PCAF-like)
weighted DQS        = sc1×0.3 + sc2×0.3 + sc3×0.4    // 0.3/0.3/0.4 = Scope 1/2/3 weights
provider gap        = per (provider × dataType) s(pi*9+di)×40+40; gaps = #(score<60)
```

**Backend (what a wired build would compute — genuine):**

`score_pillar` (quality engine): for each E/S/G pillar,
```python
coverage_pct = reported_count / total × 100
pillar_score = coverage_pct × (Σ dqs_weight(level) / reported_count)   # coverage × mean DQ weight
```
with `dqs_weight = {1:1.0, 2:0.8, 3:0.5, 4:0.3, 5:0.0}` (PCAF-style, level-1 best). Un-reported
indicators are honestly recorded as null — no invented presence or DQS. BCBS 239 composite uses the
real 14-principle weight vector (Governance 0.12, Architecture 0.10, … Home/host 0.04, summing to 1).

### 7.2 Parameterisation / scoring rubric

**PCAF DQS levels** (backend, authentic — DQS 1 = highest quality):

| DQS | Meaning | Quality weight |
|---|---|---|
| 1 | Audited/verified primary data | 1.0 |
| 2 | Reported unverified | 0.8 |
| 3 | Estimated from company data | 0.5 |
| 4 | Sector-average proxy | 0.3 |
| 5 | Missing / most uncertain | 0.0 |

**BCBS 239 principle weights** (backend): P1 Governance 0.12, P2 Data architecture 0.10, P3 Accuracy
0.10, P4 Completeness 0.08, P5 Timeliness 0.08 … P14 Home/host 0.04 (14 principles, Σ = 1.00). The
frontend shows 14 principle *names* but scores them with `s(i+10)×35+45`.

**Weighted-DQS Scope weights** `0.3/0.3/0.4` (frontend): Scope 1 / 2 / 3 — matches the guide and PCAF
financed-emissions convention, but applied to random scope-DQS draws.

**Provider divergence** (backend `esg_data_quality_engine`): typical MSCI↔Sustainalytics divergence
25%, Bloomberg 40%, CDP 18% — real published-order-of-magnitude figures; the guide's "25–35 pts"
band. Frontend renders a synthetic provider gap table instead.

### 7.3 Calculation walkthrough (as rendered)

1. User sets entity, sector, framework, reporting year, assurance level.
2. `getBCBSData` seeds off `hashStr(entity+sector+framework)` → 4 category scores → overall → tier.
3. `getDQS` → three scope DQS + `weighted = 0.3·sc1+0.3·sc2+0.4·sc3` → radial "quality %".
4. Provider tab: 5 providers × data types → synthetic coverage/gap grid.
5. `runAssessment` fires `POST /assess` but discards the response and keeps the seeded data.

### 7.4 Worked example — "Acme Corp PLC" / Banking / CSRD

`base = hashStr("Acme Corp PLCBankingCSRD")` (a fixed integer). Then `s(1)=frac(sin(base+2)×10⁴)`.
Say `s(1)=0.42, s(2)=0.61, s(3)=0.28` →
`sc1 = 0.42×1.5+1.5 = 2.13`, `sc2 = 0.61×1.5+1.5 = 2.42`, `sc3 = 0.28×2+2 = 2.56`;
`weighted = 2.13×0.3 + 2.42×0.3 + 2.56×0.4 = 0.639 + 0.726 + 1.024 = 2.39` → displayed "Weighted DQS
2.4" and radial "quality" `(5−2.39)/4×100 = 65%`. Deterministic for that exact entity string, but
carries no information about Acme's real data quality.

### 7.5 Data provenance & limitations

- **Frontend scores are fully synthetic** (`hashStr`+`seededRandom`); changing the entity name changes
  the seed and hence all "scores", so numbers move with the label, not with reality.
- **Backend engines are correct and honest** — PCAF DQS weighting, BCBS 239 weights, and a deliberate
  no-fabrication policy for un-reported indicators — but the UI does not consume their output.
- The guide's DQ formula (`0.4·Coverage+0.3·Timeliness+0.2·Accuracy+0.1·Consistency`) is implemented
  by *neither* layer as stated; the backend uses `coverage × mean(DQS weight)`, a different (and
  arguably better) composition.

**Framework alignment:** **PCAF Data Quality Score (Part A, 2022)** — DQS 1–5 hierarchy with quality
weights, the backend's core; PCAF derives DQS by data-source hierarchy (verified > reported >
physical-activity-estimated > economic-activity-estimated > asset-turnover-proxy). **BCBS 239** —
14 principles across Governance / Aggregation / Reporting / Supervisory, weighted composite (backend
authentic). **ISO 8000** (data quality) referenced conceptually. **IOSCO ESG data recommendations**
inform the provider-divergence framing.

### 8 · Model Specification

**Status: specification — not yet implemented in the rendered UI** (the backend implements most of
it; the frontend must be wired to consume it).

**8.1 Purpose & scope.** Produce a defensible, per-holding and portfolio ESG data-quality score
combining coverage, provenance (DQS), timeliness and cross-provider agreement, to prioritise data
remediation and quantify uncertainty passed into downstream analytics (financed emissions, ratings).

**8.2 Conceptual approach.** Mirror **PCAF DQS** (source-hierarchy quality weighting) for provenance,
**BCBS 239** for governance maturity, and a **provider-divergence** term à la the academic
"aggregate confusion" literature (Berg, Kölbel & Rigobon) — combining a coverage×provenance base with
a timeliness decay and a divergence penalty.

**8.3 Mathematical specification.**
- Indicator quality: `q_k = 1{reported}·w_{DQS}(level_k)·τ(age_k)`, `τ(age)=e^{−age/12mo}` (timeliness).
- Pillar score: `P_p = (Σ_{k∈p} q_k / |p|) × 100` (coverage × mean provenance × timeliness).
- Composite DQ: `DQ = Σ_p m_p·P_p − λ·D`, `m_p` = SASB materiality pillar weight, `D` = mean pairwise
  provider score dispersion (0–100), `λ` a divergence penalty.
- BCBS 239 governance overlay: `G = Σ_i w_i·principle_i` (w_i the real 14-weights), reported alongside.

| Parameter | Value / source |
|---|---|
| DQS weights 1.0/0.8/0.5/0.3/0.0 | PCAF Part A (backend already encodes) |
| Timeliness half-life | 12 mo (guide "6–12 month lag") |
| Materiality m_p | SASB industry weights |
| Divergence penalty λ | calibrate to Berg et al. divergence magnitudes |
| BCBS weights | backend `BCBS239_PRINCIPLES` (Σ=1) |

**8.4 Data requirements.** Per-indicator reported flag, DQS level, reporting date, and ≥2 provider
scores per holding. The backend already ingests DQS levels and provider divergence; frontend must POST
real holdings and render the returned assessment.

**8.5 Validation & benchmarking plan.** Reconcile DQS distribution against PCAF benchmark reports;
back-test that low-DQ holdings correlate with larger financed-emissions restatements; sensitivity of
DQ to λ and timeliness half-life; benchmark provider divergence against published MSCI/Sustainalytics
correlation studies.

**8.6 Limitations & model risk.** Provider divergence conflates methodology and measurement error;
timeliness decay is a convention; missing indicators forced to DQS 5 (weight 0) can over-penalise
small firms; the frontend↔backend disconnect must be fixed before any figure is decision-grade.
