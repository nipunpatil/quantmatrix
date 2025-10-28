Full-Stack EDA Dashboard
A Dockerized production-ready Exploratory Data Analysis web application built with React and Django for interactive data exploration and visualization of FMCG retail datasets.​

Overview
This full-stack application enables CSV dataset uploads with asynchronous processing and provides five distinct analytical views with dynamic filtering capabilities.​

Key Features
Asynchronous CSV processing with Celery​

Five analytical views (Brand, Pack Type, PPG, Cross-Analysis, Correlation)​

Dynamic filtering (brand, pack type, PPG, channel, year)​

Optimized PostgreSQL with indexed tables​

JWT authentication with protected routes​

Responsive UI with Chakra UI and Chart.js​

Fully containerized with Docker Compose

Tech Stack
Backend: Django 5.2.7, Django REST Framework, PostgreSQL, Celery, Redis, Pandas, SQLAlchemy​

Frontend: React 18, Chakra UI, Chart.js, React Router, Axios​

Deployment: Docker, Docker Compose

Architecture
System Design
The application uses a three-tier architecture with frontend, REST API, and async processing layers.​

Data Flow:

User uploads CSV → Django creates Dataset (status: pending)​

Celery task processes data asynchronously​

Creates optimized PostgreSQL tables with indexes​

Frontend polls status until complete​

User applies filters → API returns aggregated data​

Frontend renders Chart.js visualizations​

Database Tables
raw_data_{dataset_id}

Stores cleaned CSV data with seven B-tree indexes on filter columns (brand, packtype, ppg, channel, year, month, date). This enables fast filtered queries even with large datasets.​

agg_market_share_{dataset_id}

Pre-computed market share percentages for instant dashboard loading.​

All five views query the same raw_data table using different GROUP BY strategies.​

Key Components
Backend
tasks.py - Celery worker handles CSV processing, data cleaning, table creation, and indexing​

views.py - REST API with dynamic query builder using parameterized SQL​

models.py - User, Profile, Project, and Dataset models with status tracking​

Frontend
DashboardPage.js - Main component with five conditional views and Chart.js visualizations​

apiClient.js - Axios instance with JWT interceptors​

AuthContext.js - Global authentication state management​
