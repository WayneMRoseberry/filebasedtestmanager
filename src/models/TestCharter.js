const BaseModel = require('./BaseModel');

/**
 * TestCharter data model for test charter manifests
 */
class TestCharter extends BaseModel {
  constructor(data = {}) {
    super(data, 'test-charter');
    
    // Set up property accessors for convenience
    this._setupPropertyAccessors();
  }

  /**
   * Set up property accessors for direct property access
   */
  _setupPropertyAccessors() {
    const properties = [
      'id', 'projectId', 'testPlanId', 'name', 'mission', 'tester', 
      'date', 'timebox', 'scope', 'status', 'documentReferences', 'metadata'
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
   * Get charter name
   * @returns {string} Charter name
   */
  getName() {
    return this.get('name');
  }

  /**
   * Set charter name
   * @param {string} name - Charter name
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
   * Get test plan ID
   * @returns {string|null} Test plan ID or null
   */
  getTestPlanId() {
    return this.get('testPlanId');
  }

  /**
   * Set test plan ID
   * @param {string} testPlanId - Test plan ID
   */
  setTestPlanId(testPlanId) {
    this.set('testPlanId', testPlanId);
  }

  /**
   * Get charter mission
   * @returns {string} Charter mission
   */
  getMission() {
    return this.get('mission');
  }

  /**
   * Set charter mission
   * @param {string} mission - Charter mission
   */
  setMission(mission) {
    this.set('mission', mission);
  }

  /**
   * Get tester name
   * @returns {string|null} Tester name or null
   */
  getTester() {
    return this.get('tester');
  }

  /**
   * Set tester name
   * @param {string} tester - Tester name
   */
  setTester(tester) {
    this.set('tester', tester);
  }

  /**
   * Get charter date
   * @returns {string|null} Charter date in YYYY-MM-DD format or null
   */
  getDate() {
    return this.get('date');
  }

  /**
   * Set charter date
   * @param {string} date - Charter date in YYYY-MM-DD format
   */
  setDate(date) {
    this.set('date', date);
  }

  /**
   * Get timebox duration
   * @returns {number|null} Timebox duration in minutes or null
   */
  getTimebox() {
    return this.get('timebox');
  }

  /**
   * Set timebox duration
   * @param {number} timebox - Timebox duration in minutes
   */
  setTimebox(timebox) {
    this.set('timebox', timebox);
  }

  /**
   * Get charter scope
   * @returns {string|null} Charter scope or null
   */
  getScope() {
    return this.get('scope');
  }

  /**
   * Set charter scope
   * @param {string} scope - Charter scope
   */
  setScope(scope) {
    this.set('scope', scope);
  }

  /**
   * Get charter status
   * @returns {string|null} Charter status or null
   */
  getStatus() {
    return this.get('status');
  }

  /**
   * Set charter status
   * @param {string} status - Charter status (draft, in-progress, completed, on-hold, cancelled)
   */
  setStatus(status) {
    this.set('status', status);
  }

  /**
   * Get document references
   * @returns {Array} Array of document reference URLs
   */
  getDocumentReferences() {
    return this.get('documentReferences') || [];
  }

  /**
   * Add a document reference
   * @param {string} url - Document reference URL
   */
  addDocumentReference(url) {
    const references = this.getDocumentReferences();
    if (!references.includes(url)) {
      references.push(url);
      this.set('documentReferences', references);
    }
  }

  /**
   * Remove a document reference
   * @param {string} url - Document reference URL to remove
   */
  removeDocumentReference(url) {
    const references = this.getDocumentReferences();
    const index = references.indexOf(url);
    if (index > -1) {
      references.splice(index, 1);
      this.set('documentReferences', references);
    }
  }

  /**
   * Get charter metadata
   * @returns {Object} Metadata object
   */
  getMetadata() {
    return this.get('metadata') || {};
  }

  /**
   * Set charter metadata
   * @param {Object} metadata - Metadata object
   */
  setMetadata(metadata) {
    this.set('metadata', metadata);
  }

  /**
   * Check if charter is draft
   * @returns {boolean} True if charter status is 'draft'
   */
  isDraft() {
    return this.getStatus() === 'draft';
  }

  /**
   * Check if charter is in progress
   * @returns {boolean} True if charter status is 'in-progress'
   */
  isInProgress() {
    return this.getStatus() === 'in-progress';
  }

  /**
   * Check if charter is completed
   * @returns {boolean} True if charter status is 'completed'
   */
  isCompleted() {
    return this.getStatus() === 'completed';
  }

  /**
   * Check if charter is on hold
   * @returns {boolean} True if charter status is 'on-hold'
   */
  isOnHold() {
    return this.getStatus() === 'on-hold';
  }

  /**
   * Check if charter is cancelled
   * @returns {boolean} True if charter status is 'cancelled'
   */
  isCancelled() {
    return this.getStatus() === 'cancelled';
  }

  /**
   * Check if charter is active (in-progress or completed)
   * @returns {boolean} True if charter is active
   */
  isActive() {
    return this.isInProgress() || this.isCompleted();
  }

  /**
   * Get timebox in hours
   * @returns {number|null} Timebox duration in hours or null
   */
  getTimeboxInHours() {
    const timebox = this.getTimebox();
    return timebox ? timebox / 60 : null;
  }

  /**
   * Set timebox in hours
   * @param {number} hours - Timebox duration in hours
   */
  setTimeboxInHours(hours) {
    this.setTimebox(hours * 60);
  }

  /**
   * Check if charter has timebox
   * @returns {boolean} True if charter has timebox set
   */
  hasTimebox() {
    return this.getTimebox() !== null && this.getTimebox() > 0;
  }

  /**
   * Check if charter has tester assigned
   * @returns {boolean} True if charter has tester assigned
   */
  hasTester() {
    return !!this.getTester();
  }

  /**
   * Check if charter has scope defined
   * @returns {boolean} True if charter has scope defined
   */
  hasScope() {
    return !!this.getScope();
  }

  /**
   * Check if charter has document references
   * @returns {boolean} True if charter has document references
   */
  hasDocumentReferences() {
    return this.getDocumentReferences().length > 0;
  }

  /**
   * Get charter summary for display
   * @returns {Object} Charter summary
   */
  getDisplaySummary() {
    return {
      id: this.getId(),
      name: this.getName(),
      projectId: this.getProjectId(),
      testPlanId: this.getTestPlanId(),
      mission: this.getMission(),
      tester: this.getTester(),
      date: this.getDate(),
      timebox: this.getTimebox(),
      timeboxHours: this.getTimeboxInHours(),
      scope: this.getScope(),
      status: this.getStatus(),
      documentReferenceCount: this.getDocumentReferences().length,
      isActive: this.isActive(),
      hasTimebox: this.hasTimebox(),
      hasTester: this.hasTester(),
      hasScope: this.hasScope(),
      isValid: this.isValid(),
    };
  }

  /**
   * Check if charter is ready for execution
   * @returns {boolean} True if charter has all required elements for execution
   */
  isReadyForExecution() {
    return this.hasTester() && 
           this.hasTimebox() && 
           this.hasScope() && 
           this.getMission();
  }

  /**
   * Get missing elements for execution
   * @returns {Array} Array of missing element names
   */
  getMissingExecutionElements() {
    const missing = [];
    
    if (!this.hasTester()) {
      missing.push('tester');
    }
    
    if (!this.hasTimebox()) {
      missing.push('timebox');
    }
    
    if (!this.hasScope()) {
      missing.push('scope');
    }
    
    if (!this.getMission()) {
      missing.push('mission');
    }
    
    return missing;
  }
}

module.exports = TestCharter;
