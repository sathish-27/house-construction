# 🚀 Free Deployment Guide: House Construction Tracker

This application is ready to deploy **100% free with no credit card required**.

---

## 🌟 Method 1 (Recommended): Vercel + Turso Cloud SQLite (24/7 Access from Anywhere)

This gives you a permanent, public HTTPS link (e.g. `https://my-house-construction.vercel.app`) that you can open on your mobile phone from the construction site at any time, even when your computer is off.

### Step 1: Create a Free Cloud SQLite Database on Turso (1 minute)
1. Go to **[https://turso.tech](https://turso.tech)** and sign up (Log in with GitHub or Google — **no credit card needed**).
2. Click **"Create Database"**:
   - **Name**: `house-construction`
   - **Location**: Pick the closest region (e.g. `bom` for Mumbai / India, or nearest to you).
3. Once created, click on your database:
   - Copy the **Database URL** (starts with `libsql://house-construction-...turso.io`).
   - Click **"Generate Token"** and copy the **Auth Token**.

---

### Step 2: Push your code to GitHub
If you haven't already initialized git:
```bash
git init
git add .
git commit -m "House construction tracker ready for free deployment"
```
Create a new private or public repository on [GitHub](https://github.com/new), and push your code:
```bash
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git branch -M main
git push -u origin main
```

---

### Step 3: Deploy for Free on Vercel
1. Go to **[https://vercel.com](https://vercel.com)** and sign in with GitHub.
2. Click **"Add New..."** > **"Project"**.
3. Select your GitHub repository and click **Import**.
4. Expand the **Environment Variables** section and add these two:
   - `TURSO_DATABASE_URL`: *(Paste your `libsql://...` URL from Step 1)*
   - `TURSO_AUTH_TOKEN`: *(Paste your Auth Token from Step 1)*
5. Click **Deploy**!

Within ~1 minute, Vercel will give you a live HTTPS link!
- When you open the site for the first time, all tables, construction phases, default labour roles, and materials will automatically initialize in your Turso SQLite database.
- Every entry you make on your phone will save permanently to your cloud SQLite database.

---

## 💻 Method 2: Host from your PC using Free Cloudflare Tunnel (Zero Cloud Accounts)

If you prefer to keep the database strictly on your computer disk (`./data/construction.db`) and just want a quick link to access it from your phone:

1. In your terminal, start the app:
   ```bash
   npm run start
   # or
   npm run dev
   ```
2. In a second terminal window, run:
   ```bash
   npx cloudflared tunnel --url http://localhost:3000
   ```
3. Cloudflare will output a temporary free HTTPS URL (like `https://xxxx.trycloudflare.com`).
4. Open that URL on your phone!

*Note: Your PC must be powered on and connected to the internet while using Method 2.*
