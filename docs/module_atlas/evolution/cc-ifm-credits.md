## 9 · Future Evolution

### 9.1 Evolution A — Nonlinear growth curves calibrated to yield tables (analytics ladder: rung 1 → 3)

**What.** §7 shows `calcIFM` is a faithful VM0010 pipeline (stock difference → market +
activity leakage → buffer → uncertainty deduction `net ≡ pre_unc × UF`), but both stock
trajectories are straight lines: `cs = initial + annual_increment×t − harvest_rate×t×cf`.
Real forests do not grow linearly over a 20–40 year crediting period, and the guide
itself cites FVS and local yield tables as the intended basis. Evolution A replaces the
linear increment with fitted growth functions (Chapman-Richards or von Bertalanffy) per
forest type, parameterised from published yield tables (USFS FIA for North America, the
CAR Forest Protocol assessment-area data the §5 reference list already names).

**How.** (1) `ref_forest_growth_params(forest_type, region, curve_params, mai_peak,
source)` reference table; the Forest Growth Model tab plots the fitted curve against
the current linear one so the change is auditable. (2) Age-dependent harvest scheduling
replaces constant `harvest_rate×t`, making extended-rotation projects (the module's
headline IFM type) show the characteristic late-rotation stock divergence. (3) The
uncertainty factor becomes a function of the growth-curve fit error rather than a flat
0.90 default.

**Prerequisites.** Yield-table licensing/attribution; the synthetic 10-project registry
labelled as demo fixtures. **Acceptance:** a 40-year extended-rotation run shows
nonlinear divergence (not a constant wedge); a bench case with known Chapman-Richards
parameters reproduces published MAI within 5%.

### 9.2 Evolution B — IFM structuring copilot (LLM tier 1 → 2)

**What.** A copilot that explains the deduction waterfall the engine actually computes
— "why did 100k gross tonnes become 61k net?" answered by walking gross → leakage →
buffer → uncertainty with the live numbers — and runs structuring what-ifs ("reduce
harvest 30% instead of 20%", "assume 18% buffer for fire-prone temperate") by
re-invoking `calcIFM` client-side, since the module exposes no backend endpoints.

**How.** Tier 1: this atlas page (§5 VM0010/VM0012/CAR standards, §7 waterfall) as RAG
corpus with page state injected. Tier 2: a tool schema over `calcIFM(params)`; the
validator requires every tCO₂e figure in an answer to match a logged invocation.
Buffer-rating questions answer from the CAR/VCS non-permanence rubric text, and the
copilot must refuse credit-price or offtake questions (not computed here).

**Prerequisites.** None hard for tier 1 — guide and code agree per §7, so the corpus
is trustworthy; Evolution A improves what-if realism but does not block. **Acceptance:**
the waterfall explanation reconciles exactly to on-screen figures; an adversarial
"what will these credits sell for?" yields a refusal citing module scope.
