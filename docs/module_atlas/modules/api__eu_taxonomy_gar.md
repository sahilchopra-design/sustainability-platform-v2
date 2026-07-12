# Api::Eu_Taxonomy_Gar
**Module ID:** `api::eu_taxonomy_gar` · **Route:** `/api/v1/eu-taxonomy-gar` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/eu-taxonomy-gar/calculate-gar` | `calculate_gar` | api/v1/routes/eu_taxonomy_gar.py |
| POST | `/api/v1/eu-taxonomy-gar/assess-dnsh` | `assess_dnsh` | api/v1/routes/eu_taxonomy_gar.py |
| POST | `/api/v1/eu-taxonomy-gar/assess-min-safeguards` | `assess_min_safeguards` | api/v1/routes/eu_taxonomy_gar.py |
| POST | `/api/v1/eu-taxonomy-gar/calculate-gar/batch` | `calculate_gar_batch` | api/v1/routes/eu_taxonomy_gar.py |
| GET | `/api/v1/eu-taxonomy-gar/ref/asset-classes` | `ref_asset_classes` | api/v1/routes/eu_taxonomy_gar.py |
| GET | `/api/v1/eu-taxonomy-gar/ref/dnsh-objectives` | `ref_dnsh_objectives` | api/v1/routes/eu_taxonomy_gar.py |
| GET | `/api/v1/eu-taxonomy-gar/ref/min-safeguards` | `ref_min_safeguards` | api/v1/routes/eu_taxonomy_gar.py |
| GET | `/api/v1/eu-taxonomy-gar/ref/gar-phases` | `ref_gar_phases` | api/v1/routes/eu_taxonomy_gar.py |

### 2.3 Engine `eu_taxonomy_gar_engine` (services/eu_taxonomy_gar_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `DNSHAssessment.dict` |  |  |
| `MinSafeguardsAssessment.dict` |  |  |
| `GARResult.dict` |  |  |
| `EUTaxonomyGAREngine.assess_dnsh` | assets | Assess DNSH compliance for each asset. |
| `EUTaxonomyGAREngine.assess_min_safeguards` | entity_id, entity_name, ungc, oecd, ungp, ilo, udhr | Assess Minimum Safeguards compliance. |
| `EUTaxonomyGAREngine.calculate_gar` | entity_id, entity_name, reporting_year, assets | Calculate GAR, BTAR, and taxonomy alignment metrics. |
| `EUTaxonomyGAREngine.get_asset_classes` |  |  |
| `EUTaxonomyGAREngine.get_dnsh_objectives` |  |  |
| `EUTaxonomyGAREngine.get_min_safeguards` |  |  |
| `EUTaxonomyGAREngine.get_gar_phases` |  |  |
| `EUTaxonomyGAREngine.get_cross_framework` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/eu-taxonomy-gar/ref/asset-classes** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['financial_corporations_eq', 'financial_corporations_debt', 'non_financial_corporations_eq', 'non_financial_corporations_debt', 'project_finance', 'mortgages', 'auto_loans', 'home_renovation_loans', 'local_government_debt', 'sovereigns', 'derivatives'], 'n_keys': 11}`

**GET /api/v1/eu-taxonomy-gar/ref/cross-framework** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['csrd_esrs_e1', 'eu_gbs', 'sfdr_pai', 'mifid_spt', 'cbi'], 'n_keys': 5}`

**GET /api/v1/eu-taxonomy-gar/ref/dnsh-objectives** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['CCM', 'CCA', 'WMR', 'CE', 'PPE', 'BIO'], 'n_keys': 6}`

**GET /api/v1/eu-taxonomy-gar/ref/gar-phases** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['phase_1', 'phase_2'], 'n_keys': 2}`

**GET /api/v1/eu-taxonomy-gar/ref/min-safeguards** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['ungc', 'oecd_mne', 'ungp', 'ilo_core', 'udhr'], 'n_keys': 5}`

**POST /api/v1/eu-taxonomy-gar/assess-dnsh** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/eu-taxonomy-gar/assess-min-safeguards** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/eu-taxonomy-gar/calculate-gar** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `eu_taxonomy_gar_engine` — extracted transformation lines:**
```python
eligible_contribution = asset.total_exposure * asset.taxonomy_eligible_pct / 100
contribution = asset.total_exposure * asset.taxonomy_aligned_pct / 100
gar_pct = (gar_numerator / total_covered_assets * 100) if total_covered_assets > 0 else 0.0
btar_pct = (btar_numerator / btar_covered_assets * 100) if btar_covered_assets > 0 else 0.0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain — this deep dive is grounded solely in
`backend/services/eu_taxonomy_gar_engine.py` (E19) and `backend/api/v1/routes/eu_taxonomy_gar.py`.)*

### 7.1 What the domain computes

`EUTaxonomyGAREngine` implements the **Green Asset Ratio** family of Article 8 Delegated Act KPIs
for credit institutions, plus the two eligibility gates that condition the numerator:

```
GAR%  = Σ(exposure × aligned_pct/100  | gar_eligible ∧ DNSH_ok ∧ MS_ok)  / Σ(exposure | gar_eligible)  × 100
BTAR% = same numerator/denominator logic restricted to btar_eligible asset classes
eligible% = Σ(exposure × eligible_pct/100 | gar_eligible) / Σ(exposure | gar_eligible) × 100
BSAR% = 0.0   (explicit off-balance-sheet placeholder in code)
```

Three POST endpoints: `/calculate-gar` (portfolio of `AssetExposure` records → full `GARResult`),
`/assess-dnsh` (per-asset 6-objective DNSH check), `/assess-min-safeguards` (5-framework entity
check). Five GET reference endpoints expose the asset-class registry, DNSH objectives, minimum
safeguards, GAR phases, and a cross-framework map (CSRD ESRS E1, EU GBS, SFDR PAI 14, MiFID II,
CBI).

### 7.2 Parameterisation

**Asset-class registry** (11 classes, each with an Annex V article citation in code):

| Asset class | GAR | BTAR | Numerator condition (from code) |
|---|---|---|---|
| financial_corporations_eq / _debt | ✓ | ✗ | Taxonomy-aligned activities of the FC |
| non_financial_corporations_eq / _debt | ✓ | ✓ | Aligned turnover / capex / opex of NFC |
| project_finance | ✓ | ✓ | Project activity aligned per Delegated Act NACE |
| mortgages | ✓ | ✓ | EPC A/B or NZEB; CRREM pathway alignment |
| auto_loans | ✓ | ✓ | Electric/hydrogen vehicle; EURO 6d |
| home_renovation_loans | ✓ | ✓ | Primary energy demand improvement ≥ 30% |
| local_government_debt | ✓ | ✗ | Aligned capex/opex of issuer |
| sovereigns, derivatives | ✗ | ✗ | Excluded (Art 8 Del. Act §7) |

**DNSH objectives:** the 6 Taxonomy Regulation Art 17 objectives (CCM, CCA, WMR, CE, PPE, BIO).
An asset passes only if **all six** appear in its `dnsh_confirmed` list — a strict
attestation-completeness test, not a technical-screening evaluation.

**Minimum safeguards:** UNGC, OECD MNE Guidelines, UNGPs, ILO Core Conventions (all four
`blocking: True`) and UDHR (`blocking: False` — recorded but never blocks). Entity is compliant
iff all four blocking frameworks are attested.

**Phases:** Phase 1 (2022–23, eligibility disclosure) vs Phase 2 (2024+, full GAR/BTAR/BSAR
aligned-vs-eligible split) — reference data only, not applied conditionally in the calculator.

### 7.3 Calculation walkthrough

`/calculate-gar` first runs `assess_dnsh` over all assets, then loops: GAR-eligible exposures add
to the denominator and the eligibility-weighted sum; the aligned contribution
`exposure × aligned_pct/100` enters the numerator **only when the asset is both fully
DNSH-confirmed and minimum-safeguards-confirmed** — otherwise a named gap is recorded
("excluded from GAR numerator"). BTAR runs the same gate over the BTAR-eligible subset.
`taxonomy_aligned_pct` is defined identical to `gar_pct` ("Same calculation basis" per code
comment). Recommendations trigger on GAR < 10% ("below typical EU Green Deal ambition levels"),
any missing DNSH, and any missing safeguards. The result's `min_safeguards` dict is left empty —
the route wires the entity-level safeguards check as a separate endpoint.

### 7.4 Worked example — 4-asset bank book

| Asset | Class | Exposure €M | eligible% | aligned% | DNSH | MS |
|---|---|---|---|---|---|---|
| A1 | mortgages | 500 | 60 | 30 | all 6 ✓ | ✓ |
| A2 | non_financial_corporations_debt | 300 | 40 | 20 | 5 of 6 (BIO missing) | ✓ |
| A3 | auto_loans | 100 | 80 | 50 | all 6 ✓ | ✗ |
| A4 | sovereigns | 400 | — | — | — | — |

- Denominator: 500 + 300 + 100 = **€900M** (sovereign excluded — not GAR-eligible).
- Numerator: only A1 qualifies → 500 × 0.30 = **€150M** (A2 fails DNSH, A3 fails safeguards).
- **GAR = 150 / 900 = 16.67%**; eligible% = (500·0.6 + 300·0.4 + 100·0.8)/900 = 500/900 = 55.56%.
- BTAR: all of A1–A3 are BTAR-eligible → same 150/900 = **16.67%**; two gaps recorded (A2 DNSH,
  A3 safeguards); recommendation fires for each missing confirmation, not for GAR level
  (16.67% ≥ 10%).

### 7.5 DNSH & minimum-safeguards rubrics

- **DNSH:** pass/fail per objective is pure set membership against the caller's
  `dnsh_confirmed` list; `objectives_failed` generates one gap string per missing objective with
  the objective's description. No thresholds, no evidence scoring.
- **Safeguards:** `overall_compliant = ∧(UNGC, OECD, UNGP, ILO)`; UDHR non-compliance is reported
  in the payload but produces no blocking gap — matching the Platform on Sustainable Finance's
  reading that minimum safeguards rest on the four operative frameworks.

### 7.6 Data provenance & limitations

- No synthetic PRNG data; all outputs are deterministic functions of caller-supplied exposures
  and attestations. Asset-class metadata carries Annex V paragraph citations.
- **Denominator narrower than the Delegated Act:** the code's GAR denominator is
  Σ exposure over *GAR-eligible classes only*. Under the real Art 8 Delegated Act, the
  denominator is **total covered assets** — which *includes* exposures that can never enter the
  numerator (e.g. derivatives, exposures to non-NFRD undertakings), with only sovereigns/central
  banks excluded. Excluding derivatives from the denominator therefore **overstates GAR** versus
  a regulatory filing.
- DNSH/safeguards are attestation booleans; no technical screening criteria (e.g. the actual
  EPC/NZEB test for mortgages or the 30% PED test for renovation loans named in the registry) are
  computed anywhere.
- BSAR hardcoded 0.0; Phase 1/Phase 2 distinction not enforced; no trading-book or fees KPI; no
  turnover-vs-capex dual GAR (the Delegated Act requires both stocks views).
- The GAR < 10% recommendation threshold is a synthetic heuristic (average reported bank GARs in
  the first 2024 disclosure round were low single digits).

### 7.7 Framework alignment

- **Art 8 Delegated Act (Reg. 2021/2178 as amended)** — the GAR/BTAR/BSAR KPI family, Annex V
  asset-class treatment, and §7 sovereign/derivative exclusions; the module reproduces the
  numerator gating (aligned + DNSH + safeguards) with the denominator caveat above.
- **Taxonomy Regulation 2020/852** — Art 3 alignment conditions (substantial contribution +
  DNSH Art 17 + minimum safeguards Art 18); the module implements the latter two as gates and
  takes substantial contribution as the caller's `taxonomy_aligned_pct`.
- **Minimum safeguards (Art 18)** — assessed against UNGC / OECD MNE / UNGP / ILO, matching the
  Platform on Sustainable Finance's October 2022 report on how safeguards compliance is
  evidenced (controversy-free conduct + due-diligence processes).
- **CRREM / EPC** — named in the mortgage numerator condition as the alignment evidence route
  (EPC A/B, NZEB, or CRREM decarbonisation pathway) but not calculated here.
- **Cross-framework map** — documents that SFDR PAI 14 and MiFID II sustainability-preference
  Category A both consume the taxonomy-alignment % that this engine produces.

## 9 · Future Evolution

### 9.1 Evolution A — Correct the GAR denominator and compute technical screening criteria (analytics ladder: rung 1 → 3)

**What.** The Green Asset Ratio engine (E19) — Art 8 Delegated Act GAR/BTAR KPIs for banks, gated by
DNSH and minimum-safeguards checks. Deterministic, no PRNG, with Annex V article citations. §7.6 names
a real **correctness gap**: the code's GAR denominator is Σ exposure over *GAR-eligible classes only*,
but the real Art 8 Delegated Act denominator is **total covered assets** (including exposures that can
never enter the numerator — derivatives, non-NFRD undertakings — with only sovereigns/central banks
excluded), so **excluding derivatives from the denominator overstates GAR** versus a regulatory filing.
Also: DNSH/safeguards are **attestation booleans** with no technical-screening-criteria computation
(the actual EPC/NZEB test for mortgages, the 30% PED test for renovation loans named in the registry
are never computed); BSAR is hardcoded 0.0; there's no turnover-vs-capex dual GAR (the DA requires both
stock views). Evolution A corrects the denominator, computes real technical screening criteria, and
adds the dual GAR.

**How.** `calculate_gar` uses total covered assets (excluding only sovereigns/central banks) as the
denominator per the DA; the mortgage/renovation/auto numerator conditions compute the actual TSC (EPC
band, ≥30% PED improvement, EURO-6d/BEV) against asset attributes rather than trusting a `dnsh_confirmed`
attestation; the turnover-based and capex-based GAR are both reported; BSAR is implemented. Rung 3:
DNSH cross-checks against the `esrs_e2_e5` and physical-risk engines rather than a boolean.

**Prerequisites (hard).** Fix the harness failures — §4.2 shows `POST /calculate-gar`, `/assess-dnsh`,
`/assess-min-safeguards` all **failed** (need input payloads to trace); the denominator narrowing is a
correctness fix that changes reported GAR. **Acceptance:** the §7.4 worked example (GAR 16.67% on the
narrow denominator) is recomputed on the correct total-covered-assets denominator (lower, as derivatives
enter it); the mortgage numerator computes the EPC/NZEB TSC rather than trusting an attestation; both
turnover and capex GAR are returned; the failing endpoints pass the harness.

### 9.2 Evolution B — Taxonomy-GAR compliance copilot with tool-called calculation (LLM tier 2)

**What.** A copilot for bank disclosure teams: "compute our Green Asset Ratio and BTAR" (`/calculate-gar`
→ GAR/BTAR/eligible %, per-asset numerator gating, gaps), "assess DNSH for these assets" (`/assess-dnsh`
→ 6-objective pass/fail with descriptions), and "check our minimum safeguards" (`/assess-min-safeguards`
→ UNGC/OECD/UNGP/ILO gates) — narrating real KPI output and the exclusion reasons (which assets failed
DNSH or safeguards and dropped from the numerator).

**How.** Tool schemas over the 4 POST + 4 GET operations; the reference endpoints (asset classes with
Annex V citations, DNSH objectives, minimum safeguards, GAR phases, cross-framework map) are exceptional
RAG grounding for "which asset classes are BTAR-eligible?" or "what are the Art 18 safeguards?"
questions. The no-fabrication validator checks every GAR %, exposure and gate against tool output; the
copilot must flag the documented denominator caveat (GAR overstated vs a regulatory filing) until
Evolution A, and that DNSH/safeguards are attestations not computed TSC. Composable with `eba_pillar3`,
`ecl_gar_pillar3` and `eu_gbs` in a regulatory-disclosure desk.

**Prerequisites.** Evolution A's denominator fix and harness fixes (so narrated GAR is regulation-
faithful); Atlas + reference corpus embedded (roadmap D3). **Acceptance:** every figure/citation traces
to an engine tool call; the GAR matches `/calculate-gar`; the copilot explains why each excluded asset
dropped from the numerator; the denominator caveat is surfaced pre-Evolution A and resolved post.