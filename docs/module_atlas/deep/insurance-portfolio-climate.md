## 7 · Methodology Deep Dive

The MODULE_GUIDES entry here is broadly accurate: the page does implement an investment-side climate
screen, an underwriting warming-stress, reserve adequacy, an ORSA radar, a Solvency II SCR view, and
an insurance ESG rating. The caveat is that the inputs are **curated constants** (6 asset classes, 6
underwriting lines, 5 SCR modules) and the "climate add-ons" are **hard-coded**, not derived — the
genuine computations are the warming-stress power curves and the scenario-scaled reserve gap. The
backend `insurance_climate_risk.py` (which *does* compute SCR add-ons properly) is not called by this
page.

### 7.1 What the module computes

**Underwriting warming stress** — quadratic escalation of claims ratio with warming:

```js
property     = 68 × (1 + (w−1)×0.12)^2       // w = warming °C
liability    = 55 × (1 + (w−1)×0.06)^2
business_int = 45 × (1 + (w−1)×0.15)^2
```

**Reserve adequacy** — scenario-scaled reserve gap and needed reserve:

```js
factor       = optimistic 0.7 | central 1.0 | pessimistic 1.4
adjGap       = reserveGap × factor
currentReserve = premium × claimsRatio/100
needed         = premium × climateAdj/100          // climateAdj > claimsRatio ⇒ shortfall
```

**Portfolio / capital roll-ups:**

```js
totalPremium = Σ UW_LINES.premium
totalSCR = Σ SOLVENCY_RISKS.total ; baseSCR = Σ baseSCR ; climateAddon = Σ climateAddon
overallOrsa = round(Σ orsaRadar.score / 5)
esgTotal = Σ ESG_PILLARS.score × weight/100          // weighted E/S/G
```

### 7.2 Parameterisation / scoring rubric

| Element | Value | Provenance |
|---|---|---|
| `ASSET_CLASSES` (allocation, transRisk, physRisk, climateScore) | 6 curated rows (Govt 35%…Alternatives 7%) | Hand-set; RE physRisk 42 highest |
| `UW_LINES` (premium, claimsRatio, climateAdj, freqTrend, sevTrend, reserveGap) | 6 curated lines | Property climateAdj 82 vs claims 68 ⇒ loading |
| Warming-stress exponents | property 0.12, liability 0.06, BI 0.15 (all squared) | Author heuristic; peril sensitivity ordering |
| Reserve scenario factors | 0.7 / 1.0 / 1.4 | Optimistic / central / pessimistic |
| `SOLVENCY_RISKS` baseSCR + climateAddon | 5 curated modules | **Add-ons hard-coded** (e.g. Non-Life 620+185) |
| `ORSA_SCORES` | [72,58,45,65,52] | Curated 5-dimension radar |
| `ESG_PILLARS` weights/scores | E40/S30/G30; 62/71/78 | Curated weighted rating |
| `WARMING` levels | 1.0–4.0 °C | Stress grid |

### 7.3 Calculation walkthrough

1. Investment screen renders `ASSET_CLASSES` transition/physical risk and climate score by allocation.
2. Underwriting stress computes `claimsTrend` power curves across the warming grid; a slider picks
   `warmingLevel`.
3. Reserve tab scales each line's `reserveGap` by the scenario factor and compares
   `currentReserve` vs `needed`.
4. ORSA radar averages 5 dimension scores (user-overridable); Solvency tab sums base SCR + climate
   add-on; ESG tab computes the weighted pillar rating.

### 7.4 Worked example (Property line, +2 °C, pessimistic reserves)

| Step | Computation | Result |
|---|---|---|
| Warming claims ratio | 68 × (1 + (2−1)×0.12)^2 = 68 × 1.2544 | **85.3%** |
| Current reserve | 4200 × 68/100 | **$2,856M** |
| Needed (climateAdj) | 4200 × 82/100 | **$3,444M** |
| Reserve shortfall | 3444 − 2856 | **$588M** |
| Adjusted gap (pessimistic) | 14 × 1.4 | **19.6** |

Capital view: `climateAddon = 120+185+25+35+40 = $405M` on `baseSCR = $1,980M` → total SCR $2,385M,
i.e. a ~20% climate uplift — but these add-ons are stored, not modelled.

### 7.5 Companion analytics on the page

- **10-year frequency/severity trend** (`1.06^i`, `1.09^i`, combined) illustrating loss-cost drift.
- **ORSA module** — editable 5-dimension climate risk radar with overall score.
- **Solvency II SCR** — base + climate add-on by risk module.
- **Insurance ESG rating** — weighted E/S/G composite.

### 7.6 Data provenance & limitations

- **All inputs curated static demo data** — no PRNG, but not real portfolio data.
- The Solvency II climate SCR **add-ons are hard-coded**, not computed from a CAT-scenario model
  (unlike `insurance_climate_risk.py`, which derives them from Annex XIII factors × loss multipliers).
- Reserve "needed" uses a stored `climateAdj` ratio rather than a projected climate-adjusted loss.
- Warming-stress exponents are heuristic, not calibrated to a cat model.

**Framework alignment:** *EIOPA / Solvency II* — the SCR-module structure (Market, Non-Life UW,
Counterparty, Operational, Health) mirrors the Solvency II standard-formula risk modules, and the
ORSA radar reflects the Own Risk & Solvency Assessment's climate dimension. *NAIC* — referenced for
US climate risk disclosure. The climate add-on and reserve loading are directionally sensible but not
derived from a calibrated CAT/scenario engine.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Derive the Solvency II climate SCR add-on, climate-adjusted technical provisions, and reserve
adequacy from a calibrated CAT/scenario engine rather than hard-coded numbers — for the insurer's
ORSA and Pillar-2 capital buffer.

### 8.2 Conceptual approach
Two-sided: (a) **liability side** — peril×scenario loss multipliers → climate-adjusted loss ratios →
TP uplift and CAT-SCR add-on, per EIOPA CCRST 2022 and Solvency II Delegated Reg. Annex XIII (already
implemented in the platform's `insurance_climate_risk.py`); (b) **asset side** — NGFS-scenario
repricing of the investment book (market-risk SCR climate module), mirroring EIOPA's 2022 insurer
stress test and NGFS Phase IV.

### 8.3 Mathematical specification
Per LOB *l*, peril *p*, scenario *s*; asset class *c*:

```
LossRatio_l(s) = base_l · (1 + Σ_p share_{l,p}(m_p(s) − 1))
TP_l^adj(s)    = TP_l · (1 + uplift(s))                       // uplift from _TP_UPLIFT_PCT
CATSCR_l(s)    = GWP_l · Σ_p f_p^{SII} · max(0, m_p(s)−1)
MktSCR^clim(s) = Σ_c Alloc_c · (ΔValue_c(s))                  // NGFS repricing shock
SCR_total(s)   = SCR_base + Σ_l CATSCR_l(s) + MktSCR^clim(s)
ReserveGap_l(s)= max(0, NeededReserve_l(s) − TP_l^adj(s))
```

| Parameter | Source |
|---|---|
| Loss multipliers `m_p(s)` | Swiss Re sigma; EIOPA CCRST 2022 (in engine) |
| SII CAT factors `f_p^{SII}` | Delegated Reg. Annex XIII (in engine) |
| TP uplift `uplift(s)` | EIOPA Supervisory Statement 2024 (in engine) |
| Asset repricing `ΔValue_c(s)` | NGFS Phase IV transition shocks |

### 8.4 Data requirements
Portfolio by LOB × peril (GWP, base loss ratio, TPs), investment book by asset class with transition
sensitivity, own funds, base SCR by module. Platform has: multiplier/factor/uplift tables and a full
CAT engine; needs the page wired to `POST /api/v1/insurance/calculate` and an NGFS asset-repricing
feed.

### 8.5 Validation & benchmarking plan
Reconcile SCR add-on and TP uplift against EIOPA CCRST published aggregates; backtest reserve gaps
against realised catastrophe reserving; sensitivity of solvency ratio to peril mix and NGFS scenario.

### 8.6 Limitations & model risk
Standard-formula CAT factors are coarse vs an internal model; asset-side repricing depends on the
NGFS transmission assumptions; correlation across market and underwriting climate shocks is omitted.
Fallback: present SCR and reserve gaps as scenario ranges and flag solvency ratios below 120%.
