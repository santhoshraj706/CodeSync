# CodeSync Deployment Guide

This guide details the step-by-step instructions to deploy the **CodeSync** application. 

*   **Frontend (Vite + React):** Deployed to **Vercel**
*   **Backend (Node.js + Express + Socket.io):** Deployed to **Render**

---

## 🚀 1. Deploy the Backend (to Render)

Render is ideal for Node.js backend servers using WebSockets (Socket.io) because it supports persistent, long-running connections.

### Step 1: Create a Render Account
1. Go to [Render](https://render.com/) and sign up.
2. Connect your GitHub account.

### Step 2: Create a Web Service
1. Click **New +** in the dashboard and select **Web Service**.
2. Connect the **CodeSync** repository (`santhoshraj706/CodeSync`).
3. Configure the following service settings:
   *   **Name:** `codesync-backend`
   *   **Language:** `Node`
   *   **Branch:** `main`
   *   **Root Directory:** `server` *(Important: Point this to the server folder)*
   *   **Build Command:** `npm install`
   *   **Start Command:** `node index.js`
   *   **Instance Type:** `Free` (or custom tier)

### Step 3: Add Environment Variables
Under the **Environment** tab, click **Add Environment Variable** and insert:
*   `PORT` = `5000`
*   `MONGO_URI` = `mongodb+srv://santhoshrajtce_db_user:ihDI7OxzsuYIpRPE@cluster0.sq4fsjw.mongodb.net/?appName=Cluster0` *(Note: Whitelist Render IPs on MongoDB Atlas or add `0.0.0.0/0` in Atlas Network Access)*
*   `JWT_SECRET` = `super_secret_key_123_456_789`
*   `JUDGE0_API_KEY` = `your_judge0_api_key_here`

### Step 4: Deploy
Click **Deploy Web Service**. Once deployment completes, copy the generated service URL (e.g., `https://codesync-backend.onrender.com`).

---

## 🎨 2. Deploy the Frontend (to Vercel)

Vercel is the recommended hosting platform for fast, static single-page applications built with Vite.

### Step 1: Create a Vercel Account
1. Go to [Vercel](https://vercel.com/) and log in using GitHub.

### Step 2: Import the Project
1. Click **Add New** > **Project**.
2. Import the `santhoshraj706/CodeSync` repository.

### Step 3: Configure Build & Project Settings
*   **Framework Preset:** `Vite`
*   **Root Directory:** `client` *(Important: Point this to the client folder)*
*   **Build Command:** `npm run build`
*   **Output Directory:** `dist`
*   **Install Command:** `npm install`

### Step 4: Add Environment Variables
Under **Environment Variables**, add:
*   `VITE_SERVER_URL` = `https://codesync-backend.onrender.com` *(Paste your Render backend service URL here)*

### Step 5: Deploy
Click **Deploy**. Vercel will build and launch your client workspace.

---

## 🛡️ 3. Whitelisting IPs in MongoDB Atlas (Required)

Because cloud providers like Render and Vercel use dynamic IP addresses, you must configure MongoDB Atlas to accept connections from them.

1. Go to your [MongoDB Atlas Console](https://cloud.mongodb.com/).
2. Navigate to **Security** > **Network Access**.
3. Click **Add IP Address**.
4. Select **Allow Access From Anywhere** (enters `0.0.0.0/0`) or enter your specific gateway.
5. Click **Confirm**.

---

## 🔄 4. How the App Adapts

CodeSync is built to fail-safe:
*   **Active Room States:** Real-time rooms run on an active cache inside Node memory, ensuring instantaneous code synchronization and whiteboard drawings regardless of database latency.
*   **In-Memory Fallback:** If the database connection drops, endpoints for signup/login/room-creation fall back to high-performance local memory objects so your workspace never goes down.
