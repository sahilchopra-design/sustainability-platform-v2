## 7 · Methodology Deep Dive

The `pcaf_ecl_bridge` domain (`/api/v1/pcaf-ecl`) wires **PCAF financed-emissions analytics
into the IFRS 9 ECL climate overlay**. Engine: `pcaf_ecl_bridge.py`. It translates each
investee's PCAF profile (WACI, DQS, implied temperature, SBTi status) into the climate-risk
inputs the ECL engine consumes, so financed-emissions data automatically informs credit risk.

### 7.1 What the module computes

For each investee it maps a `PCAFInvesteeProfile` → `ECLClimateInputs`:

```
transition_risk_score = min(100, 15·log10(WACI+1) + 5)          # 0-100
transition_risk_level = threshold(WACI)                          # low…very_high
carbon_price_sensitivity = base(WACI) + sector_boost             # 0-1
pcaf_confidence = DQS_CONFIDENCE_WEIGHTS[round(DQS)]             # data trust
scenario_weights = TEMPERATURE_SCENARIO_WEIGHTS[bucket(temp_c)]  # 4-way NGFS split
```

At portfolio level (`bridge_portfolio`) it produces **exposure-weighted** average confidence
and transition score, plus a portfolio-temperature-driven scenario weight vector.

### 7.2 Parameterisation / scoring rubric

**DQS → confidence** (`DQS_CONFIDENCE_WEIGHTS`): 1→1.00, 2→0.90, 3→0.70, 4→0.50, 5→0.30.
Better data quality earns more weight on the climate overlay.

**Temperature → scenario weights** (`TEMPERATURE_SCENARIO_WEIGHTS`, ordered optimistic / base
/ adverse / severe):

| Temp bucket | OPT | BASE | ADV | SEV |
|---|---|---|---|---|
| <1.5 °C | 0.35 | 0.40 | 0.20 | 0.05 |
| 1.5-2.0 | 0.25 | 0.45 | 0.22 | 0.08 |
| 2.0-2.5 | 0.20 | 0.45 | 0.25 | 0.10 |
| 2.5-3.0 | 0.15 | 0.40 | 0.30 | 0.15 |
| 3.0-3.5 | 0.10 | 0.35 | 0.35 | 0.20 |
| >3.5 | 0.05 | 0.25 | 0.40 | 0.30 |

Hotter portfolios shift probability mass onto adverse/severe scenarios (2.0-2.5 is the "NGFS
default").

**WACI → transition risk level** (`WACI_TRANSITION_RISK_MAP`): <50 low, 50-150 medium,
150-500 high, ≥500 very_high (tCO₂e/€M revenue). **Carbon-price sensitivity** base:
≤50→0.2, ≤200→0.4, ≤500→0.6, ≤1000→0.8, else 0.95; plus a high-carbon GICS boost (Energy
"10" +0.15, Materials "15" +0.10, Utilities "55" +0.08, Industrials "20" +0.05), capped at 1.0.

**Provenance:** referenced against PCAF v2.0, IFRS 9 B5.5.7 (SICR) and EBA GL/2022/16; the
numeric weights are platform calibration constants.

### 7.3 Calculation walkthrough

`map_investee_to_ecl_climate` reads `revenue_intensity_tco2e_per_meur` (WACI) →
log-transition score, threshold level, carbon sensitivity; sets `physical_risk_score` from an
override or the 30.0 default; flags `net_zero_committed` if `net_zero_target_year ≤ 2050`;
picks `pcaf_confidence` from the DQS; and selects `scenario_weights` from the investee's
temperature bucket. `bridge_portfolio` accumulates `Σ w·confidence` and `Σ w·transition_score`
with `w = max(outstanding_eur, 1.0)`, then divides by total weight; portfolio scenario weights
come from the **portfolio** temperature bucket.

### 7.4 Worked example

Investee "ArcelorMittal": WACI = 1,200 tCO₂e/€M, GICS `15104050`, DQS 3, implied temp 3.8 °C,
no SBTi, no net-zero year.

- **Transition score:** `15·log10(1201)+5 = 15·3.080+5 = 51.2` → capped stays **51.2/100**.
- **Transition level:** 1,200 ≥ 500 → **very_high**.
- **Carbon sensitivity:** base (WACI>1000) 0.95 + Materials boost 0.10 → `min(1.0, 1.05) =
  1.0`.
- **Confidence:** DQS 3 → **0.70**.
- **Scenario weights:** temp 3.8 → ">3.5" bucket → **(0.05, 0.25, 0.40, 0.30)** — 70% of mass
  on adverse+severe, driving a materially higher climate-conditioned ECL.

### 7.5 Data provenance & limitations

- **No `sr()` fabrication.** Every output is a deterministic transform of the investee's PCAF
  fields; the demo profiles in `demo_bridge()` (TotalEnergies, Ørsted, ArcelorMittal) are
  illustrative but the mapping logic is pure.
- Physical risk defaults to 30/100 unless the caller supplies an override — the bridge does
  not itself model asset-level physical hazard.
- The log-transition curve and temperature→weight table are calibration choices, not derived
  from a specific NGFS run; they encode the *direction* of NGFS logic (hotter = worse for
  credit) rather than published transition matrices.
- The bridge produces ECL **inputs**, not ECL itself — PD/LGD/ECL are computed downstream by
  the ECL climate engine (see `climate-credit-integration`).

**Framework alignment:** **PCAF v2.0** supplies WACI/DQS/implied-temperature. **IFRS 9
B5.5.7** — the confidence and scenario weights feed the SICR-driven ECL overlay that IFRS 9
requires for forward-looking, scenario-weighted expected loss. **NGFS** — the four-scenario
optimistic/base/adverse/severe split with temperature-conditioned weights mirrors NGFS's
orderly/disorderly/hot-house framing. **EBA GL/2022/16** — climate stress-testing guidance
motivates conditioning credit parameters on portfolio temperature.
