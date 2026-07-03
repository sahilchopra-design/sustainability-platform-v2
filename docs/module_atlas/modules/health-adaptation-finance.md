# Health Adaptation Finance
**Module ID:** `health-adaptation-finance` · **Route:** `/health-adaptation-finance` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Analyses climate adaptation investments in health infrastructure and systems, quantifying co-benefits, adaptation returns on investment, and alignment with WHO climate-health nexus frameworks. Covers heat stress resilience, vector disease surveillance, climate-resilient hospitals, and health system capacity building in climate-vulnerable regions.

> **Business value:** Supports climate finance institutions and development banks in prioritising health system adaptation investments, demonstrating economic co-benefits to governments, and meeting emerging climate-health disclosure requirements under WHO-UNFCCC health adaptation frameworks.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COUNTRIES`, `COUNTRY_NAMES`, `EARLY_WARNING_TYPES`, `FINANCE_TYPES`, `INFRA_CATEGORIES`, `QUARTERS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `QUARTERS` | `['Q1-23','Q2-23','Q3-23','Q4-23','Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25','Q3-25','Q4-25'];` |
| `FINANCE_TYPES` | `['Green Bond','Social Bond','Sustainability-Linked','Blended Finance','MDB Programme','Sovereign Health Bond','Impact Fund','Concessional Loan'];` |
| `adaptSpendM` | `Math.floor(s1*2000+20);` |
| `mitigSpendM` | `Math.floor(adaptSpendM*1.5+s2*1000);` |
| `healthAdaptPct` | `+(adaptSpendM/(adaptSpendM+mitigSpendM)*100).toFixed(1);` |
| `donorCommitM` | `Math.floor(s3*3000+50);` |
| `financingGapM` | `Math.floor(s4*5000+200);` |
| `popM` | `+(s5*150+2).toFixed(1);` |
| `infraScores` | `INFRA_CATEGORIES.map((_,ci)=>({category:INFRA_CATEGORIES[ci],score:Math.floor(sr(i*31+ci*7+413)*100),investNeedM:Math.floor(sr(i*37+ci*11+417)*500+10)` |
| `earlyWarning` | `EARLY_WARNING_TYPES.map((_,ei)=>({type:EARLY_WARNING_TYPES[ei],coveragePct:Math.floor(sr(i*41+ei*13+419)*100),effectivenessPct:Math.floor(sr(i*43+ei*1` |
| `qTrend` | `QUARTERS.map((_,qi)=>({q:QUARTERS[qi],adaptSpend:Math.floor(adaptSpendM*(0.8+qi*0.03+sr(i*53+qi*11)*0.1)),gapClosure:Math.floor(sr(i*59+qi*7)*10+qi*2)` |
| `financingInstruments` | `FINANCE_TYPES.map((_,fi)=>({type:FINANCE_TYPES[fi],amountM:Math.floor(sr(i*61+fi*11+425)*800+10),tenorYrs:Math.floor(sr(i*67+fi*13+427)*15+3),rateSpre` |
| `fmt` | `(n)=>n>=1e9?(n/1e9).toFixed(1)+'B':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':String(n);` |
| `totalAdapt` | `COUNTRIES.reduce((s,c)=>s+c.adaptSpendM,0);` |
| `totalMitig` | `COUNTRIES.reduce((s,c)=>s+c.mitigSpendM,0);` |
| `totalDonor` | `COUNTRIES.reduce((s,c)=>s+c.donorCommitM,0);` |
| `totalGap` | `COUNTRIES.reduce((s,c)=>s+c.financingGapM,0);` |
| `infraAgg` | `useMemo(()=>INFRA_CATEGORIES.map(cat=>{` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `COUNTRY_NAMES`, `EARLY_WARNING_TYPES`, `FINANCE_TYPES`, `INFRA_CATEGORIES`, `QUARTERS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Climate-Related DALY Burden (per 100k) | — | WHO Global Health Observatory | Disability-adjusted life years lost per 100,000 population attributable to climate-sensitive diseases (malaria |
| Health Adaptation Finance Gap ($ bn/yr) | — | Lancet Countdown 2023 | Annual funding shortfall for climate-resilient health systems in LMICs relative to assessed needs; current ada |
| Climate-Resilient Hospital Index | — | WHO Safe Hospitals Framework | Composite index assessing hospital structural resilience, backup power, water security, and surge capacity for |
| Heat Mortality Adaptation Benefit | — | Gasparrini et al. 2023 | Estimated reduction in heat-attributable mortality from urban heat island mitigation and cooling centre deploy |
- **WHO climate health burden data (DALY/mortality)** → Regionalise by climate hazard type (heat, floods, vector disease) → **Climate health vulnerability scores by geography**
- **Health infrastructure investment data** → Apply AROI formula with WHO VSL and regional DALY costs → **Adaptation ROI by investment type**
- **Climate scenario projections (IPCC AR6)** → Map hazard intensification trajectories to health burden projections → **Future health burden under climate scenarios**

## 5 · Intermediate Transformation Logic
**Methodology:** Adaptation ROI (Health)
**Headline formula:** `AROI = (Lives_saved × VSL + DALY_averted × VSL_DALY - CapEx_adaptation) / CapEx_adaptation`
**Standards:** ['WHO HEARTS Climate Module', 'GFCR Health Adaptation Finance Standard', 'Lancet Countdown on Health and Climate Change']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).