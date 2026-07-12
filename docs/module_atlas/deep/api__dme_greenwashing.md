## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain. The sections below document
`backend/services/dme_greenwashing_engine.py` — CUSUM-based greenwashing detection ported from
the DME — exposed at `/api/v1/dme-greenwashing` via `backend/api/v1/routes/dme_greenwashing.py`.)*

### 7.1 What the module computes

Statistical divergence detection between an entity's **marketing sentiment score** and its
**operational evidence score**. Two endpoints:

1. **`POST /detect`** — full time-series detection. Each observation on both tracks is first
   credibility-weighted:
   ```
   W = raw_score × QualityWeight × Freshness
   QualityWeight = clamp01(1 − (PCAF_DQS − 1) × 0.2)        (DQS 1→1.0 … 5→0.2)
   Freshness     = e^(−λ·age_months),  λ = ln2 / 36          (36-month half-life)
   ```
   then the divergence series `D_t = W_marketing − W_operational` is analysed with:
   - EMA smoothing (`α = 0.08`),
   - central-difference velocity `v_t = (EMA_{t+1} − EMA_{t−1})/2`,
   - acceleration `a_t = v_t − v_{t−1}`,
   - divergence z-scores against the series' own mean/σ (ddof = 1),
   - CUSUM change-point statistic `C_t⁺ = max(0, C_{t−1}⁺ + (D_t − μ) − kσ)`, alert when
     `C_t⁺ > hσ`.

   **Compound trigger** (all three simultaneously): (1) |v_latest − v̄| > 1σ_v, (2) a > 0
   (gap widening), (3) z > 2 → `WARNING`, z > 3 → `CRITICAL`.
2. **`POST /quick-scan`** — single-snapshot credibility gap:
   `gap_pct = (W_m − W_o)/W_o × 100`; risk HIGH > 30%, MEDIUM > 15%, else LOW.

`GET /ref/config-defaults` and `/ref/methodology` expose the config and formula descriptions.

### 7.2 Parameterisation

| Parameter | Default | Meaning / provenance |
|---|---|---|
| `ema_alpha` | 0.08 | slow EMA — heavy smoothing of divergence (DME calibration) |
| `cusum_k_factor` | 0.5 | CUSUM slack `k = 0.5σ` — the textbook allowance for detecting ~1σ shifts |
| `cusum_h` | 5.0 | decision interval `h = 5σ` — the classic CUSUM design value |
| `warning_threshold` | 2.0 | z-score for WARNING |
| `critical_threshold` | 3.0 | z-score for CRITICAL |
| Quality weight slope | 0.2 per DQS notch | engine-authored mapping of PCAF DQS to credibility |
| Freshness half-life | 36 months | engine-authored (documents older than 3 yrs weigh < 50%) |
| Minimum observations | 2 to compute anything; **20** for statistical detection; 20 velocity points for condition 1 | code gates returning `INSUFFICIENT_DATA` |

All thresholds are overridable per request via `config`.

### 7.3 Calculation walkthrough

The design mirrors statistical process control: the divergence between what an entity *says*
(marketing/NLP sentiment, typically lower-quality PCAF 3–4 evidence) and what it *does*
(operational metrics, typically PCAF 1–2) is treated as a monitored process variable. The
credibility weighting deliberately deflates stale, low-quality signals before comparison. The
compound trigger avoids single-point false positives: a high z-score alone (level), or a fast
velocity alone (noise), is insufficient — the gap must be *large*, *widening*, and *moving
abnormally fast* at once. CUSUM runs in parallel as an independent drift detector
(`cusum_alert` is reported but does not gate `greenwashing_detected`). With fewer than 20
observations, the endpoint returns the latest divergence and weighted averages with severity
`INSUFFICIENT_DATA` instead of a fabricated verdict.

### 7.4 Worked example — quick scan

Marketing score 85 (PCAF 3, 6 months old) vs operational score 60 (PCAF 2, 3 months old) —
the route's own defaults for quality/age:

| Step | Computation | Result |
|---|---|---|
| Marketing quality weight | 1 − (3−1)×0.2 | 0.60 |
| Marketing freshness | e^(−(ln2/36)×6) = e^(−0.1155) | 0.8909 |
| W_marketing | 85 × 0.60 × 0.8909 | **45.44** |
| Operational quality weight | 1 − (2−1)×0.2 | 0.80 |
| Operational freshness | e^(−(ln2/36)×3) | 0.9439 |
| W_operational | 60 × 0.80 × 0.9439 | **45.31** |
| Credibility gap | 45.44 − 45.31 | 0.13 |
| Gap % | 0.13 / 45.31 × 100 | **0.29% → LOW** |

Instructive result: the raw 25-point marketing–operational gap almost vanishes after
credibility weighting, because the marketing signal is *lower quality and staler* — the engine
punishes glossy-but-thin evidence before it can register as divergence. Had the marketing
observation been PCAF 1 and fresh (W = 85 × 1.0 × 1.0), the gap would be
(85 − 45.31)/45.31 ≈ **87.6% → HIGH**.

### 7.5 Data provenance & limitations

- **No PRNG, no DB, no embedded demo data** — pure computation over caller-supplied
  observations. Upstream, the marketing/operational scores are expected from the DME NLP and
  metrics layers; this engine does not source them.
- The DQS→weight slope (0.2), 36-month half-life, EMA α = 0.08 and 30%/15% quick-scan bands are
  DME-authored calibrations; the CUSUM constants (k = 0.5σ, h = 5σ) match standard SPC design
  practice.
- Statistical assumptions: z-scores assume approximately stationary, roughly normal divergence;
  the mean/σ are computed over the *whole* series including any contaminated recent segment
  (no burn-in window), which biases detection conservative.
- `timestamps` are accepted but only used to align lengths — spacing is assumed regular; no
  irregular-interval handling.
- Velocity is computed on the EMA (lagged by design), and condition 1 needs ≥20 velocity points
  (≈22 observations); short quarterly histories will effectively never trigger — quick-scan is
  the intended fallback there.

### 7.6 Framework alignment

- **CUSUM (Page 1954) / statistical process control** — the change-point machinery, with the
  conventional k = 0.5σ slack and h = 5σ decision interval used in quality-control charts.
- **PCAF Data Quality Score** — reused as the evidence-credibility axis (DQS 1 = verified
  primary evidence → full weight; DQS 5 = proxy estimates → 0.2 weight); an original DME
  application of PCAF's ladder beyond financed emissions.
- **Regulatory greenwashing context** — the marketing-vs-operations divergence construct
  operationalises what supervisors describe qualitatively: the EU's ESAs define greenwashing as
  sustainability claims that "do not clearly and fairly reflect" the underlying profile, and
  regimes like the EU Green Claims proposal / SEC climate-disclosure enforcement target exactly
  the claims-vs-evidence gap this engine quantifies. No specific regulation prescribes this
  algorithm — it is a surveillance analytic, not a compliance test.
