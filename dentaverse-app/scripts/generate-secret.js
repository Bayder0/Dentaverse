#!/usr/bin/env node

/**
 * Generate a secure random secret for NEXTAUTH_SECRET
 * Usage: node scripts/generate-secret.js
 */

const crypto = require('crypto');

const secret = crypto.randomBytes(32).toString('base64');

console.log('\n🔐 Generated NEXTAUTH_SECRET:\n');
console.log(secret);
console.log('\n📋 Copy this value and add it to Vercel environment variables as NEXTAUTH_SECRET\n');

