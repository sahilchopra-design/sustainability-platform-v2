## 9 · Future Evolution

### 9.1 Evolution A — Anchor to IDMC/GROUNDSWELL observed and projected data (analytics ladder: rung 1 → 2)

**What.** §7 flags that the guide's compound model
(`DisplacementRisk = P(event) × PopExposed × MigrationPropensity × FinancialImpact`)
is unimplemented — `displacementRiskScore` is a single seeded draw, and the 65 real
country names carry independent random displacement/remittance/funding fields. Two
levers are genuine: the temperature multiplier and the finance what-if. Evolution A
re-bases on the two datasets the §5 reference list already names: IDMC's Global
Internal Displacement Database (annual disaster-displacement counts per country,
public) for observed baselines, and World Bank GROUNDSWELL projections (published
2050 internal-migration ranges per region/scenario) for the forward view — so
`currentDisplacedM` and `projected2040M` become sourced numbers, with the existing
temperature multiplier interpolating between GROUNDSWELL's pessimistic/inclusive
scenarios instead of scaling noise.

**How.** (1) `ref_displacement(country, year, disaster_displaced, source)` from IDMC
exports; `ref_groundswell(region, scenario, projected_2050_range)` from the published
report tables. (2) Remittance exposure from World Bank remittance-inflow data (public
API the platform already uses for WB indicators) — making
`RemittanceDisruption = Flow × DisplacementShare × IncomeShock` computable with two
sourced terms and one explicit assumption. (3) The composite risk score rebuilt from
these components with documented weights, or dropped — no more standalone seeded
score.

**Prerequisites (hard).** PRNG purge on country attributes; GROUNDSWELL is
region-level, so country downscaling must be explicit (population-weighted) and
labelled. **Acceptance:** Bangladesh's observed displacement traces to IDMC rows; the
2040 projection interpolates GROUNDSWELL bounds reproducibly; zero seeded country
fields remain.

### 9.2 Evolution B — Sovereign-exposure copilot (LLM tier 1)

**What.** A copilot for sovereign analysts: "what's the observed vs projected
displacement picture for Vietnam and what drives it?" (IDMC history + GROUNDSWELL
scenario + the driver taxonomy), "which of our sovereigns have high remittance
sensitivity to displacement?", "what does the V20/UNHCR finance mechanism context
mean for this exposure?" — retrieval and comparison over the sourced tables plus the
§5 policy corpus. Tier 1: the module's rebuilt value is curated projection data, not
a live engine.

**How.** Atlas record and the three reference tables as corpus; every displacement
figure cited with source and scenario; the copilot must keep observed (IDMC) and
projected (GROUNDSWELL) clearly separated in prose — conflating them is the classic
misuse of this data.

**Prerequisites (hard).** Evolution A first: today the honest answer to any country
question is that the number is seeded. **Acceptance:** country answers carry
source+year per figure; asked to predict displacement-driven default risk, the
copilot presents the components and declines the causal leap.
