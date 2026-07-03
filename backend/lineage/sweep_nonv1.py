"""
lineage.sweep_nonv1 — sweep the legacy non-/api/v1 surface from the live app.

The main sweep covered every api/v1/routes module. This covers the remaining
backend: routers with non-v1 prefixes + inline @app endpoints + auth, i.e. every
route on server.app whose path is NOT under /api/v1 (and isn't a docs/static
internal). Grouped by first path segment so each shows as its own dashboard
domain. Read-only. Adds to the existing lineage_output, then rebuilds rollups +
learnings + dashboard so v1 and non-v1 aggregate together.

  python lineage/sweep_nonv1.py
"""

import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND not in sys.path:
    sys.path.insert(0, BACKEND)
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:  # noqa: BLE001
    pass

from lineage.runner import LineageRunner       # noqa: E402
from lineage import recorder, analyze, dashboard  # noqa: E402

SKIP_PREFIXES = ("/api/v1",)
SKIP_EXACT = {"/openapi.json", "/docs", "/docs/oauth2-redirect", "/redoc", "/"}


def _group(path):
    parts = [p for p in path.split("/") if p and not p.startswith("{")]
    if not parts:
        return "root"
    if parts[0] == "api" and len(parts) >= 2:
        return "nonv1-" + parts[1]
    return "nonv1-" + parts[0]


def main():
    runner = LineageRunner()
    from server import app

    # enumerate non-v1 groups present on the live app
    groups = {}
    for r in app.routes:
        path = getattr(r, "path", "")
        if not getattr(r, "endpoint", None):
            continue
        if path in SKIP_EXACT or any(path.startswith(p) for p in SKIP_PREFIXES):
            continue
        if not path.startswith("/api"):          # focus on the API surface
            continue
        groups.setdefault(_group(path), set()).add(path)

    print(f"[nonv1] {len(groups)} non-v1 API groups · "
          f"{sum(len(v) for v in groups.values())} paths")

    grand = {"endpoints": 0, "passed": 0, "failed": 0, "skipped": 0,
             "functions_traced": 0, "sql_statements": 0}
    for g in sorted(groups):
        seg = g.replace("nonv1-", "")
        pred = (lambda gg: (lambda m, p: _group(p) == gg))(g)
        print(f"\n[nonv1] === {g} ===")
        res = runner.run_app_subset(g, pred)
        for k in grand:
            grand[k] += res.get(k, 0)
        print(f"  -> {res['passed']}/{res['endpoints']} passed · "
              f"{res['functions_traced']} fns · {res['sql_statements']} SQL")

    print(f"\n[nonv1] subtotal endpoints={grand['endpoints']} "
          f"passed={grand['passed']} failed={grand['failed']} "
          f"skipped={grand['skipped']} fns={grand['functions_traced']} "
          f"sql={grand['sql_statements']}")

    # aggregate everything (v1 + non-v1)
    totals = recorder.rebuild_from_traces()
    analyze.analyze()
    dashboard.build()
    print(f"[nonv1] AGGREGATE totals: {totals}")


if __name__ == "__main__":
    main()
