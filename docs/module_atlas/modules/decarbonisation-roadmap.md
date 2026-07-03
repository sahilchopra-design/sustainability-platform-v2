# Decarbonisation Roadmap
**Module ID:** `decarbonisation-roadmap` · **Route:** `/decarbonisation-roadmap` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Science-based decarbonisation pathway builder that maps emission reductions to specific technologies, costs, and delivery timelines through to net zero. Marginal abatement cost curves rank interventions by cost-effectiveness. Scenario comparison allows evaluation of accelerated vs. delayed action paths.

> **Business value:** Translates a net-zero commitment into a costed, technology-specific action plan that finance and operations teams can execute. The MAC curve discipline ensures capital is directed to the highest-return abatement opportunities first.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ABATEMENT_LEVERS`, `CARBON_PRICE_SCENARIOS`, `COLORS`, `CORPORATES`, `INVESTMENT_DATA`, `KpiCard`, `MILESTONES`, `PATHWAY_TREND`, `REGION_F`, `SECTOR_F`, `SECTOR_PROFILES`, `STATUS_F`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `INVESTMENT_DATA` | `SECTOR_PROFILES.map((s, i) => ({` |
| `SECTOR_F` | `['All', ...new Set(CORPORATES.map(c => c.sector))];` |
| `REGION_F` | `['All', 'North America', 'Europe', 'Asia-Pacific'];` |
| `avgCarbonPrice` | `Math.round(filtered.reduce((s, c) => s + c.carbonPrice, 0) / n);` |
| `totalInvest` | `Math.round(filtered.reduce((s, c) => s + c.investMn, 0) / 1000);` |
| `factor` | `(carbonPriceWif / 100) * (adoptionWif / 50);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ABATEMENT_LEVERS`, `CARBON_PRICE_SCENARIOS`, `COLORS`, `CORPORATES`, `MILESTONES`, `REGION_F`, `SECTOR_F`, `SECTOR_PROFILES`, `STATUS_F`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Required Annual Reduction | — | SBTi 1.5°C linear pathway | Minimum year-on-year absolute Scope 1+2 reduction rate to remain on a 1.5°C-aligned trajectory |
| Lowest-MAC Lever | — | MAC curve analysis | Cheapest abatement lever identified; negative MAC indicates net cost saving |
| Technical Abatement Potential | — | Technology assessment | Maximum emission reduction achievable using all identified technologies at current maturity |
| Residual Emissions (2040) | — | Pathway model | Residual hard-to-abate emissions requiring carbon removal or offset by target year |
- **GHG inventory (Scope 1/2/3 baseline by activity)** → Decomposition into abatable activity segments → **Emission reduction potential per segment**
- **Technology cost database (CapEx, OpEx, savings, lifetime)** → MAC calculation per lever: (CapEx + OpEx − savings) / lifetime abatement → **Ranked MAC curve with abatement volume waterfall**
- **SBTi pathway tool outputs (required reduction trajectory)** → Gap analysis: required reductions vs. identified lever stack → **Residual emission gap and offset/removal requirement**

## 5 · Intermediate Transformation Logic
**Methodology:** Marginal Abatement Cost
**Headline formula:** `MAC = ΔCost / ΔEmissions Reduced (€/tCO₂e)`
**Standards:** ['McKinsey MAC Curve Methodology', 'IEA MACC Framework', 'SBTi Pathway Tools']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).