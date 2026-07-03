# SBTi Target Setter
**Module ID:** `sbti-target-setter` · **Route:** `/sbti-target-setter` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Science Based Targets initiative target-setting tool covering near-term (2030) and net-zero (2050) targets. Includes SDA sector pathways, FLAG methodology, and portfolio coverage target for financial institutions.

> **Business value:** SBTi validation is the gold standard for credible corporate climate targets. Enables companies to set, validate, and track science-aligned targets, and supports financial institutions in setting portfolio engagement targets required by net-zero alliances.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `CARBON_BUDGETS`, `COMPANIES`, `FLAG_COMMODITIES`, `KPI`, `METHODS`, `PAGE_SIZE`, `PIECLRS`, `SECTOR_PATHS`, `SectionHead`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(1):v:v;` |
| `statusBadge` | `(s)=>{const m={'Net-Zero Validated':{bg:'rgba(5,150,105,0.12)',c:ACCENT},'Targets Validated':{bg:'rgba(22,163,74,0.12)',c:T.green},'Targets Set':{bg:'` |
| `csvExport` | `(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))]` |
| `status` | `statuses[Math.floor(sr(base)*5.5)]; // bias toward validated` |
| `method` | `methods[Math.floor(sr(base+1)*4)];` |
| `baseYear` | `2018+Math.floor(sr(base+3)*4);` |
| `scope1` | `Math.round(50000+sr(base+5)*9950000);` |
| `scope2` | `Math.round(20000+sr(base+7)*2000000);` |
| `scope3` | `Math.round(scope1*2+sr(base+9)*scope1*5);` |
| `nearTermS12` | `Math.round(25+sr(base+11)*30); // 25-55% by 2030` |
| `nearTermS3` | `Math.round(10+sr(base+13)*30);` |
| `longTermS3` | `Math.round(60+sr(base+15)*10); // 67% per NZ Standard` |
| `tempScore` | `+(1.3+sr(base+17)*2.0).toFixed(1);` |
| `annualRate` | `+(nearTermS12/(2030-baseYear)).toFixed(1);` |
| `currentReduction` | `Math.round(nearTermS12*0.4+sr(base+19)*nearTermS12*0.3); // 40-70% of target` |
| `onTrack` | `currentReduction>=(nearTermS12*(2026-baseYear)/(2030-baseYear))*0.85;` |
| `commitDate` | ``20${20+Math.floor(sr(base+21)*4)}-${String(1+Math.floor(sr(base+23)*12)).padStart(2,'0')}-${String(1+Math.floor(sr(base+25)*28)).padStart(2,'0')}`;` |
| `validationDeadline` | ``20${22+Math.floor(sr(base+27)*3)}-${String(1+Math.floor(sr(base+29)*12)).padStart(2,'0')}`;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CARBON_BUDGETS`, `FLAG_COMMODITIES`, `METHODS`, `PIECLRS`, `SECTOR_PATHS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Near-term Target | `Sector SDA pathway` | SBTi | Required Scope 1+2+3 reduction by 2030 vs base year |
| Net-Zero Target | — | SBTi Net-Zero Standard | Science-based net-zero requiring near-complete decarbonisation |
| Residual Emissions | — | SBTi | Remaining emissions that must be neutralised with removals |
| Portfolio Coverage Target | — | SBTi FI | FIs must engage 67% of financed emissions companies |
- **Company base year emissions** → SDA pathway calculation → **Near-term target (tCO2e)**
- **Sector production data** → Budget allocation → **Company-specific reduction %**
- **Residual emissions estimate** → Removal requirement → **Neutralisation target**

## 5 · Intermediate Transformation Logic
**Methodology:** SBTi Sectoral Decarbonisation Approach
**Headline formula:** `Target = Sector_budget_2030 × CompanyShare_production`
**Standards:** ['SBTi Corporate Net-Zero Standard v1.2', 'SBTi SDA', 'GHG Protocol']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).