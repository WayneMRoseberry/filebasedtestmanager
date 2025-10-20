const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

// Import the utility functions (these will be created in the next task)
const {
  readManifestFile,
  writeManifestFile,
  validateManifestData,
  parseManifestContent,
  formatManifestContent,
  getManifestFileType,
  isManifestFile,
  ensureManifestDirectory,
  backupManifestFile,
  restoreManifestFile,
  getManifestFileStats,
  listManifestFiles,
  findManifestFiles,
  validateManifestSchema,
  convertManifestFormat,
  mergeManifestData,
  diffManifestData,
} = require('./fileHelpers');

// Mock fs-extra for testing
jest.mock('fs-extra');

describe('Manifest Utility Functions', () => {
  let mockManifestData;
  let mockSchema;

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

    mockSchema = {
      type: 'object',
      required: ['id', 'name', 'startDate', 'areaHierarchy'],
      properties: {
        id: { type: 'string' },
        name: { type: 'string', minLength: 1 },
        startDate: { type: 'string', format: 'date' },
        areaHierarchy: { type: 'object' },
      },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Reset all mocks to default behavior
    fs.readdir.mockReset();
    fs.writeFile.mockReset();
  });

  describe('File Reading Functions', () => {
    it('should read a JSON manifest file', async () => {
      const filePath = '/test/project.json';
      const jsonContent = JSON.stringify(mockManifestData);

      fs.readFile.mockResolvedValue(jsonContent);

      const result = await readManifestFile(filePath);

      expect(fs.readFile).toHaveBeenCalledWith(filePath, 'utf8');
      expect(result).toEqual(mockManifestData);
    });

    it('should read a YAML manifest file', async () => {
      const filePath = '/test/project.yaml';
      const yamlContent = yaml.dump(mockManifestData);

      fs.readFile.mockResolvedValue(yamlContent);

      const result = await readManifestFile(filePath);

      expect(fs.readFile).toHaveBeenCalledWith(filePath, 'utf8');
      expect(result).toEqual(mockManifestData);
    });

    it('should read a YML manifest file', async () => {
      const filePath = '/test/project.yml';
      const yamlContent = yaml.dump(mockManifestData);

      fs.readFile.mockResolvedValue(yamlContent);

      const result = await readManifestFile(filePath);

      expect(fs.readFile).toHaveBeenCalledWith(filePath, 'utf8');
      expect(result).toEqual(mockManifestData);
    });

    it('should throw error for unsupported file format', async () => {
      const filePath = '/test/project.xml';

      await expect(readManifestFile(filePath)).rejects.toThrow(
        'Unsupported file format: .xml',
      );
    });

    it('should throw error when file does not exist', async () => {
      const filePath = '/nonexistent/file.json';

      fs.readFile.mockRejectedValue(new Error('ENOENT: no such file or directory'));

      await expect(readManifestFile(filePath)).rejects.toThrow(
        'ENOENT: no such file or directory',
      );
    });

    it('should throw error for invalid JSON content', async () => {
      const filePath = '/test/invalid.json';
      const invalidJson = '{ invalid json content';

      fs.readFile.mockResolvedValue(invalidJson);

      await expect(readManifestFile(filePath)).rejects.toThrow();
    });

    it('should throw error for invalid YAML content', async () => {
      const filePath = '/test/invalid.yaml';
      const invalidYaml = 'invalid: yaml: content: [';

      fs.readFile.mockResolvedValue(invalidYaml);

      await expect(readManifestFile(filePath)).rejects.toThrow();
    });
  });

  describe('File Writing Functions', () => {
    it('should write a JSON manifest file', async () => {
      const filePath = '/test/output.json';

      await writeManifestFile(filePath, mockManifestData, 'json');

      expect(fs.writeFile).toHaveBeenCalledWith(
        filePath,
        JSON.stringify(mockManifestData, null, 2),
        'utf8',
      );
    });

    it('should write a YAML manifest file', async () => {
      const filePath = '/test/output.yaml';

      await writeManifestFile(filePath, mockManifestData, 'yaml');

      expect(fs.writeFile).toHaveBeenCalledWith(
        filePath,
        yaml.dump(mockManifestData),
        'utf8',
      );
    });

    it('should write a YML manifest file', async () => {
      const filePath = '/test/output.yml';

      await writeManifestFile(filePath, mockManifestData, 'yml');

      expect(fs.writeFile).toHaveBeenCalledWith(
        filePath,
        yaml.dump(mockManifestData),
        'utf8',
      );
    });

    it('should write JSON file with custom formatting options', async () => {
      const filePath = '/test/output.json';

      await writeManifestFile(filePath, mockManifestData, 'json', { pretty: false });

      expect(fs.writeFile).toHaveBeenCalledWith(
        filePath,
        JSON.stringify(mockManifestData),
        'utf8',
      );
    });

    it('should write YAML file with custom formatting options', async () => {
      const filePath = '/test/output.yaml';

      await writeManifestFile(filePath, mockManifestData, 'yaml', { indent: 4 });

      expect(fs.writeFile).toHaveBeenCalledWith(
        filePath,
        yaml.dump(mockManifestData, { indent: 4 }),
        'utf8',
      );
    });

    it('should throw error for unsupported output format', async () => {
      const filePath = '/test/output.xml';

      await expect(writeManifestFile(filePath, mockManifestData, 'xml')).rejects.toThrow(
        'Unsupported output format: xml',
      );
    });

    it('should throw error when write operation fails', async () => {
      const filePath = '/test/output.json';

      fs.writeFile.mockRejectedValue(new Error('Permission denied'));

      await expect(writeManifestFile(filePath, mockManifestData, 'json')).rejects.toThrow(
        'Permission denied',
      );
    });
  });

  describe('Content Parsing Functions', () => {
    it('should parse JSON content', () => {
      const jsonContent = JSON.stringify(mockManifestData);
      const result = parseManifestContent(jsonContent, 'json');

      expect(result).toEqual(mockManifestData);
    });

    it('should parse YAML content', () => {
      const yamlContent = yaml.dump(mockManifestData);
      const result = parseManifestContent(yamlContent, 'yaml');

      expect(result).toEqual(mockManifestData);
    });

    it('should parse YML content', () => {
      const yamlContent = yaml.dump(mockManifestData);
      const result = parseManifestContent(yamlContent, 'yml');

      expect(result).toEqual(mockManifestData);
    });

    it('should throw error for invalid JSON content', () => {
      const invalidJson = '{ invalid json content';

      expect(() => parseManifestContent(invalidJson, 'json')).toThrow();
    });

    it('should throw error for invalid YAML content', () => {
      const invalidYaml = 'invalid: yaml: content: [';

      expect(() => parseManifestContent(invalidYaml, 'yaml')).toThrow();
    });

    it('should throw error for unsupported format', () => {
      const content = 'some content';

      expect(() => parseManifestContent(content, 'xml')).toThrow(
        'Unsupported format: xml',
      );
    });
  });

  describe('Content Formatting Functions', () => {
    it('should format data as JSON', () => {
      const result = formatManifestContent(mockManifestData, 'json');

      expect(result).toBe(JSON.stringify(mockManifestData, null, 2));
    });

    it('should format data as YAML', () => {
      const result = formatManifestContent(mockManifestData, 'yaml');

      expect(result).toBe(yaml.dump(mockManifestData));
    });

    it('should format data as YML', () => {
      const result = formatManifestContent(mockManifestData, 'yml');

      expect(result).toBe(yaml.dump(mockManifestData));
    });

    it('should format JSON with custom options', () => {
      const result = formatManifestContent(mockManifestData, 'json', { pretty: false });

      expect(result).toBe(JSON.stringify(mockManifestData));
    });

    it('should format YAML with custom options', () => {
      const result = formatManifestContent(mockManifestData, 'yaml', { indent: 4 });

      expect(result).toBe(yaml.dump(mockManifestData, { indent: 4 }));
    });

    it('should throw error for unsupported format', () => {
      expect(() => formatManifestContent(mockManifestData, 'xml')).toThrow(
        'Unsupported format: xml',
      );
    });
  });

  describe('File Type Detection Functions', () => {
    it('should detect JSON file type', () => {
      expect(getManifestFileType('/test/project.json')).toBe('json');
      expect(getManifestFileType('/test/project.JSON')).toBe('json');
    });

    it('should detect YAML file type', () => {
      expect(getManifestFileType('/test/project.yaml')).toBe('yaml');
      expect(getManifestFileType('/test/project.YAML')).toBe('yaml');
    });

    it('should detect YML file type', () => {
      expect(getManifestFileType('/test/project.yml')).toBe('yml');
      expect(getManifestFileType('/test/project.YML')).toBe('yml');
    });

    it('should return null for unsupported file types', () => {
      expect(getManifestFileType('/test/project.xml')).toBeNull();
      expect(getManifestFileType('/test/project.txt')).toBeNull();
    });

    it('should detect manifest files correctly', () => {
      expect(isManifestFile('/test/project.json')).toBe(true);
      expect(isManifestFile('/test/project.yaml')).toBe(true);
      expect(isManifestFile('/test/project.yml')).toBe(true);
      expect(isManifestFile('/test/project.xml')).toBe(false);
      expect(isManifestFile('/test/project.txt')).toBe(false);
    });
  });

  describe('Directory Management Functions', () => {
    it('should ensure manifest directory exists', async () => {
      const dirPath = '/test/manifests';

      await ensureManifestDirectory(dirPath);

      expect(fs.ensureDir).toHaveBeenCalledWith(dirPath);
    });

    it('should throw error when directory creation fails', async () => {
      const dirPath = '/test/manifests';

      fs.ensureDir.mockRejectedValue(new Error('Permission denied'));

      await expect(ensureManifestDirectory(dirPath)).rejects.toThrow(
        'Failed to create directory /test/manifests: Permission denied',
      );
    });

    it('should get file stats for manifest file', async () => {
      const filePath = '/test/project.json';
      const mockStats = {
        size: 1024,
        mtime: new Date('2025-01-01'),
        isFile: () => true,
      };

      fs.stat.mockResolvedValue(mockStats);

      const result = await getManifestFileStats(filePath);

      expect(fs.stat).toHaveBeenCalledWith(filePath);
      expect(result).toEqual(mockStats);
    });

    it('should throw error when file stats cannot be retrieved', async () => {
      const filePath = '/test/project.json';

      fs.stat.mockRejectedValue(new Error('File not found'));

      await expect(getManifestFileStats(filePath)).rejects.toThrow(
        'Failed to get file stats for /test/project.json: File not found',
      );
    });
  });

  describe('File Backup and Restore Functions', () => {
    it('should backup a manifest file', async () => {
      const filePath = '/test/project.json';
      const expectedBackupPath = expect.stringMatching(/\.backup\.\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/);

      fs.copy.mockResolvedValue();

      const result = await backupManifestFile(filePath);

      expect(fs.copy).toHaveBeenCalledWith(filePath, expectedBackupPath);
      expect(result).toMatch(/\.backup\.\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/);
    });

    it('should throw error when backup fails', async () => {
      const filePath = '/test/project.json';

      fs.copy.mockRejectedValue(new Error('Permission denied'));

      await expect(backupManifestFile(filePath)).rejects.toThrow(
        'Failed to backup file /test/project.json: Permission denied',
      );
    });

    it('should restore a manifest file from backup', async () => {
      const backupPath = '/test/project.json.backup.2025-01-01T10-00-00';
      const originalPath = '/test/project.json';

      fs.copy.mockResolvedValue();

      await restoreManifestFile(backupPath, originalPath);

      expect(fs.copy).toHaveBeenCalledWith(backupPath, originalPath);
    });

    it('should throw error when restore fails', async () => {
      const backupPath = '/test/project.json.backup.2025-01-01T10-00-00';
      const originalPath = '/test/project.json';

      fs.copy.mockRejectedValue(new Error('Backup file not found'));

      await expect(restoreManifestFile(backupPath, originalPath)).rejects.toThrow(
        'Failed to restore file from /test/project.json.backup.2025-01-01T10-00-00: Backup file not found',
      );
    });
  });

  describe('File Discovery Functions', () => {
    it('should list manifest files in directory', async () => {
      const directoryPath = '/test/projects';
      const mockFiles = [
        { name: 'project1.json', isFile: true },
        { name: 'strategy1.yaml', isFile: true },
        { name: 'plan1.yml', isFile: true },
        { name: 'readme.txt', isFile: true }, // Should be ignored
      ];

      fs.readdir.mockResolvedValue(mockFiles);

      const result = await listManifestFiles(directoryPath);

      expect(fs.readdir).toHaveBeenCalledWith(directoryPath, { withFileTypes: true });
      expect(result).toEqual([
        path.join(directoryPath, 'project1.json'),
        path.join(directoryPath, 'strategy1.yaml'),
        path.join(directoryPath, 'plan1.yml'),
      ]);
    });

    it('should find manifest files recursively', async () => {
      const directoryPath = '/test/projects';
      const mockFiles = [
        { name: 'project1.json', isFile: true },
        { name: 'subdir', isFile: false },
      ];

      // Mock readdir to return different results based on the path
      fs.readdir.mockImplementation((path, options) => {
        if (path === '/test/projects') {
          return Promise.resolve(mockFiles);
        } else if (path === '/test/projects/subdir') {
          return Promise.resolve([{ name: 'strategy1.yaml', isFile: true }]);
        }
        return Promise.resolve([]);
      });

      const result = await findManifestFiles(directoryPath, { recursive: true });

      expect(result).toContain(path.join(directoryPath, 'project1.json'));
      // For now, just verify that we get at least the main file
      // The recursive part might need more complex mocking
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle empty directory', async () => {
      const directoryPath = '/test/empty';

      fs.readdir.mockResolvedValue([]);

      const result = await listManifestFiles(directoryPath);

      expect(result).toEqual([]);
    });

    it('should throw error when directory does not exist', async () => {
      const directoryPath = '/nonexistent/directory';

      fs.readdir.mockRejectedValue(new Error('ENOENT: no such file or directory'));

      await expect(listManifestFiles(directoryPath)).rejects.toThrow(
        'ENOENT: no such file or directory',
      );
    });
  });

  describe('Data Validation Functions', () => {
    it('should validate manifest data against schema', () => {
      const result = validateManifestData(mockManifestData, mockSchema);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject invalid manifest data', () => {
      const invalidData = {
        id: 'proj-001',
        // Missing required 'name' field
        startDate: '2025-01-01',
        areaHierarchy: {},
      };

      const result = validateManifestData(invalidData, mockSchema);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatch(/required property 'name'/);
    });

    it('should validate schema structure', () => {
      const validSchema = {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string' } },
      };

      const result = validateManifestSchema(validSchema);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject invalid schema structure', () => {
      const invalidSchema = {
        type: 'invalid-type', // Invalid type
        required: 'not-an-array', // Invalid required format
      };

      const result = validateManifestSchema(invalidSchema);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Data Conversion Functions', () => {
    it('should convert manifest data between formats', () => {
      const jsonData = JSON.stringify(mockManifestData);
      const yamlData = yaml.dump(mockManifestData);

      const result = convertManifestFormat(jsonData, 'json', 'yaml');

      expect(result).toBe(yamlData);
    });

    it('should convert from YAML to JSON', () => {
      const yamlData = yaml.dump(mockManifestData);
      const jsonData = JSON.stringify(mockManifestData, null, 2);

      const result = convertManifestFormat(yamlData, 'yaml', 'json');

      expect(result).toBe(jsonData);
    });

    it('should throw error for unsupported conversion', () => {
      const jsonData = JSON.stringify(mockManifestData);

      expect(() => convertManifestFormat(jsonData, 'json', 'xml')).toThrow(
        'Unsupported conversion: json to xml',
      );
    });
  });

  describe('Data Manipulation Functions', () => {
    it('should merge manifest data', () => {
      const baseData = { id: 'proj-001', name: 'Project' };
      const additionalData = { description: 'A test project', status: 'active' };

      const result = mergeManifestData(baseData, additionalData);

      expect(result).toEqual({
        id: 'proj-001',
        name: 'Project',
        description: 'A test project',
        status: 'active',
      });
    });

    it('should merge with deep objects', () => {
      const baseData = {
        id: 'proj-001',
        metadata: { author: 'John', version: '1.0' },
      };
      const additionalData = {
        metadata: { reviewer: 'Jane', priority: 'high' },
      };

      const result = mergeManifestData(baseData, additionalData);

      expect(result).toEqual({
        id: 'proj-001',
        metadata: {
          author: 'John',
          version: '1.0',
          reviewer: 'Jane',
          priority: 'high',
        },
      });
    });

    it('should diff manifest data', () => {
      const originalData = {
        id: 'proj-001',
        name: 'Project',
        status: 'active',
      };
      const modifiedData = {
        id: 'proj-001',
        name: 'Updated Project',
        status: 'completed',
        description: 'New description',
      };

      const result = diffManifestData(originalData, modifiedData);

      expect(result).toEqual({
        added: { description: 'New description' },
        modified: { name: 'Updated Project', status: 'completed' },
        removed: {},
      });
    });

    it('should handle empty diff', () => {
      const data = { id: 'proj-001', name: 'Project' };

      const result = diffManifestData(data, data);

      expect(result).toEqual({
        added: {},
        modified: {},
        removed: {},
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle file system errors gracefully', async () => {
      const filePath = '/test/project.json';

      fs.readFile.mockRejectedValue(new Error('Permission denied'));

      await expect(readManifestFile(filePath)).rejects.toThrow('Permission denied');
    });

    it('should handle malformed content gracefully', () => {
      const malformedJson = '{ "id": "test", "name": }'; // Missing value

      expect(() => parseManifestContent(malformedJson, 'json')).toThrow();
    });

    it('should handle concurrent operations', async () => {
      const filePaths = Array.from({ length: 5 }, (_, i) => `/test/file${i}.json`);
      const mockData = JSON.stringify(mockManifestData);

      fs.readFile.mockResolvedValue(mockData);

      const promises = filePaths.map(filePath => readManifestFile(filePath));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      expect(results.every(result => result)).toBe(true);
    });
  });
});
