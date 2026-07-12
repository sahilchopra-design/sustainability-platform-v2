# Green Taxonomy Navigator
**Module ID:** `green-taxonomy-navigator` · **Route:** `/green-taxonomy-navigator` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Compares multi-jurisdictional green taxonomy frameworks including EU Taxonomy, UK Green Taxonomy, Monetary Authority of Singapore (MAS) Taxonomy, and China's Green Bond Catalogue, mapping activity-level alignment and identifying mutual recognition opportunities. Enables cross-border issuers and investors to assess dual-taxonomy compliance.

> **Business value:** Enables multi-jurisdictional green bond issuers to achieve dual-taxonomy labelling, assists investors in assessing cross-border green product consistency, and supports regulators in monitoring fragmentation between major green finance taxonomies.

**How an analyst works this module:**
- Select the target jurisdictions relevant to your issuance or investment universe.
- Browse the activity library and filter by sector to compare technical screening criteria across selected taxonomies.
- Use the gap analysis tab to identify activities that qualify in one taxonomy but not others, and the regulatory reason for divergence.
- Export the cross-taxonomy compliance matrix for investor communication or prospectus disclosure.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACTIVITIES`, `Badge`, `COLORS`, `PORTFOLIO`, `Stat`, `TABS`, `TAXONOMIES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `TAXONOMIES` | 9 | `id`, `name`, `region`, `status`, `year`, `envObj`, `activities`, `screening`, `transitional`, `dnsh`, `socialMin`, `interop`, `color` |
| `ACTIVITIES` | 26 | `name`, `sector`, `eu`, `cn`, `asean`, `za`, `co`, `uk`, `ca`, `in` |
| `PORTFOLIO` | 16 | `company`, `sector`, `value`, `activities` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `taxKeys` | `TAXONOMIES.map(t=>t.id);` |
| `exportCSV` | `(rows,name)=>{if(!rows.length)return;const keys=Object.keys(rows[0]).filter(k=>typeof rows[0][k]!=='object');const csv=[keys.join(','),...rows.map(r=>keys.map(k=>`"${Array.isArray(r[k])?r[k].join(';'):r[k]}"`).join(','))` |
| `sectors` | `[...new Set(ACTIVITIES.map(a=>a.sector))];` |
| `comparisonData` | `useMemo(()=>TAXONOMIES.filter(t=>selectedTaxonomies.includes(t.id)),[selectedTaxonomies]);  const interopMatrix=useMemo(()=>{const result=[];TAXONOMIES.forEach(t1=>{TAXONOMIES.forEach(t2=>{if(t1.id!==t2.id){const overlap=ACTIVITIES.filter(a=>a[t1.id]==='Eligible'&&a[t2.id]==='Eligible').length;result.push({from:t1.name,to:t2.name,fromId:t` |
| `pairOverlap` | `useMemo(()=>{const [a,b]=interopPair;return ACTIVITIES.map(act=>({activity:act.name,taxA:act[a]\|\|'N/A',taxB:act[b]\|\|'N/A',aligned:act[a]===act[b]&&act[a]==='Eligible'}));},[interopPair]);` |
| `portfolioScreened` | `useMemo(()=>{return PORTFOLIO.filter(p=>!portfolioSearch\|\|p.company.toLowerCase().includes(portfolioSearch.toLowerCase())).map(p=>{const results={};screenTaxonomies.forEach(tid=>{let eligible=0;let total=p.activities.len` |
| `radarData` | `useMemo(()=>{const dims=['Activities','Env Objectives','DNSH','Social Min','Interop','Maturity'];return dims.map(d=>{const obj={dim:d};comparisonData.forEach(t=>{obj[t.id]=d==='Activities'?Math.round(t.activities/1018*10` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ACTIVITIES`, `COLORS`, `PORTFOLIO`, `TABS`, `TAXONOMIES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| EU-UK Taxonomy Alignment (%) | — | ICMA Taxonomy Mapping (2023) | Activities eligible under both EU and UK taxonomies; 22% divergence relates to UK nuclear/gas transition provisions and threshold calibration differences. |
| EU-China Taxonomy Overlap (%) | — | IPSF Taxonomy Working Group | Lower overlap reflects China's inclusion of clean coal and different threshold stringency for transport and buildings sectors. |
| MAS-EU Common Ground (%) | — | MAS-EU Taxonomy comparison 2023 | Singapore-Asia Taxonomy aligns with EU in climate mitigation but diverges in treatment of natural gas as transition activity. |
| Dual-Taxonomy Eligible Activities | — | ICMA cross-taxonomy mapping | Number of EU Taxonomy activities that also qualify under at least one other major green taxonomy. |
- **EU Taxonomy Delegated Acts activity database** → Extract NACE codes, TSC thresholds, and DNSH criteria → **EU Taxonomy activity baseline**
- **UK/MAS/China taxonomy activity lists** → Map to NACE codes, compare TSC stringency by activity → **Cross-taxonomy alignment matrix**
- **Portfolio activity classification** → Apply multi-taxonomy eligibility criteria, flag divergences → **Dual-taxonomy compliance scorecard**

## 5 · Intermediate Transformation Logic
**Methodology:** Cross-Taxonomy Alignment Index
**Headline formula:** `CTAI_ij = |Activities_i ∩ Activities_j| / |Activities_i ∪ Activities_j|`

Computes Jaccard similarity between activity-level eligible activity sets of two taxonomies, identifying where the same economic activity qualifies under multiple taxonomies vs where divergence exists. Divergence at the technical screening criteria level is further decomposed by threshold stringency differences.

**Standards:** ['EU Taxonomy Regulation (2020/852)', 'UK Green Taxonomy (HM Treasury 2023)', 'MAS Singapore-Asia Taxonomy (2023)', 'China Green Bond Catalogue (2021)']
**Reference documents:** EU Taxonomy Regulation (EU) 2020/852 and Delegated Acts; UK Green Taxonomy â€” Interim Report (HM Treasury 2023); MAS Singapore-Asia Taxonomy v2 (2023); IPSF â€” Common Ground Taxonomy Report (2022)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ℹ️ **Guide↔code note.** The guide's headline is a Jaccard index
> `CTAI = |Aᵢ∩Aⱼ| / |Aᵢ∪Aⱼ|`. The code computes overlap as `intersection / total_activities`
> (a fixed denominator of 25 mapped activities), **not** intersection/union — so it is a *co-eligibility
> rate over the shared activity library*, not a true Jaccard similarity. The published per-pair
> alignment figures in the guide (EU-UK 78%, EU-China 52%) are ICMA/IPSF sourced and are **not**
> reproduced by the code's overlap counter; they differ.

### 7.1 What the module computes

Four tabs over a curated activity × taxonomy eligibility matrix (25 activities × 8 taxonomies).

**Interoperability overlap** (`interopMatrix`) — for every ordered taxonomy pair:
```js
overlap = ACTIVITIES.filter(a => a[t1]==='Eligible' && a[t2]==='Eligible').length
pct     = round(overlap / ACTIVITIES.length × 100)     // denominator = 25, fixed
```

**Portfolio screening** (`portfolioScreened`) — per company, share of its activities that are
Eligible *or* Transition under each selected taxonomy:
```js
eligible = count(activities where a[tid] ∈ {Eligible, Transition})
results[tid] = round(eligible / p.activities.length × 100)
```

**Radar profile** (`radarData`) — normalises each taxonomy to 6 dimensions:
```js
Activities   = round(t.activities/1018 × 100)   // EU=1018 is the max anchor
Env Objectives = round(t.envObj/6 × 100)        // 6 EU objectives = full marks
DNSH / Social Min = t.dnsh ? 90 : 30            // binary → 90/30
Interop      = t.interop                         // stored field
Maturity     = (2026 − t.year) × 15             // older = more mature
```

### 7.2 Taxonomy parameterisation (`TAXONOMIES`, 8 rows)

Provenance: real taxonomy attributes (year in force, objective count, screening status).

| Taxonomy | Year | Env obj | Activities | Screening | DNSH | Interop |
|---|---|---|---|---|---|---|
| EU Taxonomy | 2020 | 6 | 1018 | Mandatory | ✓ | 85 |
| China Green Bond Catalogue | 2021 | 3 | 211 | Mandatory | ✗ | 60 |
| ASEAN Taxonomy | 2023 | 4 | 270 | Voluntary | ✗ | 68 |
| UK Green Taxonomy | 2023 | 4 | 196 | Voluntary | ✓ | 80 |
| Colombia | 2022 | 5 | 132 | Voluntary | ✓ | 55 |
| Canada SFAF | 2024 | 4 | 82 | Voluntary | ✗ | 72 |
| India | 2024 | 3 | 150 | Proposed | ✗ | 55 |
| South Africa | 2024 | 3 | 65 | Proposed | ✗ | 48 |

The `interop` field (48–85) is a hard-coded prior, not derived from the activity matrix. Each of the
25 `ACTIVITIES` carries an eligibility label per taxonomy ∈ {Eligible, Transition, Amber, Review,
Proposed, Not Eligible, Excluded, N/A} — e.g. Nuclear is `Transition` in EU, `Eligible` in UK/Canada/
India, `N/A` in China/ASEAN, capturing real divergence.

### 7.3 Calculation walkthrough

The comparison tab filters `TAXONOMIES` by user selection and renders the radar. The interoperability
tab computes all 56 ordered-pair overlaps once (`useMemo`). The activity classifier filters the matrix
by search/sector. Portfolio screening maps 15 companies (each with 2–3 named activities) to per-
taxonomy eligibility percentages, treating both `Eligible` and `Transition` as passing.

### 7.4 Worked example (EU ↔ UK overlap)

Count activities Eligible in *both* EU and UK across the 25-row matrix: Solar PV, Onshore Wind,
Offshore Wind, Green H₂, Hydropower, Geothermal, EV Manufacturing, Rail, Green Buildings, Building
Renovation, Sustainable Forestry, Waste Management, Water Treatment, CCS, Battery Storage, Smart Grid,
Marine Energy ≈ 17 dual-Eligible (Nuclear is EU-Transition/UK-Eligible → excluded; Cement/Steel are
EU-Transition → excluded).

```
pct = round(17 / 25 × 100) = 68%
```

Note this ~68% is the code's co-eligibility rate; the guide cites ICMA's 78% EU-UK figure — the two
are computed on different bases (the guide counts Transition activities and uses IPSF's larger library).

### 7.5 Data provenance & limitations

- The activity eligibility matrix is **curated/illustrative** (25 activities), not the full ~1,000-
  activity EU Taxonomy. Overlap percentages therefore reflect this sample, not the actual taxonomies.
- Overlap uses a **fixed denominator** (`/25`), so it is not a Jaccard union — a pair where both
  taxonomies cover few activities is penalised the same as one where both cover many.
- The radar's Maturity `(2026−year)×15` and binary DNSH 90/30 are display heuristics, not measured.
- `TAXONOMY_THRESHOLDS` is imported from `referenceData` but the interactive tabs use the inline
  `ACTIVITIES` matrix.

### 7.6 Framework alignment

**EU Taxonomy (Reg (EU) 2020/852)** — 6 environmental objectives, technical screening criteria (TSC),
DNSH and Minimum Safeguards; the page's `envObj/6` and DNSH flags encode this structure. **UK Green
Taxonomy** — 4 objectives, voluntary. **MAS/ASEAN Taxonomy** — traffic-light (green/amber/red) for
transition; captured by the `Amber` label. **China Green Bond Catalogue (2021)** — removed clean coal
in the 2021 edition; the matrix marks Coal `Excluded` for China. **IPSF Common Ground Taxonomy** — the
EU-China mapping the guide's 52% figure comes from, assessing activity-level TSC comparability. The
guide's published pairwise alignments derive from ICMA/IPSF expert mapping of TSC stringency, which the
page approximates with a binary co-eligibility count.

*(No §8 model spec: this is a reference/comparison tool over curated categorical data, not a financial/
risk quantity requiring a production model. The one quantitative output — overlap % — is a transparent
set-intersection count, appropriately caveated above as a sample-based approximation of the true
IPSF-style TSC comparison.)*

## 9 · Future Evolution

### 9.1 Evolution A — True Jaccard over the full activity universe (analytics ladder: rung 1 → 2)

**What.** §7 documents that the Cross-Taxonomy Alignment Index (`CTAI_ij = |Activities_i ∩ Activities_j|/|Activities_i ∪ Activities_j|`) is computed over a curated 25-activity × 8-taxonomy matrix — a real overlap calculation, but with two flagged limitations: the matrix is an illustrative sample (not the ~1,000-activity EU Taxonomy, so overlap percentages reflect the sample not the actual taxonomies), and the overlap uses a fixed `/25` denominator rather than a true Jaccard union (a pair where both cover few activities is understated). Evolution A fixes the maths and scales the data: implement the true Jaccard union denominator per pair, and expand the activity matrix toward the full taxonomy activity universe (or a materially larger, sourced subset), so the alignment index reflects real cross-taxonomy overlap.

**How.** (1) Replace the fixed `/25` denominator with `|A_i ∪ A_j|` per pair, reproducing the §5 Jaccard formula. (2) Expand the eligibility matrix from 25 illustrative activities toward the full EU Taxonomy activity set (and the other 7 taxonomies), sourced from the taxonomy legal texts and version-controlled. (3) Decompose divergence by TSC threshold stringency where activities overlap but criteria differ, per §5.

**Prerequisites.** The full/expanded activity-eligibility matrix digitised into refdata (major effort — start with high-materiality sectors); the Jaccard denominator corrected. **Acceptance:** overlap uses the true union denominator (a sparse pair is no longer understated); the matrix covers materially more than 25 activities with provenance; TSC-stringency divergence is decomposed.

### 9.2 Evolution B — Cross-taxonomy navigation copilot (LLM tier 1 → 2)

**What.** A copilot for multi-jurisdiction issuers: "does this activity qualify under both EU Taxonomy and the ASEAN Taxonomy, and where do the TSC thresholds diverge?" narrates the eligibility matrix and interoperability overlaps from the atlas corpus, with tier-2 computing the CTAI and threshold divergence via the Evolution A endpoint.

**How.** Tier 1 grounds on §5/§7 (the Jaccard alignment index, the taxonomy eligibility matrix, TSC-stringency decomposition). The copilot's value is activity-level cross-taxonomy navigation — where an activity clears multiple regimes and where thresholds differ. Guardrail, pre-Evolution-A: overlaps reflect a 25-activity sample with a non-Jaccard denominator, so it must flag that the percentages are illustrative. Tier 2 tool-calls the CTAI endpoint. Cross-links to the `global-taxonomy-interop-v2` sibling from the atlas graph.

**Prerequisites.** Corpus embedding; Evolution A for corrected/expanded computation. **Acceptance:** every overlap or divergence claim cites the matrix and (post-Evolution-A) the true-Jaccard endpoint; pre-Evolution-A the copilot labels overlap percentages as sample-based illustrative figures.