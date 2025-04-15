from datetime import datetime, timedelta

def get_festivals_and_trends() -> dict:
    """Mock fetching festival and seasonal trend data."""
    today = datetime.now()
    return {
        "festivals": [
            {"name": "Oktoberfest", "location": "Munich", "start_date": (today + timedelta(days=60)).strftime('%Y-%m-%d'), "end_date": (today + timedelta(days=75)).strftime('%Y-%m-%d')},
            {"name": "Diwali", "location": "India", "start_date": (today + timedelta(days=100)).strftime('%Y-%m-%d'), "end_date": (today + timedelta(days=105)).strftime('%Y-%m-%d')},
            {"name": "Cherry Blossom Festival", "location": "Kyoto", "start_date": (today + timedelta(days=180)).strftime('%Y-%m-%d'), "end_date": (today + timedelta(days=190)).strftime('%Y-%m-%d')}
        ],
        "seasonal_trends": [
            {"destination": "Alps", "season": "Winter", "type": "Skiing"},
            {"destination": "Mediterranean Coast", "season": "Summer", "type": "Beach"}
        ]
    } 