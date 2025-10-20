const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const fs = require('fs');
const path = require('path');

// Import the data models (these will be created in the next task)
const Project = require('./Project');
const TestStrategy = require('./TestStrategy');
const TestPlan = require('./TestPlan');
const TestCharter = require('./TestCharter');
const TestSession = require('./TestSession');
const TestReport = require('./TestReport');

describe('Data Models', () => {
  let ajv;
  let projectSchema;
  let testStrategySchema;
  let testPlanSchema;
  let testCharterSchema;
  let testSessionSchema;
  let testReportSchema;

  beforeEach(() => {
    ajv = new Ajv({ allErrors: true });
    addFormats(ajv);

    const schemasDir = path.join(__dirname, '../../schemas');

    projectSchema = JSON.parse(fs.readFileSync(path.join(schemasDir, 'project-schema.json'), 'utf8'));
    testStrategySchema = JSON.parse(fs.readFileSync(path.join(schemasDir, 'test-strategy-schema.json'), 'utf8'));
    testPlanSchema = JSON.parse(fs.readFileSync(path.join(schemasDir, 'test-plan-schema.json'), 'utf8'));
    testCharterSchema = JSON.parse(fs.readFileSync(path.join(schemasDir, 'test-charter-schema.json'), 'utf8'));
    testSessionSchema = JSON.parse(fs.readFileSync(path.join(schemasDir, 'test-session-schema.json'), 'utf8'));
    testReportSchema = JSON.parse(fs.readFileSync(path.join(schemasDir, 'test-report-schema.json'), 'utf8'));

    ajv.addSchema(projectSchema, 'project');
    ajv.addSchema(testStrategySchema, 'testStrategy');
    ajv.addSchema(testPlanSchema, 'testPlan');
    ajv.addSchema(testCharterSchema, 'testCharter');
    ajv.addSchema(testSessionSchema, 'testSession');
    ajv.addSchema(testReportSchema, 'testReport');
  });

  describe('Project Model', () => {
    it('should create a valid Project instance with all required fields', () => {
      const projectData = {
        id: 'proj-001',
        name: 'My Test Project',
        startDate: '2025-01-01',
        areaHierarchy: {
          'Feature A': {
            'Sub-Feature A1': ['Component 1', 'Component 2'],
            'Sub-Feature A2': ['Component 3'],
          },
          'Feature B': {
            'Sub-Feature B1': ['Component 4'],
          },
        },
      };

      const project = new Project(projectData);
      
      expect(project.id).toBe('proj-001');
      expect(project.name).toBe('My Test Project');
      expect(project.startDate).toBe('2025-01-01');
      expect(project.areaHierarchy).toEqual(projectData.areaHierarchy);
      expect(project.isValid()).toBe(true);
    });

    it('should create a Project instance with optional fields', () => {
      const projectData = {
        id: 'proj-002',
        name: 'Complete Project',
        startDate: '2025-01-01',
        areaHierarchy: { 'Feature A': { 'Sub-Feature A1': ['Component 1'] } },
        description: 'A comprehensive test project',
        endDate: '2025-12-31',
        status: 'active',
        version: '1.0.0',
        tags: ['testing', 'automation'],
        metadata: { owner: 'Test Team', priority: 'high' },
      };

      const project = new Project(projectData);
      
      expect(project.description).toBe('A comprehensive test project');
      expect(project.endDate).toBe('2025-12-31');
      expect(project.status).toBe('active');
      expect(project.version).toBe('1.0.0');
      expect(project.tags).toEqual(['testing', 'automation']);
      expect(project.metadata).toEqual({ owner: 'Test Team', priority: 'high' });
      expect(project.isValid()).toBe(true);
    });

    it('should reject Project with missing required fields', () => {
      const invalidData = {
        id: 'proj-001',
        // Missing name
        startDate: '2025-01-01',
        areaHierarchy: { 'Feature A': { 'Sub-Feature A1': ['Component 1'] } },
      };

      const project = new Project(invalidData);
      
      expect(project.isValid()).toBe(false);
      expect(project.getValidationErrors()).toContainEqual(
        expect.objectContaining({
          keyword: 'required',
          message: expect.stringContaining('required property \'name\''),
        }),
      );
    });

    it('should reject Project with invalid date format', () => {
      const invalidData = {
        id: 'proj-001',
        name: 'My Test Project',
        startDate: '2025/01/01', // Invalid format
        areaHierarchy: { 'Feature A': { 'Sub-Feature A1': ['Component 1'] } },
      };

      const project = new Project(invalidData);
      
      expect(project.isValid()).toBe(false);
      expect(project.getValidationErrors()).toContainEqual(
        expect.objectContaining({
          instancePath: '/startDate',
          keyword: 'format',
          message: expect.stringContaining('must match format "date"'),
        }),
      );
    });

    it('should reject Project with invalid status', () => {
      const invalidData = {
        id: 'proj-001',
        name: 'My Test Project',
        startDate: '2025-01-01',
        areaHierarchy: { 'Feature A': { 'Sub-Feature A1': ['Component 1'] } },
        status: 'invalid-status', // Invalid enum value
      };

      const project = new Project(invalidData);
      
      expect(project.isValid()).toBe(false);
      expect(project.getValidationErrors()).toContainEqual(
        expect.objectContaining({
          instancePath: '/status',
          keyword: 'enum',
          message: expect.stringContaining('must be equal to one of the allowed values'),
        }),
      );
    });

    it('should convert Project to JSON object', () => {
      const projectData = {
        id: 'proj-001',
        name: 'My Test Project',
        startDate: '2025-01-01',
        areaHierarchy: { 'Feature A': { 'Sub-Feature A1': ['Component 1'] } },
      };

      const project = new Project(projectData);
      const json = project.toJSON();
      
      expect(json).toEqual(projectData);
    });

    it('should create Project from JSON object', () => {
      const projectData = {
        id: 'proj-001',
        name: 'My Test Project',
        startDate: '2025-01-01',
        areaHierarchy: { 'Feature A': { 'Sub-Feature A1': ['Component 1'] } },
      };

      const project = Project.fromJSON(projectData);
      
      expect(project).toBeInstanceOf(Project);
      expect(project.id).toBe('proj-001');
      expect(project.name).toBe('My Test Project');
    });
  });

  describe('TestStrategy Model', () => {
    it('should create a valid TestStrategy instance with all required fields', () => {
      const strategyData = {
        id: 'strategy-001',
        projectId: 'proj-001',
        name: 'Overall Testing Strategy',
        description: 'Strategy for comprehensive testing of the project.',
      };

      const strategy = new TestStrategy(strategyData);
      
      expect(strategy.id).toBe('strategy-001');
      expect(strategy.projectId).toBe('proj-001');
      expect(strategy.name).toBe('Overall Testing Strategy');
      expect(strategy.description).toBe('Strategy for comprehensive testing of the project.');
      expect(strategy.isValid()).toBe(true);
    });

    it('should create a TestStrategy instance with optional fields', () => {
      const strategyData = {
        id: 'strategy-002',
        projectId: 'proj-001',
        name: 'Complete Strategy',
        description: 'Comprehensive testing strategy.',
        objectives: ['Ensure quality', 'Meet requirements'],
        scope: 'All features',
        approach: 'Agile testing',
        risks: ['Time constraints', 'Resource limitations'],
        dependencies: ['Requirements document', 'Test environment'],
        status: 'approved',
        version: '1.0.0',
        metadata: { author: 'Test Lead', reviewDate: '2025-02-01' },
      };

      const strategy = new TestStrategy(strategyData);
      
      expect(strategy.objectives).toEqual(['Ensure quality', 'Meet requirements']);
      expect(strategy.scope).toBe('All features');
      expect(strategy.approach).toBe('Agile testing');
      expect(strategy.risks).toEqual(['Time constraints', 'Resource limitations']);
      expect(strategy.dependencies).toEqual(['Requirements document', 'Test environment']);
      expect(strategy.status).toBe('approved');
      expect(strategy.version).toBe('1.0.0');
      expect(strategy.metadata).toEqual({ author: 'Test Lead', reviewDate: '2025-02-01' });
      expect(strategy.isValid()).toBe(true);
    });

    it('should reject TestStrategy with missing required projectId', () => {
      const invalidData = {
        id: 'strategy-001',
        // Missing projectId
        name: 'Overall Testing Strategy',
        description: 'Strategy for comprehensive testing of the project.',
      };

      const strategy = new TestStrategy(invalidData);
      
      expect(strategy.isValid()).toBe(false);
      expect(strategy.getValidationErrors()).toContainEqual(
        expect.objectContaining({
          keyword: 'required',
          message: expect.stringContaining('required property \'projectId\''),
        }),
      );
    });

    it('should reject TestStrategy with invalid status', () => {
      const invalidData = {
        id: 'strategy-001',
        projectId: 'proj-001',
        name: 'Overall Testing Strategy',
        description: 'Strategy for comprehensive testing of the project.',
        status: 'invalid-status', // Invalid enum value
      };

      const strategy = new TestStrategy(invalidData);
      
      expect(strategy.isValid()).toBe(false);
      expect(strategy.getValidationErrors()).toContainEqual(
        expect.objectContaining({
          instancePath: '/status',
          keyword: 'enum',
          message: expect.stringContaining('must be equal to one of the allowed values'),
        }),
      );
    });

    it('should convert TestStrategy to JSON object', () => {
      const strategyData = {
        id: 'strategy-001',
        projectId: 'proj-001',
        name: 'Overall Testing Strategy',
        description: 'Strategy for comprehensive testing of the project.',
      };

      const strategy = new TestStrategy(strategyData);
      const json = strategy.toJSON();
      
      expect(json).toEqual(strategyData);
    });

    it('should create TestStrategy from JSON object', () => {
      const strategyData = {
        id: 'strategy-001',
        projectId: 'proj-001',
        name: 'Overall Testing Strategy',
        description: 'Strategy for comprehensive testing of the project.',
      };

      const strategy = TestStrategy.fromJSON(strategyData);
      
      expect(strategy).toBeInstanceOf(TestStrategy);
      expect(strategy.id).toBe('strategy-001');
      expect(strategy.projectId).toBe('proj-001');
    });
  });

  describe('TestPlan Model', () => {
    it('should create a valid TestPlan instance with all required fields', () => {
      const planData = {
        id: 'plan-001',
        projectId: 'proj-001',
        name: 'Feature A Test Plan',
        description: 'Detailed plan for testing Feature A.',
        testLevel: 'System',
      };

      const plan = new TestPlan(planData);
      
      expect(plan.id).toBe('plan-001');
      expect(plan.projectId).toBe('proj-001');
      expect(plan.name).toBe('Feature A Test Plan');
      expect(plan.description).toBe('Detailed plan for testing Feature A.');
      expect(plan.testLevel).toBe('System');
      expect(plan.isValid()).toBe(true);
    });

    it('should create a TestPlan instance with optional fields', () => {
      const planData = {
        id: 'plan-002',
        projectId: 'proj-001',
        name: 'Complete Test Plan',
        description: 'Comprehensive test plan.',
        testLevel: 'Integration',
        strategyId: 'strategy-001',
        environment: 'Staging',
        startDate: '2025-01-10',
        endDate: '2025-01-20',
        effortEstimation: { hours: 40, days: 5 },
        status: 'approved',
        version: '1.0.0',
        metadata: { author: 'Test Manager', reviewDate: '2025-01-05' },
      };

      const plan = new TestPlan(planData);
      
      expect(plan.strategyId).toBe('strategy-001');
      expect(plan.environment).toBe('Staging');
      expect(plan.startDate).toBe('2025-01-10');
      expect(plan.endDate).toBe('2025-01-20');
      expect(plan.effortEstimation).toEqual({ hours: 40, days: 5 });
      expect(plan.status).toBe('approved');
      expect(plan.version).toBe('1.0.0');
      expect(plan.metadata).toEqual({ author: 'Test Manager', reviewDate: '2025-01-05' });
      expect(plan.isValid()).toBe(true);
    });

    it('should reject TestPlan with invalid test level', () => {
      const invalidData = {
        id: 'plan-001',
        projectId: 'proj-001',
        name: 'Feature A Test Plan',
        description: 'Detailed plan for testing Feature A.',
        testLevel: 'InvalidLevel', // Invalid enum value
      };

      const plan = new TestPlan(invalidData);
      
      expect(plan.isValid()).toBe(false);
      expect(plan.getValidationErrors()).toContainEqual(
        expect.objectContaining({
          instancePath: '/testLevel',
          keyword: 'enum',
          message: expect.stringContaining('must be equal to one of the allowed values'),
        }),
      );
    });

    it('should convert TestPlan to JSON object', () => {
      const planData = {
        id: 'plan-001',
        projectId: 'proj-001',
        name: 'Feature A Test Plan',
        description: 'Detailed plan for testing Feature A.',
        testLevel: 'System',
      };

      const plan = new TestPlan(planData);
      const json = plan.toJSON();
      
      expect(json).toEqual(planData);
    });

    it('should create TestPlan from JSON object', () => {
      const planData = {
        id: 'plan-001',
        projectId: 'proj-001',
        name: 'Feature A Test Plan',
        description: 'Detailed plan for testing Feature A.',
        testLevel: 'System',
      };

      const plan = TestPlan.fromJSON(planData);
      
      expect(plan).toBeInstanceOf(TestPlan);
      expect(plan.id).toBe('plan-001');
      expect(plan.projectId).toBe('proj-001');
    });
  });

  describe('TestCharter Model', () => {
    it('should create a valid TestCharter instance with all required fields', () => {
      const charterData = {
        id: 'charter-001',
        projectId: 'proj-001',
        name: 'Explore User Login',
        mission: 'Explore the user login functionality to discover critical defects and usability issues.',
      };

      const charter = new TestCharter(charterData);
      
      expect(charter.id).toBe('charter-001');
      expect(charter.projectId).toBe('proj-001');
      expect(charter.name).toBe('Explore User Login');
      expect(charter.mission).toBe('Explore the user login functionality to discover critical defects and usability issues.');
      expect(charter.isValid()).toBe(true);
    });

    it('should create a TestCharter instance with optional fields', () => {
      const charterData = {
        id: 'charter-002',
        projectId: 'proj-001',
        name: 'Complete Charter',
        mission: 'Comprehensive exploration mission.',
        testPlanId: 'plan-001',
        tester: 'John Doe',
        date: '2025-01-15',
        timebox: 90,
        scope: 'Login and authentication features',
        status: 'active',
        documentReferences: ['https://docs.example.com/requirements', 'https://docs.example.com/design'],
        metadata: { priority: 'high', estimatedDefects: 5 },
      };

      const charter = new TestCharter(charterData);
      
      expect(charter.testPlanId).toBe('plan-001');
      expect(charter.tester).toBe('John Doe');
      expect(charter.date).toBe('2025-01-15');
      expect(charter.timebox).toBe(90);
      expect(charter.scope).toBe('Login and authentication features');
      expect(charter.status).toBe('active');
      expect(charter.documentReferences).toEqual(['https://docs.example.com/requirements', 'https://docs.example.com/design']);
      expect(charter.metadata).toEqual({ priority: 'high', estimatedDefects: 5 });
      expect(charter.isValid()).toBe(true);
    });

    it('should reject TestCharter with missing required mission field', () => {
      const invalidData = {
        id: 'charter-001',
        projectId: 'proj-001',
        name: 'Explore User Login',
        // Missing mission
      };

      const charter = new TestCharter(invalidData);
      
      expect(charter.isValid()).toBe(false);
      expect(charter.getValidationErrors()).toContainEqual(
        expect.objectContaining({
          keyword: 'required',
          message: expect.stringContaining('required property \'mission\''),
        }),
      );
    });

    it('should convert TestCharter to JSON object', () => {
      const charterData = {
        id: 'charter-001',
        projectId: 'proj-001',
        name: 'Explore User Login',
        mission: 'Explore the user login functionality to discover critical defects and usability issues.',
      };

      const charter = new TestCharter(charterData);
      const json = charter.toJSON();
      
      expect(json).toEqual(charterData);
    });

    it('should create TestCharter from JSON object', () => {
      const charterData = {
        id: 'charter-001',
        projectId: 'proj-001',
        name: 'Explore User Login',
        mission: 'Explore the user login functionality to discover critical defects and usability issues.',
      };

      const charter = TestCharter.fromJSON(charterData);
      
      expect(charter).toBeInstanceOf(TestCharter);
      expect(charter.id).toBe('charter-001');
      expect(charter.projectId).toBe('proj-001');
    });
  });

  describe('TestSession Model', () => {
    it('should create a valid TestSession instance with all required fields', () => {
      const sessionData = {
        id: 'session-001',
        projectId: 'proj-001',
        charterId: 'charter-001',
        date: '2025-01-15',
        executor: 'John Doe',
      };

      const session = new TestSession(sessionData);
      
      expect(session.id).toBe('session-001');
      expect(session.projectId).toBe('proj-001');
      expect(session.charterId).toBe('charter-001');
      expect(session.date).toBe('2025-01-15');
      expect(session.executor).toBe('John Doe');
      expect(session.isValid()).toBe(true);
    });

    it('should create a TestSession instance with optional fields', () => {
      const sessionData = {
        id: 'session-002',
        projectId: 'proj-001',
        charterId: 'charter-001',
        date: '2025-01-15',
        executor: 'Jane Smith',
        startTime: '10:00:00',
        endTime: '11:30:00',
        duration: 90,
        notes: 'Found a minor UI bug in the login form.',
        status: 'completed',
        environment: 'Staging',
        build: 'v1.2.3',
        metadata: { tools: ['Chrome DevTools', 'Postman'], blockers: 0 },
      };

      const session = new TestSession(sessionData);
      
      expect(session.startTime).toBe('10:00:00');
      expect(session.endTime).toBe('11:30:00');
      expect(session.duration).toBe(90);
      expect(session.notes).toBe('Found a minor UI bug in the login form.');
      expect(session.status).toBe('completed');
      expect(session.environment).toBe('Staging');
      expect(session.build).toBe('v1.2.3');
      expect(session.metadata).toEqual({ tools: ['Chrome DevTools', 'Postman'], blockers: 0 });
      expect(session.isValid()).toBe(true);
    });

    it('should reject TestSession with invalid time format', () => {
      const invalidData = {
        id: 'session-001',
        projectId: 'proj-001',
        charterId: 'charter-001',
        date: '2025-01-15',
        executor: 'John Doe',
        startTime: '10:0:00', // Invalid format
      };

      const session = new TestSession(invalidData);
      
      expect(session.isValid()).toBe(false);
      expect(session.getValidationErrors()).toContainEqual(
        expect.objectContaining({
          instancePath: '/startTime',
          keyword: 'pattern',
          message: expect.stringContaining('must match pattern'),
        }),
      );
    });

    it('should reject TestSession with invalid duration type', () => {
      const invalidData = {
        id: 'session-001',
        projectId: 'proj-001',
        charterId: 'charter-001',
        date: '2025-01-15',
        executor: 'John Doe',
        duration: 'ninety', // Invalid type
      };

      const session = new TestSession(invalidData);
      
      expect(session.isValid()).toBe(false);
      expect(session.getValidationErrors()).toContainEqual(
        expect.objectContaining({
          instancePath: '/duration',
          keyword: 'type',
          message: expect.stringContaining('must be integer'),
        }),
      );
    });

    it('should convert TestSession to JSON object', () => {
      const sessionData = {
        id: 'session-001',
        projectId: 'proj-001',
        charterId: 'charter-001',
        date: '2025-01-15',
        executor: 'John Doe',
      };

      const session = new TestSession(sessionData);
      const json = session.toJSON();
      
      expect(json).toEqual(sessionData);
    });

    it('should create TestSession from JSON object', () => {
      const sessionData = {
        id: 'session-001',
        projectId: 'proj-001',
        charterId: 'charter-001',
        date: '2025-01-15',
        executor: 'John Doe',
      };

      const session = TestSession.fromJSON(sessionData);
      
      expect(session).toBeInstanceOf(TestSession);
      expect(session.id).toBe('session-001');
      expect(session.projectId).toBe('proj-001');
    });
  });

  describe('TestReport Model', () => {
    it('should create a valid TestReport instance with all required fields', () => {
      const reportData = {
        id: 'report-001',
        projectId: 'proj-001',
        title: 'Login Feature Test Report',
        summary: 'Comprehensive report on login feature testing.',
      };

      const report = new TestReport(reportData);
      
      expect(report.id).toBe('report-001');
      expect(report.projectId).toBe('proj-001');
      expect(report.title).toBe('Login Feature Test Report');
      expect(report.summary).toBe('Comprehensive report on login feature testing.');
      expect(report.isValid()).toBe(true);
    });

    it('should create a TestReport instance with optional fields', () => {
      const reportData = {
        id: 'report-002',
        projectId: 'proj-001',
        title: 'Complete Test Report',
        summary: 'Comprehensive test report with findings.',
        sessionId: 'session-001',
        date: '2025-01-20',
        author: 'Jane Doe',
        findings: [
          {
            title: 'UI Glitch',
            description: 'Button alignment issue on mobile devices.',
            severity: 'low',
            status: 'open',
            bugId: 'BUG-123',
          },
          {
            title: 'Performance Issue',
            description: 'Login takes longer than expected.',
            severity: 'medium',
            status: 'investigating',
          },
        ],
        metrics: {
          testCasesExecuted: 50,
          defectsFound: 5,
          timeSpentHours: 8.5,
        },
        status: 'final',
        metadata: { reviewDate: '2025-01-25', approvedBy: 'Test Manager' },
      };

      const report = new TestReport(reportData);
      
      expect(report.sessionId).toBe('session-001');
      expect(report.date).toBe('2025-01-20');
      expect(report.author).toBe('Jane Doe');
      expect(report.findings).toHaveLength(2);
      expect(report.findings[0]).toEqual({
        title: 'UI Glitch',
        description: 'Button alignment issue on mobile devices.',
        severity: 'low',
        status: 'open',
        bugId: 'BUG-123',
      });
      expect(report.metrics).toEqual({
        testCasesExecuted: 50,
        defectsFound: 5,
        timeSpentHours: 8.5,
      });
      expect(report.status).toBe('final');
      expect(report.metadata).toEqual({ reviewDate: '2025-01-25', approvedBy: 'Test Manager' });
      expect(report.isValid()).toBe(true);
    });

    it('should reject TestReport with invalid finding severity', () => {
      const invalidData = {
        id: 'report-001',
        projectId: 'proj-001',
        title: 'Login Feature Test Report',
        summary: 'Comprehensive report on login feature testing.',
        findings: [
          {
            title: 'UI Glitch',
            description: 'Button alignment issue.',
            severity: 'invalid', // Invalid enum value
            status: 'open',
          },
        ],
      };

      const report = new TestReport(invalidData);
      
      expect(report.isValid()).toBe(false);
      expect(report.getValidationErrors()).toContainEqual(
        expect.objectContaining({
          instancePath: '/findings/0/severity',
          keyword: 'enum',
          message: expect.stringContaining('must be equal to one of the allowed values'),
        }),
      );
    });

    it('should convert TestReport to JSON object', () => {
      const reportData = {
        id: 'report-001',
        projectId: 'proj-001',
        title: 'Login Feature Test Report',
        summary: 'Comprehensive report on login feature testing.',
      };

      const report = new TestReport(reportData);
      const json = report.toJSON();
      
      expect(json).toEqual(reportData);
    });

    it('should create TestReport from JSON object', () => {
      const reportData = {
        id: 'report-001',
        projectId: 'proj-001',
        title: 'Login Feature Test Report',
        summary: 'Comprehensive report on login feature testing.',
      };

      const report = TestReport.fromJSON(reportData);
      
      expect(report).toBeInstanceOf(TestReport);
      expect(report.id).toBe('report-001');
      expect(report.projectId).toBe('proj-001');
    });
  });

  describe('Model Factory Methods', () => {
    it('should create Project from manifest file data', () => {
      const manifestData = {
        id: 'proj-001',
        name: 'My Test Project',
        startDate: '2025-01-01',
        areaHierarchy: { 'Feature A': { 'Sub-Feature A1': ['Component 1'] } },
      };

      const project = Project.fromManifest(manifestData);
      
      expect(project).toBeInstanceOf(Project);
      expect(project.id).toBe('proj-001');
      expect(project.name).toBe('My Test Project');
    });

    it('should create TestStrategy from manifest file data', () => {
      const manifestData = {
        id: 'strategy-001',
        projectId: 'proj-001',
        name: 'Overall Testing Strategy',
        description: 'Strategy for comprehensive testing of the project.',
      };

      const strategy = TestStrategy.fromManifest(manifestData);
      
      expect(strategy).toBeInstanceOf(TestStrategy);
      expect(strategy.id).toBe('strategy-001');
      expect(strategy.projectId).toBe('proj-001');
    });

    it('should create TestPlan from manifest file data', () => {
      const manifestData = {
        id: 'plan-001',
        projectId: 'proj-001',
        name: 'Feature A Test Plan',
        description: 'Detailed plan for testing Feature A.',
        testLevel: 'System',
      };

      const plan = TestPlan.fromManifest(manifestData);
      
      expect(plan).toBeInstanceOf(TestPlan);
      expect(plan.id).toBe('plan-001');
      expect(plan.projectId).toBe('proj-001');
    });

    it('should create TestCharter from manifest file data', () => {
      const manifestData = {
        id: 'charter-001',
        projectId: 'proj-001',
        name: 'Explore User Login',
        mission: 'Explore the user login functionality to discover critical defects and usability issues.',
      };

      const charter = TestCharter.fromManifest(manifestData);
      
      expect(charter).toBeInstanceOf(TestCharter);
      expect(charter.id).toBe('charter-001');
      expect(charter.projectId).toBe('proj-001');
    });

    it('should create TestSession from manifest file data', () => {
      const manifestData = {
        id: 'session-001',
        projectId: 'proj-001',
        charterId: 'charter-001',
        date: '2025-01-15',
        executor: 'John Doe',
      };

      const session = TestSession.fromManifest(manifestData);
      
      expect(session).toBeInstanceOf(TestSession);
      expect(session.id).toBe('session-001');
      expect(session.projectId).toBe('proj-001');
    });

    it('should create TestReport from manifest file data', () => {
      const manifestData = {
        id: 'report-001',
        projectId: 'proj-001',
        title: 'Login Feature Test Report',
        summary: 'Comprehensive report on login feature testing.',
      };

      const report = TestReport.fromManifest(manifestData);
      
      expect(report).toBeInstanceOf(TestReport);
      expect(report.id).toBe('report-001');
      expect(report.projectId).toBe('proj-001');
    });
  });

  describe('Model Validation Edge Cases', () => {
    it('should handle Project with empty area hierarchy', () => {
      const projectData = {
        id: 'proj-001',
        name: 'My Test Project',
        startDate: '2025-01-01',
        areaHierarchy: {},
      };

      const project = new Project(projectData);
      
      expect(project.isValid()).toBe(true);
      expect(project.areaHierarchy).toEqual({});
    });

    it('should handle TestStrategy with empty arrays', () => {
      const strategyData = {
        id: 'strategy-001',
        projectId: 'proj-001',
        name: 'Overall Testing Strategy',
        description: 'Strategy for comprehensive testing of the project.',
        objectives: [],
        risks: [],
        dependencies: [],
      };

      const strategy = new TestStrategy(strategyData);
      
      expect(strategy.isValid()).toBe(true);
      expect(strategy.objectives).toEqual([]);
      expect(strategy.risks).toEqual([]);
      expect(strategy.dependencies).toEqual([]);
    });

    it('should handle TestReport with empty findings array', () => {
      const reportData = {
        id: 'report-001',
        projectId: 'proj-001',
        title: 'Login Feature Test Report',
        summary: 'Comprehensive report on login feature testing.',
        findings: [],
      };

      const report = new TestReport(reportData);
      
      expect(report.isValid()).toBe(true);
      expect(report.findings).toEqual([]);
    });

    it('should handle models with null optional fields', () => {
      const projectData = {
        id: 'proj-001',
        name: 'My Test Project',
        startDate: '2025-01-01',
        areaHierarchy: { 'Feature A': { 'Sub-Feature A1': ['Component 1'] } },
        description: null,
        endDate: null,
        status: null,
      };

      const project = new Project(projectData);
      
      expect(project.isValid()).toBe(true);
      expect(project.description).toBeNull();
      expect(project.endDate).toBeNull();
      expect(project.status).toBeNull();
    });
  });
});
