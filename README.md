# 🌊 Cyclos: Ocean Intelligence & Circular Economy Platform

![Cyclos Banner](https://images.unsplash.com/photo-1582967664187-575ba2ec1de1?auto=format&fit=crop&w=1200&q=80) 

**Cyclos** is a next-generation marine conservation, ocean tracking, and circular economy ecosystem. Designed as a unified defense against ocean-bound plastic (OBP) and marine ecosystem collapse, it blends **Real-time Satellite/Map Data**, **NVIDIA NIM AI Operations**, and **Supabase Backend Infrastructure** into a stunning, gamified, and actionable dashboard.

---

## 🚀 Key Features

### 🌐 Global Ocean Heatmap (Powered by Leaflet)
An interactive geographic interface tracking ocean plastic density, coral reef health, and ghost net sightings.
- Users can click on heavily polluted regional ocean markers.
- **AI-Powered Diagnostics:** Uses NVIDIA NIM Llama models to analyze the coordinates and present highly accurate environmental threat assessments instantly.

### 🤖 EcoCaptain AI & Vision Analytics
Driven by the bleeding-edge **NVIDIA NIM AI ecosystem**:
- **Vision AI (`llama-3.2-11b-vision-instruct`):** Upload an image of beach/ocean waste, and Cyclos will analyze its material composition, calculate its decomposition rate, CO2 impact, and suggest upcycling methods—returning structured JSON data to the UI.
- **Reasoning AI (`llama-3.3-70b-instruct`):** Powers the EcoCaptain assistant who provides expert marine sustainability advice, generates coastal insights, and drafts emergency reports.

### 🚨 Autonomous SOS & Incident Dispatacher 
Forget filling out tedious paperwork. If a user spots an oil-leak or marine entanglement:
- Drop a pin on the map.
- Upload satellite or drone imagery.
- Select the Threat Level.
- **AI SOS Drafting:** NVIDIA AI automatically drafts a highly professional, structured incident email addressed to Maritime Authorities.
- **Backend-less Email Dispatch:** Uses FormSubmit to securely transport the drafted SOS and the user's raw image attachment directly to registered global authority inboxes.

### 🏛️ Upcycle Marketplace & Community Hub
Powered by **Supabase Postgres + Realtime WebSockets**:
- **Secured Authentication:** Passwordless and Social Auth capabilities.
- **Marketplace:** Creators can list Upcycled goods made from recovered Ocean Bound Plastics. Features QR-code generation bridging real-world products to digital recycling histories.
- **Real-time Engine:** Whenever a buyer requests an item, or an organizer drops a new beach cleanup event, the Cyclos WebSocket infrastructure pushes notifications across the platform instantly without refreshing.

---

## 🛠️ Tech Stack & Architecture

- **Frontend Core:** React 19, Vite, React Router V7
- **Styling:** Modular Vanilla CSS tailored for an immersive *Deep Sea Glassmorphism* aesthetic. Framer Motion & GSAP for liquid-smooth performance.
- **Database & Auth:** Supabase (PostgreSQL, Row Level Security, Auth, Real-time Subscriptions)
- **AI Infrastructure:** NVIDIA NIM (`meta/llama-3.3-70b-instruct` and `meta/llama-3.2-11b-vision-instruct`).
- **Mapping:** `leaflet` and `react-leaflet`.
- **Media & Scanning:** `react-qr-code`, `@yudiel/react-qr-scanner`.

---

## 📂 Project Structure

```text
cyclos/
├── public/                 # Static assets
├── src/                    
│   ├── components/         # Reusable global components (BottomNav, Auth UI)
│   ├── context/            # React Contexts (AuthContext)
│   ├── pages/              # Primary Routes (MainPage, Map, Scanner, Market, etc.)
│   ├── services/           # NVIDIA NIM & API Integrations
│   └── supabase/           # Client configuration
├── package.json            # Vite + React configs
└── README.md
```

---

## ⚙️ Getting Started

### 1. Prerequisites
Ensure you have the following installed on your local machine:
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- Basic knowledge of configuring Supabase.

### 2. Installation Setup

Clone the repository and install the Vite application dependencies:

```bash
git clone https://github.com/AdvayaBGSCET/team-nether-watchers.git
cd Cyclos
npm install
```

### 3. Environment Setup
To ensure the backend and AI models run smoothly, ensure the following are configured. You will need API keys for:
- **Supabase**: Obtain your `URL` and `ANON KEY`.
- **NVIDIA NIM**: Create an account and grab an API key to access Llama 3 models.

Place these keys in `.env` (or directly within `src/supabase/supabaseClient.js` and `src/services/nvidiaNim.js` if you are hosting safely on closed Vercel environment variables).

### 4. Running the Dev Server

```bash
npm run dev
```

The application will bind to `localhost:5174` (or `5173`).

---

## 🤝 Contributing
Cyclos is part of the global initiative to reverse ocean damage. Feel free to `Fork`, open `Issues`, and submit `Pull Requests` focusing on:
- Extending map data layers.
- Enhancing the NVIDIA payload token efficiency.
- Re-styling and expanding community impact gamification.

### Developed for the Ocean. Engineered for the Future. 🌍
