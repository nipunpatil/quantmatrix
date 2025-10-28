# 📊 Full-Stack EDA Dashboard

A **Dockerized production-ready Exploratory Data Analysis (EDA) web application** built with **React** and **Django** for interactive data exploration and visualization of **FMCG retail datasets**.

---

## 🚀 Overview
This full-stack application enables **CSV dataset uploads** with **asynchronous processing** and provides **five distinct analytical views** with **dynamic filtering capabilities** for deep insights into FMCG retail data.

---

## ✨ Key Features
- ⚡ **Asynchronous CSV processing** with Celery  
- 📈 **Five analytical views**: Brand, Pack Type, PPG, Cross-Analysis, Correlation  
- 🔍 **Dynamic filtering**: brand, pack type, PPG, channel, year  
- 🗄️ **Optimized PostgreSQL** with indexed tables for fast queries  
- 🔐 **JWT authentication** with protected routes  
- 📱 **Responsive UI** with Chakra UI and Chart.js  
- 🐳 **Fully containerized** with Docker Compose  

---

## 🛠️ Tech Stack
**Backend**  
- Django 5.2.7  
- Django REST Framework  
- PostgreSQL  
- Celery + Redis  
- Pandas, SQLAlchemy  

**Frontend**  
- React 18  
- Chakra UI  
- Chart.js  
- React Router  
- Axios  

**Deployment**  
- Docker, Docker Compose  

---

## 🏗️ Architecture

### System Design
The application follows a **three-tier architecture**:
1. **Frontend** – React + Chakra UI + Chart.js  
2. **REST API** – Django + DRF  
3. **Async Processing** – Celery + Redis  

### Data Flow
1. User uploads CSV → Django creates `Dataset` (status: pending)  
2. Celery task processes data asynchronously  
3. Optimized PostgreSQL tables with indexes are created  
4. Frontend polls dataset status until complete  
5. User applies filters → API returns aggregated data  
6. Frontend renders **Chart.js visualizations**  

---

## 🗃️ Database Tables

- **`raw_data_{dataset_id}`**  
  - Stores cleaned CSV data  
  - Seven **B-tree indexes** on: `brand`, `packtype`, `ppg`, `channel`, `year`, `month`, `date`  
  - Enables **fast filtered queries** even on large datasets  

- **`agg_market_share_{dataset_id}`**  
  - Pre-computed **market share percentages**  
  - Ensures **instant dashboard loading**  

> All five analytical views query the same `raw_data` table using different **GROUP BY** strategies.

---

## 🔑 Key Components

### Backend
- **`tasks.py`** – Celery worker for CSV processing, cleaning, table creation, indexing  
- **`views.py`** – REST API with dynamic query builder using parameterized SQL  
- **`models.py`** – User, Profile, Project, and Dataset models with status tracking  

### Frontend
- **`DashboardPage.js`** – Main component with five conditional views + Chart.js visualizations  
- **`apiClient.js`** – Axios instance with JWT interceptors  
- **`AuthContext.js`** – Global authentication state management  

---

## 🐳 Deployment
The entire stack is **fully containerized** with **Docker Compose**:
- `frontend` – React app  
- `backend` – Django + DRF  
- `db` – PostgreSQL  
- `redis` – Message broker for Celery  
- `worker` – Celery worker  

---

## 📌 Future Enhancements
- Role-based access control (RBAC)  
- Advanced caching for query optimization  
- Exportable reports (PDF/Excel)  
- Real-time streaming data support  

---

## 📜 License
This project is licensed under the **MIT License** – feel free to use and modify.

---
