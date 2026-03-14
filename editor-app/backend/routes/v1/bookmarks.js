const { readBookmarks, writeBookmarks } = require('../../configUtils');
const { writeQueue } = require('../../writeQueue');

module.exports = async function (fastify) {
  // GET /api/v1/bookmarks
  fastify.get('/bookmarks', async (req, reply) => {
    try {
      const data = await readBookmarks(fastify.log);
      const groups = (data || []).map(group => ({
        name: Object.keys(group)[0],
        bookmarks: (Object.values(group)[0] || []).map(bm => {
          const name = Object.keys(bm)[0];
          // Bookmarks format wraps properties in a list: { Name: [{ href, abbr }] }
          const bmValue = Object.values(bm)[0];
          const attrs = Array.isArray(bmValue) ? (bmValue[0] || {}) : (bmValue || {});
          return { name, ...attrs };
        }),
      }));
      return reply.send({ groups });
    } catch (err) {
      fastify.log.error(err, 'GET /api/v1/bookmarks failed');
      return reply.status(500).send({ error: 'INTERNAL_ERROR', message: 'Failed to read bookmarks' });
    }
  });

  // POST /api/v1/bookmarks — add a bookmark
  fastify.post('/bookmarks', async (req, reply) => {
    const { group, bookmark } = req.body || {};
    if (!group || !bookmark || !bookmark.name || !bookmark.href) {
      return reply.status(400).send({ error: 'VALIDATION_FAILED', message: 'group, bookmark.name and bookmark.href are required' });
    }

    try {
      const data = await readBookmarks(fastify.log);
      const groups = data || [];
      const existingGroup = groups.find(g => Object.keys(g)[0] === group);
      if (existingGroup) {
        const bookmarks = Object.values(existingGroup)[0] || [];
        if (bookmarks.some(b => Object.keys(b)[0] === bookmark.name)) {
          return reply.status(409).send({ error: 'ALREADY_EXISTS', message: `Bookmark '${bookmark.name}' already exists in group '${group}'` });
        }
      }

      const { name, ...attrs } = bookmark;
      // Homepage bookmarks.yaml requires properties wrapped in a list: { Name: [{ href, abbr }] }
      const bmEntry = { [name]: [attrs] };

      try {
        await writeQueue.add(async () => {
          const fresh = await readBookmarks(fastify.log);
          const updated = fresh || [];
          const gIdx = updated.findIndex(g => Object.keys(g)[0] === group);
          if (gIdx >= 0) {
            const key = Object.keys(updated[gIdx])[0];
            updated[gIdx][key] = [...(updated[gIdx][key] || []), bmEntry];
          } else {
            updated.push({ [group]: [bmEntry] });
          }
          await writeBookmarks(updated, fastify.log);
        });
      } catch (err) {
        fastify.log.error(err, 'writeQueue failed for POST /api/v1/bookmarks');
        return reply.status(500).send({ error: 'INTERNAL_ERROR', message: 'Failed to write bookmarks' });
      }

      return reply.status(201).send({ message: 'Bookmark added', group, name: bookmark.name });
    } catch (err) {
      fastify.log.error(err, 'POST /api/v1/bookmarks failed');
      return reply.status(500).send({ error: 'INTERNAL_ERROR', message: 'Failed to add bookmark' });
    }
  });

  // PUT /api/v1/bookmarks/:group/:name — update a bookmark
  fastify.put('/bookmarks/:group/:name', async (req, reply) => {
    const group = decodeURIComponent(req.params.group);
    const name = decodeURIComponent(req.params.name);
    const updates = req.body || {};

    try {
      const data = await readBookmarks(fastify.log);
      const gIdx = (data || []).findIndex(g => Object.keys(g)[0] === group);
      if (gIdx < 0) return reply.status(404).send({ error: 'NOT_FOUND', message: `Group '${group}' not found` });
      const key = Object.keys(data[gIdx])[0];
      const bIdx = (data[gIdx][key] || []).findIndex(b => Object.keys(b)[0] === name);
      if (bIdx < 0) return reply.status(404).send({ error: 'NOT_FOUND', message: `Bookmark '${name}' not found` });

      try {
        await writeQueue.add(async () => {
          const fresh = await readBookmarks(fastify.log);
          const gI = fresh.findIndex(g => Object.keys(g)[0] === group);
          const k = Object.keys(fresh[gI])[0];
          const bI = fresh[gI][k].findIndex(b => Object.keys(b)[0] === name);
          // Bookmarks format wraps properties in a list: { Name: [{ href, abbr }] }
          const existingValue = fresh[gI][k][bI][name];
          const existing = Array.isArray(existingValue) ? (existingValue[0] || {}) : (existingValue || {});
          fresh[gI][k][bI] = { [name]: [{ ...existing, ...updates }] };
          await writeBookmarks(fresh, fastify.log);
        });
      } catch (err) {
        fastify.log.error(err, 'writeQueue failed for PUT /api/v1/bookmarks');
        return reply.status(500).send({ error: 'INTERNAL_ERROR', message: 'Failed to write bookmarks' });
      }

      return reply.send({ message: 'Bookmark updated' });
    } catch (err) {
      fastify.log.error(err, 'PUT /api/v1/bookmarks failed');
      return reply.status(500).send({ error: 'INTERNAL_ERROR', message: 'Failed to update bookmark' });
    }
  });

  // DELETE /api/v1/bookmarks/:group/:name
  fastify.delete('/bookmarks/:group/:name', async (req, reply) => {
    const group = decodeURIComponent(req.params.group);
    const name = decodeURIComponent(req.params.name);

    try {
      const data = await readBookmarks(fastify.log);
      const gIdx = (data || []).findIndex(g => Object.keys(g)[0] === group);
      if (gIdx < 0) return reply.status(404).send({ error: 'NOT_FOUND', message: `Group '${group}' not found` });
      const key = Object.keys(data[gIdx])[0];
      const bIdx = (data[gIdx][key] || []).findIndex(b => Object.keys(b)[0] === name);
      if (bIdx < 0) return reply.status(404).send({ error: 'NOT_FOUND', message: `Bookmark '${name}' not found` });

      try {
        await writeQueue.add(async () => {
          const fresh = await readBookmarks(fastify.log);
          const gI = fresh.findIndex(g => Object.keys(g)[0] === group);
          const k = Object.keys(fresh[gI])[0];
          fresh[gI][k] = fresh[gI][k].filter(b => Object.keys(b)[0] !== name);
          const updated = fresh.filter(g => (Object.values(g)[0] || []).length > 0);
          await writeBookmarks(updated, fastify.log);
        });
      } catch (err) {
        fastify.log.error(err, 'writeQueue failed for DELETE /api/v1/bookmarks');
        return reply.status(500).send({ error: 'INTERNAL_ERROR', message: 'Failed to write bookmarks' });
      }

      return reply.send({ message: 'Bookmark deleted' });
    } catch (err) {
      fastify.log.error(err, 'DELETE /api/v1/bookmarks failed');
      return reply.status(500).send({ error: 'INTERNAL_ERROR', message: 'Failed to delete bookmark' });
    }
  });
};
