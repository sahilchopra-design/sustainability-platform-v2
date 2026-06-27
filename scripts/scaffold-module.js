#!/usr/bin/env node
/**
 * scaffold-module.js — generate the full DB-backed vertical skeleton for one module.
 *
 * Emits idiomatic backend + frontend scaffolding that matches existing platform
 * patterns (see backend/api/v1/routes/portfolio_pg.py, backend/alembic/versions/
 * 150_*, backend/db/base.py). The module owner then customizes columns, fills the
 * seed, and wires the page to useModuleData. See docs/MODULE_WORKFLOW.md.
 *
 * Usage:
 *   node scripts/scaffold-module.js <route-path> [--folder <feature-folder>]
 *        [--entity <plural>] [--code <shortcode>] [--revision <id>] [--down <id>]
 *        [--dry-run] [--force]
 *
 * Example:
 *   node scripts/scaffold-module.js /real-estate-carbon-analytics \
 *        --entity properties --code recarb1
 *
 * Existing files are never overwritten unless --force. Use --dry-run to preview.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BE = path.join(ROOT, 'backend');
const FE = path.join(ROOT, 'frontend', 'src');

// ---- args -----------------------------------------------------------------
const argv = process.argv.slice(2);
const opt = (name, def) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : def;
};
const has = (name) => argv.includes(`--${name}`);
const rawRoute = argv.find((a) => !a.startsWith('--'));
if (!rawRoute) {
  console.error('usage: node scripts/scaffold-module.js <route-path> [--entity <plural>] [--code <id>] [--dry-run]');
  process.exit(2);
}
// Git-Bash/MSYS rewrites a leading "/foo" arg into "C:/.../foo"; recover the slug.
function normalizeRoute(raw) {
  let s = raw.replace(/\\/g, '/');
  if (/^[A-Za-z]:\//.test(s) || !s.startsWith('/')) s = s.split('/').pop();
  return '/' + s.replace(/^\//, '');
}
const routePath = normalizeRoute(rawRoute);

const DRY = has('dry-run');
const FORCE = has('force');

// ---- name derivations -----------------------------------------------------
const slug = routePath.replace(/^\//, '');
const folder = opt('folder', slug);
const moduleKey = slug; // useModuleData key === route slug by convention
const snake = slug.replace(/-/g, '_');
const pascal = slug.split('-').map((s) => s[0].toUpperCase() + s.slice(1)).join('');
const entity = opt('entity', 'records');
const entitySnake = entity.replace(/-/g, '_');
const entityPascal = entity.split(/[-_]/).map((s) => s[0].toUpperCase() + s.slice(1)).join('');
const entitySingular = entityPascal.replace(/ies$/, 'y').replace(/sses$/, 'ss').replace(/s$/, '');
const code = opt('code', snake.slice(0, 6).replace(/_/g, ''));
const table = `ep_${code}_${entitySnake}`;
const modelClass = `${pascal}${entitySingular}`;

// ---- alembic revision chain ----------------------------------------------
const versionsDir = path.join(BE, 'alembic', 'versions');
function latestRevision() {
  const files = fs.readdirSync(versionsDir).filter((f) => /^\d+_.*\.py$/.test(f));
  files.sort((a, b) => parseInt(b) - parseInt(a));
  const top = files[0];
  const src = fs.readFileSync(path.join(versionsDir, top), 'utf8');
  const m = src.match(/^revision\s*=\s*['"]([^'"]+)['"]/m);
  const numPrefix = parseInt(top);
  return { rev: m ? m[1] : null, numPrefix, file: top };
}
const latest = latestRevision();
const downRev = opt('down', latest.rev);
const revision = opt('revision', `${code}001`);
const migNum = String(latest.numPrefix + 1).padStart(3, '0');
const migFile = `${migNum}_add_${snake}_tables.py`;

// ---- file templates -------------------------------------------------------
const files = [];
const push = (p, content) => files.push({ p, content });

// 1. Alembic migration
push(path.join(versionsDir, migFile), `"""add ${snake} tables

Revision ID: ${revision}
Revises: ${downRev}
Create Date: (scaffolded)
"""
from alembic import op
import sqlalchemy as sa

revision = '${revision}'
down_revision = '${downRev}'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        '${table}',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('ref', sa.String(), nullable=True),        # external/business key for idempotent seed
        sa.Column('name', sa.String(), nullable=True),
        # TODO(owner): replace the placeholders below with the module's real columns
        sa.Column('category', sa.String(), nullable=True),
        sa.Column('value', sa.Float(), nullable=True),
        sa.Column('payload', sa.JSON(), nullable=True),       # flexible bag for less-queried fields
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('ref', name='uq_${table}_ref'),
    )


def downgrade():
    op.drop_table('${table}')
`);

// 2. SQLAlchemy model
push(path.join(BE, 'db', 'models', `${snake}.py`), `"""SQLAlchemy model for the ${slug} module (table ${table})."""
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from datetime import datetime, timezone

from db.base import Base


class ${modelClass}(Base):
    __tablename__ = "${table}"

    id = Column(Integer, primary_key=True)
    ref = Column(String, unique=True)          # business key for idempotent seed
    name = Column(String)
    category = Column(String)
    value = Column(Float)
    payload = Column(JSON, default=dict)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    def as_dict(self):
        return {
            "id": self.id, "ref": self.ref, "name": self.name,
            "category": self.category, "value": self.value,
            **(self.payload or {}),
        }


# >>> REMEMBER: register this model in backend/db/base.py:init_db():
#     from db.models.${snake} import ${modelClass}  # noqa: F401
`);

// 3. Service / engine
push(path.join(BE, 'services', `${snake}_engine.py`), `"""Business logic for the ${slug} module — single source of truth for calculations."""


class ${pascal}Engine:
    """Stateless calculator. What-if endpoints in the route delegate here so the
    frontend never re-implements a formula."""

    def summarise(self, rows):
        n = len(rows) or 1
        total = sum((r.get("value") or 0) for r in rows)
        return {
            "count": len(rows),
            "total_value": round(total, 4),
            "avg_value": round(total / n, 4),
        }

    # TODO(owner): add the module's real scenario / what-if methods here.
`);

// 4. Route (CRUD + calc)
push(path.join(BE, 'api', 'v1', 'routes', `${snake}.py`), `"""${pascal} API — DB-backed CRUD + calc for the ${slug} module."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from db.base import get_db
from db.models.${snake} import ${modelClass}
from services.${snake}_engine import ${pascal}Engine
from api.dependencies import get_current_user

router = APIRouter(prefix="/api/v1/${moduleKey}", tags=["${moduleKey}"])
_engine = ${pascal}Engine()


class ${entitySingular}In(BaseModel):
    ref: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    value: Optional[float] = None
    payload: Optional[dict] = None


@router.get("/${entitySnake}")
def list_${entitySnake}(db: Session = Depends(get_db)):
    rows = db.query(${modelClass}).order_by(${modelClass}.id).all()
    return [r.as_dict() for r in rows]


@router.get("/${entitySnake}/{row_id}")
def get_one(row_id: int, db: Session = Depends(get_db)):
    r = db.query(${modelClass}).get(row_id)
    if not r:
        raise HTTPException(404, "not found")
    return r.as_dict()


@router.post("/${entitySnake}", status_code=201)
def create_row(body: ${entitySingular}In, db: Session = Depends(get_db), _user=Depends(get_current_user)):
    r = ${modelClass}(**body.dict(exclude_none=True))
    db.add(r); db.commit(); db.refresh(r)
    return r.as_dict()


@router.put("/${entitySnake}/{row_id}")
def update_row(row_id: int, body: ${entitySingular}In, db: Session = Depends(get_db), _user=Depends(get_current_user)):
    r = db.query(${modelClass}).get(row_id)
    if not r:
        raise HTTPException(404, "not found")
    for k, v in body.dict(exclude_none=True).items():
        setattr(r, k, v)
    db.commit(); db.refresh(r)
    return r.as_dict()


@router.delete("/${entitySnake}/{row_id}", status_code=204)
def delete_row(row_id: int, db: Session = Depends(get_db), _user=Depends(get_current_user)):
    r = db.query(${modelClass}).get(row_id)
    if r:
        db.delete(r); db.commit()


@router.get("/summary")
def summary(db: Session = Depends(get_db)):
    rows = [r.as_dict() for r in db.query(${modelClass}).all()]
    return _engine.summarise(rows)
`);

// 5. Seed stub
push(path.join(BE, 'scripts', `seed_${snake}.py`), `"""Idempotent seed for ${table} — ports the module's former hardcoded data.

1. Export the page's hardcoded constant to backend/scripts/data/${snake}.json
   (a JS array of objects). Each object MUST have a stable 'ref' business key.
2. Run:  python backend/scripts/seed_${snake}.py
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.base import SessionLocal
from db.models.${snake} import ${modelClass}

DATA = os.path.join(os.path.dirname(__file__), "data", "${snake}.json")


def run():
    with open(DATA, "r", encoding="utf-8") as f:
        rows = json.load(f)
    db = SessionLocal()
    try:
        for row in rows:
            ref = str(row.get("ref") or row.get("id") or row.get("name"))
            db.query(${modelClass}).filter(${modelClass}.ref == ref).delete()  # idempotent
            known = {"ref", "name", "category", "value"}
            db.add(${modelClass}(
                ref=ref,
                name=row.get("name"),
                category=row.get("category"),
                value=row.get("value"),
                payload={k: v for k, v in row.items() if k not in known},
            ))
        db.commit()
        print(f"[OK] seeded {len(rows)} rows into ${table}")
    finally:
        db.close()


if __name__ == "__main__":
    run()
`);

// 6. Frontend manifest
push(path.join(FE, 'features', folder, 'module.config.js'), `import { lazy } from 'react';

/**
 * Auto-discovered module manifest (see frontend/src/moduleRegistry.auto.js).
 * Keep this file SIDE-EFFECT-FREE — it is eval'd at app startup.
 */
export default {
  path: '${routePath}',
  label: '${pascal.replace(/([A-Z])/g, ' $1').trim()}',
  group: 'Uncategorised',          // TODO(owner): set the real nav group
  icon: '\u{1F4CA}',
  color: '#475569',
  element: lazy(() => import('./pages/${pascal}Page')),  // TODO(owner): match the real page filename
  // guide: { ... }  // TODO(owner): move this module's MODULE_GUIDES entry here
};
`);

// ---- write ----------------------------------------------------------------
console.log(`\nScaffold ${routePath}  (table ${table}, revision ${revision} <- ${downRev})`);
let wrote = 0, skipped = 0;
for (const { p, content } of files) {
  const relp = path.relative(ROOT, p).replace(/\\/g, '/');
  if (fs.existsSync(p) && !FORCE) { console.log(`  skip (exists)  ${relp}`); skipped++; continue; }
  if (DRY) { console.log(`  would write    ${relp}`); continue; }
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
  console.log(`  wrote          ${relp}`);
  wrote++;
}
console.log(`\n  ${DRY ? '(dry run) ' : ''}${wrote} written, ${skipped} skipped`);
console.log(`  NEXT: add to backend/db/base.py:init_db():  from db.models.${snake} import ${modelClass}`);
console.log(`        fill backend/scripts/data/${snake}.json, run the seed, then wire the page to useModuleData('${moduleKey}', '${entitySnake}').\n`);
