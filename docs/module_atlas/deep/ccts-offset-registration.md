## 7 · Methodology Deep Dive

The MODULE_GUIDES entry (registry integrity scoring across Verra/GS/CAR/ACR + ICROA/ICVCM) partially
overlaps with the code, but the module is actually an **India CCTS offset-registration and valuation
tool**: it computes Carbon Credit Certificate (CCC) emission-reduction units (ERUs) from India's CEA
grid emission factors, applies a buffer pool and vintage-adjusted pricing, runs an additionality
test, an NPV, a Monte Carlo, and an integrity-weighted registration-readiness score. The guide's
`Registry Score = 0.25·Serialisation + …` composite is a different framing; the code's compliance
score is a 7-dimension weighted integrity index. Reference data is **real** (CEA CO2 Baseline
Database v20.0), so this is a genuinely functional module.

### 7.1 What the module computes

**ERU per asset** (combined-margin baseline minus project):
```
eru = max(0, mwh · (baselineEF − projectEF) · conservatism)     // tCO2e
```
`conservatism` is a per-method factor from `BEE_METHODS` (Solar PV 1.00, rooftop 0.95, biomass 0.90…).

**Buffer pool** (method-weighted):
`bufferPct = Σ BUFFER_POOL[method] · (eru_method / totalEru)`; `netEru = totalEru − bufferEru`.

**Valuation:**
```
revenueYr = totalEru · price(tier)          // ₹500 / ₹1,200 / ₹2,500 per tonne
disc      = (1 − (1+r)^(−n)) / r            // annuity factor, r=discount, n=crediting yrs
npv       = revenueYr · disc
vintageAdjPrice = price · Σ VINTAGE_CURVE[age] · (eru/totalEru)
```

**Additionality:** four flags (investment, technology, common-practice, regulatory-barrier);
common-practice auto-derived by comparing state PV penetration to the method's threshold; pass if
≥3 flags true.

**Compliance/integrity score:** weighted sum of 7 dimensions (baselineRule, conservatism, mrvQuality,
additionality, permanence, leakage, stakeholder) via `METHOD_COMPLIANCE_WEIGHTS`.

### 7.2 Parameterisation / scoring rubric

| Element | Value | Provenance |
|---|---|---|
| State grid EFs | RJ 0.78, GJ 0.72, KA 0.61, TN 0.58 … tCO₂/MWh | `CEA_GRID_EF` — **CEA CO₂ Baseline Database v20.0 (FY2023-24)** |
| National EF | 0.716 tCO₂/MWh | CEA v20.0 |
| Method conservatism | Solar PV 1.00, rooftop 0.95, wind 0.98, biomass 0.90 | `BEE_METHODS` — CCTS/BEE catalogue |
| Penetration thresholds | Solar PV 30%, rooftop 15%, wind 35% | `BEE_METHODS` — common-practice test |
| CCC price tiers | ₹500 / ₹1,200 / ₹2,500 per tonne | `CCC_TIERS` — India CCC market bands |
| Buffer pool / vintage curve | per method / by age | `BUFFER_POOL`, `VINTAGE_CURVE` (shared reference) |
| Default assets (RJ/GJ/KA/TN, 50–25 MW) | hard-coded demo portfolio | Illustrative |

### 7.3 Calculation walkthrough

Each asset's ERU = generation × (baseline − project EF) × method conservatism. Baseline EFs default
to the asset's state CEA value; project EF is ~0 for solar. Total ERU feeds a method-weighted buffer
deduction → net ERU. Revenue = net ERU × selected CCC tier; NPV discounts an annuity over the
crediting period. Additionality auto-checks common practice via state PV penetration vs threshold.
Registration is "ready" when ≥3 additionality flags pass, ERU > 0, and a project name is set. A Monte
Carlo (`monteCarlo`, 2,000 runs) and tornado sensitivity stress the valuation.

### 7.4 Worked example (default portfolio)

Asset 1 (Rajasthan PV-1): `mwh=98,500`, baselineEF=0.78, projectEF=0, conservatism (Solar PV)=1.00
→ `eru = 98,500·0.78·1.00 = 76,830 tCO₂e`. Asset 2 (Gujarat): 78,000·0.72 = 56,160. Asset 3 (KA):
69,000·0.61 = 42,090. Asset 4 (TN rooftop): 44,000·0.58·0.95 = 24,244.
`totalEru ≈ 199,324 tCO₂e/yr`. At the Mid tier (₹1,200/t): `revenueYr ≈ ₹239.2M`. With discount 8%,
n=10: annuity factor = (1−1.08⁻¹⁰)/0.08 = 6.710 → `NPV ≈ ₹1,605M (~₹160 crore)`. TN penetration
below rooftop's 15% threshold contributes a common-practice pass.

### 7.5 Data provenance & limitations
- Grid EFs and method catalogue are **real reference data** (CEA v20.0, BEE/CCTS catalogue) — not
  PRNG. The default asset portfolio is illustrative.
- No `sr()` synthetic data in the calculation path; Monte Carlo uses a shared stochastic engine.
- ERU uses a single baseline EF per asset (state combined-margin), not a full TOOL07 OM/BM split;
  grid-loss and curtailment factors noted in `BEE_METHODS.notes` are not all applied in the ERU line.
- CCC price tiers are discrete bands, not a live market curve.

**Framework alignment:** **India CCTS** (Carbon Credit Trading Scheme, BEE/MoP) — the ERU
quantification, conservatism factors and CCC pricing follow the CCTS compliance-market design.
**ICVCM Core Carbon Principles** and **ICROA Code of Best Practice** (guide) inform the integrity
score's additionality/permanence/MRV dimensions. **UNFCCC Article 6.2** corresponding-adjustment
status is offered as a credit-stacking toggle. CEA grid EFs are the authoritative Indian baseline
source; the combined-margin convention mirrors CDM TOOL07.
