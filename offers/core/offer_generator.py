from typing import List, Dict, Any
import random


def generate_offers(potential_destinations: List[str]) -> List[Dict[str, Any]]:
    """Generates mock offers based on potential destinations."""
    offers = []
    for destination in potential_destinations:
        offer_type = random.choice(["Flight + Hotel", "Hotel Only", "Activity Package"])
        discount = random.randint(5, 25)  # 5% to 25% discount
        price = random.randint(300, 2000)

        offers.append(
            {
                "destination": destination,
                "offer_type": offer_type,
                "price_usd": price,
                "discount_percent": discount,
                "description": f"Get {discount}% off on a {offer_type} package to {destination}!",
            }
        )
    return offers
