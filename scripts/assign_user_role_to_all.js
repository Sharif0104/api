// Script to assign 'user' role to all users who don't have it
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Ensure 'user' role exists
  let userRole = await prisma.roles.findUnique({ where: { name: 'user' } });
  if (!userRole) {
    userRole = await prisma.roles.create({ data: { name: 'user' } });
  }

  // Find all users who do not have the 'user' role
  const users = await prisma.user.findMany({
    where: {
      roles: {
        none: { name: 'user' }
      }
    },
    select: { id: true }
  });

  // Assign 'user' role to each user
  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        roles: {
          connect: { id: userRole.id }
        }
      }
    });
    console.log(`Assigned 'user' role to user ID ${user.id}`);
  }

  console.log('Done assigning user roles.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
