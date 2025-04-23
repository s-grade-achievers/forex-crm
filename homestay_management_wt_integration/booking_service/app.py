# --- app.py (updated version for booking_service) ---
from flask import Flask, request, jsonify

# from database import SessionLocal, engine
from models import BookingModel
from schemas import BookingCreate, BookingSchema
from sqlalchemy.orm import Session
import requests
from datetime import datetime, timedelta
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})
# Base.metadata.create_all(bind=engine)

ROOM_SERVICE_URL = "http://room_service:5000"
LOYALTY_SERVICE_URL = (
    "http://loyalty-service:8001/api/wallet/"  # Added loyalty service URL
)


def get_dates(start_date, end_date):
    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")
    dates = []
    current = start
    while current <= end:
        dates.append(current.strftime("%Y-%m-%d"))
        current += timedelta(days=1)
    return dates


@app.route("/api/bookings", methods=["POST"])
def create_booking():
    data = request.get_json()
    booking_data = BookingCreate(**data)
    user_id = booking_data.user_id
    room_id = booking_data.room_id
    start_date = booking_data.start_date.strftime("%Y-%m-%d")
    end_date = booking_data.end_date.strftime("%Y-%m-%d")
    dates = get_dates(start_date, end_date)
    price = float(booking_data.amount)
    print("herer")

    print("here")

    try:
        loyalty_data = {"payment_amount": price}
        print(loyalty_data)
        response = requests.post(
            f"{LOYALTY_SERVICE_URL}{user_id}/add", params={"payment_amount": price}
        )
        response = requests.get(f"{LOYALTY_SERVICE_URL}{user_id}")
        return jsonify(response.json()), 201
    except Exception as e:
        print(f"Error adding loyalty points: {str(e)}")
        return jsonify({"error": "Failed to add loyalty points"}), 500


@app.route("/bookings/<int:id>", methods=["GET"])
def get_booking(id):
    db: Session = next(get_db())
    booking = db.query(BookingModel).filter(BookingModel.id == id).first()
    if not booking:
        return jsonify({"error": "Booking not found"}), 404
    return jsonify(BookingSchema.from_orm(booking).dict())


@app.route("/bookings/<int:id>", methods=["PUT"])
def update_booking(id):
    db: Session = next(get_db())
    booking = db.query(BookingModel).filter(BookingModel.id == id).first()
    if not booking:
        return jsonify({"error": "Booking not found"}), 404

    old_status = booking.status

    data = request.get_json()
    for key, value in data.items():
        setattr(booking, key, value)

    if old_status != "confirmed" and booking.status == "confirmed":
        room_id = booking.room_id
        start_date = booking.start_date.strftime("%Y-%m-%d")
        end_date = booking.end_date.strftime("%Y-%m-%d")
        dates = get_dates(start_date, end_date)

        room_response = requests.get(f"{ROOM_SERVICE_URL}/rooms/{room_id}")
        if room_response.status_code == 200:
            room_data = room_response.json()
            pricing = room_data.get("pricing", 0)
            booking_days = len(dates)
            total_payment = pricing * booking_days

            # Add points to user's wallet
            try:
                loyalty_data = {"payment_amount": total_payment}
                requests.post(
                    f"{LOYALTY_SERVICE_URL}/wallets/{booking.user_id}/add",
                    json=loyalty_data,
                )
            except Exception as e:
                # Log the error but don't fail the booking update
                print(f"Error adding loyalty points: {str(e)}")

    if data.get("status") == "canceled":
        start_date = booking.start_date.strftime("%Y-%m-%d")
        end_date = booking.end_date.strftime("%Y-%m-%d")
        dates = get_dates(start_date, end_date)
        free_data = {"dates": dates, "status": "available"}
        requests.post(
            f"{ROOM_SERVICE_URL}/rooms/{booking.room_id}/set_availability",
            json=free_data,
        )

    db.commit()
    return jsonify(BookingSchema.from_orm(booking).dict())


@app.route("/bookings", methods=["GET"])
def get_bookings():
    db: Session = next(get_db())
    user_id = request.args.get("user_id")
    if user_id:
        bookings = (
            db.query(BookingModel).filter(BookingModel.user_id == int(user_id)).all()
        )
    else:
        bookings = db.query(BookingModel).all()
    return jsonify([BookingSchema.from_orm(b).dict() for b in bookings])


# New endpoint to redeem points during booking
@app.route("/bookings/<int:id>/use-points", methods=["POST"])
def use_points_for_booking(id):
    db: Session = next(get_db())
    booking = db.query(BookingModel).filter(BookingModel.id == id).first()
    if not booking:
        return jsonify({"error": "Booking not found"}), 404

    data = request.get_json()
    points_to_use = data.get("points", 0)

    # Try to redeem points
    try:
        redeem_data = {"points": points_to_use}
        response = requests.post(
            f"{LOYALTY_SERVICE_URL}/wallets/{booking.user_id}/redeem",
            verify=False,
            json=redeem_data,
        )

        if response.status_code != 200:
            return jsonify({"error": "Failed to redeem points"}), 400

        # If successful, update booking with discount info
        discount_info = response.json()
        # You might want to add a field to your booking model to track discounts
        # For now, we'll just return the discount info

        result = {
            "booking": BookingSchema.from_orm(booking).dict(),
            "discount": discount_info,
        }
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": f"Error redeeming points: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
