# 🚀 TaskFlow — Deploy to GitHub + Vercel + Render

Complete step-by-step guide to publish your app online for free.

---

## STEP 1 — Publish to GitHub

### Install Git (if not installed)
Download from: https://git-scm.com/download/win
Verify: open PowerShell and run `git --version`

### Create GitHub account
Sign up at https://github.com if you don't have one.

### Initialize your repository

```powershell
# Navigate to your project root
cd C:\Users\p1412\Downloads\taskflow

# Initialize git
git init

# Create .gitignore to keep secrets safe
```

Create a file called `.gitignore` in the root `taskflow/` folder:
```
node_modules/
backend/.env
frontend/.env
frontend/dist/
*.log
.DS_Store
```

```powershell
# Stage all files
git add .

# First commit
git commit -m "feat: initial TaskFlow commit"
```

### Create GitHub repository

1. Go to https://github.com/new
2. Repository name: `taskflow`
3. Set to **Public** (required for free Vercel hosting)
4. Click **Create repository**
5. Copy the commands GitHub shows you, they look like:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/taskflow.git
git branch -M main
git push -u origin main
```

Run those 3 commands in PowerShell. Done — your code is on GitHub!

### Push updates in future
```powershell
git add .
git commit -m "feat: added email reminders"
git push
```

---

## STEP 2 — Deploy Backend to Render (Free)

### Create account
Sign up at https://render.com with your GitHub account.

### Create Web Service
1. Click **New** → **Web Service**
2. Click **Connect a repository** → select `taskflow`
3. Fill in:
   - **Name:** `taskflow-api`
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

### Add Environment Variables
In the Render dashboard → **Environment** tab, add these:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `MONGODB_URI` | `mongodb+srv://<username>:<password>@cluster0...` |
| `JWT_SECRET` | any random 32+ char string |
| `JWT_EXPIRE` | `7d` |
| `JWT_REFRESH_SECRET` | another random 32+ char string |
| `JWT_REFRESH_EXPIRE` | `30d` |
| `CLIENT_URL` | `https://taskflow-YOUR_NAME.vercel.app` (add after Vercel deploy) |
| `GROQ_API_KEY` | `your_groq_api_key_here` |
| `RESEND_API_KEY` | your Resend key (optional) |

Generate random secrets with:
```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

4. Click **Create Web Service**
5. Wait ~3 minutes for first deploy
6. Your API URL will be: `https://taskflow-api.onrender.com`

---

## STEP 3 — Deploy Frontend to Vercel (Free)

### Create account
Sign up at https://vercel.com with your GitHub account.

### Deploy
1. Click **Add New** → **Project**
2. Import your `taskflow` repository
3. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

4. Add **Environment Variables:**

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://taskflow-api.onrender.com/api/v1` |

5. Click **Deploy**
6. Your app URL: `https://taskflow-YOUR_NAME.vercel.app`

### Update Render with your Vercel URL
Go back to Render → Environment → update `CLIENT_URL` to your Vercel URL.

---

## STEP 4 — Set Up Email Reminders (Optional, Free)

### Get Resend API key (3000 free emails/month)
1. Sign up at https://resend.com
2. Go to **API Keys** → **Create API Key**
3. Add to Render environment: `RESEND_API_KEY` = your key

### For production email (recommended)
Add your domain in Resend → **Domains** and verify it.
Then update `FROM_EMAIL` in Render: `TaskFlow <reminders@yourdomain.com>`

### For testing without a domain
Use `onboarding@resend.dev` as FROM_EMAIL — works immediately,
but emails only go to your own Resend account email.

---

## STEP 5 — Custom Domain (Optional)

### Free subdomain via Vercel
Your app already has: `taskflow-yourname.vercel.app`

### Add your own domain
1. Buy domain at Namecheap, GoDaddy, or Cloudflare (~$10/year)
2. In Vercel → **Settings** → **Domains** → add your domain
3. Update DNS records as Vercel instructs (takes ~24h to propagate)

---

## Summary

| Service | Cost | URL |
|---------|------|-----|
| **GitHub** | Free | Source code hosting |
| **Render** | Free | Backend API (may sleep after 15min inactivity on free tier) |
| **Vercel** | Free | Frontend (always fast, CDN) |
| **MongoDB Atlas** | Free | Database (512MB) |
| **Groq** | Free | AI features |
| **Resend** | Free | 3000 emails/month |

**Total cost: $0/month** 🎉

---

## Troubleshooting

**Backend sleeping on Render free tier:**
Free tier services sleep after 15 minutes of inactivity.
First request after sleep takes ~30 seconds. Upgrade to $7/month Starter to fix this.

**CORS errors after deploy:**
Make sure `CLIENT_URL` on Render exactly matches your Vercel URL (no trailing slash).

**MongoDB connection refused:**
In Atlas → Network Access → add `0.0.0.0/0` to allow all IPs (Render uses dynamic IPs).

**Socket.io not connecting:**
Make sure `VITE_SOCKET_URL` in Vercel env = your Render URL (without /api path).
