# Fixed Income ESG
**Module ID:** `fixed-income-esg` · **Route:** `/fixed-income-esg` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Integrates ESG factors into corporate bond portfolio construction and monitoring, capturing spread differentials attributable to ESG quality. Provides greenium analytics comparing green bond yields against matched conventional bond curves, enabling attribution of ESG alpha and risk-adjusted performance measurement.

> **Business value:** Enables fixed income portfolio managers to quantify the ESG spread premium, screen issuers by carbon intensity, and optimise allocation toward labelled green bonds without sacrificing yield targets. Supports regulatory reporting under SFDR Article 8/9 and EU Green Bond Standard alignment.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_COUNTRIES`, `ALL_CURRENCIES`, `ALL_RATINGS`, `ALL_SUBTYPES`, `ALL_TYPES`, `BOND_TYPES`, `BOND_TYPE_COLORS`, `CBI_SECTORS`, `ESG_TIERS`, `FRAMEWORKS`, `FixedIncomeEsgPage`, `GREEN_BOND_UNIVERSE`, `PIE_COLORS`, `SOVEREIGN_ESG`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ALL_TYPES` | `['All', ...new Set(GREEN_BOND_UNIVERSE.map(b => b.type))];` |
| `ALL_CURRENCIES` | `['All', ...new Set(GREEN_BOND_UNIVERSE.map(b => b.currency))];` |
| `ALL_RATINGS` | `['All', ...new Set(GREEN_BOND_UNIVERSE.map(b => b.rating))];` |
| `ALL_COUNTRIES` | `['All', ...new Set(GREEN_BOND_UNIVERSE.map(b => b.country))];` |
| `ALL_SUBTYPES` | `['All', ...new Set(GREEN_BOND_UNIVERSE.map(b => b.subtype))];` |
| `csv` | `[keys.join(','), ...rows.map(r => keys.map(k => {` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `items` | `fiPortfolio.map(p => ({ ...p, bond: GREEN_BOND_UNIVERSE.find(b => b.id === p.bondId) })).filter(p => p.bond);` |
| `totalNotional` | `items.reduce((s, p) => s + p.notional, 0);` |
| `wAvgEsg` | `items.reduce((s, p) => s + p.bond.esgScore * p.notional, 0) / totalNotional;` |
| `wAvgGreenium` | `items.reduce((s, p) => s + p.bond.greenium_bps * p.notional, 0) / totalNotional;` |
| `wAvgYield` | `items.reduce((s, p) => s + p.bond.yield * p.notional, 0) / totalNotional;` |
| `greenNotional` | `items.filter(p => ['Green Bond','Sovereign Green','Climate Awareness Bond','Blue Bond'].includes(p.bond.type)).reduce((s, p) => s + p.notional, 0);` |
| `slbNotional` | `items.filter(p => p.bond.type === 'SLB').reduce((s, p) => s + p.notional, 0);` |
| `socialNotional` | `items.filter(p => ['Social Bond','Sustainability Bond','Gender Bond','SDG Bond','Sovereign Sustainability'].includes(p.bond.type)).reduce((s, p) => s ` |
| `totalSizeBn` | `bonds.reduce((s, b) => s + b.size_mn, 0) / 1000;` |
| `avgGreenium` | `bonds.length ? bonds.reduce((s, b) => s + b.greenium_bps, 0) / bonds.length : 0;` |
| `avgEsg` | `bonds.length ? bonds.reduce((s, b) => s + b.esgScore, 0) / bonds.length : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALL_COUNTRIES`, `ALL_CURRENCIES`, `ALL_RATINGS`, `ALL_SUBTYPES`, `ALL_TYPES`, `CBI_SECTORS`, `ESG_TIERS`, `FRAMEWORKS`, `GREEN_BOND_UNIVERSE`, `PIE_COLORS`, `SOVEREIGN_ESG`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Greenium (bps) | — | Bloomberg BVAL / ICMA | Negative greenium indicates green bonds trade richer than conventional peers; values beyond -10 bps suggest su |
| ESG Score (issuer) | — | MSCI / Sustainalytics | Composite ESG score reflecting environmental management, social practices, and governance quality; scores abov |
| Carbon Intensity (tCO2e/$M revenue) | — | CDP / Issuer disclosure | Scope 1+2 intensity normalised by revenue; high-intensity issuers exhibit statistically wider spreads controll |
| Green Bond Allocation (%) | — | Portfolio holdings | Share of portfolio AUM in labelled green, social, or sustainability bonds; tracks alignment with internal SRI  |
- **Issuer ESG scores (MSCI/Sustainalytics)** → Normalise to 0â€“100 scale, map to ISIN universe → **ESG-adjusted OAS per bond**
- **Green bond labels (ICMA registry)** → Verify use-of-proceeds alignment, match to conventional peer → **Greenium in basis points**
- **Portfolio holdings (IBOR/ABOR)** → Compute weighted average ESG score and carbon intensity → **Portfolio-level ESG summary KPIs**

## 5 · Intermediate Transformation Logic
**Methodology:** ESG-Adjusted OAS Attribution
**Headline formula:** `OAS_esg = OAS_benchmark + β_esg × ESG_score + β_dur × Duration + ε`
**Standards:** ['ICMA Green Bond Principles', 'UNPRI Fixed Income Framework', 'Bloomberg BVAL']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).