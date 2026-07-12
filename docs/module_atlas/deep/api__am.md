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
