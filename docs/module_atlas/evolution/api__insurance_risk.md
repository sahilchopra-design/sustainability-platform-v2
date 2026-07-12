## 9 · Future Evolution

### 9.1 Evolution A — Replace simplified actuarial factors with calibrated models (analytics ladder: rung 2 → 4)

**What.** `InsuranceRiskEngine` spans life mortality/longevity, life liability valuation,
P&C nat-cat, climate frequency, underwriting, retrocession, and health medical trend with
climate overlays. It is genuine scenario-capable work (frequency/severity multipliers,
PML 100/250yr, diversified PML via `√(Σsq + cross)`), but §5 is honest about shortcuts:
`le_delta = -delta_sum × 10  # Simplified scaling`, `own_funds = total_sa × 0.08 # 8%…
simplified`, `annuity_adj = 1 + shock/10000 × 5 # Simple annuity factor`, and aging as a
flat `qx × (1 + 0.01·t)`. Evolution A calibrates the load-bearing factors.

**How.** (1) Replace the flat mortality-improvement and simplified annuity factor with a
proper actuarial projection (e.g. a Lee-Carter-style improvement fit or standard
projection table), sourced and documented as a §8 model card. (2) Calibrate the PML
return-period factors (currently fixed 1.41/1.12 multipliers on a 200-yr base) and
nat-cat frequency multipliers against the platform's ingested peril grids (IBTrACS,
OpenFEMA claims) rather than static constants. (3) Make longevity/nat-cat SCR components
traceable to Solvency II modules instead of the `× 0.08` own-funds proxy. (4) Bench-pin
liability-valuation and PML.

**Prerequisites.** Ingested claims/peril data linkage (available in the platform);
actuarial projection reference tables. **Acceptance:** longevity stress no longer uses
the `×5` annuity shortcut; PML factors trace to a fitted return-period curve; bench pins
reproduce base vs stressed PV and diversified PML.

### 9.2 Evolution B — Actuarial and cat-risk copilot (LLM tier 2)

**What.** A copilot that runs `/comprehensive` for an insurer and explains the drivers —
"your combined ratio deteriorates 4pts under the disorderly climate-frequency scenario;
diversification benefit is 18%; longevity stress erodes solvency from 1.4 to 1.1" — each
figure from a tool call, plus what-ifs across the seven sub-modules.

**How.** Seven POST endpoints (mortality, liability-valuation, climate-frequency,
underwriting, retrocession, medical-trend, comprehensive) plus reference GETs
(available-countries/perils, climate-adjustments, solvency2-countries) that ground the
parameter space. The copilot narrates the real decomposition (frequency vs severity,
asset vs liability) and re-runs stressed scenarios statelessly. The engine's simplified
factors mean the copilot must caveat outputs as indicative pending Evolution A.

**Prerequisites.** Several POST endpoints trace `failed` in §4.2 (e.g.
`/climate-frequency`) under the harness — confirm payloads before wiring as tools.
**Acceptance:** every ratio, PML, and solvency figure traces to a tool response; the
copilot labels longevity/annuity outputs as "simplified actuarial basis" until Evolution
A recalibrates; asking for a granular reserving figure the engine doesn't compute is
refused.
