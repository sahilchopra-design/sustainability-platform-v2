## 9 · Future Evolution

### 9.1 Evolution A — Implement the serial ledger and CORSIA screen the guide advertises (analytics ladder: rung 1 → 2)

**What.** §7 is blunt: the guide's deduplication formula
(`DuplicateFlag = serial_i ∈ RegistrySet_j`) and CORSIA eligibility matrix are **not
implemented** — the page is registry-volume rollups, fee comparisons, and a synthetic
API-health panel, with one genuinely real import (`verraRegistryData`). Evolution A
builds the missing logic on the platform's real Verra foundation: the seeded Verra
registry projects (migration 102 already ships `verra_registry_projects` rows) become
the first populated registry in a `registry_credit_serials` table, with the interval-
overlap dedup check and the CORSIA rule (`vintage ≥ 2016 AND programme ∈ approved
list`) as computed screens rather than described ones.

**How.** (1) Serial ranges stored as int8 ranges with a GiST exclusion constraint —
cross-registry overlap becomes a DB-enforced impossibility plus a queryable violation
report for imported data. (2) CORSIA screen as a SQL view against the ICAO-approved
programme list (a small, versioned reference table — the list changes by ICAO Council
decision and must carry an `as_of`). (3) Replace the synthetic API-health panel with
honest status derived from actual ingest timestamps of `verraRegistryData`, or remove
it.

**Prerequisites.** Only Verra data is real today — Gold Standard/CAR/ACR/CDM balances
must stay clearly labelled demo until ingested; mismatch flag clears. **Acceptance:**
inserting an overlapping serial range fails with the conflicting range cited; the
CORSIA screen excludes a 2015-vintage fixture and includes a 2017 one.

### 9.2 Evolution B — Registry-operations copilot (LLM tier 1)

**What.** A copilot answering the operational questions this hub exists for: "is this
credit CORSIA-eligible and why?", "which registry has the lowest all-in fees for a 100kt
issuance?" (the fee-comparison table is real seeded reference data), "what are the
Verra retirement steps and typical durations?" (the `VERRA_WORKFLOW`/`GS_WORKFLOW`
stage tables). Grounded in this atlas page and — post-Evolution A — the computed CORSIA
screen; no tool-calling tier until real multi-registry endpoints exist.

**How.** Tier-1 pattern: atlas record plus the workflow/fee seed tables as corpus;
eligibility answers cite the rule *and* the credit's vintage/programme fields;
fee answers reproduce the comparison-table arithmetic. The prompt discloses which
registries' balances are real (Verra) versus demonstration.

**Prerequisites.** Evolution A's CORSIA view for eligibility answers that reflect
computed screens rather than the guide's prose; ICAO list version pinned in the corpus.
**Acceptance:** an eligibility answer names vintage, programme, and the list version
consulted; asked for a live Gold Standard account balance, the copilot states that
integration does not exist yet.
