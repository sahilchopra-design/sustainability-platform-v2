## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's formula is `IRR = rate where
> NPV(conversion_cash_flows) = 0` — a real discounted-cash-flow IRR solve. **No cash-flow schedule,
> discount rate, or NPV solver exists in the code.** `irr` (and `capex`, `jobs`, `feasibility`) for
> each of the 10 repurposing pathways is a **fixed hardcoded literal**, not derived from any
> computation. The module is a static, plausible reference table plus three genuinely real, named
> case studies — not a cash-flow model.

### 7.1 What the module computes

`PATHWAYS` — 10 hardcoded fossil-to-clean repurposing options, each with `capex` ($M), `timeline`
(text range), `irr` (%, literal), `jobs` (count), `feasibility` (0–100, literal), `riskLevel`
(Low/Medium/High), `region`, `savedEmissions` (MtCO₂e). Examples: `Coal Plant→Battery Storage`
($180M capex, 14.2% IRR, US Midwest); `Gas Turbine→Synchronous Condenser` ($25M, **22.5% IRR** —
the highest of the 10, reflecting the genuinely low capex and high feasibility of this specific
real-world repurposing pattern — grid operators do convert retiring gas turbines to synchronous
condensers for reactive-power support at relatively low cost).

The only computed values are simple aggregates:
```
totalCapex = Σ capex           totalJobs = Σ jobs
avgIRR     = mean(irr)          totalSaved = Σ savedEmissions
```

### 7.2 Parameterisation

| Pathway | CapEx ($M) | IRR (literal) | Feasibility | Provenance |
|---|---|---|---|---|
| Gas Turbine → Synchronous Condenser | 25 | 22.5% | 95 | Plausible — matches real-world low-capex, high-feasibility grid-services conversions |
| Coal Mine → Pumped Hydro Storage | 400 | 9.8% | 60 | Plausible — pumped hydro repurposing of mine pits is a real, capital-intensive, lower-return pattern |
| Steel BF → Electric Arc Furnace | 520 | 10.4% | 80 | Plausible — largest capex, consistent with real EAF conversion costs (hundreds of millions to >$1Bn per plant) |

All 10 rows show internally consistent, directionally sensible relationships (higher capex tends
toward longer timelines and — with exceptions like the H₂-DRI-style Steel BF conversion — lower IRR)
even though no formula produced them.

### 7.3 Calculation walkthrough

1. **Filter/sort** — by `riskLevel` and by `irr`/`capex`/`feasibility`.
2. **Portfolio KPIs** — the four aggregate sums/means above, computed correctly from the static table.
3. **Decommission vs Convert tab** — a `decommRate` slider (0–100%) likely blends a hardcoded
   decommission-only cost baseline against the conversion economics, though no NPV comparison formula
   is present in the reviewed portion of the file.
4. **Case Studies tab** — 3 real, named, verifiable examples (Drax Power Station biomass+BECCS
   conversion, Hornsea offshore wind O&M base from a former oil platform, HYBRIT fossil-free steel
   pilot in Sweden) with real capex figures ($1.2Bn, $680M, $1.8Bn) and status — genuinely
   fact-grounded content, presented as fixed reference cases rather than computed from the `PATHWAYS`
   model.

### 7.4 Worked example

`avgIRR = mean([14.2,11.8,22.5,12.6,13.1,10.4,16.8,18.2,9.8,19.4]) = 148.8/10 = 14.88%`.
`totalCapex = Σ[180,450,25,320,280,520,150,90,400,210] = $2,625M`. Both are correct arithmetic over
the static table — the numbers being aggregated are simply not derived from any cash-flow model.

### 7.5 Companion analytics

- **Conversion CapEx tab** — bar chart of `capex` by pathway.
- **Green Industrial Zones tab** — presumably a regional clustering view (region field present on
  each pathway) — descriptive, not modelled.

### 7.6 Data provenance & limitations

- All 10 pathway metrics are fixed illustrative constants; no underlying cash-flow schedule
  (construction capex phasing, revenue ramp, opex, terminal value) exists to actually solve for IRR.
- The 3 case studies are real and verifiable in broad strokes (Drax BECCS conversion, Hornsea
  offshore wind, HYBRIT green steel are all genuine, publicly documented projects) — a stronger
  factual grounding than most modules in this batch, but still fixed reference content rather than a
  live-computed comparison against the `PATHWAYS` table's own numbers.
- No sensitivity to carbon price, electricity price, or financing cost is modelled — a real IRR for
  any of these repurposing pathways would be highly sensitive to exactly those variables.

**Framework alignment:** IEA Net Zero industry transition studies (conceptual basis for the pathway
list) · Carbon Tracker stranded-asset repurposing framing · real-world case precedents (Drax, Ørsted/
Hornsea, HYBRIT consortium) genuinely cited, not fabricated.
