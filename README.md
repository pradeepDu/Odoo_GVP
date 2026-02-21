<p align="center">
  <img src="https://img.shields.io/badge/FleetFlow-Fleet%20%26%20Logistics-0ea5e9?style=for-the-badge&logo=react&logoColor=white" alt="FleetFlow" />
</p>

<h1 align="center">🚛 FleetFlow</h1>
<p align="center">
  <strong>Fleet & logistics management platform</strong> — dispatch trips, manage vehicles & drivers, track fuel & maintenance, and run analytics.
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-project-structure">Structure</a> •
  <a href="#-environment">Environment</a>
</p>

---

## ✨ Features

| Area | What you get |
|------|----------------|
| **Dashboard** | KPIs (active fleet, maintenance alerts, utilization, pending cargo), recent trips, trip detail drawer |
| **Vehicle Registry** | List/filter vehicles, add new vehicle, retire/restore, status & odometer |
| **Trip Dispatcher** | Create trip (vehicle + driver + cargo), validate before create, dispatch, complete with end odometer |
| **Maintenance** | Log services per vehicle, filter by vehicle, cost tracking |
| **Drivers** | List drivers, add driver, duty status, complaints; computed completion rate & safety score |
| **Fuel Expense** | Log fuel by vehicle (optional trip), cost & liters |
| **Analytics** | Monthly fuel & cost trend, top costliest vehicles, monthly financial summary, driver safety table, per-vehicle fuel efficiency & operational cost; **Download Excel** with all sheets |

- **RBAC**: Fleet Manager, Dispatcher, Safety Officer, Financial Analyst  
- **Auth**: Login, register, forgot/reset password (email queue)  
- **API**: REST, JWT, role-based routes; PostgreSQL + Prisma  

---

## 🛠 Tech Stack

| Layer | Stack |
|-------|--------|
| **Frontend** | React 19, TypeScript, Vite, TanStack Query, React Router, Recharts, Tailwind CSS, Neo-Brutal UI, xlsx |
| **Backend** | Node.js, Express 5, TypeScript, Prisma 7, PostgreSQL, JWT, bcrypt, BullMQ, Nodemailer |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **pnpm** (or npm/yarn)
- **PostgreSQL** (local or hosted)
- **Redis** (optional; for email queue)

### 1. Clone & install

```bash
git clone https://github.com/your-org/Odoo_GVP.git
cd Odoo_GVP
pnpm install
cd backend && pnpm install
cd ../frontend && pnpm install
```

### 2. Database & env

```bash
cd backend
cp .env.example .env   # if exists, else create .env
```

Set in `backend/.env`:

- `DB_URI` — PostgreSQL connection string  
- `JWT_SECRET` — any long random string  
- `FRONTEND_URL` — e.g. `http://localhost:5173` (for password reset links)  
- Optional: Redis for queues, mail config for forgot password

```bash
pnpm prisma:migrate
pnpm prisma:seed
```

### 3. Run

**Backend**

```bash
cd backend
pnpm dev
```

**Frontend**

```bash
cd frontend
pnpm dev
```

Open **http://localhost:5173**. Log in with seeded user:

- **Email:** `manager@fleetflow.test`  
- **Password:** `password123`  

---

## 📁 Project Structure

```
Odoo_GVP/
├── backend/                 # Express API
│   ├── prisma/
│   │   ├── schema.prisma   # Models, enums
│   │   ├── seed.ts          # Roles, users, vehicles, trips, fuel, maintenance
│   │   └── migrations/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   ├── middleware/      # auth, RBAC
│   │   ├── queues/          # BullMQ, email worker
│   │   └── config/
│   └── package.json
├── frontend/                # React SPA
│   ├── src/
│   │   ├── pages/           # Dashboard, Vehicles, Trips, Maintenance, Drivers, Fuel, Analytics
│   │   ├── components/      # Layout, FormModal, ConfirmDialog, Neo-Brutal UI
│   │   ├── lib/             # api, toast, utils
│   │   └── stores/
│   └── package.json
├── docs/                    # BE routes/schema plan, FE–BE integration plan
└── README.md
```

---

## 🔐 Environment

| Variable | Where | Description |
|----------|--------|-------------|
| `DB_URI` | backend | PostgreSQL connection string |
| `JWT_SECRET` | backend | Secret for JWT signing |
| `FRONTEND_URL` | backend | Frontend base URL (e.g. reset password) |
| `VITE_API_URL` | frontend | Backend API base URL (optional) |
| Redis / Mail | backend | Optional: queues, forgot-password emails |

---

## 📥 Analytics Excel export

On the **Analytics** page, use **Download Excel** to get a single `.xlsx` file with sheets:

- **KPIs** — active fleet, maintenance alerts, utilization, pending cargo, total fuel & operational cost  
- **Monthly Financial** — month, fuel cost, maintenance cost, total  
- **Top Costliest Vehicles** — vehicle name, operational cost  
- **Monthly Fuel** — month, liters, cost  
- **Driver Safety** — name, license expiry, safety score, trip completion %, trip count  

File name: `FleetFlow_Analytics_YYYY-MM-DD.xlsx`.

---

## 📄 License

ISC (or your chosen license).

---

<p align="center">
  <sub>Built with React, Express, Prisma & PostgreSQL</sub>
</p>
