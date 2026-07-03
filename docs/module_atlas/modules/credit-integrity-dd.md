# Credit Integrity Due Diligence
**Module ID:** `credit-integrity-dd` · **Route:** `/credit-integrity-dd` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Performs ESG due diligence for credit origination and green bond verification, assessing issuer integrity, use-of-proceeds alignment, and ESG risk flags against ICMA Green Bond Principles and EU Green Bond Standard. Generates credit committee ESG addendum reports.

> **Business value:** Enables credit teams and ESG analysts to produce defensible green bond due diligence reports, reducing greenwashing risk exposure and meeting EU Green Bond Standard verification requirements for regulated issuers.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CCP_DIMS`, `CREDITS`, `GREENWASH_FLAGS`, `INTEGRITY_DIMS`, `INTEGRITY_TIERS`, `Kpi`, `PROJECT_TYPES`, `RISK_LEVELS`, `RiskBadge`, `STANDARDS`, `ScoreBar`, `Section`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `INTEGRITY_DIMS` | `['Additionality', 'Permanence', 'MRV Quality', 'Co-Benefits', 'Safeguards', 'Registry Standard', 'Verification Body', 'Project Vintage'];` |
| `STANDARDS` | `['VCMI', 'ICVCM Core Carbon Principles', 'SBTi Net-Zero', 'Science Based Targets', 'Oxford Principles', 'REDD+ Safeguards'];` |
| `PROJECT_TYPES` | `['REDD+', 'Improved Forest Mgmt', 'Renewable Energy', 'Cookstoves', 'Methane Capture', 'Blue Carbon'];` |
| `additionality` | `Math.round(40 + sr(i * 5) * 55);` |
| `permanence` | `Math.round(35 + sr(i * 7) * 60);` |
| `mrv` | `Math.round(50 + sr(i * 9) * 45);` |
| `cobenefits` | `Math.round(30 + sr(i * 11) * 65);` |
| `safeguards` | `Math.round(45 + sr(i * 13) * 50);` |
| `overall` | `Math.round((additionality + permanence + mrv + cobenefits + safeguards) / 5);` |
| `price` | `+(2 + sr(i * 17) * 18).toFixed(2);` |
| `adjustedPrice` | `+(price * (0.5 + Math.min(100, Math.max(0, overall)) / 100)).toFixed(2);` |
| `buildRadar` | `(credit) => INTEGRITY_DIMS.map((dim, i) => ({` |
| `avgIntegrity` | `Math.round(CREDITS.reduce((a, c) => a + c.overall, 0) / Math.max(1, CREDITS.length));` |
| `avgAdjustedPremium` | `((CREDITS.reduce((a, c) => a + c.adjustedPrice, 0) / CREDITS.reduce((a, c) => a + c.price, 0) - 1) * 100).toFixed(1);` |
| `req` | `sr(i * 7 + j * 11) > 0.25;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CCP_DIMS`, `GREENWASH_FLAGS`, `INTEGRITY_DIMS`, `INTEGRITY_TIERS`, `PROJECT_TYPES`, `RISK_LEVELS`, `STANDARDS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Use-of-Proceeds Alignment | — | ICMA GBP / EU GBS | Percentage of bond proceeds allocated to ICMA-eligible or EU Taxonomy-aligned categories |
| Greenwashing Risk Flag | — | Internal scoring | Traffic-light greenwashing risk rating based on use-of-proceeds, issuer ESG, and reporting quality |
| EU Taxonomy Alignment | — | EU Taxonomy Regulation | Proportion of bond activities meeting EU Taxonomy substantial contribution and DNSH criteria |
| Credit Spread Premium | — | Bloomberg Green Bond Monitor | Green premium (greenium) vs equivalent conventional bond from same issuer |
| Integrity Score | — | Composite model | Overall credit ESG integrity score; <60 triggers mandatory credit committee ESG review |
- **Bond term sheet / prospectus** → Extract eligible categories, map to ICMA GBP and EU Taxonomy criteria → **Use-of-proceeds alignment score**
- **Company Profiles module** → Import issuer ESG score and controversy flags → **Issuer ESG and greenwashing risk input**
- **EU Taxonomy technical screening criteria** → Verify substantial contribution and DNSH for each eligible activity → **EU Taxonomy alignment % and DNSH flags**

## 5 · Intermediate Transformation Logic
**Methodology:** Credit ESG Integrity Score
**Headline formula:** `IntegrityScore = 0.35×UseOfProceeds + 0.30×ProcessMgmt + 0.20×IssuerESG + 0.15×Reporting`
**Standards:** ['ICMA Green Bond Principles 2021', 'EU Green Bond Standard 2023', 'CBI Climate Bonds Standard']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).