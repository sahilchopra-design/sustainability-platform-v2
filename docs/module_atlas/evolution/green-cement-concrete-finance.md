## 9 · Future Evolution

### 9.1 Evolution A — Compute LCOP from components and add break-even carbon-price rigour (analytics ladder: rung 2 → 3)

**What.** §7 credits this with real, standard technology carbon intensities and a faithful calcination/thermal CO₂ split (0.55 process-inherent + 0.10 thermal tCO₂/t, IEA/GCCA-consistent) across 8 pathways (Portland, Oxyfuel+CCS, LC³, Post-Combustion CCS, Geopolymer, Electric Kiln, LEILAC), with an LCA waterfall faithful to the process chemistry. Its limitation is that each technology's levelised cost is a stored `lcop` anchor that projects merely perturb, rather than building LCOP from its components (`LCOP = Energy_cost + Raw_material + CAPEX_CRF + CO2_cost − Green_premium`). Evolution A computes LCOP bottom-up from energy price, raw-material cost, capex CRF, and a live carbon price per the §5 formula, so the break-even carbon price (where a low-carbon pathway beats Portland) is derived, not a stored anchor — and responds to energy and carbon markets.

**How.** (1) Build LCOP per technology from its cost components using the real carbon intensities already present, replacing the perturbed anchor. (2) Break-even carbon price solved as the carbon price where a pathway's LCOP equals conventional Portland's — a computed crossover. (3) Wire energy and carbon prices from the platform's market feeds so LCOP and break-even respond to conditions.

**Prerequisites.** Per-technology cost-component data (energy intensity, raw-material, capex — curated from IEA/GCCA acceptable, documented per §8); energy/carbon-price feeds. **Acceptance:** LCOP recomputes from components reproducing §5 (not a stored anchor); the break-even carbon price is solved per technology and moves with energy price; the calcination/thermal split remains correct.

### 9.2 Evolution B — Cement-decarbonisation pathway copilot (LLM tier 1 → 2)

**What.** A copilot for cement-sector investors and offtakers: "at €90/t carbon, which low-carbon cement pathway has the lowest LCOP, and how much of the abatement is process-inherent calcination that only CCS can address?" narrates the technology comparison and LCA waterfall from the atlas corpus, with tier-2 computing LCOP and break-even carbon price via the Evolution A endpoint.

**How.** Tier 1 grounds on §5/§7 (the calcination-vs-thermal chemistry, the 8-pathway comparison, IEA/GCCA intensities), and since the carbon-intensity data is real, an explainer ships early. Tier 2 tool-calls the LCOP/break-even endpoint so carbon-price and energy-price what-ifs are computed. The copilot's distinctive value is the calcination insight — that ~0.55 tCO₂/t is process-inherent and only CCS/alternative binders address it. Every $/t figure validated against tool output.

**Prerequisites.** Evolution A for computed LCOP/break-even; corpus embedding. **Acceptance:** every LCOP and break-even figure in a copilot answer traces to a tool call or the real intensity data; pre-Evolution-A the copilot flags LCOP as a stored anchor; the calcination/thermal split is cited from the real chemistry.
