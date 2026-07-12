## 9 · Future Evolution

### 9.1 Evolution A — First backend vertical: the AROI engine the guide promises (analytics ladder: rung 1 → 2)

**What.** This is a thin tier-B module whose §7 mismatch flag is blunt: the advertised `AROI = (Lives_saved×VSL + DALY_averted×VSL_DALY − CapEx)/CapEx` methodology has **no implementation** — every spend figure, financing gap, infrastructure score and instrument term across the 30 countries is `sr()`-seeded; the only genuine computation is the `healthAdaptPct` spend split. Evolution A builds the module's first backend vertical implementing the §8 cost-benefit model: lives saved and DALYs averted from baseline burden × intervention risk-reduction fractions, monetised with PPP-adjusted VSL, yielding AROI and BCR per country/intervention.

**How.** (1) Seed a reference table of climate-sensitive DALY burden per country from WHO Global Health Observatory (the 250–800/100k range §8.3 cites) plus intervention efficacy fractions from the literature the page already names (Gasparrini heat 15–40%). (2) New route `POST /health-adaptation/aroi` takes country, intervention category (the existing 8 `INFRA_CATEGORIES`), CapEx/OpEx and discount rate; returns Lives_saved, DALY_averted, Benefit, AROI, BCR with honest nulls where burden data is missing. (3) Replace the seeded country cards with engine output plus a scenario toggle (IPCC AR6 hazard intensification). (4) Validation: computed BCRs reconcile to the WHO/GCA 3–7× benchmark band.

**Prerequisites.** WHO GHO burden ingestion (public, keyless); removal of the `genCountries(30)` PRNG fabrication — the module currently fails the platform's no-fabricated-random standard in spirit. **Acceptance:** a Bangladesh cooling-centre case produces a BCR inside the published 3–7× band, reproducible from stored inputs; zero `sr()` calls remain in the page's financial fields.

### 9.2 Evolution B — Adaptation-finance copilot with a VSL-honesty guardrail (LLM tier 1)

**What.** A copilot for development-bank users answering "why is Nigeria tiered Critical?", "what does the 33% adaptation share mean?", and "what would an AROI here require?" — grounded in this Atlas page. Its most valuable near-term behaviour is candour: until Evolution A ships, it must state that dollar figures are illustrative synthetic placeholders (per §7.5) and explain what the WHO-VSL methodology *would* compute, citing §8.

**How.** Tier 1 RAG per the roadmap: atlas record embedded in `llm_corpus_chunks`; system prompt carries the §7 mismatch flag and the vulnerability-tier cutoffs ($3,000M/$1,500M/$500M gap) so tier assignments are explained mechanically. After Evolution A, upgrade to tier 2: the copilot calls the new `/aroi` endpoint for what-ifs ("recompute at LMIC VSL $1M vs HIC $5M") — a genuinely useful sensitivity given §8.6 notes VSL choice dominates and is ethically contested; the copilot must always surface which VSL was used.

**Prerequisites.** Copilot router + pgvector corpus (Phase 1); for tier 2, Evolution A. **Acceptance:** asked "is this real spend data?", the copilot answers no with a §7.5 citation; post-Evolution-A, every AROI it quotes matches a logged tool call including its VSL parameter.
