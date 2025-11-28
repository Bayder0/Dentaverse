# 🚀 First Time Setup - Create Owner Account

After deploying your app, you need to create the owner account before you can log in.

## Step 1: Create Owner Account

### Method 1: Using Setup Page (Easiest)

1. Visit: `https://your-app.vercel.app/setup`
2. Click the **"Create Owner User"** button
3. Wait for the success message
4. You'll be redirected to the login page

### Method 2: Using API Endpoint

1. Visit: `https://your-app.vercel.app/api/setup-owner`
2. The owner account will be created automatically
3. You'll see a JSON response confirming creation

## Step 2: Login

After creating the owner account, use these credentials:

- **Email:** `owner@dentaverse.com`
- **Password:** `dentaverse2024`

## Troubleshooting

### "Invalid email/password" Error

This means the owner account hasn't been created yet. Make sure you:
1. Visit `/setup` or `/api/setup-owner` first
2. Wait for the success message
3. Then try logging in

### Database Connection Error

If you see a database error:
1. Check that `DATABASE_URL` is set in Vercel environment variables
2. Verify your PostgreSQL database is running
3. Check Vercel deployment logs for database connection errors

### Owner Already Exists

If the owner account already exists, you can:
- Use the existing credentials to log in
- Or check the `/api/setup-owner` response to see the current password

## Next Steps After Login

Once logged in as owner, you can:
1. Create seller accounts
2. Set up courses
3. Configure distribution templates
4. Start tracking sales

