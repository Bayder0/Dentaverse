# 💻 Local Development Setup

## After Switching to PostgreSQL

Your production deployment uses PostgreSQL. For local development, you have two options:

### Option 1: Use PostgreSQL Locally (Recommended)

#### Using Docker (Easiest):
```bash
# Run PostgreSQL in Docker
docker run --name dentaverse-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=dentaverse \
  -p 5432:5432 \
  -d postgres:15

# Your DATABASE_URL will be:
# postgresql://postgres:postgres@localhost:5432/dentaverse
```

#### Using Local PostgreSQL:
1. Install PostgreSQL on your machine
2. Create a database: `createdb dentaverse`
3. Set DATABASE_URL: `postgresql://postgres:password@localhost:5432/dentaverse`

### Option 2: Use SQLite for Local Dev Only

If you prefer SQLite for local development:

1. Temporarily change `prisma/schema.prisma`:
   ```prisma
   provider = "sqlite"  // Change back to sqlite
   ```

2. Set DATABASE_URL in `.env.local`:
   ```
   DATABASE_URL="file:./dev.db"
   ```

3. **Important:** Before deploying, change it back to `postgresql`!

### Running Migrations Locally

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed database
npm run seed
```

### Switching Between SQLite and PostgreSQL

If you want to switch back and forth:

1. **For Local (SQLite):**
   - Change schema: `provider = "sqlite"`
   - DATABASE_URL: `file:./dev.db`

2. **For Production (PostgreSQL):**
   - Change schema: `provider = "postgresql"`
   - DATABASE_URL: Your PostgreSQL connection string

**Note:** You'll need to run migrations separately for each database.

