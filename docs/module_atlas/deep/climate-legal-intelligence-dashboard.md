## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a *case-driven* Litigation
> Risk Score — `LRS = Σ (Case Weight × Jurisdiction Factor × Outcome Probability)` — built from
> ingested Sabin Center / ClientEarth filings with outcome-probability modelling. **None of that
> exists in the code.** The page generates 100 synthetic entities whose six risk dimensions are
> independent seeded draws, averages them into a composite, and derives a "Net Legal VaR" from
> seeded litigation/insurance amounts. No case ingestion, no case weights, no outcome
> probabilities. The sections below document what the code actually does.

### 7.1 What the module computes

For 100 synthetic entities (10 sectors × 20 countries, 1–3 jurisdictions each):

```
dimension_k          = round(sr(i × p_k) × 85 + 5)        // six draws, k ∈ {litigation, greenwashing,
                                                          //  disclosure, regulatory, reputational, precedent}
compositeLegalRisk   = round(Σ dimension_k / 6)           // equal-weight mean, 0–100
netLegalVaR          = max(0, pendingLitigationM × composite/100 − insuranceCoverageM × 0.8)
weightedScore        = round(Σ dimension_k × w_k / Σ w_k) // user-adjustable sliders (Tab 5)
insurance gap        = pendingLitigationM × composite/100 − insuranceCoverageM × 0.8   // Tab 7, ≥0
forecast(y, s)       = round(500 × (1 + CAGR_s)^y)        // 2025–2035 legal-cost index, 3 scenarios
```

Jurisdiction intelligence (25 jurisdictions) and a 30-row precedent database are separately seeded;
neither feeds the entity scores — they are descriptive companion panels.

### 7.2 Parameterisation

| Parameter | Value / range | Provenance |
|---|---|---|
| Six dimension scores | `sr(i×{19,23,29,31,37,41}) × 85 + 5` → 5–90 | Synthetic demo values |
| Default dimension weights | Litigation 20, Greenwashing 20, Disclosure 15, Regulatory 20, Reputational 15, Precedent 10 | Author-chosen defaults; user-editable, re-normalised by Σw |
| Pending litigation / fines / insurance | $10–510M / $5–205M / $5–155M seeded | Synthetic |
| Insurance recovery haircut | 0.8 (only 80% of coverage nets against VaR) | Hard-coded heuristic |
| Scenario CAGRs | BAU 8%, Litigation Wave 18%, Regulatory Surge 14% (base 500) | Hard-coded; Litigation-Wave order of growth loosely echoes UNEP's reported ~46% Y/Y greenwashing-case growth but is not sourced |
| Jurisdiction maturity / cases / damages | `sr(ji×{73,79,83,89}+6000)` → 20–90 / 5–85 / $0.1–5.1B | Synthetic |
| Precedent impactScore, damages | 15–95 / $0.01–2.01B, years 2005–2023 | Synthetic; case names auto-generated (`X v. Climate Authority YYYY`) |

The 10 `keyPrinciple` strings (e.g. "Corporate duty of care extends to climate-related harms",
"Net-zero pledges are legally binding representations") are hand-written distillations of real
doctrine (Milieudefensie, Held v Montana lineage) attached to fictional cases.

### 7.3 Calculation walkthrough

Entity generation runs once at module load. Filters (sector, jurisdiction membership, external
counsel, min readiness, active-cases toggle, name search) subset the 100 entities; every KPI
(`avgComposite`, `totalNetVaR`), the 5-bucket risk histogram, and the weighted-composite table
recompute from the filtered set with length guards. Tab 5's sliders re-weight the same six seeded
dimensions live — the only interactive "model" on the page. Tab 6 selects one of three
deterministic compound-growth curves. Tab 7 ranks the 20 largest insurance-adequacy gaps.

### 7.4 Worked example (one entity, tracing the code's formulas)

Take an entity whose seeded draws give: litigation 72, greenwashing 55, disclosure 60, regulatory
48, reputational 66, precedent 41; `pendingLitigationM = 310`, `insuranceCoverageM = 90`.

| Step | Computation | Result |
|---|---|---|
| Composite | round((72+55+60+48+66+41)/6) = round(342/6) | **57** |
| Gross legal VaR | 310 × 57/100 | $176.7M |
| Insurance offset | 90 × 0.8 | $72.0M |
| Net Legal VaR | max(0, 176.7 − 72.0) | **$105M** (toFixed(0)) |
| Weighted score (default weights, Σw=100) | (72·20 + 55·20 + 60·15 + 48·20 + 66·15 + 41·10)/100 = 5,800/100 | **58** |
| Forecast, Litigation Wave, 2030 (y=5) | round(500 × 1.18⁵) = round(500 × 2.2878) | **1,144** |

Note the composite treats the six dimensions as exchangeable and uncorrelated; because each is an
independent uniform draw, the law of large numbers pulls composites toward ~47.5, so the 85–100
histogram bucket is almost always empty — an artefact of the generator, not a risk statement.

### 7.5 Companion analytics

Entity drill-down radar (six dimensions vs 100 full-mark); sector × dimension averages (heat
table); jurisdiction league table sorted by maturity with constitutional-climate flag and
liability-standard tag (Strict/Negligence/Statutory, seeded); precedent table sortable by impact
score; CSV export of the filtered entity set.

### 7.6 Data provenance & limitations

- **Every number on the page is synthetic**, generated by the platform PRNG
  `sr(seed) = frac(sin(seed+1)×10⁴)`. Entity names are combinatorial ("Apex Corp", "Global AG");
  no real counterparties, cases, or filings are represented.
- The six risk dimensions are mutually independent draws — real litigation, disclosure and
  greenwashing risks are strongly correlated (same underlying conduct), so the composite's
  dispersion is understated and its ranking is meaningless beyond the demo.
- "Net Legal VaR" is an expected-value-style product (exposure × score%), not a quantile; the VaR
  label overstates its statistical content. The 0.8 insurance haircut and the 500-index forecast
  base are unsourced constants.
- Jurisdiction and precedent panels do not influence entity scores — in a production system they
  would be the primary inputs (per the guide's intended design).

**Framework alignment:** Sabin Center Global Climate Change Litigation database — the real-world
source the guide envisages; it catalogues ~2,900+ cases with jurisdiction, claim-type and status
fields, which is exactly the schema the synthetic `KEY_PRECEDENTS` mimics · UNEP Global Climate
Litigation Report — provides the case-growth statistics the forecast tab gestures at · ClientEarth
strategic-litigation practice informs the claim-type taxonomy (disclosure failure, greenwashing,
stranded asset, human rights). None of these datasets is ingested; alignment is nominal.

### 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** An entity-level climate litigation risk model supporting counterparty
review and portfolio legal-reserve setting: probability an entity is named in a material climate
case over 1–3 years, and the loss distribution if named. Coverage: listed corporates and financial
institutions in the 25 dashboard jurisdictions.

**8.2 Conceptual approach.** Two-part frequency–severity model: (1) case-arrival hazard estimated
from the Sabin Center / LSE-Grantham case corpus by sector × jurisdiction × claim type, and (2)
severity fitted to observed settlements/fines. This mirrors **Praedicat's CoMeta** emerging-liability
modelling and **Verisk Arium's** casualty scenario framework, with the entity-conditioning layer
resembling **Moody's EDF**-style covariate models (score → PD analogy).

**8.3 Mathematical specification.**

```
λ_e = λ₀(sector, jur) × exp(β₁·EmissionsIntensity_z + β₂·(1−DisclosureQuality) +
                            β₃·GreenwashSignal + β₄·PriorCases + β₅·JurisdictionActivity)
P(named ≥1 case, h yrs) = 1 − exp(−λ_e h)
Severity S ~ LogNormal(μ_c, σ_c) by claim type c;  mixture over claim-type propensities
Expected legal loss = Σ_c P_c × E[S_c | named] × (1 − r_ins·RecoveryRate)
Legal VaR_99 = quantile of compound Poisson(λ_e)–LogNormal aggregate at 99%
```

| Parameter | Description | Calibration source |
|---|---|---|
| λ₀(sector, jur) | Baseline filing hazard | Sabin Center case counts 2015–2024 ÷ listed-entity counts (World Bank/WFE) |
| β₁ | Emissions-intensity elasticity | Logistic regression, defendants vs matched non-defendants (CDP + Sabin) |
| β₂, β₃ | Disclosure & greenwash covariates | CDP disclosure scores; regulator enforcement registers (FCA, ASIC, SEC) |
| β₅ | Jurisdiction activity | UNEP report per-jurisdiction filings; enforcement indices |
| μ_c, σ_c | Severity by claim type | Settlement/fine history (securities class-action databases, ASA/BaFin/SEC actions) |
| RecoveryRate | D&O/E&O insurance recovery | Lloyd's casualty market studies; assume 50–70% with policy sub-limits |

**8.4 Data requirements.** Case corpus with defendant identifiers (Sabin — free; LSE-Grantham —
free); entity emissions and disclosure quality (CDP/vendor; platform already holds SBTi and OWID
reference tables); enforcement registers (free, scraped); insurance programme terms (client input).
The dashboard's existing entity schema (six dimensions, coverage, pending amounts) maps directly to
the covariate vector and severity inputs.

**8.5 Validation & benchmarking.** Out-of-time backtest: fit on 2015–2021 filings, score 2022–2024
defendants — target AUC ≥ 0.70 for the naming model; severity QQ-plots vs held-out settlements;
benchmark expected-loss ranks against Praedicat industry liability scores where licensable; Brier
score tracking per annual UNEP cohort; sensitivity of VaR₉₉ to ±50% on λ₀ documented per sector.

**8.6 Limitations & model risk.** Filing data are left-truncated and outcome data heavily censored
(most cases pending) — use Kaplan–Meier adjustments and flag severity as scenario-based; strategic
litigation waves are regime shifts a Poisson hazard misses (add a Litigation-Wave stress multiplier
≈ the dashboard's 18% CAGR scenario as the conservative overlay); precedent shocks (e.g. a
Milieudefensie-type ruling) should be handled as discrete scenario add-ons, not smooth covariates;
insurance recovery assumptions dominate net figures — floor reserves at gross expected loss × 30%.
