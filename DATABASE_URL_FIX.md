# Fix DATABASE_URL Error in Vercel - Complete Guide

## The Problem
Error: `Environment variable not found: DATABASE_URL` during Vercel build.

This happens because Prisma needs the `DATABASE_URL` environment variable to validate the schema and run migrations.

## Solution: Set DATABASE_URL in Vercel

### Step 1: Get Your PostgreSQL Database URL

You need a PostgreSQL database. Here are your options:

#### Option A: Use Vercel Postgres (Recommended - Easiest)
1. Go to your Vercel project dashboard
2. Click on **Storage** tab
3. Click **Create Database**
4. Select **Postgres**
5. Choose a plan (Hobby plan is free)
6. Create the database
7. Vercel will automatically create the `DATABASE_URL` environment variable for you!

#### Option B: Use External PostgreSQL (Supabase, Neon, etc.)

If you're using an external PostgreSQL provider:

1. **Supabase** (Free tier available):
   - Go to https://supabase.com
   - Create a project
   - Go to Settings → Database
   - Copy the connection string (it looks like: `postgresql://user:password@host:port/database`)

2. **Neon** (Free tier available):
   - Go to https://neon.tech
   - Create a project
   - Copy the connection string

3. **Railway** (Free tier available):
   - Go to https://railway.app
   - Create a PostgreSQL database
   - Copy the connection string

### Step 2: Add DATABASE_URL to Vercel

1. Go to your Vercel project: https://vercel.com/dashboard
2. Select your **Dentaverse** project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Add these variables:

   **Variable 1:**
   - **Name:** `DATABASE_URL`
   - **Value:** Your PostgreSQL connection string (from Step 1)
   - **Environment:** Select all (Production, Preview, Development)
   - Click **Save**

   **Variable 2:**
   - **Name:** `NEXTAUTH_SECRET`
   - **Value:** Generate one with: `openssl rand -base64 32` (or use any random string)
   - **Environment:** Select all
   - Click **Save**

   **Variable 3:**
   - **Name:** `NEXTAUTH_URL`
   - **Value:** Your Vercel app URL (e.g., `https://your-app.vercel.app`)
   - **Environment:** Production only
   - For Preview/Development, you can use: `http://localhost:3000`
   - Click **Save**

### Step 3: Redeploy

After adding the environment variables:

1. Go to **Deployments** tab in Vercel
2. Click the **⋯** (three dots) on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger a new deployment

## Quick Fix Commands

If you want to generate a `NEXTAUTH_SECRET` quickly, run this in your terminal:

```bash
openssl rand -base64 32
```

Copy the output and use it as your `NEXTAUTH_SECRET` value.

## Verification

After redeploying, check:

1. ✅ Build completes without DATABASE_URL errors
2. ✅ Database migrations run successfully
3. ✅ Application starts correctly
4. ✅ You can access your app

## Troubleshooting

### Still getting DATABASE_URL error?

1. **Check environment variables are set:**
   - Go to Vercel → Settings → Environment Variables
   - Make sure `DATABASE_URL` is there and enabled for the right environments

2. **Check the connection string format:**
   - Should start with: `postgresql://` or `postgres://`
   - Should include: username, password, host, port, and database name

3. **Check Root Directory:**
   - Go to Settings → General
   - If your files are in `dentaverse-app/`, set Root Directory to `dentaverse-app`
   - If files are at root, leave it empty

4. **Force a new deployment:**
   - Sometimes Vercel caches the build
   - Create a new deployment to pick up the environment variables

## Example DATABASE_URL Format

```
postgresql://username:password@hostname:5432/database_name?sslmode=require
```

Or for Vercel Postgres (auto-generated):
```
postgres://default:password@ep-xxx.region.aws.neon.tech:5432/verceldb?sslmode=require
```

## Need Help?

If you're still having issues:
1. Check the Vercel build logs for specific error messages
2. Make sure your PostgreSQL database is accessible (not blocked by firewall)
3. Verify the connection string is correct (no extra spaces or characters)

