## 7 · Methodology Deep Dive

### 7.1 What the module computes

`backend/services/sustainable_trade_finance_engine.py` (E75) exposes five deterministic assessment functions behind `/api/v1/sustainable-trade-finance`, plus seven `ref/*` endpoints that serve the engine's reference tables verbatim:

| Function | Endpoint | Output |
|---|---|---|
| `assess_ep4_compliance` | `POST /assess-ep4-compliance` | Equator Principles 4 category (A/B/C), applicable IFC PS, 10-principle checklist, ESAP requirements, compliance status |
| `score_eca_green_classification` | (engine; ref data via `ref/eca-country-risk-ratings` etc.) | OECD Common Approaches tier, green classification tier, ECA country risk 0–7 |
| `calculate_esg_linked_margin` | (engine) | KPI performance scores, margin adjustment ±15 bps on a base margin, SPT calibration, ICC STF principle assessment |
| `screen_supply_chain_esg` | (engine) | EUDR overlay, modern-slavery / deforestation / conflict-minerals risk, RBA alignment score, overall ESG score & risk tier |
| `generate_trade_finance_report` | (engine) | ICC STF / OECD Arrangement / IFC PS / UNCTAD report shells populated only with caller-supplied portfolio metrics |

A defining design property (stated in inline comments): the engine uses **"honest nulls"** — when the caller supplies no assessed scores or performance data, outputs are `None`/`"not_assessed"`/`"insufficient_data"` rather than fabricated numbers.

### 7.2 Parameterisation

**EP4 categorisation rules** (from `EP4_CATEGORIES` + `assess_ep4_compliance`):

| Condition | Category |
|---|---|
| cost ≥ $10M AND (high-risk sector OR country risk ≥ 5) | A |
| cost ≥ $10M otherwise | B |
| high-risk sector AND cost ≥ $1M | B |
| else | C |

Category A requires IFC PS 1–8, independent review and an ESAP; B requires PS 1–4 and an ESAP; C requires none. `HIGH_RISK_SECTORS` lists 15 sectors (mining_extractives, oil_gas, hydropower, textile_garment…). `ECA_COUNTRY_RISK_RATINGS` hard-codes ~55 countries on the OECD 0–7 country-risk scale (DE/FR/UK/US = 0 … SD/YE/AF = 7); unknown countries default to 4. "Designated country" (EP4 Annex II proxy) = country risk ≤ 1.

**Compliance-status thresholds:** per-principle score ≥ 70 → `compliant`; overall ≥ 80 with no gaps and nothing unassessed → `compliant`; ≥ 65 → `substantially_compliant`; else `non_compliant`; no scores at all → `insufficient_data`. Category C auto-scores principles 2/3/4 at 100 (not applicable by rule).

**ESG-linked margin:** default KPI set (used only if the caller supplies none) is GHG intensity (baseline 100 → target 70, weight 0.40), water intensity (50 → 35, 0.30), supply-chain ESG score (55 → 75, 0.30). Per-KPI margin impact `= (50 − performance_score)/50 × 10 × weight` bps, total clamped to ±15 bps — matching the ±5–15 bps range typical of sustainability-linked loan documentation. SPT calibration: ≥ 80 `ambitious`, ≥ 60 `credible`, else `requires_strengthening`.

**Supply-chain screening:** `COMMODITY_SUPPLY_CHAIN_RISKS` covers 8 commodities (cotton, cocoa, palm_oil, cobalt, 3TG, soy, timber_paper, coffee) with categorical deforestation / modern-slavery / conflict-minerals risk and an EUDR-regulated flag. RBA alignment `= clamp(100 − country_risk × 8, 20, 100)` + 5 per verified certification (13 valid certs: FSC, RSPO, PEFC, Fairtrade, RTRS, ISCC, ASC, MSC…). Overall ESG `= RBA − deduction(deforestation) − 0.5×deduction(slavery) − 0.3×deduction(conflict) + 3×certs`, deductions {low 0, medium 10, high 20, very_high 35}, clamped 10–100. Risk tier: <40 critical, <60 high, <75 medium, else low. All constants are engine-authored calibration values, not published coefficients.

### 7.3 Calculation walkthrough

For EP4: country → risk rating → category rule → `EP4_CATEGORIES` lookup drives applicable IFC PS list, ESAP items (5 base + 4 Category-A-only, e.g. RAP per PS 5, Biodiversity Management Plan per PS 6) and independent-review flag. Caller `principle_scores` (0–100 per EP4 principle 1–10) populate the checklist; overall score = mean over applicable, assessed principles. For margin: each KPI's observed value linearly interpolates 0–100 between baseline and target (direction-aware for reduction vs increase KPIs); weighted mean renormalised over the *scored* weight only; the forward `margin_step_schedule` is deliberately all-null ("Projection requires forward KPI trajectory input").

### 7.4 Worked example — EP4 assessment

Route defaults: manufacturing project in Nigeria (`NG`, risk 6), cost $25M, no principle scores.

| Step | Computation | Result |
|---|---|---|
| Country risk | `ECA_COUNTRY_RISK_RATINGS["NG"]` | 6 |
| High-risk sector? | "manufacturing" ∉ HIGH_RISK_SECTORS | No |
| Category rule | $25M ≥ $10M and country risk 6 ≥ 5 | **Category A** |
| Applicable standards | IFC PS 1–8 + ILO core conventions | 9 entries |
| ESAP | required; 5 base + 4 Cat-A items | 9 items |
| Principle scores | none supplied | all `not_assessed` |
| Overall score / status | `scored_count = 0` | `None` / **insufficient_data** |

If the caller then supplies `principle_scores = {1:85, 2:75, 5:60}`: overall = (85+75+60)/3 = **73.3**; principle 5 (60 < 70) is a critical gap; 73.3 ≥ 65 but < 80 (and 7 principles unassessed) → **substantially_compliant**.

Margin example: GHG KPI current = 80 → score = (100−80)/(100−70)×100 = 66.7; adj = (50−66.7)/50×10×0.40 = **−1.33 bps** (outperformance tightens the margin). With only this KPI observed, overall KPI score = 66.7 (renormalised), adjusted margin on a 200 bps base = **198.67 bps**, SPT calibration `credible`.

### 7.5 Data provenance & limitations

- **No PRNG anywhere** — this engine is fully deterministic and was explicitly refactored to the honest-null pattern (see docstrings: "never fabricated", "never a random draw").
- Reference tables (`EP4_CATEGORIES`, `ECA_COUNTRY_RISK_RATINGS`, `COMMODITY_SUPPLY_CHAIN_RISKS`, `ICC_STF_PRINCIPLES`, `SECTOR_SUSTAINABILITY_STANDARDS`) are hard-coded transcriptions of public frameworks; the OECD country-risk snapshot is static and will drift from the OECD's quarterly updates.
- Score→status thresholds (70/80/65; ±15 bps; risk-deduction table; ×8 country-risk coefficient) are engine calibration choices without a cited external source.
- No persistence: assessments are stateless request/response; route defaults (NG, cocoa/CI, 200 bps) are illustrative only.

### 7.6 Framework alignment

- **Equator Principles 4 (2020)** — implements the real A/B/C categorisation logic (impact severity), the 10 EP principles as a checklist, Designated Country distinction, and Category-A independent-review/ESAP requirements.
- **IFC Performance Standards (2012)** — PS 1–8 applicability keyed to EP category, mirroring EP4's reliance on IFC PS for non-designated countries.
- **OECD Common Approaches (2016) / Arrangement + CRE 2023** — tiered environmental review (Tier A/B/C by sector and country risk) approximating the OECD Category A/B/C review depth; 0–7 country risk scale is the OECD's actual export-credit classification.
- **ICC Sustainable Trade Finance Principles (Pub. 908E, 2019)** — the 4 principles (Do No Harm, Promote Sustainability, Engage & Influence, Measure & Report) with per-principle requirement lists; scored only from caller input.
- **EUDR (EU 2023/1115)** — commodity-in-scope check against the regulation's 7 commodities, 31 Dec 2020 cut-off date, geolocation requirement flag.
- **UK Modern Slavery Act 2015 / AU MSA 2018, EU Conflict Minerals Reg. 2017/821, RBA CoC v9.0, OECD DD Guidance** — represented as categorical risk flags and the RBA alignment score; the engine approximates these as screening heuristics rather than full due-diligence workflows.
