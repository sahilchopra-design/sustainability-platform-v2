# Sdg Alignment Engine
**Module ID:** `sdg-alignment-engine` · **Route:** `/sdg-alignment-engine` · **Tier:** B (frontend-computed) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BOND_TYPES`, `COMPANY_PREFIXES`, `COMPANY_SUFFIXES`, `SDG_COLORS`, `SDG_NAMES`, `SECTORS`, `USE_OF_PROCEEDS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `pIdx` | `Math.floor(s1*COMPANY_PREFIXES.length);` |
| `sIdx` | `Math.floor(s2*COMPANY_SUFFIXES.length);` |
| `secIdx` | `Math.floor(s3*SECTORS.length);` |
| `topSDGs` | `sdgScores.sort((a,b)=>b.alignment-a.alignment).slice(0,5).map(s=>s.sdg);` |
| `pIdx` | `Math.floor(s1*COMPANY_PREFIXES.length);` |
| `sIdx` | `Math.floor(s2*COMPANY_SUFFIXES.length);` |
| `btIdx` | `Math.floor(s3*BOND_TYPES.length);` |
| `numSDGs` | `Math.floor(sr(i*53+230)*3)+1;` |
| `upIdx` | `Math.floor(sr(i*37+250)*USE_OF_PROCEEDS.length);` |
| `exposure` | `Math.round(sr(g*71+400)*25+3);` |
| `target` | `Math.round(sr(g*43+410)*20+5);` |
| `pIdx` | `Math.floor(sr(g*17+c*31+420)*COMPANY_PREFIXES.length);` |
| `sIdx` | `Math.floor(sr(g*19+c*37+430)*COMPANY_SUFFIXES.length);` |
| `csv` | `[keys.join(','),...data.map(r=>keys.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');` |
| `blob` | `new Blob([csv],{type:'text/csv'});` |
| `gaps` | `sdgPortfolio.filter(s=>s.gap>0).sort((a,b)=>b.gap-a.gap);` |
| `recommendations` | `gaps.slice(0,5).map(g=>({sdg:g.sdg,name:g.name,color:g.color,gap:g.gap,action:g.gap>10?'Increase allocation significantly':'Moderate rebalancing neede` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BOND_TYPES`, `COMPANY_PREFIXES`, `COMPANY_SUFFIXES`, `SDG_COLORS`, `SDG_NAMES`, `SECTORS`, `USE_OF_PROCEEDS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).