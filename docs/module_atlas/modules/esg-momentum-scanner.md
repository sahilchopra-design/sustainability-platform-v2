# ESG Momentum Scanner
**Module ID:** `esg-momentum-scanner` · **Route:** `/esg-momentum-scanner` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Detects ESG rating upgrade and downgrade momentum signals across equity and credit universes by analysing rating trajectory, revision frequency, and leading indicator dynamics. Combines provider rating change histories with underlying KPI trend data to generate early-warning signals ahead of formal rating revisions. Supports alpha generation, risk monitoring, and engagement prioritisation for active ESG investors.

> **Business value:** Enables active ESG investors to systematically identify rating inflection points before the market prices them in, generating alpha from ESG momentum while simultaneously improving engagement prioritisation and portfolio risk management.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `ControversyRecovery`, `CustomDot`, `CustomScatterTooltip`, `EngagementAlpha`, `ImprovLeaderboard`, `KpiCard`, `MomentumOverview`, `SectionHeader`, `SectorRotation`, `SignalBadge`, `SignalBuilder`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `handleSort` | `(col) => setSort(s => ({ col, dir: s.col === col ? -s.dir : 1 }));` |
| `hit` | `Math.min(65, Math.round(58 + (eW - 40) / 10));` |
| `improvement` | `c.esgAfter - c.esgBefore;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ESG Momentum Z-Score | — | Platform Momentum Engine | Standardised momentum signal; /Z/>1.5 constitutes actionable signal for engagement or portfolio adjustment. |
| Rating Change Frequency (events/year) | — | MSCI/Sustainalytics | Number of formal ESG rating revisions in trailing 12 months; high frequency issuers have less signal value due |
| Leading Indicator Composite Score | — | CDP / MSCI Controversy | Forward-looking adjustment factor based on CDP disclosure quality change, controversy events, and governance c |
| Signal Accuracy Rate (%) | — | Backtested 2018â€“2024 | Historical accuracy of momentum Z>1.5 signals in predicting formal rating upgrade within 12 months; benchmark  |
- **MSCI/Sustainalytics/ISS ESG score time series** → Compute rolling Δscore at 3, 6, 12-month windows; normalise by historical score volatility → **ESG momentum Z-score per issuer and window**
- **CDP disclosure score annual data** → Detect year-on-year disclosure quality improvement or decline → **Leading indicator adjustment factor (+/− 0â€“20 points)**
- **RepRisk controversy feed** → Flag ESG controversy peaks preceding rating downgrades; train logistic signal model → **Controversy-informed downgrade probability (%)**

## 5 · Intermediate Transformation Logic
**Methodology:** ESG Momentum Signal
**Headline formula:** `ESG_Mom = Σ(w_p × ΔScore_p) / σ_hist`
**Standards:** ['MSCI ESG Momentum Methodology 2023', 'Sustainalytics Rating Change Framework', 'Academic: Verheyden et al. 2016']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).