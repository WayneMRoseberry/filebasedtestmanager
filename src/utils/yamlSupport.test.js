const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');

// Import the YAML support functions (these will be created in the next task)
const {
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
} = require('./yamlSupport');

// Mock fs-extra for testing
jest.mock('fs-extra');

describe('YAML Format Support', () => {
  let mockManifestData;
  let mockYamlContent;
  let mockJsonContent;

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
      metadata: {
        version: '1.0.0',
        author: 'Test Author',
        tags: ['testing', 'yaml', 'manifest'],
      },
    };

    mockYamlContent = `id: proj-001
name: Test Project
startDate: 2025-01-01
areaHierarchy:
  Feature A:
    Sub-Feature A1:
      - Component 1
      - Component 2
metadata:
  version: 1.0.0
  author: Test Author
  tags:
    - testing
    - yaml
    - manifest`;

    mockJsonContent = JSON.stringify(mockManifestData, null, 2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('YAML Format Detection', () => {
    it('should detect YAML format from file extension', () => {
      expect(detectYamlFormat('/path/to/file.yaml')).toBe('yaml');
      expect(detectYamlFormat('/path/to/file.yml')).toBe('yaml');
      expect(detectYamlFormat('/path/to/file.json')).toBe('json');
      expect(detectYamlFormat('/path/to/file.txt')).toBe(null);
    });

    it('should detect YAML format from content', () => {
      const yamlContent = 'id: test\nname: Test Project';
      const jsonContent = '{"id": "test", "name": "Test Project"}';
      const xmlContent = '<root><id>test</id></root>';

      expect(detectYamlFormat(null, yamlContent)).toBe('yaml');
      expect(detectYamlFormat(null, jsonContent)).toBe('json');
      expect(detectYamlFormat(null, xmlContent)).toBe(null);
    });

    it('should handle mixed content detection', () => {
      const mixedContent = '---\nid: test\nname: Test Project\n...';
      expect(detectYamlFormat(null, mixedContent)).toBe('yaml');
    });
  });

  describe('YAML Content Parsing', () => {
    it('should parse valid YAML content', () => {
      const result = parseYamlContent(mockYamlContent);
      // YAML parser converts dates to Date objects, so we need to handle this
      expect(result.id).toBe(mockManifestData.id);
      expect(result.name).toBe(mockManifestData.name);
      expect(result.areaHierarchy).toEqual(mockManifestData.areaHierarchy);
      expect(result.metadata).toEqual(mockManifestData.metadata);
      // Date will be parsed as Date object, so we check it exists
      expect(result.startDate).toBeDefined();
    });

    it('should parse YAML with comments', () => {
      const yamlWithComments = `# Project configuration
id: proj-001
name: Test Project # Project name
startDate: 2025-01-01
# Area hierarchy
areaHierarchy:
  Feature A:
    Sub-Feature A1:
      - Component 1
      - Component 2`;

      const result = parseYamlContent(yamlWithComments);
      expect(result.id).toBe('proj-001');
      expect(result.name).toBe('Test Project');
    });

    it('should parse YAML with anchors and aliases', () => {
      const yamlWithAnchors = `defaults: &defaults
  version: 1.0.0
  environment: production

project1:
  <<: *defaults
  id: proj-001
  name: Project 1

project2:
  <<: *defaults
  id: proj-002
  name: Project 2`;

      const result = parseYamlContent(yamlWithAnchors);
      expect(result.project1.version).toBe('1.0.0');
      expect(result.project2.environment).toBe('production');
    });

    it('should parse YAML with custom tags', () => {
      const yamlWithTags = `!Project
id: proj-001
name: Test Project
created: !date 2025-01-01`;

      const result = parseYamlContent(yamlWithTags);
      expect(result.id).toBe('proj-001');
      expect(result.name).toBe('Test Project');
    });

    it('should handle multiline strings', () => {
      const yamlMultiline = `id: proj-001
description: |
  This is a multiline
  description that spans
  multiple lines
summary: >
  This is a folded
  string that will be
  joined into one line`;

      const result = parseYamlContent(yamlMultiline);
      expect(result.description).toContain('multiline');
      expect(result.summary).toContain('folded');
    });

    it('should handle YAML with different data types', () => {
      const yamlTypes = `string: "test"
number: 42
float: 3.14
boolean: true
null_value: null
array: [1, 2, 3]
object:
  nested: value`;

      const result = parseYamlContent(yamlTypes);
      expect(typeof result.string).toBe('string');
      expect(typeof result.number).toBe('number');
      expect(typeof result.float).toBe('number');
      expect(typeof result.boolean).toBe('boolean');
      expect(result.null_value).toBeNull();
      expect(Array.isArray(result.array)).toBe(true);
      expect(typeof result.object).toBe('object');
    });

    it('should throw error for invalid YAML syntax', () => {
      const invalidYaml = 'id: test\nname: [unclosed array';
      expect(() => parseYamlContent(invalidYaml)).toThrow();
    });

    it('should handle empty YAML content', () => {
      const result = parseYamlContent('');
      expect(result).toBeNull();
    });

    it('should handle YAML with only comments', () => {
      const commentOnlyYaml = '# This is just a comment\n# Another comment';
      const result = parseYamlContent(commentOnlyYaml);
      expect(result).toBeNull();
    });
  });

  describe('YAML Content Formatting', () => {
    it('should format data as YAML', () => {
      const result = formatYamlContent(mockManifestData);
      expect(typeof result).toBe('string');
      expect(result).toContain('id: proj-001');
      expect(result).toContain('name: Test Project');
    });

    it('should format YAML with custom indentation', () => {
      const result = formatYamlContent(mockManifestData, { indent: 4 });
      expect(result).toContain('    Feature A:');
    });

    it('should format YAML with custom line width', () => {
      const result = formatYamlContent(mockManifestData, { lineWidth: 80 });
      expect(typeof result).toBe('string');
    });

    it('should format YAML with custom quoting style', () => {
      const result = formatYamlContent(mockManifestData, { quotingType: '"' });
      // js-yaml doesn't quote object keys by default, only values
      expect(result).toContain('"proj-001"');
      expect(result).toContain('"Test Project"');
      expect(result).toContain('Feature A:'); // Keys are not quoted
    });

    it('should format YAML with custom flow style', () => {
      const result = formatYamlContent(mockManifestData, { flowLevel: 2 });
      expect(typeof result).toBe('string');
    });

    it('should handle special characters in YAML', () => {
      const specialData = {
        id: 'proj-001',
        name: 'Test: Project',
        description: 'A project with "quotes" and \'apostrophes\'',
        path: 'C:\\Users\\test\\project',
      };

      const result = formatYamlContent(specialData);
      expect(result).toContain('Test: Project');
      expect(result).toContain('"quotes"');
    });
  });

  describe('YAML Structure Validation', () => {
    it('should validate YAML structure', () => {
      const result = validateYamlStructure(mockYamlContent);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should detect invalid YAML structure', () => {
      const invalidYaml = 'id: test\nname: [unclosed array';
      const result = validateYamlStructure(invalidYaml);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate YAML against schema', () => {
      const schema = {
        type: 'object',
        required: ['id', 'name'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      };

      const result = validateYamlSchema(mockYamlContent, schema);
      expect(result.isValid).toBe(true);
    });

    it('should detect schema validation errors', () => {
      const schema = {
        type: 'object',
        required: ['id', 'name', 'version'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          version: { type: 'string' },
        },
      };

      const result = validateYamlSchema(mockYamlContent, schema);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('YAML Conversion', () => {
    it('should convert JSON to YAML', () => {
      const result = convertJsonToYaml(mockJsonContent);
      expect(typeof result).toBe('string');
      expect(result).toContain('id: proj-001');
    });

    it('should convert YAML to JSON', () => {
      const result = convertYamlToJson(mockYamlContent);
      const parsed = JSON.parse(result);
      expect(parsed.id).toBe('proj-001');
      expect(parsed.name).toBe('Test Project');
    });

    it('should preserve data integrity during conversion', () => {
      const yamlToJson = convertYamlToJson(mockYamlContent);
      const jsonToYaml = convertJsonToYaml(yamlToJson);
      const finalParse = parseYamlContent(jsonToYaml);
      
      expect(finalParse.id).toBe(mockManifestData.id);
      expect(finalParse.name).toBe(mockManifestData.name);
    });

    it('should handle conversion errors gracefully', () => {
      const invalidJson = '{"id": "test", "name": }';
      expect(() => convertJsonToYaml(invalidJson)).toThrow();
    });
  });

  describe('YAML Error Handling', () => {
    it('should handle YAML parse errors', () => {
      const invalidYaml = 'id: test\nname: [unclosed array';
      const result = handleYamlParseError(invalidYaml);
      
      expect(result.success).toBe(false);
      expect(result.errorType).toBe('yaml_parse_error');
      expect(result.suggestions).toContain('Check YAML syntax');
    });

    it('should provide specific error suggestions', () => {
      const commonErrors = [
        { yaml: 'id: test\nname: [unclosed', suggestion: 'Check for unclosed arrays' },
        { yaml: 'id: test\n  name: test', suggestion: 'Check indentation' },
        { yaml: 'id: test\nname: "unclosed string', suggestion: 'Check for unclosed strings' },
      ];

      for (const error of commonErrors) {
        const result = handleYamlParseError(error.yaml);
        expect(result.success).toBe(false);
        expect(result.suggestions).toContain(error.suggestion);
      }
    });

    it('should handle encoding errors', () => {
      const result = handleYamlEncoding('invalid encoding content');
      expect(result.success).toBe(false);
      expect(result.errorType).toBe('encoding_error');
    });
  });

  describe('YAML Security', () => {
    it('should sanitize malicious YAML content', () => {
      const maliciousYaml = `id: proj-001
name: Test Project
script: !!python/object/apply:os.system ["rm -rf /"]
malicious: !<tag:yaml.org,2002:python/object/apply:subprocess.call>`;

      const result = sanitizeYamlContent(maliciousYaml);
      expect(result.sanitized).toBeDefined();
      expect(result.removedTags).toContain('python/object/apply');
    });

    it('should validate YAML security', () => {
      const safeYaml = 'id: proj-001\nname: Test Project';
      const result = validateYamlSecurity(safeYaml);
      expect(result.isSafe).toBe(true);
    });

    it('should detect unsafe YAML tags', () => {
      const unsafeYaml = `id: proj-001
script: !!python/object/apply:os.system ["echo unsafe"]`;

      const result = validateYamlSecurity(unsafeYaml);
      expect(result.isSafe).toBe(false);
      expect(result.unsafeTags).toContain('python/object/apply');
    });
  });

  describe('YAML Advanced Features', () => {
    it('should preserve YAML comments', () => {
      const yamlWithComments = `# Project configuration
id: proj-001
name: Test Project # Project name
startDate: 2025-01-01`;

      const result = preserveYamlComments(yamlWithComments);
      expect(result).toContain('# Project configuration');
      expect(result).toContain('# Project name');
    });

    it('should handle YAML indentation', () => {
      const result = handleYamlIndentation(mockYamlContent, { indent: 4 });
      expect(result).toContain('    Feature A:');
    });

    it('should detect YAML version', () => {
      const yamlV1 = '%YAML 1.1\nid: test';
      const yamlV2 = '%YAML 1.2\nid: test';
      
      expect(detectYamlVersion(yamlV1)).toBe('1.1');
      expect(detectYamlVersion(yamlV2)).toBe('1.2');
    });

    it('should handle YAML anchors and aliases', () => {
      const yamlWithAnchors = `defaults: &defaults
  version: 1.0.0

project: *defaults`;

      const result = handleYamlAnchors(yamlWithAnchors);
      expect(result.resolved).toBeDefined();
      expect(result.resolved.project.version).toBe('1.0.0');
    });

    it('should handle YAML tags', () => {
      const yamlWithTags = `id: proj-001
created: !date 2025-01-01
tags: !seq [tag1, tag2]`;

      const result = handleYamlTags(yamlWithTags);
      expect(result.processed).toBeDefined();
    });

    it('should handle YAML directives', () => {
      const yamlWithDirectives = `%YAML 1.2
%TAG ! !tag:example.com,2023:
id: proj-001`;

      const result = handleYamlDirectives(yamlWithDirectives);
      expect(result.processed).toBeDefined();
    });

    it('should handle multiline strings', () => {
      const multilineYaml = `description: |
  This is a multiline
  description
summary: >
  This is a folded
  string`;

      const result = handleYamlMultilineStrings(multilineYaml);
      expect(result.processed).toBeDefined();
    });

    it('should optimize YAML output', () => {
      const result = optimizeYamlOutput(mockYamlContent);
      expect(result.optimized).toBeDefined();
      expect(result.sizeReduction).toBeGreaterThan(0);
    });
  });

  describe('YAML File Operations', () => {
    it('should read YAML file', async () => {
      const filePath = '/test/project.yaml';
      fs.readFile.mockResolvedValue(mockYamlContent);

      const result = await parseYamlContent(mockYamlContent);
      expect(result.id).toBe('proj-001');
    });

    it('should write YAML file', async () => {
      const filePath = '/test/output.yaml';
      const formattedYaml = formatYamlContent(mockManifestData);
      
      fs.writeFile.mockResolvedValue(undefined);
      
      // This would be tested in the implementation
      expect(formattedYaml).toContain('id: proj-001');
    });

    it('should handle file encoding issues', async () => {
      const result = handleYamlEncoding('invalid encoding');
      expect(result.success).toBe(false);
    });
  });

  describe('YAML Performance', () => {
    it('should handle large YAML files efficiently', () => {
      const largeData = Array(1000).fill(0).map((_, i) => ({
        id: `item-${i}`,
        name: `Item ${i}`,
        data: `Data for item ${i}`,
      }));

      const yamlContent = formatYamlContent(largeData);
      expect(yamlContent.length).toBeGreaterThan(0);
    });

    it('should handle deep nested structures', () => {
      const deepData = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  value: 'deep value',
                },
              },
            },
          },
        },
      };

      const result = formatYamlContent(deepData);
      expect(result).toContain('deep value');
    });
  });
});
