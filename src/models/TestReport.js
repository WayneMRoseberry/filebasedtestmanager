const BaseModel = require('./BaseModel');

/**
 * TestReport data model for test report manifests
 */
class TestReport extends BaseModel {
  constructor(data = {}) {
    super(data, 'test-report');
    
    // Set up property accessors for convenience
    this._setupPropertyAccessors();
  }

  /**
   * Set up property accessors for direct property access
   */
  _setupPropertyAccessors() {
    const properties = [
      'id', 'projectId', 'sessionId', 'title', 'summary', 'date', 
      'author', 'findings', 'metrics', 'status', 'metadata'
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
   * Get report title
   * @returns {string} Report title
   */
  getTitle() {
    return this.get('title');
  }

  /**
   * Set report title
   * @param {string} title - Report title
   */
  setTitle(title) {
    this.set('title', title);
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
   * Get session ID
   * @returns {string|null} Session ID or null
   */
  getSessionId() {
    return this.get('sessionId');
  }

  /**
   * Set session ID
   * @param {string} sessionId - Session ID
   */
  setSessionId(sessionId) {
    this.set('sessionId', sessionId);
  }

  /**
   * Get report summary
   * @returns {string} Report summary
   */
  getSummary() {
    return this.get('summary');
  }

  /**
   * Set report summary
   * @param {string} summary - Report summary
   */
  setSummary(summary) {
    this.set('summary', summary);
  }

  /**
   * Get report date
   * @returns {string|null} Report date in YYYY-MM-DD format or null
   */
  getDate() {
    return this.get('date');
  }

  /**
   * Set report date
   * @param {string} date - Report date in YYYY-MM-DD format
   */
  setDate(date) {
    this.set('date', date);
  }

  /**
   * Get report author
   * @returns {string|null} Report author or null
   */
  getAuthor() {
    return this.get('author');
  }

  /**
   * Set report author
   * @param {string} author - Report author
   */
  setAuthor(author) {
    this.set('author', author);
  }

  /**
   * Get report findings
   * @returns {Array} Array of findings
   */
  getFindings() {
    return this.get('findings') || [];
  }

  /**
   * Add a finding to the report
   * @param {Object} finding - Finding object with title, description, severity, status
   */
  addFinding(finding) {
    const findings = this.getFindings();
    findings.push(finding);
    this.set('findings', findings);
  }

  /**
   * Remove a finding from the report
   * @param {number} index - Index of finding to remove
   */
  removeFinding(index) {
    const findings = this.getFindings();
    if (index >= 0 && index < findings.length) {
      findings.splice(index, 1);
      this.set('findings', findings);
    }
  }

  /**
   * Get findings by severity
   * @param {string} severity - Severity level (low, medium, high, critical)
   * @returns {Array} Array of findings with specified severity
   */
  getFindingsBySeverity(severity) {
    return this.getFindings().filter(finding => finding.severity === severity);
  }

  /**
   * Get findings by status
   * @param {string} status - Finding status (open, closed, reopened, deferred)
   * @returns {Array} Array of findings with specified status
   */
  getFindingsByStatus(status) {
    return this.getFindings().filter(finding => finding.status === status);
  }

  /**
   * Get open findings
   * @returns {Array} Array of open findings
   */
  getOpenFindings() {
    return this.getFindingsByStatus('open');
  }

  /**
   * Get closed findings
   * @returns {Array} Array of closed findings
   */
  getClosedFindings() {
    return this.getFindingsByStatus('closed');
  }

  /**
   * Get critical findings
   * @returns {Array} Array of critical findings
   */
  getCriticalFindings() {
    return this.getFindingsBySeverity('critical');
  }

  /**
   * Get high severity findings
   * @returns {Array} Array of high severity findings
   */
  getHighSeverityFindings() {
    return this.getFindingsBySeverity('high');
  }

  /**
   * Get report metrics
   * @returns {Object|null} Report metrics object or null
   */
  getMetrics() {
    return this.get('metrics');
  }

  /**
   * Set report metrics
   * @param {Object} metrics - Metrics object
   */
  setMetrics(metrics) {
    this.set('metrics', metrics);
  }

  /**
   * Get test cases executed count
   * @returns {number|null} Test cases executed count or null
   */
  getTestCasesExecuted() {
    const metrics = this.getMetrics();
    return metrics ? metrics.testCasesExecuted : null;
  }

  /**
   * Set test cases executed count
   * @param {number} count - Test cases executed count
   */
  setTestCasesExecuted(count) {
    const metrics = this.getMetrics() || {};
    metrics.testCasesExecuted = count;
    this.setMetrics(metrics);
  }

  /**
   * Get defects found count
   * @returns {number|null} Defects found count or null
   */
  getDefectsFound() {
    const metrics = this.getMetrics();
    return metrics ? metrics.defectsFound : null;
  }

  /**
   * Set defects found count
   * @param {number} count - Defects found count
   */
  setDefectsFound(count) {
    const metrics = this.getMetrics() || {};
    metrics.defectsFound = count;
    this.setMetrics(metrics);
  }

  /**
   * Get time spent in hours
   * @returns {number|null} Time spent in hours or null
   */
  getTimeSpentHours() {
    const metrics = this.getMetrics();
    return metrics ? metrics.timeSpentHours : null;
  }

  /**
   * Set time spent in hours
   * @param {number} hours - Time spent in hours
   */
  setTimeSpentHours(hours) {
    const metrics = this.getMetrics() || {};
    metrics.timeSpentHours = hours;
    this.setMetrics(metrics);
  }

  /**
   * Get report status
   * @returns {string|null} Report status or null
   */
  getStatus() {
    return this.get('status');
  }

  /**
   * Set report status
   * @param {string} status - Report status (draft, final, archived)
   */
  setStatus(status) {
    this.set('status', status);
  }

  /**
   * Get report metadata
   * @returns {Object} Metadata object
   */
  getMetadata() {
    return this.get('metadata') || {};
  }

  /**
   * Set report metadata
   * @param {Object} metadata - Metadata object
   */
  setMetadata(metadata) {
    this.set('metadata', metadata);
  }

  /**
   * Check if report is draft
   * @returns {boolean} True if report status is 'draft'
   */
  isDraft() {
    return this.getStatus() === 'draft';
  }

  /**
   * Check if report is final
   * @returns {boolean} True if report status is 'final'
   */
  isFinal() {
    return this.getStatus() === 'final';
  }

  /**
   * Check if report is archived
   * @returns {boolean} True if report status is 'archived'
   */
  isArchived() {
    return this.getStatus() === 'archived';
  }

  /**
   * Check if report has findings
   * @returns {boolean} True if report has findings
   */
  hasFindings() {
    return this.getFindings().length > 0;
  }

  /**
   * Check if report has metrics
   * @returns {boolean} True if report has metrics
   */
  hasMetrics() {
    const metrics = this.getMetrics();
    return metrics && Object.keys(metrics).length > 0;
  }

  /**
   * Check if report has author
   * @returns {boolean} True if report has author
   */
  hasAuthor() {
    return !!this.getAuthor();
  }

  /**
   * Check if report has date
   * @returns {boolean} True if report has date
   */
  hasDate() {
    return !!this.getDate();
  }

  /**
   * Get total findings count
   * @returns {number} Total findings count
   */
  getTotalFindingsCount() {
    return this.getFindings().length;
  }

  /**
   * Get findings count by severity
   * @returns {Object} Object with severity counts
   */
  getFindingsCountBySeverity() {
    const findings = this.getFindings();
    const counts = { low: 0, medium: 0, high: 0, critical: 0 };
    
    findings.forEach(finding => {
      if (counts.hasOwnProperty(finding.severity)) {
        counts[finding.severity]++;
      }
    });
    
    return counts;
  }

  /**
   * Get findings count by status
   * @returns {Object} Object with status counts
   */
  getFindingsCountByStatus() {
    const findings = this.getFindings();
    const counts = { open: 0, closed: 0, reopened: 0, deferred: 0 };
    
    findings.forEach(finding => {
      if (counts.hasOwnProperty(finding.status)) {
        counts[finding.status]++;
      }
    });
    
    return counts;
  }

  /**
   * Get report summary for display
   * @returns {Object} Report summary
   */
  getDisplaySummary() {
    const findingsCount = this.getFindingsCountBySeverity();
    const statusCount = this.getFindingsCountByStatus();
    
    return {
      id: this.getId(),
      title: this.getTitle(),
      projectId: this.getProjectId(),
      sessionId: this.getSessionId(),
      author: this.getAuthor(),
      date: this.getDate(),
      status: this.getStatus(),
      totalFindings: this.getTotalFindingsCount(),
      findingsBySeverity: findingsCount,
      findingsByStatus: statusCount,
      openFindings: statusCount.open,
      criticalFindings: findingsCount.critical,
      testCasesExecuted: this.getTestCasesExecuted(),
      defectsFound: this.getDefectsFound(),
      timeSpentHours: this.getTimeSpentHours(),
      hasFindings: this.hasFindings(),
      hasMetrics: this.hasMetrics(),
      hasAuthor: this.hasAuthor(),
      hasDate: this.hasDate(),
      isValid: this.isValid(),
    };
  }

  /**
   * Check if report is complete
   * @returns {boolean} True if report has all essential elements
   */
  isComplete() {
    return this.hasAuthor() && 
           this.hasDate() && 
           this.getTitle() && 
           this.getSummary();
  }

  /**
   * Get missing elements for completion
   * @returns {Array} Array of missing element names
   */
  getMissingCompletionElements() {
    const missing = [];
    
    if (!this.hasAuthor()) {
      missing.push('author');
    }
    
    if (!this.hasDate()) {
      missing.push('date');
    }
    
    if (!this.getTitle()) {
      missing.push('title');
    }
    
    if (!this.getSummary()) {
      missing.push('summary');
    }
    
    return missing;
  }

  /**
   * Calculate pass rate based on metrics
   * @returns {number|null} Pass rate percentage or null
   */
  getPassRate() {
    const executed = this.getTestCasesExecuted();
    const defects = this.getDefectsFound();
    
    if (executed === null || executed === 0) {
      return null;
    }
    
    const passed = executed - (defects || 0);
    return Math.round((passed / executed) * 100);
  }

  /**
   * Get defect density (defects per test case)
   * @returns {number|null} Defect density or null
   */
  getDefectDensity() {
    const executed = this.getTestCasesExecuted();
    const defects = this.getDefectsFound();
    
    if (executed === null || executed === 0) {
      return null;
    }
    
    return (defects || 0) / executed;
  }
}

module.exports = TestReport;
