from fastapi import FastAPI, HTTPException, Query
from typing import List, Dict, Any
from services import user_activity_service, festival_trend_service, traffic_analyzer
from core import rule_engine, offer_generator

app = FastAPI(title="Offers")

@app.get("/offers", response_model=List[Dict[str, Any]])
def get_personalized_offers(user_id: int = Query(..., description="The ID of the user to generate offers for")):
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id parameter is required")

    try:
        user_data = user_activity_service.get_user_activity(user_id)
        trends_data = festival_trend_service.get_festivals_and_trends()
        traffic_data = traffic_analyzer.get_trending_destinations()

        potential_destinations = rule_engine.apply_rules(user_data, trends_data, traffic_data)

        offers = offer_generator.generate_offers(potential_destinations)
        return offers

    except Exception as e:
        print(f"Error for {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error generating offers")

@app.get("/")
def read_root():
    return {"message": "Yo"} 