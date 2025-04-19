from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.database import engine, SessionLocal

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Dependency for DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/api/walllet/{user_id}", response_model=schemas.WalletOut)
def get_wallet(user_id: int, db: Session = Depends(get_db)):
    return crud.get_wallet(db, user_id)

@app.post("/api/walllet/{user_id}/add", response_model=schemas.WalletOut)
def add_points(user_id: int, payment_amount: float, db: Session = Depends(get_db)):
    return crud.add_points(db, user_id, payment_amount)

@app.post("/api/walllet/{user_id}/redeem", response_model=schemas.RedeemResponse)
def redeem_points(user_id: int, points: int, db: Session = Depends(get_db)):
    return crud.redeem_points(db, user_id, points)

@app.post("/api/walllet/{user_id}/use", response_model=schemas.RedeemResponse)
def use_points(user_id: int, points: int, db: Session = Depends(get_db)):
    return crud.redeem_points(db, user_id, points)

@app.post("/api/walllet/{user_id}/voucher", response_model=schemas.VoucherResponse)
def voucher(user_id: int, points: int, db: Session = Depends(get_db)):
    return crud.exchange_for_voucher(db, user_id, points)
