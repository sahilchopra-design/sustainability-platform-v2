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
