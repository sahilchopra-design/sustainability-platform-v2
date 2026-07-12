## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain — the engine header ("Climate Data & MRV Infrastructure Engine (E73)") is the methodology statement; nothing to reconcile.)*

### 7.1 What the module computes

`backend/services/mrv_engine.py` implements five function-level sub-modules for **measurement, reporting & verification (MRV) infrastructure assessment**, exposed via `api/v1/routes/mrv.py` (`POST /data-quality`, `/satellite-coverage`, `/improvement-plan`; `GET /ref/{tiers, uncertainty-tiers, satellite-platforms, verification-bodies, standards}`):

1. **`assess_mrv_tier`** — infers the entity's digital-MRV tier (1–5) from capability flags, maps it to ISO 14064-3 assurance level and IPCC tier, and produces a gap/upgrade list.
2. **`calculate_data_quality`** — per-source and tonnage-weighted portfolio uncertainty → PCAF-style DQS 1–5, plus CDP CDSB category compliance and an AI anomaly block.
3. **`verify_satellite_coverage`** — TROPOMI / GHGSat / Sentinel-5P / Carbon Mapper detectability, revisit geometry and cost for a facility.
4. **`score_verification_readiness`** — 8-criterion readiness score → achievable assurance level (ISO 14064-3 / ISAE 3410 / ISSA 5000) and verifier shortlist.
5. **`generate_mrv_improvement_plan`** — tier-upgrade roadmap with technology costs, timeline and uncertainty reduction.

The module header states an explicit **data-integrity policy**: "Every RETURNED metric is either a REAL computation … or an HONEST NULL … No entity metric is fabricated from a random draw"; class-average fallbacks are flagged `*_is_estimate = True`.

### 7.2 Parameterisation

**MRV tiers** (`MRV_TIERS` — platform's digital-MRV maturity ladder):

| Tier | Name | Typical uncertainty % | ISO 14064-3 level | IPCC tier | Upgrade cost ($) |
|---|---|---|---|---|---|
| 1 | Manual / Spreadsheet | 20–35 | limited | 1 | 20k–80k |
| 2 | Automated / ERP | 10–20 | limited | 2 | 80k–250k |
| 3 | Satellite-Augmented | 5–12 | reasonable | 2 | 150k–500k |
| 4 | AI-Enhanced | 2–7 | reasonable | 3 | 300k–900k |
| 5 | Blockchain-Attested | 1–4 | reasonable | 3 | 500k–2M |

**IPCC uncertainty tiers:** Tier1 default factors ±30%, Tier2 facility-specific ±15%, Tier3 direct measurement ±5% — a stylisation of IPCC 2006 Guidelines uncertainty guidance. **DQS mapping** (PCAF-style 1–5 by max uncertainty): 1 ≤ 5% "verified primary" · 2 ≤ 15% · 3 ≤ 25% · 4 ≤ 40% · 5 ≤ 60% "proxies/industry averages".

**Satellite platforms** (real mission facts, encoded): TROPOMI/Sentinel-5P (ESA, ~3.5–7 km resolution, daily revisit, open access, min facility 50–100 ha), GHGSat (25 m, 3-day, $2,000/pass, min 0.5 ha), Carbon Mapper/Tanager-1 (30 m, 3-day, min 1 ha). **Verification bodies:** 8 named firms (Bureau Veritas, SGS, DNV, KPMG, PwC, Deloitte, ERM CVS, South Pole) with accreditation tags. **Upgrade technologies:** CEMS $45k/point capex + $12k/yr (−15 pp uncertainty), IoT sensors $3.5k/point (−8), satellite subscription $25k/yr (−10), AI platform $60k/yr (−5), blockchain $40k/yr (−1.5), ERP $30k/yr (−7). Tier-step durations (`_TIER_STEP_DURATION_MONTHS`, "vendor deployment benchmarks"): →T2 6 mo, →T3 9, →T4 10, →T5 8.

### 7.3 Calculation walkthrough

**Tier inference:** blockchain+AI+satellite → 5; AI+satellite → 4; satellite → 3; ERP or IoT → 2; else 1. Uncertainty = caller's `measured_uncertainty_pct` if given, else tier-range midpoint flagged as estimate; `dqs_score` = first DQS level whose max ≥ uncertainty.

**Data quality:** per source, uncertainty = supplied value (clamped 1–70) or the IPCC-tier typical value (flagged estimate); portfolio uncertainty = Σ(unc × tCO₂e)/Σ tCO₂e; DQS from the mapping. Empty source list, missing CDP map or missing AI report each return explicit `insufficient_data` blocks. CDP compliance = disclosed categories / 5 × 100, `compliant` at ≥ 70%.

**Satellite coverage:** `detectable = size_ha ≥ platform_min`; `effective_revisit = nominal × (1 + |lat|/90 × 0.5)` (polar-orbit geometry proxy); `effective_coverage_days = 365/revisit × (1 − cloud/100)` only when cloud cover is supplied; annual cost = cost-per-pass × passes. Recommendation = detectable platform with finest resolution; the mapped "OGMP 2.0 level" is 5 for GHGSat/Carbon Mapper, 3 for TROPOMI, else 2.

**Verification readiness:** mean of the 0–10 scores actually supplied over 8 criteria (boundary docs, methodology disclosure, data management, QA/QC, scope-3 coverage, prior-year comparative, sign-off, verifier access). Assurance bands: ≥ 7.5 reasonable · ≥ 5.5 limited · < 5.5 none; unscored → `insufficient_data`. ISSA 5000 preparation = `met/24 × 100` (ready ≥ 80, nearly ≥ 60) only when a real count is supplied. Blocking issues = any scored criterion < 5.

**Improvement plan:** for each tier step, sum technology `capex×points + 3yr opex`; cumulative cost vs budget; uncertainty reduction = Σ technology improvements; timeline from the per-step months; ROI (payback = cost/uplift, 3-yr net benefit) only when `data_quality_uplift_usd_pa` is supplied.

### 7.4 Worked example — improvement plan, Tier 2 → 4, budget $600k

Defaults (1 point per technology):

| Step | Technologies | Cost (capex + 3yr opex) | Cum. cost | Months | Unc. reduction |
|---|---|---|---|---|---|
| 2→3 | satellite subscription (0 + 75k), CEMS (45k + 36k) | $156,000 | $156,000 | 9 | 25.0 pp |
| 3→4 | IoT sensors (3.5k + 2.4k), AI platform (0 + 180k) | $185,900 | $341,900 | +10 → 19 | 13.0 pp |

Totals: **$341,900** (within budget), 19 months, cumulative uncertainty reduction 38 pp (technology-sum basis). Headline endpoints use tier midpoints: current (T2) = 15.0%, target (T4) = 4.5% → reported `uncertainty_reduction_pct = 10.5` and both flagged `*_is_estimate = True`. With a supplied uplift of $150k/yr: payback = 341,900/150,000 ≈ **2.3 yrs**, 3-yr net benefit = 450,000 − 341,900 = **$108,100**. (Note the two uncertainty views coexist: the roadmap's additive technology improvements vs the tier-midpoint delta — the latter is the honest headline.)

### 7.5 Data provenance & limitations

- **No PRNG anywhere** — the module is the platform's exemplar of the insufficient-data contract: nulls with explanatory notes for missing CDP maps, AI reports, cloud cover, ISSA counts, readiness scores and ROI inputs; class-average fallbacks always flagged as estimates.
- Satellite specs are recognisable real-mission figures (TROPOMI 7×3.5 km pixels, daily global coverage; GHGSat ~25 m; Tanager-1 ~30 m) but simplified — e.g. detection limits expressed as single ppb numbers, and facility-size detectability thresholds are platform proxies for plume-rate detectability (real detectability depends on emission rate and wind, not hectares).
- The 5-level digital-MRV ladder (manual → ERP → satellite → AI → blockchain) is a platform maturity model, *not* an external standard; its per-tier uncertainty ranges and upgrade costs are vendor-benchmark-style calibrations.
- Uncertainty arithmetic is additive percentage-point bookkeeping, not error propagation (no quadrature combination per the IPCC uncertainty guidance it references).
- The DQS mapping borrows PCAF's 1–5 scale semantics but keys it to inventory uncertainty rather than PCAF's asset-class-specific data hierarchies.
- Verifier list and CDP category set are curated snapshots; ISSA 5000's "24 requirements" is a platform count for scoring, not an official enumeration.

### 7.6 Framework alignment

- **ISO 14064-3:2019:** verification/validation of GHG statements with limited vs reasonable assurance — mapped onto MRV tiers, with per-level documentation requirements returned by the tier assessor.
- **ISAE 3410:** assurance engagements on GHG statements; "reasonable assurance" equivalence is granted only at readiness ≥ 7.5, mirroring the higher-evidence bar of reasonable engagements.
- **ISSA 5000 (IAASB, 2024):** the new umbrella sustainability-assurance standard; the module scores preparation as a requirements-met percentage.
- **IPCC 2006 Guidelines (Tiers 1–3):** method-tier hierarchy (default factors → country/facility factors → direct measurement) drives per-source typical uncertainty.
- **PCAF Data Quality Score:** the 1–5 quality ladder (score 1 = verified primary data … 5 = proxy averages) is reused, keyed to uncertainty bands; in PCAF proper, DQS is defined per asset class on data-input hierarchy and averaged exposure-weighted — the tonnage-weighted portfolio DQS here is an analogue.
- **OGMP 2.0:** the site-vs-source measurement-level logic appears via the satellite recommendation's OGMP-level mapping (asset-level high-resolution monitoring → higher OGMP levels).
- **CDP / CDSB:** five-category disclosure checklist (materiality, management, performance, targets, verification) condensing the CDSB Framework application guidance.
