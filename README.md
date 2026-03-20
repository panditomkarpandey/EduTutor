# 📚 Education Tutor for Remote India

**AI-powered RAG tutoring platform for rural students** — built for low bandwidth, Hindi + English, CBSE/ICSE/State board support.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🤖 RAG Q&A | Vector search + context pruning + Mistral LLM |
| 📤 PDF Ingestion | Auto-extract, chapter detect, chunk, embed once |
| ✏️ Quiz Generation | AI-generated MCQs from textbook content |
| 🗣️ Multilingual | Hindi + English answers |
| 🎤 Voice Input | Web Speech API voice questions |
| ⚡ FAQ Cache | Repeated questions served from cache (zero LLM cost) |
| 📊 Admin Analytics | Student counts, question trends, cache ratios |
| 🔒 Auth | JWT + bcrypt, role-based (admin/student) |
| 📱 Mobile-first | Works on low-end phones, gzip compressed |

---

## 🏗️ Architecture

```
Student Browser
     │
     ▼
Nginx (port 80) ─── Static Frontend (HTML/CSS/JS)
     │
     ▼ /api/*
FastAPI Backend (port 8000)
     ├── Auth (JWT + bcrypt)
     ├── PDF Ingestion Pipeline
     │     └── PyPDF → Chunk → SentenceTransformer → MongoDB
     ├── RAG Pipeline
     │     └── Embed question → Vector Search → Prune → Mistral
     └── Admin / Analytics
          │
          ▼
MongoDB Atlas ←──── Vector Search (cosine, 384-dim)
          │
Ollama (Mistral) ◄── LLM inference (local, zero cost)
```

---

## 🚀 Quick Start (Docker)

### Prerequisites
- Docker + Docker Compose installed
- MongoDB Atlas account (free M0 for dev, M10+ for production Vector Search)
- 8GB+ RAM (for Mistral model)

### 1. Clone and configure

```bash
git clone <your-repo>
cd education-tutor
cp .env.example .env
```

Edit `.env`:
```env
MONGODB_URI=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/
JWT_SECRET_KEY=your-super-secret-key-here
ALLOWED_ORIGINS=http://localhost,http://your-domain.com
```

### 2. Start all services

```bash
docker-compose up -d
```

This will:
- Start **Ollama** and automatically pull the `neural-chat` model (~2.8GB)
- Build and start the **FastAPI backend**
- Start **Nginx** serving the frontend

> ⚠️ First run takes 5–10 minutes to download the Mistral model.

### 3. Set up MongoDB Vector Search Index

```bash
cd backend
python setup_atlas_index.py
```

Or create manually in Atlas UI — see the script for JSON definition.

### 4. Create admin account

```bash
curl -X POST http://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@school.edu","password":"admin123","role":"admin"}'
```

### 5. Open in browser

- **Frontend**: http://localhost
- **API Docs**: http://localhost:8000/docs
- **Health check**: http://localhost/health

---

## 💻 Local Development (without Docker)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copy and configure environment
cp ../.env.example .env

# Run dev server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

Serve `frontend/` with any static server:
```bash
cd frontend
python -m http.server 3000
# or
npx serve . -p 3000
```

Open: http://localhost:3000

### Ollama (LLM)

```bash
# Install Ollama: https://ollama.com
ollama pull neural-chat
ollama serve
```

---

## 📁 Project Structure

```
education-tutor/
├── backend/
│   ├── api/
│   │   ├── auth.py          # Register, login, JWT
│   │   ├── admin.py         # PDF upload, textbook management
│   │   ├── chat.py          # RAG Q&A, history
│   │   ├── quiz.py          # Quiz generation & submission
│   │   ├── search.py        # Semantic search, textbook list
│   │   └── analytics.py     # Admin dashboard stats
│   ├── models/
│   │   └── schemas.py       # Pydantic models
│   ├── services/
│   │   ├── pdf_service.py   # PDF extraction, chunking
│   │   ├── rag_service.py   # Vector search, context pruning
│   │   └── llm_service.py   # Ollama/Mistral integration
│   ├── utils/
│   │   ├── auth.py          # JWT, bcrypt helpers
│   │   ├── db.py            # MongoDB connection, indexes
│   │   └── embeddings.py    # SentenceTransformer wrapper
│   ├── main.py              # FastAPI app, middleware
│   ├── setup_atlas_index.py # Atlas Vector Search setup
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── index.html           # Landing page
│   ├── login.html           # Auth (login + register)
│   ├── dashboard.html       # Student: chat, quiz, search
│   ├── admin.html           # Admin: upload, analytics
│   ├── css/main.css         # Mobile-first design system
│   └── js/api.js            # API client, auth, utilities
├── nginx/
│   └── nginx.conf           # Reverse proxy + gzip
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register (student/admin) |
| POST | `/api/auth/login` | Login, get JWT token |

### Admin (requires admin JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/upload-textbook` | Upload PDF + metadata |
| GET | `/api/admin/textbooks` | List all textbooks |
| DELETE | `/api/admin/textbooks/{id}` | Delete textbook + embeddings |
| GET | `/api/admin/textbook-status/{id}` | Check processing status |

### Chat (requires JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/ask` | Ask a question (RAG) |
| GET | `/api/chat/history` | Get question history |
| DELETE | `/api/chat/history` | Clear history |

### Quiz (requires JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/quiz/generate` | Generate MCQ quiz |
| POST | `/api/quiz/submit/{id}` | Submit answers |
| GET | `/api/quiz/history` | Get past quizzes |

### Search (requires JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/search/textbooks` | Search textbooks |
| GET | `/api/search/semantic?q=` | Semantic content search |
| GET | `/api/search/boards` | Get boards/classes/subjects |

### Analytics (requires admin JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/dashboard` | Full analytics overview |
| GET | `/api/analytics/students` | Student list |

Full interactive docs: `http://localhost:8000/docs`

---

## 🧠 RAG Pipeline Details

```
Student Question
       │
       ▼
Generate Embedding (all-MiniLM-L6-v2, 384-dim)
       │
       ▼
MongoDB Atlas Vector Search
  → top 10 chunks (cosine similarity)
       │
       ▼
Context Pruning:
  → Filter: score ≥ 0.45
  → Sort by score
  → Deduplicate chapters
  → Limit: 1500 tokens
       │
       ▼
Build Context String
       │
       ▼
Mistral (via Ollama) + System Prompt
       │
       ▼
Structured JSON Answer:
  {
    "simple_explanation": ...,
    "example": ...,
    "summary": ...,
    "practice_question": ...
  }
       │
       ▼
FAQ Cache (MongoDB) → future identical questions served instantly
```

---

## ☁️ Production Deployment

### Backend → Render.com

1. Push backend to GitHub
2. Create new Web Service on Render
3. Set Build Command: `pip install -r requirements.txt`
4. Set Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add all environment variables from `.env`

> Note: Ollama cannot run on Render free tier. Use Railway or a VPS for GPU support.

### Frontend → Vercel

1. Push frontend folder to GitHub
2. Import in Vercel
3. Set root to `/frontend`
4. Update `API_BASE` in `js/api.js` to your Render backend URL

### Recommended: VPS (DigitalOcean/Hetzner)

For full local LLM support:
```bash
# On VPS with 8GB+ RAM
git clone <repo>
cd education-tutor
cp .env.example .env
# Edit .env with your MongoDB Atlas URI
docker-compose up -d
```

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGODB_URI` | — | MongoDB Atlas connection string |
| `MONGODB_DB` | `education_tutor` | Database name |
| `JWT_SECRET_KEY` | — | Secret for JWT signing |
| `JWT_EXPIRE_MINUTES` | `1440` | Token expiry (24h) |
| `OLLAMA_BASE_URL` | `http://ollama:11434` | Ollama server URL |
| `LLM_MODEL` | `neural-chat` | Ollama model name |
| `LLM_TIMEOUT` | `120` | LLM request timeout (seconds) |
| `TOP_K_CHUNKS` | `10` | Chunks to retrieve |
| `MAX_CONTEXT_TOKENS` | `1500` | Max tokens sent to LLM |
| `PRUNE_SIMILARITY` | `0.45` | Min similarity for pruning |
| `MAX_PDF_SIZE_MB` | `50` | Max PDF upload size |
| `ALLOWED_ORIGINS` | `http://localhost` | CORS origins (comma-separated) |

---

## 🔒 Security Features

- ✅ bcrypt password hashing (cost factor 12)
- ✅ JWT tokens with expiry
- ✅ Role-based access (admin/student)
- ✅ Rate limiting (SlowAPI)
- ✅ PDF-only file upload validation
- ✅ CORS protection
- ✅ Pydantic input validation
- ✅ Gzip compression

---

## 📱 Low Bandwidth Optimizations

- Gzip enabled on Nginx (min 1KB)
- Minimal vanilla JS (no heavy frameworks)
- Lazy loading of history/analytics
- FAQ caching (repeated LLM calls avoided)
- Small JSON responses (only needed fields)
- Context pruning limits tokens sent to LLM

---

## 🤝 Contributing

Pull requests welcome! Areas to improve:
- Add more Indian regional language support (Tamil, Telugu, Bengali)
- Offline PWA support for zero-connectivity areas
- SMS-based question answering for feature phones
- Integration with DIKSHA (India's national education platform)

---

## 📄 License

MIT License — Free to use, modify, and deploy.

Built with ❤️ for students across rural Bharat 🇮🇳
