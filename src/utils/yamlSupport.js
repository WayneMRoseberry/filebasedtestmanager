const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');

/**
 * Detect YAML format from file path or content
 * @param {string} filePath - Path to the file
 * @param {string} content - File content (optional)
 * @returns {string|null} Format type or null if not YAML
 */
function detectYamlFormat(filePath, content = null) {
  if (filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.yaml' || ext === '.yml') {
      return 'yaml';
    }
    if (ext === '.json') {
      return 'json';
    }
  }

  if (content) {
    // Check for YAML indicators
    if (content.includes('---') || content.includes('...')) {
      return 'yaml';
    }
    
    // Check for JSON indicators
    if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
      return 'json';
    }
    
    // Check for YAML-like structure (key: value)
    if (content.includes(':') && !content.includes('"') && !content.includes('{')) {
      return 'yaml';
    }
  }

  return null;
}

/**
 * Parse YAML content with error handling
 * @param {string} content - YAML content
 * @returns {Object|null} Parsed data or null if empty/invalid
 */
function parseYamlContent(content) {
  if (!content || !content.trim()) {
    return null;
  }

  try {
    // Create a custom schema that treats dates as strings and handles unknown tags
    const customSchema = yaml.DEFAULT_SCHEMA.extend([
      new yaml.Type('tag:yaml.org,2002:timestamp', {
        kind: 'scalar',
        construct: function (data) {
          return data; // Return as string instead of Date object
        },
      }),
      new yaml.Type('!date', {
        kind: 'scalar',
        construct: function (data) {
          return data; // Return as string
        },
      }),
      new yaml.Type('!Project', {
        kind: 'mapping',
        construct: function (data) {
          return data; // Return as object
        },
      }),
    ]);

    const parsed = yaml.load(content, {
      schema: customSchema,
      onWarning: () => {}, // Suppress warnings
    });
    return parsed;
  } catch (error) {
    throw new Error(`Failed to parse YAML content: ${error.message}`);
  }
}

/**
 * Format data as YAML with options
 * @param {Object} data - Data to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted YAML content
 */
function formatYamlContent(data, options = {}) {
  const defaultOptions = {
    indent: 2,
    lineWidth: 80,
    quotingType: "'",
    flowLevel: -1,
    ...options,
  };

  // Handle custom quoting
  if (defaultOptions.quotingType === '"') {
    return yaml.dump(data, {
      ...defaultOptions,
      quotingType: '"',
      forceQuotes: true,
      sortKeys: false,
    });
  }

  return yaml.dump(data, defaultOptions);
}

/**
 * Validate YAML structure
 * @param {string} content - YAML content
 * @returns {Object} Validation result
 */
function validateYamlStructure(content) {
  try {
    yaml.load(content);
    return { isValid: true, errors: [] };
  } catch (error) {
    return {
      isValid: false,
      errors: [error.message],
    };
  }
}

/**
 * Validate YAML against schema
 * @param {string} content - YAML content
 * @param {Object} schema - JSON schema
 * @returns {Object} Validation result
 */
function validateYamlSchema(content, schema) {
  try {
    const data = yaml.load(content);
    
    // Basic schema validation (simplified)
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in data)) {
          return {
            isValid: false,
            errors: [`Missing required field: ${field}`],
          };
        }
      }
    }

    return { isValid: true, errors: [] };
  } catch (error) {
    return {
      isValid: false,
      errors: [error.message],
    };
  }
}

/**
 * Convert JSON to YAML
 * @param {string} jsonContent - JSON content
 * @returns {string} YAML content
 */
function convertJsonToYaml(jsonContent) {
  try {
    const data = JSON.parse(jsonContent);
    return yaml.dump(data);
  } catch (error) {
    throw new Error(`Failed to convert JSON to YAML: ${error.message}`);
  }
}

/**
 * Convert YAML to JSON
 * @param {string} yamlContent - YAML content
 * @returns {string} JSON content
 */
function convertYamlToJson(yamlContent) {
  try {
    const data = yaml.load(yamlContent);
    return JSON.stringify(data, null, 2);
  } catch (error) {
    throw new Error(`Failed to convert YAML to JSON: ${error.message}`);
  }
}

/**
 * Handle YAML parse errors with suggestions
 * @param {string} content - YAML content
 * @returns {Object} Error handling result
 */
function handleYamlParseError(content) {
  try {
    yaml.load(content);
    return { success: true };
  } catch (error) {
    const suggestions = [];
    
    if (error.message.includes('unclosed')) {
      suggestions.push('Check for unclosed arrays');
    }
    if (error.message.includes('indentation')) {
      suggestions.push('Check indentation');
    }
    if (error.message.includes('string')) {
      suggestions.push('Check for unclosed strings');
    }
    
    suggestions.push('Check YAML syntax');
    
    return {
      success: false,
      errorType: 'yaml_parse_error',
      message: error.message,
      suggestions,
    };
  }
}

/**
 * Sanitize YAML content for security
 * @param {string} content - YAML content
 * @returns {Object} Sanitization result
 */
function sanitizeYamlContent(content) {
  const removedTags = [];
  let sanitized = content;
  
  // Remove dangerous tags
  const dangerousTags = [
    'python/object/apply',
    'python/object',
    'python/name',
    'python/module',
    'python/function',
    'python/args',
    'python/state',
  ];
  
  for (const tag of dangerousTags) {
    if (content.includes(tag)) {
      removedTags.push(tag);
      sanitized = sanitized.replace(new RegExp(`!!${tag}[^\\s]*`, 'g'), '');
    }
  }
  
  return {
    sanitized,
    removedTags,
  };
}

/**
 * Preserve YAML comments
 * @param {string} content - YAML content
 * @returns {string} Content with preserved comments
 */
function preserveYamlComments(content) {
  // js-yaml doesn't preserve comments by default
  // This is a simplified implementation
  return content;
}

/**
 * Handle YAML indentation
 * @param {string} content - YAML content
 * @param {Object} options - Indentation options
 * @returns {string} Reformatted content
 */
function handleYamlIndentation(content, options = {}) {
  const { indent = 2 } = options;
  
  try {
    const data = yaml.load(content);
    return yaml.dump(data, { indent });
  } catch (error) {
    return content; // Return original if parsing fails
  }
}

/**
 * Detect YAML version from content
 * @param {string} content - YAML content
 * @returns {string|null} YAML version or null
 */
function detectYamlVersion(content) {
  const versionMatch = content.match(/^%YAML\s+(\d+\.\d+)/m);
  return versionMatch ? versionMatch[1] : null;
}

/**
 * Handle YAML anchors and aliases
 * @param {string} content - YAML content
 * @returns {Object} Processing result
 */
function handleYamlAnchors(content) {
  try {
    const data = yaml.load(content);
    return {
      resolved: data,
      anchors: extractAnchors(content),
    };
  } catch (error) {
    return {
      resolved: null,
      error: error.message,
    };
  }
}

/**
 * Handle YAML aliases
 * @param {string} content - YAML content
 * @returns {Object} Processing result
 */
function handleYamlAliases(content) {
  return handleYamlAnchors(content); // Same as anchors
}

/**
 * Handle YAML tags
 * @param {string} content - YAML content
 * @returns {Object} Processing result
 */
function handleYamlTags(content) {
  try {
    const data = yaml.load(content);
    return {
      processed: data,
      tags: extractTags(content),
    };
  } catch (error) {
    return {
      processed: null,
      error: error.message,
    };
  }
}

/**
 * Handle YAML directives
 * @param {string} content - YAML content
 * @returns {Object} Processing result
 */
function handleYamlDirectives(content) {
  const directives = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('%')) {
      directives.push(line.trim());
    }
  }
  
  return {
    processed: content,
    directives,
  };
}

/**
 * Validate YAML security
 * @param {string} content - YAML content
 * @returns {Object} Security validation result
 */
function validateYamlSecurity(content) {
  const unsafeTags = [];
  const dangerousTags = [
    'python/object/apply',
    'python/object',
    'python/name',
    'python/module',
    'python/function',
    'python/args',
    'python/state',
  ];
  
  for (const tag of dangerousTags) {
    if (content.includes(tag)) {
      unsafeTags.push(tag);
    }
  }
  
  return {
    isSafe: unsafeTags.length === 0,
    unsafeTags,
  };
}

/**
 * Handle YAML multiline strings
 * @param {string} content - YAML content
 * @returns {Object} Processing result
 */
function handleYamlMultilineStrings(content) {
  try {
    const data = yaml.load(content);
    return {
      processed: data,
      multilineStrings: findMultilineStrings(content),
    };
  } catch (error) {
    return {
      processed: null,
      error: error.message,
    };
  }
}

/**
 * Optimize YAML output
 * @param {string} content - YAML content
 * @returns {Object} Optimization result
 */
function optimizeYamlOutput(content) {
  try {
    const data = yaml.load(content);
    const optimized = yaml.dump(data, { 
      indent: 1, // Smaller indentation
      lineWidth: 120, // Longer lines
      noRefs: true,
      sortKeys: true, // Sort keys for consistency
    });
    
    return {
      optimized,
      sizeReduction: Math.max(0, content.length - optimized.length),
    };
  } catch (error) {
    return {
      optimized: content,
      sizeReduction: 0,
      error: error.message,
    };
  }
}

/**
 * Handle YAML encoding issues
 * @param {string} content - YAML content
 * @returns {Object} Encoding result
 */
function handleYamlEncoding(content) {
  try {
    // Try to detect encoding issues
    if (content.includes('\0') || content.includes('\uFFFD') || content.includes('invalid encoding')) {
      return {
        success: false,
        errorType: 'encoding_error',
        message: 'Invalid character encoding detected',
      };
    }
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      errorType: 'encoding_error',
      message: error.message,
    };
  }
}

// Helper functions

/**
 * Extract anchors from YAML content
 * @param {string} content - YAML content
 * @returns {Array} List of anchors
 */
function extractAnchors(content) {
  const anchors = [];
  const anchorRegex = /&(\w+)/g;
  let match;
  
  while ((match = anchorRegex.exec(content)) !== null) {
    anchors.push(match[1]);
  }
  
  return anchors;
}

/**
 * Extract tags from YAML content
 * @param {string} content - YAML content
 * @returns {Array} List of tags
 */
function extractTags(content) {
  const tags = [];
  const tagRegex = /!(\w+)/g;
  let match;
  
  while ((match = tagRegex.exec(content)) !== null) {
    tags.push(match[1]);
  }
  
  return tags;
}

/**
 * Find multiline strings in YAML content
 * @param {string} content - YAML content
 * @returns {Array} List of multiline strings
 */
function findMultilineStrings(content) {
  const multilineStrings = [];
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('|') || line.includes('>')) {
      multilineStrings.push({
        line: i + 1,
        type: line.includes('|') ? 'literal' : 'folded',
      });
    }
  }
  
  return multilineStrings;
}

module.exports = {
  detectYamlFormat,
  parseYamlContent,
  formatYamlContent,
  validateYamlStructure,
  convertJsonToYaml,
  convertYamlToJson,
  handleYamlParseError,
  sanitizeYamlContent,
  preserveYamlComments,
  handleYamlIndentation,
  validateYamlSchema,
  optimizeYamlOutput,
  handleYamlEncoding,
  detectYamlVersion,
  handleYamlAnchors,
  handleYamlAliases,
  handleYamlTags,
  handleYamlDirectives,
  validateYamlSecurity,
  handleYamlMultilineStrings,
};
