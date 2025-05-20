// Script to add 'admin' role to the Roles table if it doesn't exist
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  let adminRole = await prisma.roles.findUnique({ where: { name: 'admin' } });
  if (!adminRole) {
    adminRole = await prisma.roles.create({ data: { name: 'admin' } });
    console.log("'admin' role created.");
  } else {
    console.log("'admin' role already exists.");
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
