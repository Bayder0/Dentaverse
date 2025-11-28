# ⚡ Quick Deploy Checklist

Follow these steps in order:

## 1. Update Prisma Schema (Required)
Change `provider = "sqlite"` to `provider = "postgresql"` in `prisma/schema.prisma`

## 2. Push to GitHub
```bash
git add .
git commit -m "Prepare for production"
git push
```

## 3. Deploy to Vercel
1. Go to https://vercel.com → Add New Project
2. Import your GitHub repo
3. Set Root Directory: `dentaverse-app`
4. **Before deploying**, go to Settings → Environment Variables

## 4. Set Environment Variables

### Option A: Use Vercel Postgres (Easiest)
1. Go to Storage tab → Create Database → Postgres
2. DATABASE_URL is auto-created ✅

### Option B: Use Supabase
1. Create project at https://supabase.com
2. Get connection string from Settings → Database
3. Add as DATABASE_URL in Vercel

### Required Variables:
- `DATABASE_URL` - Your PostgreSQL connection string
- `NEXTAUTH_SECRET` - Generate: `openssl rand -base64 32`
- `NEXTAUTH_URL` - Your Vercel URL (update after first deploy)

## 5. Deploy
Click Deploy and wait 2-5 minutes

## 6. Run Migrations
Migrations should run automatically. If not:
```bash
vercel env pull .env.local
npx prisma migrate deploy
```

## 7. Create Owner Account
Visit: `https://your-app.vercel.app/setup`

## Done! 🎉
Share the URL with your client.

