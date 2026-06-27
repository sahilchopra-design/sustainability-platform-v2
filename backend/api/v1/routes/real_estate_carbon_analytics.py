"""RealEstateCarbonAnalytics API — DB-backed CRUD + calc for the real-estate-carbon-analytics module."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from db.base import get_db
from db.models.real_estate_carbon_analytics import RealEstateCarbonAnalyticsProperty
from services.real_estate_carbon_analytics_engine import RealEstateCarbonAnalyticsEngine
from api.dependencies import get_current_user

router = APIRouter(prefix="/api/v1/real-estate-carbon-analytics", tags=["real-estate-carbon-analytics"])
_engine = RealEstateCarbonAnalyticsEngine()


class PropertieIn(BaseModel):
    ref: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    value: Optional[float] = None
    payload: Optional[dict] = None


@router.get("/properties")
def list_properties(db: Session = Depends(get_db)):
    rows = db.query(RealEstateCarbonAnalyticsProperty).order_by(RealEstateCarbonAnalyticsProperty.id).all()
    return [r.as_dict() for r in rows]


@router.get("/properties/{row_id}")
def get_one(row_id: int, db: Session = Depends(get_db)):
    r = db.query(RealEstateCarbonAnalyticsProperty).get(row_id)
    if not r:
        raise HTTPException(404, "not found")
    return r.as_dict()


@router.post("/properties", status_code=201)
def create_row(body: PropertieIn, db: Session = Depends(get_db), _user=Depends(get_current_user)):
    r = RealEstateCarbonAnalyticsProperty(**body.dict(exclude_none=True))
    db.add(r); db.commit(); db.refresh(r)
    return r.as_dict()


@router.put("/properties/{row_id}")
def update_row(row_id: int, body: PropertieIn, db: Session = Depends(get_db), _user=Depends(get_current_user)):
    r = db.query(RealEstateCarbonAnalyticsProperty).get(row_id)
    if not r:
        raise HTTPException(404, "not found")
    for k, v in body.dict(exclude_none=True).items():
        setattr(r, k, v)
    db.commit(); db.refresh(r)
    return r.as_dict()


@router.delete("/properties/{row_id}", status_code=204)
def delete_row(row_id: int, db: Session = Depends(get_db), _user=Depends(get_current_user)):
    r = db.query(RealEstateCarbonAnalyticsProperty).get(row_id)
    if r:
        db.delete(r); db.commit()


@router.get("/summary")
def summary(db: Session = Depends(get_db)):
    rows = [r.as_dict() for r in db.query(RealEstateCarbonAnalyticsProperty).all()]
    return _engine.summarise(rows)
