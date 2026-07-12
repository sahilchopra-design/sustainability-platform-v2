## 9 · Future Evolution

### 9.1 Evolution A — Ground the country risk in published health-climate data (analytics ladder: rung 1 → 2)

**What.** §7 flags that none of the guide's epidemiological pathways exist — every
KPI (heat mortality, PM2.5, DALYs, pandemic risk, worker exposure) is a single
seeded number over 40 real country names, and the only computation is an equal-weight
mean of five seeded sub-risks. The composite structure is sound; the inputs are
fiction. Evolution A populates the five sub-risks from published, public sources the
§5 reference list already points at: heat exposure from the Lancet Countdown
indicator set (published per country annually), PM2.5 from WHO ambient air-quality
data, vector-suitability from published IPCC AR6/modelling-consortium range maps,
adaptation capacity from WHO climate-health country profiles, and labour heat stress
from ILO's published productivity-loss estimates — keeping the existing composite
mean and tiering logic, now over sourced components.

**How.** (1) `ref_country_health_climate(iso3, indicator, value, source, year)` —
five indicators × ~190 countries, all from downloadable public compilations; a
bounded annual-refresh curation. (2) The equal-weight composite retained but weights
made explicit and adjustable (rung-2 sensitivity); tier thresholds documented.
(3) The seeded KPI cards, alerts, and engagements either derived from the new data or
clearly relabelled as workflow fixtures — real country names must not carry seeded
health metrics.

**Prerequisites (hard).** PRNG purge on country metrics; source licensing (WHO/ILO/
Lancet data are publicly published with attribution). **Acceptance:** each country's
five sub-risks trace to indicator rows with source+year; the composite reproduces the
documented mean; zero seeded health numbers remain.

### 9.2 Evolution B — Health-exposure briefing copilot (LLM tier 1)

**What.** A copilot for healthcare-sector investors and ESG analysts: "why is
Pakistan tier-Critical?" (decomposition into the five sourced sub-risks with
citations), "which portfolio countries face the steepest labour heat-stress
exposure?", "what does the Lancet Countdown say about heat mortality trends here?" —
retrieval and composite narration over the Evolution A tables plus the §5 corpus
(WHO, Lancet Countdown, IPCC AR6 Ch.7). Tier 1: the module aggregates published
epidemiology; it does not model it, and the copilot must inherit that modesty.

**How.** Atlas record + indicator tables as corpus; decompositions cite indicator
source and year per component; the copilot distinguishes exposure indicators from
health outcomes explicitly (an exposure index is not a mortality forecast); refusal
on financial-impact quantification the module doesn't compute.

**Prerequisites (hard).** Evolution A first — narrating seeded DALYs about real
countries is the fabrication-on-real-names pattern at its most sensitive, given the
subject matter. **Acceptance:** a tier explanation reconciles to the composite's
component values with citations; asked to forecast heat deaths for 2030, the copilot
reports published projections if present in the corpus, else refuses.
