# Ratings Migration Momentum
**Module ID:** `ratings-migration-momentum` · **Route:** `/ratings-migration-momentum` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Generates ESG rating upgrade and downgrade momentum signals from historical migration matrices to identify positive and negative ESG trajectories.

> **Business value:** Transforms historical ESG rating data into forward-looking momentum signals, providing systematic investors with an ESG quality improvement factor.

**How an analyst works this module:**
- Select universe and time window for migration analysis.
- Compute upgrade/downgrade frequencies and migration matrix.
- Construct momentum score with recency weighting.
- Identify long/short momentum candidates for engagement or portfolio tilt.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AlphaSignalBuilder`, `COMPANIES`, `COMPANY_NAMES`, `ESG_EVENTS`, `KPI`, `MigrationTracker`, `MomentumSignals`, `PROVIDERS`, `PROV_COLORS`, `ProviderLeadLag`, `QUARTERS`, `RATINGS`, `SECTORS`, `Spark`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ESG_EVENTS` | 16 | `id`, `name`, `type`, `quarter`, `desc` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `QUARTERS` | `['Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25','Q3-25','Q4-25','Q1-26','Q2-26','Q3-26','Q4-26'];` |
| `genCompanies` | `(count)=>COMPANY_NAMES.slice(0,count).map((name,i)=>({` |
| `base` | `Math.floor(sr(i*100+pi*13+qi*3)*5)+1;` |
| `rLabel` | `(idx)=>RATINGS[Math.max(0,Math.min(6,idx))]\|\|'CCC';` |
| `pts` | `data.map((v,i)=>`${(i/(data.length-1))*w},${h-(((v-mn)/rng)*h)}`).join(' ');` |
| `tabs` | `['Migration Tracker','Momentum Signals','Provider Lead-Lag','Alpha Signal Builder'];` |
| `activeProviders` | `useMemo(()=>PROVIDERS.map((_p,i)=>provFilter[i]?i:null).filter(x=>x!==null),[provFilter]);` |
| `from` | `c.ratings[pi][qPair],to=c.ratings[pi][qPair+1];` |
| `total` | `ups+downs+stable;` |
| `upDownData` | `useMemo(()=>PROVIDERS.map((p,pi)=>{` |
| `diff` | `c.ratings[pi][qPair]-c.ratings[pi][qPair+1];` |
| `paged` | `filtered.slice(page*perPage,(page+1)*perPage);` |
| `totalPages` | `Math.ceil(filtered.length/perPage);` |
| `avg` | `activeProviders.length?activeProviders.reduce((s,pi)=>s+(c.ratings[pi][qPair]-c.ratings[pi][qPair+1]),0)/activeProviders.length:0;` |
| `momentum` | `useMemo(()=>COMPANIES.map(c=>{` |
| `provScores` | `PROVIDERS.map((_p,pi)=>{` |
| `avgMomentum` | `provScores.reduce((s,x)=>s+x.score,0)/PROVIDERS.length;` |
| `maxConsec` | `Math.max(...provScores.map(x=>x.consec));` |
| `sparkData` | `QUARTERS.map((_q,qi)=>PROVIDERS.reduce((s,_p,pi)=>s+(7-c.ratings[pi][qi]),0)/PROVIDERS.length);` |
| `portfolioIndex` | `useMemo(()=>QUARTERS.map((q,qi)=>{` |
| `sectorHeatmap` | `useMemo(()=>SECTORS.map(sec=>{` |
| `heatVals` | `sectorHeatmap.flatMap(r=>PROVIDERS.map(p=>r[p]));` |
| `heatMin` | `Math.min(...heatVals),heatMax=Math.max(...heatVals);` |
| `handleSort` | `(col)=>{if(sortCol===col)setSortDir(d=>d*-1);else{setSortCol(col);setSortDir(-1);}};` |
| `pct` | `Math.abs(ps.score)/5*100;` |
| `diffI` | `c.ratings[pi][qi]-c.ratings[pi][qi-1];` |
| `diffJ` | `c.ratings[pj][qj]-c.ratings[pj][qj-1];` |
| `eventReactions` | `useMemo(()=>ESG_EVENTS.map(ev=>{` |
| `reactions` | `PROVIDERS.map((_p,pi)=>{` |
| `affected` | `COMPANIES.filter(c=>sr(c.id*ev.id+pi*7)>0.5);` |
| `row` | `{bucket:`${b}-${b+0.5}Q`};` |
| `speed` | `sr(c.id*101+pi*21+qi)*4;` |
| `signals` | `useMemo(()=>COMPANIES.map(c=>{` |
| `entryQ` | `QUARTERS[Math.max(0,Math.floor(sr(c.id*77)*6))];` |
| `pnl` | `signal==='Long'?+(sr(c.id*123)*30-5).toFixed(2):signal==='Short'?+(sr(c.id*456)*20-15).toFixed(2):0;` |
| `curve` | `QUARTERS.map((q,qi)=>{` |
| `ret` | `activeSignals.reduce((s,c)=>{` |
| `avgChange` | `PROVIDERS.reduce((ss,_p,pi)=>ss+(c.ratings[pi][Math.min(qi,QUARTERS.length-1)]-c.ratings[pi][Math.max(0,qi-1)]),0)/PROVIDERS.length;` |
| `drawdown` | `curve.map(c=>{peak=Math.max(peak,c.equity);return{q:c.q,dd:+((c.equity-peak)/peak*100).toFixed(2)};});` |
| `avgRet` | `returns.reduce((a,b)=>a+b,0)/returns.length;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPANY_NAMES`, `ESG_EVENTS`, `PROVIDERS`, `PROV_COLORS`, `QUARTERS`, `RATINGS`, `SECTORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Coverage Universe | — | ESG Rating Database | Securities with at least 12 months of ESG rating history for momentum calculation. |
| Top Decile Momentum (avg Δscore) | — | Migration Analytics | Average 12-month score improvement for top-decile momentum companies. |
| Momentum Signal IC | — | Backtest Engine | Information coefficient of momentum signal vs 12-month forward ESG ratings. |
- **Historical ESG rating time series** → Migration event detection; momentum score construction; backtest → **Momentum signal scores, migration matrix, and long/short candidate list**

## 5 · Intermediate Transformation Logic
**Methodology:** Migration Momentum Score
**Headline formula:** `Mᵢ = Σ(upgrade_events – downgrade_events) / T × recency_weight`

Net upgrade velocity adjusted for recency weighting over trailing 24-month rating history.

**Standards:** ['MSCI ESG Rating History', 'Sustainalytics Rating History']
**Reference documents:** MSCI ESG Ratings Methodology; Avramov et al. (2022) Sustainable Investing with ESG Rating Uncertainty

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This module applies genuine **rating-migration and momentum analytics** — the standard credit/ESG
transition-matrix toolkit — to a synthetic panel of 150 companies (real names) × 6 providers × 12
quarters. The *machinery* is methodologically correct (transition matrices, notch-change momentum,
provider lead-lag); the *ratings themselves* are `sr()`-seeded, so outputs are illustrative, not real.

### 7.1 What the module computes

**Rating panel** (`genCompanies`): each company gets, per provider × quarter, an integer rating
0–6 (AAA…CCC) via a base draw plus a Markov-like drift:

```js
base  = floor(sr(i·100+pi·13+qi·3)·5) + 1                          // 1–5
drift = qi>0 ? (sr(·)>0.7 ? −1 : sr(·)<0.15 ? +1 : 0) : 0          // small up/down notch
rating[pi][qi] = clamp(base + drift, 0, 6)
```

**Transition matrix** (`migrationFor`) — the load-bearing analytic, a proper 7×7 migration count:

```js
mat = 7×7 zeros
for each company: mat[ rating[from-quarter] ][ rating[to-quarter] ]++
```

Each cell `mat[i][j]` = number of companies that moved from notch i to notch j between the two
selected quarters — exactly a rating **transition matrix** (diagonal = stable, upper/lower triangles
= up/downgrades).

**Momentum** (`momentum`) — average notch improvement across providers:

```js
provScore_p = rating[p][q] − rating[p][q+1]        // positive = upgrade (lower index = better)
avgMomentum = mean_p(provScore_p)
direction   = avgMomentum>0.3 ? 'Positive' : <−0.3 ? 'Negative' : 'Neutral'
sparkData   = per quarter, mean_p(7 − rating[p][q])   // "goodness" trend line
```

**Lead-lag** (`leadLag`) compares which provider moves first; **alpha signal builder** ranks
companies by momentum for a long/short construction.

### 7.2 Parameterisation / provenance

| Quantity | Value | Provenance |
|---|---|---|
| Company names (150) | fixed list | **real** (NextEra…SLC Agricola) |
| ESG events (15) | dated event log | **real-flavoured** (CSRD wave, Boeing crisis, PFAS litigation) |
| Rating scale | AAA…CCC (7 notches) | **real** convention |
| Ratings panel | `base + drift` seeded | **synthetic** |
| marketCap | `sr(i·31)·900+10` | synthetic |
| Migration matrix | counted from panel | **correct method**, synthetic inputs |

The 15 ESG events are realistic and dated to quarters, giving qualitative context; the rating
movements are not actually driven by these events (they are independent seeded drifts).

### 7.3 Calculation walkthrough

1. `genCompanies(150)` seeds the rating panel (6 providers × 12 quarters each).
2. Migration tab: pick provider + from/to quarter → `migrationFor` builds the 7×7 count matrix and a
   drill-down of which companies occupy each cell.
3. Momentum tab: per company, average notch change across providers → momentum score, direction,
   sparkline; aggregated to positive/negative/neutral shares and per-sector momentum.
4. Lead-lag tab: cross-provider timing of moves.
5. Alpha tab: rank by momentum for a long-short signal.

### 7.4 Worked example (transition matrix + momentum)

Suppose for provider MSCI, between Q1-25 and Q2-25, of 150 companies: 90 stay on the diagonal, 35
upgrade one notch (cells above diagonal), 25 downgrade. The matrix's off-diagonal mass (60/150 = 40%)
is the **migration rate**; the net (35 up − 25 down = +10) indicates mild positive drift.
For a single company rated A(2)→AA(1) at MSCI: `provScore = 2 − 1 = +1` (an upgrade). Averaged with
the other five providers (say +1, 0, +1, 0, −1) → `avgMomentum = (1+1+0+1+0−1)/6 = +0.33` → **Positive**
(just above the +0.3 threshold). The sparkline plots `mean_p(7 − rating)` per quarter, so a rising
line = improving average rating.

### 7.5 Data provenance & limitations

- **Company names and ESG events are real; the rating panel is synthetic**, seeded by
  `sr(seed)=frac(sin(seed+1)×10⁴)` with a base+drift process.
- The **transition matrix and momentum are computed correctly** — the analytics are legitimate; only
  the inputs are fabricated.
- Ratings are **not event-driven**: the 15 ESG events are decorative context, not linked to the
  drift, so a company near "Boeing Safety Crisis" need not show a governance downgrade.
- The drift is a memoryless ±1 notch step (not a calibrated transition-probability matrix), so the
  migration matrix reflects the drift distribution, not observed agency transition frequencies.
- No absorbing default state, no through-the-cycle vs point-in-time distinction.

**Framework alignment:** **Rating transition matrices** are the core of credit-migration analytics
(S&P/Moody's annual transition studies; used in IFRS 9 lifetime-ECL PD term structures and Basel
IRB). The 7×7 count matrix here is the ESG-rating analogue. **ESG-rating momentum** as an alpha signal
mirrors MSCI ESG-momentum research (upgrades tend to precede outperformance). **Provider lead-lag**
addresses the well-documented **ESG-rating divergence** across MSCI/S&P/Sustainalytics/ISS/CDP/
Refinitiv. The methods are sound; the limitation is synthetic ratings and an uncalibrated drift
process rather than a fitted transition model. A production version would estimate a real
provider-specific transition-probability matrix from historical rating histories (a Markov MLE),
which is a data problem, not a modelling gap in the displayed analytics.

## 9 · Future Evolution

### 9.1 Evolution A — Real rating-history panel behind correct machinery (analytics ladder: rung 1 → 3)

**What.** §7's verdict is the useful kind: the machinery is methodologically correct — a proper 7×7 transition-count matrix, notch-change momentum, provider lead-lag — but the panel it runs on (150 companies × 6 providers × 12 quarters) is `sr()`-seeded, and the Alpha Signal Builder's PnL is a direct random draw (`pnl = sr(c.id·123)·30−5`), which is fabrication in the platform's strict sense even though the surrounding logic is sound. Evolution A keeps the analytics and replaces the panel: a persisted `esg_rating_history` table populated from whatever the platform can legitimately hold (user-uploaded licensed histories, the platform's own disclosure-derived scores over time, CDP score vintages), with the transition/momentum/lead-lag code ported server-side and pinned.

**How.** (1) `api/v1/routes/ratings_migration.py`: `POST /migration-matrix` (the existing 7×7 count logic over stored history, with row-normalised probabilities added — the standard estimator the page stops short of), `POST /momentum` implementing the guide's recency-weighted `Mᵢ = Σ(up − down)/T × w(t)` which the code approximates without the recency weight today. (2) The Alpha Signal Builder's seeded PnL is deleted, not migrated — signal backtests only become legitimate when both rating history and return history exist; until then the tab shows signal ranks without PnL claims. (3) Bench pin: a hand-built 3-company panel with known transitions reproducing its matrix exactly.

**Prerequisites.** A real rating-history source (the gating decision — user upload path is the licensing-safe default); coordination with `predictive-esg`, which needs the same panel as training labels. **Acceptance:** matrix row sums equal cohort counts; momentum scores recompute identically from stored history; no PnL figure appears anywhere without a returns dataset behind it.

### 9.2 Evolution B — Momentum-watchlist copilot (LLM tier 2)

**What.** The module's output is a long/short candidate list for engagement or tilt decisions. The copilot operationalizes it: "which holdings show 2+ consecutive downgrade quarters across at least 3 providers?", "explain this issuer's momentum score — which provider moved first, and did the others follow?" — the lead-lag question being exactly what the module's provider lead-lag tab computes and an LLM can narrate from tool output (`POST /momentum`, `POST /migration-matrix`, the lead-lag endpoint).

**How.** Tier-2 tool schemas over the Evolution-A endpoints; system prompt carries the Avramov et al. rating-uncertainty framing the guide cites — the copilot must present cross-provider disagreement as signal-relevant uncertainty, not average it away silently. Watchlist exports compose with the sibling `proxy-voting-climate`/`predictive-esg` copilots via the desk-orchestration tier later; in this module's scope, answers stay within its own computed surface. Every notch change, consecutive-quarter count, and momentum score validated against tool outputs.

**Prerequisites (hard).** Evolution A panel with real or clearly-fixture data — narrating seeded migrations as issuer history is the exact fabrication class the platform purged. **Acceptance:** a watchlist answer's every count reproduces from the migration endpoint, and momentum explanations name the actual first-moving provider from the lead-lag output.