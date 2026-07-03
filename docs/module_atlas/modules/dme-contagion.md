# DME Contagion
**Module ID:** `dme-contagion` · **Route:** `/dme-contagion` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Systemic materiality contagion mapping that traces how material ESG risks propagate across supply chains, sector networks, and financial portfolios. Network analysis identifies contagion amplifiers and systemic nodes. Stress scenarios model contagion spread under accelerated materialisation of a triggering event.

> **Business value:** Reveals how ESG risks can amplify across supply chains and financial networks, enabling risk managers to identify systemic nodes that warrant priority attention or engagement. Contagion scenarios inform portfolio stress testing and counterparty risk limits.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `ADJ_LABELS`, `ADJ_MATRIX`, `ENTITIES`, `ENTITY_NAMES`, `ENTITY_SECTORS`, `HIST_EVENTS`, `PIECLRS`, `REGIONS_LIST`, `SEC8`, `SECTORS_LIST`, `SEC_MATRIX`, `SHOCK_SCENARIOS`, `SIR_DATA`, `SIR_STEPS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
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

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `fastapi` *(shared)*, `financial`, `seed`, `services` *(shared)*
**Frontend seed datasets:** `ENTITY_NAMES`, `ENTITY_SECTORS`, `HIST_EVENTS`, `PIECLRS`, `REGIONS_LIST`, `SECTORS_LIST`, `SHOCK_SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Network Nodes Mapped | — | Supply chain graph database | Total entities modelled in the ESG contagion network including suppliers, customers, and financial counterpart |
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

## 5 · Intermediate Transformation Logic
**Methodology:** Contagion Propagation Score
**Headline formula:** `CPSᵢ = Σⱼ wᵢⱼ × Materialityⱼ × Exposureᵢⱼ`
**Standards:** ['NGFS Network Analysis Framework', 'ECB Climate Stress Test Contagion Methodology', 'IPCC AR6 Compound Risk Framework']

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