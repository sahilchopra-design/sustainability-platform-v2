# AI Engagement Analytics
**Module ID:** `ai-engagement` · **Route:** `/ai-engagement` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
AI-powered stakeholder engagement platform that analyses sentiment across investor calls, ESG questionnaire responses, and social media channels using NLP and transformer models. Tracks response rates, sentiment trends, and engagement effectiveness by stakeholder cohort. Provides real-time alerts on emerging ESG controversies and engagement escalation triggers.

> **Business value:** AI-driven engagement analytics shift stakeholder management from reactive to predictive by surfacing sentiment deterioration and controversy signals weeks before they appear in formal complaints or press coverage. Engagement index scores provide auditable evidence for PRI Active Ownership reporting and support escalation decisions in stewardship programs.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `COLORS`, `DEFAULT_RULES`, `KpiCard`, `LS_ENG`, `LS_PORT`, `LS_STEW`, `PRIORITY_COLOR`, `PRIORITY_SCORE`, `Section`, `SortIcon`, `URGENCY_COLOR`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---';` |
| `pct` | `(n) => typeof n === 'number' ? `${n.toFixed(1)}%` : '---';` |
| `sRand` | `(n) => { let x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };` |
| `clamp` | `(v, lo, hi) => Math.max(lo, Math.min(hi, v));` |
| `percentile` | `(arr, p) => { const s = [...arr].sort((a, b) => a - b); return s[Math.floor(s.length * p / 100)] \|\| 0; };` |
| `sectorAvgGHG` | `sectorPeers.length ? Math.round(sectorPeers.reduce((s, p) => s + (p.ghg_intensity_tco2e_per_mn \|\| 0), 0) / sectorPeers.length) : 0;` |
| `totalScore` | `triggered.reduce((s, r) => s + (PRIORITY_SCORE[r.priority] \|\| 0), 0);` |
| `topAction` | `triggered.sort((a, b) => (PRIORITY_SCORE[b.priority] \|\| 0) - (PRIORITY_SCORE[a.priority] \|\| 0))[0]?.action \|\| 'No action';` |
| `topCategory` | `triggered[0]?.category \|\| '---';` |
| `avgScore` | `needsEngagement.length ? (needsEngagement.reduce((s, c) => s + c.totalScore, 0) / needsEngagement.length).toFixed(1) : '0';` |
| `topIssue` | `Object.entries(triggerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] \|\| '---';` |
| `rows` | `sortedScored.map(c => `"${c.company_name}","${c.sector}",${c.totalScore},"${c.urgency}",${c.triggered.length},"${c.topAction}","${c.topCategory}"`).jo` |
| `blob` | `new Blob([header + rows], { type: 'text/csv' });` |
| `letters` | `needsEngagement.slice(0, 30).map(c => {` |
| `blob` | `new Blob([JSON.stringify({ generated: new Date().toISOString(), letters }, null, 2)], { type: 'application/json' });` |
| `outcome` | `outcomes[Math.floor(sRand(s) * outcomes.length)];` |
| `esgChange` | `Math.round((sRand(s + 1) - 0.3) * 15);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `DEFAULT_RULES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Engagement Response Rate | — | Platform CRM | Percentage of stakeholders who responded to engagement outreach in the period |
| Avg Sentiment Score | `Mean softmax class probability` | NLP model output | Portfolio-level average sentiment across all ingested engagement text |
| Controversy Alerts (30d) | — | News/social NLP | Number of negative ESG controversy signals detected in the last 30 days |
- **Earnings call transcripts / survey responses** → Tokenise and pass through fine-tuned BERT model for sentiment classification → **Sentiment scores per stakeholder interaction with controversy flags**
- **Social media and news feeds** → NER extracts company mentions; classify context sentiment → **Real-time controversy alert feed with severity ratings**

## 5 · Intermediate Transformation Logic
**Methodology:** Transformer-based NLP sentiment scoring
**Headline formula:** `Sentiment_score = softmax(W × h_CLS + b); Engagement_index = Response_rate × avg(Sentiment_score)`
**Standards:** ['GRI 2-29 Stakeholder Engagement', 'SASB Engagement Standards', 'ISO 14064-3']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).