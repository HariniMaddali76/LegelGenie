# ⚖️ LegalGenie – AI Legal Research Assistant

LegalGenie is an AI-powered application that helps users analyze PDF documents, answer legal research questions, generate case briefs, and manage research history.

## 🚀 Features
- PDF Upload and Management
- AI-Powered Legal Research
- Clickable PDF Page Citations
- AI Case Brief Generation
- Research History Management
- Responsive User Interface

## 🛠️ Tech Stack
- **Frontend:** React.js, Vite, CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas
- **AI:** Google Gemini API
- **Deployment:** Render

## ⚙️ Installation

**1. Clone the repository**
```bash
git clone https://github.com/HariniMaddali76/LegelGenie.git
cd LegelGenie
```

**2. Install backend dependencies**
```bash
cd backend
npm install
```

Create a `backend/.env` file:
```env
PORT=5000
MONGODB_URI=your_mongodb_uri
GEMINI_API_KEY=your_gemini_api_key
```

Start the backend:
```bash
npm start
```

**3. Install frontend dependencies**

Open a new terminal:
```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:
```bash
npm run dev
```

## 🌐 Links

- **GitHub:** [LegalGenie Repository](https://github.com/HariniMaddali76/LegelGenie)
- **Backend API:** [Live API](https://legelgenie.onrender.com)
- **Live Demo:** [LegalGenie Frontend](https://legelgenie-frontend.onrender.com)

## ⚠️ Disclaimer
AI-generated legal information may be inaccurate or incomplete. Verify important information against original legal documents. This application does not replace professional legal advice.

## 👩‍💻 Author
**Harini Maddali** · [GitHub Profile](https://github.com/HariniMaddali76)
