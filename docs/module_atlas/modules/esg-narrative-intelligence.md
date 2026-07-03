# ESG Narrative Intelligence
**Module ID:** `esg-narrative-intelligence` · **Route:** `/esg-narrative-intelligence` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Applies NLP and large language model analysis to corporate ESG narratives in earnings call transcripts, annual reports, sustainability reports, and regulatory filings to extract quantitative ESG signals. Detects greenwashing language patterns, commitment specificity, sentiment trajectory, and KPI disclosure density. Supports fundamental ESG research, controversy monitoring, and regulatory materiality assessment.

> **Business value:** Transforms qualitative ESG narratives into systematic, comparable signals that complement quantitative rating data â€” enabling analysts to identify greenwashing risks, track commitment follow-through, and detect early-warning signals of ESG quality deterioration or improvement.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `COMPANIES`, `COMPANIES_RAW`, `Card`, `CompanySelector`, `CustomTooltip`, `ESG_TERMS`, `MetricCard`, `ProgressBar`, `SectionTitle`, `SeverityBadge`, `SourceBadge`, `StatusBadge`, `TOPICS`, `Tab1`, `Tab2`, `Tab3`, `Tab4`, `Tab5`, `YEARS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `base` | `ci * 100 + yi * 10;` |
| `commitments` | `Array.from({ length: 4 + Math.floor(sr(ci * 31 + 7) * 3) }, (_, i) => {` |
| `sid` | `ci * 50 + i * 7;` |
| `numControversies` | `Math.floor(sr(ci * 17 + 3) * 3.5);` |
| `sid` | `ci * 200 + i * 13;` |
| `sentimentArc` | `useMemo(() => YEARS.map(yr => ({` |
| `sentiments` | `YEARS.map(yr => company.yearData[yr].narrativeSentiment);` |
| `diffs` | `sentiments.slice(1).map((v, i) => v - sentiments[i]);` |
| `trend` | `diffs.reduce((a, b) => a + b, 0) / diffs.length;` |
| `variance` | `sentiments.reduce((acc, v) => {` |
| `coherence` | `Math.round(Math.max(0, 100 - variance * 180));` |
| `avgQ` | `YEARS.reduce((a, yr) => a + company.yearData[yr].quantifiedClaimsPct, 0) / YEARS.length;` |
| `controversyYears` | `useMemo(() => company.controversies.map(v => v.year), [company]);` |
| `topTopicByYear` | `useMemo(() => YEARS.map(yr => {` |
| `top` | `Object.entries(tp).sort((a, b) => b[1] - a[1])[0];` |
| `intensity` | `Math.round(val * 200);` |
| `trendData` | `useMemo(() => YEARS.map(yr => {` |
| `radarData` | `useMemo(() => TOPICS.map(t => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMMITMENT_TARGETS`, `COMPANIES_RAW`, `CONTROVERSY_EVENTS`, `ESG_TERMS`, `RESPONSES`, `SOURCES`, `TABS`, `TOPICS`, `TOPIC_COLORS`, `WATCHLISTS`, `YEARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Narrative Specificity Score (0â€“100) | — | NLP Engine | Proportion of ESG commitments with concrete targets, timelines, and accountability owners; below 40 flags gree |
| ESG KPI Density (metrics/1k words) | — | Text Parser | Quantitative ESG disclosures per 1,000 words of sustainability text; above 8 indicates disclosure-rich reporti |
| Sentiment Trajectory (quarter-on-quarter) | — | ESG Lexicon Model | Direction of ESG sentiment change across 8 quarters; sustained decline may precede rating downgrade. |
| Greenwash Risk Flag (1â€“5) | — | Specificity/Sentiment Model | Composite greenwashing risk rating; Level 4â€“5 = high specificity-sentiment divergence (positive language, lo |
- **Corporate sustainability reports and annual reports (PDF/HTML)** → OCR and section extraction; classify by GRI/ESRS topic; parse ESG commitment statements → **Commitment inventory with specificity tag and target year**
- **Earnings call transcripts (Refinitiv/Bloomberg)** → Sentence-level ESG topic classification; compute sentiment per pillar per quarter → **Sentiment time series by E/S/G pillar**
- **Prior period ESG disclosures** → Compare current vs. prior commitments; flag contradictions and retractions → **Consistency score and contradiction log**

## 5 · Intermediate Transformation Logic
**Methodology:** ESG Narrative Quality Score
**Headline formula:** `NQS = w_s × Specificity + w_c × Consistency + w_q × QuantDensity + w_t × Sentiment`
**Standards:** ['GRI Universal Standards 2021', 'EFRAG ESRS Materiality 2023', 'SEC ESG Disclosure Rules 2024']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).