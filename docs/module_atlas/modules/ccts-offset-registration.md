# Carbon Credit Registry & Offset Registration Analytics
**Module ID:** `ccts-offset-registration` · **Route:** `/ccts-offset-registration` · **Tier:** B (frontend-computed) · **EP code:** EP-EB2 · **Sprint:** EB

## 1 · Overview
Carbon credit registry and offset registration analytics comparing Verra, Gold Standard, CAR, and ACR registries. Covers serialisation standards, retirement tracking, double-counting prevention, and ICROA Code of Best Practice compliance.

> **Business value:** Delivers comprehensive carbon credit registry integrity analytics, enabling buyers to assess double-counting risk, retirement permanence, and ICROA/ICVCM compliance across major voluntary registries.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CCC_TIERS`, `DEFAULTS`, `METHODS`, `STATES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `CCC_TIERS` | `{ 'Low (₹500/t)': 500, 'Mid (₹1,200/t)': 1200, 'High (₹2,500/t)': 2500 };` |
| `rows` | `useMemo(() => s.assets.map(a => {` |
| `totalEru` | `rows.reduce((x, r) => x + r.eru, 0);` |
| `totalMw` | `s.assets.reduce((x, a) => x + a.mw, 0);` |
| `revenueYr` | `totalEru * price;` |
| `disc` | `s.discount > 0 ? (1 - Math.pow(1 + s.discount / 100, -s.crediting)) / (s.discount / 100) : s.crediting;` |
| `npv` | `revenueYr * disc;` |
| `bufferEru` | `totalEru * bufferPct;` |
| `netEru` | `totalEru - bufferEru;` |
| `age` | `Math.max(0, cy - r.vintage);` |
| `vintageAdjPrice` | `price * vintageMix;` |
| `mids` | `CCC_PRICE_HISTORY.map(p => p.mid);` |
| `lows` | `CCC_PRICE_HISTORY.map(p => p.low);` |
| `highs` | `CCC_PRICE_HISTORY.map(p => p.high);` |
| `avg` | `(arr) => arr.reduce((x, y) => x + y, 0) / arr.length;` |
| `discF` | `dr > 0 ? (1 - Math.pow(1 + dr, -s.crediting)) / dr : s.crediting;` |
| `base` | `{ price, eru: totalEru, buffer: 1 - bufferPct, crediting: s.crediting, discount: s.discount / 100 };` |
| `stackRows` | `useMemo(() => Object.entries(STACKING).map(([k, v]) => {` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-computed`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Registry Integrity Score | `0.25×Serialisation + 0.25×Retirement + 0.25×DoubleCount + 0.25×Transparency` | ICROA registry review | Verra and Gold Standard score 80-90; newer registries 60-75; ICVCM CCP label requires >75 |
| Double-Counting Risk Index | `1 - exclusive registry controls score` | ICVCM CCP assessment | Risks arise from corresponding adjustments absence (Article 6.2), bilateral use, and re-issuance across regist |
| Retirement Integrity Rate | `Credits with confirmed irreversible retirement / total retired credits` | Registry serialisation audit | Near 100% required; gaps indicate potential re-use; Verra public retirement database enables verification |
- **Registry serialisation databases (Verra, GSF, CAR, ACR)** → Serial number ranges, project IDs, vintage, retirement records → integrity checks → **Double-counting and retirement integrity scores**
- **UNFCCC Article 6 corresponding adjustment database** → Host country authorisation and adjustment records → sovereign double-counting risk → **Article 6 compliance flag**
- **ICROA/ICVCM assessment reports** → Registry-level quality assessments → benchmark scores for peer comparison → **Registry integrity ranking**

## 5 · Intermediate Transformation Logic
**Methodology:** Registry Integrity Scoring
**Headline formula:** `Registry Score = 0.25×Serialisation + 0.25×Retirement + 0.25×DoubleCount + 0.25×Transparency; Double-Count Risk = 1 - Σ(exclusive_registry_flags)`
**Standards:** ['ICROA Code of Best Practice v2.0', 'VCMI Claims Code of Practice', 'ICVCM Core Carbon Principles 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `AdvisoryReference`, `AdvisoryToolkit`