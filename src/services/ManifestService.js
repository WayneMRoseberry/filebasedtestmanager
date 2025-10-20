const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

class ManifestService {
  constructor(options = {}) {
    this.schemaDirectory = options.schemaDirectory || path.join(__dirname, '../../schemas');
    this.ajv = new Ajv({ allErrors: true });
    addFormats(this.ajv);
    this.schemas = new Map();
    this.loadSchemas();
  }

  loadSchemas() {
    const schemaFiles = [
      'project-schema.json',
      'test-strategy-schema.json',
      'test-plan-schema.json',
      'test-charter-schema.json',
      'test-session-schema.json',
      'test-report-schema.json',
      'test-suite-schema.json',
      'test-case-schema.json',
      'test-status-report-schema.json',
    ];

    schemaFiles.forEach(filename => {
      try {
        const schemaPath = path.join(this.schemaDirectory, filename);
        const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
        const schemaName = filename.replace('-schema.json', '');
        this.schemas.set(schemaName, schema);
        this.ajv.addSchema(schema, schemaName);
      } catch (error) {
        // In test environment, schemas might not be available
        if (process.env.NODE_ENV !== 'test') {
          console.warn(`Warning: Could not load schema ${filename}:`, error.message);
        }
      }
    });
  }

  getFileExtension(filePath) {
    return path.extname(filePath).toLowerCase();
  }

  isSupportedFormat(extension) {
    return ['.json', '.yaml', '.yml'].includes(extension);
  }

  async readManifestFile(filePath) {
    const extension = this.getFileExtension(filePath);
    
    if (!this.isSupportedFormat(extension)) {
      throw new Error(`Unsupported file format: ${extension}`);
    }

    try {
      const content = await fs.readFile(filePath, 'utf8');
      
      if (extension === '.json') {
        return JSON.parse(content);
      } else if (extension === '.yaml' || extension === '.yml') {
        return yaml.load(content);
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`File not found: ${filePath}`);
      }
      throw error;
    }
  }

  async validateManifest(filePath, schemaType, options = {}) {
    try {
      const data = await this.readManifestFile(filePath);
      
      if (!this.schemas.has(schemaType)) {
        throw new Error(`Unknown schema type: ${schemaType}`);
      }

      const schema = this.schemas.get(schemaType);
      const validate = this.ajv.compile(schema);
      const isValid = validate(data);

      return {
        isValid,
        data: isValid ? data : null,
        errors: isValid ? [] : validate.errors.map(error => error.message),
        filePath,
      };
    } catch (error) {
      return {
        isValid: false,
        data: null,
        errors: [error.message],
        filePath,
      };
    }
  }

  async writeManifestFile(filePath, data, format, options = {}) {
    const extension = this.getFileExtension(filePath);
    
    if (!this.isSupportedFormat(extension)) {
      throw new Error(`Unsupported output format: ${extension.replace('.', '')}`);
    }

    let content;
    const pretty = options.pretty !== false;

    if (extension === '.json') {
      content = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    } else if (extension === '.yaml' || extension === '.yml') {
      content = yaml.dump(data, { 
        indent: pretty ? 2 : 0,
        lineWidth: pretty ? 80 : -1,
      });
    }

    try {
      await fs.writeFile(filePath, content, 'utf8');
    } catch (error) {
      throw error;
    }
  }

  async discoverManifestFiles(directoryPath, options = {}) {
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
          const extension = this.getFileExtension(itemPath);
          if (this.isSupportedFormat(extension)) {
            manifestFiles.push(itemPath);
          }
        } else if (isDirectory && recursive) {
          const subFiles = await this.discoverManifestFiles(itemPath, { recursive: true });
          manifestFiles.push(...subFiles);
        }
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Directory not found: ${directoryPath}`);
      }
      throw error;
    }

    return manifestFiles;
  }

  async processManifestFiles(filePaths, options = {}) {
    const results = [];

    for (const filePath of filePaths) {
      try {
        const extension = this.getFileExtension(filePath);
        let schemaType = 'project'; // Default schema type

        // Try to infer schema type from filename
        const filename = path.basename(filePath, extension);
        if (filename.includes('strategy')) {
          schemaType = 'test-strategy';
        } else if (filename.includes('plan')) {
          schemaType = 'test-plan';
        } else if (filename.includes('charter')) {
          schemaType = 'test-charter';
        } else if (filename.includes('session')) {
          schemaType = 'test-session';
        } else if (filename.includes('report')) {
          schemaType = 'test-report';
        } else if (filename.includes('suite')) {
          schemaType = 'test-suite';
        } else if (filename.includes('case')) {
          schemaType = 'test-case';
        } else if (filename.includes('status')) {
          schemaType = 'test-status-report';
        }

        const result = await this.validateManifest(filePath, schemaType, options);
        results.push(result);
      } catch (error) {
        results.push({
          filePath,
          isValid: false,
          data: null,
          errors: [error.message],
        });
      }
    }

    return results;
  }

  getSupportedFormats() {
    return ['.json', '.yaml', '.yml'];
  }

  getAvailableSchemas() {
    return Array.from(this.schemas.keys());
  }

  validateData(data, schemaType) {
    if (!this.schemas.has(schemaType)) {
      throw new Error(`Unknown schema type: ${schemaType}`);
    }

    const schema = this.schemas.get(schemaType);
    const validate = this.ajv.compile(schema);
    const isValid = validate(data);

    return {
      isValid,
      errors: isValid ? [] : validate.errors.map(error => error.message),
    };
  }

  async ensureDirectoryExists(dirPath) {
    try {
      await fs.ensureDir(dirPath);
    } catch (error) {
      throw new Error(`Failed to create directory ${dirPath}: ${error.message}`);
    }
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getFileStats(filePath) {
    try {
      return await fs.stat(filePath);
    } catch (error) {
      throw new Error(`Failed to get file stats for ${filePath}: ${error.message}`);
    }
  }

  async backupFile(filePath) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${filePath}.backup.${timestamp}`;
    
    try {
      await fs.copy(filePath, backupPath);
      return backupPath;
    } catch (error) {
      throw new Error(`Failed to backup file ${filePath}: ${error.message}`);
    }
  }

  async restoreFile(backupPath, originalPath) {
    try {
      await fs.copy(backupPath, originalPath);
    } catch (error) {
      throw new Error(`Failed to restore file from ${backupPath}: ${error.message}`);
    }
  }
}

module.exports = ManifestService;
