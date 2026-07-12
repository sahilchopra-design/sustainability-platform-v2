## 7 · Methodology Deep Dive

> ℹ️ **Guide↔code note.** The guide defines a Disclosure Completeness Score
> `DCS = Σ(Completeₖ×wₖ)/Σwₖ × 100`. The page's actual coverage metric is *unweighted*: available
> disclosures ÷ required disclosures, per holding, with availability itself a `sr()` PRNG draw. The GRI
> standard structure (universal + 26 topic standards with correct disclosure counts) is real and
> accurate; the per-company availability is synthetic. There is no materiality-tier weighting (`wₖ`) in
> the computation.

### 7.1 What the module computes

The GRI standards taxonomy is hard-coded correctly (GRI 1/2/3 universal + 26 topic standards). For each
portfolio holding, applicability and data availability are seeded:

```js
sr(seed, off) = frac(sin(seed+off+1)×10⁴)
applicableStds = ALL_TOPIC_STDS.filter((_,i) => sr(s, i+10) > 0.25)     // ~75% applicable
availDisc = Σ round( std.disclosures × (0.2 + sr(s, hashStr(std.id))×0.75) )  // 20–95% available
totalDisc = Σ std.disclosures  (over applicable standards)
coverage  = totalDisc>0 ? (availDisc/totalDisc)×100 : 0                  // the DCS proxy
topGaps   = 3 standards with largest (disclosures − available)
```

`hashStr` (`Math.imul(31, a) + charCode`) gives each GRI standard a stable per-standard seed offset so
availability is deterministic per (company, standard).

### 7.2 Parameterisation — GRI standards (real structure)

| Universal | Disclosures | Topic (examples) | Cat | Disclosures |
|---|---|---|---|---|
| GRI 1 Foundation | 0 | GRI 305 Emissions | Env | 7 |
| GRI 2 General | 30 | GRI 403 OH&S | Social | 10 |
| GRI 3 Material Topics | 6 | GRI 302 Energy | Env | 5 |

The 26 topic standards carry **accurate disclosure counts** (GRI 305 Emissions = 7, GRI 403 OH&S = 10,
GRI 207 Tax = 4…), spanning Economic (201–207), Environmental (301–308), Social (401–418).
`TOTAL_DISCLOSURES` sums to the correct GRI universal + topic disclosure total.

**Cross-framework maps** (real, curated): `GRI_ISSB_MAP` (GRI 305→SASB E01 GHG "Direct", GRI 304→E06
"Partial"…), `GRI_BRSR_MAP` (Indian BRSR principles), plus ESRS/TCFD/SFDR interoperability flags —
these drive the dual-reporting efficiency view.

### 7.3 Calculation walkthrough

Portfolio holdings (from `GLOBAL_COMPANY_MASTER` / localStorage `ra_portfolio_v1`) each get an
applicable-standard set (~75% of the 26), per-standard availability, and a coverage %. KPIs aggregate:
`avgStds` (mean applicable count), `avgDataAvail` (mean coverage), `fullAlign` (% of holdings at full
alignment), category-level averages (env/soc/eco). The interoperability tab counts how many of the 26
standards map to each of {GRI, ISSB/SASB, CSRD/ESRS, TCFD, SFDR}.

### 7.4 Worked example (one holding)

Suppose 4 applicable environmental standards: GRI 302 (5 disc), 303 (5), 305 (7), 306 (5) — total 22.
With seeded availability fractions 0.8, 0.6, 0.9, 0.5:

| Std | Disc | Avail = round(disc × frac) | Gap |
|---|---|---|---|
| GRI 302 | 5 | round(5×0.8)=4 | 1 |
| GRI 303 | 5 | round(5×0.6)=3 | 2 |
| GRI 305 | 7 | round(7×0.9)=6 | 1 |
| GRI 306 | 5 | round(5×0.5)=3 | 2 (topGap) |

```
availDisc = 4+3+6+3 = 16 ;  totalDisc = 22
coverage  = 16/22 × 100 = 72.7%
topGaps   = [GRI 303, GRI 306, GRI 302]  (largest gaps first)
```

A 72.7% coverage sits below the guide's 85% "with reference" threshold — the holding would be flagged
as not yet "in accordance", with GRI 303/306 as priority gaps.

### 7.5 Data provenance & limitations

- **Per-company availability is synthetic** — `sr()`/`hashStr` seed which standards apply and how much
  data exists. The GRI *taxonomy* (standards, disclosure counts, cross-framework maps) is real and
  correct.
- Coverage is **unweighted** (available/required), not the materiality-tier-weighted DCS the guide
  describes — a 1-disclosure standard counts equally per disclosure with a 10-disclosure one.
- No actual document parsing: "availability" does not check whether a disclosure's mandatory content
  elements (governance/management approach/metrics/targets) are present.

### 7.6 Framework alignment

**GRI Universal Standards 2021 (GRI 1/2/3)** — Foundation, General Disclosures (30), Material Topics
(6); encoded exactly. **GRI Topic Standards (300/400 series)** — 26 standards with correct disclosure
counts. **GRI "in accordance" vs "with reference"** — requires reporting all disclosures for material
topic standards; the page's coverage % proxies progress toward this. **ISSB S1/S2 & SASB** — the
`GRI_ISSB_MAP` reflects the real GRI-ISSB interoperability MOU, marking which GRI disclosures satisfy a
SASB metric (Direct/Partial). **CSRD/ESRS & TCFD** — interoperability flags support dual-use reporting.
GRI itself derives "in accordance" status by checking each material-topic disclosure's mandatory
content elements — the deeper check the §7.5 note flags as not yet implemented.

*(No §8 model spec required: this is a disclosure-completeness checker over a fixed, correctly-encoded
standards taxonomy. Its one quantitative output — coverage % — is a transparent ratio; its limitation
(unweighted, seeded availability) is documented above rather than requiring a bespoke production model.)*
