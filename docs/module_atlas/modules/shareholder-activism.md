# Shareholder Activism
**Module ID:** `shareholder-activism` · **Route:** `/shareholder-activism` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
ESG activist investor tracking and engagement analytics monitoring activist campaigns, proxy voting patterns, and engagement outcomes across portfolio companies.

> **Business value:** Tracks ESG activist campaigns and engagement outcomes to inform proxy voting strategy and portfolio governance management.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `ACTIVISTS`, `CAMPAIGNS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(0):v;` |
| `activist` | `ACTIVISTS[Math.floor(sr(i*7)*ACTIVISTS.length)];const target=targets[i%targets.length];const sector=secs[i%secs.length];` |
| `type` | `['Board Seat','Strategic Review','ESG Proposal','M&A Opposition','Capital Return','Governance Reform','Climate Action','Compensation Reform'][Math.flo` |
| `status` | `['Active','Settled','Won','Lost','Withdrawn'][Math.floor(sr(i*13)*5)];const stakeM=Math.round(sr(i*17)*5000+100);const stakePct=+(sr(i*19)*8+0.5).toFi` |
| `paged` | `useMemo(()=>filtered.slice((page-1)*PAGE,page*PAGE),[filtered,page]);const totalPages=Math.ceil(filtered.length/PAGE);` |
| `stats` | `useMemo(()=>({count:filtered.length,active:filtered.filter(r=>r.status==='Active').length,totalStake:'$'+fmt(filtered.reduce((s,r)=>s+r.stakeMktValM,0` |
| `typeDist` | `useMemo(()=>{const m={};CAMPAIGNS.forEach(c=>{m[c.campaignType]=(m[c.campaignType]\|\|0)+1;});return Object.entries(m).map(([k,v])=>({type:k,count:v})).` |
| `activistRank` | `useMemo(()=>{const m={};CAMPAIGNS.forEach(c=>{if(!m[c.activist])m[c.activist]={name:c.activist,campaigns:0,wins:0,stake:0};m[c.activist].campaigns++;i` |
| `exportCSV` | `useCallback((data,fn)=>{if(!data.length)return;const keys=Object.keys(data[0]);const csv=[keys.join(','),...data.map(r=>keys.map(k=>`"${r[k]}"`).join(` |

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
**Standards:** ['13D/13G Filings', 'ISS Voting Analytics', 'Bloomberg Activism']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).