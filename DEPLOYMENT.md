# 🚀 Production Deployment Guide

## Option A: Docker on VPS (Recommended for Full Local LLM)

### Providers: DigitalOcean, Hetzner, AWS EC2, Azure VM

**Minimum Specs for Mistral:**
- 8GB RAM (16GB recommended)
- 4 vCPU
- 50GB SSD
- Ubuntu 22.04

```bash
# 1. SSH into your server
ssh root@YOUR_SERVER_IP

# 2. Install Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker

# 3. Clone project
git clone https://github.com/YOUR_REPO/education-tutor.git
cd education-tutor

# 4. Configure environment
cp .env.example .env
nano .env
# Set: MONGODB_URI, JWT_SECRET_KEY, ALLOWED_ORIGINS=http://YOUR_DOMAIN

# 5. Start services
docker-compose up -d

# 6. Wait for Mistral to download (~5 min)
docker-compose logs -f ollama-init

# 7. Create Atlas vector index
docker-compose exec backend python setup_atlas_index.py

# 8. Seed default accounts
docker-compose exec backend python seed.py

# 9. Point your domain DNS A record → server IP
# 10. (Optional) Add SSL with Certbot
apt install certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com
```

---

## Option B: Backend on Railway + Frontend on Vercel

> ⚠️ Railway does NOT support Ollama. You need a separate Ollama instance.
> Use this option if you have Ollama running on a separate server/GPU.

### Step 1: Deploy Backend on Railway

1. Push `backend/` to a GitHub repo
2. Go to https://railway.app → New Project → Deploy from GitHub
3. Select your repo
4. Set **Root Directory**: `backend`
5. Set **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add all environment variables:
   ```
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET_KEY=your-secret
   OLLAMA_BASE_URL=http://your-ollama-server:11434
   ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
   ```
7. Note your Railway backend URL: `https://your-app.railway.app`

### Step 2: Deploy Frontend on Vercel

1. Push `frontend/` to GitHub
2. Go to https://vercel.com → New Project → Import
3. Set **Framework**: Other
4. Set **Root Directory**: `frontend`
5. Add environment variable: `API_BASE = https://your-app.railway.app/api`

> **Note**: Update `js/api.js` line 2:
> ```js
> const API_BASE = window.API_BASE || 'https://your-app.railway.app/api';
> ```

---

## Option C: Render.com Backend

1. Create new **Web Service** on Render
2. Connect your GitHub repo
3. Set:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory**: `backend`
4. Add environment variables (same as Railway above)
5. Use **Free plan** for testing (will sleep after inactivity)

---

## MongoDB Atlas Setup (All Options)

### Create Free Cluster
1. Go to https://cloud.mongodb.com
2. Create **M0 Free** cluster (for dev) or **M10** (for Vector Search in production)
3. Create database user: Security → Database Access
4. Whitelist IPs: Security → Network Access → `0.0.0.0/0` (or your server IP)
5. Get connection string: Deployment → Connect → Drivers

### Create Vector Search Index
**Option 1 – Script** (recommended):
```bash
python setup_atlas_index.py
```

**Option 2 – Atlas UI**:
1. Go to your cluster → Search → Create Search Index
2. Choose **JSON Editor**
3. Select collection: `education_tutor.chunks`
4. Paste this JSON:
```json
{
  "name": "embedding_index",
  "type": "vectorSearch",
  "definition": {
    "fields": [
      {
        "type": "vector",
        "path": "embedding",
        "numDimensions": 384,
        "similarity": "cosine"
      },
      {
        "type": "filter",
        "path": "textbook_id"
      },
      {
        "type": "filter",
        "path": "subject"
      }
    ]
  }
}
```
5. Click **Create Search Index** – takes 2–3 minutes to activate

> ⚠️ Atlas Vector Search requires **M10+** cluster in production.
> For development/testing, the fallback cosine similarity scan is used automatically.

---

## Ollama on Separate Server

If your backend is on Render/Railway (no GPU), run Ollama on a cheap GPU VPS:

```bash
# On GPU server (e.g. Lambda Labs, Vast.ai, RunPod)
curl -fsSL https://ollama.com/install.sh | sh
ollama pull neural-chat
ollama serve --host 0.0.0.0   # Listen on all interfaces
```

Then set `OLLAMA_BASE_URL=http://YOUR_GPU_SERVER_IP:11434` in your backend env.

---

## SSL / HTTPS with Let's Encrypt (VPS Only)

```bash
# Install Certbot
apt update && apt install certbot python3-certbot-nginx -y

# Get certificate (replace with your domain)
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
systemctl enable certbot.timer
```

Update `nginx.conf` HTTPS block:
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    # ... rest of config
}
```

---

## Environment Variables Reference

| Variable | Required | Example |
|---|---|---|
| `MONGODB_URI` | ✅ | `mongodb+srv://user:pass@cluster.mongodb.net/` |
| `MONGODB_DB` | ❌ | `education_tutor` |
| `JWT_SECRET_KEY` | ✅ | `your-64-char-random-string` |
| `JWT_EXPIRE_MINUTES` | ❌ | `1440` (24h) |
| `OLLAMA_BASE_URL` | ✅ | `http://ollama:11434` |
| `LLM_MODEL` | ❌ | `neural-chat` |
| `LLM_TIMEOUT` | ❌ | `120` |
| `ALLOWED_ORIGINS` | ✅ | `https://yourdomain.com` |
| `MAX_PDF_SIZE_MB` | ❌ | `50` |
| `TOP_K_CHUNKS` | ❌ | `10` |
| `MAX_CONTEXT_TOKENS` | ❌ | `1500` |
| `PRUNE_SIMILARITY` | ❌ | `0.45` |
| `SEED_ADMIN_EMAIL` | ❌ | `admin@school.edu` |
| `SEED_ADMIN_PASS` | ❌ | `Admin@123` |

---

## Post-Deployment Checklist

- [ ] MongoDB Atlas cluster created and URI added to `.env`
- [ ] Vector Search index created on `chunks` collection
- [ ] `JWT_SECRET_KEY` set to a long, random string
- [ ] `ALLOWED_ORIGINS` set to your frontend domain
- [ ] `docker-compose up -d` (or Railway/Render deployed)
- [ ] Mistral model downloaded: `make pull-model`
- [ ] Seed script run: `make seed`
- [ ] Admin account can log in at `/login.html`
- [ ] Test PDF upload in admin panel
- [ ] Test asking a question as student
- [ ] Health check: `make health`
