# Sustainability Change Management
**Module ID:** `change-management` · **Route:** `/change-management` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Organisational change management framework for sustainability transformation programmes. Assesses stakeholder readiness, models adoption curves using Everett Rogers diffusion theory, and tracks KPI progress across 5 ADKAR stages (Awareness, Desire, Knowledge, Ability, Reinforcement).

> **Business value:** ADKAR composite below 60 indicates high change failure risk. Critical mass (16%) is key inflection point; adoption typically accelerates 3× once threshold is crossed.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `CHANGE_CATEGORIES`, `COLORS`, `DEFAULT_CHANGES`, `EmptyState`, `KANBAN_COLORS`, `KANBAN_COLS`, `KANBAN_LABELS`, `KpiCard`, `LS_CHANGES`, `LS_KEY`, `LS_PORTFOLIO`, `Section`, `VERSION_HISTORY`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---';` |
| `sRand` | `(n) => { let x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };` |
| `today` | `new Date('2025-05-15');` |
| `fmtDate` | `(d) => d ? new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '---';` |
| `tickers` | `new Set(portfolioRaw.map(p => p.ticker \|\| p.symbol).filter(Boolean));` |
| `implTimes` | `changes.filter(c => c.implemented_at && c.created_at).map(c => (new Date(c.implemented_at) - new Date(c.created_at)) / 86400000);` |
| `avgImpl` | `implTimes.length ? (implTimes.reduce((a, b) => a + b, 0) / implTimes.length).toFixed(1) : '---';` |
| `rollbackRate` | `totalImpl ? ((rolledBack / totalImpl) * 100).toFixed(1) : '0.0';` |
| `trend` | `months.length >= 2 ? (monthCounts[months[months.length - 1]] > monthCounts[months[months.length - 2]] ? 'Up' : 'Down') : 'Stable';` |
| `catNames` | `useMemo(() => [...new Set(changes.map(c => CHANGE_CATEGORIES.find(cc => cc.id === c.category)?.name).filter(Boolean))], [changes]);` |
| `rows` | `changes.map(c => [c.id, c.title, CHANGE_CATEGORIES.find(cc => cc.id === c.category)?.name \|\| c.category, c.risk_level, c.status, c.requester, c.create` |
| `csv` | `[headers.join(','), ...rows.map(r => r.join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type:'text/csv' });` |
| `report` | `{ generated:today.toISOString(), total:changes.length, high_risk:changes.filter(c => c.risk_level === 'High').length, changes:changes.map(c => ({ ...c` |
| `blob` | `new Blob([JSON.stringify(report, null, 2)], { type:'application/json' });` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CHANGE_CATEGORIES`, `COLORS`, `DEFAULT_CHANGES`, `KANBAN_COLS`, `VERSION_HISTORY`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ADKAR Composite Score | `avg(A,D,K,A2,R) × 20` | Stakeholder survey | Overall change readiness; below 60 = high change failure risk |
| Adoption Rate | `Rogers S-curve at current t` | Rollout tracking data | Percentage of target population currently using new sustainability practice |
| Critical Mass Threshold | `Innovators (2.5%) + Early Adopters (13.5%)` | Rogers Diffusion Theory | Adoption level required for self-sustaining momentum |
| Change Resistance Index | `Weighted stakeholder opposition score` | Survey data | Composite measure of stakeholder resistance severity |
- **Stakeholder surveys** → ADKAR dimension scores → composite → **Change readiness by group**
- **Rollout tracking system** → Adoption counts over time → S-curve fit → **Adoption rate and critical mass timing**

## 5 · Intermediate Transformation Logic
**Methodology:** ADKAR change readiness composite + Rogers S-curve adoption
**Headline formula:** `ADKAR_score = avg(A,D,K,A₂,R) × 20; Adoption(t) = L / (1 + exp(-k(t–t_mid)))`
**Standards:** ['Prosci ADKAR Model', 'Rogers Diffusion of Innovations (1962)', 'Kotter 8-Step Change Model', 'GRI 2-29 Stakeholder Engagement']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).