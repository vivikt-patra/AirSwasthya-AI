from src.aqi_rules import classify_aqi, classify_pm25, get_health_advisory, get_pm25_advisory


def test_classify_aqi_india_ranges():
    assert classify_aqi(50) == "Good"
    assert classify_aqi(100) == "Satisfactory"
    assert classify_aqi(200) == "Moderate"
    assert classify_aqi(300) == "Poor"
    assert classify_aqi(400) == "Very Poor"
    assert classify_aqi(401) == "Severe"


def test_health_advisory_contains_category_and_message():
    advice = get_health_advisory(325)
    assert advice.category == "Very Poor"
    assert advice.risk_level == "Very high"
    assert "Avoid outdoor activity" in advice.message


def test_pm25_advisory_uses_concentration_breakpoints():
    assert classify_pm25(25) == "Good"
    assert classify_pm25(75) == "Moderate"
    assert get_pm25_advisory(130).category == "Very Poor"
