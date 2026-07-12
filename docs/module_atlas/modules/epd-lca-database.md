# EPD & LCA Database
**Module ID:** `epd-lca-database` · **Route:** `/epd-lca-database` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Manages and queries a curated database of Environmental Product Declarations and lifecycle assessment records for construction materials, manufactured goods, and industrial products. Supports EPD search, comparison, version control, and gap analysis against ISO 14025 and EN 15804+A2 requirements. Enables systematic material substitution analysis, EPD data quality auditing, and green procurement workflows.

> **Business value:** Streamlines the EPD procurement and verification workflow for project teams, dramatically reducing the time to build LEED v4 MRc credit submissions and RICS whole-life carbon calculations while maintaining a living database of product-level embodied carbon benchmarks.

**How an analyst works this module:**
- Search EPD database by material category, manufacturer, PCR, or declared GWP range.
- Compare up to five products on GWP100, acidification, eutrophication, and resource depletion indicators side-by-side.
- Upload project bill of materials to auto-match materials to EPD records and flag missing or expired EPDs.
- Export EPD citations and GWP values in RICS, LEED v4, or BREEAM credits format for certification submission.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_CATEGORIES`, `ALTERNATIVES`, `Badge`, `Btn`, `CAT_COLORS`, `Card`, `EPD_DATABASE`, `EPD_LCA_SOURCES`, `KPI`, `LS_API_KEYS`, `LS_CUSTOM_EPD`, `LS_PORT`, `RADAR_METRICS`, `Section`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `EPD_LCA_SOURCES` | 7 | `id`, `name`, `type`, `url`, `api`, `auth`, `coverage`, `categories`, `data_fields`, `status`, `epd_count`, `description` |
| `ALTERNATIVES` | 16 | `conventional`, `green`, `label`, `reduction` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ALL_CATEGORIES` | `[...new Set(EPD_DATABASE.map(e=>e.category))];` |
| `fmtUSD` | `n=>{if(n==null)return'\u2014';if(n>=1e6)return`$${(n/1e6).toFixed(1)}M`;if(n>=1000)return`$${(n/1000).toFixed(1)}K`;return`$${Number(n).toFixed(2)}`};` |
| `url` | ``https://api.environdec.com/api/v1/EPD?search=${encodeURIComponent(query)}&pageSize=20`;` |
| `allEPDs` | `useMemo(()=>[...EPD_DATABASE,...customEPDs.map((c,i)=>({...c,id:`CUSTOM_${i}`,source:'custom',verified:false}))]  ,[customEPDs]);` |
| `gwps` | `allEPDs.filter(e=>e.gwp_kg_co2e!=null).map(e=>e.gwp_kg_co2e);` |
| `avgGWP` | `gwps.length?gwps.reduce((s,x)=>s+x,0)/gwps.length:0;` |
| `cats` | `{};allEPDs.forEach(e=>{cats[e.category]=(cats[e.category]\|\|0)+1});` |
| `lowest` | `allEPDs.filter(e=>e.gwp_kg_co2e!=null).sort((a,b)=>a.gwp_kg_co2e-b.gwp_kg_co2e)[0];` |
| `highest` | `allEPDs.filter(e=>e.gwp_kg_co2e!=null).sort((a,b)=>b.gwp_kg_co2e-a.gwp_kg_co2e)[0];` |
| `catAvgGWP` | `useMemo(()=>ALL_CATEGORIES.map(cat=>{` |
| `avg` | `items.length?items.reduce((s,e)=>s+e.gwp_kg_co2e,0)/items.length:0;` |
| `constructionMats` | `useMemo(()=>allEPDs.filter(e=>e.category==='Construction'&&e.gwp_kg_co2e!=null).sort((a,b)=>b.gwp_kg_co2e-a.gwp_kg_co2e).map(e=>({name:e.product.slice(0,22),gwp:e.gwp_kg_co2e})),[allEPDs]);` |
| `foodData` | `useMemo(()=>allEPDs.filter(e=>e.category==='Food'&&e.gwp_kg_co2e!=null).sort((a,b)=>b.gwp_kg_co2e-a.gwp_kg_co2e).map(e=>({name:e.product.slice(0,18),gwp:e.gwp_kg_co2e,water:e.water_l\|\|0,land:e.land_m2\|\|0})),[allEPDs]);` |
| `textileData` | `useMemo(()=>allEPDs.filter(e=>e.category==='Textiles').map(e=>({name:e.product.slice(0,20),gwp:e.gwp_kg_co2e,water:e.water_l\|\|0})),[allEPDs]);` |
| `electronicsData` | `useMemo(()=>allEPDs.filter(e=>e.category==='Electronics'&&e.gwp_kg_co2e!=null).sort((a,b)=>b.gwp_kg_co2e-a.gwp_kg_co2e).map(e=>({name:e.product.slice(0,18),gwp:e.gwp_kg_co2e,water:e.water_l\|\|0})),[allEPDs]);` |
| `transportData` | `useMemo(()=>allEPDs.filter(e=>e.category==='Transport'&&e.gwp_kg_co2e!=null).sort((a,b)=>b.gwp_kg_co2e-a.gwp_kg_co2e).map(e=>({name:e.product.slice(0,18),gwp:e.gwp_kg_co2e})),[allEPDs]);` |
| `energyData` | `useMemo(()=>allEPDs.filter(e=>e.category==='Energy'&&e.gwp_kg_co2e!=null).sort((a,b)=>b.gwp_kg_co2e-a.gwp_kg_co2e).map(e=>({name:e.product.slice(0,22),gwp:e.gwp_kg_co2e})),[allEPDs]);` |
| `industrialData` | `useMemo(()=>allEPDs.filter(e=>e.category==='Industrial'&&e.gwp_kg_co2e!=null).sort((a,b)=>b.gwp_kg_co2e-a.gwp_kg_co2e).map(e=>({name:e.product.slice(0,18),gwp:e.gwp_kg_co2e})),[allEPDs]);` |
| `chemicalData` | `useMemo(()=>allEPDs.filter(e=>e.category==='Chemicals'&&e.gwp_kg_co2e!=null).sort((a,b)=>b.gwp_kg_co2e-a.gwp_kg_co2e).map(e=>({name:e.product.slice(0,20),gwp:e.gwp_kg_co2e})),[allEPDs]);` |
| `maxGWP` | `Math.max(Math.abs(a.gwp_kg_co2e\|\|1),Math.abs(b.gwp_kg_co2e\|\|1));` |
| `normalized` | `metrics.map(m=>{` |
| `maxV` | `Math.max(Math.abs(m.a),Math.abs(m.b))\|\|1;` |
| `target` | `matching.sort((a,b)=>(b.gwp_kg_co2e\|\|0)-(a.gwp_kg_co2e\|\|0))[0];` |
| `genKWh` | `paybackEPD.lifetime_generation_kwh\|\|((paybackEPD.annual_energy_kwh\|\|0)*(paybackEPD.lifetime_years\|\|20));` |
| `avoidedPerYear` | `genKWh/(paybackEPD.lifetime_years\|\|20)*gridMix/1000;` |
| `yearsPayback` | `paybackEPD.gwp_kg_co2e/avoidedPerYear;` |
| `rows` | `filtered.map(e=>[e.id,e.product,e.category,e.source\|\|'',e.declared_unit,e.gwp_kg_co2e\|\|'',e.water_l\|\|'',e.manufacturer\|\|'',e.country\|\|'',e.verified?'Yes':'No']);` |
| `csv` | `[hdr,...rows].map(r=>r.join(',')).join('\n');` |
| `reduction` | `Math.round((1-alt.gwp_kg_co2e/Math.max(1,sug.target.gwp_kg_co2e))*100);` |
| `circScore` | `e.recyclable?(e.recycling_rate\|\|0)*100*(e.infinite_recyclability?1.5:1):5;` |
| `pct` | `Math.round(count/allEPDs.length*100);` |
| `payback` | `e.carbon_payback_years\|\|(gen>0?Math.round(e.gwp_kg_co2e/(gen/(e.lifetime_years\|\|20)*400/1000)*10)/10:null);` |
| `netSavings` | `gen>0?Math.round(gen*(e.lifetime_years\|\|20)/((e.lifetime_years\|\|20))*400/1000-e.gwp_kg_co2e):null;` |
| `best` | `items.sort((a,b)=>a.gwp_kg_co2e-b.gwp_kg_co2e)[0];` |
| `worst` | `items.sort((a,b)=>b.gwp_kg_co2e-a.gwp_kg_co2e)[0];` |
| `years` | `e.lifetime_years\|\|(e.lifetime_km?Math.round(e.lifetime_km/15000):null);` |
| `perYear` | `years?Math.round(e.gwp_kg_co2e/years*10)/10:null;` |
| `extendedPerYear` | `years?Math.round(e.gwp_kg_co2e/(years*1.5)*10)/10:null;` |
| `savings` | `perYear&&extendedPerYear?Math.round((1-extendedPerYear/perYear)*100):null;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALL_CATEGORIES`, `ALTERNATIVES`, `CAT_COLORS`, `EPD_DATABASE`, `EPD_LCA_SOURCES`, `RADAR_METRICS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| GWP100 A1â€“A3 (kgCO2e/declared unit) | — | EPD Programme Operators | Product stage embodied carbon; primary metric for material comparison; must be verified EPD (not self-declared). |
| EPD Validity Status | — | ISO 14025 Â§8.1.4 | EPDs expire after 5 years; validity flag alerts users to expired records requiring renewal before use in compliance filings. |
| PCR Version | — | EPD Programme Operator | Product Category Rule version underpinning the EPD; different PCR versions may use different system boundaries, affecting comparability. |
| Third-Party Verifier | — | IBU / BRE / EPD International | Independent verifier name; critical for LEED v4, BREEAM, and green bond compliance requiring Type III EPDs. |
- **EPD programme operator databases (ECO Platform, EPD International, IBU, BRANZ)** → Parse XML/PDF EPD documents; extract GWP100 by lifecycle module and validate verifier signature → **Structured EPD record with GWP, validity, PCR version**
- **Project bill of materials** → Fuzzy-match material descriptions to EPD product names and declared units → **Matched EPD coverage rate and unmatched material list**
- **LEED/BREEAM credit requirements** → Filter EPD records by programme compliance criteria (Type III, third-party verified, within validity) → **Compliant EPD count and certification gap analysis**

## 5 · Intermediate Transformation Logic
**Methodology:** EPD Carbon Factor Comparator
**Headline formula:** `CF_delta = (CF_incumbent − CF_alternative) / CF_incumbent × 100%`

Computes percentage carbon factor reduction between incumbent and alternative materials on a per-functional-unit basis, normalising for declared unit differences. GWP100 values are extracted from A1â€“A3 modules for product comparisons. Where EPD scope includes A4â€“A5, the full cradle-to-practical-completion carbon factor is used for embodied carbon calculations.

**Standards:** ['ISO 14025:2006', 'EN 15804+A2:2022', 'ISO 14044:2006']
**Reference documents:** ISO 14025:2006 â€” Environmental Labels and Declarations Type III; EN 15804+A2:2022 â€” Core PCR for Construction Products; ISO 14044:2006 â€” Life Cycle Assessment Requirements; ECO Platform EPD Programme Database 2024; LEED v4.1 MRc Building Product Disclosure Credit

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This module is unusually well-grounded: it ships a **curated 120-record EPD database** with GWP and
co-indicator values taken from LCA literature, plus **live API integration** to the real EPD
International and EC3 registries. The guide's "EPD Carbon Factor Comparator" formula
(`CF_delta = (CF_incumbent − CF_alternative)/CF_incumbent × 100%`) is implemented essentially
verbatim. There is **no PRNG anywhere** in this module — no ⚠️ mismatch flag needed.

### 7.1 What the module computes

Four production calculations run on the EPD records:

```js
// Material-substitution reduction (Alternatives tab)
reduction   = round((1 − alt.gwp / max(1, sug.target.gwp)) × 100)      // % embodied-carbon saving

// Carbon payback (Energy products)
genKWh        = lifetime_generation_kwh || annual_energy_kwh × lifetime_years
avoidedPerYear= genKWh / lifetime_years × gridMix / 1000               // tCO₂e/yr avoided
yearsPayback  = gwp_kg_co2e / avoidedPerYear                           // years

// Circularity score (Industrial/packaging)
circScore = recyclable ? recycling_rate×100×(infinite_recyclability?1.5:1) : 5

// Category averages
avgGWP = mean(gwp of records with gwp≠null)   // per category and overall
```

`gridMix` is a user slider (default **400 gCO₂/kWh** — a global-average grid intensity proxy);
dividing by 1000 converts kg→tonnes. The Alternatives tab reads a hand-built `ALTERNATIVES` map of
15 incumbent→green pairs, each with a literature `reduction` %.

### 7.2 Parameterisation / data provenance

| Constant / field | Value | Provenance |
|---|---|---|
| Portland Cement (CEM I) GWP | 850 kgCO₂e/tonne | EN 15804 literature (≈0.85 tCO₂/t) |
| Structural steel (BOF) | 1,850 kgCO₂e/tonne | ÖKOBAUDAT hot-rolled reference |
| Green steel (H₂-DRI) | 400 kgCO₂e/tonne | H2 Green Steel EPD, "78% reduction" note |
| CLT timber | −700 kgCO₂e/m³ | biogenic carbon storage (negative GWP) |
| Beef (feedlot) | 27.0 kgCO₂e/kg; 15,400 L water | Poore & Nemecek 2018-class figures |
| Oat milk | 0.9 kgCO₂e/L; "3.5× lower than dairy" | LCA literature |
| Onshore wind 3 MW | 450 kgCO₂e/kW; payback 0.6 yr | Vestas EPD-class |
| PET packaging recycling rate | 0.30 | industrial-average recycling rate |
| `gridMix` default | 400 gCO₂/kWh | synthetic slider default (global-avg proxy) |
| `ALTERNATIVES` reduction % | 15–130% | per-pair literature deltas (curated) |

Data sources are real and enumerated in `EPD_LCA_SOURCES` (7 registries): EPD International, EC3
(Building Transparency, 100k+ EPDs), ÖKOBAUDAT (German Federal), openLCA Nexus, USDA LCA Commons,
INIES (French). Two have live API calls wired (`searchEPDInternational`, `searchEC3`) with a
localStorage cache (168 h TTL) and graceful fallback to `searchLocalEPD`.

### 7.3 Calculation walkthrough

1. `allEPDs = EPD_DATABASE ++ customEPDs` (user-added records get `id:CUSTOM_n`, `verified:false`).
2. Filter by category / free-text; sort by any indicator column (default GWP ascending).
3. **Category analytics**: `catAvgGWP` groups by category and averages GWP; `lowest`/`highest`
   sort the whole set to surface best/worst GWP records.
4. **Comparison radar**: `RADAR_METRICS = [gwp, water, ap_kg_so2e, pe_renewable, pe_nonrenewable]`
   normalised per-metric by `max(|a|,|b|)` so two products plot on a common 0–1 radar.
5. **Payback**: pick a product → compute `yearsPayback` from embodied GWP vs annual avoided emissions.
6. **Alternatives**: each pair looks up incumbent/green records and recomputes `reduction` live from
   the stored GWP (so the displayed % is derived, not just the static `reduction` field).

### 7.4 Worked example — Monocrystalline solar payback (EPD010)

`EPD010` carries `gwp=1200 kgCO₂e/kWp`, `lifetime_generation_kwh=45000`, `lifetime_years=30`.
With `gridMix=400 gCO₂/kWh`:

| Step | Computation | Result |
|---|---|---|
| genKWh | 45,000 (uses stored lifetime generation) | 45,000 kWh |
| avoidedPerYear | 45,000/30 × 400/1000 | 600 tCO₂e/yr… |
| (unit note) | 1,500 kWh/yr × 400 g = 600,000 g = **0.6 tCO₂e/yr** | 0.6 t/yr |
| yearsPayback | 1.2 kg-embodied-as-t? → 1200 kg / 600 kg-avoided/yr | **2.0 yr** |

Because `avoidedPerYear` is in tonnes but `gwp_kg_co2e` is in kg, the ratio `1200 / 600` (both read
as kg) yields **2.0 years** — close to the stored `carbon_payback_years:1.8` reference. The
Alternatives example — Structural Steel→Green Steel — recomputes `round((1 − 400/1850)×100) = 78%`,
matching the curated label exactly.

### 7.5 Circularity & substitution rubric

| Rule | Formula | Reading |
|---|---|---|
| Circularity score | `recyclable ? recycling_rate×100×(infinite?1.5:1) : 5` | glass (0.80, infinite) → 120; PET (0.30) → 30; non-recyclable → 5 |
| Substitution saving | `(1 − alt/incumbent)×100` | >100% possible where green product is carbon-negative (wood-fibre insulation → 130%) |

### 7.6 Data provenance & limitations

- **No synthetic PRNG** — every GWP is a literature/EPD value; this is the strongest data provenance
  in the atlas. However the records are *generic* ("Generic" manufacturer, single representative
  value) rather than product-specific verified EPDs, so they are indicative, not compliance-grade.
- Cross-product comparison ignores **declared-unit mismatch**: comparing a "1 tonne" cement record to
  a "1 m³" concrete record is dimensionally invalid; the UI leaves unit-normalisation to the user
  (the guide flags this as required but the code does not enforce it).
- Payback conflates kg and tonnes by construction (see §7.4); it lands near the reference only because
  `gridMix/1000` cancels the kg→t on one side — a production tool would carry explicit units.
- Live API responses are cached but not schema-validated against the local record shape, so a live
  hit may lack `ap_kg_so2e`/`water_l` fields used by the radar.

**Framework alignment:** **ISO 14025** (Type III EPD — third-party-verified declarations; the
`verified` flag proxies this) · **EN 15804+A2** (core PCR for construction; the `pcr` field and
A1–A3 product-stage scope) · **ISO 14040/44** (LCA method underpinning every GWP) · **GWP100**
(IPCC 100-yr characterisation factor, the single indicator carried for all records). The module
approximates these by carrying the headline GWP100 and a subset of CEN environmental indicators;
it does not model the full A1–C4 lifecycle-module breakdown that EN 15804 requires for whole-life
carbon (RICS) or LEED v4 MRc credit submissions.

## 9 · Future Evolution

### 9.1 Evolution A — A real EPD store with programme-operator ingestion and validity control (analytics ladder: rung 1 → 2)

**What.** The page is an honest curated-database UI: a static in-page `EPD_DATABASE` across 8 categories with genuine derived analytics (category averages, best/worst, carbon-payback for energy products, lifetime-extension savings, a 16-pair alternatives table), custom EPDs in LocalStorage, and even a hard-coded Environdec API search URL that hints at the intended integration. What's missing is the module's stated substance: no backend store, no programme-operator ingestion, no validity/PCR tracking (the §4 rows on ISO 14025 5-year expiry and PCR comparability describe fields the data doesn't carry), and custom records vanish with the browser.

**How.** (1) `epd_records` table (product, category, declared unit, GWP100 by module A1–A3/A4–A5, verifier, PCR version, valid-until, source, programme operator) + `api/v1/routes/epd.py` with search/compare endpoints. (2) Ingestion: the ECO Platform / EPD International (Environdec) APIs the page already references — the URL in code becomes a real ingester with periodic refresh; the curated in-page rows seed the table with `source: curated`. (3) Validity engine: expiry flags per ISO 14025 §8.1.4 and PCR-version comparability warnings on any cross-product comparison (comparing EPDs under different PCRs is the classic misuse — make the warning structural). (4) Custom EPD uploads persist org-scoped with `verified: false` prominently carried through. (5) Rung 2: the substitution and payback analytics run server-side over the full ingested corpus, and `embodied-carbon`'s Evolution A consumes this table as its factor source — one EPD store, two consumers.

**Prerequisites.** Environdec API terms check; declared-unit normalization rules documented (kg vs m² vs m³ comparisons need conversion or refusal). **Acceptance:** a search hits ingested Environdec records with validity flags; an expired EPD is flagged in any comparison; comparing across PCR versions triggers the warning; custom EPDs survive browser wipe.

### 9.2 Evolution B — Certification-submission assistant for LEED/BREEAM/RICS packs (LLM tier 2)

**What.** The workflow's endpoint — "export EPD citations and GWP values in RICS, LEED v4, or BREEAM format" — is a compliance-drafting task with sharp rules: LEED v4 MRc requires Type III, third-party-verified, in-validity EPDs. A tool-calling assistant that takes a project's matched EPD set, applies those filter rules via Evolution A's endpoints, drafts the credit submission with correct citations (verifier, PCR, validity dates), and reports exactly which materials block the credit and why ("self-declared EPD — Type III required; expires 2026-03 — renew before submission").

**How.** Tools: `search_epds(filters)`, `check_compliance(epd_ids, scheme)`, `get_epd(id)`, `compare_epds(ids)` (with the PCR-comparability warning surfaced in tool output). Grounding corpus = this Atlas record's §4/§5 (the validity, PCR, and verifier rows are precisely the rules to apply) plus the LEED v4.1 MRc reference. The assistant's compliance verdicts are the rule engine's, narrated with citations; the drafted pack renders through report-studio. Fuzzy BoM-to-EPD matching proposals defer to `embodied-carbon`'s Evolution B assistant — this one owns scheme compliance.

**Prerequisites (hard).** Evolution A — a submission pack citing the in-page curated rows without verifier/validity fields would fail certification review, and LocalStorage custom EPDs can't anchor an audit trail. **Acceptance:** a golden project pack's compliant/blocked lists match the rule-engine query exactly; every citation includes verifier and validity date; a deliberately-expired fixture EPD is caught.