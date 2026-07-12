## 7 · Methodology Deep Dive

> ⚠️ **Engine-available-but-not-used flag.** This route is **tier-A** and a rigorous LCOH engine exists
> (`green_hydrogen_engine.calculate_lcoh`, IEA methodology with CRF, stack replacement and real
> electrolyser benchmarks). **The page does not call it for its headline LCOH** — it computes a
> *simplified client-side* LCOH and then perturbs it with seeded noise:
> `lcohAdj = max(1.5, round(lcoh·10 + sr(i·23)·15)/10)`. So the displayed project-level LCOH is a
> reduced-form approximation plus PRNG jitter, not the engine's deterministic output. Sections below
> document the frontend maths; the production model already lives in the engine (no §8 needed).

### 7.1 What the module computes

Per synthetic green-H2 project (4 green technologies, 6 regions):
```js
capFactor = 0.30 + sr·0.50                              // 30–80%
fcr       = 0.08                                        // fixed charge rate (annualised CAPEX)
lcoh      = (tech.capex · fcr) / (8760 · capFactor · tech.eff) · 3.6     // $/kgH2 (simplified)
lcohAdj   = max(1.5, round(lcoh·10 + sr(i·23)·15)/10)   // seeded-jittered display value
h2Output  = capacity · 8760 · capFactor · tech.eff / 33.3 / 1000         // t/yr
capex     = capacity · tech.capex / 1000                // $M
co2Avoided = h2Output · 9.3                             // tCO₂/t H2 vs grey
```
An interactive LCOH breakdown (`lcohBreakdown`, sliders `calcElec`, `calcCf`, `calcEff`), a technology
comparison, a learning curve to 2050, and a demand-sector "willingness-to-pay gap" (`gap = max(0,
calcLcoh − willingness)`) round out the page.

### 7.2 Parameterisation / provenance

| Element | Value | Provenance |
|---|---|---|
| `TECHNOLOGIES` capex/opex/eff | 7 rows (4 green used) | anchors consistent with IEA; project draw synthetic |
| Fixed charge rate | 0.08 | code constant (≈ WACC-based annuity proxy) |
| H2 LHV | 33.3 kWh/kg | physical constant |
| CO₂ avoided factor | 9.3 tCO₂/t H2 | grey-SMR displacement (~9–10 kg/kg) |
| `capFactor` | `0.30 + sr·0.50` | synthetic |
| `elecCost` | `20 + sr·80` $/MWh | synthetic |
| `lcohAdj` jitter | `+ sr(i·23)·15/10` | **synthetic noise** on the LCOH |
| Learning curve | `pem = 5.0 − i·0.5 + (elec−50)·0.02` | illustrative linear decline |

### 7.3 Calculation walkthrough

Seed projects → per project compute `lcoh` from the simplified `capex·fcr/(hours·CF·eff)·3.6` form (note:
this captures only the CAPEX contribution scaled by a 3.6 unit factor — it omits the explicit electricity
term the engine includes, so `elecCost` is generated but not additively summed into `lcoh`) → `lcohAdj`
adds noise → `h2Output`, `capex`, `co2Avoided`. The interactive `lcohBreakdown` recomputes from the three
sliders. `techComparison` maps over technologies; `gap` measures each sector's LCOH-vs-willingness shortfall.

### 7.4 Worked example

`tech.capex = $1000/kW`, `tech.eff = 0.65`, `capFactor = 0.50`, `fcr = 0.08`:
`lcoh = (1000·0.08)/(8760·0.50·0.65)·3.6 = 80/(2847)·3.6 = 0.0281·3.6 = $0.101/kg`?? — the raw form yields
an implausibly low value, which is why the code floors and jitters it: `lcohAdj = max(1.5, round(0.101·10 +
sr·15)/10) = max(1.5, …) = $1.5/kg` (the floor binds). This exposes that the simplified LCOH is not
dimensionally faithful to the engine's; the `max(1.5, …)` floor and jitter mask it. The **engine**, by
contrast, would return ~$4/kg for a comparable grid/PPA project (see `green-hydrogen` §7.4) because it adds
the electricity component explicitly.

### 7.5 Data provenance & limitations

- Projects are **synthetic**, seeded by `sr(seed)=frac(sin(seed+1)·10⁴)`.
- The page's LCOH is a **reduced-form approximation with a hard floor and seeded jitter**, and omits the
  electricity term that dominates real LCOH — so it should not be used for decisions; the engine's
  `calculate_lcoh` is the correct source.
- CO₂-avoided uses a single grey factor; no scenario/technology variation in the credit.

**Framework alignment:** IEA Global Hydrogen Review (LCOH structure, cost trajectory), IRENA green-hydrogen
cost reduction, Hydrogen Council pathway — all better realised in the backend engine than on this page. EU
Taxonomy RFNBO threshold and grey-H2 displacement (9.3 tCO₂/t) frame the CO₂-avoided metric.

*(No §8 model specification: the production LCOH model is implemented in `green_hydrogen_engine.py`
(`calculate_lcoh`, CRF + four cost components + IEA CAPEX trajectory). Remediation is to wire this page to
the engine and drop the simplified `lcoh`/`lcohAdj` client formula and its floor/jitter.)*
