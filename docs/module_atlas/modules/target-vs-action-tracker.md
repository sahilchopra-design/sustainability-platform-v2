# Target vs. Action Tracker
**Module ID:** `target-vs-action-tracker` · **Route:** `/target-vs-action-tracker` · **Tier:** B (frontend-computed) · **EP code:** EP-CM5 · **Sprint:** CM

## 1 · Overview
12 companies tracking stated targets against actual emissions progress, CapEx deployment, and technology adoption.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMPANIES`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `yearsLeft` | `(c.target.includes('2030') ? 2030 : c.target.includes('2040') ? 2040 : c.target.includes('2050') ? 2050 : 2039) - 2024;` |
| `annualRate` | `c.achieved / c.years;` |
| `projectedFinal` | `c.achieved + annualRate * yearsLeft;` |
| `gapPct` | `Math.max(0, c.targetPct - projectedFinal);` |
| `onTrack` | `projectedFinal >= c.targetPct * 0.9;` |
| `projected` | `sel.achieved + parseFloat(sel.annualRate) * Math.max(0, y - 2024);` |
| `targetLine` | `sel.targetPct * elapsed / ((sel.target.includes('2030') ? 2030 : 2050) - sel.baseYear);` |
| `capexData` | `COMPANIES.map(c => ({ name: c.name, greenCapex: c.greenCapex, gap: c.gapPct })).sort((a, b) => b.greenCapex - a.greenCapex);` |
| `techData` | `COMPANIES.map(c => ({ name: c.name, tech: c.techDeployed === 'high' ? 3 : c.techDeployed === 'moderate' ? 2 : 1, label: c.techDeployed }));` |
| `lobbyData` | `COMPANIES.map(c => ({ name: c.name, align: c.lobbyAlign === 'aligned' ? 3 : c.lobbyAlign === 'mixed' ? 2 : 1, label: c.lobbyAlign }));` |
| `engagementItems` | `COMPANIES.filter(c => !c.onTrack).map(c => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPANIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Companies | — | Demo | With targets and progress data |
| On Track | — | Model | Companies likely to meet their targets |

## 5 · Intermediate Transformation Logic
**Methodology:** Target-action gap analysis
**Headline formula:** `Gap = (1 - ActualProgress / ExpectedProgress) × 100%`
**Standards:** ['SBTi', 'Company Filings']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).