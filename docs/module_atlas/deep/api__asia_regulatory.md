## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain — this deep dive is written directly from
`backend/services/asia_regulatory_engine.py` (729 lines), `cbi_data_client.py`, and
`api/v1/routes/asia_regulatory.py`. No guide↔code mismatch to report.)*

### 7.1 What the domain computes

A five-regime **Asian regulatory analytics engine** whose header states its design principle:
*"All computation is deterministic against real DB rows; falls back to curated reference data
when rows are absent."* The exposed routes cover three of the five sub-engines:

| Route family | Sub-engine | Data tables |
|---|---|---|
| `/brsr/top-1000`, `/brsr/{entity_id}` | `BRSRCoreEngine` (SEBI BRSR, India) | `brsr_disclosures` (migration 009; 1,323 Indian companies per the orchestration registry) |
| `/boj/{entity_id}/scenarios`, `/boj/sector-impact/{sector}` | `BOJScenarioEngine` | `boj_scenario_results` (migration 028) + reference table |
| `/asean/member-states`, `/asean/member-state/{cc}`, `/asean/{entity_id}/taxonomy`, `/asean/focus-areas` | `ASEANTaxonomyEngine` | `asean_entities`, `asean_taxonomy_activities` |
| (engine-internal) | `HKMAEngine` (GS-1) · PBoC Green Finance | `hkma_*`, `pboc_*` tables |

### 7.2 Parameterisation

**BRSR Core (SEBI LODR 2023).** Nine principles P1–P9 with weights
`P1 0.10 · P2 0.12 · P3 0.12 · P4 0.08 · P5 0.10 · P6 0.18 · P7 0.08 · P8 0.10 · P9 0.12`
(environment P6 heaviest — a platform weighting choice; SEBI itself does not publish principle
weights). DB scores are 0–10, normalised ×10 to 0–100. Readiness bands:
`≥ 85 Leader · ≥ 70 Advanced · ≥ 55 Developing · ≥ 35 Emerging · else Initial`.
Core KPIs extracted per the BRSR Core assurance set: Scope 1/2/3 tCO₂e, energy GJ, renewable %,
water intensity (m³/₹cr revenue), waste intensity, CSR spend, women in management %, attrition,
median wage ratio, training hours, independent directors %, board meetings, cyber incidents.

**HKMA GS-1.** A reference **sector × scenario credit-loss table** labelled "HKMA 2023 exercise":
e.g. Energy credit loss 3.5 % (< 2 °C) → 5.2 % (2–3 °C) → 8.1 % (> 3 °C); Real Estate 1.2/2.9/5.8 %.
Derived impacts: `NII impact = −assets × loss% × 0.15` and `CAR impact = −loss% × 8.5 bps`.
Maturity labels on the 4-pillar assessment (governance/strategy/risk-mgmt/metrics, 0–5):
`≥ 4.5 Leading · ≥ 3.5 Advanced · ≥ 2.5 Developing · ≥ 1.5 Initial`.

**BoJ scenarios.** A 4-scenario reference cube ("BoJ 2023 exercise"): Transition 1.5C/2C at
2030/2050, Physical 2C/4C at 2050/2100, × 5 sectors, each with `pd_bps`, `lgd_bps`,
`credit_loss_pct`, `roe_pp`. Ordering is internally coherent: transition stress is front-loaded
and worst under 1.5 °C (Energy 2050: 4.5 % loss at 1.5C vs 3.2 % at 2C), physical stress
back-loaded and worst under 4 °C (Agriculture 2100: 10.7 % loss, PD +380 bps).

**ASEAN Taxonomy v3 (March 2024).** Five focus areas (mitigation, adaptation,
ecosystems/biodiversity, circular economy, social inclusion), 10 member states, two tiers
(Foundation / Plus) and the traffic-light system (Green/Amber/Red) — matching the published
framework structure.

### 7.3 Calculation walkthrough

1. **BRSR scorecard** — lookup by UUID or fuzzy name; per-principle score ×10;
   `overall = Σ P_i × w_i`; band label; section A/C completeness from status ∈
   {published, submitted, approved}; assurance flag/provider/standard passed through. The
   top-1000 summary computes population stats (complete-reporting count, assured %, average P6,
   average readiness) over all rows with `reporting_year ≥ 2022` and returns the top 25 by
   readiness, with column aliases normalised for the frontend radar/grid.
2. **HKMA stress test** — prefers stored `hkma_stress_scenarios` rows; otherwise expands the
   reference table across requested scenarios, scaling NII/CAR impacts by the entity's real
   `total_assets_hkd`.
3. **BoJ entity scenarios** — DB rows if present (`source: "db"`), else the full 4×2×5 reference
   cube flattened to 30 rows (`source: "reference_table"`) — the source field makes the fallback
   explicit to callers.
4. **ASEAN coverage** — joins entities to activities per member state; computes Green/Amber
   percentages as simple activity-count shares; entity view returns activities with
   `eligible_pct` / `aligned_pct` and a tier/traffic-light summary.
5. **CBI client** (`cbi_data_client.py`) — fetches/caches Climate Bonds Initiative certified-bond
   data used by the ASEAN/green-finance views.

### 7.4 Worked example (BRSR overall score)

Entity with principle scores (0–10): P1 8.2, P2 7.5, P3 8.0, P4 6.5, P5 7.0, P6 8.8, P7 6.0,
P8 7.2, P9 7.8 → normalised ×10:

| Step | Computation | Result |
|---|---|---|
| Weighted sum | 82·0.10 + 75·0.12 + 80·0.12 + 65·0.08 + 70·0.10 + 88·0.18 + 60·0.08 + 72·0.10 + 78·0.12 | 8.2+9.0+9.6+5.2+7.0+15.84+4.8+7.2+9.36 |
| Overall score | Σ | **76.2** |
| Band | 70 ≤ 76.2 < 85 | **Advanced** |

The 0.18 weight makes P6 (environment) the swing factor: ±1 point (0–10 scale) moves the overall
score ±1.8.

### 7.5 Data provenance & limitations

- **Primary path is real DB data**: BRSR disclosures were seeded from the platform's Supabase
  BRSR database (1,323 companies, migration 009); HKMA/BoJ/ASEAN/PBoC tables come from migration
  028 seeds. The engine never fabricates per-entity values — absent rows return errors or
  clearly-labelled reference output.
- The HKMA and BoJ **reference tables are hand-encoded approximations** of the published 2023
  supervisory exercises. Their orderings and magnitudes are consistent with the published
  aggregate findings, but individual cell values should be treated as curated calibrations, not
  verbatim regulator numbers.
- The BRSR principle weights and readiness bands are platform conventions; SEBI mandates
  disclosure (and BRSR Core reasonable assurance for the top-150 glide path) but no composite
  score.
- HKMA derived impacts use flat scalars (NII = 15 % of credit loss; CAR = 8.5 bps per loss-%),
  which compress balance-sheet structure into two constants.
- `_normalise_reporter_row` maps some KPIs across labels (e.g. energy GJ surfaced under a kWh
  key, water intensity under a consumption key) and hardcodes `section_b_complete = True` —
  display conveniences that slightly blur units.

### 7.6 Framework alignment

- **SEBI BRSR / BRSR Core (LODR amendment 2023)** — India's mandatory ESG disclosure for the
  top-1000 listed companies (FY 2022-23 onward), with BRSR Core defining a subset of ~49
  assured KPIs; the engine's core-KPI extraction and assurance flags mirror this two-layer
  design.
- **HKMA SPM GS-1 (2021, upd. 2023)** — supervisory expectations across governance, strategy,
  risk management and metrics; the engine's 4-pillar maturity + sectoral climate stress test
  reflects the HKMA's 2023 sector-level climate stress-testing exercise.
- **Bank of Japan climate scenario analysis (2022/2023)** — joint FSA/BoJ pilot examining
  transition and physical risk on major banks' credit portfolios; the PD/LGD/credit-loss/ROE
  impact vocabulary matches the exercise's disclosed dimensions.
- **ASEAN Taxonomy v3 (2024)** — the two-tier (Foundation/Plus) structure with traffic-light
  classification and five environmental-social focus areas is encoded verbatim; Foundation tier
  enables lower-capacity members to classify via principles rather than technical screening
  criteria.
- **PBoC Green Bond Endorsed Project Catalogue (2021) + Common Ground Taxonomy** — covered by the
  fifth sub-engine over `pboc_*` tables (not exposed under the traced routes).
