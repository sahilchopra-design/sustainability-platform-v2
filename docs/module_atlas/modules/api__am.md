# Api::Am
**Module ID:** `api::am` · **Route:** `/api/v1/am` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/am/esg-attribution` | `esg_attribution` | api/v1/routes/am.py |
| POST | `/api/v1/am/paris-alignment` | `paris_alignment` | api/v1/routes/am.py |
| POST | `/api/v1/am/green-bond-screening` | `green_bond_screening` | api/v1/routes/am.py |
| POST | `/api/v1/am/climate-spreads` | `climate_spreads` | api/v1/routes/am.py |
| POST | `/api/v1/am/lp-analytics` | `lp_analytics` | api/v1/routes/am.py |
| POST | `/api/v1/am/optimise` | `optimise` | api/v1/routes/am.py |
| GET | `/api/v1/am/reference-data` | `reference_data` | api/v1/routes/am.py |

### 2.3 Engine `am_engine` (services/am_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `calculate_esg_attribution` | holdings, benchmark_esg_score | Decompose portfolio returns into Fama-French 5-factor + ESG factors. Uses Brinson-Fachler selection/allocation attribution. |
| `calculate_paris_alignment` | holdings, target_pathway, base_year | Compute portfolio implied temperature rise using weighted carbon intensity and sector decarbonisation pathways (PACTA methodology). |
| `screen_green_bonds` | bonds | Screen bond universe against ICMA GBS criteria and EU GBS Regulation. Returns eligibility assessment, greenium estimate, and DNSH flags. |
| `calculate_climate_adjusted_spreads` | issuers, carbon_price_eur, warming_scenario | Compute climate-adjusted credit spreads incorporating transition risk, carbon cost pass-through, and stranded asset probability. |
| `calculate_lp_analytics` | fund_aum_eur, investors, liquid_assets_pct, side_pocket_pct | Analyse investor base concentration, liquidity coverage, and redemption stress scenarios for fund liquidity management. |
| `optimise_esg_portfolio` | holdings, constraints, risk_free_rate | Simple ESG-tilted portfolio optimisation using analytical mean-variance with ESG score weighting. Full implementation would use scipy.optimize or cvxpy for quadratic programming. |
| `get_am_reference_data` |  | Return all reference data used by the AM Engine. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `am_assessments`, `datetime` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/am/reference-data** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['factor_premia_bps', 'sbti_sector_pathways_pct_pa', 'icma_uop_categories', 'sector_carbon_intensity_tco2e_m', 'pathway_targets_c', 'transition_spread_factors_bps', 'greenium_bps_by_rating', 'sources'], 'n_keys': 8}`

**POST /api/v1/am/climate-spreads** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/am/esg-attribution** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/am/green-bond-screening** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/am/lp-analytics** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/am/optimise** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/am/paris-alignment** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `am_engine` — extracted transformation lines:**
```python
port_ret = sum(h.weight_pct / 100.0 * h.return_pct for h in holdings)
bench_ret = sum(h.benchmark_weight_pct / 100.0 * h.benchmark_return_pct for h in holdings)
active_bps = (port_ret - bench_ret) * 100.0
port_esg = sum(h.weight_pct / total_weight * h.esg_score for h in holdings)
esg_tilt = (port_esg - benchmark_esg_score) / 100.0
port_carbon = sum(h.weight_pct / total_weight * h.carbon_intensity_tco2e_m for h in holdings)
carbon_tilt = (avg_sector_carbon - port_carbon) / avg_sector_carbon
total_factor_explained = esg_contribution + low_carbon_contribution
remaining = active_bps - total_factor_explained
factor_contributions[f] = remaining * (_FACTOR_PREMIA_BPS[f] / factor_total) * 0.6
residual = remaining - sum(factor_contributions.values())
wp = sum(h.weight_pct for h in sec_holdings) / 100.0
wb = sum(h.benchmark_weight_pct for h in sec_holdings) / 100.0
rp = sum(h.weight_pct * h.return_pct for h in sec_holdings) / max(sum(h.weight_pct for h in sec_holdings), 0.01)
rb = sum(h.benchmark_weight_pct * h.benchmark_return_pct for h in sec_holdings) / max(sum(h.benchmark_weight_pct for h in sec_holdings), 0.01)
interaction_effect = active_bps - (selection_effect * 100.0 + allocation_effect * 100.0)
selection_effect_bps=round(selection_effect * 100.0, 2),
allocation_effect_bps=round(allocation_effect * 100.0, 2),
ci_ratio = h.carbon_intensity_tco2e_m / max(sector_avg_ci, 1.0)
implied_t = target_temp + (ci_ratio - 0.5) * 1.5
sector_temps[sec] = round(sector_temps[sec] / sector_weights[sec], 2)
alignment_gap_c = round(port_temp - target_temp, 2)
alignment_gap_pct = round(alignment_gap_c / target_temp * 100, 1) if target_temp > 0 else 0.0
threshold = sector_avg * 0.5
overshoot = h.carbon_intensity_tco2e_m / max(threshold, 1.0)
elapsed = yr - base_year
port_t = port_temp - (port_temp - target_temp) * (1 - math.exp(-blend_rate * elapsed))
target_t = target_temp + (3.2 - target_temp) * max(0, 1 - elapsed / (2050 - base_year))
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain — this deep dive is written directly from
`backend/services/am_engine.py` ("Asset Management Engine") and `api/v1/routes/am.py`. No
guide↔code mismatch to report.)*

### 7.1 What the domain computes

Six deterministic sub-modules behind seven endpoints, all operating on caller-supplied holdings /
bonds / issuers / investors (no synthetic data generation inside the engine):

| Endpoint | Sub-module | Core output |
|---|---|---|
| `POST /esg-attribution` | Fama-French 5F + ESG factor decomposition, Brinson-Fachler | active-return bps split |
| `POST /paris-alignment` | PACTA-style implied temperature | portfolio °C, aligned weight %, laggards |
| `POST /green-bond-screening` | ICMA GBP / EU GBS scoring | eligibility 0–100, greenium bps, DNSH flags |
| `POST /climate-spreads` | transition-risk spread model | climate-adjusted spread + migration probabilities |
| `POST /lp-analytics` | fund liquidity & concentration | LCR, HHI, redemption stress |
| `POST /optimise` | ESG-tilted heuristic optimiser | weights, Sharpe, tracking error |
| `GET /reference-data` | `get_am_reference_data()` | all constants below |

### 7.2 Parameterisation (reference constants)

| Table | Values | Provenance (as cited in code) |
|---|---|---|
| Factor premia (bps p.a.) | market 500 · size 80 · value 120 · profitability 150 · investment 60 · **esg_quality 45** · **low_carbon 30** | Fama-French (2015); ESG premium labelled "Pastor-Stambaugh taste premium"; green factor "in-Bok Kim et al. 2024" — stylised calibrations |
| SBTi sector pathways (%/yr) | power −7.0 · oil&gas −6.0 · autos −5.0 · real estate −4.5 · steel −4.0 · … default −3.0 | SBTi sectoral decarbonisation approach, hand-encoded |
| Sector carbon intensity (tCO₂e/€m) | steel 1,200 · aviation 1,100 · cement 950 · power 820 · oil&gas 680 · … financial 15 · default 180 | Plausible sector averages, no per-value citation |
| Pathway targets (°C) | 1.5C → 1.5 · well_below_2C → 1.75 · 2C → 2.0 · current_policies → 3.2 | Paris Agreement / NGFS convention |
| Transition spread factor (bps/unit) | AAA 0.3 → CCC 8.0 (default 2.0) | Stylised rating-dependent sensitivity |
| Greenium (bps) | AAA 3 → B 20 (default 8); ×1.5 if EU GBS aligned, ×0.3 if not ICMA aligned | Consistent with empirical greenium literature (single-digit bps IG) |

### 7.3 Calculation walkthrough

1. **ESG attribution** — portfolio/benchmark returns are weight-sums;
   `esg_tilt_bps = (portESG − benchESG)/100 × 45`;
   `low_carbon_bps = (180 − portWACI)/180 × 30`. The remaining active return is split across the
   five FF factors *pro-rata to their premia × 0.6*, residual = alpha. Brinson-Fachler per sector:
   `selection = Σ w_p(r_p − r_b)`, `allocation = Σ (w_p − w_b)(r_b − R_b)`, interaction = plug.
   The code itself notes a real implementation would use time-series regression betas.
2. **Paris alignment** — per holding, `implied_T = target + (CI/sectorAvgCI − 0.5) × 1.5`, clamped
   [1, 6] °C: a holding at half its sector's average intensity sits *on* target; at 1.5× it runs
   +1.5 °C hot. Portfolio temperature is the sector-weighted mean. Alignment split: holdings with
   `CI ≤ 0.5 × sector average` count as aligned. Trajectory: portfolio T converges to target as
   `T_t = T₀ − (T₀ − target)(1 − e^{−r·t})` where r = weighted SBTi pathway rate.
3. **Green bond screening (additive rubric, eligible ≥ 60)** — valid ICMA UoP +30 · taxonomy ≥ 85 %
   +25 (≥ 50 % +15, > 0 +5) · external review +15 · impact reporting +15 · DNSH assessed +15 ·
   oil/gas/coal sector −20. `icma_aligned = UoP ∧ review ∧ reporting`;
   `eu_gbs_aligned = icma ∧ taxonomy ≥ 85 ∧ DNSH` (mirroring EU GBS Reg 2023/2631's 85 %
   taxonomy floor).
4. **Climate-adjusted spreads** —
   `transition = score × ratingFactor × scenarioMult × 0.5`;
   `carbon = CI/1000 × carbonPrice × 0.15 × mult`;
   `stranded = max(0, fossilRev% − 30) × 0.8 × mult`;
   `sbti_benefit = 15 + greenCapex% × 0.3` if committed;
   `adj = max(0, transition + carbon + stranded − benefit)`. Scenario multipliers: 1.5C ×1.5, 2C
   ×1.0, 3C ×0.6, BAU ×0.3 (transition risk *rises* with ambition — the orderly-transition
   convention, opposite to physical risk). Downgrade probability uses an exponential hazard:
   `p(1y) = 1 − e^{−adj/500}`, `p(5y) = 1 − e^{−5·adj/500}`.
5. **LP analytics** — HHI on commitment shares (0–10,000); 30/90-day redemption stress counts only
   investors past lock-up with notice within the window, at
   `commitment × historicalRate × days/365`; `LCR = liquidAssets / 30dOutflow` (10.0 when no
   outflow). Rating: critical if LCR < 1 or HHI > 4,000; high if < 1.5 or > 2,500; medium if
   < 2.5 or > 1,500.
6. **Optimisation (heuristic, not QP)** — starts equal-weight, applies
   `tiltFactor = 1 + tilt × (ESG − avgESG)/100` and a 0.3 carbon penalty above the CI cap,
   normalises, then iteratively enforces single-name and sector caps. Risk is a concentration
   proxy `vol = 15 % × √(HHI_w × n)` clamped [5, 40]; TE = √Σ(Δw)² × vol × 100 capped 10. The
   docstring itself says a full implementation would use scipy/cvxpy quadratic programming.

### 7.4 Worked example (climate-adjusted spread)

Issuer: BBB, base spread 150 bps, CI = 400 tCO₂e/€m, transition score 60, fossil revenue 45 %,
green capex 20 %, SBTi committed; carbon price €80; scenario 2C (mult 1.0):

| Component | Computation | bps |
|---|---|---|
| Transition | 60 × 1.5 (BBB) × 1.0 × 0.5 | 45.0 |
| Carbon cost | (400/1000) × 80 × 0.15 | 4.8 |
| Stranded asset | (45 − 30) × 0.8 | 12.0 |
| SBTi benefit | −(15 + 20 × 0.3) | −21.0 |
| **Climate adjustment** | max(0, 45 + 4.8 + 12 − 21) | **40.8** |
| Adjusted spread | 150 + 40.8 | **190.8** |
| Downgrade p(1y) | 1 − e^(−40.8/500) | **7.8 %** |
| Downgrade p(5y) | 1 − e^(−0.408) | **33.5 %** |

### 7.5 Data provenance & limitations

- The engine is **pure deterministic transformation of caller inputs** — no PRNG, no DB reads.
  Whether outputs are meaningful depends entirely on the calling module's holdings data (several
  frontend pages feed it synthetic seeds).
- Factor attribution is a *pro-rata allocation*, not estimated betas; the 0.6 scaling and
  benchmark WACI = 180 are hardcoded simplifications.
- The implied-temperature function is a linear CI-ratio heuristic, not the production ITR
  methods (SBTi/CDP-WWF temperature ratings regress cumulative emissions gaps onto scenario
  budgets).
- Spread model coefficients (×0.5, ×0.15, ×0.8, /500 hazard) are stylised; no calibration to
  observed climate spread premia.
- Optimiser cap-enforcement is one-pass (sector scaling can slightly break the single-name cap);
  no covariance matrix, so "risk" ignores correlations.

### 7.6 Framework alignment

- **ICMA Green Bond Principles (2021)** — four pillars (use of proceeds, evaluation/selection,
  management of proceeds, reporting) are approximated by the UoP + review + reporting checks.
- **EU Green Bond Standard (Reg. 2023/2631)** — correctly modelled as stricter: ICMA alignment
  *plus* ≥ 85 % taxonomy alignment *plus* DNSH; the real EuGB also requires pre-issuance
  factsheets and external reviewer registration, not modelled.
- **PACTA / ITR** — sector-pathway-based alignment measurement; PACTA proper compares production
  plans to scenario benchmarks per technology, richer than this CI ratio.
- **Brinson-Fachler (1985/86)** — standard selection/allocation/interaction decomposition,
  implemented per sector.
- **Fama-French 5-factor (2015)** — factor vocabulary reused; premia are static priors.
- **Basel III LCR analogy** — fund LCR = liquid assets over 30-day stressed outflow mirrors the
  banking ratio's construction; HHI thresholds (1,500/2,500) follow DOJ/FTC merger-guideline
  concentration bands.

## 9 · Future Evolution

### 9.1 Evolution A — Regression-based attribution and QP optimisation (analytics ladder: rung 1 → 3)

**What.** The `am_engine` ("Asset Management Engine") is a clean tier-A vertical: six deterministic
sub-modules (ESG attribution, PACTA-style Paris alignment, ICMA/EU-GBS green-bond screening,
climate-adjusted spreads, LP liquidity analytics, ESG-tilted optimisation) over caller-supplied
data, no PRNG, no DB reads. But §7.5 documents where the math is stylised: factor attribution is a
*pro-rata allocation* of active return across FF-5 premia (×0.6 scaling, benchmark WACI hardcoded
180), not estimated betas; the implied-temperature function is a linear CI-ratio heuristic, not a
real ITR method; the optimiser is a one-pass heuristic whose "risk" ignores correlations (the
docstring itself says a full build would use scipy/cvxpy QP). Evolution A upgrades each: time-series
regression betas for attribution, a cumulative-emissions-budget ITR for Paris alignment, and a real
mean-variance QP optimiser with a covariance matrix.

**How.** `POST /esg-attribution` gains an optional returns-history input to estimate factor betas
(statsmodels, already in the environment); `/paris-alignment` adds a budget-based ITR alongside the
CI-ratio heuristic; `/optimise` calls scipy.optimize/cvxpy for true QP with a covariance input,
enforcing single-name and sector caps jointly rather than one-pass (fixing the documented cap-break).
Rung 3: calibrate the spread-model coefficients (×0.5 transition, /500 hazard) and greenium bps
against observed climate-spread and greenium literature the reference data already cites.

**Prerequisites (hard).** Fix the lineage-harness failures — §4.2 shows `/green-bond-screening` and
`/optimise` **failed** and four others **skipped**; the engine's outputs are only as good as the
caller's holdings (several frontend pages feed it synthetic seeds — those callers need real data).
**Acceptance:** the §7.4 climate-spread worked example (190.8 bps adjusted, 7.8% 1y downgrade)
reproduces; the QP optimiser respects both caps simultaneously; attribution betas are estimated when
history is supplied, falling back to the pro-rata heuristic otherwise.

### 9.2 Evolution B — Portfolio-manager analyst across the AM sub-modules (LLM tier 2)

**What.** A tool-calling analyst for asset managers: "attribute my portfolio's active return"
tool-calls `/esg-attribution` (Brinson-Fachler selection/allocation split), "what's my implied
temperature and who are the laggards?" calls `/paris-alignment`, "screen these bonds for EU GBS"
calls `/green-bond-screening`, "stress my fund's liquidity" calls `/lp-analytics` (LCR, HHI,
redemption stress), and "optimise with a 0.3 ESG tilt" calls `/optimise` — narrating the engine's
real deterministic outputs across a coherent PM workflow.

**How.** Tool schemas from the 6 POST + 1 GET operations (Pydantic-typed); the `/reference-data`
endpoint (factor premia, SBTi pathways, sector carbon intensity, greenium by rating) is ideal RAG
grounding for "why is my low-carbon tilt worth 30bps?" questions. The no-fabrication validator
checks every bps, °C and ratio against tool output. This module is also a natural node in a Financial
desk orchestrator (tier 3): "assess this fund" chains AM attribution + Paris alignment + LP liquidity
into one memo.

**Prerequisites.** Evolution A's harness fixes (working endpoints for tool-calling); the caller must
supply real holdings for outputs to be meaningful (§7.5); Atlas + reference-data corpus embedded
(roadmap D3). **Acceptance:** every numeric in an answer traces to an engine tool call; the implied
temperature cited matches `/paris-alignment` output exactly; a bond failing the 85% taxonomy floor
is correctly reported EU-GBS-ineligible with the reason.