## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain — the engine header ("E77 Nature Capital Accounting") is the methodology statement; nothing to reconcile.)*

### 7.1 What the module computes

`backend/services/nature_capital_engine.py` implements five functions spanning **SEEA-EA natural-capital accounting, TEEB benefit-transfer valuation, ENCORE dependency scoring and multi-framework disclosure assessment**, exposed via `api/v1/routes/nature_capital.py` (`POST /assess`, `/dependency-score`, `/balance-sheet`; `GET /ref/{biome-values, ecosystem-types, encore-services, seea-accounts, tnfd-disclosures}`):

1. **`assess_natural_capital`** — one ecosystem asset: monetary value = biome unit value × condition × extent, plus TNFD dependency/impact, MSA and GBF Target-15 pass-throughs.
2. **`valuate_ecosystem_services`** — service-level benefit transfer with equal intra-category allocation.
3. **`calculate_dependency_score`** — ENCORE-style sector dependency lookup + TNFD LEAP scaffold.
4. **`score_natural_capital_disclosure`** — evidence-driven completeness across TNFD/SEEA/GRI 304/ESRS E4/GBF-T15 with a renormalised composite.
5. **`generate_nature_balance_sheet`** — SEEA EA opening/closing stock accounts (capitalised at 10× annual flow) with an integrated-P&L block.

### 7.2 Parameterisation

**Biome unit values** (`BIOME_UNIT_VALUES`, USD/ha/yr, per-row source strings citing TEEB 2010 / Costanza et al. 2014 / De Groot et al. / IPBES 2019 — "conservative estimates from academic literature"), 19 biomes split provisioning/regulating/cultural. Extremes: coral reef $352,249 · mangrove $33,750 · coastal wetland $28,916 · seagrass $19,004 … desert $43. These magnitudes track the published Costanza/de-Groot ecosystem-service value syntheses (coral reefs ≈ $350k/ha/yr in 2011-USD updates). Unknown ecosystem types fall back to `temperate_forest` ($3,137).

**ENCORE services:** 49 encoded services (20 provisioning ES-P, 23 regulating ES-R, 6 cultural ES-C) with sector-dependency tags — a condensation of ENCORE's published service taxonomy (header claims the 62-service framing). **Sector dependency matrix** (12 sectors, "simplified, 58 sectors → 12 illustrative"): forestry 0.95/55% revenue-at-risk, agriculture 0.92/45%, fishing 0.90/60%, food & beverage 0.88/38% … manufacturing 0.50/15%. **TNFD:** the 14 recommended disclosures across the four pillars (G1-2, S1-4, RM1-3, MT1-4 + LEAP). **Disclosure composite weights:** TNFD 0.35 · SEEA 0.20 · ESRS E4 0.20 · GRI 304 0.15 · GBF-T15 0.10 (platform convention), renormalised over frameworks with evidence. **WAVES metadata:** 4% discount rate; NPV factor 17.3 (≈ 30-yr annuity at 4%); balance-sheet capitalisation multiple **10×** annual flow.

**Data-integrity contract** (docstrings): condition, dependency/impact, MSA, GBF flags, revenue, evidence and restoration investment are entity inputs — absent inputs yield honest nulls with `data_notes`; helpers `_bool_evidence_score` and `_weighted_present_mean` score only over supplied evidence "so absence of data can never be reported as a 0%".

### 7.3 Calculation walkthrough

**Asset assessment:** `monetary_value = total_usd_ha_yr × condition × extent_ha`; per-category flows scale the same way. SEEA account label: EA-4 (monetary) when condition known, else EA-2 (condition account still to populate).

**Service valuation:** each selected service is priced `category_unit_value / n_selected_in_category × condition`; total flow = Σ over services × extent; NPV₃₀ = flow × 17.3. Confidence: `reference_state` when condition unsupplied (multiplier 1.0), else medium (> 0.75) / low.

**Dependency score:** reference lookups (score, key services, revenue-at-risk %); `revenue_at_risk_usd = revenue × pct/100` only with real revenue; LEAP L/E/A/P scaffold populated from thresholds (supply-chain exposure high if score > 0.75; impact drivers expand if > 0.7), with the Assess step's risk magnitudes explicitly `insufficient_data`. A stylised 2030 nature-loss scenario scales revenue-at-risk ×1.4 (BAU) / ×0.6 (1.5 °C-aligned).

**Disclosure scoring:** TNFD per-disclosure 0–1 evidence (complete ≥ 0.8 / partial ≥ 0.5 / missing), pillar means, SEEA 6 accounts + GRI 304-1..4 + ESRS E4-1..6 + GBF-T15 a–f as boolean-evidence fractions; composite = weighted mean over present frameworks.

**Balance sheet:** per asset, `stock = biome_value × condition × extent × 10` at opening and closing (closing defaults to opening = "no reported change"); `depreciation_rate = (1 − close_cond/open_cond) × 100`; integrated P&L reports recognised annual service flow, negative value changes as natural-capital depreciation, and net change; assets missing extent/condition are excluded and listed.

### 7.4 Worked example — mangrove asset, balance sheet

One asset: mangrove, 1,200 ha, opening condition 0.85, closing condition 0.80 (degradation), extent unchanged. Biome value $33,750/ha/yr.

| Quantity | Computation | Result |
|---|---|---|
| Opening stock | 33,750 × 0.85 × 1,200 × 10 | **$344.25M** |
| Closing stock | 33,750 × 0.80 × 1,200 × 10 | **$324.0M** |
| Net change | 324.0 − 344.25 | **−$20.25M** (−5.88%) |
| Annual service flow | 33,750 × 0.80 × 1,200 | **$32.4M** |
| Depreciation rate | (1 − 0.80/0.85) × 100 | **5.88%** |

Companion single-asset assessment at condition 0.80: monetary value = 33,750 × 0.80 × 1,200 = $32.4M/yr, split provisioning 5,200×0.8 = $4,160/ha, regulating $20,000/ha, cultural $2,840/ha. Dependency view for an agriculture counterparty with $500M revenue: score 0.92, revenue at risk 45% → **$225M**; BAU-2030 63%, 1.5 °C-aligned 27%.

### 7.5 Data provenance & limitations

- **No PRNG** — deterministic benefit transfer over caller inputs, with the platform's honest-null contract fully applied (notes enumerate every missing input; empty evidence → all-null disclosure scores).
- Biome values are static benefit-transfer constants: real TEEB/Costanza values vary by study site, income level and price year, and unit-value transfer to arbitrary sites is the weakest (though standard) valuation method; per-row source strings make provenance auditable.
- The 10× capitalisation multiple and 17.3 NPV factor are internally inconsistent as stated (a 4%/30-yr annuity is ≈ 17.3, so the balance sheet's 10× implies a much higher implicit discount rate or shorter horizon) — both are labelled model conventions.
- Equal intra-category allocation of service value is an explicit model rule ("absent service-specific primary-study weights"); ENCORE's actual materiality ratings are not encoded per service.
- Sector matrix covers 12 of ENCORE's real sector universe; unknown sectors return null rather than a guess.
- The 1.4×/0.6× 2030 scenario multipliers are unattributed narrative scalars.

### 7.6 Framework alignment

- **SEEA EA 2021 (UN System of Environmental-Economic Accounting — Ecosystem Accounting):** the five core accounts (extent, condition, physical & monetary services supply-use, asset) plus thematic accounts are encoded (EA-1..EA-6) and drive the balance-sheet structure ("Tables 5.1–5.4"); condition-scaled valuation mirrors SEEA's reference-condition concept.
- **TNFD v1.0 (Sept 2023):** all 14 recommended disclosures and the LEAP approach (Locate → Evaluate → Assess → Prepare) are implemented as the disclosure checklist and the dependency function's assessment scaffold.
- **ENCORE (Natural Capital Finance Alliance):** the ecosystem-service taxonomy and sector-dependency materiality concept; ENCORE itself rates dependency materiality per production process — here condensed into one score + key services per sector.
- **TEEB / IPBES / Costanza et al. (benefit transfer):** the unit-value-transfer valuation method with cited literature values.
- **WAVES (World Bank):** wealth-accounting framing for capitalised service flows and adjusted-savings language.
- **CBD Global Biodiversity Framework Target 15:** the a–f sub-elements (assess, disclose, reduce, restore, sustainable use, equitable sharing) as a boolean alignment checklist for corporate biodiversity action.
- **CSRD ESRS E4 & GRI 304:** E4-1..E4-6 (biodiversity transition plan through anticipated financial effects) and GRI 304-1..304-4 (sites, impacts, habitats protected, IUCN Red List species) as disclosure-coverage checklists.
- **PBAF 2023 / SBTN:** referenced in the header/`sbtn_scope` as the financial-institution biodiversity-accounting and science-based-targets-for-nature context.
