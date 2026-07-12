## 9 · Future Evolution

### 9.1 Evolution A — First real model-serving vertical: forecaster + drift monitor (analytics ladder: rung 1 → 4)

**What.** §7 is unambiguous: this page is a UI mock of an MLOps dashboard — `ALL_MODELS` metrics are literals, "Generate Forecast" is a `setInterval` progress bar over linear drift + `sr()` noise, the anomaly "detector" scores days already labelled by `ANOMALY_DAYS = [23,47,71]`, and no backend exists. Evolution A implements the §8 spec's minimum honest slice: a backend that actually fits and serves two things — a walk-forward-validated forecaster for the 6 `CLIMATE_VARS` series, and a real Isolation Forest + PSI drift monitor.

**How.** Stage it: (1) `api/v1/routes/predictive_hub.py` with `POST /forecast` (statsmodels seasonal/quantile regression first — already in the environment per the roadmap; a sequence model only after the baseline is beaten on MASE), `POST /anomaly` (scikit-learn IsolationForest, real path-length scores), `GET /models` (registry read from a new `ml_model_registry` table where MAE/AUC are written by the backtest job, never hand-entered). (2) Seed lookback windows from the platform's `reference_data` tables (OWID CO2/energy, World Bank) per §8.4. (3) Delete the inverted-causality anomaly mock and the fake attention heatmap; the UI renders only served values.

**Prerequisites.** The §7 mock must be acknowledged in release notes (numbers will change because today's are fabricated); point-in-time-correct feature windows to avoid leakage. **Acceptance:** registry AUC/MAE reproduce from the backtest artifact; walk-forward MASE beats naive drift for at least 4 of 6 variables before any "ML" label appears in the UI.

### 9.2 Evolution B — Model-governance copilot (LLM tier 1, gated behind Evolution A)

**What.** Once real models exist, this hub is where a risk-governance user asks "why did `xgb_climate_risk` trigger a retrain?", "is this PSI alert material?", "summarize this model's card for the validation committee". The copilot answers from the registry rows, drift metrics, and per-model §8-convention model cards — SR 11-7-style narrative generation grounded in computed monitoring statistics.

**How.** Tier-1 RAG over the module's Atlas record plus the live `ml_model_registry` and drift tables (retrieved via the module's own `GET /models` and monitoring endpoints, injected as context, not tool-called — keeping the first slice cheap). System prompt enforces the platform's honest-nulls posture: before Evolution A ships, the copilot must not exist on this page at all — narrating a mock would institutionalize the fabrication §7 documents. Post-A, add tier-2 tool calls for "re-run drift check on feature X".

**Prerequisites (hard).** Evolution A complete and the §7.6 fabricated series removed — this is the strongest do-not-ship-B-first case in the atlas. **Acceptance:** every metric the copilot quotes matches a registry/monitoring row; asked about SHAP attributions (named in the guide, not yet computed), it states they are not available rather than inventing drivers.
