# 🗄️ Setting Up PostgreSQL Database

## Option 1: Vercel Postgres (Recommended)

### Step 1: Find the Storage Tab
1. In your Vercel project dashboard (after creating the project)
2. Look at the **top navigation tabs** (not in Settings)
3. Click on **"Storage"** tab
4. Click **"Create Database"**
5. Select **"Postgres"**
6. Choose **Hobby** plan (free)
7. Click **"Create"**
8. Vercel will automatically add `DATABASE_URL` to your environment variables! ✅

**Note:** If you don't see the Storage tab, you might need to:
- Complete the project creation first
- Or use Option 2 below

---

## Option 2: Supabase (Free External Database)

### Step 1: Create Supabase Account
1. Go to https://supabase.com
2. Click **"Start your project"** → Sign up (free)
3. Click **"New Project"**

### Step 2: Create Database
1. Fill in:
   - **Name:** `dentaverse-db` (or any name)
   - **Database Password:** Create a strong password (SAVE THIS!)
   - **Region:** Choose closest to your users
2. Click **"Create new project"** (takes 1-2 minutes)

### Step 3: Get Connection String
1. Once project is created, go to **Settings** (gear icon) → **Database**
2. Scroll down to **"Connection string"** section
3. Click on **"URI"** tab
4. Copy the connection string - it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
5. **Replace `[YOUR-PASSWORD]`** with the password you created in Step 2

### Step 4: Add to Vercel
1. Go back to Vercel → Your Project → **Settings** → **Environment Variables**
2. Click **"Add New"**
3. Add:
   - **Key:** `DATABASE_URL`
   - **Value:** Paste your Supabase connection string (with password replaced)
   - **Environment:** Select all (Production, Preview, Development)
4. Click **"Save"**

---

## Option 3: Neon (Another Free Option)

1. Go to https://neon.tech
2. Sign up (free)
3. Create a new project
4. Copy the connection string
5. Add it to Vercel as `DATABASE_URL` (same as Supabase steps above)

---

## Which Option to Choose?

- **Vercel Postgres:** Easiest, integrated with Vercel, auto-creates DATABASE_URL
- **Supabase:** More features, free tier, good documentation
- **Neon:** Serverless PostgreSQL, very fast, free tier

All three work perfectly! Choose whichever is easiest for you.

