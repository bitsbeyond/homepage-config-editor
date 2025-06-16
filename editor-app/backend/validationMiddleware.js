const validator = require('validator');
const path = require('path');

/**
 * Comprehensive input validation and sanitization middleware
 * Provides centralized validation functions for all API endpoints
 */

// Configuration constants
const VALIDATION_CONFIG = {
    email: {
        maxLength: 254, // RFC 5321 limit
        options: {
            allow_utf8_local_part: false,
            require_tld: true,
            allow_ip_domain: false
        }
    },
    password: {
        minLength: 12, // Enhanced from 8 to 12
        maxLength: 128,
        requireComplexity: true
    },
    filename: {
        maxLength: 255,
        allowedChars: /^[a-zA-Z0-9._-]+$/,
        blockedExtensions: ['.exe', '.bat', '.cmd', '.com', '.scr', '.pif']
    },
    text: {
        maxLength: 10000, // General text input limit
        stripHtml: true
    },
    yaml: {
        maxSize: 1024 * 1024, // 1MB limit for YAML files
        maxDepth: 10 // Prevent deeply nested structures
    }
};

/**
 * Sanitizes HTML content by removing dangerous tags and attributes
 * @param {string} input - Input string to sanitize
 * @returns {string} - Sanitized string
 */
const sanitizeHtml = (input) => {
    if (typeof input !== 'string') return input;
    
    // Remove script tags and their content
    let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove dangerous HTML tags
    const dangerousTags = ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'link', 'meta', 'style'];
    dangerousTags.forEach(tag => {
        const regex = new RegExp(`<${tag}\\b[^>]*>.*?<\\/${tag}>`, 'gi');
        sanitized = sanitized.replace(regex, '');
        // Also remove self-closing tags
        const selfClosingRegex = new RegExp(`<${tag}\\b[^>]*\\/>`, 'gi');
        sanitized = sanitized.replace(selfClosingRegex, '');
    });
    
    // Remove dangerous attributes from remaining tags
    const dangerousAttrs = ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit'];
    dangerousAttrs.forEach(attr => {
        const regex = new RegExp(`\\s${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
        sanitized = sanitized.replace(regex, '');
    });
    
    // Remove javascript: and data: protocols - more comprehensive
    sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href=""');
    sanitized = sanitized.replace(/src\s*=\s*["']data:[^"']*["']/gi, 'src=""');
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/data:/gi, '');
    
    return sanitized.trim();
};

/**
 * Validates email format with enhanced security
 * @param {string} email - Email to validate
 * @returns {object} - Validation result
 */
const validateEmail = (email) => {
    const result = { isValid: false, sanitized: '', errors: [] };
    
    if (!email || typeof email !== 'string') {
        result.errors.push('Email is required and must be a string');
        return result;
    }
    
    // Sanitize and trim
    const sanitized = email.trim().toLowerCase();
    result.sanitized = sanitized;
    
    // Length check
    if (sanitized.length > VALIDATION_CONFIG.email.maxLength) {
        result.errors.push(`Email must be ${VALIDATION_CONFIG.email.maxLength} characters or less`);
        return result;
    }
    
    // Format validation using validator library
    if (!validator.isEmail(sanitized, VALIDATION_CONFIG.email.options)) {
        result.errors.push('Invalid email format');
        return result;
    }
    
    // Additional security checks
    if (sanitized.includes('..')) {
        result.errors.push('Email contains invalid consecutive dots');
        return result;
    }
    
    result.isValid = true;
    return result;
};

/**
 * Validates password with complexity requirements
 * @param {string} password - Password to validate
 * @returns {object} - Validation result
 */
const validatePassword = (password) => {
    const result = { isValid: false, errors: [] };
    
    if (!password || typeof password !== 'string') {
        result.errors.push('Password is required and must be a string');
        return result;
    }
    
    // Length checks
    if (password.length < VALIDATION_CONFIG.password.minLength) {
        result.errors.push(`Password must be at least ${VALIDATION_CONFIG.password.minLength} characters long`);
    }
    
    if (password.length > VALIDATION_CONFIG.password.maxLength) {
        result.errors.push(`Password must be ${VALIDATION_CONFIG.password.maxLength} characters or less`);
    }
    
    if (VALIDATION_CONFIG.password.requireComplexity) {
        // Check for at least one uppercase letter
        if (!/[A-Z]/.test(password)) {
            result.errors.push('Password must contain at least one uppercase letter');
        }
        
        // Check for at least one lowercase letter
        if (!/[a-z]/.test(password)) {
            result.errors.push('Password must contain at least one lowercase letter');
        }
        
        // Check for at least one number
        if (!/\d/.test(password)) {
            result.errors.push('Password must contain at least one number');
        }
        
        // Check for at least one special character
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            result.errors.push('Password must contain at least one special character');
        }
    }
    
    result.isValid = result.errors.length === 0;
    return result;
};

/**
 * Validates and sanitizes filename
 * @param {string} filename - Filename to validate
 * @returns {object} - Validation result
 */
const validateFilename = (filename) => {
    const result = { isValid: false, sanitized: '', errors: [] };
    
    if (!filename || typeof filename !== 'string') {
        result.errors.push('Filename is required and must be a string');
        return result;
    }
    
    // Basic sanitization
    let sanitized = filename.trim();
    
    // Check for dangerous characters before sanitization
    if (/[\/\\:*?"<>|]/.test(sanitized)) {
        result.errors.push('Filename contains invalid characters: / \\ : * ? " < > |');
        return result;
    }
    
    // Remove leading/trailing dots and spaces
    sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '');
    
    result.sanitized = sanitized;
    
    // Length check
    if (sanitized.length === 0) {
        result.errors.push('Filename cannot be empty after sanitization');
        return result;
    }
    
    if (sanitized.length > VALIDATION_CONFIG.filename.maxLength) {
        result.errors.push(`Filename must be ${VALIDATION_CONFIG.filename.maxLength} characters or less`);
        return result;
    }
    
    // Character validation - check original filename for invalid chars
    if (!VALIDATION_CONFIG.filename.allowedChars.test(sanitized)) {
        result.errors.push('Filename contains invalid characters. Only letters, numbers, dots, hyphens, and underscores are allowed');
        return result;
    }
    
    // Extension check
    const ext = path.extname(sanitized).toLowerCase();
    if (VALIDATION_CONFIG.filename.blockedExtensions.includes(ext)) {
        result.errors.push(`File extension ${ext} is not allowed`);
        return result;
    }
    
    // Reserved names check (Windows)
    const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
    const nameWithoutExt = path.basename(sanitized, ext).toUpperCase();
    if (reservedNames.includes(nameWithoutExt)) {
        result.errors.push(`Filename ${nameWithoutExt} is reserved and cannot be used`);
        return result;
    }
    
    result.isValid = true;
    return result;
};

/**
 * Validates and sanitizes general text input
 * @param {string} text - Text to validate
 * @param {object} options - Validation options
 * @returns {object} - Validation result
 */
const validateText = (text, options = {}) => {
    const result = { isValid: false, sanitized: '', errors: [] };
    
    if (text === null || text === undefined) {
        if (options.required) {
            result.errors.push('Text is required');
            return result;
        } else {
            result.isValid = true;
            result.sanitized = '';
            return result;
        }
    }
    
    if (typeof text !== 'string') {
        result.errors.push('Text must be a string');
        return result;
    }
    
    // Sanitize HTML if enabled
    let sanitized = options.stripHtml !== false ? sanitizeHtml(text) : text;
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    result.sanitized = sanitized;
    
    // Length validation
    const maxLength = options.maxLength || VALIDATION_CONFIG.text.maxLength;
    if (sanitized.length > maxLength) {
        result.errors.push(`Text must be ${maxLength} characters or less`);
        return result;
    }
    
    // Required check after sanitization
    if (options.required && sanitized.length === 0) {
        result.errors.push('Text cannot be empty');
        return result;
    }
    
    result.isValid = true;
    return result;
};

/**
 * Validates file path to prevent directory traversal
 * @param {string} filePath - File path to validate
 * @param {string} basePath - Base path that file must be within
 * @returns {object} - Validation result
 */
const validateFilePath = (filePath, basePath) => {
    const result = { isValid: false, resolvedPath: '', errors: [] };
    
    if (!filePath || typeof filePath !== 'string') {
        result.errors.push('File path is required and must be a string');
        return result;
    }
    
    if (!basePath || typeof basePath !== 'string') {
        result.errors.push('Base path is required and must be a string');
        return result;
    }
    
    try {
        // Check for absolute paths first
        if (path.isAbsolute(filePath)) {
            result.errors.push('Absolute file paths are not allowed');
            return result;
        }
        
        // Resolve the full path
        const requestedPath = path.join(basePath, filePath);
        const resolvedPath = path.resolve(requestedPath);
        const resolvedBasePath = path.resolve(basePath);
        
        result.resolvedPath = resolvedPath;
        
        // Check if resolved path is within base path
        if (!resolvedPath.startsWith(resolvedBasePath + path.sep) && resolvedPath !== resolvedBasePath) {
            result.errors.push('File path attempts to access files outside allowed directory');
            return result;
        }
        
        result.isValid = true;
        return result;
        
    } catch (error) {
        result.errors.push('Invalid file path format');
        return result;
    }
};

/**
 * Validates request body size
 * @param {object} req - Request object
 * @param {number} maxSize - Maximum allowed size in bytes
 * @returns {object} - Validation result
 */
const validateRequestSize = (req, maxSize = 1024 * 1024) => { // Default 1MB
    const result = { isValid: false, errors: [] };
    
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    
    if (contentLength > maxSize) {
        result.errors.push(`Request body too large. Maximum size is ${Math.round(maxSize / 1024)}KB`);
        return result;
    }
    
    result.isValid = true;
    return result;
};

/**
 * Middleware factory for request validation
 * @param {object} validationRules - Validation rules for the endpoint
 * @returns {function} - Fastify middleware function
 */
const createValidationMiddleware = (validationRules = {}) => {
    return async (request, reply) => {
        const errors = [];
        
        // Validate request size if specified
        if (validationRules.maxSize) {
            const sizeValidation = validateRequestSize(request, validationRules.maxSize);
            if (!sizeValidation.isValid) {
                errors.push(...sizeValidation.errors);
            }
        }
        
        // Validate body parameters
        if (validationRules.body && request.body) {
            for (const [field, rules] of Object.entries(validationRules.body)) {
                const value = request.body[field];
                
                if (rules.type === 'email') {
                    const validation = validateEmail(value);
                    if (!validation.isValid) {
                        errors.push(`${field}: ${validation.errors.join(', ')}`);
                    } else {
                        request.body[field] = validation.sanitized;
                    }
                } else if (rules.type === 'password') {
                    const validation = validatePassword(value);
                    if (!validation.isValid) {
                        errors.push(`${field}: ${validation.errors.join(', ')}`);
                    }
                } else if (rules.type === 'text') {
                    const validation = validateText(value, rules);
                    if (!validation.isValid) {
                        errors.push(`${field}: ${validation.errors.join(', ')}`);
                    } else {
                        request.body[field] = validation.sanitized;
                    }
                } else if (rules.type === 'filename') {
                    const validation = validateFilename(value);
                    if (!validation.isValid) {
                        errors.push(`${field}: ${validation.errors.join(', ')}`);
                    } else {
                        request.body[field] = validation.sanitized;
                    }
                }
            }
        }
        
        // Validate URL parameters
        if (validationRules.params && request.params) {
            for (const [field, rules] of Object.entries(validationRules.params)) {
                const value = request.params[field];
                
                if (rules.type === 'filename') {
                    const validation = validateFilename(value);
                    if (!validation.isValid) {
                        errors.push(`${field}: ${validation.errors.join(', ')}`);
                    } else {
                        request.params[field] = validation.sanitized;
                    }
                } else if (rules.type === 'text') {
                    const validation = validateText(value, rules);
                    if (!validation.isValid) {
                        errors.push(`${field}: ${validation.errors.join(', ')}`);
                    } else {
                        request.params[field] = validation.sanitized;
                    }
                }
            }
        }
        
        // If there are validation errors, return them
        if (errors.length > 0) {
            request.log.warn(`Validation failed for ${request.method} ${request.url}: ${errors.join('; ')}`);
            return reply.code(400).send({
                error: 'Validation failed',
                details: errors
            });
        }
    };
};

module.exports = {
    sanitizeHtml,
    validateEmail,
    validatePassword,
    validateFilename,
    validateText,
    validateFilePath,
    validateRequestSize,
    createValidationMiddleware,
    VALIDATION_CONFIG
};