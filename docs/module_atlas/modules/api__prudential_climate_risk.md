# Api::Prudential_Climate_Risk
**Module ID:** `api::prudential_climate_risk` · **Route:** `/api/v1/prudential-climate-risk` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/prudential-climate-risk/boe-bes` | `boe_bes` | api/v1/routes/prudential_climate_risk.py |
| POST | `/api/v1/prudential-climate-risk/ecb-dfast` | `ecb_dfast` | api/v1/routes/prudential_climate_risk.py |
| POST | `/api/v1/prudential-climate-risk/ngfs-v4` | `ngfs_v4` | api/v1/routes/prudential_climate_risk.py |
| POST | `/api/v1/prudential-climate-risk/icaap-overlay` | `icaap_overlay` | api/v1/routes/prudential_climate_risk.py |
| POST | `/api/v1/prudential-climate-risk/sarp431` | `sarp431` | api/v1/routes/prudential_climate_risk.py |
| POST | `/api/v1/prudential-climate-risk/capital-overlays` | `capital_overlays` | api/v1/routes/prudential_climate_risk.py |
| POST | `/api/v1/prudential-climate-risk/full-assessment` | `full_assessment` | api/v1/routes/prudential_climate_risk.py |
| GET | `/api/v1/prudential-climate-risk/ref/ngfs-scenarios` | `ref_ngfs_scenarios` | api/v1/routes/prudential_climate_risk.py |
| GET | `/api/v1/prudential-climate-risk/ref/boe-bes` | `ref_boe_bes` | api/v1/routes/prudential_climate_risk.py |
| GET | `/api/v1/prudential-climate-risk/ref/sector-risk` | `ref_sector_risk` | api/v1/routes/prudential_climate_risk.py |
| GET | `/api/v1/prudential-climate-risk/ref/icaap-thresholds` | `ref_icaap_thresholds` | api/v1/routes/prudential_climate_risk.py |

### 2.3 Engine `prudential_climate_risk_engine` (services/prudential_climate_risk_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `PrudentialClimateRiskEngine.assess_boe_bes` | entity_id, loan_book_segments, market_portfolio, institution_type, bes_round, cet1_ratio_start_pct |  |
| `PrudentialClimateRiskEngine.assess_ecb_dfast` | entity_id, loan_book_segments, cst_round, cet1_ratio_start_pct |  |
| `PrudentialClimateRiskEngine.assess_ngfs_v4` | entity_id, portfolio_data, scenarios |  |
| `PrudentialClimateRiskEngine.calculate_icaap_overlay` | entity_id, stressed_results, institution_type |  |
| `PrudentialClimateRiskEngine.assess_sarp431` | entity_id, rwa_data, climate_rwa_impact |  |
| `PrudentialClimateRiskEngine.generate_capital_overlays` | entity_id, loan_book_segments, scenario |  |
| `PrudentialClimateRiskEngine.generate_full_assessment` | entity_id, institution_data |  |
| `get_engine` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/prudential-climate-risk/ref/boe-bes** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**GET /api/v1/prudential-climate-risk/ref/icaap-thresholds** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**GET /api/v1/prudential-climate-risk/ref/ngfs-scenarios** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**GET /api/v1/prudential-climate-risk/ref/sector-risk** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**POST /api/v1/prudential-climate-risk/boe-bes** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/prudential-climate-risk/capital-overlays** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/prudential-climate-risk/ecb-dfast** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/prudential-climate-risk/full-assessment** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `prudential_climate_risk_engine` — extracted transformation lines:**
```python
stressed_pd = min(1.0, base_pd + pd_uplift)
el_stressed = exposure * stressed_pd * lgd
phase = (yr - 2025) / 25.0  # 0 at 2025 → 1 at 2050
tr_drag = tr_mult * self._NGFS_TRANSITION_DRAG_COEF * phase
ph_drag = ph_mult * self._NGFS_PHYSICAL_DRAG_COEF * phase
impact_pct = (climate_rwa_impact / max(total_rwa, 1)) * 100
brown_exposure = exposure * brown_share
capital_add_on = exposure * (rwa_uplift_pct / 100) * 0.08  # 8% capital ratio
stranded_pct = float(_override) / 100 if float(_override) > 1 else float(_override)
rwa_impact_pct = round(climate_rwa / total_rwa * 100, 2) if total_rwa > 0 else None
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`backend/services/prudential_climate_risk_engine.py` (engine E45, `PrudentialClimateRiskEngine`)
implements six chained supervisory-climate assessments, orchestrated by
`POST /full-assessment` and individually exposed via `api/v1/routes/prudential_climate_risk.py`:

1. **BOE BES** (`assess_boe_bes`) — sector PD-uplift stress under the Bank of England Biennial
   Exploratory Scenario (2021 or 2025 round), Late/No-Action (LLT) vs Early-Action (ELT) legs.
2. **ECB climate stress test** (`assess_ecb_dfast`) — transition vs physical expected loss per
   CST 2022/2024 scenario, with ECB-published sample CET1 impacts.
3. **NGFS v4 trajectories** (`assess_ngfs_v4`) — 2025–2050 CET1 drag paths for 6 scenarios.
4. **ICAAP overlay** (`calculate_icaap_overlay`) — Pillar 2a add-on + Pillar 2b buffer + SREP score.
5. **Basel SRP 43.1** (`assess_sarp431`) — materiality categorisation from climate RWA impact.
6. **Capital overlays** (`generate_capital_overlays`) — segment brown-share, stranded-asset and
   RWA-uplift table.

Core formulas quoted from code:

```
stressed_PD = min(1, base_PD + (tr_uplift_bps + ph_uplift_bps)/10,000)
EL_stressed = exposure × stressed_PD × LGD
CET1 depletion (pp) = EL_stressed / RWA × 100,  RWA = Σ exposure × rwa_density_pct/100
CET1 drag(yr) = (tr_mult × 0.05 + ph_mult × 0.035) × (yr − 2025)/25     # NGFS, pp cumulative
P2a = clamp(0.30 × worst CET1 depletion, 0.25%, 2.0%)
P2b = clamp(0.50 × worst CET1 depletion − P2a, 0%, 3.0%)
rwa_uplift_pct = (tr_bps_disorderly × tr_mult + ph_bps_chronic × ph_mult)/10,000 × 100
capital_add_on = exposure × rwa_uplift × 8%
```

### 7.2 Parameterisation

**NGFS v4 scenario table** (`NGFS_V4_SCENARIOS`, docstring cites "NGFS Phase IV — June 2023
vintage"; multipliers are the engine's own calibration):

| Scenario | Category | 2050 °C | CP 2030 $/t | tr_mult | ph_mult |
|---|---|---|---|---|---|
| net_zero_2050 | orderly | 1.4 | 290 | 1.8 | 0.7 |
| below_2c | orderly | 1.8 | 150 | 1.4 | 0.9 |
| divergent_net_zero | disorderly | 1.5 | 350 | 2.2 | 0.75 |
| delayed_transition | disorderly | 1.8 | 80 | 2.5 | 1.1 |
| current_policies | hot_house | 3.0 | 25 | 0.8 | 2.2 |
| fragmented_world | hot_house | 2.5 | 40 | 1.0 | 1.8 |

**Sector PD-uplift tables** — 15 sectors each in `SECTOR_TRANSITION_RISK` (orderly/disorderly
bps: fossil_fuels 85/210 … healthcare 5/15) and `SECTOR_PHYSICAL_RISK` (acute/chronic bps:
agriculture 130/160 highest, shipping 100/110, healthcare 8/15 lowest). These are synthetic
expert-judgement calibrations (no external citation in code); unknown sectors default to
50/25 bps transition and 30/40 bps physical.

**Other rubrics:** `ICAAP_GUIDANCE` (SS3/19 materiality: >5% CET1 or >10% RWA = material;
P2a range 0.25–2.0%, P2b 0–3.0%); `BASEL_SRP431` (RWA impact ≥5% material, ≥1% potentially
material, implementation 2026-01-01); `EBA_SREP_SCORING` (scores 1–4 with add-on guidance
0% / 0.25–0.5% / 0.5–1.5% / 1.5–3.0%); NGFS drag coefficients 0.05 (transition) and 0.035
(physical) pp CET1 per unit multiplier, commented as "midpoint calibration"; stranded-asset
fractions of brown exposure by rating {high 25%, medium 8%, low 2%, very_high 30%}; brown
share by transition rating {high 80%, medium 40%, low 10%} — all synthetic demo values.
`BOE_BES_ROUNDS` / `ECB_CST_ROUNDS` embed published-round metadata (e.g. BES 2025 LLT =
delayed_transition, typical CET1 depletion 4.2 pp; CST 2024 sample impacts 2.2/4.1/6.8 pp).

### 7.3 Calculation walkthrough

BOE BES stresses every loan-book segment twice: LLT uses the disorderly transition + chronic
physical bps, ELT the orderly + acute bps. RWA comes only from caller-supplied
`rwa_density_pct`; if absent, CET1 depletion is an **honest null** (`cet1_data_status:
"insufficient_data"`) — the engine deliberately never fabricates capital ratios (comments:
"No fabrication", "No random draw"). ECB DFAST computes transition and physical EL per
scenario (disorderly bps used for delayed_transition/disorderly keys) but takes CET1 depletion
from the ECB's published sample impacts, not from the EL. NGFS produces 5-yearly CET1
trajectories floored at 5.0%. `full-assessment` chains everything: capital overlays →
`climate_rwa = total_capital_add_on / 0.08` → `rwa_impact_pct` → ICAAP SREP score
(≥5%→4, ≥3%→3, ≥1%→2, else 1) and SRP 43.1 categorisation; BES LLT CET1 depletion feeds the
P2a/P2b sizing. Default demo loan book (when caller sends none): real_estate $500M
(PD 1.5%, LGD 35%, density 60%), utilities $300M (2.5%, 45%, 85%), fossil_fuels $200M
(4%, 50%, 100%).

### 7.4 Worked example (BES 2025 LLT, fossil-fuels segment + ICAAP)

Segment: exposure $200M, base PD 4%, LGD 50%, rwa_density 100%. Uplift = (210 + 80)/10,000
= 290 bps.

| Step | Computation | Result |
|---|---|---|
| Stressed PD | 0.04 + 0.029 | 6.9% |
| EL stressed | 200M × 0.069 × 0.50 | **$6.90M** |
| Portfolio RWA (demo book) | 500×0.60 + 300×0.85 + 200×1.00 | $755M |
| Other segments' EL (LLT) | RE: 500×(0.015+0.0185)×0.35 = 5.8625; Util: 300×(0.025+0.027)×0.45 = 7.02 | $12.88M |
| Total LLT EL | 6.90 + 12.88 | $19.78M |
| CET1 depletion | 19.78 / 755 × 100 | **2.62 pp** |
| P2a add-on | clamp(0.30 × 2.62, 0.25, 2.0) | **0.79%** |
| P2b buffer | clamp(0.50 × 2.62 − 0.79, 0, 3.0) | **0.52%** |
| Total overlay | 0.79 + 0.52 | **1.31%** |

With a caller-supplied starting CET1 of 14%, post-stress CET1 = 14 − 2.62 = 11.38%.

### 7.5 Interconnections

`full-assessment` is the aggregation point: BES → ICAAP (worst CET1 depletion), capital
overlays → SRP 43.1 + SREP (RWA impact), NGFS → worst-scenario headline. The route file
additionally serves the four reference registries (`/ref/ngfs-scenarios`, `/ref/boe-bes`,
`/ref/sector-risk`, `/ref/icaap-thresholds`) consumed by the frontend prudential pages.

### 7.6 Data provenance & limitations

- **No seeded PRNG** — this engine was explicitly remediated to remove random draws; missing
  CET1/RWA inputs return nulls with `cet1_data_status: "insufficient_data"`.
- Sector bps uplifts, NGFS drag coefficients, brown shares and stranded fractions are
  **synthetic calibrations**; BES/CST "typical/sample CET1 depletion" figures are stylised
  round-level summaries, not bank-specific results.
- PD uplifts are additive and time-invariant (no 30-year pathway despite the rounds' 30-year
  horizons); ECB CET1 impact is a lookup, decoupled from the computed EL; SRP 43.1 review dates
  are hard-coded (2026/2027); the 8% capital ratio in overlays is the Basel Pillar 1 minimum,
  ignoring buffers.

### 7.7 Framework alignment

- **BOE BES / PRA SS3/19 & SS19/23** — LLT vs ELT scenario legs and materiality thresholds
  mirror the BES design papers; real BES asked firms for full balance-sheet projections rather
  than sector bps add-ons.
- **ECB CST 2022/2024** — scenario names and sample CET1 depletion magnitudes match the ECB
  exercise structure (the 2022 exercise reported ~€70bn combined losses; the engine uses
  round-level percentage anchors).
- **NGFS Phase IV (June 2023)** — the 6-scenario taxonomy (orderly / disorderly / hot-house)
  and carbon-price ordering are NGFS-faithful; drag coefficients are the module's own reduction.
- **BCBS SRP 43.1 / 2022 Climate Principles** — materiality categorisation with Pillar 2
  consequences; the code's 5%/1% RWA thresholds implement the guide's tiering.
- **EBA/GL/2020/06 SREP** — 4-point scoring with capital add-on ranges follows the EBA SREP
  score convention (1 = low risk … 4 = high risk).

## 9 · Future Evolution

### 9.1 Evolution A — Data-driven scenario drags and portfolio-resolved stress (analytics ladder: rung 2 → 4)

**What.** The E45 engine implements six chained supervisory-climate assessments orchestrated by
`/full-assessment`: BOE BES (sector PD-uplift, LLT vs ELT legs), ECB climate stress (transition
vs physical EL), NGFS v4 CET1 drag paths (2025–2050 across 6 scenarios), an ICAAP overlay (Pillar
2a add-on + 2b buffer + SREP), Basel SRP 43.1 materiality, and a capital-overlays table. Scenario
drags use fixed coefficients (`_NGFS_TRANSITION_DRAG_COEF`, `_NGFS_PHYSICAL_DRAG_COEF`) scaled by
a linear `phase = (yr−2025)/25`, and the capital add-on is a flat `exposure × rwa_uplift × 0.08`.
Inputs are caller-supplied. Evolution A grounds the scenarios and connects real portfolios.

**How.** (1) Replace the fixed drag coefficients with the platform's canonical NGFS scenario data
(`ngfs_scenarios_extract` / `dh_ngfs_scenario_data`) so CET1 trajectories reflect actual scenario
variables, not a linear phase-in — and reconcile against the published ECB/BOE sample impacts the
engine already references. (2) Wire the stress to a real portfolio: pull exposures/sectors from
`portfolios_pg` and sector PDs from the credit engines so `/full-assessment` runs on the actual
book, not hand-entered aggregates. (3) Add the multi-year CET1-depletion trajectory with the
scenario as a proper path (rung 4). (4) Bench-pin stressed PD, EL, and the capital add-on.

**Prerequisites.** Canonical NGFS source linkage; `portfolios_pg`/credit-engine integration;
several POST endpoints trace `skipped` under the harness and must be confirmed callable.
**Acceptance:** scenario drags derive from NGFS data with provenance; `/full-assessment` runs on a
real portfolio's exposures; CET1 trajectories are multi-year paths; bench pins pass.

### 9.2 Evolution B — Supervisory-stress copilot for the CRO office (LLM tier 2)

**What.** A copilot that runs the prudential suite and explains it — "under the BOE BES
No-Action leg your climate RWA impact is X%, breaching the SRP 43.1 materiality threshold; the
ICAAP overlay adds Y bps of Pillar 2a; your worst NGFS scenario depletes CET1 by Z by 2050" —
each figure from a tool call.

**How.** Seven POST endpoints (the six assessments + full-assessment) plus reference GETs
(boe-bes, icaap-thresholds, ngfs-scenarios, sector-risk) that ground every supervisory framework.
The copilot's value is producing the ICAAP/stress narrative a CRO office assembles for the
regulator, always citing which assessment produced each number and the framework behind each
threshold. What-ifs across scenarios and legs re-run statelessly. Central node for a
prudential/regulatory desk, cross-linking to `stress_testing` and `model_validation`.

**Prerequisites.** Evolution A for defensible scenario figures — narrating fixed-coefficient
drags as supervisory results needs the honest caveat; endpoint fixes. **Acceptance:** every PD,
EL, RWA-impact, and CET1 figure traces to a tool response; the copilot names the supervisory
framework and threshold behind each verdict from the reference endpoints; it labels scenario
drags as coefficient-based until Evolution A grounds them in NGFS data, and refuses to assert
regulatory pass/fail.