# Financial Flow Analytics
**Module ID:** `financial-flow` · **Route:** `/financial-flow` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Tracks and analyses global capital flows into sustainable finance instruments including green bonds, sustainability-linked loans, ESG equity funds, blended finance, and climate-aligned infrastructure. Maps Paris-aligned investment volumes against estimated climate finance needs from IPCC and UNFCCC, quantifying the annual green finance gap by sector and region. Supports capital mobilisation strategy, regulatory reporting, and investor stewardship on sustainable finance market development.

> **Business value:** Provides policymakers, development finance institutions, and impact investors with a comprehensive, data-driven view of where sustainable capital is flowing and where the critical gaps to Paris alignment remain â€” enabling evidence-based capital mobilisation strategy and green finance market development prioritisation.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Btn`, `EXTERNALITY_PRICES`, `FINANCIAL_FLOWS`, `GREEN_PREMIUMS`, `KPI`, `LS_FF`, `LS_PORT`, `PIE_COLORS`, `Section`, `SortHeader`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `fmtUSD` | `(n) => n == null ? '\u2014' : Math.abs(n) >= 1e6 ? `$${(n/1e6).toFixed(1)}M` : Math.abs(n) >= 1000 ? `$${(n/1000).toFixed(1)}K` : Math.abs(n) >= 1 ? `` |
| `scenarioMultiplier` | `scenarioMode === 'bull' ? 50 : scenarioMode === 'bear' ? -50 : 0;` |
| `slider` | `userSlider + scenarioMultiplier;` |
| `factor` | `1 + slider / 100;` |
| `newPrice` | `c.price_per_kg ? c.price_per_kg * factor : null;` |
| `newCost` | `c.price_per_kg ? c.quantity_kg * newPrice : c.cost;` |
| `adjustedRawTotal` | `useMemo(() => adjustedBOM.reduce((s, c) => s + (c.adjusted_cost \|\| 0), 0), [adjustedBOM]);` |
| `rawDelta` | `adjustedRawTotal - originalRawTotal;` |
| `adjustedFinalPrice` | `useMemo(() => (flow?.final_price_usd \|\| 0) + rawDelta, [flow, rawDelta]);` |
| `carbon` | `(f.gwp_total_kg / 1000) * EXTERNALITY_PRICES.carbon.price;` |
| `water` | `(f.water_total_l / 1e6) * EXTERNALITY_PRICES.water.price * 1000;` |
| `air` | `(f.gwp_total_kg / 1000) * 0.15 * EXTERNALITY_PRICES.air_pollution.price;` |
| `biodiversity` | `EXTERNALITY_PRICES.biodiversity.price * (f.land_ha \|\| 0.5);` |
| `waste` | `(f.waste_kg \|\| 0) / 1000 * EXTERNALITY_PRICES.waste_disposal.price;` |
| `total` | `carbon + water + air + biodiversity + waste;` |
| `totalExternality` | `useMemo(() => externalityBreakdown.reduce((s, e) => s + e.cost, 0), [externalityBreakdown]);` |
| `bars` | `flow.stages.map((s, i) => {` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CROSS_NAV`, `GREEN_PREMIUMS`, `PIE_COLORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Annual Green Bond Issuance ($Bn) | — | ICMA Green Bond Database / Bloomberg | Total labelled green bond volume; 2023 issuance exceeded $575Bn; IPCC estimates $4.5Tn/year needed by 2030. |
| Climate Finance Gap ($Tn/year) | — | CPI Global Landscape 2023 | Estimated shortfall between climate investment needs and tracked flows; CPI estimates $4.1Tn annual gap to 203 |
| SLL Volume ($Bn) | — | LMA/Bloomberg | Sustainability-linked loan issuance; key instrument for emerging market corporate climate finance. |
| Blended Finance Mobilisation Ratio (x) | — | OECD/Convergence | Private capital mobilised per dollar of public/concessional capital deployed; target ratio >3x for EM climate  |
- **ICMA green/social/sustainability bond database and Bloomberg BICS** → Aggregate labelled bond issuance by use-of-proceeds category, issuer type, geography, and tenor → **Green bond flow time series by sector and region ($Bn/year)**
- **OECD CRS climate ODA data and DFI annual reports** → Tag bilateral and multilateral climate finance flows; compute additionality and concessionality metrics → **Public climate finance by institution and recipient region ($Bn/year)**
- **CPI/IPCC climate investment need estimates** → Align need estimates by sector and region to tracked flow categories; compute residual gap at current trajectory → **Paris finance gap by sector ($Tn/year) and gap-to-need ratio (%)**

## 5 · Intermediate Transformation Logic
**Methodology:** Paris Finance Gap Model
**Headline formula:** `Gap = ClimateNeed − Σ(GreenBond + SLL + BlendedFinance + PublicClimate + ESGEquity)`
**Standards:** ['IPCC AR6 WGIII Finance Chapter 2022', 'UNFCCC Standing Committee on Finance 2023', 'CPI Global Landscape of Climate Finance 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).