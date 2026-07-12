## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain — the engine header ("E58: Methane & Fugitive Emissions Engine") is the methodology narrative; nothing to reconcile.)*

### 7.1 What the module computes

`backend/services/methane_fugitive_engine.py` implements seven function-level sub-modules, five of which are wired through `api/v1/routes/methane_fugitive.py` (`POST /gwp-impact`, `/eu-regulation`, `/methane-intensity`, `/abatement-curve`, `/ldar-compliance`; `GET /ref/{gwp-values, ogmp-levels, eu-methane-timeline}`):

1. **GWP impact** — CH₄/N₂O tonnage → CO₂e under GWP-100 vs GWP-20.
2. **EU Methane Regulation 2024/1787 assessment** — scope, LDAR frequency, venting/flaring status, attestation-based compliance score, €250/t excess-emission penalty risk.
3. **OGMP 2.0 level assessment** — current level 1–5, gap to EU minimums (L3 by 2026, L4 by 2028), uplift actions.
4. **Super-emitter detection** — per-facility flags vs UNEP IMEO thresholds, remediation priorities.
5. **Methane abatement curve** — sector-filtered MACC with capex, commodity-recovery and carbon-value economics.
6. **LDAR compliance** — inspection cadence vs EPA OOOOa/OOOOb quarterly rule, detection-method adequacy.
7. **Methane intensity** — intensity vs sector benchmark and the 0.2% UNEP/Global-Methane-Pledge target.

### 7.2 Parameterisation

**GWP values** (cited in-code to IPCC AR6 WG1 Table 7.SM.7 — these are the AR6 fossil-CH₄ values): GWP-100 CH₄ = 29.8, N₂O = 273; GWP-20 CH₄ = 82.5, N₂O ≈ 273.

**Thresholds & constants:** super-emitter > 100 t CH₄/event **or** > 10 kg/hr continuous; IMEO satellite detectability 25 t/hr; EU penalty €250/t excess methane; venting prohibition years oil_gas 2025, coal 2027; EU OGMP minimums L3 (2026), L4 (2028); LDAR required frequency 90 days ("quarterly as conservative default", EPA OOOOa/OOOOb).

**Sector intensity benchmarks** (with in-code source strings): oil 0.08 m³CH₄/boe ("IEA best-in-class 2023"), gas 0.10% of gas produced ("UNEP Global Methane Pledge target 0.2%"), coal 5.5 m³CH₄/t, oil_gas 0.09, upstream 0.12%, midstream 0.08%; unknown sector → (0.15, "fraction", "IEA 2023").

**Abatement measures** (8-row MACC, "published IEA MACC ranges" per docstring — cost $/tCH₄ lo–hi, potential % of total CH₄, payback yrs): flare capture −20–0 / 8% / 1.5y · LDAR −5–20 / 20% / 2.5y · pneumatic replacement 0–10 / 15% / 3y · compressor seals 10–30 / 12% / 4.5y · venting reduction 5–15 / 18% / 3.5y · pipeline repair 15–45 / 10% / 6y · coal-mine recovery 5–25 / 22% / 4y · pre-drainage 20–50 / 15% / 5.5y. **Detection-method leak rates:** continuous monitoring 0.15%, drone-OGI 0.2%, OGI 0.3%, satellite 0.5%, portable 0.8%, AVO 1.5%.

### 7.3 Calculation walkthrough

**GWP:** `kt CO₂e = kt gas × GWP`; `short_term_ratio = GWP20_total / GWP100_total` (≈ 2.77 for pure CH₄). *(The `significance_flag` compares GWP-20 to 10% of GWP-100 — always true for any CH₄ > 0, so it is effectively a constant.)*

**EU regulation:** scope = sector in {oil, gas, coal, up/mid/downstream} or substring match. Per docstring, operational compliance is "FACTS about the entity" — statuses come from caller `compliance_attestations`; unattested items are `None`/insufficient_data and **excluded** from `compliance_score = met/assessed × 100`. Venting is auto-`True` only while the prohibition year is in the future. Penalty = `max(0, emissions − allowance) × €250`, only when an allowance is supplied.

**OGMP:** decision ladder — third-party-verified + source-level → L5; source-level + direct measurement → L4; partial → L3; source-level only → L2; else L1. Gap and uplift actions derive from EU minimums.

**Super-emitters:** `kg/hr = t_pa × 1000 / 8760`; facilities without `ch4_t_pa` get null metrics (never invented). Portfolio `satellite_detection_probability = 1 − Π(1 − pᵢ)` over measured facilities, with per-facility `p = min(0.95, kg_hr / 25,000 × 0.8)`. Regulatory risk bands on super-emitter CH₄ total: > 1000 t Critical, > 200 High, > 50 Medium. *(Note: the per-facility `satellite_detectable` compares kg/hr to 25,000 kg/hr — i.e. 25 t/hr as coded — an extremely high bar; nearly all annualised facilities are below it.)*

**Abatement curve:** cost per measure = range **midpoint** (docstring: "no random jitter"); `potential_t = total_CH₄ × potential% `; capex = max(0, cost × potential); revenue/carbon value only with caller-supplied prices (`carbon_value = potential_t × 29.8 × carbon_price`, reported ÷1000); total potential capped at 75%; zero-cost share = potential from measures with midpoint cost ≤ 0.

**LDAR:** `overdue = max(0, ⌊days_since/90⌋ − 1)`; adequate methods = {OGI, drone-OGI, continuous}; status Compliant / Partially Compliant / Non-Compliant.

**Intensity:** `intensity = CH₄_t / production`; performance tiers vs benchmark: ≤ benchmark Best-in-Class; gap < 0.5× Above Average; < 1× Average; < 2× Below Average; else Laggard. `abatement_to_target = max(0, CH₄ − production × 0.002)` (UNEP 0.2% target).

### 7.4 Worked example — abatement curve, upstream operator, 12 kt CH₄/yr, carbon price $80/tCO₂e

Total CH₄ = 12,000 t. Sector `upstream` matches four measures:

| Measure | Cost mid ($/t) | Potential (t) | Capex ($) | Carbon value ($) |
|---|---|---|---|---|
| Flare capture | −10 | 960 | 0 | 960 × 29.8 × 80 / 1000 ≈ **2,289k** |
| LDAR | 7.5 | 2,400 | 18,000 | ≈ 5,722k |
| Pneumatic replacement | 5 | 1,800 | 9,000 | ≈ 4,291k |
| Venting reduction | 10 | 2,160 | 21,600 | ≈ 5,149k |

Totals: potential 7,320 t = 61% of emissions (< 75% cap); capex $48,600; zero-cost share 8% (flare capture only); carbon value ≈ $17.45M → `net_cost ≈ −$17.4M` (deeply NPV-positive at $80/t) and payback ≈ 48,600 / 17.45M ≈ **0.0 yrs**. GWP cross-check: 12 kt CH₄ = 357.6 kt CO₂e (GWP-100) vs 990 kt CO₂e (GWP-20), short-term ratio 2.768.

### 7.5 Data provenance & limitations

- **No PRNG** — the engine is explicitly refactored to remove jitter ("range midpoint is used, no random jitter") and refuses to fabricate entity facts (attestations, facility measurements, market prices → `insufficient_data`).
- GWP constants are genuine AR6 values; thresholds (100 t / 10 kg-hr super-emitter, €250/t penalty, L3/L4 timeline) are stated as EU-Methane-Regulation-derived but are simplified single numbers for a regulation whose implementing acts are still being finalised — treat the timeline map as indicative.
- Known code quirks a reader should not mistake for methodology: the GWP `significance_flag` is tautological; `satellite_detectable` uses a 25 t/hr bar expressed in kg/hr that annualised facility totals essentially never reach; `intensity_target`/`gap_to_target_pct` mix units (0.2% is a share of *gas produced*, applied here to arbitrary production units); abatement `payback` divides capex by carbon value + 1 rather than by annual net savings.
- MACC costs/potentials are IEA-style ranges but embedded, not live IEA Methane Tracker data; measure potentials are additive shares of total CH₄ (no interaction effects), hence the 75% cap.
- LDAR uses a single 90-day cadence; real OOOOb frequencies vary by facility type and emissions.

### 7.6 Framework alignment

- **EU Methane Regulation 2024/1787:** in-scope-sector definition, EMTS-style reporting, LDAR (Arts 14–18 cited), routine venting/flaring prohibitions with the 2025/2027 dates, super-emitter notification (Art. 19 cited) and an excess-emissions penalty mechanism — the module encodes each as a checkable requirement; the €250/t figure is a platform parameter (the regulation leaves penalties to member states).
- **OGMP 2.0 (UNEP):** the real framework's 5 reporting levels — from company-level emission factors (L1) up to source-level measurement reconciled with site-level measurement and third-party verification (L5) — are reproduced in `OGMP_LEVEL_DESCRIPTIONS` and drive the ladder logic.
- **IPCC AR6 WG1:** GWP-100/GWP-20 characterisation factors, correctly showing methane's ~2.8× near-term forcing multiple.
- **EPA 40 CFR 60 OOOOa/OOOOb:** quarterly OGI-based LDAR as the US benchmark cadence.
- **UNEP IMEO / IEA Methane Tracker / Global Methane Pledge:** satellite detection thresholds, best-in-class intensity benchmarks, and the 0.2%-of-production intensity target used as the abatement goalpost.
