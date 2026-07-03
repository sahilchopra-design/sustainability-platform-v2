# Green Building Cert Manager
**Module ID:** `green-building-certification` · **Route:** `/green-building-certification` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Manages the end-to-end certification workflow for BREEAM, LEED, WELL, and NABERS across a real estate portfolio, tracking assessment stages, assessor assignments, evidence uploads, and certification renewal deadlines. Provides portfolio-level certification pipeline reporting and automated renewal alerts to prevent certificate lapse.

> **Business value:** Reduces certification lapse risk through automated renewal tracking, streamlines evidence collection workflows across multiple certification schemes, and provides portfolio-level certification pipeline visibility for ESG reporting and EU Taxonomy alignment management.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CITIES`, `LEVELS`, `SCHEMES`, `SCHEME_COLORS`, `TABS`, `TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TYPES` | `['Office','Retail','Residential','Industrial','Mixed-Use'];` |
| `type` | `TYPES[Math.floor(s*5)];const city=CITIES[Math.floor(s2*CITIES.length)];` |
| `area` | `Math.floor(1000+s3*48000);const yearBuilt=Math.floor(1990+s4*35);` |
| `numCerts` | `Math.floor(s5*3.5);const certs=[];` |
| `idx` | `Math.floor(sr(i*31+c*7)*allSchemes.length);` |
| `levels` | `LEVELS[scheme];const level=levels[Math.floor(sr(i*37+c*11)*levels.length)];` |
| `certYear` | `Math.floor(2018+sr(i*41+c*13)*7);` |
| `expiryYear` | `certYear+3+Math.floor(sr(i*43+c*17)*3);` |
| `rentPsf` | `Math.floor((type==='Office'?45:type==='Retail'?35:type==='Residential'?28:type==='Industrial'?12:38)*(certified?1.08+s6*0.12:0.85+s6*0.15));` |
| `capRate` | `+(certified?4.2+s3*1.5:5.0+s3*2.0).toFixed(2);` |
| `vacancy` | `+(certified?3+s4*7:6+s4*14).toFixed(1);` |
| `value` | `Math.floor(area*rentPsf/(capRate/100));` |
| `schemeData` | `SCHEMES.map((scheme,i)=>{` |
| `schemeDist` | `useMemo(()=>SCHEMES.map(s=>({scheme:s,count:filtered.filter(b=>b.certifications.some(c=>c.scheme===s)).length})),[filtered]);` |
| `premiumScatter` | `useMemo(()=>filtered.map(b=>({name:b.name,numCerts:b.numCerts,rentPsf:b.rentPsf,capRate:b.capRate,vacancy:b.vacancy,certified:b.certified?1:0,area:b.a` |
| `premiumByScheme` | `useMemo(()=>SCHEMES.map(s=>{` |
| `avgWith` | `withScheme.length?Math.floor(withScheme.reduce((sum,b)=>sum+b.rentPsf,0)/withScheme.length):0;` |
| `avgWithout` | `without.length?Math.floor(without.reduce((sum,b)=>sum+b.rentPsf,0)/without.length):0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CITIES`, `SCHEMES`, `TABS`, `TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Certification Pipeline Value (€M) | — | Asset register | Aggregate GAV of assets currently in active certification process across all schemes; tracks workflow progress |
| Evidence Completion (%) | — | Workflow tracking system | Average percentage of required certification evidence items submitted across assets in the pipeline. |
| Renewal Risk Assets | — | Certificate expiry dates | Share of certified assets with certificates expiring within 12 months requiring renewal assessment initiation. |
| WELL Feature Compliance (%) | — | WELL Building Standard v2 | Percentage of WELL health and wellbeing features currently met; 50+ features required for WELL Silver certific |
- **Asset energy and water performance data** → Map to credit categories for target certification scheme → **Credit compliance scorecard by asset**
- **Certification scheme credit requirements (BREEAM/LEED/WELL)** → Define evidence requirements per credit, assign to workflow tasks → **Evidence requirement checklist**
- **Certificate expiry register** → Calculate days to expiry, trigger renewal workflow for <365 day assets → **Renewal risk dashboard**

## 5 · Intermediate Transformation Logic
**Methodology:** Certification Readiness Index
**Headline formula:** `CRI = Σ_i (evidence_i × w_i) / Σ_i w_i × (1 - days_to_deadline / 365)`
**Standards:** ['BREEAM Assessor Manual 2018', 'LEED Reference Guide v4.1', 'WELL Building Standard v2', 'NABERS Energy Rating Methodology']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).