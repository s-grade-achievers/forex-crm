# --- app.py (updated version for booking_service) ---
from flask import Flask, request, jsonify
from database import SessionLocal, engine
from models import Base, BookingModel
from schemas import BookingCreate, BookingSchema
from sqlalchemy.orm import Session
import requests
from datetime import datetime, timedelta
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})
Base.metadata.create_all(bind=engine)

ROOM_SERVICE_URL = "http://room_service:5000"
LOYALTY_SERVICE_URL = (
    "https://api.forex-crm.local/api/wallet/"  # Added loyalty service URL
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_dates(start_date, end_date):
    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")
    dates = []
    current = start
    while current <= end:
        dates.append(current.strftime("%Y-%m-%d"))
        current += timedelta(days=1)
    return dates


@app.route("/bookings", methods=["POST"])
def create_booking():
    db: Session = next(get_db())
    data = request.get_json()
    booking_data = BookingCreate(**data)
    user_id = booking_data.user_id
    room_id = booking_data.room_id
    start_date = booking_data.start_date.strftime("%Y-%m-%d")
    end_date = booking_data.end_date.strftime("%Y-%m-%d")
    dates = get_dates(start_date, end_date)
    price = booking_data.amount
    # Check availability
    response = requests.get(f"{ROOM_SERVICE_URL}/rooms/{room_id}/availability")
    if response.status_code != 200:
        return jsonify({"error": "Room not found"}), 404
    availability = response.json()
    # for date in dates:
    #     if availability.get(date) != "available":
    #         return jsonify({"error": f"Date {date} is not available"}), 400
    print("here")
    # Book the dates
    book_data = {"dates": dates, "status": "booked"}
    response = requests.post(
        f"{ROOM_SERVICE_URL}/rooms/{room_id}/set_availability", json=book_data
    )
    if response.status_code != 200:
        return jsonify({"error": "Failed to book dates"}), 500
    print("herer")
    # # Create booking
    # booking = BookingModel(**booking_data.dict())
    # db.add(booking)
    # db.commit()
    # db.refresh(booking)

    # Add loyalty points if booking is confirmed
    # if booking.status == "confirmed":
    print("here")
    # Get room pricing (this part depends on how you store/calculate booking price)

    # Add points to user's wallet
    try:
        loyalty_data = {"payment_amount": price}
        response = requests.post(f"{LOYALTY_SERVICE_URL}/{user_id}/add", json=loyalty_data)
        print(response)
    except Exception as e:
        # Log the error but don't fail the booking
        print(f"Error adding loyalty points: {str(e)}")

    return jsonify({"message": "your momma"}), 201


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

    # If status changes to confirmed, add loyalty points
    if old_status != "confirmed" and booking.status == "confirmed":
        room_id = booking.room_id
        start_date = booking.start_date.strftime("%Y-%m-%d")
        end_date = booking.end_date.strftime("%Y-%m-%d")
        dates = get_dates(start_date, end_date)

        # Get room pricing
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
            f"{LOYALTY_SERVICE_URL}/wallets/{booking.user_id}/redeem", json=redeem_data
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
