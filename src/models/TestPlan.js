const BaseModel = require('./BaseModel');

/**
 * TestPlan data model for test plan manifests
 */
class TestPlan extends BaseModel {
  constructor(data = {}) {
    super(data, 'test-plan');
    
    // Set up property accessors for convenience
    this._setupPropertyAccessors();
  }

  /**
   * Set up property accessors for direct property access
   */
  _setupPropertyAccessors() {
    const properties = [
      'id', 'projectId', 'strategyId', 'name', 'description', 'testLevel', 
      'environment', 'startDate', 'endDate', 'effortEstimation', 'status', 
      'version', 'metadata'
    ];

    properties.forEach(prop => {
      Object.defineProperty(this, prop, {
        get() {
          return this.get(prop);
        },
        set(value) {
          this.set(prop, value);
        },
        enumerable: true,
        configurable: true,
      });
    });
  }

  /**
   * Get plan name
   * @returns {string} Plan name
   */
  getName() {
    return this.get('name');
  }

  /**
   * Set plan name
   * @param {string} name - Plan name
   */
  setName(name) {
    this.set('name', name);
  }

  /**
   * Get project ID
   * @returns {string} Project ID
   */
  getProjectId() {
    return this.get('projectId');
  }

  /**
   * Set project ID
   * @param {string} projectId - Project ID
   */
  setProjectId(projectId) {
    this.set('projectId', projectId);
  }

  /**
   * Get strategy ID
   * @returns {string|null} Strategy ID or null
   */
  getStrategyId() {
    return this.get('strategyId');
  }

  /**
   * Set strategy ID
   * @param {string} strategyId - Strategy ID
   */
  setStrategyId(strategyId) {
    this.set('strategyId', strategyId);
  }

  /**
   * Get plan description
   * @returns {string} Plan description
   */
  getDescription() {
    return this.get('description');
  }

  /**
   * Set plan description
   * @param {string} description - Plan description
   */
  setDescription(description) {
    this.set('description', description);
  }

  /**
   * Get test level
   * @returns {string} Test level
   */
  getTestLevel() {
    return this.get('testLevel');
  }

  /**
   * Set test level
   * @param {string} testLevel - Test level (Unit, Integration, System, Acceptance, Performance, Security, Usability)
   */
  setTestLevel(testLevel) {
    this.set('testLevel', testLevel);
  }

  /**
   * Get testing environment
   * @returns {string|null} Testing environment or null
   */
  getEnvironment() {
    return this.get('environment');
  }

  /**
   * Set testing environment
   * @param {string} environment - Testing environment
   */
  setEnvironment(environment) {
    this.set('environment', environment);
  }

  /**
   * Get plan start date
   * @returns {string|null} Start date in YYYY-MM-DD format or null
   */
  getStartDate() {
    return this.get('startDate');
  }

  /**
   * Set plan start date
   * @param {string} startDate - Start date in YYYY-MM-DD format
   */
  setStartDate(startDate) {
    this.set('startDate', startDate);
  }

  /**
   * Get plan end date
   * @returns {string|null} End date in YYYY-MM-DD format or null
   */
  getEndDate() {
    return this.get('endDate');
  }

  /**
   * Set plan end date
   * @param {string} endDate - End date in YYYY-MM-DD format
   */
  setEndDate(endDate) {
    this.set('endDate', endDate);
  }

  /**
   * Get effort estimation
   * @returns {Object|null} Effort estimation object or null
   */
  getEffortEstimation() {
    return this.get('effortEstimation');
  }

  /**
   * Set effort estimation
   * @param {Object} effortEstimation - Effort estimation object with hours and/or days
   */
  setEffortEstimation(effortEstimation) {
    this.set('effortEstimation', effortEstimation);
  }

  /**
   * Get estimated hours
   * @returns {number|null} Estimated hours or null
   */
  getEstimatedHours() {
    const estimation = this.getEffortEstimation();
    return estimation ? estimation.hours : null;
  }

  /**
   * Set estimated hours
   * @param {number} hours - Estimated hours
   */
  setEstimatedHours(hours) {
    const estimation = this.getEffortEstimation() || {};
    estimation.hours = hours;
    this.setEffortEstimation(estimation);
  }

  /**
   * Get estimated days
   * @returns {number|null} Estimated days or null
   */
  getEstimatedDays() {
    const estimation = this.getEffortEstimation();
    return estimation ? estimation.days : null;
  }

  /**
   * Set estimated days
   * @param {number} days - Estimated days
   */
  setEstimatedDays(days) {
    const estimation = this.getEffortEstimation() || {};
    estimation.days = days;
    this.setEffortEstimation(estimation);
  }

  /**
   * Get plan status
   * @returns {string|null} Plan status or null
   */
  getStatus() {
    return this.get('status');
  }

  /**
   * Set plan status
   * @param {string} status - Plan status (draft, in-progress, completed, on-hold, cancelled)
   */
  setStatus(status) {
    this.set('status', status);
  }

  /**
   * Get plan version
   * @returns {string|null} Plan version or null
   */
  getVersion() {
    return this.get('version');
  }

  /**
   * Set plan version
   * @param {string} version - Plan version (semver format)
   */
  setVersion(version) {
    this.set('version', version);
  }

  /**
   * Get plan metadata
   * @returns {Object} Metadata object
   */
  getMetadata() {
    return this.get('metadata') || {};
  }

  /**
   * Set plan metadata
   * @param {Object} metadata - Metadata object
   */
  setMetadata(metadata) {
    this.set('metadata', metadata);
  }

  /**
   * Check if plan is draft
   * @returns {boolean} True if plan status is 'draft'
   */
  isDraft() {
    return this.getStatus() === 'draft';
  }

  /**
   * Check if plan is in progress
   * @returns {boolean} True if plan status is 'in-progress'
   */
  isInProgress() {
    return this.getStatus() === 'in-progress';
  }

  /**
   * Check if plan is completed
   * @returns {boolean} True if plan status is 'completed'
   */
  isCompleted() {
    return this.getStatus() === 'completed';
  }

  /**
   * Check if plan is on hold
   * @returns {boolean} True if plan status is 'on-hold'
   */
  isOnHold() {
    return this.getStatus() === 'on-hold';
  }

  /**
   * Check if plan is cancelled
   * @returns {boolean} True if plan status is 'cancelled'
   */
  isCancelled() {
    return this.getStatus() === 'cancelled';
  }

  /**
   * Check if test level is unit testing
   * @returns {boolean} True if test level is 'Unit'
   */
  isUnitTesting() {
    return this.getTestLevel() === 'Unit';
  }

  /**
   * Check if test level is integration testing
   * @returns {boolean} True if test level is 'Integration'
   */
  isIntegrationTesting() {
    return this.getTestLevel() === 'Integration';
  }

  /**
   * Check if test level is system testing
   * @returns {boolean} True if test level is 'System'
   */
  isSystemTesting() {
    return this.getTestLevel() === 'System';
  }

  /**
   * Check if test level is acceptance testing
   * @returns {boolean} True if test level is 'Acceptance'
   */
  isAcceptanceTesting() {
    return this.getTestLevel() === 'Acceptance';
  }

  /**
   * Get plan duration in days (if both start and end dates are available)
   * @returns {number|null} Duration in days or null
   */
  getDurationInDays() {
    const startDate = this.getStartDate();
    const endDate = this.getEndDate();
    
    if (!startDate || !endDate) {
      return null;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if plan is currently active (between start and end dates)
   * @returns {boolean} True if plan is currently active
   */
  isCurrentlyActive() {
    const startDate = this.getStartDate();
    const endDate = this.getEndDate();
    
    if (!startDate) {
      return false;
    }

    const now = new Date();
    const start = new Date(startDate);
    
    if (start > now) {
      return false; // Plan hasn't started yet
    }

    if (!endDate) {
      return true; // Plan has no end date, so it's active
    }

    const end = new Date(endDate);
    return end >= now; // Plan is active if end date hasn't passed
  }

  /**
   * Get plan summary for display
   * @returns {Object} Plan summary
   */
  getDisplaySummary() {
    return {
      id: this.getId(),
      name: this.getName(),
      projectId: this.getProjectId(),
      strategyId: this.getStrategyId(),
      testLevel: this.getTestLevel(),
      status: this.getStatus(),
      version: this.getVersion(),
      environment: this.getEnvironment(),
      startDate: this.getStartDate(),
      endDate: this.getEndDate(),
      duration: this.getDurationInDays(),
      estimatedHours: this.getEstimatedHours(),
      estimatedDays: this.getEstimatedDays(),
      isActive: this.isCurrentlyActive(),
      isValid: this.isValid(),
    };
  }

  /**
   * Check if plan has scheduling information
   * @returns {boolean} True if plan has start date or end date
   */
  hasScheduling() {
    return !!(this.getStartDate() || this.getEndDate());
  }

  /**
   * Check if plan has effort estimation
   * @returns {boolean} True if plan has hours or days estimation
   */
  hasEffortEstimation() {
    const estimation = this.getEffortEstimation();
    return !!(estimation && (estimation.hours || estimation.days));
  }
}

module.exports = TestPlan;
