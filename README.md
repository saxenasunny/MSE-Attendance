# Live Exam Attendance Marking System

A fast, mobile-friendly exam attendance system for invigilators and exam administrators.
- **Frontend**: React + Tailwind CSS + Vite (Optimized for **Vercel**)
- **Backend**: Node.js + Express (Optimized for **Render** / **Railway**)
- **Database**: Managed MySQL (TiDB Cloud / Aiven / Railway MySQL / Cloud MySQL)

---

## Architecture & Hosting Plan

| Component | Platform | Why this platform? |
| :--- | :--- | :--- |
| **Frontend** | **Vercel** | Lightning-fast static asset edge delivery, automatic HTTPS, continuous deployment from GitHub. |
| **Backend** | **Render** or **Railway** | Persistent Node.js container handling long-running connections, streaming Excel/CSV reports, and multipart uploads up to 25MB without serverless lambda timeouts or payload size restrictions. |
| **Database** | **TiDB Cloud** / **Aiven** / **Railway MySQL** | Free-tier managed cloud MySQL instances with SSL encryption support. |

---

## Step-by-Step Live Deployment Guide

### Step 1: Set up a Free Cloud MySQL Database

Pick any of the following free MySQL providers:
- **TiDB Cloud (Serverless)**: [tidbcloud.com](https://tidbcloud.com) (5GB free forever, instant setup, standard MySQL 8.0 protocol).
- **Aiven for MySQL**: [aiven.io](https://aiven.io) (Free tier managed MySQL).
- **Railway**: [railway.app](https://railway.app) (Click `+ New` -> `Database` -> `Add MySQL`).

Copy your connection details:
- Either single connection URL: `DATABASE_URL` (`mysql://user:pass@host:port/dbname`)
- Or individual parameters: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.

---

### Step 2: Deploy the Backend (Render or Railway)

#### Option A: Deploy on Render (Recommended)
1. Push your project to GitHub.
2. Go to [render.com](https://dashboard.render.com) and click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Configure the service settings:
   - **Name**: `exam-attendance-api`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. In **Environment Variables**, add:
   - `DATABASE_URL`: Your cloud MySQL connection string (or set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).
   - `DB_SSL`: `true` (if your cloud MySQL requires SSL/TLS, e.g. TiDB or Aiven).
   - `JWT_SECRET`: A long random secret string (e.g. `c7b94101e405a392...`).
   - `ADMIN_USERNAME`: `admin` (or your preferred admin username).
   - `ADMIN_PASSWORD`: A secure password for the first admin user.
   - `CORS_ORIGIN`: `*` (or your Vercel URL once created in Step 3, e.g. `https://exam-attendance.vercel.app`).
6. Click **Deploy Web Service**.
7. Once deployed, copy your backend URL (e.g., `https://exam-attendance-api.onrender.com`).
   - Test it by visiting `https://exam-attendance-api.onrender.com/health` in your browser. It should respond: `{"ok":true,"status":"healthy"}`.

#### Option B: Deploy on Railway
1. Go to [railway.app](https://railway.app) and create a new project from your GitHub repo.
2. In project settings, set the **Root Directory** to `backend`.
3. Add the same environment variables as above, or attach a Railway MySQL database plugin directly.

---

### Step 3: Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) and click **Add New...** -> **Project**.
2. Select your GitHub repository.
3. In the project configuration:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click edit and select `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Expand **Environment Variables** and add:
   - `VITE_API_URL` = Your backend URL from Step 2 (e.g., `https://exam-attendance-api.onrender.com`).
5. Click **Deploy**.
6. Once Vercel finishes building, your website is live!
7. *(Optional & Recommended)*: Go back to your backend service on Render/Railway and update `CORS_ORIGIN` with your exact Vercel URL (e.g., `https://your-project.vercel.app`).

---

## First-Time Data Load & Usage

1. Open your live Vercel URL in your browser.
2. Log in using `ADMIN_USERNAME` and `ADMIN_PASSWORD` configured during backend setup.
3. Navigate to the **Admin** tab:
   - **Step 1: Student Data**: Upload `Std_Data.xlsx` (columns: Roll_No/Enrollment No, Name, Program/Course_Name, Section, Subject_Code, Subject_Name, Exam_Date, Session).
   - **Step 2: Seating Plan**: Upload the seating plan workbook (e.g. `05-10-2026_Evening.xlsx` with room-wise tabs or flat sheet).
   - **Step 3: Add Invigilator Users**: Create login credentials for invigilators.
4. Invigilators can now log in on mobile/tablet, pick Date -> Session -> Room, mark attendance, and save in real-time.
5. In the **Report** tab, administrators can monitor attendance progress across rooms, lock completed rooms, and export the entire roster as an Excel (`.xlsx`) or CSV file.

---

## Local Development

```bash
# 1. Backend setup
cd backend
cp .env.example .env      # Set your local or remote DB credentials
npm install
npm run dev               # Runs with --watch on port 4000

# 2. Frontend setup (in a separate terminal)
cd frontend
cp .env.example .env      # Set VITE_API_URL=http://localhost:4000
npm install
npm run dev               # Runs Vite dev server on http://localhost:5173
```
