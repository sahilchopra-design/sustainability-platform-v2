# DME Contagion
**Module ID:** `dme-contagion` · **Route:** `/dme-contagion` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Systemic materiality contagion mapping that traces how material ESG risks propagate across supply chains, sector networks, and financial portfolios. Network analysis identifies contagion amplifiers and systemic nodes. Stress scenarios model contagion spread under accelerated materialisation of a triggering event.

> **Business value:** Reveals how ESG risks can amplify across supply chains and financial networks, enabling risk managers to identify systemic nodes that warrant priority attention or engagement. Contagion scenarios inform portfolio stress testing and counterparty risk limits.

**How an analyst works this module:**
- Load the supply chain graph by connecting the network data source or importing a counterparty matrix
- Select a triggering ESG event (e.g. regulatory shock, physical hazard) and a source node
- Review the contagion heat map showing propagation intensity and depth through the network
- Identify systemic amplifier nodes and flag them for enhanced monitoring or engagement

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `ADJ_LABELS`, `ADJ_MATRIX`, `API`, `DME_CONTAGION_API`, `ENTITIES`, `ENTITY_IDS`, `ENTITY_NAMES`, `ENTITY_SECTORS`, `HIST_EVENTS`, `LiveBadge`, `PIECLRS`, `REGIONS_LIST`, `SEC8`, `SECTORS_LIST`, `SEC_MATRIX`, `SHOCK_SCENARIOS`, `SIR_DATA`, `SIR_STEPS`, `TABS`, `TRANSMISSION_MATRIX`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `HIST_EVENTS` | 16 | `year`, `event`, `severity`, `networkSim`, `affected`, `recovery`, `channel` |
| `SHOCK_SCENARIOS` | 5 | `name`, `target`, `infected`, `timeToPeak`, `recoveryRate`, `lossB` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `DME_CONTAGION_API` | ``${API}/api/v1/dme-contagion`;` |
| `REGIONS_LIST` | `['North America','Europe','Asia-Pacific','Latin America','Middle East'];` |
| `ENTITIES` | `ENTITY_NAMES.map((name,i)=>{` |
| `region` | `REGIONS_LIST[Math.floor(sr(i*7)*REGIONS_LIST.length)];` |
| `degreeCentrality` | `+(sr(i*11)*0.85+0.1).toFixed(3);` |
| `betweenness` | `+(sr(i*13)*0.7+0.05).toFixed(3);` |
| `closeness` | `+(sr(i*17)*0.75+0.15).toFixed(3);` |
| `eigenvector` | `+(sr(i*19)*0.9+0.05).toFixed(3);` |
| `avgCentrality` | `+((degreeCentrality+betweenness+closeness+eigenvector)/4).toFixed(3);` |
| `inDegree` | `Math.round(2+sr(i*23)*18);` |
| `outDegree` | `Math.round(2+sr(i*29)*16);` |
| `exposureB` | `+(0.5+sr(i*31)*12).toFixed(2);   // $B bilateral exposure` |
| `leverageRatio` | `+(5+sr(i*37)*20).toFixed(1);` |
| `liquidityCoverage` | `+(80+sr(i*41)*120).toFixed(0);` |
| `stressedPD` | `+(0.01+sr(i*43)*0.15).toFixed(4);` |
| `systemicScore` | `+(degreeCentrality*0.3+betweenness*0.35+eigenvector*0.35)*100;` |
| `systemicTier` | `systemicScore>55?'G-SIB':systemicScore>35?'D-SIB':systemicScore>20?'Significant':'Standard';` |
| `sirState` | `'S'; // initial SIR state` |
| `cascadeLoss` | `+(exposureB*stressedPD*leverageRatio*0.4).toFixed(3);` |
| `clusterCoeff` | `+(sr(i*47)*0.7+0.1).toFixed(3);` |
| `zScore` | `+(sr(i*53)*3-0.5).toFixed(2);       // early warning z-score` |
| `earlyWarn` | `Math.abs(parseFloat(zScore))>2?'ALERT':Math.abs(parseFloat(zScore))>1.2?'WATCH':'NORMAL';` |
| `capitalSurcharge` | `+(systemicScore*0.04+1).toFixed(2); // % additional capital` |
| `ADJ_LABELS` | `ENTITY_NAMES.slice(0,10).map(n=>n.split(' ')[0]);` |
| `hubIdx` | `ENTITIES.reduce((best,e,i)=>e.eigenvector>ENTITIES[best].eigenvector?i:best,0);` |
| `beta` | `0.28,gamma=0.09; // infection rate, recovery rate` |
| `newInfected` | `Math.round(beta*S*I/N+sr(t*17)*2);` |
| `newRecovered` | `Math.round(gamma*I);` |
| `SHOCK_SIM_PARAMS` | `useMemo(()=>[ {betaDecay:0.7, severity:0.60, eventType:'SECTOR_SHOCK'},      // Sector-Level Shock {betaDecay:0.5, severity:0.75, eventType:'ENTITY_DEFAULT'},    // Entity-Level Shock {betaDecay:0.35,severity:0.90, eventType:'MARKET_WIDE_SHOCK'}, // Market-Wide Shock {betaDecay:0.6, severity:0.65, eventType:'CLIMATE_REPRICING'}, // Climat` |
| `l1Events` | `ENTITIES.map((e,i)=>({i,w:hubRow[i]}))` |
| `l2Events` | `[...HIST_EVENTS].sort((a,b)=>b.year-a.year).slice(0,5)` |
| `sectorSRI` | `SECTORS_LIST.map(sec=>{` |
| `targetSector` | `[...sectorSRI].sort((a,b)=>b.avg-a.avg)[0].sector;` |
| `eventsBySector` | `Object.fromEntries(SECTORS_LIST.map((s,i)=>{` |
| `mag` | `SEC_MATRIX[i][targetSector]/50;` |
| `contagionRatio` | `Math.min(1, ENTITIES.reduce((s,e)=>s+e.systemicScore,0)/ENTITIES.length/100);` |
| `links` | `ENTITIES.reduce((s,e)=>s+e.outDegree,0);` |
| `avgCent` | `(ENTITIES.reduce((s,e)=>s+e.avgCentrality,0)/Math.max(1,total));` |
| `sri` | `(ENTITIES.reduce((s,e)=>s+e.systemicScore,0)/Math.max(1,total));` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/dme-contagion/edge-weight` | `compute_edge_weight` | api/v1/routes/dme_contagion.py |
| POST | `/api/v1/dme-contagion/l1-intensity` | `l1_intensity` | api/v1/routes/dme_contagion.py |
| POST | `/api/v1/dme-contagion/l2-intensity` | `l2_intensity` | api/v1/routes/dme_contagion.py |
| POST | `/api/v1/dme-contagion/l3-intensity` | `l3_intensity` | api/v1/routes/dme_contagion.py |
| POST | `/api/v1/dme-contagion/aggregate` | `aggregate` | api/v1/routes/dme_contagion.py |
| POST | `/api/v1/dme-contagion/stability-check` | `stability_check` | api/v1/routes/dme_contagion.py |
| POST | `/api/v1/dme-contagion/simulate` | `simulate` | api/v1/routes/dme_contagion.py |
| GET | `/api/v1/dme-contagion/ref/parameters` | `get_reference_data` | api/v1/routes/dme_contagion.py |

### 2.3 Engine `dme_contagion_engine` (services/dme_contagion_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `ContagionEngine.compute_edge_weight` | inp |  |
| `ContagionEngine.l1_intensity` | req |  |
| `ContagionEngine.l2_intensity` | req |  |
| `ContagionEngine.l3_intensity` | req |  |
| `ContagionEngine.aggregate` | req |  |
| `ContagionEngine.check_stability` | req |  |
| `ContagionEngine.simulate` | req | Simple cascade simulation: propagate from seed through adjacency. |
| `ContagionEngine.get_reference_data` |  |  |

**Engine `dme_contagion_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `CHANNEL_WEIGHTS` | `{'financial': 0.45, 'supply_chain': 0.35, 'regulatory': 0.2}` |
| `CROSS_PILLAR_AMP` | `{'G_to_E': 2.5, 'X_to_EL': 4.3, 'X_to_VaR': 4.5, 'X_to_ES': 3.2, 'S_to_P': 2.3, 'same_pillar': 1.0}` |
| `CROSS_SECTOR_DEFAULTS` | `{('Energy', 'Energy'): 0.35, ('Energy', 'Materials'): 0.25, ('Energy', 'Industrials'): 0.15, ('Financials', 'Financials'): 0.4, ('Financials', 'RealEstate'): 0.2}` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `fastapi` *(shared)*, `financial`, `seed`, `services` *(shared)*
**Frontend seed datasets:** `ENTITY_NAMES`, `ENTITY_SECTORS`, `HIST_EVENTS`, `PIECLRS`, `REGIONS_LIST`, `SECTORS_LIST`, `SHOCK_SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Network Nodes Mapped | — | Supply chain graph database | Total entities modelled in the ESG contagion network including suppliers, customers, and financial counterparties |
| Systemic Amplifier Nodes | — | CPS ranking | Count of nodes in the top 1% of contagion propagation scores identified as systemic risks |
| Max Contagion Depth | — | Network traversal | Maximum supply chain distance over which contagion effects are modelled |
| Avg CPS (Portfolio) | — | Portfolio aggregation | Mean contagion propagation score across all portfolio companies |
- **Supply chain graph database (counterparty adjacency matrix)** → Network construction with directional exposure weights derived from spend or revenue share → **Weighted directed graph with entity metadata**
- **DME materiality scores (node-level)** → Node materiality assignment and CPS calculation via weighted graph traversal → **CPS ranking and systemic amplifier identification**
- **Contagion scenario engine** → Stress propagation simulation under user-selected trigger event and propagation speed assumptions → **Contagion heat map and cascade depth analysis by scenario**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/dme-contagion/ref/parameters** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['channel_weights', 'cross_pillar_amplifiers', 'cross_sector_defaults', 'empirical_targets'], 'n_keys': 4}`

**POST /api/v1/dme-contagion/aggregate** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/dme-contagion/edge-weight** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['financial', 'supply_chain', 'regulatory', 'composite'], 'n_keys': 4}`

**POST /api/v1/dme-contagion/l1-intensity** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/dme-contagion/l2-intensity** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/dme-contagion/l3-intensity** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/dme-contagion/simulate** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['scenario', 'seed_entity_id', 'seed_event_type', 'cascade_depth', 'entities_affected', 'total_intensity', 'spectral_radius', 'is_stable', 'cascade_log', 'final_intensities'], 'n_keys': 10}`

**POST /api/v1/dme-contagion/stability-check** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Contagion Propagation Score
**Headline formula:** `CPSᵢ = Σⱼ wᵢⱼ × Materialityⱼ × Exposureᵢⱼ`

The contagion propagation score for entity i sums the product of supply-chain exposure weight, materiality score, and directional dependency for all counterparty nodes j. High CPS entities are systemic amplifiers whose materialisation would cascade risk broadly through the network.

**Standards:** ['NGFS Network Analysis Framework', 'ECB Climate Stress Test Contagion Methodology', 'IPCC AR6 Compound Risk Framework']
**Reference documents:** NGFS (2022) Scenarios for Central Banks and Supervisors â€” Network Contagion Analysis; ECB (2021) Economy-wide Climate Stress Test â€” Methodology; IPCC AR6 WG2 (2022) â€” Chapter 16 Key Risks and Compound Events; FSB (2020) The Implications of Climate Change for Financial Stability

**Engine `dme_contagion_engine` — extracted transformation lines:**
```python
w_fin = alpha * (inp.ead_exposure / inp.portfolio_total) * (1 + gamma * inp.hhi_concentration)
w_sc = inp.revenue_share * (1 - inp.substitutability)
w_reg = theta1 * inp.jurisdiction_overlap + theta2 * inp.gics_similarity
dt_days = (req.current_time - evt_time).total_seconds() / 86400
intensity = req.mu_baseline + excitation
dt_months = (req.current_time - evt_time).days / 30.0
kernel = req.alpha_exponential * float(np.exp(-req.beta_exponential * dt_months))
kernel = req.power_law_C * ((dt_months + req.power_law_tau) ** (-(1 + req.power_law_gamma)))
dt_weeks = (req.current_time - evt_time).days / 7.0
l2_daily = req.lambda_L2_monthly / 21.0
l3_daily = req.lambda_L3_weekly / 5.0
base_amp = 1 + (agg / req.lambda_baseline - 1) if req.lambda_baseline > 0 else 1.0
excitation = sum(W[j, i] * intensities[j] * float(np.exp(-req.beta_decay * (step + 1)))
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (partial).** The guide describes a Contagion Propagation Score
> `CPSᵢ = Σⱼ wᵢⱼ · Materialityⱼ · Exposureᵢⱼ` over a 2,340-node supply-chain graph. The **backend engine
> (`dme_contagion_engine.py`) actually implements a rigorous multi-layer Hawkes-process model** —
> arguably *more* sophisticated than the guide's linear CPS — while the **frontend page renders a
> 40-entity network whose centrality metrics, SIR cascade and losses are entirely `sr()`-seeded
> synthetic numbers** that do *not* call the engine. So two different methodologies coexist: a real
> Hawkes engine (§7.1) and a demo SIR/centrality display (§7.3). Neither is the guide's CPS. The
> 2,340-node graph does not exist in code.

### 7.1 What the backend engine computes (the real model)

`ContagionEngine` is a **stateless three-layer self-exciting (Hawkes) intensity model**. Conditional
intensity λ(t) = baseline μ + Σ excitation from past events, decayed by a kernel:

**Edge weight** (counterparty coupling) — three channels blended:
```
w_fin = 0.7·(EAD/portfolio)·(1 + 0.3·HHI)
w_sc  = revenue_share·(1 − substitutability)
w_reg = 0.5·jurisdiction_overlap + 0.5·gics_similarity
composite = 0.45·w_fin + 0.35·w_sc + 0.20·w_reg          (CHANNEL_WEIGHTS)
```

**Layer 1 — entity-to-entity (daily), exponential kernel:**
```
λ₁ = μ + Σ_events  edge_w · severity · exp(−β·Δt_days)          (μ=0.05, β=0.5)
```
**Layer 2 — structural cascade (monthly), acute exponential + chronic power-law:**
```
acute events → α·exp(−β·Δt_months)                 (α=0.6, β=0.15)
other events → C·(Δt_months + τ)^(−(1+γ))          (power-law, γ=0.5)
```
**Layer 3 — capital flight (weekly), cross-sector herding:**
```
λ₃ = μ + Σ_sectors Σ_events  α_kj · exp(−β·Δt_weeks) · mag      (μ=0.03, β=0.3)
```
where `α_kj` is a cross-sector coupling (e.g. Energy→Energy 0.35, Financials→Financials 0.40).

**Aggregation** normalises L2/L3 to a daily base and weights the layers, then applies amplifiers:
```
agg = 0.40·λ₁ + 0.35·(λ₂/21) + 0.25·(λ₃/5)
base_amp = 1 + (agg/μ_baseline − 1)
EL/VaR/ES amplification = (1+contagion_ratio) × cross-pillar factor
```

**Stability** is checked by the **spectral radius of the branching matrix** `W/β`:
`is_stable = ρ(W/β) < 1` — the classic Hawkes stationarity condition. `simulate()` propagates a seed
shock through the adjacency matrix for N steps, logging entities-affected and total intensity.

### 7.2 Parameterisation / scoring rubric

| Constant | Value | Provenance (code) |
|---|---|---|
| Channel weights | fin 0.45 / sc 0.35 / reg 0.20 | `CHANNEL_WEIGHTS` — heuristic |
| Layer weights | L1 0.40 / L2 0.35 / L3 0.25 | `aggregate()` default |
| Cross-pillar amplifiers | G→E 2.5, X→EL 4.3, X→VaR 4.5, X→ES 3.2, S→P 2.3 | `CROSS_PILLAR_AMP` |
| Empirical targets | EL ×4.3, VaR ×4.5, ES ×3.2 (±10%) | engine docstring "empirical targets" |
| L1 kernel | μ=0.05, β=0.5 | Hawkes decay |
| L2 kernel | α=0.6, β=0.15, γ=0.5 | acute vs chronic split |
| L3 kernel | μ=0.03, β=0.3 | weekly herding |

The amplifier magnitudes (4.3/4.5/3.2) are described as *empirical targets* but no calibration dataset
is bundled — treat them as **assumed** until backtested.

### 7.3 Frontend display (synthetic, does not call the engine)

The page builds 40 entities across 8 sectors × 5 regions, each with **`sr()`-seeded** graph metrics:
`degreeCentrality = sr(i·11)·0.85+0.1`, `betweenness = sr(i·13)·0.7+0.05`, `closeness`, `eigenvector`.
A composite **systemic score** and G-SIB/D-SIB tiering are then derived:
```
systemicScore = (0.30·degree + 0.35·betweenness + 0.35·eigenvector) × 100
tier = >55 G-SIB | >35 D-SIB | >20 Significant | else Standard
capitalSurcharge % = 0.04·systemicScore + 1
cascadeLoss = exposureB · stressedPD · leverageRatio · 0.4
```
The **cascade** is a discrete **SIR epidemic** (not Hawkes): `β=0.28` infection, `γ=0.09` recovery,
seeded at the highest-eigenvector hub, over 20 steps, with `sr()` noise added to new infections.

### 7.4 Worked example (frontend systemic score & SIR step)

Entity i=5 (JPMorgan): `degree = sr(55)·0.85+0.1`, `betweenness = sr(65)·0.7+0.05`,
`eigenvector = sr(95)·0.9+0.05`. Suppose these resolve to 0.62 / 0.40 / 0.55.
```
systemicScore = (0.30·0.62 + 0.35·0.40 + 0.35·0.55)×100 = (0.186+0.140+0.1925)×100 = 51.85
tier = 51.85 > 35 → D-SIB      capitalSurcharge = 0.04·51.85 + 1 = 3.07%
```
SIR step 1 with N=40, S=39, I=1: `newInfected = round(0.28·39·1/40 + sr(17)·2)`. With β·S·I/N = 0.273
and sr(17)≈0.97·2 ≈ 1.9 → newInfected ≈ round(2.17) = 2; `newRecovered = round(0.09·1)=0`. So I→3, S→37.

### 7.5 Companion analytics

Centrality radar (top 8), sectoral 8×8 exposure matrix, critical-path (top-8 by eigenvector), historical
events (16 rows, e.g. GFC/COVID) with a `networkSim` field, 5 shock scenarios (target/infected/
timeToPeak/lossB), early-warning z-scores (`|z|>2 ALERT`), and a G-SIB→Standard capital-buffer roll-up.
The route file exposes 8 endpoints (`/edge-weight`, `/l1-…/l2-…/l3-intensity`, `/aggregate`,
`/simulate`, `/stability-check`) — these hit the real engine but the page's headline tiles do not.

### 7.6 Data provenance & limitations

- **Frontend: 100% synthetic.** All 40-entity metrics come from `sr(seed)=frac(sin(seed+1)×10⁴)`; the
  SIR cascade adds further `sr()` noise. Company names are real but their numbers are fabricated.
- **Backend: real maths, unproven calibration.** Kernels and stability check are textbook Hawkes; the
  amplifier constants (4.3/4.5/3.2) are asserted "empirical targets" with no bundled backtest.
- SIR ≠ Hawkes: the page's headline cascade uses a compartmental epidemic model, structurally different
  from the engine it nominally sits above — a reader should not conflate the two.

**Framework alignment:** **Hawkes self-exciting point processes** (Bacry-Muzy-style financial
contagion), **NGFS network-analysis** and **ECB economy-wide climate stress-test** contagion channels
(financial/supply-chain/regulatory), **FSB** systemic-risk / G-SIB designation logic (the frontend's
systemic-score → G-SIB/D-SIB tiering mirrors the BCBS G-SIB indicator approach, where BCBS actually
scores size, interconnectedness, substitutability, complexity and cross-jurisdictional activity — here
collapsed into three centrality proxies).

---

## 8 · Model Specification

**Status: specification — not yet implemented in code (frontend display).**

### 8.1 Purpose & scope
Give the frontend a *real* systemic-importance and cascade view driven by the backend Hawkes engine,
replacing the `sr()`-seeded centrality/SIR demo. Scope: the covered issuer/counterparty network.

### 8.2 Conceptual approach
Two-part: (a) a **DebtRank / eigenvector-based systemic-importance score** on the real exposure graph
(Battiston et al. DebtRank; ECB SYMBOL) and (b) the existing **multi-layer Hawkes intensity** for
dynamic contagion. Benchmarks: **ECB economy-wide climate stress test** network module, **NGFS** network
analysis, **FSB/BCBS G-SIB** indicator methodology, Battiston DebtRank.

### 8.3 Mathematical specification
```
Systemic importance (DebtRank):
  h_i(t+1) = min(1, h_i(t) + Σ_j W_ji · h_j(t) · (state_j = distressed))
  R_DebtRank = Σ_i v_i · (h_i(T) − h_i(0)) ,   v_i = economic value weight
Dynamic contagion: keep engine λ = μ + Σ kernel·excitation (Layers 1–3)
Systemic score = z-normalise(R_DebtRank) → percentile → G-SIB/D-SIB tier
Capital surcharge %: map bucketed score to BCBS G-SIB buffer (1.0–3.5%)
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Bilateral exposures | `W_ji` | EAD/portfolio (existing engine EdgeWeightInput) |
| Value weights | `v_i` | market cap / total assets |
| Hawkes kernels | μ, β, α, γ | MLE on historical shock-clustering (event log) |
| Buffer buckets | — | BCBS G-SIB framework (2018) |

### 8.4 Data requirements
Bilateral exposure matrix (EAD, revenue share, jurisdiction/GICS overlap — already in `EdgeWeightInput`),
event log with timestamps/severity for kernel MLE, market-value weights. Free sources: BIS
cross-border banking statistics, FSB G-SIB list; vendor: supply-chain graph (Bloomberg SPLC).

### 8.5 Validation & benchmarking plan
Reconcile DebtRank ordering against the published FSB G-SIB bucket list (rank correlation). Backtest
Hawkes kernels by out-of-sample event-clustering likelihood. Confirm `ρ(W/β)<1` stationarity on the
real matrix; stress it toward instability to verify the check fires.

### 8.6 Limitations & model risk
DebtRank assumes exposures are known and static; real networks are partially observed. Hawkes kernel
MLE needs a long, clean event history the platform does not yet hold. Conservative fallback: absent a
calibrated kernel, cap amplifiers at 1.0 (no amplification) rather than the unvalidated 4.x factors.

## 9 · Future Evolution

### 9.1 Evolution A — Real network in, calibrated cascade out (analytics ladder: rung 2 → 3)

**What.** The backend is genuine and already scenario-capable: `ContagionEngine` computes channel-weighted edge weights (financial 0.45 / supply_chain 0.35 / regulatory 0.20), L1–L3 intensities with cross-pillar amplifiers, stability checks, and cascade simulation across 8 endpoints — `ref/parameters` even exposes an `empirical_targets` key. The gap is upstream and on the page: the frontend's ENTITIES network is `sr()`-seeded (centralities, exposures, stressed PDs, the in-page SIR model with `sr(t*17)` noise), and only `edge-weight` and `ref/parameters` traced `passed`; the five other POSTs were `skipped`, never exercised end-to-end. Evolution A feeds the engine a real network and calibrates it.

**How.** (1) Build the adjacency input from platform data instead of seeds: counterparty edges from the Sprint-DN supply-chain tables and `energy-supplier-network` relationships, entity nodes resolved via `entity_lei` (GLEIF). (2) Page computes centralities from the actual graph (networkx server-side, returned by a new `/network-stats` endpoint) and calls `POST /simulate` for cascades — deleting the client-side SIR and seeded SHOCK_SCENARIOS losses. (3) Calibration: fit `CROSS_SECTOR_DEFAULTS` and channel weights against the 16 curated HIST_EVENTS (recovery times, affected counts) and document fit error against the engine's own `empirical_targets`.

**Prerequisites.** Supply-chain edge coverage audit (the graph is only as real as its edges — sparse coverage must be disclosed, not padded); lineage sweep re-run to exercise the 5 skipped POSTs. **Acceptance:** all 8 endpoints `passed` with real source tables; cascade results change when a real edge is removed; calibration error vs HIST_EVENTS published in the response.

### 9.2 Evolution B — Contagion war-gaming analyst (LLM tier 2)

**What.** A tool-calling analyst for stress questions: "if a major EU utility defaults, which portfolio names are hit within two hops, and does the network stay stable?" The LLM composes the module's real endpoint chain — `edge-weight` → `l1/l2/l3-intensity` → `aggregate` → `stability-check` → `simulate` — and narrates propagation paths, amplifier nodes, and stability verdicts strictly from returned payloads, citing the channel weights and cross-pillar amplifiers from `ref/parameters` when explaining *why* a path dominates.

**How.** Tool schemas from the 8 existing OpenAPI operations (all POST bodies are Pydantic-typed); grounding corpus = this Atlas record's §2.3 constants table and §5 methodology. Scenario framing ("regulatory shock in Materials") maps to the engine's typed event parameters — never to free-form numbers. The no-fabrication validator checks every intensity and loss figure against tool outputs; the "show work" expander lists the exact call sequence, which doubles as a reproducibility artifact for risk-committee review.

**Prerequisites (hard).** Evolution A's real network — war-gaming a seeded graph produces confident nonsense about named institutions (the page seeds G-SIB tiers for real entity names today). **Acceptance:** a golden scenario's narrated cascade matches a scripted replay of the same tool calls; questions about entities absent from the graph get "not in network," not interpolated exposure.