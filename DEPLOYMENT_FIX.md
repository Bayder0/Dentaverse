# Vercel Deployment Fix Guide

## Problem
Vercel error: "Could not find Prisma Schema that is required for this command"

## Root Cause
The Prisma schema file location doesn't match where Vercel is looking for it during the build process.

## Solution

### Option 1: Set Root Directory in Vercel Dashboard (RECOMMENDED)

1. Go to your Vercel project: https://vercel.com/dashboard
2. Select your **Dentaverse** project
3. Go to **Settings** → **General**
4. Scroll to **Root Directory**
5. Click **Edit**
6. Enter: `dentaverse-app` (if your files are in a subdirectory) OR leave empty if files are at root
7. Click **Save**
8. Redeploy your project

### Option 2: Ensure Files Are at Root on GitHub

If your GitHub repository has files at the root level (which it appears to based on the repo structure), make sure:

1. `prisma/schema.prisma` exists at the root
2. `package.json` is at the root
3. `vercel.json` is at the root

### Current Configuration

The `vercel.json` file is configured to:
- Use `npm run build` which runs: `prisma generate && prisma migrate deploy && next build`
- This ensures Prisma generates the client before building

## Files Updated

1. **Root `vercel.json`**: Updated to use `npm run build`
2. **`dentaverse-app/package.json`**: Build script includes Prisma generation
3. **`dentaverse-app/vercel.json`**: Configured for subdirectory deployment

## Next Steps

1. **Push all changes to GitHub:**
   ```bash
   cd C:\Users\Administrator\OneDrive\Desktop\Dentaverse
   git add .
   git commit -m "Fix Vercel deployment - Prisma schema path"
   git push
   ```

2. **In Vercel Dashboard:**
   - Go to your project settings
   - Set **Root Directory** to match your GitHub structure:
     - If files are at root: Leave empty or set to `.`
     - If files are in `dentaverse-app/`: Set to `dentaverse-app`
   
3. **Add Environment Variables** (if not already done):
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL`: Your Vercel deployment URL

4. **Redeploy**: Trigger a new deployment

## Verification

After deployment, check:
- ✅ Build completes without Prisma errors
- ✅ Database migrations run successfully
- ✅ Application starts correctly

