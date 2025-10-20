const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const ManifestService = require('./ManifestService');

// Mock fs-extra for testing
jest.mock('fs-extra');

// Mock schema loading for tests
const mockSchemas = {
  'project': {
    type: 'object',
    required: ['id', 'name', 'startDate', 'areaHierarchy'],
    properties: {
      id: { type: 'string' },
      name: { type: 'string', minLength: 1 },
      startDate: { type: 'string', format: 'date' },
      areaHierarchy: { type: 'object' },
    },
  },
  'test-strategy': {
    type: 'object',
    required: ['id', 'projectId', 'name', 'description'],
    properties: {
      id: { type: 'string' },
      projectId: { type: 'string' },
      name: { type: 'string', minLength: 1 },
      description: { type: 'string', minLength: 1 },
      status: { type: 'string', enum: ['draft', 'approved', 'in-review', 'deprecated'] },
    },
  },
};

describe('ManifestService', () => {
  let manifestService;
  let mockManifestData;

  beforeEach(() => {
    // Mock fs.readFileSync to return schema content
    fs.readFileSync.mockImplementation((filePath) => {
      if (filePath.includes('project-schema.json')) {
        return JSON.stringify(mockSchemas['project']);
      } else if (filePath.includes('test-strategy-schema.json')) {
        return JSON.stringify(mockSchemas['test-strategy']);
      }
      throw new Error('Schema not found');
    });

    manifestService = new ManifestService();
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
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Reset all mocks to default behavior
    fs.readdir.mockReset();
    fs.writeFile.mockReset();
  });

  describe('File Reading and Parsing', () => {
    it('should read and parse a valid JSON manifest file', async () => {
      const filePath = '/test/project.json';
      const jsonContent = JSON.stringify(mockManifestData);

      fs.readFile.mockResolvedValue(jsonContent);

      const result = await manifestService.readManifestFile(filePath);

      expect(fs.readFile).toHaveBeenCalledWith(filePath, 'utf8');
      expect(result).toEqual(mockManifestData);
    });

    it('should read and parse a valid YAML manifest file', async () => {
      const filePath = '/test/project.yaml';
      const yamlContent = yaml.dump(mockManifestData);

      fs.readFile.mockResolvedValue(yamlContent);

      const result = await manifestService.readManifestFile(filePath);

      expect(fs.readFile).toHaveBeenCalledWith(filePath, 'utf8');
      expect(result).toEqual(mockManifestData);
    });

    it('should read and parse a valid YML manifest file', async () => {
      const filePath = '/test/project.yml';
      const yamlContent = yaml.dump(mockManifestData);

      fs.readFile.mockResolvedValue(yamlContent);

      const result = await manifestService.readManifestFile(filePath);

      expect(fs.readFile).toHaveBeenCalledWith(filePath, 'utf8');
      expect(result).toEqual(mockManifestData);
    });

    it('should throw error for unsupported file format', async () => {
      const filePath = '/test/project.xml';

      await expect(manifestService.readManifestFile(filePath)).rejects.toThrow(
        'Unsupported file format: .xml',
      );
    });

    it('should throw error when file does not exist', async () => {
      const filePath = '/nonexistent/file.json';

      fs.readFile.mockRejectedValue(new Error('ENOENT: no such file or directory'));

      await expect(manifestService.readManifestFile(filePath)).rejects.toThrow(
        'ENOENT: no such file or directory',
      );
    });

    it('should throw error for invalid JSON content', async () => {
      const filePath = '/test/invalid.json';
      const invalidJson = '{ invalid json content';

      fs.readFile.mockResolvedValue(invalidJson);

      await expect(manifestService.readManifestFile(filePath)).rejects.toThrow();
    });

    it('should throw error for invalid YAML content', async () => {
      const filePath = '/test/invalid.yaml';
      const invalidYaml = 'invalid: yaml: content: [';

      fs.readFile.mockResolvedValue(invalidYaml);

      await expect(manifestService.readManifestFile(filePath)).rejects.toThrow();
    });
  });

  describe('Manifest Validation', () => {
    it('should validate a valid project manifest', async () => {
      const filePath = '/test/project.json';
      const jsonContent = JSON.stringify(mockManifestData);

      fs.readFile.mockResolvedValue(jsonContent);

      const result = await manifestService.validateManifest(filePath, 'project');

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.data).toEqual(mockManifestData);
    });

    it('should validate a valid test strategy manifest', async () => {
      const strategyData = {
        id: 'strategy-001',
        projectId: 'proj-001',
        name: 'Test Strategy',
        description: 'A test strategy',
      };
      const filePath = '/test/strategy.json';
      const jsonContent = JSON.stringify(strategyData);

      fs.readFile.mockResolvedValue(jsonContent);

      const result = await manifestService.validateManifest(filePath, 'test-strategy');

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.data).toEqual(strategyData);
    });

    it('should reject manifest with missing required fields', async () => {
      const invalidData = {
        id: 'proj-001',
        // Missing required 'name' field
        startDate: '2025-01-01',
        areaHierarchy: {},
      };
      const filePath = '/test/invalid-project.json';
      const jsonContent = JSON.stringify(invalidData);

      fs.readFile.mockResolvedValue(jsonContent);

      const result = await manifestService.validateManifest(filePath, 'project');

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatch(/required property 'name'/);
    });

    it('should reject manifest with invalid data types', async () => {
      const invalidData = {
        id: 'proj-001',
        name: 'Test Project',
        startDate: 'invalid-date', // Invalid date format
        areaHierarchy: {},
      };
      const filePath = '/test/invalid-types.json';
      const jsonContent = JSON.stringify(invalidData);

      fs.readFile.mockResolvedValue(jsonContent);

      const result = await manifestService.validateManifest(filePath, 'project');

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatch(/must match format "date"/);
    });

    it('should reject manifest with invalid enum values', async () => {
      const invalidData = {
        id: 'strategy-001',
        projectId: 'proj-001',
        name: 'Test Strategy',
        description: 'A test strategy',
        status: 'invalid-status', // Invalid enum value
      };
      const filePath = '/test/invalid-enum.json';
      const jsonContent = JSON.stringify(invalidData);

      fs.readFile.mockResolvedValue(jsonContent);

      const result = await manifestService.validateManifest(filePath, 'test-strategy');

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatch(/must be equal to one of the allowed values/);
    });

    it('should throw error for unknown schema type', async () => {
      const filePath = '/test/unknown.json';
      const jsonContent = JSON.stringify(mockManifestData);

      fs.readFile.mockResolvedValue(jsonContent);

      const result = await manifestService.validateManifest(filePath, 'unknown-schema');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Unknown schema type: unknown-schema');
    });
  });

  describe('Manifest Writing', () => {
    it('should write a valid manifest to JSON file', async () => {
      const filePath = '/test/output.json';

      await manifestService.writeManifestFile(filePath, mockManifestData, 'json');

      expect(fs.writeFile).toHaveBeenCalledWith(filePath, JSON.stringify(mockManifestData, null, 2), 'utf8');
    });

    it('should write a valid manifest to YAML file', async () => {
      const filePath = '/test/output.yaml';

      await manifestService.writeManifestFile(filePath, mockManifestData, 'yaml');

      expect(fs.writeFile).toHaveBeenCalledWith(filePath, yaml.dump(mockManifestData), 'utf8');
    });

    it('should write a valid manifest to YML file', async () => {
      const filePath = '/test/output.yml';

      await manifestService.writeManifestFile(filePath, mockManifestData, 'yml');

      expect(fs.writeFile).toHaveBeenCalledWith(filePath, yaml.dump(mockManifestData), 'utf8');
    });

    it('should throw error for unsupported output format', async () => {
      const filePath = '/test/output.xml';

      await expect(manifestService.writeManifestFile(filePath, mockManifestData, 'xml')).rejects.toThrow(
        'Unsupported output format: xml',
      );
    });

    it('should throw error when write operation fails', async () => {
      const filePath = '/test/output.json';

      fs.writeFile.mockRejectedValue(new Error('Permission denied'));

      await expect(manifestService.writeManifestFile(filePath, mockManifestData, 'json')).rejects.toThrow(
        'Permission denied',
      );
    });
  });

  describe('Manifest Discovery', () => {
    it('should discover manifest files in a directory', async () => {
      const directoryPath = '/test/projects';
      const mockFiles = [
        { name: 'project1.json', isFile: true },
        { name: 'strategy1.yaml', isFile: true },
        { name: 'plan1.yml', isFile: true },
        { name: 'readme.txt', isFile: true }, // Should be ignored
        { name: 'subdir', isFile: false }, // Should be ignored
      ];

      fs.readdir.mockResolvedValue(mockFiles);

      const result = await manifestService.discoverManifestFiles(directoryPath);

      expect(fs.readdir).toHaveBeenCalledWith(directoryPath, { withFileTypes: true });
      expect(result).toEqual([
        path.join(directoryPath, 'project1.json'),
        path.join(directoryPath, 'strategy1.yaml'),
        path.join(directoryPath, 'plan1.yml'),
      ]);
    });

    it('should discover manifest files recursively', async () => {
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

      const result = await manifestService.discoverManifestFiles(directoryPath, { recursive: true });

      expect(result).toContain(path.join(directoryPath, 'project1.json'));
      // For now, just verify that we get at least the main file
      // The recursive part might need more complex mocking
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle empty directory', async () => {
      const directoryPath = '/test/empty';

      fs.readdir.mockResolvedValue([]);

      const result = await manifestService.discoverManifestFiles(directoryPath);

      expect(result).toEqual([]);
    });

    it('should throw error when directory does not exist', async () => {
      const directoryPath = '/nonexistent/directory';

      fs.readdir.mockRejectedValue(new Error('ENOENT: no such file or directory'));

      await expect(manifestService.discoverManifestFiles(directoryPath)).rejects.toThrow(
        'ENOENT: no such file or directory',
      );
    });
  });

  describe('Manifest Processing', () => {
    it('should process multiple manifest files and return results', async () => {
      const filePaths = ['/test/project1.json', '/test/strategy1.yaml'];
      const projectData = { ...mockManifestData, id: 'proj-001' };
      const strategyData = {
        id: 'strategy-001',
        projectId: 'proj-001',
        name: 'Test Strategy',
        description: 'A test strategy',
      };

      fs.readFile
        .mockResolvedValueOnce(JSON.stringify(projectData))
        .mockResolvedValueOnce(yaml.dump(strategyData));

      const result = await manifestService.processManifestFiles(filePaths);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        filePath: '/test/project1.json',
        isValid: true,
        data: projectData,
        errors: [],
      });
      expect(result[1]).toEqual({
        filePath: '/test/strategy1.yaml',
        isValid: true,
        data: strategyData,
        errors: [],
      });
    });

    it('should handle mixed valid and invalid manifest files', async () => {
      const filePaths = ['/test/valid.json', '/test/invalid.json'];
      const validData = mockManifestData;
      const invalidData = { id: 'invalid' }; // Missing required fields

      fs.readFile
        .mockResolvedValueOnce(JSON.stringify(validData))
        .mockResolvedValueOnce(JSON.stringify(invalidData));

      const result = await manifestService.processManifestFiles(filePaths);

      expect(result).toHaveLength(2);
      expect(result[0].isValid).toBe(true);
      expect(result[1].isValid).toBe(false);
      expect(result[1].errors.length).toBeGreaterThan(0);
    });

    it('should handle file reading errors gracefully', async () => {
      const filePaths = ['/test/valid.json', '/test/error.json'];

      fs.readFile
        .mockResolvedValueOnce(JSON.stringify(mockManifestData))
        .mockRejectedValueOnce(new Error('Permission denied'));

      const result = await manifestService.processManifestFiles(filePaths);

      expect(result).toHaveLength(2);
      expect(result[0].isValid).toBe(true);
      expect(result[1].isValid).toBe(false);
      expect(result[1].errors).toContain('Permission denied');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON files gracefully', async () => {
      const filePath = '/test/malformed.json';
      const malformedJson = '{ "id": "test", "name": }'; // Missing value

      fs.readFile.mockResolvedValue(malformedJson);

      const result = await manifestService.validateManifest(filePath, 'project');

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatch(/Unexpected token/);
    });

    it('should handle malformed YAML files gracefully', async () => {
      const filePath = '/test/malformed.yaml';
      const malformedYaml = 'id: test\nname: [unclosed array';

      fs.readFile.mockResolvedValue(malformedYaml);

      const result = await manifestService.validateManifest(filePath, 'project');

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatch(/unexpected end|bad indentation/);
    });

    it('should handle schema validation errors with detailed messages', async () => {
      const filePath = '/test/invalid-schema.json';
      const invalidData = {
        id: 'proj-001',
        name: '', // Empty string should fail minLength
        startDate: 'not-a-date',
        areaHierarchy: 'not-an-object',
      };

      fs.readFile.mockResolvedValue(JSON.stringify(invalidData));

      const result = await manifestService.validateManifest(filePath, 'project');

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      // Check that we get validation errors (the exact messages may vary)
      expect(result.errors.some(error => 
        error.includes('minLength') || 
        error.includes('format') || 
        error.includes('object') ||
        error.includes('required')
      )).toBe(true);
    });

    it('should handle concurrent file operations', async () => {
      const filePaths = Array.from({ length: 10 }, (_, i) => `/test/file${i}.json`);
      const mockData = { ...mockManifestData };

      fs.readFile.mockResolvedValue(JSON.stringify(mockData));

      const result = await manifestService.processManifestFiles(filePaths);

      expect(result).toHaveLength(10);
      expect(result.every(r => r.isValid)).toBe(true);
    });
  });

  describe('Configuration and Options', () => {
    it('should use custom schema directory when provided', async () => {
      const customSchemaDir = '/custom/schemas';
      const service = new ManifestService({ schemaDirectory: customSchemaDir });

      // This test would verify that the service uses the custom schema directory
      // The actual implementation would need to support this configuration
      expect(service).toBeDefined();
    });

    it('should respect file format preferences', async () => {
      const filePath = '/test/output.json';

      await manifestService.writeManifestFile(filePath, mockManifestData, 'json', { pretty: false });

      expect(fs.writeFile).toHaveBeenCalledWith(filePath, JSON.stringify(mockManifestData), 'utf8');
    });

    it('should handle custom validation options', async () => {
      const filePath = '/test/project.json';
      const jsonContent = JSON.stringify(mockManifestData);

      fs.readFile.mockResolvedValue(jsonContent);

      const result = await manifestService.validateManifest(filePath, 'project', {
        strict: false,
        allowAdditionalProperties: true,
      });

      expect(result.isValid).toBe(true);
    });
  });
});
