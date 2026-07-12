# Api::Dme_Dmi
**Module ID:** `api::dme_dmi` · **Route:** `/api/v1/dme-dmi` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/dme-dmi/pcaf-attribution` | `pcaf_attribution` | api/v1/routes/dme_dmi.py |
| POST | `/api/v1/dme-dmi/entity` | `entity_dmi` | api/v1/routes/dme_dmi.py |
| POST | `/api/v1/dme-dmi/portfolio` | `portfolio_dmi` | api/v1/routes/dme_dmi.py |
| GET | `/api/v1/dme-dmi/ref/pcaf-confidence` | `get_pcaf_confidence` | api/v1/routes/dme_dmi.py |

### 2.3 Engine `dme_dmi_engine` (services/dme_dmi_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `DMIEngine.pcaf_to_confidence` | pcaf_score, recency_years | Base confidence from PCAF DQS, with recency decay. Decay: λ = 0.2/year → 18% loss/year. |
| `DMIEngine.confidence_weighted_agg` | scores, weights, confidences | S = Σ(w × c × x) / Σ(w × c) |
| `DMIEngine.concentration_penalty` | conc, cfg | Multiplicative penalty from concentration metrics. |
| `DMIEngine.pcaf_attribution` | req | PCAF financed emissions attribution: Σ (Outstanding/EVIC) × Emissions. |
| `DMIEngine.entity_dmi` | req | Entity-level DMI: confidence-weighted factor aggregation, optionally adjusted by velocity z-scores. |
| `DMIEngine.portfolio_dmi` | req | Portfolio-level DMI with concentration penalties. |
| `DMIEngine.get_reference_data` |  |  |

**Engine `dme_dmi_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `PCAF_CONFIDENCE` | `{1: 1.0, 2: 0.85, 3: 0.7, 4: 0.55, 5: 0.4}` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `fastapi` *(shared)*, `services` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/dme-dmi/ref/pcaf-confidence** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['pcaf_confidence_map', 'recency_decay', 'aggregation_formula', 'concentration_penalties'], 'n_keys': 4}`

**POST /api/v1/dme-dmi/entity** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/dme-dmi/pcaf-attribution** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/dme-dmi/portfolio** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `dme_dmi_engine` — extracted transformation lines:**
```python
num = sum(w * c * x for w, c, x in zip(weights, confidences, scores))
den = sum(w * c for w, c in zip(weights, confidences))
af = h.outstanding_amount / h.entity_evic
fe = af * h.entity_emissions_tco2e
velocity_adj = avg_z * cfg.velocity_weight
adjusted = base_score * (1 + velocity_adj)
norm_weights = [w / total_w for w in raw_weights]
velocity_adj = float(np.mean(v_scores)) * cfg.velocity_weight
final = base * (1 + velocity_adj) * conc_factor
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain. The sections below document
`backend/services/dme_dmi_engine.py` — the Dynamic Materiality Index (DMI) engine ported from
the standalone DME into Risk Analytics — exposed at `/api/v1/dme-dmi` via
`backend/api/v1/routes/dme_dmi.py`.)*

### 7.1 What the module computes

A stateless, velocity-aware ESG scoring engine with three endpoints:

1. **`POST /pcaf-attribution`** — PCAF financed emissions over holdings:
   ```
   AF = outstanding_amount / EVIC
   financed_emissions = Σ AF × entity_emissions_tCO2e
   financed_intensity = total_FE / total_outstanding
   weighted_pcaf      = Σ (DQS × FE_in_bucket) / total_FE
   ```
2. **`POST /entity`** — entity DMI from factor-level scores:
   ```
   S = Σ(w × c × x) / Σ(w × c)                       (confidence-weighted mean)
   DMI_adjusted = S × (1 + mean(velocity_z) × velocity_weight)
   ```
3. **`POST /portfolio`** — portfolio DMI: the same confidence-weighted aggregation over
   holdings' ESG scores (weights = outstanding shares, confidences from PCAF DQS × recency
   decay), a velocity overlay, and a multiplicative **concentration penalty**:
   ```
   penalty = [1 − α_entity × max(0, single_name_max − threshold)]
           × (1 − α_sector × HHI_sector) × (1 − α_geo × HHI_geo)      (floored at 0)
   DMI_final = S × (1 + velocity_adj) × penalty
   ```

`GET /ref/pcaf-confidence` returns the constant maps and formula strings.

### 7.2 Parameterisation

| Parameter | Value | Provenance |
|---|---|---|
| PCAF DQS → confidence | 1→1.00 · 2→0.85 · 3→0.70 · 4→0.55 · 5→0.40 (unknown → 0.70) | DME-authored mapping onto the PCAF 1–5 quality ladder |
| Recency decay | `c = base × e^(−0.20 × years)` — λ = 0.2/yr, ≈18% loss/yr (1 − e^−0.2) | DME model constant, documented in code |
| `single_name_threshold` | 0.05 (5% single-name share before penalty starts) | `DMIConfig` default |
| `alpha_entity / alpha_sector / alpha_geographic` | 0.20 / 0.15 / 0.10 | `DMIConfig` defaults (penalty slopes) |
| `velocity_weight` | 0.3 (how much the mean velocity z-score scales the base DMI) | `DMIConfig` default |
| Empty-portfolio PCAF fallback | weighted DQS defaults to 3.0 when total FE = 0 | engine code |

All config values are overridable per request via the optional `config` body. Inputs are
validated by Pydantic (outstanding > 0, EVIC > 0, ESG 0–100, DQS 1–5, HHIs 0–1).

### 7.3 Calculation walkthrough

Portfolio DMI: holdings' ESG scores are weighted by normalised outstanding amounts and by
`pcaf_to_confidence(DQS, recency_years)` — so a stale DQS-4 holding contributes far less than a
fresh DQS-1 holding of the same size. If the caller supplies `velocity_adjustments`
(entity → z-score of ESG-signal *velocity* from the DME's temporal layer), the mean z is scaled
by `velocity_weight` and inflates/deflates the base score. Finally the concentration penalty
scales the result down for single-name, sector-HHI and geography-HHI concentration — encoding
the DME thesis that a concentrated portfolio's materiality signal is less reliable/more
exposed. Entity DMI is the same aggregation over caller-supplied factor scores/weights/
confidences (lengths must match, else an error dict). PCAF attribution is the pure PCAF
listed-equity formula with EVIC as denominator.

### 7.4 Worked example — two-holding portfolio DMI

H1: $60M outstanding, ESG 80, DQS 1, fresh (0 yr) → confidence 1.00.
H2: $40M outstanding, ESG 50, DQS 3, 2 years old → confidence 0.70 × e^(−0.4) = 0.4692.
Concentration: single-name max 0.60, sector HHI 0.52, geo HHI 0.40. No velocity input.

| Step | Computation | Result |
|---|---|---|
| Weights | 0.6 / 0.4 | — |
| Numerator | 0.6×1.00×80 + 0.4×0.4692×50 | 57.384 |
| Denominator | 0.6 + 0.1877 | 0.7877 |
| Base DMI | 57.384 / 0.7877 | **72.85** |
| Entity penalty | 1 − 0.20×(0.60−0.05) = 0.890 | |
| Sector penalty | 1 − 0.15×0.52 = 0.922 | |
| Geo penalty | 1 − 0.10×0.40 = 0.960 | |
| Concentration factor | 0.890×0.922×0.960 | 0.7878 |
| **Final DMI** | 72.85 × 0.7878 | **57.39** |
| Weighted avg PCAF | 1×0.6 + 3×0.4 | 1.8 |

Note the confidence weighting pulls the base score toward the high-quality holding (72.85 vs
the naive exposure-weighted 68.0), and the reported `concentration_penalty` field is
`1 − 0.7878 = 0.2122`.

### 7.5 Data provenance & limitations

- **No PRNG, no DB, no embedded demo data** — a pure calculator; every number comes from the
  request. The only constants are the confidence map, decay rate and penalty slopes above.
- The DQS→confidence values, λ = 0.2/yr, α-slopes and velocity weight are **DME-authored
  calibrations**, not published PCAF/academic coefficients; PCAF defines the 1–5 ladder but not
  numeric confidence weights.
- PCAF attribution uses EVIC uniformly — correct for listed equity/bonds, but PCAF prescribes
  different denominators for other asset classes (total equity+debt for private companies,
  property value for mortgages), which this endpoint does not differentiate.
- The velocity overlay is linear and unbounded (`S × (1 + z̄ × 0.3)`) — a large positive mean
  z-score can push the adjusted DMI above 100; callers own the z-score computation (this engine
  does not derive velocities from time series — see `api::dme_policy_tracker` and the DME NLP
  layers for that).
- Concentration penalty treats HHIs as exogenous inputs; it does not compute them from holdings.

### 7.6 Framework alignment

- **PCAF Global GHG Accounting & Reporting Standard** — attribution factor = outstanding/EVIC
  for listed exposures, financed-emissions-weighted Data Quality Score (PCAF's own portfolio
  quality metric is precisely this FE-weighted DQS average).
- **Double materiality (CSRD/EFRAG)** — the DMI extends the platform's double-materiality
  engine with *dynamic* (velocity-weighted) materiality: the code comment positions it as a
  temporal overlay on impact/financial materiality scoring.
- **Herfindahl–Hirschman Index (HHI)** — the standard concentration measure (Σ share²) used for
  the sector/geography penalties, echoing supervisory concentration-risk treatment (e.g. Basel
  Pillar 2 granularity adjustments) in simplified multiplicative form.
- **EVIC (EU Benchmark Regulation / TEG usage)** — Enterprise Value Including Cash as the
  attribution denominator, consistent with EU Paris-aligned benchmark and PCAF practice.

## 9 · Future Evolution

### 9.1 Evolution A — Asset-class-aware PCAF, computed HHIs, and bounded velocity (analytics ladder: rung 1 → 3)

**What.** The Dynamic Materiality Index engine — a stateless, velocity-aware ESG calculator: PCAF
attribution, confidence-weighted factor aggregation `S = Σ(w·c·x)/Σ(w·c)`, and a multiplicative
concentration penalty over single-name/sector/geo HHIs. No PRNG, pure function of inputs. §7.5 names
the deepening targets: PCAF attribution uses **EVIC uniformly** (correct for listed equity/bonds but
PCAF prescribes total-equity+debt for private companies and property value for mortgages); the
velocity overlay is **linear and unbounded** (`S × (1 + z̄ × 0.3)` can push DMI above 100); and the
concentration penalty treats **HHIs as exogenous inputs** rather than computing them from holdings.
Evolution A adds asset-class-aware PCAF denominators, computes HHIs from the holdings themselves, and
bounds the velocity adjustment.

**How.** `pcaf_attribution` branches on asset class for the denominator (EVIC / equity+debt / property
value per PCAF); `portfolio_dmi` computes sector/geo HHIs from the holdings' own concentration instead
of accepting them as inputs; the velocity overlay uses a bounded transform (e.g. tanh) so adjusted DMI
stays in range. Rung 3: calibrate the DQS→confidence map, λ=0.2/yr decay and α-penalty slopes (all
DME-authored) against observed materiality-signal reliability, and pin the §7.4 worked example (base
DMI 72.85, final 57.39) in bench_quant.

**Prerequisites (hard).** Fix the harness failures — §4.2 shows `POST /entity`, `/pcaf-attribution`,
`/portfolio` all **skipped** (they need input payloads to trace); the DME-authored calibrations must
stay documented as such. **Acceptance:** the §7.4 two-holding worked example reproduces; a private-
company holding uses the equity+debt denominator; HHIs are computed from holdings, not supplied; a
large positive velocity z-score no longer pushes DMI above 100.

### 9.2 Evolution B — Dynamic-materiality analyst orchestrating the DME engines (LLM tier 2 → 3)

**What.** The DMI engine is the aggregation hub of the DME cluster (it consumes velocity z-scores from
`dme_policy_tracker`, factor definitions from `dme_factor_registry`, and PCAF confidence). A tier-2
analyst answers "what's this entity's dynamic materiality score and what's driving it?" (`/entity`
with factor scores + velocity), "compute our portfolio DMI with concentration penalties" (`/portfolio`),
and "what's our financed-emissions attribution?" (`/pcaf-attribution`) — narrating the confidence-
weighted decomposition (which shows how high-quality holdings pull the score). At tier 3 it orchestrates
the DME cluster: pull policy velocities from the tracker, factor metadata from the registry, and
greenwashing signals to assemble a full dynamic-materiality profile.

**How.** Tool schemas over the endpoints plus the `ref/pcaf-confidence` grounding; the no-fabrication
validator checks every score, attribution factor and penalty against tool output. Because the engine
doesn't derive velocities itself (§7.5 — callers own the z-scores), the tier-3 orchestrator wires
`dme_policy_tracker`'s composite velocity as the `velocity_adjustments` input, making the cross-engine
data flow explicit and auditable.

**Prerequisites.** Evolution A's harness fixes; the sibling DME engines' tool exposure; Atlas corpus
embedded (roadmap D3). **Acceptance:** every figure cited traces to an engine tool call; the DMI
decomposition shows the confidence-weighting effect; a tier-3 profile cites which engine produced the
velocity z-score feeding the adjustment, not an invented value.