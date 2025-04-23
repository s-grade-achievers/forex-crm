import sqlite3


def migrate_wallet_db():
    conn = sqlite3.connect("wallet.db")
    cursor = conn.cursor()

    # Create user_activity table if not exists
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS user_activity (
            user_id INTEGER PRIMARY KEY,
            email TEXT,
            browsed_destinations TEXT,
            wishlist TEXT,
            past_bookings TEXT,
            FOREIGN KEY (user_id) REFERENCES wallets(user_id)
        );
    """
    )

    # Sync user_id from wallets table
    cursor.execute(
        """
        INSERT OR IGNORE INTO user_activity (user_id, email, browsed_destinations, wishlist, past_bookings)
        SELECT user_id, '', '', '', '' FROM wallets;
    """
    )

    # Insert mock activity for specific users
    mock_data = {
        1: {
            "email": "siddhizanwar03@gmail.com",
            "browsed_destinations": "Paris,Tokyo",
            "wishlist": "Maldives,Kyoto",
            "past_bookings": "Berlin",
        },
        2: {
            "email": "siddhizanwar03@gmail.com",
            "browsed_destinations": "London,Rome",
            "wishlist": "",
            "past_bookings": "Sydney",
        },
        3: {
            "email": "siddhizanwar03@gmail.com",
            "browsed_destinations": "New York,Tokyo",
            "wishlist": "Maldives",
            "past_bookings": "Barcelona",
        },
        4: {
            "email": "siddhizanwar03@gmail.com",
            "browsed_destinations": "Paris",
            "wishlist": "Kyoto",
            "past_bookings": "Berlin",
        },
    }

    for user_id, data in mock_data.items():
        cursor.execute(
            """
            UPDATE user_activity
            SET email = ?, browsed_destinations = ?, wishlist = ?, past_bookings = ?
            WHERE user_id = ?
        """,
            (
                data["email"],
                data["browsed_destinations"],
                data["wishlist"],
                data["past_bookings"],
                user_id,
            ),
        )

    conn.commit()
    conn.close()
    print(
        "Migration complete: user_activity table created, synced, and mock data inserted."
    )


if __name__ == "__main__":
    migrate_wallet_db()
