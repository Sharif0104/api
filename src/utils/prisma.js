const { PrismaClient } = require('@prisma/client');

const prisma = global.prisma || new PrismaClient();

if (!global.prisma) {
  global.prisma = prisma;
}

module.exports = prisma;
