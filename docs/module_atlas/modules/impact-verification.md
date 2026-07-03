# Impact Verification
**Module ID:** `impact-verification` · **Route:** `/impact-verification` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Manages the end-to-end impact verification workflow including evidence collection, third-party verifier assignment, verification methodology selection, and audit trail management. Ensures impact claims meet recognised standards (GVerify, GIIRS, BlueMark, B Lab) and provides structured outputs for investor impact reporting and regulatory disclosure.

> **Business value:** Ensures impact claims are independently verified to recognised standards, protecting investors from impact washing, enabling credible impact performance reporting, and building the evidence base required for regulatory disclosures under SFDR Article 9 sustainable investment requirements.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Btn`, `EVIDENCE_TIERS`, `IMPACT_WASHING_FLAGS`, `IMP_DIMENSIONS`, `KPI`, `LS_PORT`, `LS_VERIFY`, `PIE_COLORS`, `SDGS_17`, `Section`, `SevBadge`, `StatusBadge`, `TOC_STAGES`, `ThCell`, `VERIFIERS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `SDGS_17` | `Array.from({length:17},(_,i)=>({ id:i+1, name:['No Poverty','Zero Hunger','Good Health','Quality Education','Gender Equality','Clean Water','Affordabl` |
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `pct` | `(n) => n == null ? '\u2014' : `${Math.round(n)}%`;` |
| `evidenceTier` | `Math.min(5, Math.max(1, Math.ceil(seed(s * 11) * 5)));` |
| `impScore` | `Math.round(IMP_DIMENSIONS.reduce((acc, d) => acc + impDims[d.id] * d.weight, 0) / 100);` |
| `verifiedImpactMn` | `Math.round(seed(s * 23) * 80 + 5);` |
| `hasToC` | `seed(s * 29) > 0.35;` |
| `additionalityProven` | `seed(s * 31) > 0.45;` |
| `sdgsClaimed` | `Math.ceil(seed(s * 37) * 5);` |
| `sdgsVerified` | `Math.floor(sdgsClaimed * (0.3 + seed(s * 41) * 0.6));` |
| `verificationStatus` | `seed(s * 59) > 0.7 ? 'Fully Verified' : seed(s * 61) > 0.45 ? 'Partially Verified' : seed(s * 63) > 0.3 ? 'Under Review' : 'Unverified';` |
| `beneficiaries` | `Math.round(seed(s * 67) * 50000 + 1000);` |
| `tocData` | `TOC_STAGES.map(st => ({ stage: st, strength: Math.round(40 + seed(s * 71 + st.length) * 55) }));` |
| `counterfactual` | `Math.round(seed(s * 73) * 60 + 10);` |
| `costOfVerification` | `Math.round(seed(s * 79) * 120 + 20);` |
| `credibilityPremium` | `Math.round(costOfVerification * (0.8 + seed(s * 83) * 2.5));` |
| `wAvg` | `fn => holdings.reduce((s, h) => s + fn(h) * (h.weight \|\| 1), 0) / tw;` |
| `goldPct` | `holdings.filter(h => h.evidenceTier === 1).length / (holdings.length \|\| 1) * 100;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `EVIDENCE_TIERS`, `IMPACT_WASHING_FLAGS`, `IMP_DIMENSIONS`, `PIE_COLORS`, `TOC_STAGES`, `VERIFIERS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Verification Confidence Score | — | BlueMark benchmark | Scores above 0.80 indicate high-confidence impact claims; below 0.60 requires re-verification or methodology u |
| Evidence Quality Ratio (%) | — | GIIN / Internal | Share of impact KPIs supported by primary data (direct measurement, system records) vs proxy or modelled data. |
| Third-Party Verification Rate (%) | — | Portfolio verification tracker | Percentage of impact claims independently verified by a third-party verifier; UNPRI recommends 100% for impact |
| Time to Verification (days) | — | Workflow tracking | Average elapsed time from evidence submission to verification completion; longer timelines indicate evidence q |
- **Impact KPI data submissions (investee reports)** → Assess evidence quality tier, flag proxy data for upgrade → **Evidence quality assessment by KPI**
- **Verifier panel database** → Match verifier expertise to metric type and sector → **Verifier assignment and independence check**
- **Verification reports and audit trails** → Aggregate VCS scores, track resolution of findings → **Verification portfolio dashboard**

## 5 · Intermediate Transformation Logic
**Methodology:** Verification Confidence Score
**Headline formula:** `VCS = w_1 × EvidenceQuality + w_2 × MethodologyRobustness + w_3 × IndependenceIndex + w_4 × DataAuditability`
**Standards:** ['GVerify Impact Verification Standard', 'BlueMark Verification Methodology', 'GIIN IRIS+ Verification Framework']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).