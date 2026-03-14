const { default: PQueue } = require('p-queue');

// Serialize all YAML/Git write operations to prevent .git/index.lock conflicts
const writeQueue = new PQueue({ concurrency: 1, timeout: 10000 });

module.exports = { writeQueue };
