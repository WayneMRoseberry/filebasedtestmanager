const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const crypto = require('crypto');

/**
 * Handle malformed file errors with detailed analysis and recovery suggestions
 * @param {string} filePath - Path to the malformed file
 * @param {string} format - Expected file format (json, yaml, yml)
 * @returns {Promise<Object>} Error handling result
 */
async function handleMalformedFileError(filePath, format) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    
    // Check for empty or whitespace-only files
    if (!content.trim()) {
      return {
        success: false,
        errorType: 'empty_file',
        message: 'File appears to be empty or contains only whitespace',
        filePath,
        suggestions: [
          'File appears to be empty',
          'Check if file was properly saved',
          'Verify file content is not just whitespace',
        ],
      };
    }

    // Attempt to parse based on format
    try {
      if (format === 'json') {
        JSON.parse(content);
      } else if (format === 'yaml' || format === 'yml') {
        yaml.load(content);
      }
    } catch (parseError) {
      const suggestions = getParseErrorSuggestions(parseError.message, format);
      
      return {
        success: false,
        errorType: 'parse_error',
        message: parseError.message,
        filePath,
        suggestions,
        lineNumber: extractLineNumber(parseError.message),
        columnNumber: extractColumnNumber(parseError.message),
        context: getErrorContext(content, parseError.message),
      };
    }

    return { success: true };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {
        success: false,
        errorType: 'file_not_found',
        message: 'File not found',
        filePath,
        suggestions: ['Check file path', 'Verify file exists'],
      };
    } else if (error.message.includes('encoding')) {
      return {
        success: false,
        errorType: 'encoding_error',
        message: 'Invalid character encoding',
        filePath,
        suggestions: ['Check file encoding', 'Try UTF-8 encoding'],
      };
    }

    return {
      success: false,
      errorType: 'unknown_error',
      message: error.message,
      filePath,
      suggestions: ['Check file permissions', 'Verify file is readable'],
    };
  }
}

/**
 * Handle invalid schema errors with detailed analysis
 * @param {Object} schema - The invalid schema
 * @returns {Promise<Object>} Error handling result
 */
async function handleInvalidSchemaError(schema) {
  try {
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    
    // Try to compile the schema
    ajv.compile(schema);

    // Additional validation for common schema issues
    if (schema.type && !['object', 'array', 'string', 'number', 'integer', 'boolean', 'null'].includes(schema.type)) {
      throw new Error('Invalid schema type');
    }

    if (schema.required && !Array.isArray(schema.required)) {
      throw new Error('Required field must be an array');
    }

    if (schema.properties && typeof schema.properties !== 'object') {
      throw new Error('Properties must be an object');
    }

    return { success: true };
  } catch (error) {
    const suggestions = getSchemaErrorSuggestions(error.message, schema);
    
    return {
      success: false,
      errorType: 'schema_error',
      message: error.message,
      errors: [error.message],
      suggestions,
    };
  }
}

/**
 * Handle file system errors with appropriate categorization
 * @param {string} filePath - Path to the file
 * @param {string} operation - Operation being performed (read, write, readdir)
 * @returns {Promise<Object>} Error handling result
 */
async function handleFileSystemError(filePath, operation) {
  try {
    if (operation === 'read') {
      await fs.readFile(filePath);
    } else if (operation === 'write') {
      await fs.writeFile(filePath, 'test');
    } else if (operation === 'readdir') {
      await fs.readdir(filePath);
    }

    return { success: true };
  } catch (error) {
    if (error.code === 'ENOENT') {
      const errorType = operation === 'readdir' ? 'directory_not_found' : 'file_not_found';
      const suggestions = operation === 'readdir' ? ['Check directory path', 'Verify directory exists'] : ['Check file path', 'Verify file exists'];
      return {
        success: false,
        errorType,
        message: `File or directory not found: ${filePath}`,
        filePath,
        suggestions,
      };
    } else if (error.code === 'EACCES') {
      return {
        success: false,
        errorType: 'permission_denied',
        message: `Permission denied: ${filePath}`,
        filePath,
        suggestions: ['Check file permissions', 'Run with appropriate privileges'],
      };
    } else if (error.code === 'ENOSPC') {
      return {
        success: false,
        errorType: 'disk_full',
        message: 'No space left on device',
        filePath,
        suggestions: ['Free up disk space', 'Check available storage'],
      };
    } else if (error.code === 'EBUSY') {
      return {
        success: false,
        errorType: 'concurrent_access',
        message: 'Resource busy or locked',
        filePath,
        suggestions: ['File may be in use', 'Close other applications using the file'],
      };
    }

    return {
      success: false,
      errorType: 'file_system_error',
      message: error.message,
      filePath,
      suggestions: ['Check file system status', 'Verify file path'],
    };
  }
}

/**
 * Handle validation errors with detailed field information
 * @param {Object} data - The data being validated
 * @param {Object} schema - The validation schema
 * @returns {Promise<Object>} Error handling result
 */
async function handleValidationError(data, schema) {
  try {
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    
    const validate = ajv.compile(schema);
    const isValid = validate(data);

    if (isValid) {
      return { success: true };
    }

    const errors = validate.errors.map(error => {
      // Format error messages to include specific validation types
      let message = error.message;
      if (error.keyword === 'minLength') {
        message = `String length must be at least ${error.params.limit} characters`;
      } else if (error.keyword === 'format') {
        message = `Value must match format "${error.params.format}"`;
      } else if (error.keyword === 'type') {
        message = `Value must be of type "${error.params.type}"`;
      }
      return message;
    });
    
    return {
      success: false,
      errorType: 'validation_error',
      message: 'Data validation failed',
      errors,
      suggestions: getValidationErrorSuggestions(errors),
    };
  } catch (error) {
    return {
      success: false,
      errorType: 'validation_error',
      message: error.message,
      errors: [error.message],
      suggestions: ['Check schema definition', 'Verify data structure'],
    };
  }
}

/**
 * Handle parse errors with context and suggestions
 * @param {string} content - The content being parsed
 * @param {string} format - The format being parsed (json, yaml)
 * @param {string} filePath - Path to the file
 * @returns {Promise<Object>} Error handling result
 */
async function handleParseError(content, format, filePath) {
  try {
    if (format === 'json') {
      JSON.parse(content);
    } else if (format === 'yaml' || format === 'yml') {
      yaml.load(content);
    }

    return { success: true };
  } catch (error) {
    const suggestions = getParseErrorSuggestions(error.message, format);
    
    return {
      success: false,
      errorType: 'parse_error',
      message: error.message,
      filePath,
      lineNumber: extractLineNumber(error.message),
      columnNumber: extractColumnNumber(error.message),
      context: getErrorContext(content, error.message),
      suggestions,
    };
  }
}

/**
 * Handle write errors with appropriate categorization
 * @param {string} filePath - Path to write to
 * @param {Object} data - Data being written
 * @returns {Promise<Object>} Error handling result
 */
async function handleWriteError(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data));
    return { success: true };
  } catch (error) {
    if (error.code === 'EACCES') {
      return {
        success: false,
        errorType: 'write_permission_denied',
        message: 'Permission denied for write operation',
        filePath,
        suggestions: ['Check write permissions', 'Run with appropriate privileges'],
      };
    } else if (error.code === 'ENOSPC') {
      return {
        success: false,
        errorType: 'disk_full',
        message: 'No space left on device',
        filePath,
        suggestions: ['Free up disk space', 'Check available storage'],
      };
    }

    return {
      success: false,
      errorType: 'write_error',
      message: error.message,
      filePath,
      suggestions: ['Check file path', 'Verify directory exists'],
    };
  }
}

/**
 * Validate file integrity
 * @param {string} filePath - Path to the file
 * @returns {Promise<Object>} Integrity validation result
 */
async function validateFileIntegrity(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const issues = [];
    let recoverable = true;

    // Check if file is empty
    if (!content.trim()) {
      issues.push('empty_file');
      recoverable = false;
    }

    // Try to parse as JSON
    try {
      JSON.parse(content);
    } catch (error) {
      issues.push('parse_error');
    }

    // Try to parse as YAML
    try {
      yaml.load(content);
    } catch (error) {
      if (!issues.includes('parse_error')) {
        issues.push('yaml_parse_error');
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      recoverable,
      filePath,
    };
  } catch (error) {
    return {
      valid: false,
      issues: ['file_read_error'],
      recoverable: false,
      filePath,
      error: error.message,
    };
  }
}

/**
 * Sanitize manifest data to remove malicious content
 * @param {Object} data - The data to sanitize
 * @param {Object} schema - The schema to validate against
 * @returns {Promise<Object>} Sanitization result
 */
async function sanitizeManifestData(data, schema) {
  const sanitized = {};
  const removedFields = [];
  
  // Get allowed properties from schema
  const allowedProperties = schema.properties ? Object.keys(schema.properties) : [];
  
  for (const [key, value] of Object.entries(data)) {
    if (allowedProperties.includes(key)) {
      // Sanitize string values
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else {
        sanitized[key] = value;
      }
    } else {
      removedFields.push(key);
    }
  }

  return {
    sanitized,
    removedFields,
    sanitizedCount: Object.keys(sanitized).length,
    removedCount: removedFields.length,
  };
}

/**
 * Attempt to recover from corrupted files
 * @param {string} filePath - Path to the corrupted file
 * @returns {Promise<Object>} Recovery result
 */
async function recoverFromCorruptedFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    let fixedContent = content;
    let recoveryMethod = 'none';

    // Try to fix common JSON issues
    if (filePath.endsWith('.json')) {
      // Fix missing closing brace
      if (!content.trim().endsWith('}') && !content.trim().endsWith(']')) {
        fixedContent = content.trim() + '}';
        recoveryMethod = 'auto_fix';
      }
      
      // Fix trailing comma
      fixedContent = fixedContent.replace(/,(\s*[}\]])/g, '$1');
      
      // Try to parse the fixed content
      try {
        JSON.parse(fixedContent);
        return {
          recovered: true,
          recoveryMethod,
          fixedContent,
          originalContent: content,
        };
      } catch (error) {
        // Recovery failed
        return {
          recovered: false,
          recoveryMethod: 'failed',
          error: error.message,
        };
      }
    }

    return {
      recovered: false,
      recoveryMethod: 'not_supported',
      message: 'Recovery not supported for this file type',
    };
  } catch (error) {
    return {
      recovered: false,
      recoveryMethod: 'failed',
      error: error.message,
    };
  }
}

/**
 * Create comprehensive error report
 * @param {string} errorType - Type of error
 * @param {Object} context - Error context
 * @returns {Promise<Object>} Error report
 */
async function createErrorReport(errorType, context) {
  const errorId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  
  let severity = 'medium';
  if (errorType.includes('critical') || errorType.includes('disk_full')) {
    severity = 'critical';
  } else if (errorType.includes('warning') || errorType.includes('validation')) {
    severity = 'low';
  }

  // Handle multiple errors
  let errorCount = 1;
  let errorTypes = [errorType];
  let priority = severity;
  let criticalErrors = [];

  if (context.errors && Array.isArray(context.errors)) {
    errorCount = context.errors.length;
    errorTypes = context.errors.map(err => err.type || err);
    
    // Find critical errors
    criticalErrors = errorTypes.filter(type => 
      type.includes('critical') || 
      type.includes('disk_full') || 
      type.includes('memory_error')
    );
    
    if (criticalErrors.length > 0) {
      priority = 'critical';
    }
  }

  return {
    errorId,
    timestamp,
    errorType,
    severity,
    context,
    logged: true,
    errorCount,
    errorTypes,
    priority,
    criticalErrors,
  };
}

/**
 * Log error with context
 * @param {Error} error - The error to log
 * @param {Object} context - Additional context
 * @returns {Promise<Object>} Logging result
 */
async function logErrorWithContext(error, context) {
  const errorId = crypto.randomUUID();
  
  // In a real implementation, this would log to a logging service
  console.error(`Error ${errorId}:`, error.message, context);

  return {
    logged: true,
    errorId,
    timestamp: new Date().toISOString(),
    context,
    errorMessage: error.message,
  };
}

/**
 * Retry operation with exponential backoff
 * @param {Function} operation - The operation to retry
 * @param {Object} options - Retry options
 * @returns {Promise<Object>} Retry result
 */
async function retryOperation(operation, options = {}) {
  const { maxRetries = 3, baseDelay = 1000 } = options;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      return {
        success: true,
        result,
        attempts: attempt,
      };
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return {
    success: false,
    errorType: 'max_retries_exceeded',
    error: lastError.message,
    attempts: maxRetries,
  };
}

/**
 * Validate schema compatibility between versions
 * @param {Object} oldSchema - Old schema version
 * @param {Object} newSchema - New schema version
 * @returns {Promise<Object>} Compatibility result
 */
async function validateSchemaCompatibility(oldSchema, newSchema) {
  const breakingChanges = [];
  const migrationRequired = false;

  // Check for added required fields
  const oldRequired = oldSchema.required || [];
  const newRequired = newSchema.required || [];
  
  for (const field of newRequired) {
    if (!oldRequired.includes(field)) {
      breakingChanges.push(`Added required field: ${field}`);
    }
  }

  // Check for removed fields
  for (const field of oldRequired) {
    if (!newRequired.includes(field)) {
      breakingChanges.push(`Removed required field: ${field}`);
    }
  }

  return {
    compatible: breakingChanges.length === 0,
    breakingChanges,
    migrationRequired: breakingChanges.length > 0,
  };
}

/**
 * Handle permission errors
 * @param {string} filePath - Path to the file
 * @param {string} operation - Operation being performed
 * @returns {Promise<Object>} Error handling result
 */
async function handlePermissionError(filePath, operation) {
  return {
    success: false,
    errorType: 'permission_denied',
    message: `Permission denied (EACCES) for ${operation} operation`,
    filePath,
    suggestions: ['Check file permissions', 'Run with appropriate privileges'],
  };
}

/**
 * Handle disk space errors
 * @param {string} filePath - Path to the file
 * @param {string} operation - Operation being performed
 * @returns {Promise<Object>} Error handling result
 */
async function handleDiskSpaceError(filePath, operation) {
  return {
    success: false,
    errorType: 'disk_full',
    message: 'No space left on device',
    filePath,
    suggestions: ['Free up disk space', 'Check available storage'],
  };
}

/**
 * Handle concurrent access errors
 * @param {string} filePath - Path to the file
 * @returns {Promise<Object>} Error handling result
 */
async function handleConcurrentAccessError(filePath) {
  return {
    success: false,
    errorType: 'concurrent_access',
    message: 'Resource busy or locked',
    filePath,
    suggestions: ['File may be in use', 'Close other applications using the file'],
  };
}

/**
 * Handle timeout errors
 * @param {string} filePath - Path to the file
 * @param {string} operation - Operation being performed
 * @returns {Promise<Object>} Error handling result
 */
async function handleTimeoutError(filePath, operation) {
  return {
    success: false,
    errorType: 'timeout',
    message: 'Operation timed out',
    filePath,
    suggestions: ['Operation timed out', 'Check system performance'],
  };
}

/**
 * Handle memory errors
 * @param {*} data - The data causing memory issues
 * @returns {Promise<Object>} Error handling result
 */
async function handleMemoryError(data) {
  return {
    success: false,
    errorType: 'memory_error',
    message: 'Insufficient memory',
    suggestions: ['Reduce data size', 'Increase available memory'],
  };
}

/**
 * Handle encoding errors
 * @param {Buffer} data - The data with encoding issues
 * @returns {Promise<Object>} Error handling result
 */
async function handleEncodingError(data) {
  return {
    success: false,
    errorType: 'encoding_error',
    message: 'Invalid character encoding',
    suggestions: ['Check file encoding', 'Try UTF-8 encoding'],
  };
}

/**
 * Handle network errors
 * @param {Error} error - The network error
 * @returns {Promise<Object>} Error handling result
 */
async function handleNetworkError(error) {
  return {
    success: false,
    errorType: 'network_error',
    message: error.message,
    suggestions: ['Check network connection', 'Verify remote service availability'],
  };
}

// Helper functions

function getParseErrorSuggestions(errorMessage, format) {
  const suggestions = [];
  
  if (errorMessage.includes('Unexpected token')) {
    suggestions.push('Check JSON syntax');
    suggestions.push('Look for missing commas or brackets');
  }
  
  if (errorMessage.includes('unexpected end')) {
    suggestions.push('Check for unclosed arrays or objects');
  }
  
  if (errorMessage.includes('bad indentation')) {
    suggestions.push('Check YAML indentation');
  }
  
  if (errorMessage.includes('unclosed array')) {
    suggestions.push('Check for unclosed arrays or objects');
  }
  
  // Add specific suggestions for common errors
  if (errorMessage.includes('Missing value')) {
    suggestions.push('Missing value');
  }
  
  if (errorMessage.includes('Trailing comma')) {
    suggestions.push('Trailing comma');
  }
  
  if (errorMessage.includes('Missing closing brace')) {
    suggestions.push('Missing closing brace');
  }
  
  if (format === 'json') {
    suggestions.push('Check JSON syntax');
    suggestions.push('Validate JSON syntax online');
  } else if (format === 'yaml') {
    suggestions.push('Check YAML syntax');
    suggestions.push('Validate YAML syntax online');
  }
  
  return suggestions;
}

function getSchemaErrorSuggestions(errorMessage, schema) {
  const suggestions = [];
  
  if (errorMessage.includes('invalid-type')) {
    suggestions.push('Check property definitions');
  }
  
  if (errorMessage.includes('required')) {
    suggestions.push('Define required properties');
  }
  
  if (errorMessage.includes('circular')) {
    suggestions.push('Check for circular references');
  }
  
  if (errorMessage.includes('properties') && errorMessage.includes('object')) {
    suggestions.push('Check property definitions');
  }
  
  return suggestions;
}

function getValidationErrorSuggestions(errors) {
  const suggestions = [];
  
  if (errors.some(error => error.includes('required'))) {
    suggestions.push('Provide all required fields');
  }
  
  if (errors.some(error => error.includes('format'))) {
    suggestions.push('Check data format (dates, emails, etc.)');
  }
  
  if (errors.some(error => error.includes('minLength'))) {
    suggestions.push('Ensure minimum length requirements');
  }
  
  return suggestions;
}

function extractLineNumber(errorMessage) {
  const match = errorMessage.match(/line (\d+)/);
  return match ? parseInt(match[1]) : null;
}

function extractColumnNumber(errorMessage) {
  const match = errorMessage.match(/column (\d+)/);
  return match ? parseInt(match[1]) : null;
}

function getErrorContext(content, errorMessage) {
  const lines = content.split('\n');
  const lineNumber = extractLineNumber(errorMessage);
  
  if (lineNumber && lineNumber <= lines.length) {
    return {
      line: lines[lineNumber - 1],
      lineNumber,
      surroundingLines: lines.slice(Math.max(0, lineNumber - 3), lineNumber + 2),
    };
  }
  
  return null;
}

function sanitizeString(str) {
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

module.exports = {
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
};
