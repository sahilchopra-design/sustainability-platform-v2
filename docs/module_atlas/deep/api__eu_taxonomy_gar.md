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
