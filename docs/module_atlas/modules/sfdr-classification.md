# SFDR Fund Classification
**Module ID:** `sfdr-classification` · **Route:** `/sfdr-classification` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
SFDR Article 6/8/9 classification framework for fund portfolio. Classifies each fund, tracks ESG characteristics for Art. 8, sustainable investment thresholds, and PAI consideration statements.

> **Business value:** SFDR classification determines the regulatory disclosure burden and investor expectations for each fund. Misclassification (greenwashing) carries significant reputational and regulatory risk. This module ensures defensible, consistent classification with full audit trail.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `Card`, `Check`, `DNSH_OBJECTIVES`, `EmptyState`, `KpiCard`, `PAI_CATEGORIES`, `PAI_CAT_COLORS`, `PAI_INDICATORS`, `SECTOR_MAP`, `SFDR_CRITERIA`, `SFDR_ORDER`, `SFDR_TIMELINE`, `SfdrClassificationPage`, `SortHeader`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `fmt` | `(n, d = 1) => n == null ? '--' : Number(n).toFixed(d);` |
| `fmtPct` | `(n) => n == null ? '--' : Number(n).toFixed(1) + '%';` |
| `totalWeight` | `holdings.reduce((s, h) => s + (h.weight \|\| 0), 0) \|\| 100;` |
| `normalise` | `(w) => w / totalWeight * 100;` |
| `esg` | `h.esg_score \|\| (30 + seed(hashStr(h.isin \|\| h.company_name \|\| '') % 997) * 50);` |
| `esg` | `h.esg_score \|\| (30 + seed(hashStr(h.isin \|\| h.company_name \|\| '') % 997) * 50);` |
| `avgEsg` | `holdings.length ? holdings.reduce((s, h) => s + (h.esg_score \|\| (30 + seed(hashStr(h.isin \|\| h.company_name \|\| '') % 997) * 50)), 0) / holdings.length` |
| `fossilPct` | `fossilHoldings.reduce((s, h) => s + normalise(h.weight \|\| (100 / holdings.length)), 0);` |
| `weaponsPct` | `holdings.filter(h => seed(hashStr(h.isin \|\| '') % 997 + 17) > 0.97).reduce((s, h) => s + normalise(h.weight \|\| (100 / holdings.length)), 0);` |
| `dnshPct` | `holdings.length ? (dnshCompany.length / holdings.length) * 100 : 0;` |
| `govPct` | `holdings.length ? holdings.filter(h => (h.esg_score \|\| 50) > 42).length / holdings.length * 100 : 0;` |
| `paiCovered` | `Math.min(14, Math.round(avgEsg / 7));` |
| `esg` | `c.esg_score != null ? c.esg_score : 30 + s * 50;` |
| `weight` | `c.weight \|\| (100 / Math.max(1, portfolio.length));` |
| `revenue` | `c.revenue_usd_mn \|\| (c.revenue_inr_cr ? c.revenue_inr_cr * 0.12 : 500);` |
| `ghg` | `c.ghg_intensity_tco2e_per_mn \|\| (50 + s * 400);` |
| `rows` | `paiValues.map(p => [p.name, p.category, p.value, p.unit, p.yoy, p.mandatory ? 'Yes' : 'No', p.source]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `DNSH_OBJECTIVES`, `PAI_CATEGORIES`, `PAI_INDICATORS`, `SFDR_ORDER`, `SFDR_TIMELINE`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Article 6 Funds | — | Default | Mainstream funds disclosing sustainability risk integration |
| Article 8 Funds | — | Light green | Funds promoting environmental/social characteristics |
| Article 9 Funds | — | Dark green | Funds with sustainable investment objective |
- **Fund investment policy** → Classification criteria check → **SFDR article assignment**
- **ESG characteristics list** → Promotion verification → **Art 8 confirmation**
- **Sustainable investment %** → Threshold compliance → **Art 9 qualification**

## 5 · Intermediate Transformation Logic
**Methodology:** SFDR tiered classification logic
**Headline formula:** `Art9: obj=sustainable; Art8: promotes ESG; Art6: neither+discloses adverse`
**Standards:** ['SFDR (EU) 2019/2088', 'ESMA Q&A on SFDR']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).