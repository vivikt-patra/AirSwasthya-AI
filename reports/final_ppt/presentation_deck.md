# AirSwasthya AI: Final Project Presentation Deck

> **Academic Presentation**  
> **Course:** 3rd Semester CSE AI/ML Minor Project  
> **Institution:** GIET University, Odisha  
> **Project Title:** AirSwasthya AI: Explainable AQI Forecasting and Health-Risk Advisory System for Urban & Rural Safety  
> **Target Region:** Southern Odisha Priority Districts (Koraput, Nawarangpur, Gunupur)

---

## Slide 1: Title & Project Overview

### **AirSwasthya AI**
*Explainable AQI Forecasting & Health-Risk Advisory System for Monitoring Dark Spots in Southern Odisha*

- **Department:** Computer Science & Engineering (AI & ML)
- **Institution:** GIET University, Gunupur, Odisha
- **Repository:** [`github.com/vivikt-patra/AirSwasthya-AI`](https://github.com/vivikt-patra/AirSwasthya-AI)
- **Team Roles:**
  - ML Modeling & Pipeline Architecture Lead
  - Data Ingestion & Statistical Analysis Lead
  - Streamlit & Next.js Presentation UI Lead

> **Speaker Notes:**  
> "Good morning/afternoon, Respected Evaluators and Faculty. Today we present AirSwasthya AI—a software-first, explainable air quality forecasting and health-risk advisory system designed specifically for monitoring dark spots in Southern Odisha."

---

## Slide 2: The Problem Statement

### **Monitoring Dark Spots & The 40% Data Blindness Gap**

- **Metropolitan Bias:** National programs like NCAP focus almost exclusively on 131 "non-attainment" urban hubs (Delhi, Mumbai, Bhubaneswar).
- **The Rural Gap:** Approximately **40% of Indian districts (~300+ districts)** lack a single continuous automated ground station (CAAQMS).
- **Targeting Southern Odisha:**
  - **Koraput** ($18.81^\circ\text{N}, 82.71^\circ\text{E}$): Priority 1
  - **Nawarangpur** ($19.23^\circ\text{N}, 82.54^\circ\text{E}$): Priority 2
  - **Gunupur** ($19.08^\circ\text{N}, 83.80^\circ\text{E}$): Priority 3
- **Health Vulnerability:** Rural and semi-urban populations face unmonitored exposure to particulate matter ($\text{PM}_{2.5}$) without early health advisories.

> **Speaker Notes:**  
> "In India, over 75% of air pollution-related health issues occur in rural and non-metropolitan areas. Yet, towns like Koraput and Gunupur have zero physical CAAQMS stations streaming real-time daily data. AirSwasthya AI bridges this exact data blindness gap."

---

## Slide 3: Economic & Infrastructure Bottlenecks

### **Why Hardware Alone Cannot Solve the Gap**

| Parameter | Physical CAAQMS Station (Govt Hardware) | AirSwasthya AI Software Solution |
| :--- | :--- | :--- |
| **Capital Cost (CapEx)** | **₹1.5 Crore – ₹2.5 Crore** per unit | **₹0 (Zero Hardware Cost)** |
| **Maintenance (OpEx)** | Heavy annual calibration & telemetry costs | Open API + Automated Python Pipeline |
| **Coverage Radius** | 100-meter physical point measurement | 11km x 11km regional grid coverage |
| **Availability in Koraput/Gunupur** | **ABSENT** (Only manual monthly PDFs) | **AVAILABLE 24/7** via Satellite Reanalysis |

> **Speaker Notes:**  
> "Installing physical stations in every rural block is financially unfeasible for SPCBs. AirSwasthya AI offers a software-first alternative that ingests satellite reanalysis grids to provide predictive visibility at zero hardware cost."

---

## Slide 4: System Architecture

```text
┌─────────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
│  Open-Meteo Satellite   │      │ OSPCB 2026 District PDF │      │   Kaggle India AQI CSV   │
│   Air Quality API Feed  │      │ Extraction (pdfplumber) │      │   Baseline Scaffold     │
└────────────┬────────────┘      └────────────┬────────────┘      └────────────┬────────────┘
             │                                │                                │
             └────────────────────────┐       │       ┌────────────────────────┘
                                      ▼       ▼       ▼
                        ┌─────────────────────────────────────────┐
                        │ Data Ingestion, Cleaning & Provenance   │
                        └────────────────────┬────────────────────┘
                                             │
                                             ▼
                        ┌─────────────────────────────────────────┐
                        │   Statsmodels SARIMAX Time-Series Model │
                        │  (Exogenous: PM10, NO2, SO2, O3, CO)    │
                        └────────────────────┬────────────────────┘
                                             │
                                             ▼
                        ┌─────────────────────────────────────────┐
                        │ CPCB-Aligned AQI & Health Advisory Rules│
                        └────────────────────┬────────────────────┘
                                             │
                      ┌──────────────────────┴──────────────────────┐
                      ▼                                             ▼
        ┌───────────────────────────┐                 ┌───────────────────────────┐
        │ Streamlit Review Console  │                 │  Next.js 3D Public Portal │
        │   (app/streamlit_app.py)  │                 │     (frontend/ Dashboard) │
        └───────────────────────────┘                 └───────────────────────────┘
```

> **Speaker Notes:**  
> "Our architecture consists of three layers: multi-source data ingestion, a Statsmodels SARIMAX time-series engine, and a dual-presentation layer featuring a Streamlit evaluator console and a Next.js 3D web portal."

---

## Slide 5: Data Provenance & Ethics

### **Scientific Transparency & Disclaimers**

- **Open-Meteo Satellite Reanalysis:** Ingests 92 days of hourly history + 7-day future predictions derived from Copernicus (CAMS) atmospheric models.
- **OSPCB PDF Ingestion:** Extends `src/odisha_pdf_ingest.py` to extract official monthly district averages from Odisha State Pollution Control Board 2026 reports.
- **Explicit Provenance Disclaimer:**
  - The system **does NOT claim certified physical ground-sensor accuracy**.
  - It clearly labels satellite reanalysis data vs. physical sensor data in `README.md` and UI footers.

> **Speaker Notes:**  
> "Academic integrity is central to our design. We explicitly inform reviewers and users that our predictions validate against satellite reanalysis grids, providing regional trends rather than claiming unverified physical sensor accuracy."

---

## Slide 6: Model Benchmarking & Performance

### **7-Day Validation Holdout Results (Koraput Dataset)**

| Model | MAE (Mean Absolute Error) | RMSE | $R^2$ Score | Performance Assessment |
| :--- | :---: | :---: | :---: | :--- |
| **Naive Last Value** | 6.07 µg/m³ | 6.68 | -2.92 | Fails to capture atmospheric shifts |
| **Univariate ARIMA** | 4.84 µg/m³ | 5.32 | -1.48 | Negative $R^2$; lag-only approach fails |
| **Univariate SARIMA** | 5.32 µg/m³ | 5.82 | -1.98 | Weekly seasonality alone insufficient |
| **SARIMAX (Exogenous)** | **0.85 µg/m³** | **1.08** | **89.74%** | **Best Performance ($R^2 = 0.8974$)** |

```text
Actual vs. SARIMAX Predicted PM2.5 (Day 1 Holdout):
- Actual PM2.5:    18.875 µg/m³
- SARIMAX Predicted: 18.799 µg/m³ (Absolute Error: 0.075 µg/m³!)
```

> **Speaker Notes:**  
> "SARIMAX achieves an 89.74% R-squared score because it incorporates co-pollutants as exogenous predictors. Univariate ARIMA fails because PM2.5 fluctuates rapidly with weather shifts."

---

## Slide 7: Real-World Accuracy & Limitations

### **No-Sugarcoat Ground-Truth Reality**

1. **Spatial Resolution (~11km x 11km Grid):**
   - Open-Meteo satellite reanalysis averages air quality over 121 $\text{km}^2$.
   - It captures **macro regional trends** (monsoon washout, seasonal agricultural haze, regional industrial drift).
2. **Micro-Local Limitations:**
   - Cannot detect hyper-local village micro-sources (chulha biomass smoke, localized roadside dust, individual brick kilns).
3. **Role of AirSwasthya AI:**
   - Serves as an **explainable software-first regional warning system**, bridging the gap until physical low-cost IoT sensors are deployed locally.

> **Speaker Notes:**  
> "We do not oversell our solution. An 11km satellite grid cell smooths out local village woodsmoke, but it accurately predicts regional background shifts, giving district administrators early warning signals."

---

## Slide 8: Rule-Based CPCB Health Advisory Engine

### **Translating Math into Actionable Health Directives**

- **CPCB Category Classification:**
  - $\text{PM}_{2.5} \le 30\ \mu\text{g/m}^3 \rightarrow$ **Good** (Low Risk)
  - $31 - 60\ \mu\text{g/m}^3 \rightarrow$ **Satisfactory** (Mild Risk)
  - $61 - 90\ \mu\text{g/m}^3 \rightarrow$ **Moderate** (Caution for sensitive groups)
  - $91 - 120\ \mu\text{g/m}^3 \rightarrow$ **Poor** (High Risk: Mask required)
  - $121 - 250\ \mu\text{g/m}^3 \rightarrow$ **Very Poor** (Avoid outdoor activity)
  - $> 250\ \mu\text{g/m}^3 \rightarrow$ **Severe** (Emergency advisory)

> **Speaker Notes:**  
> "Raw numbers like 85.4 µg/m³ mean nothing to citizens. Our engine maps concentrations into CPCB color-coded risk levels and clear behavioral advisories."

---

## Slide 9: Dual Presentation UI Walkthrough

### **Built for Both Reviewers & Public Users**

1. **Streamlit Evaluator Console (`app/streamlit_app.py`):**
   - Allows professors and reviewers to adjust model parameters, inspect MAE/RMSE tables, and view data provenance disclosures.
2. **Next.js 18 3D Public Dashboard (`frontend/`):**
   - Built with TypeScript, Tailwind CSS, Framer Motion, and React Three Fiber (Three.js) for an interactive 3D globe and responsive forecast cards.

> **Speaker Notes:**  
> "We built two interfaces: Streamlit for academic verification and Next.js with 3D components for public user engagement."

---

## Slide 10: Conclusion & Future Scope

### **Key Takeaways & Next Steps**

1. **Successfully Built:**
   - 24/7 PM2.5 time-series forecasting pipeline ($R^2 = 89.74\%$).
   - OSPCB PDF ingestion + Open-Meteo satellite integration.
   - Fully working Streamlit console + Next.js web application.
2. **Future Enhancements:**
   - Integration of low-cost physical IoT ground sensors in Koraput/Gunupur for local calibration.
   - Deep learning (LSTM / Attention models) benchmarking.
   - Automated SMS/WhatsApp emergency alerts for severe pollution spikes.

> **Speaker Notes:**  
> "AirSwasthya AI proves that software innovation can bring environmental data justice to unmonitored rural districts. Thank you, and we welcome your questions!"

---
*End of Presentation Deck.*
