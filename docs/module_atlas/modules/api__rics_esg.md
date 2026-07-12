# Api::Rics_Esg
**Module ID:** `api::rics_esg` · **Route:** `/api/v1/rics-esg` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/rics-esg/compliance` | `assess_compliance` | api/v1/routes/rics_esg.py |
| GET | `/api/v1/rics-esg/checklist` | `get_checklist` | api/v1/routes/rics_esg.py |
| GET | `/api/v1/rics-esg/materiality` | `get_materiality_factors` | api/v1/routes/rics_esg.py |

### 2.3 Engine `rics_esg_engine` (services/rics_esg_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `RICSESGEngine.assess_compliance` | inp | Run full RICS ESG compliance assessment: 1. Auto-assess each checklist item based on available data 2. Generate ESG valuation narrative (VPS 4 / VPGA 12) 3. Conduct materiality assessment 4. Assess uncertainty (VPG3) |
| `RICSESGEngine.get_full_checklist` |  | Return all RICS ESG checklist templates. |
| `RICSESGEngine.get_materiality_factors` |  | Return ESG materiality factor catalogue. |
| `RICSESGEngine._auto_assess_checklist` | inp |  |
| `RICSESGEngine._assess_item` | ci, inp | Auto-populate status and evidence based on input data. |
| `RICSESGEngine._materiality_assessment` | inp |  |
| `RICSESGEngine._check_data_available` | factor_name, inp |  |
| `RICSESGEngine._generate_narrative` | inp, mat_scores, material | Generate RICS-compliant ESG valuation narrative per VPS 4 and VPGA 12. |
| `RICSESGEngine._assess_uncertainty` | inp | VPG3 uncertainty assessment. |
| `RICSESGEngine._generate_recommendations` | inp, checklist, mat_scores |  |

**Engine `rics_esg_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `ALL_CHECKLISTS` | `{'PS1': PS1_CHECKLIST, 'PS2': PS2_CHECKLIST, 'VPS4': VPS4_CHECKLIST, 'VPGA12': VPGA12_CHECKLIST, 'VPG3': VPG3_CHECKLIST, 'IVS': IVS_CHECKLIST}` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/rics-esg/checklist** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['PS1', 'PS2', 'VPS4', 'VPGA12', 'VPG3', 'IVS'], 'n_keys': 6}`

**GET /api/v1/rics-esg/materiality** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['environmental', 'social', 'governance'], 'n_keys': 3}`

**POST /api/v1/rics-esg/compliance** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `rics_esg_engine` — extracted transformation lines:**
```python
comp_pct = round(compliant / total * 100, 1) if total else 0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`backend/services/rics_esg_engine.py` (`RICSESGEngine`, "Gap 5.2.7") produces the ESG
compliance apparatus that must accompany a RICS Red Book real-estate valuation: an
auto-assessed 23-item checklist across six RICS/IVSC standards, a weighted ESG materiality
assessment, a VPG3 valuation-uncertainty estimate, a generated ESG narrative, and remediation
recommendations. Routes (`api/v1/routes/rics_esg.py`): `POST /compliance`, `GET /checklist`,
`GET /materiality`.

```
compliance % = compliant_items / total_items × 100
band: ≥90% and zero non-compliant → full · ≥70% substantial · ≥40% partial · else non_compliant
pillar materiality = Σ weight × (1.0 if data available else 0.3)
material factor    = data available AND weight ≥ 0.15
uncertainty ±% = clamp(10 + Σ data-gap add-ons + evidence adjustment + comparables adjustment, 5, 30)
```

### 7.2 Parameterisation

**Checklist templates** (`ALL_CHECKLISTS`, 23 items): PS 1 Terms of Engagement (4 items —
scope, data sources, limitations, reporting), PS 2 Ethics (2 — conflicts, valuer competence),
VPS 4 Bases of Value (5 — basis-ESG link, comparables, quantified adjustments, transition risk,
physical risk), VPGA 12 ESG & Sustainability (6 — materiality, E, S, G, CRREM alignment, green
cert impact), VPG3 Uncertainty (3), IVS 104/400 (3). All but three are `mandatory: true`.

**Materiality factor catalogue** (`MATERIALITY_FACTORS`, weights sum to 1.0 per pillar):

| Pillar | Top-weighted factors | Data sources named in code |
|---|---|---|
| Environmental (8) | EPC 0.25 · Scope 1+2 carbon 0.20 · flood 0.15 · heat 0.10 · green cert 0.10 · CRREM 0.10 | EPC Register, CRREM v2.3, EA Flood Map/Fathom, CIBSE TM59, BREEAM/LEED/NABERS |
| Social (6) | indoor air 0.25 · daylight 0.20 · accessibility 0.15 · community 0.15 · tenant satisfaction 0.15 | WELL, CIBSE Guide A, GRESB |
| Governance (5) | management certification 0.30 · compliance history 0.25 · ESG disclosure 0.20 | ISO 14001/50001, GRESB |

**Uncertainty rubric (VPG3):** baseline ±10%; +3 no EPC, +2 no metered energy, +2 no flood
assessment, +1.5 no CRREM year; evidence quality strong −3 / moderate 0 / limited +3 / none +7;
comparables ≥10 −2, ≥5 −1, 0 +3; clamp [5, 30]; bands ≤10 low, ≤15 medium, ≤20 high, else
very_high. All add-ons are synthetic expert calibrations (no cited study).

### 7.3 Calculation walkthrough

`assess_compliance` runs four passes. (1) `_auto_assess_checklist` evaluates each item against
the input evidence — e.g. VPS4-03 is *compliant* if a green premium or brown discount % is
supplied, *partially compliant* if EPC + comparables exist but no quantified adjustment, else
*non-compliant*; VPGA12-02 needs ≥3 of 5 environmental metrics for compliance; **items without
a specific rule default to "compliant — Procedural compliance assumed — manual review
recommended"** (a generous default worth noting). (2) `_materiality_assessment` scores each
pillar with the 1.0/0.3 availability multiplier and lists factors that are both available and
weight ≥0.15. (3) `_generate_narrative` assembles a 5-section text block (basis of value with
IVS 104 §30.1/§60.1 mapping, environmental facts, adjustments, material factors, comparable
evidence). (4) `_assess_uncertainty` applies the rubric above; `_generate_recommendations`
emits targeted actions (obtain EPC, run CRREM, ≥3 ESG comparables, flood assessment, ISO
14001/50001 when governance < 0.5).

### 7.4 Worked example

Input: EPC D, energy 210 kWh/m²/yr, CRREM stranding 2031, flood zone "low" with no quantified
physical adjustment, brown discount −7.5%, 4 ESG comparables, evidence "limited"; no green
cert, no Scope 1+2, no GRESB, no ISO 14001.

| Output | Derivation | Result |
|---|---|---|
| VPS4-03 | brown discount supplied | compliant |
| VPS4-04 | CRREM year present | compliant ("CRREM stranding: 2031") |
| VPS4-05 | flood zone low, adjustment None | partially compliant |
| VPGA12-02 | EPC + energy + flood + CRREM = 4/5 | compliant |
| VPG3-02 | 4 comparables, evidence not strong | partially compliant |
| Environmental materiality | 0.25+0.20×0.3+0.15+0.10×0.3+0.05×0.3+0.05×0.3+0.10×0.3+0.10 = 0.25+0.06+0.15+0.03+0.015+0.015+0.03+0.10 | **0.650** |
| Material factors | EPC (0.25), flood (0.15) + always-true accessibility/H&S/compliance-history | listed |
| Uncertainty | 10 + 0 + 0 + 0 + 0 + limited(+3) + comparables<5(0… 4≥0→ no −, not 0 → +0) | **±13% → medium** |

With, say, 20 of 23 items compliant and 0 non-compliant mandatory failures at 87%, the band is
**substantial** (full requires ≥90% *and* zero non-compliant).

### 7.5 Companion outputs

The response bundles: the full per-item checklist with status/evidence/notes (renderable as an
audit table), the plain-text `esg_narrative` and `uncertainty_narrative` (drop-in report
annexes), pillar materiality scores, and the recommendations list. `GET /checklist` and
`GET /materiality` expose the raw templates for the frontend RICS module.

### 7.6 Data provenance & limitations

- **No PRNG, no synthetic property data** — everything derives from the caller's
  `RICSComplianceInput`; the only fixed content is the checklist/factor registries and rubric
  constants.
- The "procedural compliance assumed" default means items with no auto-assessment rule
  (PS1-01/04, PS2-01/02, VPS4-01/02, VPGA12-01/03/04/06, VPG3-03, all three IVS items — over
  half the checklist) count as compliant without evidence, inflating the headline compliance %.
  The evidence string flags this, but the score does not discount it.
- Several materiality factors are hard-wired: water consumption, daylight, community impact and
  maintenance quality are always "unavailable" (0.3×weight); accessibility, H&S and regulatory
  compliance history are always "available" — so pillar scores have fixed floors/ceilings.
- Uncertainty is an additive heuristic, not a statistical confidence interval; RICS VPG3
  expects valuer judgement, which this approximates but cannot replace (the engine's own
  evidence strings recommend manual review).
- PS1-03 can never be non-compliant (both branches return "compliant") — disclosure of gaps
  and absence of gaps are both acceptable, by design.

### 7.7 Framework alignment

- **RICS Red Book Global Standards (eff. 31 Jan 2022)** — PS 1/PS 2 are the mandatory
  professional standards (engagement terms; ethics/independence); VPS 1–5 the valuation
  technical standards. The engine's checklist ids map directly onto these.
- **RICS VPGA 12** — the guidance note on sustainability/ESG in valuation: requires the valuer
  to assess which ESG factors are material and reflect them where market evidence supports it;
  implemented as the weighted materiality catalogue + narrative section 4.
- **RICS VPG3 (valuation uncertainty)** — requires disclosure of material uncertainty and its
  causes; implemented as the ±% rubric distinguishing data-input quality from market risk
  (checklist VPG3-03).
- **IVSC IVS 104 / IVS 400 (2024)** — bases of value (Market Value §30.1, Investment Value
  §60.1) and real-property documentation requirements; the narrative cites the exact paragraph
  anchors.
- **MEES / CRREM / EPC regime** — transition-risk evidence hooks (stranding year, EPC gap)
  connect this module to the `api::re_clvar` CRREM engine outputs.

## 9 · Future Evolution

### 9.1 Evolution A — Evidence-linked checklist auto-assessment and quantified uncertainty (analytics ladder: rung 1 → 3)

**What.** The `RICSESGEngine` produces the ESG apparatus a RICS Red Book valuation requires: an
auto-assessed 23-item checklist across six RICS/IVSC standards (PS1, PS2, VPS4, VPGA12, VPG3, IVS),
a weighted materiality assessment, a VPG3 valuation-uncertainty estimate, and a generated narrative.
Scoring is `compliance% = compliant/total × 100` with bands, and uncertainty is
`clamp(10 + data-gap add-ons + adjustments, 5, 30)`. The checklist compliance is caller-asserted
per item, materiality uses fixed weights, and §4.2 shows `POST /compliance` traces **failed**.
Evolution A grounds the assessment in the platform's real property data.

**How.** (1) Auto-assess checklist items from evidence the platform already holds — VPS4's
transition-risk and physical-risk items from `re_clvar`/`real_asset_decarb`, EPC/energy items from
the `uk_epc` module — so items are evidence-backed with a provenance flag, not manual ticks. (2)
Calibrate the VPG3 uncertainty add-ons against observed valuation dispersion for data-sparse
assets, so the ±% band reflects real comparables scarcity. (3) Fix the failing `/compliance`
endpoint. (4) Bench-pin the compliance banding and uncertainty clamp.

**Prerequisites.** Links to `re_clvar`/`real_asset_decarb`/`uk_epc` for evidence; a valuation-
dispersion source for uncertainty calibration; `/compliance` repaired. **Acceptance:** checklist
items auto-populate from platform data with provenance where available; the uncertainty band is
calibrated, not a fixed base+add-on; `/compliance` returns `passed`; banding bench-pinned.

### 9.2 Evolution B — Red Book ESG-compliance copilot for valuers (LLM tier 2)

**What.** A copilot that runs `/compliance` and explains the verdict — "your valuation is
`substantial` (82%) not `full` because two VPS4 items (quantified ESG adjustments, transition-risk
link) are non-compliant; VPG3 uncertainty is ±14%; here's the remediation and draft narrative" —
each figure from a tool call.

**How.** Three endpoints (`/compliance`, `/checklist`, `/materiality`) form a compact tool set; the
23-item checklist and materiality factors are the grounding corpus, so the copilot cites the exact
RICS/IVSC standard behind each item. The generated ESG narrative is a natural tier-2 output the
copilot refines. Cross-links to the real-estate valuation and CLVaR copilots for the underlying
figures. Node for a valuation/real-estate desk.

**Prerequisites.** Evolution A's `/compliance` fix is mandatory — a copilot narrating a
compliance verdict from a failing endpoint would fabricate; auto-assessment strengthens grounding.
**Acceptance:** every checklist item, compliance %, and uncertainty figure traces to a tool
response; the copilot distinguishes auto-assessed (evidence-backed) from caller-asserted items; it
cites the RICS standard per item and refuses to assert Red Book valuation sign-off (a valuer
judgement).