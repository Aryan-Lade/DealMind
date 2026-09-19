# ⚡ DealMind — AI Negotiation Strategist & Simulator

> **Master high-stakes negotiations before they happen.**  
> DealMind is a modern, intelligent negotiation preparation platform that analyzes your leverage, predicts counterparty moves, formulates optimal anchors, and simulates realistic roleplay conversations with real-time executive AI coaching.

---

## 🚀 Key Features

- 🎯 **Intelligent Strategy Formulation**: Input your current offer, target, walk-away number, and BATNA. DealMind calculates your leverage score, acceptance probability, opening anchor, and trade-off strategies.
- 🎭 **Interactive Roleplay Simulator**: Practice in a simulated arena against an AI opponent calibrated to different negotiation styles (Collaborative, Professional, Firm, Aggressive).
- 🧠 **Live In-Conversation AI Coach**: Evaluates each message you send in real time, warns against early concessions, recommends tactical pivots, and scores your performance.
- ⚡ **Instant Practice Scenarios**: Pre-configured roleplay arenas for **Salary Negotiations**, **Apartment Rent Renewals**, **High-Ticket Freelance Retainers**, and **Enterprise SaaS Procurement**.
- 📊 **Negotiation Insights & Analytics**: Track historical negotiation scores, target achievement percentages, concession counts, and negotiation types with rich charts.
- 🔑 **Flexible AI Integration**: Works out-of-the-box in **Demo Mode** with realistic mock responses, or connect your **Google Gemini 2.0 Flash** API key directly via the in-app Settings page or `.env`.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Vanilla CSS (Custom Design System with Glassmorphism & Dark Mode)
- **Icons**: Lucide React
- **Data Visualization**: Recharts
- **AI Engine**: Google Gemini API (`gemini-2.0-flash`)
- **State & Storage**: React Context API + LocalStorage persistence

---

## 📁 Project Structure

```text
DealMind-/
├── public/                 # Static assets & favicons
├── src/
│   ├── assets/             # Brand logos and vector graphics
│   ├── components/         # Reusable UI components (Navbar, etc.)
│   ├── contexts/           # State management (AuthContext, NegotiationContext)
│   ├── data/               # Mock data, demo scenarios, scoring algorithms
│   ├── layouts/            # Application layouts (Sidebar, responsive shell)
│   ├── pages/              # Views (Landing, Dashboard, Simulator, Insights, Settings)
│   ├── services/           # AI services (Gemini API integration & mock fallbacks)
│   ├── App.tsx             # Root router & protected routes
│   ├── index.css           # Global design system tokens and typography
│   ├── main.tsx            # React application entry point
│   └── vite-env.d.ts       # Vite client and module type definitions
├── .env.example            # Sample environment configuration
├── .gitignore              # Git ignore rules (node_modules, .env, dist)
├── index.html              # HTML shell
├── package.json            # Dependencies and npm scripts
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite build configuration
```

---

## 🏁 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/Aryan-Lade/DealMind-.git
cd DealMind-
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```

The application will start at `http://localhost:5173/`.

### 4. (Optional) Configure Gemini API Key
You can use the app without any configuration in **Demo Mode**.  
To enable live AI generation:
1. Open the **Settings** tab in DealMind.
2. Enter your Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
3. Click **Test API Key** to verify connection, then click **Save Preferences**.

Alternatively, create a `.env` file:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### 5. Build for Production
```bash
npm run build
```

---

## 🛡️ License

This project is licensed under the MIT License.
