# Vercel Deployment Guide for DentaVerse

This guide will help you deploy the DentaVerse application to Vercel.

## Prerequisites

1. A GitHub account with the repository pushed to GitHub
2. A Vercel account (sign up at [vercel.com](https://vercel.com))
3. A PostgreSQL database (Vercel Postgres, Neon, Supabase, or Railway)

## Step 1: Set Up PostgreSQL Database

### Option A: Vercel Postgres (Recommended)

1. Go to your Vercel project dashboard
2. Navigate to the **Storage** tab
3. Click **Create Database** → Select **Postgres**
4. Choose a name and region
5. Copy the connection string (it will be automatically added as `DATABASE_URL`)

### Option B: External PostgreSQL Provider

You can use any PostgreSQL provider:
- **Neon** (https://neon.tech) - Free tier available
- **Supabase** (https://supabase.com) - Free tier available
- **Railway** (https://railway.app) - Free tier available

Get your PostgreSQL connection string from your provider.

## Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **Add New Project**
3. Import your GitHub repository: `https://github.com/Bayder0/Dentaverse`
4. Vercel will auto-detect Next.js framework
5. Configure the following:

### Environment Variables

Add these in the Vercel project settings:

```
DATABASE_URL=postgresql://user:password@host:port/database?schema=public
NEXTAUTH_SECRET=your-generated-secret-here
NEXTAUTH_URL=https://your-app.vercel.app
```

**To generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

Or use an online generator: https://generate-secret.vercel.app/32

**Important:** 
- Replace `NEXTAUTH_URL` with your actual Vercel deployment URL after the first deployment
- The `DATABASE_URL` will be automatically set if you use Vercel Postgres

### Build Settings

Vercel should auto-detect these, but verify:
- **Framework Preset:** Next.js
- **Build Command:** `prisma generate && prisma migrate deploy && next build`
- **Output Directory:** `.next` (default)
- **Install Command:** `npm install`

## Step 3: Run Database Migrations

After the first deployment:

1. Go to your Vercel project dashboard
2. Open the **Deployments** tab
3. Click on the latest deployment
4. Go to the **Functions** tab and find any error logs

Alternatively, you can run migrations manually:

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel env pull .env.local` to get environment variables
3. Run: `npx prisma migrate deploy` locally (with production DATABASE_URL)

Or use Vercel's built-in database migration feature if using Vercel Postgres.

## Step 4: Seed the Database (Optional)

To populate initial data (owner user, buckets, templates):

1. Set up a one-time script or use Vercel's CLI:
```bash
vercel env pull .env.local
npx prisma migrate deploy
npx ts-node prisma/seed.ts
```

Or add a seed script to run after migrations in Vercel.

## Step 5: Verify Deployment

1. Visit your deployment URL (e.g., `https://your-app.vercel.app`)
2. Try logging in with the owner credentials:
   - Email: `owner@dentaverse.com`
   - Password: `dentaverse2024`

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is correctly set in Vercel environment variables
- Check that your PostgreSQL database allows connections from Vercel's IPs
- Ensure SSL is enabled in the connection string if required

### Build Failures

- Check that `prisma generate` runs successfully
- Verify all environment variables are set
- Check build logs in Vercel dashboard

### Authentication Issues

- Ensure `NEXTAUTH_SECRET` is set and matches between deployments
- Verify `NEXTAUTH_URL` matches your actual deployment URL
- Check that cookies are working (may need to configure domain)

## Important Notes

- **Never commit `.env` files** - They are in `.gitignore`
- **Use environment variables** in Vercel dashboard for all secrets
- **Database migrations** run automatically on each deployment via `prisma migrate deploy`
- **Prisma Client** is generated during build process

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify all environment variables are set
3. Ensure database is accessible
4. Check that Prisma migrations have run successfully
