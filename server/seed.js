// server/seed.js
// Run: node seed.js
// Creates the first admin user + some departments

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create departments
  const depts = ['Engineering', 'HR', 'Marketing', 'Finance', 'Operations'];
  for (const name of depts) {
    await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('✓ Departments created');

  // Create admin user
  const hash = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ems.com' },
    update: {},
    create: {
      email: 'admin@ems.com',
      password: hash,
      role: 'ADMIN',
      employee: {
        create: {
          name: 'System Admin',
          designation: 'Administrator',
        },
      },
    },
  });
  console.log('✓ Admin user created');
  console.log('\n============================');
  console.log('Login credentials:');
  console.log('  Email:    admin@ems.com');
  console.log('  Password: admin123');
  console.log('============================\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
