const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const fs = require('node:fs').promises;
const path = require('node:path');

// Determine schema directory relative to this file
const SCHEMAS_DIR = path.join(__dirname, 'schemas');

// Store compiled validators in an object
const validators = {
    services: null,
    bookmarks: null,
    widgets: null,
    settings: null,
};

const schemaFiles = {
    services: 'services.schema.json',
    bookmarks: 'bookmarks.schema.json',
    widgets: 'widgets.schema.json',
    settings: 'settings.schema.json',
};

/**
 * Initializes AJV and compiles all known schemas.
 * Logs errors if schema loading/compilation fails for any schema.
 * @param {object} logger - Fastify logger instance.
 */
async function initializeValidators(logger) {
    try {
        const ajv = new Ajv({ allErrors: true }); // Configure AJV
        addFormats(ajv); // Add support for formats like "uri"

        for (const schemaName in schemaFiles) {
            const filename = schemaFiles[schemaName];
            const schemaPath = path.join(SCHEMAS_DIR, filename);
            try {
                logger.info(`Loading ${schemaName} schema from: ${schemaPath}`);
                const schemaContent = await fs.readFile(schemaPath, 'utf8');
                const schema = JSON.parse(schemaContent);

                // Compile the schema and store the validation function
                validators[schemaName] = ajv.compile(schema);
                logger.info(`${schemaName} schema compiled successfully.`);
            } catch (error) {
                logger.error(`Failed to load/compile ${schemaName} schema (${filename}):`, error);
                // Keep validator as null for this specific schema
                validators[schemaName] = null;
            }
        }
        logger.info('Schema validator initialization complete.');

    } catch (error) {
        // Catch errors from Ajv initialization itself
        logger.error('Failed to initialize AJV:', error);
    }
}

/**
 * Validates data against a compiled schema.
 *
 * @param {string} schemaName - The name of the schema to use ('services', 'bookmarks', etc.).
 * @param {any} data - The data to validate.
 * @param {object} logger - Fastify logger instance.
 * @returns {{isValid: boolean, errors: object[]|null}} - An object indicating validity and containing errors if invalid.
 */
function validateData(schemaName, data, logger) {
    const validate = validators[schemaName];

    if (!validate) {
        logger.error(`${schemaName} validator is not initialized. Cannot validate.`);
        return {
            isValid: false,
            errors: [{ message: `Validator for '${schemaName}' not initialized due to schema loading/compilation error.` }]
        };
    }

    const isValid = validate(data);
    if (isValid) {
        return { isValid: true, errors: null };
    } else {
        logger.warn(`${schemaName} data validation failed:`, validate.errors);
        return { isValid: false, errors: validate.errors };
    }
}

// Specific validation functions for convenience
const validateServicesData = (data, logger) => validateData('services', data, logger);
const validateBookmarksData = (data, logger) => validateData('bookmarks', data, logger);
const validateWidgetsData = (data, logger) => validateData('widgets', data, logger);
const validateSettingsData = (data, logger) => validateData('settings', data, logger);


module.exports = {
    initializeValidators, // Renamed from initializeValidator
    validateServicesData,
    validateBookmarksData,
    validateWidgetsData,
    validateSettingsData,
};