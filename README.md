# Ecosphere-ESG-Management-system-Odoo-Hackaton

# EcoSphere ESG Management Platform

An enterprise-grade, full-stack ESG (Environmental, Social, and Governance) Management Platform designed to streamline carbon emission tracking, corporate sustainability benchmarking, corporate social responsibility (CSR) initiatives, regulatory compliance audits, and gamified ecological performance.

---

## 🛠️ Technical Stack & Architecture

EcoSphere is structured as a **full-stack, server-authoritative application** with a React frontend and an Express backend, using a secure and fast local filesystem database.

### 1. Technology Suite
*   **Frontend**: React 19, TypeScript, Tailwind CSS v4.x (using modern off-white and charcoal display typography), Lucide React (for standard high-contrast vector iconography), and Recharts/D3 (for rich visualization overlays).
*   **Backend**: Node.js, Express v4, TypeScript, and `esbuild` for production compilation.
*   **LLM Processing**: Google Gemini API via the `@google/genai` TypeScript SDK for automated C-suite executive ESG summaries.

### 2. Core Node.js System Modules
The server persistence and security models are built natively using Core Node.js standard library APIs. The module imports in `/server/db.ts` and `/server.ts` serve the following core functions:

*   **`fs` (Filesystem)**: Provides synchronous and asynchronous block reads and writes to manage a durable, atomic flat-file database storage system (`db.json`) directly on the container.
*   **`path` (Path Utility)**: Resolves system-agnostic relative routes across development workspaces and production bundles to consistently point to configuration environments and data logs.
*   **`crypto` (Cryptography)**:
    *   **Password Hashing**: Implements secure SHA-256 password hash structures with zero-dependency crypto hashing functions.
    *   **Custom JWT Authentication Engine**: Generates and verifies cryptographic session tokens securely utilizing HMAC SHA-256 (`crypto.createHmac`) without external overhead, ensuring robust session-level access verification across client routes.

---

## 🌟 Primary Platform Modules

The portal is separated into distinct, role-secured operational centers:

### 📊 Executive Dashboard
*   **Enterprise Scoring**: Displays real-time calculations for individual **E, S, and G** indices aggregated from live operations data.
*   **Carbon Progression Analytics**: Provides structured charts outlining monthly emissions, offsets, and waste volume trends.
*   **Division Breakdown**: Highlights top-performing corporate divisions and areas with active governance issues.

### 🍃 Environmental Center
*   **Emission Transactions**: Enables logging of carbon indicators such as electricity consumption, flight offsets, and vehicle usage.
*   **Water & Waste Ledger**: Logs physical resource footprints with strict validation schemas.
*   **Ecological Goal Tracker**: Lets division managers track real-time target metrics relative to baseline carbon levels.

### 🤝 Social & Community Center
*   **CSR Outreach Portal**: Features community-oriented initiatives (such as beach cleanups, educational drives, and tree plantings).
*   **Volunteer Tracking**: Logs active employee registrations, actual volunteer hours, and community reach metrics.
*   **Impact Metrics**: Computes division outreach scores dynamically based on engagement levels.

### ⚖️ Governance & Compliance Board
*   **Policy Acknowledgement**: Secures secure corporate signatures on ethical conducts, sustainability guidelines, and standard operating procedures.
*   **Breach Reporting**: Features a ticketing pipeline to report, categorize, and assign division compliance issues (Low to Critical Severity).
*   **Regulatory Audits**: Schedules and logs third-party ESG audits, scoring them out of 100 to evaluate corporate standards.

### 🏆 Ecological Gamification Center
*   **Green Challenges**: Offers active employee programs to build daily eco-habits (e.g. carpooling, zero-waste lunch).
*   **Leaderboard**: A dynamic Sustainability Hall of Fame calculating organizational ranking by aggregated XP.
*   **Rewards Bazaar**: Enables employees to spend accumulated ESG points on real carbon-offset rewards.

### 🤖 ESG Reports & Gemini AI Integration
*   **Reports Filter**: Allows users to compile raw data statements by department or custom date range.
*   **C-Suite AI Analytics**: Feeds current statistical performance directly to the Google Gemini model to synthesize C-suite executive summaries, analyzing operational weaknesses and suggesting remediation strategies.

---

## 🔑 User Roles & Access Control

Access control is strictly validated via the custom JWT authentication layer on both client-side routers and Express server routes:

| Role | Environmental logs | Create Policies / Raise Breaches | Edit Master Indicators |
| :--- | :---: | :---: | :---: |
| **System Admin** (`admin`) | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **Compliance Auditor** (`auditor`) | 👁️ Read-Only | ✅ Full Access | 👁️ Read-Only |
| **Department Head** (`dept_head`) | ✅ Dept-Level Logs | ❌ Denied | ✅ Dept Indicators |
| **Corporate Employee** (`employee`) | ✅ Self Logging | ❌ Denied | ❌ Denied |

---

## 🚀 Installation & Local Development

### Prerequisites
1.  **Node.js**: Version 18 or above is required.
2.  **API Keys**: A Google Gemini API Key configured in your environment is required to enable the AI executive summaries.

### Setup Steps

1.  **Clone the Repository** and navigate to the project directory.
2.  **Configure Environment Variables**:
    Create a `.env` file at the root of the project (referencing `.env.example`):
    ```env
    PORT=3000
    GEMINI_API_KEY=your_gemini_api_key_here
    JWT_SECRET=your_custom_secure_jwt_secret_here
    ```
3.  **Install Dependencies**:
    ```bash
    npm install
    ```
4.  **Launch the Development Server**:
    This boots up the backend Express server (and mounts the Vite dev server for live UI feedback) on `http://localhost:3000`:
    ```bash
    npm run dev
    ```
### Production Build & Deployment
To bundle the application for production deployment:
1.  **Build Frontend & Server Assets**:
    Compiles the React application and bundles the TypeScript backend server into a single CJS bundle:
    ```bash
    npm run build
    ```
2.  **Launch Production Server**:
    Runs the compiled server file (`dist/server.cjs`) to handle server-side routes and serve production assets:
    ```bash
    npm run start
    ```
---
## 📂 Project Structure
```text
├── server.ts                 # Express entry point & API routes proxy
├── package.json              # App dependencies & compilation scripts
├── db.json                   # Flat-file database storage (managed by db.ts)
├── server/
│   └── db.ts                 # Filesystem-based JSON Database Engine (fs, path, crypto)
└── src/
    ├── main.tsx              # React mounting entry point
    ├── App.tsx               # Primary Navigation & App Root Frame
    ├── types.ts              # System-wide static TypeScript interfaces & schemas
    ├── index.css             # Tailwind CSS global styles & theme definitions
    └── components/
        ├── AuthPages.tsx     # Sign-in, sign-up, and password validation
        ├── Sidebar.tsx       # Profile sidebar & navigation controls
        ├── DashboardView.tsx # Corporate stats, charts & overview metrics
        ├── EnvironmentView.tsx # Carbon emissions & resource log management
        ├── SocialView.tsx    # CSR programs & impact analytics
        ├── GovernanceView.tsx # Policy signatures & breach management
        ├── GamificationView.tsx # Challenges, rewards & leaderboards
        ├── ReportsView.tsx   # ESG compiler & Gemini AI reports generator
        └── MasterDataView.tsx # Departments configuration & indicator weights
```
