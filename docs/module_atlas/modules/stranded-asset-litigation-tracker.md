# Stranded Asset Litigation Tracker
**Module ID:** `stranded-asset-litigation-tracker` · **Route:** `/stranded-asset-litigation-tracker` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Tracks litigation risk arising from stranded fossil fuel assets; maps active and emerging climate litigation cases to asset exposures, jurisdictions and financial liability estimates.

> **Business value:** Climate litigation has grown 200%+ since 2015; stranded asset claims represent the fastest-growing litigation category, with Milieudefensie v Shell establishing precedent for mandatory emissions reductions.

**How an analyst works this module:**
- Ingest portfolio fossil fuel asset exposures
- Map assets to active litigation cases by jurisdiction and sector
- Estimate case success probability and financial liability range
- Compute portfolio-level litigation exposure index
- Monitor case developments and trigger alerts on material judgements

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSETS`, `ASSET_TYPES`, `COUNTRIES`, `CREDITORS`, `CREDITOR_TYPES`, `KpiCard`, `NGFS_SCENARIOS`, `NGFS_WRITE_DOWN_RANGES`, `OWNER_NAMES`, `PERMIT_STATUSES`, `REG_TRIGGERS`, `RiskBadge`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `typeIdx` | `Math.floor(sr(i * 7) * 8);` |
| `countryIdx` | `Math.floor(sr(i * 11) * 20);` |
| `ownerIdx` | `Math.floor(sr(i * 13) * 20);` |
| `strandingRisk` | `Math.round(sr(i * 17) * 90 + 5);` |
| `bookValue` | `Math.round((sr(i * 19) * 4 + 0.05) * 1e3); // $M` |
| `remainingLife` | `Math.round(sr(i * 23) * 35 + 2);` |
| `carbonLockIn` | `+(sr(i * 29) * 500 + 5).toFixed(1);` |
| `decommissionCost` | `Math.round(bookValue * (sr(i * 31) * 0.3 + 0.05));` |
| `litigationExposure` | `Math.round(bookValue * (sr(i * 37) * 0.5 + 0.02));` |
| `creditorExposure` | `Math.round(bookValue * (sr(i * 41) * 0.7 + 0.1));` |
| `permitStatusIdx` | `Math.floor(sr(i * 43) * 4);` |
| `physRisk` | `Math.round(sr(i * 47) * 80 + 10);` |
| `policyRisk` | `Math.round(sr(i * 53) * 80 + 10);` |
| `marketRisk` | `Math.round(sr(i * 59) * 80 + 10);` |
| `socialLicenseRisk` | `Math.round(sr(i * 61) * 80 + 10);` |
| `currentUtilization` | `+(sr(i * 67) * 90 + 5).toFixed(0);` |
| `ngfsWriteDown` | `NGFS_SCENARIOS.map((_, si) => {` |
| `remEconValue` | `Math.round(bookValue * (remainingLife / 40) * (1 - strandingRisk / 100));` |
| `creditorTypeIdx` | `Math.floor(sr(k * 73 + 3000) * 5);` |
| `assetIdx` | `Math.floor(sr(k * 79 + 3000) * 120);` |
| `exposureUSD` | `Math.round((sr(k * 83 + 3000) * 3 + 0.01) * 1e9);` |
| `maturityYear` | `2025 + Math.floor(sr(k * 89 + 3000) * 20);` |
| `loanToValue` | `+(sr(k * 97 + 3000) * 0.8 + 0.1).toFixed(2);` |
| `provisioning` | `+(sr(k * 101 + 3000) * 0.3).toFixed(2);` |
| `litigationRisk` | `Math.round(sr(k * 103 + 3000) * 70 + 10);` |
| `jurIdx` | `Math.floor(sr(r * 107 + 3500) * 20);` |
| `impactTypes` | `['Write-Down', 'Permit Revocation', 'Early Closure', 'Stranding'];` |
| `probability` | `+(sr(r * 113 + 3500) * 0.7 + 0.1).toFixed(2);` |
| `TABS` | `['Stranding Dashboard', 'Asset Database', 'NGFS Scenario Analysis', 'Creditor Exposure', 'Regulatory Trigger Map', 'Carbon Lock-In Analytics', 'Summary & Export'];` |
| `total` | `filtered.reduce((s, a) => s + a.bookValue * a.ngfsWriteDown[scenarioIdx] / 100, 0);` |
| `byType` | `Object.entries(typeMap).map(([type, val]) => ({ type, val: Math.round(val) })).filter(d => d.val > 0).sort((a, b) => b.val - a.val);` |
| `byScenario` | `NGFS_SCENARIOS.map((sc, si) => ({` |
| `ngfsTypeData` | `useMemo(() => ASSET_TYPES.map(type => {` |
| `carbonLockInData` | `useMemo(() => { const byType = ASSET_TYPES.map(type => ({ type, totalMtCO2: +filtered.filter(a => a.type === type).reduce((s, a) => s + a.carbonLockIn, 0).toFixed(0), })).filter(d => d.totalMtCO2 > 0).sort((a, b) => b.totalMtCO2 - a.totalMtCO2);` |
| `scc` | `51; // USD per tonne CO2` |
| `totalLockIn` | `filtered.reduce((s, a) => s + a.carbonLockIn, 0);` |
| `sccExposure` | `totalLockIn * scc * 1e6;` |
| `year` | `2025 + y * 5;` |
| `remaining` | `filtered.filter(a => a.remainingLife >= y * 5).reduce((s, a) => s + a.carbonLockIn, 0);` |
| `triggerScoreByAsset` | `useMemo(() => { return filtered.slice(0, 20).map(a => { const applicableTriggers = REG_TRIGGERS.filter(t => t.assetType === a.type);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSET_TYPES`, `COLORS`, `COUNTRIES`, `CREDITOR_TYPES`, `NGFS_SCENARIOS`, `NGFS_WRITE_DOWN_RANGES`, `OWNER_NAMES`, `PERMIT_STATUSES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Active Cases Tracked | — | Sabin Center Database | Global climate litigation cases mapped to fossil fuel asset exposures as of latest update. |
| Estimated Portfolio LEI | — | LEI Engine | Expected litigation liability attributable to portfolio fossil fuel holdings. |
| High-Risk Jurisdictions | — | Legal Risk Model | Jurisdictions with >50% success rate in recent climate liability rulings (US, AU, NL, DE, FR, UK, CA). |
- **Sabin Center Case Feed, Portfolio Asset Registry** → Case-to-asset matching + probability-weighted liability model → **Litigation exposure dashboard, jurisdiction heatmap, case alerts**

## 5 · Intermediate Transformation Logic
**Methodology:** Litigation Exposure Index
**Headline formula:** `LEI = Σ (Asset Value × Case Probability × Liability Severity)`

Portfolio-weighted expected litigation liability from stranded asset claims across jurisdictions.

**Standards:** ['Grantham LSE Climate Litigation Database', 'TCFD Litigation Risk Guidance']
**Reference documents:** Sabin Center Global Climate Litigation Database; Grantham LSE Litigation Risk Report 2023; TCFD Guidance on Climate Litigation Risk; ClientEarth Legal Risk Taxonomy

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's formula is `LEI (Litigation Exposure Index) =
> Σ(Asset Value × Case Probability × Liability Severity)`. **No case-probability or
> liability-severity decomposition exists in the code** — `litigationExposure` is simply
> `bookValue × (sr()×0.5+0.02)`, a flat random 2–52% haircut of book value with no case-level data
> (despite the guide citing "312 active cases tracked" from the Sabin Center database, no case list
> or case-to-asset matching exists in this file).

### 7.1 What the module computes

120 synthetic fossil-fuel assets (`ASSETS`, 8 types × 20 countries × 20 fictional owner companies),
each with independently `sr()`-seeded fields:

```
strandingRisk    = round(5 + sr(i×17)×90)                         // 5–95
bookValue ($M)   = round((sr(i×19)×4+0.05)×1000)                   // $50M–4.05Bn
remainingLife     = round(2 + sr(i×23)×35)                          // 2–37 years
carbonLockIn (Mt) = 5 + sr(i×29)×500                                 // 5–505 MtCO₂
decommissionCost  = bookValue × (sr(i×31)×0.3+0.05)                  // 5–35% of book value
litigationExposure= bookValue × (sr(i×37)×0.5+0.02)                  // 2–52% of book value
creditorExposure  = bookValue × (sr(i×41)×0.7+0.1)                   // 10–80% of book value
ngfsWriteDown[4 scenarios] = lo + sr()×(hi−lo)   per NGFS_WRITE_DOWN_RANGES
  Net Zero 2050: [55,85]%   Below 2°C: [35,65]%   Delayed Transition: [20,45]%   Hot House World: [10,25]%
remainingEconValue = max(0, bookValue × (remainingLife/40) × (1−strandingRisk/100))
```

80 synthetic creditors (`CREDITORS`) each linked to a random asset, with `exposureUSD` ($10M–3Bn),
`loanToValue` (10–90%), `provisioning` (0–30%), `litigationRisk` (10–80). 20 synthetic regulatory
triggers (`REG_TRIGGERS`) with real-sounding trigger names (carbon pricing >$100/t, coal phase-out
mandate, CBAM, SFDR Art.9 reclassification, etc.) and a random `probability` (0.1–0.8).

The `NGFS_WRITE_DOWN_RANGES` ordering is directionally correct: Net Zero 2050 (orderly, fast
transition) implies the **largest** write-down range (55–85%) since assets strand sooner/harder,
while Hot House World (no transition) implies the **smallest** (10–25%) since fossil assets keep
operating — consistent with real NGFS-scenario stranded-asset logic.

### 7.2 Parameterisation

| Field | Range | Provenance |
|---|---|---|
| `strandingRisk` | 5–95 | Synthetic, uniform-ish |
| `litigationExposure` | 2–52% of book value | Synthetic; no case-probability/severity basis despite guide's formula |
| `scc` (social cost of carbon, used in a companion tab) | **$51/tCO₂** | Real — matches the 2021 US Interagency Working Group central SCC estimate |
| `NGFS_WRITE_DOWN_RANGES` | 10–85% by scenario | Synthetic ranges, correctly ordered by scenario severity |
| Creditor `exposureUSD` | $10M–3Bn | Synthetic |

### 7.3 Calculation walkthrough

1. **Asset generation** — 120 synthetic assets as above; India-mode swap via `isIndiaMode()` /
   `adaptForPhysicalRisk()` replaces the default synthetic set with an India-specific adapted dataset
   when the platform's India context is active (a genuine data-source switch, not itself computed
   here).
2. **Stranding Dashboard** — portfolio KPIs: total book value at risk under the selected NGFS
   scenario (`Σ bookValue×ngfsWriteDown[scenario]/100`), top asset types by write-down, scenario
   comparison bars.
3. **Carbon Lock-In Analytics** — `sccExposure = Σ(carbonLockIn) × $51/tCO₂ × 1e6` — converts total
   locked-in carbon (Mt) across filtered assets into a dollar externality using the real SCC figure;
   a genuinely meaningful (if asset-selection-dependent) metric. A companion chart shows locked-in
   carbon remaining by 5-year horizon, filtering assets whose `remainingLife` still covers that
   horizon.
4. **Creditor Exposure tab** — cross-tabulates the 80 synthetic creditors by type/asset, with
   `litigationRisk` as an independent random score (not derived from the asset's own
   `litigationExposure`).
5. **Regulatory Trigger Map** — for the first 20 filtered assets, matches applicable `REG_TRIGGERS`
   by asset type and computes a `triggerScoreByAsset` (implementation detail not fully traced here;
   built from the count/probability of applicable triggers).

### 7.4 Worked example

Asset `i=0`: `type=ASSET_TYPES[floor(sr(0)×8)]`. `sr(0)=frac(sin(1)×10⁴)=0.7147` →
`typeIdx=floor(0.7147×8)=5` → **"Coal Mine"**. `bookValue = round((sr(19)×4+0.05)×1000)`; continuing
the seeded chain for this asset gives a specific book value, stranding risk, and NGFS write-down
percentages per scenario — all independently drawn, so (as with the sibling
`stranded-asset-watchlist` and other modules in this family) there is no guarantee a high
`strandingRisk` asset also shows a high `litigationExposure` or `ngfsWriteDown`, since none of these
fields are derived from one another.

### 7.5 Companion analytics

- **Regulatory Trigger Map** — 20 real-sounding regulatory triggers (carbon pricing, CBAM, SFDR
  Art.9, IEA NZE alignment, mandatory transition plans) mapped to asset types with a synthetic
  probability — descriptive scenario cataloguing.
- **Summary & Export** — CSV/portfolio-level export of the full synthetic dataset.

### 7.6 Data provenance & limitations

- **100% synthetic asset, creditor, and litigation data.** No Sabin Center Climate Litigation
  Database case records are ingested despite being the guide's primary cited source and headline
  dataPoint ("312 active cases tracked").
- `litigationExposure` has no relationship to `strandingRisk`, `permitStatus`, or jurisdiction —
  a "Revoked" permit status does not increase the synthetic litigation exposure figure.
- The SCC-based carbon lock-in externality ($51/tCO₂) is the one genuinely well-sourced constant in
  the file; everything it multiplies (`carbonLockIn`) is itself synthetic.
- Creditor-asset linkage is random (`assetIdx = floor(sr()×120)`), not based on any real financing
  relationship data.

**Framework alignment:** Sabin Center Global Climate Litigation Database (named in guide, not
ingested) · NGFS Phase-consistent scenario stranding ranges (correctly ordered by scenario severity,
magnitudes synthetic) · US Interagency Working Group Social Cost of Carbon 2021 ($51/tCO₂, correctly
applied in the carbon lock-in externality calculation) · TCFD litigation-risk guidance (conceptual
framing only).

## 9 · Future Evolution

### 9.1 Evolution A — Ingest the Sabin Center case database and build the real LEI decomposition (analytics ladder: rung 1 → 3)

**What.** The §7 flag identifies the core failure: the guide's `LEI = Σ(Asset Value × Case Probability × Liability Severity)` has **no case-probability or liability-severity decomposition** — `litigationExposure` is just `bookValue × (sr()×0.5+0.02)`, a flat random haircut with no case data, and the guide's cited "312 active cases from the Sabin Center" are never ingested; there is no case list or case-to-asset matching in the file. The 120 assets, 80 creditors, and 20 regulatory triggers are all `sr()`-synthetic. The one well-sourced element is the SCC-based carbon lock-in externality ($51/tCO₂, correctly applied). Evolution A builds the litigation model the module is named for.

**How.** (1) Ingest the Sabin Center Global Climate Litigation Database (publicly accessible) into a `climate_litigation_cases` table — jurisdiction, defendant, case type, status, precedent (Milieudefensie v Shell). (2) Match cases to portfolio assets by defendant entity (via `entity_lei`) and jurisdiction, replacing the random asset generation. (3) Implement the real LEI: per-case success probability (from the database's outcome history or a jurisdiction/case-type prior) × liability severity × exposed asset value — the guide's decomposition. (4) Tie `litigationExposure` to `strandingRisk`, permit status, and jurisdiction (currently uncorrelated — a "Revoked" permit doesn't raise exposure). (5) Base creditor-asset linkage on real financing relationships rather than `assetIdx = floor(sr()×120)`.

**Prerequisites.** Sabin Center data ingestion and entity matching; a case-outcome prior for probability estimation. This is a substantial build — the litigation dimension is entirely absent today. **Acceptance:** the LEI decomposes into case probability × severity × exposure per matched case; every asset links to real cases by defendant/jurisdiction; litigation exposure responds to permit status.

### 9.2 Evolution B — Climate-litigation monitoring copilot (LLM tier 2)

**What.** A copilot for the fossil-exposure risk analyst: "which litigation cases threaten my portfolio's assets?", "what's the precedent from Milieudefensie v Shell for this defendant?", "alert me on material judgements affecting my holdings" — reading the ingested case database, matching to portfolio exposure, and summarising case developments with source citations.

**How.** Tier-2 pattern once the database exists: case-lookup and portfolio-matching become tools; the LLM reads case records and summarises status, precedent, and liability range, citing the Sabin Center record ID. New-judgement monitoring reads case-status changes and flags affected holdings. The no-fabrication validator checks every liability figure against the computed LEI; case summaries quote the database, not model memory of legal cases (which is exactly where hallucinated case law creeps in).

**Prerequisites (hard).** Evolution A — there is no case data today, only random haircuts, so a litigation copilot would fabricate cases and precedents, the highest-risk failure mode for legal-adjacent content. **Acceptance:** every case referenced exists in the ingested database with a retrievable ID; liability figures trace to the LEI decomposition; a portfolio with no matched cases returns "no active litigation exposure identified," not an invented case.