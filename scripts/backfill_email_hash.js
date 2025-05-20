// Script to backfill emailHash for all users
const { PrismaClient } = require('@prisma/client');
const { hash, decrypt } = require('../src/utils/encryption');

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  for (const user of users) {
    let emailPlain;
    try {
      emailPlain = decrypt(user.email);
    } catch (e) {
      console.error(`Failed to decrypt email for user id ${user.id}:`, e);
      continue;
    }
    const emailHash = hash(emailPlain);
    await prisma.user.update({
      where: { id: user.id },
      data: { emailHash },
    });
    console.log(`Updated user id ${user.id} with emailHash ${emailHash}`);
  }
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
