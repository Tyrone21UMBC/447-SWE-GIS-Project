from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import Bmp, User
from schema import BmpCreate, BmpResponse
from security import require_admin

router = APIRouter(
    prefix="/bmps",
    tags=["BMPs"]
)


def to_response(bmp: Bmp) -> BmpResponse:
    return BmpResponse(
        id=bmp.id,
        tracking_number=bmp.tracking_number,
        name=bmp.name,
        facility_type=bmp.facility_type,
        sf_number=bmp.sf_number,
        outfall_point=bmp.outfall_point,
        drainage_area=bmp.drainage_area,
        in_service=bmp.in_service,
        lat=bmp.lat,
        lon=bmp.lon,
        created_by=bmp.creator.username if bmp.creator else None,
        created_at=bmp.created_at,
    )


# Public, like the map that shows them
@router.get("", response_model=list[BmpResponse])
def list_bmps(db: Session = Depends(get_db)):
    bmps = db.query(Bmp).options(joinedload(Bmp.creator)).order_by(Bmp.tracking_number).all()
    return [to_response(b) for b in bmps]


@router.post("", response_model=BmpResponse, status_code=201)
def create_bmp(
    new_bmp: BmpCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    bmp = Bmp(**new_bmp.model_dump(), created_by=admin.id)
    db.add(bmp)
    try:
        db.commit()
    except IntegrityError:   # the unique tracking number, also when two admins add it at once
        db.rollback()
        raise HTTPException(status_code=409, detail=f"A BMP with ID {new_bmp.tracking_number} already exists")
    db.refresh(bmp)
    return to_response(bmp)


# Only BMPs added in the app; the geodatabase ones aren't stored here
@router.delete("/{bmp_id}", status_code=204)
def delete_bmp(
    bmp_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    bmp = db.get(Bmp, bmp_id)
    if not bmp:
        raise HTTPException(status_code=404, detail="BMP not found")
    db.delete(bmp)
    db.commit()
