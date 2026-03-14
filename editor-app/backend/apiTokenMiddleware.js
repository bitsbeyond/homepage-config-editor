const crypto = require('crypto');
const { findApiTokenByHash, updateApiTokenLastUsed } = require('./database');

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

// Debounce last_used_at writes: max once per 5 minutes per token to avoid SQLite write-locks
const lastUsedCache = new Map();
const DEBOUNCE_MS = 5 * 60 * 1000;

const debouncedUpdateLastUsed = (tokenId) => {
  const now = Date.now();
  const last = lastUsedCache.get(tokenId);
  if (!last || now - last > DEBOUNCE_MS) {
    lastUsedCache.set(tokenId, now);
    updateApiTokenLastUsed(tokenId);
  }
};

const apiTokenMiddleware = async (req, reply) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Bearer token required' });
  }

  const rawToken = authHeader.slice(7).trim();
  const hash = hashToken(rawToken);
  const tokenRecord = await findApiTokenByHash(hash);

  if (!tokenRecord) {
    return reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Invalid or revoked token' });
  }

  debouncedUpdateLastUsed(tokenRecord.id);
  req.apiToken = tokenRecord;
};

module.exports = { apiTokenMiddleware, hashToken };
