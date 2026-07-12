# Sanctions & Trade Monitor
**Module ID:** `sanctions-trade-monitor` · **Route:** `/sanctions-trade-monitor` · **Tier:** A (backend vertical) · **EP code:** EP-CV2 · **Sprint:** CV

## 1 · Overview
OFAC, EU, UK OFSI, UN sanctions with trade policy tracker and portfolio exposure analysis.

**How an analyst works this module:**
- Sanctions Dashboard shows active designations
- Portfolio Exposure identifies affected holdings

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALERTS`, `CLASS_COLORS`, `COUNTRY_CLASS`, `PORTFOLIO_EXPOSURE`, `REGIMES`, `RISK_COLORS`, `TABS`, `TRADE_POLICIES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `REGIMES` | 5 | `entity_count`, `country_programs`, `color`, `updated` |
| `COUNTRY_CLASS` | 16 | `ofac`, `eu`, `uk`, `un`, `exposure` |
| `TRADE_POLICIES` | 9 | `type`, `status`, `impact`, `sectors`, `effective` |
| `ALERTS` | 7 | `type`, `regime`, `detail`, `severity` |
| `PORTFOLIO_EXPOSURE` | 9 | `country`, `sanctions_regime`, `exposure_pct`, `risk` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/sanctions/status` | `status` | api/v1/routes/sanctions_screening.py |
| POST | `/api/v1/sanctions/screen` | `screen` | api/v1/routes/sanctions_screening.py |
| GET | `/api/v1/sanctions/uflpa-list` | `uflpa_list` | api/v1/routes/sanctions_screening.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`

**Database tables:** `XUAR` *(shared)*, `__future__` *(shared)*, `datetime` *(shared)*, `dhs` *(shared)*, `fastapi` *(shared)*, `pathlib` *(shared)*, `persons` *(shared)*, `pydantic` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `ALERTS`, `COUNTRY_CLASS`, `PORTFOLIO_EXPOSURE`, `REGIMES`, `TABS`, `TRADE_POLICIES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Sanctions Regimes | — | Official | OFAC, EU, UK, UN |

## 5 · Intermediate Transformation Logic
**Methodology:** Sanctions screening
**Headline formula:** `Exposure = Σ(portfolio_holdings in sanctioned_jurisdictions)`

4 sanctions regimes monitored. Trade policy: tariffs, export controls, CBAM. Portfolio exposure: which holdings have sanctioned country exposure.

**Standards:** ['OFAC', 'EU Consolidated List', 'UK OFSI']
**Reference documents:** OFAC SDN List; EU Consolidated Sanctions List

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **7** other module(s).

| Connected module | Shared via |
|---|---|
| `sanctions-climate-finance` | table:XUAR, table:dhs, table:pathlib, table:persons |
| `platform-analytics` | table:XUAR, table:dhs, table:pathlib, table:persons |
| `sanctions-screening-desk` | table:XUAR, table:dhs, table:pathlib, table:persons |
| `sanctions-watchlist` | table:XUAR, table:dhs, table:pathlib, table:persons |
| `energy-transition-credit-portal` | table:pathlib |
| `module-navigator` | table:pathlib |
| `infra-debt-portfolio-manager` | table:pathlib |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's calculation engine states `Exposure = Σ(portfolio_
> holdings in sanctioned_jurisdictions)`. **No such sum is computed anywhere in the code.** This
> module has an empty `computed` inventory — it is a purely static reference dashboard: every
> figure is a hand-authored constant in one of 5 seed tables, and the only arithmetic in the entire
> file is a single `REGIMES.reduce((s,r)=>s+r.entity_count,0)` to show a "Total Designations"
> headline count. There is no portfolio-exposure aggregation, no jurisdiction-matching logic, and
> no dynamic computation of any kind.

### 7.1 What the module computes

```
totalDesignations = Sum(REGIMES[i].entity_count)     // the module's only calculation
```
Everything else on the page — the 4-regime designation table, the 16-country sanctions
classification, the 9 trade-policy entries, the 7 compliance alerts, and the 9-row portfolio
exposure table — is static, hand-authored content rendered directly with no derived arithmetic.

### 7.2 Parameterisation

| Table | Rows | Content | Provenance |
|---|---|---|---|
| `REGIMES` | 5 | OFAC/EU/UK/UN entity counts, country programs, last-updated date | Static reference figures, plausible order of magnitude for real consolidated-list sizes but not live-synced |
| `COUNTRY_CLASS` | 16 | Per-country OFAC/EU/UK/UN designation flags + qualitative exposure level | Static reference, directionally consistent with real sanctioned-jurisdiction lists (Russia, Iran, North Korea, Venezuela, Myanmar, Syria etc.) |
| `TRADE_POLICIES` | 9 | Tariff/export-control/CBAM policy entries with status, impact, affected sectors, effective date | Static reference, includes real policy categories (CBAM correctly named as an EU carbon-border mechanism, not a sanctions regime) |
| `ALERTS` | 7 | Type/regime/detail/severity | Static illustrative alert examples, not generated from any rule engine |
| `PORTFOLIO_EXPOSURE` | 9 | Named holdings (PetroChina, Gazprom ADR, PDVSA Bond, Lukoil GDR, Sberbank, etc.) with `exposure_pct` and qualitative `risk` tier | Static illustrative table using real, recognisable sanctioned/at-risk issuers; `exposure_pct` values are plausible but hand-entered, not computed from an actual portfolio |

### 7.3 Calculation walkthrough

1. The "Sanctions Dashboard" tab sums `REGIMES.entity_count` for the single headline "Total
   Designations" KPI — the only reduce/aggregation in the file.
2. The "Portfolio Exposure" tab renders `PORTFOLIO_EXPOSURE` as a static table; `exposure_pct`
   values are displayed as-is (e.g. Sberbank shown at 0% / "DIVESTED" status, Gazprom ADR at 0.1%
   / "CRITICAL") without any portfolio-level aggregate exposure figure being computed (the guide's
   own formula would sum these 9 percentages, or filter+sum by sanctions_regime, but the code does
   neither).
3. No filtering, matching, or scoring logic connects `COUNTRY_CLASS` to `PORTFOLIO_EXPOSURE` — a
   user cannot ask "show me all portfolio holdings in comprehensively-sanctioned jurisdictions"
   because no join exists between the two tables.

### 7.4 Data provenance & limitations

- This module is best understood as a **static compliance reference page**, not an analytics
  engine — every number is hand-entered and none derive from another.
- The `PORTFOLIO_EXPOSURE` table names real, recognisable sanctioned/at-risk securities
  (Gazprom, Lukoil, Sberbank, PDVSA, PetroChina) with illustrative exposure percentages that could
  be mistaken for actual portfolio holdings data if not clearly labelled as a demo.
- No live sanctions-list feed, fuzzy-matching, or scoring model exists despite the guide's implied
  "screening" functionality.

**Framework alignment:** OFAC SDN List, EU Consolidated Sanctions List, UK OFSI, UN Security
Council Consolidated List (regime names and country classifications are accurate as static
reference content) · EU CBAM (correctly categorised as a trade/carbon-border policy, distinct from
sanctions) — none of these are implemented as live, queryable data sources.

## 9 · Future Evolution

### 9.1 Evolution A — Real portfolio-exposure aggregation over screened holdings (analytics ladder: rung 1 → 2)

**What.** §7 shows a static reference page: the only arithmetic in the file is one `reduce` summing regime entity counts; the guide's `Exposure = Σ(holdings in sanctioned jurisdictions)` is never computed; and the `PORTFOLIO_EXPOSURE` table names real securities (Gazprom, Lukoil, Sberbank, PDVSA, PetroChina) with illustrative percentages that §7.4 warns could be mistaken for actual holdings data. Evolution A implements the exposure aggregation over the user's real portfolio, screened through the platform's live infrastructure.

**How.** (1) Portfolio holdings (from `portfolios_pg`) screened via `sanctions-screening-desk`'s endpoints (CSL live today; EU/UK lists per that module's evolution), plus jurisdiction matching against regime country scopes — producing the guide's exposure sum as `Σ(weight × flag)` with match-confidence bands. (2) Regime metadata (designation counts, program descriptions, trade-policy timeline) becomes a maintained reference table with per-row source dates, replacing hand-entered constants; designation counts derive from the ingested lists themselves, so the headline count is a query, not a typed number. (3) The illustrative named-security table is deleted or clearly fixture-labelled — real tickers with fake exposures is the pattern the platform's fabrication guardrail exists to kill. (4) Trade-policy tracker rows link to `regulatory-change-radar`-style sourcing.

**Prerequisites.** Screening-desk batch endpoint; jurisdiction-scope metadata per regime. **Acceptance:** portfolio exposure recomputes when a holding or a list changes; the total-designations headline equals the ingested-list count; no named security carries an unsourced exposure figure.

### 9.2 Evolution B — Sanctions-exposure briefing copilot (LLM tier 2)

**What.** Compliance and investment teams need the same facts at different altitudes. The copilot serves both: "brief the IC on our Russia-regime exposure — direct designations, jurisdiction-level exposure, and what changed since last month" (list-diff data from the ingesters), "explain why this holding flags under EU but not OFAC" (regime-scope comparison from the metadata), each grounded in screening results and regime records.

**How.** Tier-2 tool calls over the exposure aggregation, screening results, and regime metadata; month-over-month change narratives use ingested list version diffs — a computed what-changed, not recalled news. Regime-difference explanations quote the program scopes from stored metadata with source dates. The screening desk's non-determination disclaimer propagates; the copilot additionally refuses trading-action framing ("should we sell?") — it quantifies exposure and cites designations, full stop. Briefings render via report studio with the list-version footer.

**Prerequisites (hard).** Evolution A's aggregation and list ingestion — briefing from hand-typed designation counts and fictional exposures would be compliance malpractice; version-diff tooling. **Acceptance:** every count and percentage traces to a query; what-changed sections reproduce from list diffs; action-recommendation requests are declined.