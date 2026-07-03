# Green Taxonomy Navigator
**Module ID:** `green-taxonomy-navigator` · **Route:** `/green-taxonomy-navigator` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Compares multi-jurisdictional green taxonomy frameworks including EU Taxonomy, UK Green Taxonomy, Monetary Authority of Singapore (MAS) Taxonomy, and China's Green Bond Catalogue, mapping activity-level alignment and identifying mutual recognition opportunities. Enables cross-border issuers and investors to assess dual-taxonomy compliance.

> **Business value:** Enables multi-jurisdictional green bond issuers to achieve dual-taxonomy labelling, assists investors in assessing cross-border green product consistency, and supports regulators in monitoring fragmentation between major green finance taxonomies.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACTIVITIES`, `Badge`, `COLORS`, `PORTFOLIO`, `Stat`, `TABS`, `TAXONOMIES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `taxKeys` | `TAXONOMIES.map(t=>t.id);` |
| `exportCSV` | `(rows,name)=>{if(!rows.length)return;const keys=Object.keys(rows[0]).filter(k=>typeof rows[0][k]!=='object');const csv=[keys.join(','),...rows.map(r=>` |
| `sectors` | `[...new Set(ACTIVITIES.map(a=>a.sector))];` |
| `pairOverlap` | `useMemo(()=>{const [a,b]=interopPair;return ACTIVITIES.map(act=>({activity:act.name,taxA:act[a]\|\|'N/A',taxB:act[b]\|\|'N/A',aligned:act[a]===act[b]&&act` |
| `portfolioScreened` | `useMemo(()=>{return PORTFOLIO.filter(p=>!portfolioSearch\|\|p.company.toLowerCase().includes(portfolioSearch.toLowerCase())).map(p=>{const results={};sc` |
| `radarData` | `useMemo(()=>{const dims=['Activities','Env Objectives','DNSH','Social Min','Interop','Maturity'];return dims.map(d=>{const obj={dim:d};comparisonData.` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ACTIVITIES`, `COLORS`, `PORTFOLIO`, `TABS`, `TAXONOMIES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| EU-UK Taxonomy Alignment (%) | — | ICMA Taxonomy Mapping (2023) | Activities eligible under both EU and UK taxonomies; 22% divergence relates to UK nuclear/gas transition provi |
| EU-China Taxonomy Overlap (%) | — | IPSF Taxonomy Working Group | Lower overlap reflects China's inclusion of clean coal and different threshold stringency for transport and bu |
| MAS-EU Common Ground (%) | — | MAS-EU Taxonomy comparison 2023 | Singapore-Asia Taxonomy aligns with EU in climate mitigation but diverges in treatment of natural gas as trans |
| Dual-Taxonomy Eligible Activities | — | ICMA cross-taxonomy mapping | Number of EU Taxonomy activities that also qualify under at least one other major green taxonomy. |
- **EU Taxonomy Delegated Acts activity database** → Extract NACE codes, TSC thresholds, and DNSH criteria → **EU Taxonomy activity baseline**
- **UK/MAS/China taxonomy activity lists** → Map to NACE codes, compare TSC stringency by activity → **Cross-taxonomy alignment matrix**
- **Portfolio activity classification** → Apply multi-taxonomy eligibility criteria, flag divergences → **Dual-taxonomy compliance scorecard**

## 5 · Intermediate Transformation Logic
**Methodology:** Cross-Taxonomy Alignment Index
**Headline formula:** `CTAI_ij = |Activities_i ∩ Activities_j| / |Activities_i ∪ Activities_j|`
**Standards:** ['EU Taxonomy Regulation (2020/852)', 'UK Green Taxonomy (HM Treasury 2023)', 'MAS Singapore-Asia Taxonomy (2023)', 'China Green Bond Catalogue (2021)']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).