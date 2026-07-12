## 9 · Future Evolution

### 9.1 Evolution A — Calibrate downturn add-ons and vintage benchmarks to real loss data (analytics ladder: rung 2 → 4)

**What.** Two v2.0.0 engines behind one route: `LGDDownturnEngine` computes regulatory
downturn LGD per EBA GL/2019/03 (`downturn_lgd = long_run_avg + addon×country_sev×
sector_mult×scenario_mult + climate_stranded + climate_physical + green_adj`, floored per
CRR2 Art. 164), and `VintageAnalyzer` builds IFRS 9 cohort default triangles (cumulative
+ marginal DR by origination year × age, ECB calendar-provisioning coverage, early-warning
flags). The methodology is well-cited but the add-on magnitudes, country/sector
severities, and climate haircuts are all static reference tables. Evolution A calibrates
them and adds forecasting.

**How.** (1) Calibrate `country_cycle_severity`, `sector_severity`, and the collateral
add-ons against observed downturn-LGD data (the platform ingests EDGAR fundamentals and
market data; extend with a recovery/workout dataset) — replacing static multipliers with
fitted values plus a model card. (2) Add a predictive layer to `VintageAnalyzer`:
project marginal default rates for immature cohorts (young vintages have incomplete
triangles) using a hazard/logit model on the mature-cohort history — statsmodels is in
the environment. (3) Calibrate the climate haircuts (`stranded_haircuts`,
`physical_risk_multipliers`) to the platform's stranding/physical-risk engines rather
than fixed constants. (4) Bench-pin downturn LGD and the vintage triangle.

**Prerequisites.** A recovery/workout reference dataset for LGD calibration (currently
absent — may stay literature-anchored with honest labelling); mature vintage history for
the forecast fit. **Acceptance:** downturn add-ons carry calibration provenance; immature
cohorts get projected marginal DRs with intervals; climate haircuts trace to the
stranding engines; bench pins pass.

### 9.2 Evolution B — Credit-risk analyst copilot over LGD and vintage engines (LLM tier 2)

**What.** A copilot that answers "what's the downturn LGD on this CRE exposure under
disorderly transition, and does it breach the regulatory floor?" (calling `/downturn` and
citing the floor from `/downturn/regulatory-floors`) and "which origination vintages are
showing early-warning default acceleration?" (reading `/vintage` and narrating the
triangle and early-warning flags).

**How.** Two POST endpoints (`/downturn`, `/vintage`) plus the six reference GETs
(regulatory-floors, add-ons, sector/country severity, climate-haircuts, ECB coverage)
that ground every regulatory constant. The copilot decomposes downturn LGD into its
additive components (long-run + downturn add-on + climate) so users see what drives a
breach; batch downturn supports whole-book runs. What-ifs re-run statelessly across
scenarios.

**Prerequisites.** None hard — engines are honest and cite their regulation. **Acceptance:**
every LGD, floor, and default-rate figure traces to a tool response; the copilot reports
the specific CRR2/EBA article behind each floor from the reference endpoint; it labels
downturn LGD components as regulatory-calibrated-static until Evolution A recalibrates,
and refuses to assert a portfolio's actual realised LGD (which the engine estimates, not
observes).
