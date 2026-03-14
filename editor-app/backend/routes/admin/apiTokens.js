const crypto = require('crypto');
const { hashToken } = require('../../apiTokenMiddleware');
const { createApiToken, listApiTokens, deleteApiToken, getApiTokenById } = require('../../database');

module.exports = async function (fastify) {
  // GET /admin/api-tokens — list all tokens (admin only, JWT handled by parent scope)
  fastify.get('/api-tokens', async (req, reply) => {
    try {
      const tokens = await listApiTokens();
      return reply.send({ tokens });
    } catch (err) {
      fastify.log.error(err, 'GET /admin/api-tokens failed');
      return reply.status(500).send({ error: 'INTERNAL_ERROR', message: 'Failed to list tokens' });
    }
  });

  // POST /admin/api-tokens — create a new token
  fastify.post('/api-tokens', async (req, reply) => {
    const { name } = req.body || {};
    if (!name || name.trim().length < 2) {
      return reply.status(400).send({ error: 'VALIDATION_FAILED', message: 'name must be at least 2 characters' });
    }

    try {
      // Generate cryptographically secure random token
      const raw = crypto.randomBytes(32).toString('hex');
      const token = `hpe_${raw}`;
      const tokenHash = hashToken(token);
      const createdBy = req.user?.email || 'admin';

      const id = await createApiToken(name.trim(), tokenHash, createdBy);
      const created_at = new Date().toISOString();

      // Return plaintext token ONCE — never stored, never retrievable again
      return reply.status(201).send({ id, name: name.trim(), token, created_at });
    } catch (err) {
      fastify.log.error(err, 'POST /admin/api-tokens failed');
      return reply.status(500).send({ error: 'INTERNAL_ERROR', message: 'Failed to create token' });
    }
  });

  // DELETE /admin/api-tokens/:id — revoke a token
  fastify.delete('/api-tokens/:id', async (req, reply) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return reply.status(400).send({ error: 'VALIDATION_FAILED', message: 'Invalid token id' });
    }

    try {
      const existing = await getApiTokenById(id);
      if (!existing) {
        return reply.status(404).send({ error: 'NOT_FOUND', message: `Token with id ${id} not found` });
      }
      await deleteApiToken(id);
      return reply.send({ message: 'Token revoked' });
    } catch (err) {
      fastify.log.error(err, 'DELETE /admin/api-tokens failed');
      return reply.status(500).send({ error: 'INTERNAL_ERROR', message: 'Failed to revoke token' });
    }
  });
};
