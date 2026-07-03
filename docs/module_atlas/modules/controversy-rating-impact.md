# Controversy Rating Impact
**Module ID:** `controversy-rating-impact` · **Route:** `/controversy-rating-impact` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Quantifies the effect of ESG controversy events on third-party ESG rating movements, modelling rating agency response lags, severity thresholds for downgrade triggers, and the portfolio-level rating drift attributable to controversies. Supports prediction of future rating changes and proactive engagement planning.

> **Business value:** Enables portfolio managers to anticipate ESG rating changes triggered by controversy events, prepare stewardship responses ahead of agency reviews, and manage index inclusion risk for ESG-constrained mandates.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_EVENTS`, `Btn`, `COMPANIES`, `CONTROVERSY_DATA`, `ControversyFeed`, `CustomTooltip`, `GEOS`, `ImpactPropagation`, `PILLARS`, `PROVIDERS`, `Pill`, `PredictiveEngine`, `REAL_EVENTS`, `RecoveryAnalytics`, `SECTORS`, `SEV_COLORS`, `SevBadge`, `StatCard`, `TYPES`, `TYPE_COLORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `GEOS` | `['North America','Europe','Asia-Pacific','Latin America','Middle East & Africa','Global'];` |
| `company` | `COMPANIES[Math.floor(s*COMPANIES.length)%COMPANIES.length];` |
| `type` | `TYPES[Math.floor(s2*TYPES.length)%TYPES.length];` |
| `sector` | `SECTORS[Math.floor(s3*SECTORS.length)%SECTORS.length];` |
| `sev` | `Math.min(5,Math.max(1,Math.floor(s4*5)+1));` |
| `subLevel` | `Math.floor(s5*10)/10;` |
| `geo` | `GEOS[Math.floor(sr(i*37+2)*GEOS.length)%GEOS.length];` |
| `year` | `2015+Math.floor(sr(i*41+9)*10);` |
| `month` | `Math.min(12,Math.max(1,Math.floor(sr(i*43+13)*12)+1));` |
| `day` | `Math.min(28,Math.max(1,Math.floor(sr(i*47+19)*28)+1));` |
| `pillar` | `PILLARS[Math.floor(sr(i*53+23)*3)%3];` |
| `desc` | `descriptions[Math.floor(sr(i*59+29)*descriptions.length)%descriptions.length];` |
| `ratings` | `PROVIDERS.map((p,pi)=>{` |
| `base` | `50+Math.floor(sr(i*61+pi*7)*40);` |
| `qSeed` | `sr(i*67+pi*11+q*3);` |
| `preRatings` | `PROVIDERS.map((p,pi)=>50+Math.floor(sr(i*71+pi*13)*40));` |
| `detectQ` | `PROVIDERS.map((p,pi)=>Math.max(0,Math.floor(sr(i*73+pi*17)*4)));` |
| `recoverQ` | `PROVIDERS.map((p,pi)=>Math.max(1,Math.floor(sr(i*79+pi*19)*12)));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPANIES`, `GEOS`, `PILLARS`, `PROVIDERS`, `PROV_COLORS`, `REAL_EVENTS`, `SECTORS`, `TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Rating Downgrade Probability (Sev.4) | — | Model calibration | Probability of at least one ESG rating notch downgrade within 12 months of severity-4 controversy |
| Agency Response Lag | — | Historical analysis | Typical delay between controversy onset and ESG rating agency score adjustment |
| Portfolio Rating Drift | — | Aggregated model output | Expected ESG rating drift across portfolio holdings due to active controversies |
| Downgrade Severity Threshold | — | Regression calibration | Controversy severity score above which downgrade probability exceeds 80% |
| Score Recovery Time | — | Historical tracking | Typical time for ESG rating to recover to pre-controversy level following resolution |
- **RepRisk/MSCI controversy severity history** → Match controversy events to rating change dates, compute lags → **Controversy-to-rating-change event dataset**
- **MSCI/Sustainalytics/S&P rating time series** → Regress rating changes on severity, persistence, sector materiality → **Calibrated β coefficients per agency**
- **Portfolio holdings and rating data** → Apply model per holding, aggregate portfolio drift → **Portfolio-level expected rating drift**

## 5 · Intermediate Transformation Logic
**Methodology:** Controversy-Driven Rating Drift Model
**Headline formula:** `Rating_change = α + β₁×Severity + β₂×Persistence + β₃×Sector_materiality + ε`
**Standards:** ['MSCI ESG Ratings Methodology', 'Sustainalytics Controversy Research', 'S&P ESG Scores']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).