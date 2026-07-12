# Shareholder Resolution Analyzer
**Module ID:** `shareholder-resolution-analyzer` · **Route:** `/shareholder-resolution-analyzer` · **Tier:** B (frontend-computed) · **EP code:** EP-CP4 · **Sprint:** CP

## 1 · Overview
100 climate/ESG resolutions (2020-2025) with success rate trends, topic classification, filer analysis, and impact assessment.

**How an analyst works this module:**
- Resolution Database shows 100 resolutions with outcomes
- Success Rate Trends shows improving support over 5 years
- Topic Classification breaks down by theme

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `FILERS`, `IMPACT_COLOR_MAP`, `IMPACT_DATA`, `MGMT_COLOR_MAP`, `MGMT_RESP`, `RESOLUTIONS`, `RESP_COLORS`, `TABS`, `TOPICS`, `TREND_DATA`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `RESOLUTIONS` | 21 | `company`, `topic`, `year`, `support`, `filer`, `mgmtResponse`, `impact` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TREND_DATA` | `[...new Set(RESOLUTIONS.map(r => r.year))].sort((a,b) => a-b).map(year => {` |
| `TOPICS` | `[...new Set(RESOLUTIONS.map(r => r.topic))].map(topic => {` |
| `FILERS` | `[...new Set(RESOLUTIONS.map(r => r.filer))].map(name => {` |
| `RESP_COLORS` | `MGMT_RESP.map(m => MGMT_COLOR_MAP[m.name]);` |
| `topics` | `[...new Set(RESOLUTIONS.map(r => r.topic))];` |
| `filtered` | `useMemo(() => topicFilter === 'All' ? RESOLUTIONS : RESOLUTIONS.filter(r => r.topic === topicFilter), [topicFilter]);  const years = RESOLUTIONS.map(r => r.year);` |
| `avgSupportAll` | `Math.round(RESOLUTIONS.reduce((s,r) => s+r.support, 0) / RESOLUTIONS.length);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `FILERS`, `IMPACT_DATA`, `MGMT_RESP`, `RESOLUTIONS`, `TABS`, `TOPICS`, `TREND_DATA`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Resolutions | — | Proxy data | 5-year database |
| Avg Support | — | Market data | Average shareholder support for climate resolutions |

## 5 · Intermediate Transformation Logic
**Methodology:** Resolution success tracking
**Headline formula:** `SuccessRate = Resolutions_with_majority / Total_resolutions`

Topics: emissions targets, lobbying disclosure, climate risk reporting, just transition, deforestation, methane.

**Standards:** ['ProxyMonitor', 'ShareAction']
**Reference documents:** ProxyMonitor Database; ShareAction Voting Tracker

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag — headline dataset size overstated by 12.5×.** The page subtitle reads
> "100 climate/ESG resolutions from 2020-2025," and the Tab-0 KPI card literally hardcodes
> `card('Total Resolutions', '100', '2020-2025', T.navy)` as a **string literal**, not
> `RESOLUTIONS.length`. **The actual `RESOLUTIONS` array contains exactly 8 hand-authored rows.** All 4
> headline KPI cards on Tab 0 ("Total Resolutions: 100," "Majority Support: 8," "Avg Support: 35%," "Top
> Topic: Emissions — 28 resolutions") are **independently hardcoded constants disconnected from the 8-row
> `RESOLUTIONS` table** that actually populates the Resolution Database view — e.g. "Emissions Targets: 28
> resolutions" cannot be verified against `RESOLUTIONS`, which contains only 2 rows tagged
> `'Emissions Targets'` (ExxonMobil, BP). What follows documents what the code actually contains.

### 7.1 What the module computes

8 real, named, individually-sourced-looking climate shareholder resolutions (`RESOLUTIONS`):
ExxonMobil/Emissions Targets/2024/35% support (filed by Follow This, opposed by management, "Partial
adoption"), Chevron/Lobbying Disclosure/2024/52% ("Full adoption"), Shell/Climate Risk Report/2023/20%,
BP/Emissions Targets/2024/17%, JPMorgan/Fossil Fuel Financing/2024/38%, HSBC/Deforestation/2023/28%,
Amazon/Climate Risk Report/2024/42%, Costco/Emissions Targets/2024/68% ("Target adopted"). These read as
plausible, specific real-world-style resolution outcomes (Follow This's actual annual "Say on Climate"
campaigns against oil majors are real and well-documented), though no source citation exists in code to
verify accuracy against actual 2023–2024 AGM results.

Four **separate, static aggregate tables** are presented alongside the 8-row database, none derived from
it: `TREND_DATA` (2020–2025 yearly totals/avgSupport/majority-win counts), `TOPICS` (7 topics with counts
up to 28), `FILERS` (6 filer orgs with resolution counts up to 22), `MGMT_RESP` (4-way management-response
distribution summing to 100%).

### 7.2 Parameterisation — the two disconnected data layers

| Layer | Row count | Source |
|---|---|---|
| `RESOLUTIONS` (detail table, Tab 0/"Resolution Database") | 8 | Hand-authored, real company/filer names |
| `TREND_DATA` (Tab 1, "Success Rate Trends") | 6 years | Hand-authored aggregate, e.g. 2024: total=58, avgSupport=35%, majority=8 |
| `TOPICS` (Tab 2, "Topic Classification") | 7 topics | Hand-authored aggregate, e.g. Emissions Targets: count=28, avgSupport=32% |
| `FILERS` (Tab 3, "Filer Analysis") | 6 filers | Hand-authored aggregate, e.g. Follow This: 22 resolutions, 28% avg support, 2 wins |
| `MGMT_RESP` (Tab 4, "Management Response") | 4 categories | Hand-authored: Oppose 72%, Neutral 15%, Support 8%, Already Implemented 5% |

Each table is **internally plausible** (the numbers are directionally sensible — e.g. avgSupport trending
up 2020→2022 then dipping 2023, matching the real-world pattern of a 2023 pullback in ESG-resolution
support amid the broader ESG political backlash) but **none of the 4 aggregate tables can be reconciled
against the 8-row `RESOLUTIONS` detail table** — they represent a separate, larger implied dataset that
does not exist as row-level data in this codebase.

### 7.3 Calculation walkthrough

1. `topics = [...new Set(RESOLUTIONS.map(r=>r.topic))]` — computed correctly from the 8-row table (5
   distinct topics: Emissions Targets, Lobbying Disclosure, Climate Risk Report, Fossil Fuel Financing,
   Deforestation).
2. `filtered = topicFilter==='All' ? RESOLUTIONS : RESOLUTIONS.filter(topic===topicFilter)` — the ONE
   genuinely computed/filterable view in the module, operating correctly on the real 8-row dataset.
3. **Tab 0 KPI cards** — all 4 values are JSX string/number literals (`'100'`, `'8'`, `'35%'`,
   `'Emissions'`/`'28 resolutions'`), not derived from `filtered` or `RESOLUTIONS` at all.
4. **Tabs 1–4** (Success Rate Trends, Topic Classification, Filer Analysis, Management Response) render
   the 4 static aggregate tables directly via Recharts, with no computation beyond passing the arrays to
   chart components.

### 7.4 Worked example

Filtering `topicFilter='Emissions Targets'` on the real `RESOLUTIONS` table yields exactly 2 rows
(ExxonMobil 35%, BP 17%) — `avgSupport = (35+17)/2 = 26%`. This can be verified directly by a user
interacting with the topic filter. Compare against the **static** `TOPICS` table's claim for the same
topic: `{ topic:'Emissions Targets', count:28, avgSupport:32 }` — neither the count (28 vs. 2 real rows)
nor the average support (32% vs. the 26% computable from the actual filtered rows) matches, confirming the
two data layers are unreconciled.

### 7.5 Companion analytics on the page

- **Resolution Database tab** — the only tab backed by real, individually-attributable, filterable data (8
  rows); useful as a small curated case-study set.
- **Impact Assessment tab** (Tab 5, not fully excerpted) — likely uses the `impact` field already present
  on each of the 8 `RESOLUTIONS` rows ("Partial adoption," "Full adoption," "None," "Policy update,"
  "Enhanced reporting," "Target adopted") — a genuinely useful real-data field if this tab draws from
  `RESOLUTIONS` rather than another static aggregate.

### 7.6 Data provenance & limitations

- **The subtitle and Tab-0 KPI cards overstate the dataset by 12.5×** (claimed 100 resolutions vs. 8
  actual rows) — this should be corrected to either (a) expand `RESOLUTIONS` to genuinely contain ~100
  rows matching the aggregate tables, or (b) change the headline copy and KPI cards to accurately reflect
  an 8-resolution curated case-study set.
- **`TREND_DATA`/`TOPICS`/`FILERS`/`MGMT_RESP` are static, illustrative aggregate tables** not computed
  from any underlying row-level dataset in this codebase — they should be labelled as illustrative
  reference figures, or backed by an actual larger `RESOLUTIONS` dataset, to avoid presenting invented
  statistics as if computed.
- The 8 real resolutions themselves are plausible and well-known (Follow This's Say-on-Climate campaigns
  against Shell/BP/ExxonMobil, As You Sow's lobbying-disclosure work at Chevron, ShareAction's work at
  JPMorgan/HSBC) but carry no citation to verify the exact support percentages against real 2023/2024 AGM
  vote results.

**Framework alignment:** the resolution/filer/topic taxonomy accurately reflects the real climate
shareholder-resolution ecosystem (Follow This, As You Sow, ShareAction, Green Century, Mercy Investment,
Ceres are all real, active climate/ESG shareholder resolution filers) · the "Say on Climate" concept and
the declining 2023 support trend in `TREND_DATA` are directionally consistent with widely reported
2023–2024 proxy season commentary on ESG shareholder-resolution fatigue, though the specific figures are
not sourced to a named proxy-voting database (ISS Voting Analytics, Georgeson Annual Corporate Governance
Review) in this implementation.

## 9 · Future Evolution

### 9.1 Evolution A — A real resolution database that its own KPIs are computed from (analytics ladder: rung 1 → 3)

**What.** The §7 mismatch flag documents the module's defining defect: the subtitle and Tab-0 KPI cards claim "100 climate/ESG resolutions" but `'100'` is a hardcoded string literal — the actual `RESOLUTIONS` array holds 8 hand-authored rows, and all four aggregate tables (`TREND_DATA`, `TOPICS`, `FILERS`, `MGMT_RESP`) are static constants never derived from the row-level data (e.g. "Emissions Targets: 28" versus 2 actual tagged rows). Evolution A makes the headline true: build a genuinely ~100+-row resolution dataset with verifiable sourcing, and compute every aggregate from it.

**How.** (1) Source row-level resolutions from AGM results disclosed in 8-K filings on SEC EDGAR (vote counts are reported there, free and citable) seeded around the 8 existing well-known cases (Follow This at Exxon/Shell/BP, As You Sow at Chevron — real campaigns the page already describes plausibly but uncited). (2) Store in a `shareholder_resolutions` table with `source_accession` per row; serve via `GET /api/v1/resolutions` — the module's first backend vertical. (3) Delete the four static aggregate tables; `TREND_DATA`, topic counts, filer counts, and management-response distribution become `reduce`s over the real rows, so the KPI cards can never again disagree with the database view. (4) Verify the 8 legacy rows' support percentages against the actual filings and attach citations.

**Prerequisites.** EDGAR extraction of vote tallies (Item 5.07 of 8-Ks is semi-structured); UK/EU AGM results need a second source or explicit US-only scoping. **Acceptance:** the "Total Resolutions" card renders `RESOLUTIONS.length`; every aggregate figure is reproducible by filtering the row-level table; each row links to its source filing.

### 9.2 Evolution B — Resolution-text classifier and precedent finder (LLM tier 2)

**What.** Once real resolution texts exist (Evolution A), the analytically valuable layer is textual: classifying resolution demands into the module's 7-topic taxonomy (emissions targets, lobbying disclosure, climate risk reporting, just transition, deforestation, methane) and answering precedent questions — "show me prior methane-disclosure resolutions at O&G majors and how support trended" — by querying the row-level table and reading the resolution texts.

**How.** Tier-2 pattern: the LLM classifies each ingested resolution's text (with a quoted evidence span per topic tag, human-reviewable), writing tags back to `shareholder_resolutions` for deterministic aggregation. The precedent-finder answers by tool-calling `GET /api/v1/resolutions?topic=&sector=` and narrating the returned support trajectory — no external memory of proxy seasons permitted, since that is exactly where plausible-but-unverified numbers creep in (the failure mode this module's hardcoded KPIs exemplify).

**Prerequisites (hard).** Evolution A — there are only 8 uncited rows today; classification and precedent search over invented aggregates would compound the documented 12.5× overstatement. **Acceptance:** every topic tag carries a quoted span from the resolution text; a precedent answer's support figures match the table rows returned by the query.