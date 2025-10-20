const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const fs = require('fs');
const path = require('path');

describe('JSON Schema Validation', () => {
  let ajv;
  let projectSchema;
  let testStrategySchema;
  let testPlanSchema;
  let testCharterSchema;
  let testSessionSchema;
  let testReportSchema;
  let testSuiteSchema;
  let testCaseSchema;
  let testStatusReportSchema;

  beforeEach(() => {
    ajv = new Ajv({ allErrors: true });
    addFormats(ajv);

    // TDD Green phase: Load schemas from files (implemented in task 2.2)
    const schemasDir = path.join(__dirname, '../../schemas');

    projectSchema = JSON.parse(
      fs.readFileSync(path.join(schemasDir, 'project-schema.json'), 'utf8'),
    );
    testStrategySchema = JSON.parse(
      fs.readFileSync(
        path.join(schemasDir, 'test-strategy-schema.json'),
        'utf8',
      ),
    );
    testPlanSchema = JSON.parse(
      fs.readFileSync(path.join(schemasDir, 'test-plan-schema.json'), 'utf8'),
    );
    testCharterSchema = JSON.parse(
      fs.readFileSync(
        path.join(schemasDir, 'test-charter-schema.json'),
        'utf8',
      ),
    );
    testSessionSchema = JSON.parse(
      fs.readFileSync(
        path.join(schemasDir, 'test-session-schema.json'),
        'utf8',
      ),
    );
    testReportSchema = JSON.parse(
      fs.readFileSync(path.join(schemasDir, 'test-report-schema.json'), 'utf8'),
    );
    testSuiteSchema = JSON.parse(
      fs.readFileSync(path.join(schemasDir, 'test-suite-schema.json'), 'utf8'),
    );
    testCaseSchema = JSON.parse(
      fs.readFileSync(path.join(schemasDir, 'test-case-schema.json'), 'utf8'),
    );
    testStatusReportSchema = JSON.parse(
      fs.readFileSync(
        path.join(schemasDir, 'test-status-report-schema.json'),
        'utf8',
      ),
    );
  });

  describe('Project Schema', () => {
    it('should validate a valid project with all required fields', () => {
      const validProject = {
        id: 'proj-001',
        name: 'Test Project Alpha',
        startDate: '2025-01-01',
        areaHierarchy: {
          Authentication: {
            Login: ['Username validation', 'Password validation'],
            Logout: ['Session cleanup'],
          },
          Dashboard: {
            Overview: ['Data display', 'Charts'],
          },
        },
        description: 'A comprehensive test project',
        status: 'active',
      };

      const validate = ajv.compile(projectSchema);
      const isValid = validate(validProject);

      expect(isValid).toBe(true);
      if (!isValid) {
        console.log('Validation errors:', validate.errors);
      }
    });

    it('should reject project missing required name field', () => {
      const invalidProject = {
        id: 'proj-001',
        startDate: '2025-01-01',
        areaHierarchy: {},
      };

      const validate = ajv.compile(projectSchema);
      const isValid = validate(invalidProject);

      expect(isValid).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({
          keyword: 'required',
          message: expect.stringContaining("required property 'name'"),
        }),
      );
    });

    it('should reject project with invalid date format', () => {
      const invalidProject = {
        id: 'proj-001',
        name: 'Test Project',
        startDate: 'invalid-date',
        areaHierarchy: {},
      };

      const validate = ajv.compile(projectSchema);
      const isValid = validate(invalidProject);

      expect(isValid).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({
          instancePath: expect.stringContaining('startDate'),
          message: expect.stringContaining('format'),
        }),
      );
    });

    it('should reject project with invalid area hierarchy structure', () => {
      const invalidProject = {
        id: 'proj-001',
        name: 'Test Project',
        startDate: '2025-01-01',
        areaHierarchy: 'invalid-hierarchy',
      };

      const validate = ajv.compile(projectSchema);
      const isValid = validate(invalidProject);

      expect(isValid).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({
          instancePath: '/areaHierarchy',
          keyword: 'type',
          message: expect.stringContaining('must be object'),
        }),
      );
    });
  });

  describe('Test Strategy Schema', () => {
    it('should validate a valid test strategy', () => {
      const validStrategy = {
        id: 'strategy-001',
        projectId: 'proj-001',
        name: 'Comprehensive Testing Strategy',
        description: 'End-to-end testing approach',
        objectives: [
          'Functional testing',
          'Performance testing',
          'Security testing',
        ],
        scope: 'Full application',
        approach: 'Risk-based testing',
        deliverables: ['Test plans', 'Test cases', 'Test reports'],
      };

      const validate = ajv.compile(testStrategySchema);
      const isValid = validate(validStrategy);

      expect(isValid).toBe(true);
    });

    it('should reject strategy missing required projectId', () => {
      const invalidStrategy = {
        id: 'strategy-001',
        name: 'Test Strategy',
        description: 'Strategy description',
      };

      const validate = ajv.compile(testStrategySchema);
      const isValid = validate(invalidStrategy);

      expect(isValid).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({
          keyword: 'required',
          message: expect.stringContaining("required property 'projectId'"),
        }),
      );
    });
  });

  describe('Test Plan Schema', () => {
    it('should validate a valid test plan', () => {
      const validPlan = {
        id: 'plan-001',
        projectId: 'proj-001',
        strategyId: 'strategy-001',
        name: 'Authentication Test Plan',
        description: 'Testing authentication functionality',
        scope: 'Login and logout features',
        testLevel: 'System',
        estimatedEffort: '40 hours',
        dependencies: ['User management module'],
        risks: ['Session timeout issues'],
      };

      const validate = ajv.compile(testPlanSchema);
      const isValid = validate(validPlan);

      expect(isValid).toBe(true);
    });

    it('should reject plan with invalid test level', () => {
      const invalidPlan = {
        id: 'plan-001',
        projectId: 'proj-001',
        name: 'Test Plan',
        testLevel: 'invalid-level',
      };

      const validate = ajv.compile(testPlanSchema);
      const isValid = validate(invalidPlan);

      expect(isValid).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({
          instancePath: '/testLevel',
          keyword: 'enum',
          message: expect.stringContaining(
            'must be equal to one of the allowed values',
          ),
        }),
      );
    });
  });

  describe('Test Charter Schema', () => {
    it('should validate a valid test charter', () => {
      const validCharter = {
        id: 'charter-001',
        projectId: 'proj-001',
        planId: 'plan-001',
        name: 'Login Functionality Charter',
        mission: 'Verify login functionality works correctly',
        scope: 'Username and password validation',
        deliverables: ['Login test cases', 'Login test results'],
        documents: ['requirements.md', 'design-spec.md'],
        notes: 'Focus on edge cases and error handling',
      };

      const validate = ajv.compile(testCharterSchema);
      const isValid = validate(validCharter);

      expect(isValid).toBe(true);
    });

    it('should reject charter missing required mission field', () => {
      const invalidCharter = {
        id: 'charter-001',
        projectId: 'proj-001',
        name: 'Test Charter',
      };

      const validate = ajv.compile(testCharterSchema);
      const isValid = validate(invalidCharter);

      expect(isValid).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({
          keyword: 'required',
          message: expect.stringContaining("required property 'mission'"),
        }),
      );
    });
  });

  describe('Test Session Schema', () => {
    it('should validate a valid test session', () => {
      const validSession = {
        id: 'session-001',
        projectId: 'proj-001',
        charterId: 'charter-001',
        date: '2025-01-15',
        startTime: '09:00:00',
        endTime: '17:00:00',
        duration: 480,
        executor: 'John Doe',
        productRevision: 'v1.2.3',
        environment: 'Test Environment',
        notes: 'Session focused on login testing',
        status: 'completed',
      };

      const validate = ajv.compile(testSessionSchema);
      const isValid = validate(validSession);

      expect(isValid).toBe(true);
    });

    it('should reject session with invalid time format', () => {
      const invalidSession = {
        id: 'session-001',
        projectId: 'proj-001',
        charterId: 'charter-001',
        date: '2025-01-15',
        startTime: 'invalid-time',
        executor: 'John Doe',
      };

      const validate = ajv.compile(testSessionSchema);
      const isValid = validate(invalidSession);

      expect(isValid).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({
          instancePath: '/startTime',
          keyword: 'pattern',
          message: expect.stringContaining('must match pattern'),
        }),
      );
    });

    it('should reject session with invalid duration type', () => {
      const invalidSession = {
        id: 'session-001',
        projectId: 'proj-001',
        charterId: 'charter-001',
        date: '2025-01-15',
        duration: 'invalid-duration',
        executor: 'John Doe',
      };

      const validate = ajv.compile(testSessionSchema);
      const isValid = validate(invalidSession);

      expect(isValid).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({
          instancePath: '/duration',
          keyword: 'type',
          message: expect.stringContaining('must be integer'),
        }),
      );
    });
  });

  describe('Test Report Schema', () => {
    it('should validate a valid test report', () => {
      const validReport = {
        id: 'report-001',
        projectId: 'proj-001',
        sessionId: 'session-001',
        charterId: 'charter-001',
        title: 'Login Testing Report',
        summary: 'Comprehensive testing of login functionality',
        findings: [
          {
            type: 'bug',
            severity: 'high',
            description: 'Login fails with special characters',
            steps: [
              'Enter username with @ symbol',
              'Enter password',
              'Click login',
            ],
            expectedResult: 'Login should succeed',
            actualResult: 'Login fails with error message',
          },
        ],
        recommendations: [
          'Fix special character handling',
          'Add input validation',
        ],
        attachments: ['screenshot1.png', 'logfile.txt'],
        createdBy: 'John Doe',
        createdAt: '2025-01-15T17:30:00Z',
      };

      const validate = ajv.compile(testReportSchema);
      const isValid = validate(validReport);

      expect(isValid).toBe(true);
    });

    it('should reject report missing required title', () => {
      const invalidReport = {
        id: 'report-001',
        projectId: 'proj-001',
        sessionId: 'session-001',
        summary: 'Report summary',
      };

      const validate = ajv.compile(testReportSchema);
      const isValid = validate(invalidReport);

      expect(isValid).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({
          keyword: 'required',
          message: expect.stringContaining("required property 'title'"),
        }),
      );
    });

    it('should reject report with invalid finding severity', () => {
      const invalidReport = {
        id: 'report-001',
        projectId: 'proj-001',
        title: 'Test Report',
        findings: [
          {
            type: 'bug',
            severity: 'invalid-severity',
            description: 'Bug description',
          },
        ],
      };

      const validate = ajv.compile(testReportSchema);
      const isValid = validate(invalidReport);

      expect(isValid).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({
          instancePath: '/findings/0/severity',
          keyword: 'enum',
          message: expect.stringContaining(
            'must be equal to one of the allowed values',
          ),
        }),
      );
    });
  });

  describe('Test Suite Schema', () => {
    it('should validate a valid test suite', () => {
      const validSuite = {
        id: 'suite-001',
        projectId: 'proj-001',
        charterId: 'charter-001',
        name: 'Login Test Suite',
        description: 'Collection of login-related test cases',
        testCases: ['case-001', 'case-002', 'case-003'],
        prerequisites: ['User account exists', 'Application is running'],
        setup: 'Navigate to login page',
        teardown: 'Logout and clear session',
      };

      const validate = ajv.compile(testSuiteSchema);
      const isValid = validate(validSuite);

      expect(isValid).toBe(true);
    });

    it('should reject suite with invalid test case references', () => {
      const invalidSuite = {
        id: 'suite-001',
        projectId: 'proj-001',
        name: 'Test Suite',
        testCases: 'invalid-array',
      };

      const validate = ajv.compile(testSuiteSchema);
      const isValid = validate(invalidSuite);

      expect(isValid).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({
          instancePath: '/testCases',
          keyword: 'type',
          message: expect.stringContaining('must be array'),
        }),
      );
    });
  });

  describe('Test Case Schema', () => {
    it('should validate a valid test case', () => {
      const validCase = {
        id: 'case-001',
        projectId: 'proj-001',
        charterId: 'charter-001',
        suiteId: 'suite-001',
        name: 'Valid Login Test',
        description: 'Test login with valid credentials',
        steps: [
          {
            step: 1,
            action: 'Navigate to login page',
            expected: 'Login page loads',
          },
          {
            step: 2,
            action: 'Enter valid username',
            expected: 'Username field populated',
          },
          {
            step: 3,
            action: 'Enter valid password',
            expected: 'Password field populated',
          },
          {
            step: 4,
            action: 'Click login button',
            expected: 'User logged in successfully',
          },
        ],
        priority: 'high',
        category: 'functional',
        tags: ['login', 'authentication', 'smoke'],
      };

      const validate = ajv.compile(testCaseSchema);
      const isValid = validate(validCase);

      expect(isValid).toBe(true);
    });

    it('should reject case with invalid priority', () => {
      const invalidCase = {
        id: 'case-001',
        projectId: 'proj-001',
        name: 'Test Case',
        priority: 'invalid-priority',
      };

      const validate = ajv.compile(testCaseSchema);
      const isValid = validate(invalidCase);

      expect(isValid).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({
          instancePath: '/priority',
          keyword: 'enum',
          message: expect.stringContaining(
            'must be equal to one of the allowed values',
          ),
        }),
      );
    });
  });

  describe('Test Status Report Schema', () => {
    it('should validate a valid test status report', () => {
      const validStatusReport = {
        id: 'status-report-001',
        projectId: 'proj-001',
        title: 'Weekly Test Status Report',
        period: {
          startDate: '2025-01-01',
          endDate: '2025-01-07',
        },
        summary: {
          totalTestCases: 150,
          executed: 120,
          passed: 110,
          failed: 10,
          blocked: 5,
          notExecuted: 30,
        },
        keyFindings: [
          'Critical bug found in payment processing',
          'Performance issues identified in dashboard',
        ],
        risks: [
          'Release date may be delayed due to critical bugs',
          'Resource constraints affecting test execution',
        ],
        nextSteps: [
          'Fix critical bugs by end of week',
          'Increase test coverage for payment module',
        ],
        createdBy: 'Test Manager',
        createdAt: '2025-01-07T18:00:00Z',
      };

      const validate = ajv.compile(testStatusReportSchema);
      const isValid = validate(validStatusReport);

      expect(isValid).toBe(true);
    });

    it('should reject status report with invalid summary numbers', () => {
      const invalidStatusReport = {
        id: 'status-report-001',
        projectId: 'proj-001',
        title: 'Status Report',
        summary: {
          totalTestCases: 'invalid-number',
          executed: 120,
        },
      };

      const validate = ajv.compile(testStatusReportSchema);
      const isValid = validate(invalidStatusReport);

      expect(isValid).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({
          instancePath: '/summary/totalTestCases',
          keyword: 'type',
          message: expect.stringContaining('must be integer'),
        }),
      );
    });
  });
});
