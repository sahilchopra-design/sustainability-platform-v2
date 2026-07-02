# A² Intelligence — Calculation-Engine Methodology Benchmark

_Blue-chip Model Risk Management–grade validation (SR 11-7 / ECB TRIM stance). ~32 flagship
quant engines benchmarked against their authoritative standards (Basel III, IFRS 9, Solvency II,
PCAF v2.0, GHG Protocol, EU CBAM, NREL/IEA LCOE, BSM, NGFS/CRREM/SBTi). Method: formula
re-derivation + line-level code review + numerical reference cases. 7/7 spot-checked criticals
verified in code._

## The headline pattern

> **Single-name regulatory formulas and reference data are often excellent; the portfolio-aggregation,
> simulation, tail-risk and stress layers — anything needing a real probability distribution — are
> frequently placeholder, synthetic, or methodologically inverted.**

Six recurring systemic defects, in priority order:

1. **Fabricated numbers via `random.uniform` / `random.Random(hash(entity_id))` presented as measured
   risk/regulatory facts.** Found in ≥8 engines: both Scope-3 engines (emissions = `activity × rng.uniform(0.9,1.1)` or pure `rng.uniform(500,50000)`), `physical_hazard_engine` (all financial-loss outputs), `climate_stress_test_engine` (CET1/loss + `rng.uniform`), `basel3_liquidity_engine` (random NSFR factors, survival days, compliance status), `eba_pillar3_engine` (GAR, financed emissions, PCAF DQS all hash-random; supplied `portfolio_data` ignored). Because the seed is `hash(entity_id)`, output is **stable-per-entity** — it *looks* reproducible while being entirely synthetic — and the salted `hash()` makes it **non-reproducible across process restarts**. This is the single most dangerous class: regulators treat these as measured facts.

2. **Statistical / formula errors in the aggregation layer.**
   - `var_calculator._normal_cdf` uses **tanh, not Φ** → MC credit loss understated **3–55×** (numerically proven below).
   - `monte_carlo_engine` ASRF conditional-PD **sign inverted** (`−√ρ·Φ⁻¹(0.999)`) → the "99.9% VaR" comes out **below expected loss**.
   - `eiopa_stress_engine` aggregates Solvency-II modules by **linear weighted sum**, not the mandated `√(Σ ρᵢⱼ·SCRᵢ·SCRⱼ)`.
   - `renewable_project_engine` LCOE **denominator energy is not discounted** (the classic error); its "IRR" is `MOIC^(1/n)` — ignores cash-flow timing.
   - `ead_calculator` multiplies **EAD by the RWA maturity adjustment** (EAD = drawn + CCF·undrawn only).
   - `physical_risk_pricing` "Climate VaR" expression **algebraically cancels** to a flat % of value.

3. **"Magic-multiplier" pseudo-metrics labeled as standards.** "Climate VaR" = AAL × 10 (`climate_insurance`), = total_loss × 1.15 + noise (`climate_stress_test`); ITR = a 12-anchor WACI→°C lookup mislabeled "MSCI Carbon Delta"; CBAM cost schedule applied in the wrong direction.

4. **Climate injected into Pillar-1 *regulatory* numbers with no basis.** `basel_capital_engine` multiplies regulatory RWA by climate factors and **misuses the SME green-supporting factor (0.7619)** as a climate discount; `ead_calculator`/`ecl_climate` apply climate EAD add-ons (double-count risk). No such Pillar-1 charge exists (EBA GL/2022/02 is Pillar-2 only).

5. **Code duplication / shadowing.** `CRREMStrandingEngine` is defined **4×** (lines 184/798/896/994) — the empty final stub shadows the real engine → `assess_stranding` raises `AttributeError`. **This is the root cause of the `re-clvar` failure found in the earlier lineage sweep.** `ecl_climate_engine.calculate_ecl_for_exposure` is defined twice.

6. **Heuristics mislabeled as models.** `pd_calculator`/`lgd_calculator` are additive scorecards with **fabricated "95% confidence intervals"**; `temperature_alignment` drops Scope 3 from WACI (80–90% of footprint for the targeted sectors).

## What is genuinely correct (balanced)

- **`basel_capital_engine` corporate/bank/sovereign IRB ASRF** — re-derived RW = **92.32%** at PD 1%/LGD 45%/M 2.5, matches the BCBS worked example **to the basis point**; true Φ/Φ⁻¹ (erf + Acklam), correct maturity adjustment.
- **`pcaf_waci_engine`** — numerically validated: financed S1 7,000 / S2 1,500, WACI 2,266.67, exposure-weighted DQS — all exact vs hand-calc. Attribution factors correct per asset class.
- **`climate_derivatives_engine` BSM core** — correct d1/d2/put/call, genuine **Abramowitz-Stegun Φ (no tanh hack)**, full input guards, put-call parity holds.
- **`real_estate_valuation_engine`** direct-cap + Newton-Raphson IRR; **`lgd_downturn_engine`** regulatory floors + monotonicity; **LCR/NSFR haircut constants** (0/15/50%, 75% inflow cap, ASF/RSF tables); **GHG Protocol 15-category taxonomy** and **IPCC fuel EFs**; `var_calculator` **parametric** path (matched hand-calc to the euro).

## Numerical proof — `var_calculator` (`benchmark/bench_quant.py`)

`_normal_cdf(x)=0.5·(1+tanh(x/√2))` vs true Φ: at z=−2.326 (99%) tanh gives 0.036 vs true 0.010 (**3.6×**); at z=−3.09 (99.9%) 0.0125 vs 0.001 (**12.5×**). Effective MC default probability vs input PD: **0.5%→55× / 1%→17× / 2%→6.8×** understated. Engine on a 100×€1M, PD 2%, LGD 50% book: **MC mean loss €149k vs true €1.0M (6.7×)**; MC VaR95 €1.0M vs correct parametric €2.15M.

## Verdicts

| Engine | Standard | Verdict | Worst finding |
|---|---|---|---|
| basel_capital_engine | Basel III IRB/SA | **FAIL** (portfolio) / PASS (corporate single-name) | retail correlation misrouted; climate RWA multipliers; 3bps vs 5bps PD floor; output floor unapplied |
| ead_calculator | Basel EAD/CCF | **FAIL** | EAD × RWA maturity adjustment (verified L593) |
| monte_carlo_engine | ASRF/MC VaR | **FAIL** | ASRF sign inverted → 99.9% VaR < EL (verified L319) |
| var_calculator (MC) | MC credit VaR | **FAIL** | tanh-CDF → loss understated 3–55× (proven) |
| climate_stress_test_engine | BCBS/ECB stress | **FAIL** | `rng.uniform` injected into CET1/loss (verified L264) |
| scope3_analytics_engine | GHG Protocol S3 | **FAIL** | emissions = `rng.uniform` (verified L428/432) |
| scope3_categories_engine | GHG/SBTi | **FAIL** | inventory RNG; 40%-trigger vs 67%-coverage conflated |
| cbam_calculator | EU CBAM | **FAIL** | free-allocation schedule inverted; invented markup |
| crrem_stranding_engine | CRREM v2.0 | **FAIL** (non-functional) | class shadowed ×4 → AttributeError (verified) |
| physical_hazard_engine | IPCC AR6 | **FAIL** | all financial outputs `random.uniform`, salted hash |
| renewable_project_engine | NREL/IEA LCOE | **FAIL** | undiscounted LCOE denominator; "IRR" = MOIC^(1/n) |
| eiopa_stress_engine | Solvency II | **FAIL** | linear-sum SCR, not √-correlation (verified L702) |
| climate_insurance_engine | actuarial/IAIS | **FAIL** | "Climate VaR" = AAL × 10 magic multiplier |
| basel3_liquidity_engine | LCR/NSFR/IRRBB | **FAIL** (stress/IRRBB) / PARTIAL (LCR) | random NSFR factors; L2 cap order bug; IRRBB outlier vs 20% assets not 15% Tier 1 |
| eba_pillar3_engine | CRR 449a | **FAIL** (data) / PASS (completeness) | GAR/financed-emissions hash-random; portfolio_data ignored |
| ecl_climate_engine | IFRS 9 ECL | PASS-WITH-CAVEATS | lifetime discounting heuristic; EAD double-count; dup function |
| pd_calculator / lgd_calculator | (heuristic) | PASS-WITH-CAVEATS | additive scorecards; fabricated "95% CI"; LGD sector double-count |
| lgd_downturn_engine | EBA GL/2019/03 | PASS-WITH-CAVEATS | add-on is proxy not reference-value method (floors correct) |
| portfolio_analytics_engine_v2 | parametric VaR | PASS (dashboard) / FAIL (VaR) | fabricated vol, no covariance/√t; "weighted" avgs unweighted |
| re_clvar_engine | RICS/CRREM CLVaR | PASS-WITH-CAVEATS | covariance heuristic; MC carbon ≠ deterministic NPV |
| facilitated_emissions_engine | PCAF Part B | PASS-WITH-CAVEATS | 33% correct for bond/equity; **missing on syndicated/securitisation (≤3× overstatement)**; insurance AF stores intensities |
| carbon_calculator_v2 | CDM/VCS | PASS-WITH-CAVEATS | combined-margin formula; REDD baseline sign inverted; landfill CH₄ density (~1.5×) |
| temperature_alignment_engine | SBTi/PACTA ITR | PASS-WITH-CAVEATS | ITR is WACI lookup mislabeled MSCI; Scope 3 dropped from WACI |
| green_hydrogen_calculator | IEA/IRENA LCOH | PASS-WITH-CAVEATS | no output degradation (optimistic); undiscounted stack replacement |
| real_estate_valuation_engine | Appraisal Institute | PASS (direct-cap) / caveats (DCF) | DCF fabricates revenue/expense from NOI via hardcoded 33% margin |
| climate_derivatives_engine | BSM | **PASS** (core) | weather pricing ignores its own seasonal multipliers; theta case bug |
| pcaf_waci_engine | PCAF v2.0 | **PASS** | minor: unlisted equity → EVIC not book value; sovereign nominal GDP |

## Prioritized remediation (regulatory-grade first)

1. **Purge `random.*` from every regulatory/risk output path** (scope3×2, physical_hazard, climate_stress_test, basel3_liquidity, eba_pillar3). Compute from real inputs (`portfolio_data` is already accepted but ignored) or return "insufficient data" — never invented figures.
2. **`var_calculator._normal_cdf`** → `scipy.stats.norm.cdf` / `math.erf`. **`monte_carlo_engine`** → flip the ASRF sign (`+√ρ·Φ⁻¹(q)`), derive VaR & ES from the same loss distribution.
3. **`eiopa_stress_engine`** → aggregate SCR with the Annex IV √-correlation matrix; recompute SCR from the stressed balance sheet (stop double-counting losses).
4. **`crrem_stranding_engine`** → delete the 3 duplicate class definitions (L742–1034); add carbon-intensity stranding.
5. **`ead_calculator`** → remove the maturity adjustment from EAD. **`basel_capital_engine`** → fix retail correlations (mortgage 0.15, QRRE 0.04), quarantine climate multipliers to Pillar 2, apply the 72.5% output floor, PD floor 5bps.
6. **`cbam_calculator`** free-allocation direction; **`carbon_calculator_v2`** REDD sign + landfill CH₄ density; **`renewable_project_engine`** real IRR + discounted LCOE denominator; **`real_estate_valuation_engine`** grow NOI directly.
7. **`facilitated_emissions`** apply 33% to syndicated/securitisation; **`temperature_alignment`** add Scope 3 to WACI and relabel the ITR.

## Measured systemic surface (repo-wide scan of `backend/services/`, 293 engines)

The "random-as-data" pattern is **not confined to the 32 audited engines — it is platform-wide**:

| Metric | Count |
|---|---|
| Engines using `random.uniform` / `random.Random` as data | **65 of 293 (22%)** |
| Total `rng/random.uniform(...)` calls | **884** |
| `random.Random(...)` seeds | **227** |
| `hash(entity/id)`-style seeds (non-reproducible across restarts) | **218** |

Top offenders (uniform-call count): `blended_finance_engine` 37 · `esg_ma_engine` 33 · `carbon_price_ets_engine` 32 · `sfdr_art9_engine` 29 · `food_system_engine` 27 · `blue_economy_engine` 26 · `loss_damage_engine` 24 · `climate_mrv_engine` 24 · `climate_finance_engine` 22 · `csrd_dma_engine` 22 · `water_risk_engine` 22 · `prudential_climate_risk_engine` 21 · `issb_s2_engine` 21 · `sovereign_debt_climate_engine` 20 · `biodiversity_finance_v2_engine` 20. Several are regulatory-output engines (SFDR Art 9, ISSB S2, prudential climate risk, EBA Pillar 3), where fabricated figures are the highest-severity class.

## Tier 2 — the 56-engine random-as-data triage (extends the flagship audit)

Every remaining random-using engine (56, excluding the 2 legit-sim already audited) was triaged by 6 parallel
auditors. Result — **the fabrication is near-universal**:

| Severity | Count | Meaning |
|---|---|---|
| **CRITICAL** | **34** | Fabricates *binding regulatory/disclosure* figures via `rng` |
| **HIGH** | **11** | Fabricates financial/risk metrics or the market price that drives €/$ outputs |
| **MEDIUM** | 4 | Jitter that can flip a score/grade/pass-fail boundary |
| **LOW** | 7 | 3 legitimate (`sub_parameter`, `builder` = real seeded MC; `demo_portfolio_seeder` = labeled demo) + 4 minor jitter |

**CRITICAL (34) — fabricate regulatory disclosures, grouped by framework claimed:**
- **SFDR / EU Taxonomy:** `sfdr_art9` (PAI 5-11 = `rng.uniform`, verified L717-723), `sfdr_product_reporting` (all 14 PAI random)
- **ISSB S2 / IFRS S2:** `issb_s2`, `climate_financial_statements` (impairment via `rng.random()<prob`)
- **CSRD / ESRS:** `csrd_dma` (materiality scores), `esrs_e2_e5`, `circular_economy` (ESRS E5)
- **TNFD / nature / biodiversity:** `tnfd_leap`, `biodiversity_finance`, `biodiversity_finance_v2`, `biodiversity_credits`, `nature_capital`, `nature_capital_accounting`, `water_risk`, `food_system`
- **Prudential (Basel/ECB/BoE):** `prudential_climate_risk` (CET1 depletion), `esg_data_quality` (BCBS 239)
- **Transition/net-zero:** `tpt_transition_plan` (+magic ×0.9/0.85/0.88 alignment), `net_zero_targets` (SBTi validation via `rng.choice`)
- **Human rights / social:** `esg_ma` (UNGP/CSDDD), `forced_labour` (ILO indicators via `rng.uniform(0,8)`, verified L292), `trade_finance` + `sustainable_trade_finance` (Equator Principles IV)
- **Carbon / MRV / methane:** `climate_mrv` (ISO 14064 assurance scores), `mrv`, `methane_fugitive` (EU Methane Reg penalties)
- **Sovereign / blended / EM / AI:** `pcaf_sovereign` (NDC alignment + DQS; attribution core is correct), `sovereign_debt_climate`, `blended_finance`, `climate_finance`, `em_climate_risk`, `regulatory_penalties`, `ai_risk` (EU AI Act — also **`"high_right"` typo L204 disables the GDPR Art 22 gate**), `infrastructure_finance`

**HIGH (11):** `carbon_price_ets`, `blue_economy`, `loss_damage`, `real_asset_decarb`, `nbs_finance`, `gri_standards`, `avoided_emissions` (own-emissions `rng` 0.5-2.5× → fabricated net-benefit), `carbon_markets_intel`, `maritime`, `aviation_climate`, `shipping_maritime` (last three: real CII/EEXI/CORSIA/ETS math but fabricated **EUA price** drives the €/$ cost).

**The redeeming nuance:** most CRITICAL/HIGH engines have a **genuinely-computed core worth keeping** — Rio-marker counting, MCI circularity, BNG, DSCR stress, PCAF-sovereign attribution (`outstanding/GDP × emissions`), AI-Act classification, IPCC sequestration, CII/EEXI/CORSIA obligation math — with **fabricated scores/compliance/prices bolted on top**. Remediation is "keep the core, replace the `rng` with real inputs or explicit nulls," not a rewrite.

**Secondary bugs surfaced during triage:** `ai_risk:204` `"high_right"` typo (GDPR gate dead); `climate_mrv:460` walrus `GHGSat_res` NameError; `sfdr_product_reporting` still missing PAI 15-18 (matches the known SFDR gap); `trade_finance` PCAF Scope-3 uses a spend-proxy that cancels to a spend-driven figure; `hydrogen_economy:323` `rng` noise on `ghg_intensity` can flip the RFNBO pass/fail gate.

## Reference remediation (worked example — `pcaf_sovereign_engine`)

First engine remediated end-to-end as the **template for the other ~44**. It had the canonical shape:
a correct computed core + two fabricated fields. The fix demonstrates the two moves that generalise:

1. **Keep the verified core untouched.** Attribution `outstanding_bn/govt_debt_bn × inventory` was already
   correct — left as-is (regression test confirms 28,155.8 tCO2e = hand-calc for the DE reference case).
2. **Deterministic derivation** where the answer *is* computable from data: `_determine_dqs` now maps
   UNFCCC reporting obligation → PCAF DQS (Annex I → 1, non-Annex I → 2) instead of `rng.choice`. Same
   country → same DQS, always.
3. **Explicit `insufficient_data` instead of a random number** where the answer needs an input the engine
   doesn't have: `_assess_ndc_alignment` no longer invents a trajectory gap (`rng.uniform(-15,30)`). It
   accepts a caller-supplied `current_trajectory_gap_pct` (from a real trajectory source) and classifies
   deterministically; absent that, it returns `("insufficient_data", None)` — never a fabricated gap.
4. **Thread real inputs through** the public API + portfolio path (`current_trajectory_gap_pct`,
   `dqs_override` per holding) so callers can supply truth.
5. **Regression-gate the fix**: `benchmark/bench_quant.py::bench_pcaf_sovereign` asserts attribution
   correctness, determinism, DQS mapping, and the honest-null behaviour → **PASS**.

The same recipe applies to the ~44 remaining: identify the genuine core (keep), replace each `rng` either
with the real formula (if inputs exist) or an explicit null/"insufficient data" sentinel (if they don't),
thread inputs through, add a bench case. Net LOC change here was small and surgical — no rewrite.

## Scope & next
Audited the ~32 highest-value quant engines (of ~200). Findings are systemic (the scan above proves the
fabricated-number class alone spans 65 engines). Recommend: (a) treat the 65-engine `random.*`-as-data
list as a remediation backlog — replace with real inputs or explicit nulls; (b) extend
`benchmark/bench_quant.py` with a reference case per remediated engine so fixes are regression-gated;
(c) add a CI guard failing the build on `random.`/`hash(` in any `services/*_engine.py` computation path.
