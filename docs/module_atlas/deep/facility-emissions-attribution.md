## 7 · Methodology Deep Dive

### 7.1 What the module computes

Like the Flood Loss Calibrator and Site Biodiversity Screener, this module's core data is a
**live proxy over a real, free, keyless third-party API** — Climate TRACE v6
(`api.climatetrace.org/v6/assets`, CC-BY 4.0), which uses satellite/remote-sensing and activity
data to estimate facility-level (asset-level) GHG emissions worldwide. The backend
(`climate_trace.py`) normalises Climate TRACE's asset records into a flat facility table; the
frontend then layers two genuinely useful, purely local calculators on top of that real data: an
**ownership-attribution calculator** (facility emissions × user-set ownership %) and a
**measured-vs-disclosed gap** comparison against a company's self-reported Scope 1 total.

### 7.2 Live Climate TRACE aggregation

```python
GET https://api.climatetrace.org/v6/assets?countries=POL&sectors=power&year=2024&limit=200
```

For each returned asset, `_co2e_of()` extracts the **100-year CO2e** figure specifically
(`Gas == 'co2e_100yr'` in the asset's `EmissionsSummary` array — falling back to the largest
reported gas quantity only if `co2e_100yr` is absent) — i.e. **GWP100 CO2-equivalent**, the
standard climate-reporting convention, not a raw multi-gas sum. `_owner_of()` resolves the
facility's owner from Climate TRACE's `Owners` array, de-duplicating repeated entries (Climate
TRACE lists the majority owner once per reported gas) and falling back to `ReportingEntity` if no
owner is listed. Facilities are sorted descending by `co2e_tyr` and the endpoint returns
`facility_count`, `total_co2e_tyr` (gross, 100%-ownership-basis sum), and the per-facility list.

### 7.3 Ownership attribution and the measured-vs-disclosed gap (client-side)

```js
attributed = Σ_facilities( co2e_tyr × (ownership_pct[facility] / 100) )   // default ownership = 100% for every facility
gap        = attributed − disclosed_total_tco2e
gap_pct    = gap / disclosed_total_tco2e × 100
```

Both formulas are simple, fully transparent arithmetic over user-editable inputs (per-facility
ownership %, one disclosed-total field) applied to the real Climate TRACE facility data — there
is no hidden modelling step. The owner-level rollup groups attributed emissions by the Climate
TRACE `owner` string.

### 7.4 Worked example — Poland, power sector, 2024, live-queried during this review

Calling the real `facilities(country='POL', sector='power', year=2024, limit=200)` endpoint
directly against the live Climate TRACE API returned **68 facilities, total 106,990,864 tCO2e**
(100-yr basis, 100% ownership), topped by:

| Facility | Owner | Type | tCO2e/yr (100% basis) |
|---|---|---|---|
| Bełchatów power station | PGE Górnictwo i Energetyka Konwencjonalna SA | coal | 25,434,000 |
| Kozienice power station | ENEA Wytwarzanie SP zoo | coal | 11,731,100 |
| Opole power station | PGE Górnictwo i Energetyka Konwencjonalna SA | coal | 8,870,600 |
| Turów power station | PGE Polska Grupa Energetyczna SA | coal | 8,432,900 |
| Połaniec power station | ENEA SA | coal, biomass | 5,489,400 |

(Bełchatów's 25.43 Mt figure is independently confirmed live and matches the page's own
`DEMO_SAMPLE` fallback value exactly, which was itself frozen from a real 2026-07 Climate TRACE
pull — a useful cross-check that the demo data is genuine, not fabricated.)

**Ownership attribution example:** if a user knows their reporting entity holds a 70% equity
stake in Bełchatów (rather than the default 100% seed), setting `ownership_pct = 70` for that
row recomputes its attributed emissions as `25,434,000 × 0.70 = 17,803,800 tCO2e/yr` — the table
and all downstream charts (top-facilities bar, owner rollup) update from this single input,
exactly as the formula in §7.3 specifies.

**Measured-vs-disclosed example**, using the page's own frozen 6-facility demo sample (all
Poland/power/2024/coal, total gross = 63,108,700 tCO2e = 63.11 Mt, hand-summed and confirmed
against the sample's own `total_co2e_tyr` field) at the page's default ownership (100% for all
six) and its default disclosed-total input of **30 Mt CO2e/yr**:

| Step | Computation | Result |
|---|---|---|
| Attributed (measured) | Σ of the 6 facilities at 100% ownership | 63.11 Mt |
| Disclosed | user input | 30.00 Mt |
| Gap | 63,108,700 − 30,000,000 | **+33,108,700 t (+33.11 Mt)** |
| Gap % | 33,108,700 / 30,000,000 × 100 | **+110.4%** |

This shows the tool's intended failure mode clearly: if a company's disclosed Scope 1 total is
materially below the sum of its facilities' independently-measured Climate TRACE emissions, the
gap is large and positive, flagged red on the page — a legitimate red flag for potential
under-reporting *or* a genuine boundary/ownership mismatch (e.g. the disclosed figure may reflect
a lower equity share than 100%, which is exactly why the ownership-% calculator exists as the
reconciliation mechanism).

### 7.5 Data provenance & limitations

- **Fully live, real facility-level data:** every KPI, chart, and table row (in Live mode) comes
  directly from Climate TRACE's asset-level emissions estimates, which are themselves derived
  from satellite/remote-sensing and activity data (not the platform's own modelling) — verified
  live during this review via a direct API call reproducing the exact facility list and totals.
- **`DEMO_SAMPLE` fallback** is an explicit, frozen real extract (Poland power, 2024, pulled
  2026-07), used only when the live proxy is unreachable, clearly badged "○ Demo," and its
  numbers were independently confirmed to match the live API's current Bełchatów figure exactly.
- **Ownership attribution and measured-vs-disclosed are entirely user-driven calculators**, not
  modelled outputs — their correctness depends entirely on the user correctly setting each
  facility's true ownership/equity share and entering an accurate disclosed total; the tool
  performs no independent verification of either input.
- **co2e_100yr, not co2e_20yr:** Climate TRACE reports emissions under multiple GWP time
  horizons; the backend explicitly selects the 100-year convention, consistent with standard
  corporate GHG reporting (GHG Protocol, CDP) — but a company disclosing on a different GWP
  convention could show an artefactual gap unrelated to actual reporting completeness.
- **Owner attribution from Climate TRACE's `Owners` field** may not always reflect current
  operational control or the reporting entity's actual legal equity share (e.g. joint ventures,
  recent M&A) — the page's own copy explicitly instructs users to "set ownership % to the
  company's equity/operational share to compare like-for-like" rather than trusting Climate
  TRACE's owner field alone as a percentage.

**Framework alignment:** Climate TRACE v6 (CC-BY 4.0, satellite/remote-sensing-derived facility
emissions) · GHG Protocol Scope 1 boundary and equity-share/operational-control consolidation
approaches (informing the ownership-attribution design, though not itself implemented as a full
GHG Protocol consolidation engine).

## 8 · Model Specification

**Status: implemented.** The Climate TRACE proxy and both client-side calculators (ownership
attribution, measured-vs-disclosed gap) are fully implemented and were independently verified
live against the real Climate TRACE API during this review.

**8.1 Purpose & scope.** Give an analyst an independent, satellite-derived cross-check of a
company's disclosed Scope 1 emissions using real facility-level third-party data, and let them
reconcile ownership/equity-share boundary differences via a simple, transparent attribution
calculator — without needing a Climate TRACE account or proprietary asset database.

**8.2 Conceptual approach.** No emissions modelling is performed by the platform — Climate TRACE
supplies the estimate. The platform's value-add is entirely in normalisation (consistent facility
schema, 100-yr CO2e selection, owner resolution) and in the two downstream calculators that let a
user apply their own ownership assumptions and compare against a disclosed baseline.

**8.3 Mathematical specification.**
```
co2e_tyr(asset)     = EmissionsQuantity where Gas == 'co2e_100yr' (fallback: max reported gas quantity)
attributed          = Σ_facilities co2e_tyr × (ownership_pct / 100)
gap                 = attributed − disclosed_total_tco2e
gap_pct             = gap / disclosed_total_tco2e × 100
owner_rollup[owner] = Σ_{facilities of owner} co2e_tyr × (ownership_pct / 100)
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| GWP convention | co2e_100yr | Climate TRACE v6 API field selection (GHG Protocol-consistent) |
| Default ownership seed | 100% per facility | Hand-set starting assumption, fully user-editable |
| Default disclosed total | 30 Mt (page default) | Illustrative placeholder, user-editable |

**8.4 Data requirements.** Country (ISO alpha-3), Climate TRACE sector key, and emissions year —
all user-selected filter inputs. Per-facility ownership % and one company-level disclosed total
are the only "model" inputs, both user-supplied.

**8.5 Validation & benchmarking.** No independent validation of Climate TRACE's own facility-
level estimates is performed by this module (that would require ground-truth facility metering
data, which is outside the platform's scope) — the module's own aggregation/attribution logic
was independently re-derived and confirmed against the live API in this review.

**8.6 Limitations & model risk.** (1) Climate TRACE estimates are themselves modelled (from
satellite/remote-sensing proxies), not directly metered, and carry their own uncertainty bands
not surfaced by this module. (2) Owner resolution from Climate TRACE's `Owners` field can be
stale or incomplete for recently transacted assets — users must independently verify ownership %
rather than trusting a default. (3) The "measured vs disclosed" gap conflates several possible
root causes (genuine under-reporting, GWP-convention mismatch, ownership/boundary mismatch,
Climate TRACE estimation error) into a single number with no automatic attribution between them
— the page's copy correctly flags this as requiring human interpretation, not an automated
determination of wrongdoing. (4) A 12-hour cache means very recent Climate TRACE data updates
may not appear immediately.
