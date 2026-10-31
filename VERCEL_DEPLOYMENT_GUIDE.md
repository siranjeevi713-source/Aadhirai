# AADHIRAI – Production Deployment Guide (Vercel + Managed Database)

This guide provides the exact steps to deploy the **AADHIRAI** Full-Stack Web Application to **Vercel** with a persistent cloud database (PostgreSQL) so that citizen accounts, complaints, and evidence are permanently saved.

---

## Architecture Overview

```
┌────────────────────────────────┐         ┌────────────────────────────────┐
│   Next.js 16 Frontend (UI)     │         │   FastAPI Python Backend (API) │
│   Deployed on Vercel Edge / SSG│ ──────> │   Serverless Functions @Vercel │
│   Musiri Municipality UI       │         │   AI Vision + Deterministic DB │
└────────────────────────────────┘         └────────────────────────────────┘
                                                           │
                                                           ▼
                                           ┌────────────────────────────────┐
                                           │  PostgreSQL Cloud Database     │
                                           │  (Vercel Postgres / Neon /     │
                                           │   Supabase)                    │
                                           │  - Users & Mobile Auth         │
                                           │  - Complaints & Lifecycle      │
                                           │  - 24 Musiri Wards & Depts     │
                                           └────────────────────────────────┘
```

---

## Step 1: Create Your Cloud PostgreSQL Database (Free)

Choose **any** of the following free-tier hosted PostgreSQL providers:

### Option A: Vercel Postgres / Neon (Recommended)
1. In your [Vercel Dashboard](https://vercel.com/dashboard), navigate to the **Storage** tab.
2. Click **Create Database** → select **Postgres (powered by Neon)**.
3. Once created, click on **Connection Strings** and copy the `POSTGRES_URL` or `DATABASE_URL`.
   - Format: `postgresql://username:password@ep-xxxx.neon.tech/neondb?sslmode=require`

### Option B: Supabase
1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **Project Settings** → **Database** → **Connection string** (URI).
   - Format: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxx.supabase.co:5432/postgres`

---

## Step 2: Configure Environment Variables in Vercel

When importing your project into Vercel, set the following environment variables:

| Variable Name | Value | Purpose |
|---|---|---|
| `DATABASE_URL` | `postgresql://...` | Connection to your hosted Postgres database |
| `SECRET_KEY` | *(A long random 32+ character string)* | Signs JWT authentication tokens |
| `ENVIRONMENT` | `production` | Production mode |
| `NEXT_PUBLIC_API_BASE_URL` | `/api/v1` | Routes frontend requests to the FastAPI backend |
| `GEMINI_API_KEY` | *(Optional)* | Enables Gemini multimodal AI image understanding |

> **Note:** The backend automatically runs database migrations (`Base.metadata.create_all`) and seeds the baseline municipal data (24 Musiri wards, 5 departments, SLA policies, and admin accounts) upon first deployment.

---

## Step 3: Deploy to Vercel

### Method 1: Using Vercel Web Dashboard (Simplest)
1. Push your repository to **GitHub** or **GitLab**.
2. Open [Vercel Dashboard](https://vercel.com/new).
3. Click **Import Repository** and select `aadhrai`.
4. Enter your environment variables (`DATABASE_URL`, `SECRET_KEY`, etc.).
5. Click **Deploy**. Vercel will build both the Next.js frontend and the FastAPI backend using `vercel.json`.

### Method 2: Using Vercel CLI
Run the following in your terminal:
```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## Step 4: Verification After Deployment

Once deployed:
1. Open your production URL (`https://your-project.vercel.app`).
2. Visit `/login` → select **Citizen** → enter your 10-digit mobile number.
3. Test reporting a civic problem at `/citizen/submit`. The user data, AI classification, and complaints will be stored permanently in your cloud PostgreSQL database.

