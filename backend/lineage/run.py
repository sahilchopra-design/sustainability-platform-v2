"""
lineage.run — CLI entry for the E2E data-lineage harness.

  python lineage/run.py stranded-assets       # one curated domain
  python lineage/run.py --module api.v1.routes.cbam
  python lineage/run.py --all                  # every api/v1/routes domain (scale run)
  python lineage/run.py --list                 # list discoverable domains
"""

import os
import sys
import argparse

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
for _p in (BACKEND_DIR, "."):
    if _p not in sys.path:
        sys.path.insert(0, _p)

from lineage.runner import LineageRunner       # noqa: E402
from lineage import domains as D                # noqa: E402


def main():
    ap = argparse.ArgumentParser(description="A² data-lineage harness")
    ap.add_argument("domain", nargs="?", help="curated domain name")
    ap.add_argument("--module", help="explicit router module path")
    ap.add_argument("--all", action="store_true", help="run every route module")
    ap.add_argument("--curated", action="store_true",
                    help="run the curated DOMAINS set (one process)")
    ap.add_argument("--list", action="store_true", help="list discoverable domains")
    ap.add_argument("--allow-writes", action="store_true",
                    help="DANGER: also exercise mutating endpoints (writes to DB)")
    args = ap.parse_args()

    if args.list:
        allmap = D.discover_all()
        print(f"[lineage] {len(allmap)} route-module domains discoverable:")
        for g, m in sorted(allmap.items()):
            print(f"  {g:34} {m}")
        return

    mode = "READ-WRITE (writes DB!)" if args.allow_writes else "read-only (safe)"
    print(f"[lineage] mode: {mode} · attaching DB source listeners …")
    runner = LineageRunner(allow_writes=args.allow_writes)

    jobs = []          # (name, module_path)
    if args.curated:
        jobs = sorted(D.DOMAINS.items())
    elif args.all:
        jobs = sorted(D.discover_all().items())
    elif args.module:
        jobs = [(args.module.split(".")[-1].replace("_", "-"), args.module)]
    elif args.domain:
        if args.domain not in D.DOMAINS:
            print(f"[lineage] unknown domain '{args.domain}'. "
                  f"Known: {', '.join(D.DOMAINS)}")
            sys.exit(2)
        jobs = [(args.domain, D.DOMAINS[args.domain])]
    else:
        jobs = [("stranded-assets", D.DOMAINS["stranded-assets"])]

    grand = {"endpoints": 0, "passed": 0, "failed": 0, "skipped": 0,
             "functions_traced": 0, "sql_statements": 0}
    for name, module_path in jobs:
        print(f"\n[lineage] === {name}  ({module_path}) ===")
        try:
            res = runner.run_domain(name, module_path)
        except Exception as exc:                              # noqa: BLE001
            print(f"[lineage] domain '{name}' crashed: {type(exc).__name__}: {exc}")
            continue
        if res["endpoints"] == 0:
            print("  (no routes in module)")
        for k in grand:
            grand[k] += res.get(k, 0)
        print(f"  -> {res['passed']}/{res['endpoints']} passed · "
              f"{res['functions_traced']} fns traced · "
              f"{res['sql_statements']} SQL")

    print(f"\n[lineage] DONE  endpoints={grand['endpoints']} "
          f"passed={grand['passed']} failed={grand['failed']} "
          f"skipped={grand['skipped']} "
          f"fns={grand['functions_traced']} sql={grand['sql_statements']}")
    print("[lineage] records in backend/lineage_output/  "
          "(open lineage_dashboard/index.html)")


if __name__ == "__main__":
    main()
