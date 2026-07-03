# Municipal Green Bond Analytics
**Module ID:** `municipal-green-bond-analytics` · **Route:** `/municipal-green-bond-analytics` · **Tier:** B (frontend-computed) · **EP code:** EP-DY1 · **Sprint:** DY

## 1 · Overview
Municipal green bond analytics covering use-of-proceeds allocation (transport 35%, energy 25%, water 20%), ICMA GBP compliance, impact reporting KPIs, yield spread versus vanilla munis, and credit enhancement structures.

> **Business value:** Provides comprehensive municipal green bond analytics integrating ICMA GBP compliance scoring, greenium measurement, and impact KPI tracking to support issuance and investor decisions.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BOND_TYPES`, `GREENIUM_DATA`, `ISSUERS`, `Kpi`, `RATING_SPREADS`, `TABS`, `USE_OF_PROCEEDS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `annualSaving` | `faceValue * (greeniumBps / 10000);` |
| `dsr` | `calcDsr({ annualRevenue: faceValue * 0.15, annualDebtService: faceValue * coupon / 100 });` |
| `yieldCurveData` | `useMemo(() => [2, 5, 7, 10, 15, 20, 30].map((yr, i) => ({` |
| `spreadByRating` | `useMemo(() => RATING_SPREADS.map(r => ({ rating: r.rating, '10yr': r.spread10yr, '20yr': r.spread20yr })), []);` |
| `portfolioData` | `useMemo(() => [...ISSUERS].sort((a, b) => b.iceScore - a.iceScore).slice(0, portfolioSize).map((iss, i) => ({` |
| `impactData` | `USE_OF_PROCEEDS.map(u => ({ category: u.category, co2Mt: u.co2AvoidedMt, share: u.share }));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BOND_TYPES`, `GREENIUM_DATA`, `ISSUERS`, `RATING_SPREADS`, `TABS`, `USE_OF_PROCEEDS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Greenium vs Vanilla Muni | `YTM(green) - YTM(vanilla) by matched maturity/rating issuer` | Bloomberg BVAL municipal pricing | Negative greenium (green trades tighter) observed for high-quality issuers; averages -3 to -8 bps in establish |
| Use of Proceeds Alignment | `Eligible green expenditure / total proceeds × 100` | Municipal annual impact report | ICMA GBP requires all proceeds allocated to eligible categories; 92%+ typical; residual in liquidity managemen |
| Impact KPI Coverage | `KPIs reported / KPIs committed in framework × 100` | Post-issuance impact report | High KPI coverage strengthens investor confidence and secondary market liquidity; below 70% risks reputational |
- **Bloomberg BVAL municipal pricing** → Real-time and historical muni yields by issuer, maturity, rating → greenium calculation → **Green vs vanilla pricing differential**
- **Issuer annual impact reports** → Use-of-proceeds allocation and KPI achievement data → compliance scoring → **ICMA GBP compliance score**
- **Climate Bonds Initiative certified issuance data** → CBI-certified muni bonds with verified impact metrics → benchmark comparison → **Peer issuance and impact benchmarking**

## 5 · Intermediate Transformation Logic
**Methodology:** Green Bond Impact & Pricing Analytics
**Headline formula:** `Greenium = Yield(Vanilla Muni) - Yield(Green Muni) in bps; Impact KPI Score = Σ(Category Weight × KPI Achievement Rate)`
**Standards:** ['ICMA Green Bond Principles 2021', 'MSRB Rule G-17 and Muni Disclosure Standards', 'Climate Bonds Initiative Municipal Bonds Guidance']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).