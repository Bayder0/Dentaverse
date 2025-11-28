const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'bayder2025';
  const hash = await bcrypt.hash(password, 10);
  console.log('\n🔐 Password Hash for bayder2025:');
  console.log(hash);
  console.log('\n');
}

generateHash().catch(console.error);

