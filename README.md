# InsiderGuard AI Platform - Startup and Running Guide

This guide provides simple, step-by-step instructions to run the **InsiderGuard AI Platform** (both the FastAPI Backend and React Frontend) on any computer.

To make things as easy as possible, we have provided automated scripts for both **Windows** and **macOS/Linux**.

---

## 📋 Prerequisites

Before running the project, make sure you have the following installed on the target computer:

1. **Node.js** (Version 20 or later recommended)  
   👉 Download from: [https://nodejs.org/](https://nodejs.org/)
2. **Python** (Version 3.10 or later recommended)  
   👉 Download from: [https://www.python.org/](https://www.python.org/)  
   *(Make sure to check "Add Python to PATH" during the Windows installation)*

---

## ⚡ The Easiest Way: Using Auto-Start Scripts (Recommended)

We have provided unified auto-start scripts that handle dependency checks, virtual environment setup, package installations, and server executions in a single step.

### 🪟 Windows Instructions

*   Double-click the **`start.bat`** script in the project root folder.  
    *This will check for missing libraries, automatically configure the virtual environment and `node_modules` if they are missing, and start both backend and frontend servers.*

---

### 🍎🍏 macOS / Linux Instructions

1. Open a terminal in the project folder and make the script executable:
   ```bash
   chmod +x start.sh
   ```
2. Run the start script:
   ```bash
   ./start.sh
   ```
    *This script performs the same automated checks and starts both servers.*

---

## 🛠️ Alternative Way: Separate Setup & Run Scripts

---

## 🛠️ The Manual Way: Step-by-Step

If you prefer to run the setup manually, follow these instructions:

### 1. Set Up and Start the Backend
1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   - **Windows (Command Prompt)**:
     ```cmd
     python -m venv venv
     call venv\Scripts\activate
     ```
   - **macOS/Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   *The backend will now be running at [http://127.0.0.1:8000](http://127.0.0.1:8000).*

### 2. Set Up and Start the Frontend
1. Open a new terminal window and navigate to the `app` folder:
   ```bash
   cd app
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Run the React development server:
   ```bash
   npm run dev
   ```
   *The frontend website will open at [http://localhost:3000](http://localhost:3000).*

---

## 🔗 Port Mappings & Access
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Documentation (API Docs)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **SQLite Database File**: Saved in `backend/insiderguard.db`

---

## 🔑 Default Login Credentials

After seeding the database, you can log in to the application using the following default credentials:

### 1. Admin Account
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: Platform Administrator (Full system access)

### 2. Standard User Accounts (Seeded from CSV)
- **Username**: Any lowercased user ID from the dataset (e.g. `usr1001` or `emp101`)
- **Password**: `password123`
- **Role**: SOC Analyst, Manager, or Auditor (depending on the CSV mapping)

