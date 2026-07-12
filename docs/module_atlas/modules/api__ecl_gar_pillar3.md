# Api::Ecl_Gar_Pillar3
**Module ID:** `api::ecl_gar_pillar3` · **Route:** `/api/v1/ecl-gar-pillar3` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/ecl-gar-pillar3/ecl-only` | `ecl_only` | api/v1/routes/ecl_gar_pillar3.py |
| POST | `/api/v1/ecl-gar-pillar3/gar-only` | `gar_only` | api/v1/routes/ecl_gar_pillar3.py |
| GET | `/api/v1/ecl-gar-pillar3/ref/kpis` | `ref_kpis` | api/v1/routes/ecl_gar_pillar3.py |
| GET | `/api/v1/ecl-gar-pillar3/ref/nace-eligible` | `ref_nace` | api/v1/routes/ecl_gar_pillar3.py |

### 2.3 Engine `ecl_gar_pillar3_orchestrator` (services/ecl_gar_pillar3_orchestrator.py)
| Function | Args | Purpose |
|---|---|---|
| `ECLGARPillar3Orchestrator.orchestrate` | entity_name, exposures, scenario, reporting_date | Run the full ECL → GAR → Pillar 3 chain. Args: entity_name: Legal name of the reporting institution. exposures: List of ExposureInput records (portfolio). scenario: Climate scenario — BASE / ADVERSE / SEVERE / OPTIMISTIC. reporting_date: ISO date string; defaults to today. Returns: OrchestrationResult containing all three stage outputs. |
| `ECLGARPillar3Orchestrator._compute_exposure` | inp, scenario | Compute ECL climate overlay + GAR classification for one exposure. |
| `ECLGARPillar3Orchestrator._build_pillar3` |  | Build EBA ITS 2022/01 Pillar 3 Art. 449a sections and KPI table. |
| `ECLGARPillar3Orchestrator._assess_readiness` | gar_ratio, exposure_results, exposures | Score assurance readiness and generate gaps + recommendations. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/ecl-gar-pillar3/ref/kpis** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['pillar3_kpi_template'], 'n_keys': 1}`

**GET /api/v1/ecl-gar-pillar3/ref/nace-eligible** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['taxonomy_eligible_nace', 'reference'], 'n_keys': 2}`

**POST /api/v1/ecl-gar-pillar3/ecl-only** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/ecl-gar-pillar3/gar-only** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/ecl-gar-pillar3/orchestrate** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `ecl_gar_pillar3_orchestrator` — extracted transformation lines:**
```python
LGD_climate = LGD_base + IPCC_AR6_flood_damage_component(scenario, flood_rp)
EAD_climate = EAD + CCF_uplift(scenario, asset_class, transition_risk) × undrawn_commitment
GAR = numerator / denominator × 100
ecl_uplift = ((clim_ecl - base_ecl) / base_ecl * 100) if base_ecl > 0 else 0.0
gar_ratio  = (gar_num / gar_denom * 100) if gar_denom > 0 else 0.0
btar_ratio = (gar_num / btar_denom * 100) if btar_denom > 0 else 0.0
trans_conc_pct = (high_trans_ead / total_ead * 100) if total_ead > 0 else 0.0
phys_conc_pct = (phys_ead / total_ead * 100) if total_ead > 0 else 0.0
ead_uplift_pct=pw_ead_uplift * 100,
lgd_flood_pct=pw_lgd_flood * 100,
portfolio_ead_uplift_pct=round(pw_ead_uplift * 100, 3),
portfolio_lgd_flood_damage_pct=round(pw_lgd_flood * 100, 3),
pd_climate = min(inp.pd_base * pd_mult, 0.9999)
rp_effective = max(rp_nominal / ipcc_amp, 5.0)
rp_damage_scale = math.log(max(rp_nominal, 5.0)) / math.log(max(rp_effective, 5.0))
ipcc_c1 = min(base_flood_hc * rp_damage_scale, 0.30)
lgd_climate = min(inp.lgd_base + ipcc_c1, 0.90)
ead_uplift_eur = inp.undrawn_commitment_eur * ccf_uplift_frac
ead_climate = inp.ead_eur + ead_uplift_eur
ead_uplift_pct = (ead_uplift_eur / inp.ead_eur) if inp.ead_eur > 0 else 0.0
base_ecl  = inp.pd_base    * inp.lgd_base  * inp.ead_eur
clim_ecl  = pd_climate     * lgd_climate   * ead_climate
ecl_uplift_pct = ((clim_ecl - base_ecl) / base_ecl * 100) if base_ecl > 0 else 0.0
ead_uplift_pct=round(ead_uplift_pct * 100, 3),
lgd_ipcc_flood_damage_pct=round(ipcc_c1 * 100, 3),
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`/api/v1/ecl-gar-pillar3` wraps the **ECL → GAR → Pillar 3 Orchestrator** ("E1",
`backend/services/ecl_gar_pillar3_orchestrator.py`), a three-stage compliance chain for banks:
(1) climate-conditioned IFRS 9 ECL, (2) EU Taxonomy Green Asset Ratio classification, (3) an
auto-populated CRR Art. 449a / EBA ITS 2022/01 Pillar 3 ESG disclosure pack. Stage-1 formulas,
quoted from the class docstring and `_compute_exposure`:

```
PD_climate  = min(PD_base × PD_mult(transition_level, scenario), 0.9999)
LGD_climate = min(LGD_base + IPCC_flood_component, 0.90)
EAD_climate = EAD + CCF_uplift(level, scenario) × undrawn_commitment
ECL_climate = PD_climate × LGD_climate × EAD_climate
Base ECL    = PD_base × LGD_base × EAD
```

Stage 2: `taxonomy_aligned = eligible AND aligned_pct ≥ 80% AND DNSH AND min_social_safeguards`;
`GAR = Σ aligned non-sovereign EAD / Σ non-sovereign EAD × 100`; BTAR uses total EAD (incl.
sovereigns) as denominator. Stage 3 fills 11 KPI rows and 4 narrative sections plus an
assurance-readiness score (100 minus deductions).

### 7.2 Parameterisation

**PD multipliers** (`_PD_TRANSITION_MULTIPLIERS`, transition level × scenario — synthetic
calibration):

| Level | OPTIMISTIC | BASE | ADVERSE | SEVERE |
|---|---|---|---|---|
| low | 1.02 | 1.05 | 1.12 | 1.20 |
| medium | 1.05 | 1.15 | 1.35 | 1.55 |
| high | 1.10 | 1.30 | 1.65 | 2.10 |

**IPCC AR6 flood frequency amplifiers** (`_IPCC_FLOOD_AMPLIFIERS`; comment cites "WG2 SPM B1.2"):
OPTIMISTIC 1.70 (+1.5 °C), BASE 2.80 (+2 °C), ADVERSE 4.10 (+3 °C), SEVERE 5.60 (+4 °C) — the
factor by which flood frequency increases, shortening the effective return period.

**EAD CCF uplift fractions** (`_EAD_CCF_UPLIFT`, applied to undrawn commitments): low 0–8%,
medium 2–20%, high 4–35% across scenarios. **Base flood LGD haircuts** (`_BASE_FLOOD_HAIRCUT`):
low 3%, medium 7%, high 14%; the LGD flood component is capped at 30 points and total LGD at 90%.

**Taxonomy reference**: 15 NACE codes in `GAR_ELIGIBLE_NACE` flagged for Climate Change Mitigation
(CCM) and/or Adaptation (CCA) objectives (e.g. D35 electricity CCM+CCA, E36 water CCA-only);
alignment threshold 80% of activity meeting Technical Screening Criteria.

**Assurance deductions** (`_assess_readiness`): −15 if < 50% of exposures taxonomy-assessed,
−20 if GAR = 0, −10 if eligible exposures lack DNSH, −15 if all ECL uplifts are zero, −10 if > 80%
of exposures use the default 100-yr flood return period; floor 0.

### 7.3 Calculation walkthrough

`POST /orchestrate` (also `/ecl-only`, `/gar-only` subsets) takes entity name, a portfolio of
`ExposureInput` records and a scenario (BASE default, invalid → BASE):

1. **LGD flood component** — the code shortens the return period by the AR6 amplifier and scales
   damage logarithmically: `rp_eff = max(rp/amp, 5)`;
   `scale = ln(max(rp,5)) / ln(rp_eff)`; `component = min(base_haircut × scale, 0.30)`.
2. **Per-exposure ECL** — base vs climate ECL and uplift %; EAD uplift only touches undrawn
   commitments (drawdown acceleration).
3. **Portfolio aggregates** — Σ ECLs, EAD-weighted average EAD-uplift and LGD-flood component;
   transition concentration = high-level EAD share; physical concentration = share of EAD with
   flood return period ≤ 100 yr.
4. **GAR/BTAR** — numerator counts full EAD of aligned exposures (no partial pro-rating by
   aligned %); CCM/CCA splits require alignment plus the objective flag (input or NACE map).
5. **Pillar 3 pack** — Section P3-A (Taxonomy & GAR, Template 1), P3-B (risk concentration,
   Templates 5–7, with gap warnings at > 30% transition / > 20% physical concentration), P3-C
   (ECL overlay, GL/2022/16 §4.2.3/4.2.4), P3-D (governance/TCFD cross-reference, fixed
   narrative). KPI GAR-3 carries the benchmark note "EBA average ~6% (2022)".
   `GET /ref/kpis` and `GET /ref/nace-eligible` expose the reference tables.

### 7.4 Worked example (SEVERE scenario, one exposure)

Inputs: EAD €100M, undrawn €20M, PD 2%, LGD 40%, transition level *high*, flood RP 50 yr,
eligible, aligned 85%, DNSH ✓, MSS ✓, NACE D35.

| Step | Computation | Result |
|---|---|---|
| PD_climate | 0.02 × 2.10 | 4.20% |
| Flood RP effective | max(50/5.6, 5) | 8.93 yr |
| Damage scale | ln 50 / ln 8.93 = 3.912/2.189 | 1.787 |
| LGD flood component | min(0.14 × 1.787, 0.30) | 0.2502 |
| LGD_climate | min(0.40 + 0.2502, 0.90) | 65.02% |
| EAD_climate | 100M + 20M × 0.35 | €107M |
| Base ECL | 0.02 × 0.40 × 100M | €0.80M |
| Climate ECL | 0.042 × 0.6502 × 107M | **€2.922M** |
| ECL uplift | (2.922 − 0.80)/0.80 | **+265%** |
| GAR | aligned (85% ≥ 80, DNSH, MSS) → 100/100 | **100%** (single-exposure book) |
| CCM/CCA | D35 map: ccm ✓, cca ✓ | both €100M |

### 7.5 Data provenance & limitations

- **Pure calculator, no PRNG/seed data**: all exposures are caller-supplied. The AR6 flood
  amplifiers are the only physically sourced constants (attributed in-code to IPCC AR6 WG2 SPM
  B1.2); PD multipliers, CCF uplifts and flood haircuts are **synthetic demo calibrations**
  (the P3-C narrative's mention of "JRC depth-damage curves" describes intent, not implemented
  curves).
- GAR uses whole-EAD attribution for aligned exposures rather than pro-rating by
  `taxonomy_aligned_pct` — real Art. 8 reporting apportions by the counterparty's turnover/CapEx
  KPI. BTAR here = aligned assets ÷ total assets incl. sovereigns, a simplification of the ITS
  BTAR (which extends the *numerator* to non-NFRD counterparties).
- Single-period ECL, no discounting, no staging/SICR (that lives in the sibling `/api/v1/ecl`
  domain); one scenario per run rather than probability-weighting.
- Governance section P3-D is fixed boilerplate with a hardcoded gap line.

### 7.6 Framework alignment

- **CRR Art. 449a + EBA ITS 2022/01 (Pillar 3 ESG):** the disclosure pack mirrors the ITS
  structure — Template 1 (taxonomy/GAR), Templates 5–7 (transition and physical risk banking
  book); real templates require NACE-sector × maturity-band breakdowns not modelled here.
- **EU Taxonomy Reg. 2020/852 + DAs 2021/2139, 2022/1214, 2023/2485:** alignment = substantial
  contribution (proxied by the ≥ 80% TSC threshold) + DNSH + minimum safeguards (Art. 18, ILO
  core conventions) — the module implements this as three boolean gates.
- **GAR (Disclosures DA under Art. 8):** aligned covered assets ÷ covered assets excluding
  sovereign/central-bank exposures — the sovereign exclusion is implemented; the "~6% EBA
  average" benchmark echoes the EBA's 2022 pilot findings.
- **EBA GL/2022/16 & BCBS Principles 14–18:** climate-in-credit-risk overlay (PD/LGD/EAD
  channels); BCBS Principle 16 is cited for the CCF drawdown effect.
- **IPCC AR6 WG2:** flood-frequency amplification with warming as the physical-risk driver;
  implemented as return-period shortening feeding a log damage scale.
- **IFRS 9:** ECL = PD×LGD×EAD kernel; ESRS E1 cross-referencing appears in the recommendations
  (single-source CSRD reporting).

## 9 · Future Evolution

### 9.1 Evolution A — Pro-rated GAR, JRC depth-damage curves, and probability-weighted ECL (analytics ladder: rung 2 → 3)

**What.** The ECL→GAR→Pillar 3 orchestrator (E1) — a three-stage bank compliance chain: climate-
conditioned IFRS 9 ECL, EU Taxonomy Green Asset Ratio classification, and an auto-populated CRR Art.
449a / EBA ITS 2022/01 disclosure pack. The AR6 flood amplifiers are genuinely IPCC-sourced. §7.5
names the deepening targets: GAR uses **whole-EAD attribution** for aligned exposures rather than
pro-rating by `taxonomy_aligned_pct` (real Art. 8 apportions by counterparty turnover/CapEx KPI); the
LGD flood component uses a log damage-scale, not the **JRC depth-damage curves** the P3-C narrative
claims (intent, not implementation); ECL is **single-period, one-scenario** with no discounting or
staging (that lives in the sibling `ecl_climate`); and the PD multipliers/CCF uplifts/flood haircuts
are synthetic calibrations. Evolution A adds KPI-pro-rated GAR, real JRC depth-damage curves, and
probability-weighting across scenarios.

**How.** Stage 2 numerator pro-rates each aligned exposure by its `taxonomy_aligned_pct` per the
Disclosures DA; the LGD flood component uses ingested JRC depth-damage curves keyed to hazard depth
(the platform's physical-risk digital twin has flood grids); Stage 1 runs probability-weighted across
scenarios like `ecl_climate` rather than one scenario per call. Rung 3: calibrate the PD multipliers
and CCF uplifts against observed climate-credit data; extend BTAR to the ITS non-NFRD counterparty
numerator.

**Prerequisites (hard).** Fix the harness failures — §4.2 shows `POST /ecl-only`, `/gar-only`,
`/orchestrate` all **skipped** (need input payloads to trace); the AR6 amplifiers stay (real), the
synthetic PD/CCF calibrations get documented. **Acceptance:** the §7.4 SEVERE worked example (€2.922M
climate ECL, +265% uplift, LGD 65.02%) reproduces at legacy calibrations; GAR pro-rates by aligned %
(a 50%-aligned exposure contributes half its EAD, not all); the LGD flood component derives from a
JRC curve; the endpoints pass the harness.

### 9.2 Evolution B — Integrated ECL-GAR-Pillar3 disclosure copilot (LLM tier 2 → 3)

**What.** This orchestrator already chains three domains — its LLM evolution is a tier-3-flavoured
copilot that runs the full compliance chain: "assess our portfolio's climate ECL, GAR and generate
the Pillar 3 pack" (`/orchestrate` → ECL uplift, GAR/BTAR, 11 KPI rows, 4 narrative sections,
assurance-readiness score with gaps), or the `/ecl-only` and `/gar-only` subsets — narrating real
outputs and the assurance-readiness deductions (which directly answer "what's blocking our sign-off?").

**How.** Tool schemas over the 3 POST + 2 GET operations; the `ref/kpis` and `ref/nace-eligible`
endpoints ground "which NACE codes are GAR-eligible for CCM?" questions. The no-fabrication validator
checks every ECL, GAR %, uplift and KPI against tool output; the copilot surfaces the assurance-
readiness gaps (e.g. −15 if <50% of exposures taxonomy-assessed) as an actionable checklist. Because
it orchestrates ECL + Taxonomy + Pillar 3, it composes with the sibling `ecl_climate`, `eu_taxonomy_gar`
and `eba_pillar3` domains in a regulatory-disclosure desk.

**Prerequisites.** Evolution A's harness fixes and pro-rated GAR (so narrated ratios are ITS-faithful);
Atlas + reference corpus embedded (roadmap D3). **Acceptance:** every figure cited traces to an
orchestrator tool call; the GAR and ECL uplift match `/orchestrate`; the assurance-readiness gaps a
copilot names match the engine's deductions; the P3-D governance boilerplate is flagged as fixed
narrative, not entity-specific.