import random

def get_trending_destinations() -> dict:
    """Mock fetching trending destinations based on traffic spikes."""
    destinations = ["Paris", "Tokyo", "Maldives", "Rome", "New York", "Kyoto", "Bali"]
    trending = random.sample(destinations, k=3)
    return {"trending_destinations": trending} 