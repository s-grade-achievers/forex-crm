from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.database import engine, SessionLocal

models.Base.metadata.create_all(bind=engine)

app = FastAPI()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/api/wallet/{user_id}", response_model=schemas.WalletOut)
def get_wallet(user_id: int, db: Session = Depends(get_db)):
    try:
        return crud.get_wallet(db, user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/wallet/{user_id}/add", response_model=schemas.WalletOut)
def add_points(user_id: int, payment_amount: float, db: Session = Depends(get_db)):
    if payment_amount <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be positive")
    try:
        return crud.add_points(db, user_id, payment_amount)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/wallet/{user_id}/redeem", response_model=schemas.RedeemResponse)
def redeem_points(user_id: int, points: int, db: Session = Depends(get_db)):
    if points <= 0:
        raise HTTPException(status_code=400, detail="Points must be positive")
    try:
        return crud.redeem_points(db, user_id, points)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
