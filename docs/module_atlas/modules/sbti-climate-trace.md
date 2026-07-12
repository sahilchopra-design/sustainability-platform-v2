# SBTi Climate Trace
**Module ID:** `sbti-climate-trace` · **Route:** `/sbti-climate-trace` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Integration of Climate TRACE independent emissions inventory data with SBTi target-setting and validation workflows for corporate emissions accountability.

> **Business value:** Uses independent satellite-based emissions data to stress-test corporate SBTi claims and flag credibility gaps.

**How an analyst works this module:**
- Match portfolio companies to Climate TRACE asset-level emissions database using LEI and ISIN.
- Compare Climate TRACE sector estimates with company-disclosed Scope 1 and 2 emissions.
- Calculate verification gap and flag companies above 15% divergence threshold.
- Overlay SBTi target status and assess alignment credibility given verification gap.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CT_SECTORS`, `PATHWAY_DATA`, `PATH_YEARS`, `SBTI_COMPANIES`, `SBTI_METHODS`, `SBTI_STATUS`, `SECTORS_SBTI`, `SECTOR_COLORS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CT_SECTORS` | 13 | `emissions_Mt`, `facilities`, `sources` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `SECTORS_SBTI` | `['Power','Steel','Cement','Chemicals','Transport','Buildings','Agri-Food','Financial','ICT','Retail'];` |
| `SBTI_METHODS` | `['Absolute Contraction','Sectoral Decarbonisation','Paris Agreement Capital Transition','1.5°C Absolute','Well-below 2°C Absolute'];` |
| `baseYear` | `2015 + Math.floor(sr(i) * 5);` |
| `targetYear` | `2030 + Math.floor(sr(i + 50) * 20);` |
| `scope1Base` | `500 + sr(i * 3) * 9500;` |
| `scope12Base` | `scope1Base * (1.2 + sr(i * 3 + 1) * 0.8);` |
| `reductionPct` | `30 + sr(i * 3 + 2) * 55;` |
| `nearTermPct` | `reductionPct * (0.4 + sr(i * 4) * 0.3);` |
| `PATHWAY_DATA` | `PATH_YEARS.map((yr, yi) => {` |
| `sbtiPath` | `startEmit * Math.max(0.05, 1 - (yr - 2020) / 30 * (0.6 + sr(si * 10) * 0.35));` |
| `sbtiStats` | `useMemo(() => ({ total: SBTI_COMPANIES.length, set: SBTI_COMPANIES.filter(c => c.status === 'Targets Set').length, committed: SBTI_COMPANIES.filter(c => c.status === 'Committed').length, removed: SBTI_COMPANIES.filter(c => c.status === 'Removed').length, net0: SBTI_COMPANIES.filter(c => c.longTerm).length, avgReduction: SBTI_COMPANIES.len` |
| `sectorBreakdown` | `useMemo(() => SECTORS_SBTI.map(s => ({` |
| `totalCt` | `CT_SECTORS.reduce((s, r) => s + r.emissions_Mt, 0);` |
| `end` | `PATHWAY_DATA[PATHWAY_DATA.length - 1][s];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CT_SECTORS`, `PATH_YEARS`, `SBTI_METHODS`, `SBTI_STATUS`, `SECTORS_SBTI`, `SECTOR_COLORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Companies Matched | — | Climate TRACE DB | Portfolio companies with Climate TRACE asset-level emissions estimates available. |
| Avg Verification Gap | — | Calculated | Mean absolute divergence between Climate TRACE estimates and company Scope 1+2 disclosures. |
| SBTi Targets Validated | — | SBTi dashboard | Share of matched companies with SBTi-approved near-term or net-zero targets. |
- **Climate TRACE API, SBTi company tracker, portfolio holdings** → Entity matching, divergence calculation, target status overlay → **Verification gap reports, SBTi alignment dashboard, escalation flags**

## 5 · Intermediate Transformation Logic
**Methodology:** Emissions Verification Gap
**Headline formula:** `|Climate TRACE Estimate – Company Reported| ÷ Company Reported × 100`

Percentage divergence between independently estimated and self-reported emissions, used to flag potential underreporting.

**Standards:** ['Climate TRACE v4', 'SBTi Corporate Manual']
**Reference documents:** Climate TRACE Emissions Inventory v4 2024; SBTi Corporate Net-Zero Standard v1.1; GHG Protocol Corporate Standard; IPCC AR6 Emission Factor Database

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's calculation engine states `Emissions Verification
> Gap = |Climate TRACE Estimate - Company Reported| / Company Reported x 100`, describing a
> per-company divergence test between independently-estimated and self-reported emissions.
> **This comparison is never computed.** `SBTI_COMPANIES` (50 synthetic companies with SBTi target
> data) and `CT_SECTORS` (12 sector-level Climate TRACE-style global emissions figures) are two
> **entirely disconnected datasets** in the code — there is no join key, no per-company Climate
> TRACE estimate, and no divergence percentage anywhere. The page presents them side-by-side as
> separate tabs/views, not as a cross-referenced verification tool.

### 7.1 What the module computes

**SBTi registry** (50 synthetic companies, cycling through 10 sectors / 5 methods / 7 status
labels via modulo indexing):
```
baseYear    = 2015 + floor(sr(i) x 5)
targetYear  = 2030 + floor(sr(i+50) x 20)
scope1Base  = 500 + sr(i x 3) x 9,500
scope12Base = scope1Base x (1.2 + sr(i x 3 + 1) x 0.8)
reductionPct     = 30 + sr(i x 3 + 2) x 55            // total target reduction %
nearTermPct      = reductionPct x (0.4 + sr(i x 4) x 0.3)   // near-term share of total target
temp        = status==='Targets Set' ? (sr(i+100)>0.6 ? '1.5C' : 'Well-below 2C') : '-'
```
**Sector decarbonisation pathways** (`PATHWAY_DATA`, 7 milestone years 2020-2050):
```
sbtiPath(yr) = startEmit x max(0.05, 1 - (yr-2020)/30 x (0.6 + sr(seed)x0.35))
```
A convex decline curve floored at 5% of starting emissions (never reaching absolute zero), with a
per-sector randomised steepness (`0.6-0.95` total reduction fraction by 2050).

### 7.2 Parameterisation

| Component | Content | Provenance |
|---|---|---|
| `CT_SECTORS` (12 rows) | Power 14,800 Mt, Transportation 8,100 Mt, Agriculture 5,700 Mt, Buildings 2,800 Mt, Manufacturing 6,200 Mt, Fossil Fuels 5,400 Mt, Waste 1,600 Mt, Shipping 1,100 Mt, Aviation 920 Mt, Steel 2,900 Mt, Cement 2,600 Mt, Mining 1,100 Mt | Real, well-sourced reference data — the 12 sector figures sum to ~53.2 GtCO2e, closely matching Climate TRACE's actual published global total (~53-57 GtCO2e depending on LULUCF inclusion); each sector also lists its real Climate TRACE detection methodology (satellite, AIS vessel tracking, flight data, ground stations) |
| `SBTI_COMPANIES` fields | Sector/method/status cycled via `i % 10` / `i % 5` / `i % 7`; base/target years, emissions, reduction % all `sr()`-seeded | Synthetic demo; `SBTI_METHODS` names are real SBTi methodology categories (Absolute Contraction, SDA, ACA-style Paris Agreement Capital Transition) |
| `reductionPct` range | 30-85% | Broadly consistent with the guide's cited "42-50% by 2030" SBTi near-term target range, though the code's range is wider and not sector-differentiated |
| `sbtiPath` floor | 5% of starting emissions | Approximates the Net-Zero Standard's "at least 90% reduction, residual <10%" requirement, though the floor here is 5% not the ~10% the guide cites |

### 7.3 Calculation walkthrough

1. `SBTi Registry` tab: filters/sorts the 50 synthetic companies by sector/status/method; computes
   `sbtiStats` (counts of Targets Set/Committed/Removed/net-zero-committed, mean `reductionPct`)
   and `sectorBreakdown` (per-sector company counts and mean reduction).
2. `Climate TRACE` tab: renders `CT_SECTORS` as a bar/treemap of global sector emissions with
   `totalCt = Sum(CT_SECTORS.emissions_Mt)` — a real, correctly-sourced aggregate figure.
3. `Sector Pathways` tab: plots `PATHWAY_DATA` per SBTi sector from 2020 to 2050, with `end`/`mid`
   milestone extraction for summary cards — illustrative decline curves, not tied to any specific
   published sectoral decarbonisation approach (SDA) trajectory data.
4. **No tab cross-references `SBTI_COMPANIES` against `CT_SECTORS`** — a company in the "Power"
   sector cannot be compared against Climate TRACE's real 14,800 Mt power-sector estimate, because
   the company's `scope1Base` is an independent random draw with no unit or scale relationship to
   the sector total.

### 7.4 Data provenance & limitations

- `CT_SECTORS` is the module's strongest asset: real, well-calibrated Climate TRACE-style global
  sector emissions figures with accurate detection-methodology attribution per sector.
- `SBTI_COMPANIES` is entirely synthetic and structurally cannot be verified against `CT_SECTORS`
  because no company-level Climate TRACE estimate or matching logic exists.
- The guide's headline "verification gap" use case — flagging companies whose Climate TRACE
  estimate diverges materially from their self-reported Scope 1+2 — **cannot be performed** with
  this module as built; a production version would need Climate TRACE's actual facility-level API
  (asset-level, not just sector-level, data) matched to company asset registries via LEI/facility
  ownership mapping.
- `sbtiPath`'s 5% emissions floor is a reasonable order-of-magnitude match to the Net-Zero
  Standard's residual-emissions allowance but not an exact reproduction of the ~10% figure the
  guide cites.

**Framework alignment:** Climate TRACE Emissions Inventory v4 (sector totals and methodology
attribution are genuinely accurate) · SBTi Corporate Net-Zero Standard v1.1 (methodology names
correctly reproduced; individual company target data synthetic) · GHG Protocol Corporate Standard
(Scope 1/1+2 framing correct) — the core "independent-verification-vs-self-reported" analytical
workflow the guide describes is **not implemented**.

## 9 · Future Evolution

### 9.1 Evolution A — Join the two datasets: facility-level verification gaps (analytics ladder: rung 1 → 2)

**What.** §7's structural finding: the guide's headline metric — `Verification Gap = |Climate TRACE estimate − reported| / reported` — cannot be computed because `SBTI_COMPANIES` (50 synthetic firms) and `CT_SECTORS` (12 real, well-calibrated Climate-TRACE-style sector figures — the module's strongest asset) are disconnected datasets with no join key, no company-level TRACE estimate, and no divergence calculation. §7.4 already names the fix: Climate TRACE's actual facility-level data matched to company asset registries. Climate TRACE publishes facility/asset-level emissions estimates as free downloadable data — this is genuinely buildable.

**How.** (1) Ingest Climate TRACE asset-level data (facility, sector, country, ownership where provided, annual tCO₂e) into `ct_facility_emissions`. (2) Ownership matching: facility → company via TRACE's ownership fields plus the platform's GLEIF entity-resolution cascade, with match confidence recorded — attribution is the hard, honest-effort part, and unmatched facilities stay unmatched. (3) Company reported emissions from user entry or the platform's disclosure-derived data; the verification gap computes per company as the guide specifies, decomposed by facility coverage ("TRACE covers ~60% of your reported Scope 1 footprint") so partial coverage never masquerades as a full audit. (4) The synthetic SBTi registry replaced by the SBTi's public target-dashboard export (free CSV of validated companies/targets).

**Prerequisites.** TRACE data ingestion (large but public); entity-match layer; coverage-decomposition design. **Acceptance:** a company's gap reproduces as |Σ matched facility estimates − reported| / reported with its coverage % shown; unmatched facilities are queryable; SBTi statuses match the public dashboard export for spot-checked names.

### 9.2 Evolution B — Claims stress-test copilot for stewardship teams (LLM tier 2)

**What.** The module's purpose — stress-testing corporate climate claims with independent data — is an argumentation task over computed evidence. The copilot: "does the TRACE evidence support this issuer's reported 12% Scope 1 reduction? Summarize the facility-level picture, coverage limits, and discrepancy trend", "draft the engagement question set for the three companies with the largest verification gaps".

**How.** Tier-2 tool calls over the gap/facility endpoints; evidence summaries are strictly coverage-qualified — the copilot leads with what fraction of the footprint TRACE observes before characterizing any gap, encoding §7.4's caution structurally. Engagement questions are generated from the specific facilities and sectors driving the gap (concrete, answerable questions beat generic ones — the facility decomposition provides them). Guardrails: divergence is framed as a basis for inquiry, never an accusation of misreporting (estimation uncertainty on both sides is stated, with TRACE's own sector-methodology attribution from the `CT_SECTORS` content); companies without sufficient facility matches get a cannot-assess answer.

**Prerequisites (hard).** Evolution A's join — stress-testing claims with disconnected datasets is impossible, and doing it with synthetic data would be defamatory-adjacent; uncertainty language reviewed. **Acceptance:** every facility figure in a summary traces to an ingested TRACE row with match confidence; coverage % precedes any gap characterization; low-coverage companies receive the documented refusal.