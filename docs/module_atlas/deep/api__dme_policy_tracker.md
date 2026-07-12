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
