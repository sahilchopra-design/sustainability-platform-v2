## 7 · Methodology Deep Dive

### 7.1 What the module computes

`/api/v1/eba-pillar3` wraps the **EBA Pillar 3 ESG Disclosures Engine** ("E20",
`backend/services/eba_pillar3_engine.py`), which scores an institution's compliance with the EBA's
ESG Pillar 3 framework (code header: "EBA GL/2022/03 + CRR Art 449a, 10 Templates"). It is a
**completeness/assessment engine, not a simulator**: an in-code comment states "These are BINDING
regulatory disclosures — every figure must come from real portfolio data, never a random draw.
When an input is absent we emit an honest null + an `insufficient_data` warning rather than
fabricating a plausible number." Headline outputs:

```
compliance_score      = completed_mandatory / max(len(mandatory), 1) × 100
fe.total_tco2e        = Σ_sector financed_emissions[s]           (or exposure_bn×1000 × EF[s])
fe.intensity          = total_tco2e / max(total_assets_bn × 1000, 1)      [tCO₂e/€M]
portfolio_phys_score  = mean_over_sectors( mean_over_hazards(score) ) × 10
taxonomy_aligned_bn   = total_assets_bn × gar_pct / 100
```

### 7.2 Parameterisation

**Institution-type template obligations** (`INSTITUTION_TYPES`):

| Type | Min assets | Mandatory templates |
|---|---|---|
| G-SII | €300bn | T1–T10 (all) |
| O-SII | €30bn | T1–T8 |
| Other | — | T1, T3, T7 |

**Template register** (`TEMPLATES`): T1 Physical Climate Risk Heatmap, T2 Non-Financial KPIs,
T3 Carbon-Related Assets, T4 Climate Risk Exposure, T5 Mitigation Actions, T6 Green Asset Ratio
(all effective Jun-2022); T7 Financed Emissions, T8 Scope 1/2 Taxonomy-Eligible Assets (Jun-2023);
T9 Banking Book BTAR, T10 Taxonomy KPIs (optional, Jun-2024). `GET /ref/regulatory-timeline`
restates these effectivity dates against CRR Art. 449a (effective 2022-06-28, large institutions
> €30bn, annual frequency).

**Axes**: 15 NACE codes (A01…L68) and 8 climate hazards (heat_stress, cold_wave, drought,
wildfire, coastal_flood, riverine_flood, wind_storm, sea_level_rise) — the T1 matrix dimensions.

**Thresholds**: high-risk sector if mean hazard score > 0.6 (assess path) / > 0.55 (standalone
heatmap path); recommendation triggers at compliance < 80, intensity > 2,000 tCO₂e/€M
("exceeds sector peer median" — an unsourced heuristic), carbon-related assets > 20%.

### 7.3 Calculation walkthrough

`POST /assess` takes entity metadata, `templates_submitted`, and an optional `portfolio_data` dict:

1. **Compliance score** — pure set arithmetic: mandatory templates for the institution type minus
   those submitted; score = completed/mandatory × 100. Per-template scores use caller-supplied
   `template_scores` if present, else 100.0 if submitted, 0.0 if mandatory-and-missing.
2. **T1 heatmap** — requires caller `hazard_scores` (per NACE × hazard, 0–1). Matrix rows are
   rounded to 3 dp; portfolio score = mean of sector means × 10 (0–10 scale). Missing →
   `portfolio_physical_risk_score = None` + warning.
3. **T7 financed emissions** — uses caller `financed_emissions_by_sector` directly, or derives
   PCAF-style `exposure_bn × 1,000 × EF[s]` (i.e. €M × tCO₂e/€M) when `nace_exposure` and
   `sector_emission_factors` are both supplied. Intensity divides by total assets in €M. YoY change
   and PCAF weighted DQS only if `prior_year_tco2e` / `pcaf_dqs_weighted` supplied; else `None`.
4. **T3/T6/T10** — pass-through with rounding: `carbon_related_assets_pct`, `gar_pct` (and derived
   aligned €bn), `btar_pct`, `taxonomy_by_objective`; each absent input yields `None` + warning.

`POST /template-completeness` returns mandatory/completed counts, missing list, completeness %,
and a submitted/missing status per template. `POST /physical-risk-heatmap` — note: the route only
forwards `portfolio_nace_exposure` and never passes `hazard_scores`, so via this endpoint the
hazard matrix is always empty and the score `None`; only exposures are echoed. The full heatmap is
reachable through `/assess` with `portfolio_data.hazard_scores`.

### 7.4 Worked example

O-SII bank, €150bn assets, submits T1–T6 (mandatory set is T1–T8):

| Step | Computation | Result |
|---|---|---|
| Mandatory | T1…T8 | 8 templates |
| Missing | T7, T8 | 2 |
| Compliance score | (8−2)/8 × 100 | **75.0** → recommendation fires (< 80) |

With `nace_exposure = {"D35": 12.0}` (€bn) and `sector_emission_factors = {"D35": 450}` (tCO₂e/€M):

| Step | Computation | Result |
|---|---|---|
| T7 by-sector | 12.0 × 1,000 × 450 | 5,400,000 tCO₂e |
| Intensity | 5,400,000 / (150 × 1,000) | **36.0 tCO₂e/€M** |
| Intensity trigger | 36.0 > 2,000? | No — no recommendation |

With hazard scores D35 = {flood 0.8, heat 0.7, others 0.5×6}: sector mean = (0.8+0.7+3.0)/8 =
0.5625 < 0.6 → not high-risk; portfolio score = 0.5625 × 10 = **5.63**.

### 7.5 Data provenance & limitations

- **No synthetic data and no PRNG anywhere in this engine** — a deliberate design choice
  documented in code comments (post-remediation of the platform's random-as-data findings).
  All quantitative content is caller-supplied or honestly `None`.
- Template scoring is **presence-based**, not content-based: a submitted template scores 100
  regardless of its cell-level quality unless the caller supplies its own `template_scores`.
  Real EBA supervision reviews cell-level completeness against the ITS annexes.
- The T7 derivation is a single-factor PCAF proxy (exposure × sector EF) with no attribution
  factor (outstanding/EVIC) — production PCAF requires borrower-level attribution and data-quality
  scoring per asset class.
- The standalone heatmap endpoint cannot receive hazard scores (route omission), limiting T1 to
  exposure display; `assessment_id` hardcodes a "-2024" suffix and `next_disclosure_date` is fixed
  at 2025-06-30.
- The 15-sector NACE list and 8-hazard list are abridged versions of the full NACE Rev.2 and the
  EU Taxonomy Annex climate hazard taxonomy (which has 28 hazards in 4 families).

### 7.6 Framework alignment

- **EBA ITS on Pillar 3 ESG disclosures (EBA/ITS/2022/01, adopted via GL/2022/03 language in
  code) + CRR Art. 449a:** the 10-template register, institution scoping (> €30bn), and phased
  effectivity (Jun-2022 core, Jun-2023 financed emissions, Jun-2024 BTAR) mirror the real ITS
  timeline. Real ITS templates are numbered Templates 1–10 with the same themes (physical risk,
  transition risk banking book, GAR, BTAR, mitigating actions).
- **EU Taxonomy / Disclosures Delegated Act (Art. 8):** GAR = taxonomy-aligned covered assets ÷
  total covered assets — here accepted as a caller-supplied percentage and converted to €bn;
  BTAR (banking-book taxonomy alignment ratio) additionally counts non-NFRD counterparties.
- **PCAF Global GHG Standard:** financed emissions = Σ attribution × emissions, with a 1–5 data
  quality score; the module approximates via sector emission factors and passes through a
  caller-supplied weighted DQS.
- **CSRD/ESRS adjacency:** the T2 non-financial KPI template aligns with ESRS E1 metrics but is
  not computed here.
