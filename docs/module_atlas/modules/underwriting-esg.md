# Underwriting ESG
**Module ID:** `underwriting-esg` · **Route:** `/underwriting-esg` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
ESG integration platform for insurance underwriting; scores policy risks against environmental, social and governance criteria to support risk selection, pricing and exclusion policy implementation.

> **Business value:** Insurers globally have withdrawn £1.3 trillion in coal underwriting capacity since 2017; ESG underwriting integration is accelerating as physical climate losses threaten insurability of high-risk sectors.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ENGAGEMENT_ACTIONS`, `ESG_CRITERIA`, `EXCLUSION_LISTS`, `PIE_COLORS`, `POLICIES`, `POLICY_TYPES`, `REGULATIONS`, `RISK_RATINGS`, `SECTORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sector` | `SECTORS[Math.floor(s1*SECTORS.length)];` |
| `policyType` | `POLICY_TYPES[Math.floor(s2*POLICY_TYPES.length)];` |
| `premium` | `Math.round(50+s3*950);` |
| `limit` | `Math.round(premium*2+s4*premium*8);` |
| `eScores` | `ESG_CRITERIA.map((_c,ci)=>Math.round(20+sr(i*13+ci*7)*80));` |
| `esgScore` | `Math.round(eScores.reduce((a,b)=>a+b,0)/eScores.length);` |
| `envScore` | `Math.round((eScores[0]+eScores[1]+eScores[2]+eScores[3])/4);` |
| `socScore` | `Math.round((eScores[4]+eScores[5]+eScores[6]+eScores[10])/4);` |
| `govScore` | `Math.round((eScores[7]+eScores[8]+eScores[9]+eScores[11])/4);` |
| `fossilFuelExposure` | `sector==='Oil & Gas'\|\|sector==='Coal Mining'?+(60+s5*35).toFixed(1):sector==='Power Generation'?+(20+s5*40).toFixed(1):+(s5*15).toFixed(1);` |
| `transitionRisk` | `+(1+s6*9).toFixed(1);` |
| `physicalRisk` | `+(1+s7*9).toFixed(1);` |
| `litigationRisk` | `+(1+s8*9).toFixed(1);` |
| `lossRatio` | `+(0.2+s1*0.6).toFixed(2);` |
| `client` | ``Client-${String(i+1).padStart(3,'0')}`;` |
| `country` | `['US','UK','DE','JP','AU','CA','FR','BR','IN','SG'][Math.floor(s2*10)];` |
| `avgESG` | `POLICIES.length?Math.round(POLICIES.reduce((a,b)=>a+b.esgScore,0)/POLICIES.length):0;` |
| `avgEnv` | `POLICIES.length?Math.round(POLICIES.reduce((a,b)=>a+b.envScore,0)/POLICIES.length):0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ENGAGEMENT_ACTIONS`, `ESG_CRITERIA`, `EXCLUSION_LISTS`, `PIE_COLORS`, `POLICY_TYPES`, `REGULATIONS`, `RISK_RATINGS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Policies with ESG Flag | — | Underwriting System | Proportion of policies flagged for ESG review during underwriting; most common flags: coal, deforestation, gov |
| Coal Exclusion Compliance | — | Exclusion Engine | Proportion of new policies compliant with coal underwriting exclusion threshold (>30% revenue from thermal coa |
| ESG Premium Loading (Avg) | — | Pricing Engine | Average premium loading applied to policies with ESG risk factors that do not trigger outright exclusion. |
- **Policy Submission Data, ESG Databases, Exclusion Lists, Premium Data** → ESG scoring engine + exclusion checker + loading calculator → **Underwriting ESG reports, exclusion compliance tracker, PSI disclosures**

## 5 · Intermediate Transformation Logic
**Methodology:** ESG Underwriting Score
**Headline formula:** `EUS = Eₘₐ⸡ × 0.4 + Sₘₐ⸡ × 0.35 + Gₘₐ⸡ × 0.25`
**Standards:** ['UNEP PSI ESG in Underwriting 2020', 'ClimateWise Principles']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).