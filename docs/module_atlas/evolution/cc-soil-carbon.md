## 9 · Future Evolution

### 9.1 Evolution A — Statistically honest ΔSOC with sampling-driven crediting (analytics ladder: rung 1 → 3)

**What.** §7 confirms a faithful Tier 2 stock-difference implementation: real stock
equation (`%C · BD · depth`), a genuine Cochran sample-size formula, and stacked
leakage/buffer/uncertainty deductions. The honest gaps: ΔSOC is a point difference of
two user-typed stocks with `max(0, …)` clamping, credits are spread linearly over the
crediting period, and the flat `uncertainty%` input is disconnected from the Cochran
machinery the page already ships. Evolution A closes the loop: sampling variance from
the stratified design (the 6-stratum `STRATA` table has per-stratum SOC% and bulk
density) propagates into a confidence interval on ΔSOC, and the credited amount becomes
the VM0042-style lower confidence bound rather than the point estimate minus a flat
percentage.

**How.** (1) Per-stratum variance → area-weighted portfolio variance → t-distribution
CI on ΔSOC; the uncertainty deduction becomes `(mean − LCB)/mean`, computed not typed.
(2) Practice-rate priors: the 11-practice × 5-climate `PRACTICES` matrix checked
against published meta-analyses (the §5 reference list's IPCC 2019 Ch.2 defaults) with
sources displayed. (3) Nonlinear accrual option (SOC approaches a new equilibrium —
saturating curve) replacing the linear `cum_net(t) = net·t/years` spread.

**Prerequisites.** The t1/t2 measurement workflow needs persisted sample data (first
backend table for this module) or clearly-labelled fixture campaigns. **Acceptance:**
doubling sample count per stratum measurably shrinks the deduction; a fixture with
known stratum variances reproduces a hand-computed 90% LCB.

### 9.2 Evolution B — Sampling-design copilot (LLM tier 1 → 2)

**What.** A copilot for the module's genuinely statistical questions: "how many samples
do I need for ±10% at 90% confidence?" (the page's real Cochran formula), "why did my
buffer deduction eat 25% of gross?", "which practice fits a tropical arid site?" (the
`PRACTICES` climate columns). Tier-2 what-ifs re-invoke `calcSOC_BL`, `calcCredits`,
and the sample-size function client-side — no backend routes exist today.

**How.** Tier 1: atlas §5/§7 corpus plus live inputs; deduction-stack explanations
walk gross → leakage → buffer → uncertainty in the code's actual multiplicative order
(§7 shows sequential `(1−x)` factors, not additive subtraction — a real nuance worth
narrating correctly). Tier 2: tool schemas over the three calculators with the
no-fabrication validator.

**Prerequisites.** None hard — guide and code agree per §7 (the only nuance is
annualised-vs-total ΔSOC notation, which the copilot should state plainly).
**Acceptance:** a sample-size answer matches the Cochran function's return for the
stated CV and precision; practice-rate claims cite the seed matrix and its source
status.
