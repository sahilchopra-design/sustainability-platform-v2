# Theory Of Change
**Module ID:** `theory-of-change` · **Route:** `/theory-of-change` · **Tier:** B (frontend-computed) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `EVIDENCE_QUALITY`, `INV_PREFIXES`, `INV_SUFFIXES`, `SECTORS`, `STAGE_COLORS`, `TEMPLATES`, `TOC_STAGES`, `VERIFICATION_STATUSES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `INV_SUFFIXES` | `['Fund I','Fund II','Project Alpha','Project Beta','Initiative','Venture','Partnership','Co-Investment','Direct','Platform'];` |
| `pIdx` | `Math.floor(s1*INV_PREFIXES.length);` |
| `sIdx` | `Math.floor(s2*INV_SUFFIXES.length);` |
| `secIdx` | `Math.floor(s3*SECTORS.length);` |
| `stageKPIs` | `TOC_STAGES.map((stage,si)=>{` |
| `items` | `(template[stage.toLowerCase()]\|\|defaultTemplate[stage.toLowerCase()]).map((item,ii)=>({` |
| `invested` | `Math.round((sr(i*67+230)*40+5)*10)/10;` |
| `counterfactualBase` | `Math.round(sr(i*43+240)*30+10);` |
| `withInvestment` | `Math.round(counterfactualBase*(1+sr(i*53+250)*1.5+0.3));` |
| `additionality` | `Math.round(((withInvestment-counterfactualBase)/withInvestment)*100);` |
| `verStatus` | `VERIFICATION_STATUSES[Math.floor(sr(i*37+260)*4)];` |
| `evidenceQ` | `EVIDENCE_QUALITY[Math.floor(sr(i*29+270)*3)];` |
| `csv` | `[keys.join(','),...data.map(r=>keys.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');` |
| `blob` | `new Blob([csv],{type:'text/csv'});` |
| `verCounts` | `VERIFICATION_STATUSES.map(v=>({status:v,count:investments.filter(i=>i.verificationStatus===v).length}));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `EVIDENCE_QUALITY`, `INV_PREFIXES`, `INV_SUFFIXES`, `SECTORS`, `STAGE_COLORS`, `TOC_STAGES`, `VERIFICATION_STATUSES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).