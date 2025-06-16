const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
// REMOVED: const { commitFile } = require('./gitUtils'); // Import commitFile - REMOVED TO BREAK CIRCULAR DEPENDENCY

// Determine config directory: Use EDITOR_DATA_DIR env var if set, otherwise default to /config (for Docker)
const BASE_DATA_DIR = process.env.EDITOR_DATA_DIR; // Check if the env var is set
const CONFIG_DIR = BASE_DATA_DIR ? path.join(BASE_DATA_DIR, 'config') : '/config';
console.log(`Using config directory: ${CONFIG_DIR}`); // Log the directory being used

// Define the expected configuration filenames
const CONFIG_FILES = {
    services: 'services.yaml',
    bookmarks: 'bookmarks.yaml',
    widgets: 'widgets.yaml',
    settings: 'settings.yaml',
    // Add others like docker.yaml, kubernetes.yaml if needed later
};

/**
 * Reads and parses a specific YAML configuration file from the /config directory.
 *
 * @param {string} configName - The key name of the config file (e.g., 'services', 'settings').
 * @param {object} logger - The Fastify logger instance for logging errors.
 * @returns {Promise<object|Array|null>} The parsed YAML content as a JavaScript object or array,
 *                                       or null if the file doesn't exist or is empty/invalid.
 * @throws {Error} If there's a critical error reading the file (other than ENOENT) or parsing invalid YAML.
 */
async function readConfigFile(configName, logger) {
    const filename = CONFIG_FILES[configName];
    if (!filename) {
        logger.error(`Invalid config name requested: ${configName}`);
        throw new Error(`Invalid configuration name: ${configName}`);
    }

    const filePath = path.join(CONFIG_DIR, filename);

    try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        // Handle empty files gracefully - js-yaml returns undefined for empty input
        if (!fileContent.trim()) {
            logger.info(`Configuration file is empty: ${filePath}`);
            // Return an empty array for list-based configs, empty object for settings/widgets?
            // This might need adjustment based on how frontend expects empty data.
            // Returning null for now, API route can decide default structure.
            return null;
        }
        const parsedData = yaml.load(fileContent);
        // js-yaml might return null or undefined for technically valid but empty/comment-only YAML
        // Ensure we return at least an empty object/array if parsing succeeds but yields nothing substantial.
        // Check the expected type based on configName?
        if (parsedData === null || parsedData === undefined) {
             logger.warn(`Parsed data for ${filePath} is null or undefined. Returning null.`);
             return null;
        }
        return parsedData;
    } catch (error) {
        if (error.code === 'ENOENT') {
            // File doesn't exist - this is not necessarily an error, might be expected
            logger.info(`Configuration file not found: ${filePath}. Returning null.`);
            return null;
        } else if (error instanceof yaml.YAMLException) {
            // Invalid YAML syntax
            logger.error(`Invalid YAML syntax in file ${filePath}: ${error.message}`);
            // Decide how to handle invalid YAML - return null? Throw specific error?
            // Returning null for now, frontend needs to handle this possibility.
            return null;
        } else {
            // Other file system errors (permissions, etc.)
            logger.error(`Error reading configuration file ${filePath}:`, error);
            throw error; // Re-throw critical file system errors
        }
    }
}

/**
 * Serializes data to YAML and writes it to a specific configuration file.
 * Overwrites the existing file.
 *
 * @param {string} configName - The key name of the config file (e.g., 'services', 'settings').
 * @param {object|Array} data - The JavaScript object/array to serialize and write.
 * @param {object} logger - The Fastify logger instance for logging errors.
 * @returns {Promise<void>}
 * @throws {Error} If the config name is invalid, serialization fails, or writing fails.
 */
async function writeConfigFile(configName, data, logger) { // REMOVED userEmail, userName
    const filename = CONFIG_FILES[configName];
    if (!filename) {
        logger.error(`Invalid config name requested for writing: ${configName}`);
        throw new Error(`Invalid configuration name: ${configName}`);
    }

    const filePath = path.join(CONFIG_DIR, filename);

    try {
        // Ensure the target directory exists, especially for local dev using EDITOR_DATA_DIR
        // This prevents errors if ./local_data/config hasn't been created yet.
        // We do this here because reading non-existent files is handled, but writing needs the dir.
        if (BASE_DATA_DIR) { // Only check/create if using local data dir
             try {
                await fs.access(CONFIG_DIR);
             } catch (error) {
                 if (error.code === 'ENOENT') {
                     logger.info(`Config directory ${CONFIG_DIR} not found, attempting to create.`);
                     await fs.mkdir(CONFIG_DIR, { recursive: true });
                     logger.info(`Config directory ${CONFIG_DIR} created.`);
                 } else {
                     throw error; // Re-throw other access errors
                 }
             }
        }

        // Serialize the data to YAML format
        // Options:
        // - indent: number of spaces for indentation
        // - sortKeys: true to sort keys alphabetically (might change order)
        // - noRefs: true to prevent creating YAML anchors/aliases (usually desired for config)
        // - lineWidth: -1 to disable line wrapping (often preferred for config)
        const yamlString = yaml.dump(data, { indent: 2, sortKeys: false, noRefs: true, lineWidth: -1 });

        // Log before attempting write
        logger.info(`Attempting to write to ${filePath} with data:`, JSON.stringify(data, null, 2)); // Log the data being written

        // Write the YAML string to the file, overwriting existing content
        await fs.writeFile(filePath, yamlString, 'utf8');
        logger.info(`Configuration file written successfully: ${filePath}`);
        // REMOVED Git commit logic from here

    } catch (error) {
        if (error instanceof yaml.YAMLException) {
            logger.error(`Error serializing data to YAML for ${filePath}: ${error.message}`);
            throw new Error(`Failed to serialize ${configName} data to YAML.`);
        } else {
            logger.error(`Error writing configuration file ${filePath}:`, error);
            throw new Error(`Failed to write ${configName} configuration file.`);
        }
    }
}

/**
 * Writes raw string content to a specific file in the config directory.
 * Overwrites the existing file. Ensures the directory exists.
 *
 * @param {string} filename - The name of the file (e.g., 'services.yaml', 'custom.css').
 * @param {string} rawContent - The raw string content to write.
 * @param {object} logger - The Fastify logger instance for logging errors.
 * @returns {Promise<void>}
 * @throws {Error} If writing fails.
 */
async function writeRawConfigFile(filename, rawContent, logger) { // REMOVED userEmail, userName
    // Basic validation on filename? (e.g., prevent empty names)
    if (!filename || typeof filename !== 'string') {
        logger.error(`Invalid filename provided for raw write: ${filename}`);
        throw new Error('Invalid filename provided.');
    }

    const filePath = path.join(CONFIG_DIR, filename);
    logger.info(`Attempting to write raw content to: ${filePath}`);

    try {
        // Ensure the target directory exists (same logic as writeConfigFile)
        if (BASE_DATA_DIR) { // Only check/create if using local data dir
             try {
                await fs.access(CONFIG_DIR);
             } catch (error) {
                 if (error.code === 'ENOENT') {
                     logger.info(`Config directory ${CONFIG_DIR} not found, attempting to create.`);
                     await fs.mkdir(CONFIG_DIR, { recursive: true });
                     logger.info(`Config directory ${CONFIG_DIR} created.`);
                 } else {
                     throw error; // Re-throw other access errors
                 }
             }
        }

        // Write the raw string content to the file, overwriting existing content
        await fs.writeFile(filePath, rawContent, 'utf8');
        logger.info(`Raw configuration file written successfully: ${filePath}`);
        // REMOVED Git commit logic from here

    } catch (error) {
        // Log the specific file system error
        logger.error(`Error writing raw configuration file ${filePath}:`, error);
        // Re-throw the ORIGINAL error object so the route handler can log details
        throw error;
    }
}


// --- Services ---

const readServices = async (logger) => {
  // Use the generic readConfigFile, passing the logger
  return readConfigFile('services', logger);
};

const writeServices = async (servicesData, logger) => { // REMOVED userEmail, userName
    // Basic validation: ensure it's an array
    if (!Array.isArray(servicesData)) {
        logger.error('Invalid services data provided to writeServices: must be an array.', { data: servicesData });
        throw new Error('Invalid services data: must be an array.');
    }
    return writeConfigFile('services', servicesData, logger);
};

// --- Bookmarks ---

const readBookmarks = async (logger) => {
    // Use the generic readConfigFile, passing the logger
    return readConfigFile('bookmarks', logger);
};

const writeBookmarks = async (bookmarksData, logger) => { // REMOVED userEmail, userName
    // Basic validation: ensure it's an array
    if (!Array.isArray(bookmarksData)) {
        logger.error('Invalid bookmarks data provided to writeBookmarks: must be an array.', { data: bookmarksData });
        throw new Error('Invalid bookmarks data: must be an array.');
    }
    return writeConfigFile('bookmarks', bookmarksData, logger);
};


// --- Settings ---

const readSettings = async (logger) => {
    const filename = CONFIG_FILES['settings'];
    if (!filename) {
        logger.error(`Invalid config name requested: settings`);
        throw new Error(`Invalid configuration name: settings`);
    }
    const filePath = path.join(CONFIG_DIR, filename);

    try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        if (!fileContent.trim()) {
            logger.info(`Settings file is empty: ${filePath}`);
            return null; // Or return a default structure if needed
        }

        // Load the YAML normally to get values
        const parsedData = yaml.load(fileContent);
        if (!parsedData || typeof parsedData !== 'object') {
             logger.warn(`Parsed settings data for ${filePath} is not a valid object. Returning null.`);
             return null;
        }

        // If layout exists and is an object, attempt to order it based on file content
        if (parsedData.layout && typeof parsedData.layout === 'object' && !Array.isArray(parsedData.layout)) {
            logger.info(`Processing layout object from ${filePath}`);
            const layoutObject = parsedData.layout;
            const keys = Object.keys(layoutObject);
            let orderedLayout = []; // Initialize orderedLayout array

            // Check if keys look like numerical indices (potentially the incorrect format)
            // Use a stricter check: all keys must be numerical strings (optionally quoted)
            const hasOnlyNumericalKeys = keys.length > 0 && keys.every(key => /^(?:\d+|'\d+')$/.test(key));

            if (hasOnlyNumericalKeys) {
                logger.warn(`Detected numerical keys in layout object for ${filePath}. Attempting conversion using inner 'name' field.`);
                // Sort by numerical key to maintain some order
                keys.sort((a, b) => parseInt(a.replace(/'/g, ''), 10) - parseInt(b.replace(/'/g, ''), 10)).forEach(key => {
                    const groupData = layoutObject[key];
                    if (groupData && typeof groupData === 'object' && typeof groupData.name === 'string') {
                        const { name, ...rest } = groupData;
                        orderedLayout.push({ name, ...rest }); // Use inner name
                    } else {
                        logger.warn(`Skipping invalid group data under numerical key '${key}' in ${filePath}:`, groupData);
                    }
                });
                logger.info(`Successfully converted layout from numerical keys for ${filePath}`);
            } else {
                // Assume correct format (keys are group names) or mixed format. Use regex to preserve file order for known keys.
                logger.info(`Attempting to order layout keys based on file content for ${filePath} (assuming non-numerical keys are group names).`);
                const layoutRegex = /^layout:\s*(\n(?:^[ \t].*|\n)*)/m;
                // Regex to match only top-level keys (2 spaces, key name, colon, optional value on same line, end of line)
                // Key name ([^:\s][^:]*) ensures it doesn't start with whitespace and captures up to the colon
                const keyRegex = /^[ ]{2}([^:\s][^:]*):\s*$/gm;
                const layoutMatch = fileContent.match(layoutRegex);

                if (layoutMatch && layoutMatch[1]) {
                    const layoutBlock = layoutMatch[1];
                    logger.debug({ msg: "Layout block content found by regex:", layoutBlock });
                    const orderedKeysFromFile = [];
                    let match;
                    keyRegex.lastIndex = 0;
                    while ((match = keyRegex.exec(layoutBlock)) !== null) {
                        // Key is match[1] - already trimmed by regex structure
                        orderedKeysFromFile.push(match[1]);
                    }
                    logger.debug(`Top-level keys extracted by regex: [${orderedKeysFromFile.join(', ')}]`);

                    const parsedKeys = Object.keys(layoutObject);
                    logger.debug(`Keys found in parsedData.layout: [${parsedKeys.join(', ')}]`);

                    // Build the ordered layout based on keys found in the file
                    orderedKeysFromFile.forEach(key => {
                        if (layoutObject.hasOwnProperty(key)) {
                            orderedLayout.push({
                                name: key,
                                ...layoutObject[key]
                            });
                        } else {
                             logger.warn(`Key "${key}" found by regex but missing in parsed data for ${filePath}. Skipping.`);
                        }
                    });

                    // Add any keys from parsed data that weren't found by regex (e.g., added later or numerical keys in a mixed file)
                    const keysInOrderedLayout = new Set(orderedLayout.map(g => g.name));
                    parsedKeys.forEach(key => {
                        if (!keysInOrderedLayout.has(key)) {
                            // Check if this orphan key is numerical and has an inner name (handle mixed case)
                            if (/^(?:\d+|'\d+')$/.test(key) && layoutObject[key] && typeof layoutObject[key] === 'object' && typeof layoutObject[key].name === 'string') {
                                logger.warn(`Appending numerically keyed group "${layoutObject[key].name}" (key: ${key}) found in parsed data but not matched by top-level regex.`);
                                const { name, ...rest } = layoutObject[key];
                                orderedLayout.push({ name, ...rest });
                            } else if (!/^(?:\d+|'\d+')$/.test(key)) { // Only append if it's not a numerical key we already tried to handle
                                logger.warn(`Key "${key}" from parsed data was not found in original file order via regex. Appending to end.`);
                                orderedLayout.push({ name: key, ...layoutObject[key] });
                            } else {
                                 logger.warn(`Skipping orphan numerical key "${key}" from parsed data as it lacked a valid inner 'name'.`);
                            }
                        }
                    });

                    logger.info(`Successfully ordered layout section based on file content and parsed data for ${filePath}`);

                } else {
                    logger.warn(`Could not find layout block or parse top-level keys via regex for ${filePath}. Converting based on object key order (unreliable).`);
                    // Fallback: Convert based on object key order (less reliable for order preservation)
                    orderedLayout = Object.entries(layoutObject).map(([name, settings]) => ({ name, ...settings }));
                }
            }
            // Replace the original layout object with the ordered array
            parsedData.layout = orderedLayout;

        } else if (parsedData.layout && Array.isArray(parsedData.layout)) {
            // This case should ideally not happen if writeSettings always writes objects,
            // but handle it defensively. Assume it's already in the correct array format.
            logger.info(`Layout section in ${filePath} was already an array. Using as is.`);
        } else {
            logger.info(`No layout section found or it's not an object/array in ${filePath}.`);
            // Ensure layout is at least an empty array if it doesn't exist or is invalid type
            if (parsedData && !parsedData.layout) {
                 parsedData.layout = [];
            }
        }

        return parsedData;

    } catch (error) {
        if (error.code === 'ENOENT') {
            logger.info(`Settings file not found: ${filePath}. Returning null.`);
            return null;
        } else if (error instanceof yaml.YAMLException) {
            logger.error(`Invalid YAML syntax in settings file ${filePath}: ${error.message}`);
            return null; // Or throw specific error
        } else {
            logger.error(`Error reading settings file ${filePath}:`, error);
            throw error;
        }
    }
};

const writeSettings = async (settingsData, logger) => { // REMOVED userEmail, userName
    // Basic validation: ensure it's an object
    if (typeof settingsData !== 'object' || settingsData === null) {
        logger.error('Invalid settings data provided to writeSettings: must be an object.', { data: settingsData });
        throw new Error('Invalid settings data: must be an object.');
    }

    // Prepare data for writing: Convert ordered layout array back to object
    let dataToWrite = { ...settingsData }; // Clone to avoid modifying input object

    if (dataToWrite.layout && Array.isArray(dataToWrite.layout)) {
        logger.info('Converting ordered layout array back to object for YAML dump.');
        const layoutObject = {};
        dataToWrite.layout.forEach(group => {
            if (group && typeof group.name === 'string') {
                const { name, ...rest } = group; // Separate name from other settings
                layoutObject[name] = rest;
            } else {
                 logger.warn('Skipping invalid group item in layout array:', group);
            }
        });
        dataToWrite.layout = layoutObject;
         logger.debug('Layout object prepared for dump:', layoutObject);
         // Add detailed log of the final layout object structure before dump
         logger.debug({ msg: 'Final dataToWrite.layout structure BEFORE yaml.dump:', layout: dataToWrite.layout });
    } else {
         logger.info('Layout data received by writeSettings was not an array, writing as is.');
         // Add detailed log of the layout object structure when it's not an array
         logger.debug({ msg: 'Final dataToWrite.layout structure (received as non-array) BEFORE yaml.dump:', layout: dataToWrite.layout });
    }


        // Use the generic writeConfigFile, passing the logger and prepared data
        return writeConfigFile('settings', dataToWrite, logger);
    };

// --- Group Names ---

/**
 * Reads services, bookmarks, and settings configs to compile a unique list of group names.
 *
 * @param {object} logger - The Fastify logger instance.
 * @returns {Promise<string[]>} A promise that resolves to a sorted array of unique group names.
 */
const getUnifiedGroupNames = async (logger) => {
    const groupNames = new Set();

    try {
        // 1. Get groups from services.yaml
        const servicesData = await readServices(logger);
        if (Array.isArray(servicesData)) {
            servicesData.forEach(group => {
                if (typeof group === 'object' && group !== null) {
                    const name = Object.keys(group)[0]; // Get the first key as group name
                    if (name) groupNames.add(name);
                }
            });
        }

        // 2. Get groups from bookmarks.yaml
        const bookmarksData = await readBookmarks(logger);
        if (Array.isArray(bookmarksData)) {
            bookmarksData.forEach(group => {
                if (typeof group === 'object' && group !== null) {
                    const name = Object.keys(group)[0]; // Get the first key as group name
                    if (name) groupNames.add(name);
                }
            });
        }

        // 3. Get groups from settings.yaml layout section
        const settingsData = await readSettings(logger); // readSettings now returns layout as array if possible
        if (settingsData && settingsData.layout) {
             if (Array.isArray(settingsData.layout)) {
                 // Layout is already an ordered array from readSettings
                 settingsData.layout.forEach(group => {
                     if (group && typeof group.name === 'string') {
                         groupNames.add(group.name);
                     }
                 });
             } else if (typeof settingsData.layout === 'object' && settingsData.layout !== null) {
                  // Fallback: Layout is still an object (e.g., read error, empty layout)
                  Object.keys(settingsData.layout).forEach(name => {
                      groupNames.add(name);
                  });
             }
        }

    } catch (error) {
        logger.error('Error gathering unified group names:', error);
        // Depending on desired behavior, might re-throw or return empty/partial list
        throw new Error('Failed to gather unified group names.');
    }

    return Array.from(groupNames).sort(); // Return sorted array of unique names
};


// --- Group Renaming ---

/**
 * Renames a group within the settings.yaml file's layout section.
 * Assumes layout is read/written as an ordered array.
 *
 * @param {string} oldName - The current name of the group.
 * @param {string} newName - The desired new name for the group.
 * @param {object} logger - The Fastify logger instance.
 * @returns {Promise<boolean>} True if the group was found and renamed, false otherwise.
 * @throws {Error} If reading/writing settings fails.
 */
const renameGroupInSettings = async (oldName, newName, logger) => { // REMOVED userEmail, userName
    logger.info(`Attempting to rename group in settings: '${oldName}' -> '${newName}'`);
    const settingsData = await readSettings(logger);
    if (!settingsData || !Array.isArray(settingsData.layout)) {
        logger.warn(`Cannot rename group '${oldName}' in settings: layout data is missing or not an array.`);
        return false; // Indicate group not found or layout invalid
    }

    let groupFound = false;
    const updatedLayout = settingsData.layout.map(group => {
        if (group && group.name === oldName) {
            logger.info(`Found group '${oldName}' in settings layout, renaming to '${newName}'.`);
            groupFound = true;
            return { ...group, name: newName };
        }
        return group;
    });

    if (!groupFound) {
        logger.warn(`Group '${oldName}' not found in settings layout.`);
        return false;
    }

    // Write the updated settings back
    await writeSettings({ ...settingsData, layout: updatedLayout }, logger);
    logger.info(`Successfully renamed group '${oldName}' to '${newName}' in settings.yaml.`);
    return true;
};

/**
 * Renames a group within the services.yaml file.
 *
 * @param {string} oldName - The current name of the group.
 * @param {string} newName - The desired new name for the group.
 * @param {object} logger - The Fastify logger instance.
 * @returns {Promise<boolean>} True if the group was found and renamed, false otherwise.
 * @throws {Error} If reading/writing services fails.
 */
const renameGroupInServices = async (oldName, newName, logger) => { // REMOVED userEmail, userName
    logger.info(`Attempting to rename group in services: '${oldName}' -> '${newName}'`);
    const servicesData = await readServices(logger);
    if (!Array.isArray(servicesData)) {
        logger.warn(`Cannot rename group '${oldName}' in services: services data is missing or not an array.`);
        return false; // Indicate group not found or data invalid
    }

    let groupFound = false;
    const updatedServices = servicesData.map(group => {
        if (typeof group === 'object' && group !== null && group.hasOwnProperty(oldName)) {
            logger.info(`Found group '${oldName}' in services, renaming to '${newName}'.`);
            groupFound = true;
            // Create a new object with the new key
            const { [oldName]: groupContent, ...rest } = group; // Destructure old key
             // Ensure no other keys exist unexpectedly, though standard format is just one key
            if (Object.keys(rest).length > 0) {
                 logger.warn(`Group '${oldName}' in services.yaml had unexpected additional keys:`, rest);
            }
            return { [newName]: groupContent };
        }
        return group;
    });

    if (!groupFound) {
        logger.warn(`Group '${oldName}' not found in services.yaml.`);
        return false; // Group didn't exist in this file
    }

    // Write the updated services back
    await writeServices(updatedServices, logger);
    logger.info(`Successfully updated group references from '${oldName}' to '${newName}' in services.yaml.`);
    return true;
};

/**
 * Renames a group within the bookmarks.yaml file.
 *
 * @param {string} oldName - The current name of the group.
 * @param {string} newName - The desired new name for the group.
 * @param {object} logger - The Fastify logger instance.
 * @returns {Promise<boolean>} True if the group was found and renamed, false otherwise.
 * @throws {Error} If reading/writing bookmarks fails.
 */
const renameGroupInBookmarks = async (oldName, newName, logger) => { // REMOVED userEmail, userName
    logger.info(`Attempting to rename group in bookmarks: '${oldName}' -> '${newName}'`);
    const bookmarksData = await readBookmarks(logger);
    if (!Array.isArray(bookmarksData)) {
        logger.warn(`Cannot rename group '${oldName}' in bookmarks: bookmarks data is missing or not an array.`);
        return false; // Indicate group not found or data invalid
    }

    let groupFound = false;
    const updatedBookmarks = bookmarksData.map(group => {
        if (typeof group === 'object' && group !== null && group.hasOwnProperty(oldName)) {
            logger.info(`Found group '${oldName}' in bookmarks, renaming to '${newName}'.`);
            groupFound = true;
            // Create a new object with the new key
            const { [oldName]: groupContent, ...rest } = group; // Destructure old key
            if (Object.keys(rest).length > 0) {
                 logger.warn(`Group '${oldName}' in bookmarks.yaml had unexpected additional keys:`, rest);
            }
            return { [newName]: groupContent };
        }
        return group;
    });

    if (!groupFound) {
        logger.warn(`Group '${oldName}' not found in bookmarks.yaml.`);
        return false; // Group didn't exist in this file
    }

    // Write the updated bookmarks back
    await writeBookmarks(updatedBookmarks, logger);
    logger.info(`Successfully updated group references from '${oldName}' to '${newName}' in bookmarks.yaml.`);
    return true;
};

/**
 * Orchestrates renaming a group across settings.yaml, services.yaml, and bookmarks.yaml.
 * Settings.yaml is the primary source; if the group isn't found there, the operation fails.
 *
 * @param {string} oldName - The current name of the group.
 * @param {string} newName - The desired new name for the group.
 * @param {object} logger - The Fastify logger instance.
 * @returns {Promise<void>} Resolves on successful rename across files (or if group missing in secondary files).
 * @throws {Error} If settings rename fails, or if any file write operation fails critically.
 */
const renameGroup = async (oldName, newName, logger) => { // REMOVED userEmail, userName
    logger.info(`Starting rename process for group: '${oldName}' -> '${newName}'`);
 
     // 1. Rename in Settings (Mandatory)
     const settingsRenamed = await renameGroupInSettings(oldName, newName, logger);
     if (!settingsRenamed) {
         const errorMsg = `Failed to rename group: Group '${oldName}' not found in settings.yaml layout.`;
        logger.error(errorMsg);
        throw new Error(errorMsg); // Throw error as settings is the source of truth
    }

    // 2. Rename in Services (Optional - log if not found)
    try {
        await renameGroupInServices(oldName, newName, logger);
    } catch (error) {
        logger.error(`Error occurred while trying to rename group '${oldName}' in services.yaml:`, error);
        // Decide if this should be a critical failure or just a warning
        // For now, log and continue, as the group might legitimately not exist in services
    }

    // 3. Rename in Bookmarks (Optional - log if not found)
    try {
        await renameGroupInBookmarks(oldName, newName, logger);
    } catch (error) {
        logger.error(`Error occurred while trying to rename group '${oldName}' in bookmarks.yaml:`, error);
        // Log and continue
    }

    logger.info(`Successfully completed rename process for group: '${oldName}' -> '${newName}'`);
};


// --- Group Deletion ---

/**
 * Deletes a group entry from the settings.yaml file's layout section.
 * Assumes layout is read/written as an ordered array.
 *
 * @param {string} groupNameToDelete - The name of the group to delete.
 * @param {object} logger - The Fastify logger instance.
 * @returns {Promise<boolean>} True if the group was found and deleted, false otherwise.
 * @throws {Error} If reading/writing settings fails.
 */
const deleteGroupFromSettings = async (groupNameToDelete, logger) => { // REMOVED userEmail, userName
    logger.info(`Attempting to delete group from settings: '${groupNameToDelete}'`);
    const settingsData = await readSettings(logger);
    if (!settingsData || !Array.isArray(settingsData.layout)) {
        logger.warn(`Cannot delete group '${groupNameToDelete}' from settings: layout data is missing or not an array.`);
        return false; // Indicate group not found or layout invalid
    }

    const initialLength = settingsData.layout.length;
    const updatedLayout = settingsData.layout.filter(group => {
        if (group && group.name === groupNameToDelete) {
            logger.info(`Found group '${groupNameToDelete}' in settings layout, removing.`);
            return false; // Exclude this group
        }
        return true; // Keep other groups
    });

    if (updatedLayout.length === initialLength) {
        logger.warn(`Group '${groupNameToDelete}' not found in settings layout for deletion.`);
        return false; // Group was not found
    }

    // Write the updated settings back
    await writeSettings({ ...settingsData, layout: updatedLayout }, logger);
    logger.info(`Successfully deleted group '${groupNameToDelete}' from settings.yaml.`);
    return true;
};

/**
 * Removes a group from services.yaml and returns its items.
 *
 * @param {string} groupNameToDelete - The name of the group to remove.
 * @param {object} logger - The Fastify logger instance.
 * @returns {Promise<Array>} The array of items from the deleted group, or an empty array if not found/empty.
 * @throws {Error} If reading/writing services fails.
 */
const removeGroupAndGetServices = async (groupNameToDelete, logger) => { // REMOVED userEmail, userName
    logger.info(`Attempting to remove group and get items from services: '${groupNameToDelete}'`);
    const servicesData = await readServices(logger);
    let extractedItems = [];

    if (!Array.isArray(servicesData)) {
        logger.warn(`Cannot process group '${groupNameToDelete}' in services: data is missing or not an array.`);
        return extractedItems; // Return empty array
    }

    let groupFound = false;
    const updatedServices = servicesData.filter(group => {
        if (typeof group === 'object' && group !== null && group.hasOwnProperty(groupNameToDelete)) {
            logger.info(`Found group '${groupNameToDelete}' in services, extracting items and removing group.`);
            // Ensure the value is an array before assigning
            extractedItems = Array.isArray(group[groupNameToDelete]) ? group[groupNameToDelete] : [];
            groupFound = true;
            return false; // Exclude this group
        }
        return true; // Keep other groups
    });

    if (!groupFound) {
        logger.warn(`Group '${groupNameToDelete}' not found in services.yaml for item extraction.`);
        // No need to write back if nothing changed
        return extractedItems; // Return empty array
    }

    // Write the updated services back (without the deleted group)
    await writeServices(updatedServices, logger);
    logger.info(`Successfully removed group '${groupNameToDelete}' from services.yaml.`);
    return extractedItems;
};

/**
 * Removes a group from bookmarks.yaml and returns its items.
 *
 * @param {string} groupNameToDelete - The name of the group to remove.
 * @param {object} logger - The Fastify logger instance.
 * @returns {Promise<Array>} The array of items from the deleted group, or an empty array if not found/empty.
 * @throws {Error} If reading/writing bookmarks fails.
 */
const removeGroupAndGetBookmarks = async (groupNameToDelete, logger) => { // REMOVED userEmail, userName
    logger.info(`Attempting to remove group and get items from bookmarks: '${groupNameToDelete}'`);
    const bookmarksData = await readBookmarks(logger);
    let extractedItems = [];

    if (!Array.isArray(bookmarksData)) {
        logger.warn(`Cannot process group '${groupNameToDelete}' in bookmarks: data is missing or not an array.`);
        return extractedItems; // Return empty array
    }

    let groupFound = false;
    const updatedBookmarks = bookmarksData.filter(group => {
        if (typeof group === 'object' && group !== null && group.hasOwnProperty(groupNameToDelete)) {
            logger.info(`Found group '${groupNameToDelete}' in bookmarks, extracting items and removing group.`);
            extractedItems = Array.isArray(group[groupNameToDelete]) ? group[groupNameToDelete] : [];
            groupFound = true;
            return false; // Exclude this group
        }
        return true; // Keep other groups
    });

    if (!groupFound) {
        logger.warn(`Group '${groupNameToDelete}' not found in bookmarks.yaml for item extraction.`);
        return extractedItems; // Return empty array
    }

    // Write the updated bookmarks back
    await writeBookmarks(updatedBookmarks, logger);
    logger.info(`Successfully removed group '${groupNameToDelete}' from bookmarks.yaml.`);
    return extractedItems;
};

/**
 * Adds items to the 'Uncategorized' group in services.yaml.
 * Creates the group if it doesn't exist.
 *
 * @param {Array} itemsToAdd - Array of service items to add.
 * @param {object} logger - Fastify logger instance.
 * @returns {Promise<void>}
 * @throws {Error} If reading/writing services fails.
 */
const addItemsToUncategorizedServices = async (itemsToAdd, logger) => { // REMOVED userEmail, userName
    if (!Array.isArray(itemsToAdd) || itemsToAdd.length === 0) {
        logger.info('No service items to add to Uncategorized group.');
        return;
    }
    logger.info(`Adding ${itemsToAdd.length} service items to Uncategorized group.`);

    const servicesData = await readServices(logger) || []; // Default to empty array if null
    if (!Array.isArray(servicesData)) {
         logger.error('Failed to add items to Uncategorized: services.yaml is not a valid array.');
         throw new Error('Invalid services.yaml format: Expected an array.');
    }


    const uncategorizedGroupName = 'Uncategorized';
    const existingGroupIndex = servicesData.findIndex(group =>
        typeof group === 'object' && group !== null && group.hasOwnProperty(uncategorizedGroupName)
    );

    if (existingGroupIndex !== -1) {
        // Group exists, append items
        const existingItems = servicesData[existingGroupIndex][uncategorizedGroupName];
        if (Array.isArray(existingItems)) {
            servicesData[existingGroupIndex][uncategorizedGroupName] = [...existingItems, ...itemsToAdd];
            logger.info(`Appended items to existing Uncategorized services group.`);
        } else {
            // Handle case where Uncategorized exists but isn't an array (shouldn't happen with valid config)
            logger.warn(`Uncategorized services group exists but is not an array. Overwriting with new items.`);
            servicesData[existingGroupIndex][uncategorizedGroupName] = itemsToAdd;
        }
    } else {
        // Group doesn't exist, create it
        servicesData.push({ [uncategorizedGroupName]: itemsToAdd });
        logger.info(`Created new Uncategorized services group.`);
    }

    await writeServices(servicesData, logger);
    logger.info('Successfully updated services.yaml with Uncategorized items.');
};

/**
 * Adds items to the 'Uncategorized' group in bookmarks.yaml.
 * Creates the group if it doesn't exist.
 *
 * @param {Array} itemsToAdd - Array of bookmark items to add.
 * @param {object} logger - Fastify logger instance.
 * @returns {Promise<void>}
 * @throws {Error} If reading/writing bookmarks fails.
 */
const addBookmarksToUncategorizedGroup = async (itemsToAdd, logger) => { // REMOVED userEmail, userName
    if (!Array.isArray(itemsToAdd) || itemsToAdd.length === 0) {
        logger.info('No bookmark items to add to Uncategorized group.');
        return;
    }
     logger.info(`Adding ${itemsToAdd.length} bookmark items to Uncategorized group.`);

    const bookmarksData = await readBookmarks(logger) || []; // Default to empty array if null
     if (!Array.isArray(bookmarksData)) {
         logger.error('Failed to add items to Uncategorized: bookmarks.yaml is not a valid array.');
         throw new Error('Invalid bookmarks.yaml format: Expected an array.');
    }

    const uncategorizedGroupName = 'Uncategorized';
    const existingGroupIndex = bookmarksData.findIndex(group =>
        typeof group === 'object' && group !== null && group.hasOwnProperty(uncategorizedGroupName)
    );

    if (existingGroupIndex !== -1) {
        // Group exists, append items
        const existingItems = bookmarksData[existingGroupIndex][uncategorizedGroupName];
        if (Array.isArray(existingItems)) {
            bookmarksData[existingGroupIndex][uncategorizedGroupName] = [...existingItems, ...itemsToAdd];
             logger.info(`Appended items to existing Uncategorized bookmarks group.`);
        } else {
            logger.warn(`Uncategorized bookmarks group exists but is not an array. Overwriting with new items.`);
            bookmarksData[existingGroupIndex][uncategorizedGroupName] = itemsToAdd;
        }
    } else {
        // Group doesn't exist, create it
        bookmarksData.push({ [uncategorizedGroupName]: itemsToAdd });
         logger.info(`Created new Uncategorized bookmarks group.`);
    }

    await writeBookmarks(bookmarksData, logger);
     logger.info('Successfully updated bookmarks.yaml with Uncategorized items.');
};


/**
 * Orchestrates deleting a group layout entry from settings.yaml and moving
 * corresponding items in services.yaml and bookmarks.yaml to an 'Uncategorized' group.
 * Settings.yaml is the primary source; if the group isn't found there, the operation fails.
 *
 * @param {string} groupNameToDelete - The name of the group layout to delete.
 * @param {object} logger - The Fastify logger instance.
 * @returns {Promise<void>} Resolves on successful deletion/move across files.
 * @throws {Error} If settings deletion fails, or if any critical file write/read operation fails.
 */
const deleteGroup = async (groupNameToDelete, logger) => { // REMOVED userEmail, userName
    logger.info(`Starting deletion process for group layout: '${groupNameToDelete}' (moving items to Uncategorized)`);
    const uncategorizedGroupName = 'Uncategorized';
 
     // --- Step 1: Delete layout entry from Settings (Mandatory) ---
     const settingsDeleted = await deleteGroupFromSettings(groupNameToDelete, logger);
     if (!settingsDeleted) {
         const errorMsg = `Failed to delete group layout: Group '${groupNameToDelete}' not found in settings.yaml layout or layout is invalid.`;
        logger.error(errorMsg);
        throw new Error(errorMsg); // Stop if the primary target doesn't exist
    }

    // --- Step 2: Remove group from Services and get items ---
    let serviceItemsToMove = [];
    try {
        serviceItemsToMove = await removeGroupAndGetServices(groupNameToDelete, logger);
    } catch (error) {
        logger.error(`Error removing group '${groupNameToDelete}' from services.yaml:`, error);
        // Log and continue, but items won't be moved.
    }

    // --- Step 3: Remove group from Bookmarks and get items ---
    let bookmarkItemsToMove = [];
    try {
        bookmarkItemsToMove = await removeGroupAndGetBookmarks(groupNameToDelete, logger);
    } catch (error) {
        logger.error(`Error removing group '${groupNameToDelete}' from bookmarks.yaml:`, error);
        // Log and continue.
    }

    // --- Step 4: Ensure 'Uncategorized' layout exists in settings if items were moved ---
    const itemsWereMoved = serviceItemsToMove.length > 0 || bookmarkItemsToMove.length > 0;
    if (itemsWereMoved) {
        try {
            const currentSettings = await readSettings(logger);
            // Ensure settings and layout array exist
            if (currentSettings && Array.isArray(currentSettings.layout)) {
                const uncategorizedExists = currentSettings.layout.some(group => group.name === uncategorizedGroupName);
                if (!uncategorizedExists) {
                    logger.info(`'${uncategorizedGroupName}' layout not found in settings.yaml, adding default entry.`);
                    const defaultLayout = { name: uncategorizedGroupName, header: true, style: 'row', columns: 4 };
                    currentSettings.layout.push(defaultLayout); // Add to the end
                    await writeSettings(currentSettings, logger); // Write settings back
                    logger.info(`Successfully added '${uncategorizedGroupName}' layout entry to settings.yaml.`);
                } else {
                     logger.info(`'${uncategorizedGroupName}' layout already exists in settings.yaml.`);
                }
            } else {
                 logger.warn(`Could not verify/add '${uncategorizedGroupName}' layout: settings.yaml data or layout array is invalid.`);
            }
        } catch (error) {
            logger.error(`Error ensuring '${uncategorizedGroupName}' layout exists in settings.yaml:`, error);
            // Log error, but proceed with moving items if possible.
        }
    } else {
         logger.info(`No items extracted from group '${groupNameToDelete}', skipping 'Uncategorized' layout check in settings.yaml.`);
    }


    // --- Step 5: Add extracted service items to Uncategorized group in services.yaml ---
    try {
        await addItemsToUncategorizedServices(serviceItemsToMove, logger);
    } catch (error) {
         logger.error(`Error adding items from deleted group '${groupNameToDelete}' to Uncategorized services:`, error);
         // Log error, but don't throw, as primary deletion succeeded. User might need manual cleanup.
    }

     // --- Step 6: Add extracted bookmark items to Uncategorized group in bookmarks.yaml ---
    try {
        await addBookmarksToUncategorizedGroup(bookmarkItemsToMove, logger);
    } catch (error) {
         logger.error(`Error adding items from deleted group '${groupNameToDelete}' to Uncategorized bookmarks:`, error);
         // Log error.
    }


    logger.info(`Successfully completed deletion process for group layout '${groupNameToDelete}' (items moved).`);
};


// --- Exports ---
module.exports = {
    readConfigFile,
    writeConfigFile,
    writeRawConfigFile,
    readServices,
    writeServices,
    readBookmarks,
    writeBookmarks,
    readSettings,
    writeSettings,
    getUnifiedGroupNames,
    renameGroup,
    deleteGroup, // Export the main delete function
    CONFIG_FILES,
    CONFIG_DIR,
};