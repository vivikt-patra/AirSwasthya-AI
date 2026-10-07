# Release Notes — AirSwasthya AI v1.0.0

## AirSwasthya AI 1.0.0 (Production Showcase Release)

This release delivers the complete **Next.js 16 Web Dashboard** and **Explainable SARIMAX PM2.5 Forecasting Pipeline** developed by the student engineering team at **GIET**.

---

## Included in v1.0.0

- 🚀 **Next.js 16 & React 19 Frontend**: High-performance UI built with Tailwind CSS, Framer Motion, and React Three Fiber 3D canvas.
- 🌫️ **Explainable SARIMAX Modeling**: Day-by-day PM2.5 forecasting for Koraput ($R^2 = 0.897$), Nawarangpur ($R^2 = 0.862$), and Gunupur ($R^2 = 0.804$).
- 🛰️ **Open-Meteo Satellite Ingestion**: Gridded atmospheric reanalysis series without hardware station costs.
- 🏥 **CPCB Health Risk Guidance**: Real-time health advisory alerts aligned with Central Pollution Control Board standards.
- 👥 **GIET Student Team Attribution**: Team member recognition for Vivikt Patra, Soham Swain, and Mukul.
- 🎨 **IQAir-Inspired Visual Shell**: Curved navigation header, dark backdrop blur overlays, and 100% full-width About Us & Impact section.

---

## Recommended Developer Commands

```bash
# Frontend Next.js 16 App
cd frontend
npm install
npm run dev

# Python Machine Learning Backend
python -m venv .venv
pip install -r requirements.txt
pytest
streamlit run app/streamlit_app.py
```
