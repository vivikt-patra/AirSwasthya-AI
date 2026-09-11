# Executive summary

AirSwasthya AI is an explainable machine-learning project for forecasting Air Quality Index and generating health-risk advice for urban users. It is designed for a 3-person 3rd semester CSE AIML minor project and is intentionally scoped to be understandable, review-ready, and defensible.

The system accepts historical AQI/pollutant data, cleans it, creates simple time-series features, trains regression models, compares their performance, saves the best model, and presents AQI category plus health advice through a Streamlit dashboard.

The current package is a professional implementation scaffold. It includes the core ML pipeline, dashboard shell, testing setup, documentation, diagrams, and release packaging script. It still requires a real India AQI dataset, real model results, screenshots, and final report/PPT before final submission.

## Target users

- Students building and explaining the project
- Faculty reviewers evaluating implementation clarity
- Developers continuing the project
- Researchers reproducing the experiment after dataset addition
- Demonstration viewers using the Streamlit dashboard

## Main value

The project avoids deep learning in version 1 and uses explainable models such as Linear Regression and Random Forest Regressor. This makes the methodology easier to justify during review while still demonstrating a complete AI/ML workflow.

