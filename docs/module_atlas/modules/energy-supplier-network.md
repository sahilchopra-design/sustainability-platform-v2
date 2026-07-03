# Energy Supplier Network
**Module ID:** `energy-supplier-network` · **Route:** `/energy-supplier-network` · **Tier:** B (frontend-computed) · **EP code:** EP-CU3 · **Sprint:** CU

## 1 · Overview
40 suppliers across Tier 1/2/3 with transition scores, concentration risk, and engagement tracking.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CATEGORIES`, `PLAN_COLORS`, `SUPPLIERS`, `TABS`, `TIER_COLORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `CATEGORIES` | `['Drilling & Well Services','Pipeline Equipment','Refining Catalysts','Turbine/Rotating Equip','EPC/Construction','Chemicals & Additives','Safety & PP` |
| `filtered` | `useMemo(() => tierFilter === 'All' ? SUPPLIERS : SUPPLIERS.filter(s => s.tier === +tierFilter), [tierFilter]);` |
| `totalSpend` | `SUPPLIERS.reduce((s, x) => s + x.spend, 0);` |
| `avgScore` | `Math.round(SUPPLIERS.reduce((s, x) => s + x.score, 0) / Math.max(1, SUPPLIERS.length));` |
| `total` | `spends.reduce((a, b) => a + b, 0);` |
| `hhi` | `Math.round(spends.reduce((a, s) => a + Math.pow(s / total * 100, 2), 0));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CATEGORIES`, `SUPPLIERS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Suppliers | — | Supply chain | Tier 1 (10), Tier 2 (15), Tier 3 (15) |

## 5 · Intermediate Transformation Logic
**Methodology:** Supplier concentration analysis
**Headline formula:** `HHI = Σ(spend_share_i²); Critical = single_source AND transition_score < 40`
**Standards:** ['ISO 20400', 'CDP Supply Chain']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).