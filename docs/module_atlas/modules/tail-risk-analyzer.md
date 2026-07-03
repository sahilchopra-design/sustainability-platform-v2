# Tail Risk Analyzer
**Module ID:** `tail-risk-analyzer` · **Route:** `/tail-risk-analyzer` · **Tier:** B (frontend-computed) · **EP code:** EP-CH4 · **Sprint:** CH

## 1 · Overview
Extreme Value Theory with GEV distribution, 5 black swan scenarios, and loss exceedance curves to 1000-year return period.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BLACK_SWANS`, `Card`, `EVT_DATA`, `LOSS_EXCEEDANCE`, `Pill`, `Ref`, `SYSTEMIC_CONTRIB`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `expTerm` | `Math.pow(t, -1 / xi);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BLACK_SWANS`, `LOSS_EXCEEDANCE`, `SYSTEMIC_CONTRIB`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| 1000yr Return Loss | `EVT extrapolation` | GEV fit | Loss at 0.1% annual exceedance probability |
| Black Swan Scenarios | — | IPCC tipping elements | Low-probability, catastrophic climate events |

## 5 · Intermediate Transformation Logic
**Methodology:** Extreme Value Theory (GEV)
**Headline formula:** `G(z) = exp(-(1+ξ(z-μ)/σ)^(-1/ξ)) for GEV distribution`
**Standards:** ['EVT', 'Lenton et al. (2019)']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).