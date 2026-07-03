# Commodity Derivatives Climate
**Module ID:** `commodity-derivatives-climate` · **Route:** `/commodity-derivatives-climate` · **Tier:** B (frontend-computed) · **EP code:** EP-CI4 · **Sprint:** CI

## 1 · Overview
Oil/gas forward curves under NGFS scenarios, Black-76 options pricing, and cross-commodity climate spread analysis.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMMODITIES`, `NGFS`, `NGFS_COLORS`, `SPREADS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `decayFactor` | `scenario.includes('Net Zero') \|\| scenario.includes('2C') ? Math.max(0.3, 1 - m / (t.peakYear * 12)) : 1 + t.drift * m;` |
| `price` | `basePrice * decayFactor * (1 + (Math.sin(m / 6) * t.vol * 0.5));` |
| `fundamental` | `basePrice * (1 + Math.sin(m / 12) * 0.05);` |
| `premium` | `basePrice * premiumPct[scenario] * (m / months);` |
| `Nd1` | `0.5 * (1 + erf(d1 / Math.sqrt(2)));` |
| `Nd2` | `0.5 * (1 + erf(d2 / Math.sqrt(2)));` |
| `TABS` | `['Energy Curve Dashboard', 'Contango/Backwardation Under Transition', 'Commodity Options Pricing', 'Cross-Commodity Spreads', 'Hedging Strategy Builde` |
| `row` | `{ month: i + 1 };` |
| `skew` | `Math.abs(k - 1.0) * 0.15;` |
| `termStruc` | `Math.sqrt(exp) * 0.05;` |
| `factor` | `s === 'Net Zero 2050' ? -0.6 : s === 'Below 2C' ? -0.3 : s === 'Current Policies' ? 0.1 : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `NGFS`, `SPREADS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Brent 2030 (NZ) | `NGFS-adjusted curve` | IEA NZE | Oil price under Net Zero — down from $85 baseline |
| Crack Spread Shift | `Refining margin compression` | Model | Gasoline refining margin declines under EV adoption |

## 5 · Intermediate Transformation Logic
**Methodology:** Black-76 with transition-adjusted volatility
**Headline formula:** `C = exp(-rT)[F·N(d1) - K·N(d2)]; σ_adj = σ_base + Δσ_transition`
**Standards:** ['ICE', 'CME', 'IEA WEO']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).