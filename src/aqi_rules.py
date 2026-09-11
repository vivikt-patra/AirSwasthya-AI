"""AQI category and health advisory rules for AirSwasthya AI.

The thresholds follow the standard India AQI category ranges commonly used by
CPCB-style AQI communication. Keeping this logic separate makes the advisory
easy to explain during review.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class AQIAdvice:
    """Readable result returned after converting AQI into user advice."""

    category: str
    risk_level: str
    message: str
    color: str


def classify_aqi(aqi: float) -> str:
    """Return the India AQI category for a numeric AQI value."""

    if aqi <= 50:
        return "Good"
    if aqi <= 100:
        return "Satisfactory"
    if aqi <= 200:
        return "Moderate"
    if aqi <= 300:
        return "Poor"
    if aqi <= 400:
        return "Very Poor"
    return "Severe"


def classify_pm25(pm25: float) -> str:
    """Return a CPCB-style category for 24-hour PM2.5 concentration."""

    if pm25 <= 30:
        return "Good"
    if pm25 <= 60:
        return "Satisfactory"
    if pm25 <= 90:
        return "Moderate"
    if pm25 <= 120:
        return "Poor"
    if pm25 <= 250:
        return "Very Poor"
    return "Severe"


def get_health_advisory(aqi: float) -> AQIAdvice:
    """Return a simple health-risk advisory for a predicted AQI value."""

    category = classify_aqi(aqi)
    return _advisory_for_category(category)


def get_pm25_advisory(pm25: float) -> AQIAdvice:
    """Return health advice for a predicted 24-hour PM2.5 concentration."""

    category = classify_pm25(pm25)
    return _advisory_for_category(category)


def _advisory_for_category(category: str) -> AQIAdvice:
    """Map a pollution category to review-friendly health advice."""

    advisory_map = {
        "Good": AQIAdvice(
            category="Good",
            risk_level="Low",
            message="Air quality is safe for normal outdoor activity.",
            color="#2E7D32",
        ),
        "Satisfactory": AQIAdvice(
            category="Satisfactory",
            risk_level="Low to mild",
            message="Air quality is acceptable. Sensitive people may monitor symptoms.",
            color="#66A80F",
        ),
        "Moderate": AQIAdvice(
            category="Moderate",
            risk_level="Moderate",
            message="Sensitive groups should reduce long outdoor activity.",
            color="#F9A825",
        ),
        "Poor": AQIAdvice(
            category="Poor",
            risk_level="High",
            message="Wear a mask outdoors and reduce prolonged exposure.",
            color="#EF6C00",
        ),
        "Very Poor": AQIAdvice(
            category="Very Poor",
            risk_level="Very high",
            message="Avoid outdoor activity where possible, especially for sensitive groups.",
            color="#C62828",
        ),
        "Severe": AQIAdvice(
            category="Severe",
            risk_level="Emergency",
            message="Avoid outdoor activity and follow local health advisories.",
            color="#6A1B9A",
        ),
    }

    return advisory_map[category]
