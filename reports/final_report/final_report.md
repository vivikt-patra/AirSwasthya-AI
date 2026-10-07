# AirSwasthya AI: Academic Project Report

**Title:** AirSwasthya AI: Explainable AQI Forecasting and Health-Risk Advisory System for Urban & Rural Safety  
**Course:** 3rd Semester CSE AI/ML Minor Project  
**Institution:** GIET University, Gunupur, Odisha  
**Repository:** [github.com/vivikt-patra/AirSwasthya-AI](https://github.com/vivikt-patra/AirSwasthya-AI)  
**Target Region:** Priority Districts of Southern Odisha (Koraput, Nawarangpur, Gunupur)

---

## Abstract

Air quality monitoring in India is heavily concentrated in major metropolitan hubs, creating severe "data blindness" across rural and semi-urban districts. Approximately 40% of India's districts lack continuous automated monitoring stations (CAAQMS). This project presents **AirSwasthya AI**, an explainable software-first Air Quality Index (AQI) and $\text{PM}_{2.5}$ forecasting system specifically designed for monitoring dark spots in Southern Odisha (**Koraput**, **Nawarangpur**, and **Gunupur**). 

The system combines multi-source data ingestion (Open-Meteo satellite reanalysis series, OSPCB monthly PDF extraction, and historical Kaggle AQI scaffolds) with a **Statsmodels SARIMAX** time-series forecasting engine. By incorporating co-pollutants ($\text{PM}_{10}$, $\text{NO}_2$, $\text{SO}_2$, $\text{O}_3$, $\text{CO}$) as exogenous predictors, the model achieves a Mean Absolute Error (MAE) of **0.85 µg/m³** and an $R^2$ score of **89.74%** on the 7-day Koraput holdout validation series. Predicted particulate levels are automatically mapped to standard Central Pollution Control Board (CPCB) AQI categories and public health advisories. The system features a dual presentation architecture: a Streamlit console for academic review and an interactive Next.js 3D web portal for public engagement.

---

## 1. Introduction & Motivation

### 1.1 Problem Statement
Ambient air pollution poses a critical public health risk across India. However, national initiatives such as the National Clean Air Programme (NCAP) focus primarily on 131 urban "non-attainment" cities. Rural and semi-urban districts—where over 75% of air pollution-related health issues occur—suffer from an infrastructure gap. 

Installing a physical CAAQMS station requires a capital expenditure of **₹1.5 Crore to ₹2.5 Crore ($180k–$300k USD)** plus recurring maintenance costs, rendering nationwide hardware deployment unfeasible for State Pollution Control Boards (SPCBs).

### 1.2 Target Region & Scope
AirSwasthya AI focuses on three priority areas in Southern Odisha:
1. **Koraput** ($18.81199^\circ\text{N}, 82.71048^\circ\text{E}$): Primary target area.
2. **Nawarangpur** ($19.23114^\circ\text{N}, 82.54826^\circ\text{E}$): Secondary target area.
3. **Gunupur** ($19.08040^\circ\text{N}, 83.80879^\circ\text{E}$): Tertiary target area.

---

## 2. Literature Review & Systemic Gaps

- **Metropolitan Bias:** Existing literature highlights that city-centric monitoring networks fail to track cross-boundary rural emission sources (agricultural burning, mining, localized biomass usage).
- **Black-Box Opacity:** Commercial platforms (IQAir, BreezoMeter) present interpolated AI predictions without disclosing data provenance, creating ambiguity between physical ground measurements and satellite model estimations.
- **Explainable Software Alternative:** AirSwasthya AI fills this gap by delivering transparent predictions with explicit data provenance disclosures and open statistical metrics.

---

## 3. Methodology & System Architecture

### 3.1 Data Ingestion Pipeline
- **Open-Meteo Air Quality API:** Ingests 24/7 hourly concentrations of $\text{PM}_{2.5}$, $\text{PM}_{10}$, $\text{NO}_2$, $\text{SO}_2$, $\text{O}_3$, and $\text{CO}$ (92-day historical series + 7-day forecast window).
- **OSPCB PDF Parsing:** Uses `pdfplumber` (`src/odisha_pdf_ingest.py`) to extract official monthly district readings from 2026 Odisha State Pollution Control Board reports.

### 3.2 Time-Series Forecasting (SARIMAX)
The forecasting engine fits a seasonal autoregressive integrated moving average model with exogenous variables:
$$\text{SARIMAX}(p, d, q) \times (P, D, Q)_s$$
Where:
- Order $(p,d,q) = (1,1,1)$
- Seasonal Order $(P,D,Q,s) = (1,0,1,7)$
- Exogenous Feature Matrix $X = [\text{PM}_{10}, \text{NO}_2, \text{SO}_2, \text{O}_3, \text{CO}]$

---

## 4. Experimental Results & Discussion

### 4.1 7-Day Holdout Validation Metrics

| Location | Model | MAE (µg/m³) | RMSE (µg/m³) | $R^2$ Score |
| :--- | :---: | :---: | :---: | :---: |
| **Koraput** | Naive Last Value | 6.0738 | 6.6776 | -2.9242 |
| **Koraput** | ARIMA(1,1,1) | 4.8369 | 5.3151 | -1.4862 |
| **Koraput** | SARIMA(1,1,1)(1,0,1)[7] | 5.3212 | 5.8229 | -1.9840 |
| **Koraput** | **SARIMAX (Exogenous)** | **0.8520** | **1.0797** | **0.8974** |

### 4.2 Accuracy Discussion & Real-World Limits
Univariate time-series models (ARIMA/SARIMA) yield negative $R^2$ values because $\text{PM}_{2.5}$ fluctuates rapidly with weather shifts. Incorporating co-pollutant exogenous drivers enables SARIMAX to achieve **$89.74\%$ variance explanation**.

However, the model validates against **satellite reanalysis grids (~11km x 11km resolution)**, representing regional background trends rather than hyper-local village woodsmoke spikes.

---

## 5. Health Advisory Engine & User Interfaces

### 5.1 CPCB Advisory Rule Mapping
Predicted $\text{PM}_{2.5}$ levels are categorized into CPCB-aligned risk categories:
- **Good ($\le 30\,\mu\text{g/m}^3$):** Safe for normal outdoor activities.
- **Satisfactory ($31\text{--}60\,\mu\text{g/m}^3$):** Acceptable; sensitive individuals monitor symptoms.
- **Moderate ($61\text{--}90\,\mu\text{g/m}^3$):** Sensitive groups reduce prolonged outdoor exertion.
- **Poor ($91\text{--}120\,\mu\text{g/m}^3$):** High risk; mask usage recommended.
- **Very Poor ($121\text{--}250\,\mu\text{g/m}^3$):** Very high risk; avoid outdoor activities.
- **Severe ($> 250\,\mu\text{g/m}^3$):** Emergency advisory; restrict exposure.

### 5.2 Dual Presentation Interface
- **Streamlit Console (`app/streamlit_app.py`):** Enables evaluators to audit data provenance, model parameters, and decomposition plots.
- **Next.js Web Portal (`frontend/`):** Implemented using Next.js 18, React, Tailwind CSS, Framer Motion, and Three.js 3D visualizations.

---

## 6. Conclusion & Future Work

AirSwasthya AI demonstrates that open-source software architectures can bridge the 40% district data blindness gap in rural India at zero hardware cost. Future work includes integrating physical low-cost IoT ground sensors for local calibration, expanding deep learning benchmarks (LSTM), and establishing automated SMS/WhatsApp emergency alerts.

---
*Report completed for 3rd Semester CSE AI/ML Minor Project Submission.*
