"""Public reference-data API (generic Tier-1 layer).

Distinct from the curated reference_data.py (IRENA/CRREM/grid EFs) — this serves
the source-agnostic store (reference_data_sources / _points / _records) that the
backend/scripts/ingest/ ingesters populate from free authoritative datasets.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import distinct
from typing import Optional

from db.base import get_db
from db.models.reference_data import ReferenceDataSource, ReferenceDataPoint, ReferenceDataRecord

router = APIRouter(prefix="/api/v1/refdata", tags=["reference-data-public"])


@router.get("/sources")
def list_sources(db: Session = Depends(get_db)):
    """The registry — which authoritative datasets are loaded, with provider/license/row counts."""
    return [s.as_dict() for s in db.query(ReferenceDataSource).order_by(ReferenceDataSource.source_key).all()]


@router.get("/{source_key}/metrics")
def list_metrics(source_key: str, db: Session = Depends(get_db)):
    """Distinct metrics available for a points-shaped source."""
    rows = db.query(distinct(ReferenceDataPoint.metric)).filter(ReferenceDataPoint.source_key == source_key).all()
    return sorted(m[0] for m in rows if m[0])


@router.get("/{source_key}/points")
def get_points(
    source_key: str,
    metric: Optional[str] = None,
    entity: Optional[str] = Query(None, description="entity_code, e.g. ISO3 USA"),
    year: Optional[int] = None,
    year_from: Optional[int] = None,
    limit: int = 5000,
    db: Session = Depends(get_db),
):
    """Query the long-format points for a source (filterable by metric/entity/year)."""
    q = db.query(ReferenceDataPoint).filter(ReferenceDataPoint.source_key == source_key)
    if metric:
        q = q.filter(ReferenceDataPoint.metric == metric)
    if entity:
        q = q.filter(ReferenceDataPoint.entity_code == entity)
    if year is not None:
        q = q.filter(ReferenceDataPoint.year == year)
    if year_from is not None:
        q = q.filter(ReferenceDataPoint.year >= year_from)
    rows = q.order_by(ReferenceDataPoint.entity_code, ReferenceDataPoint.year).limit(min(limit, 50000)).all()
    return [r.as_dict() for r in rows]


@router.get("/{source_key}/records")
def get_records(
    source_key: str,
    category: Optional[str] = None,
    country: Optional[str] = None,
    limit: int = 2000,
    db: Session = Depends(get_db),
):
    """Query the entity-catalogue records for a source (SBTi companies, Verra projects, ...)."""
    q = db.query(ReferenceDataRecord).filter(ReferenceDataRecord.source_key == source_key)
    if category:
        q = q.filter(ReferenceDataRecord.category == category)
    if country:
        q = q.filter(ReferenceDataRecord.country == country)
    return [r.as_dict() for r in q.limit(min(limit, 20000)).all()]
