# Social Alternative Data for ESG
**Module ID:** `social-alternative-data` · **Route:** `/social-alternative-data` · **Tier:** B (frontend-computed) · **EP code:** EP-MISC · **Sprint:** Platform

## 1 · Overview
Aggregates and analyses social alternative data sources for ESG assessment, including employee satisfaction signals from Glassdoor/LinkedIn, consumer sentiment on sustainability claims, ESG controversy velocity on social media, and community impact proxies such as job postings in low-to-moderate income areas and local news sentiment.

> **Business value:** Used by ESG data providers, responsible investment teams, and HR/sustainability officers to incorporate real-time social alternative data into holistic ESG assessments and controversy monitoring workflows.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_ASPECTS`, `BOILERPLATE_CATS`, `COMPANIES_80`, `ConceptBox`, `ESG_ASPECTS`, `HEDGE_PHRASES`, `KpiCard`, `LANGUAGES`, `LiveBadge`, `SECTORS_10`, `SEED_ABSA_PAPERS`, `SEED_BSKY`, `SectionTitle`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `total` | `posts.reduce((acc, p) => acc + postSentiment(p.record?.text \|\| '').score, 0);` |
| `aspectIdx` | `Math.floor(sr(ci * 17) * ALL_ASPECTS.length);` |
| `sentRaw` | `sr(ci * 31);` |
| `conf` | `0.65 + sr(ci * 43) * 0.34;` |
| `aspectHeatmap` | `useMemo(() => ALL_ASPECTS.map((asp, ai) => {` |
| `sources` | `['CDP Report', 'Third-party Audit', 'SBTi Certification', 'UNFCCC', 'No evidence'];` |
| `nliRaw` | `sr(i * 17);` |
| `src` | `sources[Math.floor(sr(i * 23) * sources.length)];` |
| `hedgeData` | `useMemo(() => COMPANIES_80.map((co, i) => ({` |
| `boilerplateData` | `useMemo(() => COMPANIES_80.map((co, i) => {` |
| `bpPct` | `BOILERPLATE_CATS.filter((_, ci) => cats[`cat${ci}`]).length / BOILERPLATE_CATS.length * 100;` |
| `readabilityData` | `useMemo(() => COMPANIES_80.map((co, i) => ({` |
| `tabs` | `['Social Dashboard', 'Bluesky Monitor', 'ABSA Engine', 'NLI Verification', 'Hedge Detection', 'Boilerplate', 'Alt-Data Alpha', 'Multi-Lingual', 'Reada` |
| `words` | `(p.record?.text \|\| '').toLowerCase().split(/\s+/);` |
| `topicData` | `Object.entries(topicCounts).map(([k, v]) => ({ topic: k, count: v }));` |
| `engagementData` | `posts.slice(0, 10).map((p, i) => ({` |
| `engagement` | `(p.likeCount \|\| 0) + (p.repostCount \|\| 0) + (p.replyCount \|\| 0);` |
| `contradictionTrend` | `Array.from({ length: 6 }, (_, i) => ({ year: 2018 + i, contradiction: 45 - i * 3.2 + sr(i * 7) * 4 }));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALL_ASPECTS`, `ALT_SIGNALS`, `BOILERPLATE_CATS`, `COLORS`, `COMPANIES_80`, `HEDGE_PHRASES`, `LANGUAGES`, `SECTORS_10`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Employee Sentiment Score | `weighted avg(Glassdoor overall, CEO approval, work-life balance)` | Glassdoor API + LinkedIn engagement | Score >70 correlates with lower turnover, higher productivity, and better SASB human capital disclosure scores |
| ESG Controversy Velocity | `Σ(controversy_mentions × recency_weight) / baseline_mention_rate` | Social media API + news aggregator | Velocity >50 indicates accelerating controversy; predictive of negative ESG rating action within 90 days (accu |
| Community Impact Proxy Score | `LMI_job_postings / total_job_postings × community_sentiment` | Indeed + FFIEC LMI census tracts | Proxies for community investment quality; used in CRA (Community Reinvestment Act) analytics and impact invest |
- **Glassdoor/LinkedIn/Twitter APIs + job posting databases + local news → aggregated social signals** → Sentiment scoring → controversy velocity → community proxy calculation → **Social ESG scores for S-pillar analytics and controversy monitoring**

## 5 · Intermediate Transformation Logic
**Methodology:** Social Signal Aggregation for ESG Scoring
**Headline formula:** `social_ESG_score = w1·employee_sentiment + w2·consumer_trust + w3·community_proxy − w4·controversy_velocity`
**Standards:** ['SASB Human Capital Standards by Industry', 'GRI 401-404 – Employment Standards', 'PRI Reporting Framework Indicator SO3 – Community']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).