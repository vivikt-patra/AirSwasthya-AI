# 🌫️ AirSwasthya AI — Southern Odisha Air Quality & Health Advisory

> **Explainable PM2.5 Forecasting and Public Health Protection System for Unmonitored Districts in Southern Odisha.**

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3.4-black?style=for-the-badge&logo=nextdotjs)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Python 3.12](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Statsmodels SARIMAX](https://img.shields.io/badge/Model-SARIMAX-emerald?style=for-the-badge)](https://www.statsmodels.org/)
[![License MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![GIET Mini Project](https://img.shields.io/badge/GIET-Mini_Project_2026-orange?style=for-the-badge)](CONTRIBUTORS.md)

---

## 📌 Executive Summary

**AirSwasthya AI** is an academic engineering project developed by student researchers at **GIET**. It addresses the severe lack of local ground air-monitoring hardware in Southern Odisha by providing a **software-first, explainable PM2.5 forecasting and health-risk advisory platform**.

The system focuses on three priority unmonitored regions:
1. 📍 **Koraput** *(Priority 1 Target Area)*
2. 📍 **Nawarangpur** *(Priority 2 Target Area)*
3. 📍 **Gunupur** *(Priority 3 Target Area)*

By ingesting gridded satellite atmospheric reanalysis data from Open-Meteo and training **Statsmodels SARIMAX time-series models**, AirSwasthya AI delivers 7-day ahead PM2.5 forecasts aligned with **CPCB (Central Pollution Control Board)** public health guidelines—without requiring ₹2.0 Crore physical ground station deployments.

---

## ✨ Key Features

- 🛰️ **Satellite Atmospheric Reanalysis**: Ingests 92+ days of continuous historical PM2.5 and meteorological observations from satellite models.
- 📈 **Explainable SARIMAX Machine Learning**: Transparent time-series forecasting with verified data provenance (no opaque black-box models).
- 🎨 **IQAir-Style Modern Web Dashboard**: Next.js 16 frontend featuring glassmorphism cards, interactive 3D particle canvas (React Three Fiber), and smooth hover dropdown navigation.
- 🛡️ **CPCB Health Risk Guidance**: Real-time health advisory recommendations tailored for citizens, children, and vulnerable groups.
- 🤝 **100% Free Public Facilitation**: Public tools for downloading daily district reports, accessing satellite API series, and subscribing to alerts.

---

## 📊 Model Performance Snapshot

Validation results for 7-day PM2.5 predictions using Statsmodels SARIMAX across target districts:

| Target District | Priority Level | Best Model | MAE (µg/m³) | RMSE (µg/m³) | $R^2$ Score |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **Koraput** | Priority 1 | SARIMAX | **0.852** | **1.080** | **0.897** |
| **Nawarangpur** | Priority 2 | SARIMAX | **1.218** | **1.460** | **0.862** |
| **Gunupur** | Priority 3 | SARIMAX | **1.042** | **1.180** | **0.804** |

> *Note: Metrics reflect recent gridded satellite reanalysis series validation and provide an explainable baseline.*

---

## 🏗️ System Architecture

```text
┌────────────────────────────────────────────────────────┐
│   Open-Meteo Air Quality & Weather Satellite API Data  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│     Data Provenance & Source Boundary Ingestion        │
│    (Koraput, Nawarangpur, Gunupur Gridded Series)      │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│     Statsmodels SARIMAX Time-Series ML Pipeline        │
│       (Feature Engineering & 7-Day Forecasting)        │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│        CPCB Health Risk Advisory Rules Engine          │
└───────────────────────────┬────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
┌───────────────────────┐       ┌───────────────────────┐
│ Next.js 16 Dashboard  │       │ Streamlit Review Console │
│   (Public Web UI)     │       │  (Academic Evaluation)│
└───────────────────────┘       └───────────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend & Web UI (`frontend/`)
* **Framework**: Next.js 16 (React 19, Turbopack, App Router)
* **Styling**: Tailwind CSS with custom glassmorphism tokens
* **Animations**: Framer Motion 12
* **3D Visuals**: Three.js & React Three Fiber (`@react-three/fiber`)
* **State & Icons**: Zustand & Lucide React

### Backend & Machine Learning (`src/`, `app/`)
* **Language**: Python 3.12
* **Data Processing**: Pandas, NumPy
* **Forecasting**: Statsmodels (ARIMA, SARIMA, SARIMAX), Scikit-learn
* **Review Console**: Streamlit
* **Testing**: Pytest

---

## 🚀 Quick Start & Installation

### 1. Frontend Web Dashboard

```bash
# Navigate to frontend folder
cd frontend

# Install Node dependencies
npm install

# Run local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Python Backend & Streamlit Console

```bash
# Create and activate Python virtual environment
python -m venv .venv
# On Windows PowerShell:
.\.venv\Scripts\Activate.ps1

# Install Python requirements
pip install -r requirements.txt

# Run pytest suite
pytest

# Launch Streamlit Review Console
streamlit run app/streamlit_app.py
```

---

## 👥 GIET Student Project Team

AirSwasthya AI was built as a collaborative Final Year Engineering Mini Project (2026) at **GIET**.

* 🧑‍💻 **Vivikt Patra** ([@viviktpatra](https://github.com/viviktpatra) | `viviktpatra@gmail.com`)  
  *Lead Developer & Machine Learning Model Architect*
* 🧑‍💻 **Soham Swain** ([@sohamswain](https://github.com/sohamswain) | `sohamswain26@gmail.com`)  
  *Data Engineering & System Contributor*
* 🧑‍💻 **Mukul** (*GIET Student Contributor*)  
  *Project Contributor & Validation Analyst*

---

## 🔒 Security & Data Privacy

* 🛡️ No private API keys or credentials are committed to Git history.
* 📄 All local environment configurations use `.env.example` templates.
* 🧹 `.gitignore` strictly excludes `node_modules`, `.next`, `.venv`, `.env`, and build outputs.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
