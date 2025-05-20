const { encrypt, decrypt } = require('../utils/encryption');

function addEncryptionMiddleware(prisma) {
  prisma.$use(async (params, next) => {
    // Encrypt email before saving
    if (params.model === 'User' && params.action === 'create') {
      if (params.args.data.email) {
        params.args.data.email = encrypt(params.args.data.email);
      }
    }
    if (params.model === 'User' && params.action === 'update') {
      if (params.args.data.email) {
        params.args.data.email = encrypt(params.args.data.email);
      }
    }
    // Encrypt email in query filters for lookups
    if (params.model === 'User' && (params.action === 'findUnique' || params.action === 'findFirst' || params.action === 'findMany')) {
      if (params.args.where && params.args.where.email) {
        params.args.where.email = encrypt(params.args.where.email);
      }
      // Also handle queries like findMany({ where: { email: ... } })
      if (params.args.where && params.args.where.OR) {
        params.args.where.OR = params.args.where.OR.map(cond => {
          if (cond.email) {
            return { ...cond, email: encrypt(cond.email) };
          }
          return cond;
        });
      }
    }
    const result = await next(params);
    // Decrypt email after fetching
    if (params.model === 'User' && (params.action === 'findUnique' || params.action === 'findFirst' || params.action === 'findMany')) {
      if (Array.isArray(result)) {
        result.forEach(user => {
          if (user.email) user.email = decrypt(user.email);
        });
      } else if (result && result.email) {
        result.email = decrypt(result.email);
      }
    }
    return result;
  });
}

module.exports = addEncryptionMiddleware;
