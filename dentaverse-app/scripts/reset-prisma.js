const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Resetting Prisma client for SQLite...\n');

try {
  // Try to remove the .prisma directory
  const prismaClientPath = path.join(__dirname, '..', 'node_modules', '.prisma');
  if (fs.existsSync(prismaClientPath)) {
    console.log('Removing old Prisma client...');
    try {
      fs.rmSync(prismaClientPath, { recursive: true, force: true });
      console.log('✅ Old Prisma client removed\n');
    } catch (error) {
      console.log('⚠️  Could not remove old client (file may be locked by dev server)');
      console.log('   Please stop your dev server and run: npx prisma generate\n');
      process.exit(1);
    }
  }

  // Generate new Prisma client
  console.log('Generating new Prisma client for SQLite...');
  execSync('npx prisma generate', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('\n✅ Prisma client regenerated successfully!');
  console.log('   You can now restart your dev server.\n');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}


