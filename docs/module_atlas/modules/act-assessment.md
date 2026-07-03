# ACT Assessment
**Module ID:** `act-assessment` · **Route:** `/act-assessment` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Scores corporate low-carbon transition credibility using the ACT (Assessing low-Carbon Transition) methodology across 10 sector-specific indicators. Combines quantitative performance metrics with qualitative policy signals to produce an overall ACT score and track record rating. Benchmarks companies against sector decarbonisation pathways aligned with a 1.5°C scenario.

> **Business value:** ACT scores translate qualitative climate commitments into a comparable 0–1 metric, enabling fund managers to distinguish genuine transition leaders from laggards. Pathway gap analysis highlights which companies are decarbonising at a pace consistent with limiting global warming to 1.5°C, providing direct stewardship and engagement evidence.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMPANIES`, `DIMENSIONS`, `FLAG_TYPES`, `GRADES`, `GRADE_COLORS`, `GRADE_LABELS`, `SECTORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sector` | `SECTORS[Math.floor(sr(i*13+5)*SECTORS.length)];` |
| `dimScores` | `DIMENSIONS.map((_d,di) => {` |
| `base` | `sr(i*31+di*17)*16 + sr(i*11+di*7)*4;` |
| `weighted` | `dimScores.reduce((a,sc,di) => a + sc * DIMENSIONS[di].weight, 0) / 100;` |
| `flags` | `FLAG_TYPES.filter((_f,fi) => sr(i*41+fi*23) > 0.55).map(f => f.id);` |
| `histGrades` | `[2022,2023,2024,2025].map(yr => {` |
| `drift` | `sr(i*53+yr*7)*3-1;` |
| `adjW` | `Math.max(0, Math.min(20, weighted + drift));` |
| `country` | `countries[Math.floor(sr(i*17+11)*countries.length)];` |
| `scope1` | `Math.round(sr(i*29+3)*4500+200);` |
| `scope2` | `Math.round(sr(i*37+7)*2200+100);` |
| `scope3` | `Math.round(sr(i*43+13)*28000+2000);` |
| `carbonIntensity` | `Math.round((scope1+scope2+scope3)/(sr(i*19+2)*80+5)*10)/10;` |
| `sbtiStatus` | `sr(i*61+9) > 0.6 ? 'Committed' : sr(i*61+9) > 0.3 ? 'Target Set' : 'None';` |
| `netZeroYear` | `sr(i*71+4) > 0.5 ? 2050 : sr(i*71+4) > 0.25 ? 2040 : 0;` |
| `brownCapExPct` | `Math.round(sr(i*47+17)*65+5);` |
| `supplierEngPct` | `Math.round(sr(i*59+21)*80+5);` |
| `boardClimateOversight` | `sr(i*67+33) > 0.4;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `DIMENSIONS`, `FLAG_TYPES`, `GRADES`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ACT Score | — | ACT Initiative | Higher scores denote stronger transition credibility across all 10 indicators |
| Pathway Gap | `Actual_intensity – Benchmark_intensity(t)` | IEA sector pathway | Deviation from IEA 1.5°C sector benchmark in tCO₂e/$M revenue |
- **Company CDP disclosure** → Map responses to ACT indicators; score 0–1 per indicator → **ACT composite score and sector pathway gap**
- **IEA sector pathway data** → Interpolate benchmark intensity by year → **Pathway gap chart and outperformance flags**

## 5 · Intermediate Transformation Logic
**Methodology:** ACT weighted indicator scoring
**Headline formula:** `ACT_score = Σ(w_i × Indicator_i) / Σ(w_i); Pathway_gap = Actual_intensity – Benchmark_intensity(t)`
**Standards:** ['ACT Methodology v3', 'CDP Questionnaire', 'SBTi SDA']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).