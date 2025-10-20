const BaseModel = require('./BaseModel');

/**
 * TestStrategy data model for test strategy manifests
 */
class TestStrategy extends BaseModel {
  constructor(data = {}) {
    super(data, 'test-strategy');
    
    // Set up property accessors for convenience
    this._setupPropertyAccessors();
  }

  /**
   * Set up property accessors for direct property access
   */
  _setupPropertyAccessors() {
    const properties = [
      'id', 'projectId', 'name', 'description', 'objectives', 'scope', 
      'approach', 'risks', 'dependencies', 'status', 'version', 'metadata'
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
   * Get strategy name
   * @returns {string} Strategy name
   */
  getName() {
    return this.get('name');
  }

  /**
   * Set strategy name
   * @param {string} name - Strategy name
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
   * Get strategy description
   * @returns {string} Strategy description
   */
  getDescription() {
    return this.get('description');
  }

  /**
   * Set strategy description
   * @param {string} description - Strategy description
   */
  setDescription(description) {
    this.set('description', description);
  }

  /**
   * Get strategy objectives
   * @returns {Array} Array of objectives
   */
  getObjectives() {
    return this.get('objectives') || [];
  }

  /**
   * Add an objective to the strategy
   * @param {string} objective - Objective to add
   */
  addObjective(objective) {
    const objectives = this.getObjectives();
    if (!objectives.includes(objective)) {
      objectives.push(objective);
      this.set('objectives', objectives);
    }
  }

  /**
   * Remove an objective from the strategy
   * @param {string} objective - Objective to remove
   */
  removeObjective(objective) {
    const objectives = this.getObjectives();
    const index = objectives.indexOf(objective);
    if (index > -1) {
      objectives.splice(index, 1);
      this.set('objectives', objectives);
    }
  }

  /**
   * Get strategy scope
   * @returns {string|null} Strategy scope or null
   */
  getScope() {
    return this.get('scope');
  }

  /**
   * Set strategy scope
   * @param {string} scope - Strategy scope
   */
  setScope(scope) {
    this.set('scope', scope);
  }

  /**
   * Get testing approach
   * @returns {string|null} Testing approach or null
   */
  getApproach() {
    return this.get('approach');
  }

  /**
   * Set testing approach
   * @param {string} approach - Testing approach
   */
  setApproach(approach) {
    this.set('approach', approach);
  }

  /**
   * Get strategy risks
   * @returns {Array} Array of risks
   */
  getRisks() {
    return this.get('risks') || [];
  }

  /**
   * Add a risk to the strategy
   * @param {string} risk - Risk to add
   */
  addRisk(risk) {
    const risks = this.getRisks();
    if (!risks.includes(risk)) {
      risks.push(risk);
      this.set('risks', risks);
    }
  }

  /**
   * Remove a risk from the strategy
   * @param {string} risk - Risk to remove
   */
  removeRisk(risk) {
    const risks = this.getRisks();
    const index = risks.indexOf(risk);
    if (index > -1) {
      risks.splice(index, 1);
      this.set('risks', risks);
    }
  }

  /**
   * Get strategy dependencies
   * @returns {Array} Array of dependencies
   */
  getDependencies() {
    return this.get('dependencies') || [];
  }

  /**
   * Add a dependency to the strategy
   * @param {string} dependency - Dependency to add
   */
  addDependency(dependency) {
    const dependencies = this.getDependencies();
    if (!dependencies.includes(dependency)) {
      dependencies.push(dependency);
      this.set('dependencies', dependencies);
    }
  }

  /**
   * Remove a dependency from the strategy
   * @param {string} dependency - Dependency to remove
   */
  removeDependency(dependency) {
    const dependencies = this.getDependencies();
    const index = dependencies.indexOf(dependency);
    if (index > -1) {
      dependencies.splice(index, 1);
      this.set('dependencies', dependencies);
    }
  }

  /**
   * Get strategy status
   * @returns {string|null} Strategy status or null
   */
  getStatus() {
    return this.get('status');
  }

  /**
   * Set strategy status
   * @param {string} status - Strategy status (draft, approved, in-review, deprecated)
   */
  setStatus(status) {
    this.set('status', status);
  }

  /**
   * Get strategy version
   * @returns {string|null} Strategy version or null
   */
  getVersion() {
    return this.get('version');
  }

  /**
   * Set strategy version
   * @param {string} version - Strategy version (semver format)
   */
  setVersion(version) {
    this.set('version', version);
  }

  /**
   * Get strategy metadata
   * @returns {Object} Metadata object
   */
  getMetadata() {
    return this.get('metadata') || {};
  }

  /**
   * Set strategy metadata
   * @param {Object} metadata - Metadata object
   */
  setMetadata(metadata) {
    this.set('metadata', metadata);
  }

  /**
   * Check if strategy is draft
   * @returns {boolean} True if strategy status is 'draft'
   */
  isDraft() {
    return this.getStatus() === 'draft';
  }

  /**
   * Check if strategy is approved
   * @returns {boolean} True if strategy status is 'approved'
   */
  isApproved() {
    return this.getStatus() === 'approved';
  }

  /**
   * Check if strategy is in review
   * @returns {boolean} True if strategy status is 'in-review'
   */
  isInReview() {
    return this.getStatus() === 'in-review';
  }

  /**
   * Check if strategy is deprecated
   * @returns {boolean} True if strategy status is 'deprecated'
   */
  isDeprecated() {
    return this.getStatus() === 'deprecated';
  }

  /**
   * Get strategy summary for display
   * @returns {Object} Strategy summary
   */
  getDisplaySummary() {
    return {
      id: this.getId(),
      name: this.getName(),
      projectId: this.getProjectId(),
      status: this.getStatus(),
      version: this.getVersion(),
      objectiveCount: this.getObjectives().length,
      riskCount: this.getRisks().length,
      dependencyCount: this.getDependencies().length,
      scope: this.getScope(),
      approach: this.getApproach(),
      isValid: this.isValid(),
    };
  }

  /**
   * Check if strategy has all required elements
   * @returns {boolean} True if strategy has objectives, scope, and approach
   */
  hasRequiredElements() {
    return this.getObjectives().length > 0 && 
           this.getScope() && 
           this.getApproach();
  }

  /**
   * Get missing required elements
   * @returns {Array} Array of missing required element names
   */
  getMissingRequiredElements() {
    const missing = [];
    
    if (this.getObjectives().length === 0) {
      missing.push('objectives');
    }
    
    if (!this.getScope()) {
      missing.push('scope');
    }
    
    if (!this.getApproach()) {
      missing.push('approach');
    }
    
    return missing;
  }
}

module.exports = TestStrategy;
