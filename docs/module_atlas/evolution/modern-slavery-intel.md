## 9 · Future Evolution

### 9.1 Evolution A — Wire the orphaned FLRS engine to the page and calibrate it (analytics ladder: rung 1 → 3)

**What.** Close the module's documented wiring gap before adding anything new: §7's mismatch flag shows `ModernSlaveryIntelPage.jsx` renders 60 companies of seeded-PRNG (`sr()`) scores while the genuinely well-built 1,889-line `modern_slavery_engine.py` — ILO 11-indicator scoring, UFLPA/CAHRA flags, `xinjiang_exposure` apportionment — sits orphaned behind `POST /api/v1/modern-slavery/assess`, `/supply-chain-screen`, `/uflpa-exposure`, and `/msa-statement`. Then calibrate the engine's country-risk term to a real external anchor.

**How.** (1) Replace the synthetic 60-company loop with a supplier-upload flow posting to `/supply-chain-screen`, rendering the engine's real FLRS decomposition (sector + country + adverse-media + list-hit per §5). (2) Seed the country-risk table from Walk Free Global Slavery Index prevalence values (already the named standard) instead of engine-internal constants, stored in a `ref_gsi_country_risk` table so it is versioned and citable. (3) Benchmark: pin 5 reference suppliers (e.g. a Xinjiang-linked polysilicon entity vs a EU-domiciled service firm) in `bench_quant`-style tests asserting FLRS ordering and the `priority = min(100, base + uflpa + cahra)` caps.

**Prerequisites.** The lineage sweep shows the three POST endpoints currently `failed` — fix those live 4xx/5xx responses first; REQUIRE_AUTH gating on POSTs also applies. **Acceptance:** page numbers change when the supplier list changes and match a direct API call byte-for-byte; no `sr()` call remains in the score path.

### 9.2 Evolution B — Due-diligence analyst that screens and drafts MSA statements (LLM tier 2)

**What.** A tool-calling analyst on this page that executes "screen this supplier list and tell me who needs enhanced due diligence" by calling `/supply-chain-screen` and `/assess`, explains each FLRS using the engine's real component breakdown, and drafts UK/Australian MSA statement sections via `/msa-statement` — grounded in the four reference GETs (`/ref/ilo-indicators`, `/ref/uflpa-criteria`, `/ref/high-risk-sectors`, `/ref/audit-schemes`, all currently passing) so indicator definitions are quoted, not paraphrased from memory.

**How.** Tool schemas from the module's 8 OpenAPI operations; system prompt assembled from this Atlas page's §5/§7 engine methodology. Statement drafting is templated: the LLM fills MSA Section 54 headings (structure, policies, due diligence, risk assessment, KPIs) exclusively with fields from the `/msa-statement` response and screen results, with the no-fabrication validator checking every supplier name and score against tool outputs. High-risk determinations (>70 FLRS per §5) trigger a human-confirmation step before any EDD workflow write.

**Prerequisites (hard).** Evolution A first — the copilot must never narrate the current seeded-random page numbers; POST endpoints must return 200s under auth. **Acceptance:** a drafted MSA section cites only screened-supplier data from the session's tool calls; asking about a supplier not in the uploaded list yields a refusal.
