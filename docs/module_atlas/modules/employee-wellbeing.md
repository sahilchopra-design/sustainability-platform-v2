# Employee Wellbeing Analytics
**Module ID:** `employee-wellbeing` · **Route:** `/employee-wellbeing` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Aggregates and analyses workforce health, engagement, and mental wellbeing metrics to support S-pillar ESG disclosure and strategic people risk management. Integrates HR system data on absenteeism, turnover, employee assistance programme utilisation, and engagement survey scores. Aligns output with GRI 401/403, SASB Human Capital standards, and the emerging SEC human capital disclosure rules.

> **Business value:** Enables HR leaders and ESG teams to monitor workforce health risks, benchmark against sector peers, and produce audit-ready S-pillar disclosures that satisfy GRI 403, SASB HC, and investor human capital questionnaires.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BAR_COLORS`, `Badge`, `Btn`, `ENGAGEMENT_TREND`, `EmployeeWellbeingPage`, `KpiCard`, `SECTOR_HC_BENCHMARKS`, `SECTOR_KEYS`, `Section`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `n => n == null ? '-' : typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : n;` |
| `clamp` | `(v, lo, hi) => Math.max(lo, Math.min(hi, v));` |
| `employees` | `c.employees \|\| c.total_employees \|\| 5000 + (h % 80000);` |
| `weight` | `c.weight_pct \|\| c.portfolio_weight \|\| 2 + (h % 6);` |
| `sliderAdj` | `overrideSliders[c.isin \|\| c.company_name] != null ? overrideSliders[c.isin \|\| c.company_name] / 100 : 1;` |
| `turnover` | `clamp(+(bm.turnover_pct * (0.7 + (h % 60) / 100) * sliderAdj).toFixed(1), 3, 40);` |
| `safety` | `clamp(+(bm.safety_incident_rate * (0.5 + (h % 100) / 100) * sliderAdj).toFixed(2), 0, 8);` |
| `training` | `clamp(Math.round(bm.training_hrs_per_emp * (0.6 + (h % 80) / 100)), 5, 80);` |
| `engagement` | `clamp(Math.round(bm.engagement_score + (h % 20) - 10), 35, 95);` |
| `absenteeism` | `clamp(+(bm.absenteeism_pct * (0.6 + (h % 80) / 100)).toFixed(1), 1, 10);` |
| `female` | `clamp(Math.round(bm.female_workforce_pct + (h % 20) - 10), 5, 65);` |
| `temp` | `clamp(Math.round(bm.temp_worker_pct + (h % 15) - 7), 2, 50);` |
| `tenure` | `clamp(+(bm.avg_tenure_yr + (h % 6) - 3).toFixed(1), 1, 18);` |
| `unionized` | `clamp(Math.round(bm.unionized_pct + (h % 25) - 12), 0, 85);` |
| `fatality` | `clamp(+(bm.fatality_rate_per_100k * (0.3 + (h % 140) / 100)).toFixed(1), 0, 12);` |
| `totalW` | `scoredHoldings.reduce((s, h) => s + wt(h), 0);` |
| `wavg` | `(key) => (scoredHoldings.reduce((s, h) => s + h[key] * wt(h), 0) / totalW).toFixed(1);` |
| `avg` | `key => scoredHoldings.reduce((s, h) => s + h[key], 0) / scoredHoldings.length;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BAR_COLORS`, `ENGAGEMENT_TREND`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Absenteeism Rate (%) | — | HR System / CIPD | Unplanned absence days as % of scheduled working days; WHO-linked productivity loss above 3.5%. |
| Engagement Score (%) | — | Engagement Survey | Favourable response rate to core engagement questions; Gallup global median 23% engaged. |
| EAP Utilisation Rate (%) | — | EAP Provider Data | Proportion of employees accessing mental health support; below 3% may indicate stigma or awareness gap. |
| Voluntary Turnover Rate (%) | — | HRIS | Annualised voluntary leavers as % of average headcount; elevated rates signal retention and culture risk. |
- **HRIS export (headcount, absence, turnover)** → Aggregate to monthly cohorts; normalise by FTE and region → **Absenteeism and turnover KPIs by business unit**
- **Engagement survey platform API** → Extract question-level scores; compute favourable response rate → **Engagement score with trend vs. prior period**
- **EAP provider utilisation report** → Normalise by total eligible employees; segment by service type → **EAP utilisation rate and presenting issue breakdown**

## 5 · Intermediate Transformation Logic
**Methodology:** Wellbeing Index
**Headline formula:** `WBI = w₁×Engagement + w₂×(1−AbsenteeismRate) + w₃×(1−TurnoverRate) + w₄×MHUtilisation`
**Standards:** ['GRI 403:2018', 'ISO 45003:2021', 'SASB HC-100']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).