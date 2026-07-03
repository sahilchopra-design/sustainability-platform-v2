# SAF Policy & Mandate Intelligence
**Module ID:** `saf-policy-mandate` · **Route:** `/saf-policy-mandate` · **Tier:** B (frontend-computed) · **EP code:** EP-EF4 · **Sprint:** EF

## 1 · Overview
Tracks all major global SAF mandates and policy frameworks: EU ReFuelEU (2–70%), UK SAF Mandate (2–75%), IRA §40B production tax credit, US SAF Grand Challenge, Japan GIF, Singapore CAAS, CORSIA, and Australia. Includes interactive IRA §40B calculator.

> **Business value:** Used by airlines managing compliance obligations, SAF producers optimising IRA §40B credits, policy teams monitoring mandate developments, and investors assessing regulatory risk in SAF projects.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `KpiCard`, `POLICIES`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `regions` | `useMemo(() => ['ALL', ...new Set(POLICIES.map(p => p.region))], []);` |
| `mandateChart` | `filtered.map(p => ({ name: p.id, mandate: parseFloat(mandateAt(p).toFixed(1)), region: p.region }));` |
| `timelineChart` | `[2024, 2026, 2028, 2030, 2035, 2040, 2050].map(yr => ({` |
| `gallons` | `annualProd * 1e6 * 264;` |
| `creditPerGal` | `Math.min(1.75, 1.25 + Math.max(0, ciReduction - 50) * 0.01);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `POLICIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| EU ReFuelEU mandate 2030 | `Blending obligation at EU airports` | Regulation (EU) 2023/2405 | Includes 1.2% PtL sub-mandate from 2030; 5× multiplier credit for PtL; applies to fuel suppliers. |
| UK SAF mandate 2030 | `Blending obligation at UK airports` | UK DfT SAF Mandate Consultation 2023 | Tradeable SAF certificates system; enables book-and-claim; extends to 22% by 2035. |
| CORSIA price range ($/tCO₂) | `Dependent on CORSIA eligible credit price` | ICAO CORSIA State Action Plan guidance | Phase II mandatory from 2027; airlines offset emissions above 2019 baseline; SAF generates CEF credits. |
- **EU ReFuelEU + UK mandate + IRA §40B + CORSIA + 8 jurisdiction tracker** → Mandate timeline tracker + §40B calculator + CORSIA credit intelligence → **Airlines, SAF producers, policy teams, and investors tracking regulatory compliance and incentives**

## 5 · Intermediate Transformation Logic
**Methodology:** IRA §40B SAF Credit
**Headline formula:** `Credit = Gallons × $1.25 × max(1, (50 − CI_reduction_pct) / 50 + 0.5)`
**Standards:** ['IRS Notice 2023-06 and FAA CORSIA guidance', 'ICAO Annex 16 Volume IV — CORSIA', 'EU ReFuelEU Aviation Regulation 2023/2405']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).