# Proxy Voting Climate Analyzer
**Module ID:** `proxy-voting-climate` · **Route:** `/proxy-voting-climate` · **Tier:** B (frontend-computed) · **EP code:** EP-CP2 · **Sprint:** CP

## 1 · Overview
50 climate shareholder resolutions with Say-on-Climate tracking, management vs shareholder alignment, and director climate scoring.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `DIRECTOR_SCORES`, `MGMT_ALIGNMENT`, `POLICY_ALIGNMENT`, `RESOLUTIONS`, `SOC_TRACKER`, `SUPPORT_TREND`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Voting Dashboard','Say-on-Climate Tracker','Shareholder Resolutions','Management vs Shareholder','Director Climate Score','Voting Policy Alignment']` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `DIRECTOR_SCORES`, `MGMT_ALIGNMENT`, `POLICY_ALIGNMENT`, `RESOLUTIONS`, `SOC_TRACKER`, `SUPPORT_TREND`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Resolutions | — | Proxy season | Climate-related shareholder resolutions |
| Say-on-Climate | — | ISS/Glass Lewis | Companies with climate transition plan votes |

## 5 · Intermediate Transformation Logic
**Methodology:** Voting alignment analysis
**Headline formula:** `Alignment = votes_with_climate_policy / total_climate_votes`
**Standards:** ['IIGCC', 'PRI Voting Guidelines']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).