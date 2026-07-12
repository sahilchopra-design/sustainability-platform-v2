## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain — the engine docstring is the methodology narrative; nothing to reconcile.)*

### 7.1 What the module computes

`backend/services/issb_s2_engine.py` (class `ISSBS2Engine`, singleton via `get_engine()`) implements an **IFRS S2 Climate-Related Disclosures (June 2023) assessment engine** with three computational entry points, exposed through `api/v1/routes/issb_s2.py`:

1. **`POST /assess`** — four-pillar disclosure scoring (Governance / Strategy / Risk Management / Metrics & Targets), completeness, risk levels, SASB sector metric set, gap list, priority actions.
2. **`POST /risk-identification`** (`identify_risks`) — surfaces physical (4 acute + 4 chronic) and transition (policy/technology/market/reputational) risks whose `sectors_most_exposed` include the entity's sector, plus a 4-item opportunity catalogue.
3. **`run_scenario_analysis`** — 3-scenario (Net Zero 1.5 °C / Below 2 °C / Current Policies) entity-impact analysis per S2 §22–24.

Six `GET /ref/*` endpoints expose the underlying taxonomies (pillars, scenarios, physical/transition risks, SASB sectors, TCFD cross-reference). Design principle (docstring-stated): pillar scores are **evidence-based and deterministic** — "When no evidence is supplied … its score is 0.0 and an honest note is attached — never a fabricated value."

### 7.2 Parameterisation

**Pillar weights & disclosure-item denominators** (`IFRS_S2_PILLARS` / `_PILLAR_DISCLOSURE_COUNTS`):

| Pillar | Weight | Disclosure items | Paragraph anchors |
|---|---|---|---|
| Governance | 0.20 | 10 (board oversight, mgmt role, incentives) | S2-6, S2-7, S2-9 |
| Strategy | 0.30 | 17 (risks/opps, resilience, scenario analysis, business impact, financial planning) | S2-10, S2-13, S2-20, S2-22, S2-22a |
| Risk management | 0.25 | 10 | S2-25, S2-26, S2-27 |
| Metrics & targets | 0.25 | 18 (in the item catalogue; the count constant says 18) | S2-29, S2-29a/b, S2-32, S2-34, S2-36 |

Weights are platform conventions (IFRS S2 does not weight pillars); paragraph citations match the real standard's structure.

**Climate scenarios** (`CLIMATE_SCENARIOS`, self-labelled alignments):

| Parameter | Net Zero 1.5°C (NGFS NZ2050 / IEA NZE) | Below 2°C (NGFS / SSP1-2.6) | Current Policies (NGFS / SSP5-8.5) |
|---|---|---|---|
| Temp 2030 / 2050 (°C) | 1.3 / 1.5 | 1.5 / 1.8 | 1.9 / 3.2 |
| Carbon price 2030 / 2050 ($/t) | 130 / 250 | 75 / 150 | 15 / 25 |
| Transition intensity 2030 / 2050 | 0.85 / 1.0 | 0.60 / 0.85 | 0.10 / 0.15 |
| Fossil demand Δ2050 % | −75 | −55 | +2 |
| Renewable share 2050 % | 95 | 80 | 42 |

Carbon prices are in the range of NGFS/IEA NZE publications ($130/t by 2030 for NZE is IEA's advanced-economies figure); "transition intensity" is a platform scalar (0–1 ambition share).

**Risk classification** (`_classify_risk`, applied to caller-supplied 0–10 scores): ≥7.5 critical · ≥6.0 high · ≥4.0 moderate · else low; absent score → `insufficient_data`. **SASB sectors:** 8 sector metric sets (financials, energy, materials, utilities, real_estate, transport, food_beverage, tech) with 3–4 metrics each — the codes (e.g. `FN-CB-1` "Financed Emissions") *resemble* SASB SICS code style but are platform-defined metric sets, not verbatim SASB standard codes. **TCFD cross-reference:** 11 mappings, each tagged direct / expanded / mandatory_expanded.

### 7.3 Calculation walkthrough

**Pillar scoring:** `pillar_score = matched_items / catalogue_items × 100` where `matched_items` counts caller-supplied disclosure keys present in the pillar's catalogue. Metrics & Targets blends signals: `quant_pct = (#true of [S1>0, S2>0, S3>0, financed≠None, carbon_price≠None, capex>0]) / 6 × 100`; with a disclosure list, `score = 0.6·qual_pct + 0.4·quant_pct`, else `score = quant_pct`. Overall = Σ(pillar × weight). Completeness back-solves `complete = round(overall/100 × 55)` disclosures. `assurance_level = "limited"` iff overall ≥ 60.

**Gaps/actions:** seven gap rules (gov < 60, strat < 60, rm < 60, scope3 = 0, carbon price absent, capex < 5%, mt < 55), each with an S2 paragraph citation; the top 5 gaps map to named remediation actions (GHG Protocol 15-category screening, NGFS/IEA scenario analysis, board climate committee, $50–130/t shadow price, EU-Taxonomy CapEx classification, SBTi-validated targets).

**Scenario impacts** (all `None` when the corresponding financial input is absent):

```
revenue_impact_pct = −(carbon_intensity × carbon_price) × transition_intensity / 1e6 × 100
capex_required     = capex_plan × transition_intensity_2030
stranded_pct       = stranded_book / total_assets × transition_intensity_2030 × 100
physical_loss      = phys_value_at_stake × (temperature / 3.2)
resilience         = "adequate" if revenue_impact_2030 > −10 else "at_risk"
```

Most-severe scenario = max |revenue_impact_2050| over scenarios with computed impacts.

### 7.4 Worked example — Net Zero 1.5 °C scenario, industrial issuer

`entity_financials`: carbon intensity 800 tCO₂e/$M revenue, transition CapEx plan $500M, stranded book $300M of $5,000M assets, physical value at stake $120M.

| Impact | Computation | Result |
|---|---|---|
| Revenue 2030 | −(800 × 130) × 0.85 / 1e6 × 100 | **−8.84%** |
| Revenue 2050 | −(800 × 250) × 1.0 / 1e6 × 100 | **−20.0%** |
| Additional CapEx | 500 × 0.85 | **$425M** |
| Stranded exposure | 300/5000 × 0.85 × 100 | **5.1%** |
| Physical loss 2030 / 2050 | 120 × 1.3/3.2 ; 120 × 1.5/3.2 | **$48.8M / $56.3M** |
| Resilience | −8.84 > −10 | **adequate** (2030) |

Note the unit logic of the revenue formula: intensity (tCO₂e per $M) × price ($/t) gives carbon cost in $ per $M revenue; ÷1e6 ×100 expresses it as % of revenue. Under Current Policies the same entity shows −0.12% (2030) — the wedge between scenarios *is* the transition-risk disclosure.

### 7.5 Data provenance & limitations

- **No PRNG, no synthetic entities** — every entity-level number requires caller evidence; unsupplied inputs propagate as `None`/`insufficient_data` (SASB metrics default to `not_disclosed`), with an explicit note when no qualitative evidence is given.
- Disclosure scoring is **presence-counting**, not quality assessment: a key merely listed scores the same as a well-evidenced disclosure; no XBRL/document parsing.
- Scenario impacts are single-formula pass-throughs: full carbon-cost pass-through to revenue (no abatement response), linear temperature-proportional physical loss against an arbitrary 3.2 °C normaliser, stranding proportional to transition intensity — directionally right, not a financial model.
- `key_vulnerability` is a hard-coded heuristic (banks/insurers → transition, else physical).
- Scenario constants are close to NGFS/IEA published figures but are embedded copies, not live NGFS data.

### 7.6 Framework alignment

- **IFRS S2 (June 2023):** the four-pillar architecture, paragraph anchors (S2-6…S2-41), Scope 3 "disclose or explain impracticability" (§29a(iii)), internal carbon price (§34), climate CapEx (§32) and quantified targets (§36) are all faithfully catalogued; the 0–100 scoring layer is the platform's compliance-maturity overlay.
- **IFRS S1:** referenced as the general-requirements companion; not separately scored.
- **TCFD (2017/2021):** the 11-recommendation crossref documents where S2 goes beyond TCFD (mandatory Scope 1/2, scenario-based resilience, financed emissions) — matching the ISSB's published TCFD-comparison stance.
- **SASB / SICS:** industry-based metrics per S2 §29b are approximated with 8 platform metric sets in SASB code style; real SASB standards define 77 industries.
- **PCAF Global GHG Standard:** financed emissions appear as a metrics input and SASB-style metric (FN-CB-1/2); PCAF's actual method (attribution factor = outstanding/EVIC with 1–5 data-quality scores) is implemented elsewhere on the platform, here only referenced.
- **NGFS / IEA NZE / IPCC SSPs:** named per-scenario alignments for temperature, carbon-price and demand pathways.
- **SBTi, EU Taxonomy, GHG Protocol:** cited in remediation actions as the named target-setting, CapEx-classification and Scope-3 methodologies.
