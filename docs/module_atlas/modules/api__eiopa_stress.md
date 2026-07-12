# Api::Eiopa_Stress
**Module ID:** `api::eiopa_stress` · **Route:** `/api/v1/eiopa-stress` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/eiopa-stress/assess/scenario` | `assess_single_scenario` | api/v1/routes/eiopa_stress.py |
| GET | `/api/v1/eiopa-stress/ref/scenarios` | `ref_scenarios` | api/v1/routes/eiopa_stress.py |
| GET | `/api/v1/eiopa-stress/ref/frameworks` | `ref_frameworks` | api/v1/routes/eiopa_stress.py |

### 2.3 Engine `eiopa_stress_engine` (services/eiopa_stress_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_scr_corr` | a, b | Symmetric lookup into the Solvency II SCR correlation matrix. |
| `_aggregate_bscr` | module_scr | Basic SCR via the Solvency II correlation-matrix square-root formula: BSCR = sqrt( Σ_i Σ_j Corr_ij · SCR_i · SCR_j ) This captures diversification between risk modules; a naive linear sum does not. |
| `EiopaStressEngine.assess` | insurer, scenarios, assessment_date | Run full EIOPA climate stress test for one insurer. Args: insurer: Balance sheet + portfolio + ORSA flag data. scenarios: List of scenario IDs to run. Default = all four. assessment_date: ISO date YYYY-MM-DD. Returns: EiopaStressResult with per-scenario results, ORSA checklist, and capital impacts. |
| `EiopaStressEngine._run_scenario` | ins, sc_id, sc, invested_assets |  |
| `EiopaStressEngine._calc_asset_shock` | ins, sc, invested | Compute EUR loss for each asset class under the scenario shocks. |
| `EiopaStressEngine._calc_underwriting_shock` | ins, sc | Compute liability-side shocks for underwriting and life modules. |
| `EiopaStressEngine._calc_capital_impact` | ins, asset_shock, uw_shock, sc_id | Recalculate SCR/MCR and solvency ratio post-stress. |
| `EiopaStressEngine._assess_orsa_checklist` | ins |  |
| `EiopaStressEngine._severity_label` | loss_pct_of_of, scr_breach, mcr_breach |  |
| `EiopaStressEngine._key_drivers` | ins, asset, uw |  |
| `EiopaStressEngine._build_narrative` | ins, sc, asset, uw, cap, severity |  |
| `EiopaStressEngine._derive_gaps` | ins, results, orsa, any_scr, any_mcr |  |
| `EiopaStressEngine._derive_resilience` | worst_ratio, any_scr, any_mcr, orsa_pct |  |

**Engine `eiopa_stress_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `_SCR_MODULE_WEIGHTS` | `{'market_risk': 0.45, 'underwriting_nonlife': 0.25, 'underwriting_life': 0.2, 'counterparty': 0.05, 'operational': 0.05}` |
| `_SCR_CORR_MODULES` | `('market_risk', 'counterparty', 'underwriting_life', 'underwriting_nonlife')` |
| `_SCR_CORR_MATRIX` | `{('market_risk', 'counterparty'): 0.25, ('market_risk', 'underwriting_life'): 0.25, ('market_risk', 'underwriting_nonlife'): 0.25, ('counterparty', 'underwriting_life'): 0.25, ('counterparty', 'underwriting_nonlife'): 0.5, ('underwriting_life', 'underwriting_nonlife'): 0.0}` |
| `_BOND_DURATION_SOVEREIGN` | `7.0` |
| `_BOND_DURATION_IG_CORP` | `5.0` |
| `_BOND_DURATION_HY_CORP` | `4.0` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/eiopa-stress/ref/frameworks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['frameworks', 'reference'], 'n_keys': 2}`

**GET /api/v1/eiopa-stress/ref/insurer-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['count', 'insurer_types'], 'n_keys': 2}`

**GET /api/v1/eiopa-stress/ref/orsa-checklist** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['count', 'checklist', 'reference'], 'n_keys': 3}`

**GET /api/v1/eiopa-stress/ref/scenarios** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['count', 'scenarios', 'reference'], 'n_keys': 3}`

**POST /api/v1/eiopa-stress/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/eiopa-stress/assess/batch** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/eiopa-stress/assess/scenario** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `eiopa_stress_engine` — extracted transformation lines:**
```python
invested_assets = insurer.total_assets_eur - insurer.total_tp_eur
invested_assets = insurer.total_assets_eur * 0.85  # fallback heuristic
default=insurer.eligible_own_funds_eur / max(insurer.scr_eur, 1) * 100,
total_loss = asset_shock.total_asset_loss_eur + uw_shock.total_uw_shock_eur
mgmt_capacity_eur = total_loss * mgmt_capacity_rate
equity_base_pct = ins.equity_listed_pct / 100
fossil_subset_pct = min(ins.equity_fossil_fuel_pct, ins.equity_listed_pct) / 100
non_fossil_equity_pct = equity_base_pct - fossil_subset_pct
equity_loss = invested * (
re_loss = re_c_loss + re_r_loss
sov_loss = invested * ins.sovereign_bonds_pct / 100 * (
ig_loss = invested * ins.ig_corp_bonds_pct / 100 * (
hy_loss = invested * ins.hy_corp_bonds_pct / 100 * (
total = equity_loss + re_loss + sov_loss + ig_loss + hy_loss + infra_loss + alt_loss
total_pct = total / max(invested, 1) * 100
lapse_sensitive_eur = ins.total_tp_eur * ins.lapse_sensitive_reserves_pct / 100
total = natcat_add + reserve_det + lapse_loss + mortality_loss + morbidity_loss
total_loss = asset_shock.total_asset_loss_eur + uw_shock.total_uw_shock_eur
after_tax_loss = total_loss * 0.80
post_of = ins.eligible_own_funds_eur - after_tax_loss
market_shock_intensity = asset_shock.total_asset_loss_pct / 100
market_mult = 1.0 + max(0.0, market_shock_intensity)          # market SCR grows with realised market loss
mod_pre = {m: ins.scr_eur * _SCR_MODULE_WEIGHTS[m] for m in _SCR_CORR_MODULES}
scr_pre_recon = _aggregate_bscr(mod_pre) + op_charge          # operational added outside the root
scr_post_recon = _aggregate_bscr(mod_post) + op_charge
post_ratio = post_of / max(post_scr, 1) * 100
shortfall = max(post_scr - post_of, 0.0) if scr_breach else 0.0
scr_coverage_change_pp=round(post_ratio - pre_ratio, 1),
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`/api/v1/eiopa-stress` wraps the **EIOPA ORSA Climate Stress Test Engine** ("E7",
`backend/services/eiopa_stress_engine.py`), a Solvency II Art. 45a climate stress tester for
(re)insurers. For each of four canonical scenarios it computes asset-side losses, liability-side
underwriting shocks, a post-stress SCR/MCR solvency position, a 12-point ORSA Art. 45a checklist,
and a resilience verdict. Core mechanics quoted from code:

```
Asset loss:   Σ_class  invested × class_pct × |shock_pct|          (equity/RE/infra/alternatives)
Bond loss:    invested × class_pct × Duration × Δspread            (ΔP ≈ −D·Δs; D = 7/5/4 yrs sov/IG/HY)
UW shock:     NatCat_EL × (amplifier − 1) + TP × reserve_shock%
            + TP × lapse_sensitive% × lapse_shock%
            + SumAssured × mortality_bps/10⁴ + Premium × morbidity_bps/10⁴
Own funds:    OF_post = OF − 0.80 × total_loss                     (20% tax offset)
SCR_post:     re-aggregated via BSCR = √(ΣΣ Corr_ij·SCR_i·SCR_j) + Op   (see §7.3)
Solvency:     ratio = OF_post / SCR_post × 100;  SCR breach if OF_post < SCR_post
```

### 7.2 Scenario parameterisation

`EIOPA_SCENARIOS` (in-code source note: "EIOPA 2022 Stress Test, EIOPA 2023 Insurance ST, NGFS
Phase IV"; the specific numbers are platform calibrations in the spirit of those exercises):

| Parameter | sudden_transition | orderly_transition | hot_house_world | below_2c |
|---|---|---|---|---|
| NGFS equivalent | Divergent Net Zero | Net Zero 2050 | Current Policies | Below 2 °C |
| Horizon / temp | 3y / 1.8 °C | 10y / 1.5 °C | 30y / 3.0 °C | 10y / 1.9 °C |
| Listed equity | −35% | −15% | −20% | −25% |
| Fossil-fuel equity | −55% | −30% | −10% ("fossil benefits short-term") | −40% |
| Commercial / resid. RE | −30 / −20% | −12 / −8% | −45 / −35% | −22 / −15% |
| Sov / IG / HY spreads (bp) | 120 / 250 / 550 | 40 / 80 / 200 | 200 / 180 / 400 | 80 / 160 / 380 |
| NatCat amplifier | 1.25 | 1.10 | 2.00 | 1.50 |
| Reserve / lapse shock | 5% / 8% | 2% / 3% | 15% / 12% | 8% / 6% |
| Mortality / longevity / morbidity (bp) | 30 / −10 / 40 | 15 / 5 / 20 | 80 / −30 / 100 | 45 / −5 / 60 |

Other constants: SCR module weights (market 45%, non-life UW 25%, life UW 20%, counterparty 5%,
operational 5% — an approximate decomposition, not regulatory); the **Solvency II standard-formula
correlation matrix** for BSCR (code cites Delegated Regulation (EU) 2015/35 Annex IV: mkt–cpty
0.25, mkt–life 0.25, mkt–nonlife 0.25, cpty–life 0.25, cpty–nonlife 0.50, life–nonlife 0.00);
management-action capacity by insurer type (life 30%, composite 28%, non-life 25%, reinsurer 20%,
captive 15% of stressed loss); 20% tax offset on losses; invested assets = assets − TP (fallback
85% of assets).

### 7.3 Calculation walkthrough

`POST /assess` runs all four scenarios (or a subset; `POST /assess/scenario` runs one,
`POST /assess/batch` many insurers). Per scenario:

1. **Asset shock** — equity is split into fossil subset (harsher shock) and non-fossil remainder;
   bonds use duration × spread; everything sums to `total_asset_loss_eur`.
2. **Underwriting shock** — five components per the formula block above.
3. **Capital impact** — a documented remediation is embedded here: the code decomposes the reported
   SCR into module charges via the weights, multiplies the market module by
   `1 + asset_loss%` and the non-life module by the NatCat amplifier, re-aggregates pre- and
   post-stress vectors through the correlation square-root formula (operational added outside the
   root), then **rescales so the pre-stress aggregation reproduces the firm's reported SCR**. The
   long in-code comment explains this replaced a linear weighted sum that "ignored diversification
   AND malformed the NatCat term… so a stress scenario could actually LOWER the SCR".
4. **Verdicts** — severity: MCR breach → extreme; SCR breach or loss > 30% of own funds → severe;
   > 15% → moderate; else mild. Recovery feasible if `OF_post + mgmt_capacity ≥ SCR_post`. Key
   drivers = top-3 loss components ≥ 5% of total. Resilience: MCR breach → critical, SCR breach →
   at_risk, worst ratio < 130% → vulnerable, else resilient.
5. **ORSA checklist** — 12 Art. 45a items scored from boolean input flags (two auto-met: risk
   identification, and life adjustment for non-life insurers; two inferred from data presence:
   portfolio quantification if assets > 0, SCR quantification if SCR > 0). Completeness % feeds
   gap thresholds at < 50% ("regulatory non-compliance") and < 80%.

Reference endpoints: `GET /ref/scenarios`, `/ref/insurer-types` (5 archetype profiles),
`/ref/orsa-checklist`, `/ref/frameworks`.

### 7.4 Worked example (hot_house_world, composite insurer)

Assets €10bn, TP €7bn → invested €3bn. Portfolio at input defaults (equity 15% incl. 3% fossil,
RE 8+4%, sov 35%, IG 25%, HY 5%, infra 3%, alt 2%). OF €1.2bn, SCR €0.8bn, MCR €0.36bn,
NatCat EL €50M, lapse-sensitive 20% of TP, sum assured €2bn, premium €400M.

| Component | Computation | Loss |
|---|---|---|
| Equity | 3bn×(0.12×0.20 + 0.03×0.10) | €81M |
| Real estate | 3bn×(0.08×0.45 + 0.04×0.35) | €150M |
| Sov bonds | 3bn×0.35×7×0.0200 | €147M |
| IG bonds | 3bn×0.25×5×0.0180 | €67.5M |
| HY bonds | 3bn×0.05×4×0.0400 | €24M |
| Infra + alt | 3bn×(0.03×0.35 + 0.02×0.30) | €49.5M |
| **Asset total** | (17.3% of invested) | **€519M** |
| NatCat | 50M×(2.00−1) | €50M |
| Reserves | 7bn×0.15 | €1,050M |
| Lapse | 7bn×0.20×0.12 | €168M |
| Mortality + morbidity | 2bn×0.008 + 400M×0.010 | €20M |
| **UW total** | | **€1,288M** |

Total loss €1,807M (150.6% of OF → severity at least severe). OF_post = 1.2bn − 0.8×1.807bn =
**−€245.6M** → SCR and MCR both breached → severity **extreme**, resilience **critical**;
shortfall = SCR_post + 245.6M. (SCR_post rises via market ×1.173 and non-life ×2.0 through the
correlation aggregation.)

### 7.5 Data provenance & limitations

- **Pure calculator; no PRNG/seeded data** — balance-sheet inputs are caller-supplied. Scenario
  shock magnitudes are **synthetic calibrations** inspired by EIOPA 2022/2023 stress-test design;
  they are not the published EIOPA shock tables.
- The SCR decomposition weights (45/25/20/5/5) are an assumed module mix applied to every insurer
  regardless of type; a life insurer's true market share of SCR would differ. The correlation
  matrix itself is regulation-accurate.
- Reserve deterioration applies a flat % of total TP — a large lever (dominates the worked example)
  with no line-of-business granularity; lapse/mortality/morbidity shocks are single-factor.
- 20% tax offset and management-action capacity rates are heuristics; no tiering of own funds,
  no risk margin recalculation, no transitional measures.
- Two auto-met ORSA checklist items mean completeness never reads below ~17% even with all
  flags false.

### 7.6 Framework alignment

- **Solvency II Art. 45a (as amended):** requires climate scenario analysis in the ORSA with at
  least two long-term scenarios (≤ 2 °C and > 2 °C); implemented via the 12-item checklist and the
  four-scenario run (orderly + disorderly satisfy Art45a-3).
- **Solvency II SCR/MCR (Art. 101/129, DR 2015/35):** SCR = 99.5% 1-yr VaR aggregated via the
  Annex IV correlation matrix — the engine reuses that exact matrix for BSCR re-aggregation;
  MCR breach as the regulatory-intervention floor.
- **EIOPA 2022 Insurance Stress Test / 2023 exercise:** sudden-transition design ("Scenario A")
  and NatCat amplification modules are mirrored in scenario structure.
- **NGFS Phase IV:** each scenario carries an explicit NGFS mapping (Divergent Net Zero, Net Zero
  2050, Current Policies, Below 2 °C) with temperature outcomes.
- **EIOPA Opinion EIOPA-BoS-21/127:** cited per checklist row as the supervisory source for
  governance, risk identification, horizons and data-quality disclosure expectations.
- **TCFD for insurers / ISSB S2:** double-materiality checklist item (Art45a-12) cross-references
  ISSB S2 integration.

## 9 · Future Evolution

### 9.1 Evolution A — Published EIOPA shocks, insurer-specific SCR decomposition, LoB granularity (analytics ladder: rung 2 → 3)

**What.** The EIOPA ORSA Climate Stress Test Engine (E7) — a Solvency II Art. 45a tester computing
asset shocks, underwriting shocks, post-stress SCR/MCR via the **regulation-accurate BSCR correlation
square-root formula** (DR 2015/35 Annex IV), an ORSA checklist and resilience verdict. It embeds a
notable documented remediation (the SCR re-aggregation replaced a linear sum that could paradoxically
*lower* SCR under stress). Already rung 2 (four NGFS-mapped scenarios). §7.5 names the deepening
targets: the scenario shock magnitudes are **synthetic calibrations** inspired by but not the published
EIOPA 2022/2023 shock tables; the SCR module decomposition weights (45/25/20/5/5) are an **assumed mix
applied to every insurer** regardless of type (a life insurer's true market share differs); reserve
deterioration is a **flat % of total TP** (dominating the worked example) with no line-of-business
granularity; and two auto-met ORSA items floor completeness at ~17%. Evolution A wires the published
EIOPA shock tables, insurer-type-specific SCR decompositions, and LoB-granular underwriting shocks.

**How.** Scenario shocks are sourced from the published EIOPA stress-test parameter tables; the SCR
module split varies by insurer type (life vs non-life vs composite) rather than a fixed 45/25/20/5/5;
`_calc_underwriting_shock` applies reserve/lapse/mortality shocks per line of business. Rung 3:
validate post-stress solvency ratios against actual EIOPA exercise results; add own-funds tiering and
risk-margin recalculation (currently omitted).

**Prerequisites (hard).** Fix the harness failures — §4.2 shows `POST /assess`, `/assess/batch`,
`/assess/scenario` all **failed** (need input payloads to trace); preserve the regulation-accurate
correlation matrix and the documented SCR-remediation. **Acceptance:** the §7.4 worked example
(hot_house_world composite, €1,807M loss, OF_post −€245.6M, extreme/critical) reproduces at legacy
calibrations; a life insurer's SCR decomposition differs from a non-life's; reserve deterioration
responds to LoB mix; the failing POST endpoints pass the harness.

### 9.2 Evolution B — Insurance climate-stress copilot with tool-called ORSA (LLM tier 2)

**What.** A tool-calling analyst for insurance risk/ORSA teams: "run the EIOPA climate stress test on
our balance sheet" (`/assess/scenario` or the full four-scenario run → asset/underwriting losses,
post-stress solvency ratio, SCR/MCR breach, severity), and "what's our ORSA Art. 45a checklist
completeness?" — narrating the engine's real Solvency II outputs and the resilience verdict
(resilient/vulnerable/at_risk/critical).

**How.** Tool schemas over the assess endpoints + the reference endpoints (scenarios, insurer types,
ORSA checklist, frameworks); the latter are ideal RAG grounding for "what does Art. 45a require?"
questions. The no-fabrication validator checks every loss €, solvency ratio and breach flag against
tool output; the copilot explains *why* a scenario breached SCR (the §7.4 insight: reserve
deterioration as a flat % of TP dominates) and flags that shock magnitudes are synthetic until
Evolution A wires the published tables. Composable with `banking_risk`/`basel3_liquidity` in a
prudential-desk orchestrator.

**Prerequisites.** Evolution A's harness fixes (working assess endpoints for tool-calling); Atlas +
reference corpus embedded (roadmap D3). **Acceptance:** every figure cited traces to an engine tool
call; the post-stress solvency ratio and severity match `/assess/scenario`; the copilot names the
dominant loss driver and flags the shock calibrations as illustrative pending Evolution A; the ORSA
completeness matches the checklist.