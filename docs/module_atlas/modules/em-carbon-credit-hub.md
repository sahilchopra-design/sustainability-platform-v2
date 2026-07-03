# EM Carbon Credit Hub
**Module ID:** `em-carbon-credit-hub` · **Route:** `/em-carbon-credit-hub` · **Tier:** B (frontend-computed) · **EP code:** EP-CJ3 · **Sprint:** CJ

## 1 · Overview
Emerging market carbon credits: Article 6.2 bilateral agreements, ITMO pricing, corresponding adjustments, and Africa Carbon Markets Initiative.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACMI_DATA`, `BILATERAL_DEALS`, `BLENDED_FINANCE_DEALS`, `CA_STATUS`, `COLORS`, `EM_COUNTRY_PROFILES`, `EmCarbonCreditHubPage`, `ITMO_PRICING`, `JCM_PROJECTS`, `MRV_CHALLENGES`, `NDC_GAP_ANALYSIS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `font` | `"'DM Sans','SF Pro Display',system-ui,sans-serif";` |
| `ratings` | `['BB+', 'B+', 'BBB-', 'BB', 'BB+', 'B+', 'BBB-', 'BB+', 'B', 'BB', 'B-', 'B-', 'BB-', 'B+', 'B-', 'B', 'B+', 'B+', 'B-', 'B'];` |
| `uncond` | `Math.round(15 + sr(i * 31) * 20);` |
| `cond` | `uncond + Math.round(5 + sr(i * 47) * 15);` |
| `current` | `Math.round(sr(i * 59) * uncond * 0.6);` |
| `gap` | `uncond - current;` |
| `names` | `['Africa Green Bond I', 'ACMI Catalyst Fund', 'SE Asia REDD+ Vehicle', 'LatAm Cookstove SPV', 'Pacific Blue Carbon Trust', 'Sahel Agroforestry Fund', ` |
| `badge` | `(c) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: c + '18', color: c });` |
| `totalPipeline` | `useMemo(() => BILATERAL_DEALS.reduce((s, d) => s + d.itmoVolume, 0).toFixed(1), []);` |
| `avgItmoPrice` | `useMemo(() => { const p = ITMO_PRICING; return p.length ? (p.reduce((s, x) => s + x.avgPrice, 0) / p.length).toFixed(1) : '0'; }, []);` |
| `caAdoptionRate` | `useMemo(() => { const total = CA_STATUS.length; return total ? Math.round(CA_STATUS.filter(c => c.caFramework === 'yes').length / total * 100) : 0; },` |
| `acmiProgress` | `useMemo(() => { const t = ACMI_DATA.targets; return t.length ? Math.round(t[0].credits / (t[t.length - 1].credits \|\| 1) * 100) : 0; }, []);` |
| `ndcGapTotal` | `useMemo(() => NDC_GAP_ANALYSIS.reduce((s, c) => s + c.gapMtCO2, 0), []);` |
| `total` | `full + partial + none;` |
| `riskScore` | `total > 0 ? Math.round((none * 90 + partial * 50 + full * 10) / total) : 50;` |
| `risk` | `Math.round(15 + sr(mi * 11 + ri * 7) * 70);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BILATERAL_DEALS`, `CA_STATUS`, `COLORS`, `ITMO_PRICING`, `JCM_PROJECTS`, `MRV_CHALLENGES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Article 6.2 Deals | — | UNFCCC | Bilateral agreements tracker |
| ITMO Price Range | — | Market data | EM carbon credit pricing |

## 5 · Intermediate Transformation Logic
**Methodology:** ITMO pricing model
**Headline formula:** `ITMO_price = f(methodology, vintage, host_country_NDC_ambition)`
**Standards:** ['UNFCCC Article 6', 'ICROA']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).