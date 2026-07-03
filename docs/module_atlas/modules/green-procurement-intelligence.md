# Green Procurement Intelligence
**Module ID:** `green-procurement-intelligence` · **Route:** `/green-procurement-intelligence` · **Tier:** B (frontend-computed) · **EP code:** EP-DN6 · **Sprint:** DN

## 1 · Overview
Provides analytics for public and corporate green procurement — lifecycle cost analysis, green product market intelligence, environmental label verification, and EU Green Public Procurement criteria compliance. Models total cost of ownership for green alternatives and procurement carbon reduction potential.

> **Business value:** Essential for public procurement authorities, corporate sustainability procurement teams, and supply chain sustainability managers. Provides EU GPP criteria compliance checking, TCO green premium analysis, and procurement carbon reduction quantification for CSRD value chain reporting.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `Bar`, `CATEGORIES`, `KpiCard`, `PROGRAMMES`, `REGIONS`, `STANDARDS`, `STATUS`, `StatusBadge`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `STATUS` | `['Compliant', 'Partial', 'Non-Compliant', 'In Progress', 'Pending Review'];` |
| `colors` | `{ Compliant: T.green, Partial: T.amber, 'Non-Compliant': T.red, 'In Progress': T.blue, 'Pending Review': T.textSec };` |
| `totalSpend` | `useMemo(() => PROGRAMMES.reduce((a, p) => a + p.totalSpendMn, 0), []);` |
| `totalGreenSpend` | `useMemo(() => PROGRAMMES.reduce((a, p) => a + p.greenSpendMn, 0), []);` |
| `totalCo2Saved` | `useMemo(() => PROGRAMMES.reduce((a, p) => a + p.co2SavedT, 0), []);` |
| `totalSavings` | `useMemo(() => PROGRAMMES.reduce((a, p) => a + p.costSavingsMn, 0), []);` |
| `avgGreenPct` | `useMemo(() => PROGRAMMES.reduce((a, p) => a + p.greenSpendPct, 0) / Math.max(1, PROGRAMMES.length), []);` |
| `standardBreakdown` | `useMemo(() => STANDARDS.map(std => {` |
| `totalGS` | `progs.reduce((a, p) => a + p.greenSpendMn, 0);` |
| `avgScore` | `progs.length ? progs.reduce((a, p) => a + p.certScore, 0) / progs.length : 0;` |
| `categoryBreakdown` | `useMemo(() => CATEGORIES.map(cat => {` |
| `totalS` | `progs.reduce((a, p) => a + p.totalSpendMn, 0);` |
| `totalGS` | `progs.reduce((a, p) => a + p.greenSpendMn, 0);` |
| `co2` | `progs.reduce((a, p) => a + p.co2SavedT, 0);` |
| `savings` | `progs.reduce((a, p) => a + p.costSavingsMn, 0);` |
| `top10Programmes` | `useMemo(() => [...PROGRAMMES].sort((a, b) => b.co2SavedT - a.co2SavedT).slice(0, 10), []);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CATEGORIES`, `REGIONS`, `STANDARDS`, `STATUS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| EU GPP Market | — | European Commission GPP Monitoring 2023 | Only 14% of EU public procurement meets Green Public Procurement criteria — large gap vs 50% target |
| GPP Carbon Reduction Potential | — | IPCC AR6 WGIII Chapter 13 | Green public procurement could reduce public sector emissions by 25% vs conventional procurement |
| Green Premium (procurement) | — | EU GPP Cost-Benefit Analysis 2022 | Green procurement premium averages 0–15% upfront — often neutral or positive on TCO basis |
- **Procurement category data + supplier product specs** → TCO comparison → **Green vs conventional TCO by procurement category**
- **EU GPP criteria documents by product group** → Compliance checking → **Procurement specifications aligned with EU GPP requirements**
- **Life cycle emission factor data (ecoinvent, EPDs)** → Carbon reduction calculation → **Annual procurement carbon footprint reduction from green alternatives**

## 5 · Intermediate Transformation Logic
**Methodology:** Green Procurement TCO
**Headline formula:** `GreenTCO = CapEx_green + Σ [(OpEx_green_t + ExternalCost_green_t) / (1+r)^t]; CarbonProcurementReduction = Σ [Spend_i × (ConvEmFactor_i - GreenEmFactor_i)]`
**Standards:** ['EU Green Public Procurement Criteria 2023', 'ISO 20400:2017 Sustainable Procurement', 'OECD Green Public Procurement Report 2023', 'UN Sustainable Development Goals Procurement Framework']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).