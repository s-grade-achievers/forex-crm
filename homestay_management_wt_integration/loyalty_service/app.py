from flask import Flask, request, jsonify
from database import SessionLocal, engine
from models import Base, Wallet
from schemas import WalletSchema, RedeemSchema, VoucherSchema
from sqlalchemy.orm import Session
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.route('/wallets/<int:user_id>', methods=['GET'])
def get_wallet(user_id):
    db: Session = next(get_db())
    wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
    if not wallet:
        wallet = Wallet(user_id=user_id, points=0)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    return jsonify(WalletSchema.from_orm(wallet).dict())

@app.route('/wallets/<int:user_id>/add', methods=['POST'])
def add_points(user_id):
    db: Session = next(get_db())
    data = request.get_json()
    payment_amount = data.get('payment_amount', 0)
    
    wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
    if not wallet:
        wallet = Wallet(user_id=user_id, points=0)
        db.add(wallet)
    
    earned = int(payment_amount * 0.1)  # 10% back as points
    wallet.points += earned
    db.commit()
    db.refresh(wallet)
    
    return jsonify(WalletSchema.from_orm(wallet).dict())

@app.route('/wallets/<int:user_id>/redeem', methods=['POST'])
def redeem_points(user_id):
    db: Session = next(get_db())
    data = request.get_json()
    points_to_redeem = data.get('points', 0)
    
    wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
    if not wallet:
        return jsonify({"error": "Wallet not found"}), 404
    
    if wallet.points < points_to_redeem:
        return jsonify({"error": "Insufficient points"}), 400
    
    wallet.points -= points_to_redeem
    db.commit()
    
    return jsonify({
        "user_id": user_id,
        "redeemed": points_to_redeem,
        "money": points_to_redeem * 0.1
    })

@app.route('/wallets/<int:user_id>/voucher', methods=['POST'])
def exchange_for_voucher(user_id):
    db: Session = next(get_db())
    data = request.get_json()
    points_to_exchange = data.get('points', 0)
    
    wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
    if not wallet:
        return jsonify({"error": "Wallet not found"}), 404
    
    if wallet.points < points_to_exchange:
        return jsonify({"error": "Insufficient points"}), 400
    
    wallet.points -= points_to_exchange
    db.commit()
    
    return jsonify({
        "user_id": user_id,
        "voucher_code": f"VOUCHER{user_id}{points_to_exchange}"
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)