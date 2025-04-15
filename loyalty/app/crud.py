from sqlalchemy.orm import Session
from app import models

def get_wallet(db: Session, user_id: int):
    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == user_id).first()
    if not wallet:
        wallet = models.Wallet(user_id=user_id, points=0)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    return wallet

def add_points(db: Session, user_id: int, payment_amount: float):
    wallet = get_wallet(db, user_id)
    earned = int(payment_amount * 0.1)  # 10% back
    wallet.points += earned
    db.commit()
    db.refresh(wallet)
    return wallet

def redeem_points(db: Session, user_id: int, points: int):
    wallet = get_wallet(db, user_id)
    if wallet.points >= points:
        wallet.points -= points
        db.commit()
        db.refresh(wallet)
        return {"user_id": user_id, "redeemed": points, "money": points * 0.1}
    else:
        raise Exception("Insufficient points")

def exchange_for_voucher(db: Session, user_id: int, points: int):
    wallet = get_wallet(db, user_id)
    if wallet.points >= points:
        wallet.points -= points
        db.commit()
        db.refresh(wallet)
        return {
            "user_id": user_id,
            "voucher_code": f"VOUCHER{user_id}{points}"
        }
    else:
        raise Exception("Insufficient points")
