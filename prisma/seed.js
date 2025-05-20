// prisma/seed.js
// Seed script to ensure 'user' and 'admin' roles exist in the Roles table

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const roles = ['user', 'admin'];
  for (const roleName of roles) {
    await prisma.$executeRaw`
      INSERT INTO "Roles" (name)
      VALUES (${roleName})
      ON CONFLICT (name) DO NOTHING;
    `;
    console.log(`Ensured role '${roleName}' exists.`);
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

