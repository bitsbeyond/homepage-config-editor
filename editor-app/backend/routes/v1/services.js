const { readServices, writeServices } = require('../../configUtils');
const { writeQueue } = require('../../writeQueue');

module.exports = async function (fastify) {
  // GET /api/v1/services — list all services
  fastify.get('/services', async (req, reply) => {
    try {
      const data = await readServices(fastify.log);
      const groups = (data || []).map(group => ({
        name: Object.keys(group)[0],
        services: (Object.values(group)[0] || []).map(svc => {
          const name = Object.keys(svc)[0];
          return { name, ...Object.values(svc)[0] };
        }),
      }));
      return reply.send({ groups });
    } catch (err) {
      fastify.log.error(err, 'GET /api/v1/services failed');
      return reply.status(500).send({ error: 'INTERNAL_ERROR', message: 'Failed to read services' });
    }
  });

  // POST /api/v1/services — add a service to a group
  fastify.post('/services', async (req, reply) => {
    const { group, service } = req.body || {};
    if (!group || !service || !service.name || !service.href) {
      return reply.status(400).send({ error: 'VALIDATION_FAILED', message: 'group, service.name and service.href are required' });
    }

    try {
      const data = await readServices(fastify.log);
      const groups = data || [];

      // Check for duplicate
      const existingGroup = groups.find(g => Object.keys(g)[0] === group);
      if (existingGroup) {
        const services = Object.values(existingGroup)[0] || [];
        const exists = services.some(s => Object.keys(s)[0] === service.name);
        if (exists) {
          return reply.status(409).send({ error: 'ALREADY_EXISTS', message: `Service '${service.name}' already exists in group '${group}'` });
        }
      }

      // Build service entry in gethomepage format
      const { name, ...attrs } = service;
      const svcEntry = { [name]: attrs };

      try {
        await writeQueue.add(async () => {
          const fresh = await readServices(fastify.log);
          const updated = fresh || [];
          const gIdx = updated.findIndex(g => Object.keys(g)[0] === group);
          if (gIdx >= 0) {
            const key = Object.keys(updated[gIdx])[0];
            updated[gIdx][key] = [...(updated[gIdx][key] || []), svcEntry];
          } else {
            updated.push({ [group]: [svcEntry] });
          }
          await writeServices(updated, fastify.log);
        });
      } catch (err) {
        fastify.log.error(err, 'writeQueue failed for POST /api/v1/services');
        return reply.status(500).send({ error: 'INTERNAL_ERROR', message: 'Failed to write services' });
      }

      return reply.status(201).send({ message: 'Service added', group, name: service.name });
    } catch (err) {
      fastify.log.error(err, 'POST /api/v1/services failed');
      return reply.status(500).send({ error: 'INTERNAL_ERROR', message: 'Failed to add service' });
    }
  });

  // PUT /api/v1/services/:group/:name — update a service
  fastify.put('/services/:group/:name', async (req, reply) => {
    const group = decodeURIComponent(req.params.group);
    const name = decodeURIComponent(req.params.name);
    const body = req.body || {};

    // Strip 'name' from updates — it is the YAML key (resource identifier),
    // not a service attribute. Spreading it would pollute the YAML with a
    // spurious `name:` field. Use `newName` in the body to rename the service.
    const { name: newName, ...attrs } = body;
    const targetName = (newName && newName !== name) ? newName : name;

    try {
      const data = await readServices(fastify.log);
      const groups = data || [];
      const gIdx = groups.findIndex(g => Object.keys(g)[0] === group);
      if (gIdx < 0) return reply.status(404).send({ error: 'NOT_FOUND', message: `Group '${group}' not found` });

      const key = Object.keys(groups[gIdx])[0];
      const services = groups[gIdx][key] || [];
      const sIdx = services.findIndex(s => Object.keys(s)[0] === name);
      if (sIdx < 0) return reply.status(404).send({ error: 'NOT_FOUND', message: `Service '${name}' not found in group '${group}'` });

      // Check for name collision when renaming
      if (targetName !== name) {
        const collision = services.some(s => Object.keys(s)[0] === targetName);
        if (collision) {
          return reply.status(409).send({ error: 'ALREADY_EXISTS', message: `Service '${targetName}' already exists in group '${group}'` });
        }
      }

      try {
        await writeQueue.add(async () => {
          const fresh = await readServices(fastify.log);
          const gI = fresh.findIndex(g => Object.keys(g)[0] === group);
          if (gI < 0) throw new Error(`Group '${group}' not found during write`);
          const k = Object.keys(fresh[gI])[0];
          const sI = fresh[gI][k].findIndex(s => Object.keys(s)[0] === name);
          if (sI < 0) throw new Error(`Service '${name}' not found during write`);
          const existing = fresh[gI][k][sI][name] || {};
          // Merge attrs only (no 'name' key) and apply optional rename
          fresh[gI][k][sI] = { [targetName]: { ...existing, ...attrs } };
          await writeServices(fresh, fastify.log);
        });
      } catch (err) {
        fastify.log.error(err, 'writeQueue failed for PUT /api/v1/services');
        return reply.status(500).send({ error: 'INTERNAL_ERROR', message: 'Failed to write services' });
      }

      return reply.send({ message: 'Service updated', name: targetName });
    } catch (err) {
      fastify.log.error(err, 'PUT /api/v1/services failed');
      return reply.status(500).send({ error: 'INTERNAL_ERROR', message: 'Failed to update service' });
    }
  });

  // DELETE /api/v1/services/:group/:name — remove a service
  fastify.delete('/services/:group/:name', async (req, reply) => {
    const group = decodeURIComponent(req.params.group);
    const name = decodeURIComponent(req.params.name);

    try {
      const data = await readServices(fastify.log);
      const groups = data || [];
      const gIdx = groups.findIndex(g => Object.keys(g)[0] === group);
      if (gIdx < 0) return reply.status(404).send({ error: 'NOT_FOUND', message: `Group '${group}' not found` });
      const key = Object.keys(groups[gIdx])[0];
      const sIdx = (groups[gIdx][key] || []).findIndex(s => Object.keys(s)[0] === name);
      if (sIdx < 0) return reply.status(404).send({ error: 'NOT_FOUND', message: `Service '${name}' not found` });

      try {
        await writeQueue.add(async () => {
          const fresh = await readServices(fastify.log);
          const gI = fresh.findIndex(g => Object.keys(g)[0] === group);
          const k = Object.keys(fresh[gI])[0];
          fresh[gI][k] = fresh[gI][k].filter(s => Object.keys(s)[0] !== name);
          // Remove empty groups
          const updated = fresh.filter(g => (Object.values(g)[0] || []).length > 0);
          await writeServices(updated, fastify.log);
        });
      } catch (err) {
        fastify.log.error(err, 'writeQueue failed for DELETE /api/v1/services');
        return reply.status(500).send({ error: 'INTERNAL_ERROR', message: 'Failed to write services' });
      }

      return reply.send({ message: 'Service deleted' });
    } catch (err) {
      fastify.log.error(err, 'DELETE /api/v1/services failed');
      return reply.status(500).send({ error: 'INTERNAL_ERROR', message: 'Failed to delete service' });
    }
  });
};
