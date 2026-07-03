"""
A² Intelligence — E2E Data-Lineage Test Harness
================================================

Deep, function-level data-lineage capture for the platform's backend.

For each exercised endpoint we record a *transaction*: the full tree of
application function calls (args -> transform -> return), every SQL statement
that fed it (the authoritative *source*), timings, and provenance (real DB /
reference data / mock). Records are written as JSON + an append-only JSONL
ledger and visualised by an interactive HTML dashboard.

Modules:
    tracer   — sys.setprofile call-tree tracer + SQLAlchemy source listeners
    mockgen  — schema-valid mock input generation (Pydantic v1/v2)
    runner   — in-process E2E invocation of a domain's endpoints under tracing
    domains  — registry of domains -> endpoints (real-data-first inputs)
    run      — CLI entry point
"""
