#!/usr/bin/env node

const { execSync } = require('child_process');
const process = require('process');

console.log('🚀 Starting build process...\n');

// Step 1: Generate Prisma Client (doesn't need real DATABASE_URL)
console.log('📦 Generating Prisma Client...');
try {
  // Store original DATABASE_URL
  const originalDbUrl = process.env.DATABASE_URL;
  
  // Use a dummy DATABASE_URL if not set (just for schema validation)
  if (!originalDbUrl) {
    const dummyUrl = 'postgresql://dummy:dummy@localhost:5432/dummy';
    process.env.DATABASE_URL = dummyUrl;
  }
  
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma Client generated successfully\n');
  
  // Restore original (or keep dummy if it wasn't set)
  if (!originalDbUrl) {
    delete process.env.DATABASE_URL;
  } else {
    process.env.DATABASE_URL = originalDbUrl;
  }
} catch (error) {
  console.error('❌ Failed to generate Prisma Client:', error.message);
  process.exit(1);
}

// Step 2: Run migrations (only if DATABASE_URL is set and valid)
const dbUrl = process.env.DATABASE_URL;
if (dbUrl && !dbUrl.includes('dummy')) {
  console.log('🔄 Running database migrations...');
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('✅ Migrations completed successfully\n');
  } catch (error) {
    console.warn('⚠️  Migration failed (this is okay if DATABASE_URL is not set yet):', error.message);
    console.log('⏭️  Skipping migrations - will run on first deployment with DATABASE_URL\n');
  }
} else {
  console.log('⏭️  Skipping migrations - DATABASE_URL not set or is dummy value\n');
}

// Step 3: Build Next.js app
console.log('🏗️  Building Next.js application...');
try {
  execSync('next build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully!\n');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

console.log('🎉 All done!');

