const { PrismaClient } = require('@prisma/client');
const addEncryptionMiddleware = require('../middleware/prismaEncryption');

const prisma = global.prisma || new PrismaClient();

if (!global.prisma) {
  global.prisma = prisma;
}

addEncryptionMiddleware(prisma);

module.exports = prisma;
