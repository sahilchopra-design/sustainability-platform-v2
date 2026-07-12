## 9 · Future Evolution

### 9.1 Evolution A — Real coverage scoring against the in-DB requirement catalogs (analytics ladder: rung 1 → 2, honestly attained)

**What.** The §7 flag is explicit: the guide's Disclosure Coverage Score (`DCS = disclosed mandatory / total mandatory × 100`) is unimplemented — all 180 entities' per-framework scores are `sr()`-seeded with only an assurance multiplier as structure. What *is* real: the 12-framework list, the jurisdiction→mandatory-framework matrix (EU→ESRS/TCFD, UK→TCFD/UK-TCFD, etc.), and the improvement tips. Evolution A builds the first backend vertical: an actual requirement inventory and a computed DCS, replacing every seeded score.

**How.** (1) The requirement database already exists in the platform — the ESRS/GRI datapoint catalogs are in the refdata layer (`/api/v1/refdata`, used by `esrs-datapoint-navigator`); add TCFD's 11 recommendations and IFRS S1/S2 as small seed tables rather than re-scraping. (2) New `services/disclosure_adequacy_engine.py`: given a per-entity disclosure checklist (which datapoints are addressed), compute DCS per framework, mandatory-gap counts against the real jurisdiction matrix (port it server-side — it's the module's one genuine asset), and deadline-weighted priority. (3) The page's `ENTITIES` seed set becomes a persisted `disclosure_assessments` table; boolean readiness flags (`doubleMaterialityDone` etc.) become user-entered evidence, not `sr()` threshold draws.

**Prerequisites.** The fabricated-scores defect acknowledged in release notes (numbers will visibly change); refdata ESRS catalog confirmed complete for E1–E5. **Acceptance:** `check_no_fabricated_random.py`-style audit finds zero `sr()` in the scoring path; a fixture entity with 40/80 mandatory ESRS datapoints ticked scores exactly 50.

### 9.2 Evolution B — LLM does the requirement matching the guide promised (LLM tier 2)

**What.** The guide's unbuilt "NLP classification to match disclosure text against requirement items" is the canonical LLM-shaped task: upload a sustainability report, and a tool-calling analyst maps each passage to ESRS/GRI/TCFD requirement items, producing the coverage matrix with per-requirement confidence and quoted evidence spans — turning this module from a checklist into the analyzer its name claims.

**How.** (1) Chunk the uploaded report (the platform's `esg-report-parser` module is the natural ingestion partner); for each mandatory requirement from Evolution A's inventory, retrieve candidate passages via pgvector (`llm_corpus_chunks` pattern from the roadmap D3 stage) and have Claude classify covered / partial / absent, returning the supporting quote. (2) Results write to `disclosure_assessments` as *evidence-linked* coverage, feeding the deterministic DCS from Evolution A — the LLM classifies, the engine scores; numbers never come from the model. (3) Human-review queue for low-confidence matches before anything counts toward the mandatory-gap KPI.

**Prerequisites (hard).** Evolution A's requirement inventory and honest scoring first — an LLM matcher writing into seeded scores would be garbage-on-garbage. **Acceptance:** on a golden report fixture (one public CSRD statement), precision/recall of requirement matching ≥ a hand-labeled baseline, every "covered" verdict carries a verbatim quote, and unmatched requirements appear as gaps rather than guesses.
