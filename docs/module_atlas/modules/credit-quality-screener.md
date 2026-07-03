# Credit Quality Screener
**Module ID:** `credit-quality-screener` · **Route:** `/credit-quality-screener` · **Tier:** B (frontend-computed) · **EP code:** EP-CN4 · **Sprint:** CN

## 1 · Overview
100 carbon credits screened against ICVCM CCP (5 criteria), additionality, leakage, co-benefits, and red flag detection.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CCP_PRINCIPLES`, `CREDITS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `add` | `3 + (s % 8); const perm = 2 + ((s * 3) % 9); const quant = 3 + ((s * 5) % 8);` |
| `ndc` | `4 + ((s * 2) % 7); const sd = 2 + ((s * 4) % 9);` |
| `leak` | `((s * 6) % 40) + 5; const sdgCount = 1 + (s % 6);` |
| `TABS` | `['Quality Screener','ICVCM CCP Alignment','Additionality Assessment','Leakage Risk','Co-Benefit Scoring','Red Flag Detector'];` |
| `methods` | `['All', ...new Set(CREDITS.map(c => c.method))];` |
| `ccpRadar` | `CCP_PRINCIPLES.map((p, i) => ({ principle: p.length > 12 ? p.slice(0, 12) + '..' : p, score: selCredit.ccp[i], max: 10 }));` |
| `methodDist` | `[...new Set(CREDITS.map(c => c.method))].map(m => ({ method: m, count: CREDITS.filter(c => c.method === m).length, avgQ: Math.round(CREDITS.filter(c =` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CCP_PRINCIPLES`, `CREDITS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Credits Screened | — | Registry data | Across Verra, GS, ACR, CAR |
| Red Flags | — | Screening | Credits with one or more quality concerns |

## 5 · Intermediate Transformation Logic
**Methodology:** ICVCM 5-criteria quality assessment
**Headline formula:** `QualityScore = avg(Additionality, Permanence, Quantification, NoDoubleCounting, NoNetHarm)`
**Standards:** ['ICVCM CCP', 'Verra', 'Gold Standard']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).