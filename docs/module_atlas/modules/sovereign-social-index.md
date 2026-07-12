# Sovereign Social Index
**Module ID:** `sovereign-social-index` · **Route:** `/sovereign-social-index` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Social development, inequality, labour rights and human capital analytics producing a sovereign social index for sustainable sovereign bond assessment and engagement.

> **Business value:** Produces a comprehensive sovereign social index integrating human development, inequality, labour rights and social protection for sovereign bond ESG integration.

**How an analyst works this module:**
- Collect HDI, Gini coefficient, ILO labour rights compliance and social protection data per country.
- Normalise each indicator to 0–100 and apply social index pillar weights.
- Compute composite sovereign social index and rank country universe.
- Integrate into sovereign ESG hub and flag countries with deteriorating social trajectories.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COUNTRIES`, `DIMS`, `DIM_COLORS`, `DIM_DESC`, `DIM_KEYS`, `DashboardTab`, `DimensionTab`, `INCOME_GROUPS`, `PortfolioTab`, `QUARTERS`, `RAW_COUNTRIES`, `REGIONS`, `REGION_COLORS`, `SCORE_TIERS`, `SDGS`, `SdgTab`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `lerp` | `(a,b,t)=>a+(b-a)*t;` |
| `clamp` | `(v,lo,hi)=>Math.max(lo,Math.min(hi,v));` |
| `pct` | `(v,t)=>t?((v/t)*100).toFixed(1)+'%':'—';` |
| `DIM_DESC` | `['Human Development Index composite','Income equality (100 - Gini coefficient)','Universal healthcare access & quality','Education quality, literacy, enrollment','ILO core convention compliance','Gender parity in pay, pa` |
| `REGIONS` | `['All','Europe','Americas','Asia-Pacific','Africa','MENA'];` |
| `INCOME_GROUPS` | `['All','High','Upper-Mid','Lower-Mid','Low'];` |
| `REGION_COLORS` | `{Europe:T.navy,Americas:T.sage,'Asia-Pacific':T.gold,Africa:'#7c3aed',MENA:'#0d9488'};` |
| `SDGS` | `Array.from({length:17},(_,i)=>({id:i+1,name:['No Poverty','Zero Hunger','Good Health','Quality Education','Gender Equality','Clean Water','Affordable Energy','Decent Work','Industry & Innovation','Reduced Inequalities','` |
| `QUARTERS` | `['Q1-23','Q2-23','Q3-23','Q4-23','Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25','Q3-25','Q4-25'];` |
| `base` | `income==='High'?68:income==='Upper-Mid'?48:income==='Lower-Mid'?35:25;` |
| `gdpFactor` | `clamp(gdp_pc/1200,0,20);` |
| `COUNTRIES` | `RAW_COUNTRIES.map((c,idx)=>{` |
| `composite` | `DIM_KEYS.reduce((a,k)=>a+dims[k],0)/8;` |
| `trends` | `DIM_KEYS.map((k,di)=>QUARTERS.map((q,qi)=>{` |
| `drift` | `(sr(idx*200+di*30+qi*7)-0.45)*2.5;` |
| `bondYield` | `clamp(1.2+(100-composite)*0.06+sr(idx*600)*1.5,0.3,14);` |
| `ratingIdx` | `clamp(Math.floor((100-composite)/7),0,14);` |
| `rating` | `['AAA','AA+','AA','AA-','A+','A','A-','BBB+','BBB','BBB-','BB+','BB','BB-','B+','B'][ratingIdx];` |
| `socialMomentum` | `+(sr(idx*700)*4-1.5).toFixed(2);` |
| `envScore` | `clamp(composite*0.8+sr(idx*800)*20,10,95);` |
| `radarData` | `sc?DIM_KEYS.map((k,i)=>({dim:DIMS[i],value:sc[k],fullMark:100})):[];` |
| `scatterData` | `useMemo(()=>filtered.map(c=>({name:c.name,gdp:c.gdp_pc,hdi:c.hdi,region:c.region,composite:c.composite})),[filtered]);` |
| `avg` | `filtered.reduce((a,c)=>a+c.composite,0)/n;` |
| `ranked` | `useMemo(()=>[...COUNTRIES].sort((a,b)=>b[dimKey]-a[dimKey]),[dimKey]);` |
| `bottom10` | `[...ranked].slice(-10).reverse();` |
| `movers` | `useMemo(()=>{ return COUNTRIES.map(c=>{ const t=c.trends[dimIdx];` |
| `delta` | `t[11].value-t[0].value;` |
| `regAvgs` | `useMemo(()=>{ return REGIONS.filter(r=>r!=='All').map(r=>{ const cs=COUNTRIES.filter(c=>c.region===r);` |
| `trendLines` | `useMemo(()=>{ return QUARTERS.map((q,qi)=>{ const obj={quarter:q};` |
| `corrMatrix` | `useMemo(()=>{ return DIM_KEYS.map((k1,i)=>({ dim:DIMS[i], ...Object.fromEntries(DIM_KEYS.map((k2,j)=>{ const xs=COUNTRIES.map(c=>c[k1]),ys=COUNTRIES.map(c=>c[k2]);` |
| `num` | `xs.reduce((a,v,ii)=>a+(v-mx)*(ys[ii]-my),0);` |
| `den` | `Math.sqrt(xs.reduce((a,v)=>a+(v-mx)**2,0)*ys.reduce((a,v)=>a+(v-my)**2,0));` |
| `incomeBreak` | `useMemo(()=>{ return INCOME_GROUPS.filter(g=>g!=='All').map(g=>{ const cs=COUNTRIES.filter(c=>c.income===g);` |
| `sdgAvgs` | `useMemo(()=>{ return SDGS.map(s=>{ const avg=filtered.reduce((a,c)=>a+c.sdgs[s.id-1].score,0)/filtered.length;` |
| `tgt` | `filtered.reduce((a,c)=>a+c.sdgs[s.id-1].target2030,0)/filtered.length;` |
| `bondAlignSummary` | `useMemo(()=>{ return SDGS.filter(s=>s.social).map(s=>{ const aligned=filtered.filter(c=>c.sdgs[s.id-1].bondAlign).length;` |
| `portfolio` | `useMemo(()=>{ return COUNTRIES.slice(0,25).map((c,i)=>{ const weight=clamp(3+sr(i*999)*10,1,14);` |
| `adjYield` | `c.bondYield*(1+((50-c.composite)/200));` |
| `totalWeight` | `portfolio.reduce((a,p)=>a+p.weight,0);` |
| `normalised` | `portfolio.map(p=>({...p,normWeight:+(p.weight/totalWeight*100).toFixed(1)}));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `DIMS`, `DIM_COLORS`, `DIM_DESC`, `DIM_KEYS`, `INCOME_GROUPS`, `QUARTERS`, `RAW_COUNTRIES`, `REGIONS`, `SCORE_TIERS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Countries Indexed | — | UNDP/ILO/WB | Countries with complete social index scoring across all four dimensions. |
| Highest Social Score | — | Calculated | Country with highest composite sovereign social index score. |
| Portfolio Avg Social | — | Weighted avg | AUM-weighted mean social index score across sovereign bond portfolio. |
- **UNDP HDI, World Bank Gini, ILO EPLEX, IMF social spending data** → Indicator normalisation, pillar weighting, composite aggregation → **Sovereign social index scores, country rankings, portfolio social exposure**

## 5 · Intermediate Transformation Logic
**Methodology:** Sovereign Social Index
**Headline formula:** `(HDI × 0.30) + (Inequality × 0.25) + (Labour Rights × 0.25) + (Social Safety Net × 0.20)`

Weighted composite of human development, inequality, labour rights and social protection indicators producing a 0–100 social index per country.

**Standards:** ['UNDP HDI', 'World Bank Gini', 'ILO EPLEX', 'IMF Fiscal Monitor']
**Reference documents:** UNDP Human Development Report 2024; World Bank Gini Coefficient and Poverty Data; ILO Employment Protection Legislation Database; IMF Fiscal Monitor Social Spending Module

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's formula is `(HDI×0.30) + (Inequality×0.25) +
> (Labour Rights×0.25) + (Social Safety Net×0.20)` — a 4-dimension weighted blend sourced from
> UNDP/World Bank/ILO/IMF. **The code computes an unweighted mean of 8 dimensions**
> (`HDI, Gini Equality, Healthcare, Education, Labour Rights, Gender Equity, Press Freedom, Food
> Security`), and none of those 8 dimensions is itself sourced from UNDP/WB/ILO/IMF data — every
> one is generated by the same single formula conditioned only on income tier and GDP per capita,
> plus independent noise. There is no "Social Safety Net" dimension in the code at all. Sections
> below document what the code actually computes.

### 7.1 What the module computes

For 80 countries (`RAW_COUNTRIES`, hand-typed with real 2023-ish population/GDP figures), each of 8
social dimensions is generated by the **same shared formula**:

```
base = income==='High' ? 68 : income==='Upper-Mid' ? 48 : income==='Lower-Mid' ? 35 : 25
gdpFactor = clamp(gdp_pc/1200, 0, 20)
dim_k = clamp( base + gdpFactor + sr(idx×100 + k×17)×24 − 8,  8, 98 )      // k = 0..7 (one per dimension)

composite = mean(dim_0 .. dim_7)                                            // unweighted, 1/8 each
```

Because every dimension shares the identical `base + gdpFactor` term and differs only by an
independent ±8-to-+16-point noise draw, **the 8 dimensions are highly correlated by construction** —
a country's HDI, Gini-equality, healthcare, education, labour, gender, press-freedom and
food-security scores will all cluster tightly around the same income-tier-implied centre, which is
not how real cross-country social indicators behave (e.g. the US has high HDI/healthcare-spend but
comparatively weak press-freedom-index performance relative to peers; that kind of divergence cannot
emerge from this formula beyond the shared ±noise band).

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Income-tier `base` | High 68 / Upper-Mid 48 / Lower-Mid 35 / Low 25 | Synthetic — 4-tier World-Bank-style income classification is real, but the score offsets are hand-tuned, not fitted |
| `gdpFactor` | `clamp(gdp_pc/1200, 0, 20)` | Synthetic; caps at $24,000 GDP/capita (any richer country gets the same +20 boost) |
| Noise range | ±8 to +16 points (`sr()×24−8`) | Synthetic demo value |
| Clamp bounds | [8, 98] | Synthetic |
| Composite weights | 1/8 each (equal) | Contradicts guide's stated 0.30/0.25/0.25/0.20 |
| `bondYield` | `clamp(1.2+(100−composite)×0.06+sr()×1.5, 0.3, 14)` | Synthetic — a linear "social score → yield" mapping, not an actual credit/spread model |
| `rating` | 15-tier scale (`AAA`…`B`) from `ratingIdx=clamp(floor((100−composite)/7),0,14)` | Synthetic — implies social score alone determines credit rating, a significant methodological simplification |

### 7.3 Calculation walkthrough

1. **Dimension + composite generation** — as above, once per country at module load.
2. **Quarterly trend** — each dimension gets a 12-quarter path with a per-country/per-dimension
   drift term (`drift=(sr()−0.45)×2.5`, multiplied by `(qi−6)` so it fans out from the current
   quarter), clamped to [5,99].
3. **SDG scores** — each of the 17 UN SDGs (8 flagged `social:true` — SDGs 1,2,3,4,5,8,10,16) gets
   a score `= clamp(composite×0.7 + sr()×35, 5, 98)` and a `target2030` and a boolean `bondAlign`
   flag (`sr()>0.5`) — again, everything traces back to the same composite plus fresh noise, not to
   distinct SDG-indicator data.
4. **Sovereign bond linkage** — `bondYield` and `rating` are both monotonic, deterministic functions
   of `composite` (plus small noise on yield only) — a country's synthetic yield and rating are
   *fully determined* by its synthetic social score, which is a real modelling relationship (better
   social composite ⇒ tighter yield ⇒ higher rating tier) even though the underlying inputs are
   synthetic.
5. **Peer group** — categorical bucket (`Leader ≥80`, `Strong ≥60`, `Moderate ≥40`, `Weak <40`) off
   `composite`.
6. **Cross-cuts** — regional averages, income-group breakdowns, quartile rankings, a Pearson
   correlation matrix (`corrMatrix`) computed across the 8 dimensions **within this same synthetic
   dataset** — meaningful as a demonstration of the shared-driver correlation structure described in
   §7.1, not as evidence about real-world social-indicator correlation.
7. **Portfolio** — 25 synthetic sovereign bond holdings with weight, adjusted yield
   (`c.bondYield×(1+(50−composite)/200)`), normalised to 100%.

### 7.4 Worked example — Denmark (index 0)

`income='High'`, `gdp_pc=$67,800` → `base=68`, `gdpFactor=clamp(67800/1200,0,20)=20` (capped).

| Dimension | `sr(0×100+k×17)` | Result |
|---|---|---|
| HDI | sr(0) | 97.0 |
| Gini Equality | sr(17) | 83.1 |
| Healthcare | sr(34) | 84.2 |
| Education | sr(51) | 86.6 |
| Labour | sr(68) | 83.6 |
| Gender | sr(85) | 90.0 |
| Press | sr(102) | 98.0 (clamp ceiling) |
| Food | sr(119) | 82.7 |
| **Composite** | mean | **88.15** |

Downstream: `bondYield = clamp(1.2+(100−88.15)×0.06+sr(600)×1.5, 0.3, 14) ≈ 2.98%`;
`ratingIdx = floor((100−88.15)/7) = 1` → **rating "AA+"**. This lands close to Denmark's real AAA
sovereign rating — a coincidence of the formula's calibration for very-high-income countries, not
evidence the model tracks real creditworthiness drivers.

### 7.5 Companion analytics

- **Dimension correlation matrix** — Pearson correlation across the 8 dimensions computed from the
  80-country synthetic panel; will show artificially high positive correlation (see §7.1).
- **SDG alignment summary** — counts of countries meeting bond-alignment flags per social SDG,
  purely cosmetic given `bondAlign` is an independent coin-flip.
- **Portfolio tab** — 25-holding synthetic sovereign social-bond portfolio with normalised weights
  and a composite-adjusted yield.

### 7.6 Data provenance & limitations

- **Fully synthetic scores.** No UNDP HDI, World Bank Gini, ILO EPLEX, or IMF Fiscal Monitor data is
  ingested despite being named in the guide — `RAW_COUNTRIES`' population/GDP figures are real-ish
  hand-typed context, but every social dimension score is generated from income tier + noise only.
- The 8-dimension unweighted mean structurally cannot reproduce the guide's 4-dimension weighted
  formula, and the "Social Safety Net" dimension named in the guide does not exist in code at all.
- `bondYield`/`rating` being deterministic functions of the *social* composite alone (with no debt,
  fiscal, or macro input) is a stylised toy relationship — real sovereign ratings weight fiscal
  metrics, external liquidity, and political risk far more heavily than social indicators per S&P/
  Moody's published criteria.
- Same-seed correlation structure means any statistical analysis run against this dataset (e.g. the
  in-page correlation matrix) will overstate real-world indicator correlation.

**Framework alignment:** UNDP HDI / World Bank Gini / ILO EPLEX / IMF Fiscal Monitor are named
guide sources but not implemented; UN SDG framework (17 goals, correct social-SDG flagging of
1/2/3/4/5/8/10/16) is reproduced structurally though scores are synthetic. See sovereign-esg-scorer
and sovereign-esg-scorer's §8 for the indicator-normalisation model this module would need to
genuinely implement its own guide's formula.

## 9 · Future Evolution

### 9.1 Evolution A — Real indicator inputs with genuine cross-country divergence (analytics ladder: rung 1 → 3)

**What.** The §7 flag documents both a formula mismatch and a deeper structural flaw: the guide promises a 4-dimension weighted blend (`HDI×0.30 + Inequality×0.25 + Labour×0.25 + Safety Net×0.20`) from UNDP/WB/ILO/IMF data, but the code computes an **unweighted mean of 8 dimensions all generated by the same `base + gdpFactor + noise` formula** conditioned only on income tier — there is no "Social Safety Net" dimension, and no real data is ingested. Worse, because every dimension shares the identical income-tier centre, they are **highly correlated by construction**: the module cannot reproduce real divergence (a country with high HDI but weak press freedom), and any correlation analysis run against it overstates real-world indicator correlation. Evolution A ingests the real indicators.

**How.** (1) Ingest the named sources per country: UNDP HDI, World Bank Gini, ILO EPLEX labour-rights compliance, IMF Fiscal Monitor social spending — all free/public. (2) Normalise each to 0–100 (documented percentile or min-max) and compute the guide's 4-dimension weighted composite, adding the missing Safety Net dimension. (3) Because dimensions now come from independent real sources, genuine divergence emerges — the US's HDI/press-freedom split becomes representable. (4) Fix the toy `bondYield`/`rating` relationship (currently a function of the social composite alone) to be honest: sovereign ratings weight fiscal/external factors far more than social ones, so either drop it or clearly label it as a social-only overlay.

**Prerequisites.** HDI/Gini/EPLEX/IMF ingestion; a normalisation reference. Shares the indicator-model build with `sovereign-esg-scorer` — do them together. **Acceptance:** the composite uses the 4-dimension weights; two countries with the same income tier show divergent dimension profiles; the in-page correlation matrix reflects real, not construction-induced, correlation.

### 9.2 Evolution B — Social-trajectory monitoring copilot (LLM tier 1)

**What.** The module's workflow ends with "flag countries with deteriorating social trajectories" — a monitoring task. Evolution B answers "why does this country's social index lag its income peers?", "which dimension is deteriorating?", "rank my sovereign universe by labour-rights compliance" — from the real indicator inputs and the weighted composite.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/sovereign-social-index/ask`, corpus = this Atlas record plus the indicator catalogue and framework notes (HDI/Gini/EPLEX/IMF). Index explanations decompose the composite into its four weighted dimensions with sourced values; trajectory answers require a time series (feasible once real data with vintages is ingested). Refusal for countries or dimensions outside coverage.

**Prerequisites (hard).** Evolution A — with all dimensions sharing one synthetic centre, "which dimension is weakest?" has no meaningful answer; the copilot would narrate noise. **Acceptance:** every dimension value cited traces to a real source vintage; the decomposition sums to the composite under the stated weights; a country outside coverage returns a refusal.