# DentaVerse Control Center

A comprehensive management system for DentaVerse course sales, distribution, and analytics.

## Features

- **Role-Based Access Control**: Owner (full access) and Seller (own statistics only)
- **Sales Management**: Record and track course sales with automatic commission calculations
- **Money Distribution**: Automated profit distribution across ownership, team, and academy buckets
- **Expense Tracking**: Log and categorize expenses by fund bucket
- **Salary Management**: Track salary payments to recipients
- **Analytics Dashboard**: View statistics with month selection and aggregation
- **Course & Discount Management**: Create courses, discounts, and distribution templates
- **Seller Performance**: Track seller levels, commissions, and sales history

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Prisma** - Database ORM with PostgreSQL
- **NextAuth.js** - Authentication
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (for production) or SQLite (for local development)

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/Bayder0/Dentaverse.git
cd Dentaverse/dentaverse-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and set:
- `DATABASE_URL` - For local dev with SQLite: `file:./prisma/dev.db`
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `NEXTAUTH_URL` - `http://localhost:3000`

4. Set up the database:
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed initial data
npm run seed
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

### Default Login Credentials

After seeding:
- **Owner**: `owner@dentaverse.com` / `dentaverse2024`
- **Admin**: `admin@dentaverse.com` / `admin2024` (Note: Admin role has been removed, use Owner)

## Deployment

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed Vercel deployment instructions.

### Quick Vercel Deployment

1. Push your code to GitHub
2. Import project in Vercel
3. Set environment variables:
   - `DATABASE_URL` (PostgreSQL connection string)
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
4. Deploy!

## Project Structure

```
dentaverse-app/
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── seed.ts            # Seed script for initial data
│   └── migrations/        # Database migrations
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── (auth)/        # Authentication pages
│   │   ├── (protected)/   # Protected routes
│   │   └── actions.ts     # Server actions
│   ├── components/        # React components
│   └── lib/               # Utility functions
└── public/                # Static assets
```

## Database Schema

The application uses Prisma with PostgreSQL. Key models:
- **User** - Authentication and user management
- **Sale** - Sales records
- **Course** - Course catalog
- **SellerProfile** - Seller information and stats
- **FundBucket** - Money distribution buckets
- **Expense** - Expense tracking
- **SalaryPayment** - Salary records

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run seed` - Seed database with initial data
- `npm run migrate` - Run database migrations (dev)
- `npm run migrate:deploy` - Deploy migrations (production)

## Environment Variables

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Secret for NextAuth.js
- `NEXTAUTH_URL` - Application URL

## License

Private project - All rights reserved

## Author

Created and Designed by **Bayder Bassim**
