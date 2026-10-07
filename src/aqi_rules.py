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


def get_health_advisory(aqi: float, demographic: str = "general_public") -> AQIAdvice:
    """Return a health-risk advisory for a predicted AQI value and target demographic group."""

    category = classify_aqi(aqi)
    return _advisory_for_category(category, demographic=demographic)


def get_pm25_advisory(pm25: float, demographic: str = "general_public") -> AQIAdvice:
    """Return health advice for a predicted 24-hour PM2.5 concentration and target demographic group."""

    category = classify_pm25(pm25)
    return _advisory_for_category(category, demographic=demographic)


def _advisory_for_category(category: str, demographic: str = "general_public") -> AQIAdvice:
    """Map a pollution category to demographic-tailored health advice."""

    demographic_messages = {
        "general_public": {
            "Good": "Air quality is safe for normal outdoor activity.",
            "Satisfactory": "Air quality is acceptable for most people.",
            "Moderate": "Air quality is fair. Unusually sensitive people should take breaks.",
            "Poor": "Wear an N95 mask outdoors and limit prolonged physical exertion.",
            "Very Poor": "Avoid non-essential outdoor travel and keep indoor spaces ventilated with clean air.",
            "Severe": "Emergency air pollution levels: Stay indoors and avoid outdoor activity entirely.",
        },
        "asthmatic_respiratory": {
            "Good": "Safe for outdoor exercise. Keep standard quick-relief inhaler handy.",
            "Satisfactory": "Minor irritants possible. Monitor wheezing or shortness of breath.",
            "Moderate": "Increased asthma risk. Reduce prolonged outdoor exercise and stay indoors if coughing.",
            "Poor": "High bronchospasm risk. Wear an N95 mask, keep rescue inhaler ready, and avoid outdoor sports.",
            "Very Poor": "Dangerous for respiratory patients. Remain indoors in filtered air; seek medical aid if dyspnea worsens.",
            "Severe": "Severe medical alert for asthma/COPD: Stay indoors with air purifier, keep oxygen/medication ready.",
        },
        "children_elderly": {
            "Good": "Safe for children playground activities and senior morning walks.",
            "Satisfactory": "Good for outdoor play. Ensure children stay hydrated.",
            "Moderate": "Limit heavy strenuous outdoor games for school children and long walks for seniors.",
            "Poor": "Restrict outdoor recess for school children; seniors should stay indoors during morning peak pollution.",
            "Very Poor": "Keep children and elderly indoors entirely. Suspend outdoor school activities.",
            "Severe": "Critical vulnerability zone: Children and seniors must stay indoors with doors/windows closed.",
        },
        "outdoor_workers": {
            "Good": "Safe for full-shift outdoor physical work.",
            "Satisfactory": "Standard working conditions. Take normal hydration breaks.",
            "Moderate": "Take frequent shaded rest breaks during continuous manual labor.",
            "Poor": "Mandatory N95 mask requirement for construction, agricultural, and transport workers.",
            "Very Poor": "Reduce physical workload intensity; rotate shift hours to avoid peak pollution windows.",
            "Severe": "Halt heavy outdoor physical construction/labor where possible or enforce strict respiratory gear.",
        },
    }

    group = demographic if demographic in demographic_messages else "general_public"
    message_map = demographic_messages[group]

    risk_levels = {
        "Good": "Low",
        "Satisfactory": "Low to mild",
        "Moderate": "Moderate",
        "Poor": "High",
        "Very Poor": "Very high",
        "Severe": "Emergency",
    }

    colors = {
        "Good": "#2E7D32",
        "Satisfactory": "#66A80F",
        "Moderate": "#F9A825",
        "Poor": "#EF6C00",
        "Very Poor": "#C62828",
        "Severe": "#6A1B9A",
    }

    return AQIAdvice(
        category=category,
        risk_level=risk_levels[category],
        message=message_map[category],
        color=colors[category],
    )

