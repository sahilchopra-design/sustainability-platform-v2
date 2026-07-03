# Agricultural Biodiversity
**Module ID:** `agri-biodiversity` · **Route:** `/agri-biodiversity` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Quantifies ecosystem services, pollinator health, and soil biodiversity metrics for agri-sector portfolios using TNFD LEAP methodology, IPBES ecosystem service valuation, and USDA NRCS soil health indicators. Assesses biodiversity intactness across agri-holdings and links species richness decline to financial exposure. Supports TNFD D4 disclosure and EU Biodiversity Strategy 2030 alignment.

> **Business value:** Agricultural biodiversity metrics directly link ecosystem health to financial performance: declining BII and pollinator populations translate to quantifiable yield and revenue risk. Soil biodiversity scores serve as leading indicators of long-term land productivity, enabling portfolio managers to engage with agri-borrowers on regenerative practices before impairment materialises.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `COLORS`, `COUNTRIES`, `CREDIT_PILOTS`, `CROP_TYPES`, `Card`, `KPI`, `NEONICS`, `OPS`, `POLLINATOR_CROPS`, `PRACTICES`, `Pill`, `SOIL_INDICATORS`, `TABS`, `YEARS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `crop` | `CROP_TYPES[Math.floor(s1*CROP_TYPES.length)];` |
| `country` | `COUNTRIES[Math.floor(s2*COUNTRIES.length)];` |
| `hectares` | `Math.floor(50+s3*4500);` |
| `msaScore` | `+(0.2+s4*0.7).toFixed(2);` |
| `speciesRichness` | `Math.floor(15+s5*185);` |
| `habitatQuality` | `Math.floor(20+s6*75);` |
| `practicesAdopted` | `PRACTICES.filter((_,pi)=>sr(i*37+pi*7)>0.5);` |
| `pollinatorDependency` | `Math.floor(10+sr(i*41+17)*80);` |
| `neonicExposure` | `+(0+sr(i*43+19)*8).toFixed(1);` |
| `wildflowerCoverage` | `Math.floor(sr(i*47+21)*25);` |
| `microbialDiversity` | `+(2+sr(i*53+23)*6).toFixed(1);` |
| `earthwormDensity` | `Math.floor(20+sr(i*59+25)*280);` |
| `soilOrgMatter` | `+(1.5+sr(i*61+27)*5.5).toFixed(1);` |
| `connScore` | `Math.floor(10+sr(i*67+29)*85);` |
| `creditPilot` | `sr(i*71+31)>0.55?CREDIT_PILOTS[Math.floor(sr(i*73+33)*CREDIT_PILOTS.length)]:null;` |
| `creditPrice` | `creditPilot?Math.floor(5+sr(i*79+35)*25):0;` |
| `annualCreditPotential` | `creditPilot?Math.floor(hectares*msaScore*0.5):0;` |
| `yearlyMSA` | `YEARS.map((_,yi)=>+(msaScore-0.05+sr(i*83+yi*11)*0.03*yi).toFixed(2));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `COUNTRIES`, `CREDIT_PILOTS`, `CROP_TYPES`, `NEONICS`, `POLLINATOR_CROPS`, `PRACTICES`, `SOIL_INDICATORS`, `TABS`, `YEARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Biodiversity Intactness Index | `Σ(Observed_sp / Expected_sp) / n` | PREDICTS database | Percentage of natural species richness remaining; <75% is the proposed safe limit |
| Pollinator Value at Risk | `Yield × Dependency × Price` | IPBES 2019 | Economic value of crops at risk if pollinator populations decline further |
| Soil Health Score | `Composite NRCS indicators` | USDA NRCS | Aggregate of microbial biomass, earthworm density and aggregate stability |
- **PREDICTS/GBIF species occurrence data** → Intersect with portfolio site boundaries to compute BII per holding → **Site-level BII scores and aggregate portfolio intactness**
- **IPBES crop pollination data** → Apply pollination dependency coefficients to crop revenue → **Pollinator value at risk in $ per holding**

## 5 · Intermediate Transformation Logic
**Methodology:** IPBES ecosystem service valuation + BII
**Headline formula:** `BII = (Σ Species_observed_i / Species_expected_i) / n_sites; Pollinator_value = Crop_yield × Pollination_dependency × P_per_tonne`
**Standards:** ['TNFD LEAP v2', 'IPBES 2019 Global Assessment', 'USDA NRCS Soil Health Framework']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).