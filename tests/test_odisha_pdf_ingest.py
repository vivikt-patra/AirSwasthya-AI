import pandas as pd

from src.odisha_pdf_ingest import _parse_aqi, _parse_prominent_pollutant, _to_float, target_area_readiness


def test_pdf_value_parsing_handles_bdl_and_prominent_pollutants():
    assert _to_float("BDL") is None
    assert _to_float(" 93(PM ) 2.5") == 93
    assert _parse_aqi("65(PM ) 10") == 65
    assert _parse_prominent_pollutant("93(PM ) 2.5") == "PM2.5"
    assert _parse_prominent_pollutant("65(PM ) 10") == "PM10"


def test_target_area_readiness_uses_rayagada_proxy_for_gunupur():
    df = pd.DataFrame(
        {
            "date": ["2026-01-01", "2026-01-01", "2026-01-01"],
            "district": ["Koraput", "Nawarangapur", "Rayagada"],
            "pm25": [27, 37, 46],
        }
    )

    readiness = target_area_readiness(df)
    gunupur = readiness[readiness["area"] == "Gunupur"].iloc[0]

    assert gunupur["direct_ospcb_rows"] == 0
    assert gunupur["proxy_district"] == "Rayagada"
    assert gunupur["proxy_rows"] == 1
