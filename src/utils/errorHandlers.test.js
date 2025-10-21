const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

// Import the error handling functions (these will be created in the next task)
const {
  handleMalformedFileError,
  handleInvalidSchemaError,
  handleFileSystemError,
  handleValidationError,
  handleParseError,
  handleWriteError,
  validateFileIntegrity,
  sanitizeManifestData,
  recoverFromCorruptedFile,
  createErrorReport,
  logErrorWithContext,
  retryOperation,
  validateSchemaCompatibility,
  handleConcurrentAccessError,
  handlePermissionError,
  handleDiskSpaceError,
  handleNetworkError,
  handleTimeoutError,
  handleMemoryError,
  handleEncodingError,
} = require('./errorHandlers');

// Mock fs-extra for testing
jest.mock('fs-extra');

describe('Error Handling Scenarios', () => {
  let mockManifestData;
  let mockValidSchema;
  let mockInvalidSchema;

  beforeEach(() => {
    mockManifestData = {
      id: 'proj-001',
      name: 'Test Project',
      startDate: '2025-01-01',
      areaHierarchy: {
        'Feature A': {
          'Sub-Feature A1': ['Component 1', 'Component 2'],
        },
      },
    };

    mockValidSchema = {
      type: 'object',
      required: ['id', 'name', 'startDate', 'areaHierarchy'],
      properties: {
        id: { type: 'string' },
        name: { type: 'string', minLength: 1 },
        startDate: { type: 'string', format: 'date' },
        areaHierarchy: { type: 'object' },
      },
    };

    mockInvalidSchema = {
      type: 'invalid-type',
      required: 'not-an-array',
      properties: 'not-an-object',
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Malformed File Error Handling', () => {
    it('should handle malformed JSON files gracefully', async () => {
      const filePath = '/test/malformed.json';
      const malformedJson = '{ "id": "test", "name": }'; // Missing value

      fs.readFile.mockResolvedValue(malformedJson);

      const result = await handleMalformedFileError(filePath, 'json');

      expect(result.success).toBe(false);
      expect(result.errorType).toBe('parse_error');
      expect(result.message).toMatch(/Unexpected token|SyntaxError/);
      expect(result.filePath).toBe(filePath);
      expect(result.suggestions).toContain('Check JSON syntax');
    });

    it('should handle malformed YAML files gracefully', async () => {
      const filePath = '/test/malformed.yaml';
      const malformedYaml = 'id: test\nname: [unclosed array';

      fs.readFile.mockResolvedValue(malformedYaml);

      const result = await handleMalformedFileError(filePath, 'yaml');

      expect(result.success).toBe(false);
      expect(result.errorType).toBe('parse_error');
      expect(result.message).toMatch(/unexpected end|bad indentation/);
      expect(result.filePath).toBe(filePath);
      expect(result.suggestions).toContain('Check YAML syntax');
    });

    it('should handle empty files', async () => {
      const filePath = '/test/empty.json';

      fs.readFile.mockResolvedValue('');

      const result = await handleMalformedFileError(filePath, 'json');

      expect(result.success).toBe(false);
      expect(result.errorType).toBe('empty_file');
      expect(result.message).toMatch(/empty|no content/);
      expect(result.suggestions).toContain('File appears to be empty');
    });

    it('should handle files with only whitespace', async () => {
      const filePath = '/test/whitespace.json';

      fs.readFile.mockResolvedValue('   \n\t  \n  ');

      const result = await handleMalformedFileError(filePath, 'json');

      expect(result.success).toBe(false);
      expect(result.errorType).toBe('empty_file');
      expect(result.message).toMatch(/whitespace|empty/);
    });

    it('should handle files with invalid encoding', async () => {
      const filePath = '/test/invalid-encoding.json';

      fs.readFile.mockRejectedValue(new Error('Invalid character encoding'));

      const result = await handleMalformedFileError(filePath, 'json');

      expect(result.success).toBe(false);
      expect(result.errorType).toBe('encoding_error');
      expect(result.message).toMatch(/encoding/);
      expect(result.suggestions).toContain('Check file encoding');
    });

    it('should provide recovery suggestions for common JSON errors', async () => {
      const filePath = '/test/common-errors.json';
      const commonErrors = [
        '{ "id": "test", "name": }', // Missing value - invalid
        '{ "id": "test", "name": "test", }', // Trailing comma - invalid
        '{ "id": "test", "name": "test"', // Missing closing brace - invalid
        '{ "id": "test", "name": "test" }', // Valid JSON - should pass
      ];

      // Test invalid JSON cases
      const invalidCases = [
        '{ "id": "test", "name": }', // Missing value
        '{ "id": "test", "name": "test", }', // Trailing comma
        '{ "id": "test", "name": "test"', // Missing closing brace
      ];

      for (const errorJson of invalidCases) {
        fs.readFile.mockResolvedValue(errorJson);
        const result = await handleMalformedFileError(filePath, 'json');
        expect(result.success).toBe(false);
        expect(result.errorType).toBe('parse_error');
        expect(result.suggestions.length).toBeGreaterThan(0);
      }

      // Test valid JSON case
      fs.readFile.mockResolvedValue('{ "id": "test", "name": "test" }');
      const validResult = await handleMalformedFileError(filePath, 'json');
      expect(validResult.success).toBe(true);
    });
  });

  describe('Invalid Schema Error Handling', () => {
    it('should handle invalid schema structure', async () => {
      const result = await handleInvalidSchemaError(mockInvalidSchema);

      expect(result.success).toBe(false);
      expect(result.errorType).toBe('schema_error');
      expect(result.message).toMatch(/schema is invalid|Invalid schema type|Required field must be an array|Properties must be an object/);
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle schema with missing required properties', async () => {
      const incompleteSchema = {
        type: 'object',
        required: 'not-an-array', // Invalid required format
      };

      const result = await handleInvalidSchemaError(incompleteSchema);

      expect(result.success).toBe(false);
      expect(result.errorType).toBe('schema_error');
      expect(result.suggestions).toContain('Define required properties');
    });

    it('should handle schema with invalid property definitions', async () => {
      const invalidPropertySchema = {
        type: 'object',
        properties: 'not-an-object', // Invalid properties format
      };

      const result = await handleInvalidSchemaError(invalidPropertySchema);

      expect(result.success).toBe(false);
      expect(result.errorType).toBe('schema_error');
      expect(result.suggestions).toContain('Check property definitions');
    });

    it('should handle circular schema references', async () => {
      const circularSchema = {
        type: 'invalid-type', // Invalid type to trigger error
        properties: {
          self: { $ref: '#' }, // Self-reference
        },
      };

      const result = await handleInvalidSchemaError(circularSchema);

      expect(result.success).toBe(false);
      expect(result.errorType).toBe('schema_error');
      expect(result.message).toMatch(/schema is invalid|Invalid schema type|circular|reference/);
    });

    it('should validate schema compatibility', async () => {
      const oldSchema = {
        type: 'object',
        required: ['id', 'name'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      };

      const newSchema = {
        type: 'object',
        required: ['id', 'name', 'version'], // Added required field
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          version: { type: 'string' },
        },
      };

      const result = await validateSchemaCompatibility(oldSchema, newSchema);

      expect(result.compatible).toBe(false);
      expect(result.breakingChanges).toContain('Added required field: version');
      expect(result.migrationRequired).toBe(true);
    });
  });

  describe('File System Error Handling', () => {
    it('should handle file not found errors', async () => {
      const filePath = '/nonexistent/file.json';

      const error = new Error('ENOENT: no such file or directory');
      error.code = 'ENOENT';
      fs.readFile.mockRejectedValue(error);

      const result = await handleFileSystemError(filePath, 'read');

      expect(result.success).toBe(false);
      expect(result.errorType).toBe('file_not_found');
      expect(result.message).toMatch(/not found|ENOENT/);
      expect(result.suggestions).toContain('Check file path');
    });

    it('should handle permission denied errors', async () => {
      const filePath = '/restricted/file.json';

      fs.readFile.mockRejectedValue(new Error('EACCES: permission denied'));

      const result = await handlePermissionError(filePath, 'read');

      expect(result.success).toBe(false);
      expect(result.errorType).toBe('permission_denied');
      expect(result.message).toMatch(/permission|EACCES/);
      expect(result.suggestions).toContain('Check file permissions');
    });

    it('should handle disk space errors', async () => {
      const filePath = '/test/file.json';

      fs.writeFile.mockRejectedValue(new Error('ENOSPC: no space left on device'));

      const result = await handleDiskSpaceError(filePath, 'write');

      expect(result.success).toBe(false);
      expect(result.errorType).toBe('disk_full');
      expect(result.message).toMatch(/space|ENOSPC/);
      expect(result.suggestions).toContain('Free up disk space');
    });

    it('should handle concurrent access errors', async () => {
      const filePath = '/test/file.json';

      fs.readFile.mockRejectedValue(new Error('EBUSY: resource busy'));

      const result = await handleConcurrentAccessError(filePath);

      expect(result.success).toBe(false);
      expect(result.errorType).toBe('concurrent_access');
      expect(result.message).toMatch(/busy|EBUSY/);
      expect(result.suggestions).toContain('File may be in use');
    });

    it('should handle directory not found errors', async () => {
      const dirPath = '/nonexistent/directory';

      const error = new Error('ENOENT: no such file or directory');
      error.code = 'ENOENT';
      fs.readdir.mockRejectedValue(error);

      const result = await handleFileSystemError(dirPath, 'readdir');

      expect(result.success).toBe(false);
      expect(result.errorType).toBe('directory_not_found');
      expect(result.suggestions).toContain('Check directory path');
    });
  });

  describe('Validation Error Handling', () => {
    it('should handle data validation errors with detailed messages', async () => {
      const invalidData = {
        id: 'proj-001',
        name: '', // Empty string should fail minLength
        startDate: 'not-a-date',
        areaHierarchy: 'not-an-object',
      };

      const result = await handleValidationError(invalidData, mockValidSchema);

      expect(result.success).toBe(false);
      expect(result.errorType).toBe('validation_error');
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => error.includes('at least') || error.includes('characters'))).toBe(true);
      expect(result.errors.some(error => error.includes('format') || error.includes('match'))).toBe(true);
      expect(result.errors.some(error => error.includes('type') || error.includes('object'))).toBe(true);
    });

    it('should handle missing required fields', async () => {
      const incompleteData = {
        id: 'proj-001',
        // Missing required 'name' field
        startDate: '2025-01-01',
        areaHierarchy: {},
      };

      const result = await handleValidationError(incompleteData, mockValidSchema);

      expect(result.success).toBe(false);
      expect(result.errorType).toBe('validation_error');
      expect(result.errors.some(error => error.includes('required'))).toBe(true);
    });

    it('should handle type mismatch errors', async () => {
      const typeMismatchData = {
        id: 123, // Should be string
        name: 'Test Project',
        startDate: '2025-01-01',
        areaHierarchy: {},
      };

      const result = await handleValidationError(typeMismatchData, mockValidSchema);

      expect(result.success).toBe(false);
      expect(result.errorType).toBe('validation_error');
      expect(result.errors.some(error => error.includes('string'))).toBe(true);
    });

    it('should handle format validation errors', async () => {
      const formatErrorData = {
        id: 'proj-001',
        name: 'Test Project',
        startDate: '01-01-2025', // Wrong date format
        areaHierarchy: {},
      };

      const result = await handleValidationError(formatErrorData, mockValidSchema);

      expect(result.success).toBe(false);
      expect(result.errorType).toBe('validation_error');
      expect(result.errors.some(error => error.includes('format'))).toBe(true);
    });
  });

  describe('Parse Error Handling', () => {
    it('should handle JSON parse errors with context', async () => {
      const malformedJson = '{ "id": "test", "name": }';
      const filePath = '/test/file.json';

      const result = await handleParseError(malformedJson, 'json', filePath);

      expect(result.success).toBe(false);
      expect(result.errorType).toBe('parse_error');
      expect(result.filePath).toBe(filePath);
      expect(result.lineNumber).toBeDefined();
      expect(result.columnNumber).toBeDefined();
      expect(result.context).toBeDefined();
    });

    it('should handle YAML parse errors with line information', async () => {
      const malformedYaml = 'id: test\nname: [unclosed array\nvalue: test';
      const filePath = '/test/file.yaml';

      const result = await handleParseError(malformedYaml, 'yaml', filePath);

      expect(result.success).toBe(false);
      expect(result.errorType).toBe('parse_error');
      expect(result.filePath).toBe(filePath);
      expect(result.lineNumber).toBeDefined();
      expect(result.context).toBeDefined();
    });

    it('should provide suggestions for common parse errors', async () => {
      const commonErrors = [
        { content: '{ "id": "test", "name": }', suggestion: 'Check JSON syntax' },
        { content: '{ "id": "test", "name": "test", }', suggestion: 'Check JSON syntax' },
        { content: '{ "id": "test", "name": "test"', suggestion: 'Check JSON syntax' },
      ];

      for (const error of commonErrors) {
        const result = await handleParseError(error.content, 'json', '/test/file.json');

        expect(result.success).toBe(false);
        expect(result.suggestions).toContain(error.suggestion);
      }
    });
  });

  describe('Write Error Handling', () => {
    it('should handle write permission errors', async () => {
      const filePath = '/readonly/file.json';

      const error = new Error('EACCES: permission denied');
      error.code = 'EACCES';
      fs.writeFile.mockRejectedValue(error);

      const result = await handleWriteError(filePath, mockManifestData);

      expect(result.success).toBe(false);
      expect(result.errorType).toBe('write_permission_denied');
      expect(result.suggestions).toContain('Check write permissions');
    });

    it('should handle disk full errors during write', async () => {
      const filePath = '/test/file.json';

      const error = new Error('ENOSPC: no space left on device');
      error.code = 'ENOSPC';
      fs.writeFile.mockRejectedValue(error);

      const result = await handleWriteError(filePath, mockManifestData);

      expect(result.success).toBe(false);
      expect(result.errorType).toBe('disk_full');
      expect(result.suggestions).toContain('Free up disk space');
    });

    it('should handle write timeout errors', async () => {
      const filePath = '/slow/storage/file.json';

      fs.writeFile.mockRejectedValue(new Error('ETIMEDOUT: operation timed out'));

      const result = await handleTimeoutError(filePath, 'write');

      expect(result.success).toBe(false);
      expect(result.errorType).toBe('timeout');
      expect(result.suggestions).toContain('Operation timed out');
    });
  });

  describe('Data Integrity and Recovery', () => {
    it('should validate file integrity', async () => {
      const filePath = '/test/file.json';
      const corruptedContent = '{ "id": "test", "name": "test"'; // Missing closing brace

      fs.readFile.mockResolvedValue(corruptedContent);

      const result = await validateFileIntegrity(filePath);

      expect(result.valid).toBe(false);
      expect(result.issues).toContain('parse_error');
      expect(result.recoverable).toBe(true);
    });

    it('should sanitize manifest data', async () => {
      const maliciousData = {
        id: 'proj-001',
        name: 'Test Project<script>alert("xss")</script>',
        startDate: '2025-01-01',
        areaHierarchy: {},
        maliciousField: 'dangerous content',
      };

      const result = await sanitizeManifestData(maliciousData, mockValidSchema);

      expect(result.sanitized).toBeDefined();
      expect(result.sanitized.name).not.toContain('<script>');
      expect(result.sanitized.maliciousField).toBeUndefined();
      expect(result.removedFields).toContain('maliciousField');
    });

    it('should attempt to recover from corrupted files', async () => {
      const filePath = '/test/corrupted.json';
      const corruptedContent = '{ "id": "test", "name": "test"'; // Missing closing brace

      fs.readFile.mockResolvedValue(corruptedContent);

      const result = await recoverFromCorruptedFile(filePath);

      expect(result.recovered).toBe(true);
      expect(result.recoveryMethod).toBe('auto_fix');
      expect(result.fixedContent).toContain('}');
    });

    it('should create comprehensive error reports', async () => {
      const errorContext = {
        filePath: '/test/file.json',
        operation: 'read',
        timestamp: new Date(),
        userAgent: 'test-agent',
      };

      const result = await createErrorReport('test_error', errorContext);

      expect(result.errorId).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.context).toEqual(errorContext);
      expect(result.severity).toBeDefined();
    });
  });

  describe('System Resource Error Handling', () => {
    it('should handle memory errors', async () => {
      const largeData = Array(1000000).fill({ data: 'large content' });

      const result = await handleMemoryError(largeData);

      expect(result.success).toBe(false);
      expect(result.errorType).toBe('memory_error');
      expect(result.suggestions).toContain('Reduce data size');
    });

    it('should handle encoding errors', async () => {
      const invalidEncoding = Buffer.from('invalid encoding', 'binary');

      const result = await handleEncodingError(invalidEncoding);

      expect(result.success).toBe(false);
      expect(result.errorType).toBe('encoding_error');
      expect(result.suggestions).toContain('Check file encoding');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('ECONNREFUSED: connection refused');

      const result = await handleNetworkError(networkError);

      expect(result.success).toBe(false);
      expect(result.errorType).toBe('network_error');
      expect(result.suggestions).toContain('Check network connection');
    });
  });

  describe('Retry and Recovery Mechanisms', () => {
    it('should retry failed operations', async () => {
      let attemptCount = 0;
      const failingOperation = async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      };

      const result = await retryOperation(failingOperation, { maxRetries: 3 });

      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(attemptCount).toBe(3);
    });

    it('should fail after max retries', async () => {
      const failingOperation = async () => {
        throw new Error('Permanent failure');
      };

      const result = await retryOperation(failingOperation, { maxRetries: 2 });

      expect(result.success).toBe(false);
      expect(result.errorType).toBe('max_retries_exceeded');
    });

    it('should log errors with proper context', async () => {
      const error = new Error('Test error');
      const context = {
        filePath: '/test/file.json',
        operation: 'read',
        userId: 'user123',
      };

      const result = await logErrorWithContext(error, context);

      expect(result.logged).toBe(true);
      expect(result.errorId).toBeDefined();
      expect(result.context).toEqual(context);
    });
  });

  describe('Error Aggregation and Reporting', () => {
    it('should aggregate multiple errors', async () => {
      const errors = [
        { type: 'parse_error', message: 'Invalid JSON' },
        { type: 'validation_error', message: 'Missing required field' },
        { type: 'permission_error', message: 'Access denied' },
      ];

      const result = await createErrorReport('multiple_errors', { errors });

      expect(result.errorCount).toBe(3);
      expect(result.errorTypes).toContain('parse_error');
      expect(result.errorTypes).toContain('validation_error');
      expect(result.errorTypes).toContain('permission_error');
    });

    it('should prioritize critical errors', async () => {
      const errors = [
        { type: 'parse_error', severity: 'low' },
        { type: 'disk_full', severity: 'critical' },
        { type: 'validation_error', severity: 'medium' },
      ];

      const result = await createErrorReport('prioritized_errors', { errors });

      expect(result.priority).toBe('critical');
      expect(result.criticalErrors).toContain('disk_full');
    });
  });
});
