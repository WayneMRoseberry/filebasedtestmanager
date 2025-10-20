const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

/**
 * Read a manifest file and parse its content
 * @param {string} filePath - Path to the manifest file
 * @returns {Promise<Object>} Parsed manifest data
 */
async function readManifestFile(filePath) {
  const fileType = getManifestFileType(filePath);
  
  if (!fileType) {
    throw new Error(`Unsupported file format: ${path.extname(filePath)}`);
  }

  try {
    const content = await fs.readFile(filePath, 'utf8');
    return parseManifestContent(content, fileType);
  } catch (error) {
    throw error;
  }
}

/**
 * Write manifest data to a file
 * @param {string} filePath - Path to write the file
 * @param {Object} data - Manifest data to write
 * @param {string} format - Output format (json, yaml, yml)
 * @param {Object} options - Formatting options
 * @returns {Promise<void>}
 */
async function writeManifestFile(filePath, data, format, options = {}) {
  const fileType = getManifestFileType(filePath);
  
  if (!fileType) {
    throw new Error(`Unsupported output format: ${path.extname(filePath).replace('.', '')}`);
  }

  try {
    const content = formatManifestContent(data, format, options);
    await fs.writeFile(filePath, content, 'utf8');
  } catch (error) {
    throw error;
  }
}

/**
 * Parse manifest content based on format
 * @param {string} content - File content
 * @param {string} format - Content format (json, yaml, yml)
 * @returns {Object} Parsed data
 */
function parseManifestContent(content, format) {
  switch (format.toLowerCase()) {
    case 'json':
      return JSON.parse(content);
    case 'yaml':
    case 'yml':
      return yaml.load(content);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * Format manifest data to string based on format
 * @param {Object} data - Manifest data
 * @param {string} format - Output format (json, yaml, yml)
 * @param {Object} options - Formatting options
 * @returns {string} Formatted content
 */
function formatManifestContent(data, format, options = {}) {
  switch (format.toLowerCase()) {
    case 'json':
      return options.pretty !== false 
        ? JSON.stringify(data, null, 2)
        : JSON.stringify(data);
    case 'yaml':
    case 'yml':
      return yaml.dump(data, {
        indent: options.indent || 2,
        lineWidth: options.lineWidth || 80,
      });
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * Get manifest file type from file path
 * @param {string} filePath - Path to the file
 * @returns {string|null} File type or null if unsupported
 */
function getManifestFileType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  switch (ext) {
    case '.json':
      return 'json';
    case '.yaml':
      return 'yaml';
    case '.yml':
      return 'yml';
    default:
      return null;
  }
}

/**
 * Check if a file is a manifest file
 * @param {string} filePath - Path to the file
 * @returns {boolean} True if it's a manifest file
 */
function isManifestFile(filePath) {
  return getManifestFileType(filePath) !== null;
}

/**
 * Ensure manifest directory exists
 * @param {string} dirPath - Directory path
 * @returns {Promise<void>}
 */
async function ensureManifestDirectory(dirPath) {
  try {
    await fs.ensureDir(dirPath);
  } catch (error) {
    throw new Error(`Failed to create directory ${dirPath}: ${error.message}`);
  }
}

/**
 * Get file stats for a manifest file
 * @param {string} filePath - Path to the file
 * @returns {Promise<Object>} File stats
 */
async function getManifestFileStats(filePath) {
  try {
    return await fs.stat(filePath);
  } catch (error) {
    throw new Error(`Failed to get file stats for ${filePath}: ${error.message}`);
  }
}

/**
 * Backup a manifest file with timestamp
 * @param {string} filePath - Path to the file to backup
 * @returns {Promise<string>} Path to the backup file
 */
async function backupManifestFile(filePath) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${filePath}.backup.${timestamp}`;
  
  try {
    await fs.copy(filePath, backupPath);
    return backupPath;
  } catch (error) {
    throw new Error(`Failed to backup file ${filePath}: ${error.message}`);
  }
}

/**
 * Restore a manifest file from backup
 * @param {string} backupPath - Path to the backup file
 * @param {string} originalPath - Path to restore to
 * @returns {Promise<void>}
 */
async function restoreManifestFile(backupPath, originalPath) {
  try {
    await fs.copy(backupPath, originalPath);
  } catch (error) {
    throw new Error(`Failed to restore file from ${backupPath}: ${error.message}`);
  }
}

/**
 * List manifest files in a directory
 * @param {string} directoryPath - Directory path
 * @returns {Promise<string[]>} Array of manifest file paths
 */
async function listManifestFiles(directoryPath) {
  try {
    const items = await fs.readdir(directoryPath, { withFileTypes: true });
    const manifestFiles = [];

    for (const item of items) {
      // Handle both real file system objects and mock objects
      const isFile = typeof item.isFile === 'function' ? item.isFile() : item.isFile;
      
      if (isFile) {
        const itemPath = path.join(directoryPath, item.name);
        if (isManifestFile(itemPath)) {
          manifestFiles.push(itemPath);
        }
      }
    }

    return manifestFiles;
  } catch (error) {
    throw error;
  }
}

/**
 * Find manifest files recursively
 * @param {string} directoryPath - Directory path
 * @param {Object} options - Search options
 * @returns {Promise<string[]>} Array of manifest file paths
 */
async function findManifestFiles(directoryPath, options = {}) {
  const { recursive = false } = options;
  const manifestFiles = [];

  try {
    const items = await fs.readdir(directoryPath, { withFileTypes: true });
    
    for (const item of items) {
      const itemPath = path.join(directoryPath, item.name);
      
      // Handle both real file system objects and mock objects
      const isFile = typeof item.isFile === 'function' ? item.isFile() : item.isFile;
      const isDirectory = typeof item.isDirectory === 'function' ? item.isDirectory() : item.isDirectory;
      
      if (isFile) {
        if (isManifestFile(itemPath)) {
          manifestFiles.push(itemPath);
        }
      } else if (isDirectory && recursive) {
        const subFiles = await findManifestFiles(itemPath, { recursive: true });
        manifestFiles.push(...subFiles);
      }
    }
  } catch (error) {
    throw error;
  }

  return manifestFiles;
}

/**
 * Validate manifest data against a schema
 * @param {Object} data - Manifest data
 * @param {Object} schema - JSON schema
 * @returns {Object} Validation result
 */
function validateManifestData(data, schema) {
  try {
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    
    const validate = ajv.compile(schema);
    const isValid = validate(data);

    return {
      isValid,
      errors: isValid ? [] : validate.errors.map(error => error.message),
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [error.message],
    };
  }
}

/**
 * Validate schema structure
 * @param {Object} schema - JSON schema to validate
 * @returns {Object} Validation result
 */
function validateManifestSchema(schema) {
  try {
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    
    // Try to compile the schema
    ajv.compile(schema);

    return {
      isValid: true,
      errors: [],
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [error.message],
    };
  }
}

/**
 * Convert manifest content between formats
 * @param {string} content - Source content
 * @param {string} fromFormat - Source format
 * @param {string} toFormat - Target format
 * @returns {string} Converted content
 */
function convertManifestFormat(content, fromFormat, toFormat) {
  const supportedFormats = ['json', 'yaml', 'yml'];
  
  if (!supportedFormats.includes(fromFormat) || !supportedFormats.includes(toFormat)) {
    throw new Error(`Unsupported conversion: ${fromFormat} to ${toFormat}`);
  }

  // Parse the source content
  const data = parseManifestContent(content, fromFormat);
  
  // Format to target format
  return formatManifestContent(data, toFormat);
}

/**
 * Merge manifest data objects
 * @param {Object} baseData - Base data object
 * @param {Object} additionalData - Additional data to merge
 * @returns {Object} Merged data
 */
function mergeManifestData(baseData, additionalData) {
  const result = { ...baseData };

  for (const [key, value] of Object.entries(additionalData)) {
    if (result[key] && typeof result[key] === 'object' && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = mergeManifestData(result[key], value);
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Diff two manifest data objects
 * @param {Object} originalData - Original data
 * @param {Object} modifiedData - Modified data
 * @returns {Object} Diff result
 */
function diffManifestData(originalData, modifiedData) {
  const added = {};
  const modified = {};
  const removed = {};

  // Check for added and modified properties
  for (const [key, value] of Object.entries(modifiedData)) {
    if (!(key in originalData)) {
      added[key] = value;
    } else if (JSON.stringify(originalData[key]) !== JSON.stringify(value)) {
      modified[key] = value;
    }
  }

  // Check for removed properties
  for (const key of Object.keys(originalData)) {
    if (!(key in modifiedData)) {
      removed[key] = originalData[key];
    }
  }

  return { added, modified, removed };
}

module.exports = {
  readManifestFile,
  writeManifestFile,
  parseManifestContent,
  formatManifestContent,
  getManifestFileType,
  isManifestFile,
  ensureManifestDirectory,
  getManifestFileStats,
  backupManifestFile,
  restoreManifestFile,
  listManifestFiles,
  findManifestFiles,
  validateManifestData,
  validateManifestSchema,
  convertManifestFormat,
  mergeManifestData,
  diffManifestData,
};
