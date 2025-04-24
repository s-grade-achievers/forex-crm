from sqlalchemy.orm import Session
from app import models
from fastapi import HTTPException


def get_wallet(db: Session, user_id: int):
    try:
        wallet = db.query(models.Wallet).filter(models.Wallet.user_id == user_id).first()
        if not wallet:
            wallet = models.Wallet(user_id=user_id, points=0)
            db.add(wallet)
            db.commit()
            db.refresh(wallet)
        return wallet
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def add_points(db: Session, user_id: int, payment_amount: float):
    try:
        wallet = get_wallet(db, user_id)
        earned = int(payment_amount * 0.1)  # 10% back
        wallet.points += earned
        db.commit()
        db.refresh(wallet)
        return wallet
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to add points: {str(e)}")


def redeem_points(db: Session, user_id: int, points: int):
    try:
        wallet = get_wallet(db, user_id)
        if wallet.points < points:
            raise HTTPException(status_code=400, detail="Insufficient points")
        wallet.points -= points
        db.commit()
        db.refresh(wallet)
        return {"user_id": user_id, "redeemed": points, "money": points * 0.1}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to redeem points: {str(e)}")