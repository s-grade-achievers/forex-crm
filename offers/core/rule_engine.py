from typing import List, Dict, Any


def apply_rules(
    user_data: Dict[str, Any], trends_data: Dict[str, Any], traffic_data: Dict[str, Any]
) -> List[str]:
    """Applies rules to generate potential offer destinations."""
    potential_destinations = set()

    # Add destinations from wishlist
    potential_destinations.update(user_data.get("wishlist", []))

    # Add browsed destinations if they are also trending
    browsed = set(user_data.get("browsed_destinations", []))
    trending = set(traffic_data.get("trending_destinations", []))
    potential_destinations.update(browsed.intersection(trending))

    # Add festival locations based on user ka history
    # (Simplified. just add all festival locations for now)
    for festival in trends_data.get("festivals", []):
        potential_destinations.add(festival["location"])

    # Add trending destinations not already included
    potential_destinations.update(trending)

    # Add destinations based on seasonal trends (Simplified)
    for trend in trends_data.get("seasonal_trends", []):
        potential_destinations.add(trend["destination"])

    # Limit the number
    return list(potential_destinations)[:5]
