## 7 · Methodology Deep Dive

### 7.1 What the module computes

`frontend/src/features/asean-gcc-transition/pages/AseanGccTransitionPage.jsx` (EP-CJ2, Sprint CJ) is a **static regional-intelligence dashboard** — it performs essentially no calculation. Six tabs render hard-coded reference tables:

| Tab | Data | Content |
|---|---|---|
| Regional Overview | `ASEAN_COUNTRIES` (6) + `GCC_TARGETS` (6) | GDP, emissions, RE targets, coal GW, JETP funding, NDC pledges |
| ASEAN Taxonomy | `TAXONOMY_COMPARISON` (8 sectors) | EU vs ASEAN traffic-light classification side-by-side |
| GCC Net Zero | `GCC_TARGETS` | net-zero year, H₂ target MMTPA, green-bond issuance |
| Coal Retirement | `COAL_PHASE` (VN/ID/PH) | 4-scenario coal-capacity glidepaths 2024–2045 |
| Green Sukuk | `SUKUK_PIPELINE` (6) | Islamic green-finance issuances |
| Hydrogen Hubs | `H2_PROJECTS` (5) | GCC green/blue H₂ projects |

The guide's stated "methodology" is `Taxonomy_status = Green/Amber/Red per activity per jurisdiction` — which is exactly what the module does: it is a **lookup/classification display**, not a computation engine. The guide↔code alignment is honest here (the guide even lists a null valueSummary), so no mismatch blockquote is needed.

### 7.2 Parameterisation — reference tables

**`ASEAN_COUNTRIES`** — 6 economies with GDP ($tn), emissions (GtCO₂), RE target %, coal capacity GW, JETP funding ($bn), NDC text. E.g. Indonesia: GDP 1.32, 0.62 Gt, 23% RE, 42 GW coal, $20bn JETP, "31.89% unconditional"; Vietnam $15.5bn JETP; the header aggregates "ASEAN Coal 79 GW" (sum of the coalGW column: 42+25+6+12+13+0 = 98, though the displayed 79 GW is a curated headline).

**`TAXONOMY_COMPARISON`** — the analytical core, 8 sectors mapping EU Taxonomy status vs ASEAN Taxonomy status: Gas Power EU "Transitional" / ASEAN "Amber"; Coal Retrofit CCS EU "Red" / ASEAN "Amber" (ASEAN's transition-pathway allowance); Palm Oil EU "Not covered" / ASEAN "Amber" (with RSPO). Rendered via `trafficLight(c)` which maps Green→green, Amber→amber, Red→red, Transitional→blue, Not covered/Limited→muted, Amber/Green→sage.

**`COAL_PHASE`** — per-country capacity in GW under four scenarios (`capacity` reference, `scenario_jetp`, `scenario_base`, `scenario_delay`) at 5-year steps. Indonesia JETP path drives 42 GW → 0 by 2045 vs delay path holding 30 GW; a user toggle (`jetpMode`) selects which scenario series to chart.

**`GCC_TARGETS`, `SUKUK_PIPELINE`, `H2_PROJECTS`** — GCC net-zero years (UAE/Oman 2050, Saudi/Bahrain/Kuwait 2060, Qatar 2030-with-CCS), $23bn H₂ pipeline (NEOM 1.2 MMTPA / $8.4bn), and sukuk issuances (Saudi PIF $5bn, Indonesia sovereign $3.2bn).

All values are curated real-world figures presented as static seed data.

### 7.3 Calculation walkthrough

There is no derived-value pipeline beyond React state that selects which pre-built table/chart to show: `selectedCountry` filters the overview, `coalPhaseCountry` picks the COAL_PHASE key, `jetpMode` picks the scenario column charted. No reductions, no scoring, no PRNG. The "calculation" is entirely categorical lookup (`trafficLight` colour mapping) and chart binding.

### 7.4 Worked example — taxonomy divergence

For "Coal Retrofit CCS": EU column resolves `trafficLight("Red")` → red badge (EU Taxonomy excludes coal even with CCS); ASEAN column resolves `trafficLight("Amber")` → amber badge (ASEAN Taxonomy Version 2 permits a coal-with-CCS transition pathway). The side-by-side badges make the jurisdictional divergence the headline analytic — a reader learns that an activity green-lit for ASEAN-aligned transition finance would be excluded under the EU framework. For coal retirement: selecting Indonesia + JETP mode charts 42→35→25→15→5→0 GW (2024–2045), versus the delay scenario 42→44→45→42→38→30 — a ~30 GW 2045 gap quantifying the value of JETP financing.

### 7.5 Data provenance & limitations

- **No PRNG, no synthetic randomisation** — all figures are hand-curated reference values sourced (per `REFERENCES`) from ASEAN Taxonomy Board v2 (2024), UAE NDC 2023, Saudi Vision 2030, IRENA MENA/ASEAN 2024, Indonesia JETP CIPP, and IIFM Green Sukuk Report 2024. However, the `url` fields are all `'#'` placeholders — the citations are named but not linked, so the vintage/accuracy of each cell cannot be verified from the code.
- Static snapshot: NDC pledges, coal capacities, and sukuk pipeline will drift from reality with no refresh mechanism; the coal glidepaths are illustrative scenario shapes, not outputs of a capacity-expansion model.
- Header KPIs ("ASEAN Coal 79 GW", "Green Sukuk $50B+", "H2 Pipeline $23B") are curated headlines that don't all reconcile exactly with the underlying table sums (e.g. coalGW column sums to ~98 GW) — presentation figures, not computed aggregates.

### 7.6 Framework alignment

- **ASEAN Taxonomy for Sustainable Finance (Version 2, 2024)** — the module's defining feature: the ASEAN taxonomy's distinctive **traffic-light system** (Green / Amber / Red tiers, with Amber capturing transition activities) is implemented as the classification display, correctly contrasted against the EU Taxonomy's binary aligned/transitional/excluded structure. ASEAN's allowance of coal-with-CCS and gas as "amber" transition activities is the substantive difference the tool surfaces.
- **EU Taxonomy** — used as the comparison benchmark per sector (Green/Transitional/Red/Not covered).
- **JETP (Just Energy Transition Partnerships)** — Indonesia ($20bn) and Vietnam ($15.5bn) JETP deals are encoded as funding figures and drive the coal-retirement scenario contrast (JETP-financed vs delayed phase-out).
- **Green Sukuk / Islamic finance (ICMA GBP + Shariah)** — the sukuk pipeline represents Shariah-compliant green bonds (use-of-proceeds structures certified against both ICMA Green Bond Principles and AAOIFI Shariah standards); the module lists issuances by size/rating/sector without scoring their alignment.
- **Country NDCs (Paris Agreement)** — net-zero years and NDC pledge text are reproduced verbatim from each country's submission, not independently assessed.
