# Api::Dme_Policy_Tracker
**Module ID:** `api::dme_policy_tracker` · **Route:** `/api/v1/dme-policy-tracker` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/dme-policy-tracker/composite-velocity` | `composite_velocity` | api/v1/routes/dme_policy_tracker.py |
| POST | `/api/v1/dme-policy-tracker/from-events` | `from_events` | api/v1/routes/dme_policy_tracker.py |
| GET | `/api/v1/dme-policy-tracker/ref/sector-weights` | `get_sector_weights` | api/v1/routes/dme_policy_tracker.py |
| GET | `/api/v1/dme-policy-tracker/ref/components` | `get_components` | api/v1/routes/dme_policy_tracker.py |

### 2.3 Engine `dme_policy_tracker_engine` (services/dme_policy_tracker_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `PolicyTrackerEngine.get_sector_weights` | isic_code |  |
| `PolicyTrackerEngine.carbon_price_velocity` | inp | d(ETS_Price)/dt × Embedded_Emissions_Volume |
| `PolicyTrackerEngine.regulatory_pipeline_velocity` | inp | Stage-weighted: introduced × 0.2, committee × 0.3, enacted × 0.5 |
| `PolicyTrackerEngine.enforcement_velocity` | inp | sanctions(0.4) + litigation_monthly(0.4) + penalty_log(0.2) |
| `PolicyTrackerEngine.disclosure_mandate_velocity` | inp | adoptions/month × (1 + coverage_fraction) |
| `PolicyTrackerEngine.composite_velocity` | req | Calculate full composite policy velocity index. |
| `PolicyTrackerEngine.from_events` | req | Calculate composite velocity from discrete policy events. |
| `PolicyTrackerEngine.get_reference_data` |  | Reference: sector weights and component descriptions. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `component`, `discrete`, `fastapi` *(shared)*, `services` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/dme-policy-tracker/ref/components** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 4, 'item0_keys': ['id', 'description']}`

**GET /api/v1/dme-policy-tracker/ref/sector-weights** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['6419', '0610', '3510', '2410', '4100', 'default'], 'n_keys': 6}`

**POST /api/v1/dme-policy-tracker/composite-velocity** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/dme-policy-tracker/from-events** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `dme_policy_tracker_engine` — extracted transformation lines:**
```python
weighted = inp.bills_introduced * 0.2 + inp.bills_in_committee * 0.3 + inp.bills_enacted * 0.5
lit_monthly = inp.litigation_filings_per_quarter / 3.0
v_composite = sum(component_sums[c] * weights[c] for c in PolicyComponent)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain. The sections below document
`backend/services/dme_policy_tracker_engine.py` — the DME Policy Velocity Tracker — exposed at
`/api/v1/dme-policy-tracker` via `backend/api/v1/routes/dme_policy_tracker.py`.)*

### 7.1 What the module computes

A **policy velocity index**: the rate of regulatory change bearing on an entity/jurisdiction,
composed from four component signals and blended with sector-specific weights:

```
v_carbon    = mean(ΔP/P over price series) × embedded_emissions_volume
v_pipeline  = (bills_introduced × 0.2 + in_committee × 0.3 + enacted × 0.5) / years
v_enforce   = sanctions_per_month × 0.4 + (litigation_per_quarter / 3) × 0.4
            + log10(total_penalties) × 0.2
v_disclose  = new_adoptions_per_month × (1 + GDP_coverage_fraction)

v_policy    = Σ v_i × w_i(sector)          (ISIC-keyed component weights)
```

Endpoints: `POST /composite-velocity` (component inputs → composite), `POST /from-events`
(discrete policy events → per-component sums → composite), and `GET /ref/components` /
`/ref/sector-weights` for the constant tables.

### 7.2 Parameterisation

**Sector component weights** (`SECTOR_WEIGHTS`, ISIC 4-digit keys):

| ISIC | Sector | Carbon | Pipeline | Enforcement | Disclosure |
|---|---|---|---|---|---|
| 6419 | Banking | 0.20 | 0.35 | 0.30 | 0.15 |
| 0610 | Crude petroleum | 0.40 | 0.25 | 0.15 | 0.20 |
| 3510 | Electric power | 0.45 | 0.25 | 0.10 | 0.20 |
| 2410 | Iron & steel | 0.35 | 0.25 | 0.20 | 0.20 |
| 4100 | Real estate/construction | 0.15 | 0.30 | 0.25 | 0.30 |
| default | all others | 0.25 | 0.25 | 0.25 | 0.25 |

Weightings encode DME's judgement of transmission channels — power/oil most exposed to carbon
pricing (0.45/0.40), banks to regulatory pipeline + enforcement (0.35+0.30), real estate to
disclosure mandates (0.30). All weight rows sum to 1.0.

**Fixed sub-weights** (engine constants): bill-stage weights 0.2/0.3/0.5
(introduced/committee/enacted — enacted law moves fastest); enforcement mix 0.4/0.4/0.2
(sanctions/litigation/penalty-magnitude); disclosure amplifier `(1 + coverage)` so a mandate
adopted where coverage is already broad accelerates the signal up to 2×.

**Event model** (`POST /from-events`): each event carries `delta_policy` (0–1 magnitude),
`weight` (0–1), `direction` (−1/0/+1) and `confidence` (0–1); the per-component contribution is
their product, summed and annualised by `time_period_years` before the sector blend — so
velocities can be *negative* (deregulation) through `direction = −1`.

### 7.3 Calculation walkthrough

For `/composite-velocity`, each of the four component blocks is optional; missing blocks
contribute 0 (an honest "no signal" rather than a default level). Carbon-price velocity is the
mean *fractional* period-over-period change of the supplied (timestamp, price) series —
timestamps are not used for spacing, so the series is assumed evenly sampled — scaled by
`embedded_emissions_volume` so the same ETS move matters more for a carbon-heavy book.
Pipeline velocity is a stage-weighted count per year; enforcement blends monthly sanction and
litigation frequencies with the log-magnitude of penalties (so a $10M penalty adds 7 × 0.2 =
1.4); disclosure velocity is adoption tempo amplified by cumulative GDP coverage. The four are
blended with the ISIC row (unknown ISIC → equal weights). The output preserves all component
velocities and the weight row used, so the frontend can render the decomposition.

### 7.4 Worked example — electric power (ISIC 3510)

Inputs: carbon prices 80 → 88 → 92 €/t (volume factor 1.0); pipeline 4 bills introduced, 2 in
committee, 1 enacted over 1 year; enforcement 0.5 sanctions/month, 1.5 litigation
filings/quarter, penalty log₁₀ = 6; disclosure 0.3 adoptions/month at 50% GDP coverage.

| Component | Computation | Velocity | × weight |
|---|---|---|---|
| Carbon price | mean(8/80, 4/88) = mean(0.1000, 0.0455) = 0.0727 | 0.0727 | × 0.45 = 0.0327 |
| Pipeline | 4×0.2 + 2×0.3 + 1×0.5 = 1.9 / 1 yr | 1.9 | × 0.25 = 0.4750 |
| Enforcement | 0.5×0.4 + (1.5/3)×0.4 + 6×0.2 | 1.6 | × 0.10 = 0.1600 |
| Disclosure | 0.3 × (1 + 0.5) | 0.45 | × 0.20 = 0.0900 |
| **Composite** | | | **0.7577** |

The decomposition shows the pipeline term dominating despite power's carbon-price tilt —
because the component velocities live on different natural scales (see limitations).

### 7.5 Data provenance & limitations

- **No PRNG, no DB, no embedded market data** — a pure calculator; price series, bill counts,
  enforcement stats and adoption rates are caller-supplied (in the platform, fed by the DME
  data-pull layer).
- **Heterogeneous units**: the four component velocities are not normalised to a common scale
  before weighting (fractional price change ≈ 0.07 vs weighted bill count ≈ 1.9 vs log-penalty
  blend ≈ 1.6). The composite is therefore an *index* meaningful for comparison across
  entities/jurisdictions computed the same way, not a calibrated probability or dollar
  quantity; the sector weights partially, but not fully, compensate.
- Carbon-price velocity ignores actual timestamp spacing (mean of per-step changes) and has no
  volatility adjustment; a two-point series is accepted.
- The sector-weight matrix covers 5 named ISIC codes + default — DME-authored judgement, not
  estimated coefficients; bill-stage and enforcement sub-weights likewise.
- No decay/half-life on old events in `/from-events` beyond the caller's own windowing.

### 7.6 Framework alignment

No single external standard defines "policy velocity"; the engine synthesises recognised
inputs:

- **ETS carbon pricing (EU ETS / national schemes)** — d(price)/dt scaled by embedded-emissions
  exposure mirrors how transition-risk frameworks (NGFS, TCFD) treat carbon price as the
  primary policy transmission channel.
- **ISIC Rev.4 sector classification** — the weighting key, aligning with how NGFS/EBA
  climate-risk heatmaps differentiate policy sensitivity by economic activity.
- **Regulatory-pipeline tracking** — stage-weighted legislative progress echoes policy-tracker
  practice (e.g. Climate Change Laws of the World / LSE Grantham database structure: proposed →
  in progress → enacted).
- **Enforcement analytics** — sanctions/litigation frequency + penalty magnitude parallels
  climate-litigation trackers (Sabin Center) and supervisory enforcement statistics.
- **Disclosure-mandate diffusion** — adoption rate × GDP coverage reflects the ISSB/TCFD
  jurisdictional adoption-tracking approach (share of global GDP covered by mandatory
  disclosure regimes).
- Downstream, the composite feeds the DME's **dynamic materiality** layer (see
  `api::dme_dmi` velocity adjustments) as the regulatory-velocity z-score input.

## 9 · Future Evolution

### 9.1 Evolution A — Normalise component scales and auto-feed from policy data sources (analytics ladder: rung 1 → 3)

**What.** A policy-velocity index blending four component signals (carbon-price d(P)/dt × emissions,
stage-weighted regulatory pipeline, enforcement frequency + penalty magnitude, disclosure-mandate
diffusion) with ISIC-keyed sector weights — no PRNG, honest "no signal = 0" for missing components.
§7.5 names the core limitation: the four component velocities are **not normalised to a common scale**
before weighting (fractional price change ≈0.07 vs weighted bill count ≈1.9 vs log-penalty blend ≈1.6),
so the composite is an *uncalibrated index* meaningful only for like-for-like comparison, and the §7.4
example shows the pipeline term dominating a carbon-tilted sector purely from scale mismatch. Also:
carbon-price velocity ignores timestamp spacing, and the 5-ISIC weight matrix is DME-authored judgement.
Evolution A normalises each component to a common z-scale before the sector blend and auto-feeds the
inputs from real policy trackers.

**How.** Each component velocity is standardised (against its own historical distribution) before the
weighted sum, so the composite reflects sector weights rather than accidental unit magnitudes; carbon-
price velocity uses real timestamp spacing; the input blocks are auto-populated from the platform's
Climate Policy Radar / regulatory-calendar and litigation trackers instead of caller-supplied counts.
Rung 3: calibrate the sector weights and bill-stage/enforcement sub-weights against observed regulatory
transmission, and expand the ISIC matrix beyond 5 codes.

**Prerequisites (hard).** Fix the harness failures — §4.2 shows `POST /composite-velocity` and
`/from-events` **skipped** (need input payloads to trace); the heterogeneous-scale issue must be
resolved for the composite to be interpretable. **Acceptance:** the §7.4 electric-power worked example
(composite 0.7577) reproduces under legacy scaling, then the normalised composite reflects the sector
weights (carbon term no longer swamped); carbon velocity respects timestamp spacing; the endpoints pass
the harness.

### 9.2 Evolution B — Policy-velocity feed for the dynamic-materiality copilots (LLM tier 2)

**What.** This engine's output is the regulatory-velocity z-score input to the DME dynamic-materiality
layer (`api::dme_dmi`). Its LLM role is a **feed/explainer tool**: a DME copilot answering "how fast is
policy changing for this electric utility?" tool-calls `/composite-velocity` and narrates the component
decomposition (carbon 0.45, pipeline 0.25, enforcement 0.10, disclosure 0.20 for ISIC 3510), or
`/from-events` to compute velocity from discrete policy events (including negative velocity for
deregulation via `direction = −1`). The decomposition directly answers "what's driving the regulatory
pressure?"

**How.** Tool schemas over the 2 POST + 2 GET operations; the `ref/sector-weights` and `ref/components`
endpoints ground "why is power weighted 0.45 on carbon?" questions. The no-fabrication validator checks
every component and composite velocity against tool output; because the composite is an uncalibrated
index (§7.5), the copilot must present it as a comparative index, not a probability or dollar quantity,
until Evolution A normalises it. The tier-3 DME orchestrator wires this composite as the
`velocity_adjustments` input to `dme_dmi`, making the cross-engine flow auditable.

**Prerequisites.** Evolution A's harness fixes and scale normalisation (an uncalibrated index is hard
to narrate honestly); Atlas corpus embedded (roadmap D3). **Acceptance:** every velocity cited traces
to an engine tool call; the component decomposition matches `/composite-velocity`; the composite is
labelled a comparative index (pre-Evolution A) and, once fed to `dme_dmi`, is cited as this engine's
output, not an invented z-score.