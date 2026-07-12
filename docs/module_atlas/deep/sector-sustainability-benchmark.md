## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry states the calculation engine as
> `benchmark_score = (company_kpi − peer_p25) / (peer_p75 − peer_p25) × 100` (IQR/interquartile
> normalisation, 0=P25, 100=P75) with SASB-materiality-weighted composite scoring. **No IQR normalisation,
> percentile computation, or SASB-weighted composite score exists anywhere in this file.** The code instead
> presents (a) a fixed lookup table of **descriptive benchmark strings** per sector (e.g. `ghgIntensity:
> '0.45 tCO2e/t product'`) that are never parsed into numbers or compared against anything, (b) a separate
> `sr()`-seeded synthetic company-profile array unrelated to those strings, and (c) a **user-driven
> self-assessment slider** (Maturity Assessment tab) with no computed peer comparison at all. What follows
> documents what the code actually renders.

### 7.1 What the module computes

`SECTORS` (14 real-world sector definitions — Chemicals, Banking, Technology, Automotive, Consumer Goods,
Energy, Mining, Insurance, Telecom, Real Estate, Healthcare, India Leaders, Aviation & Shipping,
Agriculture) each carry real named example companies (BASF, HSBC, Microsoft, Tesla, etc.), a
`materialTopics` list, `esrsPriority` codes, and a `benchmarks` object of **hand-authored descriptive
strings** (not numbers): `{ ghgIntensity:'0.45 tCO2e/t product', renewable:'35%', water:'2.1 ML/t',
sustainableRev:'28%', wasteDiversion:'72%' }`. Separately, `COMPANIES` generates one synthetic numeric
profile per named company via `sr(seed)=frac(sin(seed+1)×10⁴)`:

```js
ghgIntensity      = 5 + sr(seed+1)×150                        // tCO2e, arbitrary unit vs benchmarks.ghgIntensity string
renewablePct      = round(15 + sr(seed+2)×75)
waterIntensity    = 0.1 + sr(seed+3)×5
sustainableRevPct = round(5 + sr(seed+4)×50)
esgScore          = round(40 + sr(seed+5)×55)
sbtiTarget/tcfdAligned/tnfdAligned = sr(seed+n) > threshold    // independent booleans
```

These two data sources (string benchmarks vs. numeric company profiles) are **never joined or compared** —
a company's synthetic `ghgIntensity` number is not benchmarked against its sector's `benchmarks.ghgIntensity`
string anywhere in the calculation logic.

### 7.2 Parameterisation

| Sector | `benchmarks.ghgIntensity` (descriptive, unparsed) | `esrsPriority` |
|---|---|---|
| Chemicals | "0.45 tCO2e/t product" | E1, E2, E5, S1 |
| Banking & Financial Services | "62 tCO2e/$M financed" | E1, G1, S1, S4 |
| Technology | "8.2 tCO2e/$M rev" | E1, E5, S4, G1 |
| Energy (O&G+Renewables) | "18 kgCO2e/BOE" | E1, E4, S1, S3 |
| Mining & Metals | "2.8 tCO2e/t ore" | E1, E3, E4, S3 |

These per-sector benchmark strings use real, sector-appropriate units (tCO₂e/t product for materials
processors, tCO₂e/$M financed for banks, kgCO₂e/BOE for oil & gas) — directionally faithful to how each
industry actually reports intensity, but presented as static reference text with **no source citation** and
no code path that parses or compares against them.

| `MATURITY_LEVELS` (5-point scale) | Ad Hoc → Developing → Defined → Managed → Optimizing | Matches the standard CMMI-style maturity-model convention |
| `MATURITY_DIMS` (8) | GHG Management, Water Stewardship, Circular Economy, Social Impact, Governance, Disclosure Quality, Target Setting, Assurance | User self-scores 1–5 per dimension via slider |

### 7.3 Calculation walkthrough

1. **Sector Overview / Deep-Dive / Company Profiles / Cross-Sector Comparison** tabs display the two
   independent data sources side by side — descriptive `benchmarks` strings and synthetic `COMPANIES`
   numbers — as separate tables/cards, not a joined comparison.
2. `sectorRadarData` (ESG 8-dimension radar per sector) is defined as
   `const sectorRadarData = useMemo => SECTORS.map(...)` — **this is a coding bug**: `useMemo` (the React
   hook imported at the top of the file) is used as a parameter name for an arrow function, so
   `sectorRadarData` is actually *a function* (`(useMemo) => array`), not the computed array itself. It is
   never invoked anywhere else in the file — this is dead, non-functional code, confirmed by a full-file
   search finding zero other references to `sectorRadarData`.
3. **Regional Benchmarking** (`regionData`): 5 regions × `sr()`-seeded synthetic metrics, independent of the
   14-sector data.
4. **Maturity Assessment** (Tab 9): a genuinely interactive tool — user sets a 1–5 slider per of the 8
   `MATURITY_DIMS`; `avgMaturity = mean(8 slider values)`. This is a self-assessment input tool, not a
   peer-benchmarked score — there is no external "target maturity" or peer-average line to compare against.
5. **Best Practice Showcase** — 10 hardcoded real-company practices (Microsoft SBTi, Novo Nordisk internal
   carbon price $150/tCO₂e, Unilever Scope 3 CDP A-List, Apple circular design, HSBC TNFD LEAP, etc.) —
   accurate, real-world sustainability leadership examples used as static reference cards, not computed
   rankings.

### 7.4 Worked example

Maturity Assessment: user sets sliders to
`[GHG:4, Water:3, Circular:2, Social:3, Governance:4, Disclosure:3, Targets:4, Assurance:2]`:

| Step | Computation | Result |
|---|---|---|
| Sum | `4+3+2+3+4+3+4+2` | 25 |
| `avgMaturity` | `25/8` | **3.1** → nearest label "Defined (Level 3)" per `MATURITY_LEVELS[round(3.1)-1]` |

No sector-peer comparison line exists to contextualise whether 3.1 is high or low for the user's sector.

### 7.5 Companion analytics on the page

- **Gap Analysis tab** — compares each sector's descriptive benchmark strings against generic industry
  commentary; not a computed numeric gap (consistent with the string-only nature of `benchmarks`).
- **Improvement Roadmap tab** — presents generic maturity-improvement guidance text, not a company-specific
  computed roadmap.

### 7.6 Data provenance & limitations

- **Sector `benchmarks` are hand-authored descriptive strings**, not sourced or parsed — despite plausible,
  industry-appropriate units, treat every value as an illustrative placeholder, not a citation-backed
  reference figure.
- **`COMPANIES` numeric profiles are entirely synthetic** (`sr()`-seeded) and are never reconciled against
  the sector `benchmarks` strings — the two views of "sector performance" on this page can visually
  contradict each other.
- **`sectorRadarData` is dead code with a naming bug** (parameter shadows the `useMemo` import) — it
  computes nothing that is ever rendered; if a future edit tries to call it expecting an array, it will
  receive a function instead and likely throw.
- **No IQR/percentile normalisation exists**, contrary to the guide — a real implementation would need
  numeric per-company KPI data (not currently collected in a comparable, parseable form) plus P25/P75
  computation per GICS sub-industry peer group.
- Maturity Assessment is a pure self-report tool with no external validation or peer benchmark line.

**Framework alignment:** SASB Materiality Map (named in guide as the source of KPI weighting — not
implemented) · S&P Global CSA and MSCI ESG Research sector benchmarks (named as data sources for the
descriptive `benchmarks` strings — not parsed or numerically compared) · CMMI-style 5-level maturity model
convention (genuinely reflected in `MATURITY_LEVELS`/`MATURITY_DIMS` naming and structure) · real
sustainability-leadership case studies (Microsoft, Novo Nordisk, Unilever, Apple, HSBC, Nestlé, TotalEnergies,
L'Oréal, Reliance) accurately reflect each company's actual publicly disclosed practices as of the guide's
authoring.
