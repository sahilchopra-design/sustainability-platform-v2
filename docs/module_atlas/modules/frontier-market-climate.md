# Frontier & SIDS Climate
**Module ID:** `frontier-market-climate` · **Route:** `/frontier-market-climate` · **Tier:** B (frontend-computed) · **EP code:** EP-CJ6 · **Sprint:** CJ

## 1 · Overview
39 small island developing states with sea level rise exposure, parametric insurance, debt-for-climate swaps, and blue economy opportunity.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BLUE_ECONOMY`, `CARIBBEAN_HURRICANE`, `CCRIF_DATA`, `DEBT_SWAPS`, `PACIFIC_EXPOSURE`, `PARAMETRIC_INSURANCE`, `REFERENCES`, `SIDS_DATA`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `badge` | `(c) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: c + '18', color: c });` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BLUE_ECONOMY`, `CARIBBEAN_HURRICANE`, `CCRIF_DATA`, `DEBT_SWAPS`, `PACIFIC_EXPOSURE`, `PARAMETRIC_INSURANCE`, `REFERENCES`, `SIDS_DATA`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| SIDS Count | — | UNDP | Small Island Developing States |
| Debt Swaps | — | TNC | Belize ($553M) and Ecuador ($1.6B) |

## 5 · Intermediate Transformation Logic
**Methodology:** Sovereign parametric insurance
**Headline formula:** `Payout = Trigger_exceeded × Coverage_amount (binary trigger)`
**Standards:** ['CCRIF', 'ARC', 'PCRIC']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).