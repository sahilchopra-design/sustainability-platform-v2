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
