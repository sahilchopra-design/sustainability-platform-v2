# Api::Iorp_Pension
**Module ID:** `api::iorp_pension` · **Route:** `/api/v1/iorp-pension` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/iorp-pension/assess/scenario` | `assess_scenario` | api/v1/routes/iorp_pension.py |
| POST | `/api/v1/iorp-pension/assess/batch` | `assess_batch` | api/v1/routes/iorp_pension.py |
| GET | `/api/v1/iorp-pension/ref/scenarios` | `ref_scenarios` | api/v1/routes/iorp_pension.py |
| GET | `/api/v1/iorp-pension/ref/sfdr-classes` | `ref_sfdr_classes` | api/v1/routes/iorp_pension.py |
| GET | `/api/v1/iorp-pension/ref/frameworks` | `ref_frameworks` | api/v1/routes/iorp_pension.py |
| GET | `/api/v1/iorp-pension/history` | `run_history` | api/v1/routes/iorp_pension.py |

### 2.3 Engine `iorp_pension_engine` (services/iorp_pension_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `IORPPensionEngine.assess` | fund, assessment_date | Run IORP II climate stress test for a pension fund. Args: fund: PensionFundInput describing the fund. assessment_date: ISO date string (YYYY-MM-DD). Defaults to today. Returns: IORPStressResult with per-scenario funding ratio stress. |
| `IORPPensionEngine._stress_scenario` | fund, sc_id, sc, pre_stress_fr, profile |  |
| `IORPPensionEngine._evaluate_ora` | fund |  |
| `IORPPensionEngine._build_recommendations` | fund, ora_status, blocking_gaps, worst_drop, worst_id |  |

**Engine `iorp_pension_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `_SOVEREIGN_DURATION` | `12.0` |
| `_CORP_IG_DURATION` | `7.0` |
| `_CORP_HY_DURATION` | `4.5` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`

**Database tables:** `DB` *(shared)*, `__future__` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `iorp_ora_results`, `iorp_scenario_results`, `iorp_stress_runs`, `pydantic` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/iorp-pension/history** — status `passed`, provenance ['db-empty'], source tables: `iorp_stress_runs`
Output: `{'type': 'object', 'keys': ['count', 'runs'], 'n_keys': 2}`

**GET /api/v1/iorp-pension/ref/frameworks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['primary_directive', 'stress_test', 'related_frameworks'], 'n_keys': 3}`

**GET /api/v1/iorp-pension/ref/fund-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['count', 'fund_types'], 'n_keys': 2}`

**GET /api/v1/iorp-pension/ref/ora-checklist** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['total_items', 'blocking_items', 'items', 'reference'], 'n_keys': 4}`

**GET /api/v1/iorp-pension/ref/scenarios** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['count', 'framework', 'scenarios'], 'n_keys': 3}`

**GET /api/v1/iorp-pension/ref/sfdr-classes** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['regulation', 'applicable_to', 'pai_reporting_threshold', 'classifications', 'reference'], 'n_keys': 5}`

**POST /api/v1/iorp-pension/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/iorp-pension/assess/batch** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `iorp_pension_engine` — extracted transformation lines:**
```python
pre_stress_fr = fund.total_assets_eur / max(fund.liabilities_eur, 1.0)
pre_stress_funding_ratio=round(pre_stress_fr * 100, 2),
eq_invested = ta * fund.equity_pct / 100
sov_invested = ta * fund.sovereign_bonds_pct / 100
corp_ig_invested = ta * fund.corp_bonds_ig_pct / 100
corp_hy_invested = ta * fund.corp_bonds_hy_pct / 100
re_invested = ta * fund.real_estate_pct / 100
infra_invested = ta * fund.infrastructure_pct / 100
total_asset_loss = eq_loss + sov_loss + corp_ig_loss + corp_hy_loss + re_loss + infra_loss
stressed_assets = ta - total_asset_loss
duration_impact = -lib * (lib_duration * discount_shift_bps / 10_000)  # + = liability rise
total_liability_change = duration_impact + longevity_shock + inflation_uplift
stressed_liabilities = lib + total_liability_change
post_stress_fr = stressed_assets / max(stressed_liabilities, 1.0)
fr_change = (post_stress_fr - pre_stress_fr) / pre_stress_fr * 100
pre_stress_ratio=round(pre_stress_fr * 100, 2),
post_stress_ratio=round(post_stress_fr * 100, 2),
net_impact = total_asset_loss + total_liability_change
benefit_erosion = total_asset_loss / max(ta, 1.0) * 100
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain — the engine docstring ("IORP II Pension Fund Climate Risk Engine (E8)") is the methodology narrative; nothing to reconcile.)*

### 7.1 What the module computes

`backend/services/iorp_pension_engine.py` (class `IORPPensionEngine`, registry slot **E8**) runs an **EIOPA-2022-style IORP II climate stress test** for a pension fund described by a `PensionFundInput`. Per NGFS-flavoured scenario it computes:

```
stressed_assets      = total_assets − Σ asset-class losses
stressed_liabilities = liabilities + duration_impact + longevity_shock + inflation_uplift
funding_ratio_post   = stressed_assets / max(stressed_liabilities, 1)
```

plus recovery-plan triggers (< 100%), supervisory-review triggers (< 90%), a 12-item IORP II Art 28 Own Risk Assessment (ORA) checklist, an SFDR Art 6/8/9 FMP summary, and rule-based recommendations. Exposed via `api/v1/routes/iorp_pension.py`: `POST /assess`, `POST /assess/batch`, `GET /history`, and `GET /ref/{frameworks, fund-types, ora-checklist, scenarios, sfdr-classes}`.

### 7.2 Scenario parameterisation (`IORP_SCENARIOS` — 4 scenarios, labelled NGFS phase 5)

| Parameter | Net Zero 2050 (Orderly) | Below 2°C (Disorderly) | Hot House World | Current Policies |
|---|---|---|---|---|
| Equity shock % | −12 | −18 | −25 | −5 |
| Corp bond spread (bps) | 45 | 80 | 120 | 15 |
| Sovereign spread (bps) | 20 | 35 | 60 | 8 |
| Real-estate shock % | −8 | −12 | −22 | −3 |
| Infrastructure shock % | −5 | −8 | −15 | −2 |
| Inflation uplift % | 0.3 | 0.6 | 1.2 | 0.1 |
| Liability discount shift (bps) | +30 | +50 | **−20** | +5 |
| Longevity shock (years) | 0.5 | 0.8 | 1.5 | 0.2 |

Hot House World's negative discount shift is explicitly commented "flight-to-safety → lower yields" — the only scenario where liabilities rise via the duration channel. Shock magnitudes are engine calibrations "in the spirit of" the EIOPA 2022 IORP stress test, not the published EIOPA figures.

**Fund-type profiles** (`IORP_TYPE_PROFILES`): DB (covenant factor 1.0, liability duration 20y), DC (0.0 / 0y — no pooled liability), Hybrid (0.5 / 10y), Collective DC (0.3 / 8y). **Fixed durations** (comment: "consistent with E7 EIOPA engine"): sovereign 12.0y, corp IG 7.0y, corp HY 4.5y. Other constants: HY spread multiplier ×2, longevity uplift 1.5% of liabilities per extra year, 40% of DB liabilities inflation-indexed, sponsor covenant buffer = 5% of liabilities × covenant factor.

### 7.3 Calculation walkthrough

**Asset losses** (allocation percentages of total assets `ta`):

```
eq_loss      = ta·eq% × |equity_shock|/100
sov_loss     = ta·sov% × 12.0 × sov_spread_bps/10⁴
corp_ig_loss = ta·ig%  × 7.0  × corp_spread_bps/10⁴
corp_hy_loss = ta·hy%  × 4.5  × corp_spread_bps × 2/10⁴
re_loss      = ta·re% × |re_shock|/100 ;  infra_loss analogous
```

**Liability stress:** `duration_impact = −L × D_L × Δbps/10⁴` (so a *positive* discount shift **reduces** liabilities), `longevity = L × extra_years × 0.015`, `inflation = L × 0.40 × uplift%/100` (DB only). **Funding ratio** change, recovery triggers, and `net_stress_impact = asset_loss + liability_change` for DB/hybrid (DC: asset loss only, members bear it). `member_benefit_erosion = asset_loss/ta × 100`.

**ORA checklist:** 12 boolean flags on the input map 1:1 to items ORA-01…ORA-12, 8 of them `blocking` (governance, risk integration, physical+transition, ESG investment policy, ≥2-scenario analysis, funding-ratio stress, recovery plan — cited to IORP II Arts 28/19/39 and the EIOPA 2022 test). Status: `compliant` if 12/12 met, `partial` if ≤ 3 gaps, else `non_compliant`.

**Recommendations** fire on: non-compliant ORA, blocking gaps, worst-case funding-ratio drop > 15%, no transition plan (GFANZ/IIGCC NZIF), Art 6 fund with > 500 members, no PAI reporting, real assets > 15% (→ CRREM/GRESB), no nature disclosure (→ TNFD LEAP).

### 7.4 Worked example — default fund, Hot House World

Default `PensionFundInput`: assets €1,000M, liabilities €900M (pre-stress FR = 111.1%), DB, liability duration 18y, allocation 40/25/20/5/7/3 (eq/sov/IG/HY/RE/infra).

| Step | Computation | Result (€M) |
|---|---|---|
| Equity loss | 400 × 0.25 | 100.0 |
| Sovereign loss | 250 × 12 × 60/10⁴ | 18.0 |
| Corp IG loss | 200 × 7 × 120/10⁴ | 16.8 |
| Corp HY loss | 50 × 4.5 × 240/10⁴ | 5.4 |
| RE loss | 70 × 0.22 | 15.4 |
| Infra loss | 30 × 0.15 | 4.5 |
| **Total asset loss** | | **160.1** → assets 839.9 |
| Duration impact | −900 × 18 × (−20)/10⁴ | +32.4 |
| Longevity | 900 × 1.5 × 0.015 | +20.25 |
| Inflation | 900 × 0.40 × 1.2/100 | +4.32 |
| **Liability change** | | **+56.97** → liabilities 956.97 |
| Post-stress FR | 839.9 / 956.97 | **87.77%** |

FR falls from 111.1% to 87.8% (−21.0% relative) → `triggers_recovery_plan` **and** `triggers_supervisory_review` both true; worst-case drop 21.0% > 15% fires the recovery-plan recommendation. Sponsor covenant buffer = 900 × 1.0 × 0.05 = €45M.

### 7.5 Data provenance & limitations

- **No PRNG / no synthetic entities** — fully deterministic given the input; but every input field has a demo default (€1bn fund, NLD, art_8), so unparameterised calls produce an illustrative fund, not data.
- Scenario shocks are plausible but **unattributed magnitudes**; the real EIOPA 2022 IORP climate stress applied a single adverse "disorderly transition" market scenario derived with the ECB, with asset-class-specific shocks — the 4-scenario NGFS framing here is broader than the actual exercise.
- Liability model is single-factor duration approximation (no convexity, no cash-flow projection); the 1.5%/year longevity sensitivity and the 40% indexation share are stylised assumptions.
- HY bonds stress uses the IG spread ×2 rather than a separate HY spread path; equity/RE/infra shocks are terminal point shocks with no time dimension.
- Route persists results to a history table (`GET /history`), giving run-level auditability.

### 7.6 Framework alignment

- **IORP II Directive 2016/2341:** Art 28 ORA is implemented as the 12-item checklist with article citations; Art 19(1)(b) ESG-in-investment and Art 39/41 (recovery plan, member information) appear as checklist flags; funding-ratio triggers mirror the national supervisory practice of recovery plans below 100% cover.
- **EIOPA IORP II Climate Stress Test 2022:** methodological template (asset shock + liability revaluation → funding ratio) is followed; scenario set is generalised to four NGFS-style pathways.
- **NGFS scenarios (Phase 5 labels):** ordering logic (orderly < disorderly < hot-house severity; hot-house dominated by physical risk and falling yields) matches NGFS narratives.
- **SFDR (Arts 3/4/6/8/9):** pension funds treated as Financial Market Participants; Art 8/9 classification drives PAI-statement, periodic-report and pre-contractual-disclosure flags — in real SFDR, PAI reporting is comply-or-explain except for FMPs with > 500 employees (the engine's recommendation cites exactly this threshold).
- **GFANZ / IIGCC Net Zero Investment Framework, CRREM/GRESB, TNFD LEAP:** referenced in the recommendation rules as the named remediation frameworks (transition planning, real-asset physical risk, nature risk).

## 9 · Future Evolution

### 9.1 Evolution A — Stochastic funding-ratio projection and calibrated shocks (analytics ladder: rung 2 → 4)

**What.** The E8 `IORPPensionEngine` runs an EIOPA-2022-style IORP II climate stress
test: per NGFS-flavoured scenario it applies asset-class losses and a
duration/longevity/inflation liability shock, yielding
`funding_ratio_post = stressed_assets / stressed_liabilities`, plus recovery-plan (<100%)
and supervisory (<90%) triggers, the 12-item Art 28 ORA checklist, and an SFDR summary.
It is solid scenario work (4 NGFS scenarios), but single-path and single-horizon — one
funding ratio per scenario, no distribution and no glidepath over time. Evolution A adds
stochastic and multi-period projection.

**How.** (1) Project the funding ratio across the recovery-plan horizon (typically
multi-year) rather than a single post-stress snapshot, so the recovery/supervisory
triggers apply to a trajectory. (2) Monte Carlo the asset-class shocks and discount-rate
shift (the engine already parameterises `discount_shift_bps`, `longevity_shock`,
`inflation_uplift`) to return a funding-ratio distribution and probability of breaching
100%/90% — the rung-4 predictive move. (3) Calibrate the per-asset-class stress
magnitudes against NGFS market-risk factors rather than fixed scenario constants. (4)
Persist runs to `iorp_stress_runs` (currently db-empty in the `/history` trace) so
history works, and bench-pin the funding-ratio math.

**Prerequisites.** `iorp_stress_runs`/`iorp_scenario_results` write path activated (the
tables exist but `/history` traces db-empty); NGFS market-risk factor linkage.
**Acceptance:** `/assess/scenario` returns a funding-ratio distribution with breach
probabilities; `/history` returns real persisted runs; bench pin reproduces
pre/post funding ratios.

### 9.2 Evolution B — Trustee-facing pension stress copilot (LLM tier 2)

**What.** A copilot that runs `/assess/scenario` for a fund and explains the result to a
trustee — "under disorderly transition your funding ratio falls from 108% to 94%,
triggering supervisory review; the biggest driver is your 30% equity sleeve; here are
the ORA items still open" — every number from a tool call, with what-ifs on asset
allocation.

**How.** Two POST endpoints (`/assess/scenario`, `/assess/batch`) plus reference GETs
(scenarios, sfdr-classes, frameworks, fund-types, ora-checklist) that ground the IORP II
regime. The ORA checklist endpoint drives a compliance-gap narrative; batch supports
multi-scheme sponsors. What-ifs ("what if we cut equity to 20%?") re-run the engine
statelessly. Guardrail: present funding-ratio outputs as regulatory-stress indicative,
not actuarial valuation.

**Prerequisites.** None hard for tier-1 narration; for the "show my run history" feature,
Evolution A's persistence fix. **Acceptance:** every funding ratio, trigger, and ORA
item cited traces to a tool response; asset-allocation what-ifs reflect fresh engine
calls; the copilot refuses to state a scheme's statutory funding position (which this
stress test does not compute) and says so.