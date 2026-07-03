# Additionality Assessment
**Module ID:** `additionality-assessment` · **Route:** `/additionality-assessment` · **Tier:** B (frontend-computed) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CAPACITY_EVIDENCE`, `DFI_NAMES`, `DIMENSIONS`, `DIM_COLORS`, `FINANCIAL_EVIDENCE`, `GEOGRAPHIES`, `INV_PREFIXES`, `INV_SUFFIXES`, `POLICY_EVIDENCE`, `SECTORS`, `STRATEGIC_EVIDENCE`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `INV_SUFFIXES` | `['Fund I','Fund II','Fund III','Project A','Project B','Initiative','Venture','Co-Inv','Direct','Platform'];` |
| `FINANCIAL_EVIDENCE` | `['Below-market return accepted','Concessionary terms offered','First-loss tranche provided','Longer tenor than market','Higher risk tolerance than com` |
| `pIdx` | `Math.floor(s1*INV_PREFIXES.length);` |
| `sIdx` | `Math.floor(s2*INV_SUFFIXES.length);` |
| `secIdx` | `Math.floor(s3*SECTORS.length);` |
| `geoIdx` | `Math.floor(sr(i*37+730)*GEOGRAPHIES.length);` |
| `financialScore` | `Math.round(sr(i*31+740)*60+30);` |
| `strategicScore` | `Math.round(sr(i*43+750)*60+25);` |
| `policyScore` | `Math.round(sr(i*53+760)*60+20);` |
| `capacityScore` | `Math.round(sr(i*67+770)*60+25);` |
| `compositeScore` | `Math.round((financialScore*0.35+strategicScore*0.25+policyScore*0.2+capacityScore*0.2));` |
| `investedM` | `Math.round((sr(i*71+780)*60+5)*10)/10;` |
| `projectIRR` | `Math.round((sr(i*29+790)*15+2)*100)/100;` |
| `benchmarkIRR` | `Math.round((sr(i*23+800)*8+5)*100)/100;` |
| `irrGap` | `Math.round((projectIRR-benchmarkIRR)*100)/100;` |
| `financialEvidence` | `FINANCIAL_EVIDENCE.filter((_,ei)=>sr(i*17+ei*31+810)>0.45);` |
| `strategicEvidence` | `STRATEGIC_EVIDENCE.filter((_,ei)=>sr(i*19+ei*29+820)>0.5);` |
| `policyEvidence` | `POLICY_EVIDENCE.filter((_,ei)=>sr(i*23+ei*37+830)>0.55);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CAPACITY_EVIDENCE`, `DFI_NAMES`, `DIMENSIONS`, `DIM_COLORS`, `FINANCIAL_EVIDENCE`, `GEOGRAPHIES`, `INV_PREFIXES`, `INV_SUFFIXES`, `POLICY_EVIDENCE`, `SECTORS`, `STRATEGIC_EVIDENCE`

## 4 · End-to-End Data Lineage (source → transformation → UI)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).