# Shareholder Activism
**Module ID:** `shareholder-activism` · **Route:** `/shareholder-activism` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
ESG activist investor tracking and engagement analytics monitoring activist campaigns, proxy voting patterns, and engagement outcomes across portfolio companies.

> **Business value:** Tracks ESG activist campaigns and engagement outcomes to inform proxy voting strategy and portfolio governance management.

**How an analyst works this module:**
- Monitor SEC 13D/13G filings and activist database for new campaign disclosures.
- Classify campaigns by ESG theme (climate, board diversity, executive pay, supply chain).
- Track engagement trajectory: demand letter, AGM vote, negotiated outcome, litigation.
- Analyse proxy voting patterns and assess portfolio voting alignment with activist proposals.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `ACTIVISTS`, `CAMPAIGNS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(0):v;` |
| `activist` | `ACTIVISTS[Math.floor(sr(i*7)*ACTIVISTS.length)];const target=targets[i%targets.length];const sector=secs[i%secs.length];` |
| `type` | `['Board Seat','Strategic Review','ESG Proposal','M&A Opposition','Capital Return','Governance Reform','Climate Action','Compensation Reform'][Math.floor(sr(i*11)*8)];` |
| `status` | `['Active','Settled','Won','Lost','Withdrawn'][Math.floor(sr(i*13)*5)];const stakeM=Math.round(sr(i*17)*5000+100);const stakePct=+(sr(i*19)*8+0.5).toFixed(1);` |
| `filtered` | `useMemo(()=>{let d=[...CAMPAIGNS];if(search)d=d.filter(r=>r.target.toLowerCase().includes(search.toLowerCase())\|\|r.activist.toLowerCase().includes(search.toLowerCase()));if(sectorF!=='All')d=d.filter(r=>r.sector===sectorF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,sectorF,s` |
| `stats` | `useMemo(()=>({count:filtered.length,active:filtered.filter(r=>r.status==='Active').length,totalStake:'$'+fmt(filtered.reduce((s,r)=>s+r.stakeMktValM,0)*1e6),won:filtered.filter(r=>r.status==='Won').length,esgFocused:filt` |
| `typeDist` | `useMemo(()=>{const m={};CAMPAIGNS.forEach(c=>{m[c.campaignType]=(m[c.campaignType]\|\|0)+1;});return Object.entries(m).map(([k,v])=>({type:k,count:v})).sort((a,b)=>b.count-a.count);},[]);` |
| `activistRank` | `useMemo(()=>{const m={};CAMPAIGNS.forEach(c=>{if(!m[c.activist])m[c.activist]={name:c.activist,campaigns:0,wins:0,stake:0};m[c.activist].campaigns++;if(c.status==='Won')m[c.activist].wins++;m[c.activist].stake+=c.stakeMk` |
| `exportCSV` | `useCallback((data,fn)=>{if(!data.length)return;const keys=Object.keys(data[0]);const csv=[keys.join(','),...data.map(r=>keys.map(k=>`"${r[k]}"`).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=UR` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ACTIVISTS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Active Campaigns | — | Bloomberg/13D | Number of portfolio companies subject to active ESG activist campaigns. |
| ESG-Driven Campaigns | — | Campaign tracker | Share of tracked campaigns with primary demands related to ESG, climate or governance. |
| Engagement Win Rate | — | Outcome tracker | Proportion of activist-led engagements achieving at least one substantive ESG demand. |
- **SEC 13D/13G filings, proxy vote records, campaign databases** → Campaign classification, engagement tracking, voting alignment analysis → **Activism exposure scores, campaign timelines, voting alignment reports**

## 5 · Intermediate Transformation Logic
**Methodology:** Activism Exposure Score
**Headline formula:** `Σ (Activist Stake × Campaign Intensity × ESG Materiality)`

Weighted score combining activist investor stake size, campaign severity and ESG-related materiality of the campaign demands.

**Standards:** ['13D/13G Filings', 'ISS Voting Analytics', 'Bloomberg Activism']
**Reference documents:** SEC Rule 13D/13G Beneficial Ownership Reporting; ISS Proxy Voting Guidelines 2024; Glass Lewis Policy Guidelines 2024; PRI Active Ownership 2.0 Framework

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

60 synthetic activist campaigns (`CAMPAIGNS`, seeded `sr(s)=frac(sin(s+1)×10⁴)`) pair 20 real named
activist investors (Elliott Management, Carl Icahn, Third Point, Engine No.1, As You Sow, Follow This,
ShareAction — a mix of financial and ESG-focused activists) against 60 real named large-cap targets
(ExxonMobil, Shell, Disney, Salesforce, BHP, Barclays, etc., cycled via `i%60`). Each campaign carries a
type, status, stake size, and outcome metrics:

```js
type    = ['Board Seat','Strategic Review','ESG Proposal','M&A Opposition','Capital Return',
           'Governance Reform','Climate Action','Compensation Reform'][floor(sr()×8)]
status  = ['Active','Settled','Won','Lost','Withdrawn'][floor(sr()×5)]
stakeMktValM = round(sr()×5000 + 100)                          // $100M–$5.1B
stockImpact  = round((sr()−0.4)×30, 1)                         // −12% to +18%, mean-shifted positive
```

### 7.2 Parameterisation

| Field | Range/formula | Provenance |
|---|---|---|
| `stakeOwnershipPct` | `sr()×8+0.5` → 0.5–8.5% | Synthetic; plausible activist-stake range (activist campaigns typically disclosed at 5%+ Schedule 13D threshold in the US) |
| `boardSeatsWon` | `Board Seat` type only: `round(sr()×3+1)` → 1–4 | Synthetic |
| `durationMonths` | `sr()×24+3` → 3–27 months | Synthetic; plausible real-world campaign duration |
| `proxyFight` | `sr()>0.7` → 30% | Synthetic |
| `esgFocus` | `sr()>0.5` → 50% | Synthetic |
| `supportPct` (shareholder vote support) | `sr()×40+20` → 20–60% | Synthetic |
| `mediaAttention` | High/Medium/Low, `sr()`-assigned | Synthetic |

`stockImpact = (sr()−0.4)×30` is mean-shifted: with `sr()` uniform on [0,1), the mean of `(sr()−0.4)` is
+0.1, so `stockImpact` has an expected value of `+3%` — i.e. the dataset is constructed to show activist
campaigns *on average* modestly boosting target stock price, consistent with academic literature findings
(e.g. Brav et al.) that activist interventions on average generate small positive abnormal returns, though
here it is a designed constant rather than a measured empirical result.

### 7.3 Calculation walkthrough

1. `filtered` applies search (target/activist name) and sector filters over the 60 campaigns.
2. `stats` computes guarded (`|| 0` on `avgSupport`) portfolio aggregates: campaign count, active count,
   total stake value (`Σ stakeMktValM × 1e6`, formatted with `$` prefix — appropriate here since activist
   campaigns are predominantly US/UK situations), won count, ESG-focused count, average support %, proxy
   fight count.
3. `activistRank`: groups campaigns by `activist`, computing `campaigns` (count), `wins` (status='Won'
   count), and `stake` (Σ stakeMktValM) per activist, sorted descending by campaign count, top 12 shown —
   `winRate = wins/campaigns×100`.
4. `typeDist`: count of campaigns per `campaignType`, sorted descending.
5. **Outcome Analysis tab**: `stockImpact` binned into 4 buckets (`<-10%`, `-10 to 0`, `0 to 10%`, `>10%`)
   and a support%-vs-stock-impact scatter across all filtered campaigns — a legitimate visual for testing
   whether higher shareholder support correlates with better stock outcomes (though the underlying data is
   synthetic, so no real correlation exists to discover).

### 7.4 Worked example

Filtering to `sector='Energy'`: campaigns against ExxonMobil, Shell, Chevron, BP, TotalEnergies (per the
fixed `targets`/`secs` index alignment). For a specific campaign `i=3` targeting Disney (`i%60` cycling
places Disney at index 3): `activist = ACTIVISTS[floor(sr(21)×20)]`, `type = [...][floor(sr(33)×8)]`,
illustrative draw → `type='ESG Proposal'`, `status='Active'`, `stakeMktValM ≈ round(100+5000×sr(51))` ≈ e.g.
$2,340M, `stockImpact ≈ (sr(129)−0.4)×30` ≈ e.g. +4.2%.

`activistRank` for, say, "Follow This" (a real climate-focused activist shareholder group): if it appears
in 3 of the 60 campaigns with 1 win, `winRate = 1/3×100 = 33%`.

### 7.5 Companion analytics on the page

- **Campaign Type Distribution / Status Breakdown pies** — straightforward counts, feeding the Campaign
  Dashboard.
- **Largest Active Stakes** — top-12 by `stakeMktValM` among `status='Active'` campaigns only.
- **Most Active Investors / Win Rate by Activist** — the Activist Profiles tab's two headline charts,
  ranking the 20 named activists by campaign volume and computed win rate.

### 7.6 Data provenance & limitations

- **All 60 campaigns are synthetic** — activist and target names are real, well-known market participants,
  but the specific campaign type, status, stake size, outcome, and stock impact are fabricated per session
  via `sr(seed)=frac(sin(seed+1)×10⁴)`, not linked to actual 13D filings, proxy statements, or campaign
  histories.
- `stockImpact`'s positive mean-shift (§7.2) is a designed characteristic of the seed formula, not a
  measured empirical finding — it happens to be directionally consistent with published activism research,
  but should not be cited as evidence of that research.
- The activist roster mixes financial activists (Elliott, Icahn, Third Point) with dedicated climate/ESG
  shareholder-engagement organisations (As You Sow, Follow This, ShareAction, Green Century) — a reasonable
  real-world taxonomy, but campaign-type assignment (`type`) is independently random per campaign, so a
  financial activist like Carl Icahn can be randomly assigned a "Climate Action" campaign type, which would
  be atypical in reality.

**Framework alignment:** the campaign-type taxonomy (Board Seat, Strategic Review, ESG Proposal, M&A
Opposition, Capital Return, Governance Reform, Climate Action, Compensation Reform) reflects real,
recognised categories of shareholder activist campaigns · the activist roster is accurate and current
(includes major financial activists and the leading climate-focused shareholder engagement NGOs/investors)
· the positive-mean stock-impact construction is loosely consistent with academic activism-return literature
(Brav, Jiang, Partnoy, Thomas — average positive abnormal returns around activist campaign announcements),
though not derived from that literature in this implementation.

## 9 · Future Evolution

### 9.1 Evolution A — Real campaign records from 13D/13G ingestion (analytics ladder: rung 1 → 3)

**What.** The module's 60 campaigns pair real activist names (Elliott, Engine No.1, Follow This) with real targets, but every campaign attribute is `sr()`-fabricated — §7.6 notes Carl Icahn can be randomly assigned a "Climate Action" campaign, and the +3% mean-shifted `stockImpact` is a designed seed characteristic that merely resembles the Brav et al. literature. The workflow the overview promises ("monitor SEC 13D/13G filings") is exactly what's missing. Evolution A builds the first backend vertical: ingest Schedule 13D/13G filings from SEC EDGAR (free, keyless) into an `activist_campaigns` table, so campaign existence, filer, target, stake, and dates become facts.

**How.** (1) An EDGAR ingester on the platform's 19-ingester scaffold filtering form types SC 13D/13D-A/13G, resolving filers against the known activist roster and targets via `entity_lei`. (2) `GET /api/v1/activism/campaigns` serving real records; the §5 Activism Exposure Score (stake × intensity × materiality) finally computes over disclosed stakes instead of draws. (3) Measured `stockImpact`: announcement-window abnormal return from ingested price history where available, reported with the event window stated — and honestly absent otherwise, replacing the rigged positive-mean formula. (4) Campaign status transitions (Active/Settled/Won/Lost) sourced from amendment filings rather than a random pick.

**Prerequisites.** EDGAR rate limits; price-history coverage decides how many campaigns get abnormal-return figures (report coverage, don't backfill). **Acceptance:** every rendered campaign links to an accession number on EDGAR; the average stockImpact is whatever the data says, not +3% by construction.

### 9.2 Evolution B — Filing reader and demand classifier (LLM tier 2)

**What.** 13D Item 4 ("Purpose of Transaction") is free text where activists state their demands — the classification task the module currently fakes with a random `type` field. Evolution B has the LLM read each ingested filing's Item 4 and exhibit letters, classify demands against the module's 8-type taxonomy (Board Seat, Climate Action, Governance Reform, etc.), tag ESG themes, and summarise the demand letter — with the structured verdict written back to `activist_campaigns` for the deterministic exposure score to consume.

**How.** Tier-2 extraction pattern: filing text in, structured JSON out (types, ESG flags, quoted evidence span per classification); low-confidence classifications route to a review queue rather than auto-committing. Each `(filing, classification)` pair logs to `llm_traces` — a labelled corpus for the Tier-4 flywheel. The proxy-voting tab's copilot answers "how did support for climate proposals trend at this target?" strictly from stored vote records once proxy data is added.

**Prerequisites (hard).** Evolution A's ingestion — there is nothing real to classify today; classifying synthetic campaigns would launder fabricated data through an LLM. **Acceptance:** every classification cites a verbatim span from the filing; a filing with no ESG content classifies as financial-only, demonstrating the classifier can say no.