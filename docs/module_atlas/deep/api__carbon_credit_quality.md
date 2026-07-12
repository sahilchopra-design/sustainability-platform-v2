## 7 · Methodology Deep Dive

Grounded in `backend/services/carbon_credit_quality_engine.py` (routes:
`api/v1/routes/carbon_credit_quality.py`). A voluntary-carbon-market integrity engine that scores
credits against ICVCM Core Carbon Principles, checks CORSIA eligibility, grades project quality,
and rolls single-project scores into a volume-weighted portfolio view.

### 7.1 What the domain computes

Three calculators plus five reference-data getters:

- **`check_ccp_eligibility`** — runs each of the 10 ICVCM CCPs through a standard-based heuristic
  (pass / partial / fail), then `ccp_eligible = (passed ≥ 8) and standard ∈ high-integrity set`.
- **`score_project`** — an additive quality rubric on a 0–100 scale (base 70) producing a letter
  grade A–D, a price range, permanence/additionality/double-counting risk flags, and issue list.
- **`score_portfolio`** — volume-weighted average quality, CCP-labelled %, CORSIA-eligible %, and
  grade distribution across a list of projects.

```
quality = 70
        + 10 (standard is CCP-label-eligible)
        + 10 (ccp_eligible)
        + 5  (vintage ≥ 2020)   OR  − 15 (vintage < 2015)
        − 10 (permanence risk_score > 0.6)
        − 10 (CDM and vintage < 2015)
        + (confidence − 0.5)·10   [only if verification_confidence supplied]
        clamped to [0, 100]
```

### 7.2 Parameterisation (all cited to standards)

**Standards** (8): VCS v4.0, Gold Standard v4.3, CDM (legacy), Art6 ITMO, ICVCM CCP label, Plan
Vivo, ACR v13, CAR — each with `corsia_eligible` and `ccp_label_eligible` flags. CDM and Plan
Vivo are the only two flagged CORSIA- and CCP-ineligible.

**ICVCM 10 Core Carbon Principles** with assessment level:

| Level | CCPs |
|---|---|
| Programme | CCP-1 Governance · CCP-2 Tracking · CCP-3 Transparency · CCP-4 Third-party V&V · CCP-10 Transition to Net Zero |
| Category | CCP-5 Additionality · CCP-6 Permanence · CCP-7 Robust Quantification · CCP-8 No Double Counting · CCP-9 SD Co-benefits |

**Permanence risk by project type** (risk_score, level): soil_carbon 0.80 very_high ·
afforestation/reforestation 0.70 high · redd_plus 0.60 high · blue_carbon 0.50 high ·
improved_cookstoves 0.20 low · renewable/methane/industrial 0.10 very_low · direct_air_capture
0.05 very_low. Each carries a real-world mitigation note (buffer pools 10–30%, monitoring cycles).

**Price benchmarks** ($/tCO₂): avoidance 2–15 (median 7) · nature-based removal 15–60 (median 28)
· tech removal 100–500 (median 200); CCP label premium 20–30% over unlabelled. 20 methodologies
(VM0015 REDD+, VM0033 blue carbon, ACM0002 renewables, ART_TREES, DAC pilot…) mapped to standard
+ project type.

**CORSIA phase 2024–2026**: eligible programmes VCS/GS/ACR/CAR/Art6 ITMO, vintage ≥ 2016; CDM
explicitly excluded.

### 7.3 Calculation walkthrough

- **CCP heuristic:** high-integrity standards auto-pass CCP-1..4; CCP-6 downgrades to "partial"
  when the project type's permanence risk_score > 0.7; CCP-8 fails for CDM; everything else
  passes. CDM standards get "partial" on all except CCP-2/3. `ccp_eligible` needs ≥ 8 passes AND
  membership of the high-integrity set — so CDM can never be CCP-eligible regardless of count.
- **Grade bands:** A ≥ 85, B ≥ 70, C ≥ 55, else D.
- **Price:** benchmark selected by project type (DAC → tech; renewables/cookstoves/methane/
  industrial → avoidance; else nature-based); a `1.20×` CCP premium multiplier applies to min/max
  when CCP-eligible.
- **Risk flags:** additionality low if (VCS/GS and vintage ≥ 2018), high if vintage < 2015, else
  medium; double-counting high for CDM, low for Art6 ITMO, else medium.
- **`verification_confidence`** is optional caller input in [0,1]; the inline comment records that
  it *replaced a fabricated random ±5 jitter* — 0.5 is neutral, and absent means no perturbation.
- **Portfolio:** `weighted_quality = Σ(score·volume)/Σ volume`; CCP% and CORSIA% are
  volume-weighted eligibility shares.

### 7.4 Worked example (VCS REDD+ project, vintage 2021)

`standard=vcs`, `methodology=VM0015`, `project_type=redd_plus` (risk 0.60), vintage 2021,
no verification_confidence:

CCP check: VCS auto-passes CCP-1..4; CCP-6 stays "pass" (0.60 ≤ 0.70); CCP-8 not CDM → pass; all
10 pass → passed = 10 ≥ 8 and VCS in set → **ccp_eligible = True**.

| Rubric step | Δ | Running |
|---|---|---|
| Base | | 70 |
| CCP-label-eligible standard | +10 | 80 |
| ccp_eligible | +10 | 90 |
| Vintage 2021 ≥ 2020 | +5 | 95 |
| Permanence 0.60 (not > 0.6) | 0 | 95 |
| **Quality score** | | **95.0 → grade A** |

Price: nature-based removal 15–60, ×1.20 CCP premium → **$18–$72/t**. Additionality = low
(VCS & 2021 ≥ 2018); double-counting = medium. Issues: none triggered.

Contrast a CDM cookstove, vintage 2013: base 70 − 15 (pre-2015) − 10 (CDM pre-2015) = 45, not
CCP-eligible, so no further bonuses → grade D, issues flag CDM/CORSIA-ineligibility and pre-2015
over-crediting.

### 7.5 Data provenance & limitations

- **No synthetic/PRNG data.** The only stochastic element (a random ±5 score jitter) was removed
  and replaced by the optional deterministic `verification_confidence` input, per inline comment —
  a documented de-fabrication.
- The CCP "assessment" is a **standard-level heuristic**, not a real ICVCM assessment: it infers
  pass/fail from which standard issued the credit and the project type's generic permanence risk.
  It does not evaluate the specific methodology, project design document, or category-level ICVCM
  decisions. Consequently every credit from a high-integrity standard tends to score CCP-eligible.
- Quality weights (+10/+5/−15 etc.) and grade cut-points are house conventions, not from any
  standard; the additive design means the practical range is roughly 45–95.
- Price benchmarks are static point-in-time market ranges (2023-era), not live quotes.
- Portfolio defaults (standard=vcs, methodology=VM0015, redd_plus, 1000 tCO₂e) fill missing
  fields — demo conveniences, not real data.

### 7.6 Framework alignment

- **ICVCM Core Carbon Principles (CCP Assessment Framework v2.0, 2023)** — real ICVCM assessment
  is two-tier: **programme-level** (CCP-1..4, 10: governance, tracking, transparency, independent
  V&V, net-zero transition) approves a whole programme (e.g. Verra), then **category-level**
  (CCP-5..9: additionality, permanence, robust quantification, no double counting, SD co-benefits)
  approves a methodology category before credits earn the CCP label. The engine encodes the level
  split and the pass threshold but substitutes a standard-based heuristic for the multi-criteria
  scorecard ICVCM actually applies.
- **Verra VCS v4.0 / Gold Standard v4.3 / ACR / CAR / Plan Vivo / CDM** — standard registry
  metadata and CORSIA/CCP eligibility flags.
- **Paris Agreement Article 6** — ITMOs require corresponding adjustments; reflected in the
  low double-counting risk for Art6 and the CCP-8 logic.
- **ICAO CORSIA (Doc 9501, 2023 cycle)** — eligible-programme list and vintage ≥ 2016 requirement;
  CDM correctly excluded from Phase 2.
- **VCMI Claims Code of Practice (2023)** — non-CCP credits flagged as possibly failing VCMI
  requirements, the intended integrity linkage.
