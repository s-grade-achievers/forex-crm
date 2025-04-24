import sqlite3


def get_user_activity(user_id: int) -> dict:
    """Fetch user activity data from wallet.db SQLite database."""

    conn = sqlite3.connect("wallet.db")
    cursor = conn.cursor()

    # Join wallets and user_activity
    cursor.execute(
        """
        SELECT w.points, ua.email, ua.browsed_destinations, ua.wishlist, ua.past_bookings
        FROM wallets w
        JOIN user_activity ua ON w.user_id = ua.user_id
        WHERE w.user_id = ?
    """,
        (user_id,),
    )

    row = cursor.fetchone()
    conn.close()

    if not row:
        raise ValueError(f"User with ID {user_id} not found in wallet.db.")

    points, email, browsed, wishlist, bookings = row

    return {
        "email": email,
        "loyalty_points": points,
        "browsed_destinations": browsed.split(",") if browsed else [],
        "wishlist": wishlist.split(",") if wishlist else [],
        "past_bookings": bookings.split(",") if bookings else [],
    }
