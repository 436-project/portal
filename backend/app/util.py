from datetime import datetime, timedelta
import pytz


# Function Purpose: processes the data from the SerpAPI
# Ensures that the duration time can be calculated with, and determine if a flight is classified as a "Red-Eye"
def normalize_flight_data(flight_data, departure_id, arrival_id):
    processed_data = []

    # Define the GMT and EST timezones
    gmt = pytz.timezone("GMT")
    est = pytz.timezone("US/Eastern")

    if "best_flights" in flight_data:
        for best_flight in flight_data["best_flights"]:
            for flight in best_flight["flights"]:
                # Adjust the time, because it is coming from a string!!
                departure_time = datetime.strptime(
                    flight["departure_airport"]["time"], "%Y-%m-%d %H:%M"
                ).replace(tzinfo=gmt)
                arrival_time = datetime.strptime(
                    flight["arrival_airport"]["time"], "%Y-%m-%d %H:%M"
                ).replace(tzinfo=gmt)

                # Convert times to EST
                departure_time_est = departure_time.astimezone(est)
                arrival_time_est = arrival_time.astimezone(est)

                # Fix for overnight flights
                if arrival_time_est < departure_time_est:
                    arrival_time_est += timedelta(days=1)

                duration = (arrival_time_est - departure_time_est).total_seconds() / 60

                is_redeye = departure_time_est.hour >= 0 and departure_time_est.hour < 4

                departure_airport_id = flight["departure_airport"]["id"]
                arrival_airport_id = flight["arrival_airport"]["id"]

                # check if departure and arrival match input, if not skip
                if (
                    departure_airport_id != departure_id
                    or arrival_airport_id != arrival_id
                ):
                    continue

                processed_data.append(
                    {
                        "departure_airport": flight["departure_airport"]["name"],
                        "arrival_airport": flight["arrival_airport"]["name"],
                        "departure_time": departure_time_est,
                        "arrival_time": arrival_time_est,
                        "duration": duration,
                        "airline": flight["airline"],
                        "airline_logo": flight["airline_logo"],
                        "flight_number": flight["flight_number"],
                        "cost": best_flight["price"],
                        "currency": flight_data["search_parameters"]["currency"],
                        "is_redeye": is_redeye,
                    }
                )

    return processed_data


# Calculate the scores using the user's inputted preferences and the flights' comparsion with the average calculated cost and duration
def calculate_scores(flights, preferences):
    cost_preference, duration_preference, redeye_preference = (
        preferences["cost_preference"],
        preferences["duration_preference"],
        preferences["redeye_preference"],
    )
    avg_cost = sum(flight["cost"] for flight in flights) / len(flights)
    avg_duration = sum(flight["duration"] for flight in flights) / len(flights)

    for flight in flights:
        bin_scores = []
        score = 0
        # Determine cost preference score
        if flight["cost"] > avg_cost:
            bin_scores.append(-1)
            score += -1 * cost_preference
        else:
            bin_scores.append(1)
            score += 1 * cost_preference

        # Determine duration preference score
        if flight["duration"] > avg_duration:
            bin_scores.append(-1)
            score += -1 * duration_preference
        else:
            bin_scores.append(1)
            score += 1 * duration_preference

        # Determine redeye_preference
        if flight["is_redeye"]:
            bin_scores.append(-1)
            score += -1 * redeye_preference
        else:
            bin_scores.append(1)
            score += 1 * redeye_preference

        flight["bin_score"] = bin_scores

        #The score will added 15, and its out of 30 now, mulitplied by 100. 
        flight["score"] = ((score+15)/30)*100

    return {"flights": flights, "avg_cost": avg_cost, "avg_duration": avg_duration}
