# SEC Climate Rule
**Module ID:** `sec-climate-rule` · **Route:** `/sec-climate-rule` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
SEC final climate disclosure rule implementation gap analysis covering governance, strategy, risk management, metrics and targets obligations across accelerated filer categories.

> **Business value:** Provides structured gap analysis against all SEC climate rule requirements with deadline-prioritised remediation guidance.

**How an analyst works this module:**
- Catalogue all rule items across governance, strategy, risk, metrics and targets pillars.
- Assess current documentation and process evidence against each item.
- Score implementation status: implemented, partial, not started.
- Prioritise remediation by compliance deadline and filer category materiality threshold.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSURANCE_FRAMEWORK`, `COLORS`, `COMPANIES`, `COMPANY_NAMES`, `COMPANY_SECTORS`, `COMPLIANCE_PHASES`, `DISCLOSURE_REQUIREMENTS`, `ENFORCEMENT`, `FILER_TYPES`, `INTL_COMPARISON`, `KpiCard`, `RescissionBanner`, `SECTORS`, `SECTOR_BENCHMARKS`, `TABS`, `TREND`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `COMPLIANCE_PHASES` | 5 | `deadline`, `scope`, `filerType`, `assurance`, `status` |
| `DISCLOSURE_REQUIREMENTS` | 16 | `category`, `required`, `notes`, `difficulty` |
| `INTL_COMPARISON` | 7 | `jurisdiction`, `scope1`, `scope2`, `scope3`, `financialRisk`, `scenario`, `biodiversity`, `social`, `assurance`, `effective`, `coverage` |
| `ASSURANCE_FRAMEWORK` | 5 | `type`, `applicability`, `phase`, `level`, `strengths`, `challenges` |
| `ENFORCEMENT` | 7 | `type`, `targets`, `outcome`, `regulator`, `detail` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `FILER_TYPES` | `['Large Accelerated Filer', 'Accelerated Filer', 'Non-Accelerated Filer', 'Smaller Reporting Co'];` |
| `ftype` | `FILER_TYPES[Math.floor(sr(i * 7) * 3)];` |
| `scope1` | `Math.round(sr(i * 11) * 9000 + 100);` |
| `scope2` | `Math.round(sr(i * 13) * 2500 + 50);` |
| `complScore` | `Math.round(38 + sr(i * 17) * 57);` |
| `ghgDisc` | `sr(i * 19) > 0.25;` |
| `riskDisc` | `sr(i * 23) > 0.18;` |
| `finImpact` | `sr(i * 29) > 0.38;` |
| `assurance` | `ftype === 'Large Accelerated Filer' ? (sr(i * 31) > 0.45 ? 'Limited' : 'None Yet') : 'N/A';` |
| `gaps` | `(!ghgDisc ? 1 : 0) + (!riskDisc ? 1 : 0) + (!finImpact ? 1 : 0);` |
| `icp` | `sr(i * 47) > 0.48 ? Math.round(sr(i * 53) * 150 + 15) : null;` |
| `hasScenario` | `sr(i * 61) > 0.55;` |
| `TREND` | `['Q3-22', 'Q4-22', 'Q1-23', 'Q2-23', 'Q3-23', 'Q4-23', 'Q1-24', 'Q2-24', 'Q3-24', 'Q4-24', 'Q1-25', 'Q2-25'].map((q, i) => ({` |
| `SECTOR_BENCHMARKS` | `SECTORS.map((s, i) => ({` |
| `kpis` | `useMemo(() => { const n = Math.max(1, filtered.length);` |
| `scope3Add` | `calcScope3 ? base * 0.6 : 0;` |
| `revenueScale` | `Math.log10(Math.max(1, calcRevenue)) / Math.log10(100);` |
| `total` | `+(base * revenueScale + scope3Add).toFixed(2);` |
| `statusColor` | `s => ({ 'Compliant': T.green, 'Partial': T.amber, 'Non-Compliant': T.red }[s] \|\| T.textSec);` |
| `csv` | `[keys.join(','), ...data.map(r => keys.map(k => `"${r[k]}"`).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/sec-climate/filer-assessment` | `filer_assessment` | api/v1/routes/sec_climate.py |
| POST | `/api/v1/sec-climate/ghg-disclosure` | `ghg_disclosure` | api/v1/routes/sec_climate.py |
| POST | `/api/v1/sec-climate/financial-effects` | `financial_effects` | api/v1/routes/sec_climate.py |
| POST | `/api/v1/sec-climate/materiality` | `materiality_assessment` | api/v1/routes/sec_climate.py |
| GET | `/api/v1/sec-climate/ref/filer-categories` | `ref_filer_categories` | api/v1/routes/sec_climate.py |
| GET | `/api/v1/sec-climate/ref/reg-sk-items` | `ref_reg_sk` | api/v1/routes/sec_climate.py |
| GET | `/api/v1/sec-climate/ref/reg-sx-items` | `ref_reg_sx` | api/v1/routes/sec_climate.py |
| GET | `/api/v1/sec-climate/ref/attestation` | `ref_attestation` | api/v1/routes/sec_climate.py |
| GET | `/api/v1/sec-climate/ref/safe-harbor` | `ref_safe_harbor` | api/v1/routes/sec_climate.py |
| GET | `/api/v1/sec-climate/ref/cross-framework` | `ref_cross_framework` | api/v1/routes/sec_climate.py |

### 2.3 Engine `sec_climate_engine` (services/sec_climate_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `SECClimateEngine.assess_filer` | registrant_name, cik, filer_category, fiscal_year, governance_score, strategy_score, risk_management_score, targets_goals_score | Assess SEC climate disclosure compliance for a registrant. |
| `SECClimateEngine.assess_ghg_disclosure` | registrant_name, fiscal_year, scope_1_total_co2e_mt, scope_1_by_gas, scope_1_methodology, scope_2_location_co2e_mt, scope_2_market_co2e_mt, scope_2_methodology | Assess GHG emissions disclosure completeness and attestation readiness. |
| `SECClimateEngine.assess_financial_effects` | registrant_name, fiscal_year, pre_tax_income_usd, total_equity_usd, severe_weather_losses_usd, severe_weather_events, carbon_offset_expenses_usd, rec_expenses_usd | Assess Reg S-X 14-02 financial statement effects of climate events. |
| `SECClimateEngine.assess_materiality` | registrant_name, fiscal_year, physical_risks, transition_risks, scenario_analysis_used, internal_carbon_price_usd_per_tco2e, strategy_resilience_assessment | Assess materiality of climate risks under SEC Items 1502 and 1503. |
| `SECClimateEngine._generate_recommendations` | gaps, ghg_required, assurance_required, assurance_level, has_limited, has_reasonable |  |
| `SECClimateEngine.get_filer_categories` |  |  |
| `SECClimateEngine.get_reg_sk_items` |  |  |
| `SECClimateEngine.get_reg_sx_items` |  |  |
| `SECClimateEngine.get_attestation_requirements` |  |  |
| `SECClimateEngine.get_safe_harbor` |  |  |
| `SECClimateEngine.get_cross_framework_map` |  |  |
| `SECClimateEngine.get_rule_status` |  | Return P1-10 advisory: rule rescission status for UI/API consumers. |

**Engine `sec_climate_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `SEC_RULE_STATUS` | `{'rule_reference': 'SEC Release 33-11275', 'rule_title': 'The Enhancement and Standardization of Climate-Related Disclosures for Investors', 'adopted_date': '2024-03-06', 'stayed_date': '2024-04-04', 'rescinded_date': '2025-03-27', 'current_status': 'RESCINDED', 'legal_force': False, 'advisory_only'` |
| `FILER_CATEGORIES` | `{'large_accelerated_filer': {'label': 'Large Accelerated Filer (LAF)', 'public_float_min_usd': 700000000, 'ghg_disclosure_start_fy': 2025, 'limited_assurance_fy': 2027, 'reasonable_assurance_fy': 2029, 'climate_risk_disclosure_required': True, 'scope_12_required': True, 'scope_3_required': False, 'f` |
| `REG_SK_ITEMS` | `[{'item': '1501', 'title': 'Governance', 'description': 'Board oversight and management role in climate-related risk governance', 'sub_items': ['1501(a) Board oversight of climate risks', '1501(b) Management role in assessing/managing climate risks'], 'required_for': ['all_filers']}, {'item': '1502'` |
| `REG_SX_ITEMS` | `[{'item': '14-02(a)', 'title': 'Severe weather events & natural conditions', 'description': 'Expenditures and losses from severe weather events if material (>1% pre-tax income or equity)', 'threshold_pct': 1.0}, {'item': '14-02(b)', 'title': 'Transition activities', 'description': 'Expenses and capi` |
| `ATTESTATION_REQUIREMENTS` | `{'limited_assurance': {'standard': 'AICPA AT-C 105/210 or PCAOB equivalent', 'level': 'limited', 'description': 'Limited assurance on Scope 1 & 2 GHG emissions'}, 'reasonable_assurance': {'standard': 'AICPA AT-C 105/205 or PCAOB equivalent', 'level': 'reasonable', 'description': 'Reasonable assuranc` |
| `SAFE_HARBOR` | `{'forward_looking': True, 'covered_items': ['Transition plans', 'Climate targets and goals (Item 1504)', 'Scenario analysis (Item 1502(c))', 'Internal carbon price (Item 1502(d))'], 'not_covered': ['Historical GHG emissions (Item 1505)', 'Financial statement effects (Reg S-X 14-02)'], 'note': 'PSLRA` |
| `SEC_CROSS_FRAMEWORK_MAP` | `[{'sec_item': 'Item 1501 (Governance)', 'tcfd': 'Governance (a)(b)', 'issb_s2': 'IFRS S2 para 5-6', 'csrd_esrs': 'ESRS 2 GOV-1, GOV-2'}, {'sec_item': 'Item 1502 (Strategy)', 'tcfd': 'Strategy (a)(b)(c)', 'issb_s2': 'IFRS S2 para 8-15', 'csrd_esrs': 'ESRS E1 SBM-3'}, {'sec_item': 'Item 1503 (Risk Man` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `ASSURANCE_FRAMEWORK`, `COLORS`, `COMPANY_NAMES`, `COMPANY_SECTORS`, `COMPLIANCE_PHASES`, `DISCLOSURE_REQUIREMENTS`, `ENFORCEMENT`, `FILER_TYPES`, `INTL_COMPARISON`, `SECTORS`, `TABS`, `TREND`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Critical Gaps | — | Gap analysis | Rule items with no current implementation and nearest compliance deadline within 12 months. |
| Governance Items | — | SEC 33-11275 | Board oversight and management governance disclosure items with adequate documentation. |
| Attestation Ready | — | GHG audit | Share of Scope 1/2 disclosures meeting limited assurance readiness for attestation requirement. |
- **Regulatory text, current policy documentation, GHG inventory** → Item-by-item gap assessment, deadline mapping, priority scoring → **Gap index dashboard, remediation roadmap, board-ready summary**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/sec-climate/ref/attestation** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['attestation'], 'n_keys': 1}`

**GET /api/v1/sec-climate/ref/cross-framework** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['cross_framework'], 'n_keys': 1}`

**GET /api/v1/sec-climate/ref/filer-categories** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['filer_categories'], 'n_keys': 1}`

**GET /api/v1/sec-climate/ref/reg-sk-items** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['reg_sk_items'], 'n_keys': 1}`

**GET /api/v1/sec-climate/ref/reg-sx-items** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['reg_sx_items'], 'n_keys': 1}`

**GET /api/v1/sec-climate/ref/safe-harbor** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['safe_harbor'], 'n_keys': 1}`

**POST /api/v1/sec-climate/filer-assessment** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/sec-climate/financial-effects** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Implementation Gap Index
**Headline formula:** `(Total Items – Implemented Items) ÷ Total Items × 100`

Proportion of required rule elements not yet implemented, providing a top-line gap measure for board reporting.

**Standards:** ['SEC 33-11275', 'TCFD Framework']
**Reference documents:** SEC Final Rule 33-11275 2024; SEC Adopting Release 89 FR 21668; PCAOB Attestation Standards; TCFD Implementation Guidance 2021

**Engine `sec_climate_engine` — extracted transformation lines:**
```python
notes = [rescission_note] + notes
yoy_s1 = ((scope_1_total_co2e_mt - prior_year_scope_1) / prior_year_scope_1 * 100
yoy_s2 = ((scope_2_location_co2e_mt - prior_year_scope_2) / prior_year_scope_2 * 100
total_ghg = scope_1_total_co2e_mt + scope_2_location_co2e_mt
intensity_value = round(total_ghg / revenue_or_denominator, 2)
threshold = base * 0.01 if base > 0 else 0
total_transition = (carbon_offset_expenses_usd + rec_expenses_usd +
total_estimates = climate_impairments_usd + climate_contingencies_usd
total_impact = severe_weather_losses_usd + total_transition + total_estimates + transition_capex_usd
all_risks = physical_risks + transition_risks
material_count=len(material_physical) + len(material_transition),
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).
**Shared engines (edits propagate!):** `sec_climate_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `sec-climate-disclosure` | engine:sec_climate_engine |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag — stale regulatory status, not caught up with sibling module.** The SEC's
> climate disclosure rule (Release 33-11275) was **rescinded by SEC vote on 27 March 2025**
> (`backend/services/sec_climate_engine.py::SEC_RULE_STATUS`, `current_status: "RESCINDED"`,
> `legal_force: False`). The sibling frontend module `sec-climate-disclosure` (same backend engine, same
> route files) carries an explicit rescission banner and file-header warning. **This module
> (`SecClimateRulePage.jsx`) does not** — its `COMPLIANCE_PHASES` table still marks Phase 1/2/3 as
> `'Active'`/`'Upcoming'`, its Cost Calculator computes "compliance cost" against a rule with no legal force,
> and its `dataLineage`/guide text ("Readiness Score 72%," "Critical Gaps: 8") presents the rule as a live
> obligation. Every "compliance," "cost," and "gap" figure on this page should be read as an assessment
> against the *rescinded rule text*, useful only as a voluntary-disclosure/TCFD-readiness proxy — not as
> current SEC law. This page should be updated to carry the same rescission caveat as its sibling.

### 7.1 What the module computes

80 real-named large-cap companies (Apple, Microsoft, ExxonMobil, JPMorgan, etc. — `COMPANY_NAMES`) are
assigned synthetic compliance attributes via `sr(s)=frac(sin(s+1)×10⁴)`: filer type (random pick of 4
tiers, not actual public float), Scope 1/2 emissions, a `complianceScore` (38–95), and independent booleans
for GHG/risk/financial-impact disclosure, transition plan, scenario analysis, and internal carbon price.

```js
complianceScore = round(38 + sr()×57)                        // 38–95, independent draw
disclosureGaps  = (!ghgDisclosed) + (!riskDisclosed) + (!financialImpact)   // 0–3 count
status = complianceScore>=75 ? 'Compliant' : complianceScore>=50 ? 'Partial' : 'Non-Compliant'
```

### 7.2 Parameterisation — Cost Calculator

```js
base        = filerType==='LAF' ? 4.2 : filerType==='AF' ? 1.8 : 0.6        // $M base compliance cost
scope3Add   = includeScope3 ? base × 0.6 : 0
revenueScale = log10(max(1,revenue)) / log10(100)                            // sub-linear scaling
total       = base × revenueScale + scope3Add
annualMaint = total × 0.35
external    = total × 0.45
```

The three base costs ($4.2M LAF / $1.8M AF / $0.6M NAF) and the 0.6× Scope 3 uplift, 0.35× maintenance, and
0.45× external-advisor multipliers are **hand-set illustrative constants with no cited cost-survey
source** — treat as directional only (larger filers cost more, Scope 3 adds materially, ongoing maintenance
is a meaningful fraction of first-year cost), not a calibrated compliance-cost model.

| Filer tier (as originally adopted, now moot) | GHG start | Assurance |
|---|---|---|
| Large Accelerated Filer | FY2025 | Limited FY2026 → planned Reasonable FY2033 |
| Accelerated Filer | FY2026 | Limited (phased) |
| Non-Accelerated Filer | FY2027 | None required |
| Scope 3 (all tiers) | Stayed March 2024, never reinstated | N/A |

`DISCLOSURE_REQUIREMENTS` (15 rows) and `INTL_COMPARISON` (6 frameworks: SEC, CSRD/ESRS, ISSB IFRS S1+S2,
TCFD, UK TCFD, Hong Kong ESG) are accurate, real regulatory content as of the rule's original 2024 adoption
text — genuinely useful as a comparative reference table independent of the US rule's current status.

### 7.3 Calculation walkthrough

1. `filtered` narrows `COMPANIES` (80) by sector/filer-type/status/name-search.
2. `kpis` computes guarded (`n = Math.max(1, filtered.length)`) counts and means: compliant/partial/
   non-compliant counts, `avgScore`, GHG-disclosed count, transition-plan count, ICP-adopter count,
   scenario-analysis count, SBTi-approved count.
3. **Gap Assessment tab**: flags each company's `disclosureGaps` (0–3) against the three core disclosure
   dimensions (GHG, risk, financial impact) — a simple missing-item counter, not a materiality-weighted gap
   score.
4. **Sector Analysis** (`SECTOR_BENCHMARKS`, 9 sectors): independent `sr()`-seeded averages
   (`avgCompliance`, `ghgDiscPct`, `transitionPlanPct`, `scenarioPct`, `avgScope1`, `icpAdopters`,
   `sbtiApproved`) — not aggregated from the 80-company `COMPANIES` array; it is a second, parallel
   synthetic dataset.
5. **Cost Calculator** — the only genuinely interactive tool on the page (§7.2), letting a user vary
   `calcRevenue`/`calcFilerType`/`calcScope3` and see a live cost estimate recompute.

### 7.4 Worked example

Cost Calculator, `filerType = 'Large Accelerated Filer'`, `revenue = $5,000M`, `includeScope3 = true`:

| Step | Computation | Result |
|---|---|---|
| Base | 4.2 | $4.2M |
| Revenue scale | `log10(5000)/log10(100) = 3.699/2` | 1.85 |
| Scaled base | `4.2 × 1.85` | $7.77M |
| Scope 3 add-on | `4.2 × 0.6` | $2.52M |
| **Total** | `7.77 + 2.52` | **$10.29M** |
| Annual maintenance | `10.29 × 0.35` | $3.60M |
| External advisors | `10.29 × 0.45` | $4.63M |

A company's compliance-score example: `complianceScore = round(38+sr(17×17)×57)`, illustrative draw → e.g.
72 → `status = 'Partial'` (< 75 threshold), `disclosureGaps` computed from its 3 booleans.

### 7.5 Companion analytics on the page

- **Phase Timeline / COMPLIANCE_PHASES** — a 4-phase table (LAF/AF/NAF/Scope-3-stayed) that still marks
  Phase 1 `'Active'` — this is the clearest on-page symptom of the stale rescission status (§ mismatch flag
  above).
- **Enforcement tab** (`ENFORCEMENT`, 6 real 2023–2024 SEC actions: greenwashing sweep $35M, BNY Mellon
  $1.5M, Goldman Sachs AM $4M) is genuine historical enforcement content, unaffected by the climate-rule
  rescission since these actions were brought under existing securities-fraud/ESG-fund-labelling authority,
  not the rescinded climate disclosure rule.
- **Assurance Framework tab** — real named standards (PCAOB AS 2101, IAASB ISAE 3410, ISAE 3000 Revised,
  AA1000AS v3) mapped to applicability and phase; still valid as general ESG-assurance reference material.

### 7.6 Data provenance & limitations

- **All 80 companies' compliance attributes are synthetic** (`sr()`-seeded); company *names* are real
  large-caps but every score, gap, and disclosure flag is fabricated per-session.
- **Sector Analysis is a second, independent synthetic dataset** not aggregated from the same 80 companies
  shown elsewhere on the page — sector-level and company-level views can disagree.
- **Cost Calculator constants are unsourced illustrative multipliers**, not derived from a compliance-cost
  survey (e.g. Deloitte/PwC SEC climate-rule cost estimates, EY Climate disclosure surveys) that a
  production tool should cite.
- **Most materially: the page presents a rescinded rule as active/upcoming law**, unlike its sibling module
  and the shared backend engine, which correctly caveat this. This is the primary finding to action for this
  module.

**Framework alignment:** SEC Release 33-11275 (Reg S-K Items 1500–1505, Reg S-X §14) — content is accurate
to the rule *as originally adopted*, but the rule was rescinded 27 March 2025 and has no legal force ·
PCAOB AS 2101 / IAASB ISAE 3410 / ISAE 3000 for the assurance framework (genuinely still-relevant standards)
· CSRD/ESRS, ISSB IFRS S1+S2, TCFD, UK TCFD, HKEx ESG for the international comparison table (accurate,
still current for their respective jurisdictions).

## 9 · Future Evolution

### 9.1 Evolution A — Repoint gap analysis to live regimes with sourced cost model (analytics ladder: rung 1 → 2)

**What.** The page's primary documented defect (§7 flag) is that it presents a rescinded rule as active law: `COMPLIANCE_PHASES` still shows Phase 1/2/3 as 'Active'/'Upcoming', while the shared `sec_climate_engine` and sibling module `sec-climate-disclosure` correctly carry `current_status: "RESCINDED"`. Evolution A first fixes that banner parity, then converts the module's genuinely useful machinery — item-by-item gap analysis and the Cost Calculator — into a multi-regime scenario tool covering regimes with actual legal force: California SB-253/SB-261, CSRD/ESRS E1, and ISSB S2 adoptions (the page's `INTL_COMPARISON` table already catalogues these accurately).

**How.** (1) Add the sibling's rescission banner and flip `COMPLIANCE_PHASES` statuses to 'Rescinded'. (2) Generalise the gap schema from Reg S-K items to a regime-parameterised item list served by a new `GET /api/v1/sec-climate/ref/regime-items?regime=` endpoint alongside the existing ten routes. (3) Replace the unsourced cost multipliers (`base = 4.2/1.8/0.6 $M`, flagged in §7.6) with cited survey ranges (SEC's own adopting-release cost estimates, ERM/Persefoni CSRD cost studies), returned as low/mid/high scenarios rather than a point estimate. (4) Unify the §7.6-flagged inconsistency where Sector Analysis uses a second independent synthetic dataset.

**Prerequisites.** Banner fix is a hard precondition — no analytics deepening before the page stops misstating legal status. **Acceptance:** no UI element labels 33-11275 as active; cost output shows a cited range per regime; sector view aggregates from the same company set as the company view.

### 9.2 Evolution B — Multi-regime obligations copilot (LLM tier 1)

**What.** A copilot answering "which climate disclosure rules actually apply to us?" — the question this page currently answers misleadingly. Grounded in the `INTL_COMPARISON` table, the six `/ref/*` endpoints of the shared backend, and this Atlas page's regulatory-status note, it walks a user from filer profile (revenue, listing, EU nexus, California nexus) to an honest applicability matrix, explicitly stating that the SEC rule is rescinded and which regimes substitute for it.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/sec-climate-rule/ask`, corpus = this module's Atlas record plus the cross-framework reference payloads, prompt-cached. Applicability logic stays deterministic (a small rules table keyed on the user's profile inputs); the LLM narrates and cites, it does not decide thresholds. Refusal path for jurisdictions outside the comparison table.

**Prerequisites (hard).** The Evolution-A rescission fix must ship first — an LLM narrating the current page would confidently restate the stale 'Active' phases, converting a UI defect into authoritative-sounding misinformation. **Acceptance:** the copilot never asserts a live SEC climate obligation; every regime claim traces to the comparison table or a `/ref/*` response.