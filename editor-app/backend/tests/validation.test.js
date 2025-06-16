const tap = require('tap');
const {
    validateEmail,
    validatePassword,
    validateFilename,
    validateText,
    validateFilePath,
    sanitizeHtml,
    VALIDATION_CONFIG
} = require('../validationMiddleware');

tap.test('Email validation', async (t) => {
    // Valid emails
    t.test('should accept valid emails', async (t) => {
        const validEmails = [
            'test@example.com',
            'user.name@domain.co.uk',
            'admin@localhost.local',
            'test123@test-domain.org'
        ];
        
        for (const email of validEmails) {
            const result = validateEmail(email);
            t.ok(result.isValid, `${email} should be valid`);
            t.equal(result.sanitized, email.toLowerCase(), `${email} should be lowercased`);
            t.equal(result.errors.length, 0, `${email} should have no errors`);
        }
    });
    
    // Invalid emails
    t.test('should reject invalid emails', async (t) => {
        const invalidEmails = [
            'invalid-email',
            'test@',
            '@domain.com',
            'test..test@domain.com',
            'test@domain',
            '',
            null,
            undefined,
            123
        ];
        
        for (const email of invalidEmails) {
            const result = validateEmail(email);
            t.notOk(result.isValid, `${email} should be invalid`);
            t.ok(result.errors.length > 0, `${email} should have errors`);
        }
    });
    
    // Email length limits
    t.test('should reject emails that are too long', async (t) => {
        const longEmail = 'a'.repeat(250) + '@example.com';
        const result = validateEmail(longEmail);
        t.notOk(result.isValid, 'Long email should be invalid');
        t.ok(result.errors.some(err => err.includes('characters or less')), 'Should have length error');
    });
});

tap.test('Password validation', async (t) => {
    // Valid passwords
    t.test('should accept valid passwords', async (t) => {
        const validPasswords = [
            'MySecureP@ssw0rd123',
            'AnotherGood1!',
            'Complex#Pass123',
            'Str0ng&Secure!'
        ];
        
        for (const password of validPasswords) {
            const result = validatePassword(password);
            t.ok(result.isValid, `${password} should be valid`);
            t.equal(result.errors.length, 0, `${password} should have no errors`);
        }
    });
    
    // Invalid passwords
    t.test('should reject invalid passwords', async (t) => {
        const invalidPasswords = [
            'short',           // Too short
            'nouppercase123!', // No uppercase
            'NOLOWERCASE123!', // No lowercase
            'NoNumbers!',      // No numbers
            'NoSpecialChars123', // No special characters
            'a'.repeat(130),   // Too long
            '',                // Empty
            null,              // Null
            undefined          // Undefined
        ];
        
        for (const password of invalidPasswords) {
            const result = validatePassword(password);
            t.notOk(result.isValid, `${password} should be invalid`);
            t.ok(result.errors.length > 0, `${password} should have errors`);
        }
    });
});

tap.test('Filename validation', async (t) => {
    // Valid filenames
    t.test('should accept valid filenames', async (t) => {
        const validFilenames = [
            'document.txt',
            'image_file.png',
            'config-file.yaml',
            'test123.js',
            'file.with.dots.css'
        ];
        
        for (const filename of validFilenames) {
            const result = validateFilename(filename);
            t.ok(result.isValid, `${filename} should be valid`);
            t.equal(result.errors.length, 0, `${filename} should have no errors`);
        }
    });
    
    // Invalid filenames
    t.test('should reject invalid filenames', async (t) => {
        const invalidFilenames = [
            'file/with/path.txt',    // Path separators
            'file<script>.txt',      // Dangerous characters
            'file*.txt',             // Wildcards
            'file?.txt',             // Question marks
            'CON.txt',               // Reserved name
            'malware.exe',           // Blocked extension
            '',                      // Empty
            '   ',                   // Only spaces
            'a'.repeat(300) + '.txt' // Too long
        ];
        
        for (const filename of invalidFilenames) {
            const result = validateFilename(filename);
            t.notOk(result.isValid, `${filename} should be invalid`);
            t.ok(result.errors.length > 0, `${filename} should have errors`);
        }
    });
    
    // Filename sanitization
    t.test('should sanitize filenames', async (t) => {
        const testCases = [
            { input: '  file.txt  ', expected: 'file.txt' },
            { input: 'file/name.txt', expected: 'file_name.txt' },
            { input: 'file\\name.txt', expected: 'file_name.txt' },
            { input: 'file:name.txt', expected: 'file_name.txt' }
        ];
        
        for (const testCase of testCases) {
            const result = validateFilename(testCase.input);
            if (result.isValid) {
                t.equal(result.sanitized, testCase.expected, 
                    `${testCase.input} should be sanitized to ${testCase.expected}`);
            }
        }
    });
});

tap.test('Text validation and sanitization', async (t) => {
    // Valid text
    t.test('should accept valid text', async (t) => {
        const validTexts = [
            'Simple text',
            'Text with numbers 123',
            'Text with special chars: !@#$%',
            ''  // Empty text when not required
        ];
        
        for (const text of validTexts) {
            const result = validateText(text, { required: false });
            t.ok(result.isValid, `"${text}" should be valid`);
            t.equal(result.errors.length, 0, `"${text}" should have no errors`);
        }
    });
    
    // HTML sanitization
    t.test('should sanitize HTML content', async (t) => {
        const testCases = [
            {
                input: '<script>alert("xss")</script>Hello',
                expected: 'Hello'
            },
            {
                input: '<p onclick="malicious()">Text</p>',
                expected: '<p>Text</p>'
            },
            {
                input: '<a href="javascript:alert()">Link</a>',
                expected: '<a href="">Link</a>'
            },
            {
                input: 'Normal text with <b>bold</b>',
                expected: 'Normal text with <b>bold</b>'
            }
        ];
        
        for (const testCase of testCases) {
            const result = validateText(testCase.input);
            t.equal(result.sanitized, testCase.expected, 
                `"${testCase.input}" should be sanitized to "${testCase.expected}"`);
        }
    });
    
    // Required text validation
    t.test('should handle required text validation', async (t) => {
        const result = validateText('', { required: true });
        t.notOk(result.isValid, 'Empty text should be invalid when required');
        t.ok(result.errors.some(err => err.includes('cannot be empty')), 'Should have required error');
    });
    
    // Text length validation
    t.test('should validate text length', async (t) => {
        const longText = 'a'.repeat(10001);
        const result = validateText(longText);
        t.notOk(result.isValid, 'Long text should be invalid');
        t.ok(result.errors.some(err => err.includes('characters or less')), 'Should have length error');
    });
});

tap.test('HTML sanitization', async (t) => {
    t.test('should remove dangerous script tags', async (t) => {
        const dangerous = '<script>alert("xss")</script><p>Safe content</p>';
        const sanitized = sanitizeHtml(dangerous);
        t.notOk(sanitized.includes('<script>'), 'Should remove script tags');
        t.ok(sanitized.includes('Safe content'), 'Should preserve safe content');
    });
    
    t.test('should remove dangerous attributes', async (t) => {
        const dangerous = '<div onclick="malicious()" onload="bad()">Content</div>';
        const sanitized = sanitizeHtml(dangerous);
        t.notOk(sanitized.includes('onclick'), 'Should remove onclick attribute');
        t.notOk(sanitized.includes('onload'), 'Should remove onload attribute');
        t.ok(sanitized.includes('Content'), 'Should preserve content');
    });
    
    t.test('should remove javascript and data protocols', async (t) => {
        const dangerous = '<a href="javascript:alert()">Link</a><img src="data:image/svg+xml,<svg>">Image</img>';
        const sanitized = sanitizeHtml(dangerous);
        t.notOk(sanitized.includes('javascript:'), 'Should remove javascript protocol');
        t.notOk(sanitized.includes('data:'), 'Should remove data protocol');
    });
    
    t.test('should handle non-string input', async (t) => {
        t.equal(sanitizeHtml(null), null, 'Should return null for null input');
        t.equal(sanitizeHtml(undefined), undefined, 'Should return undefined for undefined input');
        t.equal(sanitizeHtml(123), 123, 'Should return number for number input');
    });
});

tap.test('File path validation', async (t) => {
    const basePath = '/safe/directory';
    
    t.test('should accept safe file paths', async (t) => {
        const safePaths = [
            'file.txt',
            'subdir/file.txt',
            'deep/nested/file.txt'
        ];
        
        for (const filePath of safePaths) {
            const result = validateFilePath(filePath, basePath);
            t.ok(result.isValid, `${filePath} should be valid`);
            t.equal(result.errors.length, 0, `${filePath} should have no errors`);
        }
    });
    
    t.test('should reject directory traversal attempts', async (t) => {
        const dangerousPaths = [
            '../../../etc/passwd',
            '..\\..\\windows\\system32',
            '/absolute/path/file.txt',
            'subdir/../../outside.txt'
        ];
        
        for (const filePath of dangerousPaths) {
            const result = validateFilePath(filePath, basePath);
            t.notOk(result.isValid, `${filePath} should be invalid`);
            t.ok(result.errors.length > 0, `${filePath} should have errors`);
        }
    });
    
    t.test('should handle invalid inputs', async (t) => {
        const invalidInputs = [
            { filePath: null, basePath: basePath },
            { filePath: 'file.txt', basePath: null },
            { filePath: undefined, basePath: basePath },
            { filePath: 123, basePath: basePath }
        ];
        
        for (const { filePath, basePath: base } of invalidInputs) {
            const result = validateFilePath(filePath, base);
            t.notOk(result.isValid, `Invalid input should be rejected`);
            t.ok(result.errors.length > 0, `Invalid input should have errors`);
        }
    });
});

tap.test('Validation configuration', async (t) => {
    t.test('should have proper configuration constants', async (t) => {
        t.ok(VALIDATION_CONFIG.email, 'Should have email config');
        t.ok(VALIDATION_CONFIG.password, 'Should have password config');
        t.ok(VALIDATION_CONFIG.filename, 'Should have filename config');
        t.ok(VALIDATION_CONFIG.text, 'Should have text config');
        
        t.equal(typeof VALIDATION_CONFIG.email.maxLength, 'number', 'Email maxLength should be number');
        t.equal(typeof VALIDATION_CONFIG.password.minLength, 'number', 'Password minLength should be number');
        t.ok(VALIDATION_CONFIG.password.minLength >= 12, 'Password should require at least 12 characters');
    });
});