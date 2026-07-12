## 9 · Future Evolution

### 9.1 Evolution A — Alkalinity-flux MRV to match the guide's accounting basis (analytics ladder: rung 1 → 3)

**What.** §7 flags the core mismatch: the guide describes flux-based MRV
(`CDR = ΔAlkalinity × MW_CO2/MW_HCO3 × Volume × (1−LCI)` from paired-watershed stream
chemistry) but the code computes a stoichiometric cation-carbonation potential
(CaO→CaCO₃, MgO→MgCO₃ with a particle-size step function), and the entire "Measurement
& Verification" tab is `sr()`-seeded synthetic time series. Evolution A builds the
documented flux model: a measurement-ingestion path for discharge and alkalinity/DIC
observations, control-vs-treatment watershed differencing, and the bicarbonate
stoichiometry conversion — with the existing carbonation-potential engine retained as
the ex-ante ceiling estimate it genuinely is.

**How.** (1) `erw_monitoring_observations(site, date, discharge, alkalinity, dic,
watershed_type)` table + upload endpoint (module's first backend surface).
(2) Flux computation per the Lithos/Cascade protocols already in §5's reference list;
net CDR reported as measured-flux minus the grinding/transport LCI the code already
deducts. (3) Delete the seeded-random M&V series — the platform's random-as-data
guardrail (`check_no_fabricated_random.py`) should catch this page once the tab renders
real or honestly-empty data.

**Prerequisites (hard).** The `sr()`-seeded monitoring series is a documented defect
and must be removed, not painted over; demo observations seeded as clearly-labelled
fixtures. **Acceptance:** M&V tab renders uploaded observations or an honest empty
state; a fixture watershed pair with known ΔAlkalinity reproduces hand-computed CDR to
4 significant figures.

### 9.2 Evolution B — ERW project-design copilot (LLM tier 1)

**What.** A copilot for the design questions the real engine answers: "why does finer
grinding raise capture but also raise the energy deduction?", "what fraction of
theoretical CaCO₃ potential is practically achievable at 100µm?", "how do basalt and
dunite differ?" (the `ROCK_TYPES` oxide-content data is genuine chemistry). Grounded in
atlas §5/§7; explanation-only, because the M&V tab's numbers are currently synthetic
and must not be narrated as measurements.

**How.** Tier-1 pattern: atlas record in `llm_corpus_chunks`, calculator inputs/results
injected; stoichiometry questions answered from the §7 mass-ratio formulas (44/56 for
CaO, 44/40 for MgO). The system prompt must state that field-monitoring figures are
illustrative until Evolution A lands — this is the honest-nulls convention applied to
LLM narration.

**Prerequisites.** None for the calculator-explaining slice; Evolution A before any
monitoring-data questions get real answers. **Acceptance:** the grinding trade-off
answer cites both the size-factor step function and the energy-emissions term; a
question about "current measured alkalinity flux" is refused or explicitly labelled
demo pending Evolution A.
