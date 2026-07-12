# Api::Pcaf_Regulatory
**Module ID:** `api::pcaf_regulatory` · **Route:** `/api/v1` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/pcaf/financed-emissions` | `calculate_financed_emissions` | api/v1/routes/pcaf_regulatory.py |
| POST | `/api/v1/sfdr/pai` | `calculate_sfdr_pai` | api/v1/routes/pcaf_regulatory.py |
| POST | `/api/v1/eu-taxonomy/alignment` | `assess_eu_taxonomy_alignment` | api/v1/routes/pcaf_regulatory.py |
| GET | `/api/v1/pcaf/portfolios` | `list_pcaf_portfolios` | api/v1/routes/pcaf_regulatory.py |
| GET | `/api/v1/pcaf/portfolios/{portfolio_id}` | `get_pcaf_portfolio` | api/v1/routes/pcaf_regulatory.py |
| GET | `/api/v1/sfdr/pai-disclosures` | `list_sfdr_disclosures` | api/v1/routes/pcaf_regulatory.py |
| GET | `/api/v1/sfdr/pai-disclosures/{disclosure_id}` | `get_sfdr_disclosure` | api/v1/routes/pcaf_regulatory.py |
| GET | `/api/v1/eu-taxonomy/assessments` | `list_eu_taxonomy_assessments` | api/v1/routes/pcaf_regulatory.py |
| GET | `/api/v1/eu-taxonomy/assessments/{assessment_id}` | `get_eu_taxonomy_assessment` | api/v1/routes/pcaf_regulatory.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `real-db`

**Database tables:** `datetime` *(shared)*, `db` *(shared)*, `eu_taxonomy_activities`, `eu_taxonomy_assessments`, `exc` *(shared)*, `fastapi` *(shared)*, `mandatory`, `pcaf_investees` *(shared)*, `pcaf_portfolios` *(shared)*, `pydantic` *(shared)*, `sector` *(shared)*, `sfdr_pai_disclosures`, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/eu-taxonomy/assessments** — status `passed`, provenance ['real-db'], source tables: `eu_taxonomy_assessments`
Output: `{'type': 'array', 'len': 17, 'item0_keys': ['id', 'entity_name', 'reporting_year', 'taxonomy_eligible_turnover_pct', 'taxonomy_aligned_turnover_pct', 'taxonomy_eligible_capex_pct', 'taxonomy_aligned_capex_pct', 'status', 'created_at']}`

**GET /api/v1/eu-taxonomy/assessments/{assessment_id}** — status `passed`, provenance ['real-db'], source tables: `eu_taxonomy_activities`, `eu_taxonomy_assessments`
Output: `{'type': 'object', 'keys': ['id', 'entity_id', 'entity_name', 'reporting_year', 'assessment_type', 'total_turnover_gbp', 'taxonomy_eligible_turnover_pct', 'taxonomy_aligned_turnover_pct', 'not_eligible_turnover_pct', 'total_capex_gbp', 'taxonomy_eligible_capex_pct', 'taxonomy_aligned_capex_pct', 'no`

**GET /api/v1/pcaf/portfolios** — status `passed`, provenance ['real-db'], source tables: `pcaf_portfolios`
Output: `{'type': 'array', 'len': 2, 'item0_keys': ['id', 'entity_name', 'reporting_year', 'portfolio_type', 'total_financed_emissions_tco2e', 'waci_tco2e_per_mrevenue', 'carbon_footprint_tco2e_per_mgbp_invested', 'portfolio_temperature_c', 'status', 'created_at']}`

**GET /api/v1/pcaf/portfolios/{portfolio_id}** — status `failed`, provenance ['db-empty'], source tables: `pcaf_portfolios`
Output: `None`

**GET /api/v1/sfdr/pai-disclosures** — status `passed`, provenance ['real-db'], source tables: `sfdr_pai_disclosures`
Output: `{'type': 'array', 'len': 14, 'item0_keys': ['id', 'entity_name', 'reporting_period_start', 'reporting_period_end', 'sfdr_article', 'pai_1_scope1_scope2_tco2e', 'pai_2_carbon_footprint', 'pai_4_fossil_fuel_exposure_pct', 'weighted_avg_dq_score', 'status', 'created_at']}`

**GET /api/v1/sfdr/pai-disclosures/{disclosure_id}** — status `failed`, provenance ['db-empty'], source tables: `sfdr_pai_disclosures`
Output: `None`

**POST /api/v1/eu-taxonomy/alignment** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/pcaf/financed-emissions** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The `pcaf_regulatory` domain (prefix `/api/v1`) is a **regulatory disclosure trio** implemented
inline in `pcaf_regulatory.py`: PCAF financed emissions, SFDR PAI indicators (14 mandatory),
and EU Taxonomy alignment — each computed in-route and persisted to Postgres. No separate
service module.

### 7.1 What the module computes

Three self-contained pipelines:

1. **PCAF financed emissions** (`POST /pcaf/financed-emissions`) — attribution × investee
   emissions, with sector-factor estimation and auto-DQS.
2. **SFDR PAI** (`POST /sfdr/pai-disclosures`) — the 14 mandatory principal-adverse-impact
   indicators aggregated across investees.
3. **EU Taxonomy** (`POST /eu-taxonomy/alignment`) — eligible vs aligned turnover/capex by the
   six environmental objectives, with DNSH flags.

### 7.2 Parameterisation / scoring rubric

**Sector emission intensity** (`_SECTOR_EMISSION_INTENSITY`, tCO₂e/€M revenue): Energy 850,
Utilities 620, Materials 480, Industrials 220, Financials 25, Default 150. Used when investee
emissions are missing.

**14 mandatory PAIs** (`_MANDATORY_PAI`): PAI 1-3 Scope 1/2/3 GHG; PAI 4 carbon footprint;
PAI 5 GHG intensity; PAI 6 fossil-fuel exposure %; PAI 7 non-renewable energy; PAI 8 energy
intensity; PAI 9 biodiversity; PAI 10 emissions to water; PAI 11 hazardous waste; PAI 12 UNGC
violations; PAI 13 gender pay gap; PAI 14 board diversity. **Fossil sectors**
(`_FOSSIL_SECTORS`) for PAI 6: Energy, Utilities, Oil & Gas, Coal, Mining.

**Six EU objectives** (`_EU_OBJECTIVES`): CCM, CCA, water, circular economy, pollution,
biodiversity, with activity codes `CCM/CCA/WTR/CE/PPC/BIO` mapping to them.

**Validation score** (`_build_validation_summary`): `max(0, 1 − 0.05·warnings − 0.10·missing)`
— a 0-1 data-quality confidence, `is_valid` when no fields are missing.

**Provenance:** intensities and PAI/objective definitions are the public SFDR RTS (EU
2022/1288) and EU Taxonomy (2021/2139) constants; sector intensities are platform estimates.

### 7.3 Calculation walkthrough

**PCAF:** `_estimate_emissions` uses reported Scope 1/2/3 if present, else splits a
sector-factor estimate `revenue/1e6 × intensity` as **60% Scope 1 / 40% Scope 2** (Scope 3
left null if absent), flagging `estimated=True`. `_pcaf_data_quality` auto-derives DQS:
reported unverified → 2, revenue-based → 3, else 4. Attribution factor uses EVIC/investment
value; financed emissions = attributed sum; portfolio WACI = revenue-weighted intensity.

**SFDR PAI:** each investee's attributed Scope 1/2/3 roll up to PAI 1-3; PAI 4 = total/AUM;
PAI 5 = weighted intensity; PAI 6 = fossil-sector share of investment value; social PAIs
(12-14) aggregate from supplied fields.

**EU Taxonomy:** per activity, eligible turnover/capex % and (if substantial-contribution +
DNSH + minimum-safeguards met) aligned %, rolled to portfolio weighted percentages by
objective.

### 7.4 Worked example

Investee: sector Financials, investment £50M, EVIC £500M, no reported emissions, revenue £800M.

- **Estimated emissions:** intensity 25 → Scope 1 `800·25·0.6 = 12,000 tCO₂e`; Scope 2
  `800·25·0.4 = 8,000`; Scope 3 null. `estimated=True`.
- **DQS:** estimated + revenue present → **3**.
- **Attribution:** `af = 50 / 500 = 0.10` → financed Scope 1 `1,200`, Scope 2 `800`.
- **PAI 6:** Financials ∉ fossil sectors → contributes 0% fossil exposure.
- **Validation:** if Scope 1/2/3 all missing (3 estimated fields raise warnings, none block) →
  score `1 − 0.05·3 = 0.85`, `is_valid=True`.

### 7.5 Data provenance & limitations

- Sector emission intensities are **coarse platform estimates**, not investee-specific — the
  60/40 Scope 1/2 split is a modelling simplification, not a PCAF rule.
- **No `sr()` fabrication** — every estimate is a deterministic sector-factor calculation with
  an explicit `estimated` flag and a validation warning.
- The 14-PAI set is the *mandatory* SFDR list only; optional PAIs are not computed.
- Results persist to PG tables (`pcaf/portfolios`, `sfdr/pai-disclosures`,
  `eu-taxonomy/assessments`) queryable via the paired GET endpoints.

**Framework alignment:** **PCAF v2.0 Part A** — attribution + auto-DQS. **SFDR RTS Annex I
(EU 2022/1288)** — the 14 mandatory PAI indicators are named and computed exactly per Table 1.
**EU Taxonomy Regulation (2020/852) + Climate Delegated Act (2021/2139)** — the six
environmental objectives, eligibility/alignment split and DNSH + minimum-safeguards gate
follow the Taxonomy's substantial-contribution logic. The Green Asset Ratio structure
(eligible vs aligned turnover/capex) underpins the portfolio roll-up.

## 9 · Future Evolution

### 9.1 Evolution A — Auto-sourced investee data across the disclosure trio (analytics ladder: rung 2 → 3)

**What.** A regulatory disclosure trio implemented inline: PCAF financed emissions
(`POST /pcaf/financed-emissions`), the 14 mandatory SFDR PAI indicators (`POST /sfdr/pai`),
and EU Taxonomy alignment by the six environmental objectives (`POST /eu-taxonomy/alignment`) —
each computed in-route and persisted. It falls back to a static `_SECTOR_EMISSION_INTENSITY`
table (Energy 850, Utilities 620 … Default 150 tCO₂e/€M) when investee emissions are missing.
The EU Taxonomy tables are real-db (17 assessments traced `passed`), but the sector-proxy
estimation is coarse and PAI/PCAF inputs are caller-supplied. Evolution A grounds them.

**How.** (1) Replace the static sector-intensity proxy with EDGAR/market-data-sourced investee
emissions and EVIC (via `financial_data`), reporting a PCAF DQS per estimate so the proxy is a
labelled fallback, not a silent default. (2) Reconcile the three pipelines' shared inputs —
the same investee should feed PCAF, PAI, and Taxonomy consistently, drawing from one
per-investee record (`pcaf_investees`) rather than three separate payloads. (3) Ground the EU
Taxonomy DNSH flags in the `eu_taxonomy_activities` evidence the sibling `gar` module also
uses. (4) Bench-pin financed emissions, all 14 PAIs, and the alignment ratios.

**Prerequisites.** `financial_data` emissions/EVIC linkage; a unified per-investee store.
**Acceptance:** sector-proxy estimation carries a DQS and is used only as labelled fallback; a
single investee produces consistent PCAF/PAI/Taxonomy figures; DNSH flags trace to activity
evidence; bench pins pass for all three pipelines.

### 9.2 Evolution B — Regulatory-disclosure copilot spanning PCAF/SFDR/Taxonomy (LLM tier 2)

**What.** A copilot that runs all three pipelines for a portfolio and drafts the disclosure —
"your financed emissions are X tCO₂e; PAI 4 (carbon footprint) is Y; 32% of turnover is
Taxonomy-aligned with 3 activities failing DNSH on water" — each figure tool-sourced, plus
retrieval of stored assessments via the list/get endpoints.

**How.** Three POST computational endpoints plus read endpoints over the real-db Taxonomy/PAI
tables. The copilot's value is producing the cross-regulation narrative a bank's disclosure
team assembles by hand, always citing which pipeline produced each number. The 14-PAI structure
lets it enumerate exactly which indicator is which. This is a central node for a
financial-institution regulatory desk, cross-linking to `sfdr_annex`, `gar`, and
`pcaf_asset_classes` copilots.

**Prerequisites.** Evolution A for consistency — a copilot narrating PCAF and PAI from
independently-keyed inputs could report contradictory investee emissions. **Acceptance:** every
emissions, PAI, and alignment figure traces to a tool response; the copilot flags when a figure
rests on the sector-proxy fallback rather than reported data; it refuses to assert regulatory
compliance and frames outputs as the computed disclosures.