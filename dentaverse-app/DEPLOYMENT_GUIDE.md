# 🚀 Deploy DentaVerse to Production - Step by Step Guide

This guide will help you deploy your DentaVerse application so your client and their team can access it via a URL.

## 📋 Prerequisites

- Your code pushed to GitHub (if not already)
- A Vercel account (free) - Sign up at https://vercel.com
- About 15-20 minutes

---

## Step 1: Prepare Your Code for Production

### 1.1 Update Prisma Schema for PostgreSQL

Your current schema uses SQLite. For production, we need PostgreSQL. The schema will automatically work with PostgreSQL, but we need to make sure migrations are ready.

### 1.2 Push Your Code to GitHub (if not already)

```bash
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

---

## Step 2: Set Up PostgreSQL Database

You have two options:

### Option A: Vercel Postgres (Recommended - Easiest) ⭐

1. Go to https://vercel.com and sign in
2. We'll create the database after setting up the project (see Step 3)

### Option B: External PostgreSQL (Supabase - Free)

1. Go to https://supabase.com
2. Click "Start your project" → Sign up (free)
3. Click "New Project"
4. Fill in:
   - **Name:** dentaverse-db
   - **Database Password:** (create a strong password - save it!)
   - **Region:** Choose closest to your users
5. Click "Create new project" (takes 1-2 minutes)
6. Once created, go to **Settings** → **Database**
7. Scroll to "Connection string" → Copy the **URI** connection string
   - It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`
8. **Save this connection string** - you'll need it in Step 4

---

## Step 3: Deploy to Vercel

1. Go to https://vercel.com and sign in (or create account)
2. Click **"Add New"** → **"Project"**
3. **Import Git Repository:**
   - If your repo is on GitHub, click "Import" next to your repository
   - Or click "Import Git Repository" and enter your repo URL
4. **Configure Project:**
   - **Project Name:** dentaverse (or your preferred name)
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `dentaverse-app` (if your code is in this folder)
   - **Build Command:** Leave default (or use: `npm run build`)
   - **Output Directory:** Leave default
   - **Install Command:** `npm install`
5. **DON'T deploy yet** - We need to set up environment variables first!

---

## Step 4: Set Up Environment Variables

### 4.1 Create PostgreSQL Database (if using Vercel Postgres)

1. In your Vercel project dashboard, go to **Storage** tab
2. Click **"Create Database"**
3. Select **Postgres**
4. Choose **Hobby** plan (free)
5. Click **"Create"**
6. Vercel will automatically create `DATABASE_URL` for you! ✅

### 4.2 Add Environment Variables

Go to **Settings** → **Environment Variables** in your Vercel project:

#### Variable 1: DATABASE_URL
- **If using Vercel Postgres:** It's already set! ✅ Skip this.
- **If using Supabase/External:**
  - **Name:** `DATABASE_URL`
  - **Value:** Your PostgreSQL connection string from Step 2
  - **Environment:** Select all (Production, Preview, Development)
  - Click **Save**

#### Variable 2: NEXTAUTH_SECRET
- **Name:** `NEXTAUTH_SECRET`
- **Value:** Generate one by running this command in your terminal:
  ```bash
  openssl rand -base64 32
  ```
  Or use this online generator: https://generate-secret.vercel.app/32
- **Environment:** Select all
- Click **Save**

#### Variable 3: NEXTAUTH_URL
- **Name:** `NEXTAUTH_URL`
- **Value:** `https://your-project-name.vercel.app` (replace with your actual project name)
  - You'll get the exact URL after first deployment, but you can update it later
- **Environment:** Production only (for now)
- Click **Save**

---

## Step 5: Update Prisma Schema for PostgreSQL

We need to update your Prisma schema to use PostgreSQL instead of SQLite:

1. Open `dentaverse-app/prisma/schema.prisma`
2. Change line 9 from:
   ```prisma
   provider = "sqlite"
   ```
   to:
   ```prisma
   provider = "postgresql"
   ```
3. Save the file

---

## Step 6: Deploy!

1. In Vercel, click **"Deploy"** button
2. Wait for the build to complete (2-5 minutes)
3. Once done, you'll see your deployment URL! 🎉

---

## Step 7: Run Database Migrations

After the first deployment:

1. Go to your Vercel project → **Deployments** tab
2. Click on the latest deployment
3. Check the build logs - migrations should run automatically

**If migrations didn't run automatically:**

1. Install Vercel CLI locally:
   ```bash
   npm install -g vercel
   ```

2. Pull environment variables:
   ```bash
   cd dentaverse-app
   vercel env pull .env.local
   ```

3. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

4. (Optional) Seed initial data:
   ```bash
   npm run seed
   ```

---

## Step 8: Set Up Initial Owner Account

You need to create the owner account for your client:

1. Visit: `https://your-app.vercel.app/setup`
2. Or use the API endpoint: `https://your-app.vercel.app/api/setup-owner`
3. Follow the setup instructions

---

## Step 9: Test Your Deployment

1. Visit your app URL: `https://your-project-name.vercel.app`
2. Try logging in with the owner credentials
3. Test creating a seller, entering a sale, etc.

---

## Step 10: Share with Your Client

Your app is now live! Share the URL with your client:
- **URL:** `https://your-project-name.vercel.app`
- **Login:** They can use the owner account you created

---

## 🔧 Troubleshooting

### Build Fails with "DATABASE_URL not found"
- Go to Vercel → Settings → Environment Variables
- Make sure `DATABASE_URL` is set for all environments
- Redeploy

### Database Connection Errors
- Verify your PostgreSQL database is running
- Check the connection string is correct
- For Supabase: Make sure your database allows connections (Settings → Database → Connection Pooling)

### Authentication Not Working
- Verify `NEXTAUTH_SECRET` is set
- Update `NEXTAUTH_URL` to match your actual Vercel URL
- Clear browser cookies and try again

### Migrations Not Running
- Check build logs in Vercel
- Manually run: `npx prisma migrate deploy` using Vercel CLI

---

## 📝 Important Notes

- **Free Tier Limits:** Vercel free tier is generous but has limits. For production with multiple users, consider upgrading.
- **Database Backups:** Set up regular backups for your PostgreSQL database
- **Custom Domain:** You can add a custom domain in Vercel → Settings → Domains
- **Environment Variables:** Never commit `.env` files to Git

---

## ✅ Checklist

- [ ] Code pushed to GitHub
- [ ] PostgreSQL database created (Vercel Postgres or Supabase)
- [ ] Vercel project created
- [ ] Environment variables set (DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL)
- [ ] Prisma schema updated to use PostgreSQL
- [ ] First deployment completed
- [ ] Database migrations run
- [ ] Owner account created
- [ ] App tested and working
- [ ] URL shared with client

---

## 🎉 You're Done!

Your DentaVerse application is now live and accessible to your client and their team!

**Need Help?** Check the Vercel deployment logs or the troubleshooting section above.

