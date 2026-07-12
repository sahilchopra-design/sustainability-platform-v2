## 7 · Methodology Deep Dive

The Climate Emissions Intelligence page is a **country-level emissions dashboard that fetches real
open data at runtime** — Our World in Data (OWID) CO2 CSV and two World Bank indicator APIs — and
falls back to `sr()`-seeded demo rows only if the fetches fail. It honestly badges each data source
**LIVE** or **SEEDED**. There is no MODULE_GUIDES entry, so no guide↔code reconciliation is required.
The one static analytic asset is a marginal-abatement-cost (MAC) curve.

### 7.1 What the module computes

**Live data ingestion** (three `useEffect` fetches on mount):
```
OWID:  fetch owid-co2-data.csv → filter year=='2022', co2_per_capita>0, drop 'World'/'income'
       → owidData (LIVE); on error → SEED_COUNTRIES (SEEDED)
WB CO2/cap: api.worldbank.org …EN.ATM.CO2E.PC (mrv=1)  → wbData
WB GDP/cap: api.worldbank.org …NY.GDP.PCAP.CD (mrv=1)  → gdpData
displayData = COUNTRIES_LIST joined to (owidData if live else SEED_COUNTRIES)
```

**MAC curve** (`MAC_OPTIONS`, static): 20 abatement options each with a `cost` ($/tCO₂) and
`potential` (MtCO₂/yr), sorted ascending by cost to form the classic McKinsey/IEA MAC step chart;
negative-cost options (onshore wind −15, methane flaring −20) are profitable abatement.

### 7.2 Parameterisation / provenance

| Data | Nature | Provenance |
|---|---|---|
| Country CO2/capita, share, fuel split | **LIVE** (OWID CSV) or SEEDED fallback | Our World in Data `co2-data` (real) |
| CO2/capita, GDP/capita | **LIVE** (World Bank API) | World Bank indicators EN.ATM.CO2E.PC, NY.GDP.PCAP.CD |
| `SEED_COUNTRIES` (42) | `sr()`-seeded | Fallback only when fetch fails |
| `MAC_OPTIONS` (20) | hard-coded cost/potential | Realistic McKinsey/IEA MAC values (e.g. Solar PV −12 / 600 Mt; DAC +120 / 80 Mt) |
| `FREE_DATA_SOURCES` (11) | catalogue with URLs | Real (OWID, GCP, EDGAR, Climate TRACE, IEA, WB, EPA, UNFCCC…) |
| `NGFS_SCENARIOS` | 4 scenario labels | NGFS naming |
| `REGIONS` | country→region map | Hard-coded, accurate |

The **LIVE/SEEDED badge** (`BADGE` component) surfaces provenance honestly — a good-practice pattern
absent from most sibling modules.

### 7.3 Calculation walkthrough

1. On mount, three fetches populate `owidData`, `wbData`, `gdpData`; failures set the SEEDED flag.
2. `displayData` joins the country list to the live (or fallback) rows, attaching region.
3. Country-level views: emitters bar/treemap, CO2 vs GDP scatter, fuel-mix breakdown, regional
   aggregation — all reduce over `displayData`.
4. **MAC curve** sorts `MAC_OPTIONS` by cost and colours bars green (cost<0) / amber (<50) / red
   (≥50); bar width represents abatement potential.
5. Scenario/sector tabs present NGFS-labelled context.

### 7.4 Worked example — reading the MAC curve

Sorted `MAC_OPTIONS` (cheapest first): Methane Flaring (−20), Onshore Wind (−15), Solar PV utility
(−12), Energy Efficiency (−8), …, CCS industrial (+85), DAC (+120).

| Abatement wedge | Cost ($/tCO₂) | Potential (MtCO₂/yr) | Reading |
|---|---|---|---|
| Methane flaring reduction | −20 | 110 | Most profitable — do first |
| Solar PV (utility) | −12 | 600 | Largest cheap wedge |
| Cumulative to $0/t | negative-cost block | ≈ 1,760 Mt | "no-regret" abatement below zero cost |
| Direct Air Capture | +120 | 80 | Last-resort, most expensive |

The green (negative-cost) block is the "no-regret" abatement that pays for itself; the curve's
ascending shape is the standard supply curve of abatement.

### 7.5 Data provenance & limitations

- **This module genuinely fetches live open data** (OWID + World Bank) and only falls back to
  `sr(seed) = frac(sin(seed+1)×10⁴)` seeded rows on network failure — and it labels which is in use.
- The MAC curve is a **static illustrative table** (realistic but not year-specific or region-
  specific); it is not derived from the live data.
- OWID parsing takes the first 5000 lines and filters year 2022 — a hard-coded reporting year that
  will age; no multi-year selection.
- No portfolio or financial-risk computation here — it is a macro emissions-intelligence view.

**Framework alignment:** OWID / Global Carbon Project / EDGAR / Climate TRACE / IEA / World Bank /
UNFCCC (the module both catalogues and consumes these authoritative emissions sources); NGFS scenario
naming for the transition context; the MAC curve follows the McKinsey/IEA marginal-abatement-cost
methodology (abatement options ranked by $/tCO₂ against annual potential). Because it uses real data
and a standard MAC construction, **no §8 model specification is required** — the production
enhancement is multi-year, sector-resolved live data and a data-derived MAC curve rather than a
static table.
