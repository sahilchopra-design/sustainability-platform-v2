#!/usr/bin/env bash
# module-worktree.sh — create an isolated git worktree + branch for one module.
#
# Each teammate works on one module in its own worktree so parallel work never
# shares a working tree. Combined with the auto-discovery layer, two worktrees
# edit disjoint files (see docs/MODULE_WORKFLOW.md).
#
# Usage:
#   bash scripts/module-worktree.sh /real-estate-carbon-analytics <assignee>
#
# Creates ../ra-worktrees/<slug> on branch module/<slug> off remediation-v1.
set -euo pipefail

ROUTE="${1:-}"
ASSIGNEE="${2:-unassigned}"
BASE_BRANCH="${BASE_BRANCH:-remediation-v1}"

if [ -z "$ROUTE" ]; then
  echo "usage: bash scripts/module-worktree.sh <route-path> <assignee>" >&2
  exit 2
fi

# Git-Bash/MSYS may rewrite a leading "/foo" arg into "C:/.../foo"; basename recovers the slug.
SLUG="$(basename "$ROUTE")"
BRANCH="module/${SLUG}"
REPO_ROOT="$(git rev-parse --show-toplevel)"
WORKTREE_DIR="$(dirname "$REPO_ROOT")/ra-worktrees/${SLUG}"

if git show-ref --verify --quiet "refs/heads/${BRANCH}"; then
  echo "branch ${BRANCH} already exists — reusing it" >&2
  git worktree add "$WORKTREE_DIR" "$BRANCH"
else
  git fetch origin "$BASE_BRANCH" --quiet || true
  git worktree add "$WORKTREE_DIR" -b "$BRANCH" "$BASE_BRANCH"
fi

cat <<EOF

✓ worktree ready
  module : ${ROUTE}
  owner  : ${ASSIGNEE}
  branch : ${BRANCH}
  path   : ${WORKTREE_DIR}

next:
  cd "${WORKTREE_DIR}"
  node scripts/scaffold-module.js ${ROUTE} --entity <plural> --code <id>
  # ...refine, then:
  node scripts/validate-module.js ${ROUTE} --build

record the branch + your claimed Alembic revision id in /admin -> Refinement Board.
when merged:  git worktree remove "${WORKTREE_DIR}"
EOF
