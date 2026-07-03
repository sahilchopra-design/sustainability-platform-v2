# Copula Tail Risk
**Module ID:** `copula-tail-risk` · **Route:** `/copula-tail-risk` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Models multivariate tail risk for correlated climate losses across asset classes and geographies using copula theory, capturing co-dependence structures that standard correlation matrices miss under extreme climate scenarios. Implements Gaussian, Student-t, Gumbel, and Clayton copulas for asymmetric tail dependence.

> **Business value:** Enables risk managers and actuaries to capture the fat-tailed, co-dependent nature of climate losses that standard correlation-based VaR models underestimate, supporting ORSA, ICAAP, and Solvency II SCR calculations under climate stress.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COPULAS`, `COPULA_COMPARE`, `MONTHLY`, `PAGE`, `PORTFOLIOS`, `STRATEGIES`, `STRESS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `STRATEGIES` | `['Long/Short Equity','Global Macro','Market Neutral','Risk Parity','Multi-Strategy','Event Driven','Statistical Arb','Vol Arb'];` |
| `COPULAS` | `['Gaussian','Student-t','Clayton','Gumbel','Frank','Joe','BB1','BB7'];` |
| `PORTFOLIOS` | `Array.from({length:50},(_,i)=>{const st=STRATEGIES[Math.floor(sr(i*3)*STRATEGIES.length)];return{id:i+1,name:'Portfolio '+(i+1)+' '+st.split('/')[0],s` |
| `MONTHLY` | `Array.from({length:24},(_,i)=>{const d=new Date(2024,i%12,1);return{month:d.toLocaleString('default',{month:'short'})+' '+(2024+Math.floor(i/12)),` |
| `STRESS` | `[{name:'2008 GFC',loss:22.5,prob:1.2,recovery:450},{name:'COVID-19',loss:18.3,prob:2.1,recovery:120},{name:'Taper Tantrum',loss:8.7,prob:5.4,recovery:` |
| `COPULA_COMPARE` | `COPULAS.map((c,i)=>({name:c,logLik:+(sr(i*137)*50-100).toFixed(1),aic:+(sr(i*139)*100+200).toFixed(1),bic:+(sr(i*143)*100+210).toFixed(1),tailFit:+(sr` |
| `paged` | `filtered.slice(page*PAGE,page*PAGE+PAGE);const totalPages=Math.ceil(filtered.length/PAGE);` |
| `exportCSV` | `(data,fn)=>{if(!data.length)return;const h=Object.keys(data[0]);const csv=[h.join(','),...data.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].j` |
| `kpis` | `useMemo(()=>{const n=filtered.length\|\|1;return{count:filtered.length,avgVaR:(filtered.reduce((s,p)=>s+parseFloat(p.var95),0)/n).toFixed(2),avgCVaR:(fi` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COPULAS`, `STRATEGIES`, `STRESS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio Tail VaR (99.5%) | — | Copula simulation | Portfolio loss at 99.5th percentile accounting for tail co-dependence between assets |
| Upper Tail Dependence λ_U | — | Copula calibration | Probability of joint extreme loss; 0 = independence, 1 = perfect co-crash |
| Student-t Copula df | — | MLE calibration | Degrees of freedom parameter; lower values imply heavier joint tails and higher co-crash risk |
| Copula Diversification Benefit | — | Model output | Reduction in portfolio VaR from copula model vs simple sum of individual asset VaRs |
| Climate Co-occurrence Multiplier | — | NGFS/IPCC | Factor by which climate scenarios amplify co-dependence vs historical data |
- **Historical asset return and loss data** → Fit marginal distributions by asset class using MLE → **Marginal CDF per asset**
- **Climate co-occurrence event data (NGFS/IPCC)** → Augment historical copula calibration with scenario tail weights → **Copula parameter θ per family**
- **Monte Carlo engine** → Simulate 100k joint scenarios, compute portfolio loss distribution → **Portfolio copula VaR and λ_U metrics**

## 5 · Intermediate Transformation Logic
**Methodology:** Copula-Based Multivariate VaR
**Headline formula:** `VaR_portfolio = Q⁻¹(α, C(u₁,...,u_n; θ))`
**Standards:** ['McNeil, Frey & Embrechts (2005)', 'Basel III Internal Models', 'EIOPA Solvency II SCR']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).